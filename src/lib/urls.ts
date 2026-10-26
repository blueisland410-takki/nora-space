export function safeHttpUrl(input: string) {
  try {
    const url = new URL(input.trim());
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}

export function spotifyPlaylist(input: string | null | undefined) {
  if (!input) return null;
  try {
    const url = new URL(input.trim());
    const match = /^\/playlist\/([a-zA-Z0-9]{22})\/?$/.exec(url.pathname);
    if (url.protocol !== "https:" || url.hostname !== "open.spotify.com" || url.username || url.password || !match) return null;
    return {
      url: `https://open.spotify.com/playlist/${match[1]}`,
      embed: `https://open.spotify.com/embed/playlist/${match[1]}?utm_source=generator`,
    };
  } catch {
    return null;
  }
}
