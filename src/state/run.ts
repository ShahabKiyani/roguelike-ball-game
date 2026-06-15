import { createBaseStats } from "../config/gameConfig";
import { recomputeStats, startingTimeBonus } from "../systems/UpgradeSystem";
import type { RunMode, RunState } from "../types/runState";

/** Build a fresh run. Stats fold in permanent meta upgrades immediately. */
export function createRun(mode: RunMode, seed: number): RunState {
  const run: RunState = {
    mode,
    seed,
    floor: 1,
    score: 0,
    timeBank: 0,
    upgrades: [],
    stats: createBaseStats(),
    shields: 0,
    orbsCollected: 0,
    damageTaken: 0,
    cleared: false,
  };
  run.stats = recomputeStats(run);
  // Per-floor refill happens in RunScene; only the Vitality meta bonus is seeded here.
  run.timeBank = startingTimeBonus();
  return run;
}
