// src/physics.js
import { vec3 } from './lib/gl-matrix/index.js';

function rampY(z) {
  return -Math.tanh((z + 5) / 2) * 2;
}

function rampSlope(z) {
  return -(1 - Math.pow(Math.tanh((z + 5) / 2), 2)) * (1 / 2) * 2;
}

function dot(a, b) {
  return a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
}

export class Body {
  constructor(pos, mass = 1, friction = 0.3) {
    this.pos = vec3.clone(pos);
    this.vel = vec3.create();
    this.mass = mass;
    this.friction = friction;
  }

  step(dt) {
    const g = 9.8;
    const x = this.pos[0];
    const y = this.pos[1];
    const z = this.pos[2];

    const ySurface = rampY(z);
    const slope = rampSlope(z);

    // Normal approx: ( 0, 1, -slope )
    const normal = [0, 1, -slope];
    const len = Math.sqrt(1 + slope * slope);
    const n = [0, 1 / len, -slope / len];

    // Yerçekimi vektörü
    const gravity = [0, -g, 0];
    const proj = dot(gravity, n);

    const gy = n[1] * proj;
    const gz = n[2] * proj;

    // Rampa üzerindeyse eğime göre kayma uygula
    if (y <= ySurface + 0.05 && y >= ySurface - 0.1) {
      this.vel[1] += gy * dt;
      this.vel[2] += gz * dt;

      // X yönünde yana kaymayı azalt (basit sürtünme/friksiyon)
      this.vel[0] *= 0.9;

      // Rampanın dışına çıkmasın
      if (Math.abs(this.pos[0]) > 3.0) {
        this.vel[0] = 0;
        this.pos[0] = Math.sign(this.pos[0]) * 3.0;
      }
    } else {
      // Havadaysa normal yerçekimi uygula
      this.vel[1] -= g * dt;
    }

    // Zemin teması: rampaya gömülmeyi engelle
    if (this.pos[1] <= ySurface + 0.01) {
      this.pos[1] = ySurface + 0.01;
      this.vel[1] = 0;
    }

    for (let i = 0; i < 3; i++) {
      this.pos[i] += this.vel[i] * dt;
    }
  }
}
