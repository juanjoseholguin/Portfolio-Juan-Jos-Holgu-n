import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { OutlineEffect } from 'three/examples/jsm/effects/OutlineEffect.js';
import { makeCharacter } from './characters.js';
import { makeSkillBalls } from './skill-balls.js';
import { makeClusters } from './objects.js';
import { LOW } from './quality.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

const COLORS = {
  paper: new THREE.Color('#08060f'),
  ultra: new THREE.Color('#3a10d8'),
  ink: new THREE.Color('#05040a'),
  music: new THREE.Color('#16042c'),
  sport: new THREE.Color('#2a0a12'),
  design: new THREE.Color('#031a24'),
};
const PLANET = { z: -20, radius: 9.5 };
const CARD = { w: 5.2, h: 4.06, gap: 15, firstZ: -66, baseY: -0.6 };
const TAN_HALF_FOV = Math.tan(THREE.MathUtils.degToRad(17.5));

const glossy = (color, extra = {}) =>
  LOW
    ? new THREE.MeshStandardMaterial({ color, roughness: 0.32 })
    : new THREE.MeshPhysicalMaterial({ color, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.2, ...extra });
const gold = () => new THREE.MeshStandardMaterial({ color: '#ffc629', metalness: 1, roughness: 0.24 });

/* Piezas del juego */

function makePawn(color = '#ff4b33') {
  const profile = [
    [0, 0], [0.62, 0], [0.66, 0.12], [0.5, 0.26], [0.28, 0.42], [0.2, 0.8], [0.26, 0.92],
    [0.2, 1], [0.36, 1.16], [0.4, 1.34], [0.32, 1.54], [0.14, 1.67], [0, 1.7],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const mesh = new THREE.Mesh(new THREE.LatheGeometry(profile, 40), glossy(color));
  mesh.castShadow = true;
  return mesh;
}

function makeDie(size = 1, body = '#ffffff', pip = '#2430e0') {
  const group = new THREE.Group();
  const cube = new THREE.Mesh(new RoundedBoxGeometry(size, size, size, 5, size * 0.17), glossy(body));
  cube.castShadow = true;
  group.add(cube);
  const pipGeo = new THREE.SphereGeometry(size * 0.085, 16, 12);
  const pipMat = glossy(pip);
  const o = size * 0.25;
  const faces = [
    { n: [0, 0, 1], pts: [[0, 0]] },
    { n: [0, 0, -1], pts: [[-o, -o], [-o, 0], [-o, o], [o, -o], [o, 0], [o, o]] },
    { n: [0, 1, 0], pts: [[-o, -o], [0, 0], [o, o]] },
    { n: [0, -1, 0], pts: [[-o, -o], [o, -o], [0, 0], [-o, o], [o, o]] },
    { n: [1, 0, 0], pts: [[-o, -o], [o, o]] },
    { n: [-1, 0, 0], pts: [[-o, -o], [o, -o], [-o, o], [o, o]] },
  ];
  for (const { n, pts } of faces) {
    const normal = new THREE.Vector3(...n);
    const u = Math.abs(normal.y) > 0.5 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    const v = new THREE.Vector3().crossVectors(normal, u);
    for (const [a, b] of pts) {
      const dot = new THREE.Mesh(pipGeo, pipMat);
      dot.position.copy(normal).multiplyScalar(size * 0.49).addScaledVector(u, a).addScaledVector(v, b);
      dot.scale.setScalar(1);
      group.add(dot);
    }
  }
  return group;
}

function makeCursor(color = '#ffc629') {
  const s = new THREE.Shape();
  [[0, 0], [0, -1.5], [0.38, -1.15], [0.68, -1.82], [0.98, -1.68], [0.68, -1.03], [1.14, -1.03]].forEach(([x, y], i) =>
    i ? s.lineTo(x, y) : s.moveTo(x, y),
  );
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: 0.26, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 4,
  });
  geo.center();
  return new THREE.Mesh(geo, glossy(color));
}

function makeSwitch() {
  const group = new THREE.Group();
  group.add(new THREE.Mesh(new RoundedBoxGeometry(2, 1, 0.5, 6, 0.25), glossy('#ffffff')));
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.4, 32, 24), glossy('#ff4b33'));
  knob.position.set(0.48, 0, 0.26);
  group.add(knob);
  return group;
}

