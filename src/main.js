import { mat4, vec3 }                     from './lib/gl-matrix/index.js';
import { GUI }                            from './lib/dat.gui.module.js';
import { createProgram }                  from './webgl-utils.js';
import { createBox, createSphere, createCurvedRamp } from './geometry.js';
import { Camera }                         from './camera.js';
import { Body }                           from './physics.js';
import { setupKeyboard }                  from './controls.js';
import { CameraController }               from './camera-controls.js';
import { loadTexture }                    from './texture-loader.js';


const canvas = document.getElementById('glcanvas');
const gl = canvas.getContext('webgl2');
if (!gl) throw new Error('WebGL2 desteklenmiyor!');
canvas.width  = window.innerWidth;
canvas.height = window.innerHeight;
gl.viewport(0, 0, canvas.width, canvas.height);

// Shader kaynakları
const vsSrc = `#version 300 es
in vec3 aPosition;
in vec3 aNormal;
uniform mat4 uModel, uView, uProj;
out vec3 vNormal;
void main(){
  gl_Position = uProj * uView * uModel * vec4(aPosition, 1);
  vNormal    = mat3(uModel) * aNormal;
}`;

const fsSrc = `#version 300 es
precision highp float;
in vec3 vNormal;
uniform vec3 uLightDir;
uniform sampler2D uTexture;
out vec4 outColor;
void main(){
  vec3 normal = normalize(vNormal);
  float diff = max(dot(normal, normalize(uLightDir)), 0.0);
  float light = 0.3 + 0.7 * diff; // ambient + diffuse
  vec4 texColor = texture(uTexture, vec2(0.5, 0.5));
  outColor = vec4(texColor.rgb * light, 1.0);
}`;

const program = createProgram(gl, vsSrc, fsSrc);
gl.useProgram(program);

const cam = new Camera(canvas.width / canvas.height);
cam.pos = [0, 2, 6];      // Kamera biraz yukarıdan ve geriden baksın
cam.target = [0, 0, 0];   // Sahne merkezine baksın
const camCtrl = new CameraController(canvas, cam);
cam.updateView();

function setupGeometry(geo) {
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    geo.positions.byteLength + geo.normals.byteLength,
    gl.STATIC_DRAW
  );
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, geo.positions);
  gl.bufferSubData(gl.ARRAY_BUFFER, geo.positions.byteLength, geo.normals);

  const ibo = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geo.indices, gl.STATIC_DRAW);

  const posLoc  = gl.getAttribLocation(program, 'aPosition');
  const normLoc = gl.getAttribLocation(program, 'aNormal');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(normLoc);
  gl.vertexAttribPointer(normLoc, 3, gl.FLOAT, false, 0, geo.positions.byteLength);

  return { vao, count: geo.indices.length };
}

const boxGeo    = setupGeometry(createBox(1,1,1));
const sphereGeo = setupGeometry(createSphere(0.5, 16, 16));
const ramp1Geo = setupGeometry(createCurvedRamp());
const ramp2Geo = setupGeometry(createCurvedRamp());
const ramp3Geo = setupGeometry(createCurvedRamp());



const metalTexture  = loadTexture(gl, './assets/textures/metal.jpg');
const rubberTexture = loadTexture(gl, './assets/textures/rubber.jpg');
const woodTexture   = loadTexture(gl, './assets/textures/wood.jpg');

let objects = [
  {
    name: 'Ramp 1',
    geo: ramp1Geo,
    pos: [-2.5, 0, 0], // sola kaydır
    texture: metalTexture,
    body: new Body([-2.5, 0, 0], 0)
  },
  {
    name: 'Ramp 2',
    geo: ramp2Geo,
    pos: [0, 0, 0],
    texture: woodTexture,
    body: new Body([0, 0, 0], 0)
  },
  {
    name: 'Ramp 3',
    geo: ramp3Geo,
    pos: [2.5, 0, 0], // sağa kaydır
    texture: rubberTexture,
    body: new Body([2.5, 0, 0], 0)
  }
];


const gui = new GUI();
const nesnePanel = gui.addFolder('Yeni Nesne Ekle');

const state = {
  tür: 'Küre',
  şerit: 'Orta',
  ekle: () => {
    let posX = 0;
    if (state.şerit === 'Sol')   posX = -2.5;
    if (state.şerit === 'Orta')  posX = 0;
    if (state.şerit === 'Sağ')   posX = 2.5;

    const posZ = -5; // rampanın başı Z ekseninde buradan başlıyorsa
    const rampY = z => -Math.tanh(z / 2) * 2;
    const posY = rampY(posZ) + 0.5; // rampanın üstüne 0.5 birim yükseklikten

    let yeni;
    if (state.tür === 'Kutu') {
      yeni = {
        name: 'Kutu',
        geo: boxGeo,
        pos: [posX, posY, posZ],
        texture: rubberTexture,
        body: new Body([posX, posY, posZ], 1, 0.6)
      };
    } else if (state.tür === 'Küre') {
      yeni = {
        name: 'Küre',
        geo: sphereGeo,
        pos: [posX, posY, posZ],
        texture: metalTexture,
        body: new Body([posX, posY, posZ], 1, 0.1)
      };
    } else if (state.tür === 'Silindir') {
      yeni = {
        name: 'Silindir',
        geo: boxGeo,
        pos: [posX, posY, posZ],
        texture: woodTexture,
        body: new Body([posX, posY, posZ], 1, 0.3)
      };
    }

    objects.push(yeni);
  }
};


// GUI seçenekleri
nesnePanel.add(state, 'tür', ['Kutu', 'Küre', 'Silindir']).name('Nesne Türü');
nesnePanel.add(state, 'şerit', ['Sol', 'Orta', 'Sağ']).name('Şerit');
nesnePanel.add(state, 'ekle').name('Ekle');
nesnePanel.open();


const keyState = {};
setupKeyboard(keyState);

function animate() {
  requestAnimationFrame(animate);
  camCtrl.update();
  const dt = 1 / 60;

  objects.forEach(o => {
    if (o.body && o.body.mass > 0) {
      o.body.step(dt);
      if (o.body.pos[1] < -1.2) {
        o.body.pos[1] = -1.2;
        o.body.vel[1] = 0;
      }
      o.pos = [...o.body.pos];
    }
  });

  gl.clearColor(0.1, 0.1, 0.1, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);

  gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uView'), false, cam.view);
  gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uProj'), false, cam.proj);

  const lightDir = vec3.fromValues(0.4, 1, 0.5);
  gl.uniform3fv(gl.getUniformLocation(program, 'uLightDir'), lightDir);

  objects.forEach(o => {
    const m = mat4.create();
    mat4.translate(m, m, o.pos);
    if (o.rotX) mat4.rotateX(m, m, o.rotX);

    gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uModel'), false, m);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, o.texture);
    gl.uniform1i(gl.getUniformLocation(program, 'uTexture'), 0);

    gl.bindVertexArray(o.geo.vao);
    gl.drawElements(gl.TRIANGLES, o.geo.count, gl.UNSIGNED_SHORT, 0);
  });
}

animate();

window.addEventListener('resize', () => {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  gl.viewport(0, 0, canvas.width, canvas.height);
  cam.proj = mat4.perspective(mat4.create(), Math.PI / 4, canvas.width / canvas.height, 0.1, 1000);
});
