// physicslab3d-threejs/src/main.js
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as CANNON from 'cannon-es';
import GUI from 'lil-gui';
import { createSpiralRamp, createWaveRamp } from './geometry.js';

// Renderer & Scene
const canvas   = document.getElementById('three-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
const scene    = new THREE.Scene();
scene.background = new THREE.Color(0x202020);

// Camera & Controls
const camera   = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(10, 10, 20);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// --- GUI ---
const gui = new GUI();

// Lights
scene.add(new THREE.AmbientLight(0xffffff, 0.3));
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 10, 7.5);
scene.add(dirLight);

// Light Controls
const lightFolder = gui.addFolder('Işık Kontrolleri');
lightFolder.add(dirLight.position, 'x', -20, 20).name('Işık X');
lightFolder.add(dirLight.position, 'y', -20, 20).name('Işık Y');
lightFolder.add(dirLight.position, 'z', -20, 20).name('Işık Z');
lightFolder.add(dirLight, 'intensity', 0, 2).name('Parlaklık');
lightFolder.open();

// Gölge kamera sınırlarını genişlet
dirLight.shadow.camera.near = 0.1;
dirLight.shadow.camera.far = 50;
dirLight.shadow.camera.left = -20;
dirLight.shadow.camera.right = 20;
dirLight.shadow.camera.top = 20;
dirLight.shadow.camera.bottom = -20;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;

// Physics world
const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.81, 0) });
world.broadphase = new CANNON.NaiveBroadphase();

// Materials & Constants
const loader     = new THREE.TextureLoader();
const mats       = {
  wood:   new THREE.MeshStandardMaterial({ map: loader.load('./assets/textures/wood.jpg'), metalness:0.2, roughness:0.7 }),
  metal:  new THREE.MeshStandardMaterial({ map: loader.load('./assets/textures/metal.jpg'), metalness:0.8, roughness:0.2 }),
  rubber: new THREE.MeshStandardMaterial({ map: loader.load('./assets/textures/rubber.jpg'), metalness:0.1, roughness:0.9 })
};
const size       = 12;
const wallH      = 1;
const wallT      = 0.2;
const rampThick  = 0.3;
const rampLen    = 12;
const rampDepth  = size/3;
const rampAngle  = -Math.PI/6;

// --- ÜST PLATFORM & DUVARLAR ---
const topMesh = new THREE.Mesh(new THREE.BoxGeometry(size,0.2,size), mats.wood);
topMesh.position.set(0,2,10);
scene.add(topMesh);
const topBody = new CANNON.Body({ mass:0 });
topBody.addShape(new CANNON.Box(new CANNON.Vec3(size/2,0.1,size/2)));
topBody.position.copy(topMesh.position);
world.addBody(topBody);

// Üst platform duvarları
[
  { sz:[size,wallH,wallT], pos:[0, 2+wallH/2, topMesh.position.z+size/2] }, // ön
  { sz:[wallT,wallH,size], pos:[-size/2, 2+wallH/2, topMesh.position.z] },   // sol
  { sz:[wallT,wallH,size], pos:[ size/2, 2+wallH/2, topMesh.position.z] }    // sağ
].forEach(cfg=>{
  const m = new THREE.Mesh(new THREE.BoxGeometry(...cfg.sz), mats.wood);
  m.position.set(...cfg.pos);
  scene.add(m);
  const b = new CANNON.Body({ mass:0 });
  b.addShape(new CANNON.Box(new CANNON.Vec3(cfg.sz[0]/2, cfg.sz[1]/2, cfg.sz[2]/2)));
  b.position.copy(m.position);
  world.addBody(b);
});

// --- ALT PLATFORM & DUVARLAR ---
const botMesh = new THREE.Mesh(new THREE.BoxGeometry(size,0.2,size), mats.wood);
botMesh.position.set(0,-4,-10);
scene.add(botMesh);
const botBody = new CANNON.Body({ mass:0 });
botBody.addShape(new CANNON.Box(new CANNON.Vec3(size/2,0.1,size/2)));
botBody.position.copy(botMesh.position);
world.addBody(botBody);

