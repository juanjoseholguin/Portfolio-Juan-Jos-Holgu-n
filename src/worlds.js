import { sfx } from './audio.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = (v = '') => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const inView = (el) => {
  const r = el.getBoundingClientRect();
  return r.bottom > 0 && r.top < innerHeight;
};
const progress = (el) => {
  const r = el.getBoundingClientRect();
  return Math.min(Math.max(-r.top / Math.max(el.offsetHeight - innerHeight, 1), 0), 1);
};

export function pixelChapter() {
  return `
  <section class="solid pixel-world" aria-labelledby="pixel-title">
    <div class="pin pixel-pin">
      <canvas id="pixel-canvas" width="320" height="180" tabindex="0" aria-label="8-bit world. Scroll to run past projects. Tap or press Space to jump."></canvas>
      <div class="pixel-copy">
        <h2 id="pixel-title">World 2: bits</h2>
        <p>Everything on a screen starts as a pixel. Scroll to run, tap to jump.</p>
      </div>
      <p class="pixel-score" role="status"><span id="bits">0</span> bits</p>
    </div>
  </section>`;
}

export function lightChapter(projects, awards) {
  const years = {};
  awards.forEach((a) => { if (a.year) (years[a.year] ??= []).push(`${a.title}, ${a.prize}`); });
  projects.forEach((p) => {
    if (!p.publishedOn) return;
    const y = new Date(p.publishedOn * 1000).getFullYear();
    (years[y] ??= []).push(p.name);
  });
  const list = Object.keys(years).sort((a, b) => b - a).map((y) => ({ y, items: years[y].slice(0, 5) }));
  const panel = list
    .map(
      ({ y, items }) => `<article class="year" data-year="${y}">
        <p class="year-num" aria-hidden="true">${y}</p>
        <div class="year-list"><h3>${y}</h3><ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul></div>
      </article>`,
    )
    .join('');
  return `
  <section class="solid light-room" style="--years:${list.length}" aria-labelledby="light-title">
    <div class="pin light-pin">
      <h2 id="light-title">Let's go back in time.</h2>
      <div class="years dim" aria-hidden="true">${panel}</div>
      <div class="years lit">${panel}</div>
      <div class="light-hint">Move the light</div>
    </div>
  </section>`;
}

export function doorChapter() {
  return `
  <section class="solid door-room" aria-labelledby="door-title">
    <div class="pin door-pin">
      <div class="door-stage">
        <div class="door-floor" aria-hidden="true"></div>
        <div class="door-frame">
          <div class="door-light" aria-hidden="true"></div>
          <button type="button" class="door-leaf" aria-label="Open the door"><span class="door-knob" aria-hidden="true"></span><span class="door-sign" aria-hidden="true">Awards</span></button>
        </div>
      </div>
      <h2 id="door-title">The good stuff is behind this door.</h2>
    </div>
  </section>`;
}

const PALETTE = { sky: ['#0d0620', '#1a0a3d', '#2c0f66', '#4a138f'], neon: ['#ff2bd6', '#27e6ff', '#c6ff3d', '#b14dff'] };

