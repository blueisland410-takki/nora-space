import { requireSession } from "@/lib/auth";
import type {
  FitnessPlan, FitnessSettings, FitnessVideoBookmark, FitnessWorkspace,
  LearningGoal, LearningTask, LearningWorkspace, StudySession, WorkoutSession,
} from "@/lib/phase2-types";

type QueryError = { code: string; message: string } | null;

function missingMigration(error: QueryError) {
  return error?.code === "PGRST205" || error?.code === "42P01";
}

function readRows<T>(data: unknown, error: QueryError, label: string): T[] {
  if (error) throw new Error(`无法读取${label}：${error.message}`);
  return (data ?? []) as T[];
}

export async function loadLearningWorkspace(): Promise<LearningWorkspace> {
  const { supabase, userId } = await requireSession();
  const [goals, tasks, sessions] = await Promise.all([
    supabase.from("learning_goals").select("*").eq("owner_id", userId).order("created_at", { ascending: false }),
    supabase.from("learning_tasks").select("*").eq("owner_id", userId).order("scheduled_date", { ascending: true }),
    supabase.from("study_sessions").select("*").eq("owner_id", userId).order("studied_on", { ascending: false }),
  ]);
  if ([goals.error, tasks.error, sessions.error].some(missingMigration)) {
    return { ready: false, goals: [], tasks: [], sessions: [] };
  }
  return {
    ready: true,
    goals: readRows<LearningGoal>(goals.data, goals.error, "学习目标"),
    tasks: readRows<LearningTask>(tasks.data, tasks.error, "学习安排"),
    sessions: readRows<StudySession>(sessions.data, sessions.error, "学习时间"),
  };
}

export async function loadFitnessWorkspace(): Promise<FitnessWorkspace> {
  const { supabase, userId } = await requireSession();
  const [settings, plans, workouts, videos] = await Promise.all([
    supabase.from("fitness_settings").select("*").eq("owner_id", userId).maybeSingle(),
    supabase.from("fitness_plans").select("*").eq("owner_id", userId).order("planned_date", { ascending: true }),
    supabase.from("workout_sessions").select("*").eq("owner_id", userId).order("performed_on", { ascending: false }),
    supabase.from("fitness_video_bookmarks").select("*").eq("owner_id", userId).order("created_at", { ascending: false }),
  ]);
  if ([settings.error, plans.error, workouts.error, videos.error].some(missingMigration)) {
    return { ready: false, settings: null, plans: [], workouts: [], videos: [] };
  }
  if (settings.error) throw new Error(`无法读取健身目标：${settings.error.message}`);
  return {
    ready: true,
    settings: (settings.data ?? null) as FitnessSettings | null,
    plans: readRows<FitnessPlan>(plans.data, plans.error, "训练计划"),
    workouts: readRows<WorkoutSession>(workouts.data, workouts.error, "训练记录"),
    videos: readRows<FitnessVideoBookmark>(videos.data, videos.error, "教学视频"),
  };
}
