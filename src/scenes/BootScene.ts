import Phaser from "phaser";
import { SCENES } from "../config/gameConfig";

/**
 * Generates every texture procedurally so the project ships no binary art.
 * Shapes double as colorblind-friendly silhouettes (circle / triangle / etc.).
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.boot);
  }

  create(): void {
    this.makeDisc("disc", 48);
    this.makeRing("ring", 48, 12);
    this.makeTriangle("triangle", 52);
    this.makeDiamond("diamond", 52);
    this.makeSquare("square", 40);
    this.makeDisc("spark", 16);

    this.scene.start(SCENES.menu);
  }

  private graphics(): Phaser.GameObjects.Graphics {
    return this.make.graphics({ x: 0, y: 0 }, false);
  }

  private makeDisc(key: string, size: number): void {
    const g = this.graphics();
    g.fillStyle(0xffffff, 1);
    g.fillCircle(size / 2, size / 2, size / 2 - 1);
    g.generateTexture(key, size, size);
    g.destroy();
  }

  private makeRing(key: string, size: number, thickness: number): void {
    const g = this.graphics();
    g.lineStyle(thickness, 0xffffff, 1);
    g.strokeCircle(size / 2, size / 2, size / 2 - thickness / 2 - 1);
    g.generateTexture(key, size, size);
    g.destroy();
  }

  private makeTriangle(key: string, size: number): void {
    const g = this.graphics();
    g.fillStyle(0xffffff, 1);
    g.fillTriangle(size / 2, 2, size - 2, size - 2, 2, size - 2);
    g.generateTexture(key, size, size);
    g.destroy();
  }

  private makeDiamond(key: string, size: number): void {
    const g = this.graphics();
    g.fillStyle(0xffffff, 1);
    g.fillPoints(
      [
        new Phaser.Geom.Point(size / 2, 2),
        new Phaser.Geom.Point(size - 2, size / 2),
        new Phaser.Geom.Point(size / 2, size - 2),
        new Phaser.Geom.Point(2, size / 2),
      ],
      true
    );
    g.generateTexture(key, size, size);
    g.destroy();
  }

  private makeSquare(key: string, size: number): void {
    const g = this.graphics();
    g.fillStyle(0xffffff, 1);
    g.fillRoundedRect(0, 0, size, size, 6);
    g.generateTexture(key, size, size);
    g.destroy();
  }
}
