import Link from "next/link";
import { ExternalLink, Music2 } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { spotifyPlaylist } from "@/lib/urls";

export function SpotifyCard({ url }: { url: string | null }) {
  const playlist = spotifyPlaylist(url);
  return <Card><CardHeader><div className="card-topline"><CardTitle>陪你工作的小小背景音</CardTitle><Music2 size={18} color="#1db954" /></div></CardHeader><div className="card-body">
    {playlist ? <><iframe className="spotify-frame" title="Spotify 歌单播放器" src={playlist.embed} allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" /><p className="muted small" style={{ margin: "12px 0 0" }}>如无法播放，请检查歌单是否公开，或 <a className="text-link" href={playlist.url} target="_blank" rel="noopener noreferrer">在 Spotify 打开 <ExternalLink size={11} style={{ display: "inline" }} /></a>。</p></> : <div className="music-empty"><Music2 size={27} /><div>还没有设置歌单。<br /><Link href="/settings" className="text-link">添加我的 Spotify 歌单 →</Link></div></div>}
    <p className="muted small" style={{ margin: "15px 0 0" }}>Daily Song · 即将开放</p>
  </div></Card>;
}
