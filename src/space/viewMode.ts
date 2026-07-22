export type ViewMode = "dev" | "company";

/** Wiki topics visible in company / external view */
export const COMPANY_WIKI_SLUGS = new Set([
  "blender",
  "unity",
  "commons",
  "sessions",
  "charter",
  "architecture",
]);

/** Wiki pages synced for agents but not shown in colab UI (use Idébox + Chat tools instead) */
export const HIDDEN_WIKI_SLUGS = new Set(["ideas", "collab-chat"]);

const WIKI_SUBLABELS: Record<string, string> = {
  blender: "MCP & shared .blend",
  unity: "Unity / Godot",
  commons: "Avatars & world",
  sessions: "Signup & schedule",
  charter: "Guest rights",
  architecture: "Conductor & bus",
  misc: "Övrigt",
};

export interface MenuItem {
  id: string;
  label: string;
  slug: string | null;
  kind: string;
  section: "overview" | "wiki" | "progress" | "tools";
  devOnly?: boolean;
  taskId?: string;
}

export function buildMenuItems(
  wikiPages: Array<{ slug: string; title: string; category: string }>,
  mode: ViewMode,
): MenuItem[] {
  const items: MenuItem[] = [
    { id: "overview", label: "Översikt", slug: null, kind: "overview", section: "overview" },
    { id: "sessions", label: "Sessions", slug: "sessions-signup", kind: "tool", section: "tools" },
    { id: "focus", label: "Nuvarande fokus", slug: "tasklist-focus", kind: "focus", section: "progress" },
  ];

  items.push(
    {
      id: "tasklist",
      label: mode === "company" ? "Framsteg" : "TASKLIST",
      slug: mode === "company" ? "progress-summary" : "tasklist",
      kind: "hub",
      section: "progress",
    },
    { id: "history", label: "Historik", slug: "history", kind: "hub", section: "progress" },
    {
      id: "activity",
      label: "Senaste aktivitet",
      slug: "activity",
      kind: "hub",
      section: "progress",
      devOnly: true,
    },
  );

  for (const page of wikiPages) {
    if (HIDDEN_WIKI_SLUGS.has(page.slug)) continue;
    if (mode === "company" && !COMPANY_WIKI_SLUGS.has(page.slug)) continue;
    items.push({
      id: `wiki-${page.slug}`,
      label: page.title,
      slug: page.slug,
      kind: page.category === "ideas" ? "ideas" : "topic",
      section: "wiki",
    });
  }

  items.push(
    { id: "chat", label: "Chat", slug: "chat", kind: "tool", section: "tools" },
    { id: "ideabox", label: "Idébox", slug: "ideabox", kind: "tool", section: "tools" },
    { id: "files", label: "Filer", slug: "files", kind: "tool", section: "tools", devOnly: true },
  );

  return items.filter((i) => mode === "dev" || !i.devOnly);
}

export interface GridSection {
  id: string;
  title: string;
  items: Array<{
    id: string;
    label: string;
    sublabel?: string;
    slug: string | null;
    kind: string;
    taskId?: string;
  }>;
}

export function buildGridSections(
  manifest: {
    currentFocus: string;
    stats: {
      total: number;
      done: number;
      p0Open: number;
      p1Open: number;
      phaseProgress?: {
        phasesTotal: number;
        phasesComplete: number;
        activePhaseNum: string;
        activePhaseName: string;
        activePhaseDone: number;
        activePhaseTotal: number;
        activePhasePct: number;
        heroPhasePct?: number;
        heroPhaseNum?: string;
        heroPhaseDone?: number;
        heroPhaseTotal?: number;
        heroDelivered?: boolean;
      };
    };
    pages: Array<{ slug: string; title: string; category: string }>;
    graph: {
      nodes: Array<{
        id: string;
        kind: string;
        label: string;
        sublabel: string;
        slug: string | null;
        taskId?: string;
      }>;
    };
  },
  mode: ViewMode,
): GridSection[] {
  const wikiPages = manifest.pages.filter(
    (p) => mode === "dev" || COMPANY_WIKI_SLUGS.has(p.slug),
  );

  const sections: GridSection[] = [
    {
      id: "focus",
      title: "Fokus",
      items: [
        {
          id: "focus",
          label: "Nuvarande fokus",
          sublabel:
            manifest.currentFocus.slice(0, 72) +
            (manifest.currentFocus.length > 72 ? "…" : ""),
          slug: "tasklist-focus",
          kind: "focus",
        },
        {
          id: "sessions",
          label: "Session signup",
          sublabel: "Anmäl dig till Blender/Unity-sessioner",
          slug: "sessions-signup",
          kind: "tool",
        },
      ],
    },
  ];

  const worldItems = wikiPages
    .filter((p) => !HIDDEN_WIKI_SLUGS.has(p.slug))
    .map((p) => ({
      id: `wiki-${p.slug}`,
      label: p.title,
      sublabel: WIKI_SUBLABELS[p.slug] || "Wiki",
      slug: p.slug,
      kind: "topic" as const,
    }));

  if (worldItems.length > 0) {
    sections.push({
      id: "world",
      title: mode === "company" ? "Världen" : "Wiki",
      items: worldItems,
    });
  }

  sections.push({
    id: "progress",
    title: mode === "company" ? "Framsteg" : "TASKLIST & historik",
    items: [
      {
        id: "tasklist",
        label: mode === "company" ? "Status & milstolpar" : "TASKLIST",
        sublabel: manifest.stats.phaseProgress
          ? `Fas ${manifest.stats.phaseProgress.activePhaseNum}: ${manifest.stats.phaseProgress.activePhasePct}% · ${manifest.stats.phaseProgress.phasesComplete}/${manifest.stats.phaseProgress.phasesTotal} levererade`
          : `${manifest.stats.done}/${manifest.stats.total} klara`,
        slug: mode === "company" ? "progress-summary" : "tasklist",
        kind: "hub",
      },
      {
        id: "history",
        label: "Historik",
        sublabel: "Tidslinje",
        slug: "history",
        kind: "hub",
      },
      ...(mode === "dev"
        ? [
            {
              id: "activity",
              label: "Aktivitet",
              sublabel: "Agent-logg",
              slug: "activity",
              kind: "hub" as const,
            },
          ]
        : []),
    ],
  });

  if (mode === "dev") {
    const p0 = manifest.graph.nodes.filter((n) => n.kind === "task-p0");
    if (p0.length > 0) {
      sections.push({
        id: "p0",
        title: "Focus-kö",
        items: p0.map((n) => ({
          id: n.id,
          label: n.label,
          sublabel: n.sublabel,
          slug: n.slug,
          kind: n.kind,
          taskId: n.taskId,
        })),
      });
    }
  }

  sections.push({
    id: "tools",
    title: "Verktyg",
    items: [
      { id: "chat", label: "Chat", slug: "chat", kind: "tool" as const },
      { id: "ideabox", label: "Idébox", slug: "ideabox", kind: "tool" as const },
      ...(mode === "dev"
        ? [{ id: "files", label: "Delade filer", slug: "files", kind: "tool" as const }]
        : []),
    ],
  });

  return sections;
}
