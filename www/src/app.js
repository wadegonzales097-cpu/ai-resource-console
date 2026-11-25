// AI工作资源管理台 · 办公室视图（3D/2D 双视图）
// 数据来自本程序的数据包（本地服务 /api/data；实时模式经 /api/proxy 拉使用者自填的远程接口），每 3 秒轮询。
// 区域、成员归属、层级、台词、语言与显示开关全部由数据包配置（见 applyPackage），本文件不写死任何名单与房间。
// 布局只算一份：3D 与 2D 共用同一套落位坐标；区域大小/位置改后整页自动重载重排。
import * as THREE from 'three';

/* ================= 常量与布局 ================= */
const STATUS_META = {
  working: { cn: '工作中', en: 'Working', color: '#4ade80' },
  idle:    { cn: '空闲',   en: 'Idle',    color: '#9aa3b2' },
  sleepy:  { cn: '休眠',   en: 'Sleeping', color: '#e0af68' },
  offline: { cn: '离线',   en: 'Offline', color: '#525a66' },
};
// 区域形态：layout=round 的区域渲染为中央圆厅（总经理室），其余为矩形 pod；
// layout=plots 的区域按人均分独立地块（落位见 execDesks、渲染按 rt.plot 逐块画），layout=grid 的区域网格排工位。
// 区域数量、位置、尺寸、人数全部来自数据包 zones[]，本文件不预设任何房间。
// ===== 配置驱动：区域 / 归属 / 层级 / 开关全部来自数据包（applyPackage 填充） =====
let ROOM_DEFS = [];
let ROOM_MAP = {};
let GM_ROOM = null;
let GM_ID = null;            // 总经理（tier=gm 的成员 id，applyPackage 时确定）
let ZONE_BY_MEMBER = {};     // memberId -> zoneId（本地数据包的成员档案）
let TIER_BY_MEMBER = {};     // memberId -> 0 总经理 / 1 高管 / 2 员工
let BUBBLES_ON = true;       // 头顶说话气泡开关
let NAMES_ON = true;         // 头顶名称显示开关
let LANG = 'zh';             // 'zh' | 'en'
function zoneDisplayName(z) { return LANG === 'en' ? (z.nameEn || z.name) : z.name; }
function roomOf(m) {
  const zid = ZONE_BY_MEMBER[m.id] || m.zone;
  return ROOM_DEFS.find((z) => z.id === zid)
    || ROOM_DEFS.find((z) => z.layout === 'grid')
    || ROOM_DEFS[0];
}

// 睡着＝不在线（sleepy / offline 同一口径：趴桌＋Zzz 泡泡＋灯灭）
const isSleeping = (st) => st === 'sleepy' || st === 'offline';

/* ================= 监工台词池（内置兜底默认值；数据包 lines 存在时按当前语言覆盖，见 applyPackage） ================= */
// 赖床台词：被叫醒员叫的人说的（42 句；v8 扩充 12 句，素材取自网络赖床段子、按办公室场景改编）
let WAKE_LINES = [
  '你烦死了，让我再睡五分钟', '别打扰老娘美梦，正梦到发工资呢', '我没睡，我在闭目养神攒大招',
  '再喊我就装听不见了啊', '梦里需求都写完了，醒来再说', '我的桌子有引力，起不来',
  '刚梦到升职加薪，你赔我', '别摇了，脑浆要摇匀了', '我这是深度待机，省电模式',
  '五分钟，就五分钟，骗人是小狗', '工资还没梦到账呢，急什么', '我在梦里已经把活干完了',
  '谁把闹钟调成真人版了', '眼睛说它还没开机成功', '让灵魂再飘一会儿，肉身随后就到',
  '我睡我的，你忙你的，互不打扰', '刚才那个梦刚到精彩部分！', '别催，充电中，电量百分之一',
  '我这是为工作保存体力，懂不懂', '梦里老板都夸我效率高了', '醒了醒了……（翻个身继续）',
  '我的眼皮有自己的想法', '先让我把梦的结局看完', '你声音比闹钟还敬业',
  '工位就是我的第二张床', '睡个午觉怎么了，我又没睡年终奖', '头好沉，里面全是没写完的代码',
  '再睡三分钟，起来我干翻全场', '我没偷懒，我在梦里加班', '美梦刚开始你就来，存心的吧',
  '被子生病了，我得留下来照顾它', '不是我想赖床，是床赖着我不放', '起床靠爆发力，我爆发力还在冷却',
  '看时间不是为了起床，是看还能睡多久', '我和床正热恋呢，闹钟非要拆散我们', '春困秋乏夏打盹，我是全年无休地困',
  '昨天我起过床了，今天能不能免了', '灵魂已经开机了，身体还在加载更新', '再睡两分钟，梦里还有个会没开完',
  '床把我封印了，解封需要一杯咖啡', '我不是起不来，我在给床面子', '我的工位就在梦里，马上到岗',
];
// 打工台词：被催活员催的人说的（42 句；v8 扩充 12 句，素材取自网络打工段子、按办公室场景改编）
let WORK_LINES = [
  '我已经加了十小时班了', '你把我杀了算了', '在干了在干了，键盘都冒烟了',
  '我这双手已经不是我的了', '咖啡当水喝，我容易吗', '再催我就原地升天',
  '我的发际线就是工龄证明', '活是干不完的，命是自己的', '好的好的，这就把命搭上',
  '我和电脑，总有一个先崩溃', '别站后面看，压力山大', '已经在用意念敲键盘了',
  '这活干完，我申请长眠', '我不是牛马，我是永动机本机', '催催催，福气都被你催跑了',
  '手速已经开到二倍速了', '我上辈子肯定欠公司的', '干完这票，我就……继续干下一票',
  '眼睛已经自动打码了', '我的椅子都坐出感情了', '别催，CPU 过热要死机了',
  '这不是加班，这是渡劫', '我干活的速度赶不上你催的速度', '灵魂已经下班了，肉身在硬撑',
  '给我口吃的，我还能再战', '我这是用生命在交付', '再催我就把进度条画给你看',
  '十指已经敲出残影了', '老板画的饼，我都吃三年了', '干干干，我上辈子是台打印机吧',
  '有加班费叫加班，没加班费那叫捐肝', '别跟我谈理想，我的理想是不上班', '做一天牛马，发一天疯，我很稳定',
  '骨干就是骨头打断了，还得接着干', '工资是续命费，我这条命又续上了', '乞丐看天气要饭，我看天气也得上班',
  '明日复明日，需求何其多，不如再拖拖', '键盘都磨秃了，我盲打全靠肌肉记忆', '公司招了我，就要承担便宜没好货的风险',
  '一边骂骂咧咧，一边把活干完，这就是我', '三千块想招玉皇大帝？先把我当人看', '我的工位是打卡景点，我一天来打两次',
];
// 催活员自己的通用催促（对方没有具体 task 时用）
let URGE_LINES = [
  '干活干活，别磨蹭！', '进度呢？动起来！', '别发呆，活还多着呢！',
  '手脚麻利点！', '起来嗨，需求在等你！', '摸鱼时间结束啦！',
];
const CENTER = { x: 0, z: 1 };               // 全场中心（总经理室圆心略偏）
const GM_ANCHOR = { x: 0, z: 4.6 };       // 总经理座位（圆厅中心南侧，面向圆心；applyPackage 按圆厅位置重算）
const WS = 1.45; // v3：工位整体放大系数（人物＋桌椅同锚点等比放大，相对比例不变、相对 pod 变大）
// 汇报连线（2D）：总经理连向所有高管（tier=1），名单在 buildTwoD 里按 TIER_BY_MEMBER 动态取
const CJK = /[\u3040-\u9fff\uf900-\ufaff]/;
const hasCJK = (s) => CJK.test(s);

// 世界坐标 -> 2D SVG 坐标（俯视：x 向右，z 向下）
// 2D 俯视映射（契约 §5 固定世界系：x∈[-41,41]、z∈[-30,32]，设置端负责钳制区域不出界）
const S2 = (x) => (x + 41) * 10;
const S2z = (z) => (z + 30) * 10;

/* ================= 运行时状态 ================= */
let roster = new Map();      // id -> rt（运行时对象）
let rosterOrder = [];        // 按花名册顺序的 id 列表
let events = [];             // 全部事件（时间正序）
let selectedId = null;       // 面板/场景共同的选中成员
let view = '3d';             // 当前视图
let pageLoadTs = Date.now(); // 此刻之后的新 task_start 才触发信封动画（种子事件不重播）

function deskSlots(zone, n) {
  // 在 pod 内按网格排工位（锚点=人坐的位置），返回 [{x,z}]
  const innerW = zone.w - 4.2, innerD = zone.d - 4.2;
  const cols = Math.max(1, Math.round(Math.sqrt(n * (zone.w / zone.d))));
  const rows = Math.ceil(n / cols);
  const out = [];
  for (let i = 0; i < n; i++) {
    const col = i % cols, row = Math.floor(i / cols);
    out.push({
      x: zone.c[0] - innerW / 2 + (col + 0.5) * (innerW / cols),
      z: zone.c[1] - innerD / 2 + (row + 0.5) * (innerD / rows),
    });
  }
  return out;
}

// 高管室专属落位（v5 用户要求）：三位高管一人一块独立地块、并排排列，各自有地盘——
// 领地内按人数均分地块（块间留缝），锚点落在地块中心略靠后处；渲染层按 rt.plot 逐块画 pod（3D/2D 同）
function execDesks(zone, ms) {
  const gap = 1.4;
  const plotW = Math.min(10.2, (zone.w - (ms.length - 1) * gap) / Math.max(1, ms.length));
  const plotD = Math.min(13, zone.d - 3);
  const totalW = plotW * ms.length + gap * (ms.length - 1);
  return ms.map((m, i) => {
    const cx = zone.c[0] - totalW / 2 + plotW / 2 + i * (plotW + gap);
    const cz = zone.c[1];
    const dx = CENTER.x - cx, dz = CENTER.z - cz;
    const len = Math.hypot(dx, dz) || 1;
    return {
      anchor: { x: cx - (dx / len) * 0.65, z: cz - (dz / len) * 0.65 },
      plot: { x: cx, z: cz, w: plotW, d: plotD },
    };
  });
}

function buildRuntime(state) {
  roster = new Map(); rosterOrder = [];
  computePatrolPoints();
  const byRoom = new Map(ROOM_DEFS.map((z) => [z.id, []]));
  for (const m of state.members) {
    if (m.id === GM_ID) continue;
    byRoom.get(roomOf(m).id)?.push(m);
  }
  const mk = (m, anchor, slot = 0) => {
    const fwd = (() => {
      const dx = CENTER.x - anchor.x, dz = CENTER.z - anchor.z;
      const len = Math.hypot(dx, dz) || 1;
      return { x: dx / len, z: dz / len };
    })();
    const rt = {
      id: m.id, data: { ...m }, room: roomOf(m), slot,
      anchor, fwd,
      angle: Math.atan2(fwd.x, fwd.z), // three.js rotation.y（+Z 朝向房间中心）
      desk: { x: anchor.x + fwd.x * 1.3, z: anchor.z + fwd.z * 1.3 },
      sim: { x: anchor.x, z: anchor.z, tx: anchor.x, tz: anchor.z, wait: Math.random() * 4, heading: Math.atan2(fwd.x, fwd.z), phase: Math.random() * Math.PI * 2 },
      three: {}, svg: {},
      recentLines: { wake: [], work: [] }, // 台词短期去重（监工用）
    };
    roster.set(m.id, rt); rosterOrder.push(m.id);
    return rt;
  };
  for (const z of ROOM_DEFS) {
    if (z.round) { // 圆厅：总经理坐专座（本函数末尾统一处理），其余成员沿圆环排座，一个不丢
      const ms = byRoom.get(z.id) || [];
      ms.forEach((m, i) => {
        const a = (i / Math.max(1, ms.length)) * Math.PI * 2 - Math.PI / 2;
        mk(m, { x: z.c[0] + Math.cos(a) * z.r * 0.52, z: z.c[1] + Math.sin(a) * z.r * 0.52 }, i);
      });
      continue;
    }
    const ms = byRoom.get(z.id) || [];
    if (z.layout === 'plots') { // 一人一块独立地块（见 execDesks），rt.plot 供渲染层逐块画 pod
      execDesks(z, ms).forEach((e, i) => { const rt = mk(ms[i], e.anchor, i); rt.plot = e.plot; });
      continue;
    }
    const slots = deskSlots(z, ms.length);
    ms.forEach((m, i) => mk(m, slots[i], i));
  }
  const gmData = state.members.find((m) => m.id === GM_ID);
  if (gmData) mk(gmData, { ...GM_ANCHOR }, 0);
}

/* ================= 面板（两种视图共用） ================= */
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hhmm = (ts) => (ts || '').slice(11, 16);

function memberLine(m) {
  if (m.status === 'working') return m.task || STATUS_META.working.cn;
  if (m.status === 'idle') return STATUS_META.idle.cn;
  if (m.status === 'sleepy') return LANG === 'en' ? 'Sleeping, wakeable' : '休眠待唤醒';
  return STATUS_META.offline.cn;
}

function renderPanel() {
  const counts = { working: 0, idle: 0, sleepy: 0, offline: 0 };
  for (const id of rosterOrder) counts[roster.get(id).data.status]++;
  $('counts').innerHTML =
    `<span class="dot" style="background:${STATUS_META.working.color}"></span>${STATUS_META.working.cn} <b>${counts.working}</b>` +
    `<span class="dot" style="background:${STATUS_META.idle.color}"></span>${STATUS_META.idle.cn} <b>${counts.idle}</b>` +
    `<span class="dot" style="background:${STATUS_META.sleepy.color}"></span>${STATUS_META.sleepy.cn} <b>${counts.sleepy}</b>` +
    `<span class="dot" style="background:${STATUS_META.offline.color}"></span>${STATUS_META.offline.cn} <b>${counts.offline}</b>`;

  const order = { working: 0, idle: 1, sleepy: 2, offline: 3 };
  const ids = [...rosterOrder].sort((a, b) => {
    const ra = roster.get(a), rb = roster.get(b);
    const za = ROOM_DEFS.findIndex((z) => z.name === ra.room.name);
    const zb = ROOM_DEFS.findIndex((z) => z.name === rb.room.name);
    return za - zb || order[ra.data.status] - order[rb.data.status];
  });
  $('members').innerHTML = ids.map((id) => {
    const m = roster.get(id).data;
    const meta = STATUS_META[m.status];
    return `<div class="mrow${selectedId === id ? ' sel' : ''}${m.status === 'offline' ? ' off' : ''}" data-id="${id}">
      <span class="dot" style="background:${meta.color}"></span>
      <span class="nm">${esc(m.name)}</span>
      <span class="tk">${esc(memberLine(m))}</span></div>`;
  }).join('');
  for (const el of $('members').querySelectorAll('.mrow')) {
    el.addEventListener('click', () => select(selectedId === el.dataset.id ? null : el.dataset.id, true));
  }
  $('clearFilter').style.display = selectedId ? 'inline' : 'none';
  renderEvents();
}

