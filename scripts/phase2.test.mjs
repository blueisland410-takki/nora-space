import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fitnessWeek, learningProgress, studyMinutes, weekStart } from "../src/lib/phase2-metrics.ts";

test("learning progress counts only completed amounts and flags overdue planned tasks", () => {
  const goal = { id: "goal", target_total: 12 };
  const tasks = [
    { id: "one", goal_id: "goal", status: "done", target_amount: 4, scheduled_date: "2026-10-20" },
    { id: "two", goal_id: "goal", status: "planned", target_amount: 5, scheduled_date: "2026-10-22" },
    { id: "three", goal_id: "goal", status: "planned", target_amount: 3, scheduled_date: "2026-10-26" },
    { id: "other", goal_id: "other", status: "done", target_amount: 100, scheduled_date: "2026-10-20" },
  ];
  assert.deepEqual(learningProgress(goal, tasks, "2026-10-26"), { completed: 4, remaining: 8, percent: 33, overdue: 1 });
});

test("study time is summed only for the selected goal", () => {
  assert.equal(studyMinutes([{ goal_id: "goal", duration_minutes: 25 }, { goal_id: "goal", duration_minutes: 35 }, { goal_id: "other", duration_minutes: 60 }], "goal"), 60);
});

test("fitness week starts Monday and uses actual workout sessions", () => {
  assert.equal(weekStart("2026-10-25"), "2026-10-19");
  assert.deepEqual(fitnessWeek([
    { performed_on: "2026-10-19", duration_minutes: 40 },
    { performed_on: "2026-10-25", duration_minutes: 30 },
    { performed_on: "2026-10-18", duration_minutes: 90 },
  ], "2026-10-25"), { sessions: 2, minutes: 70 });
});

test("Sprint A migration declares RLS and owner policies for all seven tables", () => {
  const sql = readFileSync(new URL("../supabase/migrations/202610260001_sprint_a.sql", import.meta.url), "utf8");
  for (const table of ["learning_goals", "learning_tasks", "study_sessions", "fitness_settings", "fitness_plans", "workout_sessions", "fitness_video_bookmarks"]) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security;`));
    for (const operation of ["select", "insert", "update", "delete"]) {
      assert.match(sql, new RegExp(`create policy ${table}_${operation} on public\\.${table}`));
    }
  }
});
