"use client";

import { useState } from "react";
import { Bookmark, CheckSquare, Lightbulb } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { TaskForm } from "@/components/tasks/task-form";
import { IdeaForm } from "@/components/ideas/idea-form";
import { BookmarkForm } from "@/components/resources/bookmark-form";

export function QuickCapture({ open, onOpenChange, timezone }: { open: boolean; onOpenChange: (open: boolean) => void; timezone: string }) {
  const [tab, setTab] = useState<"task" | "idea" | "bookmark">("task");
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogTitle className="dialog-title">快速收集</DialogTitle>
      <DialogDescription className="dialog-description">随手记下想法，稍后再整理。</DialogDescription>
      <div className="tab-list" role="tablist" aria-label="添加类型">
        <button role="tab" aria-selected={tab === "task"} className={tab === "task" ? "tab-active" : ""} onClick={() => setTab("task")}><CheckSquare size={16} />任务</button>
        <button role="tab" aria-selected={tab === "idea"} className={tab === "idea" ? "tab-active" : ""} onClick={() => setTab("idea")}><Lightbulb size={16} />灵感</button>
        <button role="tab" aria-selected={tab === "bookmark"} className={tab === "bookmark" ? "tab-active" : ""} onClick={() => setTab("bookmark")}><Bookmark size={16} />网站</button>
      </div>
      {tab === "task" && <TaskForm key="task" timezone={timezone} onSaved={() => onOpenChange(false)} />}
      {tab === "idea" && <IdeaForm key="idea" onSaved={() => onOpenChange(false)} />}
      {tab === "bookmark" && <BookmarkForm key="bookmark" onSaved={() => onOpenChange(false)} />}
    </DialogContent>
  </Dialog>;
}