function eventText(ev) {
  switch (ev.type) {
    case 'task_start': return `开始：${ev.task}`;
    case 'task_done': return `完成：${ev.task}`;
    case 'task_update': return `任务更新：${ev.task}`;
    case 'status_change': {
      const a = STATUS_META[ev.from]?.cn || ev.from, b = STATUS_META[ev.to]?.cn || ev.to;
      return ev.task ? `${a} → ${b}：${ev.task}` : `状态变更：${a} → ${b}`;
    }
    case 'note': return ev.task;
    case 'dispatch': {
      const f = roster.get(ev.from)?.data.name || ev.from || '';
      return `派活（${f} 发出）：${ev.brief || ev.task || ''}`;
    }
    case 'feedback': {
      const t = roster.get(ev.to)?.data.name || ev.to || '';
      return `回报（给 ${t}）：${ev.brief || ev.task || ''}`;
    }
    default: return ev.task || ev.type;
  }
}

function renderEvents() {
  // 按人筛选时，派活/回报事件按发出方与接收方都算（其 from/to 是成员 id；状态类事件的 from/to 是状态名，不会撞 id）
  const list = selectedId ? events.filter((e) => e.member === selectedId || e.from === selectedId || e.to === selectedId) : events;
  $('evCount').textContent = list.length ? `${list.length} 条` : '';
  if (!list.length) { $('events').innerHTML = '<div class="empty">暂无事件</div>'; return; }
  $('events').innerHTML = [...list].reverse().slice(0, 150).map((ev) => {
    const rt = roster.get(ev.member);
    const name = rt ? rt.data.name : ev.member;
    const color = rt?.room ? rt.room.accent : '#9aa3b2';
    // v13：派活/回报的详细信息（detail）跟在摘要行下面全文显示——信上只带一句话摘要，详情看这里
    const dtl = (ev.type === 'dispatch' || ev.type === 'feedback') && ev.detail && ev.detail !== (ev.brief || ev.task)
      ? `<div style="color:#8b93a3;font-size:12px;margin-top:2px;white-space:pre-wrap">${esc(ev.detail)}</div>` : '';
    return `<div class="ev${ev.type === 'note' ? ' note' : ''}"><span class="tm">${hhmm(ev.ts)}</span><span class="who" style="color:${color}">${esc(name)}</span><span class="tx">${esc(eventText(ev))}</span>${dtl}</div>`;
  }).join('');
}

function select(id, focus) {
  selectedId = id;
  renderPanel();
  applySelectionVisual();
  if (id && focus) focusMember(id);
}
$('clearFilter').addEventListener('click', () => select(null, false));

/* ================= 数据加载与轮询 ================= */
/* ===== 数据包 -> 运行时配置 ===== */
let PKG = null;      // 本地数据包（配置与本地数据的唯一来源）
let PKG_SIG = '';    // 结构签名：区域/名单/归属/层级/语言/名称开关变化时整页重载重排
let REMOTE_DOWN = false;

function applyPackage(pkg) {
  const s = pkg.settings || {};
  LANG = s.lang === 'en' ? 'en' : 'zh';
  BUBBLES_ON = s.bubbles !== false;
  NAMES_ON = s.names !== false;
  ROOM_DEFS = (pkg.zones || []).map((z) => ({
    id: z.id, name: zoneDisplayName(z), nameZh: z.name, nameEn: z.nameEn || z.name,
    c: [Number(z.cx) || 0, Number(z.cz) || 0],
    w: Math.max(6, Number(z.w) || 16), d: Math.max(6, Number(z.d) || 16),
    round: !!z.round, r: Math.min(Number(z.w) || 16, Number(z.d) || 16) / 2,
    pod: parseInt(String(z.pod || '#33354d').replace('#', ''), 16) || 0x33354d,
    flat: z.pod || '#33354d', accent: z.color || '#7aa2f7',
    layout: z.layout || (z.round ? 'round' : 'grid'), capacity: Number(z.capacity) || 0,
  }));
  ROOM_MAP = Object.fromEntries(ROOM_DEFS.map((z) => [z.name, z]));
  GM_ROOM = ROOM_DEFS.find((z) => z.layout === 'round') || ROOM_DEFS[0] || null;
  ZONE_BY_MEMBER = {}; TIER_BY_MEMBER = {}; GM_ID = null;
  for (const m of pkg.members || []) {
    if (m.zone) ZONE_BY_MEMBER[m.id] = m.zone;
    TIER_BY_MEMBER[m.id] = m.tier === 'gm' ? 0 : m.tier === 'exec' ? 1 : 2;
    if (m.tier === 'gm' && !GM_ID) GM_ID = m.id;
  }
  if (!GM_ID) GM_ID = (pkg.members || [])[0]?.id || 'gm';
  const pick = (o) => (o && (o[LANG] || o.zh)) || null;
  if (pkg.lines) {
    WAKE_LINES = pick(pkg.lines.wake) || WAKE_LINES;
    WORK_LINES = pick(pkg.lines.work) || WORK_LINES;
    URGE_LINES = pick(pkg.lines.urge) || URGE_LINES;
  }
  if (GM_ROOM) {
    CENTER.x = GM_ROOM.c[0]; CENTER.z = GM_ROOM.c[1];
    GM_ANCHOR.x = GM_ROOM.c[0]; GM_ANCHOR.z = GM_ROOM.c[1] + 3.6;
  }
  if (LANG === 'en') for (const k of Object.keys(STATUS_META)) STATUS_META[k].cn = STATUS_META[k].en;
  localizeChrome(pkg);
}

function localizeChrome(pkg) {
  const en = LANG === 'en';
  const set = (id, zh, enT) => { const el = $(id); if (el) el.textContent = en ? enT : zh; };
  const ht = $('hudTitle'); if (ht) ht.textContent = pkg.appName || (en ? 'AI Resource Console' : 'AI工作资源管理台');
  document.title = (pkg.appName || 'AI Resource Console') + (en ? ' · Office' : ' · 办公室');
  set('panelTitle', '动态消息流', 'Live Feed');
  set('panelSub', '每 3 秒同步状态与事件', 'Syncing status & events every 3s');
  set('secMembers', '成员状态', 'Members');
  set('secEvents', '事件流', 'Events');
  set('clearFilter', '清除筛选 ✕', 'Clear filter ✕');
  set('resetView', '复位视角', 'Reset view');
  set('hint', '拖动旋转 · 滚轮缩放 · 点成员或右侧名单定位', 'Drag to orbit · Scroll to zoom · Click a member to focus');
}

function updateModeBanner() {
  const el = $('modeBanner'); if (!el) return;
  const s = (PKG && PKG.settings) || {};
  if (s.dataMode === 'remote' && REMOTE_DOWN) {
    el.style.display = 'block';
    el.textContent = LANG === 'en'
      ? 'Live data source unreachable — showing local data instead. Check Settings → Data Source.'
      : '实时数据源连接失败，正在展示本地数据。请到「设置 → 数据源」检查地址。';
  } else if (s.dataMode === 'remote') {
    el.style.display = 'block';
    el.textContent = LANG === 'en' ? 'Live mode (read-only): showing remote data.' : '实时模式（只读）：正在展示远程数据。';
    el.className = 'ok';
  } else {
    el.style.display = 'none';
  }
}

async function fetchData() {
  const r = await fetch(`/api/data?t=${Date.now()}`, { cache: 'no-store' });
  if (!r.ok) throw new Error('local data failed');
  const pkg = await r.json();
  const sig = JSON.stringify([
    pkg.zones, (pkg.members || []).map((m) => [m.id, m.zone, m.tier, m.name]),
    (pkg.settings || {}).lang, (pkg.settings || {}).names,
  ]);
  if (PKG && sig !== PKG_SIG) { location.reload(); throw new Error('config changed, reloading'); }
  PKG = pkg; PKG_SIG = sig;
  applyPackage(pkg);
  const s = pkg.settings || {};
  if (s.dataMode === 'remote' && s.remote && s.remote.stateUrl) {
    try {
      const [sr, er] = await Promise.all([
        fetch('/api/proxy?url=' + encodeURIComponent(s.remote.stateUrl), { cache: 'no-store' }),
        fetch('/api/proxy?url=' + encodeURIComponent(s.remote.eventsUrl || ''), { cache: 'no-store' }),
      ]);
      if (!sr.ok) throw new Error('remote state failed');
      const state = await sr.json();
      let evs = [];
      if (er.ok) {
        const text = await er.text();
        evs = text.split('\n').filter((l) => l.trim()).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
      }
      REMOTE_DOWN = false; updateModeBanner();
      return { state, evs };
    } catch (e) {
      REMOTE_DOWN = true; updateModeBanner();
      // 回退本地数据展示（不白屏）
    }
  }
  return { state: { members: pkg.members || [] }, evs: pkg.events || [] };
}

async function poll(first) {
  try {
    const { state, evs } = await fetchData();
    $('loadErr').style.display = 'none';
    if (first) {
      buildRuntime(state);
      buildThree();
      buildTwoD();
      events = evs;
      renderPanel();
      for (const id of rosterOrder) applyStateVisual(roster.get(id));
      applySelectionVisual();
      // 飞书补播：刚打开页面时，把最近 10 分钟内的 dispatch / feedback 事件依次补播一遍
      // （最多最近 4 条），这样部署/派活后刷新页面就能看到一来一回；更早的只进事件流面板
      const cutoff = Date.now() - 10 * 60 * 1000;
      evs.filter((e) => (e.type === 'dispatch' || e.type === 'feedback') && Date.parse(e.ts) >= cutoff)
        .slice(-4)
        .forEach((ev, i) => queueLetter(ev, 0.9 + i * 5.2)); // v13：信飞得慢（4.2–6 秒），补播间隔随之放宽，一封看完再来下一封
      return;
    }
    if (state.members.length !== rosterOrder.length) { location.reload(); return; }
    // 状态增量
    let changed = false;
    for (const m of state.members) {
      const rt = roster.get(m.id);
      if (!rt) continue;
      if (rt.data.status !== m.status || rt.data.task !== m.task || rt.data.since !== m.since) {
        rt.data = { ...m };
        applyStateVisual(rt);
        changed = true;
      }
    }
    // 事件增量（追加写，只认新增尾部）
    if (evs.length > events.length) {
      const fresh = evs.slice(events.length);
      events = evs;
      changed = true;
      for (const ev of fresh) {
        if (ev.type === 'task_start' && ev.member !== GM_ID && Date.parse(ev.ts) >= pageLoadTs - 5000) {
          flyEnvelope(ev.member);
        }
        if ((ev.type === 'dispatch' || ev.type === 'feedback') && Date.parse(ev.ts) >= pageLoadTs - 5000) {
          queueLetter(ev, 0);
        }
      }
    }
    if (changed) renderPanel();
  } catch (e) {
    $('loadErr').style.display = 'block';
  }
}

/* ================= 3D 场景 ================= */
let renderer, scene3, camera, raycaster;
let camTarget = new THREE.Vector3(0, 0, 3);
let camSph = { radius: 66, phi: 0.94, theta: 0 };
let camAnim = null;
let ringSel = null;
const hitProxies = [];

const GEO = {
  // 人物（v2 精细化：髋/肩/肘三级关节）
  leg: new THREE.CylinderGeometry(0.105, 0.12, 0.88, 8),
  shoe: new THREE.BoxGeometry(0.17, 0.09, 0.32),
  pelvis: new THREE.BoxGeometry(0.46, 0.2, 0.31),
  torso: new THREE.CylinderGeometry(0.26, 0.31, 0.72, 10),
  neck: new THREE.CylinderGeometry(0.09, 0.1, 0.14, 8),
  head: new THREE.SphereGeometry(0.26, 14, 12),
  hair: new THREE.SphereGeometry(0.278, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
  bun: new THREE.SphereGeometry(0.11, 10, 8),
  upperArm: new THREE.CylinderGeometry(0.08, 0.09, 0.36, 8),
  foreArm: new THREE.CylinderGeometry(0.068, 0.078, 0.34, 8),
  hand: new THREE.SphereGeometry(0.085, 10, 8),
  // 人物精细化（v3）：五官 / 领口 / 袖口 / 腰带 / 鞋底 / 长发片
  eye: new THREE.SphereGeometry(0.037, 8, 6),
  brow: new THREE.BoxGeometry(0.095, 0.022, 0.02),
  mouth: new THREE.BoxGeometry(0.075, 0.016, 0.012),
  collar: new THREE.CylinderGeometry(0.165, 0.19, 0.11, 10),
  cuff: new THREE.CylinderGeometry(0.08, 0.086, 0.09, 8),
  sole: new THREE.BoxGeometry(0.185, 0.032, 0.345),
  belt: new THREE.BoxGeometry(0.47, 0.07, 0.325),
  hairBack: new THREE.BoxGeometry(0.46, 0.56, 0.09),
  hairSide: new THREE.BoxGeometry(0.085, 0.42, 0.27),
  // 工位家具
  deskTop: new THREE.BoxGeometry(1.9, 0.08, 0.95),
  deskLeg: new THREE.BoxGeometry(0.09, 0.95, 0.8),
  monitor: new THREE.BoxGeometry(1.0, 0.62, 0.05),
  lampBall: new THREE.SphereGeometry(0.075, 10, 8),
  keyboard: new THREE.BoxGeometry(0.62, 0.03, 0.22),
  chairSeat: new THREE.BoxGeometry(0.56, 0.07, 0.54),
  chairBack: new THREE.BoxGeometry(0.54, 0.6, 0.06),
  chairPole: new THREE.CylinderGeometry(0.035, 0.035, 0.42, 8),
  chairBase: new THREE.CylinderGeometry(0.3, 0.33, 0.045, 14),
  // 绿植
  pot: new THREE.CylinderGeometry(0.26, 0.19, 0.42, 10),
  soil: new THREE.CylinderGeometry(0.235, 0.235, 0.05, 10),
  trunk: new THREE.CylinderGeometry(0.05, 0.075, 0.72, 7),
};
GEO.leg.translate(0, -0.44, 0);      // 髋部为轴心
GEO.upperArm.translate(0, -0.18, 0); // 肩部为轴心
GEO.foreArm.translate(0, -0.17, 0);  // 肘部为轴心
/* v9：精细低模手——手掌＋四指（各两段、自然微弯）＋拇指，盒拼合后合并为单一几何；
   左右手各一份、全员共享。手本地系：原点＝腕点，-Y 沿前臂向前（指尖方向），+Z＝手背。
   指尖（中指）约在 (∓0.015, -0.203, -0.076)：三态角度按此落点做 FK 解算。 */
function mergeGeos(list) {
  const pos = [], nor = [], idx = [];
  let off = 0;
  for (const g of list) {
    const p = g.attributes.position, n = g.attributes.normal, ix = g.index;
    for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i)); }
    for (let i = 0; i < ix.count; i++) idx.push(ix.getX(i) + off);
    off += p.count;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  geo.setIndex(idx);
  return geo;
}
function segBox(from, to, w, t) {
  const dir = new THREE.Vector3().subVectors(to, from);
  const len = dir.length();
  const g = new THREE.BoxGeometry(w, len, t);
  g.translate(0, -len / 2, 0);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir.normalize()));
  g.translate(from.x, from.y, from.z);
  return g;
}
function buildHandGeo(ts) { // ts=+1：拇指在 +X 侧（左臂/角色右手）；ts=-1 镜像
  const parts = [];
  const palm = new THREE.BoxGeometry(0.118, 0.15, 0.036); palm.translate(0, -0.058, -0.006); parts.push(palm);
  const wrist = new THREE.BoxGeometry(0.10, 0.06, 0.032); wrist.translate(0, 0.012, -0.004); parts.push(wrist);
  // 四指：off 为相对拇指侧的横向序（食/中/无名/小），各两段、指根下弯 0.42 rad、指尖再弯 0.50 rad
  const fingers = [
    { off: 0.0445, p: 0.053, d: 0.044 },
    { off: 0.015, p: 0.058, d: 0.048 },
    { off: -0.015, p: 0.056, d: 0.046 },
    { off: -0.0445, p: 0.045, d: 0.037 },
  ];
  for (const f of fingers) {
    const x = f.off * ts;
    const kn = new THREE.Vector3(x, -0.125, -0.014);
    const a1 = 0.42, a2 = 0.50;
    const d1 = new THREE.Vector3(x * 0.35, -Math.cos(a1), -Math.sin(a1)).normalize();
    const j1 = kn.clone().addScaledVector(d1, f.p);
    const d2 = new THREE.Vector3(x * 0.35, -Math.cos(a1 + a2), -Math.sin(a1 + a2)).normalize();
    const tip = j1.clone().addScaledVector(d2, f.d);
    parts.push(segBox(kn, j1, 0.0245, 0.021));
    parts.push(segBox(j1, tip, 0.022, 0.019));
  }
  // 拇指：掌内侧前角出发，向前内下方伸，两段
  const tb = new THREE.Vector3(ts * 0.050, -0.070, -0.012);
  const td1 = new THREE.Vector3(ts * 0.52, -0.78, -0.34).normalize();
  const tj = tb.clone().addScaledVector(td1, 0.046);
  const td2 = new THREE.Vector3(ts * 0.34, -0.88, -0.30).normalize();
  const ttip = tj.clone().addScaledVector(td2, 0.040);
  parts.push(segBox(tb, tj, 0.027, 0.023));
  parts.push(segBox(tj, ttip, 0.024, 0.021));
  return mergeGeos(parts);
}
const HAND_GEO = { plus: buildHandGeo(1), minus: buildHandGeo(-1) };
const SKIN = [0xf2c9a0, 0xe8b48c, 0xd9a066, 0xc68863, 0xf5d7b0];
const HAIR = [0x2b2320, 0x4a3220, 0x8a6a3f, 0x1c1c22, 0x6e4a2f, 0x9a938a];
const LEAF_MATS = [0x3e7d3a, 0x4c8a44, 0x356e33, 0x5b9a4e].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, flatShading: true }));
const POT_MATS = [0x9a5b43, 0x5f666e, 0x7a6a55].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.95 }));
const SOIL_MAT = new THREE.MeshStandardMaterial({ color: 0x2e2119, roughness: 1 });
const TRUNK_MAT = new THREE.MeshStandardMaterial({ color: 0x5d4630, roughness: 1 });
// 人物细节共享材质（v3）
const FACE_MAT = new THREE.MeshStandardMaterial({ color: 0x2a2320, roughness: 0.55 });
const MOUTH_MAT = new THREE.MeshStandardMaterial({ color: 0x8a5a4a, roughness: 0.6 });
const CUFF_MAT = new THREE.MeshStandardMaterial({ color: 0xe9e5da, roughness: 0.7 });
const SOLE_MAT = new THREE.MeshStandardMaterial({ color: 0xd8d5cc, roughness: 0.8 });
const BELT_MAT = new THREE.MeshStandardMaterial({ color: 0x1d1f26, roughness: 0.7 });
const hash = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

