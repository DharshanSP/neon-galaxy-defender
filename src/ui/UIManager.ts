import type { GameState, PowerUpType } from '../types';
import { POWER_UP_CONFIGS } from '../types';

export class UIManager {
  private elements: Record<string, HTMLElement | null> = {};
  private canvas: HTMLCanvasElement | null = null;
  soundToggle: HTMLElement | null = null;
  pauseBtn: HTMLElement | null = null;
  private pauseOverlay: HTMLElement | null = null;
  private powerUpDisplay: HTMLElement | null = null;
  private highScoreEl: HTMLElement | null = null;
  private canvasOverlay: HTMLElement | null = null;

  init(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.elements = {
      scoreEl: document.getElementById('scoreEl'),
      levelEl: document.getElementById('levelEl'),
      timeEl: document.getElementById('timeEl'),
      badgeContainer: document.getElementById('badge-container'),
      startBtn: document.getElementById('start-btn'),
      restartBtn: document.getElementById('restart-btn'),
      startScreen: document.getElementById('start-screen'),
      gameOverScreen: document.getElementById('game-over-screen'),
      finalScoreEl: document.getElementById('finalScoreEl'),
      finalLevelEl: document.getElementById('finalLevelEl'),
      finalBadgeContainer: document.getElementById('finalBadgeContainer'),
      deviceSelectionScreen: document.getElementById('device-selection-screen'),
      btnDesktop: document.getElementById('btn-desktop'),
      btnMobile: document.getElementById('btn-mobile'),
      topBar: document.getElementById('top-bar'),
      orientationWarning: document.getElementById('orientation-warning'),
      joystickMoveZone: document.getElementById('joystick-move'),
      joystickShootZone: document.getElementById('joystick-shoot'),
      healthBar: document.getElementById('health-bar'),
      healthBarFill: document.getElementById('health-bar-fill'),
      shieldBar: document.getElementById('shield-bar'),
      shieldBarFill: document.getElementById('shield-bar-fill'),
    };
  }

