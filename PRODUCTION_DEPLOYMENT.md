# NORA SPACE Phase 1.5 上线指南

状态：2026-10-27。本地 Git 已存在；GitHub 目标仓库可读取且用户接受 Public，但远程目前只有初始 README，**完整源码尚未同步，尚未部署 Vercel**。用户已关闭 Supabase 公开注册，最新只读复核仍为关闭。本地根目录为 `D:\nora-space`；未来 Vercel 的 Root Directory 选仓库根目录 `./`，不能填写本机 Windows 路径。

## 1. 上线门槛

| 项目 | 当前状态 | 发布前动作 |
| --- | --- | --- |
| 本地 lint / typecheck / build / smoke | 已通过 | 发布分支再运行一次 |
| Supabase URL 与 Publishable Key | 本地变量名称和值格式已核对，Auth 健康接口 200 | 在 Vercel 环境变量里填入同一项目的值 |
| 私人表匿名访问 | 四表匿名查询均为 401 / 42501 | 用两个真实账户完成 CRUD 与跨账户隔离验收 |
| RLS 远程策略 | 本地迁移文件有四表 RLS 和 owner 策略；远程 SQL 尚未只读核对 | 在 Supabase SQL Editor 运行 README 的只读查询 |
| Supabase 注册开关 | 已通过：`disable_signup=true` | 保持关闭；匿名登录开关需在 Dashboard 核对 |
| GitHub / Vercel | 本地 Git 与忽略规则已验证；远程 Public 仓库只有 README；无部署 | 先确认候选提交并同步现有代码；Vercel 本轮暂不处理 |

本阶段不需要 Secret Key、Service Role Key、用户密码或数据库直连密码。`NEXT_PUBLIC_` 变量会进入浏览器包，只能存放 Supabase URL 和 Publishable Key。GitHub Private 仓库只限制源码可见性；Vercel 网站是否公开仍由部署和访问控制决定。

## 2. Supabase 发布前核对

