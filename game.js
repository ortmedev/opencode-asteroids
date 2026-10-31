'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = 800;
const H = 600;

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
const justPressed = {};

window.addEventListener('keydown', e => {
  justPressed[e.code] = !keys[e.code];
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
    e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const wrap  = (v, max) => ((v % max) + max) % max;
const dist  = (a, b)   => Math.hypot(a.x - b.x, a.y - b.y);
const rand  = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));

// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl  = 1.1;
    this.radius = 2;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Power-up de velocidad ────────────────────────────────────────────────────
const SPEED_POWER_DURATION = 12;   // segundos

class SpeedPowerUp {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 13;
    this.kind = 'speed';
    const angle = rand(0, Math.PI * 2);
    const speed = rand(25, 55);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.ttl = 10;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.strokeStyle = '#40e0ff';
    ctx.fillStyle = 'rgba(64, 224, 255, 0.18)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-5, -7);
    ctx.lineTo(3, -2);
    ctx.lineTo(-1, -2);
    ctx.lineTo(5, 7);
    ctx.lineTo(-4, 1);
    ctx.lineTo(0, 1);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Power-up de escudo ───────────────────────────────────────────────────────
const SHIELD_DURATION = 20;   // segundos
const SHIELD_USES     = 2;    // impactos que puede absorber

class ShieldPowerUp {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 13;
    this.kind = 'shield';
    const angle = rand(0, Math.PI * 2);
    const speed = rand(25, 55);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.ttl = 10;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.strokeStyle = '#50ffbe';
    ctx.fillStyle = 'rgba(80, 255, 190, 0.18)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Icono de escudo
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(5, -4);
    ctx.lineTo(5, 2);
    ctx.lineTo(0, 7);
    ctx.lineTo(-5, 2);
    ctx.lineTo(-5, -4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
const RADII  = [0, 16, 30, 50];   // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32];   // velocidad base por tamaño
const POINTS = [0, 100, 50, 20];  // puntos por tamaño

const TRAIL_LIFE     = 2;     // segundos de vida de la estela
const TRAIL_INTERVAL = 0.035; // separación entre partículas de la estela

class Asteroid {
  constructor(x, y, size = 3) {
    this.x    = x;
    this.y    = y;
    this.size = size;
    this.radius = RADII[size];
    this.dead = false;
    this.points = POINTS[size];
    this.powerUpChance = [0, 0.02, 0.015, 0.008][size];
    this.shieldChance  = [0, 0.015, 0.01, 0.005][size];
    this.explosionCount = size * 5;
    this.isBonus = false;

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  split() {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Estrella fugaz ────────────────────────────────────────────────────────────

// Punto de entrada sobre un borde aleatorio, con dirección hacia el interior.
function randomEdgeSpawn() {
  const edge   = randInt(0, 3);
  const margin = 40;
  const EPS    = 0.5;   // evita que wrap(W) o wrap(H) cambien de borde
  let x, y, baseAngle;

  if (edge === 0) {           // superior
    x = rand(margin, W - margin);
    y = 0;
    baseAngle = Math.PI / 2;
  } else if (edge === 1) {    // derecho
    x = W - EPS;
    y = rand(margin, H - margin);
    baseAngle = Math.PI;
  } else if (edge === 2) {    // inferior
    x = rand(margin, W - margin);
    y = H - EPS;
    baseAngle = -Math.PI / 2;
  } else {                    // izquierdo
    x = 0;
    y = rand(margin, H - margin);
    baseAngle = 0;
  }

  return { x, y, angle: baseAngle + rand(-0.4, 0.4) };
}

const STAR_LIFETIME = 10;   // segundos antes de desaparecer si no es destruida
const STAR_FADE     = 3;    // segundos finales en los que se desvanece

class ShootingStar extends Asteroid {
  constructor() {
    // La estrella aparece desde un borde, evitando hacerlo encima de la nave.
    let spawn = randomEdgeSpawn();
    let tries = 0;
    while (ship && Math.hypot(spawn.x - ship.x, spawn.y - ship.y) < 130 && tries++ < 32) {
      spawn = randomEdgeSpawn();
    }

    // Dirección de entrada (e) y su perpendicular (n).
    const ex = Math.cos(spawn.angle);
    const ey = Math.sin(spawn.angle);
    const nx = -ey;
    const ny = ex;

    // Semiejes de la elipse: uno perpendicular a la entrada y otro en la entrada.
    const ax = rand(320, 460);
    const ay = ax * rand(0.82, 0.95);
    const cx = spawn.x - ax * nx;
    const cy = spawn.y - ax * ny;

    super(spawn.x, spawn.y, 1);

    this.isBonus = true;
    this.points  = POINTS[1] * 10;
    this.powerUpChance = 0;
    this.shieldChance  = 0;
    this.explosionCount = 14;

    this.cx    = cx;
    this.cy    = cy;
    this.ax    = ax;
    this.ay    = ay;
    this.ex    = ex;
    this.ey    = ey;
    this.nx    = nx;
    this.ny    = ny;
    this.phase = 0;

    // Velocidad tangencial media = el doble de un asteroide pequeño.
    const smallSpeed = SPEEDS[1] + rand(-15, 15);
    this.omega = (smallSpeed * 2) / ((ax + ay) / 2);
    this.emitTimer = 0;
    this.ttl = STAR_LIFETIME;

    this.syncPosition();
  }

  syncPosition() {
    const cos = Math.cos(this.phase);
    const sin = Math.sin(this.phase);
    this.x = wrap(this.cx + this.ax * cos * this.nx + this.ay * sin * this.ex, W);
    this.y = wrap(this.cy + this.ax * cos * this.ny + this.ay * sin * this.ey, H);
  }

  update(dt) {
    this.ttl -= dt;
    if (this.ttl <= 0) {
      this.dead = true;
      return;
    }

    this.phase += this.omega * dt;
    this.syncPosition();
    this.rot += this.rotSpeed * dt;

    // Dirección tangente a la elipse, usada para orientar la estela.
    const cos = Math.cos(this.phase);
    const sin = Math.sin(this.phase);
    const tx  = -this.ax * sin * this.nx + this.ay * cos * this.ex;
    const ty  = -this.ax * sin * this.ny + this.ay * cos * this.ey;
    const len = Math.hypot(tx, ty) || 1;

    this.emitTimer -= dt;
    while (this.emitTimer <= 0) {
      particles.push(new TrailParticle(this.x, this.y, tx / len, ty / len));
      this.emitTimer += TRAIL_INTERVAL;
    }
  }

  split() { return []; }

  draw() {
    // En los últimos segundos se desvanece conservando su color.
    const alpha = this.ttl < STAR_FADE ? Math.max(0, this.ttl / STAR_FADE) : 1;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = '#ffd166';
    ctx.fillStyle   = 'rgba(255, 190, 80, 0.14)';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.shadowColor = 'rgba(255, 190, 80, 0.9)';
    ctx.shadowBlur  = 12;
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Ship ──────────────────────────────────────────────────────────────────────
class Ship {
  constructor() { this.reset(); }

  reset() {
    this.x      = W / 2;
    this.y      = H / 2;
    this.angle  = -Math.PI / 2;
    this.vx     = 0;
    this.vy     = 0;
    this.radius = 12;
    this.thrusting     = false;
    this.invincible    = 3;
    this.shootCooldown = 0;
    this.speedTimer    = 0;
    this.shieldTimer   = 0;
    this.shieldCharges = 0;
    this.shieldFlash   = 0;
    this.dead          = false;
  }

  update(dt) {
    if (this.dead) return;
    if (this.invincible    > 0) this.invincible    -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.speedTimer    > 0) this.speedTimer    = Math.max(0, this.speedTimer - dt);
    if (this.shieldFlash   > 0) this.shieldFlash   = Math.max(0, this.shieldFlash - dt);
    if (this.shieldTimer   > 0) {
      this.shieldTimer = Math.max(0, this.shieldTimer - dt);
      if (this.shieldTimer === 0) this.shieldCharges = 0;
    }

    const ROT   = 3.5;   // rad/s
    const THRUST = 260;  // px/s²
    const DRAG   = 0.987;

    if (keys['ArrowLeft'])  this.angle -= ROT * dt;
    if (keys['ArrowRight']) this.angle += ROT * dt;

    this.thrusting = !!keys['ArrowUp'];
    if (this.thrusting) {
      const thrust = THRUST * (this.speedTimer > 0 ? 2 : 1);
      this.vx += Math.cos(this.angle) * thrust * dt;
      this.vy += Math.sin(this.angle) * thrust * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }

  tryShoot() {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const NOSE = 21;
    const ox = this.x + Math.cos(this.angle) * NOSE;
    const oy = this.y + Math.sin(this.angle) * NOSE;
    return [new Bullet(ox, oy, this.angle)];
  }

  hasShield() {
    return !this.dead && this.shieldTimer > 0 && this.shieldCharges > 0;
  }

  activateShield() {
    this.shieldTimer   = SHIELD_DURATION;
    this.shieldCharges = SHIELD_USES;
    this.shieldFlash   = 0.35;
  }

  absorbShieldHit() {
    this.shieldCharges = Math.max(0, this.shieldCharges - 1);
    if (this.shieldCharges === 0) this.shieldTimer = 0;
    this.shieldFlash = 0.35;
  }

  drawShield() {
    if (!this.hasShield()) return;

    const t       = performance.now() / 1000;
    const pulse   = 0.55 + Math.sin(t * 6) * 0.15;
    const flash   = this.shieldFlash / 0.35;
    const alpha   = Math.min(1, pulse + flash * 0.5);
    const RADIUS  = 27;

    ctx.save();
    ctx.translate(this.x, this.y);

    // Halo interior
    ctx.beginPath();
    ctx.arc(0, 0, RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(80, 255, 190, ${0.05 + flash * 0.08})`;
    ctx.fill();

    // Anillo exterior
    ctx.strokeStyle = flash > 0
      ? `rgba(220, 255, 240, ${alpha})`
      : `rgba(80, 255, 190, ${alpha})`;
    ctx.lineWidth = 1.5 + flash * 1.5;
    ctx.shadowColor = 'rgba(80, 255, 190, 0.7)';
    ctx.shadowBlur  = 8 + flash * 10;
    ctx.beginPath();
    ctx.arc(0, 0, RADIUS, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Marcas de usos restantes
    for (let i = 0; i < this.shieldCharges; i++) {
      const a = -Math.PI / 2 + (i - (this.shieldCharges - 1) / 2) * 0.55;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * RADIUS, Math.sin(a) * RADIUS, 2.6, 0, Math.PI * 2);
      ctx.fillStyle = '#d8ffef';
      ctx.fill();
    }

    ctx.restore();
  }

  draw() {
    if (this.dead) return;
    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';

    // Silueta clásica: triángulo con muesca trasera
    ctx.beginPath();
    ctx.moveTo( 20,  0);   // nariz
    ctx.lineTo(-12, -9);   // ala izquierda
    ctx.lineTo( -7,  0);   // muesca trasera
    ctx.lineTo(-12,  9);   // ala derecha
    ctx.closePath();
    ctx.stroke();

    // Llama del propulsor
    if (this.thrusting && Math.random() > 0.35) {
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-8 - rand(6, 14), 0);
      ctx.lineTo(-8,  4);
      ctx.strokeStyle = 'rgba(255, 130, 0, 0.85)';
      ctx.stroke();
    }

    ctx.restore();
  }
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  constructor(x, y) {
    this.x  = x;
    this.y  = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx   = Math.cos(angle) * speed;
    this.vy   = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl  = this.life;
    this.dead = false;
  }

  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

// ── Estela de la estrella fugaz ──────────────────────────────────────────────
class TrailParticle {
  constructor(x, y, dirX, dirY) {
    this.x = x + rand(-2, 2);
    this.y = y + rand(-2, 2);
    const angle = Math.atan2(-dirY, -dirX) + rand(-0.45, 0.45);
    const speed = rand(12, 38);
    this.vx   = Math.cos(angle) * speed;
    this.vy   = Math.sin(angle) * speed;
    this.life = TRAIL_LIFE;
    this.ttl  = TRAIL_LIFE;
    this.dead = false;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(255, 200, 110, ${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.06, this.y - this.vy * 0.06);
    ctx.stroke();
  }
}

// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, asteroids, particles, powerUps;
let score, lives, level;
let state;      // 'playing' | 'dead' | 'gameover'
let deadTimer;
let shootingStarTimer;   // segundos hasta la estrella fugaz, o null si no aparece

// 50% de probabilidad de que haya estrella fugaz en el mapa; si la hay,
// aparece en un momento aleatorio entre el segundo 10 y el 20.
function rollShootingStarDelay() {
  return Math.random() < 0.5 ? rand(10, 20) : null;
}

function spawnAsteroids(count) {
  const SAFE_DIST = 130;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    asteroids.push(new Asteroid(x, y, 3));
  }
}

function initGame() {
  ship          = new Ship();
  bullets   = [];
  asteroids = [];
  particles = [];
  powerUps  = [];
  score  = 0;
  lives  = 3;
  level  = 1;
  state  = 'playing';
  shootingStarTimer = rollShootingStarDelay();
  spawnAsteroids(4);
}

function nextLevel() {
  level++;
  asteroids = asteroids.filter(a => !a.isBonus);
  bullets   = [];
  particles = [];
  powerUps  = [];
  ship.reset();
  shootingStarTimer = rollShootingStarDelay();
  spawnAsteroids(3 + level);
}

function explode(x, y, count = 8) {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
}

function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead = true;
  ship.speedTimer = 0;
  ship.shieldTimer = 0;
  ship.shieldCharges = 0;
  ship.shieldFlash = 0;
  lives--;
  if (lives <= 0) {
    state = 'gameover';
  } else {
    state     = 'dead';
    deadTimer = 2;
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  if (state === 'gameover') {
    if (pressed('Space')) initGame();
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    return;
  }

  if (state === 'dead') {
    deadTimer -= dt;
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    asteroids.forEach(a => a.update(dt));
    asteroids = asteroids.filter(a => !a.dead);
    powerUps.forEach(powerUp => powerUp.update(dt));
    powerUps = powerUps.filter(powerUp => !powerUp.dead);
    if (deadTimer <= 0) { state = 'playing'; ship.reset(); }
    return;
  }

  // Disparar
  if (pressed('Space')) {
    bullets.push(...ship.tryShoot());
  }

  // Aparición de la estrella fugaz
  if (shootingStarTimer !== null) {
    shootingStarTimer -= dt;
    if (shootingStarTimer <= 0) {
      shootingStarTimer = null;
      asteroids.push(new ShootingStar());
    }
  }

  ship.update(dt);
  bullets.forEach(b => b.update(dt));
  asteroids.forEach(a => a.update(dt));
  powerUps.forEach(powerUp => powerUp.update(dt));
  particles.forEach(p => p.update(dt));

  bullets   = bullets.filter(b => !b.dead);
  particles = particles.filter(p => !p.dead);
  powerUps  = powerUps.filter(powerUp => !powerUp.dead);

  // Bala vs asteroide
  const newAsteroids = [];
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        a.dead = true;
        score += a.points;
        explode(a.x, a.y, a.explosionCount);
        const drop = Math.random();
        if (drop < a.powerUpChance)
          powerUps.push(new SpeedPowerUp(a.x, a.y));
        else if (drop < a.powerUpChance + a.shieldChance)
          powerUps.push(new ShieldPowerUp(a.x, a.y));
        newAsteroids.push(...a.split());
      }
    }
  }
  asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  bullets   = bullets.filter(b => !b.dead);

  // Nave vs power-up
  for (const powerUp of powerUps) {
    if (!powerUp.dead && dist(ship, powerUp) < ship.radius + powerUp.radius) {
      powerUp.dead = true;
      if (powerUp.kind === 'shield') ship.activateShield();
      else ship.speedTimer = SPEED_POWER_DURATION;
    }
  }
  powerUps = powerUps.filter(powerUp => !powerUp.dead);

  // Nave vs asteroide (el escudo absorbe el impacto)
  if (ship.invincible <= 0) {
    for (const a of asteroids) {
      if (dist(ship, a) < ship.radius + a.radius * 0.82) {
        if (ship.hasShield()) {
          ship.absorbShieldHit();
          a.dead = true;
          explode(a.x, a.y, a.explosionCount);
        } else {
          killShip();
        }
        break;
      }
    }
  }
  asteroids = asteroids.filter(a => !a.dead);

  // Nivel completado (la estrella fugaz es solo un bonus)
  if (asteroids.every(a => a.isBonus)) nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawLifeIcon(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth   = 1.2;
  ctx.lineJoin    = 'round';
  ctx.beginPath();
  ctx.moveTo( 9,  0);
  ctx.lineTo(-6, -5);
  ctx.lineTo(-3,  0);
  ctx.lineTo(-6,  5);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${score}`, 14, 26);

  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  for (let i = 0; i < lives; i++)
    drawLifeIcon(W - 16 - i * 22, 18);

  let hudY = 42;

  if (ship.speedTimer > 0) {
    const BAR_W = 130;
    const BAR_H = 8;
    const x = W - BAR_W - 14;
    const y = hudY;
    ctx.textAlign = 'right';
    ctx.fillStyle = '#40e0ff';
    ctx.font = '12px monospace';
    ctx.fillText('VELOCIDAD', W - 14, y - 7);
    ctx.strokeStyle = '#40e0ff';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, BAR_W, BAR_H);
    ctx.fillStyle = '#40e0ff';
    ctx.fillRect(x, y, BAR_W * (ship.speedTimer / SPEED_POWER_DURATION), BAR_H);
    hudY += 30;
  }

  if (ship.shieldTimer > 0 && ship.shieldCharges > 0) {
    const BAR_W = 130;
    const BAR_H = 8;
    const x = W - BAR_W - 14;
    const y = hudY;
    ctx.textAlign = 'right';
    ctx.fillStyle = '#50ffbe';
    ctx.font = '12px monospace';
    ctx.fillText('ESCUDO', W - 14, y - 7);

    // Marcas de usos restantes
    for (let i = 0; i < SHIELD_USES; i++) {
      ctx.beginPath();
      ctx.arc(x - 10 - i * 12, y + BAR_H / 2, 3, 0, Math.PI * 2);
      if (i < ship.shieldCharges) {
        ctx.fillStyle = '#50ffbe';
        ctx.fill();
      } else {
        ctx.strokeStyle = 'rgba(80, 255, 190, 0.35)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    ctx.strokeStyle = '#50ffbe';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, BAR_W, BAR_H);
    ctx.fillStyle = '#50ffbe';
    ctx.fillRect(x, y, BAR_W * (ship.shieldTimer / SHIELD_DURATION), BAR_H);
  }

}

function drawOverlay(title, sub) {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font        = '18px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.fillText(sub, W / 2, H / 2 + 22);
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  particles.forEach(p => p.draw());
  asteroids.forEach(a => a.draw());
  powerUps.forEach(powerUp => powerUp.draw());
  bullets.forEach(b => b.draw());
  ship.draw();
  ship.drawShield();

  drawHUD();

  if (state === 'gameover')
    drawOverlay('GAME OVER', `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`);
}

// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

initGame();
requestAnimationFrame(loop);