  createExtraUI(): void {
    const topBar = this.elements.topBar;
    if (!topBar) return;

    const rightSection = document.createElement('div');
    rightSection.style.display = 'flex';
    rightSection.style.alignItems = 'center';
    rightSection.style.gap = '15px';

    this.highScoreEl = document.createElement('div');
    this.highScoreEl.className = 'stat';
    this.highScoreEl.style.fontSize = '16px';
    this.highScoreEl.innerHTML = 'HI: <span id="highScoreSpan">0</span>';
    rightSection.appendChild(this.highScoreEl);

    this.soundToggle = document.createElement('button');
    this.soundToggle.id = 'sound-toggle';
    this.soundToggle.innerHTML = '🔊';
    this.soundToggle.style.cssText =
      'background:none;border:1px solid #00f3ff;color:#00f3ff;border-radius:50%;width:36px;height:36px;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;';
    rightSection.appendChild(this.soundToggle);

    this.pauseBtn = document.createElement('button');
    this.pauseBtn.id = 'pause-btn';
    this.pauseBtn.innerHTML = '⏸';
    this.pauseBtn.style.cssText =
      'background:none;border:1px solid #00f3ff;color:#00f3ff;border-radius:50%;width:36px;height:36px;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;';
    rightSection.appendChild(this.pauseBtn);

    topBar.appendChild(rightSection);

    this.canvasOverlay = document.createElement('div');
    this.canvasOverlay.id = 'canvas-overlay';
    this.canvasOverlay.style.cssText =
      'position:absolute;top:60px;left:20px;z-index:15;pointer-events:none;display:flex;flex-direction:column;gap:4px;';

    const healthContainer = document.createElement('div');
    healthContainer.style.cssText =
      'display:flex;align-items:center;gap:8px;';
    const healthLabel = document.createElement('span');
    healthLabel.style.cssText = 'color:#00ff66;font-size:12px;font-family:Orbitron,sans-serif;';
    healthLabel.textContent = 'HP';
    this.elements.healthBar = document.createElement('div');
    this.elements.healthBar.style.cssText =
      'width:120px;height:8px;background:rgba(255,255,255,0.1);border-radius:4px;overflow:hidden;border:1px solid #00ff66;';
    this.elements.healthBarFill = document.createElement('div');
    this.elements.healthBarFill.style.cssText = 'width:100%;height:100%;background:#00ff66;border-radius:3px;transition:width 0.2s;';
    this.elements.healthBar.appendChild(this.elements.healthBarFill);
    healthContainer.appendChild(healthLabel);
    healthContainer.appendChild(this.elements.healthBar);
    this.canvasOverlay.appendChild(healthContainer);

    const shieldContainer = document.createElement('div');
    shieldContainer.style.cssText =
      'display:flex;align-items:center;gap:8px;';
    const shieldLabel = document.createElement('span');
    shieldLabel.style.cssText = 'color:#00bfff;font-size:12px;font-family:Orbitron,sans-serif;';
    shieldLabel.textContent = 'SH';
    this.elements.shieldBar = document.createElement('div');
    this.elements.shieldBar.style.cssText =
      'width:120px;height:8px;background:rgba(255,255,255,0.1);border-radius:4px;overflow:hidden;border:1px solid #00bfff;';
    this.elements.shieldBarFill = document.createElement('div');
    this.elements.shieldBarFill.style.cssText = 'width:0%;height:100%;background:#00bfff;border-radius:3px;transition:width 0.2s;';
    this.elements.shieldBar.appendChild(this.elements.shieldBarFill);
    shieldContainer.appendChild(shieldLabel);
    shieldContainer.appendChild(this.elements.shieldBar);
    this.canvasOverlay.appendChild(shieldContainer);

    this.canvas!.parentElement?.appendChild(this.canvasOverlay);

    this.powerUpDisplay = document.createElement('div');
    this.powerUpDisplay.id = 'powerup-display';
    this.powerUpDisplay.style.cssText =
      'position:absolute;bottom:20px;left:50%;transform:translateX(-50%);z-index:15;pointer-events:none;display:flex;gap:10px;';
    this.canvas!.parentElement?.appendChild(this.powerUpDisplay);

    this.pauseOverlay = document.createElement('div');
    this.pauseOverlay.id = 'pause-overlay';
    this.pauseOverlay.style.cssText =
      'position:fixed;top:0;left:0;width:100%;height:100%;z-index:100;background:rgba(0,0,0,0.7);display:none;justify-content:center;align-items:center;';
    this.pauseOverlay.innerHTML = `
      <div class="glass-panel" style="pointer-events:auto;text-align:center;">
        <h1 class="neon-text" style="font-size:36px;margin-bottom:20px;">PAUSED</h1>
        <p style="margin-bottom:20px;">Press <kbd>ESC</kbd> or <kbd>P</kbd> to resume</p>
      </div>
    `;
    document.body.appendChild(this.pauseOverlay);
  }

  updateScore(score: number): void {
    if (this.elements.scoreEl) this.elements.scoreEl.textContent = score.toString();
  }

  updateLevel(level: number): void {
    if (this.elements.levelEl) this.elements.levelEl.textContent = level.toString();
  }

  updateTime(time: number): void {
    if (this.elements.timeEl) this.elements.timeEl.textContent = time.toString();
  }

  updateHighScore(score: number): void {
    const span = document.getElementById('highScoreSpan');
    if (span) span.textContent = score.toString();
  }

  updateHealth(health: number, maxHealth: number): void {
    if (this.elements.healthBarFill) {
      this.elements.healthBarFill.style.width = `${(health / maxHealth) * 100}%`;
      if (health > 50) {
        this.elements.healthBarFill.style.background = '#00ff66';
      } else if (health > 25) {
        this.elements.healthBarFill.style.background = '#ffaa00';
      } else {
        this.elements.healthBarFill.style.background = '#ff0044';
      }
    }
  }

  updateShield(shield: number): void {
    if (this.elements.shieldBarFill) {
      this.elements.shieldBarFill.style.width = `${Math.min(100, shield)}%`;
    }
    if (this.elements.shieldBar) {
      this.elements.shieldBar.style.display = shield > 0 ? 'block' : 'none';
    }
    const shieldContainer = this.elements.shieldBar?.parentElement;
    if (shieldContainer) {
      (shieldContainer as HTMLElement).style.display = shield > 0 ? 'flex' : 'none';
    }
  }

