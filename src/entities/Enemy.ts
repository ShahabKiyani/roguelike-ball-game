import Phaser from "phaser";
import type { EnemyKind, Vec } from "../types/runState";

const ENEMY_STYLE: Record<EnemyKind, { color: number; size: number; speed: number }> = {
  chaser: { color: 0xff5c8a, size: 22, speed: 95 },
  patroller: { color: 0xffa14a, size: 20, speed: 130 },
  bomber: { color: 0xff3b3b, size: 24, speed: 60 },
};

export class Enemy extends Phaser.Physics.Arcade.Image {
  declare body: Phaser.Physics.Arcade.Body;
  readonly kind: EnemyKind;
  readonly speed: number;
  private patrol: Vec[] = [];
  private patrolIndex = 0;
  private fuse = 0;
  primed = false;

  constructor(scene: Phaser.Scene, x: number, y: number, kind: EnemyKind) {
    const style = ENEMY_STYLE[kind];
    super(scene, x, y, kind === "patroller" ? "diamond" : "square");
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.kind = kind;
    this.speed = style.speed;
    this.setTint(style.color);
    this.setDisplaySize(style.size, style.size);
    this.setDepth(8);
    this.setCollideWorldBounds(true);
    this.body.setCircle(this.width / 2, 0, 0);
    this.setAngularVelocity(kind === "patroller" ? 120 : 40);
  }

  setPatrol(points: Vec[]): void {
    this.patrol = points;
  }

  think(player: Vec, delta: number): { explode: boolean } {
    switch (this.kind) {
      case "chaser":
        this.seek(player, this.speed);
        return { explode: false };
      case "patroller":
        this.followPatrol();
        return { explode: false };
      case "bomber":
        return this.armBomb(player, delta);
      default:
        return { explode: false };
    }
  }

  private seek(target: Vec, speed: number): void {
    const angle = Math.atan2(target.y - this.y, target.x - this.x);
    this.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
  }

  private followPatrol(): void {
    if (this.patrol.length === 0) {
      this.setVelocity(0, 0);
      return;
    }
    const target = this.patrol[this.patrolIndex];
    const dist = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);
    if (dist < 12) {
      this.patrolIndex = (this.patrolIndex + 1) % this.patrol.length;
    }
    this.seek(target, this.speed);
  }

  private armBomb(player: Vec, delta: number): { explode: boolean } {
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    if (dist < 130) {
      this.seek(player, this.speed);
      this.fuse += delta;
      this.primed = this.fuse > 1.4;
      const blink = this.primed ? 0.4 : 0.85;
      this.setAlpha(Phaser.Math.Clamp(blink + Math.sin(this.fuse * 14) * 0.4, 0.3, 1));
      return { explode: this.fuse >= 3 };
    }
    this.fuse = Math.max(0, this.fuse - delta);
    this.primed = false;
    this.setAlpha(1);
    this.setVelocity(0, 0);
    return { explode: false };
  }
}
