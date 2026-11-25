> 初稿：Gemini 生成（2026-11-25）；第二轮修订（2026-11-25）：新增按类型添加资源、测试连接、凭据存放与单个导入导出说明，配置步骤改为先按类型加资源。第三轮修订（2026-11-25）：接入改走独立「接入资源」向导页，类型扩到十一类（新增数据库 / 对象存储 / 邮件服务 / 通用 HTTP 接口 / 代理订阅），新增「部署与远程访问」一节，演示数据为 17 位成员，步骤顺序与程序内「上手说明」一致。

# 上手说明 / Getting Started

## 这是什么？

欢迎来到「AI工作资源管理台」！你可以把它想象成一个给 AI 助手们准备的「3D 虚拟办公室」。

不管是你手头的 AI 模型、服务器还是各种自动化脚本，都可以化身为办公室里的「成员」。在这里，你能直观地看到谁在埋头苦干、谁在摸鱼睡觉，还能看到像飞信一样的派活和汇报动画。最重要的是，它完全运行在你的本地电脑上，不联网也能用，数据非常安全。

---

## 第一次打开：三步启动

为了让办公室正常运转，请按以下步骤操作：

1.  **准备文件**：解压或拷贝整个程序文件夹到你喜欢的位置。
2.  **启动程序**：
    *   **Windows 用户**：双击运行 `start-windows.bat`。
    *   **Mac 用户**：双击 `start-mac.command`（或者在终端运行 `start.sh`）。
3.  **浏览器查看**：程序启动后会自动打开浏览器。
    *   **⚠️ 友情提醒**：千万**不要**直接双击文件夹里的那个 `.html` 文件，那样会导致数据读不出来，画面会是一片空白。

**看到演示数据了？**
别担心，第一次打开时你会看到一套「出厂演示数据」（17 位演示成员）。这是为了让你感受一下效果的。你可以放心大胆地随便乱改、随便删，改坏了也没关系，在「设置」-「数据管理」里点一下「恢复出厂演示数据」就能重来。

---

## 照这个顺序配，配完就能用

想搭建属于自己的 AI 办公室？推荐按这八步走（和程序内「上手说明」的顺序一致）：

1.  **第一步：先接入资源（接入资源）**
    到「接入资源」向导页把你的资源一个个「请」进来，四步走完一个：**选类型**（共 11 类：远程服务器、本地设备、AI API、智能体平台、GPU、数据库、对象存储、邮件 SMTP、通用 HTTP 接口、代理订阅、其它）→ **填该类型的参数** → 点**「测试连接」**当场验通 → **「保存为资源」**。十一类逐个该填什么、测试怎么验，见下一节。
2.  **第二步：定区域（区域管理）**
    想好办公室分几个区（比如：生产区、存储区、测试区）。起个名字，定一下能坐多少人和格子大小，再把刚接入的资源分到合适的区域。区域数量不限，不够就点「新增」。
3.  **第三步：日常管理（成员管理）**
    改名称、换区域、调层级 / 状态 / 当前任务、补备注与类型字段，都在这里。「单个资源导入 / 导出」也在成员管理下方。提醒：凭据不跟随导出，换电脑要重新填一次。
4.  **第四步：排布局（布局示意图）**
    这是最解压的一步。在二维图里拖动区域方块改位置，或者把成员小块从一个区拽到另一个区。你在这里改完，主界面的 3D 办公室会跟着变。
5.  **第五步：调显示与台词（通用与显示 / 台词库）**
    在这里可以切换中英文，或者关掉成员头顶的名字和气泡。如果你觉得默认的台词不够有意思，去台词库换成你自己的风格。
6.  **第六步：选数据源（数据源）**
    决定你是想手动改状态（本地模式），还是让程序自动对接你的服务接口（实时模式）。详见下文。
7.  **第七步：想异地访问，看部署（部署与远程访问）**
    想在公司、路上、手机上也能打开，就照「部署与远程访问」里的三种跑法选一种做（家里常开小主机＋Cloudflare 通道最省事），填好对外地址后点「检测远程地址」验通。公网暴露务必加 Cloudflare Access 之类的访问保护，不要裸奔。详见下文专节。
