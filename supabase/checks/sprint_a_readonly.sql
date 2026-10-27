-- Sprint A metadata audit. Run in the EXISTING project SQL Editor.
-- Read-only: no private row data, migration execution, or history repair.
-- Select each numbered query to view its result separately.
begin transaction read only;

-- 1. Inventory: Phase 1 = 4 existing tables; Sprint A = 7 tables after migration.
with expected(phase, table_name) as (values
  ('Phase 1','tasks'),('Phase 1','ideas'),('Phase 1','bookmarks'),('Phase 1','user_preferences'),
  ('Sprint A','learning_goals'),('Sprint A','learning_tasks'),('Sprint A','study_sessions'),
  ('Sprint A','fitness_settings'),('Sprint A','fitness_plans'),('Sprint A','workout_sessions'),
  ('Sprint A','fitness_video_bookmarks')
)
select e.phase, e.table_name, c.oid is not null as table_exists,
  c.relkind as relation_kind, c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as force_rls, c.relowner::regrole::text as table_owner,
  (select count(*) from pg_policy p where p.polrelid = c.oid) as policy_count
from expected e left join pg_class c on c.oid = to_regclass('public.' || e.table_name)
order by e.phase, e.table_name;

-- 2. Prerequisite and trigger functions. Expected SECURITY INVOKER (false below).
with expected(signature) as (values
  ('auth.uid()'),('public.set_updated_at()'),('public.rebuild_learning_schedule()'),
  ('public.set_learning_task_completed_at()'),('public.check_workout_plan_owner()')
)
select e.signature, p.oid is not null as function_exists, p.prorettype::regtype::text as return_type,
  p.prosecdef as security_definer, p.proconfig as function_settings,
  case when p.oid is not null then pg_get_functiondef(p.oid) end as definition
from expected e left join pg_proc p on p.oid = to_regprocedure(e.signature)
order by e.signature;

-- 3. Compare all 65 expected columns' types and nullability. Absent tables => missing.
-- Unexpected columns require review rather than automatic removal.
with expected(table_name, column_name, data_type, not_null) as (values
  ('learning_goals', 'id', 'uuid', true),
  ('learning_goals', 'owner_id', 'uuid', true),
  ('learning_goals', 'language', 'text', true),
  ('learning_goals', 'title', 'text', true),
  ('learning_goals', 'start_date', 'date', true),
  ('learning_goals', 'end_date', 'date', true),
  ('learning_goals', 'target_total', 'integer', true),
  ('learning_goals', 'unit', 'text', true),
  ('learning_goals', 'days_per_week', 'integer', true),
  ('learning_goals', 'minutes_per_session', 'integer', true),
  ('learning_goals', 'created_at', 'timestamp with time zone', true),
  ('learning_goals', 'updated_at', 'timestamp with time zone', true),
  ('learning_tasks', 'id', 'uuid', true),
  ('learning_tasks', 'owner_id', 'uuid', true),
  ('learning_tasks', 'goal_id', 'uuid', true),
  ('learning_tasks', 'scheduled_date', 'date', true),
  ('learning_tasks', 'target_amount', 'integer', true),
  ('learning_tasks', 'status', 'text', true),
  ('learning_tasks', 'completed_at', 'timestamp with time zone', false),
  ('learning_tasks', 'created_at', 'timestamp with time zone', true),
  ('learning_tasks', 'updated_at', 'timestamp with time zone', true),
  ('study_sessions', 'id', 'uuid', true),
  ('study_sessions', 'owner_id', 'uuid', true),
  ('study_sessions', 'goal_id', 'uuid', true),
  ('study_sessions', 'task_id', 'uuid', true),
  ('study_sessions', 'studied_on', 'date', true),
  ('study_sessions', 'duration_minutes', 'integer', true),
  ('study_sessions', 'note', 'text', true),
  ('study_sessions', 'created_at', 'timestamp with time zone', true),
  ('study_sessions', 'updated_at', 'timestamp with time zone', true),
  ('fitness_settings', 'owner_id', 'uuid', true),
  ('fitness_settings', 'weekly_sessions_target', 'integer', true),
  ('fitness_settings', 'updated_at', 'timestamp with time zone', true),
  ('fitness_plans', 'id', 'uuid', true),
  ('fitness_plans', 'owner_id', 'uuid', true),
  ('fitness_plans', 'title', 'text', true),
  ('fitness_plans', 'planned_date', 'date', true),
  ('fitness_plans', 'planned_minutes', 'integer', true),
  ('fitness_plans', 'exercise_type', 'text', true),
  ('fitness_plans', 'planned_sets', 'integer', false),
  ('fitness_plans', 'planned_reps', 'integer', false),
  ('fitness_plans', 'planned_weight_kg', 'numeric(8,2)', false),
  ('fitness_plans', 'note', 'text', true),
  ('fitness_plans', 'created_at', 'timestamp with time zone', true),
  ('fitness_plans', 'updated_at', 'timestamp with time zone', true),
  ('workout_sessions', 'id', 'uuid', true),
  ('workout_sessions', 'owner_id', 'uuid', true),
  ('workout_sessions', 'plan_id', 'uuid', false),
  ('workout_sessions', 'title', 'text', true),
  ('workout_sessions', 'performed_on', 'date', true),
  ('workout_sessions', 'duration_minutes', 'integer', true),
  ('workout_sessions', 'actual_sets', 'integer', false),
  ('workout_sessions', 'actual_reps', 'integer', false),
  ('workout_sessions', 'actual_weight_kg', 'numeric(8,2)', false),
  ('workout_sessions', 'note', 'text', true),
  ('workout_sessions', 'created_at', 'timestamp with time zone', true),
  ('workout_sessions', 'updated_at', 'timestamp with time zone', true),
  ('fitness_video_bookmarks', 'id', 'uuid', true),
  ('fitness_video_bookmarks', 'owner_id', 'uuid', true),
  ('fitness_video_bookmarks', 'title', 'text', true),
  ('fitness_video_bookmarks', 'url', 'text', true),
  ('fitness_video_bookmarks', 'cover_url', 'text', false),
  ('fitness_video_bookmarks', 'note', 'text', true),
  ('fitness_video_bookmarks', 'created_at', 'timestamp with time zone', true),
  ('fitness_video_bookmarks', 'updated_at', 'timestamp with time zone', true)
), actual as (
  select c.relname::text as table_name, a.attname::text as column_name,
    format_type(a.atttypid,a.atttypmod) as data_type, a.attnotnull as not_null,
    pg_get_expr(d.adbin,d.adrelid) as default_expression
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
  join pg_attribute a on a.attrelid=c.oid and a.attnum>0 and not a.attisdropped
  left join pg_attrdef d on d.adrelid=c.oid and d.adnum=a.attnum
  where n.nspname='public' and c.relname in ('learning_goals','learning_tasks','study_sessions','fitness_settings','fitness_plans','workout_sessions','fitness_video_bookmarks')
)
select coalesce(e.table_name,a.table_name) as table_name,
  coalesce(e.column_name,a.column_name) as column_name,
  e.data_type as expected_type,a.data_type as actual_type,
  e.not_null as expected_not_null,a.not_null as actual_not_null,a.default_expression,
  case when e.column_name is null then 'unexpected_column'
       when a.column_name is null then 'missing'
       when e.data_type<>a.data_type or e.not_null<>a.not_null then 'mismatch'
       else 'match' end as column_check
