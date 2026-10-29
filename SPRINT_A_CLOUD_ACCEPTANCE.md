# Sprint A 云端验收与 GitHub 准备记录

> 最新状态（2026-10-29）：学习/健身七表已创建，原四表权限与关联索引已修复。以下旧章节包含迁移前记录；当前事实和待办见 [LAUNCH_STATUS.md](LAUNCH_STATUS.md)。请勿重复执行已有建表脚本。

审查开始：2026-10-26；续查更新：2026-10-27；项目：`D:\nora-space`；Supabase：`ixmjytrgzrsjgbwfzamz`。Vercel 账号仍在审核，本轮不处理 Vercel。

## 状态总览

| 分类 | 项目 | 本轮结论 |
| --- | --- | --- |
| 已完成 | SQL 静态审查 | 七表、65 字段、28 条 owner 策略；无 DROP TABLE / TRUNCATE；未修改旧四表。触发器删除/外键级联与权限限制详见迁移指南 |
| 已完成 | 远程只读探测 | Auth 200；公开注册关闭；旧四表匿名读取拒绝；新七表 API 不可用，详见下表 |
| 已完成 | Git / 忽略 / 模式扫描 | main；HEAD 7908940；已有两次提交；无 remote。未发现已跟踪环境文件、依赖或构建缓存，历史凭据模式扫描未发现命中 |
| 已完成 | CI 准备与本地回归 | 已补 Next 类型生成、smoke、只读 token 权限、超时及全步骤占位环境配置；本地检查结果见下文 |
| 已完成 | 操作文档 | 只读 schema 审计、备份/恢复、14 项功能用例、双账户 RLS 方案、B/C/D 依赖与迁移顺序 |
| 已完成 | 远程 schema / 迁移历史 / 权限 | Supabase 已连接；新七表/三个函数不存在，历史表不存在；旧四表 RLS 与 owner 策略正确，但普通角色权限过宽 |
| 待人工验证 | 真实账户 CRUD / 持久化 / RLS | 没有普通账户会话，未进行真实登录写入或双账户隔离测试；不请求密码/令牌 |
| 待人工验证 | 备份与恢复能力 | 未取得可用备份及恢复覆盖范围的证据，未做恢复演练 |
| 未完成 | GitHub 源码同步 / 推送 / Actions | 已能读取 Public 仓库，用户接受公开；远程只有初始 README，完整源码尚未推送 |
| 未完成 | Sprint B/C/D | 仅规划，没有新迁移或 AI API 调用；没有开通付费资源 |
| 阻塞 | Sprint A 云端验收与执行迁移 | 结构/历史已核对，本地权限修正已准备；仍需备份证据和远程执行确认，随后验证普通账户 CRUD |
| 阻塞 | 进入 Sprint B 正式迁移 | A 云端验收尚未结束；不能声明已具备正式使用条件 |

## 远程只读证据

最新探测时间：2026-10-27 15:25:25 UTC / 23:25:25 Asia/Shanghai，与 2026-10-26 的探测结果一致。环境文件中的 URL 与预期项目一致，使用已有 Publishable Key，未输出 Key 内容，未使用 Secret/Service Role。REST 查询仅请求 `owner_id` 且 `limit=0`，不收集私人记录。

| 请求 | 结果 |
| --- | --- |
| /auth/v1/health | HTTP 200 |
| /auth/v1/settings | HTTP 200；disable_signup=true；mailer_autoconfirm=false |
| tasks、ideas、bookmarks、user_preferences | 四表各 HTTP 401 / 42501 |
| learning_goals、learning_tasks、study_sessions | 三表各 HTTP 404 / PGRST205 |
| fitness_settings、fitness_plans、workout_sessions、fitness_video_bookmarks | 四表各 HTTP 404 / PGRST205 |

PGRST205 表示当前 API schema cache 未找到表，不能据此认定从未执行迁移，也不能作为新表 RLS 已通过的证据。旧表拒绝匿名 SELECT 只证明该路径被拒绝，不证明全部策略及跨账户隔离。匿名登录开关未由公开接口返回，仍以 Dashboard 人工核对为准。

随后 Supabase 插件连接成功，在只读事务中查询数据库目录，得到更明确的证据：

- 项目 nora-space，ID 与 URL 正确，状态 ACTIVE_HEALTHY。
- 七张 Sprint A 表与三个业务函数当前均不存在；因此没有新表的列、约束、索引、策略或触发器可与迁移逐项比对。
- auth.uid() 与 public.set_updated_at() 已存在；后者返回 trigger，SECURITY INVOKER、空 search_path，与迁移依赖一致。
- Phase 1 四表 RLS=true，表所有者 postgres，各有四条预期 owner CRUD 策略；anon/authenticated 均不是超级用户，也没有 BYPASSRLS。
- supabase_migrations.schema_migrations 不存在。不能把当前 schema 当作已有 CLI 版本记录，也不能为补记录重跑 Phase 1。
- anon 对旧四表的 CRUD/TRUNCATE 有效权限均为 false；authenticated 的 CRUD 为 true，但 TRUNCATE 也为 true。public schema 的新表默认授权同样含多余权限。

