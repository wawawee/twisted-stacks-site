import React, { useEffect, useMemo, useState } from "react";
import "./anslag.css";

const MEMBERS = [
  { id: "per", label: "Per" },
  { id: "joachim", label: "Joachim" },
  { id: "tony", label: "Tony" },
] as const;

const ANSLAG_APP_URL = "https://anslag.twistedstacks.com";

interface AuthState {
  authenticated: boolean;
  member: string | null;
}

const SKIP_AUTH = import.meta.env.DEV && import.meta.env.VITE_ANSLAG_DEV_SKIP_AUTH !== "0";

type LaunchTarget = "app" | "funding" | "hub";

function readLaunchTarget(): LaunchTarget {
  const params = new URLSearchParams(window.location.search);
  const next = params.get("next");
  if (next === "app") return "app";
  if (next === "funding") return "funding";
  return "hub";
}

function LoginPanel({
  launch,
  onSuccess,
}: {
  launch: LaunchTarget;
  onSuccess: (member: string) => void;
}) {
  const [password, setPassword] = useState("");
  const [member, setMember] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/anslag/auth", {
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
    <div className="anslag-root">
      <div className="anslag-card">
        <a className="anslag-back" href="/#/projects/system_anslag">
          ← Tillbaka till Anslag-projektet
        </a>
        <h1>AnslagSITK</h1>
        <p className="anslag-lede">
          Teaminloggning — Per, Joachim och Tony. Efter inloggning{" "}
          {launch === "app"
            ? "öppnas AnslagSITK direkt."
            : launch === "funding"
              ? "öppnas finansieringsarbetsböckerna."
              : "väljer du app eller arbetsböcker."}
        </p>

        <form onSubmit={submit}>
          <div className="anslag-field">
            <label htmlFor="anslag-member">Vem är du?</label>
            <select
              id="anslag-member"
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

          <div className="anslag-field">
            <label htmlFor="anslag-password">Lösenord</label>
            <input
              id="anslag-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error ? <p className="anslag-error">{error}</p> : null}

          <button type="submit" className="anslag-submit" disabled={busy}>
            {busy ? "Loggar in…" : "Logga in"}
          </button>
        </form>
      </div>
    </div>
  );
}

function HubPanel({ member, launch }: { member: string | null; launch: LaunchTarget }) {
  const memberLabel = MEMBERS.find((m) => m.id === member)?.label ?? member;

  useEffect(() => {
    if (launch === "app") {
      window.location.replace(ANSLAG_APP_URL);
    } else if (launch === "funding") {
      window.location.replace("/funding");
    }
  }, [launch]);

  if (launch !== "hub") {
    return (
      <div className="anslag-root">
        <p className="anslag-loading">Öppnar…</p>
      </div>
    );
  }

  return (
    <div className="anslag-root">
      <div className="anslag-card">
        <a className="anslag-back" href="/#/projects/system_anslag">
          ← Tillbaka till Anslag-projektet
        </a>
        <h1>Anslag — teamverktyg</h1>
        <p className="anslag-lede">
          Inloggad som <strong>{memberLabel}</strong>. Välj vad du vill öppna.
        </p>

        <div className="anslag-hub-actions">
          <a className="anslag-hub-btn anslag-hub-btn-primary" href={ANSLAG_APP_URL}>
            AnslagSITK — sök utlysningar &amp; skriv ansökningar
          </a>
          <a className="anslag-hub-btn anslag-hub-btn-secondary" href="/funding">
            Finansieringsarbetsböcker — dossierer per projekt
          </a>
          <a
            className="anslag-hub-btn anslag-hub-btn-secondary"
            href="/funding?next=%2Fapi%2Ffunding%2Fdoc%3Ffile%3Dstudio-workbook.html"
          >
            Studio-översikt — investor vs bidrag
          </a>
        </div>

        <p className="anslag-muted">
          Workflow: redigera dossier i arbetsböcker → sök i AnslagSITK → generera utkast → finpolish → skicka.
        </p>
      </div>
    </div>
  );
}

export default function AnslagRoom() {
  const launch = useMemo(() => (typeof window !== "undefined" ? readLaunchTarget() : "hub"), []);
  const [auth, setAuth] = useState<AuthState | null>(
    SKIP_AUTH ? { authenticated: true, member: "per" } : null,
  );

  useEffect(() => {
    if (SKIP_AUTH) return;
    fetch("/api/anslag/auth", { credentials: "include" })
      .then((r) => r.json())
      .then((data: AuthState) => setAuth(data))
      .catch(() => setAuth({ authenticated: false, member: null }));
  }, []);

  if (!auth) {
    return (
      <div className="anslag-root">
        <p className="anslag-loading">Laddar…</p>
      </div>
    );
  }

  if (!auth.authenticated) {
    return (
      <LoginPanel
        launch={launch}
        onSuccess={(member) => setAuth({ authenticated: true, member })}
      />
    );
  }

  return <HubPanel member={auth.member} launch={launch} />;
}
