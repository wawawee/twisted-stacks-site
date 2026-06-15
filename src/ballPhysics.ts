import { clamp } from "./math";

// ---------------------------------------------------------------------------
// Magnus / screw-ball constants
// ---------------------------------------------------------------------------
// Curve-spin (legacy 2D scalar) — kept for backward compat with the rest of
// the game that still references `curveSpin` as a single value. The new
// angular-velocity system below derives from and feeds into this scalar via
// the z-component, so the in-plane curve behaviour is preserved.
export const CURVE_SPIN_MAX = 0.4;
export const CURVE_SPIN_DECAY = 3.4;
export const CURVE_FORCE = 0.44;
export const CURVE_HIT_GAIN = 0.2;

// 3D angular-velocity system (Magnus force + visible rotation).
// MAGNUS_COEFFICIENT controls how much sideways curve the spin produces per
// unit of (angularVelocity × velocity). Keep this subtle — the goal is a
// noticeable curve, not a knuckleball. Tune by feel; 0.08 felt right in
// playtesting.
export const MAGNUS_COEFFICIENT = 0.08;

// Damping applied to angular velocity every frame (exponential decay). 0.998
// per frame at 60 fps gives a half-life of ~350 frames (~6 s) which means
// spin gradually fades between paddle hits.
export const ANGULAR_DAMPING_PER_FRAME = 0.998;

// Edge-hit spin boost: a paddle hit at the very edge of the racket (contact
// offset = ±1) adds this many rad/s to angularVelocity.z. A dead-centre
// hit adds nothing. The paddle contact code in App.tsx linearly scales
// between 0 (centre) and this value (edge) based on contact offset.
export const EDGE_SPIN_BOOST = 4.5;

// Default spin at launch (rad/s on the z axis, perpendicular to playfield).
// Small but non-zero — gives a subtle "alive" curve from the first serve.
export const DEFAULT_LAUNCH_SPIN = 0.5;

// Existing misc physics constants.
export const RACKET_DEFLECTION_MAX = 0.18;
export const RACKET_MOTION_DEFLECTION = 0.14;
export const BALL_GLINT_DECAY = 5.6;
export const MAX_BOUNCE_SHIFT = Math.PI / 4;
export const CORNER_COMBO_WINDOW_MS = 1250;
export const PANIC_SAVE_DISTANCE = 54;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface BallState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  // 2D scalar (legacy alias) — kept in sync with angularVelocity.z so older
  // code paths that read curveSpin continue to work. New code should read
  // angularVelocity directly.
  curveSpin: number;
  // 3D angular velocity in rad/s. The direction is the rotation axis
  // (right-hand rule) and the magnitude is the rate. For a 2D playfield,
  // the z-component is what produces an in-plane curve.
  angularVelocity: Vec3;
  // Normalized spin axis (cached for visual use; derived from angularVelocity
  // when angularVelocity has any magnitude).
  spinAxis: Vec3;
  glint: number;
  glintColor: number;
}

// ---------------------------------------------------------------------------
// Vector helpers
// ---------------------------------------------------------------------------
function vec3(x: number, y: number, z: number): Vec3 {
  return { x, y, z };
}

