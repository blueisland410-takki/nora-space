"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getVerifiedSession } from "@/lib/auth";
import { safeHttpUrl } from "@/lib/urls";

type Result = { ok: boolean; error?: string };
const fail = (message: string): Result => ({ ok: false, error: message });
const uuid = z.uuid();
const date = z.iso.date();
const title = z.string().trim().min(1, "请输入标题。").max(160);
const note = z.string().max(2000).default("");
const optionalSets = z.number().int().min(1).max(100).nullable();
const optionalReps = z.number().int().min(1).max(1000).nullable();
const optionalWeight = z.number().min(0).max(10000).nullable();

function dbFailure(error: { code?: string; message: string } | null, fallback: string): Result {
  if (error?.code === "PGRST205" || error?.code === "42P01") return fail("Sprint A 数据表尚未迁移，请先查看数据库迁移指南。 ");
  if (error?.code === "23505") return fail("此计划已有训练记录，请编辑原记录。 ");
  return fail(error?.message ?? fallback);
}

function done(): Result {
  revalidatePath("/", "layout");
  return { ok: true };
}

const goalSchema = z.object({
  id: uuid.optional(), language: z.enum(["en", "ko"]), title,
  startDate: date, endDate: date, targetTotal: z.number().int().min(1).max(100000),
  unit: z.string().trim().min(1).max(30), daysPerWeek: z.number().int().min(1).max(7),
  minutesPerSession: z.number().int().min(1).max(480),
}).refine((value) => value.endDate >= value.startDate, { message: "结束日期不能早于开始日期。" });

export async function saveLearningGoal(input: z.input<typeof goalSchema>): Promise<Result> {
  const parsed = goalSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "学习目标无效。");
  const { supabase, userId } = await getVerifiedSession();
  if (!userId) return fail("登录已过期，请重新登录。");
  const { id, language, title, startDate, endDate, targetTotal, unit, daysPerWeek, minutesPerSession } = parsed.data;
  const payload = { language, title, start_date: startDate, end_date: endDate, target_total: targetTotal, unit, days_per_week: daysPerWeek, minutes_per_session: minutesPerSession };
  const query = id ? supabase.from("learning_goals").update(payload).eq("id", id).eq("owner_id", userId) : supabase.from("learning_goals").insert({ ...payload, owner_id: userId });
  const { data, error } = await query.select("id").single();
  if (error || !data) return dbFailure(error, "目标不存在或无权修改。");
  return done();
}

export async function deleteLearningGoal(id: string): Promise<Result> {
  if (!uuid.safeParse(id).success) return fail("目标 ID 无效。");
  const { supabase, userId } = await getVerifiedSession();
  if (!userId) return fail("登录已过期，请重新登录。");
  const { data, error } = await supabase.from("learning_goals").delete().eq("id", id).eq("owner_id", userId).select("id").single();
  if (error || !data) return dbFailure(error, "目标不存在或无权删除。");
  return done();
}

export async function updateLearningTask(id: string, change: { status?: "planned" | "done"; scheduledDate?: string }): Promise<Result> {
  if (!uuid.safeParse(id).success || !(change.status || change.scheduledDate)) return fail("学习任务无效。");
  if (change.status && !["planned", "done"].includes(change.status)) return fail("任务状态无效。");
  if (change.scheduledDate && !date.safeParse(change.scheduledDate).success) return fail("日期无效。");
  const { supabase, userId } = await getVerifiedSession();
  if (!userId) return fail("登录已过期，请重新登录。");
  const payload = { ...(change.status ? { status: change.status } : {}), ...(change.scheduledDate ? { scheduled_date: change.scheduledDate } : {}) };
  const { data, error } = await supabase.from("learning_tasks").update(payload).eq("id", id).eq("owner_id", userId).select("id").single();
  if (error || !data) return dbFailure(error, "任务不存在或无权修改。");
  return done();
}

const studySchema = z.object({ id: uuid.optional(), taskId: uuid, studiedOn: date, durationMinutes: z.number().int().min(1).max(1440), note });

export async function saveStudySession(input: z.input<typeof studySchema>): Promise<Result> {
  const parsed = studySchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "学习记录无效。");
  const { supabase, userId } = await getVerifiedSession();
  if (!userId) return fail("登录已过期，请重新登录。");
  const { data: task, error: taskError } = await supabase.from("learning_tasks").select("goal_id").eq("id", parsed.data.taskId).eq("owner_id", userId).maybeSingle();
  if (taskError || !task) return dbFailure(taskError, "学习任务不存在或无权记录。");
  const payload = { studied_on: parsed.data.studiedOn, duration_minutes: parsed.data.durationMinutes, note: parsed.data.note };
  const query = parsed.data.id
    ? supabase.from("study_sessions").update(payload).eq("id", parsed.data.id).eq("task_id", parsed.data.taskId).eq("owner_id", userId)
    : supabase.from("study_sessions").insert({ ...payload, task_id: parsed.data.taskId, goal_id: task.goal_id, owner_id: userId });
  const { data, error } = await query.select("id").single();
  if (error || !data) return dbFailure(error, "学习记录不存在或无权修改。");
  return done();
}

export async function deleteStudySession(id: string): Promise<Result> {
  if (!uuid.safeParse(id).success) return fail("记录 ID 无效。");
  const { supabase, userId } = await getVerifiedSession();
  if (!userId) return fail("登录已过期，请重新登录。");
  const { data, error } = await supabase.from("study_sessions").delete().eq("id", id).eq("owner_id", userId).select("id").single();
  if (error || !data) return dbFailure(error, "记录不存在或无权删除。");
  return done();
}

