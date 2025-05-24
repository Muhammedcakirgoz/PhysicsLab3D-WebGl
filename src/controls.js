import { GUI } from './lib/dat.gui.module.js';
export function setupKeyboard(keyState) {
  window.addEventListener('keydown', e => keyState[e.key.toLowerCase()] = true);
  window.addEventListener('keyup',   e => keyState[e.key.toLowerCase()] = false);
}

export function setupGUI(objects, camera) {
  const gui = new GUI();
  const objNames = objects.map(o => o.name);
  const ctrl = { selected: objNames[0] };
  gui.add(ctrl, 'selected', objNames).name('Seçili Nesne');
  const physFolder = gui.addFolder('Fizik Ayarları');
  physFolder.add(camera.pos, 2, 5, 20).name('Kamera Z');
  physFolder.open();
  return ctrl;
}