"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Check, Dumbbell, ExternalLink, Pencil, Plus, Trash2, Video } from "lucide-react";
import { toast } from "sonner";
import { deleteFitnessPlan, deleteFitnessVideo, deleteWorkoutSession, saveFitnessPlan, saveFitnessSettings, saveFitnessVideo, saveWorkoutSession } from "@/app/phase2-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { dateKey } from "@/lib/dates";
import { fitnessWeek } from "@/lib/phase2-metrics";
import type { FitnessPlan, FitnessVideoBookmark, FitnessWorkspace, WorkoutSession } from "@/lib/phase2-types";

function optionalNumber(value: FormDataEntryValue | null) { return value === null || value === "" ? null : Number(value); }
type Editor = { kind: "plan"; value?: FitnessPlan } | { kind: "workout"; value?: WorkoutSession; plan?: FitnessPlan } | { kind: "video"; value?: FitnessVideoBookmark } | null;

function VideoCover({ url }: { url: string | null }) {
  const [failed, setFailed] = useState(false);
  return <div className="tracker-video-cover">{url && !failed ? <Image unoptimized src={url} alt="" width={480} height={200} onError={() => setFailed(true)} /> : <Video size={30} />}</div>;
}

function FitnessForm({ editor, today, close }: { editor: NonNullable<Editor>; today: string; close: () => void }) {
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const plan = editor.kind === "plan" ? editor.value : undefined;
  const workout = editor.kind === "workout" ? editor.value : undefined;
  const video = editor.kind === "video" ? editor.value : undefined;
  const linkedPlan = editor.kind === "workout" ? editor.plan : undefined;
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        let result;
        if (editor.kind === "plan") result = await saveFitnessPlan({ id: plan?.id, title: String(form.get("title")), plannedDate: String(form.get("date")), plannedMinutes: Number(form.get("minutes")), exerciseType: String(form.get("exerciseType")), plannedSets: optionalNumber(form.get("sets")), plannedReps: optionalNumber(form.get("reps")), plannedWeightKg: optionalNumber(form.get("weight")), note: String(form.get("note")) });
        else if (editor.kind === "workout") result = await saveWorkoutSession({ id: workout?.id, planId: linkedPlan?.id ?? workout?.plan_id ?? null, title: String(form.get("title")), performedOn: String(form.get("date")), durationMinutes: Number(form.get("minutes")), actualSets: optionalNumber(form.get("sets")), actualReps: optionalNumber(form.get("reps")), actualWeightKg: optionalNumber(form.get("weight")), note: String(form.get("note")) });
        else result = await saveFitnessVideo({ id: video?.id, title: String(form.get("title")), url: String(form.get("url")), coverUrl: String(form.get("coverUrl")), note: String(form.get("note")) });
        if (!result.ok) return setError(result.error ?? "保存失败。");
        toast.success("已保存"); close();
      } catch { setError("连接失败，输入内容仍保留在表单中。"); }
    });
  }
  return <form className="form-stack" onSubmit={submit}>
    <label className="field-label">标题<input className="field" name="title" defaultValue={plan?.title ?? workout?.title ?? video?.title ?? linkedPlan?.title ?? ""} maxLength={160} required placeholder={editor.kind === "video" ? "视频名称" : "例如：上肢力量训练"} /></label>
    {editor.kind === "video" ? <><label className="field-label">视频链接<input className="field" name="url" type="url" defaultValue={video?.url ?? ""} maxLength={2048} required placeholder="https://…" /></label><label className="field-label">封面图片链接（可选）<input className="field" name="coverUrl" type="url" defaultValue={video?.cover_url ?? ""} maxLength={2048} placeholder="https://…" /></label></> : <>
      <div className="form-row"><label className="field-label">{editor.kind === "plan" ? "计划日期" : "训练日期"}<input className="field" name="date" type="date" defaultValue={plan?.planned_date ?? workout?.performed_on ?? linkedPlan?.planned_date ?? today} required /></label><label className="field-label">{editor.kind === "plan" ? "预计分钟" : "实际分钟"}<input className="field" name="minutes" type="number" min={1} max={1440} defaultValue={plan?.planned_minutes ?? workout?.duration_minutes ?? linkedPlan?.planned_minutes ?? 30} required /></label></div>
      {editor.kind === "plan" && <label className="field-label">训练类型<input className="field" name="exerciseType" defaultValue={plan?.exercise_type ?? "力量"} maxLength={40} required placeholder="力量、有氧、拉伸…" /></label>}
      <div className="tracker-numbers"><label className="field-label">{editor.kind === "plan" ? "计划组数" : "实际组数"}<input className="field" name="sets" type="number" min={1} max={100} defaultValue={plan?.planned_sets ?? workout?.actual_sets ?? linkedPlan?.planned_sets ?? ""} /></label><label className="field-label">{editor.kind === "plan" ? "计划次数" : "实际次数"}<input className="field" name="reps" type="number" min={1} max={1000} defaultValue={plan?.planned_reps ?? workout?.actual_reps ?? linkedPlan?.planned_reps ?? ""} /></label><label className="field-label">{editor.kind === "plan" ? "计划重量 kg" : "实际重量 kg"}<input className="field" name="weight" type="number" min={0} max={10000} step="0.01" defaultValue={plan?.planned_weight_kg ?? workout?.actual_weight_kg ?? linkedPlan?.planned_weight_kg ?? ""} /></label></div>
    </>}
    <label className="field-label">备注（可选）<textarea className="field textarea" name="note" defaultValue={plan?.note ?? workout?.note ?? video?.note ?? ""} maxLength={2000} /></label>
    {error && <p className="form-error" role="alert">{error}</p>}<Button type="submit" disabled={pending}>{pending ? "保存中…" : "保存"}</Button>
  </form>;
}

