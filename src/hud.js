import { CHARACTERS } from './characters.js';

const STYLES = { '3d': '3D', pixel: 'Pixel', toon: 'Toon', wire: 'Wireframe' };

const stored = (key, fallback, allowed) => {
  try {
    const value = localStorage.getItem(key);
    return value && value in allowed ? value : fallback;
  } catch {
    return fallback;
  }
};
const remember = (key, value) => {
  try { localStorage.setItem(key, value); } catch { /* Sin almacenamiento: solo dura esta visita. */ }
};

const group = (label, options, current, attr) => `
  <div class="hud-group" role="group" aria-label="${label}">
    <span class="hud-label">${label}</span>
    ${Object.entries(options)
      .map(
        ([value, text]) =>
          `<button type="button" data-${attr}="${value}" aria-pressed="${value === current}">${text}</button>`,
      )
      .join('')}
  </div>`;

/* Barra del juego: estilo visual, personaje, dado y monedas. */
export function createHud({ coinsTotal, reducedMotion, onStyle, onCharacter, onRoll }) {
  let style = stored('style', '3d', STYLES);
  let character = stored('character', 'juan', CHARACTERS);

  const say = document.createElement('p');
  say.className = 'say';
  say.setAttribute('role', 'status');

  const wipe = document.createElement('div');
  wipe.className = 'wipe';

  const hud = document.createElement('div');
  hud.className = 'hud';
  hud.innerHTML = `
    <button type="button" class="hud-toggle" aria-expanded="false" aria-controls="hud-panel">Play</button>
    <div class="hud-panel" id="hud-panel">
      ${group('Style', STYLES, style, 'style')}
      ${group('Player', CHARACTERS, character, 'character')}
      <div class="hud-group">
        <button type="button" class="roll" data-roll>Roll the die</button>
        <span class="coins"><span class="coin-dot" aria-hidden="true"></span><span id="coin-count">0</span>/${coinsTotal}</span>
      </div>
    </div>`;
  document.body.append(wipe, say, hud);

  let sayTimer;
  const speak = (text) => {
    say.textContent = text;
    say.classList.add('on');
    clearTimeout(sayTimer);
    sayTimer = setTimeout(() => say.classList.remove('on'), 2600);
  };

  const press = (attr, value) =>
    hud.querySelectorAll(`[data-${attr}]`).forEach((b) => b.setAttribute('aria-pressed', b.dataset[attr] === value));

  function setStyle(next) {
    if (next === style) return;
    style = next;
    remember('style', next);
    press('style', next);
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
      setTimeout(apply, 240);
    }
    speak(`${STYLES[next]} mode`);
  }

  function setCharacter(next) {
    character = next;
    remember('character', next);
    press('character', next);
    onCharacter(next);
    speak(`Playing as ${CHARACTERS[next]}`);
  }

  hud.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.style) setStyle(b.dataset.style);
    if (b.dataset.character) setCharacter(b.dataset.character);
    if ('roll' in b.dataset) onRoll();
    if (b.classList.contains('hud-toggle')) {
      const open = hud.classList.toggle('open');
      b.setAttribute('aria-expanded', open);
    }
  });

  const styleKeys = Object.keys(STYLES);
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || document.querySelector('dialog[open]')) return;
    const index = Number(e.key) - 1;
    if (styleKeys[index]) setStyle(styleKeys[index]);
    if (e.key === 'r' || e.key === 'R') onRoll();
  });

  document.body.dataset.style = style;
  return {
    style,
    character,
    speak,
    setCoins(n) {
      document.getElementById('coin-count').textContent = n;
    },
  };
}
