import { clamp } from "./math";

export const CURVE_SPIN_MAX = 0.4;
export const CURVE_SPIN_DECAY = 3.4;
export const CURVE_FORCE = 0.44;
export const CURVE_HIT_GAIN = 0.2;
export const RACKET_DEFLECTION_MAX = 0.18;
export const RACKET_MOTION_DEFLECTION = 0.14;
export const BALL_GLINT_DECAY = 5.6;
export const MAX_BOUNCE_SHIFT = Math.PI / 4;
export const CORNER_COMBO_WINDOW_MS = 1250;
export const PANIC_SAVE_DISTANCE = 54;

export interface BallState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  curveSpin: number;
  glint: number;
  glintColor: number;
}

export function createBallState(glintColor: number): BallState {
  return {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    curveSpin: 0,
    glint: 0,
    glintColor,
  };
}

export function randomLaunchVelocity(speed: number): { vx: number; vy: number } {
  let angle = Math.random() * Math.PI * 2;
  while (
    Math.abs(Math.cos(angle)) < 0.25 ||
    Math.abs(Math.sin(angle)) < 0.25
  ) {
    angle = Math.random() * Math.PI * 2;
  }

  return {
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
  };
}

export function resetBallMotion(ball: BallState): void {
  ball.x = 0;
  ball.y = 0;
  ball.curveSpin = 0;
  ball.glint = 0;
}

export function curveForceScale(isGameplay: boolean, currentLevel: number): number {
  if (!isGameplay || currentLevel < 5) return 1;
  return 1 + clamp((currentLevel - 4) / 5, 0, 1) * 0.22;
}

export function integrateBallCurve(
  ball: BallState,
  dt: number,
  currentSpeed: number,
  isGameplay: boolean,
  currentLevel: number,
): void {
  if (Math.abs(ball.curveSpin) <= 0.004) return;

  const velLen = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
  if (velLen > 60) {
    const perpX = -ball.vy / velLen;
    const perpY = ball.vx / velLen;
    const curveAccel = ball.curveSpin * currentSpeed * CURVE_FORCE * curveForceScale(isGameplay, currentLevel);
    ball.vx += perpX * curveAccel * dt;
    ball.vy += perpY * curveAccel * dt;
  }

  ball.curveSpin *= Math.exp(-CURVE_SPIN_DECAY * dt);
  if (Math.abs(ball.curveSpin) < 0.004) ball.curveSpin = 0;
}

export function advanceBall(ball: BallState, dt: number): number {
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;
  return Math.abs(ball.curveSpin) * 18;
}

export function decayBallGlint(ball: BallState, dt: number): void {
  if (ball.glint <= 0) return;
  ball.glint = Math.max(0, ball.glint - dt * BALL_GLINT_DECAY);
}

export function getGlintScale(glint: number): number {
  return 1 + glint * 0.85;
}

export function getGlintOpacity(glint: number): number {
  return Math.min(0.78, glint * 0.72);
}

export function normalizeBallSpeed(ball: BallState, speed: number): void {
  const velLen = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
  if (velLen <= 0) return;
  ball.vx = (ball.vx / velLen) * speed;
  ball.vy = (ball.vy / velLen) * speed;
}

export type RacketSide = "left" | "right" | "bottom" | "top";

export function bounceVelocityOffRacket(
  side: RacketSide,
  intersect: number,
  realSpeed: number,
): { vx: number; vy: number } {
  const bounceAngle = clamp(intersect, -1, 1) * MAX_BOUNCE_SHIFT;

  switch (side) {
    case "left":
      return {
        vx: Math.abs(Math.cos(bounceAngle) * realSpeed),
        vy: -Math.sin(bounceAngle) * realSpeed,
      };
    case "right":
      return {
        vx: -Math.abs(Math.cos(bounceAngle) * realSpeed),
        vy: -Math.sin(bounceAngle) * realSpeed,
      };
    case "bottom":
      return {
        vx: Math.sin(bounceAngle) * realSpeed,
        vy: Math.abs(Math.cos(bounceAngle) * realSpeed),
      };
    case "top":
      return {
        vx: Math.sin(bounceAngle) * realSpeed,
        vy: -Math.abs(Math.cos(bounceAngle) * realSpeed),
      };
  }
}

