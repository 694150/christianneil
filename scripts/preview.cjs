const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../outputs/portfolio/dist');
const types = {'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.jpg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.otf':'font/otf','.woff2':'font/woff2','.png':'image/png','.txt':'text/plain; charset=utf-8','.xml':'application/xml','.pdf':'application/pdf'};
http.createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400).end(); return; }
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (path.relative(root, file).startsWith('..')) { res.writeHead(403).end(); return; }
  fs.readFile(file, (error, data) => {
    if (error) { res.writeHead(404).end(); return; }
    const headers = {'Content-Type':types[path.extname(file)] || 'application/octet-stream'};
    // Local-only fallback check: block scripts without changing the shipped HTML.
    if (new URL(req.url, 'http://localhost').searchParams.has('no-js')) {
      headers['Content-Security-Policy'] = "script-src 'none'";
    }
    res.writeHead(200, headers);
    res.end(data);
  });
}).listen(5174, '127.0.0.1', () => process.stdout.write('Portfolio preview: http://127.0.0.1:5174\n'));
