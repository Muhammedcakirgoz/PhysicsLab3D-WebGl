// src/physics.js
import { vec3 } from './lib/gl-matrix/index.js';

function rampY(z) {
  return -Math.tanh(z / 2) * 2;
}

function rampSlope(z) {
  return -(1 - Math.pow(Math.tanh(z / 2), 2)) * (1 / 2) * 2;
}

function dot(a, b) {
  return a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
}

export class Body {
  constructor(pos, mass = 1, friction = 0.3, radius = 0.5, height = 1) {
    this.pos = vec3.clone(pos);
    this.vel = vec3.create();
    this.mass = mass;
    this.friction = friction;
    this.radius = radius; // küre için
    this.height = height; // kutu/silindir için
  }

  step(dt) {
    // Substeps ile daha hassas fizik
    const substeps = 20;
    const subdt = dt / substeps;
    for (let s = 0; s < substeps; s++) {
      this._step(subdt);
    }
  }

  _step(dt) {
    const g = 9.8;
    const x = this.pos[0];
    const y = this.pos[1];
    const z = this.pos[2];

    // Ramp parametreleri geometry.js ile aynı olmalı
    const rampWidth = 1.2;
    const rampLength = 10;
    const rampMinZ = -rampLength / 2;
    const rampMaxZ = rampLength / 2;

    const ySurface = rampY(z);
    const slope = rampSlope(z);

    // Rampanın üstünde mi?
    const onRamp = (
      Math.abs(x) <= rampWidth / 2 &&
      z >= rampMinZ && z <= rampMaxZ
    );

    // Alt noktayı hesapla (küre için radius, kutu/silindir için height/2)
    const bottomY = this.pos[1] - (this.radius || this.height/2 || 0);

    // Rampanın normali
    const len = Math.sqrt(1 + slope * slope);
    const n = [0, 1 / len, -slope / len];

    // Yerçekimi vektörü
    const gravity = [0, -g, 0];
    const proj = dot(gravity, n);

    const gy = n[1] * proj;
    const gz = n[2] * proj;

    // Rampanın üstünde ve alt noktası yüzeyin altına geçtiyse
    if (onRamp && bottomY < ySurface) {
      // Yüzeye dik hız bileşenini sıfırla (zıplatma yok)
      const vDotN = dot(this.vel, n);
      for (let i = 0; i < 3; i++) {
        this.vel[i] -= vDotN * n[i];
      }
      // Pozisyonu yüzeyin üstüne al
      this.pos[1] = ySurface + (this.radius || this.height/2 || 0);
    }

    // Rampanın üstünde ise eğime göre kayma uygula
    if (onRamp && Math.abs(bottomY - ySurface) < 0.2) {
      this.vel[1] += gy * dt;
      this.vel[2] += gz * dt;
      this.vel[0] *= 0.9;

      // Rampanın dışına çıkmasın
      if (Math.abs(this.pos[0]) > rampWidth / 2) {
        this.vel[0] = 0;
        this.pos[0] = Math.sign(this.pos[0]) * rampWidth / 2;
      }
    } else {
      // Havadaysa normal yerçekimi uygula
      this.vel[1] -= g * dt;
    }

    for (let i = 0; i < 3; i++) {
      this.pos[i] += this.vel[i] * dt;
    }
  }
}
