import Phaser from "phaser";
import { BASE_RUN, COLORS, SCENES } from "../config/gameConfig";
import { generateArena, type Arena } from "../generation/ArenaGenerator";
import { planFloor, type FloorPlan } from "../systems/DifficultySystem";
import { SpawnSystem } from "../systems/SpawnSystem";
import { startingShields } from "../systems/UpgradeSystem";
import { SoundManager } from "../audio/SoundManager";
import { SaveManager } from "../meta/SaveManager";
import { Player } from "../entities/Player";
import { Orb } from "../entities/Orb";
import { Enemy } from "../entities/Enemy";
import { HUD } from "../ui/HUD";
import { spawnFloatingText } from "../ui/FloatingText";
import type { RunState, Vec } from "../types/runState";

type Settings = {
  colorblind: boolean;
  reducedMotion: boolean;
};

export class RunScene extends Phaser.Scene {
  private run!: RunState;
  private plan!: FloorPlan;
  private arena!: Arena;
  private settings!: Settings;

  private player!: Player;
  private spawner!: SpawnSystem;
  private hud!: HUD;
  private enemies!: Phaser.Physics.Arcade.Group;
  private walls: Phaser.GameObjects.Rectangle[] = [];
  private particles!: Phaser.GameObjects.Particles.ParticleEmitter;
  private pauseLabel?: Phaser.GameObjects.Text;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;

  private quotaLeft = 0;
  private maxTime = 0;
  private started = false;
  private paused = false;
  private finished = false;
  private invuln = 0;
  private relocateAcc = 0;
  private bossEmitAcc = 0;
  private lastTickSecond = Infinity;
  private scoreBoostUntil = 0;
  private secondWindUsed = false;

  constructor() {
    super(SCENES.run);
  }

  init(data: { run: RunState }): void {
    this.run = data.run;
  }

  create(): void {
    const save = SaveManager.get();
    this.settings = {
      colorblind: save.settings.colorblind,
      reducedMotion: save.settings.reducedMotion,
    };

    this.finished = false;
    this.started = false;
    this.paused = false;
    this.relocateAcc = 0;
    this.bossEmitAcc = 0;
    this.invuln = 0;
    this.secondWindUsed = false;
    this.lastTickSecond = Infinity;
    this.pauseLabel = undefined;

    this.plan = planFloor(this.run.floor);
    this.arena = generateArena(this.run.floor, this.run.seed, this.plan.wallCount);

    this.maxTime = this.plan.timeGrant + 12;
    this.run.timeBank = Math.min(this.run.timeBank + this.plan.timeGrant, this.maxTime);
    this.run.shields = startingShields(this.run);
    this.quotaLeft = this.plan.quota;

    this.physics.world.setBounds(0, 0, this.arena.width, this.arena.height);
    this.cameras.main.setBounds(0, 0, this.arena.width, this.arena.height);

    this.drawBackground();
    this.buildWalls();

    this.player = new Player(this, this.arena.playerSpawn.x, this.arena.playerSpawn.y);
    this.player.setReducedMotion(this.settings.reducedMotion);
    this.physics.add.collider(this.player, this.walls);

    this.spawner = new SpawnSystem(this, this.arena, this.run.seed + this.run.floor, this.settings);
    this.spawner.populate(this.plan);

    this.enemies = this.physics.add.group();
    this.spawnEnemies();
    this.physics.add.collider(this.enemies, this.walls);
    this.physics.add.overlap(this.player, this.enemies, (_p, enemy) => {
      this.onEnemyTouch(enemy as Enemy);
    });

    this.particles = this.add
      .particles(0, 0, "spark", { lifespan: 420, speed: { min: 40, max: 150 }, scale: { start: 0.6, end: 0 }, emitting: false })
      .setDepth(20);

    this.hud = new HUD(this);
    this.setupInput();

    const label = this.plan.isBoss
      ? `FLOOR ${this.run.floor}\nBOSS`
      : this.plan.isElite
        ? `FLOOR ${this.run.floor}\nELITE`
        : `FLOOR ${this.run.floor}`;
    this.hud.banner(label, this.plan.isBoss ? "#c77dff" : COLORS_HEX.accent, this.settings.reducedMotion);
    if (this.plan.isBoss) SoundManager.play("boss");
  }

