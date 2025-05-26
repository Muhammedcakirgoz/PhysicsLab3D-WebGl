// physicslab3d-threejs/src/main.js
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as CANNON from 'cannon-es';
import GUI from 'lil-gui';

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

// Lights
scene.add(new THREE.AmbientLight(0xffffff, 0.3));
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 10, 7.5);
scene.add(dirLight);

// Physics world
const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.81, 0) });
world.broadphase = new CANNON.NaiveBroadphase();

// Materials
const loader = new THREE.TextureLoader();
const mats = {
  wood:   new THREE.MeshStandardMaterial({ map: loader.load('./assets/textures/wood.jpg'),   metalness:0.2, roughness:0.7 }),
  metal:  new THREE.MeshStandardMaterial({ map: loader.load('./assets/textures/metal.jpg'),  metalness:0.8, roughness:0.2 }),
  rubber: new THREE.MeshStandardMaterial({ map: loader.load('./assets/textures/rubber.jpg'), metalness:0.1, roughness:0.9 })
};

// Top Platform
const size    = 12;
const topMesh = new THREE.Mesh(new THREE.BoxGeometry(size, 0.2, size), mats.wood);
topMesh.position.set(0, 0.1, 7.8);
scene.add(topMesh);
const topBody = new CANNON.Body({ mass: 0 });
topBody.addShape(new CANNON.Box(new CANNON.Vec3(size/2, 0.1, size/2)));
topBody.position.copy(topMesh.position);
world.addBody(topBody);

// Üst platform duvarları
const wallHeight = 1;
const wallThickness = 0.2;

// Üst platform ön duvar (ön: +z)
const topFrontWall = new THREE.Mesh(
  new THREE.BoxGeometry(size, wallHeight, wallThickness),
  mats.wood
);
topFrontWall.position.set(0, wallHeight/2, topMesh.position.z + size/2);
scene.add(topFrontWall);
const topFrontWallBody = new CANNON.Body({ mass: 0 });
topFrontWallBody.addShape(new CANNON.Box(new CANNON.Vec3(size/2, wallHeight/2, wallThickness/2)));
topFrontWallBody.position.copy(topFrontWall.position);
world.addBody(topFrontWallBody);

// Üst platform sol duvar
const topLeftWall = new THREE.Mesh(
  new THREE.BoxGeometry(wallThickness, wallHeight, size),
  mats.wood
);
topLeftWall.position.set(-size/2, wallHeight/2, topMesh.position.z);
scene.add(topLeftWall);
const topLeftWallBody = new CANNON.Body({ mass: 0 });
topLeftWallBody.addShape(new CANNON.Box(new CANNON.Vec3(wallThickness/2, wallHeight/2, size/2)));
topLeftWallBody.position.copy(topLeftWall.position);
world.addBody(topLeftWallBody);

// Üst platform sağ duvar
const topRightWall = new THREE.Mesh(
  new THREE.BoxGeometry(wallThickness, wallHeight, size),
  mats.wood
);
topRightWall.position.set(size/2, wallHeight/2, topMesh.position.z);
scene.add(topRightWall);
const topRightWallBody = new CANNON.Body({ mass: 0 });
topRightWallBody.addShape(new CANNON.Box(new CANNON.Vec3(wallThickness/2, wallHeight/2, size/2)));
topRightWallBody.position.copy(topRightWall.position);
world.addBody(topRightWallBody);

// Bottom Platform
const botMesh = new THREE.Mesh(new THREE.BoxGeometry(size, 0.2, size), mats.wood);
botMesh.position.set(0, -2.1, -7.8);
scene.add(botMesh);
const botBody = new CANNON.Body({ mass: 0 });
botBody.addShape(new CANNON.Box(new CANNON.Vec3(size/2, 0.1, size/2)));
botBody.position.copy(botMesh.position);
world.addBody(botBody);

// Alt platform arka duvar (arka: -z)
const botBackWall = new THREE.Mesh(
  new THREE.BoxGeometry(size, wallHeight, wallThickness),
  mats.wood
);
botBackWall.position.set(0, botMesh.position.y + 0.1 + wallHeight/2, botMesh.position.z - size/2);
scene.add(botBackWall);
const botBackWallBody = new CANNON.Body({ mass: 0 });
botBackWallBody.addShape(new CANNON.Box(new CANNON.Vec3(size/2, wallHeight/2, wallThickness/2)));
botBackWallBody.position.copy(botBackWall.position);
world.addBody(botBackWallBody);

