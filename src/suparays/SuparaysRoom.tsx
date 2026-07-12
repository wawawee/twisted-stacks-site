import React, { useCallback, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ChatPanel from "./ChatPanel";
import FilesPanel from "./FilesPanel";
import "./suparays.css";

const MEMBERS = [
  { id: "baha", label: "Baha" },
  { id: "kris", label: "Kris" },
  { id: "joachim", label: "Joachim" },
  { id: "per", label: "Per" },
] as const;

interface WikiPage {
  id: string;
  slug: string;
  title: string;
  description: string;
  path: string;
  category: string;
  icon: string;
}

interface WikiManifest {
  syncedAt: string;
  source: string;
  pages: WikiPage[];
}

interface AuthState {
  authenticated: boolean;
  member: string | null;
}

type RoomView = "home" | "wiki" | "chat" | "files";

function parseSuparaysPath(path: string): { view: RoomView; slug: string | null } {
  if (path === "/suparays/chat") return { view: "chat", slug: null };
  if (path === "/suparays/files") return { view: "files", slug: null };
  const wikiMatch = path.match(/^\/suparays\/wiki(?:\/([^/]+))?$/);
  if (wikiMatch) return { view: "wiki", slug: wikiMatch[1] || "ideas" };
  return { view: "home", slug: null };
}

function memberLabel(id: string | null) {
  return MEMBERS.find((m) => m.id === id)?.label || id || "";
}

function LoginPanel({ onSuccess }: { onSuccess: (member: string) => void }) {
  const [password, setPassword] = useState("");
  const [member, setMember] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

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
    <div className="suparays-login">
      <form className="suparays-login-card" onSubmit={submit}>
        <h1>SUPARAYS</h1>
        <p className="lede">
          Projektrum för teamet — följ idéer sorterade per tema och se vad som
          händer i projektet. Välj det område du är nyfiken på i sidomenyn.
        </p>

        <div className="suparays-field">
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

        <div className="suparays-field">
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

        {error ? <p className="suparays-error">{error}</p> : null}

        <button type="submit" className="suparays-btn suparays-btn-primary" disabled={busy} style={{ width: "100%", marginTop: "0.5rem" }}>
          {busy ? "Loggar in…" : "Gå in"}
        </button>
      </form>
    </div>
  );
}

