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
  "0": "Schemas, CI, colab ✓",
  "1": "C&H · backtests · TRADE colab ✓",
  "2": "376/165 dataset · YOLO ✓ · ONNX ✓",
  "3": "Fusion · RegimeGate · Macro live",
  "4": "Pydantic AI scouts — **next**",
  "5": "Temporal · MCP · HITL wire-up",
  "6": "TRADE lanes · HITL stub · Flow map",
  "7": "Multi-strategy consensus",
  "8": "Live gates · compliance",
};

const LIVE_NOW = [
  "TRADE chart — SPY/BTC scan med RegimeGate",
  "Fusion 4 lanes (amber / purple / green / blue macro)",
  "Live Polymarket i Macro Scout",
  "VectorBT backtests + QuantStats tear sheets",
  "Vision dataset 376 pos / 165 neg (`ate_v1`)",
  "Vision YOLO classify — 50 ep, val top1 100%, ONNX exported",
  "Vision ONNX Temporal activity — cache `~/ate-data/cache/vision/`",
  "hybrid-scan export (JSON/CSV + regime–macro)",
  "Nightly batch — launchd 06:00 + GH Actions Mon 05:00 UTC",
  "HITL approve/reject → Temporal proxy när konfigurerad",
  "Alt-data stubs (null tills go/no-go)",
];

const REAL_EDGE_TRACK = [
  "1.1 Funding rate → RegimeGate — NO-GO (8.6% hit, 0.42× lift)",
  "1.2 Exchange netflow → OnChainSignal — pending CryptoQuant key",
  "1.3 DXY–crypto cross-market — NO-GO (47% same-day, 0.93× lift)",
  "1.4 Polymarket prob shifts → Macro Scout — NO-GO (41% BTC 1d, 0.91× lift)",
];

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
  const phase = tasklist.stats.phaseProgress;
  const focusTasks = tasklist.focusTasks ?? tasks.filter((t) => t.priority === "P0" && !t.done && !t.deferred);
  const visiblePhases = viewMode === "company" ? phases.filter((p) => Number(p.num) <= 4) : phases;

  const inProgress = (tasklist.nextActions ?? []).filter((a) => a.inProgress && !a.done);
  const upNext = (tasklist.nextActions ?? []).filter((a) => !a.done && !a.inProgress);
  const recentWins = tasklist.recentWins?.length ? tasklist.recentWins : [];

  return (
    <div className="detail-panel overview-panel ate-overview">
      <header className="detail-panel-head">
        <h2>Översikt</h2>
      </header>

      <div className="detail-scroll overview-scroll">
        <p className="overview-lede ate-overview-lede">
          {viewMode === "company"
            ? "TRADE live på /ate — chart, RegimeGate, 4 fusion lanes, Polymarket macro. Paper only. Phase 2 YOLO + ONNX klart; nightly automation; Real Edge 1.1/1.3/1.4 NO-GO."
            : "Fasplan från TASKLIST — Phase 2 vision done; nightly batch + HITL proxy; Real Edge 1.1/1.3/1.4 NO-GO."}
        </p>

        <div className="ate-overview-stats">
          <div className="ate-overview-stat ate-overview-stat-primary">
            <strong>{phase?.activePhasePct ?? 0}%</strong>
            <span>Fas {phase?.activePhaseNum ?? "?"}</span>
          </div>
          <div className="ate-overview-stat">
            <strong>
              {phase?.phasesComplete ?? 0}/{phase?.phasesTotal ?? 9}
            </strong>
            <span>faser levererade</span>
          </div>
          <div className="ate-overview-stat">
            <strong>
              {phase?.activePhaseDone ?? 0}/{phase?.activePhaseTotal ?? 0}
            </strong>
            <span>i aktiv fas</span>
          </div>
          <div className="ate-overview-stat ate-overview-stat-mode">
            <strong>PAPER</strong>
            <span>läge</span>
          </div>
        </div>
          <p className="ate-overview-phase-note">
            Aktiv: Phase {phase?.activePhaseNum} — {phase?.activePhaseName}
            {viewMode === "company" ? " · tidigare faser räknas vid ≥50%" : ""}
          </p>

        <blockquote className="overview-focus ate-overview-focus">{tasklist.currentFocus}</blockquote>

        <section className="ate-overview-section">
          <h3>Live nu</h3>
          <ul className="ate-status-list">
            {LIVE_NOW.map((item) => (
              <li key={item} className="done">
                {item}
              </li>
            ))}
          </ul>
        </section>

        {inProgress.length > 0 || upNext.length > 0 ? (
          <section className="ate-overview-section">
            <h3>På gång &amp; nästa</h3>
            <ul className="ate-status-list">
              {inProgress.map((a) => (
                <li key={a.text} className="active">
                  {a.text}
                </li>
              ))}
              {upNext.slice(0, viewMode === "company" ? 4 : 6).map((a) => (
                <li key={a.text}>{a.text}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="ate-overview-section">
          <h3>Vägen framåt — Real Edge</h3>
          <p className="ate-overview-note">
            Validera alt-data-hypoteser innan null-provider swap. Research och build går parallellt.
          </p>
          <ul className="ate-status-list ate-status-list-compact">
            {REAL_EDGE_TRACK.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <button
            type="button"
            className="ate-overview-more"
            onClick={() =>
              onNavigate({ id: "wiki-real-edge", label: "Real Edge", slug: "real-edge", kind: "topic" })
            }
          >
            Läs Real Edge wiki →
          </button>
        </section>

        {recentWins.length > 0 && viewMode === "dev" ? (
          <section className="ate-overview-section">
            <h3>Klart denna sprint</h3>
            <ul className="ate-status-list ate-status-list-compact">
              {recentWins.map((item) => (
                <li key={item} className="done">
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

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
              {history.milestones.slice(0, viewMode === "company" ? 6 : 8).map((m) => (
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

        {focusTasks.length > 0 && viewMode === "dev" ? (
          <section className="ate-overview-section">
            <h3>Phase 0–1 kö</h3>
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
                    {t.title.slice(0, 48)}
                    {t.title.length > 48 ? "…" : ""}
                  </span>
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
