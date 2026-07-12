import React from "react";
import type { GridSection } from "./viewMode";

interface ProjectGridProps {
  sections: GridSection[];
  activeId: string | null;
  stats: { total: number; done: number; p0Open: number; p1Open: number };
  onSelect: (item: GridSection["items"][0]) => void;
}

export default function ProjectGrid({ sections, activeId, stats, onSelect }: ProjectGridProps) {
  return (
    <div className="room-grid">
      <div className="room-grid-stats">
        <div className="stat-chip">
          <span className="stat-val">{stats.done}/{stats.total}</span>
          <span className="stat-lbl">TASKS</span>
        </div>
        <div className="stat-chip">
          <span className="stat-val">{stats.p0Open}</span>
          <span className="stat-lbl">P0 ÖPPNA</span>
        </div>
        <div className="stat-chip">
          <span className="stat-val">{Math.round((stats.done / Math.max(stats.total, 1)) * 100)}%</span>
          <span className="stat-lbl">KLART</span>
        </div>
      </div>

      {sections.map((section) => (
        <section key={section.id} className="room-grid-section">
          <h2 className="room-grid-title">{section.title}</h2>
          <div className="room-card-grid">
            {section.items.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`room-card kind-${item.kind}${activeId === item.id ? " active" : ""}`}
                onClick={() => onSelect(item)}
              >
                <strong>{item.label}</strong>
                {item.sublabel ? <span>{item.sublabel}</span> : null}
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
