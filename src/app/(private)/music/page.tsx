import { Music2 } from "lucide-react";
import { SpotifyCard } from "@/components/music/spotify-card";
import { loadPreferences } from "@/lib/data";

export default async function MusicPage() {
  const preferences = await loadPreferences();
  return <><div className="page-header"><div><p className="eyebrow">SOUNDTRACK FOR YOUR DAY</p><h1 className="page-title">Spotify 音乐</h1><p className="page-subtitle">选择一份歌单，给工作与学习加一点好心情。</p></div><Music2 color="#1db954" /></div><div style={{ maxWidth: 700 }}><SpotifyCard url={preferences.spotify_playlist_url} /></div></>;
}
