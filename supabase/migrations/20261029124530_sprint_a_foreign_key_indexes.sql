create index learning_tasks_goal_owner_idx
  on public.learning_tasks (goal_id, owner_id);

create index study_sessions_task_goal_owner_idx
  on public.study_sessions (task_id, goal_id, owner_id);
