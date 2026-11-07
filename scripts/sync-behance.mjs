// Trae los proyectos publicados en Behance y los guarda en public/data/projects.json.
// Fuentes: la página pública del perfil y el feed RSS. Sin claves ni inicio de sesión.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'public/data');
const coverDir = path.join(root, 'public/covers');
const headers = { 'User-Agent': 'Mozilla/5.0 (portfolio-sync)' };

const profile = JSON.parse(await fs.readFile(path.join(dataDir, 'profile.json'), 'utf8'));
const username = profile.behanceUsername;

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

async function fromProfilePage() {
  const res = await fetch(`https://www.behance.net/${username}`, { headers });
  const html = await res.text();
  const match = html.match(/<script[^>]*id="beconfig-store_state"[^>]*>([\s\S]*?)<\/script>/);
  if (!res.ok || !match) throw new Error(`perfil no disponible (HTTP ${res.status})`);
  const state = JSON.parse(match[1]);
  const work = state.profile.activeSection.work;
  return {
    projects: work.profileProjects.map((p) => {
      const covers = p.covers?.allAvailable ?? [];
      const cover =
        covers.find((c) => c.url.includes('/808_webp/')) ??
        covers.find((c) => c.width === 808) ??
        covers[0];
      return {
        id: String(p.id),
        name: p.name,
        url: p.url,
        publishedOn: p.publishedOn,
        views: p.stats?.views?.all ?? 0,
        appreciations: p.stats?.appreciations?.all ?? 0,
        coverUrl: cover?.url,
      };
    }),
  };
}

async function fromFeed() {
  const res = await fetch(`https://www.behance.net/feeds/user?username=${encodeURIComponent(username)}`, { headers });
  if (!res.ok) throw new Error(`feed no disponible (HTTP ${res.status})`);
  const xml = await res.text();
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, item]) => {
    const tag = (name) =>
      item.match(new RegExp(`<${name}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${name}>`))?.[1] ?? '';
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

async function saveCover(project) {
  if (!project.coverUrl) return null;
  const file = `${project.id}.webp`;
  const target = path.join(coverDir, file);
  try {
    await fs.access(target);
    return `covers/${file}`;
  } catch {
    // Todavía no está descargada.
  }
  const res = await fetch(project.coverUrl, { headers });
  if (!res.ok) return null;
  await fs.writeFile(target, Buffer.from(await res.arrayBuffer()));
  return `covers/${file}`;
}

async function main() {
  await fs.mkdir(coverDir, { recursive: true });
  const [page, feed] = await Promise.allSettled([fromProfilePage(), fromFeed()]);
  if (page.status === 'rejected') console.warn(`Perfil: ${page.reason.message}. Se usará el feed.`);
  if (feed.status === 'rejected') console.warn(`Feed: ${feed.reason.message}.`);

  const feedItems = feed.status === 'fulfilled' ? feed.value : [];
  const pageItems = page.status === 'fulfilled' ? page.value.projects : [];
  const byId = new Map(feedItems.map((p) => [p.id, p]));
  for (const p of pageItems) byId.set(p.id, { ...byId.get(p.id), ...p });
  const merged = [...byId.values()].sort((a, b) => b.publishedOn - a.publishedOn);

  // Behance entrega los más recientes: los antiguos que ya no caben se conservan.
  const previous = await fs
    .readFile(path.join(dataDir, 'projects.json'), 'utf8')
    .then((text) => JSON.parse(text).projects)
    .catch(() => []);
  const oldest = merged.at(-1)?.publishedOn ?? 0;
  if (pageItems.length >= 12 && previous.length) {
    const seen = new Set(merged.map((p) => p.id));
    merged.push(...previous.filter((p) => !seen.has(p.id) && p.publishedOn < oldest));
  }

  if (!merged.length) {
    console.warn('No llegó ningún proyecto. Se conserva la última sincronización.');
    return;
  }

  const projects = [];
  for (const { coverUrl, ...p } of merged) {
    projects.push({ ...p, cover: coverUrl ? await saveCover({ ...p, coverUrl }) : p.cover });
  }

  await fs.writeFile(
    path.join(dataDir, 'projects.json'),
    JSON.stringify({ username, syncedAt: new Date().toISOString(), projects }, null, 2) + '\n',
  );
  console.log(`${projects.length} proyectos sincronizados desde behance.net/${username}.`);
}

main().catch((error) => {
  console.warn(`La sincronización falló: ${error.message}. Se conserva la última versión.`);
});
