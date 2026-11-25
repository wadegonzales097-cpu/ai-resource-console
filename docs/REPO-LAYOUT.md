# 仓库目录说明（给维护者）

本文件说明仓库里每个路径的用途、是否应该提交进版本库，以及数据是怎么流动的。面向第一次接手本仓库的维护者。

## 顶层

| 路径 | 用途 | 入库 |
| --- | --- | --- |
| `README.md` | 英文版说明（默认展示） | ✅ |
| `README.zh-CN.md` | 中文版说明 | ✅ |
| `LICENSE` | MIT 许可证 | ✅ |
| `server.py` | 本地服务：静态页面 + 数据读写 API + 实时模式转发，只用 Python 标准库 | ✅ |
| `start-windows.bat` | Windows 启动脚本（双击） | ✅ |
| `start-mac.command` | macOS 启动脚本（双击） | ✅ |
| `start.sh` | Linux 启动脚本 | ✅ |
| `seed.json` | 出厂演示数据：首次运行生成 `data.json` 的种子，也是「恢复演示数据」的还原点。**只能放中性演示内容** | ✅ |
| `data.json` | 使用者的工作数据，运行时生成/改写 | ❌ 已被 .gitignore 挡下 |
| `.gitignore` | 发布卫生规则：挡本地数据、数据包、密钥、本地配置 | ✅ |

## www/（前端）

| 路径 | 用途 |
| --- | --- |
| `www/index.html` | 管理台主页面：名单、详情抽屉、事件流、设置中心 |
| `www/office.html` | 办公室页面（3D / 2D），被主页面内嵌或新标签打开 |
| `www/src/app.js` | 办公室渲染：布局、双视图、轮询、面板、飞信动画 |
| `www/src/console.js` | 管理台与设置中心的界面逻辑 |
| `www/src/store.js` | 数据访问层：本地模式读写与实时模式拉取的统一入口 |
| `www/vendor/` | 内置的 three.js（MIT），运行时不依赖任何外网 CDN |

## docs/（维护文档）

| 路径 | 用途 |
| --- | --- |
| `docs/REPO-LAYOUT.md` | 本文件 |
| `docs/RELEASE-PRIVACY-CHECKLIST.md` | 发布前隐私自查清单：每次打 tag / 发 Release 前逐项过一遍 |

## screenshots/（演示截图）

README 用的演示截图。**截图必须来自演示数据**：截之前确认界面里是 `seed.json` 的演示团队，不带真实成员、真实任务和浏览器地址栏里的私人地址。

## 数据流（一图流）

```
seed.json ──首次运行──▶ data.json ──设置里改动──▶ data.json（自动保存）
                            │
                            ├─导出─▶ 数据包 JSON（用户自行保管，不入库）
                            └─导入─▶ 覆盖 data.json（另一台机器上完整还原）

实时模式：server.py 按设置里的地址拉取使用者的状态/事件接口，只读展示，
         拉不到时回退到本地 data.json；成员归位仍查本地 data.json 的同 id 档案。
```

## 什么永远不该出现在仓库里

- 任何人的真实成员名单、真实任务、真实组织信息；
- 真实服务器地址、域名、IP、账号、接入方式；
- 任何密钥、令牌、密码、证书（包括写在注释和截图里的）；
- 使用者导出的 `data.json` 和数据包。

演示数据（`seed.json`、截图）只能用虚构的示例成员与示例区域。发布前请按 `docs/RELEASE-PRIVACY-CHECKLIST.md` 全量自查。
