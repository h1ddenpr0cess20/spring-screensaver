import { TAU, rand, pick } from './utils.js';
import { windX } from './wind.js';

/* ── Flower ── */
export class Flower {
  constructor(w, h) {
    this.screenW = w;
    this.screenH = h;
    this.reset();
  }
  reset() {
    this.x = rand(5, this.screenW - 5);
    this.groundY = this.screenH + rand(0, 20);
    this.stemH = rand(25, 200);
    this.type = pick(['daisy', 'daisy', 'tulip', 'rose', 'sunflower', 'poppy', 'bell', 'wild', 'wild', 'daisy']);
    this.petalHue = this._pickHue();
    this.petalSat = rand(55, 100);
    this.petalLit = rand(48, 82);
    this.petalSize = this._pickSize();
    this.petalCount = this._pickPetalCount();
    this.centerSize = this.petalSize * rand(0.2, 0.5);
    this.centerColor = pick(['#f5d020', '#e8a000', '#fff5b0', '#f0e060', '#8b6914']);
    this.swayOffset = rand(0, TAU);
    this.bloomPhase = 0;
    this.bloomSpeed = rand(0.002, 0.008);
    this.stemCurve = rand(-25, 25);
    this.stemWidth = rand(2, 5);
    this.stemHue = 85 + rand(-15, 20);
    this.leafCount = Math.floor(rand(1, 4));
    this.leafPositions = [];
    for (let i = 0; i < this.leafCount; i++) {
      this.leafPositions.push({
        t: rand(0.25, 0.7),
        side: Math.random() < 0.5 ? 1 : -1,
        size: rand(8, 18),
        angle: rand(0.2, 0.8),
        hueVar: rand(-5, 5),
        litVar: rand(-3, 5),
      });
    }
    this.age = 0;
    this.maxAge = rand(800, 1800);
    this.wiltDuration = rand(120, 250);
    this.dead = false;
  }
  _pickHue() {
    const hues = {
      daisy: pick([0, 30, 45, 280, 300, 330, 50, 60]),
      tulip: pick([0, 15, 330, 340, 280, 300, 45, 50]),
      rose: pick([340, 350, 0, 10, 320, 280]),
      sunflower: pick([40, 45, 50, 55]),
      poppy: pick([0, 10, 15, 350, 30]),
      bell: pick([230, 250, 270, 280, 200]),
      wild: pick([280, 300, 320, 45, 60, 180, 200, 30, 350]),
    };
    return hues[this.type] || rand(0, 360);
  }
  _pickSize() {
    const sizes = {
      daisy: rand(8, 28),
      tulip: rand(12, 30),
      rose: rand(14, 35),
      sunflower: rand(22, 50),
      poppy: rand(12, 32),
      bell: rand(8, 22),
      wild: rand(5, 18),
    };
    return sizes[this.type] || rand(8, 25);
  }
  _pickPetalCount() {
    const counts = {
      daisy: Math.floor(rand(8, 16)),
      tulip: Math.floor(rand(5, 7)),
      rose: Math.floor(rand(12, 22)),
      sunflower: Math.floor(rand(16, 26)),
      poppy: Math.floor(rand(4, 7)),
      bell: 1,
      wild: Math.floor(rand(4, 8)),
    };
    return counts[this.type] || Math.floor(rand(5, 10));
  }
  update(speedMul) {
    this.bloomPhase = Math.min(1, this.bloomPhase + this.bloomSpeed * speedMul);
    this.age += speedMul;
    if (this.age > this.maxAge) {
      this.wiltProgress = Math.min(1, (this.age - this.maxAge) / this.wiltDuration);
      if (this.wiltProgress >= 1) this.dead = true;
    } else {
      this.wiltProgress = 0;
    }
  }
  draw(ctx, time) {
    ctx.save();
    const w = this.wiltProgress || 0;
    const droopX = w * w * this.stemH * 0.25 * (this.stemCurve > 0 ? 1 : -1);
    const droopY = w * w * this.stemH * 0.3;
    const sway = Math.sin(time * 1.0 + this.swayOffset) * 6 * (this.stemH / 140) * (1 - w * 0.7);
    const tipX = this.x + sway + this.stemCurve * 0.3 + droopX;
    const tipY = this.groundY - this.stemH + droopY;

    ctx.strokeStyle = `hsl(${this.stemHue}, 55%, 28%)`;
    ctx.lineWidth = this.stemWidth;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(this.x, this.groundY);
    ctx.quadraticCurveTo(this.x + this.stemCurve, this.groundY - this.stemH * 0.5, tipX, tipY);
    ctx.stroke();
    ctx.lineWidth = this.stemWidth * 0.6;
    ctx.strokeStyle = `hsl(${this.stemHue}, 50%, 32%)`;
    ctx.beginPath();
    const midStemX = this.x + this.stemCurve * 0.5 + sway * 0.3;
    ctx.moveTo(midStemX, this.groundY - this.stemH * 0.45);
    ctx.quadraticCurveTo(tipX - sway * 0.1, tipY + this.stemH * 0.15, tipX, tipY);
    ctx.stroke();

    for (const leaf of this.leafPositions) {
      const ly = this.groundY - this.stemH * leaf.t;
      const lt = leaf.t;
      const lx = (1-lt)*(1-lt)*this.x + 2*(1-lt)*lt*(this.x + this.stemCurve) + lt*lt*tipX;
      ctx.fillStyle = `hsl(${this.stemHue + leaf.hueVar}, 50%, ${30 + leaf.litVar}%)`;
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(leaf.angle * leaf.side + Math.sin(time * 0.8 + this.swayOffset + leaf.t) * 0.1);
      ctx.scale(leaf.side, 1);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(leaf.size * 0.3, -leaf.size * 0.25, leaf.size * 0.8, -leaf.size * 0.15, leaf.size, 0);
      ctx.bezierCurveTo(leaf.size * 0.8, leaf.size * 0.15, leaf.size * 0.3, leaf.size * 0.2, 0, 0);
      ctx.fill();
      ctx.strokeStyle = `hsl(${this.stemHue}, 40%, 35%)`;
      ctx.lineWidth = 0.4;
      ctx.beginPath();
      ctx.moveTo(1, 0);
      ctx.lineTo(leaf.size * 0.85, 0);
      ctx.stroke();
      ctx.restore();
    }

    if (this.bloomPhase > 0.05) {
      const bloom = this.bloomPhase * (1 - w * 0.4);
      const ps = this.petalSize * bloom;
      ctx.save();
      ctx.translate(tipX, tipY);
      if (w > 0) ctx.rotate(w * w * 1.2 * (this.stemCurve > 0 ? 1 : -1));
      switch (this.type) {
        case 'daisy': case 'wild': this._drawDaisy(ctx, ps, bloom, time); break;
        case 'tulip': this._drawTulip(ctx, ps, bloom, time); break;
        case 'rose': this._drawRose(ctx, ps, bloom, time); break;
        case 'sunflower': this._drawSunflower(ctx, ps, bloom, time); break;
        case 'poppy': this._drawPoppy(ctx, ps, bloom, time); break;
        case 'bell': this._drawBell(ctx, ps, bloom, time); break;
      }
      ctx.restore();
    }
    ctx.restore();
  }

