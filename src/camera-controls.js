import { vec3, mat4 } from './lib/gl-matrix/index.js';

export class CameraController {
  constructor(canvas, camera) {
    this.canvas = canvas;
    this.camera = camera;

    this.yaw = -90;   // Y ekseni etrafında
    this.pitch = 0;   // X ekseni etrafında
    this.speed = 0.1;
    this.sensitivity = 0.2;
    this.keys = {};

    this.direction = vec3.create();
    this.front = vec3.fromValues(0, 0, -1);
    this.right = vec3.create();
    this.up = vec3.fromValues(0, 1, 0);

    this._initEvents();
  }

  _initEvents() {
    // Fare hareketi
    this.canvas.addEventListener('mousemove', (e) => {
      if (!e.buttons) return;
      this.yaw   += e.movementX * this.sensitivity;
      this.pitch -= e.movementY * this.sensitivity;
      this.pitch = Math.max(-89, Math.min(89, this.pitch));
      this._updateFront();
    });

    // Klavye kontrolü
    window.addEventListener('keydown', e => this.keys[e.key.toLowerCase()] = true);
    window.addEventListener('keyup',   e => this.keys[e.key.toLowerCase()] = false);
  }

  _updateFront() {
    const radY = this.yaw * Math.PI / 180;
    const radP = this.pitch * Math.PI / 180;
    this.front[0] = Math.cos(radP) * Math.cos(radY);
    this.front[1] = Math.sin(radP);
    this.front[2] = Math.cos(radP) * Math.sin(radY);
    vec3.normalize(this.front, this.front);
    vec3.cross(this.right, this.front, this.up);
    vec3.normalize(this.right, this.right);
  }

  update() {
    const move = vec3.create();
    if (this.keys['w']) vec3.scaleAndAdd(move, move, this.front,  this.speed);
    if (this.keys['s']) vec3.scaleAndAdd(move, move, this.front, -this.speed);
    if (this.keys['a']) vec3.scaleAndAdd(move, move, this.right, -this.speed);
    if (this.keys['d']) vec3.scaleAndAdd(move, move, this.right,  this.speed);
    vec3.add(this.camera.pos, this.camera.pos, move);
    vec3.add(this.camera.target, this.camera.pos, this.front);
    this.camera.updateView();
  }
}
