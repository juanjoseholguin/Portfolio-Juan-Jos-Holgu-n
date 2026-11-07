import { audioContext, duckAmbient, frequencyBars, output, sfx } from './audio.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const base = import.meta.env.BASE_URL;
const TV_VIDEO = 'https://www-ccv.adobe.io/v1/player/ccv/3WJghZV8MWP/embed?api_key=behance1&bgcolor=%23191919';
const TV_LINK = 'https://www.behance.net/gallery/221578125/StopMotion-%28Animation%29-Poema-Besos-de-Vino';
const STILLS = [1, 2, 3].map((n) => `${base}stills/still${n}.webp`);

const sketchPaths = [
  'M300 70 C298 66 303 62 318 62 L482 60 C498 61 503 66 502 82 L504 520 C503 536 496 540 482 540 L320 542 C304 541 298 536 299 520 Z',
  'M372 84 C392 82 410 86 430 83',
  'M322 118 C370 114 430 121 480 116 L482 256 C430 260 370 253 323 258 Z',
  'M323 118 C370 165 430 210 481 256',
  'M481 117 C430 165 372 210 323 257',
  'M324 290 C370 286 420 293 470 288',
  'M324 318 C360 315 400 320 438 316',
  'M324 346 C355 343 385 348 410 344',
  'M330 400 C380 396 425 402 472 398 C482 400 482 448 471 450 C425 454 380 448 331 452 C320 448 320 402 330 400 Z',
  'M180 160 C215 130 255 138 284 180 M284 180 L262 176 M284 180 L280 158',
  'M600 230 C620 180 640 180 650 228 C690 222 704 240 664 262 C680 300 660 312 628 286 C596 310 578 296 594 262 C556 240 568 222 600 230 Z',
  'M560 430 C610 400 680 470 730 430',
];

export function pencilChapter() {
  return `
  <section class="solid pencil" aria-labelledby="pencil-title">
    <div class="pin pencil-pin">
      <div class="pencil-copy">
        <h2 id="pencil-title" class="hand boil">Every interface starts with a pencil.</h2>
        <p class="hand boil">Scroll and I'll sketch one for you.</p>
      </div>
      <svg class="sketch" viewBox="120 30 640 540" role="img" aria-label="A phone wireframe being sketched, then filling with color">
        <defs><filter id="boil"><feTurbulence id="boil-noise" type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="1"/><feDisplacementMap in="SourceGraphic" scale="4.5"/></filter></defs>
        <g class="ink-fill" opacity="0">
          <rect x="300" y="62" width="202" height="478" rx="20" fill="#120a2c"/>
          <rect x="322" y="118" width="160" height="140" rx="8" fill="#7a2bff"/>
          <circle cx="402" cy="188" r="38" fill="#ff2bd6"/>
          <rect x="324" y="400" width="154" height="50" rx="24" fill="#27e6ff"/>
          <path d="M600 230 C620 180 640 180 650 228 C690 222 704 240 664 262 C680 300 660 312 628 286 C596 310 578 296 594 262 C556 240 568 222 600 230 Z" fill="#c6ff3d"/>
        </g>
        <g class="strokes" filter="url(#boil)">
          ${sketchPaths.map((d) => `<path d="${d}" pathLength="1"/>`).join('')}
        </g>
        <g class="pencil-tool" aria-hidden="true">
          <polygon points="0,0 12,-26 28,-18" fill="#f2c9a0"/>
          <polygon points="0,0 5,-11 11,-8" fill="#2a2640"/>
          <polygon points="12,-26 28,-18 92,-142 76,-150" fill="#7a2bff"/>
          <polygon points="76,-150 92,-142 102,-160 86,-168" fill="#ff7ab6"/>
        </g>
      </svg>
    </div>
  </section>`;
}

