"use client";

import { useState, useTransition } from "react";
import { ExternalLink, FolderHeart, Globe2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteBookmark } from "@/app/actions";
import { BookmarkForm } from "@/components/resources/bookmark-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { Bookmark } from "@/lib/types";

function Cover({ url, title }: { url: string | null; title: string }) {
  const [failed, setFailed] = useState(false);
  return <div className="bookmark-cover">{url && !failed ?
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={`${title} 封面`} onError={() => setFailed(true)} referrerPolicy="no-referrer" /> : <Globe2 size={42} strokeWidth={1.2} />}</div>;
}

export function BookmarkManager({ bookmarks }: { bookmarks: Bookmark[] }) {
  const [editing, setEditing] = useState<Bookmark | "new" | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function remove(bookmark: Bookmark) {
    if (!window.confirm(`确定删除“${bookmark.title}”吗？此操作无法撤销。`)) return;
    setPendingId(bookmark.id);
    startTransition(async () => {
      try {
        const result = await deleteBookmark(bookmark.id);
        if (result.ok) toast.success("收藏已删除"); else toast.error(result.error ?? "删除失败。");
      } catch { toast.error("连接失败，请稍后重试。"); }
      finally { setPendingId(null); }
    });
  }

  return <>
    <div className="page-header"><div><p className="eyebrow">KEEP WHAT INSPIRES YOU</p><h1 className="page-title">资源收藏</h1><p className="page-subtitle">把常用的网站和好素材收进自己的小书架。</p></div><Button onClick={() => setEditing("new")}><Plus size={17} />收藏网站</Button></div>
    {bookmarks.length === 0 ? <Card className="empty-state"><FolderHeart size={29} />尚无收藏。添加你想随时打开的网站吧。</Card> : <div className="item-grid">{bookmarks.map((bookmark) => <Card className="item-card resource-card" key={bookmark.id}>
      <Cover key={bookmark.cover_url ?? "none"} url={bookmark.cover_url} title={bookmark.title} /><span className="pill item-category">{bookmark.category}</span><h3>{bookmark.title}</h3><p className="bookmark-url" title={bookmark.url}>{bookmark.url}</p>
      <div className="item-card-footer"><a className="text-link" href={bookmark.url} target="_blank" rel="noopener noreferrer"><ExternalLink size={13} style={{ display: "inline", verticalAlign: "middle" }} /> 打开网站</a><div className="list-row-actions"><button className="icon-action" aria-label={`编辑 ${bookmark.title}`} onClick={() => setEditing(bookmark)}><Pencil size={15} /></button><button className="icon-action" aria-label={`删除 ${bookmark.title}`} disabled={pendingId === bookmark.id} onClick={() => remove(bookmark)}><Trash2 size={15} /></button></div></div>
    </Card>)}</div>}
    <Dialog open={editing !== null} onOpenChange={(open) => { if (!open) setEditing(null); }}><DialogContent><DialogTitle className="dialog-title">{editing === "new" ? "收藏网站" : "编辑收藏"}</DialogTitle><DialogDescription className="dialog-description">封面图链接为可选项，加载失败时会显示默认封面。</DialogDescription>{editing && <BookmarkForm key={editing === "new" ? "new" : editing.id} bookmark={editing === "new" ? undefined : editing} onSaved={() => setEditing(null)} />}</DialogContent></Dialog>
  </>;
}