function makeTrophy(icon) {
  const group = new THREE.Group();
  const plinth = new THREE.Mesh(new RoundedBoxGeometry(2.3, 0.7, 2.3, 5, 0.12), glossy('#2430e0'));
  plinth.position.y = 0.35;
  plinth.castShadow = true;
  group.add(plinth);
  const cup = [
    [0, 0.7], [0.72, 0.7], [0.74, 0.82], [0.28, 0.96], [0.15, 1.5], [0.2, 1.72], [0.55, 1.92],
    [0.92, 2.5], [1.04, 3.3], [1.1, 3.42], [1.0, 3.42], [0.88, 2.7], [0.5, 2.1], [0, 2],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const body = new THREE.Mesh(new THREE.LatheGeometry(cup, 48), gold());
  body.material.side = THREE.DoubleSide;
  group.add(body);
  for (const angle of [0, Math.PI]) {
    const pivot = new THREE.Group();
    pivot.rotation.y = angle;
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.075, 16, 32, Math.PI * 1.15), gold());
    handle.position.set(1.02, 2.82, 0);
    handle.rotation.z = -Math.PI / 2;
    pivot.add(handle);
    group.add(pivot);
  }
  let top;
  if (icon === 'die') {
    top = makeDie(0.82, '#ffffff', '#ff4b33');
    top.rotation.set(0.6, 0.5, 0.25);
  } else if (icon === 'film') {
    top = new THREE.Group();
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.2, 40), glossy('#ff4b33'));
    disc.rotation.x = Math.PI / 2;
    top.add(disc);
    const tri = new THREE.Shape();
    tri.moveTo(-0.2, 0.28);
    tri.lineTo(0.34, 0);
    tri.lineTo(-0.2, -0.28);
    tri.closePath();
    const play = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: 0.3, bevelEnabled: false }), glossy('#ffffff'));
    play.position.z = -0.15;
    top.add(play);
  } else {
    top = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 0), gold());
  }
  top.position.y = 4.12;
  group.add(top);
  group.userData.top = top;
  group.userData.topFaces = icon === 'film';
  return group;
}

