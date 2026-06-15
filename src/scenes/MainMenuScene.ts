import Phaser from "phaser";
import { ARENA, SCENES } from "../config/gameConfig";
import { SaveManager } from "../meta/SaveManager";
import { SoundManager } from "../audio/SoundManager";
import { createRun } from "../state/run";
import { dailySeed, randomSeed } from "../generation/rng";
import { createButton, createToggle } from "../ui/widgets";

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super(SCENES.menu);
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#04121f");
    const cx = ARENA.width / 2;
    const save = SaveManager.get();

    this.add
      .text(cx, 70, "SQUARE DASH", {
        fontFamily: "Trebuchet MS, sans-serif",
        fontSize: "52px",
        fontStyle: "bold",
        color: "#6fffe9",
      })
      .setOrigin(0.5);
    this.add
      .text(cx, 112, "a roguelike collector", {
        fontFamily: "Trebuchet MS, sans-serif",
        fontSize: "16px",
        color: "#9db4c0",
      })
      .setOrigin(0.5);

    this.add
      .text(
        cx,
        152,
        `Best score ${save.bestScore}   ·   Best floor ${save.bestFloor}   ·   Shards ${save.shards}`,
        { fontFamily: "Trebuchet MS, sans-serif", fontSize: "15px", color: "#f4d35e" }
      )
      .setOrigin(0.5);

    createButton(this, cx, 210, "Start Run", () => {
      SoundManager.unlock();
      this.scene.start(SCENES.run, { run: createRun("standard", randomSeed()) });
    });
    createButton(this, cx, 268, "Daily Challenge", () => {
      SoundManager.unlock();
      this.scene.start(SCENES.run, { run: createRun("daily", dailySeed()) });
    });
    createButton(this, cx, 326, "Meta Hub", () => {
      this.scene.start(SCENES.metaHub);
    });

    this.buildSettings(cx);

    this.add
      .text(cx, ARENA.height - 18, "WASD / arrows / tap to move   ·   Esc to pause", {
        fontFamily: "Trebuchet MS, sans-serif",
        fontSize: "13px",
        color: "#9db4c0",
      })
      .setOrigin(0.5);
  }

  private buildSettings(cx: number): void {
    const save = SaveManager.get();
    const y = 392;

    createToggle(this, cx - 170, y, "SFX", save.settings.sfx > 0, (on) => {
      SaveManager.update((s) => (s.settings.sfx = on ? 0.7 : 0));
      if (on) SoundManager.play("select");
    });
    createToggle(this, cx - 40, y, "Reduced Motion", save.settings.reducedMotion, (on) => {
      SaveManager.update((s) => (s.settings.reducedMotion = on));
    });
    createToggle(this, cx + 150, y, "Colorblind", save.settings.colorblind, (on) => {
      SaveManager.update((s) => (s.settings.colorblind = on));
    });
  }
}
