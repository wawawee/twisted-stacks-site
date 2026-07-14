import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Task {
  id: string;
  title: string;
  owner: string;
  done: boolean;
  priority: string;
  notes: string;
}

interface TasklistData {
  currentFocus: string;
  nextActions?: Array<{ text: string; done: boolean; inProgress?: boolean }>;
  recentWins?: string[];
  focusQueue?: string[];
  focusTasks?: Task[];
  lastUpdated: string | null;
  tasks: Task[];
  gates: Array<{ id: string; requirement: string; done: boolean }>;
  activity: Array<{ date: string; agent: string; taskId: string | null; action: string }>;
  completed: Array<{ id: string | null; task: string; completed: string; by: string }>;
  stats: { total: number; done: number; p0Open: number; p1Open: number };
}

interface HistoryData {
  eras: Array<{ title: string; bullets: string[] }>;
  milestones: Array<{ date: string; milestone: string; evidence: string }>;
}

interface DetailPanelProps {
  selection: { kind: string; slug: string | null; taskId?: string; label: string } | null;
  markdown: string;
  loading: boolean;
  tasklist: TasklistData | null;
  history: HistoryData | null;
  onClose: () => void;
}

function TaskTable({ tasks, filter }: { tasks: Task[]; filter?: string }) {
  const rows = filter ? tasks.filter((t) => t.priority === filter) : tasks;
  return (
    <table className="task-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Task</th>
          <th>Owner</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {rows.map((t) => (
          <tr key={t.id} className={t.done ? "done" : ""}>
            <td>{t.id}</td>
            <td>{t.title}</td>
            <td>{t.owner}</td>
            <td>{t.done ? "☑" : "☐"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function DetailPanel({
  selection,
  markdown,
  loading,
  tasklist,
  history,
  onClose,
}: DetailPanelProps) {
  if (!selection) {
    return (
      <div className="detail-panel detail-panel-empty">
        <p>Välj ett avsnitt i menyn eller klicka ett kort i översikten.</p>
      </div>
    );
  }

  const slug = selection.slug || "";

  return (
    <div className="detail-panel">
      <header className="detail-panel-head">
        <h2>{selection.label}</h2>
        <button type="button" className="room-btn" onClick={onClose}>
          Stäng
        </button>
      </header>

      {loading ? <p className="suparays-loading">Laddar…</p> : null}

      {!loading && slug === "progress-summary" && tasklist && history ? (
        <div className="detail-scroll">
          <div className="progress-bar-wrap">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${Math.round((tasklist.stats.done / Math.max(tasklist.stats.total, 1)) * 100)}%` }}
              />
            </div>
            <span className="progress-pct mono">
              {tasklist.stats.done}/{tasklist.stats.total} tasks · {tasklist.stats.p0Open} P0 öppna
            </span>
          </div>
          <h3>Funding gates</h3>
          <ul className="gate-list">
            {tasklist.gates.map((g) => (
              <li key={g.id} className={g.done ? "done" : ""}>
                <strong>{g.id}</strong> {g.requirement} {g.done ? "☑" : "☐"}
              </li>
            ))}
          </ul>
          <h3>Senast klart</h3>
          <ul className="completed-list">
            {(tasklist.recentWins?.length ? tasklist.recentWins : tasklist.completed.slice(0, 8).map((c) => c.task)).map(
              (item, i) => (
                <li key={`${item}-${i}`}>{item}</li>
              ),
            )}
          </ul>
          {tasklist.nextActions?.some((a) => !a.done) ? (
            <>
              <h3>Nästa steg</h3>
              <ul className="ate-status-list">
                {tasklist.nextActions
                  .filter((a) => !a.done)
                  .map((a) => (
                    <li key={a.text} className={a.inProgress ? "active" : ""}>
                      {a.text}
                    </li>
                  ))}
              </ul>
            </>
          ) : null}
          <h3>Milstolpar</h3>
          <ul className="milestone-list">
            {history.milestones.slice(-6).reverse().map((m) => (
              <li key={`${m.date}-${m.milestone}`}>
                <time>{m.date}</time> {m.milestone}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {!loading && slug === "tasklist" && tasklist ? (
        <div className="detail-scroll">
          <p className="detail-meta">Uppdaterad: {tasklist.lastUpdated || "—"}</p>
          <h3>P0 — blockers</h3>
          <TaskTable tasks={tasklist.tasks} filter="P0" />
          <h3>P1 — sprint</h3>
          <TaskTable tasks={tasklist.tasks} filter="P1" />
          <h3>P2 — produkt/tech</h3>
          <TaskTable tasks={tasklist.tasks} filter="P2" />
          <h3>Funding gates (G1)</h3>
          <ul className="gate-list">
            {tasklist.gates.map((g) => (
              <li key={g.id} className={g.done ? "done" : ""}>
                <strong>{g.id}</strong> {g.requirement} {g.done ? "☑" : "☐"}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {!loading && slug === "tasklist-focus" && tasklist ? (
        <div className="detail-scroll">
          <blockquote className="focus-quote">{tasklist.currentFocus}</blockquote>
          <h3>
            Prioriterad kö (
            {(tasklist.focusTasks ?? tasklist.tasks.filter((t) => t.priority === "P0" && !t.done)).length})
          </h3>
          <TaskTable
            tasks={
              tasklist.focusTasks ??
              tasklist.tasks.filter((t) => t.priority === "P0" && !t.done)
            }
          />
        </div>
      ) : null}

      {!loading && slug === "activity" && tasklist ? (
        <ul className="activity-list">
          {tasklist.activity.map((a, i) => (
            <li key={`${a.date}-${i}`}>
              <time>{a.date}</time>
              <strong>{a.agent}</strong>
              {a.taskId ? <code>{a.taskId}</code> : null}
              <span>{a.action}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {!loading && slug === "history" && history ? (
        <div className="detail-scroll">
          {history.eras.map((era) => (
            <section key={era.title}>
              <h3>{era.title}</h3>
              <ul>
                {era.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </section>
          ))}
          <h3>Milstolpar</h3>
          <table className="task-table">
            <thead>
              <tr>
                <th>Datum</th>
                <th>Händelse</th>
              </tr>
            </thead>
            <tbody>
              {history.milestones.map((m) => (
                <tr key={`${m.date}-${m.milestone}`}>
                  <td>{m.date}</td>
                  <td>{m.milestone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {!loading && slug.startsWith("task-") && tasklist ? (
        <div className="detail-scroll">
          {(() => {
            const id = selection.taskId || slug.replace("task-", "");
            const task = tasklist.tasks.find((t) => t.id === id);
            if (!task) return <p>Uppgift hittades inte.</p>;
            return (
              <>
                <p className="detail-meta">
                  {task.priority} · {task.owner} · {task.done ? "Klar ☑" : "Öppen ☐"}
                </p>
                <h3>{task.title}</h3>
                {task.notes ? <p>{task.notes}</p> : null}
              </>
            );
          })()}
        </div>
      ) : null}

      {!loading && markdown && !slug.startsWith("task") && !["tasklist", "tasklist-focus", "activity", "history"].includes(slug) ? (
        <div className="suparays-wiki-content detail-scroll">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
        </div>
      ) : null}
    </div>
  );
}

export type { TasklistData, HistoryData };
