import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const output = 'outputs/portfolio/dist';
const read = name => fs.readFileSync(path.join(output, name), 'utf8');
const sha = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const legacy = JSON.parse(fs.readFileSync('tests/legacy-hashes.json', 'utf8'));
const projects = JSON.parse(fs.readFileSync('src/projects.json', 'utf8'));
const manifest = JSON.parse(fs.readFileSync('src/asset-manifest.json', 'utf8'));
function verify() {
  const html = read('index.html');
  for (const [file, expected] of Object.entries(legacy)) assert.equal(sha(path.join(output, file)), expected, `Archived edition changed: ${file}`);
  for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
    const url = match[1];
    if (/^(?:https?:|data:|mailto:|tel:)/.test(url)) continue;
    assert(fs.existsSync(path.join(output,url)), `Broken local reference: ${url}`);
  }
  for (const match of html.matchAll(/href="#([^"]+)"/g)) assert(html.includes(`id="${match[1]}"`), `Broken anchor: ${match[1]}`);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
  assert.equal(new Set(ids).size, ids.length, 'Duplicate element ids');
  const cssFile = html.match(/href="(main-assets\/site-[^"]+\.css)"/)[1];
  const css = read(cssFile);
  assert(!css.includes('fonts.googleapis.com'), 'Main font must be self-hosted');
  for (const match of css.matchAll(/url\(['"]?([^)'" ]+)/g)) {
    if (match[1].startsWith('data:')) continue;
    assert(fs.existsSync(path.resolve(output, 'main-assets', match[1])), `Broken CSS asset: ${match[1]}`);
  }
  assert(!html.includes('\ufffd'), 'Broken text encoding');
  assert.equal((html.match(/<template id="project-/g)||[]).length,projects.length);
  assert.equal((html.match(/class="project-pin"/g)||[]).length,projects.length);
  const gallery = html.slice(html.indexOf('id="project-grid"'),html.indexOf('id="project-empty"'));
  assert(!/src="[^"]+\.gif"/.test(gallery), 'Animated originals belong inside modals only');
  assert.equal((gallery.match(/srcset=/g)||[]).length,projects.length);
  const originalBytes = projects.reduce((sum, project) => sum + manifest[project.asset].originalBytes, 0);
  const previewBytes = projects.reduce((sum, project) => sum + manifest[project.cover_asset].variants.at(-1).bytes, 0);
  assert(previewBytes < originalBytes * .3, 'Gallery previews must stay substantially lighter than original artwork');
  assert.equal((html.match(/<script type="application\/ld\+json">/g)||[]).length,1);
  JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  return html;
}
const cleanEnv = {...process.env};
delete cleanEnv.SITE_URL; delete cleanEnv.VERCEL_PROJECT_PRODUCTION_URL; delete cleanEnv.VERCEL_ENV;
const build = overrides => execFileSync(process.execPath,['scripts/build.mjs'],{env:{...cleanEnv,...overrides},stdio:'pipe'});
try {
  build({});
  const local = verify();
  assert(!local.includes('rel="canonical"'), 'Unconfigured build must not invent a domain');
  const first = sha(path.join(output,'index.html'));
  build({});
  assert.equal(sha(path.join(output,'index.html')),first,'Build must be deterministic');
  build({SITE_URL:'https://portfolio.example'});
  const production = verify();
  assert(production.includes('rel="canonical" href="https://portfolio.example/"'));
  assert(production.includes('property="og:image" content="https://portfolio.example/main-assets/'));
  assert(read('sitemap.xml').includes('<loc>https://portfolio.example/</loc>'));
  build({VERCEL_ENV:'preview',VERCEL_PROJECT_PRODUCTION_URL:'portfolio.example'});
  assert(verify().includes('content="noindex, nofollow"'));
  assert(read('robots.txt').includes('Disallow: /'));
  assert(!fs.existsSync(path.join(output,'sitemap.xml')));
  assert.throws(()=>build({SITE_URL:'https://portfolio.example/bad-path'}));
} finally {
  // Restore the user's actual configuration rather than leaving a test origin in output.
  execFileSync(process.execPath,['scripts/build.mjs'],{stdio:'pipe'});
}
console.log('Build checks passed: deterministic output, unchanged archives, asset/anchor integrity, project templates, metadata, production and preview settings.');