8.  **第八步：记得备份（数据管理）**
    折腾好了，记得导出一个数据包存好，辛苦配好的数据万无一失。提醒一句：密码和 API Key 不会进数据包（只存在本机），换电脑时要重新填，见「换电脑 / 备份」一节。

---

## 接入你的第一个资源：向导四步

打开「设置 - 接入资源」，跟着向导走：**① 选类型 → ② 填参数 → ③ 测试连接 → ④ 保存为资源**。十一类各填什么：

*   **远程服务器（SSH）**：云 VPS、独立服务器。填主机（IP 或域名）、SSH 端口（默认 22）、用户名、验证方式（密码 / 私钥）；服务商、地区、规格、到期日建议顺手填上。
*   **本地设备**：局域网里的 NAS、路由器、小主机。填法和 SSH 一样，主机写内网地址就行。
*   **AI API**：填 API 基础地址、可用模型、额度说明，把 Key 填进凭据栏。
*   **智能体平台**：填平台名、入口网址、账号标识（不是密码）、派活方式、额度说明。
*   **GPU 资源**：填平台、账号标识、入口网址、接入方式、额度说明。
*   **数据库**：选引擎（MySQL / PostgreSQL / Redis / MongoDB），填主机、端口（默认随引擎）、用户名、库名，密码填进凭据栏。
*   **对象存储**：S3 兼容存储。填服务商、Endpoint、区域、Bucket，Access Key / Secret Key 填进凭据栏。
*   **邮件服务（SMTP）**：填主机、端口、加密方式（SSL / STARTTLS / 无）、用户名、发件地址，密码填进凭据栏。
*   **通用 HTTP 接口**：任意 HTTP(S) 接口。填 URL、方法（GET / HEAD / POST）、鉴权方式（无 / Bearer Token / 自定义请求头），可填期望状态码。
*   **代理订阅**：填订阅地址即可，流量 / 到期写进备注。
*   **其它**：都不合适时选它，自由记录；可顺手填主机或入口网址，方便测试。

**「测试连接」是怎么验的？**（十一类全都能测，由程序从服务端发起）

*   **AI API**：真的验——程序会拿你的 Key 去请求一次模型列表，能返回＝Key 可用，返回 401/403＝Key 被拒。
*   **SSH（远程服务器 / 本地设备）**：只验可达——能连上并读到 SSH 欢迎信息就算通，**不会尝试登录**，所以密码填错了测试也会显示通，这是正常的。
*   **智能体平台 / GPU**：打开它的入口网址，收到任何 HTTP 响应就算入口可达（同样不验登录）。
*   **数据库**：连上去走协议问候——MySQL 读握手、Redis 发 PING；PostgreSQL / MongoDB 只验 TCP 连通。
*   **对象存储**：带正规签名（SigV4）发一次列举请求：200＝通，403＝端点在但凭据被拒，404＝Bucket 不存在。
*   **邮件服务（SMTP）**：连上去读 `220` 问候并发送 EHLO，应答正常就算通。
*   **通用 HTTP 接口**：按你配的方法和鉴权发一次请求，报回实际状态码；填了期望状态码的，对上才算通。
*   **代理订阅**：把订阅内容拉下来数节点条数（vmess / vless / trojan / ss / hysteria），数到节点就算通。
*   **其它**：填了主机按 TCP 探，填了入口网址按 HTTP 探；都没填时按钮只给说明、不发请求。
*   验完的结果会记在成员身上，事件流里也会留一条记录；向导里先测后存的，结果会一并写进新成员。

**凭据存在哪儿？**
密码、私钥、API Key 只保存在程序文件夹里的 `secrets.json`，只在这台电脑上，界面里也只显示掩码和末 4 位。导出的数据包（整包和单个成员包都一样）**永远不含凭据明文**，只记一个「这个成员有凭据」的标记。所以换电脑导入之后，记得给每个成员重新填一次凭据——表单会提醒你。

**只想搬一个成员？**
在成员表单里可以把单个成员导出成 `.member.json` 小文件，在别处导入。单个导入只会新增、不会覆盖：名字（id）撞了会自动加 `-2`、`-3`，区域不存在就先落到第一个区域。