export function zoomChapter(project) {
  return `
  <section class="solid zoom" aria-label="Featured project">
    <div class="pin zoom-pin">
      <div class="zoom-word" style="background-image:url('${project.cover}')" aria-hidden="true">PLAY</div>
      <img class="zoom-full" src="${project.cover}" alt="Cover of ${project.name.replace(/"/g, '&quot;')}" loading="lazy" />
      <div class="zoom-caption">
        <h2>Carrera a la Locura</h2>
        <p>A board game built with basic code and NFC. Best Visual Design, Premio Equinoccio Icesi 2026.</p>
        <a class="btn" href="${project.url}" target="_blank" rel="noopener">See the game</a>
      </div>
    </div>
  </section>`;
}

const ROWS = ['Kick', 'Snare', 'Hat', 'Synth'];
const PRESET = ['10001010', '00100010', '10101011', '10010100'];

export function playChapter() {
  return `
  <section class="solid play" aria-labelledby="play-title">
    <div class="play-inner">
      <h2 id="play-title" class="section-title">Off the clock</h2>
      <p class="play-lead">Music and sport keep me moving. Try both.</p>
      <div class="play-grid">
        <div class="beat">
          <div class="beat-head">
            <h3>Make a beat</h3>
            <button type="button" class="btn beat-toggle" aria-pressed="false">Play beat</button>
          </div>
          <canvas class="bars" width="480" height="60" aria-hidden="true"></canvas>
          <div class="pads">
            ${ROWS.map(
              (row, r) => `<div class="pad-row" role="group" aria-label="${row}">
                <span>${row}</span>
                ${[...PRESET[r]]
                  .map(
                    (on, s) =>
                      `<button type="button" class="pad" data-row="${r}" data-step="${s}" aria-pressed="${on === '1'}" aria-label="${row} step ${s + 1}"></button>`,
                  )
                  .join('')}
              </div>`,
            ).join('')}
          </div>
        </div>
        <div class="keepy">
          <div class="beat-head">
            <h3>Keep it up</h3>
            <p class="keepy-score" role="status"><span id="keepy-now">0</span> touches, best <span id="keepy-best">0</span></p>
          </div>
          <canvas id="keepy" width="460" height="330" tabindex="0" aria-label="Keep-up game. Tap the ball or press Space to kick it."></canvas>
          <p class="keepy-hint">Tap the ball before it lands. Space works too.</p>
        </div>
      </div>
    </div>
  </section>`;
}

export function tvChapter() {
  const title = 'Besos de Vino';
  return `
  <section class="solid tv-chapter" aria-labelledby="tv-title">
    <div class="pin tv-pin">
      <div class="tv-copy">
        <p class="tv-kicker">Stop motion, frame by frame</p>
        <h2 id="tv-title" aria-label="${title}">${[...title]
          .map((c) => `<span class="jump" aria-hidden="true">${c === ' ' ? '&nbsp;' : c}</span>`)
          .join('')}</h2>
        <p>An animated poem made by hand. Best Audiovisual Design, Premio Equinoccio Icesi 2025.</p>
        <a class="tv-link" href="${TV_LINK}" target="_blank" rel="noopener">See the project on Behance</a>
      </div>
      <div class="tv">
        <div class="tv-antenna" aria-hidden="true"></div>
        <div class="tv-body">
          <div class="tv-screen">
            <img class="tv-frame" src="${STILLS[0]}" alt="Still from Besos de Vino" />
            <div class="tv-lines" aria-hidden="true"></div>
            <button type="button" class="tv-play">Play video</button>
          </div>
          <div class="tv-controls">
            <button type="button" class="tv-knob" aria-label="Change channel"></button>
            <button type="button" class="tv-knob small" aria-label="Turn video off"></button>
            <span class="tv-led" aria-hidden="true"></span>
          </div>
        </div>
      </div>
    </div>
  </section>`;
}