from expected e full join actual a using(table_name,column_name)
order by table_name,column_name;

-- 4. Inspect ALL policies, including extra permissive policies (28 expected).
select tablename,policyname,permissive,roles,cmd,qual,with_check
from pg_policies where schemaname='public' and tablename in ('learning_goals','learning_tasks','study_sessions','fitness_settings','fitness_plans','workout_sessions','fitness_video_bookmarks')
order by tablename,policyname;

-- 5. Effective grants include inherited/PUBLIC privileges.
-- anon CRUD should all be false; authenticated CRUD true.
-- TRUNCATE is NOT protected by RLS: investigate any true value before acceptance.
select c.relname as table_name,
  has_table_privilege('anon',c.oid,'SELECT') as anon_select,
  has_table_privilege('anon',c.oid,'INSERT') as anon_insert,
  has_table_privilege('anon',c.oid,'UPDATE') as anon_update,
  has_table_privilege('anon',c.oid,'DELETE') as anon_delete,
  has_table_privilege('anon',c.oid,'TRUNCATE') as anon_truncate,
  has_table_privilege('authenticated',c.oid,'SELECT') as authenticated_select,
  has_table_privilege('authenticated',c.oid,'INSERT') as authenticated_insert,
  has_table_privilege('authenticated',c.oid,'UPDATE') as authenticated_update,
  has_table_privilege('authenticated',c.oid,'DELETE') as authenticated_delete,
  has_table_privilege('authenticated',c.oid,'TRUNCATE') as authenticated_truncate
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in ('learning_goals','learning_tasks','study_sessions','fitness_settings','fitness_plans','workout_sessions','fitness_video_bookmarks')
order by c.relname;

-- Ordinary API roles must not bypass RLS or own these tables.
select rolname,rolsuper,rolbypassrls,rolinherit
from pg_roles where rolname in ('anon','authenticated');

-- 6. Default grants for new tables; explicit GRANTs may not be the only privileges.
select d.defaclrole::regrole::text as grantor,
  case when d.defaclnamespace=0 then '(all schemas)' else d.defaclnamespace::regnamespace::text end as schema_name,
  d.defaclobjtype,d.defaclacl
from pg_default_acl d where d.defaclobjtype='r'
  and (d.defaclnamespace=0 or d.defaclnamespace='public'::regnamespace);

-- 7. PK/FK/unique/check constraints, including CASCADE and SET NULL behavior.
select c.relname as table_name,con.conname,con.contype,pg_get_constraintdef(con.oid,true) as definition
from pg_constraint con join pg_class c on c.oid=con.conrelid
join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in ('learning_goals','learning_tasks','study_sessions','fitness_settings','fitness_plans','workout_sessions','fitness_video_bookmarks')
order by c.relname,con.conname;

-- 8. Index definitions (8 explicit indexes plus primary/unique indexes).
select tablename,indexname,indexdef from pg_indexes
where schemaname='public' and tablename in ('learning_goals','learning_tasks','study_sessions','fitness_settings','fitness_plans','workout_sessions','fitness_video_bookmarks')
order by tablename,indexname;

-- 9. Non-internal triggers: 7 updated_at + 3 business triggers = 10.
select c.relname as table_name,t.tgname,t.tgenabled,pg_get_triggerdef(t.oid,true) as definition
from pg_trigger t join pg_class c on c.oid=t.tgrelid
join pg_namespace n on n.oid=c.relnamespace
where not t.tgisinternal and n.nspname='public' and c.relname in ('learning_goals','learning_tasks','study_sessions','fitness_settings','fitness_plans','workout_sessions','fitness_video_bookmarks')
order by c.relname,t.tgname;

-- 10. History table availability. NULL does NOT mean schema is absent.
select to_regclass('supabase_migrations.schema_migrations') as migration_history_table;

rollback;

-- Only if query 10 returns a table, run the following SELECT separately:
-- select version from supabase_migrations.schema_migrations order by version;
-- Local versions: 202610250001, 202610260001.
-- Do not repair history or run db push based only on version names.
