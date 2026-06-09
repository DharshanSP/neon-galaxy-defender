import { randomRange, angleBetween } from '../utils/math';
import { Projectile } from './Projectile';
import type { ParticleSystem } from '../systems/ParticleSystem';

export class Boss {
  x: number;
  y: number;
  radius: number;
  maxHp: number;
  hp: number;
  color = '#ff0044';
  speed: number;
  angle = 0;
  phase = 0;
  attackTimer = 0;
  attackCooldown: number;
  level: number;
  private movePattern = 0;
  private moveTimer = 0;
  private frameCount = 0;

  constructor(canvasWidth: number, canvasHeight: number, level: number) {
    this.x = canvasWidth / 2;
    this.y = -60;
    this.radius = 50 + level * 5;
    this.maxHp = 20 + level * 10;
    this.hp = this.maxHp;
    this.speed = 0.5 + level * 0.1;
    this.level = level;
    this.attackCooldown = Math.max(20, 60 - level * 2);
  }

  update(playerX: number, playerY: number, canvasWidth: number, canvasHeight: number): void {
    this.frameCount++;
    this.angle += 0.02;
    this.moveTimer += 0.01;
    this.attackTimer++;

    if (this.y < 80) {
      this.y += 1;
      return;
    }

    switch (this.movePattern % 3) {
      case 0:
        this.x = canvasWidth / 2 + Math.sin(this.moveTimer * 1.5) * (canvasWidth * 0.3);
        break;
      case 1:
        this.x += Math.sin(this.moveTimer * 2) * 2;
        this.y += Math.cos(this.moveTimer * 1.3) * 1.5;
        break;
      case 2:
        const angleToPlayer = angleBetween(this.x, this.y, playerX, playerY);
        this.x += Math.cos(angleToPlayer) * this.speed;
        this.y += Math.sin(angleToPlayer) * this.speed;
        break;
    }

    this.x = Math.max(this.radius, Math.min(canvasWidth - this.radius, this.x));
    this.y = Math.max(50, Math.min(canvasHeight * 0.4, this.y));
  }

  canAttack(): boolean {
    return this.attackTimer >= this.attackCooldown && this.y > 50;
  }

  attack(playerX: number, playerY: number): Projectile[] {
    this.attackTimer = 0;
    this.movePattern++;
    const projectiles: Projectile[] = [];

    if (this.frameCount % 3 === 0) {
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 / 8) * i;
        projectiles.push(
          new Projectile(
            this.x,
            this.y,
            5,
            '#ff0044',
            { x: Math.cos(angle) * 4, y: Math.sin(angle) * 4 },
            true
          )
        );
      }
    } else {
      const angle = angleBetween(this.x, this.y, playerX, playerY);
      for (let i = -1; i <= 1; i++) {
        projectiles.push(
          new Projectile(
            this.x,
            this.y,
            5,
            '#ff0044',
            { x: Math.cos(angle + i * 0.3) * 5, y: Math.sin(angle + i * 0.3) * 5 },
            true
          )
        );
      }
    }

    return projectiles;
  }

  takeDamage(amount: number): boolean {
    this.hp -= amount;
    return this.hp <= 0;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    ctx.shadowBlur = 40;
    ctx.shadowColor = '#ff0044';

    const pulse = 0.8 + 0.2 * Math.sin(this.frameCount * 0.05);

    ctx.strokeStyle = '#ff0044';
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.arc(0, 0, this.radius * pulse, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 0.5 * pulse, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < 4; i++) {
      const a = (Math.PI * 2 / 4) * i + this.frameCount * 0.02;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * this.radius * 0.6, Math.sin(a) * this.radius * 0.6);
      ctx.lineTo(Math.cos(a) * this.radius * 1.2, Math.sin(a) * this.radius * 1.2);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.rotate(-this.angle);
    ctx.fillStyle = '#ff0044';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BOSS', 0, 0);

    ctx.restore();

    const barWidth = this.radius * 2;
    const barHeight = 6;
    const barX = this.x - barWidth / 2;
    const barY = this.y + this.radius + 15;
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.fillStyle = '#ff0044';
    ctx.fillRect(barX, barY, barWidth * (this.hp / this.maxHp), barHeight);
    ctx.strokeStyle = '#ff0044';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
  }

  isOffScreen(): boolean {
    return false;
  }

  get radiusWithPulse(): number {
    return this.radius * 1.2;
  }
}

export function shouldSpawnBoss(level: number): boolean {
  return level % 5 === 0;
}
