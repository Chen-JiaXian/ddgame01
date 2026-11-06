import {
  Enemy,
  Platform,
  Chest,
  CoinPickup,
  ExpOrb,
  Projectile,
  Particle,
  DamageNumber,
  PlayerStats,
  PlayerInput,
  WeaponId,
  Weapon,
  TalentKey,
} from './types.ts';
import { WEAPONS } from './weapons.ts';
import { LevelData, LEVELS } from './levels.ts';
import { TALENTS_CONFIG } from './talents.ts';
import { sounds } from '../audio/soundManager.ts';

export interface LightningStrike {
  id: number;
  x: number;
  y: number;
  timer: number;
  duration: number; // 2.0s 落雷延遲
  damage: number;
  hasStruck: boolean;
  strikeTimer: number;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animFrameId: number | null = null;
  private lastTime: number = 0;

  // Level & World
  public currentStageIndex: number = 0;
  public currentLevel: LevelData;

  // Player
  public player = {
    x: 100,
    y: 700,
    vx: 0,
    vy: 0,
    width: 28,
    height: 44,
    facing: 1 as 1 | -1,
    isGrounded: false,
    canDoubleJump: true,
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    scaleX: 1,
    scaleY: 1,

    // Dash
    isDashing: false,
    dashTimer: 0,
    dashCooldown: 0,
    dashHitEnemyIds: new Set<number>(), // 衝刺碰撞命中魔物追蹤

    // Attack
    isAttacking: false,
    attackTimer: 0,
    attackDuration: 0.25,
    attackCooldown: 0,
    attackHitDone: false,
    slashAngle: 0,

    // Hurt & invincibility
    hurtTimer: 0,
    invincibleTimer: 0,

    // Platform drop-through
    dropThroughTimer: 0,
  };

  // Stats
  public stats: PlayerStats = {
    level: 1,
    exp: 0,
    nextLevelExp: 120, // 提升升級所需經驗值 (起步 120 EXP)
    hp: 100,
    maxHp: 100,
    baseAtk: 10,
    def: 2,
    coins: 30, // starter purse
    equippedWeaponId: 'rusty_dagger',
    ownedWeaponIds: ['rusty_dagger'],
    monstersSlain: 0,
    hpRegen: 1, // 每秒回復生命屬性，基礎值為1
    talentPoints: 1, // 初始提供 1 點天賦點數
    talents: {
      damage: 0,
      range: 0,
      attackSpeed: 0,
      hpRegen: 0,
      moveSpeed: 0,
    },
  };

  private hpRegenTimer: number = 0;

  // Inputs
  public input: PlayerInput = {
    left: false,
    right: false,
    up: false,
    down: false,
    jump: false,
    jumpJustPressed: false,
    attack: false,
    attackJustPressed: false,
    dash: false,
    dashJustPressed: false,
  };

  // Entities
  public enemies: Enemy[] = [];
  public platforms: Platform[] = [];
  public chests: Chest[] = [];
  public coins: CoinPickup[] = [];
  public expOrbs: ExpOrb[] = [];
  public projectiles: Projectile[] = [];
  public particles: Particle[] = [];
  public damageNumbers: DamageNumber[] = [];

  // Camera & Screen Shake
  public camera = { x: 0, y: 0 };
  public screenShake = 0;
  public screenShakeEnabled: boolean = true;
  public hitstopTimer = 0;

  // Boss & Portal State (傳送門預設關閉，擊敗該關Boss後解鎖開啟)
  public activeBoss: Enemy | null = null;
  public isPortalOpen: boolean = false;
  public isBossEngaged: boolean = false;
  private portalNoticeTimer: number = 0;
  public lightningStrikes: LightningStrike[] = [];
  private bossLightningTimer: number = 2.0;

  // Notification banners (e.g. Level Up, Stage Complete)
  public bannerText: string | null = null;
  public bannerSubtext: string | null = null;
  public bannerTimer: number = 0;

  // State callbacks for React
  public onStatsChange?: (stats: PlayerStats) => void;
  public onBossChange?: (boss: Enemy | null) => void;
  public onGameOver?: () => void;
  public onVictory?: () => void;
  public onStageChange?: (stageName: string) => void;

