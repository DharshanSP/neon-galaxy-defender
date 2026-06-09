import type { ScreenShake as ScreenShakeState } from '../types';

export class ScreenShakeManager {
  private state: ScreenShakeState = { intensity: 0, duration: 0, elapsed: 0 };
  offsetX = 0;
  offsetY = 0;

  shake(intensity: number, duration: number): void {
    this.state.intensity = intensity;
    this.state.duration = duration;
    this.state.elapsed = 0;
  }

  update(deltaTime: number): void {
    if (this.state.elapsed < this.state.duration) {
      this.state.elapsed += deltaTime;
      const progress = this.state.elapsed / this.state.duration;
      const decay = 1 - progress;
      const currentIntensity = this.state.intensity * decay;
      this.offsetX = (Math.random() - 0.5) * 2 * currentIntensity;
      this.offsetY = (Math.random() - 0.5) * 2 * currentIntensity;
    } else {
      this.offsetX = 0;
      this.offsetY = 0;
    }
  }

  apply(ctx: CanvasRenderingContext2D): void {
    if (this.offsetX !== 0 || this.offsetY !== 0) {
      ctx.translate(this.offsetX, this.offsetY);
    }
  }
}
