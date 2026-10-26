"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Card } from "@/components/ui/card";
import { addDaysToKey, dateKey, displayDate } from "@/lib/dates";
import type { Task } from "@/lib/types";

export function MonthCalendar({ tasks, timezone }: { tasks: Task[]; timezone: string }) {
  const today = dateKey(new Date(), timezone);
  const [month, setMonth] = useState(today.slice(0, 7));
  const [selected, setSelected] = useState(today);
  const first = `${month}-01`;
  const firstWeekday = (new Date(`${first}T12:00:00Z`).getUTCDay() + 6) % 7;
  const start = addDaysToKey(first, -firstWeekday);
  const days = Array.from({ length: 42 }, (_, index) => addDaysToKey(start, index));
  const byDay = new Map<string, Task[]>();
  for (const task of tasks) {
    if (!task.due_at) continue;
    const key = dateKey(task.due_at, timezone);
    byDay.set(key, [...(byDay.get(key) ?? []), task]);
  }
  const selectedTasks = byDay.get(selected) ?? [];

  function moveMonth(offset: number) {
    const date = new Date(`${first}T12:00:00Z`);
    date.setUTCMonth(date.getUTCMonth() + offset);
    const next = date.toISOString().slice(0, 7);
    setMonth(next);
    setSelected(`${next}-01`);
  }

  return <><div className="page-header"><div><p className="eyebrow">SEE THE BIGGER PICTURE</p><h1 className="page-title">智能日历</h1><p className="page-subtitle">根据任务截止日期，看看这一个月的节奏。</p></div></div>
    <div className="calendar-layout"><Card className="card-body"><div className="calendar-toolbar"><button aria-label="上个月" onClick={() => moveMonth(-1)}><ChevronLeft size={18} /></button><h2>{new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${first}T12:00:00Z`))}</h2><button aria-label="下个月" onClick={() => moveMonth(1)}><ChevronRight size={18} /></button></div><div className="calendar-grid">{["一", "二", "三", "四", "五", "六", "日"].map((day) => <div className="calendar-weekday" key={day}>周{day}</div>)}{days.map((day) => <button key={day} onClick={() => setSelected(day)} aria-label={`${day}，${byDay.get(day)?.length ?? 0} 项任务`} className={`calendar-day ${day.slice(0, 7) !== month ? "calendar-day-muted" : ""} ${day === selected ? "calendar-day-selected" : ""}`}><strong>{Number(day.slice(-2))}</strong>{(byDay.get(day)?.length ?? 0) > 0 && <span className="calendar-marker" />}</button>)}</div></Card>
      <Card><div className="card-header"><h2 className="card-title">{displayDate(`${selected}T12:00:00Z`, "UTC")}的任务</h2><p className="muted small">按 {timezone} 时区显示</p></div><div className="card-body">{selectedTasks.length === 0 ? <div className="empty-state"><CalendarDays size={25} />这一天没有到期任务。</div> : selectedTasks.map((task) => <div className="list-row" key={task.id}><div className="list-row-main"><strong className={task.status === "done" ? "done-text" : ""}>{task.title}</strong><small>{task.status === "done" ? "已完成" : "待完成"}</small></div></div>)}<Link href="/tasks" className="text-link">管理任务 →</Link></div></Card></div>
  </>;
}
