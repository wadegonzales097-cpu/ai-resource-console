// AI工作资源管理台 · 管理台与设置中心逻辑
'use strict';
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const STATUS = {
  working: { zh: '工作中', en: 'Working', color: '#4ade80' },
  idle: { zh: '空闲', en: 'Idle', color: '#9aa3b2' },
  sleepy: { zh: '休眠', en: 'Sleeping', color: '#e0af68' },
  offline: { zh: '离线', en: 'Offline', color: '#525a66' },
};
const TIER = { gm: { zh: '总经理', en: 'GM' }, exec: { zh: '高管', en: 'Executive' }, staff: { zh: '员工', en: 'Staff' } };
const I18N = {
  zh: { navMain: '管理台', navOffice: '3D办公室', navOpen: '在浏览器中打开', navSettings: '设置',
    drawerHint: '点下方名单里的成员可看详细内容。', memberList: '成员名单',
    colStatus: '状态', colName: '名称', colTier: '层级', colTask: '当前任务 / 说明', colZone: '区域',
    secHelp: '上手说明', secGeneral: '通用与显示', secSource: '数据源', secMembers: '成员管理', secZones: '区域管理',
    secLayout: '布局示意图', secLines: '台词库', secData: '数据管理',
    remoteLock: '当前是实时模式（只读看数据）：成员、区域、布局、台词的编辑已锁定。要修改请到「数据源」切回本地模式。',
    helpTitle: '第一次使用？照这个顺序设，设完就能用',
    modeTitle: '两种数据模式',
    fAppName: '程序名称', fLang: '界面语言', fBubbles: '头顶说话气泡', fBubblesDesc: '监工互动时成员头顶冒的台词气泡',
    fNames: '头顶名称', fNamesDesc: '3D / 2D 里每个人头顶的名字',
    fMode: '模式', fStateUrl: '状态接口地址', fEventsUrl: '事件接口地址', btnTest: '测试连接',
    sourceDesc: '实时模式下，办公室与名单展示你填写的接口返回的实时状态与事件；接口断线时会自动回退展示本地数据并给出提示，不会白屏。成员的区域/层级归属仍按本地成员档案里同 id 的设置走，接口里多出的成员会落到第一个普通区域。编辑（成员/区域/布局/台词）只在本地模式可用。',
    fmtTitle: '接口格式说明', fPickMember: '选择成员', fPickZone: '选择区域',
    btnAdd: '新增成员', btnAddZone: '新增区域', btnDelete: '删除', btnSave: '保存成员', btnSaveZone: '保存区域', btnSaveLines: '保存台词',
    btnTestConn: '测试连接', credNote: '密码 / API Key / 私钥只保存在本机程序目录的 secrets.json 里，不进数据包与导出文件；导出与迁移时凭据不跟随，到新电脑需重新填入。',
    singleTitle: '单个资源导入 / 导出', btnExportOne: '导出当前成员', btnExportOne2: '导出单个 JSON', exportOneDesc: '只导出上面选中的这一个资源（不含凭据明文）',
    btnImportOne: '导入单个资源', importOneDesc: '只新增、不覆盖现有数据；ID 撞车时自动改名', importPaste: '粘贴导入', importPastePh: '把单个资源的 JSON 粘贴到这里', btnImportPaste: '粘贴导入',
    fRtype: '资源类型',
    secConnect: '接入资源', connectDesc: '按四步把一个新资源接进来：先选类型，再填它自己的参数，点「测试连接」当场验通，最后保存为资源。保存后去「成员管理」做日常管理。',
    secDeploy: '部署与远程访问', deployCfgTitle: '我的部署', fDeployMode: '部署方式', fPublicUrl: '对外访问地址', fTunnelName: '隧道名称（可选）', fTunnelToken: '隧道令牌（可选）',
    deployTokenNote: '令牌是凭据：只存本机 secrets.json，界面只显掩码，不进数据包与导出。', btnGenCfg: '生成通道配置', btnCheckRemote: '检测远程地址', btnCopy: '复制', btnSaveToken: '保存令牌', btnClear: '清除', genCfgLabel: '通道配置',
    wStep1: '第一步 · 选类型', wStep2: '第二步 · 填参数', wStep34: '第三步 · 测试连接 → 第四步 · 保存为资源', btnSaveResource: '保存为资源',
    zoneDesc: '区域大小（宽/深）与位置（中心 X/Z）也可以在「布局示意图」里直接拖。人数是容量参考：超员时办公室仍会自动排下，只是会提醒你拉大区域或加新区。',
    layoutDesc: '拖动区域方块改位置、拖右下角圆点改大小；把成员小块拖到另一个区域里即可换区。改动即时保存，办公室布局随之变化（办公室页会自动重载重排）。',
    linesDesc: '一行一句。赖床台词＝被叫醒的人说的；打工台词＝被催活的人说的；催促台词＝催活员说的。中英两套分别编辑，界面语言切到哪套就用哪套。',
    dExport: '导出数据包', btnExport: '导出 JSON', dExportDesc: '成员、区域、关系与全部设置都在里面，拷到另一台电脑导入即还原',
    dImport: '导入数据包', dImportDesc: '会覆盖当前全部数据，导入前建议先导出一份备份',
    dReset: '恢复出厂演示数据', btnReset: '恢复种子数据', dClear: '清空重来', btnClear: '清空全部成员与事件', dClearDesc: '只保留一个默认区域，从零开始搭',
    btnEditInSettings: '在设置中编辑', saved: '已保存', localMode: '本地模式', remoteMode: '实时模式',
    capacity: '容量', membersUnit: '人', over: '超员，建议拉大区域或新增区域' },
  en: { navMain: 'Console', navOffice: '3D Office', navOpen: 'Open in Browser', navSettings: 'Settings',
    drawerHint: 'Click a member below to see details.', memberList: 'Members',
    colStatus: 'Status', colName: 'Name', colTier: 'Tier', colTask: 'Task / Note', colZone: 'Zone',
    secHelp: 'Getting Started', secGeneral: 'General & Display', secSource: 'Data Source', secMembers: 'Members', secZones: 'Zones',
    secLayout: 'Layout Map', secLines: 'Lines Library', secData: 'Data',
    remoteLock: 'Live mode is read-only: member / zone / layout / lines editing is locked. Switch back to Local mode under Data Source to edit.',
    helpTitle: 'First time? Set these in order and you are ready',
    modeTitle: 'Two data modes',
    fAppName: 'App name', fLang: 'Language', fBubbles: 'Speech bubbles', fBubblesDesc: 'Lines bubbles shown during supervisor interactions',
    fNames: 'Name labels', fNamesDesc: 'Names above heads in 3D / 2D',
    fMode: 'Mode', fStateUrl: 'State endpoint URL', fEventsUrl: 'Events endpoint URL', btnTest: 'Test connection',
    sourceDesc: 'In Live mode the office and the list show live status and events from the endpoints you provide. If the endpoints are unreachable, the app falls back to local data with a notice — never a blank page. Zone/tier assignment still follows the local member profiles with the same id; unknown members land in the first regular zone. Editing is available in Local mode only.',
    fmtTitle: 'Endpoint format', fPickMember: 'Select member', fPickZone: 'Select zone',
    btnAdd: 'Add member', btnAddZone: 'Add zone', btnDelete: 'Delete', btnSave: 'Save member', btnSaveZone: 'Save zone', btnSaveLines: 'Save lines',
    btnTestConn: 'Test connection', credNote: 'Passwords / API keys / private keys live only in secrets.json in the program folder — never in data packages or exports. Credentials do not travel on export; re-enter them on the new computer.',
    singleTitle: 'Single resource import / export', btnExportOne: 'Export selected member', btnExportOne2: 'Export single JSON', exportOneDesc: 'Exports only the member selected above (no credential values)',
    btnImportOne: 'Import one resource', importOneDesc: 'Adds only — never overwrites; ID clashes are auto-renamed', importPaste: 'Paste import', importPastePh: 'Paste a single-resource JSON here', btnImportPaste: 'Import pasted',
    fRtype: 'Resource type',
    secConnect: 'Add a Resource', connectDesc: 'Connect a new resource in four steps: pick its type, fill in that type’s parameters, hit “Test connection” to verify it on the spot, then save it as a resource. Manage it day-to-day under Members afterwards.',
    secDeploy: 'Deployment & Remote Access', deployCfgTitle: 'My deployment', fDeployMode: 'Deployment', fPublicUrl: 'Public URL', fTunnelName: 'Tunnel name (optional)', fTunnelToken: 'Tunnel token (optional)',
    deployTokenNote: 'The token is a credential: it lives only in local secrets.json, the UI shows a mask, and it never enters data packages or exports.', btnGenCfg: 'Generate tunnel config', btnCheckRemote: 'Check remote URL', btnCopy: 'Copy', btnSaveToken: 'Save token', btnClear: 'Clear', genCfgLabel: 'Tunnel config',
    wStep1: 'Step 1 · Pick a type', wStep2: 'Step 2 · Fill in the parameters', wStep34: 'Step 3 · Test connection → Step 4 · Save as resource', btnSaveResource: 'Save as resource',
    zoneDesc: 'You can also drag zone size (w/d) and position (cx/cz) in the Layout Map. Capacity is a guideline: extra members are still placed automatically, with a hint to enlarge the zone or add a new one.',
    layoutDesc: 'Drag a zone block to move it, drag the corner dot to resize; drag a member chip into another zone to move the member. Changes save instantly and the office re-layouts itself.',
    linesDesc: 'One line per sentence. Wake lines = said by sleepers being woken; Work lines = said by people being urged; Urge lines = said by the supervisor. Edit both languages; the UI language picks which set is used.',
    dExport: 'Export data package', btnExport: 'Export JSON', dExportDesc: 'Members, zones, relations and all settings — import it on another computer to restore everything',
    dImport: 'Import data package', dImportDesc: 'Replaces ALL current data; export a backup first',
    dReset: 'Restore factory demo data', btnReset: 'Restore seed data', dClear: 'Start over', btnClear: 'Clear all members & events', dClearDesc: 'Keeps one default zone so you can rebuild from scratch',
    btnEditInSettings: 'Edit in Settings', saved: 'Saved', localMode: 'Local mode', remoteMode: 'Live mode',
    capacity: 'Capacity', membersUnit: 'members', over: 'over capacity — enlarge the zone or add a new one' },
};
let L = I18N.zh;
const lang = () => (Store.pkg?.settings?.lang === 'en' ? 'en' : 'zh');
const zoneName = (z) => (lang() === 'en' ? (z.nameEn || z.name) : z.name);
const memberById = (id) => Store.pkg.members.find((m) => m.id === id);
const zoneById = (id) => Store.pkg.zones.find((z) => z.id === id);

let toastTimer = null;
function toast(msg) {
  const t = $('toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 1600);
}
async function save(showToast = true) {
  await Store.save();
  if (showToast) toast(L.saved);
  renderModeBadge(); renderTable();
}

/* ---------- 顶部 ---------- */
function applyI18n() {
  L = I18N[lang()];
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const k = el.getAttribute('data-i18n');
    if (L[k]) el.textContent = L[k];
  });
  document.querySelectorAll('[data-i18n-ph]').forEach((el) => {
    const k = el.getAttribute('data-i18n-ph');
    if (L[k]) el.placeholder = L[k];
  });
  $('appTitle').textContent = Store.pkg.appName || 'AI Resource Console';
  document.title = Store.pkg.appName || 'AI Resource Console';
}
function renderModeBadge() {
  const remote = Store.pkg.settings.dataMode === 'remote';
  const b = $('modeBadge');
  b.textContent = remote ? L.remoteMode : L.localMode;
  b.classList.toggle('remote', remote);
  document.body.classList.toggle('remote', remote);
}
function showView(which) {
  $('viewMain').style.display = which === 'settings' ? 'none' : 'block';
  $('viewSettings').style.display = which === 'settings' ? 'block' : 'none';
  document.body.classList.toggle('office-full', which === 'office');
  $('btnMain').classList.toggle('on', which === 'main');
  $('btnOffice').classList.toggle('on', which === 'office');
  $('btnSettings').classList.toggle('on', which === 'settings');
}
$('btnMain').onclick = () => showView('main');
$('btnOffice').onclick = () => showView('office');
$('btnSettings').onclick = () => showView('settings');
$('btnOpen').onclick = () => window.open('office.html', '_blank');

