import { requireSession } from "@/lib/auth";
import { defaultPreferences, type Bookmark, type Idea, type Preferences, type Task } from "@/lib/types";

export async function loadPreferences() {
  const { supabase, userId } = await requireSession();
  const { data, error } = await supabase.from("user_preferences").select("*").eq("owner_id", userId).maybeSingle();
  if (error) throw new Error(`无法读取设置：${error.message}`);
  return { ...defaultPreferences, ...(data as Preferences | null), owner_id: userId, updated_at: (data as Preferences | null)?.updated_at ?? "" };
}

export async function loadTasks() {
  const { supabase, userId } = await requireSession();
  const { data, error } = await supabase.from("tasks").select("*").eq("owner_id", userId).order("created_at", { ascending: false });
  if (error) throw new Error(`无法读取任务：${error.message}`);
  return (data ?? []) as Task[];
}

export async function loadIdeas() {
  const { supabase, userId } = await requireSession();
  const { data, error } = await supabase.from("ideas").select("*").eq("owner_id", userId).order("created_at", { ascending: false });
  if (error) throw new Error(`无法读取灵感：${error.message}`);
  return (data ?? []) as Idea[];
}

export async function loadBookmarks() {
  const { supabase, userId } = await requireSession();
  const { data, error } = await supabase.from("bookmarks").select("*").eq("owner_id", userId).order("created_at", { ascending: false });
  if (error) throw new Error(`无法读取收藏：${error.message}`);
  return (data ?? []) as Bookmark[];
}
