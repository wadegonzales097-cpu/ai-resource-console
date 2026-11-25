# 数据契约 · CONTRACT-DATA（资源类型与凭据，第二轮起，第三轮扩类型＋独立接入页）

本文定义成员（资源）的**类型模板、类型专用字段、凭据存放、单个资源包格式与测试连接记录**。
数据包整体结构（zones/members/events/lines/settings）见 `CONTRACT-3D.md`，本文只补充成员部分。
字段增删先改本文再改代码。

## 1. 资源类型 `member.rtype`

| 值 | 名称 | 典型场景 |
|---|---|---|
| `ssh-server` | 远程服务器（SSH） | 云 VPS、独立服务器 |
| `local-device` | 本地设备 | 局域网主机、家里的 NAS/路由/小主机 |
| `ai-api` | AI API 资源 | 各家大模型 API（Key 调用） |
| `agent-platform` | 智能体平台 | 网页派活的智能体/自动化平台 |
| `gpu` | GPU 资源 | GPU 云笔记本、算力平台 |
| `database` | 数据库 | MySQL / PostgreSQL / Redis / MongoDB 等数据库服务 |
| `object-storage` | 对象存储 | S3 兼容对象存储（云厂商或自建） |
| `email-smtp` | 邮件服务（SMTP） | 发信用的 SMTP 服务 |
| `http-api` | 通用 HTTP 接口 | 任意 HTTP(S) 接口：状态页、Webhook、自家服务接口等 |
| `proxy-sub` | 代理订阅 | 代理节点订阅链接 |
| `other` | 其它 | 以上都不合适时的自由记录 |

**接入入口（第三轮）**：新资源的接入主路径是设置中心侧栏的「接入资源」向导页
（选类型 → 填该类型参数 → 测试连接 → 保存为资源）。成员管理表单保留类型选择与
测试按钮作次要入口，两处共用同一套字段定义（`TYPE_FIELDS`）与同一个测试接口
（`POST /api/test`），不得另起一套。

**向后兼容**：老数据包成员可以没有 `rtype`。打开时按以下顺序推断（`inferRtype`）：
显式 `rtype` 合法则用之；否则看 `access`/`platform` 文本——含 `ssh`（不分大小写）→ `ssh-server`；
含独立单词 `api` → `ai-api`；其余 → `other`。推断只决定表单打开时显示哪组字段，不回写数据；
用户保存时才把 `rtype` 落盘。未知字段一律保留，不得在保存时丢弃。

## 2. 通用字段（所有类型共有，沿用第一轮）

`id`（唯一，字母/数字/连字符/下划线）、`name`（头顶显示名）、`zone`、`tier`（gm/exec/staff）、
`reportsTo`、`status`（working/idle/sleepy/offline）、`task`、`since`、`detail`（简介）、`notes`（备注）。

## 3. 类型专用字段（平铺在成员对象上，字符串；不适用时可缺省或空串）

| 字段 | 适用类型 | 说明 |
|---|---|---|
| `host` | ssh-server / local-device | 主机名或 IP（局域网设备填内网地址） |
| `sshPort` | ssh-server / local-device | 端口，默认 22 |
| `username` | ssh-server / local-device | 登录用户名 |
| `authMethod` | ssh-server / local-device | `password`（密码）｜`key`（私钥） |
| `platform` | ssh-server（服务商）/ ai-api（服务名）/ agent-platform（平台名）/ gpu（平台）/ other | 复用第一轮字段 |
| `region` | ssh-server / other | 地区 |
| `specs` | ssh-server / other | 规格 |
| `expiresAt` | ssh-server / ai-api | 到期日，`YYYY-MM-DD` 文本 |
| `apiUrl` | ai-api | API 基础地址，如 `https://api.example.com/v1` |
| `models` | ai-api | 可用模型（自由文本，逗号分隔） |
| `quota` | ai-api / agent-platform / gpu | 额度说明（自由文本，如「每日 10,000 积分」） |
| `entryUrl` | agent-platform / gpu / other（可选） | 入口网址 |
| `accountId` | agent-platform / gpu | 账号标识（用户名/邮箱等，**不是**密码） |
| `dispatchVia` | agent-platform | 派活方式（网页聊天 / API / …） |
| `access` | gpu / other | 接入方式说明 |
| `role` | local-device（用途）/ other（职责） | 复用第一轮字段 |
| `dbEngine` | database | 引擎：`mysql`｜`postgresql`｜`redis`｜`mongodb` |
| `dbPort` | database | 端口（默认随引擎：3306 / 5432 / 6379 / 27017）；`host`/`username` 复用 |
| `dbName` | database | 库名 |
| `s3Endpoint` | object-storage | Endpoint 地址，如 `https://s3.example.com`；服务商复用 `platform` |
| `s3Region` | object-storage | 区域，如 `us-east-1` |
| `bucket` | object-storage | Bucket 名 |
| `smtpHost` | email-smtp | SMTP 主机 |
| `smtpPort` | email-smtp | 端口（465 / 587 / 25） |
| `smtpEncryption` | email-smtp | 加密：`ssl`｜`starttls`｜`none`；用户名复用 `username` |
| `fromAddress` | email-smtp | 发件地址 |
| `httpUrl` | http-api | 接口 URL |
| `httpMethod` | http-api | 方法：`GET`｜`HEAD`｜`POST` |
| `authType` | http-api | 鉴权：`none`（无）｜`bearer`（Bearer Token）｜`header`（自定义请求头） |
| `headerName` | http-api | `authType=header` 时的请求头名，如 `X-API-Key`；Token/头值走凭据 |
| `expectStatus` | http-api | 期望状态码（可选，文本）；空＝2xx/3xx 视为通 |
| `subUrl` | proxy-sub | 订阅地址 |
| `subProtocol` | proxy-sub | 协议备注（自由文本）；流量/到期说明复用 `quota` |
| `host` / `entryUrl` | other（可选） | 填了主机可做 TCP 测试、填了网址可做 HTTP 可达测试（见 §5） |

