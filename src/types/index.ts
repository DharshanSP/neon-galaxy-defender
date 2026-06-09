export interface Vector2 {
  x: number;
  y: number;
}

export type EnemyType = 'chaser' | 'zigzag' | 'tank' | 'shooter' | 'bomber';

export type PowerUpType = 'shield' | 'rapidfire' | 'spread' | 'speed' | 'health' | 'magnet';

export interface PowerUpConfig {
  type: PowerUpType;
  color: string;
  duration: number;
  icon: string;
}

export const POWER_UP_CONFIGS: Record<PowerUpType, PowerUpConfig> = {
  shield: { type: 'shield', color: '#00bfff', duration: 8000, icon: '🛡' },
  rapidfire: { type: 'rapidfire', color: '#ff4500', duration: 6000, icon: '🔥' },
  spread: { type: 'spread', color: '#ff00ff', duration: 6000, icon: '✸' },
  speed: { type: 'speed', color: '#00ff88', duration: 5000, icon: '⚡' },
  health: { type: 'health', color: '#00ff00', duration: 0, icon: '❤' },
  magnet: { type: 'magnet', color: '#ffd700', duration: 7000, icon: '🧲' },
};

export interface PlayerState {
  x: number;
  y: number;
  radius: number;
  speed: number;
  health: number;
  maxHealth: number;
  shield: number;
  fireRate: number;
  bulletSpeed: number;
  damage: number;
  spreadCount: number;
  activePowerUps: Partial<Record<PowerUpType, number>>;
  invincibleUntil: number;
}

export interface EnemyConfig {
  type: EnemyType;
  radius: number;
  color: string;
  hp: number;
  speed: number;
  score: number;
  damage: number;
}

export interface GameState {
  score: number;
  highScore: number;
  level: number;
  timeRemaining: number;
  gameActive: boolean;
  paused: boolean;
  isTouchDevice: boolean;
  soundEnabled: boolean;
  hasBadge: boolean;
  badge: string;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  brightness: number;
  twinkleSpeed: number;
  twinklePhase: number;
}

export interface ScreenShake {
  intensity: number;
  duration: number;
  elapsed: number;
}