  updateBadge(hasBadge: boolean, badgeText: string): void {
    if (this.elements.badgeContainer) {
      if (hasBadge) {
        this.elements.badgeContainer.textContent = badgeText;
        this.elements.badgeContainer.classList.remove('hidden');
      } else {
        this.elements.badgeContainer.classList.add('hidden');
      }
    }
  }

  showGameOver(score: number, level: number, hasBadge: boolean, badgeText: string): void {
    if (this.elements.finalScoreEl) this.elements.finalScoreEl.textContent = score.toString();
    if (this.elements.finalLevelEl) this.elements.finalLevelEl.textContent = level.toString();
    if (this.elements.finalBadgeContainer) {
      if (hasBadge) {
        this.elements.finalBadgeContainer.textContent = badgeText + ' EARNED!';
        this.elements.finalBadgeContainer.classList.remove('hidden');
      } else {
        this.elements.finalBadgeContainer.classList.add('hidden');
      }
    }
    if (this.elements.gameOverScreen) {
      this.elements.gameOverScreen.classList.remove('hidden');
      this.elements.gameOverScreen.style.display = 'block';
    }
  }

  hideGameOver(): void {
    if (this.elements.gameOverScreen) {
      this.elements.gameOverScreen.classList.add('hidden');
      this.elements.gameOverScreen.style.display = 'none';
    }
  }

  showStartScreen(): void {
    if (this.elements.startScreen) {
      this.elements.startScreen.classList.remove('hidden');
      this.elements.startScreen.style.display = 'block';
    }
  }

  hideStartScreen(): void {
    if (this.elements.startScreen) {
      this.elements.startScreen.classList.add('hidden');
      this.elements.startScreen.style.display = 'none';
    }
  }

  hideDeviceSelection(): void {
    if (this.elements.deviceSelectionScreen) {
      this.elements.deviceSelectionScreen.style.display = 'none';
      this.elements.deviceSelectionScreen.classList.add('hidden');
    }
  }

  showTopBar(): void {
    if (this.elements.topBar) {
      this.elements.topBar.style.display = 'flex';
      this.elements.topBar.classList.remove('hidden');
    }
  }

  setSoundIcon(enabled: boolean): void {
    if (this.soundToggle) {
      this.soundToggle.innerHTML = enabled ? '🔊' : '🔇';
    }
  }

  showPauseOverlay(show: boolean): void {
    if (this.pauseOverlay) {
      this.pauseOverlay.style.display = show ? 'flex' : 'none';
    }
    if (this.pauseBtn) {
      this.pauseBtn.innerHTML = show ? '▶' : '⏸';
    }
  }

  updatePowerUps(activePowerUps: Partial<Record<PowerUpType, number>>): void {
    if (!this.powerUpDisplay) return;
    this.powerUpDisplay.innerHTML = '';
    for (const [type, endFrame] of Object.entries(activePowerUps)) {
      if (!endFrame) continue;
      const remaining = Math.ceil((endFrame - performance.now()) / 1000);
      if (remaining <= 0) continue;
      const el = document.createElement('div');
      el.style.cssText = `background:rgba(0,0,0,0.6);border:1px solid ${POWER_UP_CONFIGS[type as PowerUpType]?.color || '#fff'};border-radius:8px;padding:4px 10px;font-size:14px;color:#fff;display:flex;align-items:center;gap:5px;`;
      el.innerHTML = `${POWER_UP_CONFIGS[type as PowerUpType]?.icon || ''} ${remaining}s`;
      this.powerUpDisplay.appendChild(el);
    }
  }

  showCanvasOverlay(show: boolean): void {
    if (this.canvasOverlay) {
      this.canvasOverlay.style.display = show ? 'flex' : 'none';
    }
  }

  showOrientationWarning(show: boolean, isTouchDevice: boolean): void {
    if (!this.elements.orientationWarning) return;
    if (isTouchDevice && show) {
      this.elements.orientationWarning.style.display = 'flex';
    } else {
      this.elements.orientationWarning.style.display = 'none';
    }
  }

  getElement(id: string): HTMLElement | null {
    return this.elements[id] || document.getElementById(id);
  }

  get isTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }
}
