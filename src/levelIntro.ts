import { getLevelProfile } from "./levels";

export const LEVEL_INTRO_DURATION_MS = 1650;

const LEVEL_INTRO_COLORS = [
  0xa855f7,
  0x06b6d4,
  0xeab308,
  0x22c55e,
  0xf97316,
  0xec4899,
  0x8b5cf6,
  0xf43f5e,
  0xffd700,
];

export function getLevelIntroLines(level: number): [string, string, string] {
  const profile = getLevelProfile(level);
  return ["LEVEL", String(level), profile.codename];
}

export function getLevelIntroColor(level: number): number {
  return LEVEL_INTRO_COLORS[Math.max(0, Math.floor(level) - 1) % LEVEL_INTRO_COLORS.length];
}

export function levelIntroOverlayOpacity(timeNow: number, startedAt: number): number {
  const t = Math.min(1, Math.max(0, (timeNow - startedAt) / LEVEL_INTRO_DURATION_MS));
  if (t < 0.14) return t / 0.14;
  if (t > 0.72) return Math.max(0, (1 - t) / 0.28);
  return 1;
}

export function levelIntroWeirdOffset(
  timeNow: number,
  meshIndex: number,
  startedAt: number,
): { z: number; rotZ: number; opacity: number; scale: number } {
  const t = Math.min(1, (timeNow - startedAt) / LEVEL_INTRO_DURATION_MS);
  const fade = 1 - t * 0.85;
  const curtain = levelIntroOverlayOpacity(timeNow, startedAt);
  return {
    z: 52 + Math.sin(timeNow * 0.009 + meshIndex * 0.65) * (1.5 + fade * 2.5),
    rotZ: Math.sin(timeNow * 0.012 + meshIndex * 0.9) * 0.1 * fade,
    opacity: (0.72 + Math.sin(timeNow * 0.02 + meshIndex * 1.4) * 0.18) * curtain,
    scale: 0.94 + Math.sin(timeNow * 0.015 + meshIndex) * 0.04 * fade,
  };
}
