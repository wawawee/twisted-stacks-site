import React, { useEffect, useState } from "react";

interface Signup {
  id: number;
  name: string;
  email: string;
  interest: string;
  preferredSlot: string | null;
  note: string | null;
  createdAt: string;
}

const INTERESTS = [
  { id: "blender", label: "Blender worlds" },
  { id: "unity", label: "Unity / Godot" },
  { id: "commons", label: "Commons & avatars" },
  { id: "any", label: "Whatever is next" },
] as const;

export default function SessionsPanel() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [interest, setInterest] = useState("blender");
  const [preferredSlot, setPreferredSlot] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  const [signups, setSignups] = useState<Signup[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/space/sessions")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Kunde inte ladda");
        if (!cancelled) setSignups(data.signups || []);
      })
      .catch(() => {
        /* table may not exist yet — form still works once SQL is applied */
      });
    return () => {
      cancelled = true;
    };
  }, [ok]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    setOk(false);
    try {
      const res = await fetch("/api/space/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, interest, preferredSlot, note }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Kunde inte spara");
        return;
      }
      setOk(true);
      setName("");
      setEmail("");
      setPreferredSlot("");
      setNote("");
    } catch {
      setError("Kunde inte nå servern");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="detail-panel">
      <header className="detail-panel-head">
        <h2>Session signup</h2>
      </header>

      <div className="detail-scroll">
        <section className="space-sessions-intro">
          <p>
            Anmäl dig till kommande SPACE-sessioner där människor och agenter skapar tillsammans i
            Blender, Unity och Commons. Live co-edit kommer i etapper — just nu samlar vi intresse och
            tidsluckor.
          </p>
        </section>

        <form className="space-sessions-form" onSubmit={submit}>
          <label>
            Namn
            <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} />
          </label>
          <label>
            E-post
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={200}
            />
          </label>
          <label>
            Intresse
            <select value={interest} onChange={(e) => setInterest(e.target.value)}>
              {INTERESTS.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Önskad tid (valfritt)
            <input
              value={preferredSlot}
              onChange={(e) => setPreferredSlot(e.target.value)}
              placeholder="t.ex. torsdag kväll CET"
              maxLength={120}
            />
          </label>
          <label>
            Anteckning (valfritt)
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Vad vill du bygga?"
            />
          </label>

          {error ? <p className="room-error">{error}</p> : null}
          {ok ? <p className="space-sessions-ok">Tack — vi hör av oss när nästa session öppnar.</p> : null}

          <button type="submit" className="room-login-submit" disabled={busy}>
            {busy ? "Skickar…" : "Anmäl dig"}
          </button>
        </form>

        {signups.length > 0 ? (
          <section className="space-sessions-list">
            <h3>Senaste anmälningar</h3>
            <ul>
              {signups.slice(0, 12).map((s) => (
                <li key={s.id}>
                  <strong>{s.name}</strong> · {s.interest}
                  {s.preferredSlot ? ` · ${s.preferredSlot}` : ""}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
