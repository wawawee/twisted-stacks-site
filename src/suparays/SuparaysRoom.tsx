import React, { useCallback, useEffect, useMemo, useState } from "react";
import DetailPanel, { type HistoryData, type TasklistData } from "./DetailPanel";
import ProjectGrid from "./ProjectGrid";
import SideMenu from "./SideMenu";
import OverviewPanel from "./OverviewPanel";
import StartBareView from "./StartBareView";
import ChatPanel from "./ChatPanel";
import FilesPanel from "./FilesPanel";
import IdeasPanel from "./IdeasPanel";
import SuparaysMobileNav, { type SuparaysMobileNavId } from "./SuparaysMobileNav";
import { useIsMobile } from "./useIsMobile";
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

const MEMBERS = [
  { id: "baha", label: "Baha" },
  { id: "kris", label: "Kris" },
  { id: "joachim", label: "Joachim" },
  { id: "per", label: "Per" },
  { id: "toni", label: "Toni" },
] as const;

interface AuthState {
  authenticated: boolean;
  member: string | null;
}

function LoginPanel({ onSuccess }: { onSuccess: (member: string) => void }) {
  const [password, setPassword] = useState("");
  const [member, setMember] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { isDark } = useTheme();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/suparays/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, member }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Inloggning misslyckades");
        return;
      }
      onSuccess(data.member);
    } catch {
      setError("Kunde inte nå servern");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`suparays-root${isDark ? " theme-dark" : ""}`}>
      <div className="room-login">
        <form className="room-login-card" onSubmit={submit}>
          <h1>SUPARAYS</h1>
          <p className="room-login-lede">
            Projektrum — börjar med en enkel översikt. Växla till Företag eller Dev när du vill se mer.
          </p>

          <div className="room-login-field">
            <label htmlFor="suparays-member">Vem är du?</label>
            <select
              id="suparays-member"
              value={member}
              onChange={(e) => setMember(e.target.value)}
              required
            >
              <option value="">Välj namn…</option>
              {MEMBERS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="room-login-field">
            <label htmlFor="suparays-password">Lösenord</label>
            <input
              id="suparays-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error ? <p className="room-error">{error}</p> : null}

          <button type="submit" className="room-login-submit" disabled={busy}>
            {busy ? "Loggar in…" : "Gå in"}
          </button>
        </form>
      </div>
    </div>
  );
}

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
  const [auth, setAuth] = useState<AuthState | null>(SKIP_AUTH ? { authenticated: true, member: "per" } : null);
  const [project, setProject] = useState<ProjectPayload | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("start");
  const [selection, setSelection] = useState<Selection | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [markdown, setMarkdown] = useState("");
  const [mdLoading, setMdLoading] = useState(false);
  const [booting, setBooting] = useState(true);
  const [projectLoading, setProjectLoading] = useState(false);
  const [error, setError] = useState("");
  const { width: panelWidth, dragging, onPointerDown } = useResizablePanel();
  const { isDark, toggleTheme } = useTheme();
  const isMobile = useIsMobile();

  const menuItems = useMemo(
    () => buildMenuItems(project?.manifest.pages || [], viewMode),
    [project, viewMode],
  );

  const gridSections = useMemo(
    () => (project ? buildGridSections(project.manifest, viewMode) : []),
    [project, viewMode],
  );

  const loadProject = useCallback(async () => {
    setProjectLoading(true);
    try {
      const res = await fetch("/api/suparays/project");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Kunde inte ladda projekt");
      setProject(data);
      setError("");
    } finally {
      setProjectLoading(false);
    }
  }, []);

  useEffect(() => {
    if (SKIP_AUTH) {
      setBooting(false);
      return;
    }
    fetch("/api/suparays/auth")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Auth check failed");
        setAuth({ authenticated: data.authenticated, member: data.member });
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setBooting(false));
  }, []);

  useEffect(() => {
    if (!auth?.authenticated) return;
    loadProject()
      .catch((err: Error) => setError(err.message));
  }, [auth?.authenticated, loadProject]);

  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, []);

  async function logout() {
    await fetch("/api/suparays/auth", { method: "DELETE" });
    setAuth({ authenticated: false, member: null });
    setProject(null);
    setSelection(null);
    setActiveId(null);
  }

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
      slug === "ideabox" ||
      slug === "files" ||
      ["tasklist", "tasklist-focus", "activity", "history", "progress-summary"].includes(slug) ||
      slug.startsWith("phase-done-") ||
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

  if (!SKIP_AUTH && auth && !auth.authenticated) {
    return (
      <LoginPanel
        onSuccess={(member) => {
          setAuth({ authenticated: true, member });
          setError("");
        }}
      />
    );
  }

  const memberId = SKIP_AUTH ? "per" : auth?.member ?? null;

  const mobileNavActive: SuparaysMobileNavId =
    selection?.slug === "chat"
      ? "chat"
      : selection?.slug === "ideabox"
        ? "ideas"
        : selection?.slug === "progress-summary" ||
            selection?.slug === "tasklist" ||
            selection?.slug === "history" ||
            selection?.slug?.startsWith("phase-done-")
          ? "progress"
          : "home";

  function handleMobileNav(id: SuparaysMobileNavId) {
    if (id === "home") {
      setSelection(null);
      setActiveId(null);
      return;
    }
    if (id === "progress") {
      pick({
        id: "tasklist",
        label: viewMode === "dev" ? "TASKLIST" : "Framsteg",
        slug: viewMode === "dev" ? "tasklist" : "progress-summary",
        kind: "hub",
      });
      return;
    }
    if (id === "chat") {
      pick({ id: "chat", label: "Chat", slug: "chat", kind: "tool" });
      return;
    }
    pick({ id: "ideabox", label: "Idébox", slug: "ideabox", kind: "tool" });
  }

  const panelContent =
    selection?.kind === "overview" && project ? (
      viewMode === "start" ? (
        <StartBareView tasklist={project.tasklist} onNavigate={pick} />
      ) : (
        <OverviewPanel
          tasklist={project.tasklist}
          history={project.history}
          syncedAt={project.manifest.syncedAt}
          viewMode={viewMode}
          onNavigate={pick}
        />
      )
    ) : selection?.slug === "chat" ? (
      <ChatPanel memberId={memberId} />
    ) : selection?.slug === "ideabox" ? (
      <IdeasPanel memberId={memberId} />
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
    <div className={`suparays-root suparays-mobile${isDark ? " theme-dark" : ""}`}>
      <header className="room-mobile-bar">
        <div className="room-mobile-bar-top">
          <strong>SUPARAYS</strong>
          <div className="room-mobile-bar-actions">
            <button
              type="button"
              className="room-theme-toggle room-mobile-theme"
              onClick={toggleTheme}
              aria-pressed={isDark}
              aria-label={isDark ? "Byt till ljust läge" : "Byt till mörkt läge"}
            >
              <span className={`room-theme-knob${!isDark ? " dark" : ""}`} />
              <span className="room-theme-label">{isDark ? "Light" : "Dark"}</span>
            </button>
            {!SKIP_AUTH && auth?.member ? (
              <button type="button" className="room-btn room-btn-muted" onClick={logout}>
                Ut
              </button>
            ) : null}
          </div>
        </div>
        <div className="room-mobile-view-toggle room-mobile-view-toggle-3" role="group" aria-label="Visningsläge">
          <button
            type="button"
            className={`room-toggle${viewMode === "start" ? " active" : ""}`}
            onClick={() => setViewMode("start")}
          >
            Karta
          </button>
          <button
            type="button"
            className={`room-toggle${viewMode === "company" ? " active" : ""}`}
            onClick={() => setViewMode("company")}
          >
            Företag
          </button>
          <button
            type="button"
            className={`room-toggle${viewMode === "dev" ? " active" : ""}`}
            onClick={() => setViewMode("dev")}
          >
            Dev
          </button>
        </div>
      </header>

      <div className="room-layout">
        <SideMenu
          items={menuItems}
          activeId={activeId}
          viewMode={viewMode}
          isDark={isDark}
          onToggleTheme={toggleTheme}
          onSelect={handleMenuSelect}
          onSetViewMode={setViewMode}
          onRefresh={loadProject}
          onLogout={SKIP_AUTH ? undefined : logout}
          syncedAt={project?.manifest.syncedAt || null}
        />

        <main className="room-main">
          {error ? <p className="room-error">{error}</p> : null}
          {projectLoading ? (
            <p className="room-loading">Laddar projekt…</p>
          ) : project ? (
            viewMode === "start" && !selection ? (
              <div className="suparays-mobile-home suparays-start-home">
                <StartBareView tasklist={project.tasklist} onNavigate={pick} />
              </div>
            ) : isMobile && !selection ? (
              <div className="suparays-mobile-home">
                <OverviewPanel
                  tasklist={project.tasklist}
                  history={project.history}
                  syncedAt={project.manifest.syncedAt}
                  viewMode={viewMode}
                  onNavigate={pick}
                />
                <ProjectGrid
                  sections={gridSections}
                  activeId={activeId}
                  stats={project.manifest.stats}
                  onSelect={pick}
                  showStats={false}
                  viewMode={viewMode}
                />
              </div>
            ) : (
              <ProjectGrid
                sections={gridSections}
                activeId={activeId}
                stats={project.manifest.stats}
                onSelect={pick}
                viewMode={viewMode}
              />
            )
          ) : (
            <p className="room-error">
              {import.meta.env.DEV
                ? "Kör npm run sync:wiki"
                : "Projektet kunde inte laddas. Prova att ladda om sidan."}
            </p>
          )}
        </main>

        <div
          className={`room-resize${dragging ? " dragging" : ""}`}
          onPointerDown={onPointerDown}
          role="separator"
          aria-orientation="vertical"
          aria-label="Ändra panelbredd"
        />

        <aside
          className={`room-panel${selection ? " room-panel-open" : ""}`}
          style={!isMobile && selection ? { width: panelWidth } : undefined}
        >
          {selection ? (
            <div className="room-panel-mobile-bar">
              <span>{selection.label}</span>
              <button
                type="button"
                className="room-btn"
                onClick={() => {
                  setSelection(null);
                  setActiveId(null);
                }}
              >
                Tillbaka
              </button>
            </div>
          ) : null}
          {panelContent}
        </aside>
      </div>

      {isMobile ? <SuparaysMobileNav active={mobileNavActive} onSelect={handleMobileNav} /> : null}
    </div>
  );
}
