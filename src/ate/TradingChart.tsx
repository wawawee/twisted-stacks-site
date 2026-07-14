import React, { useEffect, useRef } from "react";
import type { MarketBar } from "./tradingTypes";

interface TradingChartProps {
  bars: MarketBar[];
  invalidation?: number | null;
  height?: number;
}

export default function TradingChart({ bars, invalidation, height = 280 }: TradingChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || bars.length < 2) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const pad = { top: 12, right: 12, bottom: 28, left: 52 };
    const plotW = width - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;

    const highs = bars.map((b) => b.high);
    const lows = bars.map((b) => b.low);
    let yMin = Math.min(...lows);
    let yMax = Math.max(...highs);
    if (invalidation != null) {
      yMin = Math.min(yMin, invalidation);
      yMax = Math.max(yMax, invalidation);
    }
    const yPad = (yMax - yMin) * 0.06 || 1;
    yMin -= yPad;
    yMax += yPad;

    const xAt = (i: number) => pad.left + (i / Math.max(bars.length - 1, 1)) * plotW;
    const yAt = (v: number) => pad.top + plotH - ((v - yMin) / (yMax - yMin)) * plotH;

    const styles = getComputedStyle(canvas);
    const border = styles.getPropertyValue("--border").trim() || "#ccc";
    const accent = styles.getPropertyValue("--accent").trim() || "#c9a227";
    const success = styles.getPropertyValue("--success").trim() || "#2d6a4f";
    const muted = styles.getPropertyValue("--text-muted").trim() || "rgba(0,0,0,0.45)";

    ctx.clearRect(0, 0, width, height);

    // grid
    ctx.strokeStyle = border;
    ctx.lineWidth = 1;
    for (let g = 0; g <= 4; g++) {
      const y = pad.top + (plotH / 4) * g;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + plotW, y);
      ctx.stroke();
      const price = yMax - ((yMax - yMin) * g) / 4;
      ctx.fillStyle = muted;
      ctx.font = "10px ui-monospace, monospace";
      ctx.textAlign = "right";
      ctx.fillText(price.toFixed(2), pad.left - 6, y + 3);
    }

    // volume bars (bottom strip)
    const maxVol = Math.max(...bars.map((b) => b.volume), 1);
    const volH = plotH * 0.15;
    for (let i = 0; i < bars.length; i++) {
      const vh = (bars[i].volume / maxVol) * volH;
      const x = xAt(i);
      const bw = Math.max(plotW / bars.length - 1, 1);
      ctx.fillStyle = bars[i].close >= bars[i].open ? `${success}55` : `${accent}44`;
      ctx.fillRect(x - bw / 2, pad.top + plotH - vh, bw, vh);
    }

    // candlesticks
    const candleW = Math.max(plotW / bars.length - 1.5, 2);
    for (let i = 0; i < bars.length; i++) {
      const b = bars[i];
      const x = xAt(i);
      const up = b.close >= b.open;
      ctx.strokeStyle = up ? success : accent;
      ctx.fillStyle = up ? success : accent;

      ctx.beginPath();
      ctx.moveTo(x, yAt(b.high));
      ctx.lineTo(x, yAt(b.low));
      ctx.stroke();

      const bodyTop = yAt(Math.max(b.open, b.close));
      const bodyBot = yAt(Math.min(b.open, b.close));
      const bodyH = Math.max(bodyBot - bodyTop, 1);
      if (up) {
        ctx.strokeRect(x - candleW / 2, bodyTop, candleW, bodyH);
      } else {
        ctx.fillRect(x - candleW / 2, bodyTop, candleW, bodyH);
      }
    }

    // invalidation line
    if (invalidation != null) {
      const y = yAt(invalidation);
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = accent;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + plotW, y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = accent;
      ctx.font = "10px ui-monospace, monospace";
      ctx.textAlign = "left";
      ctx.fillText(`inv ${invalidation.toFixed(2)}`, pad.left + 4, y - 4);
    }

    // x labels (sparse)
    ctx.fillStyle = muted;
    ctx.font = "10px ui-monospace, monospace";
    ctx.textAlign = "center";
    const step = Math.ceil(bars.length / 6);
    for (let i = 0; i < bars.length; i += step) {
      const d = new Date(bars[i].ts);
      const label = `${d.getMonth() + 1}/${String(d.getFullYear()).slice(2)}`;
      ctx.fillText(label, xAt(i), height - 8);
    }
  }, [bars, invalidation, height]);

  if (bars.length < 2) {
    return <div className="ate-chart-empty">Ingen marknadsdata än — välj symbol och uppdatera.</div>;
  }

  return <canvas ref={canvasRef} className="ate-trading-chart" style={{ height }} aria-label="OHLCV chart" />;
}
