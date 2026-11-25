// AI工作资源管理台 · 数据层：经本地服务读写数据包（data.json）
const Store = {
  pkg: null,
  async load() {
    const r = await fetch('/api/data', { cache: 'no-store' });
    if (!r.ok) throw new Error('load failed');
    this.pkg = await r.json();
    return this.pkg;
  },
  async save() {
    const r = await fetch('/api/data', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.pkg),
    });
    if (!r.ok) throw new Error('save failed');
    return true;
  },
  async loadSeed() {
    const r = await fetch('/api/seed', { cache: 'no-store' });
    if (!r.ok) throw new Error('seed failed');
    return r.json();
  },
  // 凭据：明文只经 /api/secret 进服务端 secrets.json；这里拿到的是 {id:{kind,hint}} 掩码清单
  async loadSecrets() {
    const r = await fetch('/api/secrets', { cache: 'no-store' });
    if (!r.ok) throw new Error('secrets load failed');
    return r.json();
  },
  async secretOp(payload) {
    const r = await fetch('/api/secret', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error('secret op failed');
    return r.json();
  },
  // 测试连接：由服务端发起（本地/云端部署口径一致）
  async testConn(spec) {
    const r = await fetch('/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(spec),
    });
    if (!r.ok) throw new Error('test failed');
    return r.json();
  },
  // 检测远程地址：服务端 GET 对方 /api/health 并核对 instanceId 是不是本机
  async checkRemote(url) {
    const r = await fetch('/api/check-remote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    if (!r.ok) throw new Error('check failed');
    return r.json();
  },
  async health() {
    const r = await fetch('/api/health', { cache: 'no-store' });
    if (!r.ok) throw new Error('health failed');
    return r.json();
  },
};
window.Store = Store;
