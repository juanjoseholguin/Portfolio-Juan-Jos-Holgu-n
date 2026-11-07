import '@fontsource/poppins/400.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import '@fontsource/caveat/700.css';
import '@fontsource-variable/pixelify-sans/wght.css';
import './style.css';
import { createHud } from './hud.js';
import { initChapters, pencilChapter, playChapter, tvChapter, zoomChapter } from './chapters.js';
import { doorChapter, initWorlds, lightChapter, pixelChapter } from './worlds.js';
import { audioLevel, setAmbient, sfx } from './audio.js';
import { LOW } from './quality.js';

const esc = (value = '') =>
  String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const dataUrl = (file) => `${import.meta.env.BASE_URL}data/${file}`;
const number = new Intl.NumberFormat('en-US');
const yearOf = (seconds) => (seconds ? new Date(seconds * 1000).getFullYear() : '');
const firstParagraph = (text = '') => text.split(/\n\s*\n/)[0].trim();

function projectMeta(p) {
  const parts = [yearOf(p.publishedOn)];
  if (p.views) parts.push(`${number.format(p.views)} views`);
  return parts.filter(Boolean).join(', ');
}

function render(profile, projects, featured) {
  const stops = featured
    .map(
      (p, i) => `
      <section class="chapter stop ${i % 2 === 0 ? 'right' : ''}" data-pose id="${i === 0 ? 'proyectos' : `proyecto-${i}`}">
        <div class="pin"><div class="copy fade">
          ${p.cover ? `<img class="fallback-cover" src="${esc(p.cover)}" alt="" loading="lazy" />` : ''}
          <h3>${esc(p.name)}</h3>
          <p class="meta">${esc(projectMeta(p))}</p>
          ${p.description ? `<p class="summary">${esc(firstParagraph(p.description))}</p>` : ''}
          <button class="btn" type="button" data-project="${projects.indexOf(p)}">View project</button>
        </div></div>
      </section>`,
    )
    .join('');

  const awards = profile.awards
    .map(
      (a, i) => `
      <section class="chapter award" data-pose ${i === 0 ? 'id="premios"' : ''}>
        <div class="pin"><div class="copy fade">
          <p class="prize">${esc(a.prize)}${a.year ? `, ${esc(a.year)}` : ''}</p>
          <h3>${esc(a.title)}</h3>
          ${a.detail ? `<p class="meta">${esc(a.detail)}</p>` : ''}
          ${a.url ? `<a class="btn" href="${esc(a.url)}" target="_blank" rel="noopener">View winning project</a>` : ''}
        </div></div>
      </section>`,
    )
    .join('');

  const passions = (profile.passions ?? [])
    .map(
      (item) => `
      <section class="chapter object" data-pose>
        <div class="pin"><div class="copy fade">
          <p class="object-tag">${esc(item.tag)}</p>
          <h3>${esc(item.title)}</h3>
          <p class="meta">${esc(item.text)}</p>
        </div></div>
      </section>`,
    )
    .join('');

  const experience = profile.experience
    .map(
      (e) => `<li><strong>${esc(e.role)}</strong><span>${[e.org, e.period].filter(Boolean).map(esc).join(', ')}</span></li>`,
    )
    .join('');
  const slot = import.meta.env.DEV
    ? '<li class="slot"><a href="/editor.html">Add your experience here</a></li>'
    : '';

  const links = profile.links.filter((l) => l.url);
  document.getElementById('bar-name').textContent = profile.name;
  document.getElementById('app').innerHTML = `
    <section class="chapter hero" id="top" data-pose>
      <div class="pin"><div>
        <h1 aria-label="${esc(profile.name)}">${profile.name
          .split(' ')
          .map((word, w) => `<span class="word" aria-hidden="true">${[...word]
            .map((ch, i) => `<span class="letter" style="--i:${w * 5 + i}">${esc(ch)}</span>`)
            .join('')}</span>`)
          .join(' ')}</h1>
        <p>${esc(profile.role)} in ${esc(profile.location)}</p>
      </div>
      <p class="hint">Scroll to enter</p></div>
    </section>
    <section class="chapter statement" data-pose>
      <div class="pin"><p class="fade">${esc(profile.statement)}</p></div>
    </section>
    ${pencilChapter()}
    ${stops}
    ${zoomChapter(projects.find((p) => p.id === '256507675') ?? projects[0])}
    ${passions}
    ${playChapter()}
    ${pixelChapter()}
    ${tvChapter()}
    ${lightChapter(projects, profile.awards)}
    ${doorChapter()}
    ${awards}
    <section class="chapter about" id="sobre-mi" data-pose>
      <div class="pin"><div class="copy fade">
        <div class="about-head">
          <figure class="portrait"><img src="${import.meta.env.BASE_URL}juan.webp" alt="Portrait of Juan José Holguín" width="560" height="700" loading="lazy" /></figure>
          <h2 class="section-title">About me</h2>
        </div>
        <p class="about-text">${esc(profile.about)}</p>
        <p class="skills">${profile.skills.map(esc).join(', ')}</p>
        <ul class="experience">${experience}${slot}</ul>
      </div></div>
    </section>
    <div class="marquee" aria-hidden="true"><div class="marquee-track">${'UI/UX Design  /  Motion  /  Branding  /  3D  /  Stop Motion  /  Code  /  '.repeat(6)}</div></div>
    <section class="index" aria-labelledby="index-title">
      <div class="index-head">
        <h2 class="section-title" id="index-title">All projects</h2>
        <a href="https://www.behance.net/${esc(profile.behanceUsername)}" target="_blank" rel="noopener">View Behance profile</a>
      </div>
      <div class="grid">
        ${projects
          .map(
            (p, i) => `<button class="tile" type="button" data-project="${i}">
              <img src="${esc(p.cover ?? '')}" alt="" loading="lazy" />
              <span>${esc(p.name)}</span>
            </button>`,
          )
          .join('')}
      </div>
    </section>
    <section class="chapter contact" id="contacto" data-pose>
      <div class="pin"><div class="copy fade">
        <h2 class="section-title">Let's talk</h2>
        <ul class="contact-links">
          ${profile.email ? `<li><a href="mailto:${esc(profile.email)}">${esc(profile.email)}</a></li>` : ''}
          ${links.map((l) => `<li><a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a></li>`).join('')}
        </ul>
        <p class="colophon">${esc(profile.name)}, ${new Date().getFullYear()}</p>
      </div></div>
    </section>`;
}