已在尚未应用的本地 Sprint A SQL 中先撤销 PUBLIC/anon/authenticated 的默认表授权，再只授予 authenticated CRUD；旧四表修正另放在 [`supabase/proposals/20261027_phase1_table_grants.sql`](supabase/proposals/20261027_phase1_table_grants.sql)，均未远程执行。此处是权限风险发现，没有实际执行 TRUNCATE，也没有证明可从普通 REST 端点直接利用。管理连接的元数据查询不代表普通账户隔离已通过。

安全顾问另报“泄露密码保护未开启”，性能顾问无条目；未自动改变套餐或 Auth 设置。官方说明见 [Supabase 密码安全](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)。备份可用性仍待确认。

## 本地测试结果与发现

整套本地回归于 2026-10-26 执行。10 月 27 日续查修改了文档及尚未应用 SQL 的授权段，并重跑 npm run test，4 项仍通过；未修改应用业务代码，未重复运行整套构建。本地 SQL 修正尚未在 PostgreSQL 实际执行。

| 检查 | 本轮实际结果 | 限制 |
| --- | --- | --- |
| npm exec -- next typegen | 通过 | 已阅读安装版本 Next.js 16.4.3 的 CLI 文档；不是 GitHub Linux runner 实测 |
| npm run lint | 通过 | 静态检查 |
| npm run typecheck | 通过 | 在类型生成后执行 |
| npm run test | 4 项通过 | 统计函数和 SQL RLS 声明检查；不执行 PostgreSQL 触发器或远程 CRUD |
| npm run build | 通过 | 首次因 Windows 沙箱 mkdir .next 出现 EPERM；经批准在沙箱外重跑成功 |
| npm run smoke | 通过 | 登录页 200，14 个未登录私人路由跳转 /login，含 private/no-store；首次沙箱内不能访问本地服务，沙箱外重跑成功 |

构建和 smoke 使用占位 Supabase 环境值，不连接真实用户数据；`.env.local` 未修改。该构建产物用于 CI 验证，不能当作正式配置的可部署产物：正式构建需要注入真实环境变量，且当前无上线 URL。

测试有一条非阻断 Node MODULE_TYPELESS_PACKAGE_JSON 提示：Node 将测试导入的 TypeScript 文件按 ES module 重新解析；4 项测试均通过。本轮不为消除提示改变项目模块系统。

修正/补齐：

- CI 在首次检出时先生成被 Git 忽略的 Next 类型文件；增加 build 后 smoke、contents:read、15 分钟超时及统一占位环境配置。没有放入真实 Supabase 凭据。
- `.gitignore` 增补 backups、Supabase CLI 临时目录与 dump/backup 文件；备份仍应放仓库外。
- 修正“CSV 就足够恢复”的旧指南，补充账户关联、结构、策略、函数与恢复覆盖范围。
- 修正“新 SQL 尚未远程执行”的确定性文案，改成有证据支持的“API 不可用，schema/历史待核对”。

## GitHub 当前状态与同步步骤

2026-10-27 用户提供准确仓库 URL 后复查成功：账号 blueisland410-takki，仓库 nora-space，visibility=public；用户已明确接受 Public。唯一分支 main，唯一提交 7ee63027756936a3024c16175a3e847d6ebd368e（Initial commit），文件树只有 49 字节 README。之前的 404 是当时访问结果，不能继续据此判断仓库不存在。

检查起点的本地 main 为 7908940，父提交 16dd14d；已跟踪 77 个文件，完整网站源代码在本地。两个历史提交及工作区候选文件的凭据模式扫描未命中；候选文件没有真实本地 Publishable Key 的精确值，也未发现环境文件、依赖、构建缓存或数据库导出进入待提交清单。扫描有覆盖边界，不保证识别任意秘密。

计划保留远程 README 原文件，将本地详细说明保留在 PROJECT_GUIDE.md，使用本地准备分支合并双方独立历史；在用户确认具体候选提交后才普通推送。没有远程删除、强推或部署。准备和网页核验步骤见 [GITHUB_SYNC_GUIDE.md](GITHUB_SYNC_GUIDE.md)，本地候选提交以最终交付记录为准。

## 用户下一步

1. 元数据只读核对已完成，用户不必再手动复制结构查询结果；仍需在 Dashboard 核对可恢复备份并提供可用状态，无需业务记录或密码/令牌。
2. 审查旧四表授权修正提案及已收紧权限的 Sprint A SQL，备份条件满足后另行确认执行；已有 Phase 1 不重跑。
3. 新表接口可用后，用自己的私人账户按 [Phase 2 用例](PHASE2_CHECKLIST.md) 验证学习、健身、Dashboard、日历、刷新与退出；双账户 RLS 另按清单验证。
4. 核对 GitHub 同步指南和最终候选提交，确认后继续普通推送到已接受的 Public nora-space/main。GitHub 步骤可与数据库核对并行准备。

B/C/D 的依赖和建议迁移链见 [路线图](PROJECT_ROADMAP.md)。Sprint A 当前未完成云端验收，网站仍不能标记为已正式上线可用。
