revoke all on public.tasks, public.ideas, public.bookmarks, public.user_preferences
  from public, anon, authenticated;

grant select, insert, update, delete
  on public.tasks, public.ideas, public.bookmarks, public.user_preferences
  to authenticated;
