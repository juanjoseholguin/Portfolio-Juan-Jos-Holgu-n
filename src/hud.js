import { CHARACTERS, HATS, SWATCHES } from './characters.js';
import { sfx } from './audio.js';

const STYLES = { journey: 'Journey', '3d': '3D', pixel: 'Pixel', toon: 'Toon', wire: 'Wireframe' };
export const STYLE_NAMES = STYLES;

function stored(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}
const remember = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Solo dura esta visita. */ }
};

const group = (label, options, current, attr) => `
  <div class="hud-group" role="group" aria-label="${label}">
    <span class="hud-label">${label}</span>
    ${Object.entries(options)
      .map(([value, text]) => `<button type="button" data-${attr}="${value}" aria-pressed="${value === current}">${text}</button>`)
      .join('')}
  </div>`;

const swatches = (key, label, current) => `
  <div class="swatches" role="group" aria-label="${label}">
    <span>${label}</span>
    <button type="button" class="swatch auto" data-look="${key}" data-value="" aria-pressed="${!current}" aria-label="${label}: default">A</button>
    ${SWATCHES[key]
      .map((c) => `<button type="button" class="swatch" style="background:${c}" data-look="${key}" data-value="${c}" aria-pressed="${current === c}" aria-label="${label} ${c}"></button>`)
      .join('')}
  </div>`;

/* Barra del juego: estilo, avatar, sonido, dado y monedas. */
export function createHud({ coinsTotal, reducedMotion, soundOn, onStyle, onCharacter, onRoll, onSound }) {
  let mode = stored('mode', 'journey');
  if (!(mode in STYLES)) mode = 'journey';
  let character = stored('player', 'juan');
  if (!(character in CHARACTERS)) character = 'juan';
  const look = stored('look', {});
  let sound = soundOn;
  let shown = mode === 'journey' ? '3d' : mode;

  const say = document.createElement('p');
  say.className = 'say';
  say.setAttribute('role', 'status');
  const wipe = document.createElement('div');
  wipe.className = 'wipe';
  const hud = document.createElement('div');
  hud.className = 'hud';

  const panelHtml = () => `
    <p class="panel-title">Build your player</p>
    ${group('Character', CHARACTERS, character, 'character')}
    ${group('On top', HATS, look.hat ?? 'none', 'hat')}
    ${swatches('body', 'Main color', look.body)}
    ${swatches('accent', 'Accent', look.accent)}
    ${swatches('skin', 'Skin', look.skin)}
    <button type="button" class="panel-random" data-random>Surprise me</button>`;

  hud.innerHTML = `
    <button type="button" class="hud-toggle" aria-expanded="false" aria-controls="hud-panel">Play</button>
    <div class="player-panel" id="player-panel" hidden>${panelHtml()}</div>
    <div class="hud-panel" id="hud-panel">
      ${group('Style', STYLES, mode, 'style')}
      <div class="hud-group">
        <button type="button" data-player-open aria-expanded="false" aria-controls="player-panel">Player</button>
        <button type="button" data-sound aria-pressed="${sound}">${sound ? 'Sound on' : 'Sound off'}</button>
        <button type="button" class="roll" data-roll>Roll</button>
        <span class="coins"><span class="coin-dot" aria-hidden="true"></span><span id="coin-count">0</span>/${coinsTotal}</span>
      </div>
    </div>`;
  document.body.append(wipe, say, hud);
  const panel = hud.querySelector('.player-panel');

  let sayTimer;
  const speak = (text) => {
    say.textContent = text;
    say.classList.add('on');
    clearTimeout(sayTimer);
    sayTimer = setTimeout(() => say.classList.remove('on'), 2600);
  };

  function show(next, announce = true) {
    if (next === shown) return;
    shown = next;
    const apply = () => {
      document.body.dataset.style = next;
      onStyle(next);
    };
    if (reducedMotion) {
      apply();
    } else {
      wipe.classList.remove('run');
      void wipe.offsetWidth;
      wipe.classList.add('run');
      setTimeout(apply, 150);
    }
    if (announce) speak(`${STYLES[next]} mode`);
  }

  function setMode(next) {
    mode = next;
    remember('mode', next);
    hud.querySelectorAll('[data-style]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.style === next));
    if (next === 'journey') {
      speak('Journey: the style changes as you scroll');
    } else {
      show(next);
    }
  }

  const refreshPlayer = () => {
    remember('player', character);
    remember('look', look);
    panel.innerHTML = panelHtml();
    onCharacter(character, look);
  };

  hud.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.style) setMode(b.dataset.style);
    if (b.dataset.character) {
      character = b.dataset.character;
      refreshPlayer();
      speak(`Playing as ${CHARACTERS[character]}`);
    }
    if (b.dataset.hat) {
      look.hat = b.dataset.hat;
      refreshPlayer();
    }
    if (b.dataset.look) {
      if (b.dataset.value) look[b.dataset.look] = b.dataset.value;
      else delete look[b.dataset.look];
      refreshPlayer();
    }
    if ('random' in b.dataset) {
      const pick = (list) => list[Math.floor(Math.random() * list.length)];
      character = pick(Object.keys(CHARACTERS));
      look.hat = pick(Object.keys(HATS));
      look.body = pick(SWATCHES.body);
      look.accent = pick(SWATCHES.accent);
      refreshPlayer();
    }
    if ('playerOpen' in b.dataset) {
      panel.hidden = !panel.hidden;
      b.setAttribute('aria-expanded', !panel.hidden);
    }
    if ('sound' in b.dataset) {
      sound = !sound;
      b.textContent = sound ? 'Sound on' : 'Sound off';
      b.setAttribute('aria-pressed', sound);
      onSound(sound);
    }
    if ('roll' in b.dataset) {
      sfx.roll();
      onRoll();
    }
    if (b.classList.contains('hud-toggle')) {
      const open = hud.classList.toggle('open');
      b.setAttribute('aria-expanded', open);
    }
  });

  const keys = Object.keys(STYLES);
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || document.querySelector('dialog[open]')) return;
    const index = Number(e.key) - 1;
    if (keys[index]) setMode(keys[index]);
    if (e.key === 'r' || e.key === 'R') {
      sfx.roll();
      onRoll();
    }
  });

  document.body.dataset.style = shown;
  return {
    get style() { return shown; },
    get character() { return character; },
    get look() { return look; },
    speak,
    auto(next) { if (mode === 'journey') show(next, false); },
    setSound(on) {
      sound = on;
      const b = hud.querySelector('[data-sound]');
      b.textContent = on ? 'Sound on' : 'Sound off';
      b.setAttribute('aria-pressed', on);
    },
    setCoins(n) { document.getElementById('coin-count').textContent = n; },
  };
}
