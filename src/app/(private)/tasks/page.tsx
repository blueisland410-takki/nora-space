import { TaskManager } from "@/components/tasks/task-manager";
import { loadPreferences, loadTasks } from "@/lib/data";

export default async function TasksPage() {
  const [tasks, preferences] = await Promise.all([loadTasks(), loadPreferences()]);
  return <TaskManager tasks={tasks} timezone={preferences.timezone} />;
}
