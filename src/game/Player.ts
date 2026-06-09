import { type Vector2, type PowerUpType } from '../types';
import { clamp } from '../utils/math';
import type { InputSystem } from '../systems/InputSystem';
import type { ParticleSystem } from '../systems/ParticleSystem';

export class Player {
  x: number;
  y: number;
  radius = 15;
  maxRadius = 50;
  minRadius = 7;
  baseSpeed = 5;
  speed = 5;
  health = 100;
  maxHealth = 100;
  shield = 0;
  fireRate = 10;
  bulletSpeed = 15;
  damage = 1;
  spreadCount = 1;
  activePowerUps: Partial<Record<PowerUpType, number>> = {};
  invincibleUntil = 0;
  velocity: Vector2 = { x: 0, y: 0 };
  private friction = 0.92;
  private lastShot = 0;
  private frameCount = 0;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.x = canvasWidth / 2;
    this.y = canvasHeight / 2;
  }

  get isInvincible(): boolean {
    return this.frameCount < this.invincibleUntil;
  }

  update(
    input: InputSystem,
    particleSystem: ParticleSystem,
    canvasWidth: number,
    canvasHeight: number
  ): { shoot: boolean; aimAngle: number } {
    this.frameCount++;

    const mv = input.movementVector;
    const acceleration = 1.5;
    const speedMultiplier = this.activePowerUps.speed ? 1.8 : 1;
    this.velocity.x += mv.x * acceleration * speedMultiplier;
    this.velocity.y += mv.y * acceleration * speedMultiplier;

    this.velocity.x *= this.friction;
    this.velocity.y *= this.friction;

    this.x += this.velocity.x;
    this.y += this.velocity.y;

    this.x = clamp(this.x, this.radius, canvasWidth - this.radius);
    this.y = clamp(this.y, this.radius, canvasHeight - this.radius);

    if (Math.abs(this.velocity.x) > 0.5 || Math.abs(this.velocity.y) > 0.5) {
      particleSystem.emit(this.x, this.y, 1, 'rgba(0, 243, 255, 0.3)', {
        speed: 1,
        radius: [1, 3],
        fadeSpeed: 0.05,
      });
    }

    let shoot = false;
    let aimAngle = 0;

    if (input.isShooting && this.frameCount - this.lastShot > this.fireRate) {
      shoot = true;
      aimAngle = input.isTouchDevice
        ? input.joystickShoot.angle
        : Math.atan2(input.mouse.y - this.y, input.mouse.x - this.x);
      this.lastShot = this.frameCount;

      this.velocity.x -= Math.cos(aimAngle) * 1.5;
      this.velocity.y -= Math.sin(aimAngle) * 1.5;
    }

    return { shoot, aimAngle };
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    const pulseRadius = this.radius + 3 * Math.sin(this.frameCount * 0.05);

    if (this.isInvincible && Math.floor(this.frameCount / 4) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    ctx.shadowBlur = 25;
    ctx.shadowColor = '#00f3ff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, pulseRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#00f3ff';
    ctx.fill();

    ctx.shadowBlur = 10;
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.x, this.y, pulseRadius + 5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();

    if (this.shield > 0) {
      ctx.save();
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#00bfff';
      ctx.strokeStyle = `rgba(0, 191, 255, ${0.4 + 0.3 * Math.sin(this.frameCount * 0.08)})`;
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  }

  takeDamage(amount: number): boolean {
    if (this.isInvincible) return false;

    if (this.shield > 0) {
      this.shield -= amount;
      if (this.shield < 0) {
        this.health += this.shield;
        this.shield = 0;
      }
    } else {
      this.health -= amount;
    }

    this.invincibleUntil = this.frameCount + 30;
    return this.health <= 0;
  }

  shrink(amount: number): boolean {
    if (this.isInvincible) return false;
    this.radius = Math.max(this.minRadius, this.radius - amount);
    this.invincibleUntil = this.frameCount + 20;
    return this.radius <= this.minRadius;
  }

  grow(amount: number): void {
    this.radius = Math.min(this.maxRadius, this.radius + amount);
  }

  heal(amount: number): void {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  applyPowerUp(type: PowerUpType, duration: number): void {
    if (duration > 0) {
      this.activePowerUps[type] = this.frameCount + duration;
    }
    switch (type) {
      case 'shield':
        this.shield = Math.min(100, this.shield + 50);
        break;
      case 'rapidfire':
        this.fireRate = 3;
        break;
      case 'spread':
        this.spreadCount = 5;
        break;
      case 'speed':
        break;
      case 'health':
        this.heal(30);
        break;
      case 'magnet':
        break;
    }
  }

  updatePowerUps(): void {
    for (const [type, endFrame] of Object.entries(this.activePowerUps)) {
      if (endFrame && this.frameCount > endFrame) {
        delete this.activePowerUps[type as PowerUpType];
        switch (type as PowerUpType) {
          case 'rapidfire':
            this.fireRate = 10;
            break;
          case 'spread':
            this.spreadCount = 1;
            break;
        }
      }
    }
  }

  reset(canvasWidth: number, canvasHeight: number): void {
    this.x = canvasWidth / 2;
    this.y = canvasHeight / 2;
    this.radius = 15;
    this.health = 100;
    this.shield = 0;
    this.speed = this.baseSpeed;
    this.fireRate = 10;
    this.bulletSpeed = 15;
    this.damage = 1;
    this.spreadCount = 1;
    this.activePowerUps = {};
    this.invincibleUntil = 0;
    this.velocity = { x: 0, y: 0 };
    this.lastShot = 0;
    this.frameCount = 0;
  }
}
