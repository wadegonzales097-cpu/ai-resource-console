#!/usr/bin/env python3
# AI工作资源管理台 · 本地服务（零依赖，仅 Python 标准库）
# - 伺服 www/ 静态页面
# - GET  /api/data   读当前数据（data.json，不存在时由 seed.json 初始化）
# - PUT  /api/data   保存数据（写锁串行化＋唯一临时名＋原子替换；替换前把旧数据备份为 data.json.bak）
# - GET  /api/seed   读出厂种子数据
# - GET  /api/proxy?url=<http/https 地址>  服务端转发远程数据接口（绕过浏览器跨域限制，供「实时模式」用）
# - GET  /api/secrets  凭据清单（只回类型与掩码提示，绝不回明文）
# - POST /api/secret   存/删/改名/清空凭据（明文只进 secrets.json，不进 data.json 与导出包）
# - POST /api/test     测试连接（由服务端发起，本地/云端部署口径一致）：11 类全可测——api 验 Key、ssh 验 TCP＋横幅、http-entry 验入口可达、db 协议问候、s3 SigV4 列 Bucket、smtp 问候＋EHLO、http-api 报状态码、sub 拉订阅数节点（契约见 CONTRACT-DATA.md §5）
import base64, hashlib, hmac, json, os, re, shutil, socket, ssl, sys, tempfile, threading, time, urllib.request, urllib.error, uuid
from datetime import datetime, timezone
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# Windows 控制台代码页不一定是 UTF-8/GBK（如英文系统 cp1252），print 中文会抛
# UnicodeEncodeError 让服务在启动打印时直接崩。先把 stdio 重配为 UTF-8（写不出的
# 字符替换），保证任何代码页下不崩；日志文件也因此统一为 UTF-8。
for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

ROOT = os.path.dirname(os.path.abspath(__file__))
WWW = os.path.join(ROOT, 'www')
DATA = os.path.join(ROOT, 'data.json')
SEED = os.path.join(ROOT, 'seed.json')
SECRETS = os.path.join(ROOT, 'secrets.json')  # 凭据明文只存这里（已 gitignore），data.json/导出包只存 hasSecret 引用
APP_VERSION = '1.3.0'
INSTANCE_FILE = os.path.join(ROOT, 'instance.json')  # 本实例标识（已 gitignore）：/api/health 回它，「检测远程地址」靠它核对远端是不是这台程序
SERVER_PORT = [None]  # main() 绑定成功后写入实际监听端口

def load_instance_id():
    try:
        with open(INSTANCE_FILE, encoding='utf-8') as f:
            v = str(json.load(f).get('instanceId') or '')
        if v:
            return v
    except Exception:
        pass
    v = uuid.uuid4().hex
    try:
        with open(INSTANCE_FILE, 'w', encoding='utf-8') as f:
            json.dump({'instanceId': v}, f)
    except Exception:
        pass
    return v

INSTANCE_ID = load_instance_id()

def ensure_data():
    if not os.path.exists(DATA) and os.path.exists(SEED):
        shutil.copyfile(SEED, DATA)

WRITE_LOCK = threading.Lock()

def save_data(obj):
    # 全程持锁串行化并发保存；临时文件带随机后缀，避免多线程共用同一临时名互相拼花；
    # 写完 fsync 后原子替换；替换前把当前 data.json 备份为 data.json.bak 作恢复兜底。
    with WRITE_LOCK:
        fd, tmp = tempfile.mkstemp(dir=ROOT, prefix='data-', suffix='.tmp')
        try:
            with os.fdopen(fd, 'w', encoding='utf-8') as f:
                json.dump(obj, f, ensure_ascii=False, indent=1)
                f.flush()
                os.fsync(f.fileno())
            if os.path.exists(DATA):
                shutil.copyfile(DATA, DATA + '.bak')
            os.replace(tmp, DATA)
        except BaseException:
            try:
                os.unlink(tmp)
            except OSError:
                pass
            raise

SECRET_LOCK = threading.Lock()

def load_secrets():
    try:
        with open(SECRETS, encoding='utf-8') as f:
            obj = json.load(f)
        return obj if isinstance(obj, dict) else {}
    except Exception:
        return {}

