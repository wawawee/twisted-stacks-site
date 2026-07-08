/**
 * TwistedStacks — brand colour dev panel.
 *
 * Lives on the live page while we tune the brand palette in the browser.
 * Each tunable CSS variable gets three RGB sliders and a live hex box.
 * Changes are written to the document root and persisted to localStorage
 * so the chosen palette survives reloads.
 *
 * REMOVE ME: once the brand is locked, drop the mount in App.tsx and
 * delete this file + the import.
 */

import React, { useEffect, useMemo, useState } from "react";

type RGB = readonly [number, number, number];

type Token = {
  /** Display label. */
  label: string;
  /** CSS custom property name (without `--`). */
  varName: string;
  /** Default RGB value, matching the value in src/brand/twisted-stacks.css. */
  default: RGB;
};

const DEFAULTS = {
  "--accent": [127, 196, 230] as const,
  "--ok": [21, 255, 0] as const,
  "--bg-deep": [26, 14, 12] as const,
  "--bg-base": [38, 21, 18] as const,
  "--bg-tint": [47, 28, 24] as const,
  "--surface": [58, 37, 32] as const,
  "--surface-strong": [67, 43, 37] as const,
  "--text": [246, 239, 231] as const,
  "--text-dim": [216, 197, 185] as const,
};

const TOKENS: Token[] = [
  { label: "Accent — baby blue", varName: "--accent", default: DEFAULTS["--accent"] },
  { label: "Ok — strong green", varName: "--ok", default: DEFAULTS["--ok"] },
  { label: "Black (bg-deep)", varName: "--bg-deep", default: DEFAULTS["--bg-deep"] },
  { label: "Brown 1 (bg-base)", varName: "--bg-base", default: DEFAULTS["--bg-base"] },
  { label: "Brown 2 (bg-tint)", varName: "--bg-tint", default: DEFAULTS["--bg-tint"] },
  { label: "Brown 3 (surface)", varName: "--surface", default: DEFAULTS["--surface"] },
  { label: "Brown 4 (surface-strong)", varName: "--surface-strong", default: DEFAULTS["--surface-strong"] },
  { label: "White (text)", varName: "--text", default: DEFAULTS["--text"] },
  { label: "Off-white (text-dim)", varName: "--text-dim", default: DEFAULTS["--text-dim"] },
];

const STORAGE_KEY = "vrsp:dev-colors:v1";

type StoredShape = Partial<Record<string, RGB>>;

function clamp(n: number, lo: number, hi: number): number {
  if (Number.isNaN(n)) return lo;
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

function rgbToHex([r, g, b]: RGB): string {
  const h = (n: number) => clamp(n, 0, 255).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

function hexToRgb(input: string): RGB | null {
  const s = input.trim().replace(/^#/, "");
  if (!/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s)) return null;
  const expand = s.length === 3 ? s.split("").map((c) => c + c).join("") : s;
  return [
    parseInt(expand.slice(0, 2), 16),
    parseInt(expand.slice(2, 4), 16),
    parseInt(expand.slice(4, 6), 16),
  ] as const;
}

function readStored(): StoredShape {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed as StoredShape;
  } catch {
    /* ignore — fall back to defaults */
  }
  return {};
}

function writeStored(values: StoredShape): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
  } catch {
    /* ignore — storage may be unavailable */
  }
}

function applyToRoot(values: StoredShape): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  for (const [varName, rgb] of Object.entries(values)) {
    if (!rgb) continue;
    const [r, g, b] = rgb;
    root.style.setProperty(varName, rgbToHex(rgb));
  }
}

function clearRootOverrides(): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  for (const t of TOKENS) {
    root.style.removeProperty(t.varName);
  }
}

function ChannelRow({
  channel,
  value,
  onChange,
}: {
  channel: "R" | "G" | "B";
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="cdp-channel">
      <span className="cdp-channel-label">{channel}</span>
      <input
        type="range"
        min={0}
        max={255}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="cdp-slider"
      />
      <span className="cdp-channel-value">{value}</span>
    </label>
  );
}

