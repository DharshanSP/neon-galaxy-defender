import type { Star } from '../types';
import { randomRange } from '../utils/math';

export class Starfield {
  private stars: Star[] = [];
  private canvasWidth = 0;
  private canvasHeight = 0;

  init(canvas: HTMLCanvasElement): void {
    this.canvasWidth = canvas.width;
    this.canvasHeight = canvas.height;
    this.generateStars(200);
  }

  resize(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.generateStars(200);
  }

  private generateStars(count: number): void {
    this.stars = [];
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: randomRange(0, this.canvasWidth),
        y: randomRange(0, this.canvasHeight),
        size: randomRange(0.5, 2.5),
        speed: randomRange(0.2, 1.5),
        brightness: randomRange(0.3, 1),
        twinkleSpeed: randomRange(0.01, 0.05),
        twinklePhase: randomRange(0, Math.PI * 2),
      });
    }
  }

  update(deltaTime: number, playerVelX: number, playerVelY: number): void {
    for (const star of this.stars) {
      star.y += star.speed * (1 + playerVelY * 0.02);
      star.x += star.speed * 0.3 * (1 + playerVelX * 0.02);
      star.twinklePhase += star.twinkleSpeed * deltaTime;

      if (star.y > this.canvasHeight) {
        star.y = 0;
        star.x = randomRange(0, this.canvasWidth);
      }
      if (star.x > this.canvasWidth) star.x = 0;
      if (star.x < 0) star.x = this.canvasWidth;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const star of this.stars) {
      const alpha = star.brightness * (0.7 + 0.3 * Math.sin(star.twinklePhase));
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