export function applyRacketImpulse(
  ball: BallState,
  axis: "x" | "y",
  tangentVelocity: number,
  currentSpeed: number,
): number {
  const spin = clamp(tangentVelocity / 1100, -1, 1);
  const power = Math.abs(spin);

  if (axis === "x") {
    ball.vx += tangentVelocity * 0.2 + spin * currentSpeed * 0.14;
  } else {
    ball.vy += tangentVelocity * 0.2 + spin * currentSpeed * 0.14;
  }

  ball.curveSpin = clamp(
    ball.curveSpin + spin * CURVE_HIT_GAIN,
    -CURVE_SPIN_MAX,
    CURVE_SPIN_MAX,
  );

  const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
  if (speed > 0) {
    const boostedSpeed = currentSpeed * (1 + power * 0.07);
    ball.vx = (ball.vx / speed) * boostedSpeed;
    ball.vy = (ball.vy / speed) * boostedSpeed;
  }

  return power;
}

export function applyNaturalRacketDeflection(
  ball: BallState,
  tangentAxis: "x" | "y",
  contactOffset: number,
  tangentVelocity: number,
  currentSpeed: number,
  timeNow: number,
): number {
  const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
  if (speed <= 0) return 0;

  const offsetBias = clamp(contactOffset, -1, 1) * RACKET_DEFLECTION_MAX;
  const motionBias = clamp(tangentVelocity / Math.max(900, currentSpeed * 2.1), -1, 1) * RACKET_MOTION_DEFLECTION;
  const microBias = Math.sin((timeNow + ball.x * 3.1 + ball.y * 5.3) * 0.021) * 0.026;
  const deflection = clamp(offsetBias + motionBias + microBias, -0.24, 0.24);

  if (tangentAxis === "x") {
    ball.vx += deflection * speed;
  } else {
    ball.vy += deflection * speed;
  }

  const nextSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
  if (nextSpeed > 0) {
    const impactBoost = 1 + Math.abs(deflection) * 0.025;
    ball.vx = (ball.vx / nextSpeed) * speed * impactBoost;
    ball.vy = (ball.vy / nextSpeed) * speed * impactBoost;
  }

  ball.curveSpin = clamp(
    ball.curveSpin + deflection * 0.18,
    -CURVE_SPIN_MAX,
    CURVE_SPIN_MAX,
  );

  return 0.65 + Math.abs(deflection) * 1.8;
}

export function cornerComboIntensity(timeSinceOther: number): number | null {
  if (timeSinceOther >= CORNER_COMBO_WINDOW_MS) return null;
  return clamp(1 - timeSinceOther / CORNER_COMBO_WINDOW_MS, 0.2, 1);
}

export function applyCornerComboBoost(ball: BallState, intensity: number): void {
  const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
  if (speed <= 0) return;
  const boost = 1 + intensity * 0.075;
  ball.vx *= boost;
  ball.vy *= boost;
}

export function isPanicSave(
  side: "left" | "bottom",
  ballX: number,
  ballY: number,
  ballSize: number,
  width: number,
  height: number,
): boolean {
  const panicDistance = side === "left"
    ? Math.abs((ballX - ballSize / 2) - (-width / 2))
    : Math.abs((ballY - ballSize / 2) - (-height / 2));
  return panicDistance < PANIC_SAVE_DISTANCE;
}

export function resolveBrickBallCollision(
  ball: BallState,
  brickX: number,
  brickY: number,
  overlapX: number,
  overlapY: number,
): void {
  if (overlapX < overlapY) {
    if (ball.x < brickX) {
      ball.x -= overlapX;
      ball.vx = -Math.abs(ball.vx);
    } else {
      ball.x += overlapX;
      ball.vx = Math.abs(ball.vx);
    }
    ball.curveSpin *= -0.45;
  } else {
    if (ball.y < brickY) {
      ball.y -= overlapY;
      ball.vy = -Math.abs(ball.vy);
    } else {
      ball.y += overlapY;
      ball.vy = Math.abs(ball.vy);
    }
    ball.curveSpin *= -0.45;
  }

  ball.curveSpin = clamp(ball.curveSpin, -CURVE_SPIN_MAX, CURVE_SPIN_MAX);
}

export function ricochetIntroBounds(
  ball: BallState,
  ballSize: number,
  width: number,
  height: number,
): void {
  if (ball.x - ballSize / 2 < -width / 2) {
    ball.x = -width / 2 + ballSize / 2;
    ball.vx = Math.abs(ball.vx);
    ball.curveSpin *= -0.35;
  } else if (ball.x + ballSize / 2 > width / 2) {
    ball.x = width / 2 - ballSize / 2;
    ball.vx = -Math.abs(ball.vx);
    ball.curveSpin *= -0.35;
  }

  if (ball.y - ballSize / 2 < -height / 2) {
    ball.y = -height / 2 + ballSize / 2;
    ball.vy = Math.abs(ball.vy);
    ball.curveSpin *= -0.35;
  } else if (ball.y + ballSize / 2 > height / 2) {
    ball.y = height / 2 - ballSize / 2;
    ball.vy = -Math.abs(ball.vy);
    ball.curveSpin *= -0.35;
  }
}
