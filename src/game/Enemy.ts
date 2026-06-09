import { type Vector2, type EnemyType } from '../types';
import { randomRange } from '../utils/math';

const ENEMY_COLORS: Record<string, string> = {
  chaser: '#ff0055',
  zigzag: '#ff9900',
  tank: '#bf00ff',
  shooter: '#00ff66',
  bomber: '#ff4444',
};

let enemyIdCounter = 0;

export class Enemy {
  id: number;
  x: number;
  y: number;
  radius: number;
  color: string;
  type: EnemyType;
  hp: number;
  maxHp: number;
  speed: number;
  score: number;
  damage: number;
  velocity: Vector2;
  shape: number;
  angle = 0;
  rotationSpeed: number;
  zigzagTimer = 0;
  zigzagFreq: number;
  shootTimer = 0;
  shootInterval: number;

  constructor(x: number, y: number, level: number, type?: EnemyType) {
    this.id = enemyIdCounter++;
    this.x = x;
    this.y = y;
    this.type = type ?? this.randomType();
    this.color = ENEMY_COLORS[this.type] || '#ff0055';
    this.rotationSpeed = (Math.random() - 0.5) * 0.1;
    this.shape = Math.floor(Math.random() * 3);
    this.zigzagFreq = randomRange(0.03, 0.08);
    this.shootInterval = 60;

    switch (this.type) {
      case 'chaser':
        this.radius = randomRange(12, 22);
        this.hp = 1;
        this.speed = 1.8 + level * 0.3;
        this.score = 10;
        this.damage = 6;
        break;
      case 'zigzag':
        this.radius = randomRange(10, 18);
        this.hp = 1;
        this.speed = 2.5 + level * 0.25;
        this.score = 15;
        this.damage = 5;
        break;
      case 'tank':
        this.radius = randomRange(25, 40);
        this.hp = 3 + Math.floor(level / 3);
        this.speed = 0.8 + level * 0.15;
        this.score = 30;
        this.damage = 8;
        break;
      case 'shooter':
        this.radius = randomRange(14, 20);
        this.hp = 2;
        this.speed = 1 + level * 0.2;
        this.score = 25;
        this.damage = 5;
        this.shootInterval = Math.max(30, 60 - level * 2);
        break;
      case 'bomber':
        this.radius = randomRange(16, 24);
        this.hp = 1;
        this.speed = 1.5 + level * 0.2;
        this.score = 20;
        this.damage = 12;
        break;
    }

    this.maxHp = this.hp;
    const angle = Math.atan2(
      innerHeight / 2 - y,
      innerWidth / 2 - x
    );
    this.velocity = {
      x: Math.cos(angle) * this.speed,
      y: Math.sin(angle) * this.speed,
    };
  }

  private randomType(): EnemyType {
    const types: EnemyType[] = ['chaser', 'chaser', 'zigzag', 'tank', 'shooter', 'bomber'];
    return types[Math.floor(Math.random() * types.length)];
  }

