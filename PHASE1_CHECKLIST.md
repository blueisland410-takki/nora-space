# Phase 1 / 1.5 验收清单

状态截至 2026-10-26。**代码完成**表示本地实现已写入；用户已反馈远程 SQL 已执行、私人账户已准备，但真实账户操作和线上功能仍待人工验收。具体部署顺序见 [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md)。

| 功能 | 状态 | 说明 |
| --- | --- | --- |
| Next.js / TypeScript / Tailwind / 基础 UI | 代码完成 | App Router、响应式布局、shadcn/ui 风格组件、lucide 图标 |
| 导航与占位模块 | 代码完成 | 所有模块入口有页面，未开发内容标“即将开放” |
| 私人账户登录 | 代码完成，真实账户待验收 | Supabase 邮箱密码、Cookie SSR、Proxy/服务端身份验证、退出登录；`disable_signup=true` 已远程复核，登录、刷新、退出仍需真实账户验收 |
| 数据库与 RLS | 用户反馈 SQL 已执行，匿名检查通过 | 四张表匿名读取均返回 `401 / 42501`；远程策略清单、登录后 CRUD 和跨账户隔离待验收 |
| Dashboard / Spotify 紧凑卡片 | 代码完成，待真实歌单验收 | 统计值读取真实数据；桌面卡片实测约 203px 高，官方 iframe 152px、无自动播放；无记录显示 0/空状态 |
| 任务管理 | 代码完成，待数据验收 | 新增、编辑、完成、删除、优先级、截止日期、今天/本周筛选 |
| 灵感工作室 | 代码完成，待数据验收 | CRUD、分类、按创建时间排序、关键词搜索 |
| Quick Capture | 代码完成，待数据验收 | 任务、灵感、网站收藏，保存状态和错误提示 |
| 资源收藏 | 代码完成，待数据验收 | CRUD、链接验证、外部打开、封面失败占位 |
| 智能日历 | Phase 1 代码完成；Sprint A 扩展待数据验收 | 月历、任务截止日期、设置时区；学习和健身安排需先执行新迁移 |
| Spotify 音乐 | 代码完成，待人工验收 | 标准歌单 URL 校验、官方紧凑 Embed、空状态、外部打开链接；Dashboard 无重复卡片 |
| 设置 | 代码完成，待数据验收 | 歌单、主题、时区持久化及退出 |
| UI / UX Phase 1.5 | 代码完成，部分待人工验收 | 蓝白浅灰主视觉、黑白信息层级和少量媒体红；深浅模式、模块卡片与移动布局已做代表性截图检查；真实账户交互待人工复核 |
| GitHub 私有仓库 / Vercel | 本地准备完成，远程未完成 | 本地 Git `main` 已初始化并检查忽略规则；远程账号与 Vercel 项目待确认，未部署、未推送 |

## 自动验证结果

以下命令和匿名路由检查于 2026-10-26 重新执行；真实账户操作仍另列为待人工验收。

