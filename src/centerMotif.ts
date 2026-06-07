import { clamp } from "./math";

export interface MotifBrickSpec {
  row: number;
  col: number;
  localX: number;
  localY: number;
  colorIndex: number;
}

export interface MotifLayoutSpec {
  pattern: string[];
  palette: number[];
  block: number;
  gap: number;
}

const MOTIF_PATTERNS: string[][] = [
  [
    "...XXX...",
    "..XXXXX..",
    ".XXXXXXX.",
    "..XX.XX..",
    "...XXX...",
    "..XX.XX..",
    ".XXXXXXX.",
    "..XXXXX..",
    "...XXX...",
  ],
  [
    "....X....",
    "....X....",
    "....X....",
    "XXXXXXXXX",
    "....X....",
    "....X....",
    "....X....",
    "..XXXXX..",
    "...XXX...",
  ],
  [
    ".XXXXXXX.",
    "XX.....XX",
    "X..XXX..X",
    "X.X...X.X",
    "X..XXX..X",
    "XX.....XX",
    ".XXXXXXX.",
    "...XXX...",
    "..X...X..",
  ],
  [
    "..XXXXX..",
    ".XXXXXXX.",
    "XXX.X.XXX",
    "XXXX.XXXX",
    "XXX.X.XXX",
    ".XXXXXXX.",
    "..XXXXX..",
    "...XXX...",
    "..X...X..",
  ],
  [
    "....X....",
    "...XXX...",
    "..XXXXX..",
    ".XXXXXXX.",
    "XXXX.XXXX",
    ".XXXXXXX.",
    "..XXXXX..",
    "...XXX...",
    "....X....",
  ],
  [
    "...XXX...",
    "..XXXXX..",
    ".XX...XX.",
    ".XX...XX.",
    ".XXXXXXX.",
    ".XX...XX.",
    ".XX...XX.",
    "..XXXXX..",
    "...XXX...",
  ],
  [
    "X.......X",
    ".X.....X.",
    "..X...X..",
    "...X.X...",
    "....X....",
    "...X.X...",
    "..X...X..",
    ".X.....X.",
    "X.......X",
  ],
  [
    ".XXXXXXX.",
    "XX.XXX.XX",
    "X..XXX..X",
    "X.XX.XX.X",
    "X.XX.XX.X",
    "X..XXX..X",
    "XX.XXX.XX",
    ".XXXXXXX.",
    "..X...X..",
  ],
  [
    "XXXXXXXXX",
    "X.XXXXX.X",
    "XX.XXX.XX",
    "XXX.X.XXX",
    "XXXX.XXXX",
    "XXX.X.XXX",
    "XX.XXX.XX",
    "X.XXXXX.X",
    "XXXXXXXXX",
  ],
];

const MOTIF_PALETTES: number[][] = [
  [0xa855f7, 0x06b6d4, 0xeab308],
  [0x22c55e, 0x14b8a6, 0xfacc15],
  [0xf97316, 0xec4899, 0x8b5cf6],
  [0x06b6d4, 0x3b82f6, 0xf472b6],
  [0xeab308, 0xef4444, 0xa855f7],
  [0x10b981, 0x6366f1, 0xf59e0b],
  [0x8b5cf6, 0x22d3ee, 0xf43f5e],
  [0xf43f5e, 0xa855f7, 0x22c55e],
  [0xffd700, 0xef4444, 0x06b6d4],
];

export function getMotifLayoutSpec(level: number, width: number, height: number): MotifLayoutSpec {
  const idx = clamp(Math.floor(level) - 1, 0, MOTIF_PATTERNS.length - 1);
  const block = Math.max(10, Math.min(14, Math.floor(Math.min(width, height) / 52)));
  return {
    pattern: MOTIF_PATTERNS[idx],
    palette: MOTIF_PALETTES[idx],
    block,
    gap: 2,
  };
}

export function buildMotifBrickSpecs(layout: MotifLayoutSpec): MotifBrickSpec[] {
  const { pattern, block, gap } = layout;
  const cols = pattern[0].length;
  const rows = pattern.length;
  const totalW = cols * block + (cols - 1) * gap;
  const totalH = rows * block + (rows - 1) * gap;
  const specs: MotifBrickSpec[] = [];

  pattern.forEach((row, r) => {
    [...row].forEach((cell, c) => {
      if (cell !== "X") return;
      specs.push({
        row: r,
        col: c,
        localX: -totalW / 2 + c * (block + gap) + block / 2,
        localY: totalH / 2 - r * (block + gap) - block / 2,
        colorIndex: (r + c) % 3,
      });
    });
  });

  return specs;
}

export function computeMotifRotation(
  timeNow: number,
  level: number,
  gameplayElapsedMs: number,
): number {
  if (level < 4) return 0;
  const speed = level >= 9
    ? 0.00014
    : level >= 7
      ? 0.0001
      : 0.00006;
  const ramp = clamp(gameplayElapsedMs / 45000, 0, 1);
  return (timeNow * speed + ramp * 0.6) * Math.PI * 2;
}

export function shouldTriggerMotifMirrorFlip(
  level: number,
  timeNow: number,
  lastFlipAt: number,
  aliveRatio: number,
): boolean {
  if (level < 8 || aliveRatio <= 0.12) return false;
  const cooldown = level >= 9 ? 16000 : 22000;
  if (timeNow - lastFlipAt < cooldown) return false;
  return Math.random() < (level >= 9 ? 0.018 : 0.012);
}

export function getMotifMirrorBurstTilt(
  burstUntil: number,
  timeNow: number,
  mirrorSign: number,
): { pitch: number; yaw: number; roll: number; scaleX: number } {
  if (timeNow >= burstUntil) {
    return { pitch: 0, yaw: 0, roll: 0, scaleX: mirrorSign };
  }
  const t = 1 - (burstUntil - timeNow) / 1200;
  const spin = Math.sin(t * Math.PI) * mirrorSign;
  return {
    pitch: spin * 0.42,
    yaw: spin * 0.55,
    roll: spin * 0.35,
    scaleX: mirrorSign * (0.85 + t * 0.15),
  };
}

export function getMotifBrickWorldPosition(
  localX: number,
  localY: number,
  rotation: number,
  mirrorSign: number,
): { x: number; y: number } {
  const mx = localX * mirrorSign;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  return {
    x: mx * cos - localY * sin,
    y: mx * sin + localY * cos,
  };
}
