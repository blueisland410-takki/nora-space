# NORA SPACE 正式上线人工验收

> 最新状态（2026-10-29）：学习/健身七表已创建，原四表权限与关联索引已修复。以下旧章节包含迁移前记录；当前事实和待办见 [LAUNCH_STATUS.md](LAUNCH_STATUS.md)。请勿重复执行已有建表脚本。

状态：Sprint A 本地代码已准备，远程 SQL、真实账户和线上部署仍待验收。网站目前**尚未可宣称正式上线**。

## 按顺序执行

1. 在现有 Supabase 项目按 [数据库迁移指南](DATABASE_MIGRATION_GUIDE.md) 先运行只读 schema/历史/权限核对，再判断是否需要迁移；核对备份并取得明确确认后才执行。已有对象不要重复迁移。新表接口 404/PGRST205 不等于迁移从未执行，详见 [云端验收记录](SPRINT_A_CLOUD_ACCEPTANCE.md)。
2. 用私人账户在本地登录，测试学习、健身、任务、灵感、收藏和设置的创建、编辑、删除及刷新后持久化；退出后访问私人页面应跳转登录。
3. 若有第二个账户，用另一个浏览器配置文件验证两账户不能互看或修改对方记录。不要分享密码。只有一个账户时明确保留这项待人工测试。
4. 检查 Dashboard、日历、Spotify、快速添加在桌面与手机上的实际数据和交互。测试宽度 375、768、1280、1440px，以及深浅模式和键盘 Tab。
5. 目标 `blueisland410-takki/nora-space` 已可读取，用户已接受 Public。按 [同步指南](GITHUB_SYNC_GUIDE.md) 保留原 README 和双方提交历史，经确认后普通推送；检查没有 .env.local、node_modules、.next、备份或密钥，并查看 Actions 的类型生成、lint、typecheck、test、build、smoke 结果。
6. Vercel 账号验证完成后，先确认目标账号、项目名、仓库 URL 与操作，再导入并部署。设置生产环境变量名 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`，不要使用 Secret Key 或 Service Role Key。
7. 获得生产 HTTPS 地址后，在 Supabase Auth 设置 Site URL，并按当前实际登录流程配置 Redirect URLs；保留本地开发地址。线上重复登录、CRUD、刷新、退出、RLS、手机检查。

## 通过标准

真实账户可在 HTTPS 网站完成私人数据的增删改查并在刷新后保留；未登录访问被拦截；跨账户不能读取或修改；生产环境使用正确 Supabase 项目；CI、Vercel 构建与浏览器无关键错误。若无法取得第二账户，只能标记其隔离测试未完成，不能宣称完全通过。

没有部署地址之前，线上 URL 一栏为“未部署”。本地自动检查及 CI 使用占位环境变量，覆盖编译、静态声明/统计和匿名路由，不连接私人数据库，不代替真实账户验收。本轮 Vercel 暂不处理，上述部署步骤留待账号审核通过并获确认后执行。
