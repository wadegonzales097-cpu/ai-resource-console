# 界面词条中英对照表（UI Strings）

> 来源：Gemini 生成（gemini-2.5-flash，2026-11-25），词条按管理台 www/index.html、www/src/console.js 与办公室 www/office.html 现状整理，共约 147 条。供主开发对齐程序内 I18N 字典与设置区文案；如与现行代码里的译法冲突，以本表为准并回改代码。

| 分组 | 中文 | English |
|---|---|---|
| 程序名 | AI工作资源管理台 | AI Resource Console |
| | 本地模式 | Local Mode |
| | 实时模式 | Real-time Mode |
| | 管理台 | Console |
| | 3D办公室 | 3D Office |
| | 在浏览器中打开 | Open in Browser |
| | 设置 | Settings |
| 成员名单 | 成员名单 | Member List |
| | 状态 | Status |
| | 名称 | Name |
| | 层级 | Role |
| | 当前任务 / 说明 | Task / Description |
| | 区域 | Area |
| | 工作中 | Working |
| | 空闲 | Idle |
| | 休眠 | Sleeping |
| | 离线 | Offline |
| | 总经理 | General Manager |
| | 高管 | Executive |
| | 员工 | Employee |
| | 容量 | Capacity |
| | 人（计数单位） | Members |
| | 超员，建议拉大区域或新增区域 | Over Capacity. Enlarge area or add new ones. |
| | 点下方名单里的成员可看详细内容。 | Click a member in the list below for details. |
| 当前任务 | 当前任务 | Current Task |
| | 简介 | Description |
| | 上级 | Manager |
| | 平台 | Platform |
| | 地区 | Region |
| | 规格 | Specs |
| | 接入方式 | Access Method |
| | 备注 | Notes |
| | 在设置中编辑 | Edit in Settings |
| 办公室 | 办公室 | Office |
| | 动态消息流 | Activity Feed |
| | 每 3 秒同步状态与事件 | Syncing status and events every 3 seconds |
| | 成员状态 | Member Status |
| | 事件流 | Event Stream |
| | 清除筛选 | Clear Filters |
| | 复位视角 | Reset View |
| | 拖动旋转 · 滚轮缩放 · 点成员或右侧名单定位 | Drag to rotate, scroll to zoom, click member/list to locate |
| | 视图切换 | View Toggle |
| | 数据加载失败。请确认本程序的本地服务正在运行（请用启动脚本打开，不要直接双击 HTML 文件），或到管理台「设置 → 数据源」检查设置。 | Data loading failed. Ensure local service is running (use startup script, not direct HTML file launch), or check 'Settings → Data Source' in Console. |
| | 实时数据源连接失败，正在展示本地数据。请到「设置 → 数据源」检查地址。 | Real-time data source connection failed, displaying local data. Please check the address in 'Settings → Data Source'. |
| | 实时模式（只读）：正在展示远程数据。 | Real-time Mode (Read-Only): Displaying remote data. |
| 状态变化 | 状态变化 | Status Changes |
| | 开始任务 | Task Started |
| | 完成任务 | Task Completed |
| | 任务更新 | Task Updated |
| | 备注（事件） | Note (Event) |
| | 派活 | Assign Task |
| | 回报 | Report |
| 上手说明 | 上手说明 | Getting Started |
| | 通用与显示 | General & Display |
| | 数据源 | Data Source |
| | 成员管理 | Member Management |
| | 区域管理 | Area Management |
| | 布局示意图 | Layout Diagram |
| | 台词库 | Dialogue Library |
| | 数据管理 | Data Management |
| | 当前是实时模式（只读看数据）：成员、区域、布局、台词的编辑已锁定。要修改请到「数据源」切回本地模式。 | Currently in Real-time Mode (read-only): Member, area, layout, and dialogue editing are locked. To modify, switch back to Local Mode in 'Data Source'. |
| 程序名称 | 程序名称 | App Name |
| | 界面语言 | UI Language |
| | 头顶说话气泡 | Head-up Speech Bubbles |
| | 监工互动时成员头顶冒的台词气泡 | Dialogue bubbles above members during interactions |
| | 头顶名称 | Head-up Name |
| | 3D / 2D 里每个人头顶的名字 | Names above members (3D/2D) |
| 模式 | 模式 | Mode |
| | 本地模式（可编辑） | Local Mode (Editable) |
| | 实时模式（只读） | Real-time Mode (Read-Only) |
| | 状态接口地址 | Status API URL |
| | 事件接口地址 | Event API URL |
| | 测试连接 | Test Connection |
| | 连接成功，读到 N 名成员。 | Connection successful. N members found. |
| | 连接失败 | Connection Failed |
| | 请先填写状态接口地址 | Please fill in the Status API URL first. |
| | 接口格式说明 | API Format Details |
| | 状态接口（JSON） | Status API (JSON) |
| | 事件接口（JSON Lines，一行一个 JSON） | Event API (JSON Lines, one JSON per line) |
| | status 取值 | Status Values |
| | type 取值 | Type Values |
| 选择成员 | 选择成员 | Select Member |
| | 新增成员 | Add Member |
| | 删除成员 | Delete Member |
| | 保存成员 | Save Member |
| | 名称（头顶显示） | Name (Head-up Display) |
| | 所属区域 | Area |
| | 当前任务 | Current Task |
| | 简介（详细内容） | Description (Details) |
| | 职责 | Role |
| | 唯一标识，字母/数字/连字符 | Unique ID (letters/numbers/hyphens) |
| | ID 与名称必填。 | ID and Name are required. |
| | ID 已存在 | ID already exists. |
| | 删除成员 X？ | Delete member X? |
| 选择区域 | 选择区域 | Select Area |
| | 新增区域 | Add Area |
| | 删除区域 | Delete Area |
| | 保存区域 | Save Area |
| | 区域名称（中文） | Area Name (Chinese) |
| | 区域名称（英文） | Area Name (English) |
| | 容纳人数 | Max Capacity |
| | 中心位置 X / Z | Center X / Z |
| | 大小 宽 / 深 | Size Width / Depth |
| | 布局方式 | Layout Type |
| | 网格工位 | Grid Workstations |
| | 独立地块（高管式） | Individual Plots (Executive Style) |
| | 圆形大厅（总经理式） | Circular Hall (GM Style) |
| | 主题色 | Theme Color |
| | 地面色 | Floor Color |
| | 区域里还有成员，先把他们移走再删。 | There are still members in this area. Move them out before deleting. |
| | 至少保留一个区域。 | At least one area must be kept. |
| | 删除区域 X？ | Delete area X? |
| 预定义区域名 | 总经理室 | GM's Office |
| | 管理室 | Management Office |
| | 开发部 | Development Dept. |
| | 运维部 | Operations Dept. |
| | 支持部 | Support Dept. |
| 布局与操作 | 拖动区域方块改位置、拖右下角圆点改大小；把成员小块拖到另一个区域里即可换区。改动即时保存，办公室布局随之变化。 | Drag area blocks to reposition, drag bottom-right circle to resize; drag member blocks to another area to move. Changes save instantly, office layout updates. |
| | 宽 | Width |
| | 深 | Depth |
| 台词库 | 赖床台词 | Awakening Dialogue |
| | 打工台词 | Working Dialogue |
| | 催促台词 | Prompting Dialogue |
| | 一行一句。赖床台词＝被叫醒的人说的；打工台词＝被催活的人说的；催促台词＝催活员说的。中英两套分别编辑，界面语言切到哪套就用哪套。 | One phrase per line. Awakening dialogue = spoken by the awakened; Working dialogue = spoken by those prompted; Prompting dialogue = spoken by the prompter. Edit Chinese and English sets separately; the active set matches the UI language. |
| | 保存台词 | Save Dialogue |
| | 监工 | Supervisor |
| | 叫醒员 | Awakener |
| | 催活员 | Prompter |
| 数据管理 | 导出数据包 | Export Data |
| | 导出 JSON | Export JSON |
| | 成员、区域、关系与全部设置都在里面，拷到另一台电脑导入即还原 | Contains all members, areas, relationships, and settings. Import to another computer to restore. |
| | 导入数据包 | Import Data |
| | 会覆盖当前全部数据，导入前建议先导出一份备份 | Will overwrite all current data. Export a backup before importing. |
| | 导入将覆盖当前全部数据，继续？ | Import will overwrite all current data. Continue? |
| | 导入失败 | Import Failed |
| | 恢复出厂演示数据 | Restore Factory Demo Data |
| | 恢复种子数据 | Restore Seed Data |
| | 恢复出厂演示数据？当前数据会被替换。 | Restore factory demo data? Current data will be replaced. |
| | 清空重来 | Clear All & Start Fresh |
| | 清空全部成员与事件 | Clear All Members & Events |
| | 只保留一个默认区域，从零开始搭 | Retain only one default area, start building from scratch. |
| | 清空全部成员与事件？ | Clear all members and events? |
| | 再确认一次：真的清空？需要的话先导出备份。 | Confirm once more: Really clear all? Export a backup if needed. |
| | 已保存 | Saved |
| | 程序数据加载失败。请用文件夹里的启动脚本打开本程序（Windows 双击 start-windows.bat，Mac 双击 start-mac.command），不要直接双击 HTML 文件。 | Program data loading failed. Please open this program using the startup script in the folder (Windows double-click start-windows.bat, Mac double-click start-mac.command), do not directly double-click the HTML file. |
| 引导 | 第一次使用？照这个顺序设，设完就能用 | First time? Set up in this order to get started. |
| | 两种数据模式 | Two Data Modes |
