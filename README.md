# Neon Galaxy Defender v2 🚀

A browser-based space shooter built with Vite + TypeScript. Defend the galaxy from geometric threats, fight bosses, collect power-ups, and climb the leaderboard.

## How the Game Works

### Core Loop
Destroy enemies to grow your ship and earn points. Survive 30 seconds per level to advance. Each level increases enemy speed, spawn rate, and difficulty. Collide with enemies and you'll take damage and shrink — if your health drops to zero or your ship shrinks too much, it's game over.

### Enemy Types
| Type | Behavior |
|------|----------|
| **Chaser** | Tracks you relentlessly, accelerates over time |
| **Zigzag** | Moves in unpredictable patterns, hard to hit |
| **Tank** | Slow but has high HP and deals heavy damage |
| **Shooter** | Keeps distance and fires projectiles at you |
| **Bomber** | Charges straight at you with a large blast radius |

### Boss Fights
Every 5th level triggers a boss encounter. Bosses have unique attack patterns (spread shots, aimed bursts) and a visible HP bar. Defeating a boss rewards bonus score + multiple power-ups.

### Power-Ups
| Power-Up | Effect | Duration |
|----------|--------|----------|
| 🛡 **Shield** | Absorbs damage | 8s |
| 🔥 **Rapid Fire** | Faster shooting | 6s |
| ✸ **Spread Shot** | 5-way projectiles | 6s |
| ⚡ **Speed Boost** | Increased movement | 5s |
| ❤ **Health** | Instant heal | Instant |
| 🧲 **Magnet** | (bonus attraction) | 7s |

### Badges
Reach milestone levels to earn badges displayed during gameplay and on game over:
- Level 3: 🥉 Bronze
- Level 5: 🥈 Silver
- Level 10: 🥇 Golden
- Level 15: 💎 Diamond
- Level 20: 👑 Legendary

## Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Open the URL shown in your terminal (default `http://localhost:5173`).

## Controls

### Desktop
| Action | Input |
|--------|-------|
| Move | `W` `A` `S` `D` or Arrow Keys |
| Aim & Shoot | Mouse + Left Click |
| Pause | `ESC` or `P` |
| Sound Toggle | Click 🔊 button (top-right) |

### Mobile / Tablet
- **Left joystick** — Move
- **Right joystick** — Aim & Shoot (drag direction)
- Rotate to landscape when prompted

## Project Structure

```
src/
├── main.ts              # Entry point
├── game/
│   ├── Game.ts          # Core game loop & orchestration
│   ├── Player.ts        # Player entity, power-ups, damage
│   ├── Enemy.ts         # 5 enemy types with unique AI
│   ├── Boss.ts          # Boss fights (every 5th level)
│   ├── Projectile.ts    # Player & enemy projectiles
│   └── PowerUp.ts       # 6 power-up types
├── systems/
│   ├── InputSystem.ts   # Keyboard + mouse + joystick
│   ├── AudioSystem.ts   # Web Audio API synthesized SFX
│   ├── Starfield.ts     # Parallax star field background
│   ├── ParticleSystem.ts# Particle effects
│   ├── ScreenShake.ts   # Camera shake on impacts
│   └── CollisionSystem.ts# Circle collision detection
├── ui/
│   └── UIManager.ts     # All UI screens & HUD elements
├── types/
│   └── index.ts         # Shared type definitions
└── utils/
    ├── math.ts           # Math helpers
    └── storage.ts        # localStorage high score persistence
```

## Tech Stack

- **Vite** — Development server & bundler
- **TypeScript** — Full type safety
- **Canvas API** — 2D rendering at 60fps
- **Web Audio API** — Synthesized sound effects (no audio files)
- **nipplejs** — Virtual joystick for mobile