- `npm run lint`：通过。
- `npm run typecheck`：通过。
- `npm run build`：通过，构建包含动态私人路由及 Next Proxy。本轮在受限网络沙箱中首次编译失败，在允许本地网络的环境中完整构建通过。
- `npm run dev`：曾为视觉检查启动；生产构建前已停止。临时预览路由和假数据已移除，最终构建未包含预览路由。
- `npm run smoke`：通过。真实生产服务返回登录页 HTTP 200；14 个私人路由均重定向到 `/login`，响应含 `private, no-store` 缓存头。
- Supabase 连接：`.env.local` 只含一组正确命名的 URL 和 Publishable Key 变量，URL 指向 `https://ixmjytrgzrsjgbwfzamz.supabase.co`，认证健康接口 HTTP 200；四张表均存在并对匿名读取返回 `401 / 42501`，符合当前 SQL 中撤销 `anon` 表权限的设计。
- Supabase Auth 公开设置：`/auth/v1/settings` 返回 `disable_signup=true`、`mailer_autoconfirm=false`。公开注册阻塞项已解除；公开接口未返回匿名登录开关，需在 Dashboard 继续确认。
- 登录/退出：代码审查确认邮箱密码登录、Cookie SSR、服务端身份验证和退出操作；修复了退出失败仍跳转登录页的问题。生产 smoke 再次通过匿名访问限制。真实账户的完整登录、会话保持和退出回归仍待人工操作。
- 响应式：本地浏览器对 375、768、1280、1440px 的临时假数据预览均无横向溢出；Spotify 官方 iframe 保持 152px。任务、灵感、收藏、日历、设置与占位页在手机和桌面视口完成截图检查。375px 日期格约 44px 宽；登录页 Tab 可依次聚焦邮箱、密码和提交按钮，移动导航可打开。真实账户页面及弹窗仍需人工检查。
- 色彩对比：主要正文、次级文字、链接及深浅模式按钮经配色计算均达到普通文字 4.5:1；交互焦点使用可见轮廓。
- 密钥与部署：未发现源码硬编码 Secret Key / Service Role Key 或生产域名硬编码 localhost；本地 Git 已初始化，`git check-ignore` 排除了 `.env.local`、`node_modules`、`.next`、`.vercel`、生成类型与构建缓存；远程和 Vercel 链接尚无。

## 待人工验收

1. 在 Supabase SQL Editor 用 README 中的只读查询确认四张表 RLS 已启用、每张表四项策略都在；不要重复执行或重置数据库。
2. 确认私人账户邮箱已验证；公开注册 `disable_signup=true` 已复查。匿名登录开关未在公开设置接口暴露，请在 Dashboard 保持 **Allow anonymous sign-ins = OFF**。
3. 用真实账户登录、刷新后保持会话，再退出；未登录访问私人路由的重定向已由生产服务自动检查。
4. 任务、灵感、收藏的增删改在刷新和另一浏览器中仍可见。
5. Quick Capture 写入三张表；故意输入非法链接时保留表单并显示错误。
6. 日历在所选时区下显示任务截止日期。
7. Spotify 有歌单显示播放器，无歌单显示添加入口；受限歌单有 Spotify 外部链接。
8. 深色模式保存并在刷新后保持；用 375px 手机视口检查私人页面导航、弹窗、日历、播放器和退出入口，含触屏与键盘操作。
9. 匿名拒绝已验证；用两个不同账户验证记录互不可见。没有第二个账户时，这一项保持待验收。
10. 按 [上线指南](PRODUCTION_DEPLOYMENT.md) 建立 GitHub Private 仓库前确认 `.env.local` 被忽略；在 Vercel 配置两个 `NEXT_PUBLIC_` 变量与 Node.js 24；在 Supabase Auth 检查正式 Site URL。若以后启用邮件回调，再实现路由并配置相应 Redirect URLs。

## 已知限制

- Supabase Auth 公开注册已关闭；匿名登录开关仅由用户在 Dashboard 报告为 OFF，尚不能经公开设置接口独立核验。
- 用户已反馈迁移和私人账户准备完成；由于本轮没有获取用户密码或会话，端到端持久化与多浏览器数据同步仍不能宣称通过。Vercel 部署尚未执行。
- Spotify 官方 Embed 是否能播放取决于歌单权限和用户的 Spotify 环境；本阶段没有 Spotify OAuth 或个性化推荐。
- 学习和健身已进入 Phase 2 Sprint A 本地实现阶段；新表迁移和真实数据验收未完成。AI 分析、Lark 集成和每周复盘仍是占位模块。

## 下一阶段建议

优先完成真实账户与 RLS 验收，再按 `PROJECT_ROADMAP.md` 扩展学习计划、内容创作与智能复盘。新增第三方接入时先明确授权范围和数据保存方式。

Sprint A 新功能和 SQL 的验收以 [PHASE2_CHECKLIST.md](PHASE2_CHECKLIST.md) 为准；本清单保留 Phase 1 / 1.5 的历史结果。
