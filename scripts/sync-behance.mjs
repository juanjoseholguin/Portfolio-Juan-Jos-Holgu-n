// Trae los proyectos publicados en Behance y los guarda en public/data/projects.json.
// Fuentes: la página pública del perfil y el feed RSS. Sin claves ni inicio de sesión.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchRecent, mergeProjects } from '../lib/behance.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'public/data');
const coverDir = path.join(root, 'public/covers');
const headers = { 'User-Agent': 'Mozilla/5.0 (portfolio-sync)' };

const profile = JSON.parse(await fs.readFile(path.join(dataDir, 'profile.json'), 'utf8'));
const username = profile.behanceUsername;

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
  const recent = await fetchRecent(username);
  if (!recent.pageOk) console.warn('Perfil no disponible. Se usará el feed.');
  if (!recent.feedOk) console.warn('Feed no disponible.');
  const previous = await fs
    .readFile(path.join(dataDir, 'projects.json'), 'utf8')
    .then((text) => JSON.parse(text).projects)
    .catch(() => []);
  const previousWindow = await fs
    .readFile(path.join(dataDir, 'projects.json'), 'utf8')
    .then((text) => JSON.parse(text).window ?? [])
    .catch(() => []);
  const { projects: merged, window, removed } = mergeProjects(recent, previous, previousWindow);
  if (removed.length) console.log(`Quitados de Behance: ${removed.join(', ')}`);

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
    JSON.stringify({ username, syncedAt: new Date().toISOString(), window, projects }, null, 2) + '\n',
  );
  console.log(`${projects.length} proyectos sincronizados desde behance.net/${username}.`);
}

main().catch((error) => {
  console.warn(`La sincronización falló: ${error.message}. Se conserva la última versión.`);
});