// Alt platform sol duvar
const botLeftWall = new THREE.Mesh(
  new THREE.BoxGeometry(wallThickness, wallHeight, size),
  mats.wood
);
botLeftWall.position.set(-size/2, botMesh.position.y + 0.1 + wallHeight/2, botMesh.position.z);
scene.add(botLeftWall);
const botLeftWallBody = new CANNON.Body({ mass: 0 });
botLeftWallBody.addShape(new CANNON.Box(new CANNON.Vec3(wallThickness/2, wallHeight/2, size/2)));
botLeftWallBody.position.copy(botLeftWall.position);
world.addBody(botLeftWallBody);

// Alt platform sağ duvar
const botRightWall = new THREE.Mesh(
  new THREE.BoxGeometry(wallThickness, wallHeight, size),
  mats.wood
);
botRightWall.position.set(size/2, botMesh.position.y + 0.1 + wallHeight/2, botMesh.position.z);
scene.add(botRightWall);
const botRightWallBody = new CANNON.Body({ mass: 0 });
botRightWallBody.addShape(new CANNON.Box(new CANNON.Vec3(wallThickness/2, wallHeight/2, size/2)));
botRightWallBody.position.copy(botRightWall.position);
world.addBody(botRightWallBody);

// Alt platform üst yüzeyi Y koordinatı
const rampThick = 0.3;
const bottomY   = botMesh.position.y + rampThick/2;

// Ramp parameters
const rampLength = 4;
const rampWidth  = 4;
const rampAngle  = -Math.PI/6;
const rampLanes  = { 'Sol Şerit': -4, 'Orta Şerit': 0, 'Sağ Şerit': 4 };

// Dynamic objects
const objects = [];

// Keyboard state
const keyState = {};
window.addEventListener('keydown', e => keyState[e.key.toLowerCase()] = true);
window.addEventListener('keyup',   e => keyState[e.key.toLowerCase()] = false);

// GUI setup
const gui      = new GUI();
const controlF = gui.addFolder('Kontrol Modu');
const controlState = {
  mode:     'object',
  spawn:    'Düzlem',
  lane:     'Sol Şerit',
  rampType: 'Düz',     // 'Düz','Kıvrımlı','Kesikli'
  objType:  'Küre',    // 'Küre','Kutu','Silindir'
  cameraZ:  camera.position.z
};
controlF.add(controlState,'mode',     ['object','camera']).name('Mod');
controlF.add(controlState,'spawn',    ['Düzlem','Alt Düzlem']).name('Obje Spawn');
controlF.add(controlState,'lane',     Object.keys(rampLanes)).name('Şerit');
controlF.add(controlState,'rampType', ['Düz','Kıvrımlı','Kesikli']).name('Ramp Tipi');
controlF.add(controlState,'objType',  ['Küre','Kutu','Silindir']).name('Obje Türü');
controlF.add(controlState,'cameraZ',  1,30).name('Kamera Z').onChange(z=>camera.position.z=z);
controlF.open();

const addF = gui.addFolder('Yeni Nesne Ekle');
addF.add({ spawnObject }, 'spawnObject').name('Obje Ekle');
addF.add({ addRamp     }, 'addRamp').    name('Rampa Ekle');
addF.open();

