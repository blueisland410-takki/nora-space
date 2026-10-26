import { MonthCalendar } from "@/components/calendar/month-calendar";
import { loadPreferences, loadTasks } from "@/lib/data";
import { loadFitnessWorkspace, loadLearningWorkspace } from "@/lib/phase2-data";

export default async function CalendarPage() {
  const [tasks, preferences, learning, fitness] = await Promise.all([loadTasks(), loadPreferences(), loadLearningWorkspace(), loadFitnessWorkspace()]);
  return <MonthCalendar tasks={tasks} learningTasks={learning.tasks} learningGoals={learning.goals} fitnessPlans={fitness.plans} timezone={preferences.timezone} />;
}
