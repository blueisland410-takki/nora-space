"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveTask } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { dateKey } from "@/lib/dates";
import type { Task } from "@/lib/types";

export function TaskForm({ task, timezone, onSaved }: { task?: Task; timezone: string; onSaved?: () => void }) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [priority, setPriority] = useState<Task["priority"]>(task?.priority ?? "medium");
  const [dueDate, setDueDate] = useState(task?.due_at ? dateKey(task.due_at, timezone) : "");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        const result = await saveTask({ id: task?.id, title, description, priority, dueDate });
        if (!result.ok) { setError(result.error ?? "保存失败。"); return; }
        toast.success(task ? "任务已更新" : "任务已创建");
        if (!task) { setTitle(""); setDescription(""); setPriority("medium"); setDueDate(""); }
        onSaved?.();
      } catch { setError("连接失败，请稍后重试。你输入的内容仍在表单中。"); }
    });
  }

  return <form onSubmit={submit} className="form-stack">
    <label className="field-label">任务标题<input className="field" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} required placeholder="接下来要完成什么？" /></label>
    <label className="field-label">描述（可选）<textarea className="field textarea" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={5000} placeholder="补充一些细节..." /></label>
    <div className="form-row"><label className="field-label">优先级<select className="field" value={priority} onChange={(event) => setPriority(event.target.value as Task["priority"])}><option value="low">低</option><option value="medium">中</option><option value="high">高</option></select></label>
      <label className="field-label">截止日期<input className="field" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></label></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <Button type="submit" disabled={pending}>{pending ? "保存中..." : task ? "保存修改" : "创建任务"}</Button>
  </form>;
}
