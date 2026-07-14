import React, { useEffect, useRef } from "react";
import type { MarketBar } from "./tradingTypes";
import { mountTradingChart, readChartTheme } from "./tradingChartLib";

interface TradingChartProps {
  bars: MarketBar[];
  invalidation?: number | null;
  isDark?: boolean;
  height?: number;
}

export default function TradingChart({ bars, invalidation, isDark, height = 320 }: TradingChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || bars.length < 2) return;

    const theme = readChartTheme(el);
    return mountTradingChart(el, bars, theme, invalidation, height);
  }, [bars, invalidation, isDark, height]);

  if (bars.length < 2) {
    return <div className="ate-chart-empty">Ingen marknadsdata än — välj symbol och uppdatera.</div>;
  }

  return (
    <div
      ref={containerRef}
      className="ate-trading-chart-lwc"
      style={{ height }}
      aria-label="OHLCV candlestick chart"
    />
  );
}