function textSprite(draw, w, h, scaleX, scaleY) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c); tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace; // 颜色纹理须标 sRGB，否则深色文字会被当线性值提亮冲淡
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
  const sp = new THREE.Sprite(mat); sp.scale.set(scaleX, scaleY, 1);
  return { sp, mat, tex };
}

function makeLabel(name) {
  return textSprite((g) => {
    let size = hasCJK(name) ? 50 : 62; // 界面口径：中文名小一档
    const setF = () => { g.font = `600 ${size}px "PingFang SC","Microsoft YaHei","Noto Sans CJK SC",sans-serif`; };
    setF();
    while (g.measureText(name).width > 492 && size > 26) { size -= 4; setF(); }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 11; g.strokeStyle = 'rgba(8,10,14,0.88)'; g.lineJoin = 'round';
    g.strokeText(name, 256, 58);
    g.fillStyle = '#f2f5fa'; g.fillText(name, 256, 58);
  }, 512, 112, 4.35, 0.95);
}

// 气泡（v8）：全文显示、不截断——按画布实测宽度逐字换行，可多行；speech=true 为台词气泡：
// 背景半透明、字号与气泡整体再放大一档（52px/世界宽 5.4，对齐名牌字高），默认全景视角下也读得清
function makeBubble(text, speech = false) {
  const W = 512, TOP_PAD = 20, BOT_PAD = 14, TAIL = 18;
  const FONT = speech ? 52 : 44, LINE_H = speech ? 68 : 58, WORLD_W = speech ? 5.4 : 3.7;
  const meas = document.createElement('canvas').getContext('2d');
  meas.font = `600 ${FONT}px "PingFang SC","Microsoft YaHei","Noto Sans CJK SC",sans-serif`;
  const lines = [];
  let cur = '';
  for (const ch of text) {
    // 标点不落行首：，。；：、！？等宁可挤在本行末尾，也不换行打头
    if (cur && !'，。；：、！？）」'.includes(ch) && meas.measureText(cur + ch).width > 448) { lines.push(cur); cur = ch; }
    else cur += ch;
  }
  if (cur || !lines.length) lines.push(cur);
  const bodyH = TOP_PAD + lines.length * LINE_H + BOT_PAD;
  const H = Math.max(132, bodyH + TAIL + 12);
  const worldH = WORLD_W * H / W;
  const out = textSprite((g) => {
    g.beginPath();
    g.roundRect(6, 6, 500, bodyH, 26);
    g.fillStyle = 'rgba(255,255,255,0.78)'; g.fill(); // v11：全部头顶气泡（任务气泡＋成员/监工台词）统一半透明底，不再分两档
    g.beginPath(); // 小尾巴
    g.moveTo(236, 6 + bodyH); g.lineTo(276, 6 + bodyH); g.lineTo(256, 6 + bodyH + TAIL); g.closePath(); g.fill();
    g.font = `600 ${FONT}px "PingFang SC","Microsoft YaHei","Noto Sans CJK SC",sans-serif`;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#22262e';
    lines.forEach((ln, i) => g.fillText(ln, 256, 6 + TOP_PAD + LINE_H * i + LINE_H / 2));
  }, W, H, WORLD_W, worldH);
  out.hWorld = worldH; // 调用方据此抬高气泡中心，让尾巴始终对准头顶
  return out;
}

function makeZBubble() {
  // 单颗「Z」泡泡：睡觉的人头顶三颗一组、错峰上浮（动画在 poseThree 里驱动）
  return textSprite((g) => {
    g.fillStyle = '#b9c8ff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '700 118px sans-serif';
    g.lineWidth = 14; g.strokeStyle = 'rgba(8,10,14,0.55)'; g.lineJoin = 'round';
    g.strokeText('Z', 96, 102); g.fillText('Z', 96, 102);
  }, 192, 192, 0.95, 0.95);
}

function buildPerson(rt) {
  const h = hash(rt.id);
  const bodyColor = new THREE.Color(rt.room ? rt.room.accent : (rt.colorOverride || '#7aa2f7'));
  bodyColor.offsetHSL(0, -0.12, ((h % 5) - 2) * 0.035);
  const matBody = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.8 });
  const matSkin = new THREE.MeshStandardMaterial({ color: SKIN[h % SKIN.length], roughness: 0.7 });
  const matPants = new THREE.MeshStandardMaterial({ color: [0x2a2e38, 0x353a45, 0x232830, 0x3d3a33][h % 4], roughness: 0.9 });
  const matHair = new THREE.MeshStandardMaterial({ color: HAIR[h % HAIR.length], roughness: 0.85 });
  const matShoe = new THREE.MeshStandardMaterial({ color: 0x1f2229, roughness: 0.85 });

  const g = new THREE.Group();
  // 腿：髋部为轴心，挂根组（坐姿由 poseThree 单独摆位，不随上身俯仰）；鞋带白鞋底与裤子分色
  const mkLeg = (sx) => {
    const lg = new THREE.Group(); lg.position.set(0.15 * sx, 0.92, 0);
    const leg = new THREE.Mesh(GEO.leg, matPants); leg.castShadow = true; lg.add(leg);
    const shoe = new THREE.Mesh(GEO.shoe, matShoe); shoe.position.set(0, -0.845, 0.055); lg.add(shoe);
    const sole = new THREE.Mesh(GEO.sole, SOLE_MAT); sole.position.set(0, -0.905, 0.055); lg.add(sole);
    g.add(lg); return lg;
  };
  const legL = mkLeg(-1), legR = mkLeg(1);
  // 上身：以髋部为原点建模（坐/趴绕髋转动，动作才像样）
  const bodyG = new THREE.Group(); bodyG.position.set(0, 0.92, 0);
  const pelvis = new THREE.Mesh(GEO.pelvis, matPants); pelvis.position.y = 0.02; pelvis.castShadow = true; bodyG.add(pelvis);
  const belt = new THREE.Mesh(GEO.belt, BELT_MAT); belt.position.y = 0.135; bodyG.add(belt);
  const torso = new THREE.Mesh(GEO.torso, matBody); torso.position.y = 0.34; torso.castShadow = true; bodyG.add(torso);
  // 领口：比衣身深一号的环，压在躯干顶端与脖子之间
  const collarColor = bodyColor.clone(); collarColor.offsetHSL(0, 0.02, -0.09);
  const collar = new THREE.Mesh(GEO.collar, new THREE.MeshStandardMaterial({ color: collarColor, roughness: 0.8 }));
  collar.position.y = 0.71; bodyG.add(collar);
  const neck = new THREE.Mesh(GEO.neck, matSkin); neck.position.y = 0.75; bodyG.add(neck);
  const head = new THREE.Mesh(GEO.head, matSkin); head.position.y = 0.97; head.castShadow = true; bodyG.add(head);
  // 五官（v3）：双眼＋眉毛＋嘴，都贴在脸的 +Z 面上，正面可辨
  for (const sx of [-1, 1]) {
    const eye = new THREE.Mesh(GEO.eye, FACE_MAT); eye.position.set(0.095 * sx, 0.99, 0.245); bodyG.add(eye);
    const brow = new THREE.Mesh(GEO.brow, FACE_MAT); brow.position.set(0.095 * sx, 1.10, 0.24); brow.rotation.x = -0.15; bodyG.add(brow);
  }
  const mouth = new THREE.Mesh(GEO.mouth, MOUTH_MAT); mouth.position.set(0, 0.855, 0.245); bodyG.add(mouth);
  // 发型（v3）：按 id 哈希五选一——0 短发 / 1 发髻 / 2 寸头 / 3 披肩长发 / 4 光头
  const hairStyle = h % 5;
  if (hairStyle !== 4) {
    const hair = new THREE.Mesh(GEO.hair, matHair); hair.castShadow = true;
    if (hairStyle === 2) { hair.scale.set(1.02, 0.45, 1.02); hair.position.y = 1.02; hair.rotation.x = -0.18; } // 寸头：压扁但位置抬高，rim 停在发际线、与眉眼拉开一条额头
    else { hair.position.y = 0.995; hair.rotation.x = -0.28; }
    bodyG.add(hair);
    if (hairStyle === 1) { const bun = new THREE.Mesh(GEO.bun, matHair); bun.position.set(0, 1.16, -0.15); bodyG.add(bun); }
    if (hairStyle === 3) {
      const back = new THREE.Mesh(GEO.hairBack, matHair); back.position.set(0, 0.74, -0.215); back.castShadow = true; bodyG.add(back);
      for (const sx of [-1, 1]) { const side = new THREE.Mesh(GEO.hairSide, matHair); side.position.set(0.235 * sx, 0.8, -0.03); bodyG.add(side); }
    }
  }
  const mkArm = (sx) => {
    const sh = new THREE.Group(); sh.position.set(0.37 * sx, 0.60, 0); sh.rotation.z = sx * 0.10;
    const up = new THREE.Mesh(GEO.upperArm, matBody); up.castShadow = true; sh.add(up);
    const el = new THREE.Group(); el.position.set(0, -0.36, 0);
    const fo = new THREE.Mesh(GEO.foreArm, matBody); fo.castShadow = true; el.add(fo);
    const cuff = new THREE.Mesh(GEO.cuff, CUFF_MAT); cuff.position.set(0, -0.3, 0); el.add(cuff); // 袖口：浅色环，与衣袖分层
    const hand = new THREE.Mesh(sx < 0 ? HAND_GEO.plus : HAND_GEO.minus, matSkin); // v9：精细手（拇指朝身体中线）
    hand.position.set(0, -0.36, 0); hand.castShadow = true; el.add(hand);
    sh.add(el); bodyG.add(sh);
    return { sh, el, hand };
  };
  const aL = mkArm(-1), aR = mkArm(1);
  g.add(bodyG);
  // 名牌/Zzz 是组内精灵：组放大后反向补偿精灵缩放，让它们的世界尺寸保持 v2 水平、不随人物变大
  const label = makeLabel(rt.data.name); label.sp.visible = NAMES_ON; label.sp.position.set(0, 2.5, 0); label.sp.scale.multiplyScalar(1 / WS); g.add(label.sp);
  const zzzBubbles = [0, 1, 2].map((i) => {
    const z = makeZBubble();
    z.sp.scale.multiplyScalar((0.5 + i * 0.3) / WS); // 三颗由小到大
    z.sp.visible = false;
    g.add(z.sp);
    return z;
  });
  g.scale.setScalar(WS); // v3：人物整体放大（与桌椅同系数、同锚点）
  g.position.set(rt.anchor.x, 0.5, rt.anchor.z);
  scene3.add(g);
  Object.assign(rt.three, { group: g, bodyG, legL, legR, armL: aL.sh, armR: aR.sh, armFL: aL.el, armFR: aR.el, handL: aL.hand, handR: aR.hand, labelMat: label.mat, labelSp: label.sp, labelBase: label.sp.scale.clone(), zzzBubbles, bubble: null, speech: null });
}

/* v11：屏幕纹理——canvas 生成的密密麻麻代码行（看不清没关系，要的就是密），两版共享：
   干活＝深底亮字（亮屏）；空闲＝保持原来的灰底、只在灰底上同样铺密字（灰调版，用户补充口径）；
   睡着的屏幕在 applyThree 里把 emissive 关成全黑、不发光 */
