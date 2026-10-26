"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveBookmark } from "@/app/actions";
import { Button } from "@/components/ui/button";
import type { Bookmark } from "@/lib/types";

export function BookmarkForm({ bookmark, onSaved }: { bookmark?: Bookmark; onSaved?: () => void }) {
  const [title, setTitle] = useState(bookmark?.title ?? "");
  const [url, setUrl] = useState(bookmark?.url ?? "");
  const [category, setCategory] = useState(bookmark?.category ?? "未分类");
  const [coverUrl, setCoverUrl] = useState(bookmark?.cover_url ?? "");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        const result = await saveBookmark({ id: bookmark?.id, title, url, category, coverUrl });
        if (!result.ok) { setError(result.error ?? "保存失败。"); return; }
        toast.success(bookmark ? "收藏已更新" : "网站已收藏");
        if (!bookmark) { setTitle(""); setUrl(""); setCategory("未分类"); setCoverUrl(""); }
        onSaved?.();
      } catch { setError("连接失败，请稍后重试。你输入的内容仍在表单中。"); }
    });
  }

  return <form onSubmit={submit} className="form-stack">
    <label className="field-label">网站标题<input className="field" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} required placeholder="给网站起个名字" /></label>
    <label className="field-label">网站链接<input className="field" type="url" value={url} onChange={(event) => setUrl(event.target.value)} required placeholder="https://example.com" /></label>
    <label className="field-label">分类<input className="field" value={category} onChange={(event) => setCategory(event.target.value)} maxLength={40} required placeholder="未分类" /></label>
    <label className="field-label">封面图链接（可选）<input className="field" type="url" value={coverUrl} onChange={(event) => setCoverUrl(event.target.value)} placeholder="https://example.com/cover.jpg" /></label>
    {error && <p className="form-error" role="alert">{error}</p>}
    <Button type="submit" disabled={pending}>{pending ? "保存中..." : bookmark ? "保存修改" : "保存网站"}</Button>
  </form>;
}
