import Phaser from "phaser";
import type { Arena } from "../generation/ArenaGenerator";
import { Rng } from "../generation/rng";
import type { FloorPlan } from "./DifficultySystem";
import { Orb } from "../entities/Orb";
import type { OrbKind, Vec } from "../types/runState";

const SPECIAL_KINDS: OrbKind[] = ["shield", "multiplier", "ghost"];

export type SpawnOptions = {
  colorblind: boolean;
  reducedMotion: boolean;
};

/**
 * Owns the live orbs for a floor: which kinds exist, where they sit, and the
 * periodic "relocate everything" pulse inherited from the original game.
 */
export class SpawnSystem {
  readonly group: Phaser.Physics.Arcade.Group;
  private scene: Phaser.Scene;
  private arena: Arena;
  private rng: Rng;
  private options: SpawnOptions;

  constructor(
    scene: Phaser.Scene,
    arena: Arena,
    seed: number,
    options: SpawnOptions
  ) {
    this.scene = scene;
    this.arena = arena;
    this.options = options;
    this.rng = new Rng((seed ^ 0x1b873593) >>> 0);
    this.group = scene.physics.add.group();
  }

  populate(plan: FloorPlan): void {
    for (let i = 0; i < plan.goodOrbCount; i++) this.spawn("good");
    for (let i = 0; i < plan.badOrbCount; i++) this.spawn("bad");
    for (let i = 0; i < plan.neutralOrbCount; i++) this.spawn("neutral");
    if (plan.floor >= 3) this.spawn(this.rng.pick(SPECIAL_KINDS));
  }

  private spawn(kind: OrbKind): Orb {
    const pos = this.freePosition();
    const orb = new Orb(this.scene, pos.x, pos.y, kind, this.options);
    this.group.add(orb);
    return orb;
  }

  private freePosition(): Vec {
    if (this.arena.spawnPoints.length === 0) {
      return { x: this.arena.width / 2, y: this.arena.height / 2 };
    }
    return this.rng.pick(this.arena.spawnPoints);
  }

  /** Move a single orb to a new spot; specials reroll their kind on respawn. */
  relocate(orb: Orb): void {
    const pos = this.freePosition();
    if (orb.kind === "shield" || orb.kind === "multiplier" || orb.kind === "ghost") {
      orb.destroy();
      const replacement = this.spawn(this.rng.pick(SPECIAL_KINDS));
      replacement.setPosition(pos.x, pos.y);
      return;
    }
    orb.setPosition(pos.x, pos.y);
  }

  relocateAll(): void {
    this.group.getChildren().forEach((child) => {
      this.relocate(child as Orb);
    });
  }

  spawnBonus(at: Vec): void {
    const orb = this.spawn("good");
    orb.setPosition(at.x, at.y);
  }

  forEachBad(callback: (orb: Orb) => void): void {
    this.group.getChildren().forEach((child) => {
      const orb = child as Orb;
      if (orb.kind === "bad") callback(orb);
    });
  }
}