def save_secrets(obj):
    with SECRET_LOCK:
        fd, tmp = tempfile.mkstemp(dir=ROOT, prefix='secrets-', suffix='.tmp')
        try:
            with os.fdopen(fd, 'w', encoding='utf-8') as f:
                json.dump(obj, f, ensure_ascii=False, indent=1)
                f.flush()
                os.fsync(f.fileno())
            os.replace(tmp, SECRETS)
        except BaseException:
            try:
                os.unlink(tmp)
            except OSError:
                pass
            raise
        try:
            os.chmod(SECRETS, 0o600)  # 权限收紧（POSIX 有效；Windows 上为尽力而为）
        except OSError:
            pass

def secret_hint(value):
    v = str(value or '')
    try:  # 对象存储凭据是 {"accessKey","secretKey"} 的 JSON 对：按 secretKey 生成掩码
        j = json.loads(v)
        if isinstance(j, dict) and 'secretKey' in j:
            v = str(j.get('secretKey') or '')
    except Exception:
        pass
    return '••••' + v[-4:] if len(v) > 4 else '••••'

def _short_err(e):
    r = getattr(e, 'reason', e)
    s = str(r)
    return s[:90] + ('…' if len(s) > 90 else '')

def test_api(api_url, api_key):
    """API 类测试：优先查 {base}/models（OpenAI 风格模型列表），验状态与 Key。"""
    t0 = time.time()
    url = str(api_url or '').strip()
    if not url:
        return {'ok': False, 'ms': 0, 'message': '未填 API 地址'}
    if '://' not in url:
        url = 'https://' + url
    base = url.rstrip('/')
    candidates = [base] if base.endswith('/models') else [base + '/models', base]
    last = ''
    for cand in candidates:
        try:
            headers = {'User-Agent': 'AIResourceConsole/1.0'}
            if api_key:
                headers['Authorization'] = 'Bearer ' + api_key
            req = urllib.request.Request(cand, headers=headers)
            with urllib.request.urlopen(req, timeout=8) as resp:
                body = resp.read(65536)
                ms = round((time.time() - t0) * 1000)
                try:
                    j = json.loads(body.decode('utf-8', 'replace'))
                    data = j.get('data') if isinstance(j, dict) else None
                    if isinstance(data, list):
                        return {'ok': True, 'ms': ms, 'message': f'连接通，Key 可用，读到 {len(data)} 个模型'}
                except Exception:
                    pass
                return {'ok': True, 'ms': ms, 'message': f'连接通（HTTP {resp.status}），服务端有响应'}
        except urllib.error.HTTPError as e:
            ms = round((time.time() - t0) * 1000)
            if e.code in (401, 403):
                return {'ok': False, 'ms': ms, 'message': f'服务器拒绝（HTTP {e.code}），多半是 Key 不对或无权限'}
            last = f'HTTP {e.code}'
            continue  # /models 404 等情况再试 base 本身
        except Exception as e:
            ms = round((time.time() - t0) * 1000)
            return {'ok': False, 'ms': ms, 'message': f'连接失败：{_short_err(e)}'}
    ms = round((time.time() - t0) * 1000)
    return {'ok': False, 'ms': ms, 'message': f'连接失败：{last or "未知错误"}'}

def test_ssh(host, port):
    """SSH/本地设备类测试：只验 TCP 可达＋抓服务横幅，不验登录。"""
    t0 = time.time()
    host = str(host or '').strip()
    try:
        port = int(port or 22)
    except Exception:
        port = 22
    if not host:
        return {'ok': False, 'ms': 0, 'message': '未填主机地址'}
    try:
        with socket.create_connection((host, port), timeout=6) as s:
            ms = round((time.time() - t0) * 1000)
            s.settimeout(2.5)
            banner = ''
            try:
                banner = s.recv(128).decode('utf-8', 'replace').strip()
            except Exception:
                pass
            msg = 'TCP 可达' + (f'，横幅：{banner[:60]}' if banner else '（无横幅）') + '；只验可达不验登录'
            return {'ok': True, 'ms': ms, 'message': msg}
    except Exception as e:
        ms = round((time.time() - t0) * 1000)
        return {'ok': False, 'ms': ms, 'message': f'不可达：{_short_err(e)}'}

def _norm_url(url):
    url = str(url or '').strip()
    if url and '://' not in url:
        url = 'https://' + url
    return url

def _http_fetch(req, timeout=8, readn=65536):
    """发请求并回 (status, body)；HTTP 错误码也算拿到了响应，回其状态码与响应体。"""
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, resp.read(readn)
    except urllib.error.HTTPError as e:
        try:
            return e.code, e.read(readn)
        except Exception:
            return e.code, b''

