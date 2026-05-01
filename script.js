const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('scoreEl');
const levelEl = document.getElementById('levelEl');
const timeEl = document.getElementById('timeEl');
const badgeContainer = document.getElementById('badge-container');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreEl = document.getElementById('finalScoreEl');
const finalLevelEl = document.getElementById('finalLevelEl');
const finalBadgeContainer = document.getElementById('finalBadgeContainer');
const deviceSelectionScreen = document.getElementById('device-selection-screen');
const btnDesktop = document.getElementById('btn-desktop');
const btnMobile = document.getElementById('btn-mobile');
const topBar = document.getElementById('top-bar');
const orientationWarning = document.getElementById('orientation-warning');
const joystickMoveZone = document.getElementById('joystick-move');
const joystickShootZone = document.getElementById('joystick-shoot');

let level = 1;
let timeRemaining = 30;
let hasBadge = false;
let timerInterval;

// Set canvas dimensions
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Handle resize
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (typeof checkOrientation === 'function') checkOrientation();
});

// Game State
let animationId;
let score = 0;
let gameActive = false;
let frameCount = 0;

// Input State
const keys = {
    w: false, a: false, s: false, d: false,
    ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false
};
const mouse = { x: canvas.width / 2, y: canvas.height / 2, isDown: false };

window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
    if (keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key.toLowerCase()] = true;
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
    if (keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key.toLowerCase()] = false;
});

window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

window.addEventListener('mousedown', () => mouse.isDown = true);
window.addEventListener('mouseup', () => mouse.isDown = false);

let isTouchDevice = false;
let moveJoystickManager = null;
let shootJoystickManager = null;
let joystickMoveVector = { x: 0, y: 0 };
let joystickShootData = { active: false, angle: 0 };

function checkOrientation() {
    if (isTouchDevice) {
        if (window.innerHeight > window.innerWidth) {
            orientationWarning.style.display = 'flex';
        } else {
            orientationWarning.style.display = 'none';
        }
    }
}

btnDesktop.addEventListener('click', () => {
    isTouchDevice = false;
    deviceSelectionScreen.style.display = 'none';
    deviceSelectionScreen.classList.add('hidden');
    startScreen.style.display = 'block';
    startScreen.classList.remove('hidden');
    topBar.style.display = 'flex';
    topBar.classList.remove('hidden');
});

btnMobile.addEventListener('click', () => {
    isTouchDevice = true;
    deviceSelectionScreen.style.display = 'none';
    deviceSelectionScreen.classList.add('hidden');
    startScreen.style.display = 'block';
    startScreen.classList.remove('hidden');
    topBar.style.display = 'flex';
    topBar.classList.remove('hidden');
    checkOrientation();
    
    joystickMoveZone.style.display = 'block';
    joystickMoveZone.classList.remove('hidden');
    joystickShootZone.style.display = 'block';
    joystickShootZone.classList.remove('hidden');
    
    moveJoystickManager = nipplejs.create({
        zone: joystickMoveZone,
        mode: 'static',
        position: { left: '50%', top: '50%' },
        color: '#00f3ff',
        size: 120
    });
    
    shootJoystickManager = nipplejs.create({
        zone: joystickShootZone,
        mode: 'static',
        position: { left: '50%', top: '50%' },
        color: '#ff00ea',
        size: 120
    });
    
    moveJoystickManager.on('move', (evt, data) => {
        const rawForce = Math.min(data.force, 1);
        const force = Math.pow(rawForce, 2) * 0.8;
        joystickMoveVector.x = Math.cos(data.angle.radian) * force;
        joystickMoveVector.y = -Math.sin(data.angle.radian) * force;
    });
    
    moveJoystickManager.on('end', () => {
        joystickMoveVector = { x: 0, y: 0 };
    });

    shootJoystickManager.on('move', (evt, data) => {
        joystickShootData.active = true;
        joystickShootData.angle = -data.angle.radian;
    });
    
    shootJoystickManager.on('end', () => {
        joystickShootData.active = false;
    });
});

