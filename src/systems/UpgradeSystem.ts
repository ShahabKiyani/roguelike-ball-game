import { createBaseStats } from "../config/gameConfig";
import { UPGRADES, type UpgradeDef } from "../config/upgrades";
import { SaveManager } from "../meta/SaveManager";
import { availableUpgradePool } from "../meta/UnlockRegistry";
import type { PlayerStats, RunState, UpgradeId } from "../types/runState";
import { Rng } from "../generation/rng";

function countStacks(run: RunState, id: UpgradeId): number {
  return run.upgrades.filter((u) => u === id).length;
}

/** Recompute stats from scratch: base + permanent meta + every drafted upgrade. */
export function recomputeStats(run: RunState): PlayerStats {
  const save = SaveManager.get();
  const stats = createBaseStats();

  const perm = save.permanentUpgrades;
  stats.speed *= 1 + perm.fleet * 0.04;
  stats.goodScore *= 1 + perm.fortune * 0.05;

  for (const id of run.upgrades) {
    UPGRADES[id].apply(stats);
  }
  return stats;
}

/** Starting time bank including the Vitality meta upgrade. */
export function startingTimeBonus(): number {
  return SaveManager.get().permanentUpgrades.vitality * 2;
}

export function startingShields(run: RunState): number {
  const aegis = SaveManager.get().permanentUpgrades.aegis;
  return run.stats.shieldsPerFloor + aegis;
}

/** Pick up to three distinct, non-maxed upgrades, weighted by rarity. */
export function rollUpgradeChoices(run: RunState, count = 3): UpgradeDef[] {
  const save = SaveManager.get();
  const pool = availableUpgradePool(save).filter((id) => {
    const def = UPGRADES[id];
    return countStacks(run, id) < def.maxStacks;
  });

  const rng = new Rng((run.seed ^ (run.floor * 0x27d4eb2f) ^ (run.score * 7)) >>> 0);
  const rarityWeight: Record<string, number> = {
    common: 1,
    rare: 0.45 + run.floor * 0.03,
    legendary: 0.12 + run.floor * 0.015,
  };

  const chosen: UpgradeDef[] = [];
  const candidates = [...pool];
  while (chosen.length < count && candidates.length > 0) {
    const totalWeight = candidates.reduce(
      (sum, id) => sum + rarityWeight[UPGRADES[id].rarity],
      0
    );
    let roll = rng.next() * totalWeight;
    let index = 0;
    for (; index < candidates.length; index++) {
      roll -= rarityWeight[UPGRADES[candidates[index]].rarity];
      if (roll <= 0) break;
    }
    const picked = candidates.splice(Math.min(index, candidates.length - 1), 1)[0];
    chosen.push(UPGRADES[picked]);
  }
  return chosen;
}

export function applyUpgrade(run: RunState, id: UpgradeId): void {
  run.upgrades.push(id);
  run.stats = recomputeStats(run);
}
