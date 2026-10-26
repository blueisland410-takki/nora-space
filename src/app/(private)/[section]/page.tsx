import Link from "next/link";
import { notFound } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const sections: Record<string, { title: string; description: string }> = {
  learning: { title: "学习计划", description: "英语与韩语学习计划、进度和复习记录将在这里汇合。" },
  "content-lab": { title: "AI 内容实验室", description: "视频分析、脚本草稿和创作工作流正在规划中。" },
  analytics: { title: "内容分析", description: "抖音和小红书的数据趋势将在后续阶段接入。" },
  lark: { title: "Lark 助手", description: "工作群总结功能需要飞书授权和安全的数据连接。" },
  fitness: { title: "健身记录", description: "训练计划与运动记录将在后续阶段上线。" },
  "weekly-review": { title: "每周复盘", description: "每周智能复盘将在基础数据积累后推出。" },
};

export default async function ComingSoonPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const item = sections[section];
  if (!item) notFound();
  return <><div className="page-header"><div><p className="eyebrow">COMING SOON</p><h1 className="page-title">{item.title}</h1><p className="page-subtitle">新的空间，正在慢慢准备。</p></div></div><Card className="coming-card"><div className="coming-icon"><Sparkles size={26} /></div><span className="pill">即将开放</span><h2 style={{ marginTop: 16 }}>好事情正在路上</h2><p>{item.description}目前可以先使用任务、灵感、收藏和日历，让重要信息有处可去。</p><Button asChild variant="secondary"><Link href="/">返回总览</Link></Button></Card></>;
}