// Utility functions
const randomRange = (min, max) => Math.random() * (max - min) + min;
const distance = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);

// Colors
const colors = {
    player: '#00f3ff',
    playerTrail: 'rgba(0, 243, 255, 0.3)',
    bullet: '#ff00ea',
    enemy: ['#ff0055', '#ff9900', '#00ff66', '#bf00ff'],
    particle: '#ffffff'
};

// Classes
class Player {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.speed = 5;
        this.velocity = { x: 0, y: 0 };
        this.friction = 0.92;
        this.lastShot = 0;
        this.fireRate = 10; // frames between shots
    }

    draw() {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.closePath();
        
        // Draw aim indicator
        const angle = Math.atan2(mouse.y - this.y, mouse.x - this.x);
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + Math.cos(angle) * (this.radius + 10), this.y + Math.sin(angle) * (this.radius + 10));
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.closePath();
        
        ctx.restore();
    }

    shoot(angle) {
        const velocity = {
            x: Math.cos(angle) * 15,
            y: Math.sin(angle) * 15
        };
        projectiles.push(new Projectile(this.x, this.y, 4, colors.bullet, velocity));
        this.lastShot = frameCount;
        
        // Recoil
        this.velocity.x -= Math.cos(angle) * 2;
        this.velocity.y -= Math.sin(angle) * 2;
    }

    update() {
        // Movement logic
        let dx = 0;
        let dy = 0;

        if (isTouchDevice) {
            // Use raw joystick vector. Do not normalize, so sensitivity curve works.
            dx = joystickMoveVector.x;
            dy = joystickMoveVector.y;
        } else {
            if (keys.w || keys.ArrowUp) dy -= 1;
            if (keys.s || keys.ArrowDown) dy += 1;
            if (keys.a || keys.ArrowLeft) dx -= 1;
            if (keys.d || keys.ArrowRight) dx += 1;

            // Normalize diagonal movement for keyboard
            if (dx !== 0 && dy !== 0) {
                const length = Math.sqrt(dx * dx + dy * dy);
                dx /= length;
                dy /= length;
            }
        }

        const acceleration = 1.5 + (level * 0.3); // Speed increases with level
        this.velocity.x += dx * acceleration;
        this.velocity.y += dy * acceleration;

        // Apply friction
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;

        this.x += this.velocity.x;
        this.y += this.velocity.y;

        // Boundary constraints
        if (this.x - this.radius < 0) this.x = this.radius;
        if (this.x + this.radius > canvas.width) this.x = canvas.width - this.radius;
        if (this.y - this.radius < 0) this.y = this.radius;
        if (this.y + this.radius > canvas.height) this.y = canvas.height - this.radius;

        // Shooting logic
        if (frameCount - this.lastShot > this.fireRate) {
            if (!isTouchDevice && mouse.isDown) {
                const angle = Math.atan2(mouse.y - this.y, mouse.x - this.x);
                this.shoot(angle);
            } else if (isTouchDevice && joystickShootData.active) {
                this.shoot(joystickShootData.angle);
            }
        }

        // Draw trail effect
        if (Math.abs(this.velocity.x) > 0.5 || Math.abs(this.velocity.y) > 0.5) {
             particles.push(new Particle(this.x, this.y, Math.random() * 3, colors.playerTrail, {
                 x: -this.velocity.x * 0.5 + (Math.random() - 0.5),
                 y: -this.velocity.y * 0.5 + (Math.random() - 0.5)
             }, 0.05));
        }

        this.draw();
    }
}

class Projectile {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }

    draw() {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.closePath();
        ctx.restore();
    }

    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.draw();
    }
}

class Enemy {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.shape = Math.floor(Math.random() * 3); // 0: circle, 1: square, 2: triangle
        this.angle = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 0.1;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        ctx.beginPath();
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        
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
        