1. 在 Supabase Dashboard 选中项目 `ixmjytrgzrsjgbwfzamz`，核对 Project URL 为 `https://ixmjytrgzrsjgbwfzamz.supabase.co`。本地 `.env.local` 已包含同名变量，且文件被 `.gitignore` 排除；不要复制其内容到文档或聊天。
2. 在 Authentication → Users 检查私人账户和邮箱确认状态。**不要向开发者提供密码**。
3. 公开注册已关闭，2026-10-26 公开 Auth 设置返回 `disable_signup=true`；`mailer_autoconfirm=false` 与邮箱确认开启相符。公开接口没有返回匿名登录开关，仍需在 Dashboard 核对 **Allow anonymous sign-ins = OFF**。
4. 在 SQL Editor 运行 [README 的只读 RLS 查询](README.md#2-supabase-配置核对)。确认 `tasks`、`ideas`、`bookmarks`、`user_preferences` 均启用 RLS，四种操作策略都限定 `auth.uid() = owner_id`。不要重跑迁移或重置数据库。
5. 用私人账户 A 测试任务、灵感、收藏、设置的创建、读取、修改、删除和刷新持久化。若有账户 B，使用独立浏览器配置文件检查 B 不能读写 A 的记录；没有账户 B 时明确保留“待人工验收”。

## 3. GitHub 源码同步

2026-10-27 已核实目标 [blueisland410-takki/nora-space](https://github.com/blueisland410-takki/nora-space) 可以读取；当前为 Public，用户已明确接受公开源码，替代此前 Private 要求。远程 main 只有初始 README，本地应用代码尚未同步，不要重复创建仓库或重新开发网站。

按 [GITHUB_SYNC_GUIDE.md](GITHUB_SYNC_GUIDE.md) 操作：检查本地工作区与全部历史，保留远程初始提交和 README，将本地详细 README 另存为 PROJECT_GUIDE.md，在本地准备分支合并独立历史，报告候选提交后等待推送确认。后续只用普通 push；远程前进或出现其他冲突时重新核对，不强推、不删除已有文件。

环境文件、密钥、备份、私人数据、依赖和构建缓存不得提交；.env.example 只保留占位值。GitHub 网页上传成功标准与 CI 检查步骤已列入同步指南。Vercel 审核不阻塞本地 Git 准备，本轮不执行部署。

## 4. Vercel 项目设置

Vercel 集成可用但尚未连接，本轮无法核实所属账号或团队，也没有项目链接。请先确定要使用的 Vercel 账号或团队；建议部署项目名 `nora-space`。收到目标账号和发布确认后，再连接集成并创建或导入项目。

1. 从已同步完整代码的 GitHub `nora-space` 仓库导入 Vercel。Framework Preset 选 **Next.js**；Root Directory 选 `./`（因为 `package.json` 在仓库根目录）。Build Command 使用项目脚本 `npm run build`，它执行 `next build --webpack`。
2. Node.js Version 选 **24.x**，与本地通过构建的主版本及 `package.json` 的 `engines.node` 一致。若 Vercel 改变默认版本，应再核对该设置。
3. 在 Vercel Project Settings → Environment Variables 配置下表。Production 必填；仅在需要预览部署时给 Preview 配置相同 Supabase 项目，并注意预览站点也能访问同一私人数据服务。不要上传 `.env.local` 文件。

   | 变量名 | Production 值 | 说明 |
   | --- | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://ixmjytrgzrsjgbwfzamz.supabase.co` | 必须与本地及 Supabase Dashboard 一致 |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 从 Supabase Dashboard 复制该项目的 Publishable Key | 不要使用 Secret 或 Service Role Key |

4. 部署后在 Vercel 记录正式 HTTPS 域名。更改环境变量只会影响后续部署，需重新部署才会生效。应用不依赖本地电脑持续开机，生产源码未硬编码 localhost；本地脚本中的 `127.0.0.1` 仅用于 smoke 检查。

## 5. Supabase Auth URL 设置

部署前无法填写最终域名。部署得到正式地址后，在 Supabase Authentication → URL Configuration 把 **Site URL** 设置为实际使用的正式 `https://...vercel.app` 域名或自有域名，避免邮件链接回到 localhost。保留本地开发用的 `http://localhost:3000/**` 在 **Redirect URLs**。当前邮箱密码登录不传 `redirectTo`，不需要额外的生产回调白名单；仅在使用邮件确认、邀请、重置密码或 OAuth 时，添加代码实际使用的精确正式回调 URL。预览部署若确实需要 Auth 邮件回调，再添加受控的 Vercel Preview URL 模式。

当前应用只使用邮箱密码 `signInWithPassword`，登录成功后应用内部跳转 `/`，没有自定义 `/auth/confirm` 回调路由。不要把未实现的路径当作已经可用；以后增加邮件链接流程时，先实现路由、配置 `redirectTo`，再加入对应 Redirect URLs。

参考：[Supabase Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)、[Supabase SSR 客户端](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs&queryGroups=framework)、[Vercel Next.js](https://vercel.com/docs/frameworks/full-stack/nextjs)、[Vercel 环境变量](https://vercel.com/docs/environment-variables)、[Vercel Node.js 版本](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)。

## Phase 2 Sprint A 额外发布步骤

Sprint A 的学习与健身页面依赖独立的七张新表。先按照 [数据库迁移指南](DATABASE_MIGRATION_GUIDE.md) 对现有 Supabase 项目备份并执行 [`202610260001_sprint_a.sql`](supabase/migrations/202610260001_sprint_a.sql)，再按 [Phase 2 清单](PHASE2_CHECKLIST.md) 完成真实账户 CRUD、刷新持久化、匿名拒绝和双账户隔离测试。未执行迁移前页面只显示待启用提示，不应将模块标为已验收。新表不使用 Secret Key 或 Service Role Key。

仓库新增 GitHub Actions CI：Node.js 24 运行 lint、typecheck、单元测试和编译构建。CI 使用占位 Supabase 公共变量，只验证代码，不连接私人数据库；远程数据库和线上登录必须按 [正式上线人工验收](PRODUCTION_ACCEPTANCE.md) 单独检查。Vercel 正式环境仍需配置真实项目的两个 `NEXT_PUBLIC_` 变量。当前本地没有 Git 远程，尚未推送或部署；Vercel 账号仍待验证。

## 6. 发布后的人工验收

1. 无痕浏览器访问 `/`、`/tasks`、`/ideas`、`/resources`、`/settings`，应跳转到 `/login`，且不得看到私人数据。
2. 私人账户登录，刷新后会话仍在；退出后再访问私人路由应回到登录页。检查页面响应不是跨用户共享缓存。
3. 任务、灵感、收藏分别完成新增、编辑、删除；检查 Dashboard 统计、快速收集、日历和设置修改，并在刷新及另一台设备上确认一致。
4. 配置公开可嵌入的 Spotify 歌单，在首页测试播放、外部打开、更换歌单；删除歌单后检查空状态。受限歌单的播放取决于 Spotify 权限。
5. 使用 375px 手机、768px 平板、1280px 和 1440px 桌面视口检查导航开合、播放器控件、弹窗、表单、深浅模式与键盘焦点，不得横向溢出。
6. 用两个账户复核四表隔离和无权修改；检查 Vercel 构建日志与浏览器控制台没有敏感信息。若只有一个账户，隔离项不能判定通过。

公开注册已通过复核。本地 Git 和构建已准备就绪；真实账户数据、RLS 隔离、GitHub 私有仓库、Vercel 实际部署和线上回归仍未完成，因此状态仍为**未完成正式上线验收**。出现问题时先停止分享站点地址，在 Vercel 回滚到上一稳定部署；本次前端改版无数据库迁移。不要用 Service Role Key 绕过权限错误。
