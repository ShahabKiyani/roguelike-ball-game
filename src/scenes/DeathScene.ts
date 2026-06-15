import Phaser from "phaser";
import { ARENA, SCENES } from "../config/gameConfig";
import { UPGRADES } from "../config/upgrades";
import { SaveManager } from "../meta/SaveManager";
import { createRun } from "../state/run";
import { dailySeed, randomSeed } from "../generation/rng";
import { createButton } from "../ui/widgets";
import type { RunState } from "../types/runState";

export class DeathScene extends Phaser.Scene {
  private run!: RunState;

  constructor() {
    super(SCENES.death);
  }

  init(data: { run: RunState }): void {
    this.run = data.run;
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#0a0406");
    const cx = ARENA.width / 2;
    const save = SaveManager.get();
    const shardsEarned = (this.registry.get("lastShardsEarned") as number) ?? 0;

    this.add
      .text(cx, 56, "RUN OVER", {
        fontFamily: "Trebuchet MS, sans-serif",
        fontSize: "46px",
        fontStyle: "bold",
        color: "#ee6352",
      })
      .setOrigin(0.5);

    const summary = [
      `Reached floor ${this.run.floor}`,
      `Score ${this.run.score}`,
      `Orbs collected ${this.run.orbsCollected}`,
      `Hits taken ${this.run.damageTaken}`,
      `Shards earned +${shardsEarned}  (total ${save.shards})`,
    ];
    this.add
      .text(cx, 150, summary.join("\n"), {
        fontFamily: "Trebuchet MS, sans-serif",
        fontSize: "18px",
        color: "#eef4ed",
        align: "center",
        lineSpacing: 8,
      })
      .setOrigin(0.5);

    const build =
      this.run.upgrades.length > 0
        ? this.run.upgrades.map((id) => UPGRADES[id].name).join("  ·  ")
        : "no upgrades drafted";
    this.add
      .text(cx, 268, `Build: ${build}`, {
        fontFamily: "Trebuchet MS, sans-serif",
        fontSize: "14px",
        color: "#9db4c0",
        align: "center",
        wordWrap: { width: ARENA.width - 80 },
      })
      .setOrigin(0.5);

    createButton(this, cx - 130, 350, "Retry", () => this.retry(), { width: 200 });
    createButton(this, cx + 130, 350, "Meta Hub", () => this.scene.start(SCENES.metaHub), {
      width: 200,
    });
    createButton(this, cx, 408, "Main Menu", () => this.scene.start(SCENES.menu), {
      width: 200,
      accent: 0x9db4c0,
    });
  }

  private retry(): void {
    const seed = this.run.mode === "daily" ? dailySeed() : randomSeed();
    this.scene.start(SCENES.run, { run: createRun(this.run.mode, seed) });
  }
}