/* ---------- 名单与详情 ---------- */
function renderTable() {
  const pkg = Store.pkg;
  const tb = $('memberTbody');
  let html = '';
  for (const z of pkg.zones) {
    const ms = pkg.members.filter((m) => m.zone === z.id);
    html += `<tr class="zoneHead"><td colspan="5">${esc(zoneName(z))} · ${ms.length}/${z.capacity || '∞'} ${L.membersUnit}${ms.length > (z.capacity || Infinity) ? ` · <span class="warn">${L.over}</span>` : ''}</td></tr>`;
    for (const m of ms) {
      const st = STATUS[m.status] || STATUS.idle;
      html += `<tr class="mrow" data-id="${esc(m.id)}"><td><span class="dot" style="background:${st.color}"></span>${st[lang()]}</td>
        <td><b>${esc(m.name)}</b></td><td><span class="badge">${(TIER[m.tier] || TIER.staff)[lang()]}</span> <span class="badge">${esc(RTYPES[inferRtype(m)][lang()])}</span></td>
        <td class="muted">${esc(m.status === 'working' ? (m.task || '') : (m.detail || ''))}</td>
        <td class="muted">${esc(zoneName(z))}</td></tr>`;
    }
  }
  const orphans = pkg.members.filter((m) => !zoneById(m.zone));
  for (const m of orphans) {
    const st = STATUS[m.status] || STATUS.idle;
    html += `<tr class="mrow" data-id="${esc(m.id)}"><td><span class="dot" style="background:${st.color}"></span>${st[lang()]}</td>
      <td><b>${esc(m.name)}</b></td><td><span class="badge">${(TIER[m.tier] || TIER.staff)[lang()]}</span> <span class="badge">${esc(RTYPES[inferRtype(m)][lang()])}</span></td>
      <td class="muted">${esc(m.detail || '')}</td><td class="muted">—</td></tr>`;
  }
  tb.innerHTML = html || '<tr><td colspan="5" class="muted">—</td></tr>';
  tb.querySelectorAll('tr.mrow').forEach((tr) => tr.addEventListener('click', () => openDrawer(tr.dataset.id)));
}
function openDrawer(id) {
  const m = memberById(id); if (!m) return;
  const z = zoneById(m.zone);
  const boss = m.reportsTo ? memberById(m.reportsTo) : null;
  const st = STATUS[m.status] || STATUS.idle;
  $('dName').textContent = m.name;
  $('dSub').textContent = `${z ? zoneName(z) : '—'} · ${(TIER[m.tier] || TIER.staff)[lang()]} · ${st[lang()]}`;
  const kv = (k, v) => v ? `<div class="kv"><b>${k}</b>${esc(v)}</div>` : '';
  const en = lang() === 'en';
  const credState = SecretsMap[m.id]
    ? (en ? `Stored on this machine (${SecretsMap[m.id].hint})` : `已存于本机（${SecretsMap[m.id].hint}）`)
    : (m.hasSecret ? (en ? 'Had one, not stored on this machine' : '原记录有凭据，本机未保存') : '');
  const lt = m.lastTest;
  const ltText = lt ? `${lt.ok ? (en ? 'OK' : '通') : (en ? 'Failed' : '不通')} · ${lt.ms} ms · ${lt.message} · ${String(lt.ts || '').replace('T', ' ').slice(0, 19)}` : '';
  $('dBody').innerHTML =
    kv(en ? 'Task' : '当前任务', m.task) +
    kv(en ? 'About' : '简介', m.detail) +
    kv(en ? 'Type' : '资源类型', RTYPES[inferRtype(m)][lang()]) +
    kv(en ? 'Host' : '主机', m.host ? (inferRtype(m) === 'database' ? m.host : `${m.host}:${m.sshPort || 22}`) : '') +
    kv(en ? 'DB engine' : '数据库引擎', m.dbEngine) +
    kv(en ? 'DB port' : '数据库端口', m.dbPort ? String(m.dbPort) : '') +
    kv(en ? 'Database' : '库名', m.dbName) +
    kv('Endpoint', m.s3Endpoint) +
    kv(en ? 'Storage region' : '存储区域', m.s3Region) +
    kv('Bucket', m.bucket) +
    kv('SMTP', m.smtpHost ? `${m.smtpHost}:${m.smtpPort || ''} ${m.smtpEncryption || ''}`.trim() : '') +
    kv(en ? 'From address' : '发件地址', m.fromAddress) +
    kv(en ? 'HTTP API' : 'HTTP 接口', m.httpUrl ? `${m.httpMethod || 'GET'} ${m.httpUrl}` : '') +
    kv(en ? 'Subscription' : '订阅地址', m.subUrl) +
    kv(en ? 'Protocols' : '协议备注', m.subProtocol) +
    kv(en ? 'Username' : '用户名', m.username) +
    kv(en ? 'Auth' : '验证方式', m.authMethod === 'key' ? (en ? 'Private key' : '密钥') : (m.authMethod === 'password' ? (en ? 'Password' : '密码') : '')) +
    kv('API ' + (en ? 'URL' : '地址'), m.apiUrl) +
    kv(en ? 'Models' : '可用模型', m.models) +
    kv(en ? 'Entry URL' : '入口网址', m.entryUrl) +
    kv(en ? 'Account' : '账号标识', m.accountId) +
    kv(en ? 'Dispatch via' : '派活方式', m.dispatchVia) +
    kv(en ? 'Quota' : '额度', m.quota) +
    kv(en ? 'Expires' : '到期日', m.expiresAt) +
    kv(en ? 'Credential' : '凭据', credState) +
    kv(en ? 'Last test' : '最近测试', ltText) +
    kv(en ? 'Role' : '职责', m.role) +
    kv(en ? 'Reports to' : '上级', boss ? boss.name : '') +
    kv(en ? 'Platform' : '平台', m.platform) +
    kv(en ? 'Region' : '地区', m.region) +
    kv(en ? 'Specs' : '规格', m.specs) +
    kv(en ? 'Access' : '接入方式', m.access) +
    kv(en ? 'Notes' : '备注', m.notes) +
    kv('ID', m.id);
  $('dEdit').onclick = () => { $('drawer').classList.remove('open'); showView('settings'); switchSec('members'); pickMember(id); };
  $('drawer').classList.add('open');
}
$('drawerClose').onclick = () => $('drawer').classList.remove('open');

/* ---------- 设置导航 ---------- */
function switchSec(name) {
  document.querySelectorAll('#setNav button').forEach((b) => b.classList.toggle('on', b.dataset.sec === name));
  document.querySelectorAll('.setSec').forEach((s) => { s.hidden = s.id !== 'sec-' + name; });
  if (name === 'layout') renderLayout();
  if (name === 'connect') renderWizardTypes();
  if (name === 'deploy') { renderDeployGuide(); renderLocalInfo(); }
}
document.querySelectorAll('#setNav button').forEach((b) => b.addEventListener('click', () => switchSec(b.dataset.sec)));

/* ---------- 帮助 ---------- */
function renderHelp() {
  const steps = lang() === 'en' ? [
    'Connect resources first: open “Add a Resource” and follow the four steps — pick a type (11 kinds: SSH server, local device, AI API, agent platform, GPU, database, object storage, SMTP mail, generic HTTP API, proxy subscription, other), fill in that type’s parameters, hit “Test connection” to verify it on the spot, then “Save as resource”.',
    'Then zones: under “Zones”, name your areas and set their capacity and size (or add new ones), and file each resource into a zone.',
    'Day-to-day management lives under “Members”: rename, move zones, change tier/status/task and edit type fields there. “Single resource import / export” is also under Members — credentials never travel with exports, so re-enter them on the new machine.',
    'Arrange the floor: in the “Layout Map”, drag zones and member chips until it looks right — the 3D office follows automatically.',
    'Display & lines: under “General & Display”, switch language, toggle speech bubbles and name labels; edit the lines library if you like.',
    'Data source: stay in Local mode for full editing, or fill in your own live endpoints to watch real-time status (read-only).',
    'Want it reachable from anywhere? Follow “Deployment & Remote Access”: pick a setup (an always-on home host + Cloudflare Tunnel is the easy one), fill in your public URL, and verify with “Check remote URL”. Anything public must get an access layer (Cloudflare Access or similar) — never expose it bare.',
    'Back up: under “Data”, export a data package. Copy the program folder to another computer, import the package, and everything is restored.',
  ] : [
    '先接入资源：到「接入资源」按向导走四步——选类型（共 11 类：远程服务器、本地设备、AI API、智能体平台、GPU、数据库、对象存储、邮件 SMTP、通用 HTTP 接口、代理订阅、其它）、填该类型的参数、点「测试连接」当场验通、最后「保存为资源」。',
    '再定区域：到「区域管理」给每个区域起名、定人数与大小（不够就新增区域），把资源分到合适的区域。',
    '日常管理在「成员管理」：改名称、区域、层级、状态、任务、备注与类型字段都在那里；「单个资源导入 / 导出」也在成员管理下方，凭据不跟随导出、到新电脑要重新填一次。',
    '排布局：到「布局示意图」把区域和成员拖到顺眼的位置，3D 办公室会自动跟着变。',
    '调显示与台词：到「通用与显示」切换中英文、开关气泡与名称；台词库可以改成你自己的话。',
    '选数据源：本地模式可编辑全部内容；想看实时状态，就填上你自己的数据接口切到实时模式（只读）。',
    '想异地访问：到「部署与远程访问」照三种方案选一种做（家里常开小主机＋Cloudflare 通道最省事），填好对外地址后点「检测远程地址」验通；公网暴露务必加 Cloudflare Access 之类的访问保护，不要裸奔。',
    '记得备份：到「数据管理」导出数据包；换电脑时把程序文件夹拷过去、导入数据包即可完整还原。',
  ];
  $('helpSteps').innerHTML = steps.map((s) => `<li>${esc(s)}</li>`).join('');
  $('modeDesc').textContent = lang() === 'en'
    ? 'Local mode: everything runs on this computer — seed data or an imported package — fully editable, works offline. Live mode: fill in YOUR OWN state/events endpoints (see the format spec under Data Source) and the office shows real-time status read-only; if the endpoints go down it falls back to local data with a notice. Editing always happens in Local mode.'
    : '本地模式：数据就在这台电脑里（出厂演示数据或你导入的数据包），全部可编辑，断网也能用。实时模式：在「数据源」里填上你自己的状态/事件接口地址，办公室实时展示那边的状态（只读看）；接口断线会自动回退本地数据并提示，不会白屏。所有编辑都在本地模式进行。';
  $('fmtSpec').textContent =
`状态接口（JSON）:
{
  "members": [
    { "id": "alice", "name": "Alice", "status": "working",
      "task": "Writing a report", "detail": "Team lead",
      "since": "2026-01-01T09:00:00+08:00", "reportsTo": "boss-id" }
  ]
}
status 取值: working / idle / sleepy / offline

事件接口（JSON Lines，一行一个 JSON）:
{"ts":"2026-01-01T09:05:00+08:00","member":"alice","type":"task_start","from":"idle","to":"working","task":"Writing a report","by":"boss-id"}
{"ts":"2026-01-01T09:06:00+08:00","member":"alice","type":"dispatch","from":"boss-id","to":"alice","brief":"New task","detail":"Details shown in the event panel","task":"New task","by":"boss-id"}
type 取值: status_change / task_start / task_done / task_update / note / dispatch / feedback
dispatch / feedback 的 from、to 是成员 id；其余类型的 from、to 是状态名。`;
}

