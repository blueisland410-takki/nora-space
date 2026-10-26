import Link from "next/link";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { loadBookmarks, loadIdeas, loadTasks } from "@/lib/data";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const query = q.trim().slice(0, 160).toLocaleLowerCase();
  const [tasks, ideas, bookmarks] = await Promise.all([loadTasks(), loadIdeas(), loadBookmarks()]);
  const results = query ? [
    ...tasks.filter((item) => `${item.title} ${item.description}`.toLocaleLowerCase().includes(query)).map((item) => ({ key: item.id, type: "任务", title: item.title, href: "/tasks" })),
    ...ideas.filter((item) => `${item.title} ${item.content} ${item.category}`.toLocaleLowerCase().includes(query)).map((item) => ({ key: item.id, type: "灵感", title: item.title, href: "/ideas" })),
    ...bookmarks.filter((item) => `${item.title} ${item.category} ${item.url}`.toLocaleLowerCase().includes(query)).map((item) => ({ key: item.id, type: "收藏", title: item.title, href: "/resources" })),
  ] : [];
  return <><div className="page-header"><div><p className="eyebrow">FIND WHAT YOU NEED</p><h1 className="page-title">全局搜索</h1><p className="page-subtitle">{query ? `“${q.slice(0, 160)}”的搜索结果：${results.length} 条` : "输入关键词，查找任务、灵感和收藏。"}</p></div></div><form action="/search" method="get" className="filter-row"><input className="field" style={{ maxWidth: 380 }} name="q" aria-label="搜索关键词" defaultValue={q.slice(0, 160)} placeholder="搜索任务、灵感或收藏" /><button className="button-base button-primary button-default" type="submit"><Search size={15} />搜索</button></form><Card className="card-body">{results.length === 0 ? <div className="empty-state"><Search size={28} />{query ? "没有找到匹配内容。" : "搜索结果将在这里出现。"}</div> : results.map((result) => <Link className="list-row" href={result.href} key={`${result.type}-${result.key}`}><span className="pill">{result.type}</span><div className="list-row-main"><strong>{result.title}</strong></div><span className="text-link">查看 →</span></Link>)}</Card></>;
}
