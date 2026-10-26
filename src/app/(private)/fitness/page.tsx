import { FitnessManager } from "@/components/fitness/fitness-manager";
import { loadPreferences } from "@/lib/data";
import { loadFitnessWorkspace } from "@/lib/phase2-data";

export default async function FitnessPage() {
  const [workspace, preferences] = await Promise.all([loadFitnessWorkspace(), loadPreferences()]);
  return <FitnessManager workspace={workspace} timezone={preferences.timezone} />;
}
