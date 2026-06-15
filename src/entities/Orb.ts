import Phaser from "phaser";
import { COLORS } from "../config/gameConfig";
import type { OrbKind } from "../types/runState";

const ORB_STYLE: Record<
  OrbKind,
  { color: number; radius: number; texture: string; cbTexture: string }
> = {
  good: { color: COLORS.good, radius: 10, texture: "disc", cbTexture: "disc" },
  bad: { color: COLORS.bad, radius: 12, texture: "disc", cbTexture: "triangle" },
  neutral: { color: COLORS.neutral, radius: 11, texture: "disc", cbTexture: "diamond" },
  shield: { color: COLORS.shield, radius: 11, texture: "ring", cbTexture: "ring" },
  multiplier: { color: COLORS.multiplier, radius: 11, texture: "diamond", cbTexture: "diamond" },
  ghost: { color: COLORS.ghost, radius: 12, texture: "disc", cbTexture: "disc" },
};

export class Orb extends Phaser.Physics.Arcade.Image {
  declare body: Phaser.Physics.Arcade.Body;
  readonly kind: OrbKind;
  readonly radius: number;
  private telegraphTween?: Phaser.Tweens.Tween;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    kind: OrbKind,
    options: { colorblind: boolean; reducedMotion: boolean }
  ) {
    const style = ORB_STYLE[kind];
    super(scene, x, y, options.colorblind ? style.cbTexture : style.texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.kind = kind;
    this.radius = style.radius;
    this.setTint(style.color);
    this.setDisplaySize(style.radius * 2, style.radius * 2);
    this.setDepth(5);

    const texRadius = this.width / 2;
    this.body.setCircle(texRadius, 0, 0);

    if (kind === "ghost") {
      this.setAlpha(0.18);
    }

    if (!options.reducedMotion) {
      scene.tweens.add({
        targets: this,
        scale: this.scaleX * 1.18,
        duration: 620,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
  }

  /** Visual warning used by the Danger Sense upgrade before a bad orb relocates. */
  telegraph(): void {
    if (this.telegraphTween) return;
    this.telegraphTween = this.scene.tweens.add({
      targets: this,
      alpha: 0.35,
      duration: 160,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        this.telegraphTween = undefined;
        this.setAlpha(this.kind === "ghost" ? 0.18 : 1);
      },
    });
  }

  /** Reveal ghost orbs when the player draws near. */
  setProximity(distance: number): void {
    if (this.kind !== "ghost") return;
    const reveal = Phaser.Math.Clamp(1 - distance / 140, 0.18, 1);
    this.setAlpha(reveal);
  }
}
