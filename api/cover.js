/* Sirve portadas nuevas de Behance desde el mismo dominio, para que el 3D pueda usarlas. */
export default async function handler(req, res) {
  let url;
  try {
    url = new URL(req.query.u);
  } catch {
    return res.status(400).end('Bad url');
  }
  if (url.protocol !== 'https:' || url.hostname !== 'mir-s3-cdn-cf.behance.net') return res.status(400).end('Only Behance covers');
  const upstream = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (portfolio-cover)' } });
  if (!upstream.ok) return res.status(upstream.status).end();
  res.setHeader('Content-Type', upstream.headers.get('content-type') ?? 'image/jpeg');
  res.setHeader('Cache-Control', 'public, s-maxage=604800, immutable');
  res.status(200).send(Buffer.from(await upstream.arrayBuffer()));
}
