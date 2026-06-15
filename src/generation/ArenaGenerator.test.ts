import { describe, expect, it } from "vitest";
import { generateArena } from "./ArenaGenerator";
import { planFloor } from "../systems/DifficultySystem";

function pointInRect(
  px: number,
  py: number,
  r: { x: number; y: number; width: number; height: number }
): boolean {
  return px >= r.x && px <= r.x + r.width && py >= r.y && py <= r.y + r.height;
}

describe("ArenaGenerator", () => {
  it("is deterministic for the same floor and seed", () => {
    const a = generateArena(3, 4242, planFloor(3).wallCount);
    const b = generateArena(3, 4242, planFloor(3).wallCount);
    expect(a.walls).toEqual(b.walls);
    expect(a.spawnPoints).toEqual(b.spawnPoints);
  });

  it("always provides usable spawn points and an open player spawn", () => {
    for (let floor = 1; floor <= 25; floor++) {
      for (const seed of [1, 999, 1234567, 88888888]) {
        const arena = generateArena(floor, seed, planFloor(floor).wallCount);
        expect(arena.spawnPoints.length).toBeGreaterThan(0);
        const onWall = arena.walls.some((w) =>
          pointInRect(arena.playerSpawn.x, arena.playerSpawn.y, w)
        );
        expect(onWall).toBe(false);
      }
    }
  });

  it("keeps walls inside the arena bounds", () => {
    const arena = generateArena(8, 555, planFloor(8).wallCount);
    for (const wall of arena.walls) {
      expect(wall.x).toBeGreaterThanOrEqual(0);
      expect(wall.y).toBeGreaterThanOrEqual(0);
      expect(wall.x + wall.width).toBeLessThanOrEqual(arena.width);
      expect(wall.y + wall.height).toBeLessThanOrEqual(arena.height);
    }
  });
});
