import { TAU, rand, pick } from './utils.js';
import { windX, windY } from './wind.js';

/* ── Butterfly ── */
export class Butterfly {
  constructor(w, h) {
    this.screenW = w;
    this.screenH = h;
    this.reset(true);
  }
  reset(initial) {
    this.size = rand(16, 32);
    this.speed = rand(0.6, 2.0);
    this.wingPhase = rand(0, TAU);
    this.wingSpeed = rand(0.08, 0.14);
    this.hue1 = rand(0, 360);
    this.hue2 = this.hue1 + rand(20, 60);
    this.sat = rand(65, 100);
    this.lit = rand(50, 70);
    this.hasEyeSpots = Math.random() < 0.4;
    this.wanderPhase = rand(0, TAU);
    this.wanderFreq = rand(0.3, 0.8);
    this.baseSpeedX = rand(-0.3, 0.5);
    this.baseSpeedY = rand(-0.4, -0.1);
    this.resting = false;
    this.approaching = false;
    this.restTimer = 0;
    this.restDuration = rand(150, 500);
    this.restFlower = null;
    this.restCooldown = 0;
    if (initial) {
      this.x = rand(0, this.screenW);
      this.y = rand(this.screenH * 0.1, this.screenH * 0.75);
    } else {
      const side = Math.floor(rand(0, 4));
      if (side === 0) { this.x = -this.size * 3; this.y = rand(0, this.screenH * 0.7); }
      else if (side === 1) { this.x = this.screenW + this.size * 3; this.y = rand(0, this.screenH * 0.7); }
      else if (side === 2) { this.x = rand(0, this.screenW); this.y = -this.size * 3; }
      else { this.x = rand(0, this.screenW); this.y = this.screenH + this.size * 3; }
    }
  }
  tryRest(flowersArr) {
    if (this.resting || this.approaching || this.restCooldown > 0 || Math.random() > 0.004) return;
    for (const f of flowersArr) {
      if (f.bloomPhase < 0.7 || f.dead) continue;
      const tipX = f.x + f.stemCurve * 0.3;
      const tipY = f.groundY - f.stemH;
      const dx = tipX - this.x, dy = tipY - this.y;
      if (dx * dx + dy * dy < 150 * 150) {
        this.approaching = true;
        this.restFlower = f;
        return;
      }
    }
  }
  update(speedMul, time) {
    this.restCooldown = Math.max(0, this.restCooldown - speedMul);
    if (this.resting) {
      this.restTimer += speedMul;
      this.wingPhase += this.wingSpeed * 0.1 * speedMul;
      if (this.restFlower) {
        const sway = Math.sin(time * 1.0 + this.restFlower.swayOffset) * 6 * (this.restFlower.stemH / 140);
        this.x = this.restFlower.x + sway + this.restFlower.stemCurve * 0.3;
        this.y = this.restFlower.groundY - this.restFlower.stemH - this.restFlower.petalSize * 0.3;
        if (this.restFlower.dead) { this.resting = false; this.approaching = false; this.restCooldown = rand(100, 300); }
      }
      if (this.restTimer > this.restDuration) { this.resting = false; this.approaching = false; this.restCooldown = rand(100, 300); this.restDuration = rand(150, 500); }
      return;
    }
    if (this.approaching && this.restFlower) {
      if (this.restFlower.dead) { this.approaching = false; this.restFlower = null; this.restCooldown = rand(100, 300); }
      else {
        const tipX = this.restFlower.x + this.restFlower.stemCurve * 0.3;
        const tipY = this.restFlower.groundY - this.restFlower.stemH - this.restFlower.petalSize * 0.3;
        const dx = tipX - this.x, dy = tipY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 3) {
          this.approaching = false;
          this.resting = true;
          this.restTimer = 0;
          this.x = tipX;
          this.y = tipY;
        } else {
          const approach = Math.min(1.8, dist * 0.05) * speedMul;
          this.x += (dx / dist) * approach;
          this.y += (dy / dist) * approach;
        }
        this.wingPhase += this.wingSpeed * 0.5 * speedMul;
      }
      return;
    }
    const s = this.speed * speedMul;
    this.wanderPhase += 0.015 * speedMul;
    this.x += (this.baseSpeedX + Math.sin(this.wanderPhase * this.wanderFreq) * 1.2 + windX * 0.3) * s;
    this.y += (this.baseSpeedY + Math.cos(this.wanderPhase * this.wanderFreq * 0.7) * 0.8 + windY * 0.2) * s;
    this.wingPhase += this.wingSpeed * Math.max(0.5, speedMul);
    const margin = this.size * 4;
    if (this.x < -margin || this.x > this.screenW + margin || this.y < -margin || this.y > this.screenH + margin) this.reset(false);
  }
  drawForewing(ctx, s, flapScale, mirror) {
    const fw = s * 1.4, fh = s * 1.6;
    ctx.save();
    if (mirror) ctx.scale(-1, 1);
    ctx.scale(flapScale, 1);
    const fwPath = () => {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(fw * 0.15, -fh * 0.6, fw * 0.5, -fh * 0.95, fw * 0.75, -fh * 0.8);
      ctx.bezierCurveTo(fw * 0.95, -fh * 0.6, fw * 1.0, -fh * 0.3, fw * 0.85, -fh * 0.05);
      ctx.bezierCurveTo(fw * 0.6, fh * 0.05, fw * 0.25, fh * 0.02, 0, 0);
      ctx.closePath();
    };
    fwPath();
    const grad = ctx.createLinearGradient(0, 0, fw * 0.5, -fh * 0.8);
    grad.addColorStop(0, `hsla(${this.hue1}, ${this.sat}%, ${this.lit}%, 0.9)`);
    grad.addColorStop(0.5, `hsla(${this.hue1}, ${this.sat}%, ${this.lit + 8}%, 0.85)`);
    grad.addColorStop(1, `hsla(${this.hue1}, ${this.sat - 10}%, ${this.lit - 5}%, 0.8)`);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = `hsla(${this.hue1}, ${this.sat}%, ${this.lit - 25}%, 0.5)`;
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.save();
    fwPath();
    ctx.clip();
    ctx.strokeStyle = `hsla(${this.hue1}, ${this.sat - 20}%, ${this.lit - 15}%, 0.25)`;
    ctx.lineWidth = 0.6;
    for (let i = 0; i < 6; i++) {
      const t = (i + 1) / 7;
      const vx = fw * (0.3 + t * 0.55), vy = -fh * (0.2 + t * 0.6);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(vx * 0.4, vy * 0.5, vx, vy);
      ctx.stroke();
    }
    if (this.hasEyeSpots) {
      ctx.fillStyle = `hsla(${this.hue1 + 180}, 30%, 90%, 0.5)`;
      ctx.beginPath();
      ctx.arc(fw * 0.55, -fh * 0.55, s * 0.13, 0, TAU);
      ctx.fill();
      ctx.fillStyle = `hsla(${this.hue1 + 180}, 50%, 15%, 0.6)`;
      ctx.beginPath();
      ctx.arc(fw * 0.55, -fh * 0.55, s * 0.06, 0, TAU);
      ctx.fill();
    }
    const sheen = ctx.createRadialGradient(fw * 0.3, -fh * 0.5, 0, fw * 0.3, -fh * 0.5, fw * 0.5);
    sheen.addColorStop(0, 'rgba(255,255,255,0.15)');
    sheen.addColorStop(1, 'rgba(255,255,255,0)');
    fwPath();
    ctx.fillStyle = sheen;
    ctx.fill();
    ctx.restore();
    ctx.restore();
  }
  drawHindwing(ctx, s, flapScale, mirror) {
    const hw = s * 1.1, hh = s * 1.0;
    ctx.save();
    if (mirror) ctx.scale(-1, 1);
    ctx.scale(flapScale, 1);
    const hwPath = () => {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(hw * 0.4, -hh * 0.1, hw * 0.9, -hh * 0.15, hw * 0.85, hh * 0.2);
      ctx.bezierCurveTo(hw * 0.8, hh * 0.55, hw * 0.5, hh * 0.75, hw * 0.15, hh * 0.6);
      ctx.bezierCurveTo(hw * 0.05, hh * 0.35, 0, hh * 0.15, 0, 0);
      ctx.closePath();
    };
    hwPath();
    ctx.fillStyle = `hsla(${this.hue2}, ${this.sat}%, ${this.lit + 5}%, 0.82)`;
    ctx.fill();
    ctx.strokeStyle = `hsla(${this.hue2}, ${this.sat}%, ${this.lit - 20}%, 0.45)`;
    ctx.lineWidth = 0.7;
    ctx.stroke();
    ctx.save();
    hwPath();
    ctx.clip();
    ctx.strokeStyle = `hsla(${this.hue2}, ${this.sat - 20}%, ${this.lit - 10}%, 0.2)`;
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 4; i++) {
      const t = (i + 1) / 5;
      const vx = hw * (0.2 + t * 0.5), vy = hh * (0.1 + t * 0.4);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(vx * 0.6, vy * 0.3, vx, vy);
      ctx.stroke();
    }
    ctx.restore();
    ctx.restore();
  }
  draw(ctx) {
    const s = this.size;
    const flapScale = 0.35 + 0.65 * Math.abs(Math.cos(this.wingPhase));
    const bodyTilt = Math.sin(this.wanderPhase * 0.5) * 0.12;
    const bob = Math.sin(this.wingPhase * 2) * s * 0.04;
    ctx.save();
    ctx.translate(this.x, this.y + bob);
    ctx.rotate(bodyTilt);
    ctx.save();
    ctx.translate(0, s * 0.05);
    this.drawHindwing(ctx, s, flapScale, false);
    this.drawHindwing(ctx, s, flapScale, true);
    ctx.restore();
    ctx.save();
    ctx.translate(0, -s * 0.1);
    this.drawForewing(ctx, s, flapScale, false);
    this.drawForewing(ctx, s, flapScale, true);
    ctx.restore();
    const bodyGrad = ctx.createLinearGradient(0, -s * 0.5, 0, s * 0.5);
    bodyGrad.addColorStop(0, '#1a0e04');
    bodyGrad.addColorStop(0.5, '#2e1a08');
    bodyGrad.addColorStop(1, '#1a0e04');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.06, s * 0.45, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#2a1808';
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.15, s * 0.07, s * 0.1, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#1a0e04';
    ctx.beginPath();
    ctx.arc(0, -s * 0.5, s * 0.08, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#3a2a10';
    ctx.beginPath();
    ctx.arc(-s * 0.05, -s * 0.52, s * 0.03, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(s * 0.05, -s * 0.52, s * 0.03, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#1a0e04';
    ctx.lineWidth = 0.7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-s * 0.02, -s * 0.56);
    ctx.bezierCurveTo(-s * 0.1, -s * 0.75, -s * 0.22, -s * 0.9, -s * 0.28, -s * 0.95);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(s * 0.02, -s * 0.56);
    ctx.bezierCurveTo(s * 0.1, -s * 0.75, s * 0.22, -s * 0.9, s * 0.28, -s * 0.95);
    ctx.stroke();
    ctx.fillStyle = '#1a0e04';
    ctx.beginPath(); ctx.arc(-s * 0.28, -s * 0.95, s * 0.025, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(s * 0.28, -s * 0.95, s * 0.025, 0, TAU); ctx.fill();
    ctx.restore();
  }
}

/* ── Bird ── */
export class Bird {
  constructor(w, h) {
    this.screenW = w;
    this.screenH = h;
    this.reset(true);
  }
  reset(initial) {
    this.size = rand(20, 40);
    this.speed = rand(1.5, 3.5);
    this.wingPhase = rand(0, TAU);
    this.wingSpeed = rand(0.06, 0.1);
    this.wanderPhase = rand(0, TAU);
    const palette = pick([
      { body: '#3a3632', breast: '#c85a3a', wing: '#4a4540' },
      { body: '#2848a8', breast: '#e8e0d0', wing: '#3058b8' },
      { body: '#e8c820', breast: '#e8c820', wing: '#5a7a20' },
      { body: '#4a4a4a', breast: '#d8d0c8', wing: '#555550' },
      { body: '#c83030', breast: '#c83030', wing: '#8a2020' },
    ]);
    this.bodyColor = palette.body;
    this.breastColor = palette.breast;
    this.wingColor = palette.wing;
    this.glideTimer = 0;
    this.isGliding = false;
    this.state = 'flying';
    this.perchTarget = null;
    this.perchTree = null;
    this.perchIdx = -1;
    this.perchTimer = 0;
    this.perchDuration = rand(200, 600);
    this.landTimer = 0;
    if (initial) {
      this.x = rand(0, this.screenW);
      this.y = rand(this.screenH * 0.05, this.screenH * 0.45);
    } else {
      this.x = rand(0, 1) < 0.5 ? -this.size * 4 : this.screenW + this.size * 4;
      this.y = rand(this.screenH * 0.05, this.screenH * 0.4);
      this.speed = Math.abs(this.speed) * (this.x < 0 ? 1 : -1);
    }
  }
  tryPerch(treesArr) {
    if (this.state !== 'flying' || Math.random() > 0.003) return;
    // Try ground landing
    if (Math.random() < 0.4) {
      const groundY = this.screenH * 0.85 + Math.sin(this.x * 0.005 + 4) * 20 + Math.sin(this.x * 0.015) * 8;
      if (this.y < groundY - 30) {
        this.state = 'landing';
        this.perchTarget = { x: this.x + (this.speed > 0 ? 1 : -1) * rand(20, 80), y: groundY - this.size * 0.3 };
        this.perchTree = null;
        this.perchIdx = -1;
        return;
      }
    }
    for (const tree of treesArr) {
      for (let i = 0; i < tree.perchPoints.length; i++) {
        if (!tree.perchPoints[i].occupied) {
          const p = tree.getPerchWorld(i);
          const dx = p.x - this.x, dy = p.y - this.y;
          if (Math.abs(dx) < 300 && Math.abs(dy) < 300) {
            this.state = 'landing';
            this.perchTarget = p;
            this.perchTree = tree;
            this.perchIdx = i;
            tree.perchPoints[i].occupied = true;
            return;
          }
        }
      }
    }
  }
  update(speedMul) {
    if (this.state === 'perched') {
      this.perchTimer += speedMul;
      this.wingPhase = 0;
      if (this.perchTimer > this.perchDuration) {
        this.state = 'takeoff';
        this.perchTimer = 0;
        if (this.perchTree && this.perchIdx >= 0) this.perchTree.perchPoints[this.perchIdx].occupied = false;
        this.perchTree = null;
        this.perchIdx = -1;
        const dir = this.speed > 0 ? 1 : -1;
        this.speed = dir * rand(1.5, 3.5);
      }
      return;
    }
    if (this.state === 'landing' && this.perchTarget) {
      const dx = this.perchTarget.x - this.x, dy = this.perchTarget.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 5) { this.state = 'perched'; this.x = this.perchTarget.x; this.y = this.perchTarget.y; this.perchTimer = 0; return; }
      const approach = Math.min(2.5, dist * 0.04) * speedMul;
      this.x += (dx / dist) * approach;
      this.y += (dy / dist) * approach;
      this.speed = dx > 0 ? Math.abs(this.speed) : -Math.abs(this.speed);
      this.wingPhase += this.wingSpeed * 0.7 * speedMul;
      return;
    }
    if (this.state === 'takeoff') {
      this.landTimer += speedMul;
      this.y -= 1.5 * speedMul;
      this.wingPhase += this.wingSpeed * 1.5 * speedMul;
      if (this.landTimer > 40) { this.state = 'flying'; this.landTimer = 0; }
    }
    const s = Math.abs(this.speed) * speedMul;
    this.wanderPhase += 0.01 * speedMul;
    const dir = this.speed > 0 ? 1 : -1;
    this.x += (dir * 2.0 + windX * 0.15) * s;
    this.y += (Math.sin(this.wanderPhase * 0.8) * 0.5 + windY * 0.1) * s;
    this.glideTimer += speedMul;
    if (!this.isGliding && this.glideTimer > rand(80, 200)) { this.isGliding = true; this.glideTimer = 0; }
    if (this.isGliding && this.glideTimer > rand(30, 60)) { this.isGliding = false; this.glideTimer = 0; }
    if (!this.isGliding) this.wingPhase += this.wingSpeed * Math.max(0.5, speedMul);
    const margin = this.size * 5;
    if (this.x < -margin || this.x > this.screenW + margin || this.y < -margin || this.y > this.screenH + margin) {
      if (this.perchTree && this.perchIdx >= 0) this.perchTree.perchPoints[this.perchIdx].occupied = false;
      this.reset(false);
    }
  }
  drawWing(ctx, s, flapAngle, mirror) {
    const wingLen = s * 1.4, wingW = s * 0.5;
    ctx.save();
    if (mirror) ctx.scale(-1, 1);
    ctx.rotate(flapAngle);
    const grad = ctx.createLinearGradient(0, 0, -wingLen, -wingW * 0.3);
    grad.addColorStop(0, this.wingColor);
    grad.addColorStop(0.6, this.bodyColor);
    grad.addColorStop(1, '#2a2520');
    const wingPath = () => {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-wingLen * 0.2, -wingW * 0.7, -wingLen * 0.5, -wingW * 1.0, -wingLen, -wingW * 0.4);
      ctx.bezierCurveTo(-wingLen * 0.95, -wingW * 0.1, -wingLen * 0.8, wingW * 0.05, -wingLen * 0.65, wingW * 0.1);
      ctx.bezierCurveTo(-wingLen * 0.4, wingW * 0.15, -wingLen * 0.15, wingW * 0.08, 0, 0);
      ctx.closePath();
    };
    wingPath();
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 0.6;
    ctx.stroke();
    ctx.save();
    wingPath();
    ctx.clip();
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 7; i++) {
      const t = (i + 1) / 8;
      const angle = -0.7 - t * 1.0;
      const len = wingLen * (0.4 + t * 0.5);
      ctx.beginPath();
      ctx.moveTo(-s * 0.02 * t, s * 0.01 * t);
      ctx.lineTo(Math.cos(angle) * len, Math.sin(angle) * len);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = s * 0.02;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.01);
    ctx.bezierCurveTo(-wingLen * 0.2, -wingW * 0.6, -wingLen * 0.5, -wingW * 0.9, -wingLen * 0.9, -wingW * 0.4);
    ctx.stroke();
    ctx.restore();
    ctx.restore();
  }
  draw(ctx) {
    const s = this.size;
    const dir = this.speed > 0 ? 1 : -1;
    const perched = this.state === 'perched';
    const flapAngle = perched ? 0.4 : (this.isGliding ? -0.15 : Math.sin(this.wingPhase) * 0.45);
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(dir, 1);
    if (!perched) {
      ctx.save();
      ctx.translate(-s * 0.1, -s * 0.15);
      this.drawWing(ctx, s, -0.2 + flapAngle, false);
      ctx.restore();
      ctx.save();
      ctx.translate(s * 0.1, -s * 0.15);
      this.drawWing(ctx, s, -0.2 + flapAngle, true);
      ctx.restore();
    }
    const bodyGrad = ctx.createRadialGradient(-s * 0.05, -s * 0.05, 0, 0, 0, s * 0.4);
    bodyGrad.addColorStop(0, this.breastColor);
    bodyGrad.addColorStop(1, this.bodyColor);
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.2, s * 0.3, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = this.bodyColor;
    ctx.beginPath();
    ctx.arc(s * 0.15, -s * 0.28, s * 0.14, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(s * 0.22, -s * 0.3, s * 0.04, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(s * 0.23, -s * 0.3, s * 0.025, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#d4a030';
    ctx.beginPath();
    ctx.moveTo(s * 0.28, -s * 0.28);
    ctx.lineTo(s * 0.45, -s * 0.25);
    ctx.lineTo(s * 0.28, -s * 0.22);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = this.wingColor;
    ctx.beginPath();
    ctx.moveTo(-s * 0.15, s * 0.15);
    ctx.bezierCurveTo(-s * 0.3, s * 0.3, -s * 0.5, s * 0.35, -s * 0.55, s * 0.25);
    ctx.bezierCurveTo(-s * 0.45, s * 0.2, -s * 0.3, s * 0.1, -s * 0.15, s * 0.05);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 0.4;
    for (let i = 0; i < 3; i++) {
      const t = (i + 1) / 4;
      ctx.beginPath();
      ctx.moveTo(-s * 0.15, s * 0.1);
      ctx.lineTo(-s * (0.3 + t * 0.2), s * (0.2 + t * 0.08));
      ctx.stroke();
    }
    ctx.restore();
  }
}

/* ── Bee ── */
export class Bee {
  constructor(w, h) {
    this.screenW = w;
    this.screenH = h;
    this.reset(true);
  }
  reset(initial) {
    this.size = rand(10, 18);
    this.speed = rand(1.5, 3.0);
    this.wingPhase = rand(0, TAU);
    this.wingSpeed = rand(0.25, 0.4);
    this.wanderPhase = rand(0, TAU);
    this.buzzOffset = rand(0, TAU);
    this.resting = false;
    this.restTimer = 0;
    this.restDuration = rand(80, 250);
    this.restFlower = null;
    this.restCooldown = 0;
    this.targetFlower = null;
    this._restOffsetX = 0;
    const groundLevel = this.screenH * 0.85;
    if (initial) {
      this.x = rand(0, this.screenW);
      this.y = rand(groundLevel - 80, groundLevel);
    } else {
      this.x = rand(0, 1) < 0.5 ? -this.size * 3 : this.screenW + this.size * 3;
      this.y = rand(groundLevel - 80, groundLevel);
    }
  }
  tryRest(flowersArr) {
    if (this.resting || this.restCooldown > 0) return;
    if (!this.targetFlower && Math.random() < 0.015) {
      for (const f of flowersArr) {
        if (f.bloomPhase < 0.7 || f.dead) continue;
        const dx = f.x - this.x, dy = (f.groundY - f.stemH) - this.y;
        if (dx * dx + dy * dy < 250 * 250) { this.targetFlower = f; break; }
      }
    }
    if (this.targetFlower && !this.targetFlower.dead) {
      const tipX = this.targetFlower.x + this.targetFlower.stemCurve * 0.3;
      const tipY = this.targetFlower.groundY - this.targetFlower.stemH;
      const dx = tipX - this.x, dy = tipY - this.y;
      if (dx * dx + dy * dy < 15 * 15) {
        this.resting = true; this.restTimer = 0; this.restFlower = this.targetFlower; this.targetFlower = null;
        this._restOffsetX = rand(-this.restFlower.petalSize * 0.3, this.restFlower.petalSize * 0.3);
        this.x = tipX + this._restOffsetX;
        this.y = tipY - this.restFlower.petalSize * 0.2;
      }
    }
  }
  update(speedMul, time) {
    this.restCooldown = Math.max(0, this.restCooldown - speedMul);
    if (this.resting) {
      this.restTimer += speedMul;
      this.wingPhase += this.wingSpeed * 0.15 * speedMul;
      if (this.restFlower) {
        const sway = Math.sin((time || 0) * 1.0 + this.restFlower.swayOffset) * 6 * (this.restFlower.stemH / 140);
        this.x = this.restFlower.x + sway + this.restFlower.stemCurve * 0.3 + this._restOffsetX;
        this.y = this.restFlower.groundY - this.restFlower.stemH - this.restFlower.petalSize * 0.2;
        if (this.restFlower.dead) { this.resting = false; this.restCooldown = rand(60, 150); }
      }
      if (this.restTimer > this.restDuration) { this.resting = false; this.restCooldown = rand(60, 150); this.restDuration = rand(80, 250); }
      return;
    }
    const s = this.speed * speedMul;
    this.wanderPhase += 0.02 * speedMul;
    this.wingPhase += this.wingSpeed * speedMul;
    if (this.targetFlower && (this.targetFlower.dead || this.targetFlower.wiltProgress > 0.5)) this.targetFlower = null;
    if (this.targetFlower) {
      const tx = this.targetFlower.x + this.targetFlower.stemCurve * 0.3;
      const ty = this.targetFlower.groundY - this.targetFlower.stemH;
      const dx = tx - this.x, dy = ty - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 3) {
        this.x += (dx / dist) * s * 1.8 + Math.sin(this.wanderPhase * 3) * s * 0.4;
        this.y += (dy / dist) * s * 1.8 + Math.sin(this.wanderPhase * 4 + this.buzzOffset) * s * 0.3;
      }
    } else {
      this.x += (Math.sin(this.wanderPhase * 1.3) * 1.5 + windX * 0.2) * s;
      this.y += Math.sin(this.wanderPhase * 1.7 + this.buzzOffset) * 0.5 * s;
    }
    const groundLevel = this.screenH * 0.85;
    this.y = Math.max(groundLevel - 100, Math.min(groundLevel + 5, this.y));
    const margin = this.size * 5;
    if (this.x < -margin || this.x > this.screenW + margin) this.reset(false);
  }
  draw(ctx) {
    const s = this.size;
    const flapAngle = Math.sin(this.wingPhase) * 0.5;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.save();
    ctx.rotate(-0.3 + flapAngle);
    ctx.fillStyle = 'rgba(200, 220, 255, 0.45)';
    ctx.strokeStyle = 'rgba(150, 180, 220, 0.4)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.ellipse(-s * 0.5, -s * 0.3, s * 0.7, s * 0.3, -0.3, 0, TAU);
    ctx.fill(); ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.scale(-1, 1);
    ctx.rotate(-0.3 + flapAngle);
    ctx.fillStyle = 'rgba(200, 220, 255, 0.45)';
    ctx.strokeStyle = 'rgba(150, 180, 220, 0.4)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.ellipse(-s * 0.5, -s * 0.3, s * 0.7, s * 0.3, -0.3, 0, TAU);
    ctx.fill(); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#1a1000';
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.35, s * 0.55, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#f5c800';
    for (let i = 0; i < 3; i++) {
      const sy = -s * 0.3 + i * s * 0.22;
      ctx.beginPath();
      const sw = s * 0.33 * (1 - Math.abs(sy) / (s * 0.55));
      ctx.ellipse(0, sy, Math.max(2, sw), s * 0.08, 0, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = '#1a1000';
    ctx.beginPath();
    ctx.arc(0, -s * 0.55, s * 0.18, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-s * 0.08, -s * 0.58, s * 0.05, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(s * 0.08, -s * 0.58, s * 0.05, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#1a1000';
    ctx.beginPath();
    ctx.moveTo(-s * 0.04, s * 0.55);
    ctx.lineTo(0, s * 0.72);
    ctx.lineTo(s * 0.04, s * 0.55);
    ctx.fill();
    ctx.restore();
  }
}

/* ── Ladybug ── */
export class Ladybug {
  constructor(w, h) {
    this.screenW = w;
    this.screenH = h;
    this.reset(true);
  }
  reset(initial) {
    this.size = rand(8, 15);
    this.speed = rand(0.4, 1.2);
    this.wanderPhase = rand(0, TAU);
    this.spotCount = Math.floor(rand(3, 8));
    this.spots = [];
    for (let i = 0; i < this.spotCount; i++) this.spots.push({ x: rand(-0.35, 0.35), y: rand(-0.35, 0.4), r: rand(0.06, 0.12) });
    const groundLevel = this.screenH * 0.85;
    if (initial) {
      this.x = rand(0, this.screenW);
      this.y = rand(groundLevel - 60, groundLevel + 10);
    } else {
      this.x = rand(0, 1) < 0.5 ? -this.size * 3 : this.screenW + this.size * 3;
      this.y = rand(groundLevel - 60, groundLevel + 10);
    }
    this.wingPhase = rand(0, TAU);
    this.wingSpeed = rand(0.12, 0.2);
    this.resting = false;
    this.restTimer = 0;
    this.restDuration = rand(200, 600);
    this.restFlower = null;
    this.restCooldown = 0;
    this.targetFlower = null;
  }
  tryRest(flowersArr) {
    if (this.resting || this.restCooldown > 0) return;
    if (!this.targetFlower && Math.random() < 0.01) {
      for (const f of flowersArr) {
        if (f.bloomPhase < 0.7 || f.dead) continue;
        const dx = f.x - this.x, dy = (f.groundY - f.stemH) - this.y;
        if (dx * dx + dy * dy < 200 * 200) { this.targetFlower = f; break; }
      }
    }
    if (this.targetFlower && !this.targetFlower.dead) {
      const tipX = this.targetFlower.x + this.targetFlower.stemCurve * 0.3;
      const tipY = this.targetFlower.groundY - this.targetFlower.stemH;
      const dx = tipX - this.x, dy = tipY - this.y;
      if (dx * dx + dy * dy < 15 * 15) {
        this.resting = true; this.restTimer = 0; this.restFlower = this.targetFlower; this.targetFlower = null;
        this.x = tipX + rand(-this.restFlower.petalSize * 0.4, this.restFlower.petalSize * 0.4);
        this.y = tipY;
      }
    }
  }
  update(speedMul, time) {
    this.restCooldown = Math.max(0, this.restCooldown - speedMul);
    if (this.resting) {
      this.restTimer += speedMul;
      if (this.restFlower) {
        const sway = Math.sin((time || 0) * 1.0 + this.restFlower.swayOffset) * 6 * (this.restFlower.stemH / 140);
        this.x = this.restFlower.x + sway + this.restFlower.stemCurve * 0.3 + rand(-0.2, 0.2);
        this.y = this.restFlower.groundY - this.restFlower.stemH;
        if (this.restFlower.dead) { this.resting = false; this.restCooldown = rand(100, 300); }
      }
      if (this.restTimer > this.restDuration) { this.resting = false; this.restCooldown = rand(100, 300); this.restDuration = rand(200, 600); }
      return;
    }
    const s = this.speed * speedMul;
    this.wanderPhase += 0.012 * speedMul;
    this.wingPhase += this.wingSpeed * speedMul;
    if (this.targetFlower && (this.targetFlower.dead || this.targetFlower.wiltProgress > 0.5)) this.targetFlower = null;
    if (this.targetFlower) {
      const tx = this.targetFlower.x + this.targetFlower.stemCurve * 0.3;
      const ty = this.targetFlower.groundY - this.targetFlower.stemH;
      const dx = tx - this.x, dy = ty - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 3) {
        this.x += (dx / dist) * s * 1.5 + Math.sin(this.wanderPhase) * s * 0.3;
        this.y += (dy / dist) * s * 1.5 + Math.cos(this.wanderPhase * 0.7) * s * 0.2;
      }
    } else {
      this.x += (Math.sin(this.wanderPhase * 0.8) * 0.6 + windX * 0.15) * s;
      this.y += Math.cos(this.wanderPhase * 0.6) * 0.2 * s;
    }
    const groundLevel = this.screenH * 0.85;
    this.y = Math.max(groundLevel - 80, Math.min(groundLevel + 15, this.y));
    const margin = this.size * 5;
    if (this.x < -margin || this.x > this.screenW + margin) this.reset(false);
  }
  draw(ctx) {
    const s = this.size;
    const flapAngle = Math.sin(this.wingPhase) * 0.15;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.fillStyle = 'rgba(180, 160, 140, 0.4)';
    ctx.save();
    ctx.rotate(-0.2 + flapAngle);
    ctx.beginPath();
    ctx.ellipse(-s * 0.4, -s * 0.1, s * 0.5, s * 0.2, -0.2, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.scale(-1, 1);
    ctx.rotate(-0.2 + flapAngle);
    ctx.beginPath();
    ctx.ellipse(-s * 0.4, -s * 0.1, s * 0.5, s * 0.2, -0.2, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#cc2200';
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.45, s * 0.5, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#880000';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.strokeStyle = '#1a0800';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.5);
    ctx.lineTo(0, s * 0.5);
    ctx.stroke();
    ctx.fillStyle = '#1a0800';
    for (const sp of this.spots) {
      ctx.beginPath();
      ctx.arc(sp.x * s, sp.y * s, sp.r * s, 0, TAU);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(0, -s * 0.52, s * 0.2, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#1a0800';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(-s * 0.05, -s * 0.65);
    ctx.lineTo(-s * 0.2, -s * 0.85);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(s * 0.05, -s * 0.65);
    ctx.lineTo(s * 0.2, -s * 0.85);
    ctx.stroke();
    ctx.restore();
  }
}

/* ── Dragonfly ── */
export class Dragonfly {
  constructor(w, h) {
    this.screenW = w;
    this.screenH = h;
    this.reset(true);
  }
  reset(initial) {
    this.size = rand(18, 30);
    this.speed = rand(2.0, 4.0);
    this.wingPhase = rand(0, TAU);
    this.wingSpeed = rand(0.2, 0.35);
    this.bodyHue = pick([180, 200, 220, 140, 280]);
    this.wanderPhase = rand(0, TAU);
    if (initial) {
      this.x = rand(0, this.screenW);
      this.y = rand(this.screenH * 0.55, this.screenH * 0.8);
    } else {
      this.x = rand(0, 1) < 0.5 ? -this.size * 4 : this.screenW + this.size * 4;
      this.y = rand(this.screenH * 0.55, this.screenH * 0.8);
    }
  }
  update(speedMul) {
    const s = this.speed * speedMul;
    this.wanderPhase += 0.018 * speedMul;
    this.x += (Math.sin(this.wanderPhase * 0.5) * 2.5 + windX * 0.25) * s;
    this.y += Math.sin(this.wanderPhase * 1.2) * 0.8 * s;
    this.y = Math.max(this.screenH * 0.45, Math.min(this.screenH * 0.85, this.y));
    this.wingPhase += this.wingSpeed * speedMul;
    const margin = this.size * 5;
    if (this.x < -margin || this.x > this.screenW + margin) this.reset(false);
  }
  draw(ctx) {
    const s = this.size;
    const flapAngle = Math.sin(this.wingPhase) * 0.35;
    ctx.save();
    ctx.translate(this.x, this.y);
    for (let pair = 0; pair < 2; pair++) {
      const pairOffset = pair * s * 0.2;
      const pairFlap = flapAngle * (pair === 0 ? 1 : 0.8);
      for (let side = -1; side <= 1; side += 2) {
        ctx.save();
        ctx.translate(0, -s * 0.1 + pairOffset);
        ctx.scale(side, 1);
        ctx.rotate(-0.15 + pairFlap);
        ctx.fillStyle = `rgba(180, 210, 240, ${0.3 + pair * 0.05})`;
        ctx.strokeStyle = 'rgba(100, 140, 180, 0.35)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.ellipse(-s * 0.8, 0, s * 0.9, s * 0.18, -0.1, 0, TAU);
        ctx.fill(); ctx.stroke();
        ctx.strokeStyle = 'rgba(100, 140, 180, 0.2)';
        ctx.lineWidth = 0.4;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-s * 1.5, 0);
        ctx.stroke();
        ctx.restore();
      }
    }
    ctx.fillStyle = `hsl(${this.bodyHue}, 70%, 40%)`;
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.08, s * 0.55, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = `hsl(${this.bodyHue}, 70%, 35%)`;
    ctx.lineWidth = s * 0.07;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, s * 0.5);
    ctx.lineTo(0, s * 1.4);
    ctx.stroke();
    ctx.fillStyle = `hsl(${this.bodyHue}, 60%, 30%)`;
    ctx.beginPath();
    ctx.arc(0, -s * 0.55, s * 0.12, 0, TAU);
    ctx.fill();
    ctx.fillStyle = `hsl(${this.bodyHue}, 80%, 50%)`;
    ctx.beginPath();
    ctx.arc(-s * 0.1, -s * 0.58, s * 0.07, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(s * 0.1, -s * 0.58, s * 0.07, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

/* ── Squirrel ── */
export class Squirrel {
  constructor(w, h) {
    this.screenW = w;
    this.screenH = h;
    this.reset(true);
  }
  reset(initial) {
    this.size = rand(28, 42);
    this.speed = rand(0.8, 2.0);
    this.dir = Math.random() < 0.5 ? 1 : -1;
    this.runPhase = rand(0, TAU);
    const gx = initial ? rand(50, this.screenW - 50) : 0;
    this.groundY = this.screenH * 0.85 + Math.sin(gx * 0.005 + 4) * 20 + Math.sin(gx * 0.015) * 8;
    this.tailPhase = rand(0, TAU);
    this.x = initial ? rand(50, this.screenW - 50) : (this.dir > 0 ? -this.size * 3 : this.screenW + this.size * 3);
    this.pauseTimer = 0;
    this.isPaused = false;
    this.pauseDuration = rand(40, 120);
    this.runDuration = rand(60, 200);
  }
  update(speedMul) {
    this.runPhase += 0.15 * speedMul;
    this.tailPhase += 0.06 * speedMul;
    this.pauseTimer += speedMul;
    if (this.isPaused) {
      if (this.pauseTimer > this.pauseDuration) { this.isPaused = false; this.pauseTimer = 0; this.runDuration = rand(60, 200); if (Math.random() < 0.3) this.dir *= -1; }
    } else {
      this.x += this.dir * this.speed * speedMul * 1.5;
      if (this.pauseTimer > this.runDuration) { this.isPaused = true; this.pauseTimer = 0; this.pauseDuration = rand(40, 120); }
    }
    const margin = this.size * 5;
    if (this.x < -margin || this.x > this.screenW + margin) this.reset(false);
  }
  draw(ctx) {
    const s = this.size;
    const bob = this.isPaused ? 0 : Math.abs(Math.sin(this.runPhase)) * s * 0.15;
    ctx.save();
    ctx.translate(this.x, this.groundY - bob);
    ctx.scale(this.dir, 1);
    const tailWave = Math.sin(this.tailPhase) * 0.2;
    ctx.fillStyle = '#8a6030';
    ctx.beginPath();
    ctx.moveTo(-s * 0.3, -s * 0.1);
    ctx.bezierCurveTo(-s * 0.7, -s * 0.6 + tailWave * s, -s * 0.9, -s * 1.2, -s * 0.5, -s * 1.3 + tailWave * s);
    ctx.bezierCurveTo(-s * 0.2, -s * 1.2, -s * 0.1, -s * 0.7, -s * 0.2, -s * 0.3);
    ctx.fill();
    ctx.fillStyle = '#a07840';
    ctx.beginPath();
    ctx.moveTo(-s * 0.3, -s * 0.2);
    ctx.bezierCurveTo(-s * 0.55, -s * 0.5 + tailWave * s, -s * 0.7, -s * 1.0, -s * 0.45, -s * 1.1 + tailWave * s);
    ctx.bezierCurveTo(-s * 0.25, -s * 1.0, -s * 0.15, -s * 0.6, -s * 0.2, -s * 0.3);
    ctx.fill();
    ctx.fillStyle = '#7a5528';
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.35, s * 0.25, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#c8a870';
    ctx.beginPath();
    ctx.ellipse(s * 0.05, s * 0.08, s * 0.2, s * 0.15, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#7a5528';
    ctx.beginPath();
    ctx.arc(s * 0.35, -s * 0.15, s * 0.18, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#6a4820';
    ctx.beginPath();
    ctx.ellipse(s * 0.38, -s * 0.32, s * 0.06, s * 0.1, 0.2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(s * 0.42, -s * 0.17, s * 0.035, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(s * 0.43, -s * 0.18, s * 0.015, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#3a2010';
    ctx.beginPath();
    ctx.arc(s * 0.52, -s * 0.12, s * 0.025, 0, TAU);
    ctx.fill();
    const legPhase = this.isPaused ? 0 : Math.sin(this.runPhase);
    ctx.fillStyle = '#6a4820';
    ctx.beginPath();
    ctx.ellipse(s * 0.2 + legPhase * s * 0.05, s * 0.2, s * 0.06, s * 0.12, 0.1, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-s * 0.15 - legPhase * s * 0.05, s * 0.18, s * 0.07, s * 0.13, -0.1, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

/* ── Rabbit ── */
export class Rabbit {
  constructor(w, h) {
    this.screenW = w;
    this.screenH = h;
    this.reset(true);
  }
  reset(initial) {
    this.size = rand(30, 48);
    this.speed = rand(0.5, 1.5);
    this.dir = Math.random() < 0.5 ? 1 : -1;
    this.hopPhase = rand(0, TAU);
    const gx = initial ? rand(50, this.screenW - 50) : 0;
    this.groundY = this.screenH * 0.85 + Math.sin(gx * 0.005 + 4) * 20 + Math.sin(gx * 0.015) * 8;
    this.color = pick(['#b0a090', '#8a7a68', '#c8b8a0', '#706050']);
    this.x = initial ? rand(50, this.screenW - 50) : (this.dir > 0 ? -this.size * 3 : this.screenW + this.size * 3);
    this.pauseTimer = 0;
    this.isPaused = true;
    this.pauseDuration = rand(100, 300);
    this.hopDuration = rand(30, 80);
    this.isHopping = false;
    this.earTwitch = rand(0, TAU);
  }
  update(speedMul) {
    this.hopPhase += 0.2 * speedMul;
    this.earTwitch += 0.05 * speedMul;
    this.pauseTimer += speedMul;
    if (this.isPaused) {
      if (this.pauseTimer > this.pauseDuration) { this.isPaused = false; this.isHopping = true; this.pauseTimer = 0; this.hopDuration = rand(30, 80); if (Math.random() < 0.4) this.dir *= -1; }
    } else {
      this.x += this.dir * this.speed * speedMul * 2;
      if (this.pauseTimer > this.hopDuration) { this.isPaused = true; this.isHopping = false; this.pauseTimer = 0; this.pauseDuration = rand(100, 300); }
    }
    const margin = this.size * 5;
    if (this.x < -margin || this.x > this.screenW + margin) this.reset(false);
  }
  draw(ctx) {
    const s = this.size;
    const hop = this.isHopping ? Math.abs(Math.sin(this.hopPhase)) * s * 0.5 : 0;
    const stretch = this.isHopping ? 1 + Math.abs(Math.sin(this.hopPhase)) * 0.15 : 1;
    ctx.save();
    ctx.translate(this.x, this.groundY - hop);
    ctx.scale(this.dir, 1);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.4 * stretch, s * 0.3, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#f0e8e0';
    ctx.beginPath();
    ctx.arc(-s * 0.38, -s * 0.05, s * 0.1, 0, TAU);
    ctx.fill();
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(s * 0.35, -s * 0.2, s * 0.2, 0, TAU);
    ctx.fill();
    const earTwitch1 = Math.sin(this.earTwitch) * 0.1;
    const earTwitch2 = Math.sin(this.earTwitch + 1.5) * 0.08;
    ctx.fillStyle = this.color;
    ctx.save();
    ctx.translate(s * 0.3, -s * 0.38);
    ctx.rotate(-0.2 + earTwitch1);
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.3, s * 0.06, s * 0.25, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#e0b0b0';
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.3, s * 0.035, s * 0.18, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = this.color;
    ctx.save();
    ctx.translate(s * 0.38, -s * 0.36);
    ctx.rotate(0.15 + earTwitch2);
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.28, s * 0.055, s * 0.23, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#e0b0b0';
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.28, s * 0.03, s * 0.16, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(s * 0.44, -s * 0.22, s * 0.035, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(s * 0.45, -s * 0.23, s * 0.012, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#d09090';
    ctx.beginPath();
    ctx.ellipse(s * 0.53, -s * 0.17, s * 0.025, s * 0.02, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 0.4;
    for (let i = -1; i <= 1; i += 2) {
      ctx.beginPath();
      ctx.moveTo(s * 0.5, -s * 0.16 + i * s * 0.03);
      ctx.lineTo(s * 0.7, -s * 0.18 + i * s * 0.06);
      ctx.stroke();
    }
    ctx.fillStyle = this.color;
    if (this.isHopping) {
      const lp = Math.sin(this.hopPhase);
      ctx.beginPath();
      ctx.ellipse(-s * 0.2 - lp * s * 0.1, s * 0.2, s * 0.12, s * 0.08, -0.3, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(s * 0.2 + lp * s * 0.08, s * 0.22, s * 0.06, s * 0.1, 0.1, 0, TAU);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.ellipse(-s * 0.15, s * 0.18, s * 0.15, s * 0.1, 0, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(s * 0.25, s * 0.22, s * 0.06, s * 0.08, 0, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }
}
