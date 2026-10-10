import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const hash = bytes => createHash('sha256').update(bytes).digest('hex').slice(0, 12);
const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));
const projects = JSON.parse(read('src/projects.json'));
const manifest = JSON.parse(read('src/asset-manifest.json'));
const labels = {'graphic-design':'Graphic Design', wordpress:'Website Design', 'print-artwork':'Print-ready Artwork', illustrator:'Illustration', 'social-media':'Social Media Design'};
const source = read('src/index.html');
const output = path.join(root, 'outputs/portfolio/dist');

// Validate configuration before changing any output. Never invent a production domain.
const configuredUrl = process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '');
let siteUrl = '';
if (configuredUrl) {
  const url = new URL(configuredUrl);
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('SITE_URL must be an HTTPS origin, e.g. https://your-domain.com');
  }
  siteUrl = url.origin;
}
const preview = process.env.VERCEL_ENV === 'preview';
const usedIds = new Set();
for (const project of projects) {
  if (!/^[a-z0-9-]+$/.test(project.id) || usedIds.has(project.id)) throw new Error(`Invalid or duplicate project id: ${project.id}`);
  usedIds.add(project.id);
  if (!project.url.startsWith('https://www.behance.net/gallery/')) throw new Error(`Missing project-specific source: ${project.id}`);
  if (!manifest[project.asset] || project.services.some(service => !labels[service])) throw new Error(`Incomplete project metadata: ${project.id}`);
}

