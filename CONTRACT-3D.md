# 配置契约 · CONTRACT-3D（集成基准，以本文为准）

本文件定义「AI工作资源管理台」的数据包结构与办公室视图（3D/2D）的运行时契约。
管理台/设置/服务端按此实现；3D 模块按此消费。字段增删先改本文再改代码。
成员的资源类型模板、类型专用字段、凭据存放与单个资源包格式见 `CONTRACT-DATA.md`（第二轮补充，与本文同级生效）。

## 1. 数据包（data package）

一个 JSON 对象，`seed.json`（出厂）、`data.json`（运行时）、导入/导出文件三者同构：

```jsonc
{
  "format": "ai-resource-console",
  "version": 1,
  "appName": "AI工作资源管理台",              // 程序显示名，可改
  "settings": {
    "bubbles": true,                          // 头顶说话气泡总开关
    "names": true,                            // 头顶名称显示开关
    "lang": "zh",                             // "zh" | "en"：界面、区域名、状态名、台词按此取
    "dataMode": "local",                      // "local" | "remote"
    "remote": { "stateUrl": "", "eventsUrl": "" }  // 实时模式地址（使用者自填，可空）
  },
  "zones": [ /* 见 §2 */ ],
  "members": [ /* 见 §3 */ ],
  "events": [ /* 见 §4，本地模式的事件流 */ ],
  "lines": {                                  // 台词库，中英各一套、一句一个数组元素
    "wake":  { "zh": ["…"], "en": ["…"] },    // 赖床台词（被叫醒者说）
    "work":  { "zh": ["…"], "en": ["…"] },    // 打工台词（被催活者说）
    "urge":  { "zh": ["…"], "en": ["…"] }     // 催促台词（催活员说）
  }
}
```

## 2. 区域 zones[]

```jsonc
{
  "id": "dev",               // 唯一，[A-Za-z0-9_-]+
  "name": "开发部",           // 中文名
  "nameEn": "Engineering",   // 英文名（lang=en 时显示）
  "cx": 24, "cz": -9,        // 中心坐标（世界系，见 §5）
  "w": 26, "d": 34,          // 宽 / 深（世界单位），>=6
  "capacity": 20,            // 容纳人数（参考值；超员仍自动排布，只提醒）
  "color": "#e0af68",        // 主题色（名牌/成员点缀）
  "pod": "#4a3d27",          // 地面色
  "layout": "grid",          // "grid" 网格工位 | "plots" 独立地块 | "round" 圆形大厅
  "round": false             // 与 layout=round 同步的兼容字段
}
```

区域数量、人数均不设上限：渲染端必须按 zones/members 数组动态生成，
不许写死房间矩形、名单或人数。装不下时工位网格自动加密排布。

## 3. 成员 members[]

```jsonc
{
  "id": "demo-ceo",          // 唯一，[A-Za-z0-9_-]+
  "name": "林总监",           // 头顶名称，可改
  "zone": "gm",              // 所属区域 id
  "tier": "gm",              // "gm" 总经理 | "exec" 高管 | "staff" 员工
  "reportsTo": null,         // 上级成员 id 或 null
  "status": "working",       // working | idle | sleepy | offline
  "task": "统筹全局",         // 当前任务（working 时头顶/面板显示）
  "since": "2026-01-01T09:00:00+08:00",
  "detail": "简介…",          // 以下为详情字段，管理台抽屉与设置里可编辑
  "role": "总经理", "platform": "", "region": "",
  "specs": "", "access": "", "notes": ""
}
```

- 总经理：tier="gm" 的第一名成员为全场总经理（专座在 layout="round" 的区域中心南侧）。
- 呈现口径：working=坐姿打字+台灯亮+任务气泡；idle=坐姿待命+灯灭；
  sleepy/offline=趴桌睡+Zzz+灯灭（offline 另加名字变灰、屏幕全黑）。

## 4. 事件 events[]（与实时接口同格式）

```jsonc
{ "ts": "ISO 时间", "member": "成员id",
  "type": "status_change|task_start|task_done|task_update|note|dispatch|feedback",
  "from": "…", "to": "…", "brief": "一句话摘要", "detail": "详情（可选，只进面板）",
  "task": "与 brief 同值（兼容字段）", "by": "记录者" }
```

