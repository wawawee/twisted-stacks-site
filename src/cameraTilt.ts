import { clamp } from "./math";
import { GameState } from "./types";

const TILT_PITCH_MAX = 0.28;
const TILT_YAW_MAX = 0.26;
const TILT_ROLL_MAX = 0.24;
const TILT_NINE_PITCH_MAX = 0.5;
const TILT_NINE_YAW_MAX = 0.46;
const TILT_NINE_ROLL_MAX = 0.44;

function clampCameraTilt(
  pitch: number,
  yaw: number,
  roll: number,
  pitchMax: number,
  yawMax: number,
  rollMax: number,
): [number, number, number] {
  return [
    clamp(pitch, -pitchMax, pitchMax),
    clamp(yaw, -yawMax, yawMax),
    clamp(roll, -rollMax, rollMax),
  ];
}

export interface CameraTiltInput {
  timeNow: number;
  dt: number;
  currentState: GameState;
  currentLevel: number;
  maxLevel: number;
  currentSpeed: number;
  gameplayStartTime: number;
  wobbleScale: number;
  mouseX: number;
  mouseY: number;
  width: number;
  height: number;
  cameraZoomOut: number;
}

export interface CameraTiltResult {
  pitchAngle: number;
  yawAngle: number;
  twistAngle: number;
  targetZoomOut: number;
  cameraZoomOut: number;
}

export function computeCameraTilt(input: CameraTiltInput): CameraTiltResult {
  const {
    timeNow,
    dt,
    currentState,
    currentLevel,
    maxLevel,
    currentSpeed,
    gameplayStartTime,
    wobbleScale,
    mouseX,
    mouseY,
    width,
    height,
    cameraZoomOut,
  } = input;

  const gameplayElapsed = currentState === GameState.GAMEPLAY ? timeNow - gameplayStartTime : 0;
  const levelPressure = currentState === GameState.GAMEPLAY
    ? clamp((currentLevel - 1) / (maxLevel - 1), 0, 1)
    : 0;
  const speedPressure = currentState === GameState.GAMEPLAY
    ? clamp((currentSpeed - 360) / 1150, 0, 1)
    : 0;
  const lateTwistPressure = currentLevel >= 7 ? clamp((currentLevel - 6) / 3, 0, 1) : 0;
  const midTwistPressure = currentLevel >= 4 && currentLevel < 7
    ? clamp((currentLevel - 3) / 3, 0, 1)
    : 0;
  const earlySpinCap = currentLevel < 7
    ? 0.16 + levelPressure * 0.22 + midTwistPressure * 0.28
    : 1;
  const worldTwistScale = currentState === GameState.GAMEPLAY
    ? 0.85 + wobbleScale * 0.12
    : 1;
  const twistRamp = currentState === GameState.GAMEPLAY
    ? Math.min(
        earlySpinCap,
        clamp(levelPressure * 0.46 + speedPressure * 0.24 + gameplayElapsed / 180000, 0, 1),
      ) * worldTwistScale
    : 0;
  const isNineDown = currentLevel >= maxLevel && currentState === GameState.GAMEPLAY;
  const mirrorPressure = currentLevel >= 8 && !isNineDown
    ? clamp(0.18 + speedPressure * 0.25, 0, 0.5)
    : 0;
  const nineDownRamp = isNineDown
    ? clamp(0.55 + speedPressure * 0.45 + Math.min(gameplayElapsed / 85000, 0.45), 0, 1)
    : 0;
  const gameplayActive = currentState === GameState.GAMEPLAY;
  const depthTiltRamp = gameplayActive
    ? clamp(
        0.16 + levelPressure * 0.34 + speedPressure * 0.24 + lateTwistPressure * 0.18 + midTwistPressure * 0.12,
        0,
        1,
      ) * worldTwistScale
    : 0;
  const mouseTiltPitch = mouseY * (gameplayActive ? 0.1 : 0.04);
  const mouseTiltYaw = mouseX * (gameplayActive ? 0.088 : 0.032);
  const planarSpin = Math.sin(timeNow * (0.00022 + levelPressure * 0.0002)) * twistRamp * TILT_ROLL_MAX * (0.55 + lateTwistPressure * 0.45);
  const inversionDrift = mirrorPressure * TILT_ROLL_MAX * (0.65 + 0.35 * Math.sin(timeNow * 0.00011));

  const nineDownWobbleRoll = Math.sin(timeNow * (0.00034 + speedPressure * 0.00008));
  const nineDownWobblePitch = Math.cos(timeNow * 0.00029 + 0.7);
  const nineDownWobbleYaw = Math.sin(timeNow * 0.00025 + 1.2);
  const parallaxFade = 1 - nineDownRamp * 0.5;

  let twistAngle = planarSpin + inversionDrift;
  let pitchAngle = mouseTiltPitch + Math.sin(timeNow * 0.00031) * depthTiltRamp * TILT_PITCH_MAX;
  let yawAngle = mouseTiltYaw + Math.cos(timeNow * 0.00023 + Math.PI / 4) * depthTiltRamp * TILT_YAW_MAX;
  if (isNineDown) {
    twistAngle = nineDownWobbleRoll * TILT_NINE_ROLL_MAX * nineDownRamp + planarSpin * (1 - nineDownRamp) * 0.2;
    pitchAngle = mouseTiltPitch * parallaxFade + nineDownWobblePitch * TILT_NINE_PITCH_MAX * nineDownRamp;
    yawAngle = mouseTiltYaw * parallaxFade + nineDownWobbleYaw * TILT_NINE_YAW_MAX * nineDownRamp;
  }

  const pitchMax = isNineDown
    ? TILT_NINE_PITCH_MAX
    : TILT_PITCH_MAX + depthTiltRamp * 0.08;
  const yawMax = isNineDown
    ? TILT_NINE_YAW_MAX
    : TILT_YAW_MAX + depthTiltRamp * 0.06;
  const rollMax = isNineDown
    ? TILT_NINE_ROLL_MAX
    : TILT_ROLL_MAX + twistRamp * 0.06 + mirrorPressure * 0.08;
  [pitchAngle, yawAngle, twistAngle] = clampCameraTilt(
    pitchAngle,
    yawAngle,
    twistAngle,
    pitchMax,
    yawMax,
    rollMax,
  );

  const absCos = Math.abs(Math.cos(twistAngle));
  const absSin = Math.abs(Math.sin(twistAngle));
  const aspect = width / height;
  const rotatedFit = Math.max(absCos + (1 / aspect) * absSin, absCos + aspect * absSin);
  const depthFit = 1 + depthTiltRamp * 0.12 + Math.max(Math.abs(pitchAngle), Math.abs(yawAngle)) * 0.28;
  const targetZoomOut = Math.min(
    isNineDown ? 2.45 : 2.35,
    rotatedFit * depthFit + twistRamp * 0.06 + mirrorPressure * 0.1 + nineDownRamp * 0.14 + 0.06,
  );

  let nextZoomOut = cameraZoomOut;
  if (Math.abs(targetZoomOut - cameraZoomOut) > 0.003) {
    nextZoomOut = cameraZoomOut + (targetZoomOut - cameraZoomOut) * Math.min(1, dt * 5);
  }

  return {
    pitchAngle,
    yawAngle,
    twistAngle,
    targetZoomOut,
    cameraZoomOut: nextZoomOut,
  };
}