function openProject(project) {
  const dialog = document.getElementById('project-dialog');
  dialog.innerHTML = `
    ${project.cover ? `<img src="${esc(project.cover)}" alt="Cover of ${esc(project.name)}" />` : ''}
    <div class="dialog-body">
      <h2 id="dialog-title">${esc(project.name)}</h2>
      <p class="meta">${esc(projectMeta(project))}</p>
      ${project.description ? `<p class="description">${esc(project.description)}</p>` : ''}
      <div class="dialog-actions">
        <a class="btn" href="${esc(project.url)}" target="_blank" rel="noopener">Open on Behance</a>
        <button class="close" type="button">Close</button>
      </div>
    </div>`;
  dialog.querySelector('.close').addEventListener('click', () => dialog.close());
  dialog.showModal();
}

/* Lleva el scroll a una posición continua entre poses, con pausa en cada capítulo. */
function scrollMapper() {
  const anchors = [...document.querySelectorAll('[data-pose]')];
  let table = [];
  const measure = () => {
    const vh = window.innerHeight;
    table = anchors.map((el, i) => {
      const top = el.getBoundingClientRect().top + window.scrollY;
      const span = Math.max(el.offsetHeight - vh, 0);
      return { y: i === 0 ? 0 : top + span / 2, el, top, span };
    });
  };
  measure();
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);
  document.fonts?.ready.then(measure);

  const ease = (x) => {
    const t = Math.min(Math.max((x - 0.16) / 0.68, 0), 1);
    return t * t * t * (t * (6 * t - 15) + 10);
  };
  return {
    toPose(y) {
      if (y <= table[0].y) return 0;
      for (let i = 0; i < table.length - 1; i++) {
        if (y < table[i + 1].y) return i + ease((y - table[i].y) / (table[i + 1].y - table[i].y));
      }
      return table.length - 1;
    },
    fadeCopy(y, reducedMotion) {
      const vh = window.innerHeight;
      table.forEach(({ el, y: center, span }) => {
        const copy = el.querySelector('.fade');
        if (!copy) return;
        const range = Math.max(span / 2, vh * 0.2);
        const d = (y - center) / range;
        const opacity = Math.min(Math.max((1.12 - Math.abs(d)) / 0.42, 0), 1);
        copy.style.opacity = opacity;
        copy.style.visibility = opacity < 0.01 ? 'hidden' : 'visible';
        copy.classList.toggle('in', opacity > 0.9);
        if (!reducedMotion) copy.style.transform = `translateY(${d * -22}px)`;
      });
    },
  };
}

