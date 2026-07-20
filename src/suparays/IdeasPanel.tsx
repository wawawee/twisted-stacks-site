import React, { useEffect, useRef, useState } from "react";

const MEMBER_LABELS: Record<string, string> = {
  baha: "Baha",
  kris: "Kris",
  joachim: "Joachim",
  per: "Per",
  toni: "Toni",
};

const MEMBER_COLORS: Record<string, string> = {
  baha: "#7fc4e6",
  kris: "#c98a96",
  joachim: "#e6c07f",
  per: "#7cf58a",
  toni: "#c9a0e8",
};

export interface IdeaEntry {
  id: number;
  member: string;
  body: string;
  createdAt: string;
}

const POLL_MS = 5000;

export default function IdeasPanel({ memberId }: { memberId: string | null }) {
  const [ideas, setIdeas] = useState<IdeaEntry[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function fetchIdeas() {
    try {
      const res = await fetch("/api/suparays/ideas?limit=50");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Kunde inte ladda idéer");
      setIdeas((data.ideas || []) as IdeaEntry[]);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Idéboxfel");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchIdeas();
    const timer = window.setInterval(fetchIdeas, POLL_MS);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [ideas.length]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;

    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/suparays/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Kunde inte spara");

      const idea = data.idea as IdeaEntry;
      setIdeas((prev) => (prev.some((i) => i.id === idea.id) ? prev : [...prev, idea]));
      setDraft("");
      if (data.wiki?.synced) {
        setError("");
      } else if (data.wiki?.reason && !data.wiki?.skipped) {
        setError(`Sparad i idébox (#${idea.id}), men wiki-sync misslyckades: ${data.wiki.reason}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte spara");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="suparays-ideas">
      <header className="suparays-ideas-header">
        <h2>Idébox</h2>
        <p>Saxa in idéer — sparas här och synkas direkt till wiki/IDEAS.md i repot.</p>
      </header>

      <div className="suparays-ideas-feed" ref={scrollRef} aria-live="polite">
        {loading && ideas.length === 0 ? (
          <p className="suparays-loading">Laddar idéer…</p>
        ) : ideas.length === 0 ? (
          <p className="suparays-ideas-empty">Inga idéer än. Klistra in den första!</p>
        ) : (
          ideas.map((idea) => {
            const mine = memberId === idea.member;
            const label = MEMBER_LABELS[idea.member] || idea.member;
            const color = MEMBER_COLORS[idea.member] || "var(--accent)";
            return (
              <article key={idea.id} className={`suparays-ideas-item${mine ? " mine" : ""}`}>
                <div className="suparays-ideas-item-head">
                  <code className="suparays-ideas-id">#{idea.id}</code>
                  <strong style={{ color }}>{label}</strong>
                  <time dateTime={idea.createdAt}>
                    {new Date(idea.createdAt).toLocaleString("sv-SE", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </div>
                <div className="suparays-ideas-body">{idea.body}</div>
              </article>
            );
          })
        )}
      </div>

      <form className="suparays-ideas-compose" onSubmit={submit}>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Klistra in eller skriv en idé…"
          rows={6}
          maxLength={8000}
          disabled={sending}
        />
        <div className="suparays-ideas-compose-actions">
          <span className="suparays-chat-hint">{draft.length}/8000</span>
          <button type="submit" className="suparays-btn suparays-btn-primary" disabled={sending || !draft.trim()}>
            {sending ? "Sparar…" : "Lägg till idé"}
          </button>
        </div>
      </form>

      {error ? <p className="suparays-error">{error}</p> : null}
    </div>
  );
}
