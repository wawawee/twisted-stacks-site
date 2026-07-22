import React, { useMemo } from "react";
import type { HistoryData, TasklistData } from "./DetailPanel";
import "../ate/ate.css";

interface OverviewPanelProps {
  tasklist: TasklistData;
  history: HistoryData;
  syncedAt: string | null;
  viewMode: "dev" | "company";
  onNavigate: (item: {
    id: string;
    label: string;
    slug: string | null;
    kind: string;
    taskId?: string;
  }) => void;
}

const ORBIT_NODES = [
  { id: "sessions", label: "Sessions", slug: "sessions-signup", kind: "tool", angle: -90 },
  { id: "blender", label: "Blender", slug: "blender", kind: "topic", angle: -18 },
  { id: "unity", label: "Unity", slug: "unity", kind: "topic", angle: 54 },
  { id: "commons", label: "Commons", slug: "commons", kind: "topic", angle: 126 },
  { id: "ideas", label: "Idébox", slug: "ideabox", kind: "tool", angle: 198 },
] as const;

export default function OverviewPanel({
  tasklist,
  history,
  syncedAt,
  viewMode,
  onNavigate,
}: OverviewPanelProps) {
  const focusTasks = useMemo(
    () => tasklist.focusTasks ?? tasklist.tasks.filter((t) => t.priority === "P0" && !t.done),
    [tasklist],
  );
  const milestones = history.milestones?.slice(0, 4) ?? [];

  return (
    <div className="detail-panel overview-panel ate-overview">
      <header className="detail-panel-head">
        <h2>Översikt</h2>
      </header>

      <div className="detail-scroll overview-scroll">
        <section className="suparays-demo-cta">
          <div className="suparays-demo-cta-copy">
            <h3>SPACEinSPACE — create together</h3>
            <p>
              Multi-agent substrate där människor och agenter delar territory: Blender-världar, Unity
              / Godot-scener och Commons-avatarer. Colab-rummet är porten — sessioner öppnar i
              etapper.
            </p>
            <p className="suparays-demo-cta-meta mono">
              Status: collab room live · live Blender co-edit = Spår B
              {syncedAt ? ` · synced ${new Date(syncedAt).toLocaleDateString("sv-SE")}` : ""}
            </p>
          </div>
          <button
            type="button"
            className="suparays-demo-cta-btn"
            onClick={() =>
              onNavigate({
                id: "sessions",
                label: "Sessions",
                slug: "sessions-signup",
                kind: "tool",
              })
            }
          >
            Anmäl session
          </button>
        </section>

        <section className="overview-orbit" aria-label="SPACE map">
          <div className="overview-orbit-ring">
            {ORBIT_NODES.map((node) => (
              <button
                key={node.id}
                type="button"
                className="overview-orbit-node"
                style={{
                  ["--orbit-angle" as string]: `${node.angle}deg`,
                }}
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
            <div className="overview-orbit-core">SPACE</div>
          </div>
        </section>

        <section className="overview-focus-block">
          <h3>Nuvarande fokus</h3>
          <p>{tasklist.currentFocus || "Persistent Blender + session signup"}</p>
          {viewMode === "dev" && focusTasks.length > 0 ? (
            <ul>
              {focusTasks.slice(0, 5).map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    className="overview-linkish"
                    onClick={() =>
                      onNavigate({
                        id: t.id,
                        label: t.title,
                        slug: `task-${t.id}`,
                        kind: "task",
                        taskId: t.id,
                      })
                    }
                  >
                    {t.title}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        {milestones.length > 0 ? (
          <section className="overview-focus-block">
            <h3>Milstolpar</h3>
            <ul>
              {milestones.map((m, i) => (
                <li key={i}>
                  <span className="mono">{m.date || ""}</span> {m.milestone || ""}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