---

## 两种数据模式

在「设置 - 数据源」里，你可以随时切换两种玩法：

*   **本地模式（默认）**：
    数据全存在你电脑里。你可以在「成员管理」里手动改每个人的状态、在干什么活。这种模式下，一切都在你的掌控中，所有编辑功能都是开放的。
*   **实时模式（只读）**：
    如果你有现成的 API 接口，填上「状态接口」和「事件接口」地址，办公室就会变成「实时监控大屏」。
    *   **自动回退**：如果接口连不上，程序会自动切回本地数据并提醒你，不会让你看到白屏。
    *   **编辑锁定**：因为数据是从接口拉取的，实时模式下不能手动改成员信息。想改的话，先切回本地模式。
    *   **接口说明**：设置里有详细的 JSON 格式要求。状态接口负责汇报谁在干活（Working/Idle/Sleepy/Offline），事件接口（JSON Lines 格式）负责展示派活、汇报和说话的动画。

---

## 部署与远程访问：异地也能打开

程序默认只在本机打开（监听 `127.0.0.1`）。想在异地有网环境中顺畅打开它，去「设置 - 部署与远程访问」，三种跑法任选其一：

*   **方案 A · 本机自用（最简单）**：就在这台电脑上双击启动脚本用。不用通道、不用域名，下面什么都不用填；电脑关机或关掉启动窗口就打不开了。
*   **方案 B · 家里常开小主机 ＋ Cloudflare 通道（推荐）**：把整个程序文件夹拷到一台常开的机器（小主机、NAS、旧电脑），在上面跑启动脚本，记下它的监听端口；在那台机器上装 cloudflared（Cloudflare 官方免费工具），登录账号、建隧道，再把你的域名（需托管在 Cloudflare）指到这条隧道。程序本身不用开任何公网端口。
*   **方案 C · 云 VPS 部署**：把文件夹拷到 VPS 跑 `start.sh`，用 systemd、pm2 或 nohup 让它长期运行；通道二选一：同方案 B 用 Cloudflare 通道（最省事），或用 Nginx / Caddy 反向代理到本机端口并配好 HTTPS。

这一节里要填的：部署方式、对外访问地址、隧道名称（可选）、隧道令牌（可选）。两个按钮这样用：

*   **「生成通道配置」**：填好对外地址后点它，会按地址里的域名 ＋ 本机实际监听端口生成 cloudflared 的 `config.yml` ingress 片段和配套命令，复制下来并入你的隧道配置即可。它只生成文本、不会替你执行任何命令；令牌在片段里只是占位符。
*   **「检测远程地址」**：点它，程序会去请求 `{对外地址}/api/health` 并核对回应里的实例标识是不是本机这一份——是，才算真的通了；是别人的部署、格式不对、连不上，都会分别说明。

> **安全提醒（必看）**：本程序自身没有登录验证——地址只要公网可达，任何人打开都能查看并修改你的全部数据。Cloudflare 通道务必在 Cloudflare 后台加 Access 策略（比如只允许你的邮箱登录），反向代理就加登录认证或 IP 白名单。不要裸奔。隧道令牌是凭据，只存本机 `secrets.json`、界面只显掩码，不进任何导出文件。

---

## 换电脑 / 备份

想把办公室搬到另一台电脑？很简单：

1.  **导出**：在旧电脑的「数据管理」里点「导出数据包」，你会得到一个 JSON 文件。
2.  **拷贝**：把整个程序文件夹拷贝到新电脑。
3.  **导入**：在新电脑打开程序，在「数据管理」里选择刚才的 JSON 文件导入。
    *   **注意**：导入会覆盖当前所有内容，建议先备份。
    *   **凭据要重填**：密码和 API Key 只存在旧电脑的 `secrets.json` 里，不跟数据包走。导入完成后，按成员表单的提醒逐个重新填一次凭据即可。
4.  **其他选项**：如果你想彻底推倒重来，可以用「清空重来」，这会只留下一个默认区域，方便你从零开始搭建。

---

## 常见小问题

