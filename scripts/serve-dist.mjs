import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '..', 'dist');
const port = Number(process.env.PORT || 4173);

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
};

function resolveFilePath(urlPath) {
  const cleanPath = decodeURIComponent(urlPath.split('?')[0]);
  const safePath = cleanPath.replace(/^\/+/, '');
  const requestedPath = path.join(distDir, safePath);

  if (existsSync(requestedPath) && statSync(requestedPath).isFile()) {
    return requestedPath;
  }

  if (existsSync(requestedPath) && statSync(requestedPath).isDirectory()) {
    const indexPath = path.join(requestedPath, 'index.html');
    if (existsSync(indexPath)) {
      return indexPath;
    }
  }

  const fallbackPath = path.join(distDir, 'index.html');
  if (existsSync(fallbackPath)) {
    return fallbackPath;
  }

  return null;
}

const server = createServer((req, res) => {
  if (!existsSync(distDir)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('dist 폴더가 없습니다. 먼저 `pnpm build`를 실행하세요.');
    return;
  }

  const target = resolveFilePath(req.url || '/');
  if (!target) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('파일을 찾을 수 없습니다.');
    return;
  }

  const ext = path.extname(target).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  res.writeHead(200, { 'Content-Type': contentType });
  createReadStream(target).pipe(res);
});

server.listen(port, () => {
  console.log(`Preview server: http://localhost:${port}`);
});