def test_http_entry(url):
    """智能体平台/GPU 入口可达测试：收到任何 HTTP 响应即判入口可达，只验可达不验登录。"""
    t0 = time.time()
    url = _norm_url(url)
    if not url:
        return {'ok': False, 'ms': 0, 'message': '未填入口网址'}
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'AIResourceConsole/1.0'})
        status, _ = _http_fetch(req, timeout=8, readn=4096)
        ms = round((time.time() - t0) * 1000)
        return {'ok': True, 'ms': ms, 'message': f'入口可达（HTTP {status}）；只验入口可达，不验登录'}
    except Exception as e:
        ms = round((time.time() - t0) * 1000)
        return {'ok': False, 'ms': ms, 'message': f'入口不可达：{_short_err(e)}'}

def test_http_api(b, token):
    """通用 HTTP 接口测试：按方法/鉴权发请求，报实际状态码；填了期望状态码须相等才算通。"""
    t0 = time.time()
    url = _norm_url(b.get('url'))
    if not url:
        return {'ok': False, 'ms': 0, 'message': '未填接口 URL'}
    method = str(b.get('method') or 'GET').upper()
    if method not in ('GET', 'HEAD', 'POST'):
        method = 'GET'
    headers = {'User-Agent': 'AIResourceConsole/1.0'}
    auth = str(b.get('authType') or 'none')
    if token:
        if auth == 'bearer':
            headers['Authorization'] = 'Bearer ' + token
        elif auth == 'header' and str(b.get('headerName') or '').strip():
            headers[str(b['headerName']).strip()] = token
    data = None
    if method == 'POST':
        data = b'{}'
        headers['Content-Type'] = 'application/json'
    try:
        req = urllib.request.Request(url, headers=headers, data=data, method=method)
        status, _ = _http_fetch(req, timeout=8, readn=4096)
        ms = round((time.time() - t0) * 1000)
        exp = str(b.get('expectStatus') or '').strip()
        if exp.isdigit():
            ok = status == int(exp)
            return {'ok': ok, 'ms': ms, 'message': f'实际状态码 HTTP {status}（期望 {exp}）' + ('' if ok else '，与期望不符')}
        ok = 200 <= status < 400
        return {'ok': ok, 'ms': ms, 'message': f'实际状态码 HTTP {status}' + ('' if ok else '（未填期望状态码时 2xx/3xx 才算通）')}
    except Exception as e:
        ms = round((time.time() - t0) * 1000)
        return {'ok': False, 'ms': ms, 'message': f'请求失败：{_short_err(e)}'}

DB_DEFAULT_PORTS = {'mysql': 3306, 'postgresql': 5432, 'redis': 6379, 'mongodb': 27017}

def test_db(engine, host, port):
    """数据库测试：TCP 连接＋协议问候。MySQL 读握手包、Redis 发 PING；PG/MongoDB 只验 TCP 连通。"""
    t0 = time.time()
    engine = str(engine or 'mysql').lower()
    if engine not in DB_DEFAULT_PORTS:
        engine = 'mysql'
    host = str(host or '').strip()
    try:
        port = int(port or 0) or DB_DEFAULT_PORTS[engine]
    except Exception:
        port = DB_DEFAULT_PORTS[engine]
    if not host:
        return {'ok': False, 'ms': 0, 'message': '未填主机地址'}
    try:
        with socket.create_connection((host, port), timeout=6) as s:
            ms = round((time.time() - t0) * 1000)
            s.settimeout(3)
            if engine in ('postgresql', 'mongodb'):
                return {'ok': True, 'ms': ms, 'message': f'TCP 已连通（{engine} 只验 TCP 连通，不发协议问候、不验登录）'}
            if engine == 'redis':
                try:
                    s.sendall(b'PING\r\n')
                    resp = s.recv(128).decode('utf-8', 'replace').strip()
                except Exception:
                    resp = ''
                if resp.startswith('+PONG'):
                    return {'ok': True, 'ms': ms, 'message': 'Redis 在线，PING 回 +PONG（未验密码）'}
                if resp.startswith('-') or resp.startswith('+'):
                    return {'ok': True, 'ms': ms, 'message': f'Redis 在线，协议有响应（{resp[:40]}）；如设了密码需另验'}
                return {'ok': False, 'ms': ms, 'message': 'TCP 已连通，但没读到 Redis 协议响应'}
            # mysql：服务端先发握手包——线上带 4 字节包头（3 字节长度＋1 字节序号），
            # 其后才是协议版本号 0x0A；无包头直接发 payload 的实现也兼容。
            try:
                data = s.recv(1024)
            except Exception:
                data = b''
            proto_at = -1
            if data:
                if data[0] == 0x0A:
                    proto_at = 0
                elif len(data) > 4 and data[4] == 0x0A:
                    proto_at = 4
            if proto_at >= 0:
                ver = data[proto_at + 1:].split(b'\x00')[0].decode('utf-8', 'replace')[:24]
                return {'ok': True, 'ms': ms, 'message': f'MySQL 握手正常（服务端版本 {ver or "未知"}）；只验协议问候，不验登录'}
            if data:
                return {'ok': False, 'ms': ms, 'message': 'TCP 已连通，但先导字节不是 MySQL 握手包，可能不是 MySQL 或端口被转发'}
            return {'ok': False, 'ms': ms, 'message': 'TCP 已连通，但没读到 MySQL 握手包'}
    except Exception as e:
        ms = round((time.time() - t0) * 1000)
        return {'ok': False, 'ms': ms, 'message': f'不可达：{_short_err(e)}'}

