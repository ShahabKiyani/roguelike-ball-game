import Phaser from "phaser";
import { ARENA } from "../config/gameConfig";
import { UPGRADES } from "../config/upgrades";
import type { RunState } from "../types/runState";

const LABEL_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: "Trebuchet MS, sans-serif",
  fontSize: "14px",
  color: "#9db4c0",
};

const VALUE_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: "Trebuchet MS, sans-serif",
  fontSize: "22px",
  fontStyle: "bold",
  color: "#eef4ed",
};

export class HUD {
  private scene: Phaser.Scene;
  private scoreText: Phaser.GameObjects.Text;
  private floorText: Phaser.GameObjects.Text;
  private quotaText: Phaser.GameObjects.Text;
  private shieldText: Phaser.GameObjects.Text;
  private timeBarBg: Phaser.GameObjects.Rectangle;
  private timeBar: Phaser.GameObjects.Rectangle;
  private upgradeText: Phaser.GameObjects.Text;
  private bannerText: Phaser.GameObjects.Text;
  private readonly barMax = ARENA.width - 220;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const top = 14;

    scene.add.text(20, top, "SCORE", LABEL_STYLE).setDepth(40);
    this.scoreText = scene.add.text(20, top + 16, "0", VALUE_STYLE).setDepth(40);

    scene.add.text(120, top, "FLOOR", LABEL_STYLE).setDepth(40);
    this.floorText = scene.add.text(120, top + 16, "1", VALUE_STYLE).setDepth(40);

    this.quotaText = scene.add
      .text(190, top + 20, "", { ...LABEL_STYLE, color: "#f4d35e" })
      .setDepth(40);

    this.shieldText = scene.add
      .text(ARENA.width - 20, top + 16, "", { ...VALUE_STYLE, color: "#5bc0eb" })
      .setOrigin(1, 0)
      .setDepth(40);

    this.timeBarBg = scene.add
      .rectangle(ARENA.width / 2 - this.barMax / 2 + 100, top + 8, this.barMax, 12, 0x0a1622)
      .setOrigin(0, 0.5)
      .setStrokeStyle(1, 0xffffff, 0.15)
      .setDepth(40);
    this.timeBar = scene.add
      .rectangle(this.timeBarBg.x, top + 8, this.barMax, 12, 0x6fffe9)
      .setOrigin(0, 0.5)
      .setDepth(41);

    this.upgradeText = scene.add
      .text(20, ARENA.height - 24, "", { ...LABEL_STYLE, fontSize: "13px" })
      .setDepth(40);

    this.bannerText = scene.add
      .text(ARENA.width / 2, ARENA.height / 2, "", {
        fontFamily: "Trebuchet MS, sans-serif",
        fontSize: "34px",
        fontStyle: "bold",
        color: "#eef4ed",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(60)
      .setAlpha(0);
  }

  update(run: RunState, timeBank: number, maxTime: number, quotaLeft: number): void {
    this.scoreText.setText(String(run.score));
    this.floorText.setText(String(run.floor));
    this.quotaText.setText(quotaLeft > 0 ? `collect ${quotaLeft} more` : "floor clear!");
    this.shieldText.setText(run.shields > 0 ? `shields ${run.shields}` : "");

    const ratio = Phaser.Math.Clamp(timeBank / maxTime, 0, 1);
    this.timeBar.width = this.barMax * ratio;
    const color = ratio < 0.25 ? 0xee6352 : ratio < 0.5 ? 0xf4d35e : 0x6fffe9;
    this.timeBar.setFillStyle(color);

    if (run.upgrades.length > 0) {
      const names = run.upgrades.map((id) => UPGRADES[id].name).join("  ·  ");
      this.upgradeText.setText(names);
    }
  }

  banner(message: string, color = "#eef4ed", reducedMotion = false): void {
    this.bannerText.setText(message).setColor(color).setAlpha(1).setScale(1);
    if (reducedMotion) {
      this.scene.time.delayedCall(900, () => this.bannerText.setAlpha(0));
      return;
    }
    this.bannerText.setScale(0.7);
    this.scene.tweens.add({
      targets: this.bannerText,
      scale: 1,
      duration: 320,
      ease: "Back.easeOut",
    });
    this.scene.tweens.add({
      targets: this.bannerText,
      alpha: 0,
      delay: 900,
      duration: 400,
    });
  }
}