function makeScreenTex(bg, palette, seedStart) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 300;
  const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, 512, 300);
  const chars = 'abcdefghijklmnopqr{}();=<>/+-*;:._#[]0123456789';
  let s = seedStart;
  const rnd = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  g.font = '8px monospace'; g.textBaseline = 'top';
  for (let y = 2, row = 0; y < 298; y += 10, row++) {
    let x = 2 + Math.floor(rnd() * 3) * 5; // v12：缩进贴到左沿，整屏平铺不留边距空白（旧版左缩进最大 72px、行尾停在 478、每 7 行空一行，屏面四周与行间都有空白带）
    while (x < 506) { // 每行写满到右沿，末词自然裁出屏外
      const len = 3 + Math.floor(rnd() * 12);
      let txt = '';
      for (let i = 0; i < len; i++) txt += chars[Math.floor(rnd() * chars.length)];
      g.fillStyle = palette[Math.floor(rnd() * palette.length)];
      g.globalAlpha = 0.55 + rnd() * 0.45;
      g.fillText(txt, x, y);
      x += g.measureText(txt).width + 10 + rnd() * 8;
    }
  }
  g.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  return tex;
}
const SCREEN_TEX = makeScreenTex('#0a0f16', ['#9fd8ff', '#7ee2a8', '#c9d2df', '#e0af68', '#8a93a5', '#7aa2f7'], 20261125);
const SCREEN_TEX_GREY = makeScreenTex('#435263', ['#d7e0ea', '#aebbcb', '#8797a9', '#67788c', '#c2cedd'], 20261126);

let _glowTex = null;
function makeGlowSprite() {
  // 暖色径向光晕（台灯亮时用，加色混合、零光源开销）
  if (!_glowTex) {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62);
    gr.addColorStop(0, 'rgba(255,205,120,0.85)');
    gr.addColorStop(0.4, 'rgba(255,180,90,0.32)');
    gr.addColorStop(1, 'rgba(255,170,80,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    _glowTex = new THREE.CanvasTexture(c); _glowTex.colorSpace = THREE.SRGBColorSpace;
  }
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: _glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  sp.scale.set(1.5, 1.5, 1);
  return sp;
}

function buildDesk(rt) {
  const h = hash(rt.id + ':desk');
  const g = new THREE.Group();
  g.position.set(rt.anchor.x, 0.5, rt.anchor.z);
  g.rotation.y = rt.angle;
  const matDesk = new THREE.MeshStandardMaterial({ color: 0x3a4152, roughness: 0.85 });
  const top = new THREE.Mesh(GEO.deskTop, matDesk); top.position.set(0, 0.95, 1.3); top.castShadow = true; top.receiveShadow = true; g.add(top);
  for (const sx of [-1, 1]) {
    const leg = new THREE.Mesh(GEO.deskLeg, matDesk); leg.position.set(0.85 * sx, 0.475, 1.3); g.add(leg);
  }
  // 显示器＋支架＋键盘（＋部分工位有鼠标）
  const mon = new THREE.Mesh(GEO.monitor, new THREE.MeshStandardMaterial({ color: 0x14171d, roughness: 0.6 }));
  mon.position.set(0, 1.32, 1.66); mon.rotation.x = -0.06; mon.castShadow = true; g.add(mon);
  const screenMat = new THREE.MeshStandardMaterial({ color: 0x0d1117, emissive: 0xffffff, emissiveMap: SCREEN_TEX, emissiveIntensity: 1.25, roughness: 0.4 });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.54), screenMat);
  screen.position.set(0, 1.32, 1.622); screen.rotation.y = Math.PI; screen.rotation.x = -0.06; g.add(screen); // v12：与显示器同倾角平行并整体前移，整面贴在屏壳前面（旧版反倾角＋与屏壳正面几乎共面，屏面上部约 4 成沉进屏壳被吞）
  const matDarkMetal = new THREE.MeshStandardMaterial({ color: 0x23262e, roughness: 0.6 });
  const monBase = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.03, 0.26), matDarkMetal); monBase.position.set(0, 1.005, 1.60); g.add(monBase);
  const monNeck = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.28, 0.05), matDarkMetal); monNeck.position.set(0, 1.15, 1.68); g.add(monNeck); // v12：支架柱后移藏到屏壳背面（旧版 z=1.64 前脸凸出屏面，就是屏面中央那块黑条的元凶）
  const kb = new THREE.Mesh(GEO.keyboard, matDarkMetal); kb.position.set(0, 1.005, 1.26); g.add(kb); // v10：键盘挪到双手正下方（干活手掌 z≈1.20、指尖 z≈1.33，键盘 z 跨 [1.15,1.37] 正好罩住掌指；手位/姿势未动）
  if (h % 2 === 0) { const ms = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.03, 0.13), matDarkMetal); ms.position.set(0.47, 1.005, 1.06); g.add(ms); }
  // 台灯（灯杆＋灯球）
  const lampMat = new THREE.MeshStandardMaterial({ color: 0x554a33, emissive: 0xffc873, emissiveIntensity: 0.8 });
  const lampStem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.2, 6), matDarkMetal); lampStem.position.set(0.8, 1.02, 1.05); g.add(lampStem);
  const lamp = new THREE.Mesh(GEO.lampBall, lampMat); lamp.position.set(0.8, 1.14, 1.05); g.add(lamp);
  const lampGlow = makeGlowSprite(); lampGlow.position.set(0.8, 1.14, 1.05); lampGlow.visible = false; g.add(lampGlow);
  // 办公椅（座垫＋靠背＋气杆＋底盘）
  const matChair = new THREE.MeshStandardMaterial({ color: 0x2e3442, roughness: 0.9 });
  const seat = new THREE.Mesh(GEO.chairSeat, matChair); seat.position.set(0, 0.47, 0.36); seat.castShadow = true; g.add(seat);
  const back = new THREE.Mesh(GEO.chairBack, matChair); back.position.set(0, 1.02, 0.08); back.rotation.x = -0.1; back.castShadow = true; g.add(back);
  const pole = new THREE.Mesh(GEO.chairPole, matDarkMetal); pole.position.set(0, 0.235, 0.36); g.add(pole);
  const cbase = new THREE.Mesh(GEO.chairBase, matDarkMetal); cbase.position.set(0, 0.028, 0.36); g.add(cbase);
  // 桌面小物：部分工位有水杯、部分有桌面小盆栽（按 id 哈希分布，不堆砌）
  if (h % 2 === 1) {
    const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.048, 0.11, 10),
      new THREE.MeshStandardMaterial({ color: [0xb8563f, 0x3f6fb8, 0xd8dce4, 0x53a06a][h % 4], roughness: 0.6 }));
    mug.position.set(-0.63, 1.045, 1.08); g.add(mug);
  }
  if (h % 3 === 0) {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.055, 0.1, 8), POT_MATS[h % POT_MATS.length]);
    pot.position.set(-0.79, 1.04, 1.44); g.add(pot);
    const leafBall = new THREE.Mesh(new THREE.IcosahedronGeometry(0.115, 0), LEAF_MATS[h % LEAF_MATS.length]);
    leafBall.position.set(-0.79, 1.19, 1.44); g.add(leafBall);
  }
  g.scale.setScalar(WS); // v3：桌椅与人物同系数放大，保持坐姿/趴姿对位
  scene3.add(g);
  const hit = new THREE.Mesh(
    new THREE.CylinderGeometry(1.75, 1.75, 4.4, 8),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  hit.position.set(rt.anchor.x, 2.5, rt.anchor.z);
  hit.userData.memberId = rt.id;
  scene3.add(hit); hitProxies.push(hit);
  Object.assign(rt.three, { screenMat, lampMat, lampGlow });
}

function zoneSign(zone) {
  // v5：五间房名牌字统一字号（与总经理室门牌同为 canvas 84px、同精灵尺寸），并整体放大到最远的房间也看得清
  const { sp } = textSprite((g) => {
    g.font = '600 84px "PingFang SC","Microsoft YaHei","Noto Sans CJK SC",sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 12; g.strokeStyle = 'rgba(8,10,14,0.75)'; g.lineJoin = 'round';
    const label = zone.name.split('').join(' ');
    g.strokeText(label, 256, 66); g.fillStyle = '#c9d2df'; g.fillText(label, 256, 66);
  }, 512, 128, 9.6, 2.4);
  const dx = CENTER.x - zone.c[0], dz = CENTER.z - zone.c[1];
  const len = Math.hypot(dx, dz) || 1;
  const ux = dx / len, uz = dz / len;
  // 射线与 pod 矩形的交点距离（不能用 max(w,d)/2，否则宽 pod 的牌子会冲进中央台）
  const tx = ux !== 0 ? (zone.w / 2) / Math.abs(ux) : Infinity;
  const tz = uz !== 0 ? (zone.d / 2) / Math.abs(uz) : Infinity;
  const edge = Math.min(tx, tz) + 0.5;
  sp.position.set(zone.c[0] + ux * edge, 2.1, zone.c[1] + uz * edge);
  scene3.add(sp);
}

function gmSign() {
  // 总经理室门牌：金字招牌，立在中央圆厅南沿（全场唯一单间的标识）
  // v5：字号与四间房名牌统一（canvas 84px、精灵 9.6×2.4），金牌底板保留
  const { sp } = textSprite((g) => {
    g.beginPath(); g.roundRect(56, 14, 400, 100, 18);
    g.fillStyle = 'rgba(24,20,10,0.88)'; g.fill();
    g.lineWidth = 5; g.strokeStyle = '#ffd166'; g.stroke();
    g.font = '700 84px "PingFang SC","Microsoft YaHei","Noto Sans CJK SC",sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#ffd166';
    g.fillText('总经理室', 256, 66); // 4 字不加空格：84px 下带空格总宽 462 会溢出 400 宽金牌；字号本身与各房一致
  }, 512, 128, 9.6, 2.4);
  sp.position.set(CENTER.x, 2.6, CENTER.z + GM_ROOM.r + 0.9);
  scene3.add(sp);
}

/* ================= 装饰：绿植 / 中央核心 / 书架 / 茶水角（v2） ================= */
let centerFx = null;

function makePlant(variant, scale = 1, seed = 0) {
  const g = new THREE.Group();
  const pot = new THREE.Mesh(GEO.pot, POT_MATS[(variant + seed) % POT_MATS.length]);
  pot.position.y = 0.21; pot.castShadow = true; g.add(pot);
  const soil = new THREE.Mesh(GEO.soil, SOIL_MAT); soil.position.y = 0.43; g.add(soil);
  const leaf = (i) => LEAF_MATS[(seed + i) % LEAF_MATS.length];
  const blob = (r, x, y, z, i) => {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), leaf(i));
    m.position.set(x, y, z); m.castShadow = true; g.add(m);
  };
  if (variant === 1) {          // 锥形小树
    const c1 = new THREE.Mesh(new THREE.ConeGeometry(0.37, 0.78, 8), leaf(0)); c1.position.y = 0.86; c1.castShadow = true; g.add(c1);
    const c2 = new THREE.Mesh(new THREE.ConeGeometry(0.27, 0.6, 8), leaf(1)); c2.position.y = 1.24; g.add(c2);
  } else if (variant === 2) {   // 高杆大叶（中央台旁用大号）
    const trunk = new THREE.Mesh(GEO.trunk, TRUNK_MAT); trunk.position.y = 0.79; g.add(trunk);
    blob(0.42, 0, 1.52, 0, 0); blob(0.30, 0.28, 1.30, 0.10, 1); blob(0.27, -0.26, 1.36, -0.08, 2);
  } else {                      // 团状灌木
    blob(0.35, 0, 0.82, 0, 0); blob(0.27, 0.21, 0.68, 0.09, 1); blob(0.25, -0.20, 0.72, -0.07, 2);
  }
  g.scale.setScalar(scale);
  return g;
}

function buildCenterCore() {
  // 总经理室调度核心：基座＋立柱＋发光调度核心＋光环（全场命令发源地的视觉中心）
  const g = new THREE.Group(); g.position.set(CENTER.x, 0, CENTER.z);
  const matMetal = new THREE.MeshStandardMaterial({ color: 0x39415a, roughness: 0.45, metalness: 0.55 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.25, 0.16, 36), matMetal);
  base.position.y = 0.58; base.castShadow = true; base.receiveShadow = true; g.add(base);
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.30, 1.02, 12), matMetal);
  ped.position.y = 1.13; g.add(ped);
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.46, 0),
    new THREE.MeshStandardMaterial({ color: 0x16283f, emissive: 0x6ea8ff, emissiveIntensity: 2.4, roughness: 0.3, flatShading: true }));
  core.position.y = 1.98; g.add(core);
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.035, 8, 48), new THREE.MeshBasicMaterial({ color: 0x9fd0ff }));
  halo.position.y = 1.98; halo.rotation.x = Math.PI / 2.4; g.add(halo);
  const glow = new THREE.PointLight(0x7fb2ff, 42, 30, 2);
  glow.position.y = 2.2; g.add(glow);
  scene3.add(g);
  centerFx = { core, halo, glow };
}

function makeBookshelf() {
  const g = new THREE.Group();
  const matWood = new THREE.MeshStandardMaterial({ color: 0x4a3a28, roughness: 0.9 });
  const W = 4.6, H = 2.3, D = 0.42;
  const add = (geo, mat, x, y, z, shadow = false) => {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = shadow; g.add(m); return m;
  };
  add(new THREE.BoxGeometry(W, H, 0.05), matWood, 0, H / 2, -D / 2 + 0.03);
  add(new THREE.BoxGeometry(0.07, H, D), matWood, -(W / 2 - 0.035), H / 2, 0, true);
  add(new THREE.BoxGeometry(0.07, H, D), matWood, W / 2 - 0.035, H / 2, 0, true);
  add(new THREE.BoxGeometry(W, 0.07, D), matWood, 0, H - 0.035, 0);
  add(new THREE.BoxGeometry(W, 0.06, D), matWood, 0, 0.03, 0);
  const shelfYs = [0.60, 1.18, 1.76];
  for (const y of shelfYs) add(new THREE.BoxGeometry(W - 0.14, 0.05, D - 0.06), matWood, 0, y, 0);
  // 书：单位盒缩放成书本，颜色走克制的书脊色板；伪随机用 LCG 保证每次一致
  const unit = new THREE.BoxGeometry(1, 1, 1);
  const palette = [0x7a4a3a, 0x3a5a7a, 0x5a7a4a, 0x8a7a3a, 0x6a4a7a, 0x8b93a3, 0x74584a].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85 }));
  let s = 1234567;
  const rnd = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  const rows = [0.06, 0.625, 1.205];
  for (const baseY of rows) {
    let x = -W / 2 + 0.22;
    while (x < W / 2 - 0.35) {
      if (rnd() < 0.12) { x += 0.22; continue; } // 偶尔留空
      const bw = 0.13 + rnd() * 0.09, bh = 0.40 + rnd() * 0.13;
      const b = new THREE.Mesh(unit, palette[Math.floor(rnd() * palette.length)]);
      b.scale.set(bw, bh, 0.26); b.position.set(x + bw / 2, baseY + bh / 2, 0.02);
      g.add(b);
      x += bw + 0.015;
    }
  }
  // 顶层放一盆小绿植＋一摞横放的书，不堆砌
  const plant = makePlant(0, 0.62, 3); plant.position.set(-W / 2 + 0.75, 1.785, 0); g.add(plant);
  for (let i = 0; i < 3; i++) {
    const b = new THREE.Mesh(unit, palette[i % palette.length]);
    b.scale.set(0.52, 0.07, 0.3); b.position.set(W / 2 - 0.85, 1.82 + i * 0.075, 0.02); g.add(b);
  }
  return g;
}

