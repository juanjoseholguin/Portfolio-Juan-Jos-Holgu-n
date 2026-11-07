import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const mat = (color, roughness = 0.45) => new THREE.MeshStandardMaterial({ color, roughness });

export const CHARACTERS = {
  juan: 'Juan',
  ruler: 'Ruler',
  clock: 'Clock',
  blender: 'Blender',
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
  juan(body) {
    const torso = new THREE.Mesh(new RoundedBoxGeometry(0.82, 0.72, 0.5, 4, 0.17), mat('#2430e0'));
    torso.position.y = 0.92;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.46, 28, 22), mat('#d9a47a'));
    head.position.y = 1.62;
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.49, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.5),
      mat('#1c1420', 0.7),
    );
    hair.position.y = 1.67;
    hair.rotation.x = -0.28;
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.05, 10, 30, Math.PI), mat('#ffc629'));
    band.position.y = 1.64;
    const cups = [-0.5, 0.5].map((x) => {
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.1, 18), mat('#ff4b33'));
      cup.rotation.z = Math.PI / 2;
      cup.position.set(x, 1.62, 0);
      return cup;
    });
    body.add(torso, head, hair, band, ...cups);
    return { eyes: [addEye(body, -0.16, 1.66, 0.39, 0.1), addEye(body, 0.16, 1.66, 0.39, 0.1)], color: '#2430e0', shoulder: 1.15, armX: 0.5 };
  },
  ruler(body) {
    const blade = new THREE.Mesh(new RoundedBoxGeometry(0.72, 1.7, 0.2, 3, 0.06), mat('#ffc629'));
    blade.position.y = 1.28;
    body.add(blade);
    for (let i = 0; i < 9; i++) {
      const tick = new THREE.Mesh(new THREE.BoxGeometry(i % 2 ? 0.14 : 0.26, 0.03, 0.02), mat('#0c0e2b'));
      tick.position.set(-0.36 + (i % 2 ? 0.08 : 0.14), 0.56 + i * 0.18, 0.1);
      body.add(tick);
    }
    return { eyes: [addEye(body, -0.13, 1.72, 0.12), addEye(body, 0.2, 1.72, 0.12)], color: '#0c0e2b', shoulder: 1.2, armX: 0.42 };
  },
  clock(body) {
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.3, 40), mat('#ff4b33'));
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
  blender(body) {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.42, 28), mat('#ff4b33'));
    base.position.y = 0.72;
    const jar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.36, 0.95, 28),
      new THREE.MeshPhysicalMaterial({ color: '#c8d0ff', roughness: 0.12, transparent: true, opacity: 0.72 }),
    );
    jar.position.y = 1.4;
    const juice = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.33, 0.42, 24), mat('#ffc629'));
    juice.position.y = 1.16;
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.53, 0.53, 0.12, 28), mat('#0c0e2b'));
    lid.position.y = 1.92;
    body.add(base, juice, jar, lid);
    return { eyes: [addEye(body, -0.17, 1.55, 0.42), addEye(body, 0.17, 1.55, 0.42)], color: '#0c0e2b', shoulder: 1.05, armX: 0.52 };
  },
};

export function makeCharacter(kind) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const { eyes, color, shoulder, armX } = BODIES[kind](body);
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
