export type ViewMode = "dev" | "company";

/** Wiki topics visible in company / investor view */
export const COMPANY_WIKI_SLUGS = new Set([
  "strategy",
  "competitors",
  "funding",
  "use-cases",
  "risk",
]);

/** Wiki pages synced but hidden from colab grid (use Idébox + Chat) */
export const HIDDEN_WIKI_SLUGS = new Set(["ideas", "collab-chat"]);

const WIKI_SUBLABELS: Record<string, string> = {
  strategy: "Thesis & lanes",
  data: "Providers & OHLCV",
  risk: "Veto + sizing + HITL",
  competitors: "Freqtrade, Hummingbot, LEAN",
  funding: "Budget & grants",
  "use-cases": "Segments & operators",
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
    { id: "focus", label: "Nuvarande fokus", slug: "tasklist-focus", kind: "focus", section: "progress" },
  ];

  const hasUseCases = wikiPages.some((p) => p.slug === "use-cases");
  const hasStrategy = wikiPages.some((p) => p.slug === "strategy");

  if (hasUseCases) {
    items.push({
      id: "wiki-use-cases",
      label: mode === "company" ? "Användningsfall" : "Use cases",
      slug: "use-cases",
      kind: "topic",
      section: "wiki",
    });
  }

  if (mode === "company" && hasStrategy) {
    items.push({
      id: "wiki-strategy",
      label: "Strategi",
      slug: "strategy",
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
  );

  for (const page of wikiPages) {
    if (HIDDEN_WIKI_SLUGS.has(page.slug)) continue;
    if (page.slug === "use-cases") continue;
    if (page.slug === "strategy" && mode === "company") continue;
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
    graph: {
      nodes: Array<{ id: string; kind: string; label: string; sublabel: string; slug: string | null; taskId?: string }>;
    };
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
          sublabel: manifest.currentFocus.slice(0, 72) + (manifest.currentFocus.length > 72 ? "…" : ""),
          slug: "tasklist-focus",
          kind: "focus",
        },
        ...(mode === "company"
          ? [
              {
                id: "trading",
                label: "TRADE",
                sublabel: "SPY · cup-and-handle · paper",
                slug: "trading",
                kind: "trading" as const,
              },
            ]
          : []),
      ],
    },
  ];

  if (hasUseCases) {
    sections.push({
      id: "customers",
      title: mode === "company" ? "Användningsfall" : "Use cases",
      items: [
        {
          id: "wiki-use-cases",
          label: "Use cases",
          sublabel: "Operator · quant · internal",
          slug: "use-cases",
          kind: "topic" as const,
        },
      ],
    });
  }

  if (mode === "company") {
    const ecosystemItems = ["competitors", "funding", "strategy"]
      .filter((slug) => wikiPages.some((p) => p.slug === slug))
      .map((slug) => ({
        id: `wiki-${slug}`,
        label: slug === "competitors" ? "Konkurrenter" : slug === "funding" ? "Finansiering" : "Strategi",
        sublabel: WIKI_SUBLABELS[slug] || "Wiki",
        slug,
        kind: "topic" as const,
      }));
    if (ecosystemItems.length > 0) {
      sections.push({
        id: "ecosystem",
        title: "Marknad & strategi",
        items: ecosystemItems,
      });
    }
  }

  const extraWikiItems = wikiPages
    .filter((p) => !HIDDEN_WIKI_SLUGS.has(p.slug))
    .filter((p) => !["competitors", "funding", "use-cases", "strategy"].includes(p.slug))
    .map((p) => ({
      id: `wiki-${p.slug}`,
      label: p.title,
      sublabel: WIKI_SUBLABELS[p.slug] || "Wiki",
      slug: p.slug,
      kind: "topic" as const,
    }));

  if (extraWikiItems.length > 0) {
    sections.push({
      id: "wiki",
      title: mode === "company" ? "Teknik & risk" : "Teknik-wiki",
      items: extraWikiItems,
    });
  }

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
    ],
  });

  if (mode === "dev") {
    const p0 = manifest.graph.nodes.filter((n) => n.kind === "task-p0");
    if (p0.length > 0) {
      sections.push({
        id: "p0",
        title: "Phase 0–1 kö",
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
    ],
  });

  return sections;
}
