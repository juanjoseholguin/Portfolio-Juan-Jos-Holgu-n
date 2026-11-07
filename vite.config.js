import { defineConfig } from 'vite';
import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';

// Solo existe en desarrollo: permite que editor.html guarde el contenido en disco.
const editorApi = () => ({
  name: 'editor-api',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use('/__save', (req, res) => {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', async () => {
        try {
          const parsed = JSON.parse(body);
          await fs.writeFile('public/data/profile.json', JSON.stringify(parsed, null, 2) + '\n');
          res.end('ok');
        } catch (error) {
          res.statusCode = 400;
          res.end(error.message);
        }
      });
    });
    server.middlewares.use('/__sync', (_req, res) => {
      execFile('node', ['scripts/sync-behance.mjs'], (error, stdout, stderr) => {
        res.statusCode = error ? 500 : 200;
        res.end(`${stdout}${stderr}`.trim());
      });
    });
  },
});

export default defineConfig({
  base: './',
  plugins: [editorApi()],
  server: { watch: { ignored: ['**/public/data/**', '**/public/covers/**'] } },
});
