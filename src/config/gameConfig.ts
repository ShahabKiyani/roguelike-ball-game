import type { PlayerStats } from "../types/runState";

export const ARENA = {
  width: 720,
  height: 480,
  margin: 28,
} as const;

export const SCENES = {
  boot: "Boot",
  menu: "MainMenu",
  run: "Run",
  levelUp: "LevelUp",
  death: "Death",
  metaHub: "MetaHub",
} as const;

/**
 * Baseline values ported from the original Square Dash. The first floor with a
 * fresh stat block should feel identical to the legacy 1-good / 1-bad arena.
 */
export const BASE_RUN = {
  startingTimeBank: 22,
  goodOrb: { radius: 10, value: 10, bonusTime: 1.5 },
  badOrb: { radius: 12, value: 8, bonusTime: 2 },
  relocateInterval: 4,
  playerSpeed: 260,
  playerSize: 16,
  pickupRadius: 14,
} as const;

export function createBaseStats(): PlayerStats {
  return {
    speed: BASE_RUN.playerSpeed,
    pickupRadius: BASE_RUN.pickupRadius,
    magnetRange: 0,
    goodTimeBonus: BASE_RUN.goodOrb.bonusTime,
    goodScore: BASE_RUN.goodOrb.value,
    badTimePenalty: BASE_RUN.badOrb.bonusTime,
    badScorePenalty: BASE_RUN.badOrb.value,
    splitChance: 0,
    scoreMultiplier: 1,
    shieldsPerFloor: 0,
    dangerSense: false,
    secondWind: false,
  };
}

export const COLORS = {
  player: 0x6fffe9,
  good: 0xf4d35e,
  bad: 0xee6352,
  neutral: 0x9db4c0,
  shield: 0x5bc0eb,
  multiplier: 0xc77dff,
  ghost: 0xb8c4ce,
  text: 0xeef4ed,
} as const;
