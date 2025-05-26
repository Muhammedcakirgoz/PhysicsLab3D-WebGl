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

// Top & Bottom Platforms
const size    = 12;
const topMesh = new THREE.Mesh(new THREE.BoxGeometry(size, 0.2, size), mats.wood);
topMesh.position.set(0, 0.1, 7.8);
scene.add(topMesh);
const topBody = new CANNON.Body({ mass: 0 });
topBody.addShape(new CANNON.Box(new CANNON.Vec3(size/2, 0.1, size/2)));
topBody.position.copy(topMesh.position);
world.addBody(topBody);

const botMesh = new THREE.Mesh(new THREE.BoxGeometry(size, 0.2, size), mats.wood);
botMesh.position.set(0, -2.1, -7.8);
scene.add(botMesh);
const botBody = new CANNON.Body({ mass: 0 });
botBody.addShape(new CANNON.Box(new CANNON.Vec3(size/2, 0.1, size/2)));
botBody.position.copy(botMesh.position);
world.addBody(botBody);

// Ramp parameters (exactly like your original)
const rampGeo   = new THREE.BoxGeometry(4, 0.3, 4);
const rampAngle = -Math.PI / 6;
const rampLanes = { 'Sol Şerit': -4, 'Orta Şerit': 0, 'Sağ Şerit': 4 };

// Dynamic objects collection
const objects = [];

// Keyboard state
const keyState = {};
window.addEventListener('keydown', e => keyState[e.key.toLowerCase()] = true);
window.addEventListener('keyup',   e => keyState[e.key.toLowerCase()] = false);

// GUI setup
const gui          = new GUI();
const controlF     = gui.addFolder('Kontrol Modu');
const controlState = {
  mode:    'object',
  spawn:   'Düzlem',
  lane:    'Sol Şerit',
  cameraZ: camera.position.z,
  type:    'Küre'          // sadece spawnObject için
};
controlF.add(controlState,'mode',    ['object','camera']).name('Mod');
controlF.add(controlState,'spawn',   ['Düzlem','Alt Düzlem']).name('Obje Spawn');
controlF.add(controlState,'lane',    Object.keys(rampLanes)).name('Şerit');
controlF.add(controlState,'cameraZ', 1,30).name('Kamera Z').onChange(z => camera.position.z = z);
controlF.add(controlState,'type',    ['Küre','Kutu','Silindir']).name('Tür');
controlF.open();

const addF = gui.addFolder('Yeni Nesne Ekle');
addF.add({ spawnObject }, 'spawnObject').name('Obje Ekle');
addF.add({ addRamp },     'addRamp').    name('Rampa Ekle');
addF.open();

// ALWAYS adds a ramp—no type-check here
function addRamp() {
  const x = rampLanes[ controlState.lane ];
  // Three.js mesh
  const mesh = new THREE.Mesh(rampGeo, mats.wood);
  mesh.position.set(x, -1, 0);
  mesh.rotation.x = rampAngle;
  scene.add(mesh);

  // Cannon-es body
  const half = new CANNON.Vec3(2, 0.15, 2);
  const body = new CANNON.Body({ mass: 0 });
  body.addShape(new CANNON.Box(half));
  body.position.copy(mesh.position);
  body.quaternion.copy(mesh.quaternion);
  world.addBody(body);
}

// Spawns a sphere/box/cylinder on chosen platform
function spawnObject() {
  const half = 0.5;
  let pos;
  if (controlState.spawn === 'Düzlem') {
    pos = new THREE.Vector3(0, topMesh.position.y + half, topMesh.position.z);
  } else {
    pos = new THREE.Vector3(0, botMesh.position.y + half, botMesh.position.z);
  }

  let mesh, body;
  if (controlState.type === 'Kutu') {
    mesh = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), mats.rubber);
    body = new CANNON.Body({ mass:1, shape:new CANNON.Box(new CANNON.Vec3(0.5,0.5,0.5)) });
  } else if (controlState.type === 'Küre') {
    mesh = new THREE.Mesh(new THREE.SphereGeometry(0.5,16,16), mats.metal);
    body = new CANNON.Body({ mass:1, shape:new CANNON.Sphere(0.5) });
  } else {
    mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,1,16), mats.wood);
    const cyl = new CANNON.Cylinder(0.5,0.5,1,16);
    const q   = new CANNON.Quaternion().setFromAxisAngle(new CANNON.Vec3(0,0,1), Math.PI/2);
    body  = new CANNON.Body({ mass:1 });
    body.addShape(cyl, new CANNON.Vec3(), q);
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
    const b = objects[objects.length - 1].body;
    const v = 0.1;
    if (keyState['w']) b.position.z -= v;
    if (keyState['s']) b.position.z += v;
    if (keyState['a']) b.position.x -= v;
    if (keyState['d']) b.position.x += v;

    // lock Y
    if (controlState.spawn === 'Düzlem') {
      b.position.y = topMesh.position.y + 0.5;
      b.velocity.set(0,0,0);
    } else {
      b.position.y = botMesh.position.y + 0.5;
      b.velocity.set(0,0,0);
    }
  }

  world.step(1/60);
  objects.forEach(o => {
    o.mesh.position.copy(o.body.position);
    o.mesh.quaternion.copy(o.body.quaternion);
  });

  controls.update();
  renderer.render(scene, camera);
}
animate();

// window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
