import React from "react";
import type { GridSection } from "./viewMode";

interface ProjectGridProps {
  sections: GridSection[];
  activeId: string | null;
  stats: {
    total: number;
    done: number;
    p0Open: number;
    p1Open: number;
    phaseProgress?: {
      activePhasePct: number;
      activePhaseNum: string;
      activePhaseDone: number;
      activePhaseTotal: number;
      phasesComplete: number;
      phasesTotal: number;
    };
  };
  onSelect: (item: GridSection["items"][0]) => void;
  showStats?: boolean;
}

export default function ProjectGrid({ sections, activeId, stats, onSelect, showStats = true }: ProjectGridProps) {
  const phase = stats.phaseProgress;
  return (
    <div className="room-grid">
      {showStats ? (
        <div className="room-grid-stats">
        <div className="stat-chip">
          <span className="stat-val">{phase?.activePhasePct ?? Math.round((stats.done / Math.max(stats.total, 1)) * 100)}%</span>
          <span className="stat-lbl">FAS {phase?.activePhaseNum ?? "?"}</span>
        </div>
        <div className="stat-chip">
          <span className="stat-val">{phase?.phasesComplete ?? 0}/{phase?.phasesTotal ?? 9}</span>
          <span className="stat-lbl">FASER KLARA</span>
        </div>
        <div className="stat-chip">
          <span className="stat-val">{phase?.activePhaseDone ?? stats.done}/{phase?.activePhaseTotal ?? stats.total}</span>
          <span className="stat-lbl">AKTIV FAS</span>
        </div>
      </div>
      ) : null}

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