  private drawBackground(): void {
    const t = this.arena.theme;
    const g = this.add.graphics().setDepth(0);
    g.fillGradientStyle(t.bgTop, t.bgTop, t.bgBottom, t.bgBottom, 1);
    g.fillRect(0, 0, this.arena.width, this.arena.height);
    g.lineStyle(1, t.grid, 0.08);
    for (let x = 0; x < this.arena.width; x += 40) {
      g.lineBetween(x, 0, x, this.arena.height);
    }
    for (let y = 0; y < this.arena.height; y += 40) {
      g.lineBetween(0, y, this.arena.width, y);
    }
  }

  private buildWalls(): void {
    const t = this.arena.theme;
    this.walls = [];
    for (const wall of this.arena.walls) {
      const rect = this.add
        .rectangle(wall.x + wall.width / 2, wall.y + wall.height / 2, wall.width, wall.height, t.grid, 0.16)
        .setStrokeStyle(2, t.accent, 0.5)
        .setDepth(3);
      this.physics.add.existing(rect, true);
      this.walls.push(rect);
    }
  }

  private spawnEnemies(): void {
    const spawnAwayFromPlayer = (): Vec => {
      const candidates = this.arena.spawnPoints.length
        ? this.arena.spawnPoints
        : [{ x: 60, y: 60 }];
      let best = candidates[0];
      let bestDist = -1;
      for (const c of candidates) {
        const d = Phaser.Math.Distance.Between(c.x, c.y, this.player.x, this.player.y);
        if (d > bestDist) {
          bestDist = d;
          best = c;
        }
      }
      return best;
    };

    if (this.plan.isBoss) {
      const pos = spawnAwayFromPlayer();
      const boss = new Enemy(this, pos.x, pos.y, "chaser");
      boss.setDisplaySize(44, 44);
      boss.body.setCircle(boss.width / 2, 0, 0);
      boss.setTint(0xc77dff);
      this.enemies.add(boss);
      return;
    }

    for (const kind of this.plan.enemies) {
      const pos = spawnAwayFromPlayer();
      const enemy = new Enemy(this, pos.x, pos.y, kind);
      if (kind === "patroller") {
        enemy.setPatrol(this.arena.spawnPoints.slice(0, 4));
      }
      this.enemies.add(enemy);
    }
  }

