"use client";

import { useState, useTransition } from "react";
import { Lightbulb, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteIdea } from "@/app/actions";
import { IdeaForm } from "@/components/ideas/idea-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { displayDate } from "@/lib/dates";
import type { Idea } from "@/lib/types";

export function IdeaManager({ ideas, timezone }: { ideas: Idea[]; timezone: string }) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Idea | "new" | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const shown = ideas.filter((idea) => `${idea.title} ${idea.content} ${idea.category}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()));

  function remove(idea: Idea) {
    if (!window.confirm(`确定删除“${idea.title}”吗？此操作无法撤销。`)) return;
    setPendingId(idea.id);
    startTransition(async () => {
      try {
        const result = await deleteIdea(idea.id);
        if (result.ok) toast.success("灵感已删除"); else toast.error(result.error ?? "删除失败。");
      } catch { toast.error("连接失败，请稍后重试。"); }
      finally { setPendingId(null); }
    });
  }

  return <>
    <div className="page-header"><div><p className="eyebrow">COLLECT YOUR THOUGHTS</p><h1 className="page-title">灵感工作室</h1><p className="page-subtitle">记录闪现的好点子，慢慢让它长成作品。</p></div><Button onClick={() => setEditing("new")}><Plus size={17} />新建灵感</Button></div>
    <div className="filter-row"><div className="search-box content-search"><Search size={16} /><input aria-label="搜索灵感" placeholder="搜索标题、内容或分类" value={query} onChange={(event) => setQuery(event.target.value)} /></div><span className="muted small filter-count">按创建时间排序 · {shown.length} 条</span></div>
    {shown.length === 0 ? <Card className="empty-state"><Lightbulb size={29} />{query ? "没有找到匹配的灵感。" : "还没有灵感记录。随手写下第一个想法吧。"}</Card> : <div className="item-grid">{shown.map((idea) => <Card className="item-card idea-card" key={idea.id}>
      <span className="pill item-category">{idea.category}</span><h3>{idea.title}</h3><p className="idea-card-content">{idea.content || "暂无正文"}</p>
      <div className="item-card-footer"><small>{displayDate(idea.created_at, timezone)}</small><div className="list-row-actions"><button className="icon-action" aria-label={`编辑 ${idea.title}`} onClick={() => setEditing(idea)}><Pencil size={15} /></button><button className="icon-action" aria-label={`删除 ${idea.title}`} disabled={pendingId === idea.id} onClick={() => remove(idea)}><Trash2 size={15} /></button></div></div>
    </Card>)}</div>}
    <Card className="coming-card" style={{ marginTop: 22, padding: 22 }}><span className="pill">即将开放</span><p style={{ marginBottom: 0 }}>AI 润色与 Word 文档导出将在后续阶段加入。</p></Card>
    <Dialog open={editing !== null} onOpenChange={(open) => { if (!open) setEditing(null); }}><DialogContent><DialogTitle className="dialog-title">{editing === "new" ? "新建灵感" : "编辑灵感"}</DialogTitle><DialogDescription className="dialog-description">好想法值得被记录。</DialogDescription>{editing && <IdeaForm key={editing === "new" ? "new" : editing.id} idea={editing === "new" ? undefined : editing} onSaved={() => setEditing(null)} />}</DialogContent></Dialog>
  </>;
}
