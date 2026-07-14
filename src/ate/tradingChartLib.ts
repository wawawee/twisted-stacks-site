import { ColorType, createChart, CrosshairMode, LineStyle, type IChartApi, type ISeriesApi, type CandlestickData, type UTCTimestamp } from "lightweight-charts";
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
    bull: s.getPropertyValue("--bull").trim() || "#3d9968",
    bear: s.getPropertyValue("--bear").trim() || "#e85d4c",
    accent: s.getPropertyValue("--accent").trim() || "#c9a227",
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

export function mountTradingChart(
  container: HTMLElement,
  bars: MarketBar[],
  theme: ChartTheme,
  invalidation?: number | null,
  height = 320,
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

  const series: ISeriesApi<"Candlestick"> = chart.addCandlestickSeries({
    upColor: theme.bull,
    downColor: theme.bear,
    borderUpColor: theme.bull,
    borderDownColor: theme.bear,
    wickUpColor: theme.bull,
    wickDownColor: theme.bear,
  });

  series.setData(barsToCandles(bars));

  if (invalidation != null) {
    series.createPriceLine({
      price: invalidation,
      color: theme.accent,
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: "invalidation",
    });
  }

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
