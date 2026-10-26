import { requireSession } from "@/lib/auth";
import { loadPreferences } from "@/lib/data";
import { AppShell } from "@/components/layout/app-shell";

export const dynamic = "force-dynamic";

export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  const [{ email }, preferences] = await Promise.all([requireSession(), loadPreferences()]);
  return <AppShell email={email ?? "私人账户"} preferences={preferences}>{children}</AppShell>;
}
