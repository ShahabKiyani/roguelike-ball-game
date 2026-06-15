import Phaser from "phaser";
import { ARENA, SCENES } from "../config/gameConfig";
import { RARITY_COLOR, type UpgradeDef } from "../config/upgrades";
import { applyUpgrade, rollUpgradeChoices } from "../systems/UpgradeSystem";
import { SoundManager } from "../audio/SoundManager";
import type { RunState } from "../types/runState";

export class LevelUpScene extends Phaser.Scene {
  private run!: RunState;

  constructor() {
    super(SCENES.levelUp);
  }

  init(data: { run: RunState }): void {
    this.run = data.run;
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#04121f");
    const cx = ARENA.width / 2;

    this.add
      .text(cx, 56, `FLOOR ${this.run.floor} CLEARED`, {
        fontFamily: "Trebuchet MS, sans-serif",
        fontSize: "34px",
        fontStyle: "bold",
        color: "#6fffe9",
      })
      .setOrigin(0.5);
    this.add
      .text(cx, 96, "Choose an upgrade", {
        fontFamily: "Trebuchet MS, sans-serif",
        fontSize: "16px",
        color: "#9db4c0",
      })
      .setOrigin(0.5);

    const choices = rollUpgradeChoices(this.run, 3);
    if (choices.length === 0) {
      this.add
        .text(cx, 220, "No upgrades left — press space to descend", {
          fontFamily: "Trebuchet MS, sans-serif",
          fontSize: "16px",
          color: "#9db4c0",
        })
        .setOrigin(0.5);
      this.input.keyboard!.once("keydown-SPACE", () => this.advance());
      this.input.once("pointerdown", () => this.advance());
      return;
    }

    const cardWidth = 200;
    const gap = 18;
    const totalWidth = choices.length * cardWidth + (choices.length - 1) * gap;
    const startX = cx - totalWidth / 2 + cardWidth / 2;

    choices.forEach((choice, index) => {
      this.buildCard(startX + index * (cardWidth + gap), 250, cardWidth, choice, index);
    });

    this.add
      .text(cx, ARENA.height - 28, "Click a card or press 1 / 2 / 3", {
        fontFamily: "Trebuchet MS, sans-serif",
        fontSize: "13px",
        color: "#9db4c0",
      })
      .setOrigin(0.5);
  }

  private buildCard(
    x: number,
    y: number,
    width: number,
    choice: UpgradeDef,
    index: number
  ): void {
    const height = 220;
    const accent = Phaser.Display.Color.HexStringToColor(RARITY_COLOR[choice.rarity]).color;

    const bg = this.add
      .rectangle(x, y, width, height, accent, 0.12)
      .setStrokeStyle(2, accent, 0.85);

    this.add
      .text(x, y - 86, `${index + 1}`, {
        fontFamily: "Trebuchet MS, sans-serif",
        fontSize: "14px",
        color: RARITY_COLOR[choice.rarity],
      })
      .setOrigin(0.5);
    this.add
      .text(x, y - 50, choice.name, {
        fontFamily: "Trebuchet MS, sans-serif",
        fontSize: "20px",
        fontStyle: "bold",
        color: "#eef4ed",
        align: "center",
        wordWrap: { width: width - 24 },
      })
      .setOrigin(0.5);
    this.add
      .text(x, y + 14, choice.description, {
        fontFamily: "Trebuchet MS, sans-serif",
        fontSize: "14px",
        color: "#bcd0db",
        align: "center",
        wordWrap: { width: width - 28 },
      })
      .setOrigin(0.5);
    this.add
      .text(x, y + 86, choice.rarity.toUpperCase(), {
        fontFamily: "Trebuchet MS, sans-serif",
        fontSize: "12px",
        color: RARITY_COLOR[choice.rarity],
      })
      .setOrigin(0.5);

    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerover", () => bg.setFillStyle(accent, 0.26));
    bg.on("pointerout", () => bg.setFillStyle(accent, 0.12));
    bg.on("pointerdown", () => this.pick(choice));

    this.input.keyboard!.once(`keydown-${["ONE", "TWO", "THREE"][index]}`, () =>
      this.pick(choice)
    );
  }

  private pick(choice: UpgradeDef): void {
    SoundManager.play("select");
    applyUpgrade(this.run, choice.id);
    this.advance();
  }

  private advance(): void {
    this.run.floor += 1;
    this.run.cleared = false;
    this.scene.start(SCENES.run, { run: this.run });
  }
}
