"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html lang="zh-CN"><body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#f8f7f4", color: "#242330", fontFamily: "Arial, sans-serif", padding: 24 }}><main style={{ maxWidth: 500, padding: 32, borderRadius: 22, background: "white", boxShadow: "0 10px 34px #38334312" }}><p style={{ color: "#8b78d7", fontWeight: 800 }}>NORA SPACE</p><h1>暂时无法打开你的空间</h1><p style={{ lineHeight: 1.7, color: "#777" }}>请检查网络、Supabase 环境变量和数据库迁移是否已配置，然后重试。</p><button onClick={reset} style={{ marginTop: 12, padding: "11px 18px", border: 0, borderRadius: 11, background: "#8b78d7", color: "white", cursor: "pointer" }}>重试</button></main></body></html>;
}