export async function saveFitnessSettings(target: number): Promise<Result> {
  if (!z.number().int().min(1).max(14).safeParse(target).success) return fail("每周目标需为 1 至 14 次。");
  const { supabase, userId } = await getVerifiedSession();
  if (!userId) return fail("登录已过期，请重新登录。");
  const { error } = await supabase.from("fitness_settings").upsert({ owner_id: userId, weekly_sessions_target: target }, { onConflict: "owner_id" });
  if (error) return dbFailure(error, "保存失败。");
  return done();
}

const planSchema = z.object({
  id: uuid.optional(), title, plannedDate: date, plannedMinutes: z.number().int().min(1).max(1440),
  exerciseType: z.string().trim().min(1).max(40), plannedSets: optionalSets, plannedReps: optionalReps,
  plannedWeightKg: optionalWeight, note,
});

export async function saveFitnessPlan(input: z.input<typeof planSchema>): Promise<Result> {
  const parsed = planSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "训练计划无效。");
  const { supabase, userId } = await getVerifiedSession();
  if (!userId) return fail("登录已过期，请重新登录。");
  const { id, title, plannedDate, plannedMinutes, exerciseType, plannedSets, plannedReps, plannedWeightKg, note } = parsed.data;
  const payload = { title, planned_date: plannedDate, planned_minutes: plannedMinutes, exercise_type: exerciseType, planned_sets: plannedSets, planned_reps: plannedReps, planned_weight_kg: plannedWeightKg, note };
  const query = id ? supabase.from("fitness_plans").update(payload).eq("id", id).eq("owner_id", userId) : supabase.from("fitness_plans").insert({ ...payload, owner_id: userId });
  const { data, error } = await query.select("id").single();
  if (error || !data) return dbFailure(error, "计划不存在或无权修改。");
  return done();
}

export async function deleteFitnessPlan(id: string): Promise<Result> {
  if (!uuid.safeParse(id).success) return fail("计划 ID 无效。");
  const { supabase, userId } = await getVerifiedSession();
  if (!userId) return fail("登录已过期，请重新登录。");
  const { data, error } = await supabase.from("fitness_plans").delete().eq("id", id).eq("owner_id", userId).select("id").single();
  if (error || !data) return dbFailure(error, "计划不存在或无权删除。");
  return done();
}

const workoutSchema = z.object({
  id: uuid.optional(), planId: uuid.nullable(), title, performedOn: date,
  durationMinutes: z.number().int().min(1).max(1440), actualSets: optionalSets,
  actualReps: optionalReps, actualWeightKg: optionalWeight, note,
});

export async function saveWorkoutSession(input: z.input<typeof workoutSchema>): Promise<Result> {
  const parsed = workoutSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "训练记录无效。");
  const { supabase, userId } = await getVerifiedSession();
  if (!userId) return fail("登录已过期，请重新登录。");
  const { id, planId, title, performedOn, durationMinutes, actualSets, actualReps, actualWeightKg, note } = parsed.data;
  if (planId) {
    const { data: plan, error } = await supabase.from("fitness_plans").select("id").eq("id", planId).eq("owner_id", userId).maybeSingle();
    if (error || !plan) return dbFailure(error, "训练计划不存在或无权关联。");
  }
  const payload = { plan_id: planId, title, performed_on: performedOn, duration_minutes: durationMinutes, actual_sets: actualSets, actual_reps: actualReps, actual_weight_kg: actualWeightKg, note };
  const query = id ? supabase.from("workout_sessions").update(payload).eq("id", id).eq("owner_id", userId) : supabase.from("workout_sessions").insert({ ...payload, owner_id: userId });
  const { data, error } = await query.select("id").single();
  if (error || !data) return dbFailure(error, "训练记录不存在或无权修改。");
  return done();
}

export async function deleteWorkoutSession(id: string): Promise<Result> {
  if (!uuid.safeParse(id).success) return fail("记录 ID 无效。");
  const { supabase, userId } = await getVerifiedSession();
  if (!userId) return fail("登录已过期，请重新登录。");
  const { data, error } = await supabase.from("workout_sessions").delete().eq("id", id).eq("owner_id", userId).select("id").single();
  if (error || !data) return dbFailure(error, "记录不存在或无权删除。");
  return done();
}

const videoSchema = z.object({ id: uuid.optional(), title, url: z.string().max(2048), coverUrl: z.string().max(2048).default(""), note });

export async function saveFitnessVideo(input: z.input<typeof videoSchema>): Promise<Result> {
  const parsed = videoSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "视频信息无效。");
  const url = safeHttpUrl(parsed.data.url);
  const coverUrl = parsed.data.coverUrl ? safeHttpUrl(parsed.data.coverUrl) : null;
  if (!url || (parsed.data.coverUrl && !coverUrl)) return fail("请输入有效的 http 或 https 链接。");
  const { supabase, userId } = await getVerifiedSession();
  if (!userId) return fail("登录已过期，请重新登录。");
  const payload = { title: parsed.data.title, url, cover_url: coverUrl, note: parsed.data.note };
  const query = parsed.data.id ? supabase.from("fitness_video_bookmarks").update(payload).eq("id", parsed.data.id).eq("owner_id", userId) : supabase.from("fitness_video_bookmarks").insert({ ...payload, owner_id: userId });
  const { data, error } = await query.select("id").single();
  if (error || !data) return dbFailure(error, "视频不存在或无权修改。");
  return done();
}

export async function deleteFitnessVideo(id: string): Promise<Result> {
  if (!uuid.safeParse(id).success) return fail("视频 ID 无效。");
  const { supabase, userId } = await getVerifiedSession();
  if (!userId) return fail("登录已过期，请重新登录。");
  const { data, error } = await supabase.from("fitness_video_bookmarks").delete().eq("id", id).eq("owner_id", userId).select("id").single();
  if (error || !data) return dbFailure(error, "视频不存在或无权删除。");
  return done();
}
