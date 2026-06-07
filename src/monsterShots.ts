export function monsterShotSpeed(currentLevel: number, speedBonus: number): number {
  return 210 + currentLevel * 34 + speedBonus * 0.2;
}

export function monsterShotAngle(
  currentLevel: number,
  monsterX: number,
  monsterY: number,
  playerCornerX: number,
  playerCornerY: number,
): number {
  const aimChance = currentLevel >= 9 ? 0.42 : currentLevel >= 7 ? 0.34 : 0;
  if (aimChance > 0 && Math.random() < aimChance) {
    const aimX = playerCornerX + (Math.random() - 0.5) * 52;
    const aimY = playerCornerY + (Math.random() - 0.5) * 52;
    return Math.atan2(aimY - monsterY, aimX - monsterX);
  }
  return Math.random() * Math.PI * 2;
}
