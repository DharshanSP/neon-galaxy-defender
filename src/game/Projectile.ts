import type { Vector2 } from '../types';

let projIdCounter = 0;

export class Projectile {
  id: number;
  x: number;
  y: number;
  radius: number;
  color: string;
  velocity: Vector2;
  isEnemy: boolean;

  constructor(x: number, y: number, radius: number, color: string, velocity: Vector2, isEnemy = false) {
    this.id = projIdCounter++;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
    this.isEnemy = isEnemy;
  }

  update(): void {
    this.x += this.velocity.x;
    this.y += this.velocity.y;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = this.color;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 5;
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(this.x - this.velocity.x * 0.2, this.y - this.velocity.y * 0.2, this.radius * 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  isOffScreen(canvasWidth: number, canvasHeight: number): boolean {
    return (
      this.x + this.radius < 0 ||
      this.x - this.radius > canvasWidth ||
      this.y + this.radius < 0 ||
      this.y - this.radius > canvasHeight
    );
  }
}