        ctx.stroke();
        
        // Fill subtly
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fill();
        
        ctx.restore();
    }

    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.angle += this.rotationSpeed;
        
        // Track player slowly
        if (player) {
            const angle = Math.atan2(player.y - this.y, player.x - this.x);
            this.velocity.x += Math.cos(angle) * 0.05;
            this.velocity.y += Math.sin(angle) * 0.05;
            
            // Random spontaneous movement
            if (Math.random() < 0.02 + (level * 0.005)) {
                this.velocity.x += (Math.random() - 0.5) * level * 2;
                this.velocity.y += (Math.random() - 0.5) * level * 2;
            }
            
            // Limit speed
            const speed = Math.hypot(this.velocity.x, this.velocity.y);
            const maxSpeed = 4 + (level * 1.2); // Enemies get faster as level increases
            if (speed > maxSpeed) {
                this.velocity.x = (this.velocity.x / speed) * maxSpeed;
                this.velocity.y = (this.velocity.y / speed) * maxSpeed;
            }
        }
        
        this.draw();
    }
}

class Particle {
    constructor(x, y, radius, color, velocity, fadeSpeed = 0.02) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.alpha = 1;
        this.fadeSpeed = fadeSpeed;
        this.friction = 0.98;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }

    update() {
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= this.fadeSpeed;
        this.draw();
    }
}

// Entity Arrays
let player;
let projectiles = [];
let enemies = [];
let particles = [];
let enemySpawnRate = 100;

function init() {
    player = new Player(canvas.width / 2, canvas.height / 2, 15, colors.player);
    projectiles = [];
    enemies = [];
    particles = [];
    score = 0;
    scoreEl.innerHTML = score;
    level = 1;
    timeRemaining = 30;
    hasBadge = false;
    levelEl.innerHTML = level;
    timeEl.innerHTML = timeRemaining;
    badgeContainer.classList.add('hidden');
    frameCount = 0;
    enemySpawnRate = 100;

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (!gameActive) return;
        timeRemaining--;
        if (timeRemaining <= 0) {
            levelUp();
        }
        timeEl.innerHTML = timeRemaining;
    }, 1000);
}

function levelUp() {
    level++;
    levelEl.innerHTML = level;
    timeRemaining = 30; // reset timer for next level
    
    // Create level up visual effect
    if (player) {
        createExplosion(player.x, player.y, '#00ff66', 30);
    }
    
    const badges = {
        3: '🥉 BRONZE DEFENDER',
        5: '🥈 SILVER DEFENDER',
        10: '🥇 GOLDEN DEFENDER',
        15: '💎 DIAMOND DEFENDER'
    };
    
    if (badges[level]) {
        hasBadge = true;
        badgeContainer.innerHTML = badges[level];
        badgeContainer.classList.remove('hidden');
        finalBadgeContainer.innerHTML = badges[level] + " EARNED!";
        // create particle celebration
        createExplosion(canvas.width/2, canvas.height/2, '#ffd700', 100);
    }
}

function spawnEnemies() {
    if (frameCount % enemySpawnRate === 0) {
        const radius = randomRange(15, 30);
        let x, y;

        if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
            y = Math.random() * canvas.height;
        } else {
            x = Math.random() * canvas.width;
            y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
        }

        const color = colors.enemy[Math.floor(Math.random() * colors.enemy.length)];
        const angle = Math.atan2(canvas.height / 2 - y, canvas.width / 2 - x);
        const velocity = {
            x: Math.cos(angle) * 2,
            y: Math.sin(angle) * 2
        };

        enemies.push(new Enemy(x, y, radius, color, velocity));
        
        // Increase difficulty based on level (Drops faster now)
        enemySpawnRate = Math.max(8, 100 - (level * 25));
    }
}

