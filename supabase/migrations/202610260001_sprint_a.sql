-- Sprint A. Run once after 202610250001_phase1.sql. Does not alter Phase 1 tables.
-- Review DATABASE_MIGRATION_GUIDE.md before executing in the existing Supabase project.
begin;

create table public.learning_goals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  language text not null check (language in ('en', 'ko')),
  title text not null check (length(btrim(title)) between 1 and 160),
  start_date date not null,
  end_date date not null,
  target_total integer not null check (target_total between 1 and 100000),
  unit text not null check (length(btrim(unit)) between 1 and 30),
  days_per_week integer not null check (days_per_week between 1 and 7),
  minutes_per_session integer not null check (minutes_per_session between 1 and 480),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint learning_goals_date_range check (end_date >= start_date and end_date - start_date <= 730),
  constraint learning_goals_id_owner_unique unique (id, owner_id)
);

create table public.learning_tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  goal_id uuid not null,
  scheduled_date date not null,
  target_amount integer not null check (target_amount between 1 and 100000),
  status text not null default 'planned' check (status in ('planned', 'done')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint learning_tasks_goal_owner_fk foreign key (goal_id, owner_id)
    references public.learning_goals (id, owner_id) on delete cascade,
  constraint learning_tasks_id_goal_owner_unique unique (id, goal_id, owner_id)
);

create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  goal_id uuid not null,
  task_id uuid not null,
  studied_on date not null,
  duration_minutes integer not null check (duration_minutes between 1 and 1440),
  note text not null default '' check (length(note) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint study_sessions_task_owner_fk foreign key (task_id, goal_id, owner_id)
    references public.learning_tasks (id, goal_id, owner_id) on delete cascade
);

create table public.fitness_settings (
  owner_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  weekly_sessions_target integer not null default 3 check (weekly_sessions_target between 1 and 14),
  updated_at timestamptz not null default now()
);

