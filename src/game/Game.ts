import { type PowerUpType, POWER_UP_CONFIGS } from '../types';
import { randomRange, distance } from '../utils/math';
import { loadHighScore, saveHighScore, loadSoundSetting, saveSoundSetting } from '../utils/storage';
import { InputSystem } from '../systems/InputSystem';
import { AudioSystem } from '../systems/AudioSystem';
import { Starfield } from '../systems/Starfield';
import { ParticleSystem } from '../systems/ParticleSystem';
import { ScreenShakeManager } from '../systems/ScreenShake';
import { circlesOverlap } from '../systems/CollisionSystem';
import { UIManager } from '../ui/UIManager';
import { Player } from './Player';
import { Enemy, spawnEnemyAtEdge } from './Enemy';
import { shouldSpawnBoss } from './Boss';
import { Projectile } from './Projectile';
import { PowerUp, maybeSpawnPowerUp } from './PowerUp';
import { Boss } from './Boss';

export class Game {
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private input: InputSystem;
  private audio: AudioSystem;
  private starfield: Starfield;
  private particles: ParticleSystem;
  private screenShake: ScreenShakeManager;
  private ui: UIManager;

  private player!: Player;
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private powerUps: PowerUp[] = [];
  private boss: Boss | null = null;

  private score = 0;
  private highScore = 0;
  private level = 1;
  private timeRemaining = 30;
  private gameActive = false;
  private paused = false;
  private frameCount = 0;
  private enemySpawnRate = 100;
  private spawnTimer = 0;
  private levelTimer = 0;
  private hasBadge = false;
  private currentBadge = '';
  private animationId = 0;
  private lastTime = 0;
  private deltaTime = 0;

  private isTouchDevice = false;
  private soundEnabled = true;

  private readonly BADGES: Record<number, string> = {
    3: '🥉 BRONZE DEFENDER',
    5: '🥈 SILVER DEFENDER',
    10: '🥇 GOLDEN DEFENDER',
    15: '💎 DIAMOND DEFENDER',
    20: '👑 LEGENDARY DEFENDER',
  };

  constructor() {
    this.input = new InputSystem();
    this.audio = new AudioSystem();
    this.starfield = new Starfield();
    this.particles = new ParticleSystem();
    this.screenShake = new ScreenShakeManager();
    this.ui = new UIManager();
    this.highScore = loadHighScore();
    this.soundEnabled = loadSoundSetting();
    this.audio.setEnabled(this.soundEnabled);
  }

