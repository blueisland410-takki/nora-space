import { MonthCalendar } from "@/components/calendar/month-calendar";
import { loadPreferences, loadTasks } from "@/lib/data";

export default async function CalendarPage() {
  const [tasks, preferences] = await Promise.all([loadTasks(), loadPreferences()]);
  return <MonthCalendar tasks={tasks} timezone={preferences.timezone} />;
}