function createExplosion(x, y, color, count = 20) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(
            x, y,
            Math.random() * 3,
            color,
            {
                x: (Math.random() - 0.5) * (Math.random() * 10),
                y: (Math.random() - 0.5) * (Math.random() * 10)
            }
        ));
    }
}

function animate() {
    animationId = requestAnimationFrame(animate);
    frameCount++;
    
    // Clear canvas with a slight trail effect
    ctx.fillStyle = 'rgba(5, 5, 5, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (gameActive) {
        player.update();
        spawnEnemies();
    }
    
    // Update Particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        if (p.alpha <= 0) {
            particles.splice(i, 1);
        } else {
            p.update();
        }
    }

    // Update Projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.update();

        // Remove off-screen projectiles
        if (p.x + p.radius < 0 || p.x - p.radius > canvas.width || 
            p.y + p.radius < 0 || p.y - p.radius > canvas.height) {
            projectiles.splice(i, 1);
        }
    }

    // Update Enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        enemy.update();

        // Collision with player
        if (gameActive && player) {
            const dist = distance(player.x, player.y, enemy.x, enemy.y);
            if (dist - enemy.radius - player.radius < 1) {
                // Enemy crashes into player
                createExplosion(enemy.x, enemy.y, enemy.color);
                enemies.splice(i, 1);
                
                // Shrink player (More punishing)
                player.radius -= 8;
                createExplosion(player.x, player.y, colors.player, 30);

                if (player.radius <= 7) {
                    // Game Over
                    gameActive = false;
                    if (timerInterval) clearInterval(timerInterval);
                    createExplosion(player.x, player.y, colors.player, 50);
                    setTimeout(() => {
                        gameOverScreen.classList.remove('hidden');
                        gameOverScreen.style.display = 'block';
                        finalScoreEl.innerHTML = score;
                        finalLevelEl.innerHTML = level;
                        if (hasBadge) {
                            finalBadgeContainer.classList.remove('hidden');
                        } else {
                            finalBadgeContainer.classList.add('hidden');
                        }
                    }, 500);
                }
                continue; // Skip projectile checks for this destroyed enemy
            }
        }

        // Collision with projectiles
        for (let j = projectiles.length - 1; j >= 0; j--) {
            const projectile = projectiles[j];
            const dist = distance(projectile.x, projectile.y, enemy.x, enemy.y);

            if (dist - enemy.radius - projectile.radius < 1) {
                // Create explosion
                createExplosion(enemy.x, enemy.y, enemy.color);
                
                // Score popup particle effect
                score += 10;
                scoreEl.innerHTML = score;

                // Grow player size upon destroying enemies
                if (player.radius < 45) {
                    player.radius += 0.8;
                }

                // Shrink or destroy enemy
                if (enemy.radius - 10 > 10) {
                    // Shrink
                    gsapShrink(enemy, enemy.radius - 10);
                    setTimeout(() => {
                        projectiles.splice(j, 1);
                    }, 0);
                } else {
                    // Destroy
                    setTimeout(() => {
                        enemies.splice(i, 1);
                        projectiles.splice(j, 1);
                    }, 0);
                }
            }
        }
    }
}

// Simple shrinking effect without needing GSAP
function gsapShrink(enemy, newRadius) {
    const shrinkSpeed = 1;
    const interval = setInterval(() => {
        if (enemy.radius > newRadius) {
            enemy.radius -= shrinkSpeed;
        } else {
            clearInterval(interval);
        }
    }, 16);
}

// Start Game Flow
startBtn.addEventListener('click', () => {
    init();
    startScreen.classList.add('hidden');
    setTimeout(() => {
        startScreen.style.display = 'none';
        gameActive = true;
    }, 300);
});

restartBtn.addEventListener('click', () => {
    init();
    gameOverScreen.classList.add('hidden');
    setTimeout(() => {
        gameOverScreen.style.display = 'none';
        gameActive = true;
    }, 300);
});

// Start loop
animate();