[
  { sz:[size,wallH,wallT], pos:[0, botMesh.position.y+0.1+wallH/2, botMesh.position.z-size/2] }, // arka
  { sz:[wallT,wallH,size], pos:[-size/2, botMesh.position.y+0.1+wallH/2, botMesh.position.z] },   // sol
  { sz:[wallT,wallH,size], pos:[ size/2, botMesh.position.y+0.1+wallH/2, botMesh.position.z] }    // sağ
].forEach(cfg=>{
  const m=new THREE.Mesh(new THREE.BoxGeometry(...cfg.sz), mats.wood);
  m.position.set(...cfg.pos);
  scene.add(m);
  const b=new CANNON.Body({ mass:0 });
  b.addShape(new CANNON.Box(new CANNON.Vec3(cfg.sz[0]/2, cfg.sz[1]/2, cfg.sz[2]/2)));
  b.position.copy(m.position);
  world.addBody(b);
});

// --- RAMP BARRIERS (SAHNE AÇILINCA OLUŞSUN) ---
const rampLanes   = { 'Sol Şerit': -4, 'Orta Şerit': 0, 'Sağ Şerit': 4 };
const rampBarriers = [];

Object.values(rampLanes).forEach(x=>{
  const z0 = topMesh.position.z - size/1.8 - wallT/2;
  const y0 = topMesh.position.y + wallH/2 -0.2;

  const barrier = new THREE.Mesh(
    new THREE.BoxGeometry(4, wallH, wallT),
    mats.wood
  );
  // Rampanın yüzeyine dik olsun:
  barrier.rotation.set(rampAngle, 0, 0);
  barrier.position.set(x, y0, z0);
  scene.add(barrier);

  const b = new CANNON.Body({ mass: 0 });
  b.addShape(
    new CANNON.Box(new CANNON.Vec3(2, wallH/2, wallT/2)),
    new CANNON.Vec3(),
    new CANNON.Quaternion().setFromEuler(rampAngle, 0, 0)
  );
  b.position.copy(barrier.position);
  world.addBody(b);

  rampBarriers.push({ mesh: barrier, body: b });
});

// --- DİNAMİK NESNELER & GUI ---
const objects = [];
const keyState = {};
window.addEventListener('keydown', e=>keyState[e.key.toLowerCase()]=true);
window.addEventListener('keyup',   e=>keyState[e.key.toLowerCase()]=false);

const ctl   = gui.addFolder('Kontrol Modu');
const state = {
  lane:     'Sol Şerit',
  rampType: 'Düz',
  objType:  'Küre',
  cameraZ:  camera.position.z,
  released: false 
};
ctl.add(state,'lane', Object.keys(rampLanes)).name('Şerit');
ctl.add(state,'rampType',['Düz','Spiral','Dalgalı']).name('Ramp Tipi');
ctl.add(state,'objType',['Küre','Kutu','Silindir','Piramit']).name('Obje Türü');
ctl.add(state,'cameraZ',1,30).name('Kamera Z').onChange(z=>camera.position.z=z);
ctl.open();

const addF = gui.addFolder('Yeni Nesne Ekle');
addF.add({ spawnObject     }, 'spawnObject'    ).name('Obje Ekle');
addF.add({ addRamp         }, 'addRamp'        ).name('Rampa Ekle');
addF.add({ releaseBarriers }, 'releaseBarriers').name('Serbest Bırak');
addF.open();

// "Serbest Bırak": ramp bariyerlerini kaldır
function releaseBarriers(){
  rampBarriers.forEach(o=>{
    scene.remove(o.mesh);
    world.removeBody(o.body);
  });
  rampBarriers.length = 0;
  state.released = true;
}

