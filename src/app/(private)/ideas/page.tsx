import { IdeaManager } from "@/components/ideas/idea-manager";
import { loadIdeas, loadPreferences } from "@/lib/data";

export default async function IdeasPage() {
  const [ideas, preferences] = await Promise.all([loadIdeas(), loadPreferences()]);
  return <IdeaManager ideas={ideas} timezone={preferences.timezone} />;
}
