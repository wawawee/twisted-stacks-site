/**
 * Parse ATE TASKLIST.md (phase checklist format) for colab UI.
 */

function stripMd(text) {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*/g, "")
    .trim();
}

export function parseTasklist(md) {
  const lastUpdated = md.match(/\*\*Last updated:\*\*\s*(.+)/i)?.[1]?.trim() || null;

  const immediate = md.split("## Immediate Next Actions")[1]?.split(/^## /m)[0] || "";
  const focusLines = immediate
    .split("\n")
    .filter((l) => /^\d+\./.test(l.trim()))
    .map((l) => ({ raw: l, text: stripMd(l.replace(/^\d+\.\s*/, "")), done: /\[x\]/.test(l) }));
  const openFocus = focusLines.find((l) => !l.done && !/\[x\]/.test(l.raw));
  const currentFocus = openFocus?.text || focusLines.find((l) => !l.done)?.text || "Phase 2 — Vision Channel";

  const tasks = [];
  const phaseBlocks = md.split(/^## Phase /m).slice(1);

  for (const block of phaseBlocks) {
    const heading = block.split("\n")[0] || "";
    const phaseMatch = heading.match(/^(\d+)/);
    const phaseNum = phaseMatch ? phaseMatch[1] : "?";
    const phaseName = stripMd(heading.replace(/^\d+\s*[—–-]\s*/, ""));

    for (const line of block.split("\n")) {
      const m = line.match(/^- \[([ ~x\-])\] (.+)/);
      if (!m) continue;
      const mark = m[1];
      const title = stripMd(m[2]);
      const idx = tasks.filter((t) => t.phaseNum === phaseNum).length + 1;
      tasks.push({
        id: `P${phaseNum}-${idx}`,
        title,
        owner: "—",
        done: mark === "x",
        inProgress: mark === "~",
        deferred: mark === "-",
        phase: `Phase ${phaseNum}`,
        phaseNum,
        phaseName,
        priority: Number(phaseNum) <= 1 ? "P0" : Number(phaseNum) <= 3 ? "P1" : "P2",
        notes: "",
      });
    }
  }

  const openP0 = tasks.filter((t) => t.priority === "P0" && !t.done && !t.deferred);
  const focusTasks = openP0.slice(0, 8);

  const stats = {
    total: tasks.length,
    done: tasks.filter((t) => t.done).length,
    p0Open: tasks.filter((t) => t.priority === "P0" && !t.done && !t.deferred).length,
    p1Open: tasks.filter((t) => t.priority === "P1" && !t.done && !t.deferred).length,
  };

  return {
    lastUpdated,
    currentFocus,
    focusQueue: focusTasks.map((t) => t.id),
    focusTasks,
    tasks,
    gates: [],
    activity: [],
    completed: tasks
      .filter((t) => t.done)
      .slice(-8)
      .reverse()
      .map((t) => ({
        id: t.id,
        task: t.title,
        completed: t.phase,
        by: "",
      })),
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

  const milestones = [];
  const msBlock = md.split("## Key milestones")[1]?.split(/^## /m)[0] || "";
  for (const line of msBlock.split("\n")) {
    if (!line.startsWith("|") || line.includes("---") || line.includes("Date")) continue;
    const cols = line
      .split("|")
      .map((c) => c.trim())
      .filter((_, i, arr) => i > 0 && i < arr.length - 1);
    if (cols.length < 2 || !/^\d{4}/.test(cols[0])) continue;
    milestones.push({
      date: stripMd(cols[0]),
      milestone: stripMd(cols[1]),
      evidence: stripMd(cols[2] || ""),
    });
  }

  return { eras, milestones };
}

export function buildGraph(manifestPages, tasklist, history) {
  const nodes = [
    {
      id: "core",
      kind: "core",
      label: "ATE",
      sublabel: "Agentic Trading Engine",
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
  ];

  const edges = [
    { from: "core", to: "focus" },
    { from: "core", to: "tasklist" },
    { from: "core", to: "history" },
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

  for (const task of tasklist.focusTasks.slice(0, 8)) {
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