*   **问：为什么页面打开是空白，或者报错说数据加载失败？**
    *   答：最可能的原因是你直接双击了 HTML 文件。请务必使用 `start-windows.bat` 或 `start-mac.command` 启动。
*   **问：为什么我想改成员名字，设置里却不让改？**
    *   答：检查一下你是不是开启了「实时模式」。在实时模式下，数据是受接口控制的，处于锁定状态。请先去「数据源」切回本地模式。
*   **问：成员或区域的数量有上限吗？**
    *   答：没有上限。只要你的电脑跑得动，想加多少就加多少。
*   **问：改乱了，找不到原来的样子了怎么办？**
    *   答：去「设置 - 数据管理」，点击「恢复出厂演示数据」，一键回到最初的状态。

---
---

# Getting Started

## What is this?

Welcome to the "AI Resource Management Console"! Think of it as a "3D Virtual Office" designed specifically for your AI assistants.

Whether it’s an AI model, a server, or an automation script, you can turn them into "members" of this office. Here, you can visually monitor who is working hard, who is idling, or who is sleeping. You'll also see message animations for tasks being dispatched and reported. Most importantly, it runs entirely on your local machine—no internet required, ensuring your data stays private.

---

## First Open: 3-Step Startup

To get your office up and running, please follow these steps:

1.  **Prepare Files**: Extract or copy the entire program folder to your preferred location.
2.  **Launch Program**:
    *   **Windows Users**: Double-click `start-windows.bat`.
    *   **Mac Users**: Double-click `start-mac.command` (or run `start.sh` in the terminal).
3.  **View in Browser**: The program will automatically open your default browser.
    *   **⚠️ Friendly Reminder**: **Do NOT** double-click the `.html` file directly in the folder. Doing so will prevent the data from loading, and you'll see a blank screen.

**Seeing Demo Data?**
Don't worry! When you first open the console, you'll see a set of "Factory Demo Data" (17 demo members). This is just to show you how things work. Feel free to edit or delete anything. If things get messy, you can always go to **Settings > Data Management** and click "Restore Factory Demo Data" to start over.

---

## Recommended Setup Sequence

Want to build your own AI office? We recommend following these eight steps (the same order as the in-app Getting Started):

1.  **Step 1: Connect resources first (Add a Resource)**
    Invite your resources in, one at a time, with the wizard: **pick a type** (11 kinds: SSH server, local device, AI API, agent platform, GPU, database, object storage, SMTP mail, generic HTTP API, proxy subscription, other) → **fill in that type's parameters** → hit **Test connection** to verify it on the spot → **Save as resource**. The next section goes through all eleven types and how each test works.
2.  **Step 2: Define Areas (Area Management)**
    Decide how to divide your office (e.g., Production, Storage, Testing). Give them names, set the capacity and grid size, and file each resource into a zone. There’s no limit on the number of areas—just click "Add" if you need more.
3.  **Step 3: Day-to-day Management (Member Management)**
    Rename, move zones, change tier/status/task, and edit notes and type fields here. "Single resource import / export" is also under Member Management. Remember: credentials never travel with exports, so re-enter them once on a new machine.
4.  **Step 4: Arrange Layout (Layout Diagram)**
    This is the most satisfying part. Drag the area blocks to move or resize them, or drag member icons from one area to another. Your changes here will reflect instantly in the 3D office view.
5.  **Step 5: Adjust Display & Lines (General & Display / Lines Library)**
    Switch between Chinese and English, or toggle member names and speech bubbles. If you find the default lines boring, head to the Lines Library to add your own personality.
6.  **Step 6: Choose Data Source**
    Decide if you want to update statuses manually (Local Mode) or connect to your own service APIs (Real-time Mode). See the sections below for details.
7.  **Step 7: Reachable from Anywhere (Deployment & Remote Access)**
    To open the console from the office, the road, or your phone, pick one of the three setups in "Deployment & Remote Access" (an always-on home host + Cloudflare Tunnel is the easy one), fill in your public URL, and verify with "Check remote URL". Anything public must get an access layer (Cloudflare Access or similar) — never expose it bare. See the dedicated section below.