const inView = (el) => {
  const r = el.getBoundingClientRect();
  return r.bottom > 0 && r.top < innerHeight;
};
const progress = (el) => {
  const r = el.getBoundingClientRect();
  return Math.min(Math.max(-r.top / Math.max(el.offsetHeight - innerHeight, 1), 0), 1);
};

function initPencil() {
  const section = document.querySelector('.pencil');
  const paths = [...section.querySelectorAll('.strokes path')];
  const tool = section.querySelector('.pencil-tool');
  const fill = section.querySelector('.ink-fill');
  const noise = section.querySelector('#boil-noise');
  const update = () => {
    if (!inView(section)) return;
    const p = progress(section);
    const drawn = Math.min(p / 0.76, 1) * paths.length;
    let tip = null;
    paths.forEach((path, i) => {
      const local = Math.min(Math.max(drawn - i, 0), 1);
      path.style.strokeDashoffset = 1 - local;
      if (local > 0 && local < 1) tip = path.getPointAtLength(path.getTotalLength() * local);
    });
    if (tip) tool.setAttribute('transform', `translate(${tip.x} ${tip.y})`);
    tool.style.opacity = p > 0.78 ? 0 : 1;
    fill.setAttribute('opacity', Math.min(Math.max((p - 0.78) / 0.16, 0), 1));
  };
  window.addEventListener('scroll', update, { passive: true });
  update();
  if (!reduced) {
    let seed = 1;
    setInterval(() => {
      if (inView(section)) noise.setAttribute('seed', (seed = (seed % 4) + 1));
    }, 130);
  }
}

function initZoom() {
  const section = document.querySelector('.zoom');
  const word = section.querySelector('.zoom-word');
  const full = section.querySelector('.zoom-full');
  const caption = section.querySelector('.zoom-caption');
  const update = () => {
    if (!inView(section)) return;
    const p = progress(section);
    const t = Math.min(p / 0.7, 1);
    word.style.transform = `scale(${1 + t * t * t * 26})`;
    const reveal = Math.min(Math.max((p - 0.5) / 0.2, 0), 1);
    word.style.opacity = 1 - reveal;
    full.style.opacity = reveal;
    full.style.transform = `scale(${1.25 - reveal * 0.25})`;
    const c = Math.min(Math.max((p - 0.74) / 0.12, 0), 1);
    caption.style.opacity = c;
    caption.style.visibility = c > 0.01 ? 'visible' : 'hidden';
    caption.style.transform = `translateY(${(1 - c) * 26}px)`;
  };
  window.addEventListener('scroll', update, { passive: true });
  update();
}

