import { BookmarkManager } from "@/components/resources/bookmark-manager";
import { loadBookmarks } from "@/lib/data";

export default async function ResourcesPage() {
  return <BookmarkManager bookmarks={await loadBookmarks()} />;
}