async function start() {
  const [profile, synced] = await Promise.all([
    fetch(dataUrl('profile.json')).then((r) => r.json()),
    fetch(dataUrl('projects.json')).then((r) => r.json()),
  ]);
  const hidden = new Set(profile.hiddenProjects.map(String));
  const projects = [...(profile.extraProjects ?? []), ...synced.projects]
    .filter((p) => !hidden.has(String(p.id)))
    .map((p) => ({ ...p, ...profile.projectCopy?.[p.id] }));
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Vuelo: los más recientes y los proyectos premiados.
  const forced = projects.filter((p) => (profile.featuredIds ?? []).includes(String(p.id)));
  const featured = [
    ...projects.filter((p) => !forced.includes(p)).slice(0, Math.max((profile.featuredCount ?? 12) - forced.length, 0)),
    ...forced,
  ];

  render(profile, projects, featured);
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-project]');
    if (trigger) openProject(projects[Number(trigger.dataset.project)]);
  });
  const dialog = document.getElementById('project-dialog');
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });

  initChapters();
  const mapper = scrollMapper();
  await document.fonts?.load('700 40px Poppins');
  const stopEls = [...document.querySelectorAll('.stop')];
  let currentK = 0;
  function rollDie() {
    const roll = 1 + Math.floor(Math.random() * 6);
    const here = Math.round(currentK) - 2;
    const from = here < 0 || here >= stopEls.length ? -1 : here;
    const target = from + roll >= stopEls.length ? (from + roll) % stopEls.length : from + roll;
    const el = stopEls[target];
    const top = el.getBoundingClientRect().top + window.scrollY + Math.max(el.offsetHeight - window.innerHeight, 0) / 2;
    window.scrollTo({ top, behavior: reducedMotion ? 'auto' : 'smooth' });
    scene?.jump();
    hud.speak(`You rolled ${roll}. Next stop: ${featured[target].name}`);
  }
  const coinsTotal = Math.max(featured.length - 1, 0) * 3;
  let soundOn = true;
  try { soundOn = localStorage.getItem('sound') !== 'off'; } catch { /* Sin almacenamiento. */ }
  const startSound = () => {
    window.removeEventListener('pointerdown', startSound);
    window.removeEventListener('keydown', startSound);
    if (soundOn) setAmbient(true);
  };
  window.addEventListener('pointerdown', startSound);
  window.addEventListener('keydown', startSound);
  const hud = createHud({
    coinsTotal,
    reducedMotion,
    soundOn,
    onSound: (on) => {
      soundOn = on;
      try { localStorage.setItem('sound', on ? 'on' : 'off'); } catch { /* Sin almacenamiento. */ }
      setAmbient(on);
    },
    onStyle: (name) => scene?.setStyle(name),
    onCharacter: (name, look) => scene?.setCharacter(name, look),
    onRoll: rollDie,
  });
  initWorlds({
    getLook: () => hud.look,
    covers: ['239441539', '213687773', '230018955', '193297007'].map((id) => projects.find((p) => p.id === id)?.cover).filter(Boolean),
  });
  // El sitio ya se puede leer y usar mientras llega el 3D.
  let scene;
  try {
    const { createScene } = await import('./scene.js');
    scene = createScene(document.getElementById('scene'), {
      projects: featured,
      awards: profile.awards,
      links: [
        ...profile.links.filter((l) => l.url).slice(0, 3),
        ...(profile.email ? [{ label: 'Email', url: `mailto:${profile.email}` }] : []),
      ],
      skills: profile.skills.slice(0, 9),
      reducedMotion,
      character: hud.character,
      look: hud.look,
      onOpenProject: openProject,
      onRollDie: rollDie,
      onGreet: () => hud.speak(`Hi! Roll the die to race to a project.`),
      onCoin: (n) => {
        hud.setCoins(n);
        sfx.coin();
        if (n === coinsTotal) hud.speak('All coins collected. Nice run!');
      },
    });
  } catch (error) {
    console.warn('WebGL no disponible', error);
    document.documentElement.classList.add('no-webgl');
    document.body.dataset.theme = 'light';
    return;
  }

  scene.setStyle(hud.style);
  document.body.classList.add('scene-ready');
  let smooth = window.scrollY;
  let previous = performance.now();
  // Posiciones guardadas: leerlas del DOM en cada cuadro hace ir lento al celular.
  let ranges = [];
  const measureSolids = () => {
    ranges = [...document.querySelectorAll('.solid, .index')].map((el) => {
      const top = el.getBoundingClientRect().top + window.scrollY;
      return [top, top + el.offsetHeight];
    });
  };
  measureSolids();
  window.addEventListener('resize', measureSolids);
  window.addEventListener('load', measureSolids);
  document.fonts?.ready.then(measureSolids);
  const styleAt = (k) => {
    const stop = k - 2;
    if (stop >= 3.5 && stop < 5.5) return 'pixel';
    if (stop >= 5.5 && stop < 7.5) return 'toon';
    if (stop >= 7.5 && stop < 9.5) return 'wire';
    const awardsAt = featured.length + (profile.passions?.length ?? 0);
    if (stop >= awardsAt - 0.5 && stop < awardsAt + profile.awards.length - 0.5) return 'toon';
    return '3d';
  };
  let slow = 0;
  let frames = 0;
  let idle = 0;
  const frame = (now) => {
    const y = window.scrollY;
    const dt = Math.min((now - previous) / 1000, 0.25);
    previous = now;
    smooth += (y - smooth) * (reducedMotion ? 1 : 1 - Math.exp(-dt * 7));
    if (Math.abs(y - smooth) < 0.05) smooth = y;
    mapper.fadeCopy(smooth, reducedMotion);
    currentK = mapper.toPose(smooth);
    hud.auto(styleAt(currentK));
    // Un capítulo 2D tapa toda la pantalla: no hace falta dibujar el 3D debajo.
    const covered = ranges.some(([top, bottom]) => smooth >= top && smooth + window.innerHeight <= bottom);
    idle = smooth === y ? idle + 1 : 0;
    frames += 1;
    const skip = LOW && idle > 30 && frames % 2;
    if (!covered && !skip) {
      scene.render(currentK, audioLevel());
      slow = dt > 0.034 ? slow + 1 : Math.max(slow - 1, 0);
      if (slow > 45) {
        slow = 0;
        scene.lowerQuality();
      }
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

start().catch((error) => {
  document.getElementById('app').innerHTML = `<p style="padding:96px 24px">The content could not load: ${esc(error.message)}. Reload the page to try again.</p>`;
});
