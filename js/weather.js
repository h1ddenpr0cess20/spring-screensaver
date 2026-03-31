import { rand } from './utils.js';
import { windX } from './wind.js';

export const WEATHER = { CLEAR: 0, CLOUDY: 1, RAIN: 2, STORM: 3 };

export const weather = {
  current: WEATHER.CLEAR,
  target: WEATHER.CLEAR,
  transition: 0,
  timer: 0,
  duration: rand(600, 1500),
  overlay: 0,
  lightningTimer: 0,
  lightningFlash: 0,
  raindrops: [],
};

export function isStormy() {
  return weather.current >= WEATHER.RAIN;
}

export function updateWeather(speedMul, W, H) {
  weather.timer += speedMul;
  if (weather.timer > weather.duration) {
    weather.timer = 0;
    weather.duration = rand(400, 1000);
    const roll = Math.random();
    if (roll < 0.3) weather.target = WEATHER.CLEAR;
    else if (roll < 0.5) weather.target = WEATHER.CLOUDY;
    else if (roll < 0.8) weather.target = WEATHER.RAIN;
    else weather.target = WEATHER.STORM;
  }

  const targetOverlay = [0, 0.2, 0.35, 0.5][weather.target];
  weather.overlay += (targetOverlay - weather.overlay) * 0.03 * speedMul;
  weather.current = weather.overlay < 0.08 ? WEATHER.CLEAR :
                    weather.overlay < 0.18 ? WEATHER.CLOUDY :
                    weather.overlay < 0.32 ? WEATHER.RAIN : WEATHER.STORM;

  const targetRainCount = weather.current >= WEATHER.RAIN
    ? (weather.current === WEATHER.STORM ? 300 : 150) : 0;
  while (weather.raindrops.length < targetRainCount) weather.raindrops.push(new Raindrop(W, H));
  while (weather.raindrops.length > targetRainCount) weather.raindrops.pop();
  weather.raindrops.forEach(r => r.update(speedMul, windX));

  if (weather.current === WEATHER.STORM) {
    weather.lightningTimer += speedMul;
    if (weather.lightningTimer > rand(120, 400)) {
      weather.lightningFlash = 1;
      weather.lightningTimer = 0;
    }
  }
  weather.lightningFlash *= 0.9;
}

export class Raindrop {
  constructor(w, h) {
    this.screenW = w;
    this.screenH = h;
    this.reset(true);
  }
  reset(initial) {
    this.x = rand(-20, this.screenW + 20);
    this.y = initial ? rand(-this.screenH, 0) : rand(-60, -10);
    this.speed = rand(8, 16);
    this.length = rand(8, 20);
    this.alpha = rand(0.15, 0.4);
  }
  update(speedMul, wx) {
    this.y += this.speed * speedMul;
    this.x += wx * 2 * speedMul;
    if (this.y > this.screenH + 10) this.reset(false);
  }
  draw(ctx, wx) {
    ctx.strokeStyle = `rgba(180, 200, 230, ${this.alpha})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x + wx * 2, this.y + this.length);
    ctx.stroke();
  }
}

export function drawLightning(ctx, w, h) {
  const x = rand(w * 0.1, w * 0.9);
  ctx.strokeStyle = 'rgba(255, 255, 240, 0.9)';
  ctx.lineWidth = 2;
  ctx.shadowColor = 'rgba(200, 220, 255, 0.8)';
  ctx.shadowBlur = 20;
  let bx = x, by = 0;
  ctx.beginPath();
  ctx.moveTo(bx, by);
  const segs = Math.floor(rand(4, 8));
  for (let i = 0; i < segs; i++) {
    bx += rand(-40, 40);
    by += h / segs * rand(0.6, 1.2);
    ctx.lineTo(bx, by);
    if (Math.random() < 0.3) {
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(bx, by);
      const brX = bx + rand(-50, 50);
      const brY = by + rand(20, 60);
      ctx.lineTo(brX, brY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(bx, by);
    }
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
}

export function drawDarkClouds(ctx, W, H, time) {
  const darkAlpha = weather.overlay * 0.6;
  for (let i = 0; i < 4; i++) {
    const cx = (time * 8 + i * W * 0.28) % (W + 500) - 250;
    const cy = H * 0.05 + i * H * 0.035 + Math.sin(i * 2.7) * H * 0.015;
    const cw = 160 + (i % 3) * 50;
    ctx.fillStyle = `rgba(80, 85, 95, ${darkAlpha * 0.4})`;
    for (let j = 0; j < 5; j++) {
      const bx = cx + ((j / 4) - 0.5) * cw * 0.7;
      const by = cy + Math.sin(j * 1.4 + i) * cw * 0.06;
      ctx.beginPath();
      ctx.arc(bx, by, cw * 0.22, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = `rgba(70, 75, 85, ${darkAlpha})`;
    for (let j = 0; j < 4; j++) {
      const bx = cx + ((j / 3) - 0.5) * cw * 0.5;
      const by = cy - cw * 0.08 + Math.sin(j * 2.1 + i * 0.7) * cw * 0.05;
      ctx.beginPath();
      ctx.arc(bx, by, cw * 0.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = `rgba(90, 95, 105, ${darkAlpha * 0.7})`;
    for (let j = 0; j < 3; j++) {
      const bx = cx + ((j / 2) - 0.5) * cw * 0.4;
      const by = cy - cw * 0.2 + Math.sin(j * 3.1 + i) * cw * 0.04;
      ctx.beginPath();
      ctx.arc(bx, by, cw * 0.14, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
