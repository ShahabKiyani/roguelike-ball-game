import Phaser from "phaser";
import { ARENA, SCENES } from "../config/gameConfig";
import { SaveManager } from "../meta/SaveManager";
import { SoundManager } from "../audio/SoundManager";
import {
  PERMANENT_UPGRADES,
  UNLOCKS,
  type PermanentUpgradeDef,
  type Unlock,
} from "../meta/UnlockRegistry";
import { createButton } from "../ui/widgets";

export class MetaHubScene extends Phaser.Scene {
  private shardLabel!: Phaser.GameObjects.Text;

  constructor() {
    super(SCENES.metaHub);
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#04121f");
    const cx = ARENA.width / 2;

    this.add
      .text(cx, 40, "META HUB", {
        fontFamily: "Trebuchet MS, sans-serif",
        fontSize: "40px",
        fontStyle: "bold",
        color: "#6fffe9",
      })
      .setOrigin(0.5);

    this.shardLabel = this.add
      .text(cx, 80, "", {
        fontFamily: "Trebuchet MS, sans-serif",
        fontSize: "18px",
        color: "#f4d35e",
      })
      .setOrigin(0.5);

    this.add.text(60, 116, "PERMANENT UPGRADES", {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "15px",
      color: "#9db4c0",
    });
    PERMANENT_UPGRADES.forEach((def, i) => this.buildPermanentRow(def, 146 + i * 46));

    this.add.text(60, 340, "UNLOCKS", {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "15px",
      color: "#9db4c0",
    });
    const available = UNLOCKS.filter((u) => !SaveManager.get().unlocks.includes(u.id));
    available.slice(0, 2).forEach((u, i) => this.buildUnlockRow(u, 366 + i * 40));
    if (available.length === 0) {
      this.add.text(60, 366, "All unlocks purchased.", {
        fontFamily: "Trebuchet MS, sans-serif",
        fontSize: "14px",
        color: "#9db4c0",
      });
    }

    createButton(this, cx, ARENA.height - 30, "Back to Menu", () => this.scene.start(SCENES.menu), {
      width: 200,
    });

    this.refreshShards();
  }

  private refreshShards(): void {
    this.shardLabel.setText(`Shards available: ${SaveManager.get().shards}`);
  }

  private buildPermanentRow(def: PermanentUpgradeDef, y: number): void {
    const save = SaveManager.get();
    const rank = save.permanentUpgrades[def.id];
    const maxed = rank >= def.maxRank;
    const cost = def.costFor(rank);

    const info = this.add.text(60, y, "", {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "15px",
      color: "#eef4ed",
    });
    const render = () => {
      const r = SaveManager.get().permanentUpgrades[def.id];
      info.setText(`${def.name}  [${r}/${def.maxRank}]  —  ${def.description}`);
    };
    render();

    if (!maxed) {
      const button = createButton(
        this,
        ARENA.width - 110,
        y + 8,
        `Buy (${cost})`,
        () => {
          const current = SaveManager.get();
          const currentRank = current.permanentUpgrades[def.id];
          const price = def.costFor(currentRank);
          if (currentRank < def.maxRank && current.shards >= price) {
            SaveManager.update((s) => {
              s.shards -= price;
              s.permanentUpgrades[def.id] += 1;
            });
            SoundManager.play("select");
            this.refreshShards();
            this.scene.restart();
          } else {
            SoundManager.play("bad");
          }
        },
        { width: 150 }
      );
      button.setScale(0.9);
    } else {
      this.add
        .text(ARENA.width - 110, y + 8, "MAX", {
          fontFamily: "Trebuchet MS, sans-serif",
          fontSize: "15px",
          color: "#6fffe9",
        })
        .setOrigin(0.5);
    }
  }

  private buildUnlockRow(unlock: Unlock, y: number): void {
    const save = SaveManager.get();
    const eligible = unlock.requirement(save);

    this.add.text(60, y, `${unlock.name} — ${unlock.description}`, {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "13px",
      color: eligible ? "#eef4ed" : "#5e6f78",
      wordWrap: { width: ARENA.width - 260 },
    });

    if (!eligible) {
      this.add
        .text(ARENA.width - 110, y + 6, "locked", {
          fontFamily: "Trebuchet MS, sans-serif",
          fontSize: "13px",
          color: "#5e6f78",
        })
        .setOrigin(0.5);
      return;
    }

    const button = createButton(
      this,
      ARENA.width - 110,
      y + 6,
      `Unlock (${unlock.cost})`,
      () => {
        const current = SaveManager.get();
        if (current.shards >= unlock.cost && !current.unlocks.includes(unlock.id)) {
          SaveManager.update((s) => {
            s.shards -= unlock.cost;
            s.unlocks.push(unlock.id);
          });
          SoundManager.play("levelup");
          this.scene.restart();
        } else {
          SoundManager.play("bad");
        }
      },
      { width: 160, accent: 0xc77dff }
    );
    button.setScale(0.85);
  }
}