function WelcomeHome({ manifest, onSelect }: { manifest: WikiManifest; onSelect: (slug: string) => void }) {
  const ideas = manifest.pages.find((p) => p.slug === "ideas");
  const topics = manifest.pages.filter((p) => p.category === "topic");

  return (
    <div className="suparays-welcome">
      <h2>Välkommen till SUPARAYS-projektrummet</h2>
      <p>
        Här samlas idéer och förslag som teamet och våra nära samarbetspartners
        driver framåt. Allt är sorterat per tema — klicka på det område du vill
        följa eller bidra till. Du kan också skriva i chatten.
      </p>
      {ideas ? (
        <button type="button" className="suparays-btn suparays-btn-primary" onClick={() => onSelect("ideas")}>
          Se idéer &amp; förslag
        </button>
      ) : null}

      <div className="suparays-topic-grid">
        {topics.map((topic) => (
          <button key={topic.slug} type="button" className="suparays-topic-card" onClick={() => onSelect(topic.slug)}>
            <strong>{topic.icon} {topic.title}</strong>
            <span>by-topic/{topic.slug}.md</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function WikiPanel({ slug, manifest }: { slug: string; manifest: WikiManifest }) {
  const [content, setContent] = useState<string>("");
  const [syncedAt, setSyncedAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);
    setError("");

    fetch(`/api/suparays/wiki?page=${encodeURIComponent(slug)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Kunde inte ladda sidan");
        if (cancelled) return;
        setContent(data.content || "");
        setSyncedAt(data.syncedAt || manifest.syncedAt);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug, manifest.syncedAt]);

  if (!slug) return null;

  if (loading) return <p className="suparays-loading">Laddar…</p>;
  if (error) return <p className="suparays-error">{error}</p>;

  return (
    <article>
      <div className="suparays-wiki-meta">
        Senast synkad: {syncedAt ? new Date(syncedAt).toLocaleString("sv-SE") : "—"}
      </div>
      <div className="suparays-wiki-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </article>
  );
}

export default function SuparaysRoom() {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [manifest, setManifest] = useState<WikiManifest | null>(null);
  const [view, setView] = useState<RoomView>("home");
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [booting, setBooting] = useState(true);

  const loadManifest = useCallback(async () => {
    const res = await fetch("/api/suparays/wiki");
    if (!res.ok) throw new Error("Wiki unavailable");
    return res.json() as Promise<WikiManifest>;
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
    let cancelled = false;

    async function boot() {
      try {
        const authRes = await fetch("/api/suparays/auth");
        const authData = (await authRes.json()) as AuthState;
        if (cancelled) return;
        setAuth(authData);
        if (authData.authenticated) {
          setManifest(await loadManifest());
        }
      } catch {
        if (!cancelled) setAuth({ authenticated: false, member: null });
      } finally {
        if (!cancelled) setBooting(false);
      }
    }

    boot();
    return () => {
      cancelled = true;
    };
  }, [loadManifest]);

  const applyPath = useCallback((path: string) => {
    const parsed = parseSuparaysPath(path.replace(/\/+$/, "") || "/suparays");
    setView(parsed.view);
    setActiveSlug(parsed.slug);
  }, []);

  useEffect(() => {
    applyPath(window.location.pathname);
    const onPop = () => applyPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [applyPath]);

  function navigate(nextView: RoomView, slug: string | null = null) {
    let next = "/suparays";
    if (nextView === "chat") next = "/suparays/chat";
    else if (nextView === "files") next = "/suparays/files";
    else if (nextView === "wiki" && slug) next = `/suparays/wiki/${slug}`;

    setView(nextView);
    setActiveSlug(slug);
    window.history.pushState({}, "", next);
  }

  function navigateWiki(slug: string) {
    navigate("wiki", slug);
  }

  async function logout() {
    await fetch("/api/suparays/auth", { method: "DELETE" });
    setAuth({ authenticated: false, member: null });
    setManifest(null);
    setView("home");
    setActiveSlug(null);
    window.history.pushState({}, "", "/suparays");
  }

  if (booting) {
    return (
      <div className="suparays-root">
        <p className="suparays-loading" style={{ padding: "2rem" }}>Laddar…</p>
      </div>
    );
  }

  if (!auth?.authenticated) {
    return (
      <div className="suparays-root">
        <LoginPanel
          onSuccess={async (member) => {
            setAuth({ authenticated: true, member });
            try {
              setManifest(await loadManifest());
            } catch {
              /* wiki may sync on next deploy */
            }
          }}
        />
      </div>
    );
  }

  const ideaPage = manifest?.pages.find((p) => p.slug === "ideas");
  const topicPages = manifest?.pages.filter((p) => p.category === "topic") || [];

  return (
    <div className="suparays-root">
      <div className="suparays-shell">
        <header className="suparays-header">
          <div className="suparays-brand">
            <h1>SUPARAYS — projektrum</h1>
            <p>Idéer och teman · uppdateras från projektets wiki</p>
          </div>
          <div className="suparays-header-actions">
            {auth.member ? (
              <span className="suparays-member-badge">{memberLabel(auth.member)}</span>
            ) : null}
            <a href="https://twistedstacks.com" className="suparays-btn">
              Showroom
            </a>
            <button type="button" className="suparays-btn" onClick={logout}>
              Logga ut
            </button>
          </div>
        </header>

        <div className="suparays-body">
          <nav className="suparays-nav" aria-label="Wiki navigation">
            <div className="suparays-nav-section">
              <div className="suparays-nav-label">Översikt</div>
              <button
                type="button"
                className={`suparays-nav-item${view === "home" ? " active" : ""}`}
                onClick={() => navigate("home")}
              >
                Start
              </button>
              {ideaPage ? (
                <button
                  type="button"
                  className={`suparays-nav-item${view === "wiki" && activeSlug === "ideas" ? " active" : ""}`}
                  onClick={() => navigateWiki("ideas")}
                >
                  {ideaPage.icon} {ideaPage.title}
                </button>
              ) : null}
            </div>

            {topicPages.length > 0 ? (
              <div className="suparays-nav-section">
                <div className="suparays-nav-label">Teman</div>
                {topicPages.map((page) => (
                  <button
                    key={page.slug}
                    type="button"
                    className={`suparays-nav-item${view === "wiki" && activeSlug === page.slug ? " active" : ""}`}
                    onClick={() => navigateWiki(page.slug)}
                  >
                    {page.title}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="suparays-nav-section">
              <div className="suparays-nav-label">Samarbete</div>
              <button
                type="button"
                className={`suparays-nav-item${view === "chat" ? " active" : ""}`}
                onClick={() => navigate("chat")}
              >
                Chat
              </button>
              <button
                type="button"
                className={`suparays-nav-item${view === "files" ? " active" : ""}`}
                onClick={() => navigate("files")}
              >
                Delade filer
              </button>
            </div>
          </nav>

          <main className="suparays-main">
            {view === "chat" ? (
              <ChatPanel memberId={auth.member} />
            ) : view === "files" ? (
              <FilesPanel />
            ) : manifest ? (
              view === "wiki" && activeSlug ? (
                <WikiPanel slug={activeSlug} manifest={manifest} />
              ) : (
                <WelcomeHome manifest={manifest} onSelect={navigateWiki} />
              )
            ) : view === "wiki" ? (
              <p className="suparays-error">
                Wiki inte synkad än — kör deploy igen eller kontakta Per.
              </p>
            ) : (
              <WelcomeHome
                manifest={manifest || { syncedAt: "", source: "", pages: [] }}
                onSelect={navigateWiki}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
