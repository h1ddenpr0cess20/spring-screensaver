import { TAU, rand, pick } from './utils.js';
import { windX, windY } from './wind.js';

/* ── Petal ── */
export class Petal {
  constructor(w, h) {
    this.screenW = w;
    this.screenH = h;
    this.reset(true);
  }
  reset(initial) {
    this.size = rand(4, 10);
    this.speed = rand(0.5, 1.5);
    this.spin = rand(0, TAU);
    this.spinSpeed = rand(0.02, 0.06) * (Math.random() < 0.5 ? 1 : -1);
    this.hue = pick([340, 350, 0, 320, 30, 45]);
    this.sat = rand(60, 90);
    this.lit = rand(70, 90);
    this.alpha = rand(0.5, 0.85);
    this.tumble = rand(0, TAU);
    this.tumbleSpeed = rand(0.01, 0.04);
    if (initial) {
      this.x = rand(-50, this.screenW + 50);
      this.y = rand(-50, this.screenH + 50);
    } else {
      this.x = -this.size * 2;
      this.y = rand(-50, this.screenH * 0.6);
    }
  }
  update(speedMul) {
    const s = this.speed * speedMul;
    this.x += (windX * 1.5 + Math.sin(this.tumble) * 0.3) * s;
    this.y += (0.3 + windY * 0.5 + Math.cos(this.tumble * 0.7) * 0.2) * s;
    this.spin += this.spinSpeed * speedMul;
    this.tumble += this.tumbleSpeed * speedMul;
    if (this.x > this.screenW + 30 || this.y > this.screenH + 30 || this.x < -60) this.reset(false);
  }
  draw(ctx) {
    const s = this.size;
    const scaleY = 0.5 + 0.5 * Math.abs(Math.cos(this.spin));
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.spin * 0.5);
    ctx.scale(1, scaleY);
    ctx.fillStyle = `hsla(${this.hue}, ${this.sat}%, ${this.lit}%, ${this.alpha})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, s, s * 0.5, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

/* ── DandelionSeed ── */
export class DandelionSeed {
  constructor(w, h) {
    this.screenW = w;
    this.screenH = h;
    this.reset(true);
  }
  reset(initial) {
    this.size = rand(3, 6);
    this.speed = rand(0.3, 0.8);
    this.driftPhase = rand(0, TAU);
    this.parasols = Math.floor(rand(6, 12));
    this.alpha = rand(0.4, 0.7);
    if (initial) {
      this.x = rand(0, this.screenW);
      this.y = rand(0, this.screenH);
    } else {
      this.x = rand(-30, this.screenW * 0.3);
      this.y = rand(this.screenH * 0.3, this.screenH);
    }
  }
  update(speedMul) {
    const s = this.speed * speedMul;
    this.driftPhase += 0.008 * speedMul;
    this.x += (windX * 0.8 + Math.sin(this.driftPhase * 2) * 0.2) * s;
    this.y += (-0.5 + windY * 0.3 + Math.sin(this.driftPhase * 1.3) * 0.15) * s;
    if (this.x > this.screenW + 30 || this.y < -30) this.reset(false);
  }
  draw(ctx) {
    const s = this.size;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = '#8a7a60';
    ctx.beginPath();
    ctx.ellipse(0, s * 0.3, s * 0.12, s * 0.25, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 0.4;
    for (let i = 0; i < this.parasols; i++) {
      const a = (i / this.parasols) * TAU;
      const len = s * rand(0.7, 1.2);
      const tipX = Math.cos(a) * len;
      const tipY = -Math.abs(Math.sin(a)) * len - s * 0.1;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.arc(tipX, tipY, 0.6, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}

/* ── Particle (pollen/dust) ── */
export class Particle {
  constructor(w, h) {
    this.screenW = w;
    this.screenH = h;
    this.reset(true);
  }
  reset(initial) {
    this.size = rand(1, 3.5);
    this.speed = rand(0.2, 0.6);
    this.alpha = rand(0.15, 0.45);
    this.hue = pick([55, 60, 45, 40, 90]);
    this.driftPhase = rand(0, TAU);
    this.twinklePhase = rand(0, TAU);
    if (initial) {
      this.x = rand(0, this.screenW);
      this.y = rand(0, this.screenH);
    } else {
      this.x = rand(-20, 0);
      this.y = rand(0, this.screenH);
    }
  }
  update(speedMul) {
    const s = this.speed * speedMul;
    this.driftPhase += 0.01 * speedMul;
    this.twinklePhase += 0.03 * speedMul;
    this.x += (windX * 0.5 + Math.sin(this.driftPhase) * 0.2) * s;
    this.y += (Math.cos(this.driftPhase * 0.7) * 0.15 + windY * 0.2) * s;
    if (this.x > this.screenW + 10 || this.x < -10 || this.y < -10 || this.y > this.screenH + 10) this.reset(false);
  }
  draw(ctx) {
    const twinkle = 0.7 + 0.3 * Math.sin(this.twinklePhase);
    ctx.fillStyle = `hsla(${this.hue}, 80%, 80%, ${this.alpha * twinkle})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, TAU);
    ctx.fill();
  }
}

/* ── Cloud ── */
export class Cloud {
  constructor(w, h) {
    this.screenW = w;
    this.screenH = h;
    this.reset(true);
  }
  reset(initial) {
    this.size = rand(100, 240);
    this.speed = rand(0.1, 0.4);
    this.y = rand(20, this.screenH * 0.22);
    this.alpha = rand(0.35, 0.65);
    this.blobs = [];
    const w = this.size, h = this.size * 0.45;
    const baseCount = Math.floor(rand(4, 7));
    for (let i = 0; i < baseCount; i++) {
      const t = (i / (baseCount - 1)) - 0.5;
      this.blobs.push({ ox: t * w * 0.8, oy: h * 0.15, r: rand(0.22, 0.32) * w });
    }
    const midCount = Math.floor(rand(3, 5));
    for (let i = 0; i < midCount; i++) this.blobs.push({ ox: rand(-0.35, 0.35) * w, oy: rand(-0.2, 0.05) * h, r: rand(0.25, 0.4) * w });
    const topCount = Math.floor(rand(2, 4));
    for (let i = 0; i < topCount; i++) this.blobs.push({ ox: rand(-0.3, 0.3) * w, oy: -h * rand(0.3, 0.7), r: rand(0.15, 0.3) * w });
    this.x = initial ? rand(-this.size, this.screenW + this.size) : -this.size * 1.5;
  }
  update(speedMul) {
    this.x += (this.speed + windX * 0.08) * speedMul;
    if (this.x > this.screenW + this.size * 2) this.reset(false);
  }
  draw(ctx) {
    ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha * 0.3})`;
    for (const b of this.blobs) {
      ctx.beginPath();
      ctx.arc(this.x + b.ox, this.y + b.oy, b.r * 1.15, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
    for (const b of this.blobs) {
      ctx.beginPath();
      ctx.arc(this.x + b.ox, this.y + b.oy, b.r, 0, TAU);
      ctx.fill();
    }
  }
}
