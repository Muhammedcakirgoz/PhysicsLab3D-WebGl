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
const rampLen    = 4;
const rampDepth  = 4;
const rampAngle  = -Math.PI/6;

// --- ÜST PLATFORM & DUVARLAR ---
const topMesh = new THREE.Mesh(new THREE.BoxGeometry(size,0.2,size), mats.wood);
topMesh.position.set(0,0.1,7.8);
scene.add(topMesh);
const topBody = new CANNON.Body({ mass:0 });
topBody.addShape(new CANNON.Box(new CANNON.Vec3(size/2,0.1,size/2)));
topBody.position.copy(topMesh.position);
world.addBody(topBody);

// Üst platform duvarları
[
  { sz:[size,wallH,wallT], pos:[0, wallH/2, topMesh.position.z+size/2] }, // ön
  { sz:[wallT,wallH,size], pos:[-size/2, wallH/2, topMesh.position.z] },   // sol
  { sz:[wallT,wallH,size], pos:[ size/2, wallH/2, topMesh.position.z] }    // sağ
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
botMesh.position.set(0,-2.1,-7.8);
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
    new THREE.BoxGeometry(rampLen, wallH, wallT),
    mats.wood
  );
  // Rampanın yüzeyine dik olsun:
  barrier.rotation.set(rampAngle, 0, 0);
  barrier.position.set(x, y0, z0);
  scene.add(barrier);

  const b = new CANNON.Body({ mass: 0 });
  b.addShape(
    new CANNON.Box(new CANNON.Vec3(rampLen/2, wallH/2, wallT/2)),
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

const gui   = new GUI();
const ctl   = gui.addFolder('Kontrol Modu');
const state = {
  mode:     'object',
  spawn:    'Düzlem',
  lane:     'Sol Şerit',
  rampType: 'Düz',
  objType:  'Küre',
  cameraZ:  camera.position.z
};
ctl.add(state,'mode',['object','camera']).name('Mod');
ctl.add(state,'spawn',['Düzlem','Alt Düzlem']).name('Obje Spawn');
ctl.add(state,'lane', Object.keys(rampLanes)).name('Şerit');
ctl.add(state,'rampType',['Düz','Kıvrımlı','Kesikli']).name('Ramp Tipi');
ctl.add(state,'objType',['Küre','Kutu','Silindir']).name('Obje Türü');
ctl.add(state,'cameraZ',1,30).name('Kamera Z').onChange(z=>camera.position.z=z);
ctl.open();

const addF = gui.addFolder('Yeni Nesne Ekle');
addF.add({ spawnObject     }, 'spawnObject'    ).name('Obje Ekle');
addF.add({ addRamp         }, 'addRamp'        ).name('Rampa Ekle');
addF.add({ releaseBarriers }, 'releaseBarriers').name('Serbest Bırak');
addF.open();

// “Serbest Bırak”: ramp bariyerlerini kaldır
function releaseBarriers(){
  rampBarriers.forEach(o=>{
    scene.remove(o.mesh);
    world.removeBody(o.body);
  });
  rampBarriers.length = 0;
}

// Dinamik ramp ekleme
function addRamp(){
  const x = rampLanes[state.lane];
  let mesh, body;

  if(state.rampType==='Düz'){
    mesh = new THREE.Mesh(new THREE.BoxGeometry(rampLen,rampThick,rampDepth), mats.wood);
    mesh.rotation.set(rampAngle,0,0);
    mesh.position.set(x,-1,0);
    scene.add(mesh);

    body = new CANNON.Body({ mass:0 });
    body.addShape(new CANNON.Box(new CANNON.Vec3(rampLen/2,rampThick/2,rampDepth/2)));
    body.position.copy(mesh.position);
    body.quaternion.copy(mesh.quaternion);
    world.addBody(body);
  }
  // Kıvrımlı ve Kesikli dallarını istediğin gibi ekleyebilirsin
}

// Obje oluşturma
function spawnObject(){
  const half=0.5;
  const pos = state.spawn==='Düzlem'
    ? new THREE.Vector3(0, topMesh.position.y+half, topMesh.position.z)
    : new THREE.Vector3(0, botMesh.position.y+half, botMesh.position.z);

  let mesh, body;
  switch(state.objType){
    case 'Kutu':
      mesh=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),mats.rubber);
      body=new CANNON.Body({mass:1,shape:new CANNON.Box(new CANNON.Vec3(0.5,0.5,0.5))});
      break;
    case 'Silindir':
      mesh=new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,1,16),mats.wood);
      const cyl=new CANNON.Cylinder(0.5,0.5,1,16);
      const q=new CANNON.Quaternion().setFromAxisAngle(new CANNON.Vec3(0,0,1),Math.PI/2);
      body=new CANNON.Body({mass:1}); body.addShape(cyl,new CANNON.Vec3(),q);
      break;
    default:
      mesh=new THREE.Mesh(new THREE.SphereGeometry(0.5,16,16),mats.metal);
      body=new CANNON.Body({mass:1,shape:new CANNON.Sphere(0.5)});
  }
  mesh.position.copy(pos);
  scene.add(mesh);
  body.position.copy(pos);
  world.addBody(body);
  objects.push({mesh,body});
}

// Animate loop
function animate(){
  requestAnimationFrame(animate);
  if(state.mode==='object' && objects.length){
    const b=objects[objects.length-1].body, v=0.1;
    if(keyState['w']) b.position.z-=v;
    if(keyState['s']) b.position.z+=v;
    if(keyState['a']) b.position.x-=v;
    if(keyState['d']) b.position.x+=v;
    if(state.spawn==='Düzlem'){
      b.position.y=topMesh.position.y+0.5; b.velocity.set(0,0,0);
    } else {
      b.position.y=botMesh.position.y+0.5; b.velocity.set(0,0,0);
    }
  }
  world.step(1/60);
  objects.forEach(o=>{
    o.mesh.position.copy(o.body.position);
    o.mesh.quaternion.copy(o.body.quaternion);
  });
  controls.update();
  renderer.render(scene,camera);
}
animate();

// Handle resize
window.addEventListener('resize',()=>{
  camera.aspect=window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth,window.innerHeight);
});