const TokenRow: React.FC<{
  token: Token;
  value: RGB;
  onChange: (next: RGB) => void;
  onReset: () => void;
}> = function TokenRow({ token, value, onChange, onReset }) {
  const hex = useMemo(() => rgbToHex(value), [value]);
  const isDefaulted =
    value[0] === token.default[0] &&
    value[1] === token.default[1] &&
    value[2] === token.default[2];

  const handleHexInput = (next: string) => {
    const parsed = hexToRgb(next);
    if (parsed) onChange(parsed);
  };

  return (
    <div className="cdp-token">
      <div className="cdp-token-head">
        <span
          className="cdp-swatch"
          style={{ backgroundColor: hex }}
          aria-hidden="true"
        />
        <span className="cdp-token-label">{token.label}</span>
        <button
          type="button"
          className="cdp-mini-btn"
          onClick={onReset}
          disabled={isDefaulted}
          title="Reset to default"
        >
          ↺
        </button>
      </div>
      <div className="cdp-hex-row">
        <input
          className="cdp-hex-input"
          value={hex}
          spellCheck={false}
          onChange={(e) => handleHexInput(e.target.value)}
          aria-label={`${token.label} hex value`}
        />
        <code className="cdp-var">{token.varName}</code>
      </div>
      <div className="cdp-channels">
        <ChannelRow
          channel="R"
          value={value[0]}
          onChange={(n) => onChange([n, value[1], value[2]])}
        />
        <ChannelRow
          channel="G"
          value={value[1]}
          onChange={(n) => onChange([value[0], n, value[2]])}
        />
        <ChannelRow
          channel="B"
          value={value[2]}
          onChange={(n) => onChange([value[0], value[1], n])}
        />
      </div>
    </div>
  );
}

export function ColorDevPanel() {
  const [open, setOpen] = useState(true);
  const [values, setValues] = useState<StoredShape>(() => {
    const stored = readStored();
    // Merge defaults + stored overrides
    const merged: StoredShape = {};
    for (const t of TOKENS) merged[t.varName] = t.default;
    for (const [k, v] of Object.entries(stored)) {
      if (v && Array.isArray(v) && v.length === 3) merged[k] = v as RGB;
    }
    return merged;
  });

  // Push values to the live CSS variables whenever they change
  useEffect(() => {
    applyToRoot(values);
    writeStored(values);
  }, [values]);

  const setToken = (varName: string, next: RGB) => {
    setValues((prev) => ({ ...prev, [varName]: next }));
  };

  const resetToken = (varName: string) => {
    const t = TOKENS.find((x) => x.varName === varName);
    if (!t) return;
    setValues((prev) => ({ ...prev, [varName]: t.default }));
  };

  const resetAll = () => {
    const fresh: StoredShape = {};
    for (const t of TOKENS) fresh[t.varName] = t.default;
    setValues(fresh);
  };

  const copyAll = async () => {
    const lines = TOKENS.map((t) => {
      const v = values[t.varName] ?? t.default;
      return `${t.varName}: ${rgbToHex(v)};`;
    });
    const text = lines.join("\n");
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore — clipboard may not be available */
    }
  };

  return (
    <>
      <button
        type="button"
        className={`cdp-toggle ${open ? "is-open" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        title={open ? "Hide brand panel" : "Show brand panel"}
      >
        {open ? "✕" : "BRAND"}
      </button>
      {open && (
        <aside className="cdp-panel" role="region" aria-label="Brand colour dev panel">
          <header className="cdp-header">
            <div>
              <div className="cdp-title">BRAND TWEAK</div>
              <div className="cdp-sub">dev only — remove when locked</div>
            </div>
            <div className="cdp-header-actions">
              <button type="button" className="cdp-btn" onClick={copyAll}>
                Copy hex
              </button>
              <button type="button" className="cdp-btn cdp-btn-danger" onClick={resetAll}>
                Reset
              </button>
            </div>
          </header>

          <section className="cdp-section">
            <h3 className="cdp-section-title">Accents</h3>
            {TOKENS.filter((t) => t.varName === "--accent" || t.varName === "--ok").map(
              (t) => (
                <TokenRow
                  key={t.varName}
                  token={t}
                  value={(values[t.varName] ?? t.default) as RGB}
                  onChange={(next) => setToken(t.varName, next)}
                  onReset={() => resetToken(t.varName)}
                />
              ),
            )}
          </section>

          <section className="cdp-section">
            <h3 className="cdp-section-title">Brown scale + B/W</h3>
            {TOKENS.filter(
              (t) =>
                t.varName === "--bg-deep" ||
                t.varName === "--bg-base" ||
                t.varName === "--bg-tint" ||
                t.varName === "--surface" ||
                t.varName === "--surface-strong" ||
                t.varName === "--text" ||
                t.varName === "--text-dim",
            ).map((t) => (
              <TokenRow
                key={t.varName}
                token={t}
                value={(values[t.varName] ?? t.default) as RGB}
                onChange={(next) => setToken(t.varName, next)}
                onReset={() => resetToken(t.varName)}
              />
            ))}
          </section>

          <footer className="cdp-footer">
            <span>Saved to localStorage · key <code>{STORAGE_KEY}</code></span>
          </footer>
        </aside>
      )}
    </>
  );
}

export default ColorDevPanel;