// Dinamik ramp ekleme
function addRamp(){
  const x = rampLanes[state.lane];
  let mesh, body;
  const rampWidth = size/3;
  const platformThickness = 0.2;
  const start = new THREE.Vector3(
    x,
    topMesh.position.y + platformThickness/2 + rampThick/2,
    topMesh.position.z - size/2 + wallT + platformThickness/2
  );
  const end = new THREE.Vector3(
    x,
    botMesh.position.y + platformThickness/2 + rampThick/2,
    botMesh.position.z + size/2 - wallT - platformThickness/2
  );
  const center = start.clone().add(end).multiplyScalar(0.5);
  const dz = end.z - start.z;
  const dy = end.y - start.y;
  const rampLength = Math.sqrt(dz*dz + dy*dy);
  const angle = Math.atan2(dy, dz);

  if(state.rampType==='Düz'){
    mesh = new THREE.Mesh(new THREE.BoxGeometry(rampWidth, rampThick, rampLength), mats.wood);
    mesh.position.copy(center);
    mesh.rotation.set(-angle, 0, 0);
    scene.add(mesh);

    body = new CANNON.Body({ mass:0 });
    body.addShape(new CANNON.Box(new CANNON.Vec3(rampWidth/2, rampThick/2, rampLength/2)));
    body.position.copy(mesh.position);
    body.quaternion.copy(mesh.quaternion);
    world.addBody(body);

  }
  /*else if(state.rampType==='Kesikli'){
    
    const steps  = 9;
    const totalLen = 9;
    const segLen   = totalLen / steps;
    mesh = new THREE.Group();
    for(let i=0;i<steps;i++){
      const seg = new THREE.Mesh(
        new THREE.BoxGeometry(segLen, rampThick, rampDepth),
        mats.wood
      );
      // yatayda ortalanmış, düşeyde i*ilave
      seg.position.set(-totalLen/6 + segLen*(i), -i*(rampThick-0.15), 0);
      mesh.add(seg);
    }
    mesh.rotation.set(rampAngle/24, Math.PI/2, -0.50);
    // hizalama Düz ramp gibi
    const frontZ2 = topMesh.position.z - size/2;
    mesh.position.set(
      x,
      topMesh.position.y - rampThick/2 -2,
      frontZ2 - rampDepth/2
    );
    scene.add(mesh);
    body = new CANNON.Body({ mass:0 });
    body.addShape(
      new CANNON.Box(new CANNON.Vec3(totalLen/2, rampThick/2, rampDepth/2)),
      new CANNON.Vec3(),
      new CANNON.Quaternion().setFromEuler(rampAngle,Math.PI/2,0)
    );
    body.position.copy(mesh.position);
    world.addBody(body);
  }*/
  
  else if(state.rampType==='Dalgalı'){
    const waveRamp = createWaveRamp(32, rampWidth, rampLength, rampThick);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(waveRamp.positions, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(waveRamp.normals, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(waveRamp.uvs, 2));
    geometry.setIndex(new THREE.BufferAttribute(waveRamp.indices, 1));
    geometry.computeBoundingBox();
    geometry.computeVertexNormals();
    mesh = new THREE.Mesh(geometry, mats.wood);
    // Dalgalı rampanın üst yüzeyi platforma tam otursun
    // Dalga fonksiyonunun ilk y değerini de hesaba kat
    function waveY(z) { return Math.sin(z * 0.5) * 0.5; }
    mesh.position.copy(start);
    mesh.position.y = start.y - rampThick/2 - waveY(-rampLength/2 -2);
    mesh.rotation.set(-angle, 0, 0);
    scene.add(mesh);

    // CANNON.Trimesh ile fiziksel çarpışma
    const vertices = Array.from(geometry.attributes.position.array);
    const indices = Array.from(geometry.index.array);
    const shape = new CANNON.Trimesh(vertices, indices);
    body = new CANNON.Body({ mass: 0 });
    body.addShape(shape);
    body.position.copy(mesh.position);
    body.quaternion.copy(mesh.quaternion);
    world.addBody(body);
  } else if(state.rampType==='Spiral'){
    const spiralRadius = size/4;
    const spiralTurns = 2.2;
    const spiralWidth = rampWidth;
    const spiralThickness = rampThick;
    const segmentCount = 64;
    // Spiral rampanın ilk açısı (angle0)
    const angle0 = 0; // spiral -a ile başlıyor, t=0 için angle0=0
    // Spiral rampanın merkezi, şerit merkezinden spiralRadius kadar ilk açının ters yönünde kaydırılır
    const spiralCenter = new THREE.Vector3(
      start.x - spiralRadius * Math.cos(angle0),
      (start.y + end.y) / 2,
      start.z - spiralRadius * Math.sin(angle0)
    );
    const spiralRamp = createSpiralRamp(segmentCount, spiralRadius, spiralTurns, spiralWidth, spiralThickness, start, end, spiralCenter);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(spiralRamp.positions, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(spiralRamp.normals, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(spiralRamp.uvs, 2));
    geometry.setIndex(new THREE.BufferAttribute(spiralRamp.indices, 1));
    geometry.computeBoundingBox();
    geometry.computeVertexNormals();
    mesh = new THREE.Mesh(geometry, mats.wood);
    mesh.position.set(0,0,0);
    mesh.rotation.set(0, 0, 0);
    mesh.material.side = THREE.DoubleSide;
    mesh.renderOrder = 2;
    scene.add(mesh);
    // CANNON.Trimesh ile fiziksel çarpışma
    const vertices = Array.from(geometry.attributes.position.array);
    const indices = Array.from(geometry.index.array);
    const shape = new CANNON.Trimesh(vertices, indices);
    body = new CANNON.Body({ mass: 0 });
    body.addShape(shape);
    body.position.copy(mesh.position);
    body.quaternion.copy(mesh.quaternion);
    world.addBody(body);
    // --- Spiral rampaya korkuluk ekle ---
    const railHeight = 0.4;
    const railThickness = 0.1;
    const railOffset = spiralWidth/2 + railThickness/2;
    for(let side of [-1, 1]) { // -1: sol, 1: sağ
      const railGeom = new THREE.BufferGeometry();
      const railVerts = [];
      for(let i=0; i<=segmentCount; i++) {
        const t = i/segmentCount;
        // Spiral rampanın sonundaki düzleşen kısım da dahil
        let px, py, pz;
        const flattenT = 0.9;
        if (t >= flattenT) {
          // Düzleşen kısımda korkuluk noktası
          // createSpiralRamp ile aynı düzleşme mantığı
          const angleFlat = -spiralTurns * 2 * Math.PI * flattenT;
          const yFlat = start.y + (end.y - start.y) * flattenT;
          const flatStart = {
            angle: angleFlat,
            y: yFlat,
            x: spiralCenter.x + Math.cos(angleFlat) * spiralRadius,
            z: spiralCenter.z + Math.sin(angleFlat) * spiralRadius
          };
          const flatEnd = {
            y: end.y,
            x: start.x,
            z: end.z
          };
          const tFlat = (t - flattenT) / (1 - flattenT);
          px = flatStart.x + (flatEnd.x - flatStart.x) * tFlat + side*railOffset;
          py = flatStart.y + (flatEnd.y - flatStart.y) * tFlat + railHeight;
          pz = flatStart.z + (flatEnd.z - flatStart.z) * tFlat;
        } else {
          const angle = -spiralTurns * 2 * Math.PI * t;
          const y = start.y + (end.y - start.y) * t;
          const r = spiralRadius + side*railOffset;
          px = spiralCenter.x + Math.cos(angle)*r;
          py = y + railHeight;
          pz = spiralCenter.z + Math.sin(angle)*r;
        }
        railVerts.push(px, py, pz);
      }
      railGeom.setAttribute('position', new THREE.Float32BufferAttribute(railVerts, 3));
      const railMat = mats.wood.clone();
      const railMesh = new THREE.Line(railGeom, railMat);
      railMesh.position.set(0,0,0);
      scene.add(railMesh);
      // Fiziksel çarpışma için segment segment küçük kutular ekle
      for(let i=0; i<segmentCount; i++) {
        // createSpiralRamp ile aynı düzleşme mantığı
        let pt1, pt2;
        const t1 = i/segmentCount, t2 = (i+1)/segmentCount;
        const flattenT = 0.9;
        if (t1 >= flattenT) {
          const angleFlat = -spiralTurns * 2 * Math.PI * flattenT;
          const yFlat = start.y + (end.y - start.y) * flattenT;
          const flatStart = {
            angle: angleFlat,
            y: yFlat,
            x: spiralCenter.x + Math.cos(angleFlat) * spiralRadius,
            z: spiralCenter.z + Math.sin(angleFlat) * spiralRadius
          };
          const flatEnd = {
            y: end.y,
            x: start.x,
            z: end.z
          };
          const tFlat1 = (t1 - flattenT) / (1 - flattenT);
          const tFlat2 = (t2 - flattenT) / (1 - flattenT);
          pt1 = new THREE.Vector3(
            flatStart.x + (flatEnd.x - flatStart.x) * tFlat1 + side*railOffset,
            flatStart.y + (flatEnd.y - flatStart.y) * tFlat1 + railHeight,
            flatStart.z + (flatEnd.z - flatStart.z) * tFlat1
          );
          pt2 = new THREE.Vector3(
            flatStart.x + (flatEnd.x - flatStart.x) * tFlat2 + side*railOffset,
            flatStart.y + (flatEnd.y - flatStart.y) * tFlat2 + railHeight,
            flatStart.z + (flatEnd.z - flatStart.z) * tFlat2
          );
        } else {
          const angle1 = -spiralTurns * 2 * Math.PI * t1;
          const angle2 = -spiralTurns * 2 * Math.PI * t2;
          const y1 = start.y + (end.y - start.y) * t1;
          const y2 = start.y + (end.y - start.y) * t2;
          const r = spiralRadius + side*railOffset;
          pt1 = new THREE.Vector3(
            spiralCenter.x + Math.cos(angle1)*r, y1 + railHeight, spiralCenter.z + Math.sin(angle1)*r
          );
          pt2 = new THREE.Vector3(
            spiralCenter.x + Math.cos(angle2)*r, y2 + railHeight, spiralCenter.z + Math.sin(angle2)*r
          );
        }
        const mid = pt1.clone().add(pt2).multiplyScalar(0.5);
        const dir = pt2.clone().sub(pt1);
        const len = dir.length();
        dir.normalize();
        const boxShape = new CANNON.Box(new CANNON.Vec3(railThickness/2, railThickness/2, len/2));
        const angleBox = Math.atan2(dir.x, dir.z);
        const q = new CANNON.Quaternion();
        q.setFromEuler(0, angleBox, 0);
        const railBody = new CANNON.Body({ mass: 0 });
        railBody.addShape(boxShape, new CANNON.Vec3(mid.x, mid.y, mid.z), q);
        railBody.position.set(0,0,0);
        world.addBody(railBody);
      }
    }
  }
}

// Obje oluşturma
function spawnObject(){
  const half = 0.5;
  // Sadece üst platformda spawn
  const pos = new THREE.Vector3(
    0,
    topMesh.position.y + 0.5,
    topMesh.position.z
  );
  let mesh, body;
  switch(state.objType){
    case 'Kutu':
      mesh = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), mats.rubber);
      body = new CANNON.Body({mass:1, shape: new CANNON.Box(new CANNON.Vec3(0.5,0.5,0.5))});
      break;
    case 'Silindir':
      mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,1,16), mats.wood);
      const cyl = new CANNON.Cylinder(0.5,0.5,1,16);
      const q = new CANNON.Quaternion();
      q.setFromAxisAngle(new CANNON.Vec3(1,0,0), Math.PI/2);
      body = new CANNON.Body({mass:1});
      body.addShape(cyl, new CANNON.Vec3(), q);
      break;
      case 'Piramit': {
  // 1) Görsel: kare tabanlı piramit
  const pyrGeo = new THREE.ConeGeometry(0.5, 1, 4);
  mesh = new THREE.Mesh(pyrGeo, mats.wood);

  // 2) Physics: ConvexPolyhedron kullan
  //    - Üçgen yüzlerden oluşan gerçek bir hacim
  //    - Geometry verilerini CannonJS formatına çeviriyoruz
  const posAttr = pyrGeo.attributes.position.array;
  const idxAttr = pyrGeo.index.array;

  // 2a) Tüm vertexleri Vec3 listesine dönüştür
  const verts = [];
  for (let i = 0; i < posAttr.length; i += 3) {
    verts.push(new CANNON.Vec3(
      posAttr[i],
      posAttr[i + 1],
      posAttr[i + 2]
    ));
  }

  // 2b) Her üçlü index grubunu bir yüz (face) olarak al
  const faces = [];
  for (let i = 0; i < idxAttr.length; i += 3) {
    faces.push([
      idxAttr[i],
      idxAttr[i + 1],
      idxAttr[i + 2]
    ]);
  }

  // 2c) ConvexPolyhedron oluştur
  const poly = new CANNON.ConvexPolyhedron({ vertices: verts, faces: faces });
  body = new CANNON.Body({ mass: 1 });
  body.addShape(poly);

  break;
}
    default:
      mesh = new THREE.Mesh(new THREE.SphereGeometry(0.5,16,16), mats.metal);
      body = new CANNON.Body({mass:1, shape: new CANNON.Sphere(0.5)});
  }
  mesh.position.copy(pos);
  scene.add(mesh);
  body.position.copy(pos);
  world.addBody(body);
  objects.push({mesh, body});
}

