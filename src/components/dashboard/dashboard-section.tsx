import type { ReactNode } from "react";

export function DashboardSection({ id, kicker, title, description, children }: { id: string; kicker: string; title: string; description?: string; children: ReactNode }) {
  return <section className="dashboard-section" aria-labelledby={id}>
    <div className="dashboard-section-heading">
      <div><p className="dashboard-section-kicker">{kicker}</p><h2 id={id}>{title}</h2>{description && <p>{description}</p>}</div>
    </div>
    {children}
  </section>;
}
