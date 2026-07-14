import React, { useCallback, useEffect, useState } from "react";
import TradingChart from "./TradingChart";
import type { CupHandleSignal, MarketBar, MarketQuote } from "./tradingTypes";
import { WATCHLIST } from "./tradingTypes";

const API = "/api/ate";

interface TradingPanelProps {
  memberId: string | null;
  isDark: boolean;
  onToggleTheme: () => void;
  onExit?: () => void;
}

function fmt(n: number, digits = 2) {
  return n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export default function TradingPanel({ memberId, isDark, onToggleTheme, onExit }: TradingPanelProps) {
  const [symbol, setSymbol] = useState("SPY");
  const [timeframe, setTimeframe] = useState("1d");
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
  const watchlistQuotes = WATCHLIST;

  return (
    <div className="ate-trading-panel">
      <header className="ate-trading-head">
        <div className="ate-trading-brand">
          <div className="ate-trading-brand-row">
            <h2>ATE</h2>
            <span className="ate-trading-badge">PAPER</span>
            {memberId ? <span className="ate-trading-user mono">{memberId}</span> : null}
          </div>
          <p className="ate-trading-tagline">Agentic Trading Engine</p>
        </div>
        <div className="ate-trading-head-actions">
          <div className="ate-trading-controls">
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              aria-label="Symbol"
              className="ate-trading-select"
            >
              {watchlistQuotes.map((w) => (
                <option key={w.symbol} value={w.symbol}>
                  {w.symbol}
                </option>
              ))}
            </select>
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
            <button type="button" className="room-btn" onClick={loadMarket} disabled={loading}>
              {loading ? "…" : "Uppdatera"}
            </button>
            <button type="button" className="room-btn room-btn-primary" onClick={runScan} disabled={scanning}>
              {scanning ? "Scannar…" : "Cup & Handle"}
            </button>
          </div>
          <button
            type="button"
            className="room-theme-toggle"
            onClick={onToggleTheme}
            aria-pressed={isDark}
            aria-label={isDark ? "Light mode" : "Dark mode"}
          >
            <span className={`room-theme-knob${!isDark ? " dark" : ""}`} />
            <span className="room-theme-label">{isDark ? "Light" : "Dark"}</span>
          </button>
          {onExit ? (
            <button type="button" className="room-btn room-btn-muted ate-trading-exit" onClick={onExit}>
              ← Colab
            </button>
          ) : null}
        </div>
      </header>

      {error ? <p className="room-error ate-trading-error">{error}</p> : null}

      <div className="ate-trading-layout">
        <aside className="ate-trading-sidebar">
          <section className="ate-trading-section">
            <h3>Watchlist</h3>
            <ul className="ate-watchlist">
              {watchlistQuotes.map((w) => (
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
                {signals.slice(0, 5).map((s, i) => (
                  <li key={`${s.ticker}-${i}`} className="ate-signal-card">
                    <div className="ate-signal-head">
                      <strong>{s.ticker}</strong>
                      <span className="ate-signal-conf mono">{(s.breakout_confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div className="ate-signal-meta mono">
                      <span>inv {fmt(s.invalidation)}</span>
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
                <span>Paper exec</span>
                <em>phase 5</em>
              </li>
            </ul>
          </section>
        </aside>

        <main className="ate-trading-main">
          {quote ? (
            <div className="ate-quote-strip">
              <div className="ate-quote-primary">
                <strong className="mono">{fmt(quote.price)}</strong>
                <span className={`ate-quote-change${quote.change >= 0 ? " up" : " down"}`}>
                  {quote.change >= 0 ? "+" : ""}
                  {fmt(quote.change)} ({quote.changePct >= 0 ? "+" : ""}
                  {fmt(quote.changePct)}%)
                </span>
              </div>
              <div className="ate-quote-stats mono">
                <span>H {fmt(quote.high)}</span>
                <span>L {fmt(quote.low)}</span>
                <span>Vol {(quote.volume / 1e6).toFixed(2)}M</span>
                <span>{bars.length} bars</span>
              </div>
            </div>
          ) : null}

          <div className="ate-chart-wrap">
            <TradingChart
              bars={bars}
              invalidation={topSignal?.invalidation ?? null}
              isDark={isDark}
            />
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

          {topSignal ? (
            <div className="ate-signal-hero">
              <div>
                <h4>Cup & Handle — {topSignal.ticker}</h4>
                <p>
                  Klassisk lane: <strong>{(topSignal.breakout_confidence * 100).toFixed(1)}%</strong> breakout-confidence.
                  Invalidering under <span className="mono">{fmt(topSignal.invalidation)}</span>.
                  Vision och sequence väntar på Phase 2–3.
                </p>
              </div>
              <div className="ate-signal-hero-score mono">
                <span>{(topSignal.fused_score * 100).toFixed(0)}</span>
                <small>fused</small>
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
