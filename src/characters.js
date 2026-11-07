import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const mat = (color, roughness = 0.45) => new THREE.MeshStandardMaterial({ color, roughness });

export const CHARACTERS = {
  juan: 'Juan',
  ruler: 'Ruler',
  clock: 'Clock',
  blender: 'Blender',
  pencil: 'Pencil',
  camera: 'Camera',
  pad: 'Gamepad',
};
export const HATS = { none: 'Nothing', cap: 'Cap', crown: 'Crown', phones: 'Headphones' };
export const SWATCHES = {
  body: ['#7a2bff', '#ff2bd6', '#27e6ff', '#c6ff3d', '#ff6a1f', '#f2efff'],
  accent: ['#1c1420', '#ffc629', '#ff2bd6', '#27e6ff', '#f2efff'],
  skin: ['#f3cfa9', '#d9a47a', '#a8734a', '#6b4429'],
};

function limb(color, length, radius = 0.09) {
  const pivot = new THREE.Group();
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, length, 6, 12), mat(color));
  mesh.position.y = -length / 2 - radius;
  mesh.castShadow = true;
  pivot.add(mesh);
  return pivot;
}

function addEye(parent, x, y, z, size = 0.15) {
  const white = new THREE.Mesh(new THREE.SphereGeometry(size, 20, 16), mat('#ffffff', 0.25));
  white.position.set(x, y, z);
  const pupil = new THREE.Mesh(new THREE.SphereGeometry(size * 0.52, 14, 12), mat('#0c0e2b', 0.2));
  pupil.position.z = size * 0.72;
  white.add(pupil);
  parent.add(white);
  return pupil;
}

const BODIES = {
  pencil(body, c) {
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 1.25, 6), mat(c('body', '#ffc629')));
    shaft.position.y = 1.15;
    const wood = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.45, 6), mat('#f3cfa9'));
    wood.position.y = 0.32;
    wood.rotation.x = Math.PI;
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.37, 0.14, 6), mat('#cfcbea', 0.3));
    band.position.y = 1.84;
    const eraser = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.2, 18), mat(c('accent', '#ff2bd6')));
    eraser.position.y = 2;
    body.add(shaft, wood, band, eraser);
    return { eyes: [addEye(body, -0.14, 1.4, 0.3, 0.12), addEye(body, 0.14, 1.4, 0.3, 0.12)], color: '#120a2c', shoulder: 1.15, armX: 0.44 };
  },
  camera(body, c) {
    const box = new THREE.Mesh(new RoundedBoxGeometry(1.3, 0.95, 0.6, 3, 0.12), mat(c('body', '#191433')));
    box.position.y = 1.15;
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.38, 0.4, 28), mat('#0c0a18', 0.2));
    lens.rotation.x = Math.PI / 2;
    lens.position.set(0, 1.08, 0.46);
    const flash = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.2), mat(c('accent', '#ff2bd6')));
    flash.position.set(0.32, 1.7, 0);
    body.add(box, lens, flash);
    return { eyes: [addEye(body, -0.14, 1.12, 0.66, 0.12), addEye(body, 0.14, 1.12, 0.66, 0.12)], color: '#f2efff', shoulder: 1.1, armX: 0.74 };
  },
  pad(body, c) {
    const shell = new THREE.Mesh(new RoundedBoxGeometry(1.5, 0.82, 0.42, 4, 0.2), mat(c('body', '#7a2bff')));
    shell.position.y = 1.15;
    const stick = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 10), mat('#0c0a18'));
    stick.position.set(-0.48, 1.0, 0.26);
    const dots = ['#27e6ff', '#c6ff3d'].map((color, i) => {
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), mat(i ? color : c('accent', color)));
      dot.position.set(0.42 + i * 0.16, 0.96 + i * 0.1, 0.22);
      return dot;
    });
    body.add(shell, stick, ...dots);
    return { eyes: [addEye(body, -0.18, 1.34, 0.24, 0.12), addEye(body, 0.18, 1.34, 0.24, 0.12)], color: '#120a2c', shoulder: 1.15, armX: 0.8 };
  },
  juan(body, c) {
    const torso = new THREE.Mesh(new RoundedBoxGeometry(0.82, 0.72, 0.5, 4, 0.17), mat(c('body', '#7a2bff')));
    torso.position.y = 0.92;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.46, 28, 22), mat(c('skin', '#d9a47a')));
    head.position.y = 1.62;
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.49, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.5),
      mat(c('accent', '#1c1420'), 0.7),
    );
    hair.position.y = 1.67;
    hair.rotation.x = -0.28;
    body.add(torso, head, hair);
    return { eyes: [addEye(body, -0.16, 1.66, 0.39, 0.1), addEye(body, 0.16, 1.66, 0.39, 0.1)], color: '#2430e0', shoulder: 1.15, armX: 0.5 };
  },
  ruler(body, c) {
    const blade = new THREE.Mesh(new RoundedBoxGeometry(0.72, 1.7, 0.2, 3, 0.06), mat(c('body', '#ffc629')));
    blade.position.y = 1.28;
    body.add(blade);
    for (let i = 0; i < 9; i++) {
      const tick = new THREE.Mesh(new THREE.BoxGeometry(i % 2 ? 0.14 : 0.26, 0.03, 0.02), mat('#0c0e2b'));
      tick.position.set(-0.36 + (i % 2 ? 0.08 : 0.14), 0.56 + i * 0.18, 0.1);
      body.add(tick);
    }
    return { eyes: [addEye(body, -0.13, 1.72, 0.12), addEye(body, 0.2, 1.72, 0.12)], color: '#0c0e2b', shoulder: 1.2, armX: 0.42 };
  },
  clock(body, c) {
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.3, 40), mat(c('body', '#ff4b33')));
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 1.2;
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.58, 36), mat('#ffffff', 0.3));
    face.position.set(0, 1.2, 0.155);
    const hand = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.34, 0.02), mat('#0c0e2b'));
    hand.position.set(0, 1.02, 0.17);
    const bellL = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat('#ffc629'));
    bellL.position.set(-0.45, 1.86, 0);
    bellL.rotation.z = 0.5;
    const bellR = bellL.clone();
    bellR.position.x = 0.45;
    bellR.rotation.z = -0.5;
    body.add(rim, face, hand, bellL, bellR);
    return { eyes: [addEye(body, -0.2, 1.36, 0.2), addEye(body, 0.2, 1.36, 0.2)], color: '#0c0e2b', shoulder: 1.15, armX: 0.74 };
  },
  blender(body, c) {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.42, 28), mat(c('body', '#ff4b33')));
    base.position.y = 0.72;
    const jar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.36, 0.95, 28),
      new THREE.MeshPhysicalMaterial({ color: '#c8d0ff', roughness: 0.12, transparent: true, opacity: 0.72 }),
    );
    jar.position.y = 1.4;
    const juice = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.33, 0.42, 24), mat(c('accent', '#ffc629')));
    juice.position.y = 1.16;
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.53, 0.53, 0.12, 28), mat('#0c0e2b'));
    lid.position.y = 1.92;
    body.add(base, juice, jar, lid);
    return { eyes: [addEye(body, -0.17, 1.55, 0.42), addEye(body, 0.17, 1.55, 0.42)], color: '#0c0e2b', shoulder: 1.05, armX: 0.52 };
  },
};

