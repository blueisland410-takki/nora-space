# Sprint A 数据库迁移指南（Windows）

**只在现有 Supabase 项目 `ixmjytrgzrsjgbwfzamz` 执行。** 本轮仅创建本地 SQL 文件，尚未操作远程数据库。不要新建项目、重置数据库或重跑 Phase 1 SQL。

## 执行前

1. 在 Supabase Dashboard 选择项目，确认 Project URL 为 `https://ixmjytrgzrsjgbwfzamz.supabase.co`。
2. 在 Database → Backups 查看最近可恢复备份及保留期限。如果当前套餐没有自动备份，先用 Dashboard 的数据导出功能保存 Phase 1 的 `tasks`、`ideas`、`bookmarks`、`user_preferences` 数据，以及现有的表结构 SQL；备份文件保存在本机受保护的位置，不加入 Git。没有可用备份时先暂停执行。
3. 在 SQL Editor 运行下面的只读检查，确认 Phase 1 表仍在，且 Sprint A 表不存在。若某个 Sprint A 表已存在，先停止并核对实际迁移状态，不要重复运行脚本。

```sql
select table_name from information_schema.tables
where table_schema = 'public' and table_name in
  ('tasks','ideas','bookmarks','user_preferences','learning_goals','learning_tasks','study_sessions','fitness_settings','fitness_plans','workout_sessions','fitness_video_bookmarks')
order by table_name;
```

## 执行

1. 在 Windows 文件管理器打开 `D:\nora-space\supabase\migrations\202610260001_sprint_a.sql`，全选复制文件内容。
2. 在**同一个现有项目**的 Supabase SQL Editor 新建查询，粘贴并完整运行一次。脚本包含 `begin;` 与 `commit;`，失败时应整体回滚；若控制台返回错误，保存错误信息，先检查是否有部分对象，再决定如何修复。
3. 该迁移仅新增七张 Sprint A 表、索引、触发器、RLS 与策略；依赖已执行的 Phase 1 `public.set_updated_at()`，不更改旧四表，也不清空任何数据。

## 执行后只读核对

```sql
select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in
  ('learning_goals','learning_tasks','study_sessions','fitness_settings','fitness_plans','workout_sessions','fitness_video_bookmarks')
order by c.relname;

select tablename, policyname, roles, cmd, qual, with_check
from pg_policies where schemaname = 'public' and tablename in
  ('learning_goals','learning_tasks','study_sessions','fitness_settings','fitness_plans','workout_sessions','fitness_video_bookmarks')
order by tablename, policyname;

select table_name, privilege_type from information_schema.role_table_grants
where table_schema = 'public' and grantee = 'anon' and table_name in
  ('learning_goals','learning_tasks','study_sessions','fitness_settings','fitness_plans','workout_sessions','fitness_video_bookmarks')
order by table_name, privilege_type;
```

应看到七行 `rls_enabled = true`，每表四条针对 `authenticated` 的 owner 策略，匿名角色没有表权限。SQL Editor 以管理员身份运行，其查询结果**不能证明**普通账户 RLS 已生效；还需用真实账户和第二账户做隔离测试。

## 失败与恢复

- SQL 运行报错时，不要反复点击运行。先确认事务是否回滚，再核对 Phase 1 四表和新表状态，保留错误截图。
- 若上线后发现问题，先在 Vercel 回滚应用到上一稳定版本，避免新页面继续写入。新表数据应先导出备份；不要直接执行 `DROP TABLE` 或重置整个项目。
- 若需要数据库时间点恢复，先在 Supabase Backups 确认可用恢复点与影响范围。恢复可能覆盖恢复点之后的全部写入，必须先评估并取得明确同意。

`.env.local`、账户密码及任何数据库密钥都不要粘贴到 SQL Editor、文档或聊天。迁移只需要使用 Supabase Dashboard 的现有登录权限。