function initPixel({ getLook, covers }) {
  const section = document.querySelector('.pixel-world');
  const canvas = document.getElementById('pixel-canvas');
  const c = canvas.getContext('2d');
  c.imageSmoothingEnabled = false;
  const bitsEl = document.getElementById('bits');
  let W = 320;
  const H = 180;
  const GROUND = 150;
  const fit = () => {
    W = Math.round(H * Math.min(innerWidth / innerHeight, 2));
    canvas.width = W;
    canvas.height = H;
    c.imageSmoothingEnabled = false;
  };
  fit();
  window.addEventListener('resize', fit);
  const LENGTH = 1500;
  const images = covers.map((src) => {
    const img = new Image();
    img.src = src;
    return img;
  });
  const bits = Array.from({ length: 34 }, (_, i) => ({ x: 170 + i * 38, y: GROUND - 18 - (i % 3 === 0 ? 32 : 0), got: false }));
  const bots = Array.from({ length: 6 }, (_, i) => ({ x: 340 + i * 215, phase: i }));
  let camera = 0;
  let y = 0;
  let vy = 0;
  let last = performance.now();
  let score = 0;

  const jump = () => {
    if (y === 0) {
      vy = 210;
      sfx.jump();
    }
  };
  canvas.addEventListener('pointerdown', jump);
  canvas.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      jump();
    }
  });

  const rect = (x, yy, w, h, color) => {
    c.fillStyle = color;
    c.fillRect(Math.round(x), Math.round(yy), w, h);
  };

  function avatar(x, yy, frame) {
    const look = getLook();
    const body = look.body ?? '#7a2bff';
    const accent = look.accent ?? '#1c1420';
    const skin = look.skin ?? '#d9a47a';
    rect(x + 3, yy, 10, 4, accent);
    rect(x + 3, yy + 4, 10, 6, skin);
    rect(x + 5, yy + 6, 2, 2, '#000');
    rect(x + 10, yy + 6, 2, 2, '#000');
    rect(x + 2, yy + 10, 12, 8, body);
    rect(x, yy + 11, 2, 5, skin);
    rect(x + 14, yy + 11, 2, 5, skin);
    const step = frame % 2 ? 2 : 0;
    rect(x + 3, yy + 18, 4, 4 - step, '#0c0a18');
    rect(x + 9, yy + 18, 4, 2 + step, '#0c0a18');
    if (look.hat === 'crown') {
      rect(x + 3, yy - 3, 10, 3, '#c6ff3d');
    } else if (look.hat === 'cap') {
      rect(x + 3, yy - 2, 13, 2, '#ff2bd6');
    } else {
      rect(x + 1, yy + 3, 2, 5, '#ff2bd6');
      rect(x + 13, yy + 3, 2, 5, '#ff2bd6');
    }
  }

  function draw(time) {
    const bands = PALETTE.sky;
    bands.forEach((color, i) => rect(0, i * 34, W, 34, color));
    for (let i = 0; i < 40; i++) {
      const sx = ((i * 73 - camera * 0.08) % W + W) % W;
      rect(sx, (i * 41) % 90, 1, 1, i % 5 ? '#6a55c8' : '#ffffff');
    }
    for (let i = 0; i < 26; i++) {
      const bw = 18 + (i * 7) % 16;
      const bh = 30 + (i * 13) % 50;
      const bx = i * 34 - (camera * 0.3) % (26 * 34);
      rect(((bx % (26 * 34)) + 26 * 34) % (26 * 34) - 40, GROUND - bh, bw, bh, '#160a33');
      if (i % 2 === 0) rect(((bx % (26 * 34)) + 26 * 34) % (26 * 34) - 34, GROUND - bh + 6, 3, 3, PALETTE.neon[i % 4]);
    }
    images.forEach((img, i) => {
      const bx = W * 0.5 + 40 + i * 360 - camera;
      if (bx < -110 || bx > W + 10 || !img.complete || !img.naturalWidth) return;
      rect(bx + 40, GROUND - 26, 6, 26, '#2a2048');
      rect(bx - 2, GROUND - 92, 94, 70, PALETTE.neon[i % 4]);
      c.drawImage(img, bx, GROUND - 90, 90, 66);
    });
    for (let x = -(camera % 16); x < W; x += 16) {
      rect(x, GROUND, 15, 6, '#7a2bff');
      rect(x, GROUND + 6, 15, 30, '#1a0a3d');
    }
    bits.forEach((b) => {
      if (b.got) return;
      const bx = b.x - camera;
      if (bx < -8 || bx > W) return;
      const on = Math.floor(time / 240 + b.x) % 2;
      rect(bx, b.y, on ? 6 : 4, 6, '#c6ff3d');
    });
    bots.forEach((b) => {
      const bx = b.x - camera;
      if (bx < -16 || bx > W) return;
      // Cursor rival: un puntero que patrulla la pista.
      const by = GROUND - 14 + Math.sin(time / 300 + b.phase) * 2;
      rect(bx, by, 3, 14, '#ffffff');
      rect(bx + 3, by + 3, 3, 8, '#ffffff');
      rect(bx + 6, by + 6, 3, 3, '#ff2bd6');
    });
    avatar(44, GROUND - 22 - y, Math.floor(camera / 8));
  }

  const loop = (time) => {
    requestAnimationFrame(loop);
    if (!inView(section)) return;
    const dt = Math.min((time - last) / 1000, 0.05);
    last = time;
    const target = progress(section) * LENGTH;
    camera += (target - camera) * Math.min(dt * 8, 1);
    vy -= 620 * dt;
    y = Math.max(y + vy * dt, 0);
    if (y === 0) vy = 0;
    bits.forEach((b) => {
      if (!b.got && Math.abs(b.x - (camera + 52)) < 11 && Math.abs(GROUND - 12 - y - b.y) < 22) {
        b.got = true;
        score += 1;
        bitsEl.textContent = score;
        sfx.coin();
      }
    });
    draw(time);
  };
  requestAnimationFrame(loop);
}

