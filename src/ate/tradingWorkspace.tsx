import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import TradingChart from "./TradingChart";
import type { CupHandleSignal, MarketBar, MarketQuote } from "./tradingTypes";
import { WATCHLIST } from "./tradingTypes";

const API = "/api/ate";

export function fmtPrice(n: number, digits = 2) {
  return n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

type MobileTab = "chart" | "signals" | "watch";

interface TradingContextValue {
  symbol: string;
  setSymbol: (s: string) => void;
  timeframe: string;
  setTimeframe: (s: string) => void;
  bars: MarketBar[];
  quote: MarketQuote | null;
  signals: CupHandleSignal[];
  topSignal: CupHandleSignal | null;
  loading: boolean;
  scanning: boolean;
  error: string;
  loadMarket: () => Promise<void>;
  runScan: () => Promise<void>;
  isMobile: boolean;
  isDark: boolean;
  mobileTab: MobileTab;
  setMobileTab: (t: MobileTab) => void;
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
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");

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
      loading,
      scanning,
      error,
      loadMarket,
      runScan,
      isMobile,
      isDark,
      mobileTab,
      setMobileTab,
    }),
    [
      symbol,
      timeframe,
      bars,
      quote,
      signals,
      topSignal,
      loading,
      scanning,
      error,
      loadMarket,
      runScan,
      isMobile,
      isDark,
      mobileTab,
    ],
  );

  return <TradingContext.Provider value={value}>{children}</TradingContext.Provider>;
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
  } = useTradingWorkspace();

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
        <span className="ate-trading-badge">PAPER</span>
      </div>
    </div>
  );
}

export function TradingSidePanel() {
  const { symbol, setSymbol, signals } = useTradingWorkspace();
  return (
    <div className="ate-trade-side-panel detail-panel">
      <header className="detail-panel-head">
        <h2>TRADE</h2>
      </header>
      <div className="detail-scroll">
        <TradingSideContent symbol={symbol} setSymbol={setSymbol} signals={signals} />
      </div>
    </div>
  );
}

export function TradingSideContent({
  symbol,
  setSymbol,
  signals,
}: {
  symbol: string;
  setSymbol: (s: string) => void;
  signals: CupHandleSignal[];
}) {
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

      <section className="ate-trading-section ate-trading-lanes">
        <h3>Lanes</h3>
        <ul className="ate-lane-status">
          <li className="active">
            <span>Cup & Handle</span>
            <em>live</em>
          </li>
          <li>
            <span>Vision</span>
            <em>phase 2</em>
          </li>
          <li>
            <span>Fusion</span>
            <em>phase 3</em>
          </li>
          <li>
            <span>Telemetry</span>
            <em>soon</em>
          </li>
        </ul>
      </section>
    </>
  );
}

export function TradingMainPanel() {
  const {
    bars,
    quote,
    topSignal,
    error,
    isMobile,
    isDark,
    mobileTab,
    setMobileTab,
    symbol,
    setSymbol,
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
            <TradingSideContent symbol={symbol} setSymbol={setSymbol} signals={signals} />
          </div>
        ) : null}
        {mobileTab === "signals" ? (
          <div className="ate-trading-mobile-pane">
            <TradingSideContent symbol={symbol} setSymbol={setSymbol} signals={signals} />
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
          <span className="ate-signal-hero-score mono">{(topSignal.fused_score * 100).toFixed(0)}%</span>
        </div>
      ) : null}
    </div>
  );
}

function TradingChartBlock({ height }: { height: number }) {
  const { bars, quote, topSignal, isDark } = useTradingWorkspace();

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

      <div className="ate-chart-wrap">
        <TradingChart bars={bars} invalidation={topSignal?.invalidation ?? null} isDark={isDark} height={height} />
      </div>

      {topSignal ? (
        <div className="ate-fusion-strip" aria-label="Signal fusion weights">
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
        </div>
      ) : null}
    </>
  );
}
