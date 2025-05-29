import * as THREE from 'three';
import { vec3 } from './lib/gl-matrix/index.js';

export function createBox(w, h, d) {
  const x = w / 2, y = h / 2, z = d / 2;
  const positions = new Float32Array([
    -x,-y,-z,  x,-y,-z,  x, y,-z, -x, y,-z,
    -x,-y, z,  x,-y, z,  x, y, z, -x, y, z,
  ]);
  const indices = new Uint16Array([
    0,1,2,  0,2,3,    4,6,5,  4,7,6,  
    0,4,5,  0,5,1,    1,5,6,  1,6,2,
    2,6,7,  2,7,3,    3,7,4,  3,4,0
  ]);
  const normals = new Float32Array(positions.length);
  // Basit: Normalleri pozisyon vektörünün normalize hali say
  for (let i = 0; i < positions.length; i += 3) {
    const n = vec3.normalize(vec3.create(), vec3.fromValues(
      positions[i], positions[i+1], positions[i+2]
    ));
    normals.set(n, i);
  }
  return { positions, normals, indices };
}

export function createSphere(radius = 1, lat = 16, lon = 16) {
  const positions = [], normals = [], indices = [];
  for (let j = 0; j <= lat; j++) {
    const theta = j * Math.PI / lat;
    for (let i = 0; i <= lon; i++) {
      const phi = i * 2 * Math.PI / lon;
      const x = radius * Math.sin(theta) * Math.cos(phi);
      const y = radius * Math.cos(theta);
      const z = radius * Math.sin(theta) * Math.sin(phi);
      positions.push(x, y, z);
      const len = Math.hypot(x,y,z) || 1;
      normals.push(x/len, y/len, z/len);
    }
  }
  for (let j = 0; j < lat; j++) {
    for (let i = 0; i < lon; i++) {
      const a = j*(lon+1) + i;
      const b = a + lon + 1;
      indices.push(a, b, a+1, b, b+1, a+1);
    }
  }
  return {
    positions: new Float32Array(positions),
    normals:   new Float32Array(normals),
    indices:   new Uint16Array(indices)
  };
}

// geometry.js

export function createSpiralRamp(segmentCount, radius, turns, width, thickness, start, end, center) {
  const positions = [];
  const normals = [];
  const indices = [];
  const uvs = [];
  const w = width / 2;
  const flattenT = 0.9; // Son %10 düzleşsin
  let flatStart = null, flatEnd = null;
  for (let i = 0; i < segmentCount; i++) {
    const t1 = i / segmentCount;
    const t2 = (i + 1) / segmentCount;
    let angle1, angle2, r1, r2, y1, y2, p1, p2, p3, p4;
    if (t1 >= flattenT) {
      // Son %10: spiral açısı sabit, x sabit, z ve y platforma doğru düz ilerliyor
      if (!flatStart) {
        // Düzleşmenin başladığı noktayı hesapla
        const angleFlat = -turns * 2 * Math.PI * flattenT;
        const yFlat = start.y + (end.y - start.y) * flattenT;
        flatStart = {
          angle: angleFlat,
          y: yFlat,
          x: center.x + Math.cos(angleFlat) * radius,
          z: center.z + Math.sin(angleFlat) * radius
        };
        // --- Platformun içine çok az girsin (boşluk kapanması için) ---
        const epsilon = -0.25; // 0.25 birim platformun içine girsin (daha fazla uzat)
        flatEnd = {
          y: end.y + epsilon,
          x: start.x,
          z: end.z
        };
      }
      // t1 ve t2 için düz interpolasyon
      const tFlat1 = (t1 - flattenT) / (1 - flattenT);
      const tFlat2 = (t2 - flattenT) / (1 - flattenT);
      // Dış kenar
      p1 = [
        flatStart.x + (flatEnd.x - flatStart.x) * tFlat1 - w,
        flatStart.y + (flatEnd.y - flatStart.y) * tFlat1,
        flatStart.z + (flatEnd.z - flatStart.z) * tFlat1
      ];
      p4 = [
        flatStart.x + (flatEnd.x - flatStart.x) * tFlat2 - w,
        flatStart.y + (flatEnd.y - flatStart.y) * tFlat2,
        flatStart.z + (flatEnd.z - flatStart.z) * tFlat2
      ];
      // İç kenar
      p2 = [
        flatStart.x + (flatEnd.x - flatStart.x) * tFlat1 + w,
        flatStart.y + (flatEnd.y - flatStart.y) * tFlat1,
        flatStart.z + (flatEnd.z - flatStart.z) * tFlat1
      ];
      p3 = [
        flatStart.x + (flatEnd.x - flatStart.x) * tFlat2 + w,
        flatStart.y + (flatEnd.y - flatStart.y) * tFlat2,
        flatStart.z + (flatEnd.z - flatStart.z) * tFlat2
      ];
    } else {
      angle1 = -turns * 2 * Math.PI * t1;
      angle2 = -turns * 2 * Math.PI * t2;
      y1 = start.y + (end.y - start.y) * t1;
      y2 = start.y + (end.y - start.y) * t2;
      // Dış ve iç kenar noktaları (merkezden başlat)
      p1 = [center.x + Math.cos(angle1) * (radius - w), y1, center.z + Math.sin(angle1) * (radius - w)];
      p2 = [center.x + Math.cos(angle1) * (radius + w), y1, center.z + Math.sin(angle1) * (radius + w)];
      p3 = [center.x + Math.cos(angle2) * (radius + w), y2, center.z + Math.sin(angle2) * (radius + w)];
      p4 = [center.x + Math.cos(angle2) * (radius - w), y2, center.z + Math.sin(angle2) * (radius - w)];
    }
    positions.push(...p1, ...p2, ...p3, ...p4);
    for (let j = 0; j < 4; j++) normals.push(0, 1, 0);
    uvs.push(0, t1, 1, t1, 1, t2, 0, t2);
    const base = i * 4;
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint16Array(indices),
    uvs: new Float32Array(uvs)
  };
}

