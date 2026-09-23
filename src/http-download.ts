// Plain Node http/https download helper — same approach as main.ts's own
// comfyRequest, no new HTTP dependency. Node's http/https do NOT auto-follow
// redirects, and both callers hit URLs that redirect through a CDN host
// (HuggingFace's resolve/main/<file> for WD14, GitHub's releases/latest/
// download/<asset> for u2net), so this chases Location headers by hand.
import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';

export function fetchToFile(url: string, destPath: string, onPercent: ((percent: number) => void) | null, redirectsLeft = 5): Promise<void> {
  return new Promise((resolve, reject) => {
    const lib = (url.startsWith('https:') ? https : http) as typeof http;
    const req = lib.get(url, (res) => {
      const status = res.statusCode ?? 0;
      if (status >= 300 && status < 400 && res.headers.location) {
        res.resume();
        if (redirectsLeft <= 0) { reject(new Error('Too many redirects.')); return; }
        const nextUrl = new URL(res.headers.location, url).toString();
        fetchToFile(nextUrl, destPath, onPercent, redirectsLeft - 1).then(resolve, reject);
        return;
      }
      if (status !== 200) {
        res.resume();
        reject(new Error(`HTTP ${status} downloading ${url}`));
        return;
      }
      const total = parseInt(res.headers['content-length'] || '0', 10);
      let downloaded = 0, lastPercent = -1;
      const file = fs.createWriteStream(destPath);
      res.on('data', (chunk: Buffer) => {
        downloaded += chunk.length;
        if (total > 0 && onPercent) {
          const percent = Math.floor((downloaded / total) * 100);
          if (percent !== lastPercent) { lastPercent = percent; onPercent(percent); }
        }
      });
      res.pipe(file);
      file.on('finish', () => file.close(() => resolve(undefined)));
      file.on('error', reject);
      res.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(30000, () => req.destroy(new Error('Download timed out.')));
  });
}
