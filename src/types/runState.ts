export type Vec = {
  x: number;
  y: number;
};

export type UpgradeId =
  | "timeThief"
  | "magnet"
  | "swiftDash"
  | "orbSplitter"
  | "dangerSense"
  | "secondWind"
  | "greed"
  | "bulwark"
  | "adrenaline"
  | "compoundInterest";

export type EnemyKind = "chaser" | "patroller" | "bomber";

export type OrbKind = "good" | "bad" | "neutral" | "shield" | "multiplier" | "ghost";

/**
 * Per-run player stats. Upgrades mutate these between floors; the run scene
 * reads them every frame, so all gameplay tuning funnels through here.
 */
export type PlayerStats = {
  speed: number;
  pickupRadius: number;
  magnetRange: number;
  goodTimeBonus: number;
  goodScore: number;
  badTimePenalty: number;
  badScorePenalty: number;
  splitChance: number;
  scoreMultiplier: number;
  shieldsPerFloor: number;
  dangerSense: boolean;
  secondWind: boolean;
};

export type RunMode = "standard" | "daily";

export type RunState = {
  mode: RunMode;
  seed: number;
  floor: number;
  score: number;
  timeBank: number;
  upgrades: UpgradeId[];
  stats: PlayerStats;
  shields: number;
  orbsCollected: number;
  damageTaken: number;
  cleared: boolean;
};