  private setupInput(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys("W,A,S,D") as Record<
      string,
      Phaser.Input.Keyboard.Key
    >;

    this.input.keyboard!.on("keydown-ESC", () => this.togglePause());
    this.input.keyboard!.on("keydown-P", () => this.togglePause());

    this.input.on("pointerdown", () => SoundManager.unlock());

    this.game.events.on(Phaser.Core.Events.BLUR, this.forcePause, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      // Only detach the global listener; Phaser destroys scene-owned objects
      // (player, orbs, groups) automatically during shutdown.
      this.game.events.off(Phaser.Core.Events.BLUR, this.forcePause, this);
    });
  }

  private forcePause(): void {
    if (!this.paused && this.started && !this.finished) {
      this.togglePause();
    }
  }

  private togglePause(): void {
    if (this.finished || !this.started) return;
    this.paused = !this.paused;
    if (this.paused) {
      this.physics.pause();
      this.tweens.pauseAll();
      if (!this.pauseLabel) {
        this.pauseLabel = this.add
          .text(this.scale.width / 2, this.scale.height / 2, "PAUSED\nesc to resume", {
            fontFamily: "Trebuchet MS, sans-serif",
            fontSize: "30px",
            fontStyle: "bold",
            color: COLORS_HEX.muted,
            align: "center",
          })
          .setOrigin(0.5)
          .setDepth(70);
      }
      this.pauseLabel.setVisible(true);
    } else {
      this.physics.resume();
      this.tweens.resumeAll();
      this.pauseLabel?.setVisible(false);
    }
  }

  private readDirection(): Vec {
    let dx = 0;
    let dy = 0;
    if (this.cursors.left.isDown || this.wasd.A.isDown) dx -= 1;
    if (this.cursors.right.isDown || this.wasd.D.isDown) dx += 1;
    if (this.cursors.up.isDown || this.wasd.W.isDown) dy -= 1;
    if (this.cursors.down.isDown || this.wasd.S.isDown) dy += 1;

    if (dx === 0 && dy === 0) {
      const pointer = this.input.activePointer;
      if (pointer.isDown) {
        const tx = pointer.worldX - this.player.x;
        const ty = pointer.worldY - this.player.y;
        if (Math.hypot(tx, ty) > 8) {
          dx = tx;
          dy = ty;
        }
      }
    }
    return { x: dx, y: dy };
  }

  update(_time: number, deltaMs: number): void {
    if (this.finished || this.paused) {
      if (this.player?.body) this.player.setVelocity(0, 0);
      return;
    }

    const delta = deltaMs / 1000;
    const dir = this.readDirection();
    const moving = dir.x !== 0 || dir.y !== 0;

    if (moving && !this.started) {
      this.started = true;
      SoundManager.unlock();
    }

    this.player.move(dir.x, dir.y, this.run.stats.speed);
    this.applyMagnet(delta);
    this.updateGhostVisibility();

    if (!this.started) return;

    this.invuln = Math.max(0, this.invuln - delta);
    this.tickTime(delta);
    this.collectNearbyOrbs();
    this.updateEnemies(delta);
    this.updateRelocate(delta);
    this.updateBoss(delta);

    this.hud.update(this.run, this.run.timeBank, this.maxTime, this.quotaLeft);

    if (this.quotaLeft <= 0) {
      this.clearFloor();
    } else if (this.run.timeBank <= 0) {
      this.handleTimeOut();
    }
  }

  private tickTime(delta: number): void {
    this.run.timeBank -= delta;
    const whole = Math.ceil(this.run.timeBank);
    if (whole <= 5 && whole >= 1 && whole !== this.lastTickSecond) {
      this.lastTickSecond = whole;
      SoundManager.play("tick");
    }
  }

  private applyMagnet(delta: number): void {
    const range = this.run.stats.magnetRange;
    if (range <= 0) return;
    this.spawner.group.getChildren().forEach((child) => {
      const orb = child as Orb;
      if (orb.kind === "bad") return;
      const d = Phaser.Math.Distance.Between(orb.x, orb.y, this.player.x, this.player.y);
      if (d < range && d > 1) {
        const pull = (1 - d / range) * 220 * delta;
        const angle = Math.atan2(this.player.y - orb.y, this.player.x - orb.x);
        orb.x += Math.cos(angle) * pull;
        orb.y += Math.sin(angle) * pull;
      }
    });
  }

  private updateGhostVisibility(): void {
    this.spawner.group.getChildren().forEach((child) => {
      const orb = child as Orb;
      if (orb.kind !== "ghost") return;
      orb.setProximity(
        Phaser.Math.Distance.Between(orb.x, orb.y, this.player.x, this.player.y)
      );
    });
  }

  private updateEnemies(delta: number): void {
    const playerPos = { x: this.player.x, y: this.player.y };
    this.enemies.getChildren().forEach((child) => {
      const enemy = child as Enemy;
      const result = enemy.think(playerPos, delta);
      if (result.explode) {
        this.bomberExplode(enemy);
      }
    });
  }

  private updateRelocate(delta: number): void {
    this.relocateAcc += delta;
    if (this.relocateAcc >= this.plan.relocateInterval) {
      this.relocateAcc = 0;
      if (this.run.stats.dangerSense) {
        this.spawner.forEachBad((orb) => orb.telegraph());
        this.time.delayedCall(this.settings.reducedMotion ? 0 : 320, () =>
          this.spawner.relocateAll()
        );
      } else {
        this.spawner.relocateAll();
      }
    }
  }

  private updateBoss(delta: number): void {
    if (!this.plan.isBoss) return;
    this.bossEmitAcc += delta;
    if (this.bossEmitAcc >= 2.4) {
      this.bossEmitAcc = 0;
      const boss = this.enemies.getChildren()[0] as Enemy | undefined;
      if (boss) {
        this.spawner.spawnBonus({ x: boss.x, y: boss.y });
      }
    }
  }

  /** Distance-based pickup, preserving the original game's reach formula. */
  private collectNearbyOrbs(): void {
    const orbs = [...this.spawner.group.getChildren()] as Orb[];
    for (const orb of orbs) {
      if (!orb.active) continue;
      const reach = BASE_RUN.playerSize + orb.radius + this.run.stats.pickupRadius * 0.4;
      const distance = Phaser.Math.Distance.Between(
        orb.x,
        orb.y,
        this.player.x,
        this.player.y
      );
      if (distance < reach) {
        this.onCollect(orb);
      }
    }
  }

  private onCollect(orb: Orb): void {
    switch (orb.kind) {
      case "good":
        this.collectGood(orb, 1, true);
        break;
      case "bad":
        this.takeHit(orb.x, orb.y);
        this.spawner.relocate(orb);
        break;
      case "neutral":
        this.collectNeutral(orb);
        break;
      case "shield":
        this.run.shields += 1;
        SoundManager.play("shield");
        this.floating(orb, "+shield", COLORS_HEX.shield);
        this.spawner.relocate(orb);
        break;
      case "multiplier":
        this.scoreBoostUntil = this.time.now + 8000;
        SoundManager.play("levelup");
        this.floating(orb, "2x score!", COLORS_HEX.multiplier);
        this.spawner.relocate(orb);
        break;
      case "ghost":
        this.collectGood(orb, 3, true);
        break;
    }
  }

  private currentMultiplier(): number {
    const boost = this.time.now < this.scoreBoostUntil ? 2 : 1;
    return this.run.stats.scoreMultiplier * boost;
  }

  private collectGood(orb: Orb, factor: number, countsQuota: boolean): void {
    const gain = Math.round(this.run.stats.goodScore * factor * this.currentMultiplier());
    this.run.score += gain;
    this.run.timeBank = Math.min(this.maxTime, this.run.timeBank + this.run.stats.goodTimeBonus * factor);
    this.run.orbsCollected += 1;
    if (countsQuota) this.quotaLeft -= 1;

    SoundManager.play("good");
    this.burst(orb.x, orb.y, COLORS.good);
    this.floating(orb, `+${gain}`, COLORS_HEX.good);

    if (this.run.stats.splitChance > 0 && Math.random() < this.run.stats.splitChance) {
      this.spawner.spawnBonus({ x: orb.x, y: orb.y });
      this.floating(orb, "split!", COLORS_HEX.accent);
    }
    this.spawner.relocate(orb);
  }

  private collectNeutral(orb: Orb): void {
    if (Math.random() < 0.5) {
      const gain = Math.round(15 * this.currentMultiplier());
      this.run.score += gain;
      this.run.timeBank = Math.min(this.maxTime, this.run.timeBank + 2);
      SoundManager.play("good");
      this.floating(orb, `gamble +${gain}`, COLORS_HEX.good);
    } else {
      this.takeHit(orb.x, orb.y);
    }
    this.spawner.relocate(orb);
  }

  private takeHit(x: number, y: number): void {
    if (this.invuln > 0) return;
    this.invuln = 0.6;

    if (this.run.shields > 0) {
      this.run.shields -= 1;
      SoundManager.play("shield");
      spawnFloatingText(this, x, y, "blocked", COLORS_HEX.shield, this.settings.reducedMotion);
      this.player.flashHit();
      return;
    }

    this.run.score = Math.max(0, this.run.score - this.run.stats.badScorePenalty);
    this.run.timeBank = Math.max(0, this.run.timeBank - this.run.stats.badTimePenalty);
    this.run.damageTaken += 1;

    SoundManager.play("bad");
    this.player.flashHit();
    if (!this.settings.reducedMotion) this.cameras.main.shake(160, 0.006);
    spawnFloatingText(
      this,
      x,
      y,
      `-${this.run.stats.badScorePenalty}`,
      COLORS_HEX.bad,
      this.settings.reducedMotion
    );
  }

  private onEnemyTouch(enemy: Enemy): void {
    if (enemy.kind === "bomber") return;
    this.takeHit(enemy.x, enemy.y);
  }

  private bomberExplode(enemy: Enemy): void {
    const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
    this.burst(enemy.x, enemy.y, 0xff3b3b);
    if (dist < 70) {
      this.takeHit(enemy.x, enemy.y);
    }
    const pos = this.arena.spawnPoints.length
      ? this.arena.spawnPoints[Math.floor(Math.random() * this.arena.spawnPoints.length)]
      : { x: 60, y: 60 };
    enemy.setPosition(pos.x, pos.y);
    enemy.setAlpha(1);
  }

  private handleTimeOut(): void {
    if (this.run.stats.secondWind && !this.secondWindUsed) {
      this.secondWindUsed = true;
      this.run.timeBank = 3;
      SoundManager.play("shield");
      this.hud.banner("SECOND WIND", COLORS_HEX.multiplier, this.settings.reducedMotion);
      return;
    }
    this.die();
  }

  private clearFloor(): void {
    if (this.finished) return;
    this.finished = true;
    this.run.cleared = true;
    this.player.setVelocity(0, 0);
    this.physics.pause();

    SoundManager.play("levelup");
    if (!this.settings.reducedMotion) this.cameras.main.zoomTo(1.05, 200, "Sine.easeInOut", true);
    this.hud.banner(this.plan.isBoss ? "BOSS DOWN!" : "FLOOR CLEAR!", COLORS_HEX.accent, this.settings.reducedMotion);

    if (this.plan.isBoss) {
      this.run.score += 50;
    }

    this.time.delayedCall(900, () => {
      this.scene.start(SCENES.levelUp, { run: this.run });
    });
  }

  private die(): void {
    if (this.finished) return;
    this.finished = true;
    this.player.setVelocity(0, 0);
    this.physics.pause();

    SoundManager.play("death");
    if (!this.settings.reducedMotion) this.cameras.main.shake(360, 0.012);

    this.persistRunResult();
    this.time.delayedCall(700, () => {
      this.scene.start(SCENES.death, { run: this.run });
    });
  }

  private persistRunResult(): void {
    const shardsEarned = Math.round(this.run.floor * 10 + this.run.score / 5);
    SaveManager.update((save) => {
      save.totalRuns += 1;
      save.totalOrbs += this.run.orbsCollected;
      save.shards += shardsEarned;
      save.bestScore = Math.max(save.bestScore, this.run.score);
      save.bestFloor = Math.max(save.bestFloor, this.run.floor);
    });
    this.registry.set("lastShardsEarned", shardsEarned);
  }

  private burst(x: number, y: number, color: number): void {
    if (this.settings.reducedMotion) return;
    this.particles.setParticleTint(color);
    this.particles.explode(10, x, y);
  }

  private floating(orb: Orb, message: string, color: string): void {
    spawnFloatingText(this, orb.x, orb.y, message, color, this.settings.reducedMotion);
  }
}

const COLORS_HEX = {
  accent: "#6fffe9",
  good: "#f4d35e",
  bad: "#ee6352",
  shield: "#5bc0eb",
  multiplier: "#c77dff",
  muted: "#9db4c0",
};
