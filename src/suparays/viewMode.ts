export type ViewMode = "dev" | "company";

/** Wiki topics visible in company / external view */
export const COMPANY_WIKI_SLUGS = new Set([
  "collab-chat",
  "competitors",
  "ideas",
  "sensors",
  "use-cases",
  "funding",
  "partnerships",
  "ux-ui",
]);

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
    { id: "focus", label: "Nuvarande fokus", slug: "tasklist-focus", kind: "focus", section: "progress" },
  ];

  const hasCompetitors = wikiPages.some((p) => p.slug === "competitors");

  if (mode === "company" && hasCompetitors) {
    items.push({
      id: "wiki-competitors",
      label: "Konkurrenter",
      slug: "competitors",
      kind: "topic",
      section: "wiki",
    });
  }

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
    if (mode === "company" && page.slug === "competitors") continue;
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
    stats: { total: number; done: number; p0Open: number; p1Open: number };
    pages: Array<{ slug: string; title: string; category: string }>;
    graph: { nodes: Array<{ id: string; kind: string; label: string; sublabel: string; slug: string | null; taskId?: string }> };
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
          sublabel: manifest.currentFocus.slice(0, 100),
          slug: "tasklist-focus",
          kind: "focus",
        },
      ],
    },
  ];

  if (mode === "company") {
    const hasCompetitors = wikiPages.some((p) => p.slug === "competitors");
    const marketItems = [
      ...(hasCompetitors
        ? [
            {
              id: "wiki-competitors",
              label: "Konkurrenter & jämförelser",
              sublabel: "FLIR, Ekahau, nami, liknande projekt",
              slug: "competitors",
              kind: "topic" as const,
            },
          ]
        : []),
      ...wikiPages
        .filter((p) => p.slug === "partnerships" || p.slug === "use-cases")
        .map((p) => ({
          id: `wiki-${p.slug}`,
          label: p.title,
          sublabel: p.slug === "partnerships" ? "Partner vs konkurrent" : "Segment & kunder",
          slug: p.slug,
          kind: "topic" as const,
        })),
    ];
    if (marketItems.length > 0) {
      sections.push({
        id: "market",
        title: "Marknad & konkurrens",
        items: marketItems,
      });
    }
  }

  sections.push({
    id: "wiki",
    title: mode === "company" ? "Mer wiki" : "Wiki & idéer",
    items: wikiPages
      .filter((p) => mode === "dev" || !["competitors", "partnerships", "use-cases"].includes(p.slug))
      .map((p) => ({
        id: `wiki-${p.slug}`,
        label: p.title,
        sublabel: p.category === "ideas" ? "Förslag" : "Tema",
        slug: p.slug,
        kind: p.category === "ideas" ? "ideas" : "topic",
      })),
  });

  sections.push({
    id: "progress",
    title: mode === "company" ? "Framsteg" : "TASKLIST & historik",
    items: [
      {
        id: "tasklist",
        label: mode === "company" ? "Status & milstolpar" : "TASKLIST",
        sublabel: `${manifest.stats.done}/${manifest.stats.total} klara`,
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
