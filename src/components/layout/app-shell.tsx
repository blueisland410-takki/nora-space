"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3, BookOpen, CalendarDays, CheckSquare, ChevronLeft, ChevronRight,
  Dumbbell, FolderHeart, Home, Lightbulb, LogOut, Menu, Moon, Music2, Plus,
  Search, Settings, Sparkles, Sun, Video, WandSparkles, X,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { savePreferences, signOut } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { QuickCapture } from "@/components/layout/quick-capture";
import type { Preferences } from "@/lib/types";
import { cn } from "@/lib/utils";

const navigationGroups = [
  { label: "Workspace", items: [
    { label: "总览", href: "/", icon: Home },
    { label: "我的任务", href: "/tasks", icon: CheckSquare },
    { label: "灵感工作室", href: "/ideas", icon: Lightbulb },
    { label: "资源收藏", href: "/resources", icon: FolderHeart },
    { label: "内容实验室", href: "/content-lab", icon: Video },
    { label: "内容分析", href: "/analytics", icon: BarChart3 },
    { label: "Lark 助手", href: "/lark", icon: Sparkles },
  ] },
  { label: "Personal", items: [
    { label: "学习计划", href: "/learning", icon: BookOpen },
    { label: "智能日历", href: "/calendar", icon: CalendarDays },
    { label: "健身记录", href: "/fitness", icon: Dumbbell },
    { label: "每周复盘", href: "/weekly-review", icon: WandSparkles },
    { label: "Spotify 音乐", href: "/music", icon: Music2 },
  ] },
];

export function AppShell({ children, email, preferences }: { children: React.ReactNode; email: string; preferences: Preferences }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const current = pathname === "/settings" ? "设置" : navigationGroups.flatMap((group) => group.items).find((item) => item.href === pathname)?.label ?? "NORA SPACE";
  const theme = preferences.theme;

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    startTransition(async () => {
      try {
        const result = await savePreferences({
          spotifyPlaylistUrl: preferences.spotify_playlist_url ?? "",
          timezone: preferences.timezone,
          theme: next,
        });
        if (!result.ok) toast.error(result.error ?? "主题保存失败。");
      } catch { toast.error("连接失败，主题未保存。"); }
    });
  }

  return <div className={cn("app-shell", theme === "dark" && "theme-dark", collapsed && "sidebar-collapsed")}>
    {mobileOpen && <button className="mobile-backdrop" aria-label="关闭导航" onClick={() => setMobileOpen(false)} />}
    <aside className={cn("sidebar", mobileOpen && "sidebar-open")}>
      <div className="brand-row">
        <Link href="/" className="brand-mark" onClick={() => setMobileOpen(false)}><span className="brand-icon">✦</span><span className="brand-copy">NORA<span>SPACE</span></span></Link>
        <button className="sidebar-close-mobile" aria-label="关闭导航" onClick={() => setMobileOpen(false)}><X size={19} /></button>
      </div>
      <nav className="nav-list" aria-label="主导航">
        {navigationGroups.map((group) => <div className="nav-group" key={group.label}>
          <div className="nav-group-label">{group.label}</div>
          {group.items.map(({ label, href, icon: Icon }) => <Link key={href} href={href} title={label} onClick={() => setMobileOpen(false)} className={cn("nav-link", pathname === href && "nav-link-active")}>
            <Icon size={19} strokeWidth={1.8} /><span>{label}</span>{pathname === href && <span className="nav-dot" />}
          </Link>)}
        </div>)}
      </nav>
      <div className="sidebar-footer">
        <div className="nav-group-label">System</div>
        <button className="nav-link" onClick={() => { setCaptureOpen(true); setMobileOpen(false); }} title="快速收集"><Plus size={19} strokeWidth={1.8} /><span>快速收集</span></button>
        <Link href="/settings" onClick={() => setMobileOpen(false)} className={cn("nav-link", pathname === "/settings" && "nav-link-active")}><Settings size={19} /><span>设置</span></Link>
        <form action={signOut} className="mobile-signout"><button type="submit" className="nav-link"><LogOut size={19} /><span>退出登录</span></button></form>
        <button className="collapse-button" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? "展开导航" : "收起导航"}>{collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}<span>{collapsed ? "展开" : "收起导航"}</span></button>
      </div>
    </aside>
    <div className="workspace">
      <header className="topbar">
        <div className="topbar-left"><button className="mobile-menu" aria-label="打开导航" onClick={() => setMobileOpen(true)}><Menu size={22} /></button><span className="topbar-title">{current}</span></div>
        <div className="topbar-actions">
          <form className="search-box" action={(formData) => { const q = String(formData.get("q") ?? "").trim(); router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search"); }}><Search size={17} /><input name="q" aria-label="全局搜索" placeholder="搜索你的空间..." /></form>
          <Link className="mobile-search" href="/search" aria-label="搜索"><Search size={19} /></Link>
          <Button size="icon" variant="ghost" aria-label={theme === "light" ? "切换深色模式" : "切换浅色模式"} disabled={pending} onClick={toggleTheme}>{theme === "light" ? <Moon size={19} /> : <Sun size={19} />}</Button>
          <Button className="quick-button" onClick={() => setCaptureOpen(true)}><Plus size={18} /><span>快速添加</span></Button>
          <div className="user-menu"><div className="avatar">N</div><div className="user-copy"><strong>我的空间</strong><span title={email}>{email}</span></div><form action={signOut}><button type="submit" className="signout-link">退出</button></form></div>
        </div>
      </header>
      <main className="main-content">{children}</main>
    </div>
    <QuickCapture open={captureOpen} onOpenChange={setCaptureOpen} timezone={preferences.timezone} />
    <Toaster richColors position="top-right" />
  </div>;
}
