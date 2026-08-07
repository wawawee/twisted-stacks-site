import {
  ColorType,
  createChart,
  CrosshairMode,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type LineData,
  type HistogramData,
  type UTCTimestamp,
} from "lightweight-charts";
import type { MarketBar } from "./tradingTypes";

export interface ChartTheme {
  background: string;
  text: string;
  grid: string;
  border: string;
  bull: string;
  bear: string;
  accent: string;
}

export function readChartTheme(el: HTMLElement | null): ChartTheme {
  const root = el?.closest(".ate-root") ?? document.documentElement;
  const s = getComputedStyle(root);
  return {
    background: s.getPropertyValue("--surface").trim() || "#141414",
    text: s.getPropertyValue("--fg").trim() || "#eee",
    grid: s.getPropertyValue("--divider").trim() || "#333",
    border: s.getPropertyValue("--border").trim() || "#eee",
    bull: s.getPropertyValue("--bull").trim() || "#10b981",
    bear: s.getPropertyValue("--bear").trim() || "#ef4444",
    accent: s.getPropertyValue("--accent").trim() || "#00f2fe",
  };
}

export function barsToCandles(bars: MarketBar[]): CandlestickData[] {
  return bars.map((b) => ({
    time: (Math.floor(new Date(b.ts).getTime() / 1000) as UTCTimestamp),
    open: b.open,
    high: b.high,
    low: b.low,
    close: b.close,
  }));
}

export function computeEmaSeries(bars: MarketBar[], period: number): LineData[] {
  if (bars.length < period) return [];
  const k = 2 / (period + 1);
  let ema = bars[0].close;
  const result: LineData[] = [];
  for (let i = 0; i < bars.length; i++) {
    const close = bars[i].close;
    ema = i === 0 ? close : close * k + ema * (1 - k);
    if (i >= period - 1) {
      result.push({
        time: (Math.floor(new Date(bars[i].ts).getTime() / 1000) as UTCTimestamp),
        value: ema,
      });
    }
  }
  return result;
}

export function computeKrystSeries(bars: MarketBar[]): LineData[] {
  if (bars.length < 15) return [];
  const closes = bars.map((b) => b.close);
  const rsi: number[] = [];

  // RSI(14)
  let gains = 0, losses = 0;
  for (let i = 1; i <= 14; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  let avgGain = gains / 14;
  let avgLoss = losses / 14;
  rsi[14] = 100 - 100 / (1 + (avgLoss === 0 ? 100 : avgGain / avgLoss));

  for (let i = 15; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    avgGain = (avgGain * 13 + (diff > 0 ? diff : 0)) / 14;
    avgLoss = (avgLoss * 13 + (diff < 0 ? -diff : 0)) / 14;
    rsi[i] = 100 - 100 / (1 + (avgLoss === 0 ? 100 : avgGain / avgLoss));
  }

  const result: LineData[] = [];
  for (let i = 20; i < bars.length; i++) {
    const rsiFull = rsi[i] || 50;
    const rsiMom = rsiFull - (rsi[i - 9] || rsiFull);
    const krystVal = (rsiMom + rsiFull) / 2 + 20;

    result.push({
      time: (Math.floor(new Date(bars[i].ts).getTime() / 1000) as UTCTimestamp),
      value: Math.max(0, Math.min(100, krystVal)),
    });
  }
  return result;
}

export function mountTradingChart(
  container: HTMLElement,
  bars: MarketBar[],
  theme: ChartTheme,
  invalidation?: number | null,
  height = 360,
): () => void {
  const chart: IChartApi = createChart(container, {
    width: container.clientWidth,
    height,
    layout: {
      background: { type: ColorType.Solid, color: theme.background },
      textColor: theme.text,
      fontFamily: '"JetBrains Mono", ui-monospace, monospace',
      fontSize: 11,
    },
    grid: {
      vertLines: { color: theme.grid, style: 1 },
      horzLines: { color: theme.grid, style: 1 },
    },
    crosshair: { mode: CrosshairMode.Normal },
    rightPriceScale: { borderColor: theme.border },
    timeScale: { borderColor: theme.border, timeVisible: true },
  });

  // 1. Main Candlestick Series
  const series: ISeriesApi<"Candlestick"> = chart.addCandlestickSeries({
    upColor: theme.bull,
    downColor: theme.bear,
    borderUpColor: theme.bull,
    borderDownColor: theme.bear,
    wickUpColor: theme.bull,
    wickDownColor: theme.bear,
  });
  series.setData(barsToCandles(bars));

  // 2. Trend EMA Lines (EMA 20 & EMA 50)
  const ema20 = chart.addLineSeries({ color: "#00f2fe", lineWidth: 1, title: "EMA 20" });
  ema20.setData(computeEmaSeries(bars, 20));

  const ema50 = chart.addLineSeries({ color: "#8b5cf6", lineWidth: 1, title: "EMA 50" });
  ema50.setData(computeEmaSeries(bars, 50));

  // 3. Invalidation / Stop-Loss Price Line
  if (invalidation != null) {
    series.createPriceLine({
      price: invalidation,
      color: theme.accent,
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: "INVALIDATION",
    });
  }

  // 4. KRYSTULATOR (KRSTR) Oscillator Indicator Line
  const krystSeries = chart.addLineSeries({
    color: "#f59e0b",
    lineWidth: 2,
    priceScaleId: "kryst",
    title: "KRYSTULATOR (KRSTR)",
  });
  krystSeries.setData(computeKrystSeries(bars));

  // Configure KRYSTULATOR scale bounds & horizontal OB/OS levels
  chart.priceScale("kryst").applyOptions({
    scaleMargins: { top: 0.75, bottom: 0 },
  });

  krystSeries.createPriceLine({ price: 70, color: "#ef4444", lineWidth: 1, lineStyle: LineStyle.Dotted, title: "OB 70" });
  krystSeries.createPriceLine({ price: 30, color: "#10b981", lineWidth: 1, lineStyle: LineStyle.Dotted, title: "OS 30" });

  chart.timeScale().fitContent();

  const ro = new ResizeObserver(() => {
    chart.applyOptions({ width: container.clientWidth });
  });
  ro.observe(container);

  return () => {
    ro.disconnect();
    chart.remove();
  };
}
