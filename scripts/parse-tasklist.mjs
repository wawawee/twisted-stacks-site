/**
 * Parse TASKLIST.md into structured JSON for the project map UI.
 */

function stripMd(text) {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*/g, "")
    .trim();
}

function parseTableRows(section, predicate) {
  const rows = [];
  for (const line of section.split("\n")) {
    if (!line.startsWith("|") || line.includes("---")) continue;
    const cols = line
      .split("|")
      .map((c) => c.trim())
      .filter((_, i, arr) => i > 0 && i < arr.length - 1);
    if (cols.length < 2) continue;
    if (predicate && !predicate(cols)) continue;
    rows.push(cols);
  }
  return rows;
}

function priorityFromHeading(heading) {
  if (/P0/i.test(heading)) return "P0";
  if (/P1/i.test(heading)) return "P1";
  if (/P2/i.test(heading)) return "P2";
  if (/backlog/i.test(heading)) return "backlog";
  return "other";
}

export function parseTasklist(md) {
  const lastUpdated = md.match(/\*\*Last updated:\*\*\s*(.+)/)?.[1]?.trim() || null;
  const focusBlock = md.match(/## Current focus[^]*?\n>\s*\*\*([^*]+)\*\*/);
  const currentFocus = focusBlock?.[1]?.trim() || "";

  const tasks = [];
  const sectionParts = md.split(/^### /m).slice(1);
  for (const part of sectionParts) {
    const heading = part.split("\n")[0] || "";
    const priority = priorityFromHeading(heading);
    if (!["P0", "P1", "P2", "backlog"].includes(priority)) continue;

    for (const cols of parseTableRows(part, (c) => /^T-\d+/.test(c[0]))) {
      const [id, title, owner, status, ...rest] = cols;
      tasks.push({
        id,
        title: stripMd(title),
        owner: owner || "—",
        done: /☑|✅|\[x\]/i.test(status),
        priority,
        notes: stripMd(rest.join(" ")),
      });
    }
  }

  const gates = parseTableRows(
    md.split("## Funding gates")[1]?.split("##")[0] || "",
    (c) => /^G\d/.test(c[0]),
  ).map(([id, requirement, status]) => ({
    id,
    requirement: stripMd(requirement),
    done: /☑|✅/i.test(status),
  }));

  const activity = parseTableRows(
    md.split("## Agent assignment log")[1]?.split("##")[0] || "",
    (c) => /^\d{4}-\d{2}-\d{2}/.test(c[0]),
  )
    .slice(-12)
    .reverse()
    .map(([date, agent, taskId, action]) => ({
      date,
      agent: stripMd(agent),
      taskId: taskId === "—" ? null : taskId,
      action: stripMd(action),
    }));

  const completed = parseTableRows(
    md.split("## Recently completed")[1]?.split("##")[0] || "",
    (c) => c.length >= 3,
  )
    .slice(0, 10)
    .map((cols) => {
      const [id, task, completed, by] = cols;
      return {
        id: id === "—" ? null : id,
        task: stripMd(task),
        completed: stripMd(completed),
        by: stripMd(by || ""),
      };
    });

  const stats = {
    total: tasks.length,
    done: tasks.filter((t) => t.done).length,
    p0Open: tasks.filter((t) => t.priority === "P0" && !t.done).length,
    p1Open: tasks.filter((t) => t.priority === "P1" && !t.done).length,
  };

  return {
    lastUpdated,
    currentFocus,
    tasks,
    gates,
    activity,
    completed,
    stats,
  };
}

export function parseHistory(md) {
  const eras = [];
  const eraBlock = md.match(/## Era summary([\s\S]*?)## Key milestones/);
  if (eraBlock) {
    const chunks = eraBlock[1].split(/^### /m).slice(1);
    for (const chunk of chunks) {
      const title = chunk.split("\n")[0]?.trim() || "";
      const bullets = chunk
        .split("\n")
        .filter((l) => l.startsWith("- "))
        .map((l) => stripMd(l.slice(2)))
        .slice(0, 4);
      eras.push({ title: stripMd(title), bullets });
    }
  }

  const milestones = parseTableRows(
    md.split("## Key milestones")[1]?.split("##")[0] || "",
    (c) => /^\d{4}/.test(c[0]),
  ).map(([date, milestone, evidence]) => ({
    date: stripMd(date),
    milestone: stripMd(milestone),
    evidence: stripMd(evidence),
  }));

  return { eras, milestones };
}

export function buildGraph(manifestPages, tasklist, history) {
  const nodes = [
    {
      id: "core",
      kind: "core",
      label: "SUPARAYS",
      sublabel: "Live project map",
      slug: null,
    },
    {
      id: "focus",
      kind: "focus",
      label: "Nuvarande fokus",
      sublabel: tasklist.currentFocus.slice(0, 80) + (tasklist.currentFocus.length > 80 ? "…" : ""),
      slug: "tasklist-focus",
    },
    {
      id: "tasklist",
      kind: "hub",
      label: "TASKLIST",
      sublabel: `${tasklist.stats.done}/${tasklist.stats.total} klara · ${tasklist.stats.p0Open} P0 öppna`,
      slug: "tasklist",
    },
    {
      id: "history",
      kind: "hub",
      label: "Historik",
      sublabel: `${history.milestones.length} milstolpar`,
      slug: "history",
    },
    {
      id: "progress",
      kind: "hub",
      label: "Senaste aktivitet",
      sublabel: `${tasklist.activity.length} händelser`,
      slug: "activity",
    },
  ];

  const edges = [
    { from: "core", to: "focus" },
    { from: "core", to: "tasklist" },
    { from: "core", to: "history" },
    { from: "core", to: "progress" },
  ];

  for (const page of manifestPages) {
    nodes.push({
      id: `wiki-${page.slug}`,
      kind: page.category === "ideas" ? "ideas" : "topic",
      label: page.title,
      sublabel: page.category === "ideas" ? "Förslag & idéer" : "Wiki-tema",
      slug: page.slug,
    });
    edges.push({ from: "core", to: `wiki-${page.slug}` });
  }

  for (const task of tasklist.tasks.filter((t) => !t.done && t.priority === "P0").slice(0, 6)) {
    nodes.push({
      id: task.id,
      kind: "task-p0",
      label: task.id,
      sublabel: task.title.slice(0, 48) + (task.title.length > 48 ? "…" : ""),
      slug: `task-${task.id}`,
      taskId: task.id,
    });
    edges.push({ from: "tasklist", to: task.id });
  }

  return { nodes, edges };
}
