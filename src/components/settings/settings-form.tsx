"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { savePreferences, signOut } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Preferences } from "@/lib/types";

const timezoneOptions = ["Asia/Seoul", "Asia/Shanghai", "Asia/Tokyo", "Europe/London", "America/New_York", "America/Los_Angeles"];

export function SettingsForm({ preferences }: { preferences: Preferences }) {
  const [playlist, setPlaylist] = useState(preferences.spotify_playlist_url ?? "");
  const [timezone, setTimezone] = useState(preferences.timezone);
  const [theme, setTheme] = useState<"light" | "dark">(preferences.theme);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        const result = await savePreferences({ spotifyPlaylistUrl: playlist, timezone, theme });
        if (!result.ok) { setError(result.error ?? "设置保存失败。"); return; }
        toast.success("设置已保存");
      } catch { setError("连接失败，请稍后重试。你输入的设置仍在表单中。"); }
    });
  }

  return <><div className="page-header"><div><p className="eyebrow">MAKE IT YOURS</p><h1 className="page-title">设置</h1><p className="page-subtitle">让你的空间更贴合你的习惯。</p></div></div>
    <div style={{ maxWidth: 680, display: "grid", gap: 18 }}>
      <Card className="card-body"><form className="form-stack" onSubmit={submit}>
        <div><h2 className="section-title">个人偏好</h2><p className="page-subtitle">所有设置会保存到你的私人账户。</p></div>
        <label className="field-label">Spotify 歌单链接<input className="field" type="url" value={playlist} onChange={(event) => setPlaylist(event.target.value)} placeholder="https://open.spotify.com/playlist/..." /><span className="muted small">仅支持标准的 Spotify 歌单 URL。私人歌单可能需要在 Spotify 中授权才能播放。</span></label>
        <label className="field-label">显示时区<select className="field" value={timezone} onChange={(event) => setTimezone(event.target.value)}>{!timezoneOptions.includes(timezone) && <option value={timezone}>{timezone}</option>}{timezoneOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
        <label className="field-label">外观主题<select className="field" value={theme} onChange={(event) => setTheme(event.target.value as "light" | "dark")}><option value="light">浅色模式</option><option value="dark">深色模式</option></select></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div><Button type="submit" disabled={pending}>{pending ? "保存中..." : "保存设置"}</Button></div>
      </form></Card>
      <Card className="card-body"><h2 className="section-title">账户</h2><p className="page-subtitle" style={{ margin: "10px 0 18px" }}>退出当前私人账户。</p><form action={signOut}><Button type="submit" variant="secondary">退出登录</Button></form></Card>
    </div>
  </>;
}