- dispatch/feedback 的 from/to 是**成员 id**；其余类型的 from/to 是**状态名**。
- 飞信路线（三层逻辑，按 tier 判定）：
  - 派活：gm → 任何人；exec → 除 gm 外任何人（含 exec 互通）；staff → staff。
  - 反馈：沿原派活路线反向（feedback X→Y 合法 ⇔ 派活 Y→X 合法）。
  - 不合法的事件照常进事件流面板，只是不飞信。

## 5. 世界坐标系（3D 与 2D 共用）

- 世界范围：x ∈ [-41, 41]，z ∈ [-30, 32]；2D SVG viewBox 820×620，
  映射 S2(x) = (x + 41) * 10，S2z(z) = (z + 30) * 10。
- 区域矩形以 (cx, cz) 为中心、w×d 展开；设置端钳制区域不出界（x ±40、z -29..31）。
- 工位落位：grid 区按成员数自动网格（cols ≈ sqrt(n × w/d)）；plots 区按人数均分地块；
  round 区只放总经理专座（锚点 = 圆心 + z 向南 3.6）。
- 渲染端兜底（3D 模块实现附注）：若数据包把其他成员也分到 round 区（设置端应避免），
  渲染端沿圆环（半径 0.52r）排座，不丢人；成员 zone 指向不存在的区域时落第一个 grid 区。
  监工巡逻点由渲染端按区域几何现算（中央↔各区走廊中点＋各区朝中央门外点，剔除落在
  区域内/圆厅内的点），不进圆厅；成员归属分组以 zone id 为键（改显示名不影响归属）。

## 6. 运行时接口（本地服务 server.py）

- `GET /api/data` → 当前数据包；`PUT /api/data` 保存（校验含 members/zones 数组）。
- `GET /api/seed` → 出厂种子。
- `GET /api/proxy?url=<http(s) 地址>` → 服务端转发（实时模式绕跨域用），失败回 502。
- 办公室页每 3 秒轮询：
  - 本地模式：状态/事件直接取数据包 members/events。
  - 实时模式：经 /api/proxy 拉 settings.remote 的两个地址；状态格式见 §3（可只有
    id/name/status/task/detail/since/reportsTo 子集）、事件为 JSONL 文本（§4）。
    区域/层级归属按**本地数据包同 id 成员档案**叠加；本地没有的成员落第一个
    layout="grid" 区域、层级按所在区布局兜底（round=gm、plots=exec、其余 staff）。
    拉取失败 → 顶部横幅明确提示并回退本地数据展示，**不许白屏**。
- 结构变更重载：办公室页对数据包算结构签名（zones 全量 + 每名成员的
  id/zone/tier/name + lang + names 开关），与上次不同 → 整页 location.reload() 重排；
  状态/任务类变化走增量更新不重载。远程模式下成员总数变化同样触发重载。

## 7. 显示开关与语言（渲染端必须遵守）

- settings.bubbles=false：不显示说话气泡（say 通道整体静默；任务气泡与 Zzz 不受影响）。
- settings.names=false：3D 名牌与 2D 名字都不显示。
- settings.lang="en"：区域名取 nameEn、状态名取英文、台词取 lines.*.en、
  面板 chrome 文案切英文（事件正文为数据原文，不翻译）。

## 8. 集成验收口径

1. 出厂演示数据（12 人 / 5 区）打开即完整渲染，零控制台报错。
2. 设置里改名 → 办公室名牌与面板同步变（重载或增量均可，结果一致）。
3. 数据包换成 51 人 + 6 区（多一个新区）→ 全部成员有工位、面板计数一致、无人丢失。
4. 布局示意图拖动区域/改大小/拖成员换区 → 保存后办公室布局随之变化。
5. 实时模式填可用接口 → 显示远程成员（含本地档案没有的新成员）；接口改成不可达 →
   出现回退提示且展示本地数据，页面不白屏。
6. 导出数据包 → 清空 → 导入 → 成员/区域/关系/设置完整还原。