function makeTeaCorner() {
  const g = new THREE.Group();
  const matTop = new THREE.MeshStandardMaterial({ color: 0xb9bec9, roughness: 0.55 });
  const matDark = new THREE.MeshStandardMaterial({ color: 0x2e3442, roughness: 0.8 });
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.05, 20), matTop);
  top.position.y = 0.74; top.castShadow = true; g.add(top);
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.72, 8), matDark); leg.position.y = 0.37; g.add(leg);
  for (const [x, z] of [[1.3, 0.35], [-0.45, 1.3]]) {
    const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.07, 14), new THREE.MeshStandardMaterial({ color: 0x6b4e35, roughness: 0.85 }));
    seat.position.set(x, 0.46, z); seat.castShadow = true; g.add(seat);
    const sleg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.44, 8), matDark); sleg.position.set(x, 0.22, z); g.add(sleg);
  }
  for (const [x, z] of [[0.3, 0.2], [-0.25, -0.3]]) {
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.08, 10), new THREE.MeshStandardMaterial({ color: 0xe8ecf3, roughness: 0.5 }));
    cup.position.set(x, 0.805, z); g.add(cup);
  }
  const plant = makePlant(2, 1.15, 5); plant.position.set(-1.35, 0, -1.0); g.add(plant);
  return g;
}

function buildDecor() {
  // 每间矩形房 3 处绿植：pod 四角轮换避开一角（角位在工位网格之外，不抢工位）
  const corners = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
  ROOM_DEFS.filter((z) => !z.round).forEach((z, zi) => {
    corners.forEach(([sx, sz], ci) => {
      if (ci === zi % 4) return;
      const p = makePlant((zi + ci) % 3, 0.9 + (hash(z.name + ':' + ci) % 40) / 100, zi * 4 + ci);
      p.position.set(z.c[0] + sx * (z.w / 2 - 1.15), 0.5, z.c[1] + sz * (z.d / 2 - 1.15));
      scene3.add(p);
    });
  });
  // 总经理室旁两株大绿植
  for (const sx of [-1, 1]) {
    const p = makePlant(2, 1.5, sx > 0 ? 7 : 8);
    p.position.set(CENTER.x + sx * 3.7, 0.5, CENTER.z - 3.3);
    scene3.add(p);
  }
  // 北侧空地书架、西南角茶水角（都在地面层，不占 pod）
  const shelf = makeBookshelf(); shelf.position.set(0, 0, -27.6); scene3.add(shelf);
  const tea = makeTeaCorner(); tea.position.set(-37.2, 0, 27.4); scene3.add(tea);
}

function buildThree() {
  const holder = $('scene');
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  holder.appendChild(renderer.domElement);
  scene3 = new THREE.Scene();
  scene3.background = new THREE.Color(0x1d2027);
  scene3.fog = new THREE.Fog(0x1d2027, 130, 240);
  camera = new THREE.PerspectiveCamera(48, 1, 0.1, 500);
  raycaster = new THREE.Raycaster();

  scene3.add(new THREE.HemisphereLight(0xdfe8ff, 0x14161c, 1.3));
  const sun = new THREE.DirectionalLight(0xffffff, 2.05);
  sun.position.set(34, 46, 20); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -48; sun.shadow.camera.right = 48;
  sun.shadow.camera.top = 48; sun.shadow.camera.bottom = -48;
  sun.shadow.bias = -0.0004;
  scene3.add(sun);

  // 地面：克制的纯色（界面口径三）
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(82, 62),
    new THREE.MeshStandardMaterial({ color: 0x252932, roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2; ground.position.set(0, 0, 1); ground.receiveShadow = true;
  scene3.add(ground);

  // 矩形 pod 通用画法：深色基座台阶＋本房色压边线收形（克制纯色，界面口径三）
  const drawPod = (cx, cz, w, d, podColor) => {
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.9, 0.3, d + 0.9),
      new THREE.MeshStandardMaterial({ color: new THREE.Color(podColor).multiplyScalar(0.5), roughness: 1 })
    );
    base.position.set(cx, 0.15, cz); base.receiveShadow = true;
    scene3.add(base);
    const pod = new THREE.Mesh(
      new THREE.BoxGeometry(w, 0.5, d),
      new THREE.MeshStandardMaterial({ color: podColor, roughness: 0.95 })
    );
    pod.position.set(cx, 0.25, cz); pod.receiveShadow = true; pod.castShadow = false;
    scene3.add(pod);
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x14161c, emissive: podColor, emissiveIntensity: 0.3, roughness: 0.8 });
    for (const sz of [-1, 1]) {
      const trim = new THREE.Mesh(new THREE.BoxGeometry(w - 0.1, 0.055, 0.13), trimMat);
      trim.position.set(cx, 0.515, cz + sz * (d / 2 - 0.1)); scene3.add(trim);
    }
    for (const sx of [-1, 1]) {
      const trim = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.055, d - 0.1), trimMat);
      trim.position.set(cx + sx * (w / 2 - 0.1), 0.515, cz); scene3.add(trim);
    }
  };
  // 四间矩形房 pod（高管室例外：不画整间大 pod，按人逐块画独立地块）
  for (const z of ROOM_DEFS.filter((r) => !r.round)) {
    if (z.layout === 'plots') {
      for (const id of rosterOrder) {
        const rt = roster.get(id);
        if (rt.room.layout !== 'plots' || !rt.plot) continue;
        drawPod(rt.plot.x, rt.plot.z, rt.plot.w, rt.plot.d, z.pod);
      }
    } else {
      drawPod(z.c[0], z.c[1], z.w, z.d, z.pod);
    }
    zoneSign(z);
  }
  // 总经理室：中央圆厅（全场唯一单间，Muse 专座；调度核心＝命令发源地，保留在厅内）
  const plat = new THREE.Mesh(
    new THREE.CylinderGeometry(GM_ROOM.r, GM_ROOM.r + 0.35, 0.5, 48),
    new THREE.MeshStandardMaterial({ color: GM_ROOM.pod, roughness: 0.9 })
  );
  plat.position.set(CENTER.x, 0.25, CENTER.z); plat.receiveShadow = true; scene3.add(plat);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(GM_ROOM.r, 0.05, 8, 72),
    new THREE.MeshBasicMaterial({ color: 0xffd166 })
  );
  ring.rotation.x = Math.PI / 2; ring.position.set(CENTER.x, 0.52, CENTER.z); scene3.add(ring);
  gmSign();
  buildCenterCore();
  buildDecor();

  for (const id of rosterOrder) { const rt = roster.get(id); buildDesk(rt); buildPerson(rt); }
  buildMonitors();

  // v6：原「常亮汇报连线＋流动光点」已拆——连线改为事件驱动（见文末派活飞书）：
  // 静默时无线，dispatch / feedback 事件发生时对应连线才亮起、飞书飞完停留数秒后一起淡出。

  ringSel = new THREE.Mesh(
    new THREE.RingGeometry(1.7, 2.02, 36),
    new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.95, side: THREE.DoubleSide, depthWrite: false })
  );
  ringSel.rotation.x = -Math.PI / 2; ringSel.position.y = 0.58; ringSel.visible = false;
  scene3.add(ringSel);

  bindCameraControls();
  onResize();
  updateCamera(0);
}

function applyThree(rt) {
  const st = rt.data.status, T = rt.three;
  if (!T.group) return;
  // v4 口径：人永远在座位上——睡着（sleepy/offline）是趴桌睡，不是消失
  T.group.visible = true;
  if (T.screenMat) {
    // v11：屏幕按状态分——干活亮屏（深底密字全亮）、空闲灰屏（原灰底＋灰调密字）、睡着（含离线）全黑关屏、无发光
    const e = { working: [SCREEN_TEX, 0xffffff, 1.25], idle: [SCREEN_TEX_GREY, 0xffffff, 0.9], sleepy: [null, 0x000000, 0], offline: [null, 0x000000, 0] }[st];
    if (e[0] && T.screenMat.emissiveMap !== e[0]) { T.screenMat.emissiveMap = e[0]; T.screenMat.needsUpdate = true; }
    T.screenMat.emissive.setHex(e[1]); T.screenMat.emissiveIntensity = e[2];
  }
  // 台灯三态：working 亮（灯球高亮＋暖色光晕）；idle / 睡着 一律灭
  if (T.lampMat) T.lampMat.emissiveIntensity = st === 'working' ? 2.4 : 0;
  if (T.lampGlow) T.lampGlow.visible = st === 'working';
  T.labelMat.color.setHex(st === 'offline' ? 0x62676f : 0xffffff);
  if (T.zzzBubbles) for (const z of T.zzzBubbles) z.sp.visible = isSleeping(st);
  // 任务气泡：只有 working 且有任务文本时出现，内容只有任务本身（界面口径一）
  if (T.bubble) { T.group.remove(T.bubble.sp); T.bubble.mat.map.dispose(); T.bubble.mat.dispose(); T.bubble = null; }
  if (st === 'working' && rt.data.task) {
    const b = makeBubble(rt.data.task);
    b.sp.position.set(0, 3.35 + (rt.slot % 2) * 0.35 + (b.hWorld - 1.04) / (2 * WS), 0); // 相邻工位错层＋多行气泡中心上移
    b.sp.scale.multiplyScalar(1 / WS); // 世界尺寸保持 v2 水平（组已放大）
    if (T.speech) b.sp.visible = false; // 正在说话时先让位给台词气泡
    T.group.add(b.sp); T.bubble = b;
  }
}

/* ---------- 相机 ---------- */
function updateCamera(dt) {
  if (camAnim) {
    camAnim.t += dt / camAnim.dur;
    const k = camAnim.t >= 1 ? 1 : (1 - Math.pow(1 - camAnim.t, 3));
    camTarget.lerpVectors(camAnim.fromT, camAnim.toT, k);
    camSph.radius = camAnim.fromR + (camAnim.toR - camAnim.fromR) * k;
    camSph.theta = camAnim.fromTh + (camAnim.toTh - camAnim.fromTh) * k;
    camSph.phi = camAnim.fromP + (camAnim.toP - camAnim.fromP) * k;
    if (camAnim.t >= 1) camAnim = null;
  }
  const sp = Math.sin(camSph.phi), y = Math.cos(camSph.phi);
  camera.position.set(
    camTarget.x + camSph.radius * sp * Math.sin(camSph.theta),
    camTarget.y + camSph.radius * y,
    camTarget.z + camSph.radius * sp * Math.cos(camSph.theta)
  );
  camera.lookAt(camTarget);
}

function animateCamTo(target, radius, theta = camSph.theta, phi = camSph.phi) {
  camAnim = { t: 0, dur: 0.9, fromT: camTarget.clone(), toT: target, fromR: camSph.radius, toR: radius, fromTh: camSph.theta, toTh: theta, fromP: camSph.phi, toP: phi };
}

function focusMember(id) {
  const rt = roster.get(id); if (!rt) return;
  if (view === '3d') animateCamTo(new THREE.Vector3(rt.anchor.x, 0.8, rt.anchor.z), 22);
}

function bindCameraControls() {
  const el = renderer.domElement;
  let down = null;
  el.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, moved: 0 }; camAnim = null; el.setPointerCapture(e.pointerId); });
  el.addEventListener('pointermove', (e) => {
    if (!down) return;
    const dx = e.clientX - down.x, dy = e.clientY - down.y;
    down.moved += Math.abs(dx) + Math.abs(dy);
    camSph.theta -= dx * 0.0052;
    camSph.phi = THREE.MathUtils.clamp(camSph.phi - dy * 0.004, 0.45, 1.28);
    down.x = e.clientX; down.y = e.clientY;
  });
  el.addEventListener('pointerup', (e) => {
    if (down && down.moved < 6) pickAt(e);
    down = null;
  });
  el.addEventListener('wheel', (e) => {
    e.preventDefault();
    camSph.radius = THREE.MathUtils.clamp(camSph.radius * (1 + e.deltaY * 0.001), 10, 100);
  }, { passive: false });
}

function pickAt(e) {
  const rect = renderer.domElement.getBoundingClientRect();
  const nd = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
  raycaster.setFromCamera(nd, camera);
  const hits = raycaster.intersectObjects(hitProxies, false);
  if (hits.length) select(hits[0].object.userData.memberId, true);
}

$('resetView').addEventListener('click', () => {
  if (view === '3d') animateCamTo(new THREE.Vector3(0, 0, 3), 66, 0, 0.94);
});

/* ---------- 3D 每帧更新 ---------- */
const _v = new THREE.Vector3();
function lerpAngle(a, b, t) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

function stepSim(rt, dt, t) {
  const s = rt.sim;
  // v4：成员全员坐班（idle 也是坐姿在线），目标点恒为自己工位；走动巡逻是监工的活
  s.tx = rt.anchor.x; s.tz = rt.anchor.z;
  const dx = s.tx - s.x, dz = s.tz - s.z;
  const dist = Math.hypot(dx, dz);
  let moving = false;
  if (dist > 0.05) {
    const step = Math.min(dist, 2.6 * dt);
    s.x += (dx / dist) * step; s.z += (dz / dist) * step;
    moving = dist > 0.3;
    s.heading = lerpAngle(s.heading, Math.atan2(dx, dz), Math.min(1, dt * 7));
  } else {
    s.heading = lerpAngle(s.heading, rt.angle, Math.min(1, dt * 5));
  }
  s.moving = moving;
  s.atDesk = dist < 0.25;
}

