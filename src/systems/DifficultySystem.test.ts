import { describe, expect, it } from "vitest";
import { isBossFloor, isEliteFloor, planFloor } from "./DifficultySystem";

describe("DifficultySystem", () => {
  it("increases quota monotonically with floor", () => {
    let previous = -1;
    for (let floor = 1; floor <= 20; floor++) {
      const quota = 4 + floor * 2;
      expect(quota).toBeGreaterThan(previous);
      previous = quota;
    }
  });

  it("never increases relocate interval as floors rise", () => {
    let previous = Infinity;
    for (let floor = 1; floor <= 20; floor++) {
      const plan = planFloor(floor);
      expect(plan.relocateInterval).toBeLessThanOrEqual(previous);
      previous = plan.relocateInterval;
    }
  });

  it("marks every fifth floor as a boss", () => {
    expect(isBossFloor(5)).toBe(true);
    expect(isBossFloor(10)).toBe(true);
    expect(isBossFloor(4)).toBe(false);
    expect(planFloor(5).isBoss).toBe(true);
  });

  it("does not mark boss floors as elite", () => {
    for (let floor = 1; floor <= 30; floor++) {
      if (isBossFloor(floor)) {
        expect(isEliteFloor(floor)).toBe(false);
      }
    }
  });

  it("introduces enemies only from floor 4 onward", () => {
    expect(planFloor(1).enemies).toHaveLength(0);
    expect(planFloor(3).enemies).toHaveLength(0);
    expect(planFloor(4).enemies.length).toBeGreaterThan(0);
  });

  it("keeps the first floor wall-free for a clean start", () => {
    expect(planFloor(1).wallCount).toBe(0);
  });
});
