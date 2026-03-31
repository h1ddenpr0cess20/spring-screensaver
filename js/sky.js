import { TAU, rand, lerp } from './utils.js';

export let skyPhase = 0;

export function advanceSkyPhase(dt) {
  skyPhase = (skyPhase + 0.0001 * dt) % 1;
}

export function skyColor(t) {
  const colors = [
    [0.53, 0.81, 0.98],
    [0.40, 0.70, 0.92],
    [0.55, 0.83, 0.78],
    [0.60, 0.85, 0.95],
  ];
  const idx = t * colors.length;
  const i = Math.floor(idx) % colors.length;
  const j = (i + 1) % colors.length;
  const f = idx - Math.floor(idx);
  const r = Math.floor(lerp(colors[i][0], colors[j][0], f) * 255);
  const g = Math.floor(lerp(colors[i][1], colors[j][1], f) * 255);
  const b = Math.floor(lerp(colors[i][2], colors[j][2], f) * 255);
  return `rgb(${r},${g},${b})`;
}

export function drawSun(ctx, w, h, time) {
  const sx = w * 0.85;
  const sy = h * 0.08;
  const r = 40;

  const glow = ctx.createRadialGradient(sx, sy, r * 0.5, sx, sy, r * 4);
  glow.addColorStop(0, 'rgba(255, 250, 200, 0.3)');
  glow.addColorStop(0.3, 'rgba(255, 240, 150, 0.1)');
  glow.addColorStop(1, 'rgba(255, 240, 150, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(sx - r * 4, sy - r * 4, r * 8, r * 8);

  ctx.strokeStyle = 'rgba(255, 240, 160, 0.15)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU + time * 0.05;
    const inner = r * 1.3;
    const outer = r * (1.8 + 0.3 * Math.sin(time * 0.5 + i));
    ctx.beginPath();
    ctx.moveTo(sx + Math.cos(a) * inner, sy + Math.sin(a) * inner);
    ctx.lineTo(sx + Math.cos(a) * outer, sy + Math.sin(a) * outer);
    ctx.stroke();
  }

  const disc = ctx.createRadialGradient(sx - r * 0.2, sy - r * 0.2, 0, sx, sy, r);
  disc.addColorStop(0, '#fffde0');
  disc.addColorStop(0.7, '#ffe94e');
  disc.addColorStop(1, '#ffc800');
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(sx, sy, r, 0, TAU);
  ctx.fill();
}

export class SunRay {
  constructor(w, h, index, total) {
    this.screenW = w;
    this.screenH = h;
    const spread = 0.6;
    this.angle = ((index / (total - 1)) - 0.5) * spread;
    this.width = rand(50, 140);
    this.alpha = rand(0.02, 0.05);
    this.drift = rand(0, TAU);
  }
  draw(ctx, time) {
    const a = this.alpha * (0.7 + 0.3 * Math.sin(time * 0.3 + this.drift));
    ctx.save();
    ctx.translate(this.screenW * 0.85, this.screenH * 0.08);
    ctx.rotate(this.angle + Math.sin(time * 0.1 + this.drift) * 0.015);
    const grad = ctx.createLinearGradient(0, 0, 0, this.screenH * 1.2);
    grad.addColorStop(0, `rgba(255, 250, 200, ${a})`);
    grad.addColorStop(0.5, `rgba(255, 245, 180, ${a * 0.4})`);
    grad.addColorStop(1, `rgba(255, 240, 160, 0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(-this.width / 2, 0, this.width, this.screenH * 1.2);
    ctx.restore();
  }
}
