import Link from "next/link";
import { ArrowUpRight, Headphones, Plus } from "lucide-react";
import { spotifyPlaylist } from "@/lib/urls";

export function CompactSpotifyCard({ url }: { url: string | null }) {
  const playlist = spotifyPlaylist(url);

  return <section className="compact-spotify" aria-labelledby="compact-spotify-title">
    <div className="compact-spotify-copy">
      <span className="compact-spotify-kicker"><span className="spotify-live-dot" /> YOUR DAILY SOUNDTRACK</span>
      <h1 id="compact-spotify-title">Your daily soundtrack</h1>
      <p>A little music for your day.</p>
      <div className="compact-spotify-links">
        {playlist && <a href={playlist.url} target="_blank" rel="noopener noreferrer">在 Spotify 打开 <ArrowUpRight size={14} /></a>}
        <Link href="/settings">{playlist ? "更换歌单" : "添加我的 Spotify 歌单"}</Link>
      </div>
      <span className="compact-spotify-footnote">Daily Song · 即将开放</span>
    </div>
    {playlist ? <div className="compact-spotify-player">
      <iframe
        title="Spotify 歌单播放器"
        src={playlist.embed}
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
      />
    </div> : <div className="compact-spotify-empty">
      <span className="compact-spotify-empty-icon"><Headphones size={25} strokeWidth={1.6} /></span>
      <div><h2>放一张喜欢的歌单在这里</h2><p>设置后，就能在首页直接播放。</p></div>
      <Link href="/settings" className="compact-spotify-cta"><Plus size={16} /> 添加我的 Spotify 歌单</Link>
    </div>}
  </section>;
}
