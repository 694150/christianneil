"""Render verified Behance imports into the shared portfolio source."""
from pathlib import Path
from html import escape
import json
import re

root = Path(__file__).resolve().parents[1]
work = root / 'work'
projects = json.loads((work / 'behance-projects.json').read_text(encoding='utf-8'))
labels = {'graphic-design': 'Graphic Design', 'wordpress': 'WordPress Development',
          'print-artwork': 'Print-ready Artwork', 'illustrator': 'Illustrator',
          'social-media': 'Social Media Marketing'}
source_path = work / 'portfolio-source.html'
source = source_path.read_text(encoding='utf-8')
pins = []
templates = []
for p in projects:
    title = escape(p['title'])
    preview_title = escape(p.get('preview_title', p['title'].removeprefix('Web Design: ')))
    url = 'https://www.behance.net/gallery/' + p['path']
    image = f'<img src="assets/{p["asset"]}" alt="{title} — full project presentation" width="{p["width"]}" height="{p["height"]}" decoding="async"'
    pins.append(f'''              <article class="project-card project-published" data-services="{' '.join(p['services'])}">
                <a class="project-pin" href="{url}" target="_blank" rel="noopener noreferrer" data-project-modal="project-{p['id']}" aria-haspopup="dialog" aria-controls="project-modal" aria-label="Open {title}">
                  {image} loading="lazy">
                  <span class="project-pin-title" aria-hidden="true">{preview_title}</span>
                </a>
              </article>''')
    categories = ''.join(f'<li>{labels[s]}</li>' for s in p['services'])
    facts = f'<div><dt>Deliverable</dt><dd>{escape(p["type"])}</dd></div>'
    if p.get('tool'):
        facts += f'<div><dt>Tool</dt><dd>{escape(p["tool"])}</dd></div>'
    if p['id'] == 'spaltitude':
        facts += '<div><dt>Client</dt><dd>SPAltitude by J&amp;E Massage Center</dd></div><div><dt>Typography</dt><dd>Cormorant Garamond · Source Sans 3</dd></div>'
    templates.append(f'''  <template id="project-{p['id']}">
    <div class="project-modal-layout">
      <div class="project-modal-details">
        <p class="eyebrow">{escape(p['type'].upper())}</p>
        <h2 id="project-title-{p['id']}">{title}</h2>
        <ul class="project-categories" aria-label="Services">{categories}</ul>
        <p>{escape(p['description'])}</p>
        <dl class="project-facts">{facts}</dl>
        <div class="project-modal-links"><a class="home-primary" href="{url}" target="_blank" rel="noopener noreferrer">View on Behance <span aria-hidden="true">↗</span></a></div>
      </div>
      <div class="project-modal-artwork">{image}></div>
    </div>
  </template>''')
source, n = re.subn(r'(<div class="project-grid project-masonry" id="project-grid">).*?(\n            </div>)',
                    lambda m: m[1] + '\n' + '\n'.join(pins) + m[2], source, flags=re.S)
assert n == 1
source = re.sub(r'(<p class="project-results"[^>]*>).*?(</p>)',
                rf'\g<1>{len(projects)} projects · More work coming soon\2', source)
source = source.replace('A collection in the making', f'{len(projects)} projects &amp; counting')
dialog = '''  <dialog class="project-modal" id="project-modal" aria-label="Project details">
    <div class="project-modal-bar"><span>PROJECT NOTES</span><button type="button" class="project-modal-close" id="project-modal-close" aria-label="Close project" autofocus>Close <span aria-hidden="true">×</span></button></div>
    <div id="project-modal-content"></div>
  </dialog>
'''
modals = dialog + '\n'.join(templates) + '\n'
source, n = re.subn(r'  <dialog class="project-modal".*?(?=</body>)', lambda m: modals + '\n', source, flags=re.S)
assert n == 1
(work / 'project-modal.html').write_text(modals, encoding='utf-8')

# Both homepage features open the same project details as the gallery.
home = (work / 'home-section.html').read_text(encoding='utf-8')
p = projects[1]
feature = f'''                <article class="project-card project-published">
                  <a class="project-link" href="https://www.behance.net/gallery/{p['path']}" target="_blank" rel="noopener noreferrer" data-project-modal="project-mobile-legends" aria-haspopup="dialog" aria-controls="project-modal" aria-label="Open Mobile Legends Tournament poster redesign">
                    <div class="project-preview project-artwork"><img src="assets/{p['cover_asset']}" alt="Mobile Legends tournament poster redesign" width="808" height="632" loading="lazy" decoding="async"></div>
                    <div class="project-details"><div><h4>Mobile Legends Tournament</h4><p>Event Poster Redesign</p></div><span class="project-index">02</span></div>
                    <div class="project-summary"><ul class="project-categories" aria-label="Services"><li>Graphic Design</li><li>Social Media Marketing</li></ul><span class="project-cta">View project <span aria-hidden="true">↗</span></span></div>
                  </a>
                </article>'''
home = re.sub(r'                <article class="project-card home-project-placeholder">.*?</article>', lambda m: feature, home, flags=re.S)
home = home.replace('aria-label="SPAltitude. View full project on Behance (opens in a new tab)"',
                    'data-project-modal="project-spaltitude" aria-haspopup="dialog" aria-controls="project-modal" aria-label="Open SPAltitude spa service menu project"')
home = home.replace('class="project-cta">View on Behance', 'class="project-cta">View project')
(work / 'home-section.html').write_text(home, encoding='utf-8')
start = source.index('          <section class="page" id="home"')
end = source.index('          <section class="page" id="about"', start)
source = source[:start] + home.rstrip() + '\n\n' + source[end:]
source_path.write_text(source, encoding='utf-8')
print(f'Rendered {len(projects)} projects, detail templates, and two homepage features.')