## 4. 凭据（密码 / API Key / 私钥）

- 明文**只**存程序目录的 `secrets.json`（已在 `.gitignore` 中，服务端写入后尽力 `chmod 600`）：
  ```jsonc
  { "<memberId>": { "kind": "password" | "key" | "apiKey", "value": "<明文>", "updatedAt": "…" } }
  ```
- `data.json` 与一切导出文件（整包、单个）**只存引用**：成员上的 `hasSecret: true/false`，
  表示「原机存有凭据」，不含任何凭据内容。导入到新机器后 `hasSecret` 仍在，但本机无凭据，
  表单会提示重新填入——这是预期行为，不是数据损坏。
- 对象存储的凭据是**一对**（Access Key＋Secret Key）：以 JSON 字符串
  `{"accessKey":"…","secretKey":"…"}` 存为该成员的 `value`、`kind` 为 `s3`；
  掩码 hint 按 `secretKey` 的末 4 位生成。测试时服务端按成员 ID 取出后拆用，
  导出仍只带 `hasSecret` 引用。
- 服务端接口：`GET /api/secrets` 只回 `{id: {kind, hint}}`（hint 为掩码＋末 4 位），绝不回明文；
  `POST /api/secret` 支持 `{id, kind, value}` 存、`{id, delete:true}` 删、
  `{renameFrom, renameTo}` 随成员改 ID 迁移、`{clearAll:true}` 清空
  （整包导入、恢复出厂、清空重来时前端会调 clearAll，保证凭据不与旧数据串味）。
- 演示种子（seed.json）**不得**出现任何真实样式的凭据值；示例地址用文档段
  （如 `203.0.113.x`、`api.example.com`）。

## 5. 测试连接 `member.lastTest`

「测试连接」由**服务端**发起（`POST /api/test`），本地电脑与云端服务器部署口径一致。
**全部 11 种类型都可测**，按类型映射到以下测试种类（`kind`）：

- `api`（ai-api，`{kind:"api", apiUrl, apiKey?, memberId?}`）：优先 GET `{apiUrl}/models`
  （OpenAI 风格），带 `Authorization: Bearer <key>`（key 取请求直传值，否则按 memberId 查
  secrets.json）；200 且返回模型列表＝通；401/403＝Key 被拒；其余按状态与错误原文报。
  `/models` 不通时回退试 `apiUrl` 本身。
- `ssh`（ssh-server / local-device，`{kind:"ssh", host, port}`）：`socket` 直连抓服务横幅，
  **只验 TCP 可达，不验登录**，结果文案须注明这一点。
- `http-entry`（agent-platform / gpu，`{kind:"http-entry", url}`）：对其入口网址发 GET，
  收到任何 HTTP 响应（含 401/403/404）即判入口可达，报实际状态码，
  文案注明**只验入口可达、不验登录**；网络层失败才判不通。
- `db`（database，`{kind:"db", engine, host, port}`）：TCP 连接＋协议问候——
  MySQL 读握手包（4 字节包头之后是协议版本号 0x0A）；Redis 发 `PING` 期待 `+PONG`；
  PostgreSQL / MongoDB 只验 TCP 连通，文案注明。端口缺省随引擎取默认值。
