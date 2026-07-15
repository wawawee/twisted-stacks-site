import React, { useMemo } from "react";
import type { HistoryData, TasklistData } from "./DetailPanel";
import "../ate/ate.css";

interface PhaseTask {
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

const ORBIT_NODES = [
  { id: "customers", label: "Kunder", slug: "use-cases", kind: "topic", angle: -90 },
  { id: "sensors", label: "Sensorer", slug: "sensors", kind: "topic", angle: -18 },
  { id: "demo", label: "Demo", slug: "ux-ui", kind: "topic", angle: 54 },
  { id: "progress", label: "Framsteg", slug: "progress-summary", kind: "hub", angle: 126 },
  { id: "team", label: "Idébox", slug: "ideabox", kind: "tool", angle: 198 },
] as const;

const PHASE_BLURBS: Record<string, string> = {
  "1": "Scouts · pitch deck · DD · research PDF",
  "2": "Demo film · Stockholm · intervjuer · LOI",
  "3": "iOS Pocket · hub · mesh · firmware",
  "4": "Backlog & senare scope",
  "5": "G1 gates · Tranche A",
};

function groupPhases(tasks: PhaseTask[]) {
  const map = new Map<string, { num: string; name: string; tasks: PhaseTask[] }>();
  for (const task of tasks) {
    if (task.priority === "gate") continue;
    const num = task.phaseNum || "?";
    if (!map.has(num)) {
      map.set(num, { num, name: task.phaseName || `Fas ${num}`, tasks: [] });
    }
    map.get(num)!.tasks.push(task);
  }
  return [...map.values()].sort((a, b) => Number(a.num) - Number(b.num));
}

function phaseStatus(phase: { tasks: PhaseTask[] }) {
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
  const tasks = tasklist.tasks as PhaseTask[];
  const phases = useMemo(() => groupPhases(tasks), [tasks]);
  const phase = tasklist.stats.phaseProgress;
  const activePct = phase?.activePhasePct ?? 0;
  const focusTasks = tasklist.focusTasks ?? tasks.filter((t) => t.priority === "P0" && !t.done);
  const visiblePhases = viewMode === "company" ? phases.filter((p) => Number(p.num) <= 3) : phases;
  const gateTasks = tasks.filter((t) => t.priority === "gate");
  const gatesDone = gateTasks.filter((t) => t.done).length;

  return (
    <div className="detail-panel overview-panel ate-overview">
      <header className="detail-panel-head">
        <h2>Översikt</h2>
      </header>

      <div className="detail-scroll overview-scroll">
        <p className="overview-lede ate-overview-lede">
          {viewMode === "company"
            ? "En plattform — flera vertikaler. Framsteg per fas — nya idéer i senare faser påverkar inte aktiv wedge-%."
            : "Live project map — TASKLIST, wiki och colab. Fas 2 = G1 investerarvägg (P0)."}
        </p>

        <div className="ate-overview-stats">
          <div className="ate-overview-stat ate-overview-stat-primary">
            <strong>{activePct}%</strong>
            <span>Fas {phase?.activePhaseNum ?? "?"}</span>
          </div>
          <div className="ate-overview-stat">
            <strong>
              {phase?.phasesComplete ?? 0}/{phase?.phasesTotal ?? 5}
            </strong>
            <span>faser levererade</span>
          </div>
          <div className="ate-overview-stat">
            <strong>
              {phase?.activePhaseDone ?? 0}/{phase?.activePhaseTotal ?? 0}
            </strong>
            <span>i aktiv fas</span>
          </div>
          <div className="ate-overview-stat">
            <strong>{tasklist.stats.p0Open}</strong>
            <span>P0 öppna</span>
          </div>
        </div>

        <p className="ate-overview-phase-note">
          Aktiv: Fas {phase?.activePhaseNum} — {phase?.activePhaseName}
          {viewMode === "company" ? " · tidigare faser räknas vid ≥50%" : ""}
        </p>

        <div className="overview-hero">
          <div className="overview-viz suparays-orbit-desktop">
            <div className="overview-viz-ring overview-viz-ring-outer" />
            <div className="overview-viz-ring overview-viz-ring-inner" />
            <div className="overview-viz-core" style={{ ["--pct" as string]: `${activePct}` }}>
              <span className="overview-viz-core-pct">{activePct}%</span>
              <span className="overview-viz-core-lbl">fas {phase?.activePhaseNum ?? "?"}</span>
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
        </div>

        <div className="suparays-mobile-quicknav" role="navigation" aria-label="Snabbnavigering">
          {ORBIT_NODES.map((node) => (
            <button
              key={node.id}
              type="button"
              className="suparays-mobile-quicknav-chip"
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

        <blockquote className="overview-focus ate-overview-focus">{tasklist.currentFocus}</blockquote>

        {tasklist.gates.length > 0 ? (
          <section className="ate-overview-section">
            <h3>Funding gates (G1)</h3>
            <ul className="overview-gates">
              {tasklist.gates.map((g) => (
                <li key={g.id} className={g.done ? "done" : ""}>
                  <span className="overview-gate-id">{g.id}</span>
                  <span className="overview-gate-req">{g.requirement}</span>
                  <span className="overview-gate-mark">{g.done ? "☑" : "☐"}</span>
                </li>
              ))}
            </ul>
            <p className="ate-overview-note mono">
              {gatesDone}/{gateTasks.length || tasklist.gates.length} gates klara
            </p>
          </section>
        ) : null}

        <section className="ate-overview-section">
          <h3>Fasplan</h3>
          <ol className="ate-phase-timeline">
            {visiblePhases.map((p) => {
              const status = phaseStatus(p);
              const done = p.tasks.filter((t) => t.done).length;
              const total = p.tasks.filter((t) => !t.deferred).length;
              const phasePct = total > 0 ? Math.round((done / total) * 100) : 0;
              return (
                <li key={p.num} className={`ate-phase-item status-${status}`}>
                  <div className="ate-phase-marker" aria-hidden />
                  <div className="ate-phase-body">
                    <div className="ate-phase-head">
                      <span className="ate-phase-num">F{p.num}</span>
                      <span className="ate-phase-name">{p.name}</span>
                      <span className="ate-phase-pct mono">{phasePct}%</span>
                    </div>
                    <p className="ate-phase-blurb">{PHASE_BLURBS[p.num] || p.name}</p>
                    <div className="ate-phase-bar" role="presentation">
                      <span style={{ width: `${phasePct}%` }} />
                    </div>
                    {viewMode === "dev" && status === "active" ? (
                      <ul className="ate-phase-next">
                        {p.tasks
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

        {focusTasks.length > 0 ? (
          <section className="ate-overview-section">
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
                  <span>
                    {t.title.slice(0, 42)}
                    {t.title.length > 42 ? "…" : ""}
                  </span>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {tasklist.recentWins && tasklist.recentWins.length > 0 && viewMode === "dev" ? (
          <section className="ate-overview-section">
            <h3>Senast klart</h3>
            <ul className="ate-status-list ate-status-list-compact">
              {tasklist.recentWins.map((item) => (
                <li key={item} className="done">
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {history.milestones.length > 0 ? (
          <section className="ate-overview-section">
            <h3>Milstolpar</h3>
            <div className="overview-stats">
              <div className="overview-stat">
                <strong>{history.milestones.length}</strong>
                <span>totalt</span>
              </div>
              <div className="overview-stat">
                <strong>{tasklist.stats.done}</strong>
                <span>tasks klara</span>
              </div>
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