8.  **Step 8: Don't Forget to Backup (Data Management)**
    Once you’re happy with your setup, export a data package. This ensures all your hard work is saved. One heads-up: passwords and API keys are *not* part of the package (they live only on this computer), so you'll re-enter them after a move — see "Migration / Backup".

---

## Connect your first resource: the four-step wizard

Open **Settings > Add a Resource** and follow the wizard: **(1) pick a type → (2) fill in the parameters → (3) Test connection → (4) Save as resource**. What each of the eleven types asks for:

*   **Remote server (SSH)**: a cloud VPS or dedicated server. Host (IP or hostname), SSH port (default 22), username, auth method (password / key); provider, region, specs and expiry date are worth filling in too.
*   **Local device**: a NAS, router, or mini-PC on your own network. Same fields as SSH — the host is just the LAN address.
*   **AI API**: API base URL, the models you use, a quota note, and your key in the credential field.
*   **Agent platform**: platform name, entry URL, account ID (not the password), how you dispatch work, quota note.
*   **GPU resource**: platform, account ID, entry URL, how you access it, quota note.
*   **Database**: pick an engine (MySQL / PostgreSQL / Redis / MongoDB); host, port (defaults per engine), username, database name, and the password in the credential field.
*   **Object storage**: S3-compatible storage. Provider, endpoint, region, bucket, and the access key / secret key pair in the credential fields.
*   **Mail service (SMTP)**: host, port, encryption (SSL / STARTTLS / none), username, sender address, and the password in the credential field.
*   **Generic HTTP API**: any HTTP(S) endpoint. URL, method (GET / HEAD / POST), auth (none / Bearer token / custom header), and an optional expected status code.
*   **Proxy subscription**: just the subscription URL; put traffic/expiry notes in the notes field.
*   **Other**: pick this when none of the above fits, and record it freely; an optional host or entry URL makes it testable.

**How does "Test connection" verify things?** (All eleven types can be tested; the server side does the probing.)

*   **AI API**: for real — the app calls the API's model list with your key. A list comes back = the key works; 401/403 = the key was rejected.
*   **SSH (remote server / local device)**: reachability only — if it can connect and read the SSH banner, it passes. It **never tries to log in**, so a wrong password still shows "reachable". That's expected.
*   **Agent platform / GPU**: fetches the entry URL — any HTTP response means the entry point is reachable (no login attempted).
*   **Database**: connects and speaks the protocol greeting — MySQL handshake, Redis `PING`; PostgreSQL / MongoDB verify TCP connectivity only.
*   **Object storage**: sends a properly signed (SigV4) list request: 200 = works, 403 = endpoint alive but credentials rejected, 404 = bucket not found.
*   **Mail service (SMTP)**: connects, reads the `220` greeting and says `EHLO`; a sane reply = works.
*   **Generic HTTP API**: sends the request with your method and auth and reports the actual status code; if you set an expected status, it must match.
*   **Proxy subscription**: downloads the subscription and counts recognizable nodes (vmess / vless / trojan / ss / hysteria); more than zero = works.
*   **Other**: probes the host over TCP or the entry URL over HTTP, whichever you filled in; with neither, the button just explains and sends nothing.
*   The result is saved on the member, and a note lands in the event stream; a test run inside the wizard is carried into the new member when you save.

**Where do credentials live?**
Passwords, private keys and API keys are stored only in `secrets.json`, in the program folder on this computer; the UI only ever shows a mask plus the last 4 characters. Export files (whole package and single-member files alike) **never contain credential values** — only a "this member has a credential" mark. So after importing on a new computer, re-enter each member's credential once; the form will remind you.

**Moving just one member?**
From a member's form you can export that member alone to a small `.member.json` file and import it elsewhere. Single-member import only adds, never overwrites: a taken id gets `-2`, `-3`, … appended, and a missing zone falls back to the first zone.

---

## Two Data Modes

You can switch between two modes anytime in **Settings > Data Source**:

*   **Local Mode (Default)**:
    All data is stored on your computer. You can manually change each member's status and current task in "Member Management." In this mode, everything is under your control, and all editing features are unlocked.
