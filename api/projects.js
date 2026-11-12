import fs from 'node:fs/promises';
import path from 'node:path';
import { fetchRecent, mergeProjects } from '../lib/behance.mjs';

const readJson = async (file) => JSON.parse(await fs.readFile(path.join(process.cwd(), 'public/data', file), 'utf8'));

/* Proyectos en vivo: lo que hay hoy en Behance, con unos minutos de caché. */
export default async function handler(req, res) {
  try {
    const [profile, saved] = await Promise.all([readJson('profile.json'), readJson('projects.json')]);
    const recent = await fetchRecent(profile.behanceUsername);
    const known = new Map(saved.projects.map((p) => [p.id, p]));
    const projects = mergeProjects(recent, saved.projects, saved.window).projects.map(({ coverUrl, ...p }) => {
      const stored = known.get(p.id);
      const cover = stored?.cover ?? (coverUrl ? `api/cover?u=${encodeURIComponent(coverUrl)}` : null);
      return { ...stored, ...p, description: p.description || stored?.description, cover };
    });
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
    res.status(200).json({ username: profile.behanceUsername, live: true, syncedAt: new Date().toISOString(), projects });
  } catch (error) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(502).json({ error: error.message });
  }
}
