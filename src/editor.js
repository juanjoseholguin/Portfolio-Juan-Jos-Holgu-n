import '@fontsource/poppins/400.css';
import '@fontsource/poppins/600.css';

const form = document.getElementById('form');
const statusEl = document.getElementById('status');
const say = (text) => { statusEl.textContent = text; };
const noCache = { cache: 'no-store' };

const profile = await fetch('/data/profile.json', noCache).then((r) => r.json());
let synced = await fetch('/data/projects.json', noCache).then((r) => r.json()).catch(() => ({ projects: [] }));

const LISTS = {
  awards: {
    title: 'Premios',
    add: 'Añadir premio',
    blank: { prize: '', title: '', detail: '', year: '', url: '', icon: 'star' },
    fields: {
      prize: 'Nombre del premio',
      title: 'Categoría',
      detail: 'Descripción',
      year: 'Año',
      url: 'Enlace al proyecto',
      icon: { label: 'Figura sobre el trofeo', options: { star: 'Gema', film: 'Audiovisual', die: 'Dado' } },
    },
  },
  experience: {
    title: 'Experiencia y formación',
    add: 'Añadir experiencia',
    blank: { role: '', org: '', period: '' },
    fields: { role: 'Cargo o título', org: 'Empresa o institución', period: 'Periodo' },
  },
  links: {
    title: 'Enlaces (los cuatro primeros son las teclas de la consola)',
    add: 'Añadir enlace',
    blank: { label: '', url: '' },
    fields: { label: 'Nombre', url: 'Dirección' },
  },
};

function field(label, value, onInput, { long = false, options = null } = {}) {
  const wrap = document.createElement('label');
  wrap.textContent = label;
  let input;
  if (options) {
    input = document.createElement('select');
    for (const [v, text] of Object.entries(options)) input.add(new Option(text, v, false, v === value));
  } else {
    input = document.createElement(long ? 'textarea' : 'input');
    input.value = value ?? '';
  }
  input.addEventListener('input', () => { onInput(input.value); say('Cambios sin guardar'); });
  wrap.append(input);
  return wrap;
}

function group(title) {
  const set = document.createElement('fieldset');
  const legend = document.createElement('legend');
  legend.textContent = title;
  set.append(legend);
  form.append(set);
  return set;
}

function button(text, onClick, className = '') {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = text;
  b.className = className;
  b.addEventListener('click', onClick);
  return b;
}

async function save() {
  const res = await fetch('/__save', { method: 'POST', body: JSON.stringify(profile) });
  say(res.ok ? 'Cambios guardados' : `No se guardó: ${await res.text()}`);
}

function draw() {
  form.replaceChildren();

  group('Presentación').append(
    field('Nombre', profile.name, (v) => (profile.name = v)),
    field('Rol', profile.role, (v) => (profile.role = v)),
    field('Ciudad', profile.location, (v) => (profile.location = v)),
    field('Frase principal', profile.statement, (v) => (profile.statement = v), { long: true }),
    field('Sobre mí', profile.about, (v) => (profile.about = v), { long: true }),
    field('Habilidades, separadas por comas', profile.skills.join(', '), (v) => {
      profile.skills = v.split(',').map((s) => s.trim()).filter(Boolean);
    }),
    field('Correo de contacto', profile.email, (v) => (profile.email = v.trim())),
  );

  for (const [key, spec] of Object.entries(LISTS)) {
    const set = group(spec.title);
    profile[key].forEach((item, index) => {
      const entry = document.createElement('div');
      entry.className = 'entry';
      for (const [name, def] of Object.entries(spec.fields)) {
        const isSelect = typeof def === 'object';
        entry.append(
          field(isSelect ? def.label : def, item[name], (v) => (item[name] = v), {
            long: name === 'detail',
            options: isSelect ? def.options : null,
          }),
        );
      }
      entry.append(
        button('Eliminar', () => { profile[key].splice(index, 1); say('Cambios sin guardar'); draw(); }, 'remove'),
      );
      set.append(entry);
    });
    set.append(button(spec.add, () => { profile[key].push({ ...spec.blank }); say('Cambios sin guardar'); draw(); }));
  }

  const behance = group('Behance');
  behance.append(
    field('Usuario de Behance', profile.behanceUsername, (v) => (profile.behanceUsername = v.trim())),
    button('Guardar y sincronizar', async () => {
      await save();
      say('Sincronizando…');
      const res = await fetch('/__sync', { method: 'POST' });
      const message = await res.text();
      synced = await fetch('/data/projects.json', noCache).then((r) => r.json());
      draw();
      say(message.split('\n').pop() || 'Sincronización terminada');
    }, 'primary'),
  );
  const hint = document.createElement('p');
  hint.textContent = 'Marca los proyectos que quieres mostrar.';
  behance.append(hint);
  for (const p of synced.projects) {
    const row = document.createElement('label');
    row.className = 'project';
    const check = document.createElement('input');
    check.type = 'checkbox';
    check.checked = !profile.hiddenProjects.includes(p.id);
    check.addEventListener('change', () => {
      profile.hiddenProjects = check.checked
        ? profile.hiddenProjects.filter((id) => id !== p.id)
        : [...profile.hiddenProjects, p.id];
      say('Cambios sin guardar');
    });
    const img = new Image();
    img.src = `/${p.cover}`;
    img.alt = '';
    row.append(check, img, p.name);
    behance.append(row);
  }
}

document.getElementById('save').addEventListener('click', save);
draw();
