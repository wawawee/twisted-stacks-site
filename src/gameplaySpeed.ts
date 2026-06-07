import { clamp } from "./math";
import type { LevelProfile } from "./levels";

export type GameDifficulty = "casual" | "hardcore" | "impossible";

export interface AiTrackingParams {
  trackingAlpha: number;
  aiSpeedFactor: number;
  predictionLead: number;
  trackingNoise: number;
}

export function computeLevelStartSpeed(
  baseSpeed: number,
  difficulty: GameDifficulty,
  speedBonus: number,
): number {
  if (difficulty === "casual") {
    return 292 + speedBonus * 0.75;
  }
  if (difficulty === "impossible") {
    return 500 + speedBonus * 1.15;
  }
  return baseSpeed + 58 + speedBonus;
}

export function computeGameplaySpeed(
  baseSpeed: number,
  difficulty: GameDifficulty,
  profile: LevelProfile,
  gameplayElapsedMs: number,
): number {
  let diffBase = baseSpeed + 58;
  let compoundingRate = 1.026;

  if (difficulty === "casual") {
    diffBase = 292;
    compoundingRate = 1.015;
  } else if (difficulty === "impossible") {
    diffBase = 500;
    compoundingRate = 1.055;
  }

  diffBase += profile.speedBonus;
  compoundingRate += profile.compoundBonus;

  const exponentMultiplier = Math.pow(compoundingRate, gameplayElapsedMs / 5000);
  return diffBase * exponentMultiplier;
}

export function computePointMultiplier(
  baseSpeed: number,
  currentSpeed: number,
  currentLevel: number,
): number {
  return Math.max(1, Math.floor(1 + (currentSpeed - baseSpeed) / 180 + (currentLevel - 1) * 0.35));
}

export function computeAiTrackingParams(
  difficulty: GameDifficulty,
  currentLevel: number,
  maxLevel: number,
  profile: LevelProfile,
): AiTrackingParams {
  const levelPressure = clamp((currentLevel - 1) / (maxLevel - 1), 0, 1);
  let trackingAlpha = 0.08 + profile.aiTrackingBonus;
  let aiSpeedFactor = 0.65 + profile.aiSpeedBonus + levelPressure * 0.12;
  let predictionLead = 0.035 + levelPressure * 0.13;
  let trackingNoise = 22 - levelPressure * 16;

  if (difficulty === "casual") {
    trackingAlpha = 0.055 + profile.aiTrackingBonus * 0.65;
    aiSpeedFactor = 0.45 + profile.aiSpeedBonus * 0.7;
    predictionLead *= 0.55;
    trackingNoise += 8;
  } else if (difficulty === "impossible") {
    trackingAlpha = 0.15 + profile.aiTrackingBonus * 1.2;
    aiSpeedFactor = 0.85 + profile.aiSpeedBonus * 1.15;
    predictionLead *= 1.45;
    trackingNoise *= 0.45;
  }

  return {
    trackingAlpha,
    aiSpeedFactor,
    predictionLead,
    trackingNoise,
  };
}

export function computeAiTargetOffset(
  ballX: number,
  ballY: number,
  ballVx: number,
  ballVy: number,
  params: AiTrackingParams,
  timeNow: number,
  currentLevel: number,
): { targetY: number; targetX: number } {
  const aiNoiseY = Math.sin(timeNow * 0.0027 + currentLevel) * params.trackingNoise;
  const aiNoiseX = Math.cos(timeNow * 0.0023 + currentLevel * 1.7) * params.trackingNoise;
  return {
    targetY: ballY + (ballVx > 0 ? ballVy * params.predictionLead : 0) + aiNoiseY,
    targetX: ballX + (ballVy > 0 ? ballVx * params.predictionLead : 0) + aiNoiseX,
  };
}
