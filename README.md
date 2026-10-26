# NORA SPACE

**Your personal operating system.** 一个私人在线工作与学习空间。Phase 1 提供登录、Dashboard、任务、灵感、网站收藏、日历、Spotify 歌单与个人设置；其他模块目前显示“即将开放”。Phase 1.5 保留紧凑的首页 Spotify 官方播放器，将全站改为蓝、白、浅灰的清晰视觉层级，媒体入口用少量红色强调，同时保留完整深色模式。

截至 2026-10-26，本地环境指向 Supabase 项目 `ixmjytrgzrsjgbwfzamz`。用户已确认执行 Phase 1 SQL 并准备私人账户；本轮再次验证 Auth 健康接口 HTTP 200，四张表拒绝匿名读取。Auth 公开配置返回 `disable_signup=true`，公开注册已关闭；`mailer_autoconfirm=false` 与“需要确认邮箱”的设置一致。公开设置接口没有返回匿名登录开关，因此该项仍需在 Dashboard 核对。真实账户的数据读写、跨账户 RLS 隔离与线上域名配置仍待人工验收。本地 Git 已初始化，尚无远程地址，也未部署。

Phase 1.5 的界面改动、尺寸与视觉验收见 [UI_REDESIGN_CHANGELOG.md](UI_REDESIGN_CHANGELOG.md)；私有 GitHub 仓库、Vercel 与 Supabase 的上线步骤见 [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md)；逐项状态见 [PHASE1_CHECKLIST.md](PHASE1_CHECKLIST.md)。

## 技术栈

Next.js App Router、TypeScript、Tailwind CSS、shadcn/ui 风格本地组件、lucide-react、Supabase Auth/PostgreSQL、`@supabase/ssr`。项目使用 Next.js 16 的 Proxy 和 Supabase Cookie 会话。所有私人数据操作经服务端验证用户身份，再交给数据库 RLS 校验所属用户。未使用 Secret Key 或 Service Role Key。

## 1. 安装与本地启动（Windows）

1. 安装当前受支持的 Node.js（本项目已在 Node.js 24 上构建）。
2. 在 PowerShell 中进入 `D:\nora-space`。
3. 执行 `npm install`。
4. 确认根目录有 `.env.local`，其中包含：

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key_here
   ```

   请把占位值换成自己的 Supabase 项目 URL 和 **Publishable Key**。仓库中的 `.env.example` 是模板；`.env.local` 已被 `.gitignore` 忽略。不要把密码、Secret Key、Service Role Key 放进前端环境变量。

5. 执行 `npm run dev`，打开 `http://localhost:3000`。首次访问私人页面会跳转到 `/login`。

项目脚本：`npm run lint`、`npm run typecheck`、`npm run build`、`npm run start`、`npm run smoke`。`smoke` 会启动已构建的生产服务，检查登录页和匿名访问重定向；请先执行 `npm run build`。此项目在 Windows 执行环境中采用 Next.js 官方支持的 Webpack 构建模式。

## 2. Supabase 配置核对

