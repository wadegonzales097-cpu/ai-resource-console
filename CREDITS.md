# Credits · 署名与致谢

This file ships with the repository. It records the project's owner, every
third-party component used, and the design/inspiration sources, together with
their licenses — so nobody's name is left out.

本文件随仓库一同发布，记录本项目的所有者、所用第三方成分与设计/灵感来源及许可证，避免版权争议。

## Project owner · 项目所有者

- **BigKing** (GitHub: [wadegonzales097-cpu](https://github.com/wadegonzales097-cpu)) — project author and owner: initiated the project, defined the requirements, and accepted the deliverables. The code was written by the owner's AI assistant (Muse) under the owner's direction.
- **BigKing**（GitHub：wadegonzales097-cpu）—— 项目作者/所有者：本项目的发起、需求定义与验收均归 BigKing；代码由其 AI 助手 Muse 在其指示下编写。

The project itself is released under the MIT License (see `LICENSE`).

## Third-party code · 第三方代码

### three.js (r160)

- **What / 用途**: 3D rendering library. The official minified build is vendored at
  `www/vendor/three.module.min.js` and powers the 3D office renderer (`www/src/app.js`).
  No other third-party code is bundled.
- **Authors / 作者**: Copyright 2010–2023 Three.js Authors (originally created by
  Ricardo Cabello / Mr.doob and contributors).
- **License / 许可证**: MIT License.
- **Source / 来源**: https://github.com/mrdoob/three.js
- **License text location / 许可证文本位置**: the vendored file keeps its license
  header (copyright notice + `SPDX-License-Identifier: MIT`) at the top of
  `www/vendor/three.module.min.js`; the full MIT License text is reproduced in the
  appendix below.
- 说明：内置文件的文件头保留了版权声明与 SPDX MIT 标识；MIT 全文附在本文件附录中。

### Everything else · 其余部分

- `server.py` uses **only the Python standard library** — no third-party packages.
- The frontend (`www/`) is hand-written HTML/CSS/JavaScript: no frameworks, no web
  fonts, no icon packs, no CDN references. Fonts are the visitor's system font stack.
- 后端只用 Python 标准库；前端为手写代码，无框架、无网络字体、无图标包、不引用任何 CDN。

## Inspiration & design references · 灵感与设计参考（只借设计，未使用代码/素材）

- **Pixel Agents** — the virtual-office concept (AI workers visible as characters in
  an office) that inspired this project's office view.
  Source: https://github.com/pixel-agents-hq/pixel-agents (MIT License).
  Boundary: inspiration only — this repository contains no Pixel Agents code or assets.
  「虚拟办公室」点子源头；仅借概念，本仓库未使用其代码或素材。
- **ajsahni/agents-office** — design reference for the 3D office scene composition
  and the dispatch-desk imagery. Ideas only; no code or assets copied.
  Source: https://github.com/ajsahni/agents-office
  参考其 3D 办公室场景构图与调度台意象；仅借鉴设计，未复制代码或素材。
- **HarnessMD/munder-difflin** — design reference for the event/message stream
  presentation. Ideas only; no code or assets copied.
  Source: https://github.com/HarnessMD/munder-difflin
  参考其事件消息流的呈现设计；仅借鉴设计，未复制代码或素材。

## Original work · 本项目原创部分

Apart from the items above, everything in this repository — the console and
settings logic (`www/src/console.js`, `www/src/store.js`), the office renderer
(`www/src/app.js`), the server (`server.py`), the demo seed data, the speech lines,
and the documentation — is original work of this project.

除上列各项外，本仓库其余内容（管理台与设置逻辑、办公室渲染、服务端、演示种子数据、台词与文档）均为本项目原创。

---

## Appendix · 附录：MIT License (full text, as it applies to three.js)

MIT License

Copyright (c) 2010–2023 Three.js Authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
