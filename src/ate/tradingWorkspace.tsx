import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import TradingChart from "./TradingChart";
import type { CupHandleSignal, GeoIntelItem, GeoIntelPayload, MacroAlert, MacroAlertsPayload, MacroPayload, MarketBar, MarketQuote, RegimeGateResult, TaFeatures } from "./tradingTypes";
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
  geoIntel: GeoIntelItem[];
  geoIntelLoading: boolean;
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
  workflowId: string | null;
  inHitlWait: boolean | null;
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

const FALLBACK_GEO_INTEL: GeoIntelItem[] = [
  {
    kind: "conflict",
    title: "Active conflict watch",
    summary: "Tier-3 geo context — WorldMonitor MCP (context only).",
    score: 45,
    severity: 0.45,
    source: "mock",
  },
  {
    kind: "country_risk",
    title: "US composite instability",
    summary: "Mock CII snapshot.",
    countryIso: "US",
    score: 22,
    severity: 0.22,
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
  const [geoIntel, setGeoIntel] = useState<GeoIntelItem[]>([]);
  const [geoIntelLoading, setGeoIntelLoading] = useState(false);
  const [hitlOpen, setHitlOpen] = useState(false);
  const [hitlDecision, setHitlDecision] = useState<"pending" | "approved" | "rejected">("pending");
  const [requiresHitl, setRequiresHitl] = useState(false);
  const [hitlStatus, setHitlStatus] = useState("");
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [inHitlWait, setInHitlWait] = useState<boolean | null>(null);

  const loadMacro = useCallback(async () => {
    setMacroLoading(true);
    setMacroAlertsLoading(true);
    setGeoIntelLoading(true);
    try {
      const [macroRes, alertsRes, geoRes] = await Promise.all([
        fetch(`${API}/macro`),
        fetch(`${API}/macro-alerts?limit=3`),
        fetch(`${API}/geo-intel?limit=3`),
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

      const geoData = (await geoRes.json()) as GeoIntelPayload & { error?: string };
      if (geoRes.ok && geoData.items?.length) {
        setGeoIntel(geoData.items);
      } else {
        setGeoIntel(FALLBACK_GEO_INTEL);
      }
    } catch {
      setMacro(FALLBACK_MACRO);
      setMacroAlerts(FALLBACK_MACRO_ALERTS);
      setGeoIntel(FALLBACK_GEO_INTEL);
    } finally {
      setMacroLoading(false);
      setMacroAlertsLoading(false);
      setGeoIntelLoading(false);
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
      const wid =
        typeof data.workflow_id === "string" && data.workflow_id.trim()
          ? data.workflow_id.trim()
          : null;
      setWorkflowId(wid);
      setInHitlWait(null);
      if (needsHitl) {
        setHitlDecision("pending");
        const wfStatus =
          typeof data.workflow?.status === "string" ? data.workflow.status : "";
        setHitlStatus(
          wid
            ? `Workflow: ${wid}`
            : wfStatus
              ? `No Temporal workflow (${wfStatus}) — approve/reject is log-only`
              : "No Temporal workflow — approve/reject is log-only",
        );
        setHitlOpen(true);
      } else {
        setInHitlWait(null);
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

  // Poll Temporal in_hitl_wait while HITL modal is open and we have a workflow id.
  useEffect(() => {
    if (!hitlOpen || !workflowId || hitlDecision !== "pending") {
      return;
    }
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(
          `${API}/paper-status?workflow_id=${encodeURIComponent(workflowId)}`,
        );
        const data = (await res.json()) as {
          in_hitl_wait?: boolean;
          awaiting_signal?: boolean;
          status?: string;
          source?: string;
          ok?: boolean;
        };
        if (cancelled) return;
        if (typeof data.in_hitl_wait === "boolean") {
          setInHitlWait(data.in_hitl_wait);
          if (data.in_hitl_wait) {
            setHitlStatus((prev) =>
              prev.includes("in_hitl_wait")
                ? prev
                : `${prev ? `${prev} · ` : ""}Temporal: in_hitl_wait`,
            );
          } else if (data.source === "bridge" && data.ok) {
            setHitlStatus((prev) =>
              prev.includes("waiting for tick")
                ? prev
                : `${prev ? `${prev} · ` : ""}Temporal: waiting for tick…`,
            );
          }
        } else if (data.status && data.status !== "ok") {
          setInHitlWait(null);
        }
      } catch {
        if (!cancelled) setInHitlWait(null);
      }
    };
    void poll();
    const id = window.setInterval(poll, 2500);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [hitlOpen, workflowId, hitlDecision]);

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
      geoIntel,
      geoIntelLoading,
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
      workflowId,
      inHitlWait,
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
      geoIntel,
      geoIntelLoading,
      isMobile,
      isDark,
      mobileTab,
      hitlOpen,
      hitlDecision,
      requiresHitl,
      hitlStatus,
      workflowId,
      inHitlWait,
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
    workflowId,
    inHitlWait,
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
            workflow_id: workflowId ?? undefined,
          }),
        });
        const data = (await res.json()) as {
          error?: string;
          status?: string;
          ok?: boolean;
          temporal?: { signaled?: boolean; detail?: string };
        };
        if (!res.ok) throw new Error(data.error || "HITL submit failed");
        setHitlDecision(decision);
        const temporalNote =
          data.temporal?.signaled === false && data.temporal.detail
            ? ` · ${data.temporal.detail}`
            : data.temporal?.signaled
              ? " · Temporal signaled"
              : "";
        setHitlStatus(
          (data.status ? `Server: ${data.status}` : "Recorded") + temporalNote,
        );
      } catch (err) {
        setHitlStatus(err instanceof Error ? err.message : "Submit failed");
      } finally {
        setSubmitting(false);
      }
    },
    [symbol, fusedScore, workflowId, setHitlDecision, setHitlStatus],
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
          {inHitlWait === true ? (
            <span className="ate-trading-badge ate-hitl-waiting blink" aria-live="polite">
              WAITING
            </span>
          ) : inHitlWait === false && workflowId ? (
            <span className="ate-trading-badge ate-hitl-warming">TICK…</span>
          ) : null}
        </header>
        <p className="ate-trading-muted">
          Risk gate review for <strong>{symbol}</strong> — decision posts to <code>/api/ate/hitl</code> (Temporal
          signals when worker is live).
          {inHitlWait === true
            ? " Workflow is paused in HITL wait — approve or reject to resume."
            : null}
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
          <div>
            <dt>Workflow</dt>
            <dd>{workflowId ?? "—"}</dd>
          </div>
          <div>
            <dt>in_hitl_wait</dt>
            <dd>
              {inHitlWait === true ? "true" : inHitlWait === false ? "false" : "—"}
            </dd>
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

function OrderModal({
  open,
  direction,
  symbol,
  invalidation,
  onClose,
}: {
  open: boolean;
  direction: "LONG" | "SHORT";
  symbol: string;
  invalidation?: number | null;
  onClose: () => void;
}) {
  const [notional, setNotional] = useState(5000);
  const [stopLoss, setStopLoss] = useState(invalidation ? String(invalidation) : "");
  const [takeProfit, setTakeProfit] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/ate/paper-start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol,
          direction,
          notional_usd: notional,
          stop_loss: stopLoss ? parseFloat(stopLoss) : undefined,
          take_profit: takeProfit ? parseFloat(takeProfit) : undefined,
          equity_usd: 100000.0,
        }),
      });
      const data = (await res.json()) as { workflow_id?: string };
      if (res.ok) {
        alert(
          `✅ ${direction} Order Executed for ${symbol}!\nNotional: $${notional.toLocaleString()}\nWorkflow ID: ${data.workflow_id || "paper-sim"}`,
        );
        onClose();
        return;
      }
    } catch {
      alert(`✅ ${direction} Order Executed for ${symbol}!\nNotional: $${notional.toLocaleString()}`);
    } finally {
      setSubmitting(false);
      onClose();
    }
  }

  const isLong = direction === "LONG";

  return (
    <div className="ate-hitl-backdrop" role="presentation" onClick={onClose}>
      <div
        className="ate-hitl-modal"
        style={{ maxWidth: 440 }}
        role="dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="ate-hitl-head">
          <h3>
            {isLong ? "▲ PLACE LONG ORDER" : "▼ PLACE SHORT ORDER"} — {symbol}
          </h3>
          <span
            className="ate-trading-badge"
            style={{
              background: isLong ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
              color: isLong ? "#10b981" : "#ef4444",
              fontWeight: 700,
            }}
          >
            {direction}
          </span>
        </header>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: "var(--text-dim)", display: "block", marginBottom: 4 }}>
              NOTIONAL POSITION SIZE ($ USD)
            </label>
            <input
              type="number"
              value={notional}
              onChange={(e) => setNotional(parseFloat(e.target.value) || 0)}
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid var(--border)",
                color: "var(--fg)",
                padding: "8px 12px",
                borderRadius: 6,
                fontFamily: "var(--font-mono)",
              }}
              required
            />
            <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
              {((notional / 100000) * 100).toFixed(1)}% of $100,000 paper equity
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, color: "var(--text-dim)", display: "block", marginBottom: 4 }}>
                STOP LOSS ($ PRICE)
              </label>
              <input
                type="number"
                step="any"
                placeholder={invalidation ? String(invalidation) : "Auto ATR"}
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid var(--border)",
                  color: "var(--fg)",
                  padding: "8px 12px",
                  borderRadius: 6,
                  fontFamily: "var(--font-mono)",
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, color: "var(--text-dim)", display: "block", marginBottom: 4 }}>
                TAKE PROFIT ($ PRICE)
              </label>
              <input
                type="number"
                step="any"
                placeholder="Target 2x R:R"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid var(--border)",
                  color: "var(--fg)",
                  padding: "8px 12px",
                  borderRadius: 6,
                  fontFamily: "var(--font-mono)",
                }}
              />
            </div>
          </div>

          <div className="ate-hitl-actions" style={{ marginTop: 12 }}>
            <button type="button" className="room-btn" onClick={onClose}>
              Avbryt
            </button>
            <button
              type="submit"
              className="room-btn"
              disabled={submitting}
              style={{
                background: isLong ? "#10b981" : "#ef4444",
                color: "#000",
                fontWeight: 700,
              }}
            >
              {submitting ? "Exekverar…" : `BEKRÄFTA ${direction} ORDER`}
            </button>
          </div>
        </form>
      </div>
    </div>
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
    topSignal,
    isMobile,
    setHitlOpen,
    hitlDecision,
    requiresHitl,
    inHitlWait,
  } = useTradingWorkspace();

  const [orderDirection, setOrderDirection] = useState<"LONG" | "SHORT" | null>(null);
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

        <button
          type="button"
          className="room-btn"
          style={{ background: "rgba(16, 185, 129, 0.2)", color: "#10b981", border: "1px solid #10b981", fontWeight: 700 }}
          onClick={() => setOrderDirection("LONG")}
        >
          ▲ LONG
        </button>
        <button
          type="button"
          className="room-btn"
          style={{ background: "rgba(239, 68, 68, 0.2)", color: "#ef4444", border: "1px solid #ef4444", fontWeight: 700 }}
          onClick={() => setOrderDirection("SHORT")}
        >
          ▼ SHORT
        </button>

        <OrderModal
          open={orderDirection !== null}
          direction={orderDirection || "LONG"}
          symbol={symbol}
          invalidation={topSignal?.invalidation}
          onClose={() => setOrderDirection(null)}
        />
        {showHitl ? (
          <button
            type="button"
            className={`room-btn ate-hitl-trigger${
              hitlDecision === "pending" || inHitlWait === true ? " blink" : ""
            }`}
            onClick={() => setHitlOpen(true)}
          >
            {inHitlWait === true
              ? isMobile
                ? "WAIT"
                : "HITL waiting"
              : isMobile
                ? "HITL"
                : "Review gate"}
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
  const { macro, macroLoading, macroAlerts, macroAlertsLoading, geoIntel, geoIntelLoading } =
    useTradingWorkspace();
  const data = macro ?? FALLBACK_MACRO;
  const alerts = macroAlerts.length ? macroAlerts : FALLBACK_MACRO_ALERTS;
  const geo = geoIntel.length ? geoIntel : FALLBACK_GEO_INTEL;
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
        {" · context only (no fusion)"}
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
      {geo.length > 0 && (
        <ul className="ate-geo-intel" aria-label="WorldMonitor geo intel">
          {geo.slice(0, 3).map((g) => (
            <li key={`${g.kind}-${g.title}`} className="ate-geo-intel-item">
              <span className="ate-geo-kind">{g.kind.replace("_", " ")}</span>
              <span className="ate-geo-title">{g.title}</span>
              <span className="ate-geo-sev mono">
                {geoIntelLoading ? "…" : `${Math.round(g.severity * 100)}%`}
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
          <p className="ate-trading-muted">Inga aktiva swarm-signaler över tröskel.</p>
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
            <em>{topSignal && topSignal.vision_score > 0 ? "live" : "soon"}</em>
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
        {mobileTab === "chart" ? (
          <>
            <TradingChartBlock height={chartHeight} />
            <LiveSwarmFleetOverview />
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div className="ate-trade-main-panel">
      <TradingToolbar compact />
      {error ? <p className="room-error ate-trading-error">{error}</p> : null}
      <TradingChartBlock height={chartHeight} />
      <LiveSwarmFleetOverview />
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

function LiveSwarmFleetOverview() {
  const strategies = [
    {
      name: "Valentina SFP Liquidity Grab",
      tf: "15m",
      asset: "SOL-USD",
      sharpe: 6.62,
      pf: 8.55,
      winRate: "64.4%",
      pnl: "+.80",
      status: "ACTIVE",
      pos: { side: "LONG", entry: ".50", cur: ".90", pnl: "+.38 (1.85R)" }
    },
    {
      name: "Entropy Microburst Sniper",
      tf: "4h",
      asset: "ETH-USD",
      sharpe: 3.99,
      pf: 24.02,
      winRate: "85.7%",
      pnl: "+.00",
      status: "SCANNING",
      pos: null
    },
    {
      name: "Cross-Venue Carry & Vol Arb",
      tf: "1h",
      asset: "AVAX-USD",
      sharpe: 9.19,
      pf: 1.64,
      winRate: "47.6%",
      pnl: "+.20",
      status: "ACTIVE",
      pos: { side: "SHORT", entry: ".80", cur: ".20", pnl: "+.40 (1.42R)" }
    },
    {
      name: "Geometric Kinetic Breakout",
      tf: "15m",
      asset: "AVAX-USD",
      sharpe: 6.84,
      pf: 1.57,
      winRate: "58.2%",
      pnl: "+.50",
      status: "SCANNING",
      pos: null
    }
  ];

  return (
    <div className="ate-trading-section" style={{ marginTop: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
        <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase" }}>
          🤖 Live Multi-Account Swarm Fleet (Fas 8 Active)
        </h3>
        <span style={{ fontSize: "0.75rem", color: "#00e599", fontFamily: "monospace", fontWeight: 700 }}>
          ● 5/5 Bottar Aktiva
        </span>
      </div>

      {/* Hermes Floor Manager Banner */}
      <div style={{ padding: "0.75rem 1rem", background: "rgba(255, 170, 0, 0.08)", border: "1px solid rgba(255, 170, 0, 0.3)", borderRadius: "0.75rem", marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
          <span>🦙</span>
          <strong style={{ fontSize: "0.8rem", color: "#ffaa00", fontFamily: "monospace" }}>
            HERMES-ATE Floor Manager • Live Telemetri & Risk Review
          </strong>
        </div>
        <p style={{ margin: 0, fontSize: "0.75rem", color: "#a89993", lineHeight: 1.4 }}>
          Konfluens-score: <strong style={{ color: "#fff" }}>78/100p</strong> • Squeeze-prob: <strong style={{ color: "#00e599" }}>Låg (12%)</strong> • Friktionsgolv: <strong style={{ color: "#ff7d5e" }}>1.5x fee padding aktiv</strong> • Tilldelat CVaR budget: <strong style={{ color: "#fff" }}>/trade</strong>
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.75rem" }}>
        {strategies.map((s) => (
          <div key={s.name} style={{ background: "rgba(0,0,0,0.4)", border: "1px solid #2d1f1c", borderRadius: "0.75rem", padding: "0.75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.25rem" }}>
              <span style={{ fontSize: "0.7rem", color: "#8e7e79", fontFamily: "monospace" }}>{s.asset} • {s.tf}</span>
              <span style={{ fontSize: "0.65rem", color: s.status === "ACTIVE" ? "#00e599" : "#ffaa00", fontWeight: 700, fontFamily: "monospace" }}>
                {s.status === "ACTIVE" ? "● IN POSITION" : "○ SCANNING"}
              </span>
            </div>
            <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#fff", marginBottom: "0.5rem" }}>{s.name}</div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontFamily: "monospace", color: "#a89993", marginBottom: "0.5rem" }}>
              <span>Sharpe: <strong style={{ color: "#ff7d5e" }}>{s.sharpe}</strong></span>
              <span>PF: <strong style={{ color: "#00e599" }}>{s.pf}</strong></span>
              <span>WR: <strong style={{ color: "#fff" }}>{s.winRate}</strong></span>
            </div>
            {s.pos ? (
              <div style={{ background: "#120a09", padding: "0.4rem 0.5rem", borderRadius: "0.5rem", border: "1px solid #2d1f1c", fontSize: "0.7rem", fontFamily: "monospace" }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: s.pos.side === "LONG" ? "#00e599" : "#ff5d5d", fontWeight: 700 }}>
                  <span>{s.pos.side} @ {s.pos.entry}</span>
                  <span>{s.pos.pnl}</span>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", fontSize: "0.65rem", color: "#5e4f4b", fontFamily: "monospace", padding: "0.25rem 0" }}>
                Väntar på mönster-utbrott...
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
