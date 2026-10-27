-- PROPOSAL ONLY. Requires explicit approval before execution on the remote project.
-- Does not change table structure, business rows, RLS policies, or global defaults.
-- The remote audit found authenticated TRUNCATE privileges on these four tables.
-- Keep this outside migrations until the execution/history plan is approved.
begin;

revoke all on public.tasks, public.ideas, public.bookmarks, public.user_preferences
from public, anon, authenticated;

grant select, insert, update, delete
on public.tasks, public.ideas, public.bookmarks, public.user_preferences
to authenticated;

commit;
