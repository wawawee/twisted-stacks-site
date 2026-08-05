import React, { useEffect, useState } from "react";
import "./funding.css";

const MEMBERS = [
  { id: "per", label: "Per" },
  { id: "joachim", label: "Joachim" },
  { id: "tony", label: "Tony" },
] as const;

interface AuthState {
  authenticated: boolean;
  member: string | null;
}

const SKIP_AUTH = import.meta.env.DEV && import.meta.env.VITE_FUNDING_DEV_SKIP_AUTH !== "0";

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
      const res = await fetch("/api/funding/auth", {
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
    <div className="funding-root">
      <form className="funding-login-card" onSubmit={submit}>
        <h1>Finansieringsarbetsböcker</h1>
        <p className="funding-login-lede">
          TwistedStacks dossierer &amp; ansökningsunderlag — endast Per, Joachim och Tony.
        </p>

        <div className="funding-field">
          <label htmlFor="funding-member">Vem är du?</label>
          <select
            id="funding-member"
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

        <div className="funding-field">
          <label htmlFor="funding-password">Lösenord</label>
          <input
            id="funding-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        {error ? <p className="funding-error">{error}</p> : null}

        <button type="submit" className="funding-submit" disabled={busy}>
          {busy ? "Loggar in…" : "Öppna arbetsböcker"}
        </button>
      </form>
    </div>
  );
}

export default function FundingRoom() {
  const [auth, setAuth] = useState<AuthState | null>(
    SKIP_AUTH ? { authenticated: true, member: "per" } : null
  );

  useEffect(() => {
    if (SKIP_AUTH) return;
    fetch("/api/funding/auth", { credentials: "include" })
      .then((r) => r.json())
      .then((data: AuthState) => setAuth(data))
      .catch(() => setAuth({ authenticated: false, member: null }));
  }, []);

  useEffect(() => {
    if (!auth?.authenticated) return;
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next");
    const file = next?.includes("file=")
      ? new URL(next, window.location.origin).searchParams.get("file") || "index.html"
      : "index.html";
    window.location.replace(`/api/funding/doc?file=${encodeURIComponent(file)}`);
  }, [auth?.authenticated]);

  if (!auth) {
    return (
      <div className="funding-root">
        <p className="funding-loading">Laddar…</p>
      </div>
    );
  }

  if (!auth.authenticated) {
    return (
      <LoginPanel
        onSuccess={(member) => {
          setAuth({ authenticated: true, member });
        }}
      />
    );
  }

  return (
    <div className="funding-root">
      <p className="funding-loading">Öppnar arbetsböcker…</p>
    </div>
  );
}
