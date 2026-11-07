import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const gloss = (color, extra = {}) =>
  new THREE.MeshPhysicalMaterial({ color, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.15, ...extra });
const neon = (color, power = 2.4) =>
  new THREE.MeshStandardMaterial({ color: '#000000', emissive: color, emissiveIntensity: power, roughness: 0.4 });

function vinyl() {
  const g = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.05, 72), gloss('#07060c', { roughness: 0.3 }));
  g.add(disc);
  for (let r = 0.85; r < 1.75; r += 0.13) {
    const groove = new THREE.Mesh(new THREE.TorusGeometry(r, 0.006, 6, 72), gloss('#2a2640'));
    groove.rotation.x = Math.PI / 2;
    groove.position.y = 0.03;
    g.add(groove);
  }
  const label = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.07, 40), neon('#ff2bd6', 1.6));
  const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.09, 16), gloss('#ffffff'));
  g.add(label, hole);
  g.rotation.x = 1.1;
  return g;
}

function headphones() {
  const g = new THREE.Group();
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.08, 14, 44, Math.PI), gloss('#f2efff'));
  g.add(band);
  for (const side of [-1, 1]) {
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.26, 32), gloss('#7a2bff'));
    cup.rotation.z = Math.PI / 2;
    cup.position.set(side * 0.85, -0.05, 0);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.025, 8, 32), neon('#27e6ff'));
    ring.rotation.y = Math.PI / 2;
    ring.position.set(side * 0.99, -0.05, 0);
    g.add(cup, ring);
  }
  return g;
}

function note(color) {
  const g = new THREE.Group();
  const mat = neon(color, 1.8);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 18, 14), mat);
  head.scale.set(1.25, 0.85, 0.8);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.8, 8), mat);
  stem.position.set(0.2, 0.4, 0);
  const flag = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.1, 0.05), mat);
  flag.position.set(0.36, 0.74, 0);
  flag.rotation.z = -0.5;
  g.add(head, stem, flag);
  return g;
}

function basketball() {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.SphereGeometry(1.35, 48, 36), gloss('#ff6a1f', { roughness: 0.55, clearcoat: 0.3 })));
  const seam = gloss('#120a0a');
  [[0, 0, 0], [Math.PI / 2, 0, 0], [0, Math.PI / 2, 0]].forEach((rot) => {
    const t = new THREE.Mesh(new THREE.TorusGeometry(1.355, 0.025, 8, 80), seam);
    t.rotation.set(...rot);
    g.add(t);
  });
  return g;
}

function soccerBall() {
  const g = new THREE.Group();
  const r = 0.95;
  g.add(new THREE.Mesh(new THREE.SphereGeometry(r, 40, 30), gloss('#f5f4ff', { roughness: 0.35 })));
  const dots = new THREE.DodecahedronGeometry(1).attributes.position;
  const seen = new Set();
  const v = new THREE.Vector3();
  for (let i = 0; i < dots.count; i++) {
    v.fromBufferAttribute(dots, i).normalize();
    const key = v.toArray().map((n) => n.toFixed(2)).join();
    if (seen.has(key)) continue;
    seen.add(key);
    const patch = new THREE.Mesh(new THREE.CircleGeometry(0.2, 5), gloss('#0c0a18'));
    patch.position.copy(v).multiplyScalar(r + 0.004);
    patch.lookAt(v.clone().multiplyScalar(4));
    g.add(patch);
  }
  return g;
}

function penNib() {
  const s = new THREE.Shape();
  s.moveTo(0, 1.5);
  s.bezierCurveTo(0.5, 0.7, 0.75, 0.1, 0.72, -0.5);
  s.lineTo(0.32, -1.3);
  s.lineTo(-0.32, -1.3);
  s.lineTo(-0.72, -0.5);
  s.bezierCurveTo(-0.75, 0.1, -0.5, 0.7, 0, 1.5);
  const hole = new THREE.Path();
  hole.absarc(0, 0.1, 0.16, 0, Math.PI * 2, true);
  s.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.14, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 4 });
  geo.center();
  const nib = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: '#cdb6ff', metalness: 1, roughness: 0.16 }));
  nib.rotation.z = Math.PI;
  return nib;
}

