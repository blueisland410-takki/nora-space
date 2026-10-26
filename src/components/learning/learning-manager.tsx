"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Check, Clock3, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteLearningGoal, deleteStudySession, saveLearningGoal, saveStudySession, updateLearningTask } from "@/app/phase2-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { dateKey } from "@/lib/dates";
import { learningProgress, studyMinutes } from "@/lib/phase2-metrics";
import type { LearningGoal, LearningTask, LearningWorkspace, StudySession } from "@/lib/phase2-types";

type GoalDialog = LearningGoal | "new" | null;
type SessionDialog = { task: LearningTask; session?: StudySession } | null;

function GoalForm({ goal, today, close }: { goal?: LearningGoal; today: string; close: () => void }) {
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        const result = await saveLearningGoal({
          id: goal?.id, language: form.get("language") as "en" | "ko", title: String(form.get("title")),
          startDate: String(form.get("startDate")), endDate: String(form.get("endDate")),
          targetTotal: Number(form.get("targetTotal")), unit: String(form.get("unit")),
          daysPerWeek: Number(form.get("daysPerWeek")), minutesPerSession: Number(form.get("minutesPerSession")),
        });
        if (!result.ok) return setError(result.error ?? "保存失败。");
        toast.success(goal ? "学习目标已更新" : "学习目标已创建，计划已自动拆分");
        close();
      } catch { setError("连接失败，输入内容仍保留在表单中。"); }
    });
  }
  return <form className="form-stack" onSubmit={submit}>
    <div className="form-row"><label className="field-label">语言<select className="field" name="language" defaultValue={goal?.language ?? "en"}><option value="en">英语</option><option value="ko">韩语</option></select></label><label className="field-label">目标标题<input className="field" name="title" defaultValue={goal?.title} maxLength={160} placeholder="例如：阅读英语原版书" required /></label></div>
    <div className="form-row"><label className="field-label">开始日期<input className="field" type="date" name="startDate" defaultValue={goal?.start_date ?? today} required /></label><label className="field-label">结束日期<input className="field" type="date" name="endDate" defaultValue={goal?.end_date ?? today} required /></label></div>
    <div className="form-row"><label className="field-label">总量<input className="field" type="number" name="targetTotal" defaultValue={goal?.target_total ?? 20} min={1} max={100000} required /></label><label className="field-label">单位<input className="field" name="unit" defaultValue={goal?.unit ?? "页"} maxLength={30} required /></label></div>
    <div className="form-row"><label className="field-label">每周学习天数<input className="field" type="number" name="daysPerWeek" defaultValue={goal?.days_per_week ?? 5} min={1} max={7} required /></label><label className="field-label">每次预计分钟<input className="field" type="number" name="minutesPerSession" defaultValue={goal?.minutes_per_session ?? 30} min={1} max={480} required /></label></div>
    <p className="muted small">更改日期、总量或每周天数会重新分配待完成计划；已完成和已有学习记录的任务会保留。</p>
    {error && <p className="form-error" role="alert">{error}</p>}
    <Button type="submit" disabled={pending}>{pending ? "保存中…" : "保存目标"}</Button>
  </form>;
}

function SessionForm({ task, session, today, close }: { task: LearningTask; session?: StudySession; today: string; close: () => void }) {
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        const result = await saveStudySession({ id: session?.id, taskId: task.id, studiedOn: String(form.get("studiedOn")), durationMinutes: Number(form.get("durationMinutes")), note: String(form.get("note")) });
        if (!result.ok) return setError(result.error ?? "保存失败。");
        toast.success("学习时间已记录"); close();
      } catch { setError("连接失败，输入内容仍保留在表单中。"); }
    });
  }
  return <form className="form-stack" onSubmit={submit}>
    <div className="form-row"><label className="field-label">学习日期<input className="field" name="studiedOn" type="date" defaultValue={session?.studied_on ?? today} required /></label><label className="field-label">实际分钟<input className="field" name="durationMinutes" type="number" min={1} max={1440} defaultValue={session?.duration_minutes ?? 30} required /></label></div>
    <label className="field-label">笔记（可选）<textarea className="field textarea" name="note" maxLength={2000} defaultValue={session?.note ?? ""} placeholder="今天学到了什么？" /></label>
    {error && <p className="form-error" role="alert">{error}</p>}<Button type="submit" disabled={pending}>{pending ? "保存中…" : "保存记录"}</Button>
  </form>;
}

