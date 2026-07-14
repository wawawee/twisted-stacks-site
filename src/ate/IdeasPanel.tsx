import React, { useEffect, useRef, useState } from "react";

const API = "/api/ate";

const MEMBER_LABELS: Record<string, string> = {
  baha: "Baha",
  kris: "Kris",
  joachim: "Joachim",
  per: "Per",
};

interface IdeaEntry {
  id: number;
  member: string;
  body: string;
  createdAt: string;
}

export default function IdeasPanel({ memberId }: { memberId: string | null }) {
  const [ideas, setIdeas] = useState<IdeaEntry[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function loadIdeas() {
    try {
      const res = await fetch(`${API}/ideas?limit=50`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Kunde inte ladda idéer");
      setIdeas((data.ideas || []) as IdeaEntry[]);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fel");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadIdeas();
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
      const res = await fetch(`${API}/ideas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Kunde inte spara");
      const idea = data.idea as IdeaEntry;
      setIdeas((prev) => (prev.some((i) => i.id === idea.id) ? prev : [...prev, idea]));
      setDraft("");
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
        <p>Datakällor, strategier, risk — agent triagerar till wiki/TASKLIST.</p>
      </header>
      <div className="suparays-ideas-feed" ref={scrollRef} aria-live="polite">
        {loading && ideas.length === 0 ? (
          <p className="suparays-loading">Laddar idéer…</p>
        ) : ideas.length === 0 ? (
          <p className="suparays-ideas-empty">Inga idéer än.</p>
        ) : (
          ideas.map((idea) => {
            const mine = memberId === idea.member;
            const label = MEMBER_LABELS[idea.member] || idea.member;
            return (
              <article key={idea.id} className={`suparays-ideas-item${mine ? " mine" : ""}`}>
                <div className="suparays-ideas-item-head">
                  <code className="suparays-ideas-id">#{idea.id}</code>
                  <strong>{label}</strong>
                  <time dateTime={idea.createdAt}>
                    {new Date(idea.createdAt).toLocaleString("sv-SE", {
                      month: "short",
                      day: "numeric",
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
          placeholder="Klistra in en idé…"
          rows={4}
          maxLength={8000}
          disabled={sending}
        />
        <div className="suparays-ideas-compose-actions">
          <span className="suparays-chat-hint">{draft.length}/8000</span>
          <button type="submit" className="suparays-btn suparays-btn-primary" disabled={sending || !draft.trim()}>
            {sending ? "Sparar…" : "Spara idé"}
          </button>
        </div>
      </form>
      {error ? <p className="suparays-error">{error}</p> : null}
    </div>
  );
}