function initBeat() {
  const section = document.querySelector('.play');
  const toggle = section.querySelector('.beat-toggle');
  const pads = [...section.querySelectorAll('.pad')];
  section.querySelector('.pads').addEventListener('click', (e) => {
    const pad = e.target.closest('.pad');
    if (pad) pad.setAttribute('aria-pressed', pad.getAttribute('aria-pressed') !== 'true');
  });

  let ctx;
  let timer;
  let step = 0;
  const noiseBurst = (time, length, filterType, frequency, volume) => {
    const buffer = ctx.createBuffer(1, ctx.sampleRate * length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = frequency;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + length);
    source.connect(filter).connect(gain).connect(output());
    source.start(time);
  };
  const tone = (time, type, from, to, length, volume) => {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(from, time);
    osc.frequency.exponentialRampToValueAtTime(to, time + length);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + length);
    osc.connect(gain).connect(output());
    osc.start(time);
    osc.stop(time + length);
  };
  const SCALE = [220, 261.6, 329.6, 392, 440, 392, 329.6, 293.7];
  const sounds = [
    (t) => tone(t, 'sine', 150, 42, 0.22, 0.75),
    (t) => noiseBurst(t, 0.16, 'highpass', 1400, 0.32),
    (t) => noiseBurst(t, 0.05, 'highpass', 7000, 0.16),
    (t, s) => tone(t, 'sawtooth', SCALE[s], SCALE[s], 0.2, 0.08),
  ];
  const stop = () => {
    clearInterval(timer);
    timer = null;
    toggle.textContent = 'Play beat';
    toggle.setAttribute('aria-pressed', 'false');
    pads.forEach((p) => p.classList.remove('now'));
    section.classList.remove('beating');
    duckAmbient(false);
  };
  const tick = () => {
    const time = ctx.currentTime + 0.01;
    pads.forEach((p) => {
      const here = Number(p.dataset.step) === step;
      p.classList.toggle('now', here);
      if (here && p.getAttribute('aria-pressed') === 'true') sounds[Number(p.dataset.row)](time, step);
    });
    if (!reduced && step % 2 === 0) section.style.setProperty('--glow', 0.55 + (step % 4 === 0 ? 0.45 : 0));
    step = (step + 1) % 8;
  };
  toggle.addEventListener('click', () => {
    if (timer) return stop();
    ctx = audioContext();
    duckAmbient(true);
    toggle.textContent = 'Stop beat';
    toggle.setAttribute('aria-pressed', 'true');
    section.classList.add('beating');
    tick();
    timer = setInterval(tick, 150);
  });
  window.addEventListener('scroll', () => { if (timer && !inView(section)) stop(); }, { passive: true });

  const bars = section.querySelector('.bars');
  const barCtx = bars.getContext('2d');
  const freq = new Uint8Array(64);
  const drawBars = () => {
    requestAnimationFrame(drawBars);
    if (!inView(bars)) return;
    frequencyBars(freq);
    barCtx.clearRect(0, 0, 480, 60);
    for (let i = 0; i < 40; i++) {
      const h = (freq[i] / 255) * 56 + 2;
      barCtx.fillStyle = ['#b14dff', '#ff2bd6', '#27e6ff', '#c6ff3d'][i % 4];
      barCtx.fillRect(i * 12, 60 - h, 9, h);
    }
  };
  drawBars();
}

