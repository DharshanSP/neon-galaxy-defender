import { type PowerUpType, POWER_UP_CONFIGS } from '../types';
import { randomRange } from '../utils/math';

const POWER_UP_TYPES: PowerUpType[] = ['shield', 'rapidfire', 'spread', 'speed', 'health', 'magnet'];

export class PowerUp {
  x: number;
  y: number;
  radius = 12;
  type: PowerUpType;
  color: string;
  icon: string;
  duration: number;
  lifetime: number;
  private bobPhase: number;

  constructor(x: number, y: number, type?: PowerUpType) {
    this.x = x;
    this.y = y;
    this.type = type ?? POWER_UP_TYPES[Math.floor(Math.random() * POWER_UP_TYPES.length)];
    const config = POWER_UP_CONFIGS[this.type];
    this.color = config.color;
    this.icon = config.icon;
    this.duration = config.duration;
    this.bobPhase = Math.random() * Math.PI * 2;
    this.lifetime = 600;
  }

  update(): void {
    this.bobPhase += 0.03;
    this.y += Math.sin(this.bobPhase) * 0.3;
    this.lifetime--;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const pulse = 0.8 + 0.2 * Math.sin(this.bobPhase * 2);
    const r = this.radius * pulse;

    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = this.color;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = `rgba(0,0,0,0.7)`;
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText(this.icon, this.x, this.y);

    ctx.restore();
  }

  isExpired(): boolean {
    return this.lifetime <= 0;
  }
}

export function maybeSpawnPowerUp(x: number, y: number, chance = 0.12): PowerUp | null {
  if (Math.random() < chance) {
    return new PowerUp(x, y);
  }
  return null;
}
