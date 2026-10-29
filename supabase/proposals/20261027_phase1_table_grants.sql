-- APPLIED 2026-10-29 as remote migration 20261029104338; retained as historical review.
-- Does not change table structure, business rows, RLS policies, or global defaults.
-- The remote audit found authenticated TRUNCATE privileges on these four tables.
-- See migrations/20261029104338_phase1_minimum_table_privileges.sql for the applied record.
begin;

revoke all on public.tasks, public.ideas, public.bookmarks, public.user_preferences
from public, anon, authenticated;

grant select, insert, update, delete
on public.tasks, public.ideas, public.bookmarks, public.user_preferences
to authenticated;

commit;
