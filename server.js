const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg'
};

function serveStatic(req, res) {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(ROOT, reqPath);

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

function proxyRss(req, res) {
  const urlObj = new URL(req.url, `http://localhost:${PORT}`);
  const target = urlObj.pathname === '/rss/bronx'
    ? 'https://news12.com/rss/bronx'
    : null;

  if (!target) {
    res.writeHead(400);
    res.end('Unknown RSS feed');
    return;
  }

  https.get(target, (rssRes) => {
    let data = '';
    rssRes.on('data', (chunk) => { data += chunk; });
    rssRes.on('end', () => {
      res.writeHead(200, {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'no-store'
      });
      res.end(data);
    });
  }).on('error', () => {
    res.writeHead(502);
    res.end('RSS fetch failed');
  });
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/rss/')) {
    proxyRss(req, res);
    return;
  }
  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`BX Signal server running at http://localhost:${PORT}`);
});
