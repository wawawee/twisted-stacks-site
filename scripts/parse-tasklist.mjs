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
  if (/^P0\b/i.test(heading)) return "P0";
  if (/^P1\b/i.test(heading)) return "P1";
  if (/^P2\b/i.test(heading)) return "P2";
  if (/backlog/i.test(heading)) return "backlog";
  return "other";
}

/** Investor-facing phases — new P2/backlog tasks do not move Fas 2 %. */
const PHASE_BY_PRIORITY = {
  P1: { num: "1", name: "Research & dokumentation" },
  P0: { num: "2", name: "G1 investerarvägg" },
  P2: { num: "3", name: "Produkt & mesh" },
  backlog: { num: "4", name: "Backlog" },
};

const GATE_PHASE = { num: "5", name: "Funding gates (G1)" };

function attachPhase(task) {
  const phase = PHASE_BY_PRIORITY[task.priority] || { num: "4", name: "Backlog" };
  return {
    ...task,
    phaseNum: phase.num,
    phaseName: phase.name,
    phase: `Fas ${phase.num}`,
    inProgress: /\bpending\b|in progress|\[~]/i.test(task.notes || ""),
    deferred: false,
  };
}

function gateTasks(gates) {
  return gates.map((g, i) => ({
    id: g.id,
    title: g.requirement,
    owner: "—",
    done: g.done,
    priority: "gate",
    notes: "",
    phaseNum: GATE_PHASE.num,
    phaseName: GATE_PHASE.name,
    phase: `Fas ${GATE_PHASE.num}`,
    inProgress: false,
    deferred: false,
  }));
}

function computePhaseProgress(tasks, currentFocus = "") {
  const byPhase = new Map();
  for (const t of tasks) {
    const n = t.phaseNum || "?";
    if (!byPhase.has(n)) byPhase.set(n, []);
    byPhase.get(n).push(t);
  }
  const nums = [...byPhase.keys()]
    .filter((n) => n !== "?")
    .map(Number)
    .sort((a, b) => a - b);

  function phasePct(num) {
    const nd = (byPhase.get(String(num)) || []).filter((t) => !t.deferred);
    if (!nd.length) return 0;
    return nd.filter((t) => t.done).length / nd.length;
  }

  const focusMatch = currentFocus.match(/G1|investor|demo|pitch|stockholm/i);
  const inProgressPhases = nums.filter((n) => byPhase.get(String(n)).some((t) => t.inProgress));
  const p0Open = (byPhase.get("2") || []).some((t) => !t.done && !t.deferred);

  const activeNum =
    ((focusMatch || p0Open) ? 2 : null) ??
    (inProgressPhases.length ? Math.max(...inProgressPhases) : null) ??
    [...nums].reverse().find((n) => {
      const pct = phasePct(n);
      return pct > 0 && pct < 1;
    }) ??
    2;

  // Prior phases ≥50% done count as delivered (investor roadmap — not strict 100% gate)
  const phasesComplete = nums.filter((n) => Number(n) < activeNum && phasePct(n) >= 0.5).length;

  const apt = byPhase.get(String(activeNum)) || [];
  const nonDeferred = apt.filter((t) => !t.deferred);
  const activePhaseDone = nonDeferred.filter((t) => t.done).length;
  const activePhaseTotal = nonDeferred.length;
  const activePhasePct =
    activePhaseTotal > 0 ? Math.round((activePhaseDone / activePhaseTotal) * 100) : 0;

  const phaseSnapshots = nums.map((n) => {
    const nd = (byPhase.get(String(n)) || []).filter((t) => !t.deferred);
    const done = nd.filter((t) => t.done).length;
    const total = nd.length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return {
      num: String(n),
      name: nd[0]?.phaseName || `Fas ${n}`,
      done,
      total,
      pct,
      delivered: pct >= 50,
    };
  });

  const delivered = phaseSnapshots.filter((s) => s.delivered);
  const hero =
    delivered.length > 0
      ? delivered[delivered.length - 1]
      : phaseSnapshots.reduce((best, s) => (s.pct > best.pct ? s : best), phaseSnapshots[0] ?? {
          num: "1",
          name: "Research",
          done: 0,
          total: 0,
          pct: 0,
          delivered: false,
        });

  return {
    phasesTotal: nums.length,
    phasesComplete,
    activePhaseNum: String(activeNum),
    activePhaseName: apt[0]?.phaseName || `Fas ${activeNum}`,
    activePhaseDone,
    activePhaseTotal,
    activePhasePct,
    heroPhaseNum: hero.num,
    heroPhaseName: hero.name,
    heroPhaseDone: hero.done,
    heroPhaseTotal: hero.total,
    heroPhasePct: hero.pct,
    heroDelivered: hero.delivered,
    phaseSnapshots,
  };
}

export function parseFocusQueue(md) {
  const block = md.split("## Current focus")[1]?.split(/^## /m)[0] || "";
  const line = block.match(/\*\*Focus queue[^*]*\*\*[:\s]*(.+)/i)?.[1] || "";
  const seen = new Set();
  const ids = [];
  for (const match of line.matchAll(/T-\d+/g)) {
    if (!seen.has(match[0])) {
      seen.add(match[0]);
      ids.push(match[0]);
    }
  }
  return ids;
}

export function openFocusTasks(tasks, focusQueue) {
  const open = tasks.filter((t) => !t.done);
  if (focusQueue.length === 0) {
    return open.filter((t) => t.priority === "P0");
  }
  const byId = new Map(open.map((t) => [t.id, t]));
  return focusQueue.map((id) => byId.get(id)).filter(Boolean);
}

export function parseTasklist(md) {
  const lastUpdated = md.match(/\*\*Last updated:\*\*\s*(.+)/)?.[1]?.trim() || null;
  const focusBlock = md.match(/## Current focus[^]*?\n>\s*\*\*([^*]+)\*\*/);
  const currentFocus = focusBlock?.[1]?.trim() || "";
  const focusQueue = parseFocusQueue(md);

  const tasks = [];
  const sectionParts = md.split(/^### /m).slice(1);
  for (const part of sectionParts) {
    const heading = part.split("\n")[0] || "";
    const priority = priorityFromHeading(heading);
    if (!["P0", "P1", "P2", "backlog"].includes(priority)) continue;

    for (const cols of parseTableRows(part, (c) => /^T-\d+/.test(c[0]))) {
      const [id, title, owner, status, ...rest] = cols;
      tasks.push(
        attachPhase({
          id,
          title: stripMd(title),
          owner: owner || "—",
          done: /☑|✅|\[x\]/i.test(status),
          priority,
          notes: stripMd(rest.join(" ")),
        }),
      );
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

  const phasedTasks = [...tasks, ...gateTasks(gates)];
  const recentWins = completed.slice(0, 6).map((c) => c.task);

  const stats = {
    total: tasks.length,
    done: tasks.filter((t) => t.done).length,
    p0Open: tasks.filter((t) => t.priority === "P0" && !t.done).length,
    p1Open: tasks.filter((t) => t.priority === "P1" && !t.done).length,
    phaseProgress: computePhaseProgress(phasedTasks, currentFocus),
  };

  const focusTasks = openFocusTasks(tasks, focusQueue);

  return {
    lastUpdated,
    currentFocus,
    focusQueue,
    focusTasks,
    recentWins,
    tasks: phasedTasks,
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
