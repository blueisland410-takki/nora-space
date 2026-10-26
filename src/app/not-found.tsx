import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return <main style={{ display: "grid", minHeight: "100vh", placeItems: "center", padding: 24 }}><div className="card coming-card"><p className="eyebrow">404</p><h1 className="page-title">找不到这个页面</h1><p>这个地址还没有对应内容。</p><Button asChild><Link href="/">返回总览</Link></Button></div></main>;
}
