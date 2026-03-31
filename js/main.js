import { rand } from './utils.js';
import { windX, updateWind } from './wind.js';
import { skyPhase, advanceSkyPhase, skyColor, drawSun, SunRay } from './sky.js';
import { weather, WEATHER, updateWeather, drawLightning, drawDarkClouds } from './weather.js';
import { drawBackHills, drawNearGround, GrassBlade } from './terrain.js';
import { Flower, makeHillFlower, Tree } from './flora.js';
import { Butterfly, Bird, Bee, Ladybug, Dragonfly, Squirrel, Rabbit } from './creatures.js';
import { Petal, DandelionSeed, Particle, Cloud } from './particles.js';

/* ── Canvas setup ── */
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

/* ── Offscreen canvas caches ── */
// Terrain: hills + near ground never change — blit instead of redrawing ~800 lineTo/frame
let terrainCache = null;
let terrainCacheW = 0, terrainCacheH = 0;

// hillsCache: just the back/mid hills (drawn before trees)
// groundCache: near ground strip (drawn after trees, before grass)
let groundCache = null;

function buildTerrainCache(W, H) {
  terrainCache = new OffscreenCanvas(W, H);
  const tc = terrainCache.getContext('2d');
  drawBackHills(tc, W, H);
  terrainCacheW = W;
  terrainCacheH = H;

  groundCache = new OffscreenCanvas(W, H);
  const gc2 = groundCache.getContext('2d');
  drawNearGround(gc2, W, H);
}

// Grass: redrawn to offscreen every N frames using the current wind/time
let grassCache = null;
let grassCacheW = 0, grassCacheH = 0;
let grassFrameCounter = 0;
const GRASS_REDRAW_INTERVAL = 3; // redraw grass every 3 frames (~20fps for grass)

function buildGrassCache(W, H) {
  if (!grassCache || grassCacheW !== W || grassCacheH !== H) {
    grassCache = new OffscreenCanvas(W, H);
    grassCacheW = W;
    grassCacheH = H;
  }
  const gc = grassCache.getContext('2d');
  gc.clearRect(0, 0, W, H);
  grass.forEach(g => g.draw(gc, time));
}

/* ── Cached sky gradient ── */
let skyGrad = null;
let lastSkyPhase = -1;

function getSkyGrad(W, H) {
  // Only recreate when phase changes meaningfully (~every 6 frames at 60fps)
  const rounded = Math.round(skyPhase * 500) / 500;
  if (skyGrad && rounded === lastSkyPhase) return skyGrad;
  lastSkyPhase = rounded;
  skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.85);
  skyGrad.addColorStop(0, skyColor(skyPhase));
  skyGrad.addColorStop(1, skyColor((skyPhase + 0.25) % 1));
  return skyGrad;
}

/* ── Scene objects ── */
let butterflies = [], bees = [], ladybugs = [], dragonflies = [], birds = [];
let squirrels = [], rabbits = [];
let petals = [], dandelionSeeds = [], particles = [];
let flowers = [], grass = [], clouds = [], sunRays = [], trees = [];
let farHillFlowers = [], midHillFlowers = [];

let speedMul = 1;
let time = 0;
let fleeFactor = 0;

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const W = canvas.width, H = canvas.height;

  buildTerrainCache(W, H);

  butterflies = Array.from({ length: 8 }, () => new Butterfly(W, H));
  bees = Array.from({ length: 5 }, () => new Bee(W, H));
  ladybugs = Array.from({ length: 4 }, () => new Ladybug(W, H));
  dragonflies = Array.from({ length: 3 }, () => new Dragonfly(W, H));
  birds = Array.from({ length: 6 }, () => new Bird(W, H));
  squirrels = Array.from({ length: 3 }, () => new Squirrel(W, H));
  rabbits = Array.from({ length: 3 }, () => new Rabbit(W, H));
  petals = Array.from({ length: 12 }, () => new Petal(W, H));
  dandelionSeeds = Array.from({ length: 5 }, () => new DandelionSeed(W, H));
  particles = Array.from({ length: 25 }, () => new Particle(W, H));
  clouds = Array.from({ length: 5 }, () => new Cloud(W, H));
  sunRays = Array.from({ length: 6 }, (_, i) => new SunRay(W, H, i, 6));

  farHillFlowers = [];
  midHillFlowers = [];

  trees = [];
  const treeCount = Math.max(3, Math.floor(W / 200));
  for (let i = 0; i < treeCount; i++) {
    const tx = W * (0.05 + 0.9 * (i + rand(0.15, 0.85)) / treeCount);
    const hillChoice = rand(0, 1);
    let groundY;
    if (hillChoice < 0.5) {
      groundY = H * 0.72 + Math.sin(tx * 0.003 + 1) * 40 + Math.sin(tx * 0.008) * 20;
    } else {
      groundY = H * 0.78 + Math.sin(tx * 0.004 + 2.5) * 30 + Math.sin(tx * 0.01 + 1) * 15;
    }
    trees.push(new Tree(tx, groundY, W, H));
  }

  flowers = Array.from({ length: Math.floor(W / 8) }, () => {
    const f = new Flower(W, H);
    f.bloomPhase = rand(0, 1);
    f.age = rand(0, f.maxAge * 0.6);
    return f;
  });

  grass = [];
  const groundY = H * 0.85;
  for (let x = 0; x < W; x += rand(3, 8)) {
    const localGround = groundY + Math.sin(x * 0.005 + 4) * 20 + Math.sin(x * 0.015) * 8;
    grass.push(new GrassBlade(x, localGround, rand(15, 50)));
  }

  weather.raindrops = [];
  skyGrad = null; // invalidate gradient cache on resize
}