function roundedRect(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function keyLabel(text, fg) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = fg;
  ctx.font = `600 ${text.length > 8 ? 38 : 44}px Poppins, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/* Escena completa */

export function createScene(canvas, { projects, awards, links, skills, reducedMotion, character, look: avatarLook, onOpenProject, onCoin, onRollDie, onGreet }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !LOW, powerPreference: 'high-performance' });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(COLORS.paper.clone(), 22, 60);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.42;

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 220);
  const sun = new THREE.DirectionalLight('#ffffff', 2.1);
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 60 });
  sun.shadow.bias = -0.0006;
  sun.intensity = 0.9;
  const neonA = new THREE.PointLight('#b14dff', 70, 60, 1.7);
  const neonB = new THREE.PointLight('#27e6ff', 50, 60, 1.7);
  scene.add(sun, sun.target, neonA, neonB);

  /* Planeta */
  const planet = new THREE.Mesh(
    new THREE.SphereGeometry(PLANET.radius, LOW ? 56 : 80, LOW ? 36 : 56),
    new THREE.ShaderMaterial({
      uniforms: { uBase: { value: COLORS.ultra.clone() }, uRim: { value: new THREE.Color('#f08bff') } },
      vertexShader: `
        varying vec3 vN; varying vec3 vV;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vN = normalize(normalMatrix * normal);
          vV = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform vec3 uBase; uniform vec3 uRim;
        varying vec3 vN; varying vec3 vV;
        void main() {
          float rim = pow(1.0 - max(dot(normalize(vN), normalize(vV)), 0.0), 3.2);
          float top = smoothstep(-0.2, 1.0, vN.y * 0.7 - vN.x * 0.4);
          gl_FragColor = vec4(mix(uBase, uRim, rim * (0.45 + top)), 1.0);
          #include <colorspace_fragment>
        }`,
      toneMapped: false,
    }),
  );
  planet.position.z = PLANET.z;
  scene.add(planet);

  /* Objetos que flotan: los mismos del tablero */
  const floaters = [];
  const addFloater = (object, base, scale, spin, faces = false) => {
    object.userData.size = scale;
    object.position.set(...base);
    object.userData.base = new THREE.Vector3(...base);
    object.userData.spin = spin;
    object.userData.faces = faces;
    object.userData.phase = floaters.length * 1.7;
    floaters.push(object);
    scene.add(object);
  };
  addFloater(makeDie(1.3), [-5.9, 3.2, -6], 1, [0.3, 0.4]);
  addFloater(makeCursor(), [5.7, 2.9, -7], 0.95, [0.1, 0.35], true);
  addFloater(makePawn(), [-6.6, -3.6, -8], 1.1, [0, 0.45]);
  addFloater(makeSwitch(), [5, -3.5, -6], 0.95, [0.15, 0.25], true);
  addFloater(makeDie(1.8, '#ffc629', '#0c0e2b'), [-8.2, 2.8, -40], 1, [0.3, 0.2]);
  addFloater(makePawn('#ffffff'), [7.8, -3.9, -39], 1.8, [0, 0.3]);
  addFloater(makeCursor('#ff4b33'), [8, 3.1, -42], 1.3, [0.1, 0.3], true);
  addFloater(makeSwitch(), [-7.3, -3.7, -38], 1.25, [0.2, 0.2], true);

  const starGeo = new THREE.BufferGeometry();
  const starCount = 420;
  const stars = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    stars[i * 3] = (Math.random() - 0.5) * 44;
    stars[i * 3 + 1] = (Math.random() - 0.5) * 26;
    stars[i * 3 + 2] = -24 - Math.random() * 30;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(stars, 3));
  const starField = new THREE.Points(
    starGeo,
    new THREE.PointsMaterial({ color: '#ffffff', size: 0.07, transparent: true, opacity: 0, depthWrite: false, fog: false }),
  );
  scene.add(starField);

  /* Pista de casillas */
  const count = Math.max(projects.length, 1);
  const trackPoints = [];
  for (let i = -1; i <= count; i++) {
    trackPoints.push(new THREE.Vector3(Math.sin(i * 0.9) * 2.4, 0, CARD.firstZ + 2.8 - i * CARD.gap));
  }
  const track = new THREE.CatmullRomCurve3(trackPoints);
  const tileCount = Math.round(track.getLength() / 1.75);
  const tiles = new THREE.InstancedMesh(
    new RoundedBoxGeometry(1.5, 0.22, 1.5, 3, 0.07),
    new THREE.MeshPhysicalMaterial({ roughness: 0.35, clearcoat: 0.6 }),
    tileCount,
  );
  const tileColors = ['#8a3bff', '#191433', '#27e6ff', '#191433', '#ff2bd6', '#191433'].map((c) => new THREE.Color(c));
  const dummy = new THREE.Object3D();
  for (let i = 0; i < tileCount; i++) {
    const t = i / (tileCount - 1);
    const p = track.getPointAt(t);
    const tangent = track.getTangentAt(t);
    dummy.position.set(p.x, -1.1, p.z);
    dummy.rotation.y = Math.atan2(tangent.x, tangent.z);
    dummy.updateMatrix();
    tiles.setMatrixAt(i, dummy.matrix);
    tiles.setColorAt(i, tileColors[i % tileColors.length]);
  }
  tiles.castShadow = tiles.receiveShadow = true;
  scene.add(tiles);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(90, Math.abs(count * CARD.gap) + 90),
    new THREE.ShadowMaterial({ opacity: 0.55, color: '#000000' }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -1.22, CARD.firstZ - (count * CARD.gap) / 2);
  ground.receiveShadow = true;
  scene.add(ground);

  /* Tarjetas con las portadas de Behance */
  const loader = new THREE.TextureLoader();
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const shape = roundedRect(CARD.w, CARD.h, 0.26);
  const frontGeo = new THREE.ShapeGeometry(shape, 12);
  const uv = frontGeo.attributes.uv;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, (uv.getX(i) + CARD.w / 2) / CARD.w, (uv.getY(i) + CARD.h / 2) / CARD.h);
  }
  frontGeo.translate(0, CARD.h / 2, 0);
  const backGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.12, bevelEnabled: false, curveSegments: 12 });
  backGeo.translate(0, CARD.h / 2, -0.125);
  const backMat = glossy('#ffffff');

  const cards = projects.map((project, i) => {
    const side = i % 2 === 0 ? -1 : 1;
    const group = new THREE.Group();
    const front = new THREE.Mesh(frontGeo, new THREE.MeshBasicMaterial({ color: '#cdd2f5', toneMapped: false }));
    front.userData.project = project;
    const back = new THREE.Mesh(backGeo, backMat);
    back.castShadow = true;
    group.add(front, back);
    const anchor = track.getPoint((i + 1) / (count + 1));
    group.position.set(anchor.x + side * 2.6, CARD.baseY, CARD.firstZ - i * CARD.gap);
    group.rotation.order = 'YXZ';
    group.rotation.y = -side * 0.24;
    group.userData.side = side;
    scene.add(group);
    return group;
  });

  /* Personaje jugable y monedas de la pista */
  // Las portadas solo ocupan memoria cuando están cerca de la cámara.
  function updateCovers(k) {
    cards.forEach((card, index) => {
      const front = card.children[0];
      const distance = Math.abs(k - 2 - index);
      const { project } = front.userData;
      if (distance < 1.7 && !front.userData.cover && project.cover) {
        front.userData.cover = 'loading';
        loader.load(project.cover, (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.anisotropy = LOW ? 2 : maxAniso;
          front.userData.cover = texture;
          front.material.map = texture;
          front.material.color.set('#ffffff');
          front.material.needsUpdate = true;
        });
      } else if (distance > 3.5 && front.userData.cover?.isTexture) {
        front.userData.cover.dispose();
        front.userData.cover = null;
        front.material.map = null;
        front.material.color.set('#2a1f55');
        front.material.needsUpdate = true;
      }
    });
  }

  const racer = new THREE.Group();
  scene.add(racer);
  let hero = null;
  function setCharacter(kind, look) {
    if (hero) racer.remove(hero.root);
    hero = makeCharacter(kind, look);
    racer.add(hero.root);
    applyStyle();
    hero.jump();
  }

  const coinSpots = [];
  for (let i = 0; i < count - 1; i++) {
    for (let j = 1; j <= 3; j++) coinSpots.push({ at: i + j / 4, collected: false, pop: 0 });
  }
  const coins = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.3, 0.3, 0.08, 24),
    new THREE.MeshStandardMaterial({ color: '#ffc629', metalness: 0.85, roughness: 0.3 }),
    Math.max(coinSpots.length, 1),
  );
  coins.frustumCulled = false;
  scene.add(coins);
  let coinsCollected = 0;

  /* Trofeos */
  const clusters = makeClusters();
  const clusterStartZ = CARD.firstZ - count * CARD.gap - 24;
  clusters.forEach((cluster, i) => {
    cluster.group.position.set(0, 1, clusterStartZ - i * 24);
    scene.add(cluster.group);
  });
  const O = clusters.length;
  const trophyStartZ = clusterStartZ - O * 24;
  const trophies = awards.map((award, i) => {
    const t = makeTrophy(award.icon);
    t.position.set(0, -1.1, trophyStartZ - i * 15);
    t.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    scene.add(t);
    return t;
  });

  /* Consola de contacto */
  const consoleZ = trophyStartZ - awards.length * 15 - 18;
  const skillBalls = makeSkillBalls(skills);
  skillBalls.group.position.z = consoleZ;
  scene.add(skillBalls.group);
  const panel = new THREE.Group();
  panel.position.set(0, 0, consoleZ);
  panel.rotation.x = 0.82;
  const board = new THREE.Mesh(
    new RoundedBoxGeometry(9.2, 0.7, 6.4, 6, 0.28),
    new THREE.MeshPhysicalMaterial({ color: '#1a1e6b', roughness: 0.42, clearcoat: 0.5 }),
  );
  board.receiveShadow = true;
  panel.add(board);
  const keyStyles = [
    { c: '#c6ff3d', t: '#120a2c' },
    { c: '#ff2bd6', t: '#120a2c' },
    { c: '#cfcbea', t: '#120a2c' },
    { c: '#7a2bff', t: '#ffffff' },
    { c: '#ff8a3d', t: '#120a2c' },
  ];
  const keys = links.slice(0, 6).map((link, i) => {
    const style = keyStyles[i];
    const group = new THREE.Group();
    const cap = new THREE.Mesh(
      new RoundedBoxGeometry(1.8, 0.55, 2.1, 6, 0.2),
      new THREE.MeshStandardMaterial({ color: style.c, roughness: 0.6, envMapIntensity: 0.35 }),
    );
    cap.castShadow = true;
    const top = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 1.6),
      new THREE.MeshBasicMaterial({ map: keyLabel(link.label, style.t), transparent: true, toneMapped: false }),
    );
    top.rotation.x = -Math.PI / 2;
    top.position.y = 0.279;
    group.add(cap, top);
    group.position.set(-3.45 + (i % 3) * 2.05, 0.55, -1.25 + Math.floor(i / 3) * 2.5);
    cap.userData.link = link;
    top.userData.link = link;
    group.userData.rest = group.position.y;
    panel.add(group);
    return group;
  });
  const faderTrack = new THREE.Mesh(
    new RoundedBoxGeometry(0.34, 0.1, 4.9, 3, 0.05),
    new THREE.MeshStandardMaterial({ color: '#0c0e2b', roughness: 0.6 }),
  );
  faderTrack.position.set(2.7, 0.38, 0);
  const faderKnob = new THREE.Mesh(new RoundedBoxGeometry(1.1, 0.5, 0.62, 5, 0.16), glossy('#ffffff'));
  faderKnob.position.set(2.7, 0.6, 2);
  faderKnob.castShadow = true;
  panel.add(faderTrack, faderKnob);
  for (let i = 0; i < 3; i++) {
    const light = new THREE.Mesh(
      new THREE.SphereGeometry(0.17, 20, 16),
      new THREE.MeshBasicMaterial({ color: ['#ffc629', '#ff4b33', '#ffffff'][i], toneMapped: false }),
    );
    light.position.set(3.85, 0.38, -1.4 + i * 1.4);
    panel.add(light);
  }
  scene.add(panel);

  /* Poses de cámara, en el mismo orden que los capítulos de la página */
  let poses = [];
  let curvePos;
  let curveLook;
  const up = new THREE.Vector3(0, 1, 0);
  const place = (object, base, aspect) => {
    object.position.x = base.x * Math.min(1, aspect / 1.6);
    object.scale.setScalar(object.userData.size * (aspect < 1 ? 0.62 : 1));
  };

  function buildPoses(aspect) {
    const narrow = aspect < 1;
    poses = [
      { pos: [0, 0, 10], look: [0, 0, PLANET.z], bg: COLORS.paper, theme: 'dark', stars: 0 },
      { pos: [0, 0, -24], look: [0, 0, -44], bg: COLORS.ultra, theme: 'dark', stars: 1 },
    ];
    cards.forEach((card) => {
      const c = card.position.clone().setY(CARD.baseY + CARD.h / 2);
      const normal = new THREE.Vector3(Math.sin(card.rotation.y), 0, Math.cos(card.rotation.y));
      const right = new THREE.Vector3().crossVectors(up, normal).normalize();
      const look = c.clone();
      let dist = 9.8;
      if (narrow) {
        dist = 2.95 / (TAN_HALF_FOV * aspect);
        look.y -= dist * TAN_HALF_FOV * 0.42;
      } else {
        dist = Math.max(9.8, 7 / (TAN_HALF_FOV * aspect * 1.6));
        look.addScaledVector(right, -card.userData.side * dist * TAN_HALF_FOV * aspect * 0.42);
      }
      const pos = look.clone().addScaledVector(normal, dist);
      pos.y += 1.3;
      poses.push({ pos: pos.toArray(), look: look.toArray(), bg: COLORS.paper, theme: 'dark', stars: 0 });
    });
    clusters.forEach((cluster, i) => {
      const c = cluster.group.position.clone();
      const dist = narrow ? 3.4 / (TAN_HALF_FOV * aspect) : 11.5;
      const look = c.clone();
      if (narrow) look.y -= dist * TAN_HALF_FOV * 0.3;
      else look.x -= dist * TAN_HALF_FOV * aspect * 0.42;
      poses.push({
        pos: [look.x, look.y, c.z + dist],
        look: look.toArray(),
        bg: [COLORS.music, COLORS.sport, COLORS.design][i],
        theme: 'dark',
        stars: 0,
      });
    });
    trophies.forEach((trophy) => {
      const c = trophy.position.clone();
      c.y += 2;
      const dist = narrow ? 2.5 / (TAN_HALF_FOV * aspect) : 11;
      const look = c.clone();
      if (narrow) look.y -= dist * TAN_HALF_FOV * 0.3;
      else look.x -= dist * TAN_HALF_FOV * aspect * 0.42;
      poses.push({
        pos: [look.x, look.y + 0.9, c.z + dist],
        look: look.toArray(),
        bg: COLORS.ink,
        theme: 'dark',
        stars: 0,
      });
    });
    const consoleDist = narrow ? 5.3 / (TAN_HALF_FOV * aspect) : 21;
    const shift = narrow ? 0 : consoleDist * TAN_HALF_FOV * aspect * 0.38;
    const liftY = narrow ? consoleDist * TAN_HALF_FOV * 0.42 : 0;
    // Sobre mí: las bolas de habilidades. Contacto: la consola de frente.
    const penDist = narrow ? 20 : 18;
    const penH = penDist * TAN_HALF_FOV;
    const penW = penH * aspect;
    skillBalls.setBounds(
      narrow
        ? { minX: -penW, maxX: penW, minY: -penH, maxY: -2, r: 0.5 }
        : { minX: -penW * 0.04, maxX: penW, minY: -penH, maxY: penH, r: Math.min(penW * 0.14, 1.05) },
    );
    poses.push({
      pos: [0, 0, consoleZ + penDist],
      look: [0, 0, consoleZ],
      bg: COLORS.ink,
      theme: 'dark',
      stars: 0,
    });
    poses.push({
      pos: [-shift, 0.4 - liftY, consoleZ + consoleDist * 0.92],
      look: [-shift, -liftY, consoleZ],
      bg: COLORS.ink,
      theme: 'dark',
      stars: 0,
    });
    const toCurve = (key) =>
      new THREE.CatmullRomCurve3(poses.map((p) => new THREE.Vector3(...p[key])), false, 'centripetal');
    curvePos = toCurve('pos');
    curveLook = toCurve('look');
  }

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const coarse = w < 760;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, ratioCap));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    pixelTarget.setSize(Math.round(190 * camera.aspect), 190);
    composer?.setPixelRatio(renderer.getPixelRatio());
    composer?.setSize(w, h);
    renderer.shadowMap.enabled = !LOW;
    sun.castShadow = !LOW;
    floaters.forEach((f) => place(f, f.userData.base, camera.aspect));
    scene.fog.near = coarse ? 42 : 22;
    scene.fog.far = coarse ? 110 : 60;
    buildPoses(camera.aspect);
  }
  let ratioCap = LOW ? 1.2 : 1.5;
  /* Estilos visuales: 3D, pixel, toon y wireframe */
  const pixelTarget = new THREE.WebGLRenderTarget(320, 190, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    type: THREE.HalfFloatType,
  });
  const quadScene = new THREE.Scene();
  const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  quadScene.add(
    new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        uniforms: { tScene: { value: pixelTarget.texture }, uSize: { value: new THREE.Vector2() } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
        fragmentShader: `
          uniform sampler2D tScene; uniform vec2 uSize; varying vec2 vUv;
          float bayer(vec2 p) {
            int x = int(mod(p.x, 4.0)); int y = int(mod(p.y, 4.0));
            int m[16] = int[16](0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5);
            return float(m[y * 4 + x]) / 16.0 - 0.5;
          }
          void main() {
            gl_FragColor = texture2D(tScene, vUv);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
            vec3 c = gl_FragColor.rgb + bayer(floor(vUv * uSize)) * 0.05;
            gl_FragColor = vec4(floor(c * 9.0 + 0.5) / 9.0, 1.0);
          }`,
        depthTest: false,
        depthWrite: false,
      }),
    ),
  );
  const pixelUniforms = quadScene.children[0].material.uniforms;
  let composer = null;
  if (!LOW) {
    composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 2 }));
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(256, 256), 0.16, 0.4, 1.05));
    composer.addPass(new OutputPass());
  }
  const outline = new OutlineEffect(renderer, { defaultThickness: 0.006, defaultColor: [0.05, 0.055, 0.17] });
  outline.autoClear = true;
  planet.material.userData.outlineParameters = { visible: false };
  const toonSteps = new THREE.DataTexture(new Uint8Array([90, 170, 255]), 3, 1, THREE.RedFormat);
  toonSteps.minFilter = toonSteps.magFilter = THREE.NearestFilter;
  toonSteps.needsUpdate = true;
  let styleName = '3d';

  function applyStyle() {
    scene.traverse((object) => {
      if (!object.isMesh) return;
      const original = object.userData.pbr ?? object.material;
      if (original.isMeshBasicMaterial) {
        original.userData.outlineParameters = { visible: false };
        return;
      }
      if (!original.isMeshStandardMaterial) return;
      object.userData.pbr = original;
      original.wireframe = styleName === 'wire';
      if (styleName === 'toon') {
        original.userData.toon ??= new THREE.MeshToonMaterial({
          color: original.color,
          emissive: original.emissive,
          emissiveIntensity: original.emissiveIntensity,
          gradientMap: toonSteps,
          transparent: original.transparent,
          opacity: original.opacity,
        });
        object.material = original.userData.toon;
      } else {
        object.material = original;
      }
    });
  }
  function setStyle(name) {
    styleName = name;
    applyStyle();
    sun.intensity = name === 'toon' ? 2.6 : 1.1;
  }

  resize();
  setCharacter(character, avatarLook);

  /* Interacción */
  const pointer = new THREE.Vector2(0, 0);
  const pointerSmooth = new THREE.Vector2(0, 0);
  const ray = new THREE.Raycaster();
  let hovered = null;
  let currentTheme = '';
  const clickable = [...cards.map((g) => g.children[0]), ...keys.flatMap((g) => g.children)];

  function pick() {
    ray.setFromCamera(pointer, camera);
    const hit = ray.intersectObjects([...clickable, racer, floaters[0]], true).find((h) => h.object.visible && !h.object.isSprite);
    if (!hit) return null;
    let node = hit.object;
    while (node) {
      if (node === racer) return racer;
      if (node === floaters[0]) return floaters[0];
      node = node.parent;
    }
    return hit.object;
  }
  const penPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const penPoint = new THREE.Vector3();
  function pointerOnPen() {
    penPlane.constant = -consoleZ;
    ray.setFromCamera(pointer, camera);
    return ray.ray.intersectPlane(penPlane, penPoint);
  }
  let pointerSeen = false;
  const overUi = (target) => target?.closest?.('a, button, dialog, .bar');
  window.addEventListener('pointermove', (e) => {
    pointer.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    pointerSeen = true;
    hovered = e.pointerType === 'mouse' && !overUi(e.target) ? pick() : null;
    document.body.style.cursor = hovered ? 'pointer' : '';
  });
  window.addEventListener('click', (e) => {
    if (overUi(e.target)) return;
    pointer.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    const hit = pick();
    if (hit === racer) {
      hero.jump();
      onGreet();
      return;
    }
    if (hit === floaters[0]) {
      onRollDie();
      return;
    }
    if (skillBalls.group.visible && pointerOnPen()) skillBalls.kick(penPoint);
    if (hit?.userData.project) onOpenProject(hit.userData.project);
    if (hit?.userData.link) window.open(hit.userData.link.url, '_blank', 'noopener');
  });
  window.addEventListener('resize', resize);

  /* Fotograma: k es la posición continua entre poses */
  const bg = new THREE.Color();
  const pos = new THREE.Vector3();
  const look = new THREE.Vector3();
  const clock = new THREE.Clock();
  let lastK = 0;
  let speed = 0;

  function render(k, level = 0) {
    updateCovers(k);
    const dt = clock.getDelta();
    const time = reducedMotion ? 0 : clock.elapsedTime;
    const last = poses.length - 1;
    const t = THREE.MathUtils.clamp(k / last, 0, 1);
    curvePos.getPoint(t, pos);
    curveLook.getPoint(t, look);

    pointerSmooth.lerp(pointer, reducedMotion ? 0 : 0.05);
    pos.x += pointerSmooth.x * 0.3;
    pos.y += pointerSmooth.y * 0.2;
    camera.position.copy(pos);
    camera.lookAt(look);

    const i = Math.min(Math.floor(k), last - 1);
    const f = THREE.MathUtils.clamp(k - i, 0, 1);
    const a = poses[Math.max(i, 0)];
    const b = poses[Math.max(i, 0) + 1] ?? a;
    const inside = pos.z < PLANET.z + PLANET.radius - 0.1;
    if (i === 0) bg.copy(inside ? COLORS.ultra : COLORS.paper);
    else bg.copy(a.bg).lerp(b.bg, THREE.MathUtils.smoothstep(f, 0.1, 0.8));
    renderer.setClearColor(bg, 1);
    scene.fog.color.copy(bg);
    planet.visible = !inside;
    starField.material.opacity = (i === 0 ? THREE.MathUtils.smoothstep(f, 0.55, 0.9) : a.stars * (1 - f)) * 0.9;
    starField.visible = starField.material.opacity > 0.01;
    tiles.visible = k > 1.25;

    const theme = f < 0.5 ? a.theme : b.theme;
    if (theme !== currentTheme) {
      currentTheme = theme;
      document.body.dataset.theme = theme;
    }

    floaters.forEach((obj) => {
      const { base, spin, phase, faces } = obj.userData;
      obj.position.y = base.y + Math.sin(time * 0.8 + phase) * 0.14;
      if (faces) {
        obj.rotation.x = Math.sin(time * 0.4 + phase) * 0.12 + 0.12;
        obj.rotation.y = Math.sin(time * 0.5 + phase + k * 2) * 0.55;
        obj.rotation.z = Math.sin(phase) * 0.3;
      } else {
        obj.rotation.x = spin[0] * k * 2.2 + Math.sin(time * 0.4 + phase) * 0.08 + phase * 0.3;
        obj.rotation.y = spin[1] * k * 3 + time * spin[1] * 0.45 + phase;
      }
    });

    // La ficha salta de casilla en casilla hacia cada proyecto.
    const raceK = THREE.MathUtils.clamp(k - 2, 0, count - 1);
    const racePoint = track.getPoint((raceK + 1) / (count + 1));
    const moving = THREE.MathUtils.clamp(Math.abs(k - lastK) / Math.max(dt, 0.001) * 0.9, 0, 1);
    lastK = k;
    speed += (moving - speed) * Math.min(dt * 7, 1);
    const trophyIndex = Math.round(k - 2 - count - O);
    const onTrack = k > 1.3 && k < count + 1.6;
    const onTrophy = trophyIndex >= 0 && trophyIndex < trophies.length && Math.abs(k - 2 - count - O - trophyIndex) < 0.3;
    const inHero = k < 0.55;
    const atEnd = k > count + O + awards.length + 2.7;
    racer.visible = onTrack || onTrophy || inHero || atEnd;
    racer.scale.setScalar(1);
    let cheer = false;
    let turn = 0;
    if (inHero) {
      racer.position.set(0, camera.aspect < 1 ? -3.45 : -4.05, -6);
      racer.scale.setScalar(0.95);
    } else if (onTrophy) {
      const spot = trophies[trophyIndex].position;
      racer.position.set(spot.x + (camera.aspect < 1 ? -1.9 : -2.5), -1.1, spot.z + 1.6);
      cheer = !reducedMotion;
    } else if (atEnd) {
      racer.position.set(camera.aspect < 1 ? 3 : -0.5, -3.9, consoleZ + 3);
    } else {
      racer.position.set(racePoint.x, -0.98, racePoint.z - 1.6);
      turn = Math.PI * speed;
    }
    racer.rotation.y = turn;
    if (hero) {
      const toCamera = new THREE.Vector3(pointer.x, pointer.y, 0);
      hero.update({ dt, walk: raceK * 22, speed: onTrack ? speed : 0, look: toCamera, cheer, time });
    }

    coinSpots.forEach((coin, index) => {
      if (!coin.collected && raceK >= coin.at) {
        coin.collected = true;
        coinsCollected += 1;
        onCoin(coinsCollected);
      }
      if (coin.collected) coin.pop = Math.min(coin.pop + dt * 3, 1);
      const p = track.getPoint((coin.at + 1) / (count + 1));
      dummy.position.set(p.x, -0.42 + coin.pop * 1.4 + Math.sin(time * 2.4 + index) * 0.06, p.z - 1.6);
      dummy.rotation.set(Math.PI / 2, 0, time * 2.4 + index + coin.pop * 8);
      dummy.scale.setScalar(k > 1.3 && k < count + 2.2 ? 1 - coin.pop : 0.0001);
      dummy.updateMatrix();
      coins.setMatrixAt(index, dummy.matrix);
    });
    coins.instanceMatrix.needsUpdate = true;

    cards.forEach((card, index) => {
      // La tarjeta se levanta de la pista al llegar y se acuesta al pasar.
      const offset = Math.abs(k - 2 - index);
      const rise = 1 - THREE.MathUtils.smootherstep(offset, 0.42, 0.9);
      const lean = hovered === card.children[0] ? 0.05 : 0;
      card.rotation.x = -(1 - rise) * (Math.PI / 2 - 0.02) - lean;
      card.visible = rise > 0.002;
    });

    trophies.forEach((trophy, index) => {
      const near = k - (2 + count + O + index);
      trophy.visible = Math.abs(near) < 0.95;
      trophy.rotation.y = near * 1.6 + time * 0.25;
      trophy.userData.top.rotation.y = -trophy.rotation.y + (trophy.userData.topFaces ? Math.sin(time * 0.8) * 0.4 : time * 0.9 + k * 2);
    });

    clusters.forEach((cluster, i) => cluster.update(k - (2 + count + i), time, pointerSmooth));
    const consoleStart = 2 + count + O + awards.length;
    panel.visible = k > consoleStart + 0.22;
    const ballsActive = Math.abs(k - consoleStart) < 0.72;
    skillBalls.update(reducedMotion ? 1 / 60 : dt, ballsActive, ballsActive && pointerSeen ? pointerOnPen() : null);
    keys.forEach((key) => {
      const down = key.children.includes(hovered) ? 0.2 : 0;
      key.position.y += (key.userData.rest - down - key.position.y) * 0.25;
    });
    faderKnob.position.z = 2 - THREE.MathUtils.clamp(k - consoleStart + 0.6, 0, 1.6) * 2.5;

    const atConsole = k > consoleStart + 0.2;
    neonA.intensity = (atConsole ? 14 : 70) * (1 + level * 1.6);
    neonB.intensity = (atConsole ? 10 : 50) * (1 + level * 1.6);
    neonA.position.set(look.x - 7, look.y + 5, look.z + 7);
    neonB.position.set(look.x + 8, look.y - 3, look.z + 5);
    sun.position.set(pos.x + 7, 16, look.z + 12);
    sun.target.position.set(look.x, 0, look.z);

    if (styleName === 'pixel') {
      pixelUniforms.uSize.value.set(pixelTarget.width, pixelTarget.height);
      renderer.setRenderTarget(pixelTarget);
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      renderer.render(quadScene, quadCamera);
    } else if (styleName === 'toon') {
      outline.render(scene, camera);
    } else if (styleName === '3d' && composer) {
      composer.render();
    } else {
      renderer.render(scene, camera);
    }
  }

  // Si el equipo no da abasto, baja la calidad en lugar de ir a tirones.
  function lowerQuality() {
    composer = null;
    ratioCap = Math.max(ratioCap - 0.25, 0.75);
    renderer.shadowMap.enabled = false;
    sun.castShadow = false;
    resize();
  }

  return { render, setStyle, setCharacter, lowerQuality, jump: () => hero.jump() };
}