function addHat(body, hat, color) {
  const top = new THREE.Box3().setFromObject(body).max.y;
  if (hat === 'cap') {
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(color));
    const brim = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.04, 0.34), mat(color));
    dome.position.y = top - 0.06;
    brim.position.set(0, top - 0.05, 0.3);
    body.add(dome, brim);
  } else if (hat === 'crown') {
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.27, 0.3, 6, 1, true), new THREE.MeshStandardMaterial({ color: '#ffc629', metalness: 1, roughness: 0.25, side: THREE.DoubleSide }));
    crown.position.y = top + 0.1;
    body.add(crown);
  } else if (hat === 'phones') {
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.05, 10, 30, Math.PI), mat(color));
    band.position.y = top - 0.5;
    body.add(band);
    [-0.5, 0.5].forEach((x) => {
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.1, 18), mat('#ff2bd6'));
      cup.rotation.z = Math.PI / 2;
      cup.position.set(x, top - 0.5, 0);
      body.add(cup);
    });
  }
}

export function makeCharacter(kind, look = {}) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const pickColor = (key, fallback) => look[key] ?? fallback;
  const { eyes, color, shoulder, armX } = BODIES[kind](body, pickColor);
  addHat(body, look.hat ?? (kind === 'juan' ? 'phones' : 'none'), look.accent && look.accent !== '#1c1420' ? look.accent : '#ffc629');
  body.traverse((o) => { if (o.isMesh) o.castShadow = true; });

  const legs = [-0.2, 0.2].map((x) => {
    const leg = limb(color, 0.32, 0.1);
    leg.position.set(x, 0.5, 0);
    root.add(leg);
    return leg;
  });
  const arms = [-1, 1].map((side) => {
    const arm = limb(color, 0.4, 0.075);
    arm.position.set(side * armX, shoulder, 0);
    arm.rotation.z = side * 0.25;
    root.add(arm);
    return arm;
  });

  let jump = 0;
  let wave = 0;

  return {
    root,
    jump() {
      jump = 1;
      wave = 1.4;
    },
    update({ dt, walk = 0, speed = 0, look, cheer = false, time = 0 }) {
      jump = Math.max(jump - dt * 1.7, 0);
      wave = Math.max(wave - dt, 0);
      const swing = Math.sin(walk) * 0.75 * speed;
      legs[0].rotation.x = swing;
      legs[1].rotation.x = -swing;
      arms[0].rotation.x = -swing;
      arms[1].rotation.x = swing;

      const waving = wave > 0 || cheer;
      arms[1].rotation.z = waving ? 2.6 + Math.sin(time * 11) * 0.35 : 0.25;
      arms[0].rotation.z = cheer ? -2.6 - Math.sin(time * 11) * 0.35 : -0.25;

      const arc = Math.sin(jump * Math.PI);
      const hop = cheer ? Math.abs(Math.sin(time * 5)) * 0.35 : Math.abs(Math.sin(walk)) * 0.14 * speed;
      body.position.y = arc * 1.15 + hop;
      legs.forEach((leg) => { leg.position.y = 0.5 + arc * 1.15 + hop; });
      arms.forEach((arm) => { arm.position.y = shoulder + arc * 1.15 + hop; });
      body.scale.y = 1 - Math.sin(jump * Math.PI * 2) * 0.05;

      if (look) eyes.forEach((pupil) => {
        pupil.position.x += (look.x * 0.06 - pupil.position.x) * 0.2;
        pupil.position.y += (look.y * 0.06 - pupil.position.y) * 0.2;
      });
    },
  };
}