def test_s3(endpoint, region, bucket, access_key, secret_key):
    """对象存储测试：stdlib 最小 SigV4 签名，路径式 GET Bucket（list-type=2&max-keys=1）。"""
    t0 = time.time()
    endpoint = _norm_url(endpoint).rstrip('/')
    bucket = str(bucket or '').strip()
    region = str(region or '').strip() or 'us-east-1'
    if not endpoint:
        return {'ok': False, 'ms': 0, 'message': '未填 Endpoint'}
    if not bucket:
        return {'ok': False, 'ms': 0, 'message': '未填 Bucket'}
    if not access_key or not secret_key:
        return {'ok': False, 'ms': 0, 'message': '未填 Access Key / Secret Key（本机也没存）'}
    p = urlparse(endpoint)
    host = p.netloc
    path = '/' + bucket
    query = 'list-type=2&max-keys=1'
    now = datetime.now(timezone.utc)
    amz_date = now.strftime('%Y%m%dT%H%M%SZ')
    date_stamp = now.strftime('%Y%m%d')
    payload_hash = hashlib.sha256(b'').hexdigest()
    headers = {'host': host, 'x-amz-content-sha256': payload_hash, 'x-amz-date': amz_date}
    signed = ';'.join(sorted(headers))
    canon = '\n'.join(['GET', path, query, ''.join(f'{k}:{headers[k]}\n' for k in sorted(headers)), signed, payload_hash])
    scope = f'{date_stamp}/{region}/s3/aws4_request'
    to_sign = '\n'.join(['AWS4-HMAC-SHA256', amz_date, scope, hashlib.sha256(canon.encode()).hexdigest()])
    def _hmac(key, msg):
        return hmac.new(key, msg.encode(), hashlib.sha256).digest()
    k_sign = _hmac(_hmac(_hmac(_hmac(('AWS4' + secret_key).encode(), date_stamp), region), 's3'), 'aws4_request')
    sig = hmac.new(k_sign, to_sign.encode(), hashlib.sha256).hexdigest()
    url = f'{endpoint}{path}?{query}'
    try:
        req = urllib.request.Request(url, headers={
            'Authorization': f'AWS4-HMAC-SHA256 Credential={access_key}/{scope}, SignedHeaders={signed}, Signature={sig}',
            'x-amz-date': amz_date, 'x-amz-content-sha256': payload_hash,
            'User-Agent': 'AIResourceConsole/1.0'})
        status, body = _http_fetch(req, timeout=8)
        ms = round((time.time() - t0) * 1000)
        if status == 200:
            n = body.count(b'<Key>')
            return {'ok': True, 'ms': ms, 'message': f'通，凭据可用，列出 Bucket 成功（读到 {n} 个对象）'}
        if status == 403:
            return {'ok': False, 'ms': ms, 'message': '端点在，但凭据被拒（HTTP 403）'}
        if status == 404:
            return {'ok': False, 'ms': ms, 'message': '端点在，但 Bucket 不存在（HTTP 404）'}
        return {'ok': False, 'ms': ms, 'message': f'端点有响应但状态异常（HTTP {status}）'}
    except Exception as e:
        ms = round((time.time() - t0) * 1000)
        return {'ok': False, 'ms': ms, 'message': f'连接失败：{_short_err(e)}'}