*   **Real-time Mode (Read-only)**:
    If you have existing APIs, enter your "Status API" and "Event API" URLs. The office will transform into a live monitoring dashboard.
    *   **Auto-fallback**: If the connection fails, the program will automatically revert to local data and notify you, preventing a blank screen.
    *   **Editing Locked**: Since data is pulled from the API, member details cannot be edited manually in this mode. To make changes, switch back to Local Mode first.
    *   **API Specs**: Detailed JSON format requirements are available in the settings. The Status API reports who is busy (Working/Idle/Sleepy/Offline), while the Event API (JSON Lines format) handles animations for tasks and dialogue.

---

## Deployment & Remote Access: open it from anywhere

By default the console only opens on the machine it runs on (it listens on `127.0.0.1`). To open it smoothly from anywhere with internet, go to **Settings > Deployment & Remote Access** and pick one of three setups:

*   **Plan A · Local only (simplest)**: double-click the start script on this computer and use it there. No tunnel, no domain, nothing to fill in below. It stops when the computer or the start window closes.
*   **Plan B · Always-on home host + Cloudflare Tunnel (recommended)**: copy the whole program folder to an always-on machine (mini PC, NAS, old laptop), run the start script there, and note its listening port. On that machine install cloudflared (Cloudflare's free tool), log in, create a tunnel, and point your domain (hosted on Cloudflare) at it. The program itself needs no public port.
*   **Plan C · Cloud VPS**: copy the folder to a VPS, run `start.sh`, and keep it alive with systemd, pm2 or nohup. For the public path, either use a Cloudflare Tunnel exactly like Plan B (easiest), or reverse-proxy to the local port with Nginx / Caddy and HTTPS.

What you fill in there: the deployment mode, your public URL, an optional tunnel name, and an optional tunnel token. The two buttons:

*   **Generate tunnel config**: after you fill in the public URL, this generates the cloudflared `config.yml` ingress snippet (from the URL's domain + this instance's actual listening port) plus the commands to run — copy it into your tunnel config. It only generates text and never executes anything for you; a tunnel token appears only as a placeholder.
*   **Check remote URL**: the program requests `{your public URL}/api/health` and verifies the responding instance ID is this install's own — only then is it really "through". A different install, a malformed response, and an unreachable URL each get their own clear message.

> **Security — read this:** this program has no login of its own. If the URL is publicly reachable, ANYONE who opens it can view and change all your data. For a Cloudflare Tunnel, always add an Access policy in the Cloudflare dashboard (e.g. only your own email may log in); for a reverse proxy, add login auth or an IP allow-list. Never expose it bare. The tunnel token is a credential: it lives only in this machine's `secrets.json`, is shown masked, and never appears in any export.

---

## Migration / Backup

Moving your office to another computer? It’s easy:

1.  **Export**: Click "Export Data Package" in "Data Management" on your old computer to get a JSON file.
2.  **Copy**: Copy the entire program folder to the new computer.
3.  **Import**: Open the program on the new computer, go to "Data Management," and select your JSON file to import.
    *   **Note**: Importing will overwrite current data, so back up first!
    *   **Re-enter credentials**: Passwords and API keys live only in the old computer's `secrets.json` and never travel with the package. After importing, re-enter each member's credential once — the form will point out which ones are missing.
4.  **Other Options**: If you want a fresh start, use "Start from Scratch." This clears everything except for one default area.

---

## FAQ

*   **Q: Why is the page blank or showing a data loading error?**
    *   A: The most likely reason is that you double-clicked the HTML file directly. Please use `start-windows.bat` or `start-mac.command` to launch the app.
*   **Q: Why can't I edit member names in Settings?**
    *   A: Check if "Real-time Mode" is enabled. In this mode, data is controlled by the API and is locked. Switch back to Local Mode in the "Data Source" tab to edit.
*   **Q: Is there a limit to the number of members or areas?**
    *   A: No limits! As long as your computer can handle it, you can add as many as you like.
*   **Q: I messed up the configuration; how do I go back?**
    *   A: Go to **Settings > Data Management** and click "Restore Factory Demo Data" to return to the original state.
