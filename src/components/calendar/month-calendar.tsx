"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Card } from "@/components/ui/card";
import { addDaysToKey, dateKey, displayDate } from "@/lib/dates";
import type { Task } from "@/lib/types";
import type { FitnessPlan, LearningGoal, LearningTask } from "@/lib/phase2-types";

type Entry = { id: string; title: string; detail: string; href: string; type: "task" | "learning" | "fitness"; done: boolean };

export function MonthCalendar({ tasks, learningTasks, learningGoals, fitnessPlans, timezone }: { tasks: Task[]; learningTasks: LearningTask[]; learningGoals: LearningGoal[]; fitnessPlans: FitnessPlan[]; timezone: string }) {
  const today = dateKey(new Date(), timezone);
  const [month, setMonth] = useState(today.slice(0, 7));
  const [selected, setSelected] = useState(today);
  const [filter, setFilter] = useState<"all" | Entry["type"]>("all");
  const first = `${month}-01`;
  const firstWeekday = (new Date(`${first}T12:00:00Z`).getUTCDay() + 6) % 7;
  const start = addDaysToKey(first, -firstWeekday);
  const days = Array.from({ length: 42 }, (_, index) => addDaysToKey(start, index));
  const byDay = new Map<string, Entry[]>();
  const add = (day: string, entry: Entry) => byDay.set(day, [...(byDay.get(day) ?? []), entry]);
  for (const task of tasks) {
    if (!task.due_at) continue;
    const key = dateKey(task.due_at, timezone);
    add(key, { id: task.id, title: task.title, detail: task.status === "done" ? "已完成" : "待完成", href: "/tasks", type: "task", done: task.status === "done" });
  }
  for (const task of learningTasks) {
    const goal = learningGoals.find((item) => item.id === task.goal_id);
    if (goal) add(task.scheduled_date, { id: task.id, title: goal.title, detail: `${task.target_amount} ${goal.unit} · ${task.status === "done" ? "已完成" : "待完成"}`, href: `/learning#goal-${goal.id}`, type: "learning", done: task.status === "done" });
  }
  for (const plan of fitnessPlans) add(plan.planned_date, { id: plan.id, title: plan.title, detail: `${plan.exercise_type} · ${plan.planned_minutes} 分钟`, href: `/fitness#plan-${plan.id}`, type: "fitness", done: false });
  const shown = (day: string) => (byDay.get(day) ?? []).filter((entry) => filter === "all" || entry.type === filter);
  const selectedEntries = shown(selected);

  function moveMonth(offset: number) {
    const date = new Date(`${first}T12:00:00Z`);
    date.setUTCMonth(date.getUTCMonth() + offset);
    const next = date.toISOString().slice(0, 7);
    setMonth(next);
    setSelected(`${next}-01`);
  }

  return <><div className="page-header"><div><p className="eyebrow">SEE THE BIGGER PICTURE</p><h1 className="page-title">智能日历</h1><p className="page-subtitle">任务、学习与训练计划，放在同一个月里查看。</p></div></div>
    <div className="filter-row">{([["all", "全部"], ["task", "任务"], ["learning", "学习"], ["fitness", "健身"]] as const).map(([value, label]) => <button key={value} className={`filter-button ${filter === value ? "filter-button-active" : ""}`} onClick={() => setFilter(value)}>{label}</button>)}</div>
    <div className="calendar-layout"><Card className="card-body"><div className="calendar-toolbar"><button aria-label="上个月" onClick={() => moveMonth(-1)}><ChevronLeft size={18} /></button><h2>{new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${first}T12:00:00Z`))}</h2><button aria-label="下个月" onClick={() => moveMonth(1)}><ChevronRight size={18} /></button></div><div className="calendar-grid">{["一", "二", "三", "四", "五", "六", "日"].map((day) => <div className="calendar-weekday" key={day}>周{day}</div>)}{days.map((day) => <button key={day} onClick={() => setSelected(day)} aria-label={`${day}，${shown(day).length} 项安排`} className={`calendar-day ${day.slice(0, 7) !== month ? "calendar-day-muted" : ""} ${day === selected ? "calendar-day-selected" : ""}`}><strong>{Number(day.slice(-2))}</strong>{shown(day).length > 0 && <span className="calendar-marker" />}</button>)}</div></Card>
      <Card><div className="card-header"><h2 className="card-title">{displayDate(`${selected}T12:00:00Z`, "UTC")}的安排</h2><p className="muted small">按 {timezone} 时区显示</p></div><div className="card-body">{selectedEntries.length === 0 ? <div className="empty-state"><CalendarDays size={25} />这一天没有安排。</div> : selectedEntries.map((entry) => <Link href={entry.href} className="list-row calendar-entry" key={`${entry.type}-${entry.id}`}><span className={`pill calendar-type-${entry.type}`}>{entry.type === "task" ? "任务" : entry.type === "learning" ? "学习" : "健身"}</span><div className="list-row-main"><strong className={entry.done ? "done-text" : ""}>{entry.title}</strong><small>{entry.detail}</small></div></Link>)}</div></Card></div>
  </>;
}
