"use client";

import { useState, useTransition } from "react";
import { Check, Clock3, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteTask, toggleTask } from "@/app/actions";
import { TaskForm } from "@/components/tasks/task-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { dateKey, displayDate, weekStartKey, addDaysToKey } from "@/lib/dates";
import type { Task } from "@/lib/types";

export function TaskManager({ tasks, timezone }: { tasks: Task[]; timezone: string }) {
  const [filter, setFilter] = useState<"all" | "today" | "week">("all");
  const [editing, setEditing] = useState<Task | "new" | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const today = dateKey(new Date(), timezone);
  const weekStart = weekStartKey(today);
  const weekEnd = addDaysToKey(weekStart, 6);
  const shown = tasks.filter((task) => {
    const due = task.due_at ? dateKey(task.due_at, timezone) : null;
    if (filter === "today") return due === today;
    if (filter === "week") return due !== null && due >= weekStart && due <= weekEnd;
    return true;
  });

  function setStatus(task: Task) {
    setPendingId(task.id);
    startTransition(async () => {
      try {
        const result = await toggleTask(task.id, task.status === "done" ? "todo" : "done");
        if (result.ok) toast.success(task.status === "done" ? "已恢复待办" : "任务已完成");
        else toast.error(result.error ?? "操作失败。");
      } catch { toast.error("连接失败，请稍后重试。"); }
      finally { setPendingId(null); }
    });
  }

  function remove(task: Task) {
    if (!window.confirm(`确定删除“${task.title}”吗？此操作无法撤销。`)) return;
    setPendingId(task.id);
    startTransition(async () => {
      try {
        const result = await deleteTask(task.id);
        if (result.ok) toast.success("任务已删除");
        else toast.error(result.error ?? "删除失败。");
      } catch { toast.error("连接失败，请稍后重试。"); }
      finally { setPendingId(null); }
    });
  }

  return <>
    <div className="page-header"><div><p className="eyebrow">MAKE SPACE FOR WHAT MATTERS</p><h1 className="page-title">我的任务</h1><p className="page-subtitle">把计划变成一步步可完成的行动。</p></div><Button onClick={() => setEditing("new")}><Plus size={17} />新建任务</Button></div>
    <div className="filter-row">{[["all", "全部"], ["today", "今天"], ["week", "本周"]].map(([value, label]) => <button key={value} className={`filter-button ${filter === value ? "filter-button-active" : ""}`} onClick={() => setFilter(value as typeof filter)}>{label}</button>)}<span className="muted small" style={{ marginLeft: "auto" }}>{shown.length} 项任务</span></div>
    <Card className="card-body task-list">
      {shown.length === 0 ? <div className="empty-state"><Clock3 size={28} />这里还没有任务。点击“新建任务”开始吧。</div> : shown.map((task) => <div className="list-row" key={task.id}>
        <button className={`checkbox-action ${task.status === "done" ? "checked" : ""}`} disabled={pendingId === task.id} aria-label={task.status === "done" ? "标记未完成" : "标记完成"} onClick={() => setStatus(task)}>{task.status === "done" && <Check size={13} />}</button>
        <div className="list-row-main"><strong className={task.status === "done" ? "done-text" : ""}>{task.title}</strong><small>{task.description || (task.due_at ? `截止于 ${displayDate(task.due_at, timezone)}` : "没有截止日期")}</small></div>
        <span className={`pill pill-${task.priority}`}>{task.priority === "high" ? "高优先级" : task.priority === "medium" ? "中优先级" : "低优先级"}</span>
        <div className="list-row-actions"><button className="icon-action" aria-label={`编辑 ${task.title}`} onClick={() => setEditing(task)}><Pencil size={15} /></button><button className="icon-action" aria-label={`删除 ${task.title}`} disabled={pendingId === task.id} onClick={() => remove(task)}><Trash2 size={15} /></button></div>
      </div>)}
    </Card>
    <Dialog open={editing !== null} onOpenChange={(open) => { if (!open) setEditing(null); }}><DialogContent><DialogTitle className="dialog-title">{editing === "new" ? "新建任务" : "编辑任务"}</DialogTitle><DialogDescription className="dialog-description">清晰记录下一步，把事情推进一点点。</DialogDescription>{editing && <TaskForm key={editing === "new" ? "new" : editing.id} task={editing === "new" ? undefined : editing} timezone={timezone} onSaved={() => setEditing(null)} />}</DialogContent></Dialog>
  </>;
}
