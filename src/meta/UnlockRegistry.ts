import type { UpgradeId } from "../types/runState";
import type { MetaSave, PermanentUpgradeId } from "./SaveManager";

export type Unlock = {
  id: string;
  name: string;
  description: string;
  /** True once the player has met the requirement to purchase it. */
  requirement: (save: MetaSave) => boolean;
  cost: number;
  /** Upgrade added to the in-run draft pool when owned. */
  grantsUpgrade?: UpgradeId;
};

/**
 * Unlock graph. Early runs stay simple; spending shards and reaching deeper
 * floors gradually expands the upgrade pool and meta options.
 */
export const UNLOCKS: Unlock[] = [
  {
    id: "u-magnet",
    name: "Unlock: Magnet",
    description: "Adds the Magnet upgrade to the run draft pool.",
    requirement: (s) => s.bestFloor >= 2,
    cost: 40,
    grantsUpgrade: "magnet",
  },
  {
    id: "u-splitter",
    name: "Unlock: Orb Splitter",
    description: "Adds the Orb Splitter upgrade to the run draft pool.",
    requirement: (s) => s.bestFloor >= 3,
    cost: 80,
    grantsUpgrade: "orbSplitter",
  },
  {
    id: "u-compound",
    name: "Unlock: Compound Interest",
    description: "Adds the legendary Compound Interest upgrade to the pool.",
    requirement: (s) => s.bestFloor >= 5,
    cost: 160,
    grantsUpgrade: "compoundInterest",
  },
  {
    id: "u-secondwind",
    name: "Unlock: Second Wind",
    description: "Adds the legendary Second Wind upgrade to the pool.",
    requirement: (s) => s.totalOrbs >= 150,
    cost: 200,
    grantsUpgrade: "secondWind",
  },
];

export type PermanentUpgradeDef = {
  id: PermanentUpgradeId;
  name: string;
  description: string;
  maxRank: number;
  costFor: (rank: number) => number;
};

export const PERMANENT_UPGRADES: PermanentUpgradeDef[] = [
  {
    id: "vitality",
    name: "Vitality",
    description: "+2s starting time bank per rank.",
    maxRank: 5,
    costFor: (rank) => 30 + rank * 30,
  },
  {
    id: "fleet",
    name: "Fleet Footed",
    description: "+4% base move speed per rank.",
    maxRank: 5,
    costFor: (rank) => 30 + rank * 30,
  },
  {
    id: "fortune",
    name: "Fortune",
    description: "+5% base score per rank.",
    maxRank: 5,
    costFor: (rank) => 40 + rank * 35,
  },
  {
    id: "aegis",
    name: "Aegis",
    description: "Start the run with +1 shield per rank.",
    maxRank: 3,
    costFor: (rank) => 60 + rank * 60,
  },
];

/** Upgrade ids always available in the draft pool, regardless of unlocks. */
export const BASE_POOL: UpgradeId[] = [
  "timeThief",
  "swiftDash",
  "greed",
  "bulwark",
  "dangerSense",
  "adrenaline",
];

export function availableUpgradePool(save: MetaSave): UpgradeId[] {
  const pool = new Set<UpgradeId>(BASE_POOL);
  for (const unlock of UNLOCKS) {
    if (unlock.grantsUpgrade && save.unlocks.includes(unlock.id)) {
      pool.add(unlock.grantsUpgrade);
    }
  }
  return [...pool];
}
