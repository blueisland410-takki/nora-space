import { SettingsForm } from "@/components/settings/settings-form";
import { loadPreferences } from "@/lib/data";

export default async function SettingsPage() {
  return <SettingsForm preferences={await loadPreferences()} />;
}
