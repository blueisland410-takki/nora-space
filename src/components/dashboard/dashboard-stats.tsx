import { Check, CheckSquare, FolderHeart, Lightbulb } from "lucide-react";
import { Card } from "@/components/ui/card";

export function DashboardStats({ today, completed, ideas, bookmarks }: { today: number; completed: number; ideas: number; bookmarks: number }) {
  const stats = [
    { label: "今日待办", value: today, unit: "项任务", icon: CheckSquare, tone: "lavender" },
    { label: "本周已完成", value: completed, unit: "项任务", icon: Check, tone: "peach" },
    { label: "灵感记录", value: ideas, unit: "条灵感", icon: Lightbulb, tone: "blue" },
    { label: "资源收藏", value: bookmarks, unit: "个网站", icon: FolderHeart, tone: "mint" },
  ] as const;

  return <div className="dashboard-stats">
    {stats.map(({ label, value, unit, icon: Icon, tone }) => <Card className={`stat-card stat-${tone}`} key={label}>
      <div className="stat-topline"><span className="stat-icon"><Icon size={19} strokeWidth={1.8} /></span><span className="stat-accent" /></div>
      <div className="stat-label">{label}</div>
      <div className="stat-number">{value}<small>{unit}</small></div>
    </Card>)}
  </div>;
}