function poseThree(rt, t) {
  const T = rt.three; if (!T.group) return;
  const st = rt.data.status, s = rt.sim;
  T.group.position.set(s.x, 0.5, s.z);
  T.group.rotation.y = s.heading;
  const B = T.bodyG; // 上身以髋部为原点；腿挂根组单独摆位
  if (st === 'working' && s.atDesk) {
    // 坐姿打字：臀落椅面、腿前伸、上臂微垂、前臂敲击
    B.position.set(0, 0.50, 0.44); B.rotation.x = 0.06;
    T.legL.position.set(-0.15, 0.50, 0.44); T.legR.position.set(0.15, 0.50, 0.44);
    T.legL.rotation.x = T.legR.rotation.x = -1.28;
    // v9：打字姿势——手臂收拢：上臂贴近身体向前下伸、肘收在桌面前沿内侧（|x|≈0.23），
    // 前臂向中间收拢、双手并排落在键盘后沿上方，指尖垂落桌面/键面（角度经 FK 解算＋采样验算，不穿桌）
    T.armL.rotation.set(-1.346 + Math.sin(t * 9 + s.phase) * 0.02, -0.203, 0.407);
    T.armR.rotation.set(-1.346 + Math.cos(t * 8.3 + s.phase) * 0.02, 0.203, -0.407);
    T.armFL.rotation.x = -0.258 + Math.sin(t * 9 + s.phase) * 0.04;
    T.armFR.rotation.x = -0.258 + Math.cos(t * 8.3 + s.phase) * 0.04;
    T.armFL.rotation.y = 0; T.armFR.rotation.y = 0; // v11：睡姿用过肘部偏航，切回来要复位
    T.handL.rotation.x = 0; T.handR.rotation.x = 0;
  } else if (isSleeping(st) && s.atDesk) {
    // 趴桌睡觉（sleepy 与 offline 同一口径＝不在线）
    // v11：改「交叉臂枕睡」——双前臂在桌面上交叉叠放（右臂压左臂）、头枕在交叉的臂上，不再双臂前摊。
    // 角度经 FK 求解＋真 three.js 层级验算：双掌掌心向下贴桌、指尖越过中线落到对侧（腕 L +0.11 / R -0.12、尖 L +0.25 / R -0.26），
    // 前臂中点在 (∓0.00, 1.05/1.14, 1.18) 交叉叠放，头中心 (0, 1.38, 1.05)、头底 1.12 正落在上层前臂上；指尖不穿桌、不越桌沿
    B.position.set(0, 0.638, 0.421); B.rotation.x = 0.698;
    T.legL.position.set(-0.15, 0.598, 0.421); T.legR.position.set(0.15, 0.598, 0.421);
    T.legL.rotation.x = T.legR.rotation.x = -1.25;
    T.armL.rotation.set(-1.966, -0.037, 0.770);
    T.armR.rotation.set(-3.210, -0.579, -1.066);
    T.armFL.rotation.set(-0.334, 0.243, 0); T.armFR.rotation.set(0.174, 1.040, 0);
    T.handL.rotation.x = 0.161; T.handR.rotation.x = 0.049;
  } else if (st === 'idle' && s.atDesk && !rt.isMonitor) {
    // idle 坐姿在线：端正坐着、手放桌上待命，只有呼吸般的轻微起伏（灯是灭的，见 applyThree）
    B.position.set(0, 0.50 + Math.sin(t * 1.6 + s.phase) * 0.008, 0.44); B.rotation.x = 0.03;
    T.legL.position.set(-0.15, 0.50, 0.44); T.legR.position.set(0.15, 0.50, 0.44);
    T.legL.rotation.x = T.legR.rotation.x = -1.28;
    // v9：idle 待命与 working 同系收拢角度（无敲击摆动），双手并排静止搭在桌面前方
    T.armL.rotation.set(-1.324, -0.174, 0.379);
    T.armR.rotation.set(-1.324, 0.174, -0.379);
    T.armFL.rotation.x = -0.256; T.armFR.rotation.x = -0.256;
    T.armFL.rotation.y = 0; T.armFR.rotation.y = 0; // v11：肘部偏航复位（同上）
    T.handL.rotation.x = 0; T.handR.rotation.x = 0;
  } else {
    // 站立/走动：腿交替摆、上身随步频轻晃
    const bob = s.moving ? Math.abs(Math.sin(t * 7 + s.phase)) * 0.055 : Math.sin(t * 1.6 + s.phase) * 0.012;
    B.position.set(0, 0.92 + bob, 0); B.rotation.x = 0;
    T.legL.position.set(-0.15, 0.92, 0); T.legR.position.set(0.15, 0.92, 0);
    const sw = s.moving ? Math.sin(t * 7 + s.phase) : 0;
    T.legL.rotation.x = sw * 0.42; T.legR.rotation.x = -sw * 0.42;
    T.armL.rotation.z = -0.10; T.armR.rotation.z = 0.10; // 站立/走动时把睡姿的外摆收回来
    T.armL.rotation.y = 0; T.armR.rotation.y = 0; // v9：坐姿的肩部偏航一并复位
    T.armL.rotation.x = -0.10 + sw * 0.30; T.armR.rotation.x = -0.10 - sw * 0.30;
    T.armFL.rotation.x = -0.25; T.armFR.rotation.x = -0.25;
    T.armFL.rotation.y = 0; T.armFR.rotation.y = 0; // v11：肘部偏航复位（同上）
    T.handL.rotation.x = 0; T.handR.rotation.x = 0; // v9：手腕俯仰复位
  }
  if (T.zzzBubbles && isSleeping(st)) {
    // 睡眠泡泡：三颗 Z 错峰上浮、淡入淡出循环
    T.zzzBubbles.forEach((z, i) => {
      const cyc = (t * 0.38 + s.phase * 0.13 + i / 3) % 1;
      z.sp.position.set(0.55 + Math.sin(cyc * 5.2 + i * 1.7) * 0.13 + cyc * 0.3, 2.05 + cyc * 1.25, 0);
      z.mat.opacity = Math.sin(cyc * Math.PI) * 0.95;
    });
  }
}

/* ================= 说话气泡（监工互动用） ================= */
let nowSec = 0; // 主循环时钟（秒），say/expireSpeech 共用
function pickLine(pool, recent) {
  const cands = pool.filter((l) => !recent.includes(l));
  const line = cands.length ? cands[Math.floor(Math.random() * cands.length)] : pool[Math.floor(Math.random() * pool.length)];
  recent.push(line);
  while (recent.length > 4) recent.shift(); // 短期去重：最近 4 句不重抽
  return line;
}
function say(rt, text, dur = 3.8) {
  if (!BUBBLES_ON) return;
  const T = rt.three; if (!T.group) return;
  clearSpeech(rt);
  const b = makeBubble(text, true);
  b.sp.position.set(0, 3.35 + (b.hWorld - 1.04) / (2 * WS), 0); // 多行气泡更高，中心上移让尾巴仍对准头顶
  b.sp.scale.multiplyScalar(1 / WS);
  T.group.add(b.sp);
  // v8：停留时长按句长延长（每字约 0.17 秒、上限 8 秒），长句别没读完就消失
  const effDur = Math.max(dur, Math.min(8, 1.8 + text.length * 0.17));
  T.speech = { ...b, until: nowSec + effDur, baseScale: b.sp.scale.clone() }; // baseScale 供每帧距离补偿（updateSpeechScales）
  if (T.bubble) T.bubble.sp.visible = false; // 说话期间任务气泡让位，过期后恢复
}
function clearSpeech(rt) {
  const T = rt.three; if (!T.group) return;
  if (T.speech) { T.group.remove(T.speech.sp); T.speech.mat.map.dispose(); T.speech.mat.dispose(); T.speech = null; }
  if (T.bubble) T.bubble.sp.visible = true;
}
function expireSpeech() {
  for (const id of rosterOrder) { const rt = roster.get(id); if (rt.three.speech && nowSec > rt.three.speech.until) clearSpeech(rt); }
  for (const mon of monitors) { const rt = mon.rt; if (rt.three.speech && nowSec > rt.three.speech.until) clearSpeech(rt); }
}

/* ================= 监工（巡逻角色，不进花名册、不写数据文件） ================= */
const monitors = [];
// 巡逻点按区域几何现算（配置驱动）：中央与各区之间的走廊中点、各区朝中央一侧的门外点；
// 落在任何区域内部或圆厅范围内的点一律剔除——监工红线：不进总经理室、不站进工位区
let PATROL_POINTS = [[-13, -9], [13, 9], [-13, 9], [13, -9]]; // 兜底值，buildRuntime 时按配置重算
function computePatrolPoints() {
  const pts = [];
  for (const z of ROOM_DEFS.filter((r) => !r.round)) {
    pts.push([(CENTER.x + z.c[0]) / 2, (CENTER.z + z.c[1]) / 2]);
    const dx = CENTER.x - z.c[0], dz = CENTER.z - z.c[1];
    const len = Math.hypot(dx, dz) || 1;
    const off = Math.max(z.w, z.d) / 2 + 3;
    pts.push([z.c[0] + (dx / len) * off, z.c[1] + (dz / len) * off]);
  }
  const inside = (p) => ROOM_DEFS.some((z) => Math.abs(p[0] - z.c[0]) < z.w / 2 - 1 && Math.abs(p[1] - z.c[1]) < z.d / 2 - 1)
    || (GM_ROOM && Math.hypot(p[0] - GM_ROOM.c[0], p[1] - GM_ROOM.c[1]) < GM_ROOM.r + 2);
  const ok = pts.filter((p) => !inside(p));
  if (ok.length >= 2) PATROL_POINTS = ok;
}

function makeMonitorRT(id, name, color, x, z) {
  return {
    id, data: { id, name, status: 'idle', task: '' }, room: null, colorOverride: color, slot: 0,
    anchor: { x, z }, fwd: { x: 0, z: 1 }, angle: 0, desk: { x, z },
    sim: { x, z, tx: x, tz: z, wait: 0, heading: 0, phase: Math.random() * Math.PI * 2, moving: false, atDesk: false },
    three: {}, svg: {}, isMonitor: true, recentLines: { wake: [], work: [] },
  };
}
function addCap(rt, color) {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.285, 0.1, 12), mat);
  top.position.y = 1.15; rt.three.bodyG.add(top);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.03, 12), mat);
  brim.position.set(0, 1.1, 0.07); rt.three.bodyG.add(brim);
}
function buildMonitors() {
  const pa = PATROL_POINTS[0] || [-11, -7];
  const pb = PATROL_POINTS[Math.min(3, PATROL_POINTS.length - 1)] || [12, 10];
  const defs = [
    { id: 'monitor-wake', name: LANG === 'en' ? 'Waker' : '叫醒员', kind: 'wake', color: '#e07b39', cap: 0xe07b39, x: pa[0], z: pa[1] },
    { id: 'monitor-urge', name: LANG === 'en' ? 'Urger' : '催活员', kind: 'urge', color: '#c94f4f', cap: 0xc94f4f, x: pb[0], z: pb[1] },
  ];
  for (const d of defs) {
    const rt = makeMonitorRT(d.id, d.name, d.color, d.x, d.z);
    buildPerson(rt);
    addCap(rt, d.cap);
    monitors.push({ rt, kind: d.kind, mode: 'patrol', targetId: null, actTimer: 0, sayTimer: 0, wp: Math.floor(Math.random() * PATROL_POINTS.length), cooldown: new Map(), lastWakeId: null, detour: null, stayTimer: 0 }); // v11：lastWakeId/detour/stayTimer 供叫醒员轮换巡逻
  }
}
function moveMonitor(mon, dt, tx, tz, speed = 3.4) {
  const s = mon.rt.sim;
  const dx = tx - s.x, dz = tz - s.z;
  const dist = Math.hypot(dx, dz);
  if (dist > 0.15) {
    const step = Math.min(dist, speed * dt);
    s.x += (dx / dist) * step; s.z += (dz / dist) * step;
    s.heading = lerpAngle(s.heading, Math.atan2(dx, dz), Math.min(1, dt * 7));
    s.moving = dist > 0.4;
  } else s.moving = false;
  s.atDesk = false;
  return dist;
}
function standPoint(rt) {
  // 站到目标工位侧面（锚点沿其右手方向偏开 2.1，略靠椅背），不挡本人与屏幕
  const rx = rt.fwd.z, rz = -rt.fwd.x;
  return { x: rt.anchor.x + rx * 2.1 - rt.fwd.x * 0.2, z: rt.anchor.z + rz * 2.1 - rt.fwd.z * 0.2 };
}
function faceTarget(mon, rt) {
  const s = mon.rt.sim;
  s.heading = lerpAngle(s.heading, Math.atan2(rt.anchor.x - s.x, rt.anchor.z - s.z), 0.25);
}
function patrol(mon, dt) {
  const p = PATROL_POINTS[mon.wp % PATROL_POINTS.length];
  if (moveMonitor(mon, dt, p[0], p[1], 2.6) <= 0.5) mon.wp++;
}
function updateWakeMonitor(mon, dt) {
  // v11：叫醒员不再盯着一个人站死——在所有趴桌睡觉的人（sleepy/offline）之间轮流走动叫醒：
  // 走到一人身边停约 7–9 秒（说一两句赖床台词）就去下一个；只有一个人在睡时，停完先绕去一个巡逻点再折返；
  // 没人睡时照常全场巡场。谁都不许长时间定点站立
  const sleepers = rosterOrder.map((id) => roster.get(id)).filter((r) => isSleeping(r.data.status));
  if (!sleepers.length) { mon.targetId = null; mon.detour = null; mon.mode = 'patrol'; patrol(mon, dt); return; }
  if (mon.detour) { // 单人折返：先走到巡逻点再回来叫同一个人
    const p = mon.detour;
    if (moveMonitor(mon, dt, p[0], p[1], 3.0) <= 0.6) mon.detour = null;
    return;
  }
  let target = mon.targetId ? roster.get(mon.targetId) : null;
  if (target && !isSleeping(target.data.status)) { target = null; mon.targetId = null; mon.mode = 'patrol'; }
  if (!target) {
    // 轮换：从上一个叫过的人之后，沿花名册顺序找下一个还在睡的
    const start = mon.lastWakeId ? rosterOrder.indexOf(mon.lastWakeId) : -1;
    for (let k = 1; k <= rosterOrder.length; k++) {
      const cand = roster.get(rosterOrder[(start + k) % rosterOrder.length]);
      if (cand && isSleeping(cand.data.status)) { target = cand; break; }
    }
    if (!target) { patrol(mon, dt); return; }
    mon.targetId = target.id; mon.mode = 'go'; mon.stayTimer = 7 + Math.random() * 2; mon.sayTimer = 0;
  }
  const sp = standPoint(target);
  if (moveMonitor(mon, dt, sp.x, sp.z) <= 0.6) {
    faceTarget(mon, target);
    mon.sayTimer -= dt;
    if (mon.sayTimer <= 0) {
      say(target, pickLine(WAKE_LINES, target.recentLines.wake));
      mon.sayTimer = 3.5 + Math.random() * 2; // 停留期间说一两句
    }
    mon.stayTimer -= dt;
    if (mon.stayTimer <= 0) { // 到点就走，换下一个（对方真醒了没醒都轮换）
      mon.lastWakeId = target.id; mon.targetId = null; mon.mode = 'patrol';
      if (sleepers.length < 2) { // 只有一人睡：先去附近巡逻点绕一圈再折返，别杵在原地
        mon.wp = (mon.wp + 1) % PATROL_POINTS.length;
        mon.detour = PATROL_POINTS[mon.wp];
      }
    }
  }
}
function updateUrgeMonitor(mon, dt) {
  // 催活员：轮流催 idle/working 的人（总经理室的 Muse 绝不催、也绝不进去）；被催者回一句打工台词
  const eligible = (r) => r.id !== GM_ID && (r.data.status === 'idle' || r.data.status === 'working');
  let target = mon.targetId ? roster.get(mon.targetId) : null;
  if (target && !eligible(target)) { mon.targetId = null; target = null; mon.mode = 'patrol'; }
  if (!target) {
    const cands = rosterOrder.map((id) => roster.get(id)).filter((r) => eligible(r) && (mon.cooldown.get(r.id) || 0) < nowSec);
    if (cands.length) {
      target = cands[Math.floor(Math.random() * cands.length)];
      mon.targetId = target.id; mon.mode = 'go';
    }
  }
  if (!target) { patrol(mon, dt); return; }
  const sp = standPoint(target);
  if (moveMonitor(mon, dt, sp.x, sp.z) <= 0.6) {
    faceTarget(mon, target);
    if (mon.mode === 'go') {
      mon.mode = 'stay'; mon.actTimer = 5;
      const task = (target.data.task || '').trim();
      say(mon.rt, task ? `快干活：${task}` : pickLine(URGE_LINES, mon.rt.recentLines.work), 3.4);
      say(target, pickLine(WORK_LINES, target.recentLines.work), 4.2);
      mon.cooldown.set(target.id, nowSec + 50); // 同一人 50 秒内不连催
    }
  }
  if (mon.mode === 'stay') {
    mon.actTimer -= dt;
    if (mon.actTimer <= 0) { mon.targetId = null; mon.mode = 'patrol'; }
  }
}
function updateMonitors(dt) {
  for (const mon of monitors) {
    if (mon.kind === 'wake') updateWakeMonitor(mon, dt); else updateUrgeMonitor(mon, dt);
  }
}

