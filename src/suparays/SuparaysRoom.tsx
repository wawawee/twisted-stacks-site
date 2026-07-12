import React, { useCallback, useEffect, useMemo, useState } from "react";
import DetailPanel, { type HistoryData, type TasklistData } from "./DetailPanel";
import ProjectGrid from "./ProjectGrid";
import SideMenu from "./SideMenu";
import ChatPanel from "./ChatPanel";
import FilesPanel from "./FilesPanel";
import { useResizablePanel } from "./useResizablePanel";
import { useTheme } from "./useTheme";
import {
  buildGridSections,
  buildMenuItems,
  type MenuItem,
  type ViewMode,
} from "./viewMode";
import "./suparays.css";

const SKIP_AUTH = import.meta.env.DEV;

interface ProjectPayload {
  manifest: {
    syncedAt: string;
    currentFocus: string;
    stats: TasklistData["stats"];
    pages: Array<{ slug: string; title: string; path: string; category: string }>;
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
  };
  tasklist: TasklistData;
  history: HistoryData;
}

interface Selection {
  id: string;
  kind: string;
  slug: string | null;
  taskId?: string;
  label: string;
}

export default function SuparaysRoom() {
  const [project, setProject] = useState<ProjectPayload | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("company");
  const [selection, setSelection] = useState<Selection | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [markdown, setMarkdown] = useState("");
  const [mdLoading, setMdLoading] = useState(false);
  const [booting, setBooting] = useState(true);
  const [error, setError] = useState("");
  const { width: panelWidth, dragging, onPointerDown } = useResizablePanel();
  const { isDark, toggleTheme } = useTheme();

  const menuItems = useMemo(
    () => buildMenuItems(project?.manifest.pages || [], viewMode),
    [project, viewMode],
  );

  const gridSections = useMemo(
    () => (project ? buildGridSections(project.manifest, viewMode) : []),
    [project, viewMode],
  );

  const loadProject = useCallback(async () => {
    const res = await fetch("/api/suparays/project");
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Kunde inte ladda projekt");
    setProject(data);
    setError("");
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    loadProject()
      .catch((err: Error) => setError(err.message))
      .finally(() => setBooting(false));
  }, [loadProject]);

  useEffect(() => {
    setSelection(null);
    setActiveId(null);
  }, [viewMode]);

  useEffect(() => {
    if (!selection?.slug) {
      setMarkdown("");
      return;
    }
    const slug = selection.slug;
    if (
      slug === "chat" ||
      slug === "files" ||
      ["tasklist", "tasklist-focus", "activity", "history", "progress-summary"].includes(slug) ||
      slug.startsWith("task-")
    ) {
      setMarkdown("");
      return;
    }

    let cancelled = false;
    setMdLoading(true);
    fetch(`/api/suparays/wiki?page=${encodeURIComponent(slug)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Kunde inte ladda");
        if (!cancelled) setMarkdown(data.content || "");
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setMdLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selection?.slug]);

  function pick(item: { id: string; label: string; slug: string | null; kind: string; taskId?: string }) {
    setActiveId(item.id);
    setSelection({
      id: item.id,
      kind: item.kind,
      slug: item.slug,
      taskId: item.taskId,
      label: item.label,
    });
  }

  function handleMenuSelect(item: MenuItem) {
    pick(item);
  }

  if (booting) {
    return (
      <div className={`suparays-root${isDark ? " theme-dark" : ""}`}>
        <p className="room-loading">Laddar…</p>
      </div>
    );
  }

  const panelContent =
    selection?.slug === "chat" ? (
      <ChatPanel memberId={SKIP_AUTH ? "per" : null} />
    ) : selection?.slug === "files" ? (
      <FilesPanel />
    ) : (
      <DetailPanel
        selection={selection}
        markdown={markdown}
        loading={mdLoading}
        tasklist={project?.tasklist || null}
        history={project?.history || null}
        onClose={() => {
          setSelection(null);
          setActiveId(null);
        }}
      />
    );

  return (
    <div className={`suparays-root${isDark ? " theme-dark" : ""}`}>
      <div className="room-layout">
        <SideMenu
          items={menuItems}
          activeId={activeId}
          viewMode={viewMode}
          isDark={isDark}
          onToggleTheme={toggleTheme}
          onSelect={handleMenuSelect}
          onToggleView={() => setViewMode((m) => (m === "dev" ? "company" : "dev"))}
          onRefresh={loadProject}
          syncedAt={project?.manifest.syncedAt || null}
        />

        <main className="room-main">
          {error ? <p className="room-error">{error}</p> : null}
          {project ? (
            <ProjectGrid
              sections={gridSections}
              activeId={activeId}
              stats={project.manifest.stats}
              onSelect={pick}
            />
          ) : (
            <p className="room-error">Kör npm run sync:wiki</p>
          )}
        </main>

        <div
          className={`room-resize${dragging ? " dragging" : ""}`}
          onPointerDown={onPointerDown}
          role="separator"
          aria-orientation="vertical"
          aria-label="Ändra panelbredd"
        />

        <aside className="room-panel" style={{ width: panelWidth }}>
          {panelContent}
        </aside>
      </div>
    </div>
  );
}