// --- TABELA EKLEME ---
// Canvas ile doku oluştur
const tableCanvas = document.createElement('canvas');
tableCanvas.width = 1400;
tableCanvas.height = 400;
const ctx = tableCanvas.getContext('2d');
ctx.fillStyle = 'rgba(255,255,255,0)';
ctx.fillRect(0, 0, tableCanvas.width, tableCanvas.height);
ctx.font = 'bold 120px Arial';
ctx.fillStyle = '#eee';
ctx.textAlign = 'center';
ctx.textBaseline = 'top';
ctx.shadowColor = 'rgba(0,0,0,0.4)';
ctx.shadowBlur = 18;
ctx.fillText('PhysicsLab3D', tableCanvas.width/2, 70);
ctx.font = '60px Arial';
ctx.shadowBlur = 10;
ctx.fillText('Muhammed ve Musa', tableCanvas.width/2, 220);
const tableTextureCanvas = new THREE.CanvasTexture(tableCanvas);

// Tabela paneli (wood.jpg dokusu + canvas yazı)
const woodTexture = loader.load('./assets/textures/wood.jpg');
woodTexture.wrapS = woodTexture.wrapT = THREE.RepeatWrapping;
woodTexture.repeat.set(2, 1);
const tableMaterial = [
  new THREE.MeshStandardMaterial({ map: woodTexture }), // sol
  new THREE.MeshStandardMaterial({ map: woodTexture }), // sağ
  new THREE.MeshStandardMaterial({ map: woodTexture }), // üst
  new THREE.MeshStandardMaterial({ map: woodTexture }), // alt
  new THREE.MeshStandardMaterial({ map: tableTextureCanvas }), // ön (yazılı)
  new THREE.MeshStandardMaterial({ map: woodTexture })  // arka
];
const tableWidth = 7.5;
const tableHeight = 2.0;
const tableDepth = 0.13;
const tableGeometry = new THREE.BoxGeometry(tableWidth, tableHeight, tableDepth);
const tableMesh = new THREE.Mesh(tableGeometry, tableMaterial);
tableMesh.castShadow = true;
tableMesh.receiveShadow = true;
// Tabela üst platformun arka kenarına bitişik ve ortada olacak, direğin üstüne tam oturacak
const poleHeight = 1.0;
const tableY = topMesh.position.y + 0.1 + poleHeight + tableHeight/2; // platform üstü + direk + tabelanın yarısı
const tableZ = topMesh.position.z + size/2 - (tableDepth/2);
tableMesh.position.set(0, tableY, tableZ);
tableMesh.rotation.y = Math.PI;
scene.add(tableMesh);