export function FitnessManager({ workspace, timezone }: { workspace: FitnessWorkspace; timezone: string }) {
  const router = useRouter(); const today = dateKey(new Date(), timezone);
  const [editor, setEditor] = useState<Editor>(null);
  const [query, setQuery] = useState("");
  const [target, setTarget] = useState(workspace.settings?.weekly_sessions_target ?? 3);
  const [busy, startTransition] = useTransition();
  const week = fitnessWeek(workspace.workouts, today);
  const plans = workspace.plans.filter((plan) => plan.title.toLocaleLowerCase().includes(query.toLocaleLowerCase()) || plan.exercise_type.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  const workouts = workspace.workouts.filter((workout) => workout.title.toLocaleLowerCase().includes(query.toLocaleLowerCase()) || workout.note.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  const videos = workspace.videos.filter((video) => video.title.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  function mutate(work: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    startTransition(async () => { try { const result = await work(); if (result.ok) { toast.success(success); router.refresh(); } else toast.error(result.error ?? "操作失败。"); } catch { toast.error("连接失败，请稍后重试。"); } });
  }
  return <>
    <div className="page-header tracker-page-header"><div><p className="eyebrow">FITNESS TRACKER</p><h1 className="page-title">健身计划</h1><p className="page-subtitle">为身体留出时间，用实际训练记录自己的节奏。</p></div>{workspace.ready && <Button onClick={() => setEditor({ kind: "plan" })}><Plus size={17} />新建计划</Button>}</div>
    {!workspace.ready ? <Card className="card-body"><div className="empty-state"><Dumbbell size={28} />健身模块尚未启用。请先按 DATABASE_MIGRATION_GUIDE.md 在现有 Supabase 项目执行 Sprint A 迁移。</div></Card> : <>
      <div className="tracker-summary-grid"><Card className="card-body"><p className="muted small">本周完成</p><strong className="tracker-number">{week.sessions}<small> / {target} 次</small></strong><p className="muted small">按实际训练记录统计</p></Card><Card className="card-body"><p className="muted small">本周运动时间</p><strong className="tracker-number">{week.minutes}<small> 分钟</small></strong><p className="muted small">训练时间累计</p></Card><Card className="card-body"><label className="field-label">每周目标次数<input className="field" type="number" min={1} max={14} value={target} onChange={(event) => setTarget(Number(event.target.value))} /></label><Button size="sm" variant="secondary" disabled={busy} onClick={() => mutate(() => saveFitnessSettings(target), "每周目标已保存")}>保存目标</Button></Card></div>
      <div className="tracker-toolbar"><label className="tracker-search-label">搜索训练或视频<input className="field tracker-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="输入关键词" /></label><Button variant="secondary" onClick={() => setEditor({ kind: "workout" })}><Plus size={16} />记一次训练</Button></div>
      <section><h2 className="section-title tracker-section-title">训练计划</h2>{plans.length === 0 ? <Card className="card-body"><div className="empty-state"><Dumbbell size={26} />{workspace.plans.length ? "没有符合条件的训练计划。" : "还没有训练计划。点击“新建计划”开始。"}</div></Card> : <div className="tracker-stack">{plans.map((plan) => { const logged = workspace.workouts.find((workout) => workout.plan_id === plan.id); return <Card className="tracker-card" id={`plan-${plan.id}`} key={plan.id}><div className="tracker-card-head"><div><span className="pill">{plan.exercise_type}</span><h3 className="section-title">{plan.title}</h3><p className="muted small">{plan.planned_date} · 预计 {plan.planned_minutes} 分钟{plan.planned_sets ? ` · ${plan.planned_sets} 组` : ""}{plan.planned_reps ? ` × ${plan.planned_reps} 次` : ""}{plan.planned_weight_kg !== null ? ` · ${plan.planned_weight_kg} kg` : ""}</p>{plan.note && <p className="muted small">{plan.note}</p>}</div><div className="tracker-actions"><button className="icon-action" aria-label={`编辑 ${plan.title}`} onClick={() => setEditor({ kind: "plan", value: plan })}><Pencil size={17} /></button><button className="icon-action" aria-label={`删除 ${plan.title}`} disabled={busy} onClick={() => { if (window.confirm(`删除计划“${plan.title}”？已有实际训练记录会保留。`)) mutate(() => deleteFitnessPlan(plan.id), "计划已删除"); }}><Trash2 size={17} /></button></div></div><div className="tracker-meta"><span>{logged ? <><Check size={14} /> 已训练 {logged.duration_minutes} 分钟</> : "待训练"}</span>{logged ? <Button size="sm" variant="secondary" onClick={() => setEditor({ kind: "workout", value: logged, plan })}>编辑记录</Button> : <Button size="sm" variant="secondary" onClick={() => setEditor({ kind: "workout", plan })}>记录完成</Button>}</div></Card>; })}</div>}</section>
      <section><h2 className="section-title tracker-section-title">训练历史</h2><Card className="card-body">{workouts.length === 0 ? <div className="empty-state">{workspace.workouts.length ? "没有符合条件的训练记录。" : "还没有实际训练记录。"}</div> : workouts.map((workout) => <div className="tracker-row" key={workout.id}><div className="tracker-row-main"><strong>{workout.title}</strong><small>{workout.performed_on} · {workout.duration_minutes} 分钟{workout.actual_sets ? ` · ${workout.actual_sets} 组` : ""}{workout.actual_reps ? ` × ${workout.actual_reps} 次` : ""}{workout.actual_weight_kg !== null ? ` · ${workout.actual_weight_kg} kg` : ""}{workout.note ? ` · ${workout.note}` : ""}</small></div><button className="icon-action" aria-label={`编辑 ${workout.title} 训练记录`} onClick={() => setEditor({ kind: "workout", value: workout })}><Pencil size={16} /></button><button className="icon-action" aria-label={`删除 ${workout.title} 训练记录`} disabled={busy} onClick={() => { if (window.confirm("确定删除这条训练记录吗？")) mutate(() => deleteWorkoutSession(workout.id), "训练记录已删除"); }}><Trash2 size={16} /></button></div>)}</Card></section>
      <section><div className="tracker-section-head"><h2 className="section-title">教学视频收藏</h2><Button variant="secondary" size="sm" onClick={() => setEditor({ kind: "video" })}><Plus size={16} />添加视频</Button></div>{videos.length === 0 ? <Card className="card-body"><div className="empty-state"><Video size={26} />{workspace.videos.length ? "没有符合条件的视频。" : "还没有视频收藏。保存常用的训练教程，随时打开观看。"}</div></Card> : <div className="tracker-video-grid">{videos.map((video) => <Card className="tracker-video" key={video.id}><VideoCover key={video.cover_url ?? "none"} url={video.cover_url} /><div className="tracker-video-body"><h3>{video.title}</h3>{video.note && <p className="muted small">{video.note}</p>}<div className="tracker-section-head"><a className="text-link" href={video.url} target="_blank" rel="noopener noreferrer">打开视频 <ExternalLink size={14} /></a><span className="tracker-actions"><button className="icon-action" aria-label={`编辑 ${video.title}`} onClick={() => setEditor({ kind: "video", value: video })}><Pencil size={16} /></button><button className="icon-action" aria-label={`删除 ${video.title}`} disabled={busy} onClick={() => { if (window.confirm(`删除视频“${video.title}”？`)) mutate(() => deleteFitnessVideo(video.id), "视频已删除"); }}><Trash2 size={16} /></button></span></div></div></Card>)}</div>}</section>
    </>}
    <Dialog open={editor !== null} onOpenChange={(open) => { if (!open) setEditor(null); }}><DialogContent><DialogTitle className="dialog-title">{editor?.kind === "plan" ? "训练计划" : editor?.kind === "workout" ? "实际训练记录" : "视频收藏"}</DialogTitle><DialogDescription className="dialog-description">填写自己的计划和实际情况，保存后会同步到页面。</DialogDescription>{editor && <FitnessForm key={`${editor.kind}-${editor.value?.id ?? (editor.kind === "workout" ? editor.plan?.id : undefined) ?? "new"}`} editor={editor} today={today} close={() => { setEditor(null); router.refresh(); }} />}</DialogContent></Dialog>
  </>;
}
