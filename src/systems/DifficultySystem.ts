import { BASE_RUN } from "../config/gameConfig";
import type { EnemyKind } from "../types/runState";

export type FloorPlan = {
  floor: number;
  isElite: boolean;
  isBoss: boolean;
  /** Good orbs that must be collected to clear the floor. */
  quota: number;
  goodOrbCount: number;
  badOrbCount: number;
  neutralOrbCount: number;
  relocateInterval: number;
  enemies: EnemyKind[];
  wallCount: number;
  timeGrant: number;
};

export function isEliteFloor(floor: number): boolean {
  return floor > 0 && floor % 5 !== 0 && floor % 4 === 0;
}

export function isBossFloor(floor: number): boolean {
  return floor > 0 && floor % 5 === 0;
}

function enemiesForFloor(floor: number, boss: boolean): EnemyKind[] {
  const enemies: EnemyKind[] = [];
  if (boss) {
    return enemies;
  }
  if (floor >= 4) {
    enemies.push("chaser");
  }
  if (floor >= 6) {
    enemies.push("patroller");
  }
  if (floor >= 8) {
    enemies.push("bomber");
  }
  if (floor >= 10) {
    enemies.push("chaser");
  }
  return enemies;
}

/**
 * Pure mapping from a floor index to its spawn parameters. Curves are
 * intentionally monotonic so difficulty never dips as you descend.
 */
export function planFloor(floor: number): FloorPlan {
  const boss = isBossFloor(floor);
  const elite = isEliteFloor(floor);

  const quota = 4 + floor * 2;
  const badBase = 1 + Math.floor(floor / 2);
  const badOrbCount = boss ? badBase + 2 : elite ? badBase * 2 : badBase;
  const goodOrbCount = Math.min(4, 1 + Math.floor(floor / 3));
  const neutralOrbCount = floor >= 2 ? Math.min(2, Math.floor(floor / 3)) : 0;

  const relocateInterval = Math.max(
    2.2,
    BASE_RUN.relocateInterval - floor * 0.18
  );

  const wallCount = Math.min(9, floor === 1 ? 0 : 2 + Math.floor(floor / 2));
  const timeGrant = boss
    ? BASE_RUN.startingTimeBank + 6
    : elite
      ? BASE_RUN.startingTimeBank - 4
      : BASE_RUN.startingTimeBank;

  return {
    floor,
    isElite: elite,
    isBoss: boss,
    quota: boss ? Math.ceil(quota * 0.7) : quota,
    goodOrbCount,
    badOrbCount,
    neutralOrbCount,
    relocateInterval,
    enemies: enemiesForFloor(floor, boss),
    wallCount,
    timeGrant,
  };
}
