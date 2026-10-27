# NORA SPACE GitHub 同步方案

检查日期：2026-10-27。用户已明确接受 **Public** 仓库，替代此前 Private 要求。目标固定为 [blueisland410-takki/nora-space](https://github.com/blueisland410-takki/nora-space)，目标分支 `main`。

## 已核实的远程内容

- 仓库可读取，当前 visibility=public，唯一分支为 main。
- 最新且唯一提交：`7ee63027756936a3024c16175a3e847d6ebd368e`，说明 `Initial commit`，时间 2026-10-25 16:50:32（Asia/Shanghai）。
- 完整文件树只有一个 49 字节的 README.md，没有 src、package.json、锁文件或数据库迁移；因此远程尚未包含网站源码。
- 原 README 内容如下，整合时保持原文件不变：

```markdown
# nora-space
my personal work and learning space
```

## 本地检查

本地 `D:\nora-space` 已有完整的 Phase 1 / Phase 1.5 / Sprint A 应用源码：页面、组件、服务端操作、Supabase 客户端、项目配置、锁文件、CI、测试与两份迁移。本轮开始时 main 为 `7908940`，父提交为 `16dd14d`；原有 77 个跟踪文件，另有上一轮未提交的验收文档和只读 SQL。未来 Sprint B/C/D 仍未实现，不把它们算作已完成网站功能。

对两个本地历史提交及当前候选文件做了凭据模式检查：未发现真实 Publishable/Secret Key、JWT、GitHub Token、数据库密码连接串、私钥或数据库导出文件；当前候选文件也没有包含 .env.local 中真实 Publishable Key 的精确值。检查有覆盖边界，不等于能识别任意形式的秘密。

`.env.local`、node_modules、.next、.vercel、备份目录均被忽略；`.env.example` 仅保留占位符。文档中的 Supabase 项目 URL/ID 是项目标识，不是访问密钥；公开源码仍不能替代 Auth 与 RLS。真实用户数据不在本次上传范围内。

## 同步方法：保留双方历史和原 README

本地历史与远程初始提交没有共同祖先，直接推送会被拒绝。使用正常合并衔接双方历史；不重新初始化、不 reset、不 rebase 已有提交，也不强推。独立历史合并选项见 [Git merge 文档](https://git-scm.com/docs/git-merge)。

本地准备顺序：

1. 仅提交审查过的本地文档、CI、忽略规则和只读 SQL，保留已有应用提交。
2. 将完整的本地 README 复制为根目录 `PROJECT_GUIDE.md`，相对链接仍从根目录解析；已有 README 内容不会丢失。
3. 建立本地准备分支 `sync/github-main-20261027`，只读 fetch 目标远程 main。fetch 不更新远程仓库。
4. 使用 `git merge --allow-unrelated-histories --no-commit FETCH_HEAD` 合并。预期仅 README 存在 add/add 冲突；若远程已新增其他内容，停止并重新审查，不自动覆盖。
5. README 冲突采用远程版本；本地完整版保留在 PROJECT_GUIDE.md。只对这一个文件使用 `git restore --source=<已核对的远程提交> --staged --worktree -- README.md`，不使用全目录覆盖。选项含义见 [Git restore 文档](https://git-scm.com/docs/git-restore)。
6. 确认没有其他冲突，创建正常 merge commit。检查远程初始提交及本地 7908940 均为候选提交的祖先，远程 README blob 未变，新增文件无环境文件或敏感内容。

推送前需用户确认具体候选分支/提交和公开目标；这是此前“推送前先报告并确认”的要求。准备提交完成不等于已经上传。

确认后的远程步骤：

1. 再次读取远程 main；如果已前进，重新合并审查，不强推。
2. 配置 origin 为 `https://github.com/blueisland410-takki/nora-space.git`（已存在时先核对，不覆盖其他地址）。
3. 将本地 main 快进到审核通过的准备分支，普通推送 `git push -u origin main`。发生 non-fast-forward 或身份认证问题时停止排查；不要添加 --force。GitHub 拒绝落后分支推送的说明见 [GitHub push 指南](https://docs.github.com/en/get-started/using-git/pushing-commits-to-a-remote-repository)。
4. Git Credential Manager 若要求登录，由用户在浏览器完成 GitHub 登录/授权，不在聊天中提供密码或 Token。连接器读取权限不代表本机 Git 凭据已配置完成。

## 如何在 GitHub 网页确认上传成功

1. 打开仓库 Code 页面，确认分支选择器为 main。
2. 文件列表应出现 src、supabase、scripts、.github、package.json、package-lock.json、PROJECT_GUIDE.md 等；根 README 仍保留原来两行。
3. 点提交历史，确认最新提交 SHA 与推送完成报告一致，并且原始 `7ee6302 Initial commit`、本地 `16dd14d` 与 `7908940` 仍在历史中。
4. 查看 `.github/workflows/ci.yml`，再到 Actions 查看最新提交的 Check NORA SPACE。应完成类型生成、lint、typecheck、test、build、smoke；未运行或失败时不能宣布 CI 通过。
5. 确认文件树中没有 .env.local、node_modules、.next、数据库备份或私人数据文件。

上传源码不会自动迁移 Supabase，也不等于网站已部署。本轮不处理 Vercel，不运行数据库写入。

## Supabase 只读操作

当前没有直接接管用户桌面的工具，但 Supabase 插件现已连接，并已在既有项目完成元数据只读查询：新七表及三个业务函数不存在，迁移历史表不存在；旧四表 RLS 与 owner 策略存在，authenticated 另有多余 TRUNCATE 权限。已准备旧四表权限修正提案，并在尚未应用的 Sprint A SQL 中收紧默认授权；均未在远程执行。只读核对脚本位于 `supabase/checks/sprint_a_readonly.sql`，迁移及权限修改仍需另行确认，不能把管理连接的结构查询当作普通账户 CRUD 通过。