/* ================= 名牌 / 飞书文字距离补偿（v7） ================= */
// 显示口径：全场名牌看起来一样大，以总经理头牌的实际可读大小为准。
// 名牌精灵世界尺寸本就相同，远处显小纯粹是透视——每帧按「本人距相机 ÷ 总经理距相机」
// 放大远处名牌（锚点成员自身系数恒为 1、观感不变），相机移动/缩放时实时跟随；系数钳在 [0.7, 2.4] 防极端视角失真。
let _refDist = 66; // 总经理名牌到相机的距离，每帧由 updateLabelScales 刷新；锚点缺失时用上一帧值
const _lv = new THREE.Vector3();
function computeRefDist() {
  const ref = roster.get(GM_ID);
  if (ref && ref.three.labelSp && camera) {
    ref.three.labelSp.getWorldPosition(_lv);
    return camera.position.distanceTo(_lv);
  }
  return _refDist;
}
function distFactor(worldPos, refDist) {
  if (!camera) return 1;
  return THREE.MathUtils.clamp(camera.position.distanceTo(worldPos) / refDist, 0.7, 2.4);
}
function updateLabelScales() {
  if (!camera) return;
  _refDist = computeRefDist();
  for (const id of rosterOrder) {
    const rt = roster.get(id);
    const sp = rt.three.labelSp; if (!sp || !rt.three.labelBase) continue;
    sp.getWorldPosition(_lv);
    sp.scale.copy(rt.three.labelBase).multiplyScalar(distFactor(_lv, _refDist));
  }
}

// v8：台词气泡与名牌同口径做距离补偿——远处成员的气泡按距离放大到与锚点名牌一样的可读字高，
// 否则默认全景视角下远端气泡字太小看不清（气泡本身已放大到 52px/世界宽 5.4，再叠这层补偿才达标）
function updateSpeechScales() {
  if (!camera) return;
  for (const id of rosterOrder) {
    const rt = roster.get(id);
    const S = rt.three.speech; if (!S || !S.baseScale) continue;
    S.sp.getWorldPosition(_lv);
    S.sp.scale.copy(S.baseScale).multiplyScalar(distFactor(_lv, _refDist));
  }
}

function tickThree(dt, t) {
  updateCamera(dt);
  updateLabelScales();
  updateSpeechScales();
  if (centerFx) { // 调度核心自转＋光环公转＋呼吸光
    centerFx.core.rotation.y += dt * 0.7;
    centerFx.core.position.y = 1.98 + Math.sin(t * 1.4) * 0.05;
    centerFx.halo.rotation.z += dt * 0.9;
    centerFx.halo.position.y = centerFx.core.position.y;
    centerFx.glow.intensity = 42 + Math.sin(t * 2.2) * 8;
  }
  for (const id of rosterOrder) { const rt = roster.get(id); stepSim(rt, dt, t); poseThree(rt, t); }
  updateMonitors(dt);
  for (const mon of monitors) poseThree(mon.rt, t);
  expireSpeech();
  renderer.render(scene3, camera);
}

function onResize() {
  const holder = $('scene');
  if (!renderer || !holder.clientWidth) return;
  renderer.setSize(holder.clientWidth, holder.clientHeight);
  camera.aspect = holder.clientWidth / holder.clientHeight;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', onResize);

/* ================= 2D 俯视图（与 3D 共用同一套落位） ================= */
const NS = 'http://www.w3.org/2000/svg';
function el(tag, attrs, parent) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs || {})) e.setAttribute(k, v);
  if (parent) parent.appendChild(e);
  return e;
}
const flights3 = [], flights2 = [];

function buildTwoD() {
  const svg = $('svg2d');
  svg.innerHTML = '';
  el('rect', { x: 0, y: 0, width: 820, height: 620, fill: '#22252e' }, svg);
  if (!GM_ROOM) return;
  // 总经理室：中央圆厅（金边），区域名读配置
  el('circle', { cx: S2(CENTER.x), cy: S2z(CENTER.z), r: GM_ROOM.r * 10, fill: GM_ROOM.flat, stroke: '#ffd166', 'stroke-width': 2 }, svg);
  const ct = el('text', { x: S2(CENTER.x), y: S2z(CENTER.z) + GM_ROOM.r * 10 + 16, 'text-anchor': 'middle', 'font-size': 14, fill: '#ffd166', 'letter-spacing': 3 }, svg);
  ct.textContent = GM_ROOM.name;
  // 四间矩形房 pod 与房牌（高管室例外：领地只描虚线轮廓，里面按人逐块画独立地块，与 3D 同口径）
  for (const z of ROOM_DEFS.filter((r) => !r.round)) {
    if (z.layout === 'plots') {
      el('rect', { x: S2(z.c[0] - z.w / 2), y: S2z(z.c[1] - z.d / 2), width: z.w * 10, height: z.d * 10, rx: 10, fill: 'none', stroke: 'rgba(255,255,255,0.10)', 'stroke-dasharray': '5 5' }, svg);
      for (const id of rosterOrder) {
        const rt = roster.get(id);
        if (rt.room.layout !== 'plots' || !rt.plot) continue;
        el('rect', { x: S2(rt.plot.x - rt.plot.w / 2), y: S2z(rt.plot.z - rt.plot.d / 2), width: rt.plot.w * 10, height: rt.plot.d * 10, rx: 10, fill: z.flat, stroke: 'rgba(255,255,255,0.14)' }, svg);
      }
    } else {
      el('rect', { x: S2(z.c[0] - z.w / 2), y: S2z(z.c[1] - z.d / 2), width: z.w * 10, height: z.d * 10, rx: 10, fill: z.flat, stroke: 'rgba(255,255,255,0.09)' }, svg);
    }
    const lt = el('text', { x: S2(z.c[0] - z.w / 2) + 11, y: S2z(z.c[1] - z.d / 2) + 23, 'font-size': 14, fill: '#a7b0bf', 'letter-spacing': 3 }, svg);
    lt.textContent = z.name;
  }
  // 汇报连线
  const gmRt = roster.get(GM_ID);
  for (const tid of Object.keys(TIER_BY_MEMBER).filter((id) => TIER_BY_MEMBER[id] === 1)) {
    const rt = roster.get(tid); if (!rt || !gmRt) continue;
    el('line', { x1: S2(gmRt.desk.x), y1: S2z(gmRt.desk.z), x2: S2(rt.desk.x), y2: S2z(rt.desk.z), stroke: '#6ea8ff', 'stroke-width': 1.4, opacity: 0.35, 'stroke-dasharray': '5 5' }, svg);
  }
  for (const id of rosterOrder) buildWorkstation2D(roster.get(id), svg);
  // 监工在 2D 里是两颗带名的巡逻点（位置由 tick2d 按其 sim 驱动）
  for (const mon of monitors) {
    const g = el('g', {}, svg);
    el('circle', { r: 7.5, fill: mon.kind === 'wake' ? '#e07b39' : '#c94f4f', stroke: '#fff', 'stroke-width': 1.4 }, g);
    const tx = el('text', { y: 20, 'text-anchor': 'middle', 'font-size': 9.5, 'font-weight': 600, fill: '#e8ecf3' }, g);
    tx.textContent = mon.rt.data.name;
    mon.svgG = g;
  }
}

function buildWorkstation2D(rt, svg) {
  const dx = S2(rt.desk.x), dy = S2z(rt.desk.z);
  const deg = Math.atan2(rt.fwd.x, -rt.fwd.z) * 180 / Math.PI;
  const ws = el('g', { cursor: 'pointer' }, svg);
  const deskG = el('g', { transform: `translate(${dx} ${dy}) rotate(${deg})` }, ws);
  el('rect', { x: -11, y: -6.5, width: 22, height: 13, rx: 2.5, fill: '#3a4152', stroke: 'rgba(0,0,0,0.35)' }, deskG);
  const mon = el('rect', { x: -6, y: -5.6, width: 12, height: 3.6, rx: 1, fill: '#51748f' }, deskG);
  const ring = el('circle', { cx: dx, cy: dy, r: 19, fill: 'none', stroke: '#ffd166', 'stroke-width': 2, display: 'none' }, ws);
  // 名字：工位下方，中文小一档（界面口径二）；长名再缩一档，相邻工位上下错层防重叠
  const nm = el('text', { x: dx, y: dy + (rt.slot % 2 ? 41 : 27), 'text-anchor': 'middle', 'font-size': hasCJK(rt.data.name) ? 9.5 : (rt.data.name.length > 10 ? 9 : 11.5), 'font-weight': 600, fill: '#e8ecf3' }, ws);
  nm.textContent = rt.data.name;
  if (!NAMES_ON) nm.setAttribute('display', 'none');
  // 任务气泡（只在 working 时，内容只有任务）
  const bub = el('g', { display: 'none' }, ws);
  const bubRect = el('rect', { x: 0, y: dy - 34, height: 17, rx: 8.5, fill: 'rgba(255,255,255,0.95)' }, bub);
  const bubText = el('text', { x: dx, y: dy - 22.5, 'text-anchor': 'middle', 'font-size': 9.5, fill: '#22262e' }, bub);
  // 人物（位置由 sim 每帧驱动）
  const person = el('g', {}, svg);
  el('circle', { r: 6.4, fill: rt.room ? rt.room.accent : '#7aa2f7', stroke: 'rgba(0,0,0,0.4)', 'stroke-width': 1 }, person);
  el('circle', { cy: -3.1, r: 3.2, fill: '#f2c9a0', stroke: 'rgba(0,0,0,0.25)', 'stroke-width': 0.6 }, person);
  const zzz = el('text', { x: 9, y: -8, 'font-size': 12, 'font-weight': 700, fill: '#b9c8ff', display: 'none' }, person);
  zzz.textContent = 'Zzz';
  ws.addEventListener('click', () => select(selectedId === rt.id ? null : rt.id, true));
  person.addEventListener('click', () => select(selectedId === rt.id ? null : rt.id, true));
  Object.assign(rt.svg, { ws, mon, ring, nm, bub, bubRect, bubText, person, zzz });
}

function applySvg(rt) {
  const S = rt.svg; if (!S.ws) return;
  const st = rt.data.status;
  S.ws.setAttribute('opacity', st === 'offline' ? 0.55 : 1);
  S.person.style.display = ''; // v4：睡着也是趴桌在座，不消失
  S.mon.setAttribute('fill', { working: '#9fd8ff', idle: '#51748f', sleepy: '#24313f', offline: '#10131a' }[st]);
  S.nm.setAttribute('fill', st === 'offline' ? '#5d6572' : '#e8ecf3');
  S.zzz.setAttribute('display', isSleeping(st) ? '' : 'none');
  if (st === 'working' && rt.data.task) {
    const short = rt.data.task.length > 13 ? rt.data.task.slice(0, 13) + '…' : rt.data.task;
    const wpx = Math.max(34, short.length * 10.5 + 16);
    // 上半房成员气泡在工位上方、下半房成员改放名字下方，避免压住上一排的名字
    const lower = rt.room && rt.anchor.z > rt.room.c[1] + 0.5;
    const by = lower ? S2z(rt.desk.z) + 46 : S2z(rt.desk.z) - (rt.slot % 2 ? 54 : 36);
    S.bubText.textContent = short;
    S.bubRect.setAttribute('x', S2(rt.desk.x) - wpx / 2);
    S.bubRect.setAttribute('width', wpx);
    S.bubRect.setAttribute('y', by);
    S.bubText.setAttribute('y', by + 11.5);
    S.bub.setAttribute('display', '');
  } else {
    S.bub.setAttribute('display', 'none');
  }
}

function tick2d(t, dt) {
  for (const id of rosterOrder) {
    const rt = roster.get(id);
    stepSim(rt, dt, t);
    const S = rt.svg; if (!S.person) continue;
    const deg = Math.atan2(Math.sin(rt.sim.heading), -Math.cos(rt.sim.heading)) * 180 / Math.PI;
    S.person.setAttribute('transform', `translate(${S2(rt.sim.x)} ${S2z(rt.sim.z)}) rotate(${deg})`);
    if (isSleeping(rt.data.status)) {
      S.zzz.setAttribute('y', -8 + Math.sin(t * 1.3 + rt.sim.phase) * 2.4);
      S.zzz.setAttribute('opacity', 0.6 + 0.35 * Math.sin(t * 1.3 + rt.sim.phase));
    }
  }
  updateMonitors(dt); // 2D 里监工照常巡逻（台词气泡只在 3D 显示）
  for (const mon of monitors) {
    if (mon.svgG) mon.svgG.setAttribute('transform', `translate(${S2(mon.rt.sim.x)} ${S2z(mon.rt.sim.z)})`);
  }
  stepFlights2(dt);
}

/* ================= 状态/选中 视觉同步（双视图） ================= */
function applyStateVisual(rt) { applyThree(rt); applySvg(rt); }
function applySelectionVisual() {
  if (ringSel) {
    const rt = selectedId ? roster.get(selectedId) : null;
    ringSel.visible = !!rt;
    if (rt) ringSel.position.set(rt.anchor.x, 0.58, rt.anchor.z);
  }
  for (const id of rosterOrder) {
    const S = roster.get(id).svg;
    if (S.ring) S.ring.setAttribute('display', id === selectedId ? '' : 'none');
  }
}

/* ================= 信封动画（task_start 触发） ================= */
function flyEnvelope(memberId) {
  const rt = roster.get(memberId); const from = roster.get(GM_ID);
  if (!rt || !from) return;
  if (view === '3d') {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.06, 0.68), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    const flap = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.04, 0.34), new THREE.MeshBasicMaterial({ color: 0xc9d6ee }));
    flap.position.set(0, 0.055, -0.16); flap.rotation.x = 0.45;
    g.add(body, flap); scene3.add(g);
    const a = new THREE.Vector3(from.desk.x, 3.2, from.desk.z);
    const b = new THREE.Vector3(rt.desk.x, 3.2, rt.desk.z);
    const mid = a.clone().add(b).multiplyScalar(0.5); mid.y += 3.8;
    flights3.push({ t: 0, dur: 1.5, curve: new THREE.QuadraticBezierCurve3(a, mid, b), mesh: g });
  } else {
    const svg = $('svg2d');
    const g = el('g', {}, svg);
    el('rect', { x: -8, y: -5.5, width: 16, height: 11, rx: 1.5, fill: '#ffffff', stroke: '#9db4d8' }, g);
    el('path', { d: 'M-8 -5.5 L0 1.5 L8 -5.5', fill: 'none', stroke: '#9db4d8', 'stroke-width': 1.2 }, g);
    const a = { x: S2(from.desk.x), y: S2z(from.desk.z) };
    const b = { x: S2(rt.desk.x), y: S2z(rt.desk.z) };
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - 42 };
    flights2.push({ t: 0, dur: 1.5, a, mid, b, g });
  }
}

