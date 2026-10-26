import Link from "next/link";
import { ArrowUpRight, BookOpen, CheckSquare, Clock3, Dumbbell, FolderHeart, Lightbulb, Sparkles, Video } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { CompactSpotifyCard } from "@/components/dashboard/spotify-hero";
import { dateKey, displayDate, weekStartKey, addDaysToKey } from "@/lib/dates";
import { loadBookmarks, loadIdeas, loadPreferences, loadTasks } from "@/lib/data";
import { loadFitnessWorkspace, loadLearningWorkspace } from "@/lib/phase2-data";
import { fitnessWeek } from "@/lib/phase2-metrics";

const priorityLabel = { high: "高", medium: "中", low: "低" } as const;

export default async function DashboardPage() {
  const [tasks, ideas, bookmarks, preferences, learning, fitness] = await Promise.all([loadTasks(), loadIdeas(), loadBookmarks(), loadPreferences(), loadLearningWorkspace(), loadFitnessWorkspace()]);
  const timezone = preferences.timezone;
  const now = new Date();
  const today = dateKey(now, timezone);
  const weekStart = weekStartKey(today);
  const weekEnd = addDaysToKey(weekStart, 6);
  const todayTasks = tasks.filter((task) => task.status === "todo" && task.due_at && dateKey(task.due_at, timezone) === today);
  const completedThisWeek = tasks.filter((task) => task.status === "done" && task.completed_at && dateKey(task.completed_at, timezone) >= weekStart && dateKey(task.completed_at, timezone) <= weekEnd);
  const upcoming = tasks.filter((task) => task.status === "todo" && task.due_at && dateKey(task.due_at, timezone) > today).sort((a, b) => (a.due_at ?? "").localeCompare(b.due_at ?? "")).slice(0, 4);
  const todayLearning = learning.tasks.filter((task) => task.status === "planned" && task.scheduled_date === today);
  const overdueLearning = learning.tasks.filter((task) => task.status === "planned" && task.scheduled_date < today);
  const learningDoneThisWeek = learning.tasks.filter((task) => task.status === "done" && task.completed_at && dateKey(task.completed_at, timezone) >= weekStart && dateKey(task.completed_at, timezone) <= weekEnd);
  const fitnessThisWeek = fitnessWeek(fitness.workouts, today);

  return <div className="dashboard-home">
    <CompactSpotifyCard url={preferences.spotify_playlist_url} />

    <DashboardSection id="dashboard-overview" kicker="AT A GLANCE" title="今天的节奏" description="把正在发生的事，轻轻放在眼前。">
      <DashboardStats today={todayTasks.length} completed={completedThisWeek.length} ideas={ideas.length} bookmarks={bookmarks.length} />
    </DashboardSection>

    <DashboardSection id="dashboard-today" kicker="YOUR DAY" title="把目光放在当下">
      <div className="dashboard-panels">
        <Card className="dashboard-panel">
          <CardHeader><div className="card-topline"><div className="dashboard-panel-title"><span className="dashboard-panel-icon"><CheckSquare size={18} /></span><h3 className="card-title">今天要完成的事</h3></div><Link className="text-link" href="/tasks">查看全部 <ArrowUpRight size={14} /></Link></div></CardHeader>
          <div className="card-body">{todayTasks.length === 0 ? <div className="empty-state"><CheckSquare size={26} />今天没有到期的待办任务。</div> : todayTasks.slice(0, 5).map((task) => <div className="list-row" key={task.id}><span className="checkbox-action" /><div className="list-row-main"><strong>{task.title}</strong><small>{task.description || "今日截止"}</small></div><span className={"pill pill-" + task.priority}>{priorityLabel[task.priority]}</span></div>)}</div>
        </Card>
        <Card className="dashboard-panel">
          <CardHeader><div className="card-topline"><div className="dashboard-panel-title"><span className="dashboard-panel-icon"><Clock3 size={18} /></span><h3 className="card-title">接下来要做</h3></div><Link className="text-link" href="/calendar">查看日历 <ArrowUpRight size={14} /></Link></div></CardHeader>
          <div className="card-body">{upcoming.length === 0 ? <div className="empty-state"><Clock3 size={26} />暂无即将到期的任务。</div> : upcoming.map((task) => <div className="list-row" key={task.id}><div className="list-row-main"><strong>{task.title}</strong><small>{task.due_at ? displayDate(task.due_at, timezone) : ""}</small></div><span className={"pill pill-" + task.priority}>{priorityLabel[task.priority]}</span></div>)}</div>
        </Card>
        <Card className="dashboard-panel">
          <CardHeader><div className="card-topline"><div className="dashboard-panel-title"><span className="dashboard-panel-icon"><Lightbulb size={18} /></span><h3 className="card-title">最近的灵感</h3></div><Link className="text-link" href="/ideas">打开灵感 <ArrowUpRight size={14} /></Link></div></CardHeader>
          <div className="card-body">{ideas.length === 0 ? <div className="empty-state"><Lightbulb size={26} />还没有记录灵感。</div> : ideas.slice(0, 4).map((idea) => <div className="list-row" key={idea.id}><div className="list-row-main"><strong>{idea.title}</strong><small>{idea.category}</small></div><span className="pill">灵感</span></div>)}</div>
        </Card>
        <Card className="dashboard-panel">
          <CardHeader><div className="card-topline"><div className="dashboard-panel-title"><span className="dashboard-panel-icon"><FolderHeart size={18} /></span><h3 className="card-title">最近保存的内容</h3></div><Link className="text-link" href="/resources">查看收藏 <ArrowUpRight size={14} /></Link></div></CardHeader>
          <div className="card-body">{bookmarks.length === 0 ? <div className="empty-state"><FolderHeart size={26} />还没有收藏的网站。</div> : bookmarks.slice(0, 4).map((bookmark) => <div className="list-row" key={bookmark.id}><div className="list-row-main"><strong>{bookmark.title}</strong><small>{bookmark.category}</small></div><a className="text-link" href={bookmark.url} target="_blank" rel="noopener noreferrer">打开 <ArrowUpRight size={14} /></a></div>)}</div>
        </Card>
        {learning.ready && <Card className="dashboard-panel"><CardHeader><div className="card-topline"><div className="dashboard-panel-title"><span className="dashboard-panel-icon"><BookOpen size={18} /></span><h3 className="card-title">今天的学习</h3></div><Link className="text-link" href="/learning">查看计划 <ArrowUpRight size={14} /></Link></div></CardHeader><div className="card-body"><p className="muted small">本周完成 {learningDoneThisWeek.length} 项 · 逾期 {overdueLearning.length} 项</p>{todayLearning.length === 0 ? <div className="empty-state">今天没有待完成的学习安排。</div> : todayLearning.slice(0, 4).map((item) => { const goal = learning.goals.find((value) => value.id === item.goal_id); return <div className="list-row" key={item.id}><div className="list-row-main"><strong>{goal?.title ?? "学习安排"}</strong><small>{item.target_amount} {goal?.unit ?? "单位"}</small></div></div>; })}</div></Card>}
        {fitness.ready && <Card className="dashboard-panel"><CardHeader><div className="card-topline"><div className="dashboard-panel-title"><span className="dashboard-panel-icon"><Dumbbell size={18} /></span><h3 className="card-title">本周健身</h3></div><Link className="text-link" href="/fitness">查看计划 <ArrowUpRight size={14} /></Link></div></CardHeader><div className="card-body"><p className="muted small">完成 {fitnessThisWeek.sessions} / {fitness.settings?.weekly_sessions_target ?? 3} 次 · 累计 {fitnessThisWeek.minutes} 分钟</p>{fitness.plans.filter((plan) => plan.planned_date === today).length === 0 ? <div className="empty-state">今天没有训练计划。</div> : fitness.plans.filter((plan) => plan.planned_date === today).map((plan) => <div className="list-row" key={plan.id}><div className="list-row-main"><strong>{plan.title}</strong><small>{plan.exercise_type} · {plan.planned_minutes} 分钟</small></div></div>)}</div></Card>}
      </div>
    </DashboardSection>

    <DashboardSection id="dashboard-explore" kicker="EXPLORE YOUR SPACE" title="留一点位置给新的可能" description="从学习到创作，每个想法都有自己的去处。">
      <div className="dashboard-feature-grid">
        <Link href="/learning" className="card feature-card feature-blue"><span className="feature-icon"><BookOpen size={21} /></span><div><span className={`feature-status ${learning.ready ? "feature-status-active" : ""}`}>{learning.ready ? "正在使用" : "待迁移启用"}</span><h3>学习计划</h3><p>为英语与韩语学习留一块专注的地方。</p></div><span className="feature-link">进入板块 <ArrowUpRight size={16} /></span></Link>
        <Link href="/content-lab" className="card feature-card feature-pink"><span className="feature-icon"><Video size={21} /></span><div><span className="feature-status">即将开放</span><h3>内容创作</h3><p>从灵感到内容，让创作有自己的节奏。</p></div><span className="feature-link">进入板块 <ArrowUpRight size={16} /></span></Link>
        <Link href="/ideas" className="card feature-card feature-lavender"><span className="feature-icon"><Sparkles size={21} /></span><div><span className="feature-status feature-status-active">正在使用</span><h3>灵感工作室</h3><p>每一个新想法，都有机会成为下一件好作品。</p></div><span className="feature-link">查看灵感 <ArrowUpRight size={16} /></span></Link>
      </div>
    </DashboardSection>
  </div>;
}
