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

  const hasUseCases = wikiPages.some((p) => p.slug === "use-cases");
  const hasCompetitors = wikiPages.some((p) => p.slug === "competitors");

  if (hasUseCases) {
    items.push({
      id: "wiki-use-cases",
      label: mode === "company" ? "Kunder & segment" : "Användningsfall & kunder",
      slug: "use-cases",
      kind: "topic",
      section: "wiki",
    });
  }

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
    if (page.slug === "competitors" && mode === "company") continue;
    if (page.slug === "use-cases") continue;
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
  const hasUseCases = wikiPages.some((p) => p.slug === "use-cases");

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

  if (hasUseCases) {
    sections.push({
      id: "customers",
      title: mode === "company" ? "Användningsområden & kunder" : "Kunder & segment (prioriterat)",
      items: [
        {
          id: "wiki-use-cases",
          label: mode === "company" ? "Kunder & segment" : "Användningsfall & kunder",
          sublabel: "Bygg, brand, försäkring, DHH, m.fl.",
          slug: "use-cases",
          kind: "topic" as const,
        },
      ],
    });
  }

  if (mode === "company") {
    const hasCompetitors = wikiPages.some((p) => p.slug === "competitors");
    const hasPartnerships = wikiPages.some((p) => p.slug === "partnerships");

    const ecosystemItems = [
      ...(hasPartnerships
        ? [
            {
              id: "wiki-partnerships",
              label: "Partnerskap",
              sublabel: "Partner vs konkurrent",
              slug: "partnerships",
              kind: "topic" as const,
            },
          ]
        : []),
      ...(hasCompetitors
        ? [
            {
              id: "wiki-competitors",
              label: "Konkurrenter & jämförelser",
              sublabel: "FLIR, Ekahau, nami — uppdateras när segment växer",
              slug: "competitors",
              kind: "topic" as const,
            },
          ]
        : []),
    ];
    if (ecosystemItems.length > 0) {
      sections.push({
        id: "ecosystem",
        title: "Marknad & ekosystem",
        items: ecosystemItems,
      });
    }
  }

  sections.push({
    id: "wiki",
    title: mode === "company" ? "Mer wiki" : "Wiki & idéer",
    items: wikiPages
      .filter((p) => !["competitors", "partnerships", "use-cases"].includes(p.slug))
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