function initKeepy() {
  const canvas = document.getElementById('keepy');
  const c = canvas.getContext('2d');
  const now = document.getElementById('keepy-now');
  const bestEl = document.getElementById('keepy-best');
  const W = canvas.width;
  const H = canvas.height;
  const R = 30;
  let ball = { x: W / 2, y: H - R, vx: 0, vy: 0, spin: 0 };
  let touches = 0;
  let best = 0;
  let last = performance.now();

  const kick = (fromX = ball.x) => {
    ball.vy = -640;
    ball.vx = (ball.x - fromX) * 5 + (Math.random() - 0.5) * 130;
    touches += 1;
    sfx.kick();
    best = Math.max(best, touches);
    now.textContent = touches;
    bestEl.textContent = best;
  };
  canvas.addEventListener('pointerdown', (e) => {
    const box = canvas.getBoundingClientRect();
    const x = ((e.clientX - box.left) / box.width) * W;
    const y = ((e.clientY - box.top) / box.height) * H;
    if (Math.hypot(x - ball.x, y - ball.y) < R * 2.2) kick(x);
  });
  canvas.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      kick();
    }
  });

  const draw = () => {
    c.clearRect(0, 0, W, H);
    c.fillStyle = 'rgb(198 255 61 / 0.9)';
    c.fillRect(0, H - 4, W, 4);
    c.save();
    c.translate(ball.x, ball.y);
    c.rotate(ball.spin);
    c.shadowColor = '#b14dff';
    c.shadowBlur = 26;
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.arc(0, 0, R, 0, Math.PI * 2);
    c.fill();
    c.shadowBlur = 0;
    c.fillStyle = '#120a2c';
    for (let i = 0; i < 6; i++) {
      const a = (i / 5) * Math.PI * 2;
      const d = i === 5 ? 0 : R * 0.68;
      c.beginPath();
      c.arc(Math.cos(a) * d, Math.sin(a) * d, R * 0.22, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  };
  const loop = (time) => {
    const dt = Math.min((time - last) / 1000, 0.033);
    last = time;
    if (inView(canvas)) {
      if (touches > 0 || ball.y < H - R - 1) {
        ball.vy += 1050 * dt;
        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;
        ball.spin += ball.vx * dt * 0.02;
        if (ball.x < R || ball.x > W - R) {
          ball.vx *= -0.85;
          ball.x = Math.min(Math.max(ball.x, R), W - R);
        }
        if (ball.y > H - R - 4) {
          ball.y = H - R - 4;
          ball.vy = 0;
          ball.vx = 0;
          if (touches > 0) sfx.land();
          touches = 0;
          now.textContent = 0;
        }
      }
      draw();
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

function initTv() {
  const section = document.querySelector('.tv-chapter');
  const screen = section.querySelector('.tv-screen');
  const frame = section.querySelector('.tv-frame');
  const play = section.querySelector('.tv-play');
  const [channel, off] = section.querySelectorAll('.tv-knob');
  const letters = [...section.querySelectorAll('.jump')];
  STILLS.forEach((src) => { new Image().src = src; });

  let index = 0;
  let locked = false;
  const closeVideo = () => {
    screen.querySelector('iframe')?.remove();
    duckAmbient(false);
    screen.classList.remove('on');
    locked = false;
    play.hidden = false;
  };
  play.addEventListener('click', () => {
    duckAmbient(true);
    const iframe = document.createElement('iframe');
    iframe.src = TV_VIDEO;
    iframe.title = 'Besos de Vino, stop-motion animated poem';
    iframe.allow = 'autoplay; fullscreen';
    iframe.allowFullscreen = true;
    screen.append(iframe);
    screen.classList.add('on');
    locked = true;
    play.hidden = true;
  });
  channel.addEventListener('click', () => {
    closeVideo();
    channel.style.transform = `rotate(${(Number(channel.dataset.turn ?? 0) + 1) * 60}deg)`;
    channel.dataset.turn = Number(channel.dataset.turn ?? 0) + 1;
    screen.classList.add('static');
    setTimeout(() => {
      index = (index + 1) % STILLS.length;
      frame.src = STILLS[index];
      screen.classList.remove('static');
    }, 380);
  });
  off.addEventListener('click', closeVideo);

  if (reduced) return;
  // Doce cuadros por segundo a dos tiempos: el temblor propio del stop motion.
  setInterval(() => {
    if (!inView(section)) return;
    letters.forEach((el) => {
      el.style.transform = `translateY(${(Math.random() - 0.5) * 7}px) rotate(${(Math.random() - 0.5) * 6}deg)`;
    });
    if (locked) return;
    const r = progress(section);
    index = Math.floor(r * 12 + performance.now() / 500) % STILLS.length;
    frame.src = STILLS[index];
    frame.style.transform = `translate(${(Math.random() - 0.5) * 5}px, ${(Math.random() - 0.5) * 5}px) rotate(${(Math.random() - 0.5) * 0.7}deg) scale(1.05)`;
  }, 166);
}

function initGlow() {
  if (reduced || !matchMedia('(pointer: fine)').matches) return;
  const glow = document.createElement('div');
  glow.className = 'cursor-glow';
  document.body.append(glow);
  let x = innerWidth / 2;
  let y = innerHeight / 2;
  let gx = x;
  let gy = y;
  window.addEventListener('pointermove', (e) => { x = e.clientX; y = e.clientY; }, { passive: true });
  const loop = () => {
    gx += (x - gx) * 0.09;
    gy += (y - gy) * 0.09;
    glow.style.transform = `translate(${gx - 280}px, ${gy - 280}px)`;
    requestAnimationFrame(loop);
  };
  loop();
}

export function initChapters() {
  initPencil();
  initZoom();
  initBeat();
  initKeepy();
  initTv();
  initGlow();
}