function vec3Length(v: Vec3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

function vec3Normalize(v: Vec3): Vec3 {
  const len = vec3Length(v);
  if (len < 1e-6) return vec3(0, 0, 1);
  return vec3(v.x / len, v.y / len, v.z / len);
}

function vec3Cross(a: Vec3, b: Vec3): Vec3 {
  return vec3(
    a.y * b.z - a.z * b.y,
    a.z * b.x - a.x * b.z,
    a.x * b.y - a.y * b.x,
  );
}

function vec3Scale(v: Vec3, s: number): Vec3 {
  return vec3(v.x * s, v.y * s, v.z * s);
}

function vec3Add(a: Vec3, b: Vec3): Vec3 {
  return vec3(a.x + b.x, a.y + b.y, a.z + b.z);
}

// ---------------------------------------------------------------------------
// Spin-axis cache — keep spinAxis normalized and in sync with angularVelocity
// ---------------------------------------------------------------------------
function refreshSpinAxis(ball: BallState): void {
  const len = vec3Length(ball.angularVelocity);
  if (len < 1e-6) {
    // No spin → default axis is z (perpendicular to playfield). Pick a
    // stable direction so mesh doesn't jitter when the ball is dead.
    ball.spinAxis.x = 0;
    ball.spinAxis.y = 0;
    ball.spinAxis.z = 1;
    return;
  }
  ball.spinAxis.x = ball.angularVelocity.x / len;
  ball.spinAxis.y = ball.angularVelocity.y / len;
  ball.spinAxis.z = ball.angularVelocity.z / len;
}

// ---------------------------------------------------------------------------
// Ball state lifecycle
// ---------------------------------------------------------------------------
export function createBallState(glintColor: number): BallState {
  return {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    curveSpin: 0,
    angularVelocity: vec3(0, 0, 0),
    spinAxis: vec3(0, 0, 1),
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
  ball.angularVelocity.x = 0;
  ball.angularVelocity.y = 0;
  ball.angularVelocity.z = 0;
  ball.spinAxis.x = 0;
  ball.spinAxis.y = 0;
  ball.spinAxis.z = 1;
  ball.glint = 0;
}

/**
 * Apply the default launch spin that every serve gets. Subtle but non-zero
 * so even the very first ball after a serve carries a tiny Magnus curve.
 */
export function applyLaunchSpin(ball: BallState): void {
  // Direction is randomised slightly so consecutive serves don't all curve
  // the same way. The magnitude is bounded to keep gameplay consistent.
  const sign = Math.random() < 0.5 ? -1 : 1;
  const mag = DEFAULT_LAUNCH_SPIN * (0.6 + Math.random() * 0.4);
  ball.angularVelocity.x = 0;
  ball.angularVelocity.y = 0;
  ball.angularVelocity.z = sign * mag;
  ball.curveSpin = clamp(ball.angularVelocity.z * 0.5, -CURVE_SPIN_MAX, CURVE_SPIN_MAX);
  refreshSpinAxis(ball);
}

/**
 * Add spin to the ball from a paddle hit. The contact offset is normalised
 * to [-1, 1] (where ±1 = the very edge of the racket, 0 = dead centre). The
 * resulting spin is perpendicular to the incoming velocity, in the play
 * plane — exactly what you'd get from glancing a real spinning ball.
 */
export function addPaddleHitSpin(
  ball: BallState,
  contactOffset: number, // [-1, 1]
  incomingVx: number,
  incomingVy: number,
  side: "x" | "y",
): void {
  // Magnitude scales with |contactOffset|: dead-centre = 0, edge = max.
  const offsetMag = clamp(Math.abs(contactOffset), 0, 1);
  const direction = contactOffset >= 0 ? 1 : -1;
  const boost = offsetMag * EDGE_SPIN_BOOST * direction;

  // Spin axis is perpendicular to the incoming velocity in the XY plane.
  // For a velocity (vx, vy) the in-plane perpendicular is (-vy, vx, 0)
  // (rotated 90° CCW). The sign of `boost` flips the axis.
  const vLen = Math.sqrt(incomingVx * incomingVx + incomingVy * incomingVy);
  if (vLen < 1e-6) return;

  const perpX = -incomingVy / vLen;
  const perpY = incomingVx / vLen;

  ball.angularVelocity.x = perpX * boost;
  ball.angularVelocity.y = perpY * boost;
  ball.angularVelocity.z = 0;

  // Keep the legacy curveSpin in sync (z-component scaled to the old range).
  // For side "x" hits the curve is in the y direction; for "y" hits the curve
  // is in the x direction. The sign of perpX/perpY combined with direction
  // gives the right sign for curveSpin.
  const curveSign = side === "x" ? perpX * direction : perpY * direction;
  const curveMag = (offsetMag * EDGE_SPIN_BOOST * 0.11) * Math.sign(curveSign || 1);
  ball.curveSpin = clamp(curveMag, -CURVE_SPIN_MAX, CURVE_SPIN_MAX);

  refreshSpinAxis(ball);
}

// ---------------------------------------------------------------------------
// Level-scaled curve force (existing helper, unchanged)
// ---------------------------------------------------------------------------
export function curveForceScale(isGameplay: boolean, currentLevel: number): number {
  if (!isGameplay || currentLevel < 5) return 1;
  return 1 + clamp((currentLevel - 4) / 5, 0, 1) * 0.22;
}

// ---------------------------------------------------------------------------
// Per-frame integration: Magnus force + angular damping
// ---------------------------------------------------------------------------
/**
 * Apply Magnus force and angular damping for one frame. dt is the frame's
 * delta-time in seconds. The Magnus force is computed via the cross product
 *   F = (angularVelocity × velocity) * MAGNUS_COEFFICIENT
 * which is the standard physics formulation. For a 2D playfield, only the
 * z-component of angularVelocity produces an in-plane curve.
 */
export function integrateBallCurve(
  ball: BallState,
  dt: number,
  currentSpeed: number,
  isGameplay: boolean,
  currentLevel: number,
): void {
  const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);

  if (speed > 60) {
    // --- 3D Magnus force from the new angularVelocity field ---
    // Build a 3D velocity (z component is small, comes from spinLift). We
    // approximate z-velocity as 0 for the cross product — the in-plane curve
    // is driven entirely by the perpendicular force, and the z lift is
    // handled separately by advanceBall.
    const v3: Vec3 = vec3(ball.vx, ball.vy, 0);
    const cross = vec3Cross(ball.angularVelocity, v3);
    const levelScale = curveForceScale(isGameplay, currentLevel);
    const fx = cross.x * MAGNUS_COEFFICIENT * levelScale;
    const fy = cross.y * MAGNUS_COEFFICIENT * levelScale;

    // The existing curveSpin scalar also contributes to the in-plane curve
    // (used by older code paths and edge-hit boosts). The two are additive
    // — the 3D system scales the same physical effect.
    const velLen = speed;
    const perpX = -ball.vy / velLen;
    const perpY = ball.vx / velLen;
    const legacyAccel = ball.curveSpin * currentSpeed * CURVE_FORCE * levelScale;

    // Combine the two contributions.
    const totalAccelX = (fx + perpX * legacyAccel) * dt;
    const totalAccelY = (fy + perpY * legacyAccel) * dt;

    ball.vx += totalAccelX;
    ball.vy += totalAccelY;
  }

  // --- Angular damping (per-frame exponential decay) ---
  // Apply a small per-frame multiplier so spin fades naturally between
  // paddle hits. The factor is scaled by dt to be roughly frame-rate
  // independent: at 60 fps the factor is ~0.998; at 30 fps we square it.
  const frames = Math.max(1, dt * 60);
  const damp = Math.pow(ANGULAR_DAMPING_PER_FRAME, frames);
  ball.angularVelocity.x *= damp;
  ball.angularVelocity.y *= damp;
  ball.angularVelocity.z *= damp;
  refreshSpinAxis(ball);

  // --- Legacy curve-spin decay (unchanged) ---
  ball.curveSpin *= Math.exp(-CURVE_SPIN_DECAY * dt);
  if (Math.abs(ball.curveSpin) < 0.004) ball.curveSpin = 0;
  // Keep the legacy scalar mirrored on the z-axis so the two systems never
  // drift out of sync.
  ball.angularVelocity.z = clamp(
    ball.angularVelocity.z * 0.5 + ball.curveSpin * 2,
    -CURVE_SPIN_MAX * 8,
    CURVE_SPIN_MAX * 8,
  );
  refreshSpinAxis(ball);
}

export function advanceBall(ball: BallState, dt: number): number {
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;
  // Z lift comes from the magnitude of the spin (visible "wobble" while the
  // ball carries angular velocity). Capped so the ball doesn't drift off
  // the playfield.
  const spinMag = vec3Length(ball.angularVelocity);
  return Math.min(8, spinMag * 1.6);
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

// ---------------------------------------------------------------------------
// Racket bounce (unchanged)
// ---------------------------------------------------------------------------
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

  // Mirror onto angularVelocity.z so the new system stays in sync.
  ball.angularVelocity.z = clamp(
    ball.curveSpin * 2,
    -CURVE_SPIN_MAX * 8,
    CURVE_SPIN_MAX * 8,
  );
  refreshSpinAxis(ball);

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
  ball.angularVelocity.z = clamp(
    ball.curveSpin * 2,
    -CURVE_SPIN_MAX * 8,
    CURVE_SPIN_MAX * 8,
  );
  refreshSpinAxis(ball);

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
  ball.angularVelocity.z = clamp(
    ball.curveSpin * 2,
    -CURVE_SPIN_MAX * 8,
    CURVE_SPIN_MAX * 8,
  );
  refreshSpinAxis(ball);
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

  ball.curveSpin = clamp(ball.curveSpin, -CURVE_SPIN_MAX, CURVE_SPIN_MAX);
  ball.angularVelocity.z = clamp(
    ball.curveSpin * 2,
    -CURVE_SPIN_MAX * 8,
    CURVE_SPIN_MAX * 8,
  );
  refreshSpinAxis(ball);
}
