import type { Vector2 } from '../types';

export class InputSystem {
  keys: Record<string, boolean> = {};
  mouse: { x: number; y: number; isDown: boolean } = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    isDown: false,
  };
  isTouchDevice = false;
  joystickMove: Vector2 = { x: 0, y: 0 };
  joystickShoot: { active: boolean; angle: number } = { active: false, angle: 0 };

  private moveManager: any = null;
  private shootManager: any = null;

  constructor() {
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
  }

  init(canvas: HTMLCanvasElement): void {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  destroy(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
    this.destroyJoysticks();
  }

  private onKeyDown(e: KeyboardEvent): void {
    this.keys[e.key] = true;
    this.keys[e.key.toLowerCase()] = true;
  }

  private onKeyUp(e: KeyboardEvent): void {
    this.keys[e.key] = false;
    this.keys[e.key.toLowerCase()] = false;
  }

  private onMouseMove(e: MouseEvent): void {
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
  }

  private onMouseDown(): void {
    this.mouse.isDown = true;
  }

  private onMouseUp(): void {
    this.mouse.isDown = false;
  }

  isKeyDown(...keyList: string[]): boolean {
    return keyList.some((k) => this.keys[k]);
  }

  get movementVector(): Vector2 {
    if (this.isTouchDevice) {
      return { ...this.joystickMove };
    }

    let dx = 0;
    let dy = 0;
    if (this.isKeyDown('w', 'W', 'ArrowUp')) dy -= 1;
    if (this.isKeyDown('s', 'S', 'ArrowDown')) dy += 1;
    if (this.isKeyDown('a', 'A', 'ArrowLeft')) dx -= 1;
    if (this.isKeyDown('d', 'D', 'ArrowRight')) dx += 1;

    if (dx !== 0 && dy !== 0) {
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;
    }

    return { x: dx, y: dy };
  }

  get isShooting(): boolean {
    if (this.isTouchDevice) return this.joystickShoot.active;
    return this.mouse.isDown;
  }

  get aimAngle(): number {
    if (this.isTouchDevice && this.joystickShoot.active) {
      return this.joystickShoot.angle;
    }
    return Math.atan2(this.mouse.y - window.innerHeight / 2, this.mouse.x - window.innerWidth / 2);
  }

  initJoysticks(moveZone: HTMLElement, shootZone: HTMLElement): void {
    if (typeof (window as any).nipplejs === 'undefined') {
      console.warn('nipplejs not loaded');
      return;
    }

    const nipplejs = (window as any).nipplejs;

    this.moveManager = nipplejs.create({
      zone: moveZone,
      mode: 'static',
      position: { left: '50%', top: '50%' },
      color: '#00f3ff',
      size: 120,
    });

    this.shootManager = nipplejs.create({
      zone: shootZone,
      mode: 'static',
      position: { left: '50%', top: '50%' },
      color: '#ff00ea',
      size: 120,
    });

    this.moveManager.on('move', (_evt: any, data: any) => {
      const rawForce = Math.min(data.force, 1);
      const force = Math.pow(rawForce, 3) * 0.3;
      this.joystickMove.x = Math.cos(data.angle.radian) * force;
      this.joystickMove.y = -Math.sin(data.angle.radian) * force;
    });

    this.moveManager.on('end', () => {
      this.joystickMove = { x: 0, y: 0 };
    });

    this.shootManager.on('move', (_evt: any, data: any) => {
      this.joystickShoot.active = true;
      this.joystickShoot.angle = -data.angle.radian;
    });

    this.shootManager.on('end', () => {
      this.joystickShoot.active = false;
    });
  }

  destroyJoysticks(): void {
    if (this.moveManager) {
      this.moveManager.destroy();
      this.moveManager = null;
    }
    if (this.shootManager) {
      this.shootManager.destroy();
      this.shootManager = null;
    }
  }
}
