import type { Brick } from "./types";

export interface MonsterVariant {
  codename: string;
  pattern: string[];
  bodyColor: number;
  bodyHits: number;
}

export const MONSTER_VARIANTS: MonsterVariant[] = [
  {
    codename: "BLOB",
    pattern: ["..XXX..", ".XXXXX.", "XXEXEXX", ".XXXXX.", "..XXX.."],
    bodyColor: 0x7f1d1d,
    bodyHits: 1,
  },
  {
    codename: "SPIKE",
    pattern: ["...X...", "..XXX..", ".XXXXX.", "XXEXEXX", ".XX.XX.", "..XXX.."],
    bodyColor: 0x991b1b,
    bodyHits: 1,
  },
  {
    codename: "BUG",
    pattern: [".XXXXX.", "XXXXXXX", "XEXEEXX", "XXXXXXX", ".X.X.X."],
    bodyColor: 0x6b1420,
    bodyHits: 1,
  },
  {
    codename: "GHOST",
    pattern: [".XXXXXXX.", "XXXXXXXXX", "XXE.X.EXX", "XXXXXXXXX", "..XXXXX..", "...XXX..."],
    bodyColor: 0x450a0a,
    bodyHits: 1,
  },
];

export interface MonsterSpawnSpec {
  id: string;
  x: number;
  y: number;
  phase: number;
  variantIndex: number;
}

export function getLevelMonsterSpawns(
  currentLevel: number,
  monsterCount: number,
  width: number,
  height: number,
): MonsterSpawnSpec[] {
  if (monsterCount === 0) return [];

  const spread = Math.min(width * 0.22, 260);
  const spawns: MonsterSpawnSpec[] = [
    { id: `monster_${currentLevel}_a`, x: -spread, y: height * 0.16, phase: 0, variantIndex: currentLevel },
    { id: `monster_${currentLevel}_b`, x: spread, y: -height * 0.12, phase: Math.PI, variantIndex: currentLevel + 1 },
  ];

  if (monsterCount >= 3) {
    spawns.push({
      id: `monster_${currentLevel}_c`,
      x: 0,
      y: height * 0.27,
      phase: Math.PI / 2,
      variantIndex: currentLevel + 2,
    });
  }
  if (monsterCount >= 4) {
    spawns.push({
      id: `monster_${currentLevel}_d`,
      x: 0,
      y: -height * 0.24,
      phase: -Math.PI / 2,
      variantIndex: currentLevel + 3,
    });
  }

  return spawns;
}

export function getMonsterVariant(variantIndex: number): MonsterVariant {
  return MONSTER_VARIANTS[variantIndex % MONSTER_VARIANTS.length];
}

export function computeMonsterBlockSize(width: number): number {
  return Math.max(10, Math.min(15, Math.floor(width / 88)));
}

export interface MonsterBrickCell {
  row: number;
  col: number;
  cell: string;
  x: number;
  y: number;
  isEye: boolean;
  hitsMax: number;
}

export function buildMonsterBrickCells(
  monsterX: number,
  monsterY: number,
  variant: MonsterVariant,
  block: number,
  gap = 2,
): MonsterBrickCell[] {
  const pattern = variant.pattern;
  const totalW = pattern[0].length * block + (pattern[0].length - 1) * gap;
  const totalH = pattern.length * block + (pattern.length - 1) * gap;
  const cells: MonsterBrickCell[] = [];

  pattern.forEach((row, r) => {
    [...row].forEach((cell, c) => {
      if (cell === ".") return;
      cells.push({
        row: r,
        col: c,
        cell,
        x: monsterX - totalW / 2 + c * (block + gap) + block / 2,
        y: monsterY + totalH / 2 - r * (block + gap) - block / 2,
        isEye: cell === "E",
        hitsMax: cell === "E" ? 1 : variant.bodyHits,
      });
    });
  });

  return cells;
}

export function shouldMonsterExplode(hitCount: number, bricks: Brick[]): boolean {
  const alive = bricks.filter((brick) => brick.hitsLeft > 0).length;
  const total = bricks.length;
  if (alive <= 0 || total === 0) return true;
  const destroyedRatio = 1 - alive / total;
  return (
    (hitCount >= 2 && destroyedRatio >= 0.16) ||
    hitCount >= 4 ||
    alive <= total * 0.5
  );
}

export function getMonsterWobble(
  timeNow: number,
  phase: number,
  currentLevel: number,
  wobbleScale: number,
): { x: number; y: number } {
  return {
    x: Math.sin(timeNow * 0.0013 + phase) * (8 + currentLevel * 1.2) * wobbleScale,
    y: Math.cos(timeNow * 0.0011 + phase) * 6 * wobbleScale,
  };
}

export function getMonsterBrickGridPosition(
  monsterX: number,
  monsterY: number,
  row: number,
  col: number,
  blockW: number,
  wobbleX: number,
  wobbleY: number,
): { x: number; y: number } {
  return {
    x: monsterX + (col - 4) * blockW + wobbleX,
    y: monsterY + (3 - row) * blockW + wobbleY,
  };
}

export function getMonsterPulseScale(timeNow: number, phase: number): number {
  return 0.9 + Math.sin(timeNow * 0.004 + phase) * 0.08;
}

export function getNextMonsterShotDelay(
  timeNow: number,
  currentLevel: number,
  monsterShotScale: number,
): number {
  return timeNow +
    Math.max(650, (2500 - currentLevel * 200) * monsterShotScale) +
    Math.random() * 800;
}

export interface MonsterShotRacketBounds {
  left: { x: number; y: number; length: number };
  bottom: { x: number; y: number; length: number };
  right: { x: number; y: number; length: number };
  top: { x: number; y: number; length: number };
  playerScale: number;
  aiScale: number;
  thickness: number;
}

export function getMonsterShotRacketHit(
  shotX: number,
  shotY: number,
  bounds: MonsterShotRacketBounds,
): "player" | "ai" | null {
  const { left, bottom, right, top, playerScale, aiScale, thickness } = bounds;
  const leftLen = left.length * playerScale;
  const bottomLen = bottom.length * playerScale;
  const rightLen = right.length * aiScale;
  const topLen = top.length * aiScale;

  const hitLeft = Math.abs(shotX - left.x) < thickness * 1.4 &&
    shotY > left.y - leftLen / 2 &&
    shotY < left.y + leftLen / 2;
  const hitBottom = Math.abs(shotY - bottom.y) < thickness * 1.4 &&
    shotX > bottom.x - bottomLen / 2 &&
    shotX < bottom.x + bottomLen / 2;
  const hitRight = Math.abs(shotX - right.x) < thickness * 1.4 &&
    shotY > right.y - rightLen / 2 &&
    shotY < right.y + rightLen / 2;
  const hitTop = Math.abs(shotY - top.y) < thickness * 1.4 &&
    shotX > top.x - topLen / 2 &&
    shotX < top.x + topLen / 2;

  if (hitLeft || hitBottom) return "player";
  if (hitRight || hitTop) return "ai";
  return null;
}

export function isMonsterShotOutOfBounds(
  shotX: number,
  shotY: number,
  width: number,
  height: number,
  margin = 80,
): boolean {
  return (
    shotX < -width / 2 - margin ||
    shotX > width / 2 + margin ||
    shotY < -height / 2 - margin ||
    shotY > height / 2 + margin
  );
}

export function parseMonsterBrickGrid(brickId: string): { row: number; col: number } {
  const baseParts = brickId.split("_");
  return {
    row: Number(baseParts.at(-2)),
    col: Number(baseParts.at(-1)),
  };
}
