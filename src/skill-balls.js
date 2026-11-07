import * as THREE from 'three';

const COLORS = ['#ffc629', '#ff4b33', '#ffffff', '#2430e0', '#8d96ff'];
const INK = new Set(['#ffc629', '#ffffff', '#ff4b33', '#8d96ff']);

function label(text, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = color;
  ctx.font = `700 ${text.length > 8 ? 34 : 42}px Poppins, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/* Bolas de habilidades que caen, chocan y huyen del cursor. */
export function makeSkillBalls(skills) {
  const group = new THREE.Group();
  const balls = skills.map((skill, i) => {
    const color = COLORS[i % COLORS.length];
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(1, 36, 28),
      new THREE.MeshPhysicalMaterial({ color, roughness: 0.3, clearcoat: 0.8 }),
    );
    mesh.castShadow = true;
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: label(skill, INK.has(color) ? '#0c0e2b' : '#ffffff'),
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
