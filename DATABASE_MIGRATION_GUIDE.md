# Sprint A 数据库迁移审查与操作指南

更新：2026-10-27。仅针对现有项目 `ixmjytrgzrsjgbwfzamz`。本轮只执行公开接口的只读请求，**没有执行远程迁移、业务写入、迁移历史修复或数据库重置**。

## 1. 审查结论

审查文件：[`202610260001_sprint_a.sql`](supabase/migrations/202610260001_sprint_a.sql)。连接 Supabase 后已确认远程七表及三个业务函数不存在，因此仅对这份尚未应用的本地 SQL 收紧授权：先撤销 PUBLIC/anon/authenticated 默认权限，再只授予 authenticated CRUD。表结构、字段与业务触发器未改，远程未执行。

| 检查 | 本地结论 |
| --- | --- |
| 模块对应 | 学习：learning_goals、learning_tasks、study_sessions；健身：fitness_settings、fitness_plans、workout_sessions、fitness_video_bookmarks；Dashboard 与日历读取这些表 |
| 破坏性 DDL | 未发现 DROP TABLE、TRUNCATE 或对 Phase 1 四表的修改；迁移使用 BEGIN / COMMIT |
| 实际删除行为 | 重排学习计划时删除未完成且无时长记录的任务再生成；删除目标级联删除其任务和学习记录；删除训练计划保留训练记录并将 plan_id 置空；删除 Auth 用户级联删除其私人数据 |
| RLS | 七张新表均启用 RLS；28 条 authenticated CRUD 策略按 auth.uid() = owner_id 限制；UPDATE 同时检查原记录与更新后的 owner |
| 关联隔离 | 学习目标、任务、时长记录使用含 owner_id 的复合外键；训练记录有计划所有者检查触发器；服务端也核对登录用户与所属记录 |
| 函数与索引 | 三个新增触发器函数采用 SECURITY INVOKER、空 search_path；七个 updated_at 触发器复用 Phase 1 函数；共十个自定义触发器、八个显式索引 |
| Phase 1 依赖 | 需要 auth.users、auth.uid() 和 public.set_updated_at()；旧四表及其策略保留 |
| 重复执行 | 非幂等脚本。已有任一同名表、函数或迁移记录时先核对，不能直接重跑 |
| 权限发现与本地修正 | 已确认远程默认授权含 TRUNCATE 等额外权限，旧四表 authenticated_truncate=true；新七表本地 SQL 已收紧为先撤销再授予 CRUD；旧四表修正单独放入 proposals，未执行 |

RLS 不约束 TRUNCATE，管理员/表所有者查询也不能证明普通用户隔离通过，参见 [PostgreSQL RLS 文档](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)。本地静态审查不等于 PostgreSQL 实际执行成功。

## 2. 已观察到的远程状态

2026-10-27 23:25（Asia/Shanghai）再次只读复查，结果与 10 月 26 日一致。使用现有 Publishable Key、未带用户会话，仅发送 GET：

- 项目 URL 与预期一致；Auth health HTTP 200；settings 中 disable_signup=true、mailer_autoconfirm=false。
- tasks、ideas、bookmarks、user_preferences 匿名读取均为 HTTP 401 / 42501。
- 七张 Sprint A 表接口均为 HTTP 404 / PGRST205（当前 PostgREST schema cache 找不到表）。

随后 Supabase 插件已连接，元数据只读查询确认：七张新表及三个业务函数当前均不存在；public.set_updated_at() 和 auth.uid() 存在且满足依赖；supabase_migrations.schema_migrations 不存在。旧四表 RLS=true，各有四条预期 owner 策略；anon 无 CRUD/TRUNCATE 权限，authenticated 有 CRUD 但额外有 TRUNCATE。管理角色未用于证明普通账户 CRUD 或跨账户隔离。

现在可以确认当前数据库没有 Sprint A 结构；没有历史表，不能追溯证明过去从未执行或撤销过任何迁移。Phase 1 当前结构证据与本地定义的表、策略及公共更新时间函数一致，但没有 CLI 版本记录。不要为补历史重跑 Phase 1。

旧四表的权限修正提案为 [`supabase/proposals/20261027_phase1_table_grants.sql`](supabase/proposals/20261027_phase1_table_grants.sql)，只撤销普通角色额外表权限并保留 authenticated CRUD，不改数据、字段或全局默认授权。它位于 migrations 以外，需用户另行确认；未执行。TRUNCATE 权限属于授权过宽，本轮没有证明它能直接通过普通 REST 端点利用，也未实际执行清空测试。

安全顾问另报“泄露密码保护未开启”，性能顾问未报条目。是否启用该保护及现有套餐支持情况待核对，不自动开通付费资源。见 [Supabase 密码安全说明](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)。备份可用性仍未取得证据。

## 3. 先执行这些只读人工查询