export function LearningManager({ workspace, timezone }: { workspace: LearningWorkspace; timezone: string }) {
  const router = useRouter();
  const today = dateKey(new Date(), timezone);
  const [language, setLanguage] = useState<"all" | "en" | "ko">("all");
  const [query, setQuery] = useState("");
  const [goalDialog, setGoalDialog] = useState<GoalDialog>(null);
  const [sessionDialog, setSessionDialog] = useState<SessionDialog>(null);
  const [busy, startTransition] = useTransition();
  const goals = workspace.goals.filter((goal) => (language === "all" || goal.language === language) && goal.title.toLocaleLowerCase().includes(query.toLocaleLowerCase()));

  function mutate(work: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    startTransition(async () => {
      try { const result = await work(); if (result.ok) { toast.success(success); router.refresh(); } else toast.error(result.error ?? "操作失败。"); }
      catch { toast.error("连接失败，请稍后重试。"); }
    });
  }

  return <>
    <div className="page-header tracker-page-header"><div><p className="eyebrow">LEARNING TRACKER</p><h1 className="page-title">学习计划</h1><p className="page-subtitle">给英语和韩语一点稳定的时间，每一步都有迹可循。</p></div>{workspace.ready && <Button onClick={() => setGoalDialog("new")}><Plus size={17} />新建目标</Button>}</div>
    {!workspace.ready ? <Card className="card-body"><div className="empty-state"><BookOpen size={28} />学习模块尚未启用。请先按 DATABASE_MIGRATION_GUIDE.md 在现有 Supabase 项目执行 Sprint A 迁移。</div></Card> : <>
      <div className="filter-row tracker-filter-row"><label className="tracker-search-label">搜索目标<input className="field tracker-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="输入目标名称" /></label>{([ ["all", "全部"], ["en", "英语"], ["ko", "韩语"] ] as const).map(([value, label]) => <button key={value} className={`filter-button ${language === value ? "filter-button-active" : ""}`} onClick={() => setLanguage(value)}>{label}</button>)}</div>
      {goals.length === 0 ? <Card className="card-body"><div className="empty-state"><BookOpen size={28} />{workspace.goals.length ? "没有符合条件的学习目标。" : "还没有学习目标。选择英语或韩语，开始第一段计划。"}</div></Card> : <div className="tracker-stack">{goals.map((goal) => {
        const tasks = workspace.tasks.filter((task) => task.goal_id === goal.id);
        const sessions = workspace.sessions.filter((session) => session.goal_id === goal.id);
        const progress = learningProgress(goal, workspace.tasks, today);
        return <Card className="tracker-card" id={`goal-${goal.id}`} key={goal.id}>
          <div className="tracker-card-head"><div><span className="pill">{goal.language === "en" ? "英语" : "韩语"}</span><h2 className="section-title">{goal.title}</h2><p className="muted small">{goal.start_date} 至 {goal.end_date} · 每周 {goal.days_per_week} 天 · 每次约 {goal.minutes_per_session} 分钟</p></div><div className="tracker-actions"><button className="icon-action" aria-label={`编辑 ${goal.title}`} onClick={() => setGoalDialog(goal)}><Pencil size={17} /></button><button className="icon-action" aria-label={`删除 ${goal.title}`} disabled={busy} onClick={() => { if (window.confirm(`删除“${goal.title}”及其任务、学习记录？此操作无法撤销。`)) mutate(() => deleteLearningGoal(goal.id), "目标已删除"); }}><Trash2 size={17} /></button></div></div>
          <div className="tracker-progress-heading"><strong>{progress.completed} / {goal.target_total} {goal.unit}</strong><span>{progress.percent}%</span></div><div className="tracker-progress" role="progressbar" aria-valuenow={progress.completed} aria-valuemin={0} aria-valuemax={goal.target_total} aria-label={`${goal.title}完成进度`}><span style={{ width: `${progress.percent}%` }} /></div><div className="tracker-meta"><span>剩余 {progress.remaining} {goal.unit}</span><span>逾期 {progress.overdue} 项</span><span>已学习 {studyMinutes(sessions, goal.id)} 分钟</span></div>
          <h3 className="tracker-subtitle">学习任务</h3><div className="tracker-list">{tasks.map((task) => <div className="tracker-row" key={task.id}><button className={`checkbox-action ${task.status === "done" ? "checked" : ""}`} aria-label={task.status === "done" ? "恢复未完成" : "标记完成"} disabled={busy} onClick={() => mutate(() => updateLearningTask(task.id, { status: task.status === "done" ? "planned" : "done" }), "任务状态已更新")}>{task.status === "done" && <Check size={13} />}</button><div className="tracker-row-main"><strong className={task.status === "done" ? "done-text" : ""}>{task.target_amount} {goal.unit}</strong><small>{task.scheduled_date}{task.status === "planned" && task.scheduled_date < today ? " · 已逾期" : ""}</small></div><label className="tracker-date-label">安排日期<input className="field tracker-date" type="date" defaultValue={task.scheduled_date} key={task.scheduled_date} disabled={busy} onChange={(event) => mutate(() => updateLearningTask(task.id, { scheduledDate: event.target.value }), "安排日期已更新")} /></label><Button size="sm" variant="secondary" onClick={() => setSessionDialog({ task })}><Clock3 size={14} />记时间</Button></div>)}</div>
          <h3 className="tracker-subtitle">学习记录</h3>{sessions.length === 0 ? <p className="muted small">还没有学习时间记录。</p> : <div className="tracker-list">{sessions.map((session) => { const task = tasks.find((item) => item.id === session.task_id); return <div className="tracker-row" key={session.id}><div className="tracker-row-main"><strong>{session.studied_on} · {session.duration_minutes} 分钟</strong><small>{session.note || (task ? `${task.target_amount} ${goal.unit} 的任务` : "学习记录")}</small></div>{task && <button className="icon-action" aria-label="编辑学习记录" onClick={() => setSessionDialog({ task, session })}><Pencil size={16} /></button>}<button className="icon-action" aria-label="删除学习记录" disabled={busy} onClick={() => { if (window.confirm("确定删除这条学习时间记录吗？")) mutate(() => deleteStudySession(session.id), "学习记录已删除"); }}><Trash2 size={16} /></button></div>; })}</div>}
        </Card>;
      })}</div>}
    </>}
    <Dialog open={goalDialog !== null} onOpenChange={(open) => { if (!open) setGoalDialog(null); }}><DialogContent><DialogTitle className="dialog-title">{goalDialog === "new" ? "新建学习目标" : "编辑学习目标"}</DialogTitle><DialogDescription className="dialog-description">保存后会根据日期和每周天数自动拆分计划。</DialogDescription>{goalDialog && <GoalForm key={goalDialog === "new" ? "new" : goalDialog.id} goal={goalDialog === "new" ? undefined : goalDialog} today={today} close={() => { setGoalDialog(null); router.refresh(); }} />}</DialogContent></Dialog>
    <Dialog open={sessionDialog !== null} onOpenChange={(open) => { if (!open) setSessionDialog(null); }}><DialogContent><DialogTitle className="dialog-title">记录学习时间</DialogTitle><DialogDescription className="dialog-description">实际学习时间与目标完成量分别统计。</DialogDescription>{sessionDialog && <SessionForm key={sessionDialog.session?.id ?? sessionDialog.task.id} task={sessionDialog.task} session={sessionDialog.session} today={today} close={() => { setSessionDialog(null); router.refresh(); }} />}</DialogContent></Dialog>
  </>;
}