  public isPaused: boolean = false;
  private isDestroyed: boolean = false;
  // Start Menu Mode (選單模式下玩家無敵且隱藏)
  public isMenuMode: boolean = true;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.currentLevel = LEVELS[0];
    this.loadLevel(0, false);
    this.player.invincibleTimer = 99999;
  }

  public start() {
    this.lastTime = performance.now();
    this.loop(this.lastTime);
    sounds.startBGM();
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    sounds.stopBGM();
  }

  public pause() {
    this.isPaused = true;
  }

  public resume() {
    this.isPaused = false;
    this.lastTime = performance.now();
  }

  public setMenuMode(isMenu: boolean) {
    this.isMenuMode = isMenu;
    if (isMenu) {
      this.player.invincibleTimer = 99999;
    } else {
      const spawn = this.currentLevel.playerSpawn;
      this.player.x = spawn.x;
      this.player.y = spawn.y;
      this.player.vx = 0;
      this.player.vy = 0;
      this.player.invincibleTimer = 1.5;
      this.stats.hp = this.stats.maxHp;
      this.notifyStats();
    }
  }

  public loadLevel(stageIndex: number, keepPlayerStats: boolean = true) {
    this.currentStageIndex = stageIndex % LEVELS.length;
    this.currentLevel = JSON.parse(JSON.stringify(LEVELS[this.currentStageIndex]));

    // Reset entities
    this.platforms = [...this.currentLevel.platforms];
    this.chests = [...this.currentLevel.chests];
    this.coins = [];
    this.expOrbs = [];
    this.projectiles = [];
    this.particles = [];
    this.damageNumbers = [];
    this.lightningStrikes = [];
    this.bossLightningTimer = 2.0;
    this.activeBoss = null;
    this.isPortalOpen = false; // 傳送門預設為關閉，打敗該關BOSS後才開啟！
    this.isBossEngaged = false;
    this.portalNoticeTimer = 0;

    // Reset player position
    this.player.x = this.currentLevel.playerSpawn.x;
    this.player.y = this.currentLevel.playerSpawn.y;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.isGrounded = false;
    this.player.isDashing = false;
    this.player.dashHitEnemyIds.clear();
    this.player.isAttacking = false;
    this.player.dropThroughTimer = 0;

    // Spawn enemies
    let enemyIdCounter = 1;
    this.enemies = this.currentLevel.enemies.map((e) => {
      let width = 32;
      let height = 30;
      let maxHp = 30;
      let damage = 8;
      let expReward = 15;
      let coinReward = 8;
      let bossName: string | undefined = undefined;

      if (e.type === 'slime') {
        width = 30;
        height = 24;
        maxHp = 25 + stageIndex * 15;
        damage = 6 + stageIndex * 3;
        expReward = 12 + stageIndex * 6;
        coinReward = 5 + stageIndex * 4;
      } else if (e.type === 'goblin') {
        width = 34;
        height = 42;
        maxHp = 55 + stageIndex * 25;
        damage = 12 + stageIndex * 5;
        expReward = 28 + stageIndex * 12;
        coinReward = 16 + stageIndex * 8;
      } else if (e.type === 'bat') {
        width = 28;
        height = 24;
        maxHp = 20 + stageIndex * 10;
        damage = 8 + stageIndex * 3;
        expReward = 16 + stageIndex * 8;
        coinReward = 10 + stageIndex * 6;
      } else if (e.type === 'skeleton') {
        width = 32;
        height = 44;
        maxHp = 45 + stageIndex * 20;
        damage = 14 + stageIndex * 6;
        expReward = 32 + stageIndex * 14;
        coinReward = 20 + stageIndex * 10;
      } else if (e.type === 'boss_knight') {
        if (stageIndex === 0) {
          bossName = '【守關首領】地城巨骸將軍';
          width = 54;
          height = 72;
          maxHp = 6500; // boss血量大幅提升
          damage = 22;
          expReward = 500;
          coinReward = 450;
        } else if (stageIndex === 1) {
          bossName = '【守關首領】熔岩巨刃魔將';
          width = 58;
          height = 76;
          maxHp = 13500; // boss血量提升
          damage = 32;
          expReward = 850;
          coinReward = 750;
        } else if (stageIndex === 2) {
          bossName = '【深淵首領】深淵大魔王';
          width = 64;
          height = 82;
          maxHp = 22000; // boss血量提升
          damage = 44;
          expReward = 1400;
          coinReward = 1100;
        } else if (stageIndex === 3) {
          bossName = '【太古首領】遠古死靈法皇';
          width = 66;
          height = 84;
          maxHp = 34000; // boss血量提升
          damage = 56;
          expReward = 2000;
          coinReward = 1600;
        } else {
          bossName = '【創世神魔】混沌毀滅魔神';
          width = 72;
          height = 90;
          maxHp = 50000; // 終極BOSS血量
          damage = 72;
          expReward = 3200;
          coinReward = 2500;
        }
      }

      const enemy: Enemy = {
        id: enemyIdCounter++,
        type: e.type,
        name: bossName,
        x: e.x,
        y: e.y,
        vx: 0,
        vy: 0,
        width,
        height,
        maxHp,
        hp: maxHp,
        damage,
        expReward,
        coinReward,
        facing: -1,
        isGrounded: false,
        patrolLeft: e.x - (e.patrolRange || 120),
        patrolRight: e.x + (e.patrolRange || 120),
        state: 'patrol',
        stateTimer: Math.random() * 2,
        attackCooldown: 1,
        hurtTimer: 0,
        isBoss: e.isBoss,
      };

      if (e.isBoss) {
        this.activeBoss = enemy;
      }

      return enemy;
    });

    if (!keepPlayerStats) {
      this.stats.level = 1;
      this.stats.exp = 0;
      this.stats.nextLevelExp = 120; // 提升升級所需經驗值
      this.stats.hp = 100;
      this.stats.maxHp = 100;
      this.stats.baseAtk = 10;
      this.stats.def = 2;
      this.stats.coins = 30;
      this.stats.equippedWeaponId = 'rusty_dagger';
      this.stats.ownedWeaponIds = ['rusty_dagger'];
      this.stats.monstersSlain = 0;
      this.stats.hpRegen = 1;
      this.stats.talentPoints = 1;
      this.stats.talents = {
        damage: 0,
        range: 0,
        attackSpeed: 0,
        hpRegen: 0,
        moveSpeed: 0,
      };
      this.hpRegenTimer = 0;
    }

    this.showBanner(this.currentLevel.name, this.currentLevel.subtitle);
    this.notifyStats();
    if (this.onBossChange) this.onBossChange(this.activeBoss);
    if (this.onStageChange) this.onStageChange(this.currentLevel.name);
  }

  public showBanner(title: string, sub: string) {
    this.bannerText = title;
    this.bannerSubtext = sub;
    this.bannerTimer = 3.5;
  }

  public equipWeapon(id: WeaponId) {
    if (this.stats.ownedWeaponIds.includes(id)) {
      this.stats.equippedWeaponId = id;
      sounds.playBuy();
      this.notifyStats();
      this.spawnParticleBurst(
        this.player.x + this.player.width / 2,
        this.player.y + this.player.height / 2,
        '#38bdf8',
        18
      );
    }
  }

  public buyWeapon(id: WeaponId): boolean {
    const weapon = WEAPONS[id];
    if (!weapon) return false;
    if (this.stats.ownedWeaponIds.includes(id)) {
      this.equipWeapon(id);
      return true;
    }
    if (this.stats.coins >= weapon.price) {
      this.stats.coins -= weapon.price;
      this.stats.ownedWeaponIds.push(id);
      this.stats.equippedWeaponId = id;
      sounds.playBuy();
      this.notifyStats();
      this.showBanner(`已解鎖神兵：${weapon.name}!`, weapon.description);
      this.spawnParticleBurst(
        this.player.x + this.player.width / 2,
        this.player.y + this.player.height / 2,
        weapon.color,
        28
      );
      return true;
    }
    return false;
  }

  // TALENT TREE METHODS
  public upgradeTalent(talentKey: TalentKey): boolean {
    if (this.stats.talentPoints <= 0) return false;
    const currentRank = this.stats.talents[talentKey] || 0;
    const config = TALENTS_CONFIG[talentKey];
    if (!config || currentRank >= config.maxRank) return false;

    this.stats.talentPoints -= 1;
    this.stats.talents[talentKey] = currentRank + 1;
    this.recalculateTalentEffects();
    sounds.playTalentUpgrade();
    this.spawnParticleBurst(
      this.player.x + this.player.width / 2,
      this.player.y + this.player.height / 2,
      config.color,
      20
    );
    this.showBanner(`★ 天賦升級：${config.name} (Lv.${currentRank + 1}) ★`, config.effectPerRank);
    this.notifyStats();
    return true;
  }

  public downgradeTalent(talentKey: TalentKey): boolean {
    const currentRank = this.stats.talents[talentKey] || 0;
    if (currentRank <= 0) return false;

    this.stats.talentPoints += 1;
    this.stats.talents[talentKey] = currentRank - 1;
    this.recalculateTalentEffects();
    sounds.playBuy();
    this.notifyStats();
    return true;
  }

  public resetTalents(): void {
    let refunded = 0;
    for (const key of Object.keys(this.stats.talents) as TalentKey[]) {
      refunded += this.stats.talents[key] || 0;
      this.stats.talents[key] = 0;
    }
    this.stats.talentPoints += refunded;
    this.recalculateTalentEffects();
    sounds.playBuy();
    this.showBanner('★ 天賦點數已全數重置 ★', `已返還 ${refunded} 點天賦點數，可自由重新分配！`);
    this.notifyStats();
  }

  public recalculateTalentEffects(): void {
    // 增加每秒回復生命屬性 基礎值為1 + 天賦每級+1
    this.stats.hpRegen = 1 + (this.stats.talents.hpRegen || 0);
  }

  private notifyStats() {
    if (this.onStatsChange) {
      this.onStatsChange({ ...this.stats });
    }
  }

  // MAIN GAME LOOP
  private loop = (time: number) => {
    if (this.isDestroyed) return;

    const rawDt = (time - this.lastTime) / 1000;
    this.lastTime = time;
    const dt = Math.min(rawDt, 0.05); // clamped delta time

    if (!this.isPaused) {
      // Hitstop logic
      if (this.hitstopTimer > 0) {
        this.hitstopTimer -= dt;
      } else {
        this.update(dt);
      }
    }

    this.render();
    this.resetEdgeInputs();

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private resetEdgeInputs() {
    this.input.jumpJustPressed = false;
    this.input.attackJustPressed = false;
    this.input.dashJustPressed = false;
  }

  // UPDATE SIMULATION
  private update(dt: number) {
    if (this.bannerTimer > 0) {
      this.bannerTimer -= dt;
      if (this.bannerTimer <= 0) {
        this.bannerText = null;
        this.bannerSubtext = null;
      }
    }

    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 25);
    }
    if (this.portalNoticeTimer > 0) {
      this.portalNoticeTimer -= dt;
    }

    this.updateMovingPlatforms(dt);
    this.updatePlayer(dt);
    this.updateProjectiles(dt);
    this.updateEnemies(dt);
    this.updateLightningStrikes(dt);
    this.updateCoinsAndExp(dt);
    this.updateChests();
    this.updatePortal();
    this.updateParticles(dt);
    this.updateDamageNumbers(dt);
    this.updateCamera(dt);
  }

  private updateMovingPlatforms(dt: number) {
    for (const p of this.platforms) {
      if (p.type === 'moving' && p.vx && p.range && p.startX !== undefined) {
        p.x += p.vx * 60 * dt;
        if (Math.abs(p.x - p.startX) >= p.range) {
          p.vx = -p.vx;
        }
      }
    }
  }

  private updatePlayer(dt: number) {
    if (this.isMenuMode) {
      this.player.invincibleTimer = 99999;
      return;
    }

    const p = this.player;
    const stats = this.stats;
    const currentWeapon = WEAPONS[stats.equippedWeaponId] || WEAPONS.rusty_dagger;

    // Timers
    if (p.hurtTimer > 0) p.hurtTimer -= dt;
    if (p.invincibleTimer > 0) p.invincibleTimer -= dt;
    if (p.dashCooldown > 0) p.dashCooldown -= dt;
    if (p.coyoteTimer > 0) p.coyoteTimer -= dt;
    if (p.jumpBufferTimer > 0) p.jumpBufferTimer -= dt;
    if (p.attackCooldown > 0) p.attackCooldown -= dt;
    if (p.dropThroughTimer > 0) p.dropThroughTimer -= dt;

    // Squash & stretch recovery
    p.scaleX += (1 - p.scaleX) * 12 * dt;
    p.scaleY += (1 - p.scaleY) * 12 * dt;

    // HP Regeneration (每秒回復生命屬性，基礎值為1 + 天賦加成)
    if (stats.hp < stats.maxHp && !this.isMenuMode) {
      this.hpRegenTimer += dt;
      if (this.hpRegenTimer >= 1.0) {
        this.hpRegenTimer -= 1.0;
        const regenAmount = Math.max(1, Math.round(stats.hpRegen || 1));
        const oldHp = stats.hp;
        stats.hp = Math.min(stats.maxHp, stats.hp + regenAmount);
        if (stats.hp > oldHp) {
          this.addDamageNumber(
            p.x + p.width / 2,
            p.y - 12,
            `+${stats.hp - oldHp} HP`,
            '#4ade80',
            false
          );
          this.spawnParticleBurst(
            p.x + p.width / 2,
            p.y + p.height / 2,
            '#4ade80',
            4
          );
          this.notifyStats();
        }
      }
    } else {
      this.hpRegenTimer = 0;
    }

    // Move speed talent multiplier
    const moveSpeedBonus = 1 + (stats.talents?.moveSpeed || 0) * 0.1;

    // Buffer jump input
    if (this.input.jumpJustPressed) {
      p.jumpBufferTimer = 0.14;
    }

    // Dash Action (衝刺路徑碰撞造成一次攻擊傷害)
    if (this.input.dashJustPressed && p.dashCooldown <= 0 && !p.isDashing) {
      p.isDashing = true;
      p.dashTimer = 0.22;
      p.dashCooldown = 0.72;
      p.invincibleTimer = 0.25;
      p.dashHitEnemyIds.clear(); // 清空當次衝刺已命中的魔物集合
      p.vx = p.facing * 640 * moveSpeedBonus;
      p.vy = 0;
      p.scaleX = 1.35;
      p.scaleY = 0.75;
      sounds.playDash();
      this.spawnParticleBurst(p.x + p.width / 2, p.y + p.height / 2, '#38bdf8', 12);
    }

    if (p.isDashing) {
      p.dashTimer -= dt;
      p.vx = p.facing * 640 * moveSpeedBonus;
      p.vy = 0;

      // 衝刺路徑碰撞造成一次攻擊傷害
      for (const enemy of this.enemies) {
        if (enemy.state === 'dead') continue;
        if (
          !p.dashHitEnemyIds.has(enemy.id) &&
          this.checkAABB(p.x, p.y, p.width, p.height, enemy.x, enemy.y, enemy.width, enemy.height)
        ) {
          p.dashHitEnemyIds.add(enemy.id);

          const isCrit = Math.random() < 0.25;
          const talentDmgMultiplier = 1 + (stats.talents?.damage || 0) * 0.12;
          const talentFlatAtk = (stats.talents?.damage || 0) * 4;
          const baseDmgCalc = currentWeapon.damage + (stats.level - 1) * 5 + stats.baseAtk + talentFlatAtk;
          const rawDmg = Math.round(baseDmgCalc * talentDmgMultiplier * 1.15); // 衝刺動能衝擊
          const totalDamage = Math.round(isCrit ? rawDmg * 1.8 : rawDmg);

          enemy.hp -= totalDamage;
          enemy.hurtTimer = 0.2;
          enemy.state = 'hurt';
          enemy.vx = p.facing * 350;
          enemy.vy = -120;

          sounds.playHit(isCrit);
          this.hitstopTimer = 0.04;
          this.screenShake = Math.max(this.screenShake, isCrit ? 9 : 5);

          this.addDamageNumber(
            enemy.x + enemy.width / 2,
            enemy.y - 12,
            `⚡${totalDamage}${isCrit ? ' 暴擊!' : ' 衝刺斬!'}`,
            isCrit ? '#ef4444' : '#38bdf8',
            isCrit
          );

          this.spawnParticleBurst(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#38bdf8', 16);

          // 觸發武器專屬特效 (燃燒5秒 / 迷你落雷 / 冰霜爆炸)
          this.applyWeaponHitEffects(currentWeapon, enemy, totalDamage, isCrit);

          if (enemy.hp <= 0) {
            this.killEnemy(enemy);
          }
        }
      }

      // Spawn trail particles
      if (Math.random() < 0.5) {
        this.particles.push({
          x: p.x + Math.random() * p.width,
          y: p.y + Math.random() * p.height,
          vx: -p.facing * 40,
          vy: (Math.random() - 0.5) * 30,
          size: 4,
          color: '#38bdf8',
          alpha: 0.8,
          decay: 3.5,
        });
      }
      if (p.dashTimer <= 0) {
        p.isDashing = false;
        p.vx *= 0.4;
      }
    } else {
      // Horizontal Movement (受移動速度天賦加成)
      const moveSpeed = 310 * moveSpeedBonus;
      const accel = p.isGrounded ? 1800 : 1200;
      const friction = p.isGrounded ? 2000 : 800;

      if (this.input.left && !this.input.right) {
        p.vx = Math.max(p.vx - accel * dt, -moveSpeed);
        p.facing = -1;
      } else if (this.input.right && !this.input.left) {
        p.vx = Math.min(p.vx + accel * dt, moveSpeed);
        p.facing = 1;
      } else {
        // Friction
        if (p.vx > 0) {
          p.vx = Math.max(0, p.vx - friction * dt);
        } else if (p.vx < 0) {
          p.vx = Math.min(0, p.vx + friction * dt);
        }
      }

      // Gravity
      const gravity = 1450;
      p.vy = Math.min(p.vy + gravity * dt, 850);

      // Jump & Drop-down Logic (下跳必須嚴格要求同時按下「下方向鍵 + 空白跳躍鍵」)
      const canJumpGrounded = p.isGrounded || p.coyoteTimer > 0;
      if (p.jumpBufferTimer > 0) {
        if (this.input.down && p.isGrounded) {
          // 下跳：按下方向鍵 + 空白鍵立即下穿單向平臺
          let dropped = false;
          for (const plat of this.platforms) {
            if (plat.type === 'one_way' || plat.type === 'moving') {
              if (
                Math.abs(p.y + p.height - plat.y) <= 15 &&
                p.x + p.width > plat.x &&
                p.x < plat.x + plat.width
              ) {
                p.dropThroughTimer = 0.22; // 0.22秒內下穿忽略平臺
                p.y = plat.y + 12; // 腳底立即推至平臺下方
                p.vy = 240; // 快速下墜初速
                p.isGrounded = false;
                p.coyoteTimer = 0;
                dropped = true;
                break;
              }
            }
          }
          p.jumpBufferTimer = 0;
          if (dropped) {
            sounds.playJump();
          }
        } else if (canJumpGrounded) {
          // Regular Ground Jump
          p.vy = -540;
          p.isGrounded = false;
          p.coyoteTimer = 0;
          p.jumpBufferTimer = 0;
          p.canDoubleJump = true;
          p.scaleX = 0.75;
          p.scaleY = 1.35;
          sounds.playJump();
          this.spawnDust(p.x + p.width / 2, p.y + p.height);
        } else if (p.canDoubleJump) {
          // Mid-air Double Jump
          p.vy = -480;
          p.canDoubleJump = false;
          p.jumpBufferTimer = 0;
          p.scaleX = 0.7;
          p.scaleY = 1.3;
        }
      }

      // Variable jump height: release jump early to cut jump short
      if (!this.input.jump && p.vy < -200) {
        p.vy += 800 * dt;
      }
    }

    // ATTACK LOGIC (攻擊時完全自由移動與跳躍，支援按住Ctrl連擊，受攻速天賦加成)
    const attackSpeedBonus = 1 + (stats.talents?.attackSpeed || 0) * 0.12;
    const effectiveAttackSpeed = currentWeapon.attackSpeed / attackSpeedBonus;
    if ((this.input.attackJustPressed || this.input.attack) && p.attackCooldown <= 0 && !p.isAttacking) {
      p.isAttacking = true;
      p.attackTimer = effectiveAttackSpeed;
      p.attackDuration = effectiveAttackSpeed;
      p.attackCooldown = effectiveAttackSpeed;
      p.attackHitDone = false;
      p.slashAngle = -Math.PI / 4;
      sounds.playAttack(currentWeapon.id);

      // Weapon projectile / wave triggers with increased scope and talent bonus
      const talentDmgBonus = 1 + (stats.talents?.damage || 0) * 0.12;
      const talentFlatAtk = (stats.talents?.damage || 0) * 4;
      if (currentWeapon.specialEffect === 'holy_beam') {
        this.projectiles.push({
          id: Date.now() + Math.random(),
          x: p.x + (p.facing === 1 ? p.width + 20 : -20),
          y: p.y + p.height / 2 - 10,
          vx: p.facing * 750,
          vy: 0,
          radius: 28,
          damage: Math.round(((currentWeapon.damage * 1.1 + stats.baseAtk * 0.7) + talentFlatAtk) * talentDmgBonus),
          fromPlayer: true,
          element: 'holy_beam',
          life: 1.6,
          maxLife: 1.6,
        });
      } else if (currentWeapon.specialEffect === 'fire') {
        this.spawnParticleBurst(
          p.x + (p.facing === 1 ? p.width + 40 : -40),
          p.y + p.height / 2,
          '#f97316',
          18
        );
      } else if (currentWeapon.specialEffect === 'lightning') {
        this.spawnParticleBurst(
          p.x + (p.facing === 1 ? p.width + 60 : -60),
          p.y + p.height / 2,
          '#eab308',
          18
        );
      }
    }

    if (p.isAttacking) {
      p.attackTimer -= dt;
      const progress = 1 - p.attackTimer / p.attackDuration;
      p.slashAngle = -Math.PI / 3 + progress * (Math.PI * 0.85);

      // Check melee weapon hit against enemies
      if (!p.attackHitDone && progress >= 0.25) {
        this.checkMeleeAttackHits(currentWeapon);
        p.attackHitDone = true;
      }

      if (p.attackTimer <= 0) {
        p.isAttacking = false;
      }
    }

    // Apply movement with platform collisions
    this.resolvePlayerMovement(dt);

    // Hazard collision (Spikes / bottom of map)
    if (p.y > this.currentLevel.worldHeight - 30) {
      this.damagePlayer(35, '深淵墜落');
      p.y = this.currentLevel.playerSpawn.y;
      p.x = Math.max(100, p.x - 200);
      p.vy = 0;
      p.vx = 0;
    }
  }

  private resolvePlayerMovement(dt: number) {
    const p = this.player;
    const wasGrounded = p.isGrounded;

    // Move X
    p.x += p.vx * dt;
    // Boundary X
    if (p.x < 0) p.x = 0;
    if (p.x + p.width > this.currentLevel.worldWidth) {
      p.x = this.currentLevel.worldWidth - p.width;
    }

    // Boss Arena barrier & engagement check
    const arena = this.currentLevel.bossArena;
    if (arena && this.activeBoss && this.activeBoss.hp > 0 && this.activeBoss.state !== 'dead') {
      // 玩家踏入 BOSS 區域觸發戰鬥
      if (p.x + p.width >= arena.startX) {
        if (!this.isBossEngaged) {
          this.isBossEngaged = true;
          this.showBanner('⚔️ 進入首領決戰領域！ ⚔️', '結界已封鎖！擊敗 BOSS 方可解除結界開啟傳送門！');
          sounds.playHit(true);
          this.screenShake = 12;
        }
      }

      // 進入後擊敗 Boss 才可以離開（左側結界阻擋玩家後退離開）
      if (this.isBossEngaged) {
        if (p.x < arena.startX) {
          p.x = arena.startX;
          if (p.vx < 0) p.vx = 0;
        }
      }
    }

    // Check solid platforms X
    for (const plat of this.platforms) {
      if (plat.type === 'solid') {
        if (this.checkAABB(p.x, p.y, p.width, p.height, plat.x, plat.y, plat.width, plat.height)) {
          if (p.vx > 0) {
            p.x = plat.x - p.width;
            p.vx = 0;
          } else if (p.vx < 0) {
            p.x = plat.x + plat.width;
            p.vx = 0;
          }
        }
      }
    }

    // Move Y
    const prevY = p.y;
    p.y += p.vy * dt;
    p.isGrounded = false;

    // Platform collisions Y
    for (const plat of this.platforms) {
      // Solid collision
      if (plat.type === 'solid') {
        if (this.checkAABB(p.x, p.y, p.width, p.height, plat.x, plat.y, plat.width, plat.height)) {
          if (p.vy > 0 && prevY + p.height <= plat.y + 12) {
            // Landing on solid
            p.y = plat.y - p.height;
            p.vy = 0;
            p.isGrounded = true;
            p.canDoubleJump = true;
          } else if (p.vy < 0 && prevY >= plat.y + plat.height - 12) {
            // Hitting ceiling
            p.y = plat.y + plat.height;
            p.vy = 0;
          }
        }
      }

      // One-way platforms & Moving platforms (全數支援由下往上起跳穿透，僅向下著陸)
      if (plat.type === 'one_way' || plat.type === 'moving') {
        // 僅在非下跳期間 (dropThroughTimer <= 0) 著陸，單按下鍵不再下穿平臺！
        if (p.dropThroughTimer <= 0) {
          // Check if player feet crossed top of platform moving downward
          if (
            p.vy >= 0 &&
            prevY + p.height <= plat.y + 14 &&
            p.y + p.height >= plat.y &&
            p.x + p.width > plat.x &&
            p.x < plat.x + plat.width
          ) {
            p.y = plat.y - p.height;
            p.vy = 0;
            p.isGrounded = true;
            p.canDoubleJump = true;

            // Follow moving platform velocity
            if (plat.type === 'moving' && plat.vx) {
              p.x += plat.vx * 60 * dt;
            }
          }
        }
      }

      // Spikes hazard
      if (plat.type === 'spikes') {
        if (this.checkAABB(p.x, p.y, p.width, p.height, plat.x, plat.y, plat.width, plat.height)) {
          this.damagePlayer(20, '致命尖刺');
          p.vy = -380;
          p.vx = -p.facing * 200;
        }
      }
    }

    // Landed squash and sound
    if (!wasGrounded && p.isGrounded) {
      p.scaleX = 1.35;
      p.scaleY = 0.75;
      this.spawnDust(p.x + p.width / 2, p.y + p.height);
    }

    // Coyote time trigger when leaving ground
    if (wasGrounded && !p.isGrounded && p.vy >= 0) {
      p.coyoteTimer = 0.12;
    }
  }

  private checkMeleeAttackHits(weapon: Weapon) {
    const p = this.player;
    const stats = this.stats;

    // 天賦範圍與傷害加成
    const talentRangeMultiplier = 1 + (stats.talents?.range || 0) * 0.15;
    const effectiveRange = weapon.range * talentRangeMultiplier;

    // 大幅提升之超廣域斬擊判定區間（涵蓋身前、上方、身側與大範圍弧線，受範圍天賦擴大）
    const attackX = p.facing === 1 ? p.x - 20 : p.x - effectiveRange;
    const attackY = p.y - effectiveRange * 0.45;
    const attackWidth = effectiveRange + 25;
    const attackHeight = p.height + effectiveRange * 0.9;

    let hitCount = 0;

    for (const enemy of this.enemies) {
      if (enemy.state === 'dead') continue;

      if (
        this.checkAABB(
          attackX,
          attackY,
          attackWidth,
          attackHeight,
          enemy.x,
          enemy.y,
          enemy.width,
          enemy.height
        )
      ) {
        // Calculate damage with talent bonus
        const isCrit = Math.random() < 0.18;
        const talentDmgMultiplier = 1 + (stats.talents?.damage || 0) * 0.12;
        const talentFlatAtk = (stats.talents?.damage || 0) * 4;
        const baseDmgCalc = weapon.damage + (stats.level - 1) * 5 + stats.baseAtk + talentFlatAtk;
        const rawDmg = Math.round(baseDmgCalc * talentDmgMultiplier);
        const totalDamage = Math.round(isCrit ? rawDmg * 1.8 : rawDmg);

        enemy.hp -= totalDamage;
        enemy.hurtTimer = 0.18;
        enemy.state = 'hurt';
        enemy.vx = p.facing * (weapon.knockback * 40);
        enemy.vy = -140;

        // Visual & audio feedback
        sounds.playHit(isCrit);
        this.hitstopTimer = isCrit ? 0.06 : 0.035;
        this.screenShake = isCrit ? 8 : 4;

        this.addDamageNumber(
          enemy.x + enemy.width / 2,
          enemy.y - 10,
          `${totalDamage}${isCrit ? ' CRIT!' : ''}`,
          isCrit ? '#ef4444' : '#f59e0b',
          isCrit
        );

        // Particle burst matching weapon
        this.spawnParticleBurst(
          enemy.x + enemy.width / 2,
          enemy.y + enemy.height / 2,
          weapon.color,
          isCrit ? 16 : 10
        );

        // 觸發武器專屬特效 (燃燒5秒 / 迷你落雷 / 冰霜爆炸)
        this.applyWeaponHitEffects(weapon, enemy, totalDamage, isCrit);

        if (enemy.hp <= 0) {
          this.killEnemy(enemy);
        }

        hitCount++;
      }
    }
  }

  private applyWeaponHitEffects(weapon: Weapon, enemy: Enemy, totalDamage: number, _isCrit: boolean) {
    if (enemy.state === 'dead' || enemy.hp <= 0) return;

    // 1. 炎龍戰斧：燃燒傷害持續5秒，每秒造成持續傷害
    if (weapon.specialEffect === 'fire' || weapon.id === 'dragon_cleaver') {
      const burnDmgPerSec = Math.max(6, Math.round(totalDamage * 0.28));
      enemy.burnTimer = 5.0; // 持續5秒
      enemy.burnTickTimer = 1.0; // 每秒跳一次傷害
      enemy.burnDmg = burnDmgPerSec;

      this.addDamageNumber(
        enemy.x + enemy.width / 2,
        enemy.y - 18,
        `🔥 燃燒(5秒)`,
        '#f97316',
        false
      );
      this.spawnParticleBurst(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#f97316', 14);
    }

    // 2. 奔雷長槍：命中召喚迷你落雷
    if (weapon.specialEffect === 'lightning' || weapon.id === 'thunder_spear') {
      sounds.playMiniLightning();
      const miniLightningDmg = Math.round(totalDamage * 0.45);
      enemy.hp -= miniLightningDmg;
      enemy.hurtTimer = 0.18;
      this.hitstopTimer = Math.max(this.hitstopTimer, 0.035);
      this.screenShake = Math.max(this.screenShake, 6);

      this.addDamageNumber(
        enemy.x + enemy.width / 2,
        enemy.y - 24,
        `⚡ -${miniLightningDmg} 奔雷!`,
        '#facc15',
        true
      );

      // 天頂垂直迷你落雷電弧與粒子特效
      const topY = Math.max(0, enemy.y - 260);
      for (let y = topY; y < enemy.y + enemy.height / 2; y += 22) {
        this.particles.push({
          x: enemy.x + enemy.width / 2 + (Math.random() - 0.5) * 14,
          y,
          vx: (Math.random() - 0.5) * 35,
          vy: 85,
          size: 3,
          color: '#facc15',
          alpha: 1,
          decay: 3.5,
        });
      }
      this.spawnParticleBurst(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#facc15', 18);
      this.spawnParticleBurst(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#ffffff', 8);

      if (enemy.hp <= 0) {
        this.killEnemy(enemy);
      }
    }

    // 3. 雙魂巨鐮：命中觸發範圍冰爆炸 (基礎範圍是所有武器最大)
    if (weapon.specialEffect === 'frost' || weapon.id === 'frost_scythe') {
      sounds.playIceShatter();
      this.screenShake = Math.max(this.screenShake, 5);

      const talentRangeMultiplier = 1 + (this.stats.talents?.range || 0) * 0.15;
      const splashRadius = 120 * talentRangeMultiplier;
      const splashDamage = Math.round(totalDamage * 0.45);

      // 主目標浮動冰霜爆炸提示
      this.addDamageNumber(
        enemy.x + enemy.width / 2,
        enemy.y - 20,
        `❄️ 冰霜爆炸!`,
        '#06b6d4',
        true
      );

      // 冰爆晶體放射粒子
      for (let i = 0; i < 26; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * splashRadius * 0.75;
        this.particles.push({
          x: enemy.x + enemy.width / 2 + Math.cos(angle) * dist,
          y: enemy.y + enemy.height / 2 + Math.sin(angle) * dist,
          vx: Math.cos(angle) * (140 + Math.random() * 100),
          vy: Math.sin(angle) * (140 + Math.random() * 100),
          size: 3 + Math.random() * 3,
          color: Math.random() < 0.65 ? '#67e8f9' : '#ffffff',
          alpha: 1,
          decay: 2.8,
        });
      }

      // 範圍波及周遭所有敵軍
      for (const other of this.enemies) {
        if (other.state === 'dead' || other.id === enemy.id) continue;
        const dx = (other.x + other.width / 2) - (enemy.x + enemy.width / 2);
        const dy = (other.y + other.height / 2) - (enemy.y + enemy.height / 2);
        if (dx * dx + dy * dy <= splashRadius * splashRadius) {
          other.hp -= splashDamage;
          other.hurtTimer = 0.16;
          other.state = 'hurt';
          other.vx = (dx >= 0 ? 1 : -1) * 160;
          other.vy = -120;
          this.addDamageNumber(
            other.x + other.width / 2,
            other.y - 12,
            `❄️ -${splashDamage} 冰爆!`,
            '#38bdf8',
            false
          );
          this.spawnParticleBurst(other.x + other.width / 2, other.y + other.height / 2, '#67e8f9', 10);
          if (other.hp <= 0) {
            this.killEnemy(other);
          }
        }
      }
    }
  }

  private killEnemy(enemy: Enemy) {
    if (enemy.state === 'dead') return;
    enemy.state = 'dead';
    enemy.hp = 0;
    this.stats.monstersSlain++;
    sounds.playEnemyDeath();

    // Screen shake on death
    this.screenShake = enemy.isBoss ? 15 : 6;

    // Death particles
    this.spawnParticleBurst(
      enemy.x + enemy.width / 2,
      enemy.y + enemy.height / 2,
      enemy.isBoss ? '#a855f7' : '#ec4899',
      enemy.isBoss ? 35 : 18
    );

    // Drop Coins
    const coinCount = enemy.isBoss ? 20 : Math.max(2, Math.floor(enemy.coinReward / 4));
    const coinValPer = Math.max(1, Math.round(enemy.coinReward / coinCount));
    for (let i = 0; i < coinCount; i++) {
      this.coins.push({
        id: Math.random() + Date.now(),
        x: enemy.x + enemy.width / 2,
        y: enemy.y + enemy.height / 2,
        vx: (Math.random() - 0.5) * 220,
        vy: -Math.random() * 260 - 100,
        value: coinValPer,
        life: 15,
      });
    }

    // Drop EXP Orbs
    const expCount = enemy.isBoss ? 15 : 4;
    const expPer = Math.max(1, Math.round(enemy.expReward / expCount));
    for (let i = 0; i < expCount; i++) {
      this.expOrbs.push({
        id: Math.random() + Date.now(),
        x: enemy.x + enemy.width / 2,
        y: enemy.y + enemy.height / 2,
        vx: (Math.random() - 0.5) * 160,
        vy: -Math.random() * 200 - 80,
        exp: expPer,
        life: 20,
      });
    }

    if (enemy.isBoss) {
      this.activeBoss = null;
      this.isBossEngaged = false; // 解除決戰結界封鎖
      if (this.onBossChange) this.onBossChange(null);
      this.isPortalOpen = true; // 打敗BOSS後開啟傳送門！
      sounds.playLevelUp();
      this.screenShake = 16;

      const portal = this.currentLevel.portal;
      this.spawnParticleBurst(portal.x + portal.width / 2, portal.y + portal.height / 2, '#38bdf8', 35);

      this.lightningStrikes = []; // 討伐 BOSS 後立即消除殘餘落雷預警

      if (this.currentStageIndex === 0) {
        this.showBanner('★ 地城巨骸將軍已討伐！ ★', '傳送門封印解除已開啟！按【↑】鍵進入傳送門前往熔岩遺跡！');
      } else if (this.currentStageIndex === 1) {
        this.showBanner('★ 熔岩巨刃魔將已討伐！ ★', '傳送門封印解除已開啟！按【↑】鍵進入傳送門前往深淵魔王殿！');
      } else if (this.currentStageIndex === 2) {
        this.showBanner('★ 深淵大魔王已討伐！ ★', '傳送門封印解除已開啟！按【↑】鍵進入傳送門前往永凍古殿！');
      } else if (this.currentStageIndex === 3) {
        this.showBanner('★ 遠古死靈法皇已討伐！ ★', '傳送門封印解除已開啟！按【↑】鍵進入傳送門前往混沌神座！');
      } else {
        this.showBanner('★ 混沌毀滅魔神已討伐！ ★', '神域混沌神門已開啟！按【↑】鍵進入傳送門突破輪迴！');
      }
    }

    this.notifyStats();
  }

  private updateEnemies(dt: number) {
    const p = this.player;

    for (const enemy of this.enemies) {
      if (enemy.state === 'dead') continue;

      if (enemy.hurtTimer > 0) {
        enemy.hurtTimer -= dt;
      }
      if (enemy.attackCooldown > 0) {
        enemy.attackCooldown -= dt;
      }

      // 炎龍戰斧：燃燒傷害持續5秒，每秒造成持續傷害
      if (enemy.burnTimer && enemy.burnTimer > 0) {
        enemy.burnTimer -= dt;
        enemy.burnTickTimer = (enemy.burnTickTimer || 1.0) - dt;

        // 燃燒火苗粒子
        if (Math.random() < 0.45) {
          this.particles.push({
            x: enemy.x + Math.random() * enemy.width,
            y: enemy.y + Math.random() * enemy.height,
            vx: (Math.random() - 0.5) * 20,
            vy: -40 - Math.random() * 30,
            size: 3,
            color: Math.random() < 0.6 ? '#f97316' : '#ef4444',
            alpha: 0.9,
            decay: 3.2,
          });
        }

        if (enemy.burnTickTimer <= 0) {
          enemy.burnTickTimer = 1.0;
          const tickDmg = enemy.burnDmg || 6;
          enemy.hp -= tickDmg;
          enemy.hurtTimer = 0.12;
          sounds.playHit(false);
          this.addDamageNumber(
            enemy.x + enemy.width / 2,
            enemy.y - 14,
            `🔥 -${tickDmg} 灼燒`,
            '#f97316',
            false
          );
          this.spawnParticleBurst(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#f97316', 8);

          if (enemy.hp <= 0) {
            this.killEnemy(enemy);
            continue;
          }
        }
      }

      // Physics
      if (enemy.type !== 'bat') {
        enemy.vy = Math.min(enemy.vy + 1200 * dt, 700);
      }
      enemy.x += enemy.vx * dt;
      enemy.y += enemy.vy * dt;

      // Platform collisions for grounded enemies
      if (enemy.type !== 'bat') {
        enemy.isGrounded = false;
        for (const plat of this.platforms) {
          if (plat.type === 'solid' || plat.type === 'one_way') {
            if (
              enemy.vy >= 0 &&
              this.checkAABB(enemy.x, enemy.y, enemy.width, enemy.height, plat.x, plat.y, plat.width, plat.height)
            ) {
              enemy.y = plat.y - enemy.height;
              enemy.vy = 0;
              enemy.isGrounded = true;
            }
          }
        }
      }

      // AI Behaviors
      const distToPlayer = Math.hypot(
        p.x + p.width / 2 - (enemy.x + enemy.width / 2),
        p.y + p.height / 2 - (enemy.y + enemy.height / 2)
      );

      if (enemy.type === 'slime') {
        // Bounces towards player if close, otherwise patrols
        enemy.stateTimer += dt;
        if (enemy.stateTimer > 1.4 && enemy.isGrounded) {
          enemy.stateTimer = 0;
          if (distToPlayer < 240) {
            enemy.facing = p.x > enemy.x ? 1 : -1;
            enemy.vx = enemy.facing * 120;
            enemy.vy = -260;
          } else {
            enemy.vx = enemy.facing * 80;
            enemy.vy = -200;
          }
        } else if (enemy.isGrounded) {
          enemy.vx *= 0.85;
          if (enemy.x < enemy.patrolLeft) enemy.facing = 1;
          if (enemy.x > enemy.patrolRight) enemy.facing = -1;
        }
      } else if (enemy.type === 'goblin') {
        // Patrols, chases player if spotted
        if (distToPlayer < 220) {
          enemy.facing = p.x > enemy.x ? 1 : -1;
          enemy.vx = enemy.facing * 130;
        } else {
          enemy.vx = enemy.facing * 50;
          if (enemy.x < enemy.patrolLeft) enemy.facing = 1;
          if (enemy.x > enemy.patrolRight) enemy.facing = -1;
        }
      } else if (enemy.type === 'bat') {
        // Flying sine wave movement
        enemy.stateTimer += dt;
        if (distToPlayer < 260) {
          const angle = Math.atan2(
            p.y + p.height / 2 - (enemy.y + enemy.height / 2),
            p.x + p.width / 2 - (enemy.x + enemy.width / 2)
          );
          enemy.vx = Math.cos(angle) * 110;
          enemy.vy = Math.sin(angle) * 110;
        } else {
          enemy.vx = enemy.facing * 70;
          enemy.vy = Math.sin(enemy.stateTimer * 4) * 50;
          if (enemy.x < enemy.patrolLeft) enemy.facing = 1;
          if (enemy.x > enemy.patrolRight) enemy.facing = -1;
        }
      } else if (enemy.type === 'skeleton') {
        // Archer: keeps distance and shoots arrows
        enemy.facing = p.x > enemy.x ? 1 : -1;
        if (distToPlayer < 140) {
          enemy.vx = -enemy.facing * 60; // back away
        } else {
          enemy.vx *= 0.85;
        }

        if (distToPlayer < 450 && enemy.attackCooldown <= 0) {
          enemy.attackCooldown = 2.4;
          // Shoot bone arrow
          this.projectiles.push({
            id: Date.now() + Math.random(),
            x: enemy.x + (enemy.facing === 1 ? enemy.width + 5 : -10),
            y: enemy.y + 16,
            vx: enemy.facing * 340,
            vy: -40,
            radius: 8,
            damage: enemy.damage,
            fromPlayer: false,
            element: 'arrow',
            life: 2.2,
            maxLife: 2.2,
          });
          sounds.playAttack('rusty_dagger');
        }
      } else if (enemy.type === 'boss_knight') {
        const arena = this.currentLevel.bossArena;
        const isPlayerInArena = arena ? (this.isBossEngaged || p.x + p.width >= arena.startX) : true;

        // BOSS 機制修改：現在 BOSS 永不移動，保持原地施放法術與神雷！
        enemy.vx = 0;

        if (!isPlayerInArena) {
          // BOSS 在決戰區域內待機，玩家進入前不發動攻擊
          enemy.facing = -1;
          enemy.state = 'idle';
        } else {
          // 玩家已進入 BOSS 區域：BOSS 原地持續施放投射物以及毀滅落雷
          enemy.stateTimer += dt;
          enemy.facing = p.x > enemy.x ? 1 : -1;
          enemy.state = 'attack';

          // 1. 投射物攻擊 (Boss投射物僅1發不再增加，投射物速度減速)
          if (enemy.attackCooldown <= 0) {
            enemy.attackCooldown = 1.8;
            sounds.playAttack('dragon_cleaver');

            const baseAngle = Math.atan2(
              (p.y + p.height / 2) - (enemy.y + enemy.height / 2 - 8),
              (p.x + p.width / 2) - (enemy.x + enemy.width / 2)
            );
            const speed = 220; // 投射物速度減速 (由400+降為220，易於反應與閃避)

            this.projectiles.push({
              id: Date.now() + Math.random(),
              x: enemy.x + (enemy.facing === 1 ? enemy.width + 8 : -8),
              y: enemy.y + enemy.height / 2 - 10,
              vx: Math.cos(baseAngle) * speed,
              vy: Math.sin(baseAngle) * speed,
              radius: 16,
              damage: Math.round(enemy.damage * 0.9),
              fromPlayer: false,
              element: 'fire_wave',
              life: 4.5,
              maxLife: 4.5,
            });

            this.spawnParticleBurst(
              enemy.x + (enemy.facing === 1 ? enemy.width + 10 : -10),
              enemy.y + enemy.height / 2,
              '#f43f5e',
              14
            );
          }

          // 2. 落雷攻擊 (落雷數量改為2~3發，延遲2秒紅線提示，落雷傷害極高)
          this.bossLightningTimer -= dt;
          if (this.bossLightningTimer <= 0) {
            this.bossLightningTimer = 3.2;

            const groundY = this.currentLevel.worldHeight - 100;
            const strikeCount = Math.random() < 0.5 ? 2 : 3; // 落雷數量改為 2~3 發！
            const arenaLeft = arena ? arena.startX + 50 : 100;
            const arenaRight = arena ? arena.endX - 50 : this.currentLevel.worldWidth - 100;

            const playerX = p.x + p.width / 2;
            const strikePositions: number[] = [playerX];

            // 輔助落雷在玩家周遭 75~130px 範圍散佈
            const side1 = Math.random() < 0.5 ? 1 : -1;
            const offset1 = side1 * (75 + Math.random() * 55);
            strikePositions.push(Math.max(arenaLeft, Math.min(arenaRight, playerX + offset1)));

            if (strikeCount === 3) {
              const offset2 = -side1 * (85 + Math.random() * 55);
              strikePositions.push(Math.max(arenaLeft, Math.min(arenaRight, playerX + offset2)));
            }

            for (const sX of strikePositions) {
              this.lightningStrikes.push({
                id: Date.now() + Math.random(),
                x: sX,
                y: groundY,
                timer: 0,
                duration: 2.0, // 落雷延遲為兩秒，延遲期間顯示一條紅線做提示
                damage: 70 + this.currentStageIndex * 25, // 落雷傷害極高
                hasStruck: false,
                strikeTimer: 0,
              });
            }

            // 提示音效
            sounds.playTelegraphHum();

            // BOSS 召喚雷雲光環粒子
            this.spawnParticleBurst(
              enemy.x + enemy.width / 2,
              enemy.y - 10,
              '#ef4444',
              24
            );
          }
        }

        // Inform Boss state for HUD
        if (this.onBossChange) this.onBossChange(enemy);
      }

      // Check contact damage with player (玩家受攻擊不後退，選單模式下完全免疫)
      if (
        !this.isMenuMode &&
        p.invincibleTimer <= 0 &&
        !p.isDashing &&
        this.checkAABB(p.x, p.y, p.width, p.height, enemy.x, enemy.y, enemy.width, enemy.height)
      ) {
        this.damagePlayer(enemy.damage, enemy.type === 'boss_knight' ? '魔將重擊' : '魔物撕咬');
        // 移除後退擊飛效果，玩家保持原有移動與跳躍姿態
      }
    }
  }

  private updateProjectiles(dt: number) {
    const p = this.player;

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.life -= dt;
      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;

      // Particle trail
      if (Math.random() < 0.4) {
        this.particles.push({
          x: proj.x,
          y: proj.y,
          vx: -proj.vx * 0.1,
          vy: (Math.random() - 0.5) * 20,
          size: 3,
          color: proj.element === 'holy_beam' ? '#fde047' : '#f97316',
          alpha: 0.7,
          decay: 3.5,
        });
      }

      // Player projectiles hitting enemies
      if (proj.fromPlayer) {
        for (const enemy of this.enemies) {
          if (enemy.state === 'dead') continue;
          if (
            this.checkAABB(
              proj.x - proj.radius,
              proj.y - proj.radius,
              proj.radius * 2,
              proj.radius * 2,
              enemy.x,
              enemy.y,
              enemy.width,
              enemy.height
            )
          ) {
            enemy.hp -= proj.damage;
            enemy.hurtTimer = 0.16;
            enemy.state = 'hurt';
            sounds.playHit(true);
            this.addDamageNumber(enemy.x + enemy.width / 2, enemy.y - 10, `${proj.damage} 光刃!`, '#facc15', true);
            this.spawnParticleBurst(proj.x, proj.y, '#fde047', 12);
            if (enemy.hp <= 0) this.killEnemy(enemy);
            proj.life = 0;
            break;
          }
        }
      } else {
        // Enemy projectiles hitting player
        if (
          !this.isMenuMode &&
          p.invincibleTimer <= 0 &&
          !p.isDashing &&
          this.checkAABB(
            proj.x - proj.radius,
            proj.y - proj.radius,
            proj.radius * 2,
            proj.radius * 2,
            p.x,
            p.y,
            p.width,
            p.height
          )
        ) {
          this.damagePlayer(proj.damage, '遠程箭矢');
          proj.life = 0;
          this.spawnParticleBurst(proj.x, proj.y, '#ef4444', 10);
        }
      }

      if (proj.life <= 0) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  private updateCoinsAndExp(dt: number) {
    const p = this.player;
    const px = p.x + p.width / 2;
    const py = p.y + p.height / 2;

    // Coins (進入拾取範圍後快速飛向玩家，不再碰撞且無視重力)
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const c = this.coins[i];
      c.life -= dt;
      const dist = Math.hypot(px - c.x, py - c.y);

      if (dist < 850 || c.isHoming) {
        c.isHoming = true;
        // 無視重力與平臺，飛向玩家（速度調降一半）
        const angle = Math.atan2(py - c.y, px - c.x);
        const flySpeed = Math.min(1200, Math.max(450, 900 - dist * 0.2));
        c.x += Math.cos(angle) * flySpeed * dt;
        c.y += Math.sin(angle) * flySpeed * dt;
      } else {
        c.vy += 900 * dt;
        c.x += c.vx * dt;
        c.y += c.vy * dt;

        // Platform bounce when not homing
        for (const plat of this.platforms) {
          if (
            c.vy > 0 &&
            c.y >= plat.y &&
            c.y <= plat.y + 15 &&
            c.x >= plat.x &&
            c.x <= plat.x + plat.width
          ) {
            c.y = plat.y;
            c.vy = -c.vy * 0.5;
            c.vx *= 0.7;
          }
        }
      }

      // 拾取半徑
      if (dist < 75) {
        this.stats.coins += c.value;
        sounds.playCoin();
        this.addDamageNumber(c.x, c.y - 12, `+${c.value} G`, '#eab308', false);
        this.spawnParticleBurst(c.x, c.y, '#fef08a', 8);
        this.notifyStats();
        this.coins.splice(i, 1);
        continue;
      }

      if (c.life <= 0) {
        this.coins.splice(i, 1);
      }
    }

    // EXP Orbs (進入拾取範圍後飛向玩家，速度降低一半，無視重力與平臺)
    for (let i = this.expOrbs.length - 1; i >= 0; i--) {
      const orb = this.expOrbs[i];
      orb.life -= dt;
      const dist = Math.hypot(px - orb.x, py - orb.y);

      if (dist < 900 || orb.isHoming) {
        orb.isHoming = true;
        // 直線飛向玩家（速度降低一半）
        const angle = Math.atan2(py - orb.y, px - orb.x);
        const flySpeed = Math.min(1300, Math.max(475, 950 - dist * 0.15));
        orb.x += Math.cos(angle) * flySpeed * dt;
        orb.y += Math.sin(angle) * flySpeed * dt;
      } else {
        orb.vy += 400 * dt;
        orb.x += orb.vx * dt;
        orb.y += orb.vy * dt;
      }

      if (dist < 80) {
        this.gainExp(orb.exp);
        sounds.playExp();
        this.expOrbs.splice(i, 1);
        continue;
      }

      if (orb.life <= 0) {
        this.expOrbs.splice(i, 1);
      }
    }
  }

  public gainExp(amount: number) {
    this.stats.exp += amount;
    this.addDamageNumber(
      this.player.x + this.player.width / 2,
      this.player.y - 20,
      `+${amount} EXP`,
      '#a855f7',
      false
    );

    // Check Level Up
    while (this.stats.exp >= this.stats.nextLevelExp) {
      this.stats.exp -= this.stats.nextLevelExp;
      this.stats.level++;
      // 提升升級所需經驗值曲線
      this.stats.nextLevelExp = Math.round(this.stats.nextLevelExp * 1.5 + 40);
      this.stats.maxHp += 20;
      this.stats.hp = this.stats.maxHp; // full heal on level up
      this.stats.baseAtk += 4;
      this.stats.def += 1;
      this.stats.talentPoints += 1; // 升級獲得 1 點天賦點數！

      sounds.playLevelUp();
      this.showBanner(
        `✦ 等級提升！ LEVEL ${this.stats.level} ✦`,
        `全屬性強化！獲得 1 點天賦點數 (按 T 鍵分配天賦)！`
      );

      // Golden pillar celebration particles
      this.spawnParticleBurst(
        this.player.x + this.player.width / 2,
        this.player.y + this.player.height / 2,
        '#facc15',
        40
      );
    }

    this.notifyStats();
  }

  private updateChests() {
    const p = this.player;
    for (const chest of this.chests) {
      if (!chest.opened) {
        if (
          this.checkAABB(
            p.x,
            p.y,
            p.width,
            p.height,
            chest.x,
            chest.y,
            chest.width,
            chest.height
          )
        ) {
          chest.opened = true;
          sounds.playChest();
          this.stats.coins += chest.coins;
          this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + 30); // bonus heal
          this.addDamageNumber(
            chest.x + chest.width / 2,
            chest.y - 20,
            `寶箱開啓！+${chest.coins} G (+30 HP)`,
            '#f59e0b',
            true
          );
          this.spawnParticleBurst(
            chest.x + chest.width / 2,
            chest.y + chest.height / 2,
            '#fbbf24',
            24
          );
          this.notifyStats();
        }
      }
    }
  }

  private updateLightningStrikes(dt: number) {
    const p = this.player;

    for (let i = this.lightningStrikes.length - 1; i >= 0; i--) {
      const strike = this.lightningStrikes[i];

      if (!strike.hasStruck) {
        strike.timer += dt;

        // 提示粒子 (沿著紅線飄落聚能)
        if (Math.random() < 0.45) {
          this.particles.push({
            x: strike.x + (Math.random() - 0.5) * 8,
            y: Math.random() * strike.y,
            vx: (Math.random() - 0.5) * 16,
            vy: 90 + Math.random() * 90,
            size: 2.5,
            color: '#ef4444',
            alpha: 0.9,
            decay: 3.2,
          });
        }

        // 2秒延遲結束，神雷狂暴劈落！
        if (strike.timer >= strike.duration) {
          strike.hasStruck = true;
          strike.strikeTimer = 0.38; // 停留 0.38 秒繪製震撼雷柱光輝

          // 音效與螢幕震動
          sounds.playThunder();
          this.screenShake = Math.max(this.screenShake, 16);

          // 垂直閃電粒子爆炸
          for (let y = 0; y < strike.y; y += 45) {
            this.spawnParticleBurst(strike.x, y, '#facc15', 5);
          }
          // 地面衝擊爆發
          this.spawnParticleBurst(strike.x, strike.y, '#ef4444', 32);
          this.spawnParticleBurst(strike.x, strike.y, '#facc15', 28);

          // 檢測是否擊中玩家 (落雷柱判定寬度 36px)
          if (!this.isMenuMode && p.invincibleTimer <= 0) {
            const hitWidth = 36;
            if (
              p.x + p.width > strike.x - hitWidth / 2 &&
              p.x < strike.x + hitWidth / 2 &&
              p.y + p.height >= 0 &&
              p.y <= strike.y
            ) {
              // 造成極高神雷傷害！
              this.damagePlayer(strike.damage, '滅世落雷');
              this.addDamageNumber(
                p.x + p.width / 2,
                p.y - 25,
                `⚡ -${strike.damage} 天罰落雷!`,
                '#dc2626',
                true
              );
            }
          }
        }
      } else {
        strike.strikeTimer -= dt;
        if (strike.strikeTimer <= 0) {
          this.lightningStrikes.splice(i, 1);
        }
      }
    }
  }

  private updatePortal() {
    const p = this.player;
    const portal = this.currentLevel.portal;
    const isTouching = this.checkAABB(
      p.x,
      p.y,
      p.width,
      p.height,
      portal.x,
      portal.y,
      portal.width,
      portal.height
    );

    if (isTouching) {
      if (!this.isPortalOpen) {
        // 傳送門預設為關閉，需打敗BOSS後開啟
        if (this.portalNoticeTimer <= 0) {
          this.portalNoticeTimer = 2.0;
          this.addDamageNumber(
            portal.x + portal.width / 2,
            portal.y - 12,
            '🔒 傳送門封印中！需先打敗守關 BOSS',
            '#f87171',
            true
          );
          sounds.playHit(false);
        }
      } else {
        // 傳送門已開啟！觸碰不再自動進入，必須按下方向鍵 (Up / W) 進入傳送門！
        if (this.input.up) {
          this.input.up = false; // 消耗輸入
          sounds.playLevelUp();

          if (this.currentStageIndex >= LEVELS.length - 1) {
            // 第 5 關神座通關：打破永恆輪迴重返第 1 區繼續討伐（保留所有裝備金幣等級）
            this.showBanner('★ 混沌終焉·輪迴重啟！ ★', '豬豬勇者擊碎混沌神座，重返第 1 區開啟全新挑戰輪迴！');
            this.loadLevel(0, true);
          } else {
            // 前往下一區域！
            this.loadLevel(this.currentStageIndex + 1, true);
          }
        }
      }
    }
  }

  public damagePlayer(rawDmg: number, source: string) {
    if (this.isMenuMode || this.player.invincibleTimer > 0 || this.player.isDashing) return;

    const actualDmg = Math.max(1, rawDmg - this.stats.def);
    this.stats.hp -= actualDmg;
    this.player.hurtTimer = 0.25;
    this.player.invincibleTimer = 0.8;
    this.screenShake = 10;
    this.hitstopTimer = 0.05;

    sounds.playHurt();
    this.addDamageNumber(
      this.player.x + this.player.width / 2,
      this.player.y - 15,
      `-${actualDmg}`,
      '#ef4444',
      true
    );

    this.spawnParticleBurst(
      this.player.x + this.player.width / 2,
      this.player.y + this.player.height / 2,
      '#ef4444',
      12
    );

    this.notifyStats();

    if (this.stats.hp <= 0) {
      this.stats.hp = 0;
      this.notifyStats();
      if (this.onGameOver) this.onGameOver();
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const part = this.particles[i];
      part.x += part.vx * dt;
      part.y += part.vy * dt;
      part.alpha -= part.decay * dt;
      if (part.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private updateDamageNumbers(dt: number) {
    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const dn = this.damageNumbers[i];
      dn.life -= dt;
      dn.y += dn.vy * dt;
      dn.vy += 40 * dt; // slight gravity deceleration
      dn.alpha = Math.max(0, dn.life / 0.8);
      if (dn.life <= 0) {
        this.damageNumbers.splice(i, 1);
      }
    }
  }

  private updateCamera(dt: number) {
    const targetX = this.player.x + this.player.width / 2 - this.canvas.width / 2;
    const targetY = this.player.y + this.player.height / 2 - this.canvas.height / 2 - 40;

    // Smooth Lerp
    this.camera.x += (targetX - this.camera.x) * 8 * dt;
    this.camera.y += (targetY - this.camera.y) * 8 * dt;

    // Clamp camera within world bounds
    const maxX = Math.max(0, this.currentLevel.worldWidth - this.canvas.width);
    const maxY = Math.max(0, this.currentLevel.worldHeight - this.canvas.height);
    this.camera.x = Math.max(0, Math.min(this.camera.x, maxX));
    this.camera.y = Math.max(0, Math.min(this.camera.y, maxY));
  }

  // SPAWN HELPERS
  public spawnDust(x: number, y: number) {
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y - 2,
        vx: (Math.random() - 0.5) * 60,
        vy: -Math.random() * 25,
        size: Math.random() * 3 + 2,
        color: '#94a3b8',
        alpha: 0.7,
        decay: 2.5,
      });
    }
  }

  public spawnParticleBurst(x: number, y: number, color: string, count: number = 12) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 180 + 40;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 2,
        color,
        alpha: 1,
        decay: Math.random() * 1.5 + 1.8,
      });
    }
  }

  public addDamageNumber(x: number, y: number, text: string, color: string, isCrit: boolean = false) {
    this.damageNumbers.push({
      id: Date.now() + Math.random(),
      x,
      y,
      vy: -90,
      text,
      color,
      alpha: 1,
      life: 0.85,
      isCrit,
    });
  }

  private checkAABB(
    x1: number,
    y1: number,
    w1: number,
    h1: number,
    x2: number,
    y2: number,
    w2: number,
    h2: number
  ): boolean {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
  }

  // ==================== RENDERING ====================
  private render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Apply Screen Shake
    ctx.save();
    let shakeX = 0;
    let shakeY = 0;
    if (this.screenShake > 0 && this.screenShakeEnabled) {
      shakeX = (Math.random() - 0.5) * this.screenShake;
      shakeY = (Math.random() - 0.5) * this.screenShake;
    }
    ctx.translate(shakeX, shakeY);

    // 1. Draw Parallax Backgrounds
    this.renderBackground(ctx, w, h);

    // 2. World Camera Transform
    ctx.save();
    ctx.translate(-Math.round(this.camera.x), -Math.round(this.camera.y));

    // Render Portal
    this.renderPortal(ctx);

    // Render Boss Arena Barrier & Gate
    this.renderBossArena(ctx);

    // Render Chests
    this.renderChests(ctx);

    // Render Platforms
    this.renderPlatforms(ctx);

    // Render Pickups (Coins & EXP)
    this.renderPickups(ctx);

    // Render Enemies
    this.renderEnemies(ctx);

    // Render Projectiles
    this.renderProjectiles(ctx);

    // Render Lightning Strikes (2秒紅線提示與天罰落雷)
    this.renderLightningStrikes(ctx);

    // Render Player
    this.renderPlayer(ctx);

    // Render Particles
    this.renderParticles(ctx);

    // Render Damage Numbers
    this.renderDamageNumbers(ctx);

    ctx.restore(); // restore camera

    // Render Screen Banner (Level Up / Stage Name)
    this.renderBanner(ctx, w, h);

    ctx.restore(); // restore shake
  }

  private renderBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const theme = this.currentLevel.theme;

    // Deep atmospheric gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    if (theme === 'inferno') {
      skyGrad.addColorStop(0, '#1c0808');
      skyGrad.addColorStop(0.5, '#2e0f0d');
      skyGrad.addColorStop(1, '#4a1515');
    } else if (theme === 'abyss') {
      skyGrad.addColorStop(0, '#0f051d');
      skyGrad.addColorStop(0.6, '#180a2e');
      skyGrad.addColorStop(1, '#2c1254');
    } else {
      // Dungeon
      skyGrad.addColorStop(0, '#090d16');
      skyGrad.addColorStop(0.5, '#0f172a');
      skyGrad.addColorStop(1, '#1e293b');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Glowing celestial orb (Moon or Molten Sun)
    ctx.save();
    const orbX = w * 0.78 - this.camera.x * 0.03;
    const orbY = 90;
    const orbGrad = ctx.createRadialGradient(orbX, orbY, 10, orbX, orbY, 70);
    if (theme === 'inferno') {
      orbGrad.addColorStop(0, '#ff7849');
      orbGrad.addColorStop(0.4, 'rgba(239, 68, 68, 0.4)');
      orbGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
    } else if (theme === 'abyss') {
      orbGrad.addColorStop(0, '#d8b4fe');
      orbGrad.addColorStop(0.4, 'rgba(168, 85, 247, 0.4)');
      orbGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');
    } else {
      orbGrad.addColorStop(0, '#e2e8f0');
      orbGrad.addColorStop(0.4, 'rgba(56, 189, 248, 0.25)');
      orbGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    }
    ctx.fillStyle = orbGrad;
    ctx.beginPath();
    ctx.arc(orbX, orbY, 70, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Distant mountain silhouette (0.15x parallax)
    ctx.save();
    ctx.fillStyle = theme === 'inferno' ? '#250808' : theme === 'abyss' ? '#140624' : '#0b1329';
    ctx.beginPath();
    ctx.moveTo(0, h);
    const startX = -((this.camera.x * 0.15) % 400);
    for (let x = startX; x <= w + 400; x += 180) {
      ctx.lineTo(x, h - 160 - Math.sin(x * 0.015) * 60);
      ctx.lineTo(x + 90, h - 90);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Midground ruins/pillars (0.35x parallax)
    ctx.save();
    ctx.fillStyle = theme === 'inferno' ? '#330f0f' : theme === 'abyss' ? '#1e0c38' : '#131e38';
    const midStartX = -((this.camera.x * 0.35) % 300);
    for (let x = midStartX; x <= w + 300; x += 150) {
      ctx.fillRect(x, h - 220, 36, 220); // pillar
      ctx.fillRect(x - 10, h - 230, 56, 12); // pillar capital
    }
    ctx.restore();
  }

  private renderPlatforms(ctx: CanvasRenderingContext2D) {
    const theme = this.currentLevel.theme;

    for (const p of this.platforms) {
      // Frustum culling check
      if (
        p.x + p.width < this.camera.x - 50 ||
        p.x > this.camera.x + this.canvas.width + 50 ||
        p.y + p.height < this.camera.y - 50 ||
        p.y > this.camera.y + this.canvas.height + 50
      ) {
        continue;
      }

      if (p.type === 'spikes') {
        // Draw lethal spike teeth
        ctx.fillStyle = '#dc2626';
        const teethCount = Math.floor(p.width / 14);
        for (let i = 0; i < teethCount; i++) {
          ctx.beginPath();
          ctx.moveTo(p.x + i * 14, p.y + p.height);
          ctx.lineTo(p.x + i * 14 + 7, p.y);
          ctx.lineTo(p.x + (i + 1) * 14, p.y + p.height);
          ctx.closePath();
          ctx.fill();
        }
        continue;
      }

      // Solid / One-way / Moving Platform
      ctx.save();
      if (p.type === 'moving') {
        ctx.fillStyle = '#0284c7';
      } else if (theme === 'inferno') {
        ctx.fillStyle = '#451a1a';
      } else if (theme === 'abyss') {
        ctx.fillStyle = '#311042';
      } else {
        ctx.fillStyle = '#1e293b';
      }

      // Main slab
      ctx.beginPath();
      ctx.roundRect(p.x, p.y, p.width, p.height, 4);
      ctx.fill();

      // Top edge highlight / moss / glow
      let edgeColor = '#38bdf8';
      if (theme === 'inferno') edgeColor = '#f97316';
      if (theme === 'abyss') edgeColor = '#c084fc';
      if (p.type === 'moving') edgeColor = '#38bdf8';

      ctx.fillStyle = edgeColor;
      ctx.fillRect(p.x, p.y, p.width, 4);

      // Decorative bricks / lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      for (let bx = p.x + 30; bx < p.x + p.width - 10; bx += 40) {
        ctx.strokeRect(bx, p.y + 6, 28, Math.max(8, p.height - 12));
      }

      ctx.restore();
    }
  }

  private renderChests(ctx: CanvasRenderingContext2D) {
    for (const c of this.chests) {
      ctx.save();
      // Chest base
      ctx.fillStyle = '#b45309';
      ctx.fillRect(c.x, c.y + 12, c.width, c.height - 12);

      // Chest gold trim
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2;
      ctx.strokeRect(c.x + 2, c.y + 14, c.width - 4, c.height - 16);

      // Chest lid
      if (c.opened) {
        ctx.fillStyle = '#d97706';
        ctx.fillRect(c.x - 4, c.y - 4, c.width + 8, 14);
        // glowing coins inside
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(c.x + c.width / 2, c.y + 8, 8, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#d97706';
        ctx.fillRect(c.x, c.y, c.width, 14);
        // lock
        ctx.fillStyle = '#facc15';
        ctx.fillRect(c.x + c.width / 2 - 4, c.y + 8, 8, 8);
      }
      ctx.restore();
    }
  }

  private renderPortal(ctx: CanvasRenderingContext2D) {
    const p = this.currentLevel.portal;
    const time = performance.now() * 0.003;
    const cx = p.x + p.width / 2;
    const cy = p.y + p.height / 2;

    ctx.save();

    if (!this.isPortalOpen) {
      // 封印中的傳送門：暗黑石門、赤紅封印符文與鐵鍊
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(p.x, p.y + 4, p.width, p.height - 4);

      // 石柱門框
      ctx.fillStyle = '#334155';
      ctx.fillRect(p.x - 6, p.y, 8, p.height);
      ctx.fillRect(p.x + p.width - 2, p.y, 8, p.height);
      ctx.fillRect(p.x - 10, p.y - 6, p.width + 20, 10);

      // 暗紅封印中心
      const darkGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, 32);
      darkGrad.addColorStop(0, '#7f1d1d');
      darkGrad.addColorStop(0.7, '#450a0a');
      darkGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = darkGrad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 20, 36, 0, 0, Math.PI * 2);
      ctx.fill();

      // 封印鎖鏈十字
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(p.x - 2, cy - 24);
      ctx.lineTo(p.x + p.width + 2, cy + 24);
      ctx.moveTo(p.x + p.width + 2, cy - 24);
      ctx.lineTo(p.x - 2, cy + 24);
      ctx.stroke();

      // 鎖頭圖示
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(cx - 7, cy - 7, 14, 14);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx - 2, cy - 4, 4, 8);

      // 標籤提示
      ctx.fillStyle = '#f87171';
      ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.9)';
      ctx.shadowBlur = 4;
      ctx.fillText('🔒 封印之門 (需討伐首領)', cx, p.y - 12);
    } else {
      // 已開啟的傳送門：旋轉星輝渦流與璀璨光環
      const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 45);
      grad.addColorStop(0, '#67e8f9');
      grad.addColorStop(0.5, '#818cf8');
      grad.addColorStop(1, 'rgba(129, 140, 248, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 26, 46, 0, 0, Math.PI * 2);
      ctx.fill();

      // 外層旋轉符文環
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 22 + Math.sin(time) * 4, 40 + Math.cos(time) * 4, time, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 26, 44, -time * 1.5, 0, Math.PI * 2);
      ctx.stroke();

      // 檢測玩家是否接觸傳送門
      const isPlayerTouching = this.checkAABB(
        this.player.x,
        this.player.y,
        this.player.width,
        this.player.height,
        p.x,
        p.y,
        p.width,
        p.height
      );

      // 標籤提示
      ctx.textAlign = 'center';
      if (isPlayerTouching) {
        // 觸碰傳送門時顯示高亮提示：按【↑】鍵進入傳送門
        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
        ctx.shadowColor = '#eab308';
        ctx.shadowBlur = 10;
        ctx.fillText('✨ 按【 ↑ 】鍵進入傳送門 ✨', cx, p.y - 18);
      } else {
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
        ctx.shadowColor = 'rgba(0,0,0,0.9)';
        ctx.shadowBlur = 6;
        const nextStageNum = this.currentStageIndex + 2;
        ctx.fillText(
          this.currentStageIndex >= LEVELS.length - 1
            ? '✨ 混沌神門 (按 ↑ 輪迴突破)'
            : `✨ 傳送門 (按 ↑ 前往第 ${nextStageNum} 區)`,
          cx,
          p.y - 14
        );
      }
    }
    ctx.restore();
  }

  private renderLightningStrikes(ctx: CanvasRenderingContext2D) {
    const time = performance.now() * 0.005;

    for (const strike of this.lightningStrikes) {
      ctx.save();

      if (!strike.hasStruck) {
        // === 1. 2秒延遲預警階段：顯示一條醒目紅線與充能警戒區域做提示 ===
        const remainingTime = Math.max(0, strike.duration - strike.timer);
        const pulse = 0.75 + Math.sin(time * 16) * 0.25;

        // (a) 半透明紅色警告光柱 (寬度 32px)
        const areaGrad = ctx.createLinearGradient(strike.x - 16, 0, strike.x + 16, 0);
        areaGrad.addColorStop(0, 'rgba(239, 68, 68, 0)');
        areaGrad.addColorStop(0.5, `rgba(239, 68, 68, ${0.25 * pulse})`);
        areaGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = areaGrad;
        ctx.fillRect(strike.x - 16, 0, 32, strike.y);

        // (b) 核心提示紅線 (自世界頂端筆直貫穿至地面，隨時間加快頻率閃爍)
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.5 + Math.sin(time * 22) * 1.0;
        ctx.shadowColor = '#dc2626';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(strike.x, 0);
        ctx.lineTo(strike.x, strike.y);
        ctx.stroke();

        // (c) 地面警告衝擊落點標記
        ctx.fillStyle = `rgba(239, 68, 68, ${0.45 * pulse})`;
        ctx.beginPath();
        ctx.ellipse(strike.x, strike.y - 2, 24, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#f87171';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(strike.x, strike.y - 2, 24, 7, 0, 0, Math.PI * 2);
        ctx.stroke();

        // (d) 懸浮警示倒數標籤
        ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#f87171';
        ctx.shadowColor = 'rgba(0,0,0,0.95)';
        ctx.shadowBlur = 4;
        ctx.fillText(`⚡ 落雷預警 ${remainingTime.toFixed(1)}s`, strike.x, strike.y - 20);
      } else if (strike.strikeTimer > 0) {
        // === 2. 震撼天罰落雷狂暴劈落瞬間 ===
        const alpha = Math.min(1, strike.strikeTimer / 0.35);

        // 外層雷霆強光光柱
        const outerGrad = ctx.createLinearGradient(strike.x - 26, 0, strike.x + 26, 0);
        outerGrad.addColorStop(0, 'rgba(250, 204, 21, 0)');
        outerGrad.addColorStop(0.5, `rgba(250, 204, 21, ${0.7 * alpha})`);
        outerGrad.addColorStop(1, 'rgba(250, 204, 21, 0)');
        ctx.fillStyle = outerGrad;
        ctx.fillRect(strike.x - 26, 0, 52, strike.y);

        // 核心超亮天罰雷柱
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 24;
        ctx.fillRect(strike.x - 7, 0, 14, strike.y);

        // 閃爍曲折雷光電弧
        ctx.strokeStyle = `rgba(254, 240, 138, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(strike.x, 0);
        for (let y = 30; y < strike.y; y += 45) {
          const zig = (Math.random() - 0.5) * 20;
          ctx.lineTo(strike.x + zig, y);
        }
        ctx.lineTo(strike.x, strike.y);
        ctx.stroke();

        // 地面雷爆光環
        ctx.fillStyle = `rgba(254, 240, 138, ${alpha * 0.8})`;
        ctx.beginPath();
        ctx.ellipse(strike.x, strike.y - 2, 45, 12, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  private renderBossArena(ctx: CanvasRenderingContext2D) {
    const arena = this.currentLevel.bossArena;
    if (!arena) return;

    const time = performance.now() * 0.003;
    const isBossAlive = this.activeBoss && this.activeBoss.hp > 0 && this.activeBoss.state !== 'dead';
    const groundY = this.currentLevel.worldHeight - 100;

    ctx.save();

    // 1. Arena zone ambient glow
    const zoneGrad = ctx.createLinearGradient(arena.startX, 0, arena.endX, 0);
    zoneGrad.addColorStop(0, 'rgba(239, 68, 68, 0.08)');
    zoneGrad.addColorStop(0.5, 'rgba(239, 68, 68, 0.03)');
    zoneGrad.addColorStop(1, 'rgba(56, 189, 248, 0.06)');
    ctx.fillStyle = zoneGrad;
    ctx.fillRect(arena.startX, 0, arena.endX - arena.startX, groundY);

    // 2. Barrier at arena.startX
    if (isBossAlive && this.isBossEngaged) {
      // 決戰結界已降下：壯觀魔法光柱結界封鎖，玩家無法離開！
      const alphaPulse = 0.75 + Math.sin(time * 6) * 0.25;

      // Glow backdrop
      const glowGrad = ctx.createLinearGradient(arena.startX - 35, 0, arena.startX + 35, 0);
      glowGrad.addColorStop(0, 'rgba(239, 68, 68, 0)');
      glowGrad.addColorStop(0.5, `rgba(239, 68, 68, ${0.45 * alphaPulse})`);
      glowGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(arena.startX - 35, 0, 70, groundY);

      // Core laser beam
      ctx.fillStyle = `rgba(254, 202, 202, ${alphaPulse})`;
      ctx.fillRect(arena.startX - 3, 0, 6, groundY);

      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(arena.startX, 0);
      ctx.lineTo(arena.startX, groundY);
      ctx.stroke();

      // Pulsing runes / energy nodes along barrier
      for (let y = 80; y < groundY; y += 90) {
        const offset = Math.sin(time * 4 + y * 0.05) * 5;
        ctx.fillStyle = '#f87171';
        ctx.beginPath();
        ctx.arc(arena.startX + offset, y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fef2f2';
        ctx.beginPath();
        ctx.arc(arena.startX + offset, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Warning seal label
      ctx.fillStyle = '#f87171';
      ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.95)';
      ctx.shadowBlur = 6;
      ctx.fillText('⛔ 決戰結界已封鎖 (討伐 BOSS 方可解除) ⛔', arena.startX + 130, 240);
    } else if (isBossAlive && !this.isBossEngaged) {
      // 尚未進入：入口警戒線與標記
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
      ctx.setLineDash([8, 8]);
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(arena.startX, 60);
      ctx.lineTo(arena.startX, groundY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Warning marker sign
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.95)';
      ctx.shadowBlur = 6;
      ctx.fillText('⚠️ BOSS 決戰區域入口 (踏入展開戰鬥) ⚠️', arena.startX + 130, 240);
    } else if (!isBossAlive) {
      // BOSS 已討伐，結界已解除
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.95)';
      ctx.shadowBlur = 6;
      ctx.fillText('✨ 決戰勝利！結界已解除 ✨', arena.startX + 120, 240);
    }

    ctx.restore();
  }

  private renderPickups(ctx: CanvasRenderingContext2D) {
    // Coins
    for (const c of this.coins) {
      ctx.save();
      ctx.fillStyle = '#eab308';
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(c.x, c.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // inner shine
      ctx.fillStyle = '#fef9c3';
      ctx.beginPath();
      ctx.arc(c.x - 1.5, c.y - 1.5, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // EXP Orbs
    for (const orb of this.expOrbs) {
      ctx.save();
      const grad = ctx.createRadialGradient(orb.x, orb.y, 2, orb.x, orb.y, 8);
      grad.addColorStop(0, '#f0abfc');
      grad.addColorStop(0.8, '#a855f7');
      grad.addColorStop(1, 'rgba(168, 85, 247, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private renderEnemies(ctx: CanvasRenderingContext2D) {
    for (const e of this.enemies) {
      if (e.state === 'dead') continue;

      ctx.save();
      ctx.translate(e.x + e.width / 2, e.y + e.height / 2);
      if (e.facing === -1) {
        ctx.scale(-1, 1);
      }

      // Hit-flash effect
      if (e.hurtTimer > 0) {
        ctx.filter = 'brightness(2.2)';
      }

      const halfW = e.width / 2;
      const halfH = e.height / 2;

      if (e.type === 'slime') {
        // Cute green bouncy slime
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.ellipse(0, 2, halfW, halfH - 2, 0, 0, Math.PI * 2);
        ctx.fill();
        // Eyes
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(4, -2, 3.5, 0, Math.PI * 2);
        ctx.arc(-4, -2, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(5, -2, 1.8, 0, Math.PI * 2);
        ctx.arc(-3, -2, 1.8, 0, Math.PI * 2);
        ctx.fill();
      } else if (e.type === 'goblin') {
        // Armored goblin with spiked club
        // Body
        ctx.fillStyle = '#15803d';
        ctx.fillRect(-halfW + 4, -halfH + 12, e.width - 8, e.height - 18);
        // Chestplate
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-halfW + 6, -halfH + 16, e.width - 12, 14);
        // Head
        ctx.fillStyle = '#16a34a';
        ctx.beginPath();
        ctx.arc(0, -halfH + 8, 12, 0, Math.PI * 2);
        ctx.fill();
        // Red glowing eyes
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(3, -halfH + 6, 3, 3);
        ctx.fillRect(8, -halfH + 6, 3, 3);
        // Spiked Club
        ctx.fillStyle = '#713f12';
        ctx.fillRect(halfW - 4, -halfH + 4, 8, 26);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(halfW, -halfH + 2, 4, 4);
      } else if (e.type === 'bat') {
        // Red bat with flapping wings
        const wingFlap = Math.sin(performance.now() * 0.015) * 8;
        // Body
        ctx.fillStyle = '#831843';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        // Wings
        ctx.fillStyle = '#be185d';
        ctx.beginPath();
        ctx.moveTo(-6, 0);
        ctx.lineTo(-halfW - 6, -wingFlap);
        ctx.lineTo(-4, 6);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(6, 0);
        ctx.lineTo(halfW + 6, -wingFlap);
        ctx.lineTo(4, 6);
        ctx.fill();
        // Eyes
        ctx.fillStyle = '#fde047';
        ctx.fillRect(2, -2, 2.5, 2.5);
      } else if (e.type === 'skeleton') {
        // Skeleton archer
        // Skull
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(-8, -halfH, 16, 14);
        // Eye sockets
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(2, -halfH + 4, 3, 3);
        // Ribcage
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -halfH + 14);
        ctx.lineTo(0, halfH - 12);
        ctx.moveTo(-10, -halfH + 18);
        ctx.lineTo(10, -halfH + 18);
        ctx.moveTo(-8, -halfH + 24);
        ctx.lineTo(8, -halfH + 24);
        ctx.stroke();
        // Wooden Bow
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(14, 0, 16, -Math.PI / 2.5, Math.PI / 2.5);
        ctx.stroke();
      } else if (e.type === 'boss_knight') {
        // Shadow Titan Knight Boss!
        // Huge dark armored silhouette
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(-halfW + 8, -halfH + 24, e.width - 16, e.height - 30);
        // Shoulders / Pauldrons
        ctx.fillStyle = '#312e81';
        ctx.fillRect(-halfW, -halfH + 16, 16, 20);
        ctx.fillRect(halfW - 16, -halfH + 16, 16, 20);
        // Horned Helmet
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-14, -halfH + 4, 28, 22);
        // Glowing Visor
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(2, -halfH + 12, 10, 4);
        // Giant Greatsword
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(halfW - 4, -halfH - 8, 10, 68);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(halfW - 8, -halfH + 24, 18, 6);
      }

      ctx.restore();

      // Enemy Mini HP Bar (above head)
      if (e.hp < e.maxHp && !e.isBoss) {
        ctx.save();
        const barW = 32;
        const barH = 4;
        const barX = e.x + e.width / 2 - barW / 2;
        const barY = e.y - 8;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(barX, barY, Math.max(0, (e.hp / e.maxHp) * barW), barH);
        ctx.restore();
      }
    }
  }

  private renderPlayer(ctx: CanvasRenderingContext2D) {
    // 開始畫面選單：玩家隱藏
    if (this.isMenuMode) return;

    const p = this.player;
    const currentWeapon = WEAPONS[this.stats.equippedWeaponId] || WEAPONS.rusty_dagger;

    ctx.save();
    ctx.translate(p.x + p.width / 2, p.y + p.height / 2);
    ctx.scale(p.facing * p.scaleX, p.scaleY);

    // Invincible flicker
    if (p.invincibleTimer > 0 && Math.floor(performance.now() / 60) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    const halfW = p.width / 2;
    const halfH = p.height / 2;

    // Cloak / Cape
    ctx.fillStyle = '#dc2626';
    const capeFlutter = p.vx !== 0 ? Math.sin(performance.now() * 0.02) * 6 : 2;
    ctx.beginPath();
    ctx.moveTo(-4, -halfH + 14);
    ctx.lineTo(-halfW - 8 - Math.abs(p.vx * 0.04), halfH - 4 + capeFlutter);
    ctx.lineTo(0, halfH - 6);
    ctx.closePath();
    ctx.fill();

    // Body Armor
    ctx.fillStyle = '#334155';
    ctx.fillRect(-halfW + 4, -halfH + 14, p.width - 8, p.height - 20);

    // Golden Armor Trim
    ctx.fillStyle = '#facc15';
    ctx.fillRect(-halfW + 6, -halfH + 18, p.width - 12, 4);

    // Legs / Boots
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-halfW + 4, halfH - 10, 8, 10);
    ctx.fillRect(halfW - 12, halfH - 10, 8, 10);

    // Piggy Curly Tail
    ctx.strokeStyle = '#f472b6';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-halfW + 3, halfH - 12);
    ctx.quadraticCurveTo(-halfW - 6, halfH - 14, -halfW - 4, halfH - 17);
    ctx.quadraticCurveTo(-halfW - 1, halfH - 15, -halfW - 5, halfH - 19);
    ctx.stroke();

    // --- PIG HERO HEAD (可愛粉紅豬豬頭) ---
    // 1. Back Pig Ear (後耳)
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.moveTo(-6, -halfH + 3);
    ctx.quadraticCurveTo(-11, -halfH - 5, -8, -halfH - 8);
    ctx.quadraticCurveTo(-3, -halfH - 4, -2, -halfH + 1);
    ctx.closePath();
    ctx.fill();
    // Inner ear shadow
    ctx.fillStyle = '#fb7185';
    ctx.beginPath();
    ctx.moveTo(-5, -halfH + 2);
    ctx.quadraticCurveTo(-9, -halfH - 4, -7, -halfH - 6);
    ctx.quadraticCurveTo(-4, -halfH - 3, -3, -halfH + 1);
    ctx.closePath();
    ctx.fill();

    // 2. Pig Head Base (圓潤粉嫩小豬臉蛋)
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.ellipse(0, -halfH + 8, 11, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head top highlight luster
    ctx.fillStyle = '#fbcfe8';
    ctx.beginPath();
    ctx.ellipse(-2, -halfH + 4.5, 6, 3, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // 3. Front Pig Ear (前耳，立體俏皮)
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.moveTo(1, -halfH + 1);
    ctx.quadraticCurveTo(4, -halfH - 6, 7, -halfH - 8);
    ctx.quadraticCurveTo(10, -halfH - 3, 7, -halfH + 3);
    ctx.closePath();
    ctx.fill();
    // Front inner ear
    ctx.fillStyle = '#fb7185';
    ctx.beginPath();
    ctx.moveTo(2, -halfH + 1);
    ctx.quadraticCurveTo(4, -halfH - 4, 6, -halfH - 6);
    ctx.quadraticCurveTo(8, -halfH - 3, 6, -halfH + 2);
    ctx.closePath();
    ctx.fill();

    // 4. Hero Bandana across forehead (紅色勇者頭帶)
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(-9, -halfH + 1.5, 18, 3.5);
    // Bandana trailing ribbon fluttering behind
    const bandFlutter = p.vx !== 0 ? Math.sin(performance.now() * 0.02) * 4 : 0;
    ctx.beginPath();
    ctx.moveTo(-8, -halfH + 2);
    ctx.quadraticCurveTo(-13, -halfH + 1 + bandFlutter, -16, -halfH + 5 + bandFlutter);
    ctx.lineTo(-13, -halfH + 6 + bandFlutter);
    ctx.lineTo(-8, -halfH + 4);
    ctx.closePath();
    ctx.fill();

    // 5. Rosy Cheeks (粉嫩腮紅)
    ctx.fillStyle = 'rgba(244, 63, 94, 0.45)';
    ctx.beginPath();
    ctx.arc(-4, -halfH + 11, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(4, -halfH + 11, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // 6. Iconic Pig Snout (標誌性立體圓拱豬鼻子)
    ctx.fillStyle = '#fb7185';
    ctx.strokeStyle = '#e11d48';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(5, -halfH + 8.5, 5.5, 4.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Snout highlight
    ctx.fillStyle = '#fbcfe8';
    ctx.beginPath();
    ctx.ellipse(4.5, -halfH + 7.2, 2.8, 1.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Two Pig Nostrils (可愛黑黑豬鼻孔)
    ctx.fillStyle = '#881337';
    ctx.beginPath();
    ctx.ellipse(3.8, -halfH + 8.8, 1.1, 1.7, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(6.8, -halfH + 8.8, 1.1, 1.7, -0.1, 0, Math.PI * 2);
    ctx.fill();

    // 7. Sparkling Anime Eye (萌系靈動大眼)
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(1.2, -halfH + 6, 2.4, 2.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // White eye highlights
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0.7, -halfH + 5.2, 1.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(2.0, -halfH + 7.0, 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Weapon in hand & Attack Swing Slash Arc
    ctx.save();
    ctx.translate(4, 0); // weapon anchor hand

    if (p.isAttacking) {
      ctx.rotate(p.slashAngle);

      // 受範圍天賦加成之視覺刀光半徑
      const visualRangeMultiplier = 1 + (this.stats.talents?.range || 0) * 0.15;
      const visualRange = currentWeapon.range * visualRangeMultiplier;

      // Draw dynamic weapon blade
      ctx.fillStyle = currentWeapon.color;
      ctx.fillRect(0, -visualRange * 0.65, 5, visualRange * 0.7);

      // Weapon crossguard
      ctx.fillStyle = currentWeapon.accentColor;
      ctx.fillRect(-4, -6, 13, 4);

      // Slash arc effect trail
      ctx.strokeStyle = currentWeapon.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, visualRange, -Math.PI / 3, p.slashAngle);
      ctx.stroke();

      // Glowing inner arc
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, visualRange - 4, -Math.PI / 4, p.slashAngle);
      ctx.stroke();
    } else {
      // Idle / Running weapon rest
      ctx.rotate(Math.PI / 6);
      ctx.fillStyle = currentWeapon.color;
      ctx.fillRect(0, -18, 4, 22);
      ctx.fillStyle = currentWeapon.accentColor;
      ctx.fillRect(-3, 0, 10, 3);
    }
    ctx.restore();

    ctx.restore();
  }

  private renderProjectiles(ctx: CanvasRenderingContext2D) {
    for (const proj of this.projectiles) {
      ctx.save();
      if (proj.element === 'holy_beam') {
        // Glowing holy beam blade
        ctx.fillStyle = '#facc15';
        ctx.shadowColor = '#fde047';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.ellipse(proj.x, proj.y, proj.radius * 1.5, proj.radius * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (proj.element === 'arrow') {
        // Bone arrow
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(proj.x - 10, proj.y - 2, 20, 4);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(proj.x + 8, proj.y - 3, 4, 6);
      } else if (proj.element === 'fire_wave') {
        // Fiery ground shockwave
        ctx.fillStyle = '#f97316';
        ctx.shadowColor = '#ea580c';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  private renderParticles(ctx: CanvasRenderingContext2D) {
    for (const part of this.particles) {
      ctx.save();
      ctx.globalAlpha = part.alpha;
      ctx.fillStyle = part.color;
      ctx.beginPath();
      ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private renderDamageNumbers(ctx: CanvasRenderingContext2D) {
    for (const dn of this.damageNumbers) {
      ctx.save();
      ctx.globalAlpha = dn.alpha;
      ctx.font = dn.isCrit ? '900 28px "Plus Jakarta Sans", sans-serif' : 'bold 22px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';

      // 增強字體描邊，極致清晰震撼
      ctx.lineWidth = dn.isCrit ? 4.5 : 3.5;
      ctx.strokeStyle = 'rgba(10, 15, 29, 0.9)';
      ctx.strokeText(dn.text, dn.x, dn.y);

      ctx.fillStyle = dn.color;
      ctx.fillText(dn.text, dn.x, dn.y);
      ctx.restore();
    }
  }

  private renderBanner(ctx: CanvasRenderingContext2D, w: number, h: number) {
    if (!this.bannerText) return;

    ctx.save();
    const bannerY = 85;
    const alpha = Math.min(1, this.bannerTimer * 2);
    ctx.globalAlpha = alpha;

    // Glowing pill backdrop
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(w / 2 - 240, bannerY - 30, 480, 60, 14);
    ctx.fill();
    ctx.stroke();

    // Main text
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.bannerText, w / 2, bannerY);

    // Subtext
    if (this.bannerSubtext) {
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '12px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(this.bannerSubtext, w / 2, bannerY + 18);
    }
    ctx.restore();
  }
}
