"use client";

import { useActionState } from "react";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { signIn, type ActionResult } from "@/app/actions";
import { Button } from "@/components/ui/button";

const initialState: ActionResult = { ok: false };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, initialState);
  return <main className="login-page">
    <section className="login-visual">
      <div className="brand-mark"><span className="brand-icon">✦</span><span className="brand-copy">NORA<span>SPACE</span></span></div>
      <div><p className="eyebrow">YOUR PERSONAL OPERATING SYSTEM</p><h1>让灵感、计划<br />与生活在这里<br />好好发生。</h1></div>
      <p>一个为你留白的私人空间。整理工作、记录学习、收藏灵感，让每一天都更有方向。</p>
    </section>
    <section className="login-panel"><div className="login-card">
      <div className="coming-icon"><LockKeyhole size={25} /></div>
      <h2>欢迎回来</h2><p>登录你的私人空间，继续今天的旅程。</p>
      <form action={formAction}>
        <label className="field-label">邮箱<input className="field" name="email" type="email" autoComplete="username" required placeholder="your@email.com" /></label>
        <label className="field-label">密码<input className="field" name="password" type="password" autoComplete="current-password" required placeholder="输入密码" /></label>
        {state.error && <p className="form-error" role="alert">{state.error}</p>}
        <Button type="submit" disabled={pending}>{pending ? "登录中..." : "进入 NORA SPACE"}<ArrowRight size={16} /></Button>
      </form>
      <p className="small muted" style={{ marginTop: 24 }}>仅限私人账户登录。如需创建账户，请使用 Supabase Dashboard。</p>
    </div></section>
  </main>;
}
