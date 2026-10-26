import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getVerifiedSession() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  return { supabase, userId: error ? undefined : data?.claims?.sub, email: data?.claims?.email as string | undefined };
}

export async function requireSession() {
  const session = await getVerifiedSession();
  if (!session.userId) redirect("/login");
  return { ...session, userId: session.userId };
}