1. 在 [Supabase Dashboard](https://supabase.com/dashboard) 确认当前项目的 Project URL 为 `https://ixmjytrgzrsjgbwfzamz.supabase.co`，并核对 `.env.local` 中的 Publishable Key 属于同一项目。当前仓库只需要这两个变量。
2. 用户已确认在该项目执行 [`supabase/migrations/202610250001_phase1.sql`](supabase/migrations/202610250001_phase1.sql)。不要为验收重新建项目或重置数据库。需要复核远程结构时，在 SQL Editor 运行下方只读查询。
3. 在 **Authentication → Users** 确认私人账户存在且邮箱已确认。不要把密码发送给开发者或写进仓库。
4. **2026-10-26 复查通过**：`/auth/v1/settings` 返回 `disable_signup=true`。请在 **Authentication → Users** 核对允许登录的账户；公开设置接口未提供匿名登录开关的可核验字段，仍需在 Dashboard 确认 **Allow anonymous sign-ins = OFF**。
5. 在 **Authentication → URL Configuration** 检查 Site URL。当前邮箱密码登录在应用内直接跳转，不使用 Auth 邮件回调；启用邮箱确认、邀请或密码重置时，应把所用本地与正式回调地址加入 Redirect URLs。部署后把 Site URL 设置为正式 HTTPS 域名。

```sql
select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('tasks', 'ideas', 'bookmarks', 'user_preferences')
order by c.relname;

select tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('tasks', 'ideas', 'bookmarks', 'user_preferences')
order by tablename, policyname;
```

第一段应返回四行且 `rls_enabled` 均为 `true`；第二段应显示四张表各自的 `SELECT`、`INSERT`、`UPDATE`、`DELETE` 策略，条件限定 `auth.uid() = owner_id`。源码中的迁移文件不会自动修改远程数据库。

### 数据安全

四张私人表均启用 RLS。`SELECT`、`INSERT`、`UPDATE`、`DELETE` 分别限定 `auth.uid() = owner_id`；匿名角色没有表权限。Server Actions 从已验证的登录状态写入 `owner_id`，不会接受前端传来的所属用户 ID。所有任务、灵感、收藏和设置均保存在 Supabase，不依赖浏览器 localStorage。

## 3. 手动验收

完成 Supabase 配置后，按以下顺序检查：

1. 在未登录的浏览器打开 `/`、`/tasks`、`/settings`，应跳到 `/login`。
2. 用私人账户登录，应进入 Dashboard。刷新页面后应保持登录。
3. 在任务页新建任务，刷新页面；再修改、完成、删除。用另一浏览器登录同一账户，确认数据一致。检查“今天”“本周”筛选和日历截止日期。
4. 在灵感页新建、编辑、搜索和删除灵感；刷新后确认仍可读取。
5. 使用顶部快速添加按钮分别创建任务、灵感和网站收藏；确认成功或错误提示清晰。
6. 给网站收藏添加有效 URL 和可选封面图 URL；点击“打开网站”，并测试图片失效时的默认封面。
7. 在设置页保存时区、主题和标准 Spotify 歌单 URL；刷新后确认仍生效。没有歌单时 Dashboard 应显示添加入口。私人或受限歌单可能无法在 Embed 中播放，此时可点“在 Spotify 打开”。
8. 使用浏览器开发者工具在 375px 手机、768px 平板、1280px 与 1440px 桌面视口检查导航、播放器、弹窗和日历；本轮的代表性视觉预览已验证四种视口无横向溢出，日历 375px 日期按钮约 44px 宽，真实账户页面仍需人工复核。
9. 用浏览器无痕窗口验证未登录访问被送回登录页。用账户 A 创建一条可识别的测试记录，再在另一独立浏览器配置文件中用账户 B 登录：B 不应看到 A 的记录；B 创建的记录也不应出现在 A 的页面。分别刷新并检查四类数据。需要更强的 RLS 验证时，用各账户自己的会话向同一记录 ID 发起只读查询，并确认另一账户得不到该记录。不要向任何人提供密码或访问令牌。若只有一个私人账户，跨账户隔离仍标记为待验收。

## 4. GitHub 私有仓库

当前项目目录已初始化本地 Git `main`，尚无远程地址。只有在用户确认具体 GitHub 账号、目标仓库 URL 与 Vercel 项目后，才创建 **Private** 远程仓库并推送：

```powershell
git check-ignore -v .env.local
git ls-files .env.local
git remote add origin <你的私有仓库地址>
git push -u origin main
```

本地提交前已确认 `git check-ignore -v .env.local` 显示忽略规则，`git ls-files .env.local` 无输出。不要将 `.env.local`、`node_modules`、`.next` 或 `.vercel` 推送。若这些文件曾进入其他仓库的历史，需要先处理历史并轮换受影响的凭据。

## 5. Vercel 部署

1. 在 [Vercel](https://vercel.com/) 导入 GitHub 私有仓库，Framework Preset 选择 Next.js。项目已用 Node.js 24 和 `npm run build` 完成本地生产构建；Vercel 项目选择 Node.js 24。
2. 在 Project Settings → Environment Variables 添加 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`，值与本地一致。分别配置需要的 Production/Preview/Development 环境。不要添加 Secret Key、Service Role Key 或用户密码。变更变量后重新部署才会生效。
3. 部署后，在 Supabase **Authentication → URL Configuration** 将 Site URL 改为正式的 `https://...vercel.app` 或自有域名。本阶段的邮箱密码登录不依赖回调 URL；若以后启用邮件链接、邀请或密码重置，再将相应正式和预览回调地址加入 Redirect URLs。
4. 打开生产站点，重复“手动验收”的登录、保存、刷新、退出和手机浏览器检查；确认访问私人页面的响应不可被共享缓存。

当前代码与本地构建具备部署基础，Supabase 公开注册已关闭。GitHub 私有远程仓库、Vercel 项目与环境变量、Supabase 生产 Site URL、真实账户读写和跨账户隔离仍待完成或复核，因此网站仍未完成正式上线验收。本仓库未自动部署或推送。完整操作与上线门槛见 [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md)。

## 常见问题

- **页面显示读取任务或设置失败**：先确认迁移 SQL 已在正确的 Supabase 项目执行，且 `.env.local` 指向同一项目。
- **登录失败**：检查账户是否在 Authentication → Users 中存在、邮箱是否已确认，以及邮箱密码是否正确。
- **登录后又返回登录页**：检查 Supabase URL/Publishable Key、浏览器 Cookie、站点 URL 和浏览器控制台/终端错误。
- **保存失败或数据不可见**：检查 RLS 策略、表权限和当前账户是否正确。不要用 Service Role Key 绕过问题。
- **Spotify 无法播放**：确认链接是 `https://open.spotify.com/playlist/<歌单ID>`，歌单可供当前 Spotify 用户访问，并用“在 Spotify 打开”链接检查。
- **构建时出现 Turbopack 或 Windows 子进程错误**：本项目脚本已使用 Webpack；可重新安装依赖并运行 `npm run build`。在受限沙箱内运行时，可能需要允许构建子进程。
