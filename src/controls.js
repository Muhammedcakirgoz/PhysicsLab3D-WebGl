import { GUI } from './lib/dat.gui.module.js';

export function setupKeyboard(keyState) {
  window.addEventListener('keydown', e => keyState[e.key.toLowerCase()] = true);
  window.addEventListener('keyup',   e => keyState[e.key.toLowerCase()] = false);
}

export function setupGUI(objects, camera) {
  const gui = new GUI();

  function getMovableNames() {
    return objects.filter(o => !o.name.startsWith('Ramp')).map(o => o.name);
  }

  const ctrl = {
    mode: 'camera',
    selected: '',
    release: () => {
      const obj = objects.find(o => o.name === ctrl.selected);
      if (obj) {
        obj.isStatic = false;
        if (obj.body) {
          obj.body.pos = [...obj.pos];
          obj.body.vel = [0, 0, 0];
        }
      }
    }
  };

  gui.add(ctrl, 'mode', ['camera', 'object']).name('Kontrol Modu');
  let objController = gui.add(ctrl, 'selected', getMovableNames()).name('Seçili Nesne');
  gui.add(ctrl, 'release').name('Serbest Bırak');

  ctrl.updateList = () => {
    gui.remove(objController);
    const names = getMovableNames();
    objController = gui.add(ctrl, 'selected', names).name('Seçili Nesne');
    if (!names.includes(ctrl.selected)) ctrl.selected = names[0] || '';
  };

  const physFolder = gui.addFolder('Fizik Ayarları');
  physFolder.add(camera.pos, 2, 5, 20).name('Kamera Z');
  physFolder.open();

  ctrl.updateList();

  return ctrl;
}

export function moveObject(object, keyState, speed = 0.1) {
  if (!object || !object.isStatic) return;
  if (keyState['w']) object.pos[2] -= speed;
  if (keyState['s']) object.pos[2] += speed;
  if (keyState['a']) object.pos[0] -= speed;
  if (keyState['d']) object.pos[0] += speed;
  if (object.body) object.body.vel = [0, 0, 0];
}