- `s3`（object-storage，`{kind:"s3", endpoint, region, bucket, accessKey?, secretKey?, memberId?}`）：
  服务端用标准库实现最小 AWS SigV4 签名，对 `{endpoint}/{bucket}?list-type=2&max-keys=1`
  发路径式 GET；200＝通（报读到的对象数）；403＝端点在但凭据被拒；
  404＝端点在但 Bucket 不存在。凭据取请求直传值，否则按 memberId 查 secrets.json（§4 的 JSON 对）。
- `smtp`（email-smtp，`{kind:"smtp", host, port, encryption}`）：TCP 连接
  （`encryption=ssl` 时立即 TLS 包裹）后读 `220` 问候并发送 `EHLO`，
  问候与 EHLO 应答正常＝通；`starttls` 只测 TLS 升级前的问候阶段，文案注明。
- `http-api`（http-api，`{kind:"http-api", url, method, authType, headerName?, token?, expectStatus?, memberId?}`）：
  按配置发请求（Token/头值取请求直传值，否则按 memberId 查凭据），
  报实际状态码与耗时；填了期望状态码则与之相等才算通，没填则 2xx/3xx 算通。
- `sub`（proxy-sub，`{kind:"sub", url}`）：GET 拉取订阅内容（必要时先整体 base64 解码），
  统计 `vmess/vless/trojan/ss/hysteria(hy2)` 链接条数，>0＝通并报条数；
  拉到内容但识别不出节点＝不通。
- `other`：填了 `host` → 按 `ssh` 做 TCP 测试；否则填了 `entryUrl` → 按 `http-entry` 测试；
  两样都没填时前端给出说明、不发请求。

返回 `{ok, ms, message}`。对已保存成员测试后，前端把结果存入成员的
`lastTest = {ts, ok, ms, message}`，并向 `events` 追加一条 `type:"note"` 事件
（`task`/`brief` 为「连接测试：通/不通（X ms）＋message」，`by:"console"`）。
接入向导里对未保存资源先测后存的，保存时把这次结果一并写入新成员的 `lastTest` 与事件。

## 6. 单个资源包（导入 / 导出）

```jsonc
{
  "format": "ai-resource-member",
  "version": 1,
  "exportedAt": "ISO 时间",
  "note": "不含凭据明文……（导出端固定写入，见 §4）",
  "member": { /* 一名成员的完整对象（可含 hasSecret 引用，不含凭据值） */ }
}
```

- 导入端也接受**裸成员对象**（直接是 `{id, name, ...}`）。
- 导入语义：**只新增、永不覆盖**。ID 撞车时自动追加 `-2`、`-3`…；`zone` 不存在时落到第一个
  区域；`reportsTo` 指向不存在成员时置空；`status`/`tier` 非法值时回落 `idle`/`staff`。
- 整包导入/导出（数据管理页）行为不变，仍是全量覆盖，且整包同样不含凭据明文。

## 7. 部署与远程访问（第三轮追加）

设置中心「部署与远程访问」一节（在「接入资源」之后、「成员管理」之前）：

- **部署设置**存数据包 `settings.deploy`（非敏感区，随整包导出走）：
  ```jsonc
  "deploy": {
    "mode": "local" | "lan" | "cloudflare" | "proxy" | "other",  // 部署方式
    "publicUrl": "",      // 对外访问地址（完整 URL）；种子给空示例待填
    "tunnelName": ""      // Cloudflare 隧道名称（可选）
  }
  ```
- **隧道令牌是凭据**：不进 `settings`，按 §4 口径存本机 `secrets.json`，
  固定键 `deploy:tunnel`、`kind` 为 `tunnelToken`；界面只显掩码，导出不带明文。
- **`GET /api/health`**：回 `{ok, app:"ai-resource-console", version, instanceId, port}`。
  `instanceId` 是本实例标识，首次启动时生成、存程序目录 `instance.json`（已 gitignore），
  重启不变、每份部署各不相同；`port` 为本实例实际监听端口。
- **`POST /api/check-remote {url}`**（「检测远程地址」）：服务端 GET `{url}/api/health`，
  返回 `{ok, ms, message}`——返回的 `instanceId` 与本机一致才算通；
  不一致、对方无 instanceId、非 200、连不上，四种情况分别给明确文案。
- **「生成通道配置」是纯文本生成**：按对外地址的域名＋本机实际监听端口拼
  cloudflared `config.yml` 的 ingress 片段与常用命令，页面内可复制；
  程序不替用户执行任何外部命令，令牌在片段里只以占位符出现。