window.addEventListener('resize', resize);
resize();

const speedInput = document.getElementById('speed');
const speedVal = document.getElementById('speedVal');
speedInput.addEventListener('input', () => {
  speedMul = parseFloat(speedInput.value);
  speedVal.textContent = speedMul.toFixed(1);
});

function animate() {
  const dt = 1 / 60;
  time += dt * speedMul;
  updateWind(dt * speedMul);
  updateWeather(speedMul, canvas.width, canvas.height);
  advanceSkyPhase(speedMul);

  const W = canvas.width, H = canvas.height;
  const creaturesHiding = weather.current >= WEATHER.RAIN;

  /* ── Sky ── */
  ctx.fillStyle = getSkyGrad(W, H);
  ctx.fillRect(0, 0, W, H);

  /* ── Sun ── */
  ctx.save();
  ctx.globalAlpha = Math.max(0, 1 - weather.overlay * 2);
  drawSun(ctx, W, H, time);
  ctx.restore();

  /* ── Weather overlay ── */
  if (weather.overlay > 0.01) {
    ctx.fillStyle = `rgba(60, 65, 75, ${weather.overlay})`;
    ctx.fillRect(0, 0, W, H);
  }

  /* ── Lightning flash ── */
  if (weather.lightningFlash > 0.05) {
    ctx.fillStyle = `rgba(220, 225, 240, ${weather.lightningFlash * 0.3})`;
    ctx.fillRect(0, 0, W, H);
    if (weather.lightningFlash > 0.8) drawLightning(ctx, W, H);
  }

  /* ── Clouds ── */
  clouds.forEach(c => { c.update(speedMul); c.draw(ctx); });
  if (weather.current >= WEATHER.CLOUDY) drawDarkClouds(ctx, W, H, time);

  /* ── Sun rays ── */
  if (weather.current <= WEATHER.CLOUDY) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - weather.overlay * 3);
    sunRays.forEach(r => r.draw(ctx, time));
    ctx.restore();
  }

  /* ── Terrain: hills (cached — never changes between resizes) ── */
  if (terrainCache && terrainCacheW === W && terrainCacheH === H) {
    ctx.drawImage(terrainCache, 0, 0);
  } else {
    drawBackHills(ctx, W, H);
  }

  /* ── Far hill flowers ── */
  for (let i = farHillFlowers.length - 1; i >= 0; i--) {
    if (farHillFlowers[i].dead) farHillFlowers.splice(i, 1);
  }
  const farTarget = Math.floor(W / 60);
  while (farHillFlowers.length < farTarget) {
    const x = rand(0, W);
    if (trees.some(t => Math.abs(t.x - x) < t.trunkW * 2)) continue;
    const gy = H * 0.72 + Math.sin(x * 0.003 + 1) * 40 + Math.sin(x * 0.008) * 20 + rand(5, 50);
    farHillFlowers.push(makeHillFlower(W, H, x, gy, 0.25));
  }
  farHillFlowers.forEach(f => { f.update(speedMul); f.draw(ctx, time); });

  /* ── Mid hill flowers ── */
  for (let i = midHillFlowers.length - 1; i >= 0; i--) {
    if (midHillFlowers[i].dead) midHillFlowers.splice(i, 1);
  }
  const midTarget = Math.floor(W / 45);
  while (midHillFlowers.length < midTarget) {
    const x = rand(0, W);
    if (trees.some(t => Math.abs(t.x - x) < t.trunkW * 2)) continue;
    const gy = H * 0.78 + Math.sin(x * 0.004 + 2.5) * 30 + Math.sin(x * 0.01 + 1) * 15 + rand(5, 55);
    midHillFlowers.push(makeHillFlower(W, H, x, gy, 0.35));
  }
  midHillFlowers.forEach(f => { f.update(speedMul); f.draw(ctx, time); });

  /* ── Trees ── */
  trees.forEach(t => t.draw(ctx, time));

  /* ── Near ground (cached offscreen blit) ── */
  if (groundCache) ctx.drawImage(groundCache, 0, 0);

  /* ── Grass (offscreen cache, redrawn every GRASS_REDRAW_INTERVAL frames) ── */
  grassFrameCounter++;
  if (grassFrameCounter >= GRASS_REDRAW_INTERVAL) {
    buildGrassCache(W, H);
    grassFrameCounter = 0;
  }
  if (grassCache) ctx.drawImage(grassCache, 0, 0);

  /* ── Flowers (manage lifecycle) ── */
  for (let i = flowers.length - 1; i >= 0; i--) {
    if (flowers[i].dead) flowers.splice(i, 1);
  }
  const targetFlowers = Math.floor(W / 8);
  while (flowers.length < targetFlowers) flowers.push(new Flower(W, H));

  /* ── Flee factor ── */
  if (creaturesHiding) {
    fleeFactor = Math.min(1, fleeFactor + 0.02 * speedMul);
  } else {
    fleeFactor = Math.max(0, fleeFactor - 0.025 * speedMul);
  }

  /* ── Ground animals (before flowers so flowers cover feet) ── */
  if (fleeFactor < 0.01) {
    squirrels.forEach(sq => { sq.update(speedMul); sq.draw(ctx); });
    rabbits.forEach(rb => { rb.update(speedMul); rb.draw(ctx); });
  } else {
    const urgencyGround = fleeFactor * fleeFactor;
    squirrels.forEach(sq => {
      if (!sq._fleeing) { sq._fleeing = true; sq._fleeDir = sq.x < W * 0.5 ? -1 : 1; }
      const fleeSpeed = (2 + urgencyGround * 4) * speedMul;
      sq.x += sq._fleeDir * fleeSpeed;
      sq.runPhase += 0.2 * speedMul;
      sq.tailPhase += 0.1 * speedMul;
      if (sq.x > -sq.size * 3 && sq.x < W + sq.size * 3) sq.draw(ctx);
    });
    rabbits.forEach(rb => {
      if (!rb._fleeing) { rb._fleeing = true; rb._fleeDir = rb.x < W * 0.5 ? -1 : 1; rb.isHopping = true; }
      const fleeSpeed = (1.5 + urgencyGround * 3.5) * speedMul;
      rb.x += rb._fleeDir * fleeSpeed;
      rb.hopPhase += 0.25 * speedMul;
      rb.dir = rb._fleeDir;
      if (rb.x > -rb.size * 3 && rb.x < W + rb.size * 3) rb.draw(ctx);
    });
  }

  /* ── Flowers ── */
  flowers.forEach(f => { f.update(speedMul); f.draw(ctx, time); });

  /* ── Particles ── */
  particles.forEach(p => { p.update(speedMul); p.draw(ctx); });
  dandelionSeeds.forEach(d => { d.update(speedMul); d.draw(ctx); });
  petals.forEach(p => { p.update(speedMul); p.draw(ctx); });

  /* ── Flying creatures ── */
  if (fleeFactor < 0.01) {
    ladybugs.forEach(l => { l.tryRest(flowers); l.update(speedMul, time); l.draw(ctx); });
    bees.forEach(b => { b.tryRest(flowers); b.update(speedMul, time); b.draw(ctx); });
    butterflies.forEach(b => { b.tryRest(flowers); b.update(speedMul, time); b.draw(ctx); });
    dragonflies.forEach(d => { d.update(speedMul); d.draw(ctx); });
    birds.forEach(b => { b.tryPerch(trees); b.update(speedMul); b.draw(ctx); });
    for (const c of [...butterflies, ...bees, ...ladybugs, ...dragonflies, ...birds, ...squirrels, ...rabbits]) c._fleeing = false;
  } else {
    const urgency = fleeFactor * fleeFactor;
    const _flee = (c) => {
      if (c._fleeing) return;
      c._fleeing = true;
      c.resting = false;
      c.targetFlower = null;
      c._fleeAngle = rand(-Math.PI, 0) + rand(-0.4, 0.4);
      c._fleeSpeed = rand(0.6, 1.2);
    };
    const _fleeMove = (c, speed) => {
      _flee(c);
      const amt = urgency * speed * c._fleeSpeed * speedMul;
      c.x += Math.cos(c._fleeAngle) * amt;
      c.y += Math.sin(c._fleeAngle) * amt;
      if (c.wingPhase !== undefined) c.wingPhase += (c.wingSpeed || 0.15) * speedMul;
      if (c.y > -150 && c.x > -150 && c.x < W + 150) c.draw(ctx);
    };
    for (const c of butterflies) _fleeMove(c, 3);
    for (const c of bees) _fleeMove(c, 4);
    for (const c of ladybugs) _fleeMove(c, 2);
    for (const c of dragonflies) _fleeMove(c, 5);
    for (const b of birds) {
      if (b.state === 'perched') {
        if (b.perchTree && b.perchIdx >= 0) b.perchTree.perchPoints[b.perchIdx].occupied = false;
        b.state = 'flying';
        b.speed = (Math.random() < 0.5 ? 1 : -1) * rand(2, 3.5);
      }
      _fleeMove(b, 5);
    }
  }

  /* ── Rain ── */
  weather.raindrops.forEach(r => r.draw(ctx, windX));

  requestAnimationFrame(animate);
}

animate();
