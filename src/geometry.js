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

export function createCurvedRamp(segmentCount = 32, width = 1.2, length = 10, thickness = 0.3) {
  const w = width / 2;
  const h = thickness;
  const step = length / segmentCount;

  const positions = [];
  const normals = [];
  const indices = [];

  function rampY(z) {
    return -Math.tanh(z / 2) * 2;
  }

  for (let i = 0; i < segmentCount; i++) {
    const z1 = i * step;
    const z2 = (i + 1) * step;
    const y1 = rampY(z1 - length / 2);
    const y2 = rampY(z2 - length / 2);

    // Üst yüzey
    positions.push(
      -w, y1, z1,
       w, y1, z1,
       w, y2, z2,
      -w, y2, z2
    );
    for (let j = 0; j < 4; j++) normals.push(0, 1, 0);

    // Alt yüzey
    positions.push(
      -w, y1 - h, z1,
       w, y1 - h, z1,
       w, y2 - h, z2,
      -w, y2 - h, z2
    );
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
    indices: new Uint16Array(indices)
  };
}



