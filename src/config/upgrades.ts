import type { PlayerStats, UpgradeId } from "../types/runState";

export type Rarity = "common" | "rare" | "legendary";
export type UpgradeTag = "speed" | "time" | "risk" | "defense" | "score";

export type UpgradeDef = {
  id: UpgradeId;
  name: string;
  description: string;
  rarity: Rarity;
  tags: UpgradeTag[];
  maxStacks: number;
  apply: (stats: PlayerStats) => void;
};

export const UPGRADES: Record<UpgradeId, UpgradeDef> = {
  timeThief: {
    id: "timeThief",
    name: "Time Thief",
    description: "Good orbs grant +0.6s extra time.",
    rarity: "common",
    tags: ["time"],
    maxStacks: 4,
    apply: (s) => {
      s.goodTimeBonus += 0.6;
    },
  },
  magnet: {
    id: "magnet",
    name: "Magnet",
    description: "Pickup radius +35% and orbs drift toward you.",
    rarity: "common",
    tags: ["score"],
    maxStacks: 3,
    apply: (s) => {
      s.pickupRadius *= 1.35;
      s.magnetRange = Math.max(s.magnetRange, 120) + 40;
    },
  },
  swiftDash: {
    id: "swiftDash",
    name: "Swift Dash",
    description: "Move 15% faster and take 10% less time penalty.",
    rarity: "common",
    tags: ["speed", "defense"],
    maxStacks: 4,
    apply: (s) => {
      s.speed *= 1.15;
      s.badTimePenalty *= 0.9;
    },
  },
  greed: {
    id: "greed",
    name: "Greed",
    description: "Good orbs are worth +6 score.",
    rarity: "common",
    tags: ["score"],
    maxStacks: 5,
    apply: (s) => {
      s.goodScore += 6;
    },
  },
  orbSplitter: {
    id: "orbSplitter",
    name: "Orb Splitter",
    description: "30% chance a collected good orb spawns a bonus orb.",
    rarity: "rare",
    tags: ["score"],
    maxStacks: 2,
    apply: (s) => {
      s.splitChance = Math.min(0.85, s.splitChance + 0.3);
    },
  },
  bulwark: {
    id: "bulwark",
    name: "Bulwark",
    description: "Start each floor with +1 shield that blocks a bad hit.",
    rarity: "rare",
    tags: ["defense"],
    maxStacks: 3,
    apply: (s) => {
      s.shieldsPerFloor += 1;
    },
  },
  dangerSense: {
    id: "dangerSense",
    name: "Danger Sense",
    description: "Bad orbs and enemies pulse a warning before they strike.",
    rarity: "rare",
    tags: ["defense"],
    maxStacks: 1,
    apply: (s) => {
      s.dangerSense = true;
    },
  },
  adrenaline: {
    id: "adrenaline",
    name: "Adrenaline",
    description: "Speed +25%, but bad orbs cost +2 score.",
    rarity: "rare",
    tags: ["speed", "risk"],
    maxStacks: 2,
    apply: (s) => {
      s.speed *= 1.25;
      s.badScorePenalty += 2;
    },
  },
  compoundInterest: {
    id: "compoundInterest",
    name: "Compound Interest",
    description: "All score gains multiplied by 1.25x.",
    rarity: "legendary",
    tags: ["score"],
    maxStacks: 3,
    apply: (s) => {
      s.scoreMultiplier *= 1.25;
    },
  },
  secondWind: {
    id: "secondWind",
    name: "Second Wind",
    description: "Once per floor, surviving at 0s grants a 3s reprieve.",
    rarity: "legendary",
    tags: ["defense", "time"],
    maxStacks: 1,
    apply: (s) => {
      s.secondWind = true;
    },
  },
};

export const RARITY_COLOR: Record<Rarity, string> = {
  common: "#9db4c0",
  rare: "#5bc0eb",
  legendary: "#c77dff",
};

export const ALL_UPGRADE_IDS = Object.keys(UPGRADES) as UpgradeId[];