const assetFiles = fs.readdirSync(path.join(root, 'public/main-assets'));
const assets = new Map(assetFiles.map(name => {
  const bytes = fs.readFileSync(path.join(root, 'public/main-assets', name));
  const ext = path.extname(name);
  return [name, {bytes, url:`main-assets/${path.basename(name, ext)}-${hash(bytes)}${ext}`}];
}));
const usedAssets = new Set();
function asset(name) {
  const entry = assets.get(name);
  if (!entry) throw new Error(`Missing main asset: ${name}`);
  usedAssets.add(name);
  return entry.url;
}
function replaceAssetUrls(text) {
  return text.replace(/main-assets\/([^\s"'()<>,]+)/g, (_, name) => asset(name));
}

function cards() {
  return projects.map(project => {
    const variants = manifest[project.asset].variants;
    const largest = variants.at(-1);
    const srcset = variants.map(v => `${asset(v.file)} ${v.width}w`).join(', ');
    return `<article class="project-card project-published" data-services="${project.services.join(' ')}">
      <a class="project-pin" href="${escape(project.url)}" target="_blank" rel="noopener noreferrer" data-project-modal="project-${project.id}" aria-haspopup="dialog" aria-controls="project-modal" aria-label="Open ${escape(project.title)}">
        <img src="${asset(largest.file)}" srcset="${srcset}" sizes="(max-width: 760px) calc(100vw - 60px), (max-width: 1150px) 55vw, 30vw" width="${largest.width}" height="${largest.height}" alt="${escape(project.alt)}" loading="lazy" decoding="async">
        <span class="project-pin-title" aria-hidden="true">${escape(project.preview_title)}</span>
      </a>
    </article>`;
  }).join('\n');
}
function templates() {
  return projects.map(project => `<template id="project-${project.id}">
    <div class="project-modal-layout">
      <div class="project-modal-details">
        <p class="eyebrow">${escape(project.type)}</p>
        <h2 id="project-title-${project.id}">${escape(project.title)}</h2>
        <ul class="project-categories" aria-label="Design categories">${project.services.map(service => `<li>${labels[service]}</li>`).join('')}</ul>
        <p>${escape(project.description)}</p>
        <p>${escape(project.details)}</p>
        <dl class="project-facts"><div><dt>Scope shown</dt><dd>${escape(project.scope)}</dd></div>${project.tool ? `<div><dt>Tool</dt><dd>${escape(project.tool)}</dd></div>` : ''}</dl>
        <div class="project-modal-links"><a class="home-primary" href="${escape(project.url)}" target="_blank" rel="noopener noreferrer">View on Behance <span aria-hidden="true">↗</span></a></div>
      </div>
      <div class="project-modal-artwork"><img src="${asset(project.asset)}" alt="${escape(project.alt)}" width="${project.width}" height="${project.height}" decoding="async"></div>
    </div>
  </template>`).join('\n');
}

const title = 'Neil Estabillo | Graphic Artist & Website Developer';
const description = 'Explore Neil Estabillo’s graphic design, website layouts, and print artwork. Based in Cavite, Philippines, with experience in web development and print production.';
const shareImage = `${siteUrl}/${asset('share-profile.png')}`;
const metadata = `<meta name="description" content="${escape(description)}">
  <meta name="author" content="Christian Neil Estabillo">
  <meta name="robots" content="${preview ? 'noindex, nofollow' : 'index, follow'}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="en_PH">
  <meta property="og:site_name" content="Neil’s Workspace">
  <meta property="og:title" content="${escape(title)}">
  <meta property="og:description" content="${escape(description)}">
  <meta property="og:image" content="${shareImage}">
  <meta property="og:image:width" content="512">
  <meta property="og:image:height" content="512">
  <meta property="og:image:alt" content="Illustrated portrait of Neil Estabillo">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${escape(title)}">
  <meta name="twitter:description" content="${escape(description)}">
  <meta name="twitter:image" content="${shareImage}">
  ${siteUrl ? `<link rel="canonical" href="${siteUrl}/"><meta property="og:url" content="${siteUrl}/">` : '<!-- Set SITE_URL when the production domain is chosen. -->'}
  <link rel="preload" href="${asset('dm-sans-normal.woff2')}" as="font" type="font/woff2" crossorigin>
  <script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@type':'Person',name:'Christian Neil Estabillo',alternateName:'Neil Estabillo',jobTitle:'Graphic Artist and Website Developer',...(siteUrl ? {url:`${siteUrl}/`} : {}),sameAs:['https://www.behance.net/chrstnneil','https://www.linkedin.com/in/neil-estabillo','https://github.com/694150','https://www.upwork.com/freelancers/~01d293e77e52bf5eac']}).replace(/</g, '\\u003c')}</script>`;
const css = replaceAssetUrls(['fonts.css', 'portfolio.css', 'mobile.css'].map(name => read(`src/styles/${name}`)).join('\n'));
const js = read('src/app.js');
const cssName = `main-assets/site-${hash(css)}.css`;
const jsName = `main-assets/site-${hash(js)}.js`;
// Resolve source asset references before inserting already-resolved project markup.
let html = replaceAssetUrls(source).replace('{{STYLESHEET}}', cssName).replace('{{SCRIPT}}', jsName)
  .replace('{{METADATA}}', metadata).replace('{{PROJECT_CARDS}}', cards()).replace('{{PROJECT_TEMPLATES}}', templates());
html = html.replace(/18 projects/g, `${projects.length} projects`);
if (/\{\{[A-Z_]+\}\}/.test(html)) throw new Error('Unresolved template token');

// Only this known, generated output directory may be cleaned; sources and legacy snapshots are elsewhere.
if (path.relative(root, output).replaceAll('\\', '/') !== 'outputs/portfolio/dist') throw new Error('Unsafe output path');
fs.rmSync(output, {recursive:true, force:true});
fs.mkdirSync(output, {recursive:true});
for (const name of fs.readdirSync(path.join(root, 'public'))) {
  if (name !== 'main-assets') fs.cpSync(path.join(root, 'public', name), path.join(output, name), {recursive:true});
}
fs.mkdirSync(path.join(output, 'main-assets'));
for (const [name, {bytes,url}] of assets) {
  if (usedAssets.has(name) || /LICENSE|OFL|source\.txt/.test(name)) fs.writeFileSync(path.join(output, url), bytes);
}
fs.writeFileSync(path.join(output, cssName), css);
fs.writeFileSync(path.join(output, jsName), js);
fs.writeFileSync(path.join(output, 'index.html'), html);
fs.writeFileSync(path.join(output, 'robots.txt'), preview ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\nAllow: /\n${siteUrl ? `Sitemap: ${siteUrl}/sitemap.xml\n` : ''}`);
if (siteUrl && !preview) fs.writeFileSync(path.join(output, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${escape(siteUrl)}/</loc></url></urlset>\n`);
console.log(`Built index.html with ${projects.length} projects. Legacy editions copied unchanged.${siteUrl ? ` Canonical: ${siteUrl}/` : ' SITE_URL is unset; canonical URL omitted.'}`);
