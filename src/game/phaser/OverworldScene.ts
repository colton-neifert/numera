import { ENEMIES, WORLD_META } from "../content";
import { injectedKeys, touchState } from "../input";
import { sfx } from "../audio";
import type { WorldId } from "../types";
import type { OverworldHooks } from "./createGame";
import type { LevelDef } from "./levels";

type PhaserNS = typeof import("phaser");

const ACCEL = 2600;
const AIR_ACCEL = 1700;
const MAX_SPEED = 290;
const FRICTION = 2200;
const JUMP_V = -560;
const COYOTE = 110;
const BUFFER = 130;
const RISE_G = 980;
const FALL_G = 2100;
const APEX_G = 520;
const APEX = 46;
const TERMINAL = 880;

type Opts = {
  level: LevelDef;
  defeated: Set<string>;
  collected: Set<string>;
  spawn: { x: number; y: number };
  hooks: OverworldHooks;
};

export function makeOverworldScene(Phaser: PhaserNS, opts: Opts) {
  return class OverworldScene extends Phaser.Scene {
    private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    private platforms!: Phaser.Physics.Arcade.StaticGroup;
    private enemies!: Phaser.Physics.Arcade.Group;
    private crystals!: Phaser.Physics.Arcade.Group;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasd!: Record<"W" | "A" | "S" | "D" | "SPACE", Phaser.Input.Keyboard.Key>;
    private coyote = 0;
    private buffer = 0;
    private jumpHeld = false;
    private facing = 1;
    private engaged = false;
    private sky!: Phaser.GameObjects.TileSprite;
    private mid!: Phaser.GameObjects.TileSprite;

    constructor() {
      super("overworld");
    }

    init() {
      this.coyote = 0;
      this.buffer = 0;
      this.jumpHeld = false;
      this.facing = 1;
      this.engaged = false;
    }

    preload() {
      const world = WORLD_META[opts.level.id];
      this.load.image("sky", world.sky);
      this.load.image("mid", world.bg);
      this.load.image("plat-grass", "/game/sprites/plat-grass.png");
      this.load.image("plat-stone", "/game/sprites/plat-stone.png");
      this.load.image("gate", "/game/sprites/gate.png");
      this.load.spritesheet("hero-idle", "/game/sprites/hero-idle.png", {
        frameWidth: 128,
        frameHeight: 128,
      });
      this.load.spritesheet("hero-run", "/game/sprites/hero-run.png", {
        frameWidth: 128,
        frameHeight: 128,
      });
      this.load.spritesheet("hero-jump", "/game/sprites/hero-jump.png", {
        frameWidth: 128,
        frameHeight: 128,
      });
      this.load.spritesheet("plusling", "/game/sprites/plusling.png", {
        frameWidth: 128,
        frameHeight: 128,
      });
      this.load.spritesheet("timesprout", "/game/sprites/timesprout.png", {
        frameWidth: 128,
        frameHeight: 128,
      });
      this.load.spritesheet("glyphite", "/game/sprites/glyphite.png", {
        frameWidth: 128,
        frameHeight: 128,
      });
      this.load.spritesheet("remainder", "/game/sprites/boss.png", {
        frameWidth: 128,
        frameHeight: 128,
      });
      this.load.spritesheet("crystal", "/game/sprites/crystal.png", {
        frameWidth: 128,
        frameHeight: 128,
      });
    }

    create() {
      const { level } = opts;
      this.physics.world.setBounds(0, 0, level.width, level.height);
      this.physics.world.checkCollision.down = false;
      this.cameras.main.setBounds(0, 0, level.width, level.height);
      this.cameras.main.setDeadzone(180, 90);

      this.sky = this.add
        .tileSprite(0, 0, level.width, level.height, "sky")
        .setOrigin(0, 0)
        .setScrollFactor(0.15, 0)
        .setDepth(-20);
      this.mid = this.add
        .tileSprite(0, 0, level.width, level.height, "mid")
        .setOrigin(0, 0)
        .setScrollFactor(0.4, 0)
        .setAlpha(0.72)
        .setDepth(-10);

      this.anims.create({
        key: "idle",
        frames: this.anims.generateFrameNumbers("hero-idle", { start: 0, end: 3 }),
        frameRate: 6,
        repeat: -1,
      });
      this.anims.create({
        key: "run",
        frames: this.anims.generateFrameNumbers("hero-run", { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1,
      });
      this.anims.create({
        key: "jump",
        frames: this.anims.generateFrameNumbers("hero-jump", { start: 0, end: 3 }),
        frameRate: 8,
        repeat: 0,
      });
      for (const key of ["plusling", "timesprout", "glyphite", "remainder", "crystal"] as const) {
        this.anims.create({
          key: `${key}-idle`,
          frames: this.anims.generateFrameNumbers(key, { start: 0, end: 3 }),
          frameRate: key === "remainder" ? 5 : 7,
          repeat: -1,
        });
      }

      this.platforms = this.physics.add.staticGroup();
      const platKey = WORLD_META[level.id].platform;
      for (const p of level.platforms) {
        const sprite = this.platforms.create(p.x + p.w / 2, p.y + p.h / 2, platKey) as Phaser.Physics.Arcade.Sprite;
        sprite.setDisplaySize(p.w, p.h * (p.oneWay ? 1.6 : 2.1));
        sprite.refreshBody();
        const body = sprite.body as Phaser.Physics.Arcade.StaticBody;
        body.setSize(p.w, p.h);
        body.setOffset((sprite.displayWidth - p.w) / 2, (sprite.displayHeight - p.h) / 2);
        sprite.setData("oneWay", Boolean(p.oneWay));
        sprite.setDepth(1);
      }

      this.player = this.physics.add.sprite(opts.spawn.x, opts.spawn.y, "hero-idle", 0);
      this.player.setCollideWorldBounds(true);
      this.player.setSize(36, 58);
      this.player.setOffset(46, 52);
      this.player.setDepth(10);
      this.player.play("idle");

      this.physics.add.collider(
        this.player,
        this.platforms,
        undefined,
        (objA, objB) => {
          const plat = (objA === this.player ? objB : objA) as Phaser.Physics.Arcade.Sprite;
          if (!plat.getData("oneWay")) return true;
          const body = this.player.body;
          const pBody = plat.body as Phaser.Physics.Arcade.StaticBody;
          const drop =
            (this.cursors?.down.isDown || this.wasd.S.isDown) && this.jumpWanted();
          if (drop) return false;
          return body.velocity.y >= 0 && body.bottom <= pBody.top + 10;
        },
      );

      this.enemies = this.physics.add.group();
      for (const spot of level.enemies) {
        if (opts.defeated.has(spot.id)) continue;
        const e = this.enemies.create(spot.x, spot.y, spot.kind) as Phaser.Physics.Arcade.Sprite;
        e.setData("instanceId", spot.id);
        e.setData("kind", spot.kind);
        e.setData("originX", spot.x);
        const boss = spot.kind === "remainder";
        e.setScale(boss ? 1.55 : 0.95);
        e.setSize(boss ? 52 : 40, boss ? 70 : 42);
        e.setOffset(boss ? 38 : 44, boss ? 48 : 70);
        e.setCollideWorldBounds(true);
        e.setDepth(8);
        e.play(`${spot.kind}-idle`);
        this.tweens.add({
          targets: e,
          x: spot.x + (boss ? 40 : 90),
          duration: boss ? 2200 : 1600,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
          onUpdate: () => {
            const origin = e.getData("originX") as number;
            e.setFlipX(e.x < origin);
          },
        });
      }
      this.physics.add.collider(this.enemies, this.platforms);
      this.physics.add.overlap(this.player, this.enemies, (_p, enemyObj) => {
        if (this.engaged) return;
        const enemy = enemyObj as Phaser.Physics.Arcade.Sprite;
        const id = enemy.getData("instanceId") as string;
        const kind = enemy.getData("kind") as keyof typeof ENEMIES;
        this.engaged = true;
        this.player.setVelocity(0, 0);
        opts.hooks.onEncounter(
          {
            worldId: level.id as WorldId,
            enemyInstanceId: id,
            enemy: ENEMIES[kind] ?? ENEMIES.plusling,
          },
          { x: this.player.x, y: this.player.y },
        );
      });

      this.crystals = this.physics.add.group();
      for (const c of level.crystals) {
        if (opts.collected.has(c.id)) continue;
        const gem = this.crystals.create(c.x, c.y, "crystal") as Phaser.Physics.Arcade.Sprite;
        gem.setData("cid", c.id);
        gem.setScale(0.42);
        const gemBody = gem.body as Phaser.Physics.Arcade.Body | null;
        gemBody?.setAllowGravity(false);
        gem.play("crystal-idle");
        this.tweens.add({
          targets: gem,
          y: c.y - 10,
          duration: 900,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
      }
      this.physics.add.overlap(this.player, this.crystals, (_p, gemObj) => {
        const gem = gemObj as Phaser.Physics.Arcade.Sprite;
        const id = gem.getData("cid") as string;
        gem.destroy();
        sfx.collect();
        opts.hooks.onCollect(id);
      });

      const gate = this.physics.add.staticImage(level.gate.x, level.gate.y, "gate");
      gate.setDisplaySize(150, 168);
      gate.refreshBody();
      this.physics.add.overlap(this.player, gate, () => {
        if (this.engaged) return;
        const remaining = this.enemies.countActive(true);
        if (remaining > 0) return;
        this.engaged = true;
        opts.hooks.onGate();
      });

      this.cursors = this.input.keyboard!.createCursorKeys();
      this.wasd = this.input.keyboard!.addKeys("W,A,S,D,SPACE") as typeof this.wasd;
      this.cameras.main.startFollow(this.player, true, 0.12, 0.14);

      window.__controlsTest = {
        getYaw: () => 0,
        getSpeed: () => this.player.body.velocity.x,
        getX: () => this.player.x,
        getVx: () => this.player.body.velocity.x,
        setKeys: (codes) => {
          injectedKeys.clear();
          for (const c of codes) injectedKeys.add(c);
        },
      };

      this.events.once("shutdown", () => {
        if (window.__controlsTest) delete window.__controlsTest;
        injectedKeys.clear();
      });
    }

    removeEnemy(id: string) {
      for (const child of this.enemies.getChildren()) {
        const sprite = child as Phaser.Physics.Arcade.Sprite;
        if (sprite.getData("instanceId") === id) {
          sprite.destroy();
        }
      }
      this.engaged = false;
    }

    private keyDown(code: "left" | "right" | "jump"): boolean {
      if (code === "left") {
        return (
          this.cursors.left.isDown ||
          this.wasd.A.isDown ||
          touchState.left ||
          injectedKeys.has("KeyA") ||
          injectedKeys.has("ArrowLeft")
        );
      }
      if (code === "right") {
        return (
          this.cursors.right.isDown ||
          this.wasd.D.isDown ||
          touchState.right ||
          injectedKeys.has("KeyD") ||
          injectedKeys.has("ArrowRight")
        );
      }
      return (
        this.cursors.up.isDown ||
        this.wasd.W.isDown ||
        this.wasd.SPACE.isDown ||
        this.cursors.space.isDown ||
        touchState.jumpHeld ||
        injectedKeys.has("Space") ||
        injectedKeys.has("KeyW") ||
        injectedKeys.has("ArrowUp")
      );
    }

    private jumpWanted() {
      return this.keyDown("jump") || touchState.jumpQueued;
    }

    update(_time: number, delta: number) {
      if (this.engaged || !this.player?.body) return;
      const dt = Math.min(delta, 50) / 1000;
      const body = this.player.body;
      const grounded = body.blocked.down || body.touching.down;

      if (grounded) this.coyote = COYOTE / 1000;
      else this.coyote = Math.max(0, this.coyote - dt);

      const jumpDown = this.jumpWanted();
      if (jumpDown && !this.jumpHeld) this.buffer = BUFFER / 1000;
      else this.buffer = Math.max(0, this.buffer - dt);
      this.jumpHeld = jumpDown;
      touchState.jumpQueued = false;

      const left = this.keyDown("left");
      const right = this.keyDown("right");
      let axis = 0;
      if (left) axis -= 1;
      if (right) axis += 1;

      const accel = grounded ? ACCEL : AIR_ACCEL;
      if (axis !== 0) {
        body.velocity.x = Phaser.Math.Clamp(
          body.velocity.x + axis * accel * dt,
          -MAX_SPEED,
          MAX_SPEED,
        );
        this.facing = axis;
        this.player.setFlipX(axis < 0);
      } else if (grounded) {
        const sign = Math.sign(body.velocity.x);
        const mag = Math.max(0, Math.abs(body.velocity.x) - FRICTION * dt);
        body.velocity.x = mag * sign;
      }

      if (this.buffer > 0 && this.coyote > 0) {
        body.velocity.y = JUMP_V;
        this.buffer = 0;
        this.coyote = 0;
        sfx.jump();
        this.player.play("jump", true);
      }

      if (!jumpDown && body.velocity.y < 0) {
        body.velocity.y *= 0.52;
      }

      let g = FALL_G;
      if (body.velocity.y < 0) g = RISE_G;
      if (Math.abs(body.velocity.y) < APEX) g = APEX_G;
      body.velocity.y = Math.min(TERMINAL, body.velocity.y + g * dt);

      if (!grounded) {
        if (this.player.anims.currentAnim?.key !== "jump") this.player.play("jump", true);
      } else if (Math.abs(body.velocity.x) > 28) {
        this.player.play("run", true);
      } else {
        this.player.play("idle", true);
      }

      if (this.player.y > opts.level.height + 80) {
        this.player.setPosition(opts.level.spawn.x, opts.level.spawn.y);
        this.player.setVelocity(0, 0);
      }
    }
  };
}
