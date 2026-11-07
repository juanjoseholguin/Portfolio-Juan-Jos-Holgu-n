import * as THREE from 'three';
import { LOW } from './quality.js';

const BRANDS = {
  Figma: { bg: '#1e1e1e', draw: figmaMark },
  Illustrator: { bg: '#330000', mark: 'Ai', color: '#ff9a00' },
  Photoshop: { bg: '#001e36', mark: 'Ps', color: '#31a8ff' },
  'After Effects': { bg: '#00005b', mark: 'Ae', color: '#9999ff' },
  JavaScript: { bg: '#f7df1e', mark: 'JS', color: '#111111' },
  TypeScript: { bg: '#3178c6', mark: 'TS', color: '#ffffff' },
  React: { bg: '#20232a', draw: reactMark },
};

function figmaMark(ctx) {
  const r = 26;
  const x = 128;
  const y = 66;
  const pill = (px, py, color, tl, tr, br, bl) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(px, py, r, r, [tl, tr, br, bl]);
    ctx.fill();
  };
  pill(x - r, y - r * 1.5, '#f24e1e', r, 0, 0, r);
  pill(x, y - r * 1.5, '#ff7262', 0, r, r, 0);
  pill(x - r, y - r * 0.5, '#a259ff', r, 0, 0, r);
  ctx.fillStyle = '#1abcfe';
  ctx.beginPath();
  ctx.arc(x + r / 2, y, r / 2, 0, Math.PI * 2);
  ctx.fill();
  pill(x - r, y + r * 0.5, '#0acf83', r, 0, r, r);
}

function reactMark(ctx) {
  ctx.strokeStyle = '#61dafb';
  ctx.lineWidth = 5;
  for (const a of [0, Math.PI / 3, -Math.PI / 3]) {
    ctx.beginPath();
    ctx.ellipse(128, 64, 46, 18, a, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = '#61dafb';
  ctx.beginPath();
  ctx.arc(128, 64, 8, 0, Math.PI * 2);
  ctx.fill();
}

function label(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const brand = BRANDS[text];
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (brand?.draw) {
    brand.draw(ctx);
  } else {
    ctx.fillStyle = brand?.color ?? '#120a2c';
    ctx.font = brand ? '700 72px Poppins, sans-serif' : '700 34px Poppins, sans-serif';
    ctx.fillText(brand?.mark ?? text, 128, 66);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/* Bolas de habilidades que caen, chocan y huyen del cursor. */
export function makeSkillBalls(skills) {
  const group = new THREE.Group();
  const balls = skills.map((skill, i) => {
    const color = BRANDS[skill]?.bg ?? ['#c6ff3d', '#ff2bd6', '#27e6ff'][i % 3];
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(1, LOW ? 22 : 36, LOW ? 16 : 28),
      LOW
        ? new THREE.MeshStandardMaterial({ color, roughness: 0.35, emissive: color, emissiveIntensity: 0.5 })
        : new THREE.MeshPhysicalMaterial({ color, roughness: 0.3, clearcoat: 0.8, emissive: color, emissiveIntensity: 0.3 }),
    );
    mesh.castShadow = true;
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: label(skill),
        transparent: true,
        toneMapped: false,
        depthTest: false,
      }),
    );
    sprite.scale.set(1.9, 0.95, 1);
    sprite.renderOrder = 2;
    mesh.add(sprite);
    mesh.userData.ball = true;
    group.add(mesh);
    return { mesh, vx: 0, vy: 0, x: 0, y: 0 };
  });

  let bounds = { minX: -5, maxX: 5, minY: -5, maxY: 5, r: 0.8 };
  let dropped = false;

  function drop() {
    balls.forEach((b, i) => {
      b.x = bounds.minX + bounds.r + ((i * 1.7) % 1) * (bounds.maxX - bounds.minX - bounds.r * 2);
      b.y = bounds.maxY + 2 + i * 1.6;
      b.vx = (i % 2 ? 1 : -1) * 0.8;
      b.vy = 0;
    });
    dropped = true;
  }

  return {
    group,
    balls: balls.map((b) => b.mesh),
    setBounds(next) {
      bounds = next;
      balls.forEach((b) => b.mesh.scale.setScalar(next.r));
      dropped = false;
    },
    kick(point) {
      balls.forEach((b) => {
        const d = Math.hypot(b.x - point.x, b.y - point.y);
        if (d < bounds.r * 3.5) {
          b.vy += 13;
          b.vx += (b.x - point.x) * 2.5;
        }
      });
    },
    update(dt, active, pointer) {
      group.visible = active;
      if (!active) {
        dropped = false;
        return;
      }
      if (!dropped) drop();
      const { minX, maxX, minY, r } = bounds;
      const step = Math.min(dt, 1 / 30);
      for (const b of balls) {
        b.vy -= 19 * step;
        if (pointer) {
          const dx = b.x - pointer.x;
          const dy = b.y - pointer.y;
          const d = Math.hypot(dx, dy) || 1;
          if (d < r * 2.6) {
            const push = ((r * 2.6 - d) / (r * 2.6)) * 70 * step;
            b.vx += (dx / d) * push;
            b.vy += (dy / d) * push;
          }
        }
        b.x += b.vx * step;
        b.y += b.vy * step;
        b.vx *= 0.995;
        if (b.y < minY + r) { b.y = minY + r; b.vy *= -0.55; b.vx *= 0.96; }
        if (b.x < minX + r) { b.x = minX + r; b.vx *= -0.7; }
        if (b.x > maxX - r) { b.x = maxX - r; b.vx *= -0.7; }
      }
      for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
          const a = balls[i];
          const b = balls[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d = Math.hypot(dx, dy) || 0.001;
          if (d < r * 2) {
            const nx = dx / d;
            const ny = dy / d;
            const overlap = (r * 2 - d) / 2;
            a.x -= nx * overlap;
            a.y -= ny * overlap;
            b.x += nx * overlap;
            b.y += ny * overlap;
            const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
            if (rel < 0) {
              const impulse = rel * -0.8;
              a.vx -= nx * impulse;
              a.vy -= ny * impulse;
              b.vx += nx * impulse;
              b.vy += ny * impulse;
            }
          }
        }
      }
      for (const b of balls) b.mesh.position.set(b.x, b.y, 0);
    },
  };
}
