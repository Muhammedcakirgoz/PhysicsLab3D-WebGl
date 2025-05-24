import { mat4 } from './lib/gl-matrix/index.js';
export class Camera {
  constructor(aspect) {
    this.proj = mat4.create();
    this.view = mat4.create();
    this.pos = [5, 5, 10];
    this.target = [0, 0, 0];
    mat4.perspective(this.proj, Math.PI/4, aspect, 0.1, 1000);
  }
  updateView() {
    mat4.lookAt(this.view, this.pos, this.target, [0,1,0]);
  }
}