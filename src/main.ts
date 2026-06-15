import Phaser from "phaser";
import { ARENA } from "./config/gameConfig";
import { BootScene } from "./scenes/BootScene";
import { MainMenuScene } from "./scenes/MainMenuScene";
import { RunScene } from "./scenes/RunScene";
import { LevelUpScene } from "./scenes/LevelUpScene";
import { DeathScene } from "./scenes/DeathScene";
import { MetaHubScene } from "./scenes/MetaHubScene";

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game-root",
  width: ARENA.width,
  height: ARENA.height,
  backgroundColor: "#04121f",
  pixelArt: false,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
    },
  },
  scene: [BootScene, MainMenuScene, RunScene, LevelUpScene, DeathScene, MetaHubScene],
});

// Exposed for debugging and automated smoke tests.
(window as unknown as { __GAME__?: Phaser.Game }).__GAME__ = game;
