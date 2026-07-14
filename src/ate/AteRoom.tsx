import React, { useCallback, useEffect, useMemo, useState } from "react";
import DetailPanel, { type HistoryData, type TasklistData } from "../suparays/DetailPanel";
import ProjectGrid from "../suparays/ProjectGrid";
import SideMenu from "../suparays/SideMenu";
import OverviewPanel from "./OverviewPanel";
import ChatPanel from "./ChatPanel";
import IdeasPanel from "./IdeasPanel";
import TradingPanel from "./TradingPanel";
import { useResizablePanel } from "../suparays/useResizablePanel";
import { useTheme } from "../suparays/useTheme";
import { buildGridSections, buildMenuItems, type MenuItem, type ViewMode } from "./viewMode";
import "../suparays/suparays.css";
import "./ate.css";

const SKIP_AUTH = import.meta.env.DEV;
const API = "/api/ate";

const MEMBERS = [
  { id: "baha", label: "Baha" },
  { id: "kris", label: "Kris" },
  { id: "joachim", label: "Joachim" },
  { id: "per", label: "Per" },
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
      const res = await fetch(`${API}/auth`, {
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
    <div className={`suparays-root ate-root${isDark ? " theme-dark" : ""}`}>
      <div className="room-login">
        <form className="room-login-card" onSubmit={submit}>
          <h1 className="room-brand-title">ATE</h1>
          <p className="room-login-lede">Agentic Trading Engine — investor & dev colab.</p>
          <div className="room-login-field">
            <label htmlFor="ate-member">Vem är du?</label>
            <select id="ate-member" value={member} onChange={(e) => setMember(e.target.value)} required>
              <option value="">Välj namn…</option>
              {MEMBERS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div className="room-login-field">
            <label htmlFor="ate-password">Lösenord</label>
            <input
              id="ate-password"
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

export default function AteRoom() {
  const [auth, setAuth] = useState<AuthState | null>(SKIP_AUTH ? { authenticated: true, member: "per" } : null);
  const [project, setProject] = useState<ProjectPayload | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("company");
  const [selection, setSelection] = useState<Selection | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [markdown, setMarkdown] = useState("");
  const [mdLoading, setMdLoading] = useState(false);
  const [booting, setBooting] = useState(true);
  const [projectLoading, setProjectLoading] = useState(false);
  const [error, setError] = useState("");
  const { width: panelWidth, dragging, onPointerDown } = useResizablePanel("ate-panel-width-v1");
  const { isDark, toggleTheme } = useTheme();
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 800px)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 800px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

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
      const res = await fetch(`${API}/project`);
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
    fetch(`${API}/auth`)
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
    loadProject().catch((err: Error) => setError(err.message));
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
    await fetch(`${API}/auth`, { method: "DELETE" });
    setAuth({ authenticated: false, member: null });
    setProject(null);
    setSelection(null);
    setActiveId(null);
  }

  useEffect(() => {
    if (viewMode === "trading") return;
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
      slug === "trading" ||
      ["tasklist", "tasklist-focus", "history", "progress-summary"].includes(slug) ||
      slug.startsWith("task-")
    ) {
      setMarkdown("");
      return;
    }

    let cancelled = false;
    setMdLoading(true);
    fetch(`${API}/wiki?page=${encodeURIComponent(slug)}`)
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
    if (item.slug === "trading") {
      setViewMode("trading");
    } else if (viewMode === "trading" && item.kind !== "trading") {
      setViewMode("company");
    }
    setSelection({
      id: item.id,
      kind: item.kind,
      slug: item.slug,
      taskId: item.taskId,
      label: item.label,
    });
  }

  if (booting) {
    return (
      <div className={`suparays-root ate-root${isDark ? " theme-dark" : ""}`}>
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
  const isTrading = viewMode === "trading" || selection?.slug === "trading";
  const wikiViewMode: "dev" | "company" = viewMode === "dev" ? "dev" : "company";

  const panelContent =
    selection?.kind === "overview" && project ? (
      <OverviewPanel
        tasklist={project.tasklist}
        history={project.history}
        syncedAt={project.manifest.syncedAt}
        viewMode={wikiViewMode}
        onNavigate={pick}
      />
    ) : selection?.slug === "chat" ? (
      <ChatPanel memberId={memberId} />
    ) : selection?.slug === "ideabox" ? (
      <IdeasPanel memberId={memberId} />
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
    <div className={`suparays-root ate-root${isDark ? " theme-dark" : ""}`}>
      <header className="room-mobile-bar">
        <div className="room-mobile-bar-top">
          <strong>ATE</strong>
          <div className="room-mobile-bar-actions">
            <button
              type="button"
              className="room-theme-toggle room-mobile-theme"
              onClick={toggleTheme}
              aria-pressed={isDark}
              aria-label={isDark ? "Light mode" : "Dark mode"}
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
        <div className="room-mobile-view-toggle" role="group" aria-label="Visningsläge">
          <button
            type="button"
            className={`room-toggle${viewMode === "company" ? " active" : ""}`}
            onClick={() => setViewMode("company")}
          >
            Investor
          </button>
          <button
            type="button"
            className={`room-toggle${viewMode === "dev" ? " active" : ""}`}
            onClick={() => setViewMode("dev")}
          >
            Dev
          </button>
          <button
            type="button"
            className={`room-toggle${viewMode === "trading" ? " active" : ""}`}
            onClick={() => {
              setViewMode("trading");
              setSelection({ id: "trading", kind: "trading", slug: "trading", label: "Terminal" });
              setActiveId("trading");
            }}
          >
            Terminal
          </button>
        </div>
      </header>

      <div className={`room-layout${isTrading ? " ate-trading-layout-root" : ""}`}>
        {!isTrading ? (
          <SideMenu
            items={menuItems}
            activeId={activeId}
            viewMode={wikiViewMode}
            isDark={isDark}
            onToggleTheme={toggleTheme}
            onSelect={pick}
            onToggleView={() => setViewMode((m) => (m === "dev" ? "company" : "dev"))}
            onRefresh={loadProject}
            onLogout={SKIP_AUTH ? undefined : logout}
            syncedAt={project?.manifest.syncedAt || null}
            brandLabel="ATE"
          />
        ) : null}

        <main className={`room-main${isTrading ? " ate-trading-main-full" : ""}`}>
          {error && !isTrading ? <p className="room-error">{error}</p> : null}
          {isTrading ? (
            <TradingPanel memberId={memberId} />
          ) : projectLoading ? (
            <p className="room-loading">Laddar projekt…</p>
          ) : project ? (
            <ProjectGrid
              sections={gridSections}
              activeId={activeId}
              stats={project.manifest.stats}
              onSelect={pick}
            />
          ) : (
            <p className="room-error">
              {import.meta.env.DEV ? "Kör npm run sync:ate" : "Projektet kunde inte laddas."}
            </p>
          )}
        </main>

        {!isTrading ? (
          <>
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
          </>
        ) : null}
      </div>
    </div>
  );
}