1. 在 Supabase Dashboard 打开现有项目，确认 Project URL 为 `https://ixmjytrgzrsjgbwfzamz.supabase.co`。
2. 打开 SQL Editor，复制 [`supabase/checks/sprint_a_readonly.sql`](supabase/checks/sprint_a_readonly.sql)。它仅查询结构/权限，不读取私人记录；可按编号分别选中执行并保存各结果。整份执行带只读事务，末尾 ROLLBACK 不保存更改。
3. 查询 1 核对旧四表和新七表；查询 2 核对依赖/函数；查询 3 核对 65 个字段类型和空值约束，并人工比对默认值；查询 4–9 核对完整策略、有效授权、默认授权、约束、索引与触发器。
4. 查询 10 如果返回迁移历史表，再**单独**运行下面的 SELECT。返回 NULL 时记录“历史表不存在”，不要创建它，也不要运行下面的查询。

```sql
select version
from supabase_migrations.schema_migrations
order by version;
```

本地版本为 `202610250001`（Phase 1）与 `202610260001`（Sprint A）。通过 SQL Editor 直接执行这两个文件不会自动登记 CLI 迁移历史；缺少版本记录不等于表不存在。CLI 根据历史表判断待应用迁移，参见 [Supabase 迁移说明](https://supabase.com/docs/guides/deployment/database-migrations)。

| 查询结果 | 下一步 |
| --- | --- |
| 七表及 Sprint A 函数均不存在，无该版本记录，Phase 1 依赖齐全 | 核对默认授权与备份，取得用户对本次迁移的明确确认后，才具备执行条件 |
| 七表、函数、策略、约束、授权均与文件一致，历史包含 Sprint A | 已有迁移证据；不重跑；转入真实账户验收并排查 API cache/exposure |
| 结构存在且一致，但没有历史表/版本记录 | 记为“结构已存在，迁移历史未对齐”；不重跑。后续用 CLI 前另行审查并授权历史对齐 |
| 部分对象存在、字段/策略不同、权限异常，或历史显示已应用但对象缺失 | 阻塞迁移；保存结果，查明漂移原因，再准备修复方案 |

这些结构/权限查询现已由连接工具完成；仍需要确认可恢复备份，并审查旧四表权限修正和 Sprint A 迁移后再授权执行。无需提供密码、数据库连接串、密钥、访问令牌或私人内容。不要用 db reset、直接 db push 或 migration repair 跳过核对。

## 4. 备份方案（迁移之前）

备份可用性、最后成功时间和恢复能力均**待人工验证**，没有自动开通付费功能。

1. 暂停自己在网站上的写入，记录项目 ID、时间及本地迁移版本。在 Database → Backups 核对实际可用备份及恢复窗口；有 Backups 入口不等于已有成功备份。
2. 没有可用备份时，按 [Supabase CLI 备份与恢复指南](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore) 制作逻辑备份，分别保留角色、schema、数据，核实工具实际覆盖范围。连接凭据只在本机输入和保管，不放进项目或聊天。
3. 恢复清单应覆盖旧四表数据、Auth 用户与 owner_id 关联、schema/约束/索引/函数/触发器/RLS/授权、迁移历史（如存在）。核对工具对托管 auth/storage schema 的处理，不假定默认 dump 包含全部恢复内容。Auth URL、注册开关等项目设置另存私密记录。
4. CSV 仅作补充副本，不能独立恢复上述对象。如以后使用 Storage，还需另备份实际文件；数据库备份不含 Storage 文件本体。备份能力取决于现有套餐，见 [Supabase 备份说明](https://supabase.com/docs/guides/platform/backups)。
5. 备份保存到仓库以外的受保护目录，记录文件大小、校验和、日志及恢复步骤。有已授权的隔离环境时先演练恢复并核对账户关联/记录数；未演练就标记“恢复未演练”。不可自行创建新项目或付费资源。

## 5. 取得确认后才执行的迁移步骤

以下步骤**本轮未执行**，仅适用于第 3 节核对通过、备份可用且用户已确认的情况：

1. 保持网站暂停写入。在同一项目 SQL Editor 新建查询，完整粘贴原始 `202610260001_sprint_a.sql`，一次执行 BEGIN 到 COMMIT；不重跑 Phase 1。
2. 报错时保存错误并停止重复运行。事务失败应回滚；重新用只读脚本确认状态，不能仅凭页面提示推断。
3. 成功后再次核对：七表 RLS=true、65 个字段匹配、28 条预期 owner 策略、默认值/外键/函数/索引/十个触发器与文件一致，没有额外宽松策略或异常有效授权。有差异先解决再开放写入。
4. 记录执行时间、文件版本和核对结果；SQL Editor 执行后可能没有 CLI 历史记录，应明确记录，不自行修复历史。
5. 重新检查匿名接口，再按 [Phase 2 清单](PHASE2_CHECKLIST.md) 用普通真实账户验证 CRUD、持久化和双账户隔离。不得使用 Service Role 代替普通会话。

## 6. 失败与恢复

- 提交前失败：确认事务回滚和旧四表完整性；保留错误、修复原因、重新审查，禁止 reset 或盲目重跑。
- 提交后出现问题：暂停写入，保存新增数据与故障证据，优先审查兼容性修复；必要时在独立本地工作目录运行此前稳定应用提交，不删除当前代码或新表。
- 必须恢复数据库时：选定已核验备份/恢复点，列出会被覆盖的后续写入、账户及关联影响，取得用户明确确认后按备份方式恢复。恢复不是无损撤销。
- 恢复后先核对 Phase 1 数据、登录和关联，再核对结构/历史、RLS 及普通账户权限。本轮没有执行恢复，也未证明可成功恢复。