function stepFlights3(dt) {
  for (let i = flights3.length - 1; i >= 0; i--) {
    const f = flights3[i]; f.t += dt / f.dur;
    if (f.t >= 1) { scene3.remove(f.mesh); flights3.splice(i, 1); continue; }
    f.mesh.position.copy(f.curve.getPoint(f.t));
    f.mesh.rotation.y += dt * 4;
  }
}
function stepFlights2(dt) {
  for (let i = flights2.length - 1; i >= 0; i--) {
    const f = flights2[i]; f.t += dt / f.dur;
    if (f.t >= 1) { f.g.remove(); flights2.splice(i, 1); continue; }
    const u = f.t, v = 1 - u;
    const x = v * v * f.a.x + 2 * v * u * f.mid.x + u * u * f.b.x;
    const y = v * v * f.a.y + 2 * v * u * f.mid.y + u * u * f.b.y;
    f.g.setAttribute('transform', `translate(${x} ${y}) rotate(${Math.sin(u * Math.PI * 2) * 12})`);
  }
}
/* ================= 派活飞书（dispatch / feedback 事件触发，v6；v13 信封重做） ================= */
// 管理层级与沟通路线（层级由数据包里每人的 tier 决定）：
//   总经理（tier=gm）→ 任何人；高管（tier=exec）→ 除总经理外任何人（高管互通）；
//   员工（tier=staff）→ 员工之间互通。派活信只沿合法路线飞——不出现员工/高管「派活给总经理」的信；
//   反馈信沿原派活路线反向飞回（那是回报、不算派活，照常飞，如员工向总经理回报）。
// v13 形态：一封看得见的信（信封纹理＋半透明简要题签）沿一条画出来的弧形轨迹管慢慢飞
// （4.2–6 秒、缓入缓出），到达后短停 1.2 秒便与轨迹一起淡出消失、不留残影；
// 信上只写一句话摘要（brief），详细信息看右侧事件流面板里该事件的 detail 行。
// 仅 3D 视图播放（2D 不加此动画）；路线不合法的事件照常进面板，只是不飞信。
const LETTER_STYLE = {
  dispatch: { line: 0x6ea8ff, seam: 'rgba(91,132,196,0.9)', pill: 'rgba(30,52,96,0.58)', edge: '#6ea8ff', text: '#eaf2ff', tag: '派活' },
  feedback: { line: 0xffb35c, seam: 'rgba(196,127,58,0.9)', pill: 'rgba(96,58,14,0.58)', edge: '#ffb35c', text: '#fff1de', tag: '回报' },
};
const LETTER_HOLD = 1.2;  // 到达后短停秒数（v13：传完就消失，不再久留）
const LETTER_FADE = 1.1;  // 淡出秒数
let pendingLetters = [];  // 待播队列 {delay, from, to, brief, kind}
let letters = [];         // 活动中的飞书

// 层级：0 总经理 / 1 高管 / 2 其它员工——以数据包里每人的 tier 为准；
// 远程模式下本地档案没有的成员，按所在区域布局兜底（round=总经理、plots=高管、其余=员工）
function tierOf(id) {
  if (TIER_BY_MEMBER[id] != null) return TIER_BY_MEMBER[id];
  const rt = roster.get(id);
  if (rt && rt.room) { if (rt.room.layout === 'round') return 0; if (rt.room.layout === 'plots') return 1; }
  return 2;
}
function legalDispatch(from, to) {
  const a = tierOf(from), b = tierOf(to);
  if (a === 0) return true;     // 总经理 → 任何人
  if (a === 1) return b !== 0;  // 高管 → 除总经理外任何人（含高管互通）
  return b === 2;               // 员工 → 员工互通
}

function queueLetter(ev, delay = 0) {
  if (!ev.from || !ev.to || ev.from === ev.to) return;
  // feedback 的合法性按「原路反向」判：员工回报总经理合法，是因为总经理派活给员工合法
  const ok = ev.type === 'feedback' ? legalDispatch(ev.to, ev.from) : legalDispatch(ev.from, ev.to);
  if (!ok) return; // 路线不合法：不飞信（事件本身照常进右侧面板）
  pendingLetters.push({
    delay, from: ev.from, to: ev.to,
    brief: String(ev.brief || ev.task || ''),
    kind: ev.type === 'feedback' ? 'feedback' : 'dispatch',
  });
}

function makeBriefSprite(brief, kind) {
  const st = LETTER_STYLE[kind];
  const label = brief.length > 16 ? brief.slice(0, 16) + '…' : brief;
  const text = `${st.tag}｜${label}`;
  return textSprite((g, w, h) => {
    let size = 54;
    const setF = () => { g.font = `600 ${size}px "PingFang SC","Microsoft YaHei","Noto Sans CJK SC",sans-serif`; };
    setF();
    while (g.measureText(text).width > w - 90 && size > 30) { size -= 3; setF(); }
    g.beginPath(); g.roundRect(8, 22, w - 16, h - 44, 34);
    g.fillStyle = st.pill; g.fill();
    g.lineWidth = 5; g.strokeStyle = st.edge; g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = st.text; g.fillText(text, w / 2, h / 2 + 2);
  }, 1024, 168, 7.6, 1.25);
}

// 信封面纹理（每类一张、全员共用）：米白纸面＋类型色边框＋封口折线＋邮票＋地址横线，
// 俯视等距视角下一眼能认出是信封，而不是白色小方块。
const ENV_TEX = {};
function makeEnvelopeTexture(kind) {
  if (ENV_TEX[kind]) return ENV_TEX[kind];
  const st = LETTER_STYLE[kind];
  const c = document.createElement('canvas'); c.width = 512; c.height = 360;
  const g = c.getContext('2d');
  g.fillStyle = '#fffaf0'; g.fillRect(0, 0, 512, 360);
  g.lineJoin = 'round';
  // 封口折线：上封口从两上角向中心收成 V，两下角折线向内收
  g.strokeStyle = st.seam; g.lineWidth = 10;
  g.beginPath();
  g.moveTo(8, 8); g.lineTo(256, 198); g.lineTo(504, 8);
  g.moveTo(8, 352); g.lineTo(198, 182);
  g.moveTo(504, 352); g.lineTo(314, 182);
  g.stroke();
  // 边框（类型色：派活蓝 / 回报橙）
  g.strokeStyle = st.edge; g.lineWidth = 15; g.strokeRect(7, 7, 498, 346);
  // 邮票：右上角类型色方块＋白色内框＋「派/回」字
  g.fillStyle = st.edge; g.fillRect(422, 24, 64, 76);
  g.fillStyle = '#fffaf0'; g.fillRect(432, 34, 44, 56);
  g.fillStyle = st.edge; g.font = '700 36px "PingFang SC","Microsoft YaHei",sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(st.tag[0], 454, 63);
  // 地址横线（左下浅灰三行，信面感）
  g.fillStyle = 'rgba(90,100,120,0.45)';
  g.fillRect(28, 266, 150, 10); g.fillRect(28, 290, 108, 10); g.fillRect(28, 314, 130, 10);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  ENV_TEX[kind] = tex;
  return tex;
}

function spawnLetter(p) {
  const from = roster.get(p.from), to = roster.get(p.to);
  if (!from || !to || view !== '3d' || !scene3) return; // 2D 视图不播（事件仍进面板）
  const st = LETTER_STYLE[p.kind];
  const a = new THREE.Vector3(from.desk.x, 3.3, from.desk.z);
  const b = new THREE.Vector3(to.desk.x, 3.3, to.desk.z);
  const dist = a.distanceTo(b);
  const mid = a.clone().add(b).multiplyScalar(0.5); mid.y += 2.2 + dist * 0.07;
  const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
  // 路线：沿弧线的轨迹管（粗管＋外层淡光晕），从起飞就整条画出来——告别 1px 细线看不见
  // depthWrite 关掉：轨迹管若写深度，会在信封正中凿出一个洞（管身在信面前方、先画先占深度）
  const routeMat = new THREE.MeshBasicMaterial({ color: st.line, transparent: true, opacity: 0, depthWrite: false });
  const route = new THREE.Mesh(new THREE.TubeGeometry(curve, 42, 0.055, 6), routeMat);
  const glowMat = new THREE.MeshBasicMaterial({ color: st.line, transparent: true, opacity: 0, depthWrite: false });
  const glow = new THREE.Mesh(new THREE.TubeGeometry(curve, 42, 0.14, 6), glowMat);
  route.renderOrder = 1; // 信封 renderOrder 更高：信压在轨迹之上，别让光晕把信面切成两截
  scene3.add(route, glow);
  // 信封本体：薄盒，上下两面贴信封纹理、四边纸色
  const g = new THREE.Group();
  const sideMat = new THREE.MeshBasicMaterial({ color: 0xf1e7d0, transparent: true });
  const faceMat = new THREE.MeshBasicMaterial({ map: makeEnvelopeTexture(p.kind), transparent: true });
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2.0, 0.08, 1.41),
    [sideMat, sideMat, faceMat, faceMat, sideMat, sideMat],
  );
  body.renderOrder = 2;
  const brief = makeBriefSprite(p.brief, p.kind);
  brief.mat.opacity = 0.92; // 题签半透明（底色本身已是 0.58 alpha），与 v11 气泡口径一致
  brief.sp.position.set(0, 1.85, 0); // 题签高高浮在信上方，别把信封本体挡住
  brief.sp.renderOrder = 3;
  g.add(body, brief.sp);
  g.position.copy(a);
  scene3.add(g);
  letters.push({
    phase: 'fly', t: 0, age: 0,
    dur: Math.min(6, Math.max(4.2, 3.4 + dist * 0.075)), // v13：慢慢飞（4.2–6 秒量级）
    holdT: 0, fadeT: 0, curve, route, routeMat, glow, glowMat, group: g,
    mats: [{ m: sideMat, base: 1 }, { m: faceMat, base: 1 }, { m: brief.mat, base: 0.92 }],
    briefTex: brief.tex,
    briefSp: brief.sp, briefBase: brief.sp.scale.clone(), // v7：飞书文字与名牌同口径做距离补偿
  });
}

function stepLetters(dt) {
  for (const p of pendingLetters) p.delay -= dt;
  const due = pendingLetters.filter((p) => p.delay <= 0);
  pendingLetters = pendingLetters.filter((p) => p.delay > 0);
  for (const p of due) spawnLetter(p);
  for (let i = letters.length - 1; i >= 0; i--) {
    const L = letters[i];
    L.age += dt;
    // 飞书文字与成员名牌同口径——按距离补偿到与总经理名牌一样大；
    // 0.8 是文字高对齐系数（飞书字 54px/168 画布 vs 名牌字 62px/112 画布，世界字高比约 1.25，取倒数让两者观感字高一致）
    if (L.briefSp && L.briefBase) L.briefSp.scale.copy(L.briefBase).multiplyScalar(distFactor(L.group.position, _refDist) * 0.8);
    if (L.phase === 'fly') {
      L.t += dt / L.dur;
      const u = 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, L.t)); // 缓入缓出：起落慢、中段稳，肉眼跟得住
      L.group.position.copy(L.curve.getPoint(u));
      L.group.position.y += Math.sin(u * Math.PI * 3) * 0.07; // 轻微上下飘，像纸在空中滑
      const tan = L.curve.getTangent(u);
      L.group.rotation.set(
        Math.sin(L.age * 2.1) * 0.06,
        Math.atan2(-tan.z, tan.x), // 信封长边顺着飞行方向
        Math.sin(L.age * 1.6) * 0.08,
      );
      const ramp = Math.min(1, L.age / 0.5); // 轨迹管起飞后 0.5 秒内亮到全值，之后全程可见
      L.routeMat.opacity = 0.6 * ramp;
      L.glowMat.opacity = 0.16 * ramp;
      if (L.t >= 1) L.phase = 'hold';
    } else if (L.phase === 'hold') {
      L.holdT += dt;
      if (L.holdT >= LETTER_HOLD) L.phase = 'fade';
    } else { // fade：轨迹、信封、题签一起淡出，完了全部销毁、不留残影
      L.fadeT += dt;
      const k = Math.max(0, 1 - L.fadeT / LETTER_FADE);
      L.routeMat.opacity = 0.6 * k;
      L.glowMat.opacity = 0.16 * k;
      for (const { m, base } of L.mats) m.opacity = base * k;
      if (L.fadeT >= LETTER_FADE) {
        scene3.remove(L.route); scene3.remove(L.glow); scene3.remove(L.group);
        L.route.geometry.dispose(); L.routeMat.dispose();
        L.glow.geometry.dispose(); L.glowMat.dispose();
        L.group.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
        for (const { m } of L.mats) m.dispose();
        L.briefTex.dispose(); // 信封纹理是全员共用的（ENV_TEX），不销毁
        letters.splice(i, 1);
      }
    }
  }
}

// 3D 帧循环里也要推进信封
const _tickThreeOrig = tickThree;
tickThree = function (dt, t) { _tickThreeOrig(dt, t); stepFlights3(dt); };

/* ================= 视图切换 ================= */
function initialView() {
  const q = new URLSearchParams(location.search).get('view');
  if (q === '2d' || q === '3d') return q;
  try { const s = localStorage.getItem('office3d.view'); if (s === '2d' || s === '3d') return s; } catch { /* 存不了不影响打开 */ }
  return '3d';
}
function setView(v, save = true) {
  view = v;
  $('scene').style.display = v === '3d' ? 'block' : 'none';
  $('view2d').classList.toggle('on', v === '2d');
  document.querySelectorAll('#viewToggle button').forEach((b) => b.classList.toggle('on', b.dataset.view === v));
  $('resetView').style.visibility = v === '3d' ? 'visible' : 'hidden';
  $('hint').textContent = v === '3d' ? '拖动旋转 · 滚轮缩放 · 点成员或右侧名单定位' : '点工位或右侧名单定位成员';
  if (v === '3d') onResize();
  if (save) { try { localStorage.setItem('office3d.view', v); } catch { /* 忽略 */ } }
}
document.querySelectorAll('#viewToggle button').forEach((b) => {
  b.addEventListener('click', () => setView(b.dataset.view));
});

/* ================= 主循环与启动 ================= */
const clock = new THREE.Clock();
function loop() {
  requestAnimationFrame(loop);
  if (!roster.size) return;
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  nowSec = t;
  if (view === '3d' && renderer) tickThree(dt, t);
  else if (view === '2d') tick2d(t, dt);
  stepLetters(dt); // 飞书队列与动画推进（spawn 时按当前视图决定播不播）
}

(async () => {
  await poll(true);
  setView(initialView(), false);
  loop();
  setInterval(() => poll(false), 3000);
})();
