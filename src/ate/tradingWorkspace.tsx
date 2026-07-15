import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import TradingChart from "./TradingChart";
import type { CupHandleSignal, MacroAlert, MacroAlertsPayload, MacroPayload, MarketBar, MarketQuote, RegimeGateResult, TaFeatures } from "./tradingTypes";
import { WATCHLIST } from "./tradingTypes";

const API = "/api/ate";

export function fmtPrice(n: number, digits = 2) {
  return n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

type MobileTab = "chart" | "signals" | "watch";

export interface TelemetrySnapshot {
  symbol: string;
  signalCount: number;
  barCount: number;
  regime: RegimeGateResult | null;
  ta: TaFeatures | null;
  fusedScore: number | null;
  tradeAllowed: boolean | null;
  at: Date;
}

export interface MarketFetchSnapshot {
  symbol: string;
  at: Date;
}

interface TradingContextValue {
  symbol: string;
  setSymbol: (s: string) => void;
  timeframe: string;
  setTimeframe: (s: string) => void;
  bars: MarketBar[];
  quote: MarketQuote | null;
  signals: CupHandleSignal[];
  topSignal: CupHandleSignal | null;
  regime: RegimeGateResult | null;
  fusedScore: number | null;
  tradeAllowed: boolean | null;
  loading: boolean;
  scanning: boolean;
  error: string;
  loadMarket: () => Promise<void>;
  runScan: () => Promise<void>;
  lastScan: TelemetrySnapshot | null;
  lastMarketFetch: MarketFetchSnapshot | null;
  macro: MacroPayload | null;
  macroLoading: boolean;
  loadMacro: () => Promise<void>;
  macroAlerts: MacroAlert[];
  macroAlertsLoading: boolean;
  isMobile: boolean;
  isDark: boolean;
  mobileTab: MobileTab;
  setMobileTab: (t: MobileTab) => void;
  hitlOpen: boolean;
  setHitlOpen: (open: boolean) => void;
  hitlDecision: "pending" | "approved" | "rejected";
  setHitlDecision: (d: "pending" | "approved" | "rejected") => void;
  requiresHitl: boolean;
  hitlStatus: string;
  setHitlStatus: (s: string) => void;
}

function fmtTelemetryTime(d: Date) {
  return d.toLocaleString("sv-SE", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const FALLBACK_MACRO_ALERTS: MacroAlert[] = [
  {
    marketId: "btc-100k-dec",
    platform: "polymarket",
    title: "Bitcoin reaches $100K by Dec 2026",
    tier: "tier1",
    eventType: "crypto",
    yesPrice: 0.68,
    probShift: 0.12,
    volume24h: 245_000,
    direction: "bullish",
    confidence: 0.87,
    source: "mock",
  },
];

function tierBadgeLabel(tier: MacroAlert["tier"]): string {
  return tier.replace("tier", "T").toUpperCase();
}

const FALLBACK_MACRO: MacroPayload = {
  source: "mock",
  quotes: [
    { label: "Fed cut Jul '26", prob: 1, source: "mock" },
    { label: "BTC $100K Dec", prob: 10, source: "mock" },
  ],
  whale: { amount: "$1.2M YES", pnl: "+$4.7M lifetime", source: "mock" },
  fetchedAt: "",
};

function macroScore(macro: MacroPayload | null): number {
  const quotes = macro?.quotes ?? FALLBACK_MACRO.quotes;
  if (!quotes.length) return 0;
  const avg = quotes.reduce((sum, q) => sum + q.prob, 0) / quotes.length;
  return avg / 100;
}

/** RegimeGate v1 — show banner when C&H is gated by live regime classification. */
function regimeBannerMessage(regime: RegimeGateResult | null): string | null {
  if (!regime || regime.cup_handle_allowed) return null;
  if (regime.regime === "crisis") return "C&H paused — crisis vol · size cap 50%";
  return "C&H paused — not trending";
}

const TradingContext = createContext<TradingContextValue | null>(null);

export function useTradingWorkspace() {
  const ctx = useContext(TradingContext);
  if (!ctx) throw new Error("useTradingWorkspace outside provider");
  return ctx;
}

export function TradingWorkspaceProvider({
  children,
  isDark,
  isMobile,
}: {
  children: React.ReactNode;
  isDark: boolean;
  isMobile: boolean;
}) {
  const [symbol, setSymbol] = useState("SPY");
  const [timeframe, setTimeframe] = useState("1d");
  const [mobileTab, setMobileTab] = useState<MobileTab>("chart");
  const [bars, setBars] = useState<MarketBar[]>([]);
  const [quote, setQuote] = useState<MarketQuote | null>(null);
  const [signals, setSignals] = useState<CupHandleSignal[]>([]);
  const [regime, setRegime] = useState<RegimeGateResult | null>(null);
  const [fusedScore, setFusedScore] = useState<number | null>(null);
  const [tradeAllowed, setTradeAllowed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [lastScan, setLastScan] = useState<TelemetrySnapshot | null>(null);
  const [lastMarketFetch, setLastMarketFetch] = useState<MarketFetchSnapshot | null>(null);
  const [macro, setMacro] = useState<MacroPayload | null>(null);
  const [macroLoading, setMacroLoading] = useState(false);
  const [macroAlerts, setMacroAlerts] = useState<MacroAlert[]>([]);
  const [macroAlertsLoading, setMacroAlertsLoading] = useState(false);
  const [hitlOpen, setHitlOpen] = useState(false);
  const [hitlDecision, setHitlDecision] = useState<"pending" | "approved" | "rejected">("pending");
  const [requiresHitl, setRequiresHitl] = useState(false);
  const [hitlStatus, setHitlStatus] = useState("");

  const loadMacro = useCallback(async () => {
    setMacroLoading(true);
    setMacroAlertsLoading(true);
    try {
      const [macroRes, alertsRes] = await Promise.all([
        fetch(`${API}/macro`),
        fetch(`${API}/macro-alerts?limit=3`),
      ]);
      const data = (await macroRes.json()) as MacroPayload & { error?: string };
      if (!macroRes.ok) throw new Error(data.error || "Macro fetch failed");
      setMacro(data);

      const alertsData = (await alertsRes.json()) as MacroAlertsPayload & { error?: string };
      if (alertsRes.ok && alertsData.alerts?.length) {
        setMacroAlerts(alertsData.alerts);
      } else {
        setMacroAlerts(FALLBACK_MACRO_ALERTS);
      }
    } catch {
      setMacro(FALLBACK_MACRO);
      setMacroAlerts(FALLBACK_MACRO_ALERTS);
    } finally {
      setMacroLoading(false);
      setMacroAlertsLoading(false);
    }
  }, []);

  const loadMarket = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${API}/market?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}&range=1y`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Kunde inte hämta marknadsdata");
      setBars(data.bars || []);
      setQuote(data.quote || null);
      setLastMarketFetch({ symbol: data.symbol || symbol, at: new Date() });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Marknadsfel");
    } finally {
      setLoading(false);
    }
  }, [symbol, timeframe]);

  const runScan = useCallback(async () => {
    setScanning(true);
    setError("");
    try {
      const res = await fetch(
        `${API}/scan?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}&range=1y&min_confidence=0.5`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scan misslyckades");
      setSignals(data.signals || []);
      setRegime(data.regime ?? null);
      setFusedScore(typeof data.fused_score === "number" ? data.fused_score : null);
      setTradeAllowed(typeof data.trade_allowed === "boolean" ? data.trade_allowed : null);
      const needsHitl = data.requires_hitl === true;
      setRequiresHitl(needsHitl);
      if (needsHitl) {
        setHitlDecision("pending");
        setHitlStatus("");
        setHitlOpen(true);
      }
      setLastScan({
        symbol: data.symbol || symbol,
        signalCount: data.signal_count ?? (data.signals?.length ?? 0),
        barCount: data.bar_count ?? 0,
        regime: data.regime ?? null,
        ta: data.ta ?? null,
        fusedScore: typeof data.fused_score === "number" ? data.fused_score : null,
        tradeAllowed: typeof data.trade_allowed === "boolean" ? data.trade_allowed : null,
        at: new Date(),
      });
      if (!bars.length && data.bar_count) {
        await loadMarket();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scanfel");
    } finally {
      setScanning(false);
    }
  }, [symbol, timeframe, bars.length, loadMarket]);

  useEffect(() => {
    loadMarket().then(() => runScan());
    loadMacro();
  }, [symbol, timeframe]); // eslint-disable-line react-hooks/exhaustive-deps

  const topSignal = signals[0] ?? null;

  const value = useMemo(
    () => ({
      symbol,
      setSymbol,
      timeframe,
      setTimeframe,
      bars,
      quote,
      signals,
      topSignal,
      regime,
      fusedScore,
      tradeAllowed,
      loading,
      scanning,
      error,
      loadMarket,
      runScan,
      lastScan,
      lastMarketFetch,
      macro,
      macroLoading,
      loadMacro,
      macroAlerts,
      macroAlertsLoading,
      isMobile,
      isDark,
      mobileTab,
      setMobileTab,
      hitlOpen,
      setHitlOpen,
      hitlDecision,
      setHitlDecision,
      requiresHitl,
      hitlStatus,
      setHitlStatus,
    }),
    [
      symbol,
      timeframe,
      bars,
      quote,
      signals,
      topSignal,
      regime,
      fusedScore,
      tradeAllowed,
      loading,
      scanning,
      error,
      loadMarket,
      runScan,
      lastScan,
      lastMarketFetch,
      macro,
      macroLoading,
      loadMacro,
      macroAlerts,
      macroAlertsLoading,
      isMobile,
      isDark,
      mobileTab,
      hitlOpen,
      hitlDecision,
      requiresHitl,
      hitlStatus,
    ],
  );

  return <TradingContext.Provider value={value}>{children}</TradingContext.Provider>;
}

function HitlModalStub() {
  const {
    symbol,
    topSignal,
    fusedScore,
    tradeAllowed,
    hitlOpen,
    setHitlOpen,
    hitlDecision,
    setHitlDecision,
    setHitlStatus,
    hitlStatus,
  } = useTradingWorkspace();
  const [submitting, setSubmitting] = useState(false);

  const submitHitl = useCallback(
    async (decision: "approved" | "rejected") => {
      setSubmitting(true);
      setHitlStatus("");
      try {
        const res = await fetch(`${API}/hitl`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            symbol,
            decision,
            fusion_score: fusedScore ?? undefined,
          }),
        });
        const data = (await res.json()) as { error?: string; status?: string; ok?: boolean };
        if (!res.ok) throw new Error(data.error || "HITL submit failed");
        setHitlDecision(decision);
        setHitlStatus(data.status ? `Server: ${data.status}` : "Recorded");
      } catch (err) {
        setHitlStatus(err instanceof Error ? err.message : "Submit failed");
      } finally {
        setSubmitting(false);
      }
    },
    [symbol, fusedScore, setHitlDecision, setHitlStatus],
  );

  if (!hitlOpen) return null;

  const scorePct = fusedScore != null ? `${(fusedScore * 100).toFixed(0)}%` : "—";

  return (
    <div className="ate-hitl-backdrop" role="presentation" onClick={() => setHitlOpen(false)}>
      <div
        className="ate-hitl-modal"
        role="dialog"
        aria-labelledby="ate-hitl-title"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="ate-hitl-head">
          <h3 id="ate-hitl-title">Human-in-the-loop</h3>
          <span className="ate-trading-badge ate-telemetry-paper">PAPER</span>
        </header>
        <p className="ate-trading-muted">
          Risk gate review for <strong>{symbol}</strong> — decision posts to <code>/api/ate/hitl</code> (Temporal
          signals when worker is live).
        </p>
        <dl className="ate-hitl-summary mono">
          <div>
            <dt>Fused</dt>
            <dd>{scorePct}</dd>
          </div>
          <div>
            <dt>Gate</dt>
            <dd>{tradeAllowed ? "open" : "closed"}</dd>
          </div>
          <div>
            <dt>Invalidation</dt>
            <dd>{topSignal ? fmtPrice(topSignal.invalidation) : "—"}</dd>
          </div>
        </dl>
        {hitlDecision !== "pending" ? (
          <p className="ate-hitl-status mono" role="status">
            Decision: {hitlDecision}
          </p>
        ) : null}
        {hitlStatus ? (
          <p className="ate-hitl-status mono" role="status">
            {hitlStatus}
          </p>
        ) : null}
        <div className="ate-hitl-actions">
          <button
            type="button"
            className="room-btn"
            disabled={submitting}
            onClick={() => submitHitl("rejected")}
          >
            Reject
          </button>
          <button
            type="button"
            className="room-btn room-btn-primary"
            disabled={submitting}
            onClick={() => submitHitl("approved")}
          >
            {submitting ? "…" : "Approve paper"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function TradingWorkspaceShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <HitlModalStub />
    </>
  );
}

export function TradingToolbar({ compact }: { compact?: boolean }) {
  const {
    symbol,
    setSymbol,
    timeframe,
    setTimeframe,
    loading,
    scanning,
    loadMarket,
    runScan,
    isMobile,
    tradeAllowed,
    fusedScore,
    setHitlOpen,
    hitlDecision,
    requiresHitl,
  } = useTradingWorkspace();

  const showHitl = requiresHitl;

  return (
    <div className={`ate-trade-toolbar${compact ? " compact" : ""}`}>
      {isMobile ? (
        <div className="ate-mobile-symbol-pills" role="tablist" aria-label="Symbol">
          {WATCHLIST.map((w) => (
            <button
              key={w.symbol}
              type="button"
              role="tab"
              aria-selected={symbol === w.symbol}
              className={`ate-symbol-pill${symbol === w.symbol ? " active" : ""}`}
              onClick={() => setSymbol(w.symbol)}
            >
              {w.symbol.replace("-USD", "")}
            </button>
          ))}
        </div>
      ) : null}
      <div className="ate-trading-controls">
        {!isMobile ? (
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            aria-label="Symbol"
            className="ate-trading-select"
          >
            {WATCHLIST.map((w) => (
              <option key={w.symbol} value={w.symbol}>
                {w.symbol}
              </option>
            ))}
          </select>
        ) : null}
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          aria-label="Timeframe"
          className="ate-trading-select"
        >
          <option value="1d">1D</option>
          <option value="4h">4H</option>
          <option value="1h">1H</option>
        </select>
        <button type="button" className="room-btn ate-trading-refresh" onClick={loadMarket} disabled={loading}>
          {loading ? "…" : isMobile ? "↻" : "Uppdatera"}
        </button>
        <button type="button" className="room-btn room-btn-primary" onClick={runScan} disabled={scanning}>
          {scanning ? "…" : isMobile ? "Scan" : "Cup & Handle"}
        </button>
        {showHitl ? (
          <button
            type="button"
            className={`room-btn ate-hitl-trigger${hitlDecision === "pending" ? " blink" : ""}`}
            onClick={() => setHitlOpen(true)}
          >
            {isMobile ? "HITL" : "Review gate"}
          </button>
        ) : null}
        <span className="ate-trading-badge">PAPER</span>
      </div>
    </div>
  );
}

export function TradingSidePanel() {
  return (
    <div className="ate-trade-side-panel detail-panel">
      <header className="detail-panel-head">
        <h2>TRADE</h2>
      </header>
      <div className="detail-scroll">
        <TradingSideContent />
      </div>
    </div>
  );
}

function fmtDryUp(ratio: number | null | undefined): string {
  if (ratio == null) return "—";
  const pct = (ratio * 100).toFixed(0);
  return ratio < 0.85 ? `${pct}% · dry` : `${pct}%`;
}

function fmtMaStack(bullish: boolean | null | undefined): string {
  if (bullish == null) return "—";
  return bullish ? "bull stack" : "bear stack";
}

function TelemetrySubsection() {
  const { lastScan, lastMarketFetch, scanning, loading } = useTradingWorkspace();

  return (
    <div className="ate-telemetry-block">
      <h4 className="ate-telemetry-heading">Telemetry</h4>
      <dl className="ate-telemetry-feed">
        <div className="ate-telemetry-row">
          <dt>Last scan</dt>
          <dd className="mono">
            {lastScan ? (
              <>
                {lastScan.symbol} · {lastScan.signalCount} signal{lastScan.signalCount === 1 ? "" : "s"} ·{" "}
                {lastScan.barCount} bars
              </>
            ) : scanning ? (
              "Scanning…"
            ) : (
              "—"
            )}
          </dd>
        </div>
        <div className="ate-telemetry-row">
          <dt>Regime</dt>
          <dd className="mono">
            {lastScan?.regime ? (
              <>
                {lastScan.regime.regime}
                {lastScan.regime.adx != null ? ` · ADX ${lastScan.regime.adx.toFixed(1)}` : ""}
                {lastScan.regime.multiplier != null ? ` · ×${lastScan.regime.multiplier.toFixed(2)}` : ""}
              </>
            ) : scanning ? (
              "Classifying…"
            ) : (
              "—"
            )}
          </dd>
        </div>
        <div className="ate-telemetry-row">
          <dt>TA</dt>
          <dd className="mono">
            {lastScan?.ta ? (
              <>
                vol {fmtDryUp(lastScan.ta.volume_dry_up_ratio)} · {fmtMaStack(lastScan.ta.ma_stack_bullish)}
              </>
            ) : scanning ? (
              "Computing…"
            ) : (
              "—"
            )}
          </dd>
        </div>
        <div className="ate-telemetry-row">
          <dt>Fusion</dt>
          <dd className="mono">
            {lastScan?.fusedScore != null ? (
              <>
                {(lastScan.fusedScore * 100).toFixed(0)}%
                {lastScan.tradeAllowed != null ? (lastScan.tradeAllowed ? " · gate open" : " · gated") : ""}
              </>
            ) : scanning ? (
              "Fusing…"
            ) : (
              "—"
            )}
          </dd>
        </div>
        <div className="ate-telemetry-row">
          <dt>Market fetch</dt>
          <dd className="mono">
            {lastMarketFetch ? (
              <>
                {fmtTelemetryTime(lastMarketFetch.at)} · {lastMarketFetch.symbol}
              </>
            ) : loading ? (
              "Fetching…"
            ) : (
              "—"
            )}
          </dd>
        </div>
      </dl>
      <span className="ate-trading-badge ate-telemetry-paper">PAPER</span>
    </div>
  );
}

function MacroScoutSection() {
  const { macro, macroLoading, macroAlerts, macroAlertsLoading } = useTradingWorkspace();
  const data = macro ?? FALLBACK_MACRO;
  const alerts = macroAlerts.length ? macroAlerts : FALLBACK_MACRO_ALERTS;
  const isLive = data.source === "live" || data.source === "mixed";

  return (
    <section className="ate-trading-section ate-macro-scout" aria-labelledby="ate-macro-scout-heading">
      <div className="ate-macro-scout-head">
        <h3 id="ate-macro-scout-heading">Macro Scout</h3>
        <span className={`ate-macro-demo-badge${isLive ? " live" : ""}`}>{isLive ? "LIVE" : "MOCK"}</span>
      </div>
      <p className="ate-trading-muted ate-macro-scout-note">
        {macroLoading
          ? "Fetching Polymarket…"
          : isLive
            ? data.source === "mixed"
              ? "Polymarket Gamma · partial fallback · 5m cache"
              : "Polymarket Gamma · 5m cache"
            : "Demo quotes — Polymarket unreachable"}
      </p>
      <ul className="ate-macro-quotes">
        {data.quotes.map((q) => (
          <li key={q.label} className="ate-macro-quote">
            <span className="ate-macro-quote-label">{q.label}</span>
            <span className="ate-macro-quote-prob mono">{macroLoading ? "…" : `${q.prob}%`}</span>
          </li>
        ))}
      </ul>
      {alerts.length > 0 && (
        <ul className="ate-macro-alerts" aria-label="PM shift alerts">
          {alerts.slice(0, 3).map((a) => (
            <li key={a.marketId} className="ate-macro-alert">
              <span className={`ate-macro-tier ate-macro-tier-${a.tier}`}>{tierBadgeLabel(a.tier)}</span>
              <span className="ate-macro-alert-title">{a.title}</span>
              <span className="ate-macro-alert-shift mono">
                {macroAlertsLoading ? "…" : `${a.probShift >= 0 ? "+" : ""}${(a.probShift * 100).toFixed(0)}%`}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="ate-macro-whale mono">
        <span className="ate-macro-whale-tag">Whale</span>
        {data.whale.amount} · wallet {data.whale.pnl}
        {data.whale.source === "mock" ? " · demo" : ""}
      </p>
    </section>
  );
}

export function TradingSideContent() {
  const { symbol, setSymbol, signals, macro, topSignal } = useTradingWorkspace();
  const macroLive = macro?.source === "live" || macro?.source === "mixed";

  return (
    <>
      <section className="ate-trading-section">
        <h3>Watchlist</h3>
        <ul className="ate-watchlist">
          {WATCHLIST.map((w) => (
            <li key={w.symbol}>
              <button
                type="button"
                className={`ate-watchlist-item${symbol === w.symbol ? " active" : ""}`}
                onClick={() => setSymbol(w.symbol)}
              >
                <span className="ate-watchlist-symbol">{w.symbol}</span>
                <span className="ate-watchlist-label">{w.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="ate-trading-section">
        <h3>Signaler</h3>
        {signals.length === 0 ? (
          <p className="ate-trading-muted">Inga cup-and-handle kandidater över tröskel.</p>
        ) : (
          <ul className="ate-signal-list">
            {signals.slice(0, 8).map((s, i) => (
              <li key={`${s.ticker}-${i}`} className="ate-signal-card">
                <div className="ate-signal-head">
                  <strong>{s.ticker}</strong>
                  <span className="ate-signal-conf mono">{(s.breakout_confidence * 100).toFixed(1)}%</span>
                </div>
                <div className="ate-signal-meta mono">
                  <span>inv {fmtPrice(s.invalidation)}</span>
                  <span>klassisk</span>
                </div>
                <div className="ate-signal-bar" aria-hidden>
                  <span style={{ width: `${s.fused_score * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <MacroScoutSection />

      <section className="ate-trading-section ate-trading-lanes">
        <h3>Lanes</h3>
        <ul className="ate-lane-status">
          <li className={`active classical${topSignal ? "" : ""}`}>
            <span>Classical</span>
            <em>{topSignal ? "live" : "idle"}</em>
          </li>
          <li className={topSignal && topSignal.vision_score > 0 ? "active" : ""}>
            <span>Vision</span>
            <em>{topSignal && topSignal.vision_score > 0 ? "stub" : "soon"}</em>
          </li>
          <li className={topSignal && topSignal.sequence_prob > 0 ? "active" : ""}>
            <span>Sequence</span>
            <em>{topSignal && topSignal.sequence_prob > 0 ? "stub" : "soon"}</em>
          </li>
          <li className={`macro${macroLive ? " active" : ""}`}>
            <span>Macro</span>
            <em>{macroLive ? "live" : "stub"}</em>
          </li>
        </ul>
        <TelemetrySubsection />
      </section>
    </>
  );
}

export function TradingMainPanel() {
  const {
    quote,
    topSignal,
    fusedScore,
    error,
    isMobile,
    isDark,
    mobileTab,
    setMobileTab,
    signals,
  } = useTradingWorkspace();

  const chartHeight = isMobile ? 220 : 300;

  if (isMobile) {
    return (
      <div className="ate-trading-mobile-stack">
        <TradingToolbar compact />
        {error ? <p className="room-error ate-trading-error">{error}</p> : null}
        <div className="ate-trading-mobile-tabs" role="tablist" aria-label="TRADE-vyer">
          {(
            [
              ["chart", "Chart"],
              ["signals", `Signaler${signals.length ? ` (${signals.length})` : ""}`],
              ["watch", "Lista"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={mobileTab === id}
              className={`ate-trading-mobile-tab${mobileTab === id ? " active" : ""}`}
              onClick={() => setMobileTab(id)}
            >
              {label}
            </button>
          ))}
        </div>
        {mobileTab === "watch" ? (
          <div className="ate-trading-mobile-pane">
            <TradingSideContent />
          </div>
        ) : null}
        {mobileTab === "signals" ? (
          <div className="ate-trading-mobile-pane">
            <TradingSideContent />
          </div>
        ) : null}
        {mobileTab === "chart" ? <TradingChartBlock height={chartHeight} /> : null}
      </div>
    );
  }

  return (
    <div className="ate-trade-main-panel">
      <TradingToolbar compact />
      {error ? <p className="room-error ate-trading-error">{error}</p> : null}
      <TradingChartBlock height={chartHeight} />
      {topSignal ? (
        <div className="ate-signal-hero ate-signal-hero-compact">
          <p>
            <strong>{topSignal.ticker}</strong> · {(topSignal.breakout_confidence * 100).toFixed(1)}% classical · inv{" "}
            <span className="mono">{fmtPrice(topSignal.invalidation)}</span>
          </p>
          <span className="ate-signal-hero-score mono">
            {fusedScore != null ? `${(fusedScore * 100).toFixed(0)}%` : `${(topSignal.fused_score * 100).toFixed(0)}%`}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function TradingChartBlock({ height }: { height: number }) {
  const { bars, quote, topSignal, regime, macro, fusedScore, tradeAllowed, isDark } = useTradingWorkspace();
  const macroLane = macroScore(macro);
  const regimeBanner = regimeBannerMessage(regime);
  const displayFused = fusedScore ?? topSignal?.fused_score ?? null;

  return (
    <>
      {quote ? (
        <div className="ate-quote-strip">
          <div className="ate-quote-primary">
            <strong className="mono">{fmtPrice(quote.price)}</strong>
            <span className={`ate-quote-change${quote.change >= 0 ? " up" : " down"}`}>
              {quote.change >= 0 ? "+" : ""}
              {fmtPrice(quote.change)} ({quote.changePct >= 0 ? "+" : ""}
              {fmtPrice(quote.changePct)}%)
            </span>
          </div>
          <div className="ate-quote-stats mono">
            <span>H {fmtPrice(quote.high)}</span>
            <span>L {fmtPrice(quote.low)}</span>
          </div>
        </div>
      ) : null}

      {regimeBanner ? (
        <div className="ate-regime-banner" role="status">
          {regimeBanner}
        </div>
      ) : null}

      <div className="ate-chart-wrap">
        <TradingChart bars={bars} invalidation={topSignal?.invalidation ?? null} isDark={isDark} height={height} />
      </div>

      {topSignal ? (
        <div className="ate-fusion-strip" aria-label="Signal fusion weights">
          {displayFused != null ? (
            <div className="ate-fusion-total" role="status">
              <label>
                <span>Fused</span>
                <span className="mono">
                  {(displayFused * 100).toFixed(0)}%
                  {tradeAllowed != null ? (tradeAllowed ? " · open" : " · gated") : ""}
                </span>
              </label>
              <div className="ate-fusion-bar ate-fusion-bar-total">
                <span style={{ width: `${displayFused * 100}%` }} />
              </div>
            </div>
          ) : null}
          <div className="ate-fusion-lane classical">
            <label>
              <span>Classical</span>
              <span className="mono">{(topSignal.breakout_confidence * 100).toFixed(0)}%</span>
            </label>
            <div className="ate-fusion-bar">
              <span style={{ width: `${topSignal.breakout_confidence * 100}%` }} />
            </div>
          </div>
          <div className="ate-fusion-lane vision">
            <label>
              <span>Vision</span>
              <span className="mono">{(topSignal.vision_score * 100).toFixed(0)}%</span>
            </label>
            <div className="ate-fusion-bar">
              <span style={{ width: `${Math.max(topSignal.vision_score * 100, 2)}%` }} />
            </div>
          </div>
          <div className="ate-fusion-lane sequence">
            <label>
              <span>Sequence</span>
              <span className="mono">{(topSignal.sequence_prob * 100).toFixed(0)}%</span>
            </label>
            <div className="ate-fusion-bar">
              <span style={{ width: `${Math.max(topSignal.sequence_prob * 100, 2)}%` }} />
            </div>
          </div>
          <div className="ate-fusion-lane macro">
            <label>
              <span>Macro</span>
              <span className="mono">{(macroLane * 100).toFixed(0)}%</span>
            </label>
            <div className="ate-fusion-bar">
              <span style={{ width: `${Math.max(macroLane * 100, 2)}%` }} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
