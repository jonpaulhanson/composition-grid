// Fails the build if an inline <script> in the built site isn't covered by the
// Content-Security-Policy in vercel.json.
//
// The policy allows inline scripts by hash, so editing one (the theme bootstrap in index.html,
// the analytics stub in the guide pages) without updating its hash would have the browser
// silently refuse to run it in production. This turns that into a failed deploy instead, and
// prints the hash to paste in.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const dist = join(root, 'dist');

const config = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8'));
const csp = config.headers
  .flatMap((rule) => rule.headers)
  .find((header) => header.key === 'Content-Security-Policy')?.value;
if (!csp) {
  console.error('check-csp: no Content-Security-Policy header found in vercel.json');
  process.exit(1);
}
const allowed = new Set(csp.match(/'sha256-[^']+'/g) ?? []);

function htmlFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return htmlFiles(path);
    return entry.name.endsWith('.html') ? [path] : [];
  });
}

// Scripts with a src are covered by 'self'; data blocks (JSON-LD) never execute.
const INLINE_SCRIPT = /<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi;
const DATA_BLOCK = /type=["']application\/(ld\+)?json["']/i;

const missing = new Map();
const used = new Set();
for (const file of htmlFiles(dist)) {
  for (const [, attrs, body] of readFileSync(file, 'utf8').matchAll(INLINE_SCRIPT)) {
    if (DATA_BLOCK.test(attrs)) continue;
    const hash = `'sha256-${createHash('sha256').update(body).digest('base64')}'`;
    if (allowed.has(hash)) used.add(hash);
    else missing.set(hash, [...(missing.get(hash) ?? []), relative(dist, file)]);
  }
}

for (const hash of allowed) {
  if (!used.has(hash)) console.warn(`check-csp: ${hash} is in the policy but no page uses it`);
}

if (missing.size > 0) {
  console.error('check-csp: inline scripts not covered by the Content-Security-Policy.');
  console.error('Add these to script-src in vercel.json (and drop any hash they replace):\n');
  for (const [hash, files] of missing) console.error(`  ${hash}\n    ${files.join('\n    ')}\n`);
  process.exit(1);
}

console.log(`check-csp: ${used.size} inline script hash(es) verified`);
