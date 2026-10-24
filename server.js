import http from 'node:http';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const HOST = '0.0.0.0';
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8'
};
const allowedFiles = new Set(['index.html', 'styles.css', 'script.js', 'config.js']);

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  let requested = decodeURIComponent(url.pathname);
  if (requested === '/' || requested === '/index.html') requested = '/index.html';
  const filename = path.basename(requested);
  if (!allowedFiles.has(filename) || requested.includes('..')) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff' });
    res.end('Not found');
    return;
  }
  try {
    const content = await readFile(path.join(__dirname, filename));
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(filename)] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Frame-Options': 'SAMEORIGIN',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Cache-Control': filename === 'index.html' || filename === 'config.js' ? 'no-store' : 'public, max-age=3600'
    });
    res.end(content);
  } catch {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Unable to load page');
  }
});

server.listen(PORT, HOST, () => {
  console.log(`PlayersHunt landing page listening on ${HOST}:${PORT}`);
});
