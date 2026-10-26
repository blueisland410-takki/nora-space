"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveIdea } from "@/app/actions";
import { Button } from "@/components/ui/button";
import type { Idea } from "@/lib/types";

export function IdeaForm({ idea, onSaved }: { idea?: Idea; onSaved?: () => void }) {
  const [title, setTitle] = useState(idea?.title ?? "");
  const [content, setContent] = useState(idea?.content ?? "");
  const [category, setCategory] = useState(idea?.category ?? "未分类");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        const result = await saveIdea({ id: idea?.id, title, content, category });
        if (!result.ok) { setError(result.error ?? "保存失败。"); return; }
        toast.success(idea ? "灵感已更新" : "灵感已保存");
        if (!idea) { setTitle(""); setContent(""); setCategory("未分类"); }
        onSaved?.();
      } catch { setError("连接失败，请稍后重试。你输入的内容仍在表单中。"); }
    });
  }

  return <form onSubmit={submit} className="form-stack">
    <label className="field-label">标题<input className="field" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} required placeholder="为灵感起个名字" /></label>
    <label className="field-label">内容<textarea className="field textarea textarea-large" value={content} onChange={(event) => setContent(event.target.value)} maxLength={20000} placeholder="记下你的想法..." /></label>
    <label className="field-label">分类<input className="field" value={category} onChange={(event) => setCategory(event.target.value)} maxLength={40} required placeholder="未分类" /></label>
    {error && <p className="form-error" role="alert">{error}</p>}
    <Button type="submit" disabled={pending}>{pending ? "保存中..." : idea ? "保存修改" : "保存灵感"}</Button>
  </form>;
}
