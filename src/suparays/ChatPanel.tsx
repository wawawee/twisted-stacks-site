import React, { useEffect, useRef, useState } from "react";

const MEMBER_LABELS: Record<string, string> = {
  baha: "Baha",
  kris: "Kris",
  joachim: "Joachim",
  per: "Per",
};

const MEMBER_COLORS: Record<string, string> = {
  baha: "#7fc4e6",
  kris: "#c98a96",
  joachim: "#e6c07f",
  per: "#7cf58a",
};

export interface ChatMessage {
  id: number;
  member: string;
  body: string;
  createdAt: string;
}

const POLL_MS = 4000;

export default function ChatPanel({ memberId }: { memberId: string | null }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function fetchMessages() {
    try {
      const res = await fetch("/api/suparays/chat?limit=80");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Kunde inte ladda chat");
      setMessages((data.messages || []) as ChatMessage[]);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chatfel");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMessages();
    const timer = window.setInterval(fetchMessages, POLL_MS);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;

    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/suparays/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Kunde inte skicka");

      const msg = data.message as ChatMessage;
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      setDraft("");
      if (data.wiki && !data.wiki.synced && data.wiki.reason && !data.wiki.skipped) {
        setError(`Sparat i chat (#${msg.id}), men wiki-sync misslyckades: ${data.wiki.reason}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte skicka");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="suparays-chat">
      <header className="suparays-chat-header">
        <h2>Chat</h2>
        <p>Gemensam tråd — investerare, teknik, design och dev. Synkas till wiki/COLLAB-CHAT.md.</p>
      </header>

      <div className="suparays-chat-feed" ref={scrollRef} aria-live="polite">
        {loading && messages.length === 0 ? (
          <p className="suparays-loading">Laddar meddelanden…</p>
        ) : messages.length === 0 ? (
          <p className="suparays-chat-empty">Inga meddelanden än. Skriv det första!</p>
        ) : (
          messages.map((msg) => {
            const mine = memberId === msg.member;
            const label = MEMBER_LABELS[msg.member] || msg.member;
            const color = MEMBER_COLORS[msg.member] || "var(--accent)";
            return (
              <div key={msg.id} className={`suparays-chat-msg${mine ? " mine" : ""}`}>
                <div className="suparays-chat-msg-head">
                  <span className="suparays-chat-avatar" style={{ borderColor: color }}>
                    {label.charAt(0)}
                  </span>
                  <strong style={{ color }}>{label}</strong>
                  <time dateTime={msg.createdAt}>
                    {new Date(msg.createdAt).toLocaleString("sv-SE", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </div>
                <div className="suparays-chat-msg-body">{msg.body}</div>
              </div>
            );
          })
        )}
      </div>

      <form className="suparays-chat-compose" onSubmit={send}>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Skriv ett meddelande…"
          rows={3}
          maxLength={2000}
          disabled={sending}
        />
        <div className="suparays-chat-compose-actions">
          <span className="suparays-chat-hint">{draft.length}/2000</span>
          <button type="submit" className="suparays-btn suparays-btn-primary" disabled={sending || !draft.trim()}>
            {sending ? "Skickar…" : "Skicka"}
          </button>
        </div>
      </form>

      {error ? <p className="suparays-error">{error}</p> : null}
    </div>
  );
}
