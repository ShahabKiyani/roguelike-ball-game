import Phaser from "phaser";

export function spawnFloatingText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  message: string,
  color: string,
  reducedMotion = false
): void {
  const text = scene.add
    .text(x, y, message, {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "18px",
      fontStyle: "bold",
      color,
    })
    .setOrigin(0.5)
    .setDepth(50);

  if (reducedMotion) {
    scene.time.delayedCall(500, () => text.destroy());
    return;
  }

  scene.tweens.add({
    targets: text,
    y: y - 38,
    alpha: 0,
    duration: 720,
    ease: "Cubic.easeOut",
    onComplete: () => text.destroy(),
  });
}