export function createCylinder(radius = 0.5, height = 1, segments = 24) {
  const positions = [];
  const normals = [];
  const indices = [];

  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * 2 * Math.PI;
    const x = Math.cos(theta) * radius;
    const z = Math.sin(theta) * radius;

    // Alt ve üst yüzey noktaları
    positions.push(x, -height/2, z);
    positions.push(x,  height/2, z);

    // Normaller
    normals.push(x, 0, z);
    normals.push(x, 0, z);
  }

  for (let i = 0; i < segments; i++) {
    const p0 = i * 2;
    const p1 = p0 + 1;
    const p2 = ((i + 1) % (segments + 1)) * 2;
    const p3 = p2 + 1;

    // Yan yüzeyler
    indices.push(p0, p2, p1);
    indices.push(p1, p2, p3);
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint16Array(indices)
  };
}

export function createWaveRamp(segmentCount = 32, width = 1.2, length = 10, thickness = 0.3) {
  const w = width / 2;
  const h = thickness;
  const step = length / segmentCount;

  const positions = [];
  const normals = [];
  const indices = [];
  const uvs = [];

  function waveY(z) {
    return Math.sin(z * 0.5) * 0.5;
  }

  for (let i = 0; i < segmentCount; i++) {
    const z1 = i * step;
    const z2 = (i + 1) * step;
    const y1 = waveY(z1 - length / 2);
    const y2 = waveY(z2 - length / 2);
    // Üst yüzey
    positions.push(
      -w, y1, z1,
       w, y1, z1,
       w, y2, z2,
      -w, y2, z2
    );
    uvs.push(0, i/segmentCount, 1, i/segmentCount, 1, (i+1)/segmentCount, 0, (i+1)/segmentCount);
    for (let j = 0; j < 4; j++) normals.push(0, 1, 0);
    // Alt yüzey
    positions.push(
      -w, y1 - h, z1,
       w, y1 - h, z1,
       w, y2 - h, z2,
      -w, y2 - h, z2
    );
    uvs.push(0, i/segmentCount, 1, i/segmentCount, 1, (i+1)/segmentCount, 0, (i+1)/segmentCount);
    for (let j = 0; j < 4; j++) normals.push(0, -1, 0);
    const base = i * 8;
    indices.push(
      base, base + 1, base + 2, base, base + 2, base + 3,
      base + 4, base + 6, base + 5, base + 4, base + 7, base + 6
    );
  }
  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint16Array(indices),
    uvs: new Float32Array(uvs)
  };
}



