import Phaser from "phaser";

export type Button = Phaser.GameObjects.Container;

export function createButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick: () => void,
  opts: { width?: number; accent?: number } = {}
): Button {
  const width = opts.width ?? 240;
  const height = 46;
  const accent = opts.accent ?? 0x6fffe9;

  const bg = scene.add
    .rectangle(0, 0, width, height, accent, 0.14)
    .setStrokeStyle(1.5, accent, 0.8);
  const text = scene.add
    .text(0, 0, label, {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "18px",
      fontStyle: "bold",
      color: "#eef4ed",
    })
    .setOrigin(0.5);

  const container = scene.add.container(x, y, [bg, text]).setSize(width, height);

  // Make the background rectangle the input target (reliable built-in hit area)
  // rather than a container hit-area, which is easy to misalign.
  bg.setInteractive({ useHandCursor: true });
  let armed = false;
  bg.on("pointerover", () => bg.setFillStyle(accent, 0.28));
  bg.on("pointerout", () => {
    armed = false;
    bg.setFillStyle(accent, 0.14);
  });
  bg.on("pointerdown", () => {
    armed = true;
    bg.setFillStyle(accent, 0.4);
  });
  bg.on("pointerup", () => {
    bg.setFillStyle(accent, 0.28);
    if (armed) {
      armed = false;
      onClick();
    }
  });

  return container;
}

export function createToggle(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  initial: boolean,
  onChange: (value: boolean) => void
): Phaser.GameObjects.Text {
  const render = (value: boolean) => `${label}: ${value ? "ON" : "OFF"}`;
  let value = initial;
  const text = scene.add
    .text(x, y, render(value), {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "15px",
      color: "#9db4c0",
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true });

  text.on("pointerdown", () => {
    value = !value;
    text.setText(render(value));
    text.setColor(value ? "#6fffe9" : "#9db4c0");
    onChange(value);
  });
  text.setColor(value ? "#6fffe9" : "#9db4c0");
  return text;
}