  update(playerX: number, playerY: number): void {
    this.angle += this.rotationSpeed;

    switch (this.type) {
      case 'chaser': {
        const angle = Math.atan2(playerY - this.y, playerX - this.x);
        this.velocity.x += Math.cos(angle) * 0.08;
        this.velocity.y += Math.sin(angle) * 0.08;
        const speed = Math.hypot(this.velocity.x, this.velocity.y);
        if (speed > this.speed) {
          this.velocity.x = (this.velocity.x / speed) * this.speed;
          this.velocity.y = (this.velocity.y / speed) * this.speed;
        }
        break;
      }
      case 'zigzag': {
        this.zigzagTimer += this.zigzagFreq;
        const perpAngle = Math.atan2(playerY - this.y, playerX - this.x) + Math.PI / 2;
        this.velocity.x += Math.cos(perpAngle) * Math.sin(this.zigzagTimer) * 0.15;
        this.velocity.y += Math.sin(perpAngle) * Math.sin(this.zigzagTimer) * 0.15;
        const towardAngle = Math.atan2(playerY - this.y, playerX - this.x);
        this.velocity.x += Math.cos(towardAngle) * 0.04;
        this.velocity.y += Math.sin(towardAngle) * 0.04;
        const spd = Math.hypot(this.velocity.x, this.velocity.y);
        if (spd > this.speed * 1.5) {
          this.velocity.x = (this.velocity.x / spd) * this.speed * 1.5;
          this.velocity.y = (this.velocity.y / spd) * this.speed * 1.5;
        }
        break;
      }
      case 'tank': {
        const a = Math.atan2(playerY - this.y, playerX - this.x);
        this.velocity.x += Math.cos(a) * 0.03;
        this.velocity.y += Math.sin(a) * 0.03;
        const spd = Math.hypot(this.velocity.x, this.velocity.y);
        if (spd > this.speed) {
          this.velocity.x = (this.velocity.x / spd) * this.speed;
          this.velocity.y = (this.velocity.y / spd) * this.speed;
        }
        break;
      }
      case 'shooter': {
        const a = Math.atan2(playerY - this.y, playerX - this.x);
        this.velocity.x += Math.cos(a) * 0.03;
        this.velocity.y += Math.sin(a) * 0.03;
        const spd = Math.hypot(this.velocity.x, this.velocity.y);
        if (spd > this.speed) {
          this.velocity.x = (this.velocity.x / spd) * this.speed;
          this.velocity.y = (this.velocity.y / spd) * this.speed;
        }
        this.shootTimer++;
        break;
      }
      case 'bomber': {
        const a = Math.atan2(playerY - this.y, playerX - this.x);
        this.velocity.x += Math.cos(a) * 0.1;
        this.velocity.y += Math.sin(a) * 0.1;
        const spd = Math.hypot(this.velocity.x, this.velocity.y);
        if (spd > this.speed * 1.8) {
          this.velocity.x = (this.velocity.x / spd) * this.speed * 1.8;
          this.velocity.y = (this.velocity.y / spd) * this.speed * 1.8;
        }
        break;
      }
    }

    this.x += this.velocity.x;
    this.y += this.velocity.y;
  }

  draw(ctx: CanvasRenderingContext2D, frameCount: number): void {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    ctx.beginPath();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 15;
    ctx.shadowColor = this.color;

    let hpRatio = this.hp / this.maxHp;
    if (this.type === 'bomber') {
      const pulse = 0.5 + 0.5 * Math.sin(frameCount * 0.1);
      ctx.fillStyle = `rgba(255, 68, 68, ${pulse * 0.3})`;
      ctx.shadowBlur = 20 + pulse * 10;
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
    }

    if (this.shape === 0) {
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2, false);
    } else if (this.shape === 1) {
      ctx.rect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);
    } else {
      ctx.moveTo(0, -this.radius);
      ctx.lineTo(this.radius, this.radius);
      ctx.lineTo(-this.radius, this.radius);
      ctx.closePath();
    }

    ctx.fill();
    ctx.stroke();

    if (this.type === 'tank' && hpRatio < 1) {
      ctx.fillStyle = '#ff0055';
      ctx.fillRect(-this.radius, -this.radius - 8, this.radius * 2 * hpRatio, 4);
    }

    if (this.type === 'shooter') {
      const aimAngle = Math.atan2(innerHeight / 2 - this.y, innerWidth / 2 - this.x);
      ctx.rotate(-this.angle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(aimAngle) * (this.radius + 8), Math.sin(aimAngle) * (this.radius + 8));
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.restore();
  }

  canShoot(): boolean {
    return this.type === 'shooter' && this.shootTimer >= this.shootInterval;
  }

  resetShootTimer(): void {
    this.shootTimer = 0;
  }

  takeDamage(amount: number): boolean {
    this.hp -= amount;
    return this.hp <= 0;
  }
}

export function spawnEnemyAtEdge(canvasWidth: number, canvasHeight: number, level: number, type?: EnemyType): Enemy {
  const radius = 20;
  let x: number, y: number;

  if (Math.random() < 0.5) {
    x = Math.random() < 0.5 ? -radius : canvasWidth + radius;
    y = Math.random() * canvasHeight;
  } else {
    x = Math.random() * canvasWidth;
    y = Math.random() < 0.5 ? -radius : canvasHeight + radius;
  }

  return new Enemy(x, y, level, type);
}
