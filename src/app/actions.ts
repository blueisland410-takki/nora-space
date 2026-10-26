"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getVerifiedSession } from "@/lib/auth";
import { dueAtFromDate, isTimezone } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import { safeHttpUrl, spotifyPlaylist } from "@/lib/urls";

export type ActionResult = { ok: boolean; error?: string };
const failure = (error: string): ActionResult => ({ ok: false, error });
const uuid = z.uuid();

export async function signIn(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const input = z.object({ email: z.email(), password: z.string().min(1) }).safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!input.success) return failure("请输入有效的邮箱和密码。");
  const supabase = await createClient();
  try {
    const { error } = await supabase.auth.signInWithPassword(input.data);
    if (error) return failure("登录失败，请检查邮箱和密码。");
  } catch {
    return failure("无法连接登录服务，请稍后重试。");
  }
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error("退出登录失败，请重试。");
  redirect("/login");
}

const taskSchema = z.object({
  id: uuid.optional(),
  title: z.string().trim().min(1, "请输入任务标题。").max(160),
  description: z.string().max(5000).default(""),
  priority: z.enum(["low", "medium", "high"]),
  dueDate: z.union([z.iso.date(), z.literal("")]).default(""),
});

export async function saveTask(input: z.input<typeof taskSchema>): Promise<ActionResult> {
  const parsed = taskSchema.safeParse(input);
  if (!parsed.success) return failure(parsed.error.issues[0]?.message ?? "任务信息无效。");
  const { supabase, userId } = await getVerifiedSession();
  if (!userId) return failure("登录已过期，请重新登录。");
  const { data: preference, error: preferenceError } = await supabase.from("user_preferences").select("timezone").eq("owner_id", userId).maybeSingle();
  if (preferenceError) return failure(preferenceError.message);
  const timezone = preference?.timezone && isTimezone(preference.timezone) ? preference.timezone : "Asia/Seoul";
  let due_at: string | null;
  try {
    due_at = dueAtFromDate(parsed.data.dueDate || null, timezone);
  } catch {
    return failure("截止日期无效。");
  }
  const payload = {
    title: parsed.data.title,
    description: parsed.data.description,
    priority: parsed.data.priority,
    due_at,
  };
  const query = parsed.data.id
    ? supabase.from("tasks").update(payload).eq("id", parsed.data.id).eq("owner_id", userId)
    : supabase.from("tasks").insert({ ...payload, owner_id: userId });
  const { data, error } = await query.select("id").single();
  if (error || !data) return failure(error?.message ?? "任务不存在或无权修改。");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function toggleTask(id: string, status: "todo" | "done"): Promise<ActionResult> {
  if (!uuid.safeParse(id).success || !["todo", "done"].includes(status)) return failure("任务信息无效。");
  const { supabase, userId } = await getVerifiedSession();
  if (!userId) return failure("登录已过期，请重新登录。");
  const { data, error } = await supabase.from("tasks").update({ status }).eq("id", id).eq("owner_id", userId).select("id").single();
  if (error || !data) return failure(error?.message ?? "任务不存在或无权修改。");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteTask(id: string): Promise<ActionResult> {
  if (!uuid.safeParse(id).success) return failure("任务 ID 无效。");
  const { supabase, userId } = await getVerifiedSession();
  if (!userId) return failure("登录已过期，请重新登录。");
  const { data, error } = await supabase.from("tasks").delete().eq("id", id).eq("owner_id", userId).select("id").single();
  if (error || !data) return failure(error?.message ?? "任务不存在或无权删除。");
  revalidatePath("/", "layout");
  return { ok: true };
}

const ideaSchema = z.object({
  id: uuid.optional(),
  title: z.string().trim().min(1, "请输入灵感标题。").max(160),
  content: z.string().max(20000).default(""),
  category: z.string().trim().min(1).max(40).default("未分类"),
});

export async function saveIdea(input: z.input<typeof ideaSchema>): Promise<ActionResult> {
  const parsed = ideaSchema.safeParse(input);
  if (!parsed.success) return failure(parsed.error.issues[0]?.message ?? "灵感信息无效。");
  const { supabase, userId } = await getVerifiedSession();
  if (!userId) return failure("登录已过期，请重新登录。");
  const { id, ...payload } = parsed.data;
  const query = id
    ? supabase.from("ideas").update(payload).eq("id", id).eq("owner_id", userId)
    : supabase.from("ideas").insert({ ...payload, owner_id: userId });
  const { data, error } = await query.select("id").single();
  if (error || !data) return failure(error?.message ?? "灵感不存在或无权修改。");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteIdea(id: string): Promise<ActionResult> {
  if (!uuid.safeParse(id).success) return failure("灵感 ID 无效。");
  const { supabase, userId } = await getVerifiedSession();
  if (!userId) return failure("登录已过期，请重新登录。");
  const { data, error } = await supabase.from("ideas").delete().eq("id", id).eq("owner_id", userId).select("id").single();
  if (error || !data) return failure(error?.message ?? "灵感不存在或无权删除。");
  revalidatePath("/", "layout");
  return { ok: true };
}

const bookmarkSchema = z.object({
  id: uuid.optional(),
  title: z.string().trim().min(1, "请输入收藏标题。").max(160),
  url: z.string().max(2048),
  category: z.string().trim().min(1).max(40).default("未分类"),
  coverUrl: z.string().max(2048).default(""),
});

export async function saveBookmark(input: z.input<typeof bookmarkSchema>): Promise<ActionResult> {
  const parsed = bookmarkSchema.safeParse(input);
  if (!parsed.success) return failure(parsed.error.issues[0]?.message ?? "链接信息无效。");
  const url = safeHttpUrl(parsed.data.url);
  const cover_url = parsed.data.coverUrl ? safeHttpUrl(parsed.data.coverUrl) : null;
  if (!url) return failure("请输入有效的 http 或 https 网站链接。");
  if (parsed.data.coverUrl && !cover_url) return failure("封面图链接必须是有效的 http 或 https 地址。");
  const { supabase, userId } = await getVerifiedSession();
  if (!userId) return failure("登录已过期，请重新登录。");
  const payload = { title: parsed.data.title, url, category: parsed.data.category, cover_url };
  const query = parsed.data.id
    ? supabase.from("bookmarks").update(payload).eq("id", parsed.data.id).eq("owner_id", userId)
    : supabase.from("bookmarks").insert({ ...payload, owner_id: userId });
  const { data, error } = await query.select("id").single();
  if (error || !data) return failure(error?.message ?? "收藏不存在或无权修改。");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteBookmark(id: string): Promise<ActionResult> {
  if (!uuid.safeParse(id).success) return failure("收藏 ID 无效。");
  const { supabase, userId } = await getVerifiedSession();
  if (!userId) return failure("登录已过期，请重新登录。");
  const { data, error } = await supabase.from("bookmarks").delete().eq("id", id).eq("owner_id", userId).select("id").single();
  if (error || !data) return failure(error?.message ?? "收藏不存在或无权删除。");
  revalidatePath("/", "layout");
  return { ok: true };
}

const preferencesSchema = z.object({
  spotifyPlaylistUrl: z.string().max(2048),
  timezone: z.string().refine(isTimezone, "请选择有效时区。"),
  theme: z.enum(["light", "dark"]),
});

export async function savePreferences(input: z.input<typeof preferencesSchema>): Promise<ActionResult> {
  const parsed = preferencesSchema.safeParse(input);
  if (!parsed.success) return failure(parsed.error.issues[0]?.message ?? "设置无效。");
  const spotify = parsed.data.spotifyPlaylistUrl ? spotifyPlaylist(parsed.data.spotifyPlaylistUrl) : null;
  if (parsed.data.spotifyPlaylistUrl && !spotify) return failure("请输入标准的 Spotify 歌单链接。");
  const { supabase, userId } = await getVerifiedSession();
  if (!userId) return failure("登录已过期，请重新登录。");
  const { error } = await supabase.from("user_preferences").upsert({
    owner_id: userId,
    spotify_playlist_url: spotify?.url ?? null,
    timezone: parsed.data.timezone,
    theme: parsed.data.theme,
  }, { onConflict: "owner_id" });
  if (error) return failure(error.message);
  revalidatePath("/", "layout");
  return { ok: true };
}
