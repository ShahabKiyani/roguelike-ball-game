import Phaser from "phaser";
import { BASE_RUN, COLORS } from "../config/gameConfig";

export class Player extends Phaser.Physics.Arcade.Image {
  declare body: Phaser.Physics.Arcade.Body;
  private reducedMotion = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "square");
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setTint(COLORS.player);
    const visual = BASE_RUN.playerSize * 2;
    this.setDisplaySize(visual, visual);
    this.setCollideWorldBounds(true);
    this.setDepth(10);

    // Collision body matches the visible square; pickup reach is handled
    // separately by a distance check so upgrades don't affect wall collisions.
    const radius = this.width / 2;
    this.body.setCircle(radius, 0, 0);
  }

  setReducedMotion(value: boolean): void {
    this.reducedMotion = value;
  }

  move(dirX: number, dirY: number, speed: number): void {
    if (dirX === 0 && dirY === 0) {
      this.setVelocity(0, 0);
      return;
    }
    const length = Math.hypot(dirX, dirY);
    this.setVelocity((dirX / length) * speed, (dirY / length) * speed);
  }

  flashHit(): void {
    if (this.reducedMotion) return;
    this.scene.tweens.add({
      targets: this,
      duration: 90,
      yoyo: true,
      onStart: () => this.setTintFill(0xffffff),
      onComplete: () => this.setTint(COLORS.player),
    });
  }
}