// Rampa ekleme fonksiyonu
function addRamp() {
  const x = rampLanes[controlState.lane];
  let mesh;

  if (controlState.rampType === 'Kıvrımlı') {
    // 1) Eğri profil
    const shape = new THREE.Shape();
    shape.moveTo(-rampLength/2, rampThick/2);
    shape.bezierCurveTo(
      -rampLength/2 + 1, rampThick/2,
      0,                 -2,
      rampLength/2 - 1,  -2
    );
    shape.lineTo(rampLength/2,  -2 - rampThick);
    shape.lineTo(-rampLength/2, -2 - rampThick);
    shape.closePath();

    // 2) Extrude
    const geo = new THREE.ExtrudeGeometry(shape, {
      steps: 20,
      depth: rampWidth,
      bevelEnabled: false
    });
    geo.translate(0, 0, -rampWidth/2);

    mesh = new THREE.Mesh(geo, mats.wood);
    // 30° yukarı, 90° sola çevir
    mesh.rotation.set(Math.PI/6, Math.PI/2, -0.50);

    // 3) Alt ucun Y'sini hesapla & hizala
    mesh.updateMatrixWorld();
    const bbox1 = new THREE.Box3().setFromObject(mesh);
    const yMin  = bbox1.min.y;
    mesh.position.set(x, mesh.position.y + (bottomY - yMin), 0);

    // 4) Üst ucun Y'sini hesapla & hizala
    mesh.updateMatrixWorld();
    const bbox2 = new THREE.Box3().setFromObject(mesh);
    const yMax  = bbox2.max.y;
    const topY  = topMesh.position.y + rampThick/2;
    mesh.position.y += (topY - yMax);

    scene.add(mesh);

  } else if (controlState.rampType === 'Kesikli') {
    // Kesikli rampalar
    const segLen = rampLength/4;
    mesh = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const seg = new THREE.Mesh(
        new THREE.BoxGeometry(segLen, rampThick, rampWidth),
        mats.wood
      );
      seg.position.set(
        -rampLength/2 + segLen*(i+0.5),
        -i*(rampThick+0.1),
        0
      );
      mesh.add(seg);
    }
    mesh.rotation.set(rampAngle, 0, 0);
    mesh.position.set(x, -1, 0);
    scene.add(mesh);

  } else {
    // Düz rampa
    mesh = new THREE.Mesh(
      new THREE.BoxGeometry(rampLength, rampThick, rampWidth),
      mats.wood
    );
    mesh.rotation.set(rampAngle, 0, 0);
    mesh.position.set(x, -1, 0);
    scene.add(mesh);
  }

  // Fizik gövdesi
  const half = new CANNON.Vec3(rampLength/2, rampThick/2, rampWidth/2);
  const body = new CANNON.Body({ mass: 0 });
  body.addShape(new CANNON.Box(half));
  body.position.copy(mesh.position);
  body.quaternion.copy(mesh.quaternion || new THREE.Quaternion());
  world.addBody(body);
}

// Obje spawn fonksiyonu
function spawnObject() {
  const half = 0.5;
  let pos;
  if (controlState.spawn === 'Düzlem') {
    pos = new THREE.Vector3(0, topMesh.position.y + half, topMesh.position.z);
  } else {
    pos = new THREE.Vector3(0, botMesh.position.y + half, botMesh.position.z);
  }

  let mesh, body;
  switch (controlState.objType) {
    case 'Kutu':
      mesh = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), mats.rubber);
      body = new CANNON.Body({ mass:1, shape:new CANNON.Box(new CANNON.Vec3(0.5,0.5,0.5)) });
      break;
    case 'Silindir':
      mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,1,16), mats.wood);
      const cyl = new CANNON.Cylinder(0.5,0.5,1,16);
      const q   = new CANNON.Quaternion().setFromAxisAngle(new CANNON.Vec3(0,0,1), Math.PI/2);
      body = new CANNON.Body({ mass:1 });
      body.addShape(cyl, new CANNON.Vec3(), q);
      break;
    default: // 'Küre'
      mesh = new THREE.Mesh(new THREE.SphereGeometry(0.5,16,16), mats.metal);
      body = new CANNON.Body({ mass:1, shape:new CANNON.Sphere(0.5) });
  }

  mesh.position.copy(pos);
  scene.add(mesh);
  body.position.copy(pos);
  world.addBody(body);
  objects.push({ mesh, body });
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  if (controlState.mode === 'object' && objects.length) {
    const b = objects[objects.length-1].body;
    const v = 0.1;
    if (keyState['w']) b.position.z -= v;
    if (keyState['s']) b.position.z += v;
    if (keyState['a']) b.position.x -= v;
    if (keyState['d']) b.position.x += v;

    // Lock Y
    if (controlState.spawn === 'Düzlem') {
      b.position.y = topMesh.position.y + 0.5;
      b.velocity.set(0,0,0);
    } else {
      b.position.y = botMesh.position.y + 0.5;
      b.velocity.set(0,0,0);
    }
  }

  world.step(1/60);
  objects.forEach(o=>{
    o.mesh.position.copy(o.body.position);
    o.mesh.quaternion.copy(o.body.quaternion);
  });

  controls.update();
  renderer.render(scene, camera);
}
animate();

// Handle resize
window.addEventListener('resize', ()=>{
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
