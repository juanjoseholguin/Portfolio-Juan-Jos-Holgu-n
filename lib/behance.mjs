// Lectura de Behance compartida por la sincronización diaria y la API en vivo.
const headers = { 'User-Agent': 'Mozilla/5.0 (portfolio-sync)' };

const decode = (s) =>
  s
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();

export async function fromProfilePage(username) {
  const res = await fetch(`https://www.behance.net/${encodeURIComponent(username)}`, { headers });
  const html = await res.text();
  const match = html.match(/<script[^>]*id="beconfig-store_state"[^>]*>([\s\S]*?)<\/script>/);
  if (!res.ok || !match) throw new Error(`perfil no disponible (HTTP ${res.status})`);
  const work = JSON.parse(match[1]).profile.activeSection.work;
  return work.profileProjects.map((p) => {
    const covers = p.covers?.allAvailable ?? [];
    const cover = covers.find((c) => c.url.includes('/808_webp/')) ?? covers.find((c) => c.width === 808) ?? covers[0];
    return {
      id: String(p.id),
      name: p.name,
      url: p.url,
      publishedOn: p.publishedOn,
      views: p.stats?.views?.all ?? 0,
      appreciations: p.stats?.appreciations?.all ?? 0,
      coverUrl: cover?.url,
    };
  });
}

export async function fromFeed(username) {
  const res = await fetch(`https://www.behance.net/feeds/user?username=${encodeURIComponent(username)}`, { headers });
  if (!res.ok) throw new Error(`feed no disponible (HTTP ${res.status})`);
  const xml = await res.text();
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, item]) => {
    const tag = (name) => item.match(new RegExp(`<${name}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${name}>`))?.[1] ?? '';
    const url = tag('link');
    const description = tag('description');
    return {
      id: url.match(/gallery\/(\d+)/)?.[1],
      name: decode(tag('title')),
      url,
      publishedOn: Math.floor(new Date(tag('pubDate')).getTime() / 1000),
      coverUrl: description.match(/<img src='([^']+)'/)?.[1],
      description: decode(description),
    };
  });
}

/* Proyectos recientes de Behance, del perfil y del feed combinados. pageCount dice cuántos dio el perfil. */
export async function fetchRecent(username) {
  const [page, feed] = await Promise.allSettled([fromProfilePage(username), fromFeed(username)]);
  const pageItems = page.status === 'fulfilled' ? page.value : [];
  const feedItems = feed.status === 'fulfilled' ? feed.value : [];
  const byId = new Map(feedItems.filter((p) => p.id).map((p) => [p.id, p]));
  for (const p of pageItems) byId.set(p.id, { ...byId.get(p.id), ...p });
  return {
    // El orden de tu perfil manda: el feed puede traer los mismos en otro orden.
    projects: pageItems.length ? [...pageItems.map((p) => byId.get(p.id)), ...feedItems.filter((p) => !pageItems.some((x) => x.id === p.id))] : feedItems,
    pageOk: page.status === 'fulfilled',
    feedOk: feed.status === 'fulfilled',
    pageCount: pageItems.length,
  };
}

/*
 * Une lo que Behance muestra hoy (sus primeros 12 proyectos) con la lista guardada.
 * "window" son los proyectos que Behance mostraba en la sincronización anterior.
 * Si uno sale de esa ventana sin que entre uno nuevo que lo empuje hacia abajo, lo quitaste.
 */
export function mergeProjects(recent, saved, previousWindow = []) {
  const details = new Map(saved.map((p) => [p.id, p]));
  for (const p of recent.projects) details.set(p.id, { ...details.get(p.id), ...p });
  const now = recent.projects.map((p) => p.id);
  const nowSet = new Set(now);
  let removed = new Set();
  if (recent.pageOk && previousWindow.length) {
    const before = new Set(previousWindow);
    const entered = now.filter((id) => !before.has(id)).length;
    const missing = previousWindow.filter((id) => !nowSet.has(id));
    // Los últimos de la ventana anterior pudieron bajar porque entró algo nuevo: esos se conservan.
    const displaced = new Set(missing.slice(Math.max(missing.length - entered, 0)));
    removed = new Set(missing.filter((id) => !displaced.has(id)));
  }
  const projects = [
    ...now.map((id) => details.get(id)),
    ...saved.filter((p) => !nowSet.has(p.id) && !removed.has(p.id)),
  ];
  return { projects, window: recent.pageOk ? now : previousWindow, removed: [...removed] };
}