def test_smtp(host, port, encryption):
    """邮件 SMTP 测试：TCP（ssl 时立即 TLS 包裹）读 220 问候＋EHLO 应答。"""
    t0 = time.time()
    host = str(host or '').strip()
    enc = str(encryption or 'starttls').lower()
    try:
        port = int(port or 0) or (465 if enc == 'ssl' else 587)
    except Exception:
        port = 587
    if not host:
        return {'ok': False, 'ms': 0, 'message': '未填 SMTP 主机'}
    try:
        raw = socket.create_connection((host, port), timeout=6)
        if enc == 'ssl':
            raw = ssl.create_default_context().wrap_socket(raw, server_hostname=host)
        with raw as s:
            ms = round((time.time() - t0) * 1000)
            s.settimeout(4)
            f = s.makefile('rb')
            greeting = f.readline(512).decode('utf-8', 'replace').strip()
            if not greeting.startswith('220'):
                return {'ok': False, 'ms': ms, 'message': f'连上了，但问候不是 220：{greeting[:60] or "（无问候）"}'}
            s.sendall(b'EHLO localhost\r\n')
            line = f.readline(512).decode('utf-8', 'replace').strip()
            while line[3:4] == '-':  # 多行 250-… 读到 250 空格为止
                line = f.readline(512).decode('utf-8', 'replace').strip()
            note = '；STARTTLS 只测升级前的问候阶段' if enc == 'starttls' else ''
            if line.startswith('250'):
                return {'ok': True, 'ms': ms, 'message': f'SMTP 在线，问候：{greeting[:50]}；EHLO 应答正常（只验服务在线，不验账号密码）{note}'}
            return {'ok': False, 'ms': ms, 'message': f'问候正常（{greeting[:40]}），但 EHLO 应答异常：{line[:50]}'}
    except Exception as e:
        ms = round((time.time() - t0) * 1000)
        return {'ok': False, 'ms': ms, 'message': f'不可达：{_short_err(e)}'}

_SUB_LINK_RE = re.compile(r'(?:vmess|vless|trojan|hysteria2|hy2|ss)://')

def test_sub(url):
    """代理订阅测试：GET 拉取内容（必要时整体 base64 解码），统计节点链接条数。"""
    t0 = time.time()
    url = _norm_url(url)
    if not url:
        return {'ok': False, 'ms': 0, 'message': '未填订阅地址'}
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'AIResourceConsole/1.0'})
        status, body = _http_fetch(req, timeout=10, readn=1048576)
        ms = round((time.time() - t0) * 1000)
        if status != 200:
            return {'ok': False, 'ms': ms, 'message': f'拉取失败（HTTP {status}）'}
        text = body.decode('utf-8', 'replace')
        n = len(_SUB_LINK_RE.findall(text))
        if n == 0:
            try:
                compact = re.sub(r'\s+', '', text)
                decoded = base64.b64decode(compact + '=' * (-len(compact) % 4)).decode('utf-8', 'replace')
                n = len(_SUB_LINK_RE.findall(decoded))
            except Exception:
                pass
        if n > 0:
            return {'ok': True, 'ms': ms, 'message': f'拉取成功，识别到 {n} 条节点'}
        return {'ok': False, 'ms': ms, 'message': '拉到了内容，但没识别出节点链接（可能不是订阅或格式特殊）'}
    except Exception as e:
        ms = round((time.time() - t0) * 1000)
        return {'ok': False, 'ms': ms, 'message': f'拉取失败：{_short_err(e)}'}