  init(): void {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (!this.canvas) {
      console.error('Canvas not found');
      return;
    }
    this.ctx = this.canvas.getContext('2d')!;

    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.starfield.resize(this.canvas.width, this.canvas.height);
      this.checkOrientation();
    });

    this.input.init(this.canvas);
    this.starfield.init(this.canvas);
    this.ui.init(this.canvas);
    this.ui.createExtraUI();
    this.ui.updateHighScore(this.highScore);
    this.ui.setSoundIcon(this.soundEnabled);

    this.setupEventListeners();
    this.checkOrientation();

    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  private setupEventListeners(): void {
    const desktopBtn = this.ui.getElement('btn-desktop');
    const mobileBtn = this.ui.getElement('btn-mobile');
    const startBtn = this.ui.getElement('start-btn');
    const restartBtn = this.ui.getElement('restart-btn');

    desktopBtn?.addEventListener('click', () => {
      this.audio.ensureResumed();
      this.isTouchDevice = false;
      this.input.isTouchDevice = false;
      this.ui.hideDeviceSelection();
      this.ui.showTopBar();
      this.ui.showStartScreen();
    });

    mobileBtn?.addEventListener('click', () => {
      this.audio.ensureResumed();
      this.isTouchDevice = true;
      this.input.isTouchDevice = true;
      this.ui.hideDeviceSelection();
      this.ui.showTopBar();
      this.ui.showStartScreen();
      this.ui.showOrientationWarning(window.innerHeight > window.innerWidth, true);

      const moveZone = this.ui.getElement('joystick-move');
      const shootZone = this.ui.getElement('joystick-shoot');
      if (moveZone && shootZone) {
        moveZone.style.display = 'block';
        shootZone.style.display = 'block';
        this.input.initJoysticks(moveZone, shootZone);
      }
    });

    startBtn?.addEventListener('click', () => {
      this.startGame();
    });

    restartBtn?.addEventListener('click', () => {
      this.startGame();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (this.gameActive) this.togglePause();
      }
    });

    if (this.ui.soundToggle) {
      this.ui.soundToggle.addEventListener('click', () => {
        this.soundEnabled = this.audio.toggle();
        saveSoundSetting(this.soundEnabled);
        this.ui.setSoundIcon(this.soundEnabled);
      });
    }

    if (this.ui.pauseBtn) {
      this.ui.pauseBtn.addEventListener('click', () => {
        if (this.gameActive) this.togglePause();
      });
    }
  }

  private ensureResumed(): void {
    this.audio.ensureResumed();
  }

  private checkOrientation(): void {
    if (this.isTouchDevice) {
      this.ui.showOrientationWarning(window.innerHeight > window.innerWidth, true);
    }
  }

  private startGame(): void {
    this.ensureResumed();
    this.reset();
    this.ui.hideStartScreen();
    this.ui.hideGameOver();
    this.ui.showCanvasOverlay(true);
    this.gameActive = true;
    this.paused = false;
    this.lastTime = performance.now();
  }

  private togglePause(): void {
    this.paused = !this.paused;
    this.ui.showPauseOverlay(this.paused);
  }

  private reset(): void {
    this.player = new Player(this.canvas.width, this.canvas.height);
    this.enemies = [];
    this.projectiles = [];
    this.powerUps = [];
    this.boss = null;
    this.score = 0;
    this.level = 1;
    this.timeRemaining = 30;
    this.frameCount = 0;
    this.enemySpawnRate = 100;
    this.spawnTimer = 0;
    this.levelTimer = 0;
    this.hasBadge = false;
    this.currentBadge = '';
    this.particles.clear();
    this.ui.updateScore(0);
    this.ui.updateLevel(1);
    this.ui.updateTime(30);
    this.ui.updateHealth(100, 100);
    this.ui.updateShield(0);
    this.ui.updateBadge(false, '');
    this.ui.updatePowerUps({});
  }

  private gameLoop = (time: number): void => {
    this.deltaTime = Math.min(time - this.lastTime, 33.33);
    this.lastTime = time;
    this.animationId = requestAnimationFrame(this.gameLoop);

    if (!this.paused) {
      this.frameCount++;
      this.update();
    }

    this.render();
  };

  private update(): void {
    if (!this.gameActive) return;

    this.screenShake.update(this.deltaTime);
    this.starfield.update(this.deltaTime, this.player?.velocity?.x || 0, this.player?.velocity?.y || 0);

    const { shoot, aimAngle } = this.player.update(
      this.input,
      this.particles,
      this.canvas.width,
      this.canvas.height
    );

    if (shoot) {
      this.playerShoot(aimAngle);
    }

    this.player.updatePowerUps();
    this.spawnEnemies();
    this.updateEnemies();
    this.updateProjectiles();
    this.updatePowerUps();
    this.updateBoss();
    this.checkCollisions();
    this.particles.update();
    this.levelTimer++;

    if (this.levelTimer % 60 === 0) {
      this.timeRemaining--;
      this.ui.updateTime(this.timeRemaining);
      if (this.timeRemaining <= 0) {
        this.levelUp();
      }
    }

    this.ui.updateScore(this.score);
    this.ui.updateHealth(this.player.health, this.player.maxHealth);
    this.ui.updateShield(this.player.shield);
    this.ui.updatePowerUps(this.player.activePowerUps);
  }

  private playerShoot(angle: number): void {
    const spread = this.player.spreadCount;
    const speed = this.player.bulletSpeed;
    const damage = this.player.damage;

    if (spread === 1) {
      this.projectiles.push(
        new Projectile(
          this.player.x,
          this.player.y,
          4,
          '#ff00ea',
          { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed }
        )
      );
    } else {
      const spreadAngle = 0.15;
      const start = -(spread - 1) / 2;
      for (let i = 0; i < spread; i++) {
        const a = angle + (start + i) * spreadAngle;
        this.projectiles.push(
          new Projectile(
            this.player.x,
            this.player.y,
          3 + (i === Math.floor(spread / 2) ? 1 : 0),
          i === Math.floor(spread / 2) ? '#ff00ea' : '#ff88f0',
          { x: Math.cos(a) * speed, y: Math.sin(a) * speed }
          )
        );
      }
    }

    this.audio.playShoot();
  }

  private spawnEnemies(): void {
    this.spawnTimer++;

    const isBossLevel = shouldSpawnBoss(this.level);

    if (isBossLevel && !this.boss && this.enemies.length === 0) {
      this.boss = new Boss(this.canvas.width, this.canvas.height, this.level);
      this.audio.playBossWarning();

      const flashEl = document.createElement('div');
      flashEl.style.cssText =
        'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(255,0,0,0.1);z-index:30;pointer-events:none;animation:fadeOut 1s forwards;';
      document.body.appendChild(flashEl);
      setTimeout(() => flashEl.remove(), 1000);

      return;
    }

    if (this.boss) return;

    if (this.spawnTimer >= this.enemySpawnRate) {
      this.spawnTimer = 0;
      const count = 1 + Math.floor(Math.random() * Math.min(this.level, 3));
      for (let i = 0; i < count; i++) {
        const enemy = spawnEnemyAtEdge(this.canvas.width, this.canvas.height, this.level);
        this.enemies.push(enemy);
      }

      this.enemySpawnRate = Math.max(15, 100 - this.level * 12);
    }
  }

  private updateEnemies(): void {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update(this.player.x, this.player.y);

      if (enemy.canShoot()) {
        const angle = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);
        this.projectiles.push(
          new Projectile(enemy.x, enemy.y, 4, '#ff6600',
            { x: Math.cos(angle) * 4, y: Math.sin(angle) * 4 },
            true
          )
        );
        enemy.resetShootTimer();
      }

      if (
        enemy.x + enemy.radius < -100 ||
        enemy.x - enemy.radius > this.canvas.width + 100 ||
        enemy.y + enemy.radius < -100 ||
        enemy.y - enemy.radius > this.canvas.height + 100
      ) {
        this.enemies.splice(i, 1);
      }
    }
  }

  private updateProjectiles(): void {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update();
      if (p.isOffScreen(this.canvas.width, this.canvas.height)) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  private updatePowerUps(): void {
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const pu = this.powerUps[i];
      pu.update();
      if (pu.isExpired()) {
        this.powerUps.splice(i, 1);
      }
    }
  }

  private updateBoss(): void {
    if (!this.boss) return;
    this.boss.update(this.player.x, this.player.y, this.canvas.width, this.canvas.height);

    if (this.boss.canAttack()) {
      const bossProjs = this.boss.attack(this.player.x, this.player.y);
      this.projectiles.push(...bossProjs);
    }
  }

  private checkCollisions(): void {
    this.checkProjectileEnemyCollisions();
    this.checkPlayerEnemyCollisions();
    this.checkPlayerPowerUpCollisions();
    this.checkPlayerEnemyProjectileCollisions();
    this.checkProjectileBossCollisions();
    this.checkPlayerBossCollision();
  }

  private checkProjectileEnemyCollisions(): void {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      if (p.isEnemy) continue;

      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const enemy = this.enemies[j];
        if (circlesOverlap(p, enemy)) {
          const destroyed = enemy.takeDamage(this.player.damage);
          this.projectiles.splice(i, 1);
          this.particles.emit(enemy.x, enemy.y, 10, enemy.color, { speed: 4, fadeSpeed: 0.04 });

          if (destroyed) {
            this.score += enemy.score;
            this.audio.playExplosion();
            this.particles.emit(enemy.x, enemy.y, 20, enemy.color, { speed: 6, fadeSpeed: 0.03 });
            this.screenShake.shake(4, 150);
            this.player.grow(0.5);

            const powerUp = maybeSpawnPowerUp(enemy.x, enemy.y);
            if (powerUp) this.powerUps.push(powerUp);

            this.enemies.splice(j, 1);
          } else {
            this.audio.playHit();
            this.screenShake.shake(2, 80);
          }
          break;
        }
      }
    }
  }

  private checkPlayerEnemyCollisions(): void {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (circlesOverlap(this.player, enemy)) {
        if (enemy.type === 'bomber') {
          this.screenShake.shake(15, 300);
          this.particles.emit(enemy.x, enemy.y, 40, '#ff4444', { speed: 8, fadeSpeed: 0.02 });
          this.audio.playExplosion();
          this.player.takeDamage(enemy.damage * 2);
          this.player.shrink(12);
          this.enemies.splice(i, 1);
        } else {
          this.particles.emit(enemy.x, enemy.y, 10, enemy.color, { speed: 4, fadeSpeed: 0.03 });
          this.particles.emit(this.player.x, this.player.y, 15, '#00f3ff', { speed: 3, fadeSpeed: 0.03 });
          this.audio.playHit();
          this.screenShake.shake(6, 150);
          this.player.shrink(6);
          this.player.takeDamage(enemy.damage * 0.5);
          this.enemies.splice(i, 1);
        }

        if (this.player.health <= 0 || this.player.radius <= this.player.minRadius) {
          this.handleGameOver();
          return;
        }
      }
    }
  }

  private checkPlayerPowerUpCollisions(): void {
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const pu = this.powerUps[i];
      if (circlesOverlap(this.player, pu)) {
        this.player.applyPowerUp(pu.type, pu.duration);
        this.audio.playPowerUp();
        this.particles.emit(pu.x, pu.y, 15, pu.color, { speed: 5, fadeSpeed: 0.03 });
        this.powerUps.splice(i, 1);
      }
    }
  }

  private checkPlayerEnemyProjectileCollisions(): void {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      if (!p.isEnemy) continue;

      if (circlesOverlap(this.player, p)) {
        this.projectiles.splice(i, 1);
        this.particles.emit(p.x, p.y, 8, '#ff6600', { speed: 3, fadeSpeed: 0.03 });
        this.player.takeDamage(8);
        this.screenShake.shake(3, 100);
        this.audio.playHit();

        if (this.player.health <= 0) {
          this.handleGameOver();
          return;
        }
      }
    }
  }

  private checkProjectileBossCollisions(): void {
    const boss = this.boss;
    if (!boss) return;

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      if (p.isEnemy) continue;

      if (circlesOverlap(p, { x: boss.x, y: boss.y, radius: boss.radius })) {
        const destroyed = boss.takeDamage(this.player.damage);
        this.projectiles.splice(i, 1);
        this.particles.emit(p.x, p.y, 5, '#ff0044', { speed: 3, fadeSpeed: 0.04 });

        if (destroyed) {
          this.score += this.level * 100;
          this.audio.playBossExplosion();
          this.particles.emit(boss.x, boss.y, 80, '#ff0044', { speed: 12, fadeSpeed: 0.01 });
          this.particles.emit(boss.x, boss.y, 40, '#ffaa00', { speed: 8, fadeSpeed: 0.02 });
          this.screenShake.shake(20, 500);

          for (let k = 0; k < 3; k++) {
            const pu = maybeSpawnPowerUp(
              boss.x + randomRange(-30, 30),
              boss.y + randomRange(-30, 30),
              1
            );
            if (pu) this.powerUps.push(pu);
          }

          this.boss = null;
          this.levelUp();
        } else {
          this.screenShake.shake(5, 150);
          this.audio.playExplosion();
        }
      }
    }
  }

  private checkPlayerBossCollision(): void {
    if (!this.boss) return;

    if (circlesOverlap(this.player, { x: this.boss.x, y: this.boss.y, radius: this.boss.radius })) {
      this.player.takeDamage(15);
      this.player.shrink(10);
      this.screenShake.shake(10, 200);
      this.audio.playHit();
      this.particles.emit(this.player.x, this.player.y, 20, '#ff0044', { speed: 5, fadeSpeed: 0.03 });

      if (this.player.health <= 0 || this.player.radius <= this.player.minRadius) {
        this.handleGameOver();
      }
    }
  }

  private levelUp(): void {
    this.level++;
    this.timeRemaining = 30;
    this.audio.playLevelUp();

    this.particles.emit(this.player.x, this.player.y, 30, '#00ff66', { speed: 8, fadeSpeed: 0.02 });

    if (this.BADGES[this.level]) {
      this.hasBadge = true;
      this.currentBadge = this.BADGES[this.level];
      this.ui.updateBadge(true, this.currentBadge);
      this.particles.emit(this.canvas.width / 2, this.canvas.height / 2, 100, '#ffd700', { speed: 10, fadeSpeed: 0.015 });
    }

    this.ui.updateLevel(this.level);
    this.ui.updateTime(this.timeRemaining);
  }

  private handleGameOver(): void {
    this.gameActive = false;
    this.paused = false;

    if (this.frameCount % 2 !== 0) this.frameCount++;

    if (this.score > this.highScore) {
      this.highScore = this.score;
      saveHighScore(this.highScore);
      this.ui.updateHighScore(this.highScore);
    }

    this.particles.emit(this.player.x, this.player.y, 60, '#00f3ff', { speed: 10, fadeSpeed: 0.01 });
    this.screenShake.shake(15, 400);

    if (this.input.destroyJoysticks) {
      this.input.destroyJoysticks();
    }

    setTimeout(() => {
      this.particles.clear();
      this.ui.showCanvasOverlay(false);
      this.ui.showGameOver(this.score, this.level, this.hasBadge, this.currentBadge);
    }, 800);
  }

  private render(): void {
    const ctx = this.ctx;
    ctx.save();

    ctx.fillStyle = 'rgba(5, 5, 5, 0.3)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.starfield.draw(ctx);

    ctx.save();
    this.screenShake.apply(ctx);

    for (const pu of this.powerUps) {
      pu.draw(ctx);
    }

    if (this.gameActive || this.paused) {
      this.player.draw(ctx);
    }

    for (const enemy of this.enemies) {
      enemy.draw(ctx, this.frameCount);
    }

    for (const p of this.projectiles) {
      p.draw(ctx);
    }

    if (this.boss) {
      this.boss.draw(ctx);
    }

    this.particles.draw(ctx);

    ctx.restore();

    ctx.restore();
  }
}
