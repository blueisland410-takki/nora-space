import type { LearningGoal, LearningTask, StudySession, WorkoutSession } from "./phase2-types";

export function learningProgress(goal: Pick<LearningGoal, "id" | "target_total">, tasks: LearningTask[], today: string) {
  const ownTasks = tasks.filter((task) => task.goal_id === goal.id);
  const completed = ownTasks.filter((task) => task.status === "done")
    .reduce((sum, task) => sum + task.target_amount, 0);
  const remaining = Math.max(goal.target_total - completed, 0);
  const percent = Math.min(100, Math.round(completed / goal.target_total * 100));
  const overdue = ownTasks.filter((task) => task.status === "planned" && task.scheduled_date < today).length;
  return { completed, remaining, percent, overdue };
}

export function studyMinutes(sessions: StudySession[], goalId: string) {
  return sessions.filter((session) => session.goal_id === goalId)
    .reduce((sum, session) => sum + session.duration_minutes, 0);
}

export function weekStart(day: string) {
  const date = new Date(`${day}T12:00:00Z`);
  const weekday = date.getUTCDay();
  date.setUTCDate(date.getUTCDate() - (weekday === 0 ? 6 : weekday - 1));
  return date.toISOString().slice(0, 10);
}

export function fitnessWeek(workouts: WorkoutSession[], today: string) {
  const start = weekStart(today);
  const current = workouts.filter((workout) => workout.performed_on >= start && workout.performed_on <= today);
  return {
    sessions: current.length,
    minutes: current.reduce((sum, workout) => sum + workout.duration_minutes, 0),
  };
}
