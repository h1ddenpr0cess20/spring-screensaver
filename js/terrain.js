import { TAU, rand } from './utils.js';
import { windX } from './wind.js';

export function drawBackHills(ctx, w, h) {
  ctx.fillStyle = '#6aad4a';
  ctx.beginPath();
  ctx.moveTo(0, h);
  for (let x = 0; x <= w; x += 5) {
    ctx.lineTo(x, h * 0.72 + Math.sin(x * 0.003 + 1) * 40 + Math.sin(x * 0.008) * 20);
  }
  ctx.lineTo(w, h);
  ctx.fill();

  ctx.fillStyle = '#5a9e38';
  ctx.beginPath();
  ctx.moveTo(0, h);
  for (let x = 0; x <= w; x += 5) {
    ctx.lineTo(x, h * 0.78 + Math.sin(x * 0.004 + 2.5) * 30 + Math.sin(x * 0.01 + 1) * 15);
  }
  ctx.lineTo(w, h);
  ctx.fill();
}

export function drawNearGround(ctx, w, h) {
  ctx.fillStyle = '#4d8e2a';
  ctx.beginPath();
  ctx.moveTo(0, h);
  for (let x = 0; x <= w; x += 5) {
    ctx.lineTo(x, h * 0.85 + Math.sin(x * 0.005 + 4) * 20 + Math.sin(x * 0.015) * 8);
  }
  ctx.lineTo(w, h);
  ctx.fill();
}

export class GrassBlade {
  constructor(x, baseY, h) {
    this.x = x;
    this.baseY = baseY;
    this.h = h;
    this.hue = 75 + rand(-10, 30);
    this.sat = 40 + rand(-5, 30);
    this.lit = 25 + rand(-5, 20);
    this.swayOffset = rand(0, TAU);
    this.swayAmp = rand(0.03, 0.12);
    this.baseWidth = rand(1.5, 6);
    this.lean = rand(-0.3, 0.3);
    this.curl = rand(-0.15, 0.15);
    this.fillStyle = `hsl(${this.hue}, ${this.sat}%, ${this.lit}%)`;
    this.strokeStyle = `hsla(${this.hue}, ${this.sat - 10}%, ${this.lit + 12}%, 0.3)`;
  }
  draw(ctx, time) {
    const sway = Math.sin(time * 1.2 + this.swayOffset) * this.swayAmp * this.h;
    const windPush = windX * this.h * 0.04;
    const tipX = this.x + sway + windPush + this.lean * this.h;
    const midX = this.x + (sway + windPush) * 0.4 + this.lean * this.h * 0.3 + this.curl * this.h;

    const segs = 8;
    const pts = [];
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const bx = (1 - t) * (1 - t) * this.x + 2 * (1 - t) * t * midX + t * t * tipX;
      const by = this.baseY - this.h * t;
      const w = this.baseWidth * (1 - t * 0.85);
      pts.push({ x: bx, y: by, w });
    }

    ctx.fillStyle = this.fillStyle;
    ctx.beginPath();
    ctx.moveTo(pts[0].x - pts[0].w * 0.5, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x - pts[i].w * 0.5, pts[i].y);
    }
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y - 1);
    for (let i = pts.length - 1; i >= 0; i--) {
      ctx.lineTo(pts[i].x + pts[i].w * 0.5, pts[i].y);
    }
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = this.strokeStyle;
    ctx.lineWidth = 0.4;
    ctx.beginPath();
    ctx.moveTo(this.x, this.baseY);
    ctx.quadraticCurveTo(midX, this.baseY - this.h * 0.5, tipX, this.baseY - this.h);
    ctx.stroke();
  }
}
