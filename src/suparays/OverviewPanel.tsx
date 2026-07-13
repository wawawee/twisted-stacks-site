import React from "react";
import type { HistoryData, TasklistData } from "./DetailPanel";

interface OverviewPanelProps {
  tasklist: TasklistData;
  history: HistoryData;
  syncedAt: string | null;
  viewMode: "dev" | "company";
  onNavigate: (item: { id: string; label: string; slug: string | null; kind: string; taskId?: string }) => void;
}

const ORBIT_NODES = [
  { id: "customers", label: "Kunder", slug: "use-cases", kind: "topic", angle: -90 },
  { id: "sensors", label: "Sensorer", slug: "sensors", kind: "topic", angle: -18 },
  { id: "demo", label: "Demo", slug: "ux-ui", kind: "topic", angle: 54 },
  { id: "progress", label: "Framsteg", slug: "progress-summary", kind: "hub", angle: 126 },
  { id: "team", label: "Idébox", slug: "ideabox", kind: "tool", angle: 198 },
] as const;

export default function OverviewPanel({
  tasklist,
  history,
  syncedAt,
  viewMode,
  onNavigate,
}: OverviewPanelProps) {
  const pct = Math.round((tasklist.stats.done / Math.max(tasklist.stats.total, 1)) * 100);
  const focusTasks = tasklist.focusTasks ?? tasklist.tasks.filter((t) => t.priority === "P0" && !t.done);

  return (
    <div className="detail-panel overview-panel">
      <header className="detail-panel-head">
        <h2>Översikt</h2>
      </header>

      <div className="detail-scroll overview-scroll">
        <p className="overview-lede">
          {viewMode === "company"
            ? "En plattform — flera vertikaler. Telefon idag, mesh-moduler med kapital."
            : "Live project map — TASKLIST, wiki och colab i samma rum."}
        </p>

        <div className="overview-hero">
          <div className="overview-viz">
            <div className="overview-viz-ring overview-viz-ring-outer" />
            <div className="overview-viz-ring overview-viz-ring-inner" />
            <div
              className="overview-viz-core"
              style={{ ["--pct" as string]: `${pct}` }}
            >
              <span className="overview-viz-core-pct">{pct}%</span>
              <span className="overview-viz-core-lbl">klart</span>
            </div>
            {ORBIT_NODES.map((node) => (
              <button
                key={node.id}
                type="button"
                className="overview-orbit-node"
                style={{ ["--angle" as string]: `${node.angle}deg` }}
                onClick={() =>
                  onNavigate({
                    id: node.id,
                    label: node.label,
                    slug: node.slug,
                    kind: node.kind,
                  })
                }
              >
                {node.label}
              </button>
            ))}
          </div>

          <div className="overview-stats">
            <div className="overview-stat">
              <strong>{tasklist.stats.done}/{tasklist.stats.total}</strong>
              <span>Tasks</span>
            </div>
            <div className="overview-stat">
              <strong>{tasklist.stats.p0Open}</strong>
              <span>P0 öppna</span>
            </div>
            <div className="overview-stat">
              <strong>{history.milestones.length}</strong>
              <span>Milstolpar</span>
            </div>
          </div>
        </div>

        <blockquote className="overview-focus">{tasklist.currentFocus}</blockquote>

        {tasklist.gates.length > 0 ? (
          <section className="overview-section">
            <h3>Funding gates</h3>
            <ul className="overview-gates">
              {tasklist.gates.map((g) => (
                <li key={g.id} className={g.done ? "done" : ""}>
                  <span className="overview-gate-id">{g.id}</span>
                  <span className="overview-gate-req">{g.requirement}</span>
                  <span className="overview-gate-mark">{g.done ? "☑" : "☐"}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {focusTasks.length > 0 ? (
          <section className="overview-section">
            <h3>Fokus-kö</h3>
            <div className="overview-queue">
              {focusTasks.slice(0, 6).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`overview-queue-chip${t.done ? " done" : ""}`}
                  onClick={() =>
                    onNavigate({
                      id: t.id,
                      label: t.id,
                      slug: `task-${t.id}`,
                      kind: "task-p0",
                      taskId: t.id,
                    })
                  }
                >
                  <code>{t.id}</code>
                  <span>{t.title.slice(0, 42)}{t.title.length > 42 ? "…" : ""}</span>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {syncedAt ? (
          <p className="overview-sync mono">Synkad {new Date(syncedAt).toLocaleString("sv-SE")}</p>
        ) : null}
      </div>
    </div>
  );
}
