import { type Vector2 } from '../types';

interface Particle {
  x: number;
  y: number;
  radius: number;
  color: string;
  velocity: Vector2;
  alpha: number;
  fadeSpeed: number;
  friction: number;
  shrink: boolean;
}

export class ParticleSystem {
  private particles: Particle[] = [];

  emit(
    x: number,
    y: number,
    count: number,
    color: string,
    options?: {
      speed?: number;
      radius?: [number, number];
      fadeSpeed?: number;
      shrink?: boolean;
    }
  ): void {
    const speed = options?.speed ?? 5;
    const radiusRange = options?.radius ?? [1, 4];
    const fadeSpeed = options?.fadeSpeed ?? 0.02;
    const shrink = options?.shrink ?? false;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const force = Math.random() * speed;
      this.particles.push({
        x,
        y,
        radius: Math.random() * (radiusRange[1] - radiusRange[0]) + radiusRange[0],
        color,
        velocity: {
          x: Math.cos(angle) * force,
          y: Math.sin(angle) * force,
        },
        alpha: 1,
        fadeSpeed: fadeSpeed * (0.5 + Math.random() * 0.5),
        friction: 0.97 + Math.random() * 0.02,
        shrink,
      });
    }
  }

  update(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.velocity.x *= p.friction;
      p.velocity.y *= p.friction;
      p.x += p.velocity.x;
      p.y += p.velocity.y;
      p.alpha -= p.fadeSpeed;
      if (p.shrink) p.radius *= 0.98;

      if (p.alpha <= 0 || p.radius < 0.1) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.shadowBlur = p.radius * 4;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.1, p.radius), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  clear(): void {
    this.particles = [];
  }

  get count(): number {
    return this.particles.length;
  }
}
