import '@fontsource-variable/bodoni-moda/wght-italic.css';
import '@fontsource-variable/instrument-sans/wght.css';
import './style.css';
import { createScene } from './scene.js';

const esc = (value = '') =>
  String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const dataUrl = (file) => `${import.meta.env.BASE_URL}data/${file}`;
const number = new Intl.NumberFormat('es-CO');
const yearOf = (seconds) => (seconds ? new Date(seconds * 1000).getFullYear() : '');
const firstParagraph = (text = '') => text.split(/\n\s*\n/)[0].trim();

function projectMeta(p) {
  const parts = [yearOf(p.publishedOn)];
  if (p.views) parts.push(`${number.format(p.views)} vistas`);
  return parts.filter(Boolean).join(', ');
}

function render(profile, projects) {
  const stops = projects
    .map(
      (p, i) => `
      <section class="chapter stop ${i % 2 === 0 ? 'right' : ''}" data-pose id="${i === 0 ? 'proyectos' : `proyecto-${i}`}">
        <div class="pin"><div class="copy fade">
          ${p.cover ? `<img class="fallback-cover" src="${esc(p.cover)}" alt="" loading="lazy" />` : ''}
          <h3>${esc(p.name)}</h3>
          <p class="meta">${esc(projectMeta(p))}</p>
          ${p.description ? `<p class="summary">${esc(firstParagraph(p.description))}</p>` : ''}
          <button class="btn" type="button" data-project="${i}">Ver proyecto</button>
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
          ${a.url ? `<a class="btn" href="${esc(a.url)}" target="_blank" rel="noopener">Ver proyecto premiado</a>` : ''}
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
    ? '<li class="slot"><a href="/editor.html">Añade aquí tu experiencia, cargos y logros</a></li>'
    : '';

  const links = profile.links.filter((l) => l.url);
  document.getElementById('bar-name').textContent = profile.name;
  document.getElementById('app').innerHTML = `
    <section class="chapter hero" id="top" data-pose>
      <div class="pin"><div>
        <h1>${esc(profile.name)}</h1>
        <p>${esc(profile.role)} en ${esc(profile.location)}</p>
      </div>
      <p class="hint">Desliza para entrar</p></div>
    </section>
    <section class="chapter statement" data-pose>
      <div class="pin"><p class="fade">${esc(profile.statement)}</p></div>
    </section>
    ${stops}
    ${awards}
    <section class="chapter about" id="sobre-mi" data-pose>
      <div class="pin"><div class="copy fade">
        <h2 class="section-title">Sobre mí</h2>
        <p class="about-text">${esc(profile.about)}</p>
        <p class="skills">${profile.skills.map(esc).join(', ')}</p>
        <ul class="experience">${experience}${slot}</ul>
      </div></div>
    </section>
    <section class="index" aria-labelledby="index-title">
      <div class="index-head">
        <h2 class="section-title" id="index-title">Todos los proyectos</h2>
        <a href="https://www.behance.net/${esc(profile.behanceUsername)}" target="_blank" rel="noopener">Ver perfil en Behance</a>
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
        <h2 class="section-title">Hablemos</h2>
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
    ${project.cover ? `<img src="${esc(project.cover)}" alt="Portada de ${esc(project.name)}" />` : ''}
    <div class="dialog-body">
      <h2 id="dialog-title">${esc(project.name)}</h2>
      <p class="meta">${esc(projectMeta(project))}</p>
      ${project.description ? `<p class="description">${esc(project.description)}</p>` : ''}
      <div class="dialog-actions">
        <a class="btn" href="${esc(project.url)}" target="_blank" rel="noopener">Abrir en Behance</a>
        <button class="close" type="button">Cerrar</button>
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
  const projects = [...(profile.extraProjects ?? []), ...synced.projects].filter((p) => !hidden.has(String(p.id)));
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  render(profile, projects);
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-project]');
    if (trigger) openProject(projects[Number(trigger.dataset.project)]);
  });
  const dialog = document.getElementById('project-dialog');
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });

  const mapper = scrollMapper();
  let scene;
  try {
    scene = createScene(document.getElementById('scene'), {
      projects,
      awards: profile.awards,
      links: profile.links.filter((l) => l.url),
      reducedMotion,
      onOpenProject: openProject,
    });
  } catch (error) {
    console.warn('WebGL no disponible', error);
    document.documentElement.classList.add('no-webgl');
    document.body.dataset.theme = 'light';
    return;
  }

  let smooth = window.scrollY;
  let previous = performance.now();
  const frame = (now) => {
    const y = window.scrollY;
    const dt = Math.min((now - previous) / 1000, 0.25);
    previous = now;
    smooth += (y - smooth) * (reducedMotion ? 1 : 1 - Math.exp(-dt * 7));
    if (Math.abs(y - smooth) < 0.05) smooth = y;
    mapper.fadeCopy(smooth, reducedMotion);
    scene.render(mapper.toPose(smooth));
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

start().catch((error) => {
  document.getElementById('app').innerHTML = `<p style="padding:96px 24px">No se pudo cargar el contenido: ${esc(error.message)}. Ejecuta npm run sync y recarga.</p>`;
});