/* ---------- 通用与数据源 ---------- */
function bindGeneral() {
  const s = Store.pkg.settings;
  $('gAppName').value = Store.pkg.appName || '';
  $('gLang').value = s.lang || 'zh';
  $('gBubbles').checked = s.bubbles !== false;
  $('gNames').checked = s.names !== false;
  $('gAppName').onchange = async () => { Store.pkg.appName = $('gAppName').value.trim() || Store.pkg.appName; applyI18n(); await save(); };
  $('gLang').onchange = async () => { s.lang = $('gLang').value; applyI18n(); renderHelp(); bindGeneral(); resetWizard(); bindDeploy(); renderMembersForm(); renderZonesForm(); renderLines(); await save(); };
  $('gBubbles').onchange = async () => { s.bubbles = $('gBubbles').checked; await save(); };
  $('gNames').onchange = async () => { s.names = $('gNames').checked; await save(); };
}
function bindSource() {
  const s = Store.pkg.settings;
  s.remote = s.remote || { stateUrl: '', eventsUrl: '' };
  $('sMode').value = s.dataMode || 'local';
  $('sStateUrl').value = s.remote.stateUrl || '';
  $('sEventsUrl').value = s.remote.eventsUrl || '';
  const upd = async () => {
    s.dataMode = $('sMode').value;
    s.remote.stateUrl = $('sStateUrl').value.trim();
    s.remote.eventsUrl = $('sEventsUrl').value.trim();
    await save();
  };
  $('sMode').onchange = upd; $('sStateUrl').onchange = upd; $('sEventsUrl').onchange = upd;
  $('sTest').onclick = async () => {
    const url = $('sStateUrl').value.trim();
    const out = $('sTestResult');
    if (!url) { out.innerHTML = '<span class="warn">请先填写状态接口地址</span>'; return; }
    out.textContent = '…';
    try {
      const r = await fetch('/api/proxy?url=' + encodeURIComponent(url), { cache: 'no-store' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json();
      const n = Array.isArray(j.members) ? j.members.length : 0;
      out.innerHTML = `<span class="ok">连接成功，读到 ${n} 名成员。</span>`;
    } catch (e) {
      out.innerHTML = `<span class="warn">连接失败：${esc(e.message || e)}</span>`;
    }
  };
}

/* ---------- 成员管理 ---------- */
let curMember = null;
let SecretsMap = {};          // {memberId:{kind,hint}}，来自 /api/secrets，只有掩码、无明文
let credDeletePending = false;
function frow(label, inner) { return `<div class="frow"><label>${label}</label>${inner}</div>`; }
function txt(id, v, ph = '') { return `<input type="text" id="${id}" value="${esc(v ?? '')}" placeholder="${esc(ph)}" style="flex:1;min-width:200px">`; }
function sel(id, opts, v) { return `<select id="${id}">${opts.map((o) => `<option value="${esc(o[0])}"${String(o[0]) === String(v) ? ' selected' : ''}>${esc(o[1])}</option>`).join('')}</select>`; }

/* 资源类型模板（契约见 CONTRACT-DATA.md）：先选类型、再出该类型专用字段组。
   类型专用字段平铺存在成员对象上；老数据无 rtype 时按 access/platform 推断，推不出按「其它」。 */
const RTYPES = {
  'ssh-server': { zh: '远程服务器（SSH）', en: 'Remote server (SSH)' },
  'local-device': { zh: '本地设备', en: 'Local device' },
  'ai-api': { zh: 'AI API 资源', en: 'AI API resource' },
  'agent-platform': { zh: '智能体平台', en: 'Agent platform' },
  'gpu': { zh: 'GPU 资源', en: 'GPU resource' },
  'database': { zh: '数据库', en: 'Database' },
  'object-storage': { zh: '对象存储', en: 'Object storage' },
  'email-smtp': { zh: '邮件服务（SMTP）', en: 'Email (SMTP)' },
  'http-api': { zh: '通用 HTTP 接口', en: 'Generic HTTP API' },
  'proxy-sub': { zh: '代理订阅', en: 'Proxy subscription' },
  'other': { zh: '其它', en: 'Other' },
};
const TYPE_DESC = {
  'ssh-server': { zh: '云 VPS / 独立服务器，SSH 登录', en: 'Cloud VPS or dedicated server over SSH' },
  'local-device': { zh: '局域网里的主机、NAS、路由器', en: 'Hosts, NAS and routers on your LAN' },
  'ai-api': { zh: '大模型 API，填地址与 Key', en: 'LLM APIs — base URL plus key' },
  'agent-platform': { zh: '网页派活的智能体平台', en: 'Agent platforms driven from the web' },
  'gpu': { zh: 'GPU 笔记本 / 算力平台', en: 'GPU notebooks and compute platforms' },
  'database': { zh: 'MySQL / PostgreSQL / Redis / MongoDB', en: 'MySQL / PostgreSQL / Redis / MongoDB' },
  'object-storage': { zh: 'S3 兼容对象存储', en: 'S3-compatible object storage' },
  'email-smtp': { zh: '发信用 SMTP 服务', en: 'SMTP service for sending mail' },
  'http-api': { zh: '任意 HTTP 接口、状态页、Webhook', en: 'Any HTTP endpoint, status page or webhook' },
  'proxy-sub': { zh: '代理节点订阅链接', en: 'Proxy node subscription link' },
  'other': { zh: '以上都不合适时用', en: 'Anything that fits nowhere else' },
};
function inferRtype(m) {
  if (m && RTYPES[m.rtype]) return m.rtype;
  const a = `${(m && m.access) || ''} ${(m && m.platform) || ''}`;
  if (/ssh/i.test(a)) return 'ssh-server';
  if (/smtp|mail|邮件/i.test(a)) return 'email-smtp';
  if (/mysql|postgres|redis|mongo|数据库/i.test(a)) return 'database';
  if (/s3|对象存储|object storage/i.test(a)) return 'object-storage';
  if (/订阅|subscription/i.test(a)) return 'proxy-sub';
  if (/\bapi\b/i.test(a)) return 'ai-api';
  return 'other';
}
/* 每种类型的专用字段定义——接入向导与成员表单共用这一套（契约见 CONTRACT-DATA.md）。
   {cred:true} 是凭据槽位置标记；字段值平铺存在成员对象上。 */
const TYPE_FIELDS = {
  'ssh-server': [
    { k: 'host', zh: '主机 / IP', en: 'Host / IP', ph: '203.0.113.10 / example.com' },
    { k: 'sshPort', zh: '端口', en: 'Port', def: '22' },
    { k: 'username', zh: '用户名', en: 'Username', ph: 'root / ubuntu / admin' },
    { k: 'authMethod', zh: '验证方式', en: 'Auth method', type: 'select', opts: [['password', '密码', 'Password'], ['key', '私钥', 'Private key']] },
    { cred: true },
    { k: 'region', zh: '地区', en: 'Region' },
    { k: 'platform', zh: '服务商', en: 'Provider' },
    { k: 'specs', zh: '规格', en: 'Specs' },
    { k: 'expiresAt', zh: '到期日', en: 'Expires on', ph: 'YYYY-MM-DD' },
  ],
  'local-device': [
    { k: 'host', zh: '局域网地址', en: 'LAN address', ph: '192.168.1.10' },
    { k: 'sshPort', zh: '端口', en: 'Port', def: '22' },
    { k: 'username', zh: '用户名', en: 'Username', ph: 'admin' },
    { k: 'authMethod', zh: '验证方式', en: 'Auth method', type: 'select', opts: [['password', '密码', 'Password'], ['key', '私钥', 'Private key']] },
    { cred: true },
    { k: 'role', zh: '用途', en: 'Purpose' },
  ],
  'ai-api': [
    { k: 'platform', zh: '服务名', en: 'Service name', ph: 'OpenAI / DeepSeek / …' },
    { k: 'apiUrl', zh: 'API 地址', en: 'API base URL', ph: 'https://api.example.com/v1' },
    { cred: true },
    { k: 'models', zh: '可用模型', en: 'Models', ph: 'model-a, model-b' },
    { k: 'quota', zh: '额度', en: 'Quota', phZh: '如 每日 10,000 积分', phEn: 'e.g. 10,000 credits/day' },
    { k: 'expiresAt', zh: '到期日', en: 'Expires on', ph: 'YYYY-MM-DD' },
  ],
  'agent-platform': [
    { k: 'platform', zh: '平台名', en: 'Platform' },
    { k: 'entryUrl', zh: '入口网址', en: 'Entry URL', ph: 'https://…' },
    { k: 'accountId', zh: '账号标识', en: 'Account' },
    { k: 'dispatchVia', zh: '派活方式', en: 'How to dispatch', phZh: '网页聊天 / API / …', phEn: 'Web chat / API / …' },
    { k: 'quota', zh: '额度', en: 'Quota' },
  ],
  'gpu': [
    { k: 'platform', zh: '平台', en: 'Platform' },
    { k: 'entryUrl', zh: '入口网址', en: 'Entry URL', ph: 'https://…' },
    { k: 'accountId', zh: '账号标识', en: 'Account' },
    { k: 'quota', zh: '额度', en: 'Quota', phZh: '如 每周 30 GPU 小时', phEn: 'e.g. 30 GPU-hours/week' },
    { k: 'access', zh: '接入方式', en: 'Access' },
  ],
  'database': [
    { k: 'dbEngine', zh: '引擎', en: 'Engine', type: 'select', opts: [['mysql', 'MySQL', 'MySQL'], ['postgresql', 'PostgreSQL', 'PostgreSQL'], ['redis', 'Redis', 'Redis'], ['mongodb', 'MongoDB', 'MongoDB']] },
    { k: 'host', zh: '主机 / IP', en: 'Host / IP', ph: '203.0.113.20' },
    { k: 'dbPort', zh: '端口', en: 'Port', ph: '3306 / 5432 / 6379 / 27017' },
    { k: 'username', zh: '用户名', en: 'Username' },
    { cred: true },
    { k: 'dbName', zh: '库名', en: 'Database name' },
  ],
  'object-storage': [
    { k: 'platform', zh: '服务商', en: 'Provider', phZh: '如 AWS S3 / Cloudflare R2 / MinIO', phEn: 'e.g. AWS S3 / Cloudflare R2 / MinIO' },
    { k: 's3Endpoint', zh: 'Endpoint', en: 'Endpoint', ph: 'https://s3.example.com' },
    { k: 's3Region', zh: '区域', en: 'Region', ph: 'us-east-1' },
    { k: 'bucket', zh: 'Bucket', en: 'Bucket' },
    { cred: true },
  ],
  'email-smtp': [
    { k: 'smtpHost', zh: 'SMTP 主机', en: 'SMTP host', ph: 'smtp.example.com' },
    { k: 'smtpPort', zh: '端口', en: 'Port', def: '587' },
    { k: 'smtpEncryption', zh: '加密', en: 'Encryption', type: 'select', opts: [['ssl', 'SSL', 'SSL'], ['starttls', 'STARTTLS', 'STARTTLS'], ['none', '无', 'None']] },
    { k: 'username', zh: '用户名', en: 'Username' },
    { cred: true },
    { k: 'fromAddress', zh: '发件地址', en: 'From address', ph: 'demo@example.com' },
  ],
  'http-api': [
    { k: 'httpUrl', zh: '接口 URL', en: 'URL', ph: 'https://api.example.com/health' },
    { k: 'httpMethod', zh: '方法', en: 'Method', type: 'select', opts: [['GET', 'GET', 'GET'], ['HEAD', 'HEAD', 'HEAD'], ['POST', 'POST', 'POST']] },
    { k: 'authType', zh: '鉴权方式', en: 'Auth', type: 'select', opts: [['none', '无', 'None'], ['bearer', 'Bearer Token', 'Bearer token'], ['header', '自定义请求头', 'Custom header']] },
    { k: 'headerName', zh: '请求头名', en: 'Header name', ph: 'X-API-Key' },
    { cred: true },
    { k: 'expectStatus', zh: '期望状态码', en: 'Expected status', phZh: '200（可空）', phEn: '200 (optional)' },
  ],
  'proxy-sub': [
    { k: 'subUrl', zh: '订阅地址', en: 'Subscription URL', ph: 'https://…' },
    { k: 'subProtocol', zh: '协议备注', en: 'Protocols note', phZh: '如 vless / trojan', phEn: 'e.g. vless / trojan' },
    { k: 'quota', zh: '流量 / 到期说明', en: 'Traffic / expiry note' },
  ],
  'other': [
    { k: 'role', zh: '职责', en: 'Role' },
    { k: 'platform', zh: '平台', en: 'Platform' },
    { k: 'region', zh: '地区', en: 'Region' },
    { k: 'specs', zh: '规格', en: 'Specs' },
    { k: 'access', zh: '接入方式', en: 'Access' },
    { k: 'host', zh: '主机（可选）', en: 'Host (optional)' },
    { k: 'entryUrl', zh: '入口网址（可选）', en: 'Entry URL (optional)', ph: 'https://…' },
  ],
};
const gv = (prefix, k) => { const el = $(prefix + '-' + k); return el ? el.value.trim() : ''; };
function typeFieldsHtml(prefix, rt, m) {
  const en = lang() === 'en';
  let h = '';
  for (const f of TYPE_FIELDS[rt] || []) {
    if (f.cred) { h += `<div id="${prefix}-credSlot"></div>`; continue; }
    const label = en ? f.en : f.zh;
    const ph = f.ph || (en ? f.phEn : f.phZh) || '';
    if (f.type === 'select') {
      const opts = f.opts.map((o) => [o[0], en ? o[2] : o[1]]);
      h += frow(label, sel(prefix + '-' + f.k, opts, m[f.k] || f.def || opts[0][0]));
    } else {
      h += frow(label, txt(prefix + '-' + f.k, m[f.k] ?? (f.def || ''), ph));
    }
  }
  return h;
}
function collectTypeFields(prefix, rt) {
  const out = {};
  for (const f of TYPE_FIELDS[rt] || []) {
    if (f.cred) continue;
    const el = $(prefix + '-' + f.k);
    if (el) out[f.k] = el.value.trim();
  }
  return out;
}
function bindTypeFieldHooks(prefix, rt, m) {
  const am = $(prefix + '-authMethod');
  if (am) am.onchange = () => renderCredSlotFor(prefix, rt, m);
  const at = $(prefix + '-authType');
  if (at) at.onchange = () => renderCredSlotFor(prefix, rt, m);
}

function credStateHtml(m) {
  const en = lang() === 'en';
  const saved = m.id ? SecretsMap[m.id] : null;
  if (saved) return `<span class="small ok">${en ? 'Saved on this machine' : '本机已保存'}（${esc(saved.hint)}）</span>`;
  if (m.hasSecret) return `<span class="small warn">${en ? 'Had a credential, but none is stored on this machine (exports carry no secrets) — re-enter here' : '原记录有凭据，但本机未保存（导出不带凭据明文），请重新填入'}</span>`;
  return `<span class="small muted">${en ? 'Kept only in local secrets.json' : '只存本机 secrets.json，不进数据包与导出'}</span>`;
}
function credDelBtnHtml(prefix, m) {
  const en = lang() === 'en';
  return (m.id && SecretsMap[m.id]) ? ` <button type="button" class="btn small danger" id="${prefix}-cred-del">${en ? 'Clear saved' : '清除已存凭据'}</button>` : '';
}
function credInputHtml(prefix, m, label, asText) {
  const en = lang() === 'en';
  const input = asText
    ? `<textarea id="${prefix}-cred" rows="3" placeholder="${en ? 'Paste the private key; leave blank to keep unchanged' : '粘贴私钥内容；留空表示不改'}"></textarea>`
    : `<input type="password" id="${prefix}-cred" value="" placeholder="${en ? 'Leave blank to keep unchanged' : '留空表示不改'}" style="flex:1;min-width:200px" autocomplete="new-password">`;
  return frow(label, input + credStateHtml(m) + credDelBtnHtml(prefix, m));
}
function credPairHtml(prefix, m) {
  const en = lang() === 'en';
  return frow('Access Key', `<input type="text" id="${prefix}-cred-ak" value="" placeholder="${en ? 'Leave blank to keep unchanged' : '留空表示不改'}" style="flex:1;min-width:200px" autocomplete="off">`) +
    frow('Secret Key', `<input type="password" id="${prefix}-cred-sk" value="" placeholder="${en ? 'Leave blank to keep unchanged' : '留空表示不改'}" style="flex:1;min-width:200px" autocomplete="new-password">` + credStateHtml(m) + credDelBtnHtml(prefix, m));
}
function bindCredDelFor(prefix) {
  const b = $(prefix + '-cred-del');
  if (b) b.onclick = () => { credDeletePending = true; b.outerHTML = `<span class="small warn">${lang() === 'en' ? 'Will be cleared on save' : '保存时清除'}</span>`; };
}
function renderCredSlotFor(prefix, rt, m) {
  const slot = $(prefix + '-credSlot'); if (!slot) return;
  const en = lang() === 'en';
  if (rt === 'object-storage') { slot.innerHTML = credPairHtml(prefix, m); bindCredDelFor(prefix); return; }
  if (rt === 'ssh-server' || rt === 'local-device') {
    const amEl = $(prefix + '-authMethod');
    const isKey = ((amEl && amEl.value) || m.authMethod || 'password') === 'key';
    slot.innerHTML = credInputHtml(prefix, m, isKey ? (en ? 'Private key' : '私钥') : (en ? 'Password' : '密码'), isKey);
    bindCredDelFor(prefix); return;
  }
  if (rt === 'ai-api') { slot.innerHTML = credInputHtml(prefix, m, 'API Key', false); bindCredDelFor(prefix); return; }
  if (rt === 'database') { slot.innerHTML = credInputHtml(prefix, m, en ? 'Password' : '密码', false); bindCredDelFor(prefix); return; }
  if (rt === 'email-smtp') { slot.innerHTML = credInputHtml(prefix, m, en ? 'Password' : '密码', false); bindCredDelFor(prefix); return; }
  if (rt === 'http-api') {
    const atEl = $(prefix + '-authType');
    const at = (atEl && atEl.value) || m.authType || 'none';
    if (at === 'none') { slot.innerHTML = frow(en ? 'Credential' : '凭据', `<span class="small muted">${en ? 'No auth — no credential needed' : '无鉴权，不需要凭据'}</span>`); return; }
    slot.innerHTML = credInputHtml(prefix, m, at === 'bearer' ? 'Token' : (en ? 'Header value' : '请求头的值'), false);
    bindCredDelFor(prefix); return;
  }
  slot.innerHTML = '';
}
function credKindFor(rt, prefix) {
  if (rt === 'ai-api' || rt === 'http-api') return 'apiKey';
  if (rt === 'ssh-server' || rt === 'local-device') return gv(prefix, 'authMethod') === 'key' ? 'key' : 'password';
  return 'password';
}
/* 把表单里填的凭据存进本机 secrets.json（明文只走 /api/secret）。存了返回 true，没填返回 false。 */
async function saveCredForMember(id, rt, prefix) {
  if (rt === 'object-storage') {
    const ak = gv(prefix, 'cred-ak'), sk = gv(prefix, 'cred-sk');
    if (!ak && !sk) return false;
    const r = await Store.secretOp({ id, kind: 's3', value: JSON.stringify({ accessKey: ak, secretKey: sk }) });
    SecretsMap[id] = { kind: 's3', hint: r.hint || '' };
    return true;
  }
  const el = $(prefix + '-cred');
  const val = el ? el.value : '';
  if (!val) return false;
  const kind = credKindFor(rt, prefix);
  const r = await Store.secretOp({ id, kind, value: val });
  SecretsMap[id] = { kind, hint: r.hint || '' };
  return true;
}
/* 按类型拼测试请求（向导与成员表单共用同一个 /api/test）。返回 {spec} 或 {explain}（没法测时的说明）。 */
function buildTestSpec(prefix, rt, memberId) {
  const en = lang() === 'en';
  const mid = memberId || undefined;
  if (rt === 'ssh-server' || rt === 'local-device') {
    return { spec: { kind: 'ssh', host: gv(prefix, 'host'), port: parseInt(gv(prefix, 'sshPort')) || 22 } };
  }
  if (rt === 'ai-api') {
    return { spec: { kind: 'api', apiUrl: gv(prefix, 'apiUrl'), apiKey: gv(prefix, 'cred') || undefined, memberId: mid } };
  }
  if (rt === 'agent-platform' || rt === 'gpu') {
    const url = gv(prefix, 'entryUrl');
    if (!url) return { explain: en ? 'Fill in the entry URL first — the test checks that the entry page is reachable.' : '先填入口网址——测试验的是入口可达。' };
    return { spec: { kind: 'http-entry', url } };
  }
  if (rt === 'database') {
    return { spec: { kind: 'db', engine: gv(prefix, 'dbEngine') || 'mysql', host: gv(prefix, 'host'), port: parseInt(gv(prefix, 'dbPort')) || undefined } };
  }
  if (rt === 'object-storage') {
    return { spec: { kind: 's3', endpoint: gv(prefix, 's3Endpoint'), region: gv(prefix, 's3Region'), bucket: gv(prefix, 'bucket'), accessKey: gv(prefix, 'cred-ak') || undefined, secretKey: gv(prefix, 'cred-sk') || undefined, memberId: mid } };
  }
  if (rt === 'email-smtp') {
    return { spec: { kind: 'smtp', host: gv(prefix, 'smtpHost'), port: parseInt(gv(prefix, 'smtpPort')) || undefined, encryption: gv(prefix, 'smtpEncryption') || 'starttls' } };
  }
  if (rt === 'http-api') {
    return { spec: { kind: 'http-api', url: gv(prefix, 'httpUrl'), method: gv(prefix, 'httpMethod') || 'GET', authType: gv(prefix, 'authType') || 'none', headerName: gv(prefix, 'headerName'), token: gv(prefix, 'cred') || undefined, expectStatus: gv(prefix, 'expectStatus'), memberId: mid } };
  }
  if (rt === 'proxy-sub') {
    return { spec: { kind: 'sub', url: gv(prefix, 'subUrl') } };
  }
  // other：填了主机走 TCP，填了网址走 HTTP，都没填给说明
  const host = gv(prefix, 'host');
  if (host) return { spec: { kind: 'ssh', host, port: 22 } };
  const url = gv(prefix, 'entryUrl');
  if (url) return { spec: { kind: 'http-entry', url } };
  return { explain: en ? 'For “Other”, fill in a host (TCP test) or an entry URL (HTTP reachability test) first.' : '「其它」类型：先填主机（做 TCP 测试）或入口网址（做 HTTP 可达测试）才能测。' };
}
function presentTestResult(out, r) {
  const en = lang() === 'en';
  out.innerHTML = r.ok
    ? `<span class="ok">${en ? 'Reachable' : '通'} · ${r.ms} ms · ${esc(r.message)}</span>`
    : `<span class="warn">${en ? 'Failed' : '不通'} · ${r.ms} ms · ${esc(r.message)}</span>`;
}
function renderTypeFields() {
  const rt = $('mf-rtype') ? $('mf-rtype').value : 'other';
  const m = memberById(curMember) || {};
  $('mTypeFields').innerHTML = typeFieldsHtml('mf', rt, m);
  renderCredSlotFor('mf', rt, m);
  bindTypeFieldHooks('mf', rt, m);
}
function renderMembersForm() {
  const pkg = Store.pkg;
  const pick = $('mPick');
  pick.innerHTML = pkg.members.map((m) => `<option value="${esc(m.id)}">${esc(m.name)}（${esc(zoneName(zoneById(m.zone) || { name: '—', nameEn: '—' }))}）</option>`).join('');
  if (!curMember || !memberById(curMember)) curMember = pkg.members[0]?.id || null;
  if (curMember) pick.value = curMember;
  pick.onchange = () => pickMember(pick.value);
  renderMemberFields();
}
function pickMember(id) { curMember = id; $('mPick').value = id; renderMemberFields(); }
function renderMemberFields() {
  const pkg = Store.pkg;
  const m = memberById(curMember) || { id: '', name: '', zone: pkg.zones[0]?.id, tier: 'staff', reportsTo: null, status: 'idle', task: '', detail: '', notes: '' };
  const zoneOpts = pkg.zones.map((z) => [z.id, zoneName(z)]);
  const tierOpts = [['gm', TIER.gm[lang()]], ['exec', TIER.exec[lang()]], ['staff', TIER.staff[lang()]]];
  const bossOpts = [['', '—']].concat(pkg.members.filter((x) => x.id !== m.id).map((x) => [x.id, x.name]));
  const stOpts = Object.keys(STATUS).map((k) => [k, STATUS[k][lang()]]);
  const rtOpts = Object.keys(RTYPES).map((k) => [k, RTYPES[k][lang()]]);
  const en = lang() === 'en';
  credDeletePending = false;
  $('mForm').innerHTML =
    frow('ID', txt('mf-id', m.id, 'member-1') + `<span class="small muted">${en ? 'Unique; letters/digits/dashes' : '唯一标识，字母/数字/连字符'}</span>`) +
    frow(en ? 'Name (head label)' : '名称（头顶显示）', txt('mf-name', m.name)) +
    frow(L.fRtype, sel('mf-rtype', rtOpts, inferRtype(m))) +
    frow(en ? 'Zone' : '所属区域', sel('mf-zone', zoneOpts, m.zone)) +
    frow(en ? 'Tier' : '层级', sel('mf-tier', tierOpts, m.tier)) +
    frow(en ? 'Reports to' : '上级', sel('mf-boss', bossOpts, m.reportsTo || '')) +
    frow(en ? 'Status' : '状态', sel('mf-status', stOpts, m.status)) +
    frow(en ? 'Current task' : '当前任务', txt('mf-task', m.task)) +
    frow(en ? 'About' : '简介（详细内容）', `<textarea id="mf-detail" rows="2">${esc(m.detail || '')}</textarea>`) +
    '<div id="mTypeFields"></div>' +
    frow(en ? 'Notes' : '备注', `<textarea id="mf-notes" rows="2">${esc(m.notes || '')}</textarea>`);
  $('mf-rtype').onchange = () => renderTypeFields();
  renderTypeFields();
  const tr = $('mTestResult'); if (tr) tr.textContent = '';
}
$('mSave').onclick = async () => {
  const pkg = Store.pkg;
  const id = $('mf-id').value.trim();
  const name = $('mf-name').value.trim();
  if (!id || !name) { $('mWarn').textContent = lang() === 'en' ? 'ID and name are required.' : 'ID 与名称必填。'; return; }
  if (!/^[A-Za-z0-9_-]+$/.test(id)) { $('mWarn').textContent = lang() === 'en' ? 'ID: letters/digits/-/_ only.' : 'ID 只能用字母、数字、连字符、下划线。'; return; }
  const existing = memberById(curMember);
  if (id !== curMember && memberById(id)) { $('mWarn').textContent = 'ID 已存在：' + id; return; }
  $('mWarn').textContent = '';
  const data = { id, name, rtype: $('mf-rtype').value, zone: $('mf-zone').value, tier: $('mf-tier').value,
    reportsTo: $('mf-boss').value || null, status: $('mf-status').value, task: $('mf-task').value,
    detail: $('mf-detail').value, notes: $('mf-notes').value,
    hasSecret: !!(existing && existing.hasSecret),
    since: existing?.since || new Date().toISOString() };
  Object.assign(data, collectTypeFields('mf', data.rtype));
  if (existing) Object.assign(existing, data); else pkg.members.push(data);
  if (existing && id !== curMember) { // 改了 id：同步下级引用与本机凭据的键
    for (const x of pkg.members) if (x.reportsTo === curMember) x.reportsTo = id;
    try {
      await Store.secretOp({ renameFrom: curMember, renameTo: id });
      if (SecretsMap[curMember]) { SecretsMap[id] = SecretsMap[curMember]; delete SecretsMap[curMember]; }
    } catch (e) { /* 凭据改名失败不阻塞成员保存 */ }
  }
  curMember = id;
  await save();
  // 凭据处理：填了新值→存；点了清除→删。明文只经 /api/secret 进服务端 secrets.json。
  try {
    const savedM = memberById(id);
    if (credDeletePending) {
      await Store.secretOp({ id, delete: true });
      delete SecretsMap[id];
      if (savedM && savedM.hasSecret) { savedM.hasSecret = false; await Store.save(); }
    } else if (await saveCredForMember(id, data.rtype, 'mf')) {
      if (savedM && !savedM.hasSecret) { savedM.hasSecret = true; await Store.save(); }
    }
  } catch (e) {
    $('mWarn').textContent = (lang() === 'en' ? 'Member saved, but credential save failed: ' : '成员已保存，但凭据保存失败：') + (e.message || e);
  }
  credDeletePending = false;
  renderTable(); renderMembersForm();
};
$('mAdd').onclick = () => {
  const pkg = Store.pkg;
  let n = 1; while (memberById('member-' + n)) n++;
  curMember = null;
  $('mPick').value = '';
  renderMemberFields();
  $('mf-rtype').value = 'ssh-server'; renderTypeFields();  // 新增默认按最常见的「远程服务器」起步，可再改类型
  $('mf-id').value = 'member-' + n;
  $('mf-name').value = '';
  $('mf-name').focus();
};
$('mDel').onclick = async () => {
  const m = memberById(curMember); if (!m) return;
  if (!confirm((lang() === 'en' ? 'Delete member ' : '删除成员 ') + m.name + '？')) return;
  Store.pkg.members = Store.pkg.members.filter((x) => x.id !== m.id);
  for (const x of Store.pkg.members) if (x.reportsTo === m.id) x.reportsTo = null;
  if (SecretsMap[m.id]) { try { await Store.secretOp({ id: m.id, delete: true }); delete SecretsMap[m.id]; } catch (e) {} }
  curMember = Store.pkg.members[0]?.id || null;
  await save(); renderMembersForm();
};
$('mTest').onclick = async () => {
  const out = $('mTestResult');
  const en = lang() === 'en';
  const rt = $('mf-rtype').value;
  const built = buildTestSpec('mf', rt, memberById(curMember) ? curMember : null);
  if (built.explain) { out.innerHTML = `<span class="warn">${esc(built.explain)}</span>`; return; }
  out.textContent = en ? 'Testing…' : '测试中…';
  try {
    const r = await Store.testConn(built.spec);
    presentTestResult(out, r);
    // 已保存的成员：结果存为状态记录（lastTest 字段＋一条 note 事件）
    const m = memberById(curMember);
    if (m && $('mf-id').value.trim() === m.id) {
      const ts = new Date().toISOString();
      m.lastTest = { ts, ok: r.ok, ms: r.ms, message: r.message };
      Store.pkg.events = Store.pkg.events || [];
      const brief = `${en ? 'Connection test' : '连接测试'}：${r.ok ? (en ? 'OK' : '通') : (en ? 'Failed' : '不通')}（${r.ms} ms）${r.message}`;
      Store.pkg.events.push({ ts, member: m.id, type: 'note', from: m.status, to: m.status, brief, task: brief, by: 'console' });
      await save(false);
    }
  } catch (e) {
    out.innerHTML = `<span class="warn">${en ? 'Test error: ' : '测试出错：'}${esc(e.message || e)}</span>`;
  }
};
/* ---------- 部署与远程访问（指南＋settings.deploy＋隧道令牌＋生成片段＋检测远程） ---------- */
let localHealth = null;
function deploySettings() {
  const s = Store.pkg.settings;
  s.deploy = s.deploy || { mode: 'local', publicUrl: '', tunnelName: '' };
  return s.deploy;
}
async function loadHealth() {
  try { localHealth = await Store.health(); } catch (e) { localHealth = null; }
  renderLocalInfo(); renderDeployGuide();
}
function localPort() { return (localHealth && localHealth.port) || window.location.port || '8931'; }
function renderLocalInfo() {
  const el = $('dpLocalInfo'); if (!el || !localHealth) return;
  const en = lang() === 'en';
  el.textContent = en
    ? `This instance: version ${localHealth.version} · listening port ${localPort()} · instanceId ${String(localHealth.instanceId || '').slice(0, 8)}…`
    : `本机实例：版本 ${localHealth.version} · 监听端口 ${localPort()} · instanceId ${String(localHealth.instanceId || '').slice(0, 8)}…`;
}
function renderDeployGuide() {
  const el = $('deployGuide'); if (!el) return;
  const en = lang() === 'en';
  const port = localPort();
  el.innerHTML = en ? `
    <p class="desc">To open this console from anywhere (office, road, phone), run the program on an always-on machine and give it a public path. Pick one of the three setups:</p>
    <h4>Plan A · Local only (simplest)</h4>
    <ol><li>Double-click the start script on this computer; the browser opens automatically. Done.</li>
    <li>No tunnel, no domain, nothing to fill in below.</li>
    <li>It stops when the computer or the start window closes — fine for personal use on one machine.</li></ol>
    <h4>Plan B · Always-on home host + Cloudflare Tunnel (recommended)</h4>
    <ol><li>Copy the whole program folder to an always-on machine (mini PC, NAS, old laptop), run the start script there, and note its listening port (shown under “My deployment” below, usually ${port}).</li>
    <li>Install cloudflared on that machine (Cloudflare’s free tool), run <span class="pill">cloudflared tunnel login</span>, then <span class="pill">cloudflared tunnel create</span> to make a tunnel.</li>
    <li>Point your domain (hosted on Cloudflare) at the tunnel with <span class="pill">cloudflared tunnel route dns</span>, and merge the ingress snippet from “Generate tunnel config” below into the tunnel’s config.yml.</li>
    <li>Run the tunnel, fill <span class="pill">https://your-domain</span> into “Public URL” below, and hit “Check remote URL” to verify.</li>
    <li>In the Cloudflare dashboard, add an Access policy for that domain (only your own email may log in) — do not skip this; see the warning below.</li></ol>
    <h4>Plan C · Cloud VPS</h4>
    <ol><li>Copy the program folder to the VPS and run start.sh; keep it alive with systemd, pm2 or nohup.</li>
    <li>Public path, pick one: (1) a Cloudflare Tunnel exactly like Plan B (no public port to open — easiest); or (2) Nginx / Caddy as a reverse proxy to http://127.0.0.1:${port} with HTTPS set up.</li>
    <li>Fill the public URL below, verify with “Check remote URL”, and export a data package from “Data” now and then as a backup.</li></ol>
    <div class="dangerNote">Security — read this: this program has no login of its own. If the URL is publicly reachable, ANYONE who opens it can view and change all your data. Always add an access layer: an Access policy for Cloudflare Tunnels, or login auth / IP allow-listing for a reverse proxy. Never expose it bare.</div>`
  : `
    <p class="desc">想在异地（公司、路上、手机）也能顺畅打开这个管理台，就要把程序跑在一台常开的机器上，再给它一条公网通道。下面三种跑法任选其一：</p>
    <h4>方案 A · 本机自用（最简单）</h4>
    <ol><li>在这台电脑上双击启动脚本，浏览器自动打开，就这么用。</li>
    <li>不需要通道、不需要域名，下面什么都不用填。</li>
    <li>电脑关机或关掉启动窗口就打不开了——只适合单机自用。</li></ol>
    <h4>方案 B · 家里常开小主机 ＋ Cloudflare 通道（推荐，异地有网就能开）</h4>
    <ol><li>把整个程序文件夹拷到一台常开的机器（小主机、NAS、旧电脑都行），在上面跑启动脚本，记下它的监听端口（见下方「我的部署」里的本机实例信息，一般是 ${port}）。</li>
    <li>在那台机器上安装 cloudflared（Cloudflare 官方免费工具），运行 <span class="pill">cloudflared tunnel login</span> 登录你的 Cloudflare 账号，再 <span class="pill">cloudflared tunnel create</span> 建一条隧道。</li>
    <li>把你的域名（需托管在 Cloudflare）指到这条隧道：<span class="pill">cloudflared tunnel route dns</span>；再把下方「生成通道配置」给出的 ingress 片段并入隧道的 config.yml。</li>
    <li>运行隧道，把 <span class="pill">https://你的域名</span> 填到下方「对外访问地址」，点「检测远程地址」验通。</li>
    <li>到 Cloudflare 后台给这个域名加 Access 访问策略（只允许你的邮箱登录）——这一步别省，见下方安全提醒。</li></ol>
    <h4>方案 C · 云 VPS 部署</h4>
    <ol><li>把程序文件夹拷到 VPS，跑 start.sh；想让它长期运行，用 systemd、pm2 或 nohup 守着。</li>
    <li>通道二选一：① 同方案 B 用 Cloudflare 通道（不用在 VPS 上开公网端口，最省事）；② 用 Nginx / Caddy 反向代理到 http://127.0.0.1:${port} 并配好 HTTPS 证书。</li>
    <li>把对外地址填到下方，点「检测远程地址」验通；定期到「数据管理」导出数据包备份。</li></ol>
    <div class="dangerNote">安全提醒（必看）：本程序自身没有登录验证——只要地址公网可达，任何人打开都能查看并修改你的全部数据。务必加一层访问保护：Cloudflare 通道就配 Access 策略，反向代理就加登录认证或 IP 白名单。不要裸奔。</div>`;
}
function renderTokenState() {
  const el = $('dpTokenState'); if (!el) return;
  const en = lang() === 'en';
  const saved = SecretsMap['deploy:tunnel'];
  el.innerHTML = saved
    ? `<span class="small ok">${en ? 'Saved on this machine' : '本机已保存'}（${esc(saved.hint)}）</span>`
    : `<span class="small muted">${en ? 'Not saved' : '未保存'}</span>`;
  const del = $('dpTokenDel'); if (del) del.style.display = saved ? '' : 'none';
}
function genDeploySnippet() {
  const en = lang() === 'en';
  const out = $('dpCheckResult');
  const raw = $('dpUrl').value.trim();
  if (!raw) { out.innerHTML = `<span class="warn">${en ? 'Fill in the public URL first — the snippet is generated from its domain.' : '先填对外访问地址——片段按它的域名生成。'}</span>`; return; }
  let host = '';
  try { host = new URL(raw.includes('://') ? raw : 'https://' + raw).hostname; } catch (e) {}
  if (!host) { out.innerHTML = `<span class="warn">${en ? 'That public URL does not parse.' : '对外访问地址格式不对，解析不出域名。'}</span>`; return; }
  const port = localPort();
  const tun = $('dpTunnel').value.trim() || 'my-console';
  const lines = en ? [
    '# ===== cloudflared tunnel config (config.yml) =====',
    '# Merge the ingress part into your tunnel config, then restart the tunnel.',
    '# This is generated text only — nothing is executed for you.',
    `tunnel: ${tun}`,
    'ingress:',
    `  - hostname: ${host}`,
    `    service: http://127.0.0.1:${port}`,
    '  - service: http_status:404',
    '',
    '# ===== commands =====',
    '# 1) Log in and create the tunnel (once):',
    'cloudflared tunnel login',
    `cloudflared tunnel create ${tun}`,
    '# 2) Point the domain at this tunnel:',
    `cloudflared tunnel route dns ${tun} ${host}`,
    '# 3) Run the tunnel:',
    'cloudflared tunnel --config config.yml run ' + tun,
    '# Token-based tunnels (created in the Zero Trust dashboard) instead run:',
    'cloudflared tunnel run --token <YOUR_TUNNEL_TOKEN>',
    '',
    `# SECURITY: add a Cloudflare Access policy for ${host} (only your own login) —`,
    '# anyone who can open the URL can edit your data. Never expose it bare.',
  ] : [
    '# ===== cloudflared 隧道配置（config.yml）=====',
    '# 把 ingress 部分并入你的隧道 config.yml，重启隧道后生效。',
    '# 这里只是生成文本，不会替你执行任何命令。',
    `tunnel: ${tun}`,
    'ingress:',
    `  - hostname: ${host}`,
    `    service: http://127.0.0.1:${port}`,
    '  - service: http_status:404',
    '',
    '# ===== 常用命令 =====',
    '# 1) 登录并创建隧道（只需一次）：',
    'cloudflared tunnel login',
    `cloudflared tunnel create ${tun}`,
    '# 2) 把域名指到这条隧道：',
    `cloudflared tunnel route dns ${tun} ${host}`,
    '# 3) 启动隧道：',
    'cloudflared tunnel --config config.yml run ' + tun,
    '# 若是令牌方式的隧道（Zero Trust 后台创建）：',
    'cloudflared tunnel run --token <你的隧道令牌>',
    '',
    `# 安全提醒：务必在 Cloudflare 后台为 ${host} 加 Access 策略，只允许你本人登录；`,
    '# 任何人打开这个地址都能改你的数据，不要裸奔。',
  ];
  $('dpSnippet').value = lines.join('\n');
  $('dpSnippetWrap').hidden = false;
  out.innerHTML = '';
}
function bindDeploy() {
  const d = deploySettings();
  const en = lang() === 'en';
  const modes = [['local', en ? 'Local only' : '本地自用'], ['lan', en ? 'LAN' : '局域网'], ['cloudflare', en ? 'Cloudflare Tunnel' : 'Cloudflare 通道'], ['proxy', en ? 'Reverse proxy' : '反向代理'], ['other', en ? 'Other' : '其它']];
  $('dpMode').innerHTML = modes.map((o) => `<option value="${o[0]}">${esc(o[1])}</option>`).join('');
  $('dpMode').value = d.mode || 'local';
  $('dpUrl').value = d.publicUrl || '';
  $('dpTunnel').value = d.tunnelName || '';
  renderDeployGuide(); renderTokenState(); renderLocalInfo();
  const upd = async () => { d.mode = $('dpMode').value; d.publicUrl = $('dpUrl').value.trim(); d.tunnelName = $('dpTunnel').value.trim(); await save(); };
  $('dpMode').onchange = upd; $('dpUrl').onchange = upd; $('dpTunnel').onchange = upd;
  $('dpTokenSave').onclick = async () => {
    const v = $('dpToken').value;
    if (!v) return;
    try {
      const r = await Store.secretOp({ id: 'deploy:tunnel', kind: 'tunnelToken', value: v });
      SecretsMap['deploy:tunnel'] = { kind: 'tunnelToken', hint: r.hint || '' };
      $('dpToken').value = '';
      renderTokenState(); toast(L.saved);
    } catch (e) { alert((lang() === 'en' ? 'Token save failed: ' : '令牌保存失败：') + (e.message || e)); }
  };
  $('dpTokenDel').onclick = async () => {
    try { await Store.secretOp({ id: 'deploy:tunnel', delete: true }); } catch (e) {}
    delete SecretsMap['deploy:tunnel'];
    renderTokenState();
  };
  $('dpGen').onclick = genDeploySnippet;
  $('dpCopy').onclick = async () => {
    const t = $('dpSnippet');
    t.select();
    try { await navigator.clipboard.writeText(t.value); } catch (e) { document.execCommand('copy'); }
    toast(lang() === 'en' ? 'Copied' : '已复制');
  };
  $('dpCheck').onclick = async () => {
    const out = $('dpCheckResult');
    const url = $('dpUrl').value.trim();
    if (!url) { out.innerHTML = `<span class="warn">${en ? 'Fill in the public URL first.' : '先填对外访问地址。'}</span>`; return; }
    out.textContent = en ? 'Checking…' : '检测中…';
    try {
      const r = await Store.checkRemote(url);
      out.innerHTML = r.ok
        ? `<span class="ok">${en ? 'Reachable' : '通'} · ${r.ms} ms · ${esc(r.message)}</span>`
        : `<span class="warn">${en ? 'Not OK' : '不通'} · ${esc(r.message)}</span>`;
    } catch (e) {
      out.innerHTML = `<span class="warn">${en ? 'Check error: ' : '检测出错：'}${esc(e.message || e)}</span>`;
    }
  };
}

/* ---------- 接入资源向导（新资源接入主路径；与成员表单共用 TYPE_FIELDS、凭据与 /api/test） ---------- */
let wiz = { rt: null, lastTest: null };
function resetWizard() {
  wiz = { rt: null, lastTest: null };
  const s2 = $('wStep2'), s34 = $('wStep34');
  if (s2) s2.hidden = true;
  if (s34) s34.hidden = true;
  const d = $('wDone'); if (d) d.innerHTML = '';
  renderWizardTypes();
}
function renderWizardTypes() {
  const el = $('wTypes'); if (!el) return;
  el.innerHTML = Object.keys(RTYPES).map((k) =>
    `<div class="typeCard${wiz.rt === k ? ' on' : ''}" data-rt="${k}"><b>${esc(RTYPES[k][lang()])}</b><span>${esc(TYPE_DESC[k][lang()])}</span></div>`).join('');
  el.querySelectorAll('.typeCard').forEach((c) => { c.onclick = () => wizardPickType(c.dataset.rt); });
}
function wizardGenId(rt) {
  let n = 1; while (memberById(rt + '-' + n)) n++;
  return rt + '-' + n;
}
function wizardPickType(rt) {
  wiz.rt = rt; wiz.lastTest = null;
  renderWizardTypes();
  $('wStep2').hidden = false;
  $('wStep34').hidden = false;
  $('wTestResult').innerHTML = ''; $('wDone').innerHTML = ''; $('wWarn').textContent = '';
  renderWizardForm();
}
function renderWizardForm() {
  const rt = wiz.rt; if (!rt) return;
  const en = lang() === 'en';
  const zoneOpts = Store.pkg.zones.map((z) => [z.id, zoneName(z)]);
  $('wForm').innerHTML =
    frow(en ? 'Name' : '资源名称', txt('wz-name', '', en ? 'e.g. My VPS / Main database' : '如 我的 VPS / 主数据库')) +
    frow('ID', txt('wz-id', wizardGenId(rt)) + `<span class="small muted">${en ? 'Auto-generated; editable, must be unique' : '自动生成，可改，须唯一'}</span>`) +
    frow(en ? 'Zone' : '所属区域', sel('wz-zone', zoneOpts, Store.pkg.zones[0] ? Store.pkg.zones[0].id : '')) +
    typeFieldsHtml('wz', rt, {});
  renderCredSlotFor('wz', rt, {});
  bindTypeFieldHooks('wz', rt, {});
}
$('wTest').onclick = async () => {
  const out = $('wTestResult');
  const en = lang() === 'en';
  if (!wiz.rt) return;
  const built = buildTestSpec('wz', wiz.rt, null);
  if (built.explain) { out.innerHTML = `<span class="warn">${esc(built.explain)}</span>`; return; }
  out.textContent = en ? 'Testing…' : '测试中…';
  try {
    const r = await Store.testConn(built.spec);
    wiz.lastTest = { ts: new Date().toISOString(), ok: r.ok, ms: r.ms, message: r.message };
    presentTestResult(out, r);
  } catch (e) {
    out.innerHTML = `<span class="warn">${en ? 'Test error: ' : '测试出错：'}${esc(e.message || e)}</span>`;
  }
};
$('wSave').onclick = async () => {
  const en = lang() === 'en';
  if (!wiz.rt) return;
  const name = $('wz-name').value.trim();
  const id = $('wz-id').value.trim();
  if (!name) { $('wWarn').textContent = en ? 'Give the resource a name first.' : '先给资源起个名称。'; return; }
  if (!/^[A-Za-z0-9_-]+$/.test(id)) { $('wWarn').textContent = en ? 'ID: letters/digits/-/_ only.' : 'ID 只能用字母、数字、连字符、下划线。'; return; }
  if (memberById(id)) { $('wWarn').textContent = (en ? 'ID already exists: ' : 'ID 已存在：') + id; return; }
  $('wWarn').textContent = '';
  const m = { id, name, rtype: wiz.rt, zone: $('wz-zone').value, tier: 'staff', reportsTo: null,
    status: 'idle', task: '', detail: '', notes: '', hasSecret: false, since: new Date().toISOString() };
  Object.assign(m, collectTypeFields('wz', wiz.rt));
  if (wiz.lastTest) {
    m.lastTest = wiz.lastTest;
    const brief = `${en ? 'Connection test' : '连接测试'}：${wiz.lastTest.ok ? (en ? 'OK' : '通') : (en ? 'Failed' : '不通')}（${wiz.lastTest.ms} ms）${wiz.lastTest.message}`;
    Store.pkg.events = Store.pkg.events || [];
    Store.pkg.events.push({ ts: wiz.lastTest.ts, member: id, type: 'note', from: 'idle', to: 'idle', brief, task: brief, by: 'console' });
  }
  Store.pkg.members.push(m);
  await save(false);
  try {
    if (await saveCredForMember(id, wiz.rt, 'wz')) { m.hasSecret = true; await Store.save(); }
  } catch (e) {
    $('wWarn').textContent = (en ? 'Resource saved, but credential save failed: ' : '资源已保存，但凭据保存失败：') + (e.message || e);
  }
  renderTable(); renderMembersForm();
  $('wDone').innerHTML = `<span class="ok">${en ? 'Saved as a resource: ' : '已保存为资源：'}${esc(name)}。${en ? 'You can view and edit it under Members.' : '可到「成员管理」查看与编辑。'}</span> ` +
    `<button type="button" class="btn small" id="wGoMembers">${en ? 'Open in Members' : '去成员管理查看'}</button> ` +
    `<button type="button" class="btn small" id="wAgain">${en ? 'Add another' : '再接入一个'}</button>`;
  $('wGoMembers').onclick = () => { switchSec('members'); pickMember(id); };
  $('wAgain').onclick = () => resetWizard();
  toast(L.saved);
};

/* ---------- 单个资源导入 / 导出（只新增、不覆盖整包） ---------- */
function downloadJson(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
$('mExportOne').onclick = () => {
  const m = memberById(curMember);
  const en = lang() === 'en';
  if (!m) { toast(en ? 'Select a member first' : '先选择一个成员'); return; }
  const note = en
    ? 'Credentials (password / API key / private key) are NOT included — they live only in secrets.json on the original machine. Re-enter them after import.'
    : '不含密码 / API Key / 私钥等凭据明文；凭据只保存在原电脑的 secrets.json 中，导入后请重新填入。';
  downloadJson({ format: 'ai-resource-member', version: 1, exportedAt: new Date().toISOString(), note, member: m }, `${m.id}.member.json`);
  toast((en ? 'Exported (no credentials): ' : '已导出（不含凭据）：') + m.name);
};
function importOneMember(obj) {
  const en = lang() === 'en';
  let m = null;
  if (obj && typeof obj === 'object') {
    if (obj.member && typeof obj.member === 'object') m = obj.member;
    else if (obj.id && obj.name) m = obj;
  }
  if (!m || !m.id || !m.name) throw new Error(en ? 'Not a single-resource file (needs a member object with id and name)' : '不是单个资源文件（需要带 id 与 name 的成员对象）');
  const pkg = Store.pkg;
  const nm = JSON.parse(JSON.stringify(m));
  let nid = String(nm.id);
  if (!/^[A-Za-z0-9_-]+$/.test(nid)) nid = 'member-import';
  if (memberById(nid)) { let n = 2; while (memberById(`${nid}-${n}`)) n++; nid = `${nid}-${n}`; }
  nm.id = nid;
  if (!zoneById(nm.zone)) nm.zone = pkg.zones[0] ? pkg.zones[0].id : nm.zone;
  if (nm.reportsTo && !memberById(nm.reportsTo)) nm.reportsTo = null;
  if (!STATUS[nm.status]) nm.status = 'idle';
  if (!TIER[nm.tier]) nm.tier = 'staff';
  nm.since = nm.since || new Date().toISOString();
  pkg.members.push(nm);
  return nm;
}
async function finishImportOne(nm) {
  curMember = nm.id;
  await save();
  renderMembersForm();
  toast((lang() === 'en' ? 'Imported (added only): ' : '已导入（只新增）：') + nm.name);
}
$('mImportFile').addEventListener('change', async (evt) => {
  const f = evt.target.files[0]; if (!f) return;
  try {
    const nm = importOneMember(JSON.parse(await f.text()));
    await finishImportOne(nm);
  } catch (e) {
    alert((lang() === 'en' ? 'Import failed: ' : '导入失败：') + (e.message || e));
  }
  evt.target.value = '';
});
$('mImportPaste').onclick = async () => {
  const t = $('mImportText').value.trim();
  if (!t) return;
  try {
    const nm = importOneMember(JSON.parse(t));
    $('mImportText').value = '';
    await finishImportOne(nm);
  } catch (e) {
    alert((lang() === 'en' ? 'Import failed: ' : '导入失败：') + (e.message || e));
  }
};

/* ---------- 区域管理 ---------- */
let curZone = null;
function renderZonesForm() {
  const pkg = Store.pkg;
  const pick = $('zPick');
  pick.innerHTML = pkg.zones.map((z) => `<option value="${esc(z.id)}">${esc(zoneName(z))}（${pkg.members.filter((m) => m.zone === z.id).length}/${z.capacity || '∞'}）</option>`).join('');
  if (!curZone || !zoneById(curZone)) curZone = pkg.zones[0]?.id || null;
  if (curZone) pick.value = curZone;
  pick.onchange = () => { curZone = pick.value; renderZoneFields(); };
  renderZoneFields();
}
function renderZoneFields() {
  const pkg = Store.pkg;
  const z = zoneById(curZone) || { id: '', name: '', nameEn: '', capacity: 10, cx: 0, cz: 0, w: 20, d: 16, color: '#7aa2f7', pod: '#2c3a56', layout: 'grid', round: false };
  const en = lang() === 'en';
  const num = (id, v) => `<input type="number" id="${id}" value="${v}" step="0.5">`;
  $('zForm').innerHTML =
    frow('ID', txt('zf-id', z.id, 'zone-1')) +
    frow(en ? 'Name (ZH)' : '区域名称（中文）', txt('zf-name', z.name)) +
    frow(en ? 'Name (EN)' : '区域名称（英文）', txt('zf-nameEn', z.nameEn)) +
    frow(en ? 'Capacity' : '容纳人数', num('zf-cap', z.capacity || 10)) +
    frow(en ? 'Center X / Z' : '中心位置 X / Z', num('zf-cx', z.cx) + num('zf-cz', z.cz)) +
    frow(en ? 'Width / Depth' : '大小 宽 / 深', num('zf-w', z.w) + num('zf-d', z.d)) +
    frow(en ? 'Layout' : '布局方式', sel('zf-layout', [['grid', en ? 'Grid desks' : '网格工位'], ['plots', en ? 'Individual plots (executives)' : '独立地块（高管式）'], ['round', en ? 'Round hall (GM)' : '圆形大厅（总经理式）']], z.layout || (z.round ? 'round' : 'grid'))) +
    frow(en ? 'Accent color' : '主题色', `<input type="color" id="zf-color" value="${esc(z.color || '#7aa2f7')}">`) +
    frow(en ? 'Floor color' : '地面色', `<input type="color" id="zf-pod" value="${esc(z.pod || '#2c3a56')}">`);
}
$('zSave').onclick = async () => {
  const pkg = Store.pkg;
  const id = $('zf-id').value.trim();
  const name = $('zf-name').value.trim();
  if (!id || !name) { $('zWarn').textContent = lang() === 'en' ? 'ID and name are required.' : 'ID 与名称必填。'; return; }
  if (!/^[A-Za-z0-9_-]+$/.test(id)) { $('zWarn').textContent = 'ID 只能用字母、数字、连字符、下划线。'; return; }
  if (id !== curZone && zoneById(id)) { $('zWarn').textContent = 'ID 已存在：' + id; return; }
  $('zWarn').textContent = '';
  const layout = $('zf-layout').value;
  const data = { id, name, nameEn: $('zf-nameEn').value.trim(), capacity: Math.max(0, parseInt($('zf-cap').value) || 0),
    cx: parseFloat($('zf-cx').value) || 0, cz: parseFloat($('zf-cz').value) || 0,
    w: Math.max(6, parseFloat($('zf-w').value) || 16), d: Math.max(6, parseFloat($('zf-d').value) || 16),
    color: $('zf-color').value, pod: $('zf-pod').value, layout, round: layout === 'round' };
  const existing = zoneById(curZone);
  if (existing) { Object.assign(existing, data); if (id !== curZone) for (const m of pkg.members) if (m.zone === curZone) m.zone = id; }
  else pkg.zones.push(data);
  curZone = id;
  await save(); renderZonesForm(); renderMembersForm();
};
$('zAdd').onclick = () => {
  let n = 1; while (zoneById('zone-' + n)) n++;
  curZone = null; $('zPick').value = ''; renderZoneFields();
  $('zf-id').value = 'zone-' + n; $('zf-name').value = ''; $('zf-name').focus();
};
$('zDel').onclick = async () => {
  const z = zoneById(curZone); if (!z) return;
  const inside = Store.pkg.members.filter((m) => m.zone === z.id);
  if (inside.length) { $('zWarn').textContent = (lang() === 'en' ? 'Zone still has members; move them first (Layout Map or member editor).' : '区域里还有成员，先把他们移走（布局示意图拖走，或在成员管理里改区域）再删。'); return; }
  if (Store.pkg.zones.length <= 1) { $('zWarn').textContent = lang() === 'en' ? 'Keep at least one zone.' : '至少保留一个区域。'; return; }
  if (!confirm((lang() === 'en' ? 'Delete zone ' : '删除区域 ') + zoneName(z) + '？')) return;
  Store.pkg.zones = Store.pkg.zones.filter((x) => x.id !== z.id);
  curZone = Store.pkg.zones[0]?.id || null;
  await save(); renderZonesForm(); renderMembersForm();
};

/* ---------- 布局示意图 ---------- */
const SVGNS = 'http://www.w3.org/2000/svg';
const WX = (x) => (x + 41) * 10, WZ = (z) => (z + 30) * 10;
const IX = (px) => px / 10 - 41, IZ = (py) => py / 10 - 30;
let layoutSel = null; // 选中的 zoneId
function svgEl(tag, attrs, parent) {
  const e = document.createElementNS(SVGNS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}
function svgPoint(evt) {
  const svg = $('layoutSvg');
  const pt = svg.createSVGPoint(); pt.x = evt.clientX; pt.y = evt.clientY;
  return pt.matrixTransform(svg.getScreenCTM().inverse());
}
function clampZone(z) {
  z.w = Math.min(80, Math.max(6, z.w)); z.d = Math.min(58, Math.max(6, z.d));
  z.cx = Math.min(40 - z.w / 2, Math.max(-40 + z.w / 2, z.cx));
  z.cz = Math.min(31 - z.d / 2, Math.max(-29 + z.d / 2, z.cz));
}
function renderLayout() {
  const pkg = Store.pkg;
  const svg = $('layoutSvg');
  svg.innerHTML = '';
  svgEl('rect', { x: 0, y: 0, width: 820, height: 620, fill: '#14161c' }, svg);
  // 成员小块位置：按所在区域网格排（与办公室落位同口径的简化版）
  const chipPos = new Map();
  for (const z of pkg.zones) {
    const ms = pkg.members.filter((m) => m.zone === z.id);
    const innerW = Math.max(1, z.w - 4), innerD = Math.max(1, z.d - 4);
    const cols = Math.max(1, Math.round(Math.sqrt(ms.length * (z.w / Math.max(1, z.d))))) || 1;
    ms.forEach((m, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      chipPos.set(m.id, { x: z.cx - innerW / 2 + (col + 0.5) * (innerW / cols), z: z.cz - innerD / 2 + (row + 0.5) * (innerD / Math.max(1, Math.ceil(ms.length / cols))) });
    });
  }
  for ( const z of pkg.zones) {
    const g = svgEl('g', {}, svg);
    const x = WX(z.cx - z.w / 2), y = WZ(z.cz - z.d / 2), w = z.w * 10, h = z.d * 10;
    const over = pkg.members.filter((m) => m.zone === z.id).length > (z.capacity || Infinity);
    const attrs = { x, y, width: w, height: h, rx: z.layout === 'round' ? w / 2 : 10, fill: z.pod || '#2c3a56', stroke: layoutSel === z.id ? '#fff' : (z.color || '#7aa2f7'), 'stroke-width': layoutSel === z.id ? 2.5 : 1.5, 'data-zone': z.id, cursor: 'move' };
    const rect = svgEl('rect', attrs, g);
    const label = svgEl('text', { x: x + w / 2, y: y + 20, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 700, fill: '#e8ecf3', 'pointer-events': 'none' }, g);
    label.textContent = zoneName(z);
    const cap = svgEl('text', { x: x + w / 2, y: y + 38, 'text-anchor': 'middle', 'font-size': 11, fill: over ? '#ffb35c' : '#8b93a3', 'pointer-events': 'none' }, g);
    cap.textContent = `${pkg.members.filter((m) => m.zone === z.id).length}/${z.capacity || '∞'}${over ? ' · ' + L.over : ''}`;
    const handle = svgEl('circle', { cx: x + w, cy: y + h, r: 8, fill: '#fff', stroke: '#3a6fd8', 'stroke-width': 2, cursor: 'nwse-resize', 'data-handle': z.id }, g);
    startZoneDrag(rect, z, 'move'); startZoneDrag(handle, z, 'resize');
    rect.addEventListener('pointerdown', () => { layoutSel = z.id; });
  }
  for (const m of pkg.members) {
    const p = chipPos.get(m.id); if (!p) continue;
    const z = zoneById(m.zone);
    const g = svgEl('g', { cursor: 'grab', 'data-chip': m.id }, svg);
    const wpx = Math.max(46, Math.min(110, m.name.length * 13 + 18));
    svgEl('rect', { x: WX(p.x) - wpx / 2, y: WZ(p.z) - 10, width: wpx, height: 20, rx: 9, fill: '#222836', stroke: (z && z.color) || '#7aa2f7' }, g);
    const t = svgEl('text', { x: WX(p.x), y: WZ(p.z) + 4.5, 'text-anchor': 'middle', 'font-size': 11.5, fill: '#e8ecf3', 'pointer-events': 'none' }, g);
    t.textContent = m.name;
    startChipDrag(g, m);
  }
  renderLayoutNums();
}
function renderLayoutNums() {
  const z = zoneById(layoutSel) || Store.pkg.zones[0];
  if (!z) { $('layoutNums').innerHTML = ''; return; }
  layoutSel = z.id;
  const n = (id, v) => `<input type="number" id="${id}" value="${v}" step="0.5" style="width:84px;background:#101218;color:#e6eaf1;border:1px solid #333a4e;border-radius:7px;padding:5px 8px">`;
  $('layoutNums').innerHTML = `<div class="frow"><label>${esc(zoneName(z))}</label>
    <span class="small muted">X</span>${n('ln-cx', z.cx)}<span class="small muted">Z</span>${n('ln-cz', z.cz)}
    <span class="small muted">${lang() === 'en' ? 'W' : '宽'}</span>${n('ln-w', z.w)}<span class="small muted">${lang() === 'en' ? 'D' : '深'}</span>${n('ln-d', z.d)}
    <span class="small muted">${L.capacity}</span>${n('ln-cap', z.capacity || 0)}</div>`;
  for (const [id, key] of [['ln-cx', 'cx'], ['ln-cz', 'cz'], ['ln-w', 'w'], ['ln-d', 'd'], ['ln-cap', 'capacity']]) {
    $(id).onchange = async () => { z[key] = parseFloat($(id).value) || 0; clampZone(z); await save(false); toast(L.saved); renderLayout(); renderZonesForm(); };
  }
}
function startZoneDrag(el, z, mode) {
  el.addEventListener('pointerdown', (evt) => {
    if (document.body.classList.contains('remote')) return;
    evt.preventDefault(); el.setPointerCapture(evt.pointerId);
    layoutSel = z.id;
    const p0 = svgPoint(evt); const z0 = { cx: z.cx, cz: z.cz, w: z.w, d: z.d };
    // 拖动期间不整表重渲染（会销毁被拖元素、丢指针捕获）：只就地更新本区域的图形属性，
    // 且只改草稿值 cur，z 本体在 pointerup 提交前保持不动；取消拖拽时重绘即恢复原状。
    const g = el.closest('g');
    const rect = g ? g.querySelector('rect') : null;
    const texts = g ? g.querySelectorAll('text') : [];
    const handle = g ? g.querySelector('circle') : null;
    let cur = { ...z0 };
    const paint = () => {
      if (!rect) return;
      const x = WX(cur.cx - cur.w / 2), y = WZ(cur.cz - cur.d / 2), w = cur.w * 10, h = cur.d * 10;
      rect.setAttribute('x', x); rect.setAttribute('y', y);
      rect.setAttribute('width', w); rect.setAttribute('height', h);
      if (z.layout === 'round') rect.setAttribute('rx', w / 2);
      if (texts[0]) { texts[0].setAttribute('x', x + w / 2); texts[0].setAttribute('y', y + 20); }
      if (texts[1]) { texts[1].setAttribute('x', x + w / 2); texts[1].setAttribute('y', y + 38); }
      if (handle) { handle.setAttribute('cx', x + w); handle.setAttribute('cy', y + h); }
      const setNum = (id, v) => { const n = $(id); if (n) n.value = v; };
      setNum('ln-cx', cur.cx); setNum('ln-cz', cur.cz); setNum('ln-w', cur.w); setNum('ln-d', cur.d);
    };
    const move = (e) => {
      const p = svgPoint(e);
      const t = { ...z0 };
      if (mode === 'move') { t.cx = Math.round((z0.cx + IX(p.x) - IX(p0.x)) * 2) / 2; t.cz = Math.round((z0.cz + IZ(p.y) - IZ(p0.y)) * 2) / 2; }
      else { t.w = Math.round((z0.w + (IX(p.x) - IX(p0.x))) * 2) / 2; t.d = Math.round((z0.d + (IZ(p.y) - IZ(p0.y))) * 2) / 2; }
      clampZone(t); cur = t; paint();
    };
    const cleanup = () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', cancel); };
    const up = async () => {
      cleanup();
      z.cx = cur.cx; z.cz = cur.cz; z.w = cur.w; z.d = cur.d;
      await save(false); toast(L.saved); renderLayout(); renderZonesForm();
    };
    const cancel = () => { cleanup(); renderLayout(); };
    el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', cancel);
  });
}
function startChipDrag(g, m) {
  g.addEventListener('pointerdown', (evt) => {
    if (document.body.classList.contains('remote')) return;
    evt.preventDefault(); g.setPointerCapture(evt.pointerId);
    let last = null;
    const move = (e) => { const p = svgPoint(e); last = { x: IX(p.x), z: IZ(p.y) }; g.setAttribute('opacity', 0.55); };
    const up = async () => {
      g.removeEventListener('pointermove', move); g.removeEventListener('pointerup', up);
      g.setAttribute('opacity', 1);
      if (last) {
        const target = Store.pkg.zones.find((z) => Math.abs(last.x - z.cx) <= z.w / 2 && Math.abs(last.z - z.cz) <= z.d / 2);
        if (target && target.id !== m.zone) { m.zone = target.id; await save(false); toast(L.saved); renderMembersForm(); }
      }
      renderLayout();
    };
    g.addEventListener('pointermove', move); g.addEventListener('pointerup', up);
  });
}

/* ---------- 台词库 ---------- */
function renderLines() {
  const pkg = Store.pkg;
  const groups = [['wake', lang() === 'en' ? 'Wake lines' : '赖床台词'], ['work', lang() === 'en' ? 'Work lines' : '打工台词'], ['urge', lang() === 'en' ? 'Urge lines' : '催促台词']];
  $('linesForms').innerHTML = groups.map(([k, label]) =>
    `<div class="frow" style="align-items:flex-start"><label>${label} · 中文</label><textarea class="lines" id="lines-${k}-zh">${esc((pkg.lines?.[k]?.zh || []).join('\n'))}</textarea></div>
     <div class="frow" style="align-items:flex-start"><label>${label} · EN</label><textarea class="lines" id="lines-${k}-en">${esc((pkg.lines?.[k]?.en || []).join('\n'))}</textarea></div>`).join('');
}
$('lSave').onclick = async () => {
  const pkg = Store.pkg;
  pkg.lines = pkg.lines || {};
  for (const k of ['wake', 'work', 'urge']) {
    pkg.lines[k] = {
      zh: $('lines-' + k + '-zh').value.split('\n').map((s) => s.trim()).filter(Boolean),
      en: $('lines-' + k + '-en').value.split('\n').map((s) => s.trim()).filter(Boolean),
    };
  }
  await save();
};

/* ---------- 数据管理 ---------- */
$('dExport').onclick = () => {
  const blob = new Blob([JSON.stringify(Store.pkg, null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'ai-resource-console-data.json';
  a.click();
  URL.revokeObjectURL(a.href);
};
$('dImportFile').addEventListener('change', async (evt) => {
  const f = evt.target.files[0]; if (!f) return;
  try {
    const obj = JSON.parse(await f.text());
    if (!obj || !Array.isArray(obj.members) || !Array.isArray(obj.zones)) throw new Error('格式不对：缺 members/zones');
    if (!confirm(lang() === 'en' ? 'Import will REPLACE all current data. Continue?' : '导入将覆盖当前全部数据，继续？')) return;
    obj.settings = Object.assign({ bubbles: true, names: true, lang: 'zh', dataMode: 'local', remote: { stateUrl: '', eventsUrl: '' } }, obj.settings || {});
    obj.events = obj.events || []; obj.lines = obj.lines || {};
    obj.appName = obj.appName || 'AI工作资源管理台';
    Store.pkg = obj;
    await Store.save();
    try { await Store.secretOp({ clearAll: true }); } catch (e) {}  // 凭据不跟随数据包：整包导入后本机旧凭据一并清空，避免与新数据串味
    location.reload();
  } catch (e) {
    alert((lang() === 'en' ? 'Import failed: ' : '导入失败：') + (e.message || e));
  }
});
$('dReset').onclick = async () => {
  if (!confirm(lang() === 'en' ? 'Restore factory demo data? Current data will be replaced.' : '恢复出厂演示数据？当前数据会被替换。')) return;
  Store.pkg = await Store.loadSeed();
  await Store.save();
  try { await Store.secretOp({ clearAll: true }); } catch (e) {}
  location.reload();
};
$('dClear').onclick = async () => {
  if (!confirm(lang() === 'en' ? 'Clear ALL members and events?' : '清空全部成员与事件？')) return;
  if (!confirm(lang() === 'en' ? 'Really clear? Export a backup first if needed.' : '再确认一次：真的清空？需要的话先导出备份。')) return;
  const pkg = Store.pkg;
  pkg.members = []; pkg.events = [];
  pkg.zones = [{ id: 'main', name: '主区域', nameEn: 'Main Area', cx: 0, cz: 2, w: 40, d: 30, round: false, layout: 'grid', capacity: 30, color: '#7aa2f7', pod: '#2c3a56' }];
  await Store.save();
  try { await Store.secretOp({ clearAll: true }); } catch (e) {}
  location.reload();
};

/* ---------- 启动 ---------- */
(async function boot() {
  try {
    await Store.load();
    try { SecretsMap = await Store.loadSecrets(); } catch (e) { SecretsMap = {}; }
  } catch (e) {
    const f = $('fatal');
    f.style.display = 'block';
    f.innerHTML = '程序数据加载失败。请用文件夹里的启动脚本打开本程序（Windows 双击 start-windows.bat，Mac 双击 start-mac.command），不要直接双击 HTML 文件。<br>Failed to load data. Please launch via the start script in this folder instead of opening the HTML file directly.';
    return;
  }
  applyI18n(); renderModeBadge(); renderTable(); renderHelp();
  bindGeneral(); bindSource(); renderWizardTypes(); bindDeploy(); loadHealth(); renderMembersForm(); renderZonesForm(); renderLines();
})();