function initLight() {
  const section = document.querySelector('.light-room');
  const lit = section.querySelector('.years.lit');
  const stacks = [...section.querySelectorAll('.years')].map((s) => [...s.querySelectorAll('.year')]);
  const touch = !matchMedia('(pointer: fine)').matches;
  let shown = -1;
  let px = 0.35;
  let py = 0.45;
  section.addEventListener('pointermove', (e) => {
    const r = section.querySelector('.light-pin').getBoundingClientRect();
    px = (e.clientX - r.left) / r.width;
    py = (e.clientY - r.top) / r.height;
    section.classList.add('moved');
  });
  const update = () => {
    if (!inView(section)) return;
    const p = progress(section);
    const n = stacks[0].length;
    const index = Math.min(Math.floor(p * n), n - 1);
    if (index !== shown) {
      shown = index;
      stacks.forEach((list) => list.forEach((el, i) => el.classList.toggle('on', i === index)));
      if (!reduced) {
        section.classList.remove('flicker');
        void section.offsetWidth;
        section.classList.add('flicker');
      }
    }
    // En pantallas táctiles la luz se mueve sola con el scroll.
    const x = touch ? 0.5 + Math.sin(p * 18) * 0.34 : px;
    const y = touch ? 0.42 + Math.cos(p * 13) * 0.2 : py;
    lit.style.setProperty('--lx', `${x * 100}%`);
    lit.style.setProperty('--ly', `${y * 100}%`);
  };
  window.addEventListener('scroll', update, { passive: true });
  section.addEventListener('pointermove', update, { passive: true });
  update();
}

function initDoor() {
  const section = document.querySelector('.door-room');
  const leaf = section.querySelector('.door-leaf');
  const stage = section.querySelector('.door-stage');
  const light = section.querySelector('.door-light');
  const floor = section.querySelector('.door-floor');
  const title = section.querySelector('h2');
  let opened = false;
  const update = () => {
    if (!inView(section)) return;
    const p = progress(section);
    const open = Math.min(p / 0.5, 1);
    const eased = open * open * (3 - 2 * open);
    leaf.style.transform = `perspective(1100px) rotateY(${-112 * eased}deg)`;
    light.style.opacity = 0.15 + eased * 0.85;
    floor.style.opacity = eased;
    if (open > 0.1 && !opened) {
      opened = true;
      sfx.door();
    }
    if (open < 0.04) opened = false;
    const z = Math.min(Math.max((p - 0.5) / 0.5, 0), 1);
    stage.style.transform = `scale(${1 + z * z * 7})`;
    title.style.opacity = 1 - Math.min(p / 0.3, 1);
    section.style.setProperty('--white', z * z);
  };
  leaf.addEventListener('click', () => {
    const top = section.getBoundingClientRect().top + scrollY + (section.offsetHeight - innerHeight) * 0.52;
    window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
  });
  window.addEventListener('scroll', update, { passive: true });
  update();
}

function initFlourish() {
  const bar = document.createElement('div');
  bar.className = 'scroll-bar';
  document.body.append(bar);
  const marquees = [...document.querySelectorAll('.marquee-track')];
  let lastY = scrollY;
  let offset = 0;
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${scrollY / max})`;
    offset += scrollY - lastY;
    lastY = scrollY;
    if (!reduced) marquees.forEach((m) => { m.style.transform = `translateX(${-(((offset * 0.5) % 1000) + 1000) % 1000}px)`; });
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  const tiles = [...document.querySelectorAll('.tile')];
  // Si una portada falla por la red, se reintenta una vez.
  tiles.forEach((t) => {
    const img = t.querySelector('img');
    img.addEventListener('error', () => {
      if (img.dataset.retried) return;
      img.dataset.retried = '1';
      setTimeout(() => { img.src = `${img.getAttribute('src')}?r=1`; }, 800);
    });
  });

  if (!reduced && matchMedia('(pointer: fine)').matches) {
    tiles.forEach((t) => {
      const img = t.querySelector('img');
      t.addEventListener('pointermove', (e) => {
        const r = t.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        img.style.transform = `perspective(700px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) scale(1.03)`;
      });
      t.addEventListener('pointerleave', () => { img.style.transform = ''; });
    });
  }

  // Confeti la primera vez que se llega a cada premio.
  document.querySelectorAll('.award .copy').forEach((copy) => {
    const watch = new MutationObserver(() => {
      if (!copy.classList.contains('in')) return;
      watch.disconnect();
      sfx.win();
      if (reduced) return;
      const burst = document.createElement('div');
      burst.className = 'confetti';
      burst.innerHTML = Array.from({ length: 26 }, (_, i) =>
        `<i style="--x:${(Math.random() - 0.5) * 90}vw;--y:${40 + Math.random() * 50}vh;--r:${Math.random() * 720}deg;--c:${['#c6ff3d', '#ff2bd6', '#27e6ff', '#b14dff'][i % 4]};animation-delay:${Math.random() * 180}ms"></i>`).join('');
      copy.closest('.pin').append(burst);
      setTimeout(() => burst.remove(), 1700);
    });
    watch.observe(copy, { attributes: true, attributeFilter: ['class'] });
  });
}

export function initWorlds({ getLook, covers }) {
  initPixel({ getLook, covers });
  initLight();
  initDoor();
  initFlourish();
}
