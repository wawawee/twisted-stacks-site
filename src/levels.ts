/**
 * Nine-level ramp for TWISTED PONGG — speed, AI, and monsters scale together.
 */

export const MAX_LEVEL = 9;

export const CHAMPION_STORAGE_KEY = "twisted_pongg_champion_v1";

export interface LevelProfile {
  level: number;
  codename: string;
  speedBonus: number;
  compoundBonus: number;
  aiTrackingBonus: number;
  aiSpeedBonus: number;
  monsterCount: 0 | 2 | 3 | 4;
  monsterShotScale: number;
  wobbleScale: number;
  /**
   * If true, the level's brick field is laid out as bitmap text
   * (e.g. "TWISTED" / "STACKS") instead of a random/dense pattern.
   * Currently only Level 1 (DRIFT) uses this to brand the opening round.
   */
  textLayout?: boolean;
}

export const LEVEL_PROFILES: LevelProfile[] = [
  { level: 1, codename: "DRIFT", speedBonus: 0, compoundBonus: 0, aiTrackingBonus: 0, aiSpeedBonus: 0, monsterCount: 0, monsterShotScale: 1, wobbleScale: 1, textLayout: true },
  { level: 2, codename: "RALLY", speedBonus: 72, compoundBonus: 0.0028, aiTrackingBonus: 0.02, aiSpeedBonus: 0.06, monsterCount: 2, monsterShotScale: 0.9, wobbleScale: 1.08 },
  { level: 3, codename: "HEAT", speedBonus: 128, compoundBonus: 0.0045, aiTrackingBonus: 0.034, aiSpeedBonus: 0.085, monsterCount: 2, monsterShotScale: 0.84, wobbleScale: 1.16 },
  { level: 4, codename: "PRESSURE", speedBonus: 188, compoundBonus: 0.0062, aiTrackingBonus: 0.045, aiSpeedBonus: 0.105, monsterCount: 3, monsterShotScale: 0.78, wobbleScale: 1.24 },
  { level: 5, codename: "SURGE", speedBonus: 250, compoundBonus: 0.0078, aiTrackingBonus: 0.054, aiSpeedBonus: 0.125, monsterCount: 3, monsterShotScale: 0.72, wobbleScale: 1.32 },
  { level: 6, codename: "SPIRAL", speedBonus: 316, compoundBonus: 0.0092, aiTrackingBonus: 0.062, aiSpeedBonus: 0.142, monsterCount: 3, monsterShotScale: 0.66, wobbleScale: 1.4 },
  { level: 7, codename: "VORTEX", speedBonus: 382, compoundBonus: 0.0106, aiTrackingBonus: 0.07, aiSpeedBonus: 0.16, monsterCount: 4, monsterShotScale: 0.6, wobbleScale: 1.48 },
  { level: 8, codename: "OVERDRIVE", speedBonus: 454, compoundBonus: 0.012, aiTrackingBonus: 0.078, aiSpeedBonus: 0.176, monsterCount: 4, monsterShotScale: 0.54, wobbleScale: 1.56 },
  { level: 9, codename: "NINE DOWN", speedBonus: 532, compoundBonus: 0.0135, aiTrackingBonus: 0.087, aiSpeedBonus: 0.195, monsterCount: 4, monsterShotScale: 0.48, wobbleScale: 1.66 },
];

export function getLevelProfile(level: number): LevelProfile {
  const idx = Math.max(0, Math.min(MAX_LEVEL - 1, Math.floor(level) - 1));
  return LEVEL_PROFILES[idx];
}

export function levelClearTypography(level: number): [string, string] {
  return ["LEVEL", String(level)];
}
