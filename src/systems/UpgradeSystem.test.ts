import { describe, expect, it } from "vitest";
import { applyUpgrade, recomputeStats, rollUpgradeChoices } from "./UpgradeSystem";
import { createBaseStats } from "../config/gameConfig";
import type { RunState } from "../types/runState";

function makeRun(): RunState {
  const run: RunState = {
    mode: "standard",
    seed: 1234,
    floor: 1,
    score: 0,
    timeBank: 22,
    upgrades: [],
    stats: createBaseStats(),
    shields: 0,
    orbsCollected: 0,
    damageTaken: 0,
    cleared: false,
  };
  run.stats = recomputeStats(run);
  return run;
}

describe("UpgradeSystem", () => {
  it("stacks upgrades onto the base stats", () => {
    const run = makeRun();
    const baseTime = run.stats.goodTimeBonus;
    applyUpgrade(run, "timeThief");
    applyUpgrade(run, "timeThief");
    expect(run.stats.goodTimeBonus).toBeCloseTo(baseTime + 1.2, 5);
  });

  it("rolls distinct, non-repeating choices", () => {
    const run = makeRun();
    const choices = rollUpgradeChoices(run, 3);
    const ids = choices.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(choices.length).toBeGreaterThan(0);
  });

  it("never offers an upgrade past its max stacks", () => {
    const run = makeRun();
    for (let i = 0; i < 6; i++) applyUpgrade(run, "swiftDash");
    const choices = rollUpgradeChoices(run, 5);
    expect(choices.find((c) => c.id === "swiftDash")).toBeUndefined();
  });

  it("recompute is pure: same upgrades produce same stats", () => {
    const run = makeRun();
    applyUpgrade(run, "greed");
    const first = recomputeStats(run);
    const second = recomputeStats(run);
    expect(first).toEqual(second);
  });
});