create table public.fitness_plans (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (length(btrim(title)) between 1 and 160),
  planned_date date not null,
  planned_minutes integer not null check (planned_minutes between 1 and 1440),
  exercise_type text not null default '其他' check (length(btrim(exercise_type)) between 1 and 40),
  planned_sets integer check (planned_sets is null or planned_sets between 1 and 100),
  planned_reps integer check (planned_reps is null or planned_reps between 1 and 1000),
  planned_weight_kg numeric(8,2) check (planned_weight_kg is null or planned_weight_kg between 0 and 10000),
  note text not null default '' check (length(note) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fitness_plans_id_owner_unique unique (id, owner_id)
);

create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  plan_id uuid references public.fitness_plans(id) on delete set null,
  title text not null check (length(btrim(title)) between 1 and 160),
  performed_on date not null,
  duration_minutes integer not null check (duration_minutes between 1 and 1440),
  actual_sets integer check (actual_sets is null or actual_sets between 1 and 100),
  actual_reps integer check (actual_reps is null or actual_reps between 1 and 1000),
  actual_weight_kg numeric(8,2) check (actual_weight_kg is null or actual_weight_kg between 0 and 10000),
  note text not null default '' check (length(note) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workout_sessions_one_per_plan unique (plan_id)
);

create table public.fitness_video_bookmarks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (length(btrim(title)) between 1 and 160),
  url text not null check (length(url) between 8 and 2048 and url ~* '^https?://'),
  cover_url text check (cover_url is null or (length(cover_url) between 8 and 2048 and cover_url ~* '^https?://')),
  note text not null default '' check (length(note) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index learning_goals_owner_dates_idx on public.learning_goals (owner_id, start_date, end_date);
create index learning_tasks_owner_date_idx on public.learning_tasks (owner_id, scheduled_date);
create index learning_tasks_goal_status_idx on public.learning_tasks (goal_id, status);
create index study_sessions_owner_date_idx on public.study_sessions (owner_id, studied_on desc);
create index study_sessions_task_idx on public.study_sessions (task_id);
create index fitness_plans_owner_date_idx on public.fitness_plans (owner_id, planned_date);
create index workout_sessions_owner_date_idx on public.workout_sessions (owner_id, performed_on desc);
create index fitness_video_bookmarks_owner_created_idx on public.fitness_video_bookmarks (owner_id, created_at desc);

-- Database-owned schedule generation keeps goal creation and planning atomic.
-- Completed tasks and pending tasks with study history are never removed by replanning.
create function public.rebuild_learning_schedule()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  day_value date;
  slots date[] := '{}'::date[];
  slot_count integer;
  reserved_amount integer;
  remaining_amount integer;
  task_count integer;
  i integer;
  task_amount integer;
begin
  if tg_op = 'UPDATE' then
    if new.start_date is not distinct from old.start_date
      and new.end_date is not distinct from old.end_date
      and new.target_total is not distinct from old.target_total
      and new.days_per_week is not distinct from old.days_per_week then
      return new;
    end if;
    delete from public.learning_tasks lt
    where lt.goal_id = new.id and lt.owner_id = new.owner_id and lt.status = 'planned'
      and not exists (select 1 from public.study_sessions ss where ss.task_id = lt.id);
  end if;

  select coalesce(sum(lt.target_amount), 0)::integer into reserved_amount
  from public.learning_tasks lt where lt.goal_id = new.id and lt.owner_id = new.owner_id;
  if reserved_amount > new.target_total then
    raise exception '目标总量不能小于已完成或已有学习记录的任务量。';
  end if;
  remaining_amount := new.target_total - reserved_amount;
  if remaining_amount = 0 then return new; end if;

  for day_value in
    select dates.day::date from pg_catalog.generate_series(new.start_date, new.end_date, interval '1 day') as dates(day)
  loop
    if mod((extract(isodow from day_value)::integer - 1) * new.days_per_week, 7) < new.days_per_week then
      slots := pg_catalog.array_append(slots, day_value);
    end if;
  end loop;
  if pg_catalog.array_length(slots, 1) is null then
    slots := pg_catalog.array_append(slots, new.start_date);
  end if;
  slot_count := pg_catalog.array_length(slots, 1);
  task_count := least(slot_count, remaining_amount);
  for i in 1..task_count loop
    task_amount := remaining_amount / task_count + case when i <= mod(remaining_amount, task_count) then 1 else 0 end;
    insert into public.learning_tasks (owner_id, goal_id, scheduled_date, target_amount)
    values (new.owner_id, new.id, slots[1 + floor((i - 1) * slot_count::numeric / task_count)::integer], task_amount);
  end loop;
  return new;
end;
$$;

create trigger learning_goal_schedule
after insert or update of start_date, end_date, target_total, days_per_week on public.learning_goals
for each row execute function public.rebuild_learning_schedule();

create function public.set_learning_task_completed_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    new.completed_at := case when new.status = 'done' then now() else null end;
  end if;
  return new;
end;
$$;
create trigger learning_task_completed_at before update on public.learning_tasks
for each row execute function public.set_learning_task_completed_at();

create function public.check_workout_plan_owner()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.plan_id is not null and not exists (
    select 1 from public.fitness_plans fp where fp.id = new.plan_id and fp.owner_id = new.owner_id
  ) then
    raise exception '训练计划不存在或不属于当前账户。';
  end if;
  return new;
end;
$$;
create trigger workout_plan_owner before insert or update of plan_id, owner_id on public.workout_sessions
for each row execute function public.check_workout_plan_owner();

create trigger learning_goals_updated_at before update on public.learning_goals for each row execute function public.set_updated_at();
create trigger learning_tasks_updated_at before update on public.learning_tasks for each row execute function public.set_updated_at();
create trigger study_sessions_updated_at before update on public.study_sessions for each row execute function public.set_updated_at();
create trigger fitness_settings_updated_at before update on public.fitness_settings for each row execute function public.set_updated_at();
create trigger fitness_plans_updated_at before update on public.fitness_plans for each row execute function public.set_updated_at();
create trigger workout_sessions_updated_at before update on public.workout_sessions for each row execute function public.set_updated_at();
create trigger fitness_video_bookmarks_updated_at before update on public.fitness_video_bookmarks for each row execute function public.set_updated_at();

alter table public.learning_goals enable row level security;
alter table public.learning_tasks enable row level security;
alter table public.study_sessions enable row level security;
alter table public.fitness_settings enable row level security;
alter table public.fitness_plans enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.fitness_video_bookmarks enable row level security;

-- Supabase defaults may grant TRUNCATE/REFERENCES/TRIGGER/MAINTAIN too.
-- Clear default and PUBLIC grants on these new tables before granting only CRUD.
revoke all on public.learning_goals, public.learning_tasks, public.study_sessions,
  public.fitness_settings, public.fitness_plans, public.workout_sessions,
  public.fitness_video_bookmarks from public, anon, authenticated;
grant select, insert, update, delete on public.learning_goals, public.learning_tasks,
  public.study_sessions, public.fitness_settings, public.fitness_plans,
  public.workout_sessions, public.fitness_video_bookmarks to authenticated;

create policy learning_goals_select on public.learning_goals for select to authenticated using ((select auth.uid()) = owner_id);
create policy learning_goals_insert on public.learning_goals for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy learning_goals_update on public.learning_goals for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy learning_goals_delete on public.learning_goals for delete to authenticated using ((select auth.uid()) = owner_id);

create policy learning_tasks_select on public.learning_tasks for select to authenticated using ((select auth.uid()) = owner_id);
create policy learning_tasks_insert on public.learning_tasks for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy learning_tasks_update on public.learning_tasks for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy learning_tasks_delete on public.learning_tasks for delete to authenticated using ((select auth.uid()) = owner_id);

create policy study_sessions_select on public.study_sessions for select to authenticated using ((select auth.uid()) = owner_id);
create policy study_sessions_insert on public.study_sessions for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy study_sessions_update on public.study_sessions for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy study_sessions_delete on public.study_sessions for delete to authenticated using ((select auth.uid()) = owner_id);

create policy fitness_settings_select on public.fitness_settings for select to authenticated using ((select auth.uid()) = owner_id);
create policy fitness_settings_insert on public.fitness_settings for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy fitness_settings_update on public.fitness_settings for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy fitness_settings_delete on public.fitness_settings for delete to authenticated using ((select auth.uid()) = owner_id);

create policy fitness_plans_select on public.fitness_plans for select to authenticated using ((select auth.uid()) = owner_id);
create policy fitness_plans_insert on public.fitness_plans for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy fitness_plans_update on public.fitness_plans for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy fitness_plans_delete on public.fitness_plans for delete to authenticated using ((select auth.uid()) = owner_id);

create policy workout_sessions_select on public.workout_sessions for select to authenticated using ((select auth.uid()) = owner_id);
create policy workout_sessions_insert on public.workout_sessions for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy workout_sessions_update on public.workout_sessions for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy workout_sessions_delete on public.workout_sessions for delete to authenticated using ((select auth.uid()) = owner_id);

create policy fitness_video_bookmarks_select on public.fitness_video_bookmarks for select to authenticated using ((select auth.uid()) = owner_id);
create policy fitness_video_bookmarks_insert on public.fitness_video_bookmarks for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy fitness_video_bookmarks_update on public.fitness_video_bookmarks for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy fitness_video_bookmarks_delete on public.fitness_video_bookmarks for delete to authenticated using ((select auth.uid()) = owner_id);

commit;