function bezier() {
  const g = new THREE.Group();
  const curve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(-1.8, -0.7, 0),
    new THREE.Vector3(-0.8, 1.6, 0),
    new THREE.Vector3(0.9, -1.6, 0),
    new THREE.Vector3(1.8, 0.7, 0),
  );
  g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 60, 0.035, 8), neon('#27e6ff', 2.6)));
  [curve.v0, curve.v3].forEach((p) => {
    const a = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.18), neon('#ff2bd6', 2));
    a.position.copy(p);
    g.add(a);
  });
  return g;
}

function swatch(color) {
  const g = new THREE.Group();
  const card = new THREE.Mesh(new RoundedBoxGeometry(0.95, 1.35, 0.04, 3, 0.02), gloss('#f7f5ff'));
  const chip = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.95), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.5 }));
  chip.position.set(0, 0.14, 0.022);
  g.add(card, chip);
  return g;
}

const place = (object, x, y, z, spin = 0.4) => {
  object.position.set(x, y, z);
  object.userData.home = new THREE.Vector3(x, y, z);
  object.userData.spin = spin;
  object.userData.base = object.rotation.clone();
  return object;
};

const BUILDERS = [
  () => [
    place(vinyl(), 0, 0, 0, 1.6),
    place(headphones(), 2.1, 1.5, 0.8, 0.5),
    place(note('#ff2bd6'), -2.3, 1.2, 0.4),
    place(note('#27e6ff'), -1.9, -1.6, 1),
    place(note('#b14dff'), 2.2, -1.5, 0.6),
  ],
  () => [
    place(basketball(), -0.3, 0.2, 0, 0.9),
    place(soccerBall(), 1.85, -0.9, 0.9, 1.1),
    place(new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.05, 10, 40), neon('#ff6a1f', 2.4)), -2.1, 1.7, -0.6, 0.3),
    place(new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.8, 24), gloss('#27e6ff')), 2.25, 1.45, 0.2),
    place(new THREE.Mesh(new THREE.SphereGeometry(0.28, 24, 18), neon('#c6ff3d', 1.6)), -2.3, -1.4, 0.8, 0.8),
  ],
  () => [
    place(penNib(), 0, 0, 0.3, 0.6),
    place(bezier(), 0.1, -0.2, -0.8, 0.12),
    place(swatch('#b14dff'), -2.3, 1, 0.3),
    place(swatch('#ff2bd6'), -2.05, -0.9, 0.8),
    place(swatch('#27e6ff'), 2.2, 1.05, 0.5),
    place(swatch('#c6ff3d'), 2.25, -1.05, 0.2),
  ],
];

/* Tres composiciones que giran juntas y se dispersan al irse, como un lanzamiento de producto. */
export function makeClusters() {
  return BUILDERS.map((build) => {
    const group = new THREE.Group();
    const parts = build();
    parts.forEach((part) => {
      part.traverse((o) => { if (o.isMesh) o.castShadow = true; });
      group.add(part);
    });
    return {
      group,
      update(near, time, pointer) {
        const away = Math.min(Math.abs(near), 1);
        const burst = away * away * (3 - 2 * away);
        group.visible = Math.abs(near) < 1;
        group.rotation.y = near * 1.4 + pointer.x * 0.35;
        group.rotation.x = -pointer.y * 0.2;
        parts.forEach((part, i) => {
          const { home, spin, base } = part.userData;
          part.position.copy(home).multiplyScalar(1 + burst * 2.4);
          part.position.y += Math.sin(time * 1.1 + i * 1.7) * 0.07;
          part.rotation.x = base.x + (i ? near * 2.2 + time * spin * 0.35 : Math.sin(time * 0.5) * 0.08);
          part.rotation.y = base.y + near * 3 * (i % 2 ? -1 : 1) + time * spin * 0.5;
        });
      },
    };
  });
}
