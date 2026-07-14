import React, { useMemo } from "react";
import type { HistoryData, TasklistData } from "../suparays/DetailPanel";

interface AteTask {
  id: string;
  title: string;
  done: boolean;
  inProgress?: boolean;
  deferred?: boolean;
  phaseNum?: string;
  phaseName?: string;
  priority: string;
}

interface OverviewPanelProps {
  tasklist: TasklistData;
  history: HistoryData;
  syncedAt: string | null;
  viewMode: "dev" | "company";
  onNavigate: (item: { id: string; label: string; slug: string | null; kind: string; taskId?: string }) => void;
}

const PHASE_BLURBS: Record<string, string> = {
  "0": "Schemas, CI, colab — mostly done",
  "1": "C&H · chart_patterns · backtests ✓",
  "2": "Vision dataset · YOLO train ← **active**",
  "3": "Fusion · RegimeGate · Macro ✓ stubs",
  "4": "Agent swarm · memory",
  "5": "Temporal · MCP · HITL wire-up",
  "6": "TRADE UI · React Flow map",
  "7": "Multi-strategy consensus",
  "8": "Live gates · compliance",
};

function groupPhases(tasks: AteTask[]) {
  const map = new Map<string, { num: string; name: string; tasks: AteTask[] }>();
  for (const task of tasks) {
    const num = task.phaseNum || "?";
    if (!map.has(num)) {
      map.set(num, { num, name: task.phaseName || `Phase ${num}`, tasks: [] });
    }
    map.get(num)!.tasks.push(task);
  }
  return [...map.values()].sort((a, b) => Number(a.num) - Number(b.num));
}

function phaseStatus(phase: { tasks: AteTask[] }) {
  const active = phase.tasks.some((t) => t.inProgress);
  const open = phase.tasks.filter((t) => !t.done && !t.deferred);
  const done = phase.tasks.filter((t) => t.done).length;
  if (open.length === 0 && done > 0) return "done";
  if (active || (done > 0 && open.length > 0)) return "active";
  if (open.length > 0) return "planned";
  return "planned";
}

export default function OverviewPanel({
  tasklist,
  history,
  syncedAt,
  viewMode,
  onNavigate,
}: OverviewPanelProps) {
  const tasks = tasklist.tasks as AteTask[];
  const phases = useMemo(() => groupPhases(tasks), [tasks]);
  const pct = Math.round((tasklist.stats.done / Math.max(tasklist.stats.total, 1)) * 100);
  const focusTasks = tasklist.focusTasks ?? tasks.filter((t) => t.priority === "P0" && !t.done && !t.deferred);
  const visiblePhases = viewMode === "company" ? phases.filter((p) => Number(p.num) <= 4) : phases;

  return (
    <div className="detail-panel overview-panel ate-overview">
      <header className="detail-panel-head">
        <h2>Översikt</h2>
      </header>

      <div className="detail-scroll overview-scroll">
        <p className="overview-lede ate-overview-lede">
          {viewMode === "company"
            ? "TRADE live på /ate — SPY/BTC, RegimeGate, live Polymarket, fusion. Paper only. Phase 2: vision training."
            : "Fasplan från TASKLIST — Phase 2 vision training är aktivt fokus."}
        </p>

        <div className="ate-overview-stats">
          <div className="ate-overview-stat">
            <strong>{pct}%</strong>
            <span>klart</span>
          </div>
          <div className="ate-overview-stat">
            <strong>
              {tasklist.stats.done}/{tasklist.stats.total}
            </strong>
            <span>tasks</span>
          </div>
          <div className="ate-overview-stat">
            <strong>{tasklist.stats.p0Open}</strong>
            <span>P0 öppna</span>
          </div>
          <div className="ate-overview-stat ate-overview-stat-mode">
            <strong>PAPER</strong>
            <span>läge</span>
          </div>
        </div>

        <blockquote className="overview-focus ate-overview-focus">{tasklist.currentFocus}</blockquote>

        <section className="ate-overview-section">
          <h3>Fasplan</h3>
          <ol className="ate-phase-timeline">
            {visiblePhases.map((phase) => {
              const status = phaseStatus(phase);
              const done = phase.tasks.filter((t) => t.done).length;
              const total = phase.tasks.filter((t) => !t.deferred).length;
              const phasePct = total > 0 ? Math.round((done / total) * 100) : 0;
              return (
                <li key={phase.num} className={`ate-phase-item status-${status}`}>
                  <div className="ate-phase-marker" aria-hidden />
                  <div className="ate-phase-body">
                    <div className="ate-phase-head">
                      <span className="ate-phase-num">P{phase.num}</span>
                      <span className="ate-phase-name">{phase.name}</span>
                      <span className="ate-phase-pct mono">{phasePct}%</span>
                    </div>
                    <p className="ate-phase-blurb">{PHASE_BLURBS[phase.num] || phase.name}</p>
                    <div className="ate-phase-bar" role="presentation">
                      <span style={{ width: `${phasePct}%` }} />
                    </div>
                    {viewMode === "dev" && status === "active" ? (
                      <ul className="ate-phase-next">
                        {phase.tasks
                          .filter((t) => !t.done && !t.deferred)
                          .slice(0, 3)
                          .map((t) => (
                            <li key={t.id}>
                              <button
                                type="button"
                                className="ate-phase-task-link"
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
                                <code>{t.id}</code> {t.title.slice(0, 56)}
                                {t.title.length > 56 ? "…" : ""}
                              </button>
                            </li>
                          ))}
                      </ul>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
          {viewMode === "company" && phases.length > visiblePhases.length ? (
            <button
              type="button"
              className="ate-overview-more"
              onClick={() =>
                onNavigate({
                  id: "tasklist",
                  label: "TASKLIST",
                  slug: "progress-summary",
                  kind: "hub",
                })
              }
            >
              Visa alla faser i Framsteg →
            </button>
          ) : null}
        </section>

        {history.milestones.length > 0 ? (
          <section className="ate-overview-section">
            <h3>Tidslinje</h3>
            <ul className="ate-milestone-timeline">
              {history.milestones.slice(0, viewMode === "company" ? 5 : 8).map((m) => (
                <li key={`${m.date}-${m.milestone}`}>
                  <time className="mono">{m.date}</time>
                  <div>
                    <strong>{m.milestone}</strong>
                    {m.evidence && viewMode === "dev" ? (
                      <span className="ate-milestone-evidence">{m.evidence}</span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="ate-overview-more"
              onClick={() =>
                onNavigate({ id: "history", label: "Historik", slug: "history", kind: "hub" })
              }
            >
              Full historik →
            </button>
          </section>
        ) : null}

        {focusTasks.length > 0 ? (
          <section className="ate-overview-section">
            <h3>Nästa i kö</h3>
            <div className="overview-queue">
              {focusTasks.slice(0, viewMode === "company" ? 4 : 6).map((t) => (
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
                  {viewMode === "dev" ? <code>{t.id}</code> : null}
                  <span>{t.title.slice(0, 48)}{t.title.length > 48 ? "…" : ""}</span>
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
