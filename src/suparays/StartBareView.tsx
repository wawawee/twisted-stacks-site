import React from "react";
import type { TasklistData } from "./DetailPanel";
import { START_PHASE_LABELS } from "./viewMode";

export type StartNavTarget = {
  id: string;
  label: string;
  slug: string | null;
  kind: string;
};

interface PhaseDef {
  num: string;
  label: string;
}

interface StartBareViewProps {
  tasklist: TasklistData | null;
  onNavigate: (item: StartNavTarget) => void;
}

const DEFAULT_PHASES: PhaseDef[] = [
  { num: "1", label: START_PHASE_LABELS["1"] },
  { num: "2", label: START_PHASE_LABELS["2"] },
  { num: "3", label: START_PHASE_LABELS["3"] },
];

/**
 * Investor-facing start view (BAHA / Start mode): whole project at a glance.
 * No T-IDs, P0, hub/WS jargon — only phase progress + soft launchers.
 */
export default function StartBareView({ tasklist, onNavigate }: StartBareViewProps) {
  const stats = tasklist?.stats;
  const pp = stats?.phaseProgress;

  const phases = DEFAULT_PHASES;
  const snaps = pp?.phaseSnapshots ?? [];
  const activeNum = Number(pp?.activePhaseNum ?? pp?.heroPhaseNum ?? "2");
  const humanActive =
    START_PHASE_LABELS[String(activeNum)] ??
    pp?.activePhaseName ??
    phases.find((p) => Number(p.num) === activeNum)?.label ??
    "Pågår";

  const tasksDone = stats?.done ?? 0;
  const tasksTotal = stats?.total ?? 0;
  const nextMilestone =
    tasklist?.nextActions?.find((a) => !a.done)?.text?.replace(/\s*[·•].*$/, "").slice(0, 48) ||
    "Demo & möte";

  const seg = 100 / phases.length;
  const ring = phases.map((p) => {
    const n = Number(p.num);
    const snap = snaps.find((s) => s.num === p.num);
    const pct = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          snap?.pct ??
            (n === activeNum ? (pp?.activePhasePct ?? 0) : n < activeNum ? (pp?.heroPhasePct ?? 0) : 0),
        ),
      ),
    );
    const tone =
      n === activeNum ? "active" : pct >= 55 ? "done" : pct > 0 ? "active" : "future";
    return { ...p, pct, tone, active: n === activeNum };
  });

  /** Center = samlat läge across the three tracks (not “0% demo” alone). */
  const overallPct = Math.round(ring.reduce((sum, p) => sum + p.pct, 0) / Math.max(ring.length, 1));

  const launchers: Array<{ item: StartNavTarget; hint: string }> = [
    {
      item: { id: "tasklist", label: "Framsteg", slug: "progress-summary", kind: "hub" },
      hint: "Var vi är",
    },
    {
      item: {
        id: "wiki-use-cases",
        label: "Vad det används till",
        slug: "use-cases",
        kind: "topic",
      },
      hint: "Nytta",
    },
    {
      item: { id: "chat", label: "Chat", slug: "chat", kind: "tool" },
      hint: "Prata",
    },
    {
      item: { id: "ideabox", label: "Idébox", slug: "ideabox", kind: "tool" },
      hint: "Idéer",
    },
  ];

  return (
    <div className="start-bare">
      <div className="start-bare-wash" aria-hidden />

      <header className="start-bare-head">
        <div className="start-bare-brand">
          <span className="start-bare-mark" aria-hidden>
            <span className="start-bare-mark-core" />
          </span>
          <div>
            <h1>SUPARAYS</h1>
            <p className="start-bare-tagline">Se det ögat missar — i telefonen och med sensorer</p>
          </div>
        </div>
        <span className="start-bare-badge">
          Fas {activeNum} av {phases.length}
        </span>
      </header>

      <p className="start-bare-lede">
        En enkel karta över var projektet står — läge, nästa steg och hur ni pratar med teamet.
      </p>

      <section className="start-bare-card" aria-label="Progress">
        <div className="start-bare-card-top">
          <span className="start-bare-card-title">
            <span className="start-bare-pulse" aria-hidden />
            Progress
          </span>
          <button
            type="button"
            className="start-bare-link"
            onClick={() =>
              onNavigate({
                id: "tasklist",
                label: "Framsteg",
                slug: "progress-summary",
                kind: "hub",
              })
            }
          >
            Mer framsteg →
          </button>
        </div>

        <div className="start-bare-progress-row">
          <div className="start-bare-donut" aria-hidden>
            <svg viewBox="0 0 42 42" className="start-bare-donut-svg">
              <circle
                cx="21"
                cy="21"
                r="15.915"
                fill="none"
                className="start-bare-donut-track"
                strokeWidth="4"
              />
              {ring.map((p, i) => {
                const filled = (seg * p.pct) / 100;
                return (
                  <circle
                    key={p.num}
                    cx="21"
                    cy="21"
                    r="15.915"
                    fill="none"
                    className={`start-bare-donut-seg start-bare-donut-seg-${p.tone}`}
                    strokeWidth={p.active ? 5.2 : 4}
                    strokeLinecap="butt"
                    strokeDasharray={`${filled} ${100 - filled}`}
                    strokeDashoffset={-(seg * i)}
                  />
                );
              })}
            </svg>
            <div className="start-bare-donut-label">
              <span className="start-bare-donut-kicker">Läge</span>
              <span className="start-bare-donut-pct">{overallPct}%</span>
              <span className="start-bare-donut-fas">3 spår</span>
            </div>
          </div>

          <ul className="start-bare-legend">
            {ring.map((p) => (
              <li key={p.num} className={p.active ? "is-active" : undefined}>
                <div className="start-bare-legend-row">
                  <span className="start-bare-legend-label">
                    <span className={`start-bare-swatch start-bare-swatch-${p.tone}`} />
                    Fas {p.num} · {p.label}
                  </span>
                  <span className="start-bare-legend-pct">{p.pct}%</span>
                </div>
                <div className="start-bare-bar">
                  <div
                    className={`start-bare-bar-fill start-bare-bar-fill-${p.tone}`}
                    style={{ width: `${p.pct}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="start-bare-kpis">
          <div className="start-bare-kpi">
            <span className="start-bare-kpi-lbl">Aktiv fas</span>
            <span className="start-bare-kpi-val">{humanActive}</span>
          </div>
          <div className="start-bare-kpi">
            <span className="start-bare-kpi-lbl">Klart</span>
            <span className="start-bare-kpi-val">
              {tasksTotal > 0 ? `${tasksDone}/${tasksTotal}` : "—"}
            </span>
          </div>
          <div className="start-bare-kpi">
            <span className="start-bare-kpi-lbl">Nästa</span>
            <span className="start-bare-kpi-val start-bare-kpi-accent">{nextMilestone}</span>
          </div>
        </div>
      </section>

      <section className="start-bare-launchers" aria-label="Utforska">
        <div className="start-bare-launchers-label">Utforska rummet</div>
        <div className="start-bare-launcher-grid">
          {launchers.map(({ item, hint }) => (
            <button
              key={item.id}
              type="button"
              className="start-bare-launcher"
              onClick={() => onNavigate(item)}
            >
              <span className="start-bare-launcher-hint">{hint}</span>
              <span className="start-bare-launcher-label">
                {item.label}
                <span aria-hidden>→</span>
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
