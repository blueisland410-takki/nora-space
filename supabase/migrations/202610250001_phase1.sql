-- Run once in the Supabase SQL Editor. All records belong to the signed-in user.
create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 160),
  description text not null default '' check (length(description) <= 5000),
  status text not null default 'todo' check (status in ('todo', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 160),
  content text not null default '' check (length(content) <= 20000),
  category text not null default '未分类' check (length(category) between 1 and 40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 160),
  url text not null check (length(url) between 1 and 2048),
  category text not null default '未分类' check (length(category) between 1 and 40),
  cover_url text check (cover_url is null or length(cover_url) <= 2048),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_preferences (
  owner_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  spotify_playlist_url text check (spotify_playlist_url is null or length(spotify_playlist_url) <= 2048),
  timezone text not null default 'Asia/Seoul' check (length(timezone) between 1 and 100),
  theme text not null default 'light' check (theme in ('light', 'dark')),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_owner_due_idx on public.tasks (owner_id, due_at);
create index if not exists ideas_owner_created_idx on public.ideas (owner_id, created_at desc);
create index if not exists bookmarks_owner_created_idx on public.bookmarks (owner_id, created_at desc);

create or replace function public.set_task_completed_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    new.completed_at = case when new.status = 'done' then now() else null end;
  end if;
  return new;
end;
$$;

drop trigger if exists tasks_completed_at on public.tasks;
create trigger tasks_completed_at before update on public.tasks for each row execute function public.set_task_completed_at();

drop trigger if exists tasks_updated_at on public.tasks;
create trigger tasks_updated_at before update on public.tasks for each row execute function public.set_updated_at();
drop trigger if exists ideas_updated_at on public.ideas;
create trigger ideas_updated_at before update on public.ideas for each row execute function public.set_updated_at();
drop trigger if exists bookmarks_updated_at on public.bookmarks;
create trigger bookmarks_updated_at before update on public.bookmarks for each row execute function public.set_updated_at();
drop trigger if exists preferences_updated_at on public.user_preferences;
create trigger preferences_updated_at before update on public.user_preferences for each row execute function public.set_updated_at();

alter table public.tasks enable row level security;
alter table public.ideas enable row level security;
alter table public.bookmarks enable row level security;
alter table public.user_preferences enable row level security;

revoke all on public.tasks, public.ideas, public.bookmarks, public.user_preferences from anon;
grant select, insert, update, delete on public.tasks, public.ideas, public.bookmarks, public.user_preferences to authenticated;

drop policy if exists tasks_select on public.tasks;
create policy tasks_select on public.tasks for select to authenticated using ((select auth.uid()) = owner_id);
drop policy if exists tasks_insert on public.tasks;
create policy tasks_insert on public.tasks for insert to authenticated with check ((select auth.uid()) = owner_id);
drop policy if exists tasks_update on public.tasks;
create policy tasks_update on public.tasks for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
drop policy if exists tasks_delete on public.tasks;
create policy tasks_delete on public.tasks for delete to authenticated using ((select auth.uid()) = owner_id);

drop policy if exists ideas_select on public.ideas;
create policy ideas_select on public.ideas for select to authenticated using ((select auth.uid()) = owner_id);
drop policy if exists ideas_insert on public.ideas;
create policy ideas_insert on public.ideas for insert to authenticated with check ((select auth.uid()) = owner_id);
drop policy if exists ideas_update on public.ideas;
create policy ideas_update on public.ideas for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
drop policy if exists ideas_delete on public.ideas;
create policy ideas_delete on public.ideas for delete to authenticated using ((select auth.uid()) = owner_id);

drop policy if exists bookmarks_select on public.bookmarks;
create policy bookmarks_select on public.bookmarks for select to authenticated using ((select auth.uid()) = owner_id);
drop policy if exists bookmarks_insert on public.bookmarks;
create policy bookmarks_insert on public.bookmarks for insert to authenticated with check ((select auth.uid()) = owner_id);
drop policy if exists bookmarks_update on public.bookmarks;
create policy bookmarks_update on public.bookmarks for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
drop policy if exists bookmarks_delete on public.bookmarks;
create policy bookmarks_delete on public.bookmarks for delete to authenticated using ((select auth.uid()) = owner_id);

drop policy if exists preferences_select on public.user_preferences;
create policy preferences_select on public.user_preferences for select to authenticated using ((select auth.uid()) = owner_id);
drop policy if exists preferences_insert on public.user_preferences;
create policy preferences_insert on public.user_preferences for insert to authenticated with check ((select auth.uid()) = owner_id);
drop policy if exists preferences_update on public.user_preferences;
create policy preferences_update on public.user_preferences for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
drop policy if exists preferences_delete on public.user_preferences;
create policy preferences_delete on public.user_preferences for delete to authenticated using ((select auth.uid()) = owner_id);
