/**
 * Game types and state definitions for Twisted Stacks.
 */

export enum GameState {
  INTRO_TWISTED = "INTRO_TWISTED",
  INTRO_STACKS = "INTRO_STACKS",
  INTRO_TWISTEDSTACKS = "INTRO_TWISTEDSTACKS",
  GAMEPLAY = "GAMEPLAY",
  END_SCREEN = "END_SCREEN",
}

export interface Brick {
  id: string;
  x: number; // Center X
  y: number; // Center Y
  w: number; // Width
  h: number; // Height
  hitsMax: number;
  hitsLeft: number;
  isScoreBrick?: boolean;
  isCenterMotif?: boolean;
  motifLocalX?: number;
  motifLocalY?: number;
  isMonster?: boolean;
  scoreOwner?: "player" | "ai";
  // Visual states: 'active', 'damaged1', 'damaged2', 'dead'
  state: "active" | "damaged1" | "damaged2" | "dead";
  mesh?: any; // ThreeJS Mesh
  crackGroup?: any; // ThreeJS Group for cracks
  color?: number; // Original theme color
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  vz?: number;
  life: number; // Remaining time, starting at 1.0 down to 0
  decay?: number; // Seconds to fade out when custom particle needs to live longer
  gravity?: number; // Y acceleration in screen-space units
  expand?: boolean; // Shockwave ring scaling
  color: number; // Hex color number
  mesh?: any; // ThreeJS Mesh
}

export interface Racket {
  x: number;
  y: number;
  length: number;
  thickness: number;
  mesh?: any;
}
