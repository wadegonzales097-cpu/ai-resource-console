# 发布前隐私自查清单（草稿）

用途：每次发布新版本（打 tag、发 Release、公开仓库可见性变更）之前，由发布人逐项过一遍，审计员复核后签字。任何一项不通过，先修再发。

## 1. 内容扫描（全仓文本）

在仓库根目录执行，把命中逐条人工确认（演示内容可以放行，真实信息一律清除）：

```bash
# 疑似密钥/令牌格式
grep -rInE "(sk-[A-Za-z0-9]{16,}|ghp_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|e2b_[A-Za-z0-9]{16,}|xox[baprs]-[A-Za-z0-9-]+|-----BEGIN [A-Z ]*PRIVATE KEY-----)" .

# 疑似真实地址/IP/邮箱（演示邮箱、example.com 之类除外）
grep -rInE "([0-9]{1,3}\.){3}[0-9]{1,3}" --exclude-dir=.git .
grep -rInE "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.(com|net|org|io|cn)" --exclude-dir=.git .

# 密码/令牌字样附近的人工赋值
grep -rInE "(password|passwd|token|api[_-]?key|secret)\s*[:=]" --exclude-dir=.git .
```

- [ ] 上述扫描无真实凭据、无真实服务地址
- [ ] 代码注释、提交信息、文档里同样没有真实人名、真实组织名、私人域名

## 2. 数据文件

- [ ] `seed.json` 里只有虚构的演示成员与演示区域（id 以 demo 语义命名、人名是示例人名）
- [ ] `seed.json` 的成员详情字段（platform / region / access / notes）无真实地址与接入信息
- [ ] `data.json` 没有被提交（`git ls-files | grep data.json` 应无结果，它只应作为种子被忽略）
- [ ] 仓库里没有任何导出的数据包文件（`*-export.json`、`data-package*.json`、`exports/`）

## 3. .gitignore 生效验证

```bash
git check-ignore -v data.json            # 应命中规则
git status --porcelain                    # 不应出现 data.json / 数据包 / .env
```

- [ ] `git check-ignore` 对 data.json、数据包、`.env`、`*.key` 均命中
- [ ] `git status` 干净，没有不该入库的文件待提交

## 4. 截图与图片

- [ ] `screenshots/` 全部截图来自演示数据（演示成员名、演示区域名）
- [ ] 截图里没有浏览器地址栏的私人地址、没有系统通知、没有桌面上的私人文件

## 5. Git 历史

- [ ] 历史提交里从未出现过真实数据/密钥（出现过的话，光删当前文件不够，需重写历史或重建仓库）
- [ ] 提交者信息（name/email）是打算公开的身份

## 6. 第三方与许可

- [ ] `www/vendor/` 的 three.js 许可文件保留完整
- [ ] `LICENSE` 在位，README 的许可证一节与实际一致

## 7. 发布动作复核

- [ ] Release 附带的压缩包是从干净检出打的，不含工作区里的 `data.json`
- [ ] 发布说明里没有内部信息（内部地址、内部代号、未公开计划）
- [ ] 审计员复核完成并在本清单副本上记录日期与结论

---

记录：发布版本 ______　发布人 ______　审计员 ______　日期 ______　结论：通过 / 不通过（原因：______）
