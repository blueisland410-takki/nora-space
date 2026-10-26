import { LearningManager } from "@/components/learning/learning-manager";
import { loadPreferences } from "@/lib/data";
import { loadLearningWorkspace } from "@/lib/phase2-data";

export default async function LearningPage() {
  const [workspace, preferences] = await Promise.all([loadLearningWorkspace(), loadPreferences()]);
  return <LearningManager workspace={workspace} timezone={preferences.timezone} />;
}
