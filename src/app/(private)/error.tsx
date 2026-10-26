"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="card coming-card"><h1 className="page-title">页面暂时无法加载</h1><p>请检查网络连接和 Supabase 配置，或稍后重试。若尚未执行数据库迁移，请先按照 README 操作。</p><Button onClick={reset}>重试</Button></div>;
}