def check_remote(url):
    """检测远程地址：GET {url}/api/health，核对返回的 instanceId 与本机一致才算「通」。"""
    t0 = time.time()
    url = _norm_url(url)
    if not url:
        return {'ok': False, 'ms': 0, 'message': '未填对外访问地址'}
    target = url.rstrip('/') + '/api/health'
    try:
        req = urllib.request.Request(target, headers={'User-Agent': 'AIResourceConsole/1.0'})
        status, body = _http_fetch(req, timeout=10, readn=16384)
    except Exception as e:
        ms = round((time.time() - t0) * 1000)
        return {'ok': False, 'ms': ms, 'message': f'连不上这个地址：{_short_err(e)}'}
    ms = round((time.time() - t0) * 1000)
    if status != 200:
        return {'ok': False, 'ms': ms, 'message': f'地址有响应（HTTP {status}），但 /api/health 打不开——那头可能不是这个程序，或通道还没配好'}
    try:
        j = json.loads(body.decode('utf-8', 'replace'))
        rid = str(j.get('instanceId') or '')
    except Exception:
        rid = ''
    if not rid:
        return {'ok': False, 'ms': ms, 'message': '地址有响应，但没返回 instanceId——那头不是本程序（或版本太旧）'}
    if rid == INSTANCE_ID:
        return {'ok': True, 'ms': ms, 'message': '通：远程地址打开的正是这台程序（instanceId 一致）'}
    return {'ok': False, 'ms': ms, 'message': '地址能打开，但不是这台程序（instanceId 不一致）——多半填了另一份部署的地址'}

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=WWW, **kw)

    def log_message(self, fmt, *args):
        pass  # 安静运行

    def _json(self, code, obj):
        body = json.dumps(obj, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        u = urlparse(self.path)
        if u.path == '/api/health':
            return self._json(200, {'ok': True, 'app': 'ai-resource-console', 'version': APP_VERSION,
                                    'instanceId': INSTANCE_ID, 'port': SERVER_PORT[0]})
        if u.path == '/api/data':
            ensure_data()
            try:
                with open(DATA, encoding='utf-8') as f:
                    return self._json(200, json.load(f))
            except Exception as e:
                return self._json(500, {'error': f'data read failed: {e}'})
        if u.path == '/api/seed':
            try:
                with open(SEED, encoding='utf-8') as f:
                    return self._json(200, json.load(f))
            except Exception as e:
                return self._json(500, {'error': f'seed read failed: {e}'})
        if u.path == '/api/proxy':
            return self._proxy(u)
        if u.path == '/api/secrets':
            # 只回类型与掩码提示，绝不回明文
            out = {mid: {'kind': s.get('kind', ''), 'hint': secret_hint(s.get('value', ''))}
                   for mid, s in load_secrets().items() if isinstance(s, dict)}
            return self._json(200, out)
        return super().do_GET()

    def _proxy(self, u):
        qs = parse_qs(u.query)
        target = (qs.get('url') or [''])[0]
        p = urlparse(target)
        if p.scheme not in ('http', 'https') or not p.netloc:
            return self._json(400, {'error': 'bad url'})
        try:
            req = urllib.request.Request(target, headers={'User-Agent': 'AIResourceConsole/1.0'})
            with urllib.request.urlopen(req, timeout=12) as resp:
                body = resp.read()
                ctype = resp.headers.get('Content-Type') or 'application/octet-stream'
            self.send_response(200)
            self.send_header('Content-Type', ctype)
            self.send_header('Content-Length', str(len(body)))
            self.send_header('Cache-Control', 'no-store')
            self.end_headers()
            self.wfile.write(body)
        except Exception as e:
            return self._json(502, {'error': f'proxy failed: {e}'})

    def _read_body_json(self):
        n = int(self.headers.get('Content-Length') or 0)
        raw = self.rfile.read(n)
        return json.loads(raw.decode('utf-8'))

    def do_POST(self):
        u = urlparse(self.path)
        if u.path == '/api/secret':
            try:
                b = self._read_body_json()
                secrets = load_secrets()
                if b.get('clearAll'):
                    save_secrets({})
                    return self._json(200, {'ok': True})
                if b.get('renameFrom') and b.get('renameTo'):
                    old, new = str(b['renameFrom']), str(b['renameTo'])
                    if old in secrets:
                        secrets[new] = secrets.pop(old)
                        save_secrets(secrets)
                    return self._json(200, {'ok': True})
                mid = str(b.get('id') or '')
                if not mid:
                    return self._json(400, {'error': 'id required'})
                if b.get('delete'):
                    secrets.pop(mid, None)
                    save_secrets(secrets)
                    return self._json(200, {'ok': True})
                value = b.get('value')
                if not isinstance(value, str) or value == '':
                    return self._json(400, {'error': 'value required'})
                secrets[mid] = {'kind': str(b.get('kind') or 'password'), 'value': value,
                                'updatedAt': time.strftime('%Y-%m-%dT%H:%M:%S%z')}
                save_secrets(secrets)
                return self._json(200, {'ok': True, 'hint': secret_hint(value)})
            except Exception as e:
                return self._json(400, {'error': f'secret op failed: {e}'})
        if u.path == '/api/test':
            try:
                b = self._read_body_json()
                kind = b.get('kind')
                secrets = load_secrets()
                def saved_value():
                    s = secrets.get(str(b.get('memberId'))) or {}
                    return s.get('value') if isinstance(s, dict) else None
                if kind == 'api':
                    key = b.get('apiKey') or (saved_value() if b.get('memberId') else None)
                    return self._json(200, test_api(b.get('apiUrl'), key))
                if kind == 'ssh':
                    return self._json(200, test_ssh(b.get('host'), b.get('port')))
                if kind == 'http-entry':
                    return self._json(200, test_http_entry(b.get('url')))
                if kind == 'http-api':
                    token = b.get('token') or (saved_value() if b.get('memberId') else None)
                    return self._json(200, test_http_api(b, token))
                if kind == 'db':
                    return self._json(200, test_db(b.get('engine'), b.get('host'), b.get('port')))
                if kind == 's3':
                    ak, sk = b.get('accessKey'), b.get('secretKey')
                    if (not ak or not sk) and b.get('memberId'):
                        try:
                            pair = json.loads(saved_value() or '')
                            if isinstance(pair, dict):
                                ak = ak or pair.get('accessKey')
                                sk = sk or pair.get('secretKey')
                        except Exception:
                            pass
                    return self._json(200, test_s3(b.get('endpoint'), b.get('region'), b.get('bucket'), ak, sk))
                if kind == 'smtp':
                    return self._json(200, test_smtp(b.get('host'), b.get('port'), b.get('encryption')))
                if kind == 'sub':
                    return self._json(200, test_sub(b.get('url')))
                return self._json(400, {'error': 'unknown test kind'})
            except Exception as e:
                return self._json(400, {'error': f'test failed: {e}'})
        if u.path == '/api/check-remote':
            try:
                b = self._read_body_json()
                return self._json(200, check_remote(b.get('url')))
            except Exception as e:
                return self._json(400, {'error': f'check failed: {e}'})
        return self._json(404, {'error': 'not found'})

    def do_PUT(self):
        u = urlparse(self.path)
        if u.path != '/api/data':
            return self._json(404, {'error': 'not found'})
        try:
            n = int(self.headers.get('Content-Length') or 0)
            raw = self.rfile.read(n)
            obj = json.loads(raw.decode('utf-8'))
            if not isinstance(obj, dict) or not isinstance(obj.get('members'), list) or not isinstance(obj.get('zones'), list):
                return self._json(400, {'error': 'invalid data package: members/zones arrays required'})
            save_data(obj)
            return self._json(200, {'ok': True})
        except Exception as e:
            return self._json(400, {'error': f'save failed: {e}'})

def main():
    ensure_data()
    port = 8931
    srv = None
    for cand in range(8931, 8941):
        try:
            srv = ThreadingHTTPServer(('127.0.0.1', cand), Handler)
            port = cand
            break
        except OSError:
            continue
    if srv is None:
        print('无法绑定端口 8931-8940，请关闭占用程序后重试。')
        sys.exit(1)
    SERVER_PORT[0] = port
    url = f'http://127.0.0.1:{port}/'
    print(f'AI工作资源管理台已启动：{url}')
    print('保持这个窗口开着即可使用；关闭窗口或按 Ctrl+C 停止。')
    if '--no-browser' not in sys.argv:
        try:
            import webbrowser
            threading.Timer(0.6, lambda: webbrowser.open(url)).start()
        except Exception:
            pass
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        pass
    except SystemExit:
        raise
    except BaseException:
        # 启动/运行崩溃兜底：把 traceback 追加写到脚本同目录 server-log.txt，
        # 就算没经启动脚本启动，用户也能把这个日志发回来定位问题。
        import traceback
        tb = traceback.format_exc()
        try:
            with open(os.path.join(ROOT, 'server-log.txt'), 'a', encoding='utf-8') as f:
                f.write('\n===== server crashed =====\n')
                f.write(tb)
        except Exception:
            pass
        try:
            sys.stderr.write(tb)
        except Exception:
            pass
        sys.exit(1)