  _drawDaisy(ctx, ps, bloom, time) {
    const swayAngle = Math.sin(time * 0.8 + this.swayOffset) * 0.05;
    const step = TAU / this.petalCount;
    const fillColor = `hsla(${this.petalHue}, ${this.petalSat}%, ${this.petalLit}%, 0.88)`;
    const strokeColor = `hsla(${this.petalHue}, ${this.petalSat}%, ${this.petalLit - 20}%, 0.2)`;
    for (let i = 0; i < this.petalCount; i++) {
      ctx.save();
      ctx.rotate(i * step + swayAngle);
      ctx.fillStyle = fillColor;
      ctx.beginPath();
      ctx.moveTo(2, 0);
      ctx.bezierCurveTo(ps * 0.3, -ps * 0.3, ps * 0.8, -ps * 0.35, ps * 1.1, -ps * 0.05);
      ctx.bezierCurveTo(ps * 1.15, ps * 0.05, ps * 0.8, ps * 0.35, ps * 0.3, ps * 0.3);
      ctx.lineTo(2, 0);
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 0.4;
      ctx.beginPath();
      ctx.moveTo(3, 0);
      ctx.lineTo(ps * 0.9, 0);
      ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = this.centerColor;
    ctx.beginPath();
    ctx.arc(0, 0, this.centerSize * bloom, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(100,70,0,0.35)';
    const seedCount = Math.floor(this.centerSize * bloom * 1.5);
    for (let i = 0; i < seedCount; i++) {
      const sa = (i / seedCount) * TAU + 0.5;
      const sr = this.centerSize * bloom * (0.2 + (i % 3) * 0.2);
      ctx.beginPath();
      ctx.arc(Math.cos(sa) * sr, Math.sin(sa) * sr, 0.8 + bloom * 0.4, 0, TAU);
      ctx.fill();
    }
  }

  _drawTulip(ctx, ps, bloom) {
    for (let i = 0; i < this.petalCount; i++) {
      const a = (i / this.petalCount) * TAU;
      const spread = bloom * 0.35;
      ctx.save();
      ctx.rotate(a);
      const litShift = i % 2 === 0 ? 0 : 8;
      ctx.fillStyle = `hsla(${this.petalHue}, ${this.petalSat}%, ${this.petalLit + litShift}%, 0.9)`;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(ps * 0.25 * spread, -ps * 0.6, ps * 0.5, -ps * 1.2, ps * 0.1, -ps * 1.4);
      ctx.bezierCurveTo(-ps * 0.15, -ps * 1.2, -ps * 0.25 * spread, -ps * 0.5, 0, 0);
      ctx.fill();
      ctx.strokeStyle = `hsla(${this.petalHue}, ${this.petalSat}%, ${this.petalLit - 15}%, 0.15)`;
      ctx.lineWidth = 0.4;
      ctx.stroke();
      ctx.restore();
    }
  }

  _drawRose(ctx, ps, bloom) {
    const layers = 3;
    for (let layer = layers - 1; layer >= 0; layer--) {
      const layerScale = 0.5 + layer * 0.3;
      const layerRot = layer * 0.3;
      const count = Math.floor(this.petalCount / layers) + (layer === 0 ? 2 : 0);
      for (let i = 0; i < count; i++) {
        const a = (i / count) * TAU + layerRot;
        ctx.save();
        ctx.rotate(a);
        const litAdj = layer * 6;
        ctx.fillStyle = `hsla(${this.petalHue}, ${this.petalSat}%, ${this.petalLit - litAdj}%, 0.85)`;
        const rps = ps * layerScale;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(rps * 0.4, -rps * 0.3, rps * 0.7, -rps * 0.5, rps * 0.6, -rps * 0.05);
        ctx.bezierCurveTo(rps * 0.5, rps * 0.2, rps * 0.2, rps * 0.15, 0, 0);
        ctx.fill();
        ctx.restore();
      }
    }
    ctx.fillStyle = `hsla(${this.petalHue}, ${this.petalSat}%, ${this.petalLit - 15}%, 0.9)`;
    ctx.beginPath();
    ctx.arc(0, 0, ps * 0.12 * bloom, 0, TAU);
    ctx.fill();
  }

  _drawSunflower(ctx, ps, bloom, time) {
    const swayAngle = Math.sin(time * 0.5 + this.swayOffset) * 0.03;
    const step = TAU / this.petalCount;
    const halfStep = step / 2;
    const colors = [
      `hsla(${this.petalHue}, ${this.petalSat}%, ${this.petalLit}%, 0.9)`,
      `hsla(${this.petalHue}, ${this.petalSat}%, ${this.petalLit - 10}%, 0.9)`,
    ];
    for (let layer = 0; layer < 2; layer++) {
      const rot = layer * halfStep;
      ctx.fillStyle = colors[layer];
      for (let i = 0; i < this.petalCount; i++) {
        ctx.save();
        ctx.rotate(i * step + rot + swayAngle);
        ctx.beginPath();
        ctx.moveTo(2, 0);
        ctx.bezierCurveTo(ps * 0.3, -ps * 0.18, ps * 0.85, -ps * 0.15, ps * 1.3, 0);
        ctx.bezierCurveTo(ps * 0.85, ps * 0.15, ps * 0.3, ps * 0.18, 2, 0);
        ctx.fill();
        ctx.restore();
      }
    }
    const cr = this.centerSize * bloom * 1.2;
    const cg = ctx.createRadialGradient(0, 0, cr * 0.2, 0, 0, cr);
    cg.addColorStop(0, '#5a3a10');
    cg.addColorStop(0.5, '#3a2508');
    cg.addColorStop(1, '#2a1a05');
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(0, 0, cr, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(180,140,40,0.3)';
    const seeds = Math.floor(cr * 3);
    for (let i = 0; i < seeds; i++) {
      const sa = i * 2.4;
      const sr = cr * 0.15 * Math.sqrt(i / seeds) * 2.8;
      ctx.beginPath();
      ctx.arc(Math.cos(sa) * sr, Math.sin(sa) * sr, 0.8 + cr * 0.02, 0, TAU);
      ctx.fill();
    }
  }

  _drawPoppy(ctx, ps, bloom) {
    const step = TAU / this.petalCount;
    const fillColor = `hsla(${this.petalHue}, ${this.petalSat}%, ${this.petalLit}%, 0.88)`;
    for (let i = 0; i < this.petalCount; i++) {
      ctx.save();
      ctx.rotate(i * step);
      ctx.fillStyle = fillColor;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(ps * 0.5, -ps * 0.6, ps * 1.0, -ps * 0.7, ps * 1.1, -ps * 0.1);
      ctx.bezierCurveTo(ps * 1.1, ps * 0.3, ps * 0.6, ps * 0.6, 0, 0);
      ctx.fill();
      ctx.fillStyle = 'hsla(0, 0%, 8%, 0.4)';
      ctx.beginPath();
      ctx.arc(ps * 0.25, 0, ps * 0.18, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(0, 0, ps * 0.18 * bloom, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#4a6a20';
    ctx.beginPath();
    ctx.arc(0, 0, ps * 0.1 * bloom, 0, TAU);
    ctx.fill();
  }

  _drawBell(ctx, ps, bloom, time) {
    ctx.save();
    ctx.rotate(Math.sin(time * 0.6 + this.swayOffset) * 0.15);
    const bw = ps * 0.8 * bloom;
    const bh = ps * 1.3 * bloom;
    ctx.fillStyle = `hsla(${this.petalHue}, ${this.petalSat}%, ${this.petalLit}%, 0.85)`;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-bw * 0.3, bh * 0.2, -bw * 0.7, bh * 0.6, -bw * 0.6, bh);
    const scallops = 5;
    for (let i = 0; i <= scallops; i++) {
      const sx = -bw * 0.6 + (bw * 1.2) * (i / scallops);
      const sy = bh + Math.sin(i * Math.PI / scallops * 2) * ps * 0.12;
      ctx.lineTo(sx, sy);
    }
    ctx.bezierCurveTo(bw * 0.7, bh * 0.6, bw * 0.3, bh * 0.2, 0, 0);
    ctx.fill();
    ctx.strokeStyle = `hsla(${this.petalHue}, ${this.petalSat}%, ${this.petalLit - 18}%, 0.3)`;
    ctx.lineWidth = 0.5;
    ctx.stroke();
    const ig = ctx.createLinearGradient(0, 0, 0, bh);
    ig.addColorStop(0, 'rgba(0,0,0,0)');
    ig.addColorStop(0.7, `hsla(${this.petalHue}, ${this.petalSat}%, ${this.petalLit - 20}%, 0.3)`);
    ig.addColorStop(1, 'rgba(0,0,0,0.1)');
    ctx.fillStyle = ig;
    ctx.fill();
    ctx.strokeStyle = '#e8d060';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(0, bh * 0.4);
    ctx.lineTo(0, bh * 1.05);
    ctx.stroke();
    ctx.fillStyle = '#c8a020';
    ctx.beginPath();
    ctx.arc(0, bh * 1.05, 1.5, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

export function makeHillFlower(w, h, x, groundY, scale) {
  const f = new Flower(w, h);
  f.x = x;
  f.groundY = groundY;
  f.stemH = rand(8, 30) * scale;
  f.petalSize *= scale;
  f.centerSize *= scale;
  f.stemWidth *= scale;
  f.stemCurve *= scale;
  for (const lf of f.leafPositions) lf.size *= scale;
  return f;
}

/* ── Tree ── */
export class Tree {
  constructor(x, groundY, w, h) {
    this.x = x;
    this.groundY = groundY;
    this.screenW = w;
    this.screenH = h;
    this.trunkH = rand(140, 260);
    this.trunkW = rand(18, 35);
    this.canopyR = rand(80, 140);
    this.foliageLayers = [];
    const backCount = Math.floor(rand(7, 12));
    for (let i = 0; i < backCount; i++) {
      this.foliageLayers.push({ ox: rand(-0.75, 0.75) * this.canopyR, oy: rand(-0.7, 0.4) * this.canopyR, r: rand(0.35, 0.6) * this.canopyR, hue: 90 + rand(-15, 10), sat: 40 + rand(-5, 15), lit: 22 + rand(-3, 5), layer: 0, leafPhase: rand(0, TAU) });
    }
    const midCount = Math.floor(rand(8, 14));
    for (let i = 0; i < midCount; i++) {
      this.foliageLayers.push({ ox: rand(-0.7, 0.7) * this.canopyR, oy: rand(-0.7, 0.3) * this.canopyR, r: rand(0.28, 0.5) * this.canopyR, hue: 85 + rand(-10, 20), sat: 45 + rand(-5, 20), lit: 30 + rand(-3, 8), layer: 1, leafPhase: rand(0, TAU) });
    }
    const frontCount = Math.floor(rand(7, 11));
    for (let i = 0; i < frontCount; i++) {
      this.foliageLayers.push({ ox: rand(-0.65, 0.65) * this.canopyR, oy: rand(-0.6, 0.25) * this.canopyR, r: rand(0.2, 0.4) * this.canopyR, hue: 80 + rand(-8, 25), sat: 50 + rand(0, 25), lit: 36 + rand(0, 15), layer: 2, leafPhase: rand(0, TAU) });
    }
    this.barkLines = [];
    for (let i = 0; i < 5; i++) this.barkLines.push(rand(-5, 5));
    this.swayOffset = rand(0, TAU);
    this.perchPoints = [];
    for (let i = 0; i < 3; i++) {
      this.perchPoints.push({ ox: rand(-0.7, 0.7) * this.canopyR, oy: rand(-0.3, 0.5) * this.canopyR - this.trunkH + this.canopyR * 0.3, occupied: false });
    }
  }
  getPerchWorld(idx) {
    return { x: this.x + this.perchPoints[idx].ox, y: this.groundY + this.perchPoints[idx].oy };
  }
  draw(ctx, time) {
    const sway = Math.sin(time * 0.4 + this.swayOffset) * 3;
    const topX = this.x + sway;
    const topY = this.groundY - this.trunkH;

    ctx.fillStyle = '#5a3a1a';
    ctx.beginPath();
    ctx.moveTo(this.x - this.trunkW * 0.5, this.groundY);
    ctx.lineTo(this.x - this.trunkW * 0.6, this.groundY + 5);
    ctx.lineTo(this.x + this.trunkW * 0.6, this.groundY + 5);
    ctx.lineTo(this.x + this.trunkW * 0.5, this.groundY);
    ctx.lineTo(topX + this.trunkW * 0.25, topY + this.canopyR * 0.3);
    ctx.lineTo(topX - this.trunkW * 0.25, topY + this.canopyR * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(40,25,10,0.3)';
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 5; i++) {
      const by = this.groundY - this.trunkH * (i + 1) / 6;
      const bx = this.x + sway * (1 - (i + 1) / 6) * 0.5;
      ctx.beginPath();
      ctx.moveTo(bx - this.trunkW * 0.3, by);
      ctx.quadraticCurveTo(bx, by + this.barkLines[i], bx + this.trunkW * 0.3, by);
      ctx.stroke();
    }

    ctx.strokeStyle = '#4a2e12';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    const branchY = this.groundY - this.trunkH * 0.6;
    ctx.beginPath();
    ctx.moveTo(this.x + sway * 0.4, branchY);
    ctx.quadraticCurveTo(this.x - this.canopyR * 0.5, branchY - 20, this.x - this.canopyR * 0.7 + sway, branchY - 10);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(this.x + sway * 0.4, branchY - this.trunkH * 0.1);
    ctx.quadraticCurveTo(this.x + this.canopyR * 0.4, branchY - this.trunkH * 0.15 - 15, this.x + this.canopyR * 0.6 + sway, branchY - this.trunkH * 0.1 - 5);
    ctx.stroke();

    for (const f of this.foliageLayers) {
      const leafSway = Math.sin(time * 0.8 + f.leafPhase) * 2;
      const fx = topX + f.ox + leafSway;
      const fy = topY + f.oy;
      if (f.layer > 0) {
        ctx.fillStyle = `hsla(${f.hue}, ${f.sat}%, ${f.lit - 8}%, 0.2)`;
        ctx.beginPath();
        ctx.ellipse(fx + 2, fy + 3, f.r * 0.9, f.r * 0.7, 0, 0, TAU);
        ctx.fill();
      }
      ctx.fillStyle = `hsl(${f.hue}, ${f.sat}%, ${f.lit}%)`;
      ctx.beginPath();
      const bumps = 8;
      for (let i = 0; i <= bumps; i++) {
        const a = (i / bumps) * TAU;
        const bumpR = f.r * (0.85 + Math.sin(a * 3 + f.leafPhase) * 0.15);
        const bx = fx + Math.cos(a) * bumpR;
        const by = fy + Math.sin(a) * bumpR * 0.85;
        if (i === 0) ctx.moveTo(bx, by); else ctx.lineTo(bx, by);
      }
      ctx.closePath();
      ctx.fill();
      if (f.layer >= 1) {
        ctx.fillStyle = `hsla(${f.hue + 5}, ${f.sat + 5}%, ${f.lit + 6}%, 0.4)`;
        for (let i = 0; i < 4; i++) {
          const la = f.leafPhase + i * 1.7;
          const lr = f.r * 0.4;
          const lx = fx + Math.cos(la) * lr;
          const ly = fy + Math.sin(la) * lr * 0.8;
          ctx.beginPath();
          ctx.ellipse(lx, ly, f.r * 0.2, f.r * 0.12, la, 0, TAU);
          ctx.fill();
        }
      }
    }

    const hlGrad = ctx.createRadialGradient(topX - this.canopyR * 0.3, topY - this.canopyR * 0.3, 0, topX, topY, this.canopyR);
    hlGrad.addColorStop(0, 'rgba(160,220,80,0.12)');
    hlGrad.addColorStop(0.5, 'rgba(140,200,80,0.05)');
    hlGrad.addColorStop(1, 'rgba(140,200,80,0)');
    ctx.fillStyle = hlGrad;
    ctx.beginPath();
    ctx.arc(topX, topY, this.canopyR * 0.9, 0, TAU);
    ctx.fill();
  }
}