// Tabela direği (metal), platformun üstünden başlayacak ve tabelanın altına kadar uzanacak
const poleGeometry = new THREE.CylinderGeometry(0.11, 0.11, poleHeight, 24);
const poleMesh = new THREE.Mesh(poleGeometry, mats.metal);
poleMesh.castShadow = true;
poleMesh.receiveShadow = true;
// Direğin alt ucu platformun üstünde, üst ucu tabelanın altına değecek
const poleY = topMesh.position.y + 0.1 + poleHeight/2;
poleMesh.position.set(0, poleY, tableZ);
scene.add(poleMesh);

// --- GÖLGE AYARLARI ---
renderer.shadowMap.enabled = true;
dirLight.castShadow = true;

// Animate loop
function animate() {
  requestAnimationFrame(animate);

  // Eğer en az bir obje varsa, klavyeyle her zaman hareket ettir:
  if (objects.length) {
    const body = objects[objects.length - 1].body;
    const speed = 0.1;
    if (keyState['w']) body.position.z -= speed;
    if (keyState['s']) body.position.z += speed;
    if (keyState['a']) body.position.x -= speed;
    if (keyState['d']) body.position.x += speed;
  }

  // Sadece henüz "serbest bırak" yapılmadıysa, objeyi Y ekseninde sabitle:
  if (objects.length && !state.released) {
    const body = objects[objects.length - 1].body;
    body.position.y = topMesh.position.y + 0.5;
    body.velocity.set(0, 0, 0);
  }

  // Fizik adımı
  world.step(1/60);

  // Three.js mesh'leri senkronize et
  objects.forEach(o => {
    o.mesh.position.copy(o.body.position);
    o.mesh.quaternion.copy(o.body.quaternion);
  });

  controls.update();
  renderer.render(scene, camera);
}
animate();

// Handle resize
window.addEventListener('resize',()=>{
  camera.aspect=window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth,window.innerHeight);
});

topMesh.receiveShadow = true;