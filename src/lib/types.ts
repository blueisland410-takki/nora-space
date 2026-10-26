export type Task = {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  status: "todo" | "done";
  priority: "low" | "medium" | "high";
  due_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Idea = {
  id: string;
  owner_id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
  updated_at: string;
};

export type Bookmark = {
  id: string;
  owner_id: string;
  title: string;
  url: string;
  category: string;
  cover_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Preferences = {
  owner_id: string;
  spotify_playlist_url: string | null;
  timezone: string;
  theme: "light" | "dark";
  updated_at: string;
};

export const defaultPreferences = {
  spotify_playlist_url: null,
  timezone: "Asia/Seoul",
  theme: "light" as const,
};
