from pathlib import Path
import zipfile
import base64

root = Path(__file__).resolve().parents[1]
dist = root / 'outputs/portfolio/dist'
# Shared editable markup lives outside generated output. Volume 2 owns index.html.
source = (root / 'work/portfolio-source.html').read_text(encoding='utf-8-sig')
old_link = '<span class="edition">VOL. 01 / 2026</span>'
v1_link = '<a class="edition version-link" href="v2.html" aria-label="Version 1, 2026. Open Version 2: Neobrutalism" title="Explore Version 2 — Neobrutalism">VOL. 01 / 2026</a>'
assert old_link in source or v1_link in source, 'Expected original version label'
v1 = source.replace(old_link, v1_link)
main_link = v1_link.replace('href="v2.html"', 'href="index.html"')
v1 = v1.replace(v1_link, main_link)
link_style = '\n/* The original edition links to the separate Version 2. */\n.version-link{display:inline-flex;align-items:center;min-height:44px;text-decoration:underline;text-underline-offset:4px;text-decoration-color:#9ba58a;white-space:nowrap}.version-link:hover{color:#445137;text-decoration-color:currentColor}\n'
original_css = (dist / 'styles.css').read_text(encoding='utf-8-sig')
if 'The original edition links' not in original_css:
    (dist / 'styles.css').write_text(original_css + link_style, encoding='utf-8')
v1_css = (dist / 'styles.css').read_text(encoding='utf-8')
circle_css = (root / 'work/circular-portraits.css').read_text(encoding='utf-8')
contact_css = (root / 'work/contact-styles.css').read_text(encoding='utf-8')
about_placeholder_css = (root / 'work/about-placeholder.css').read_text(encoding='utf-8')
resume_css = (root / 'work/resume-styles.css').read_text(encoding='utf-8')
resume_content_css = (root / 'work/resume-content.css').read_text(encoding='utf-8')
focus_css = (root / 'work/focus-styles.css').read_text(encoding='utf-8')
sidebar_footer_css = (root / 'work/sidebar-footer.css').read_text(encoding='utf-8')
project_content_css = (root / 'work/project-content.css').read_text(encoding='utf-8')
home_css = (root / 'work/home-styles.css').read_text(encoding='utf-8')
gallery_css = (root / 'work/project-gallery.css').read_text(encoding='utf-8')
cursor_css = (root / 'work/pixel-cursors.css').read_text(encoding='utf-8')
section_graphics_css = (root / 'work/section-graphics.css').read_text(encoding='utf-8')
circle_marker = '/* Upright, generous circular portraits in both editions. */'
original_css = original_css.split(circle_marker)[0].rstrip() + '\n'
v1_css = v1_css.split(circle_marker)[0].rstrip() + '\n' + circle_css
v1_css += '\n' + contact_css
v1_css += '\n' + about_placeholder_css
v1_css += '\n' + resume_css
v1_css += '\n' + resume_content_css
v1_css += '\n' + focus_css
v1_css += '\n' + sidebar_footer_css
v1_css += '\n' + project_content_css
v1_css += '\n' + home_css
v1_css += '\n' + gallery_css
v1_css += '\n' + cursor_css
v1_css += '\n' + section_graphics_css
(dist / 'styles.css').write_text(v1_css, encoding='utf-8')
v2 = v1.replace(main_link, '<a class="edition" href="v1.html" aria-label="Version 2, 2026. Return to Version 1: Original" title="Return to Version 1 — Original">VOL. 02 / 2026<small>VIEW ORIGINAL</small></a>')
v2 = v2.replace('href="styles.css"', 'href="v2.css"').replace('src="app.js"', 'src="v2.js"')
v2 = v2.replace('— Creative Workspace</title>', '— Volume 02 · Neobrutalism</title>')
v2 = v2.replace('Neil’s Workspace — Estabillo, Christian Neil</title>', 'Neil’s Workspace — Volume 02 · Neobrutalism</title>')
v2 = v2.replace('content="#ecebe5"', 'content="#ffd84b"')
v2 = v2.replace('a little corner of the internet', 'creative workspace / edition 02')
v2 = v2.replace('A LITTLE INTRODUCTION', 'VOL. 02 / A FRESH PERSPECTIVE')
v2 = v2.replace("fill='%23e4e8cf'", "fill='%23ffd84b'").replace("fill='%233c4431'", "fill='%23171717'").replace("rx='16'", "rx='0'")
v2_css = original_css + '\n' + (root / 'work/neobrutalism.css').read_text(encoding='utf-8')
v2_css += '\n' + (root / 'work/portrait-neo.css').read_text(encoding='utf-8')
v2_css += '\n' + circle_css
v2_css += '\n' + contact_css
v2_css += '\n' + about_placeholder_css
v2_css += '\n' + resume_css
v2_css += '\n' + (root / 'work/resume-neo.css').read_text(encoding='utf-8')
v2_css += '\n' + resume_content_css
v2_css += '\n' + (root / 'work/resume-content-neo.css').read_text(encoding='utf-8')
v2_css += '\n' + (root / 'work/contact-neo.css').read_text(encoding='utf-8')
v2_css += '\n' + (root / 'work/v2-headings.css').read_text(encoding='utf-8')
v2_css += '\n' + focus_css
v2_css += '\n' + sidebar_footer_css
v2_css += '\n' + project_content_css
v2_css += '\n' + (root / 'work/project-content-neo.css').read_text(encoding='utf-8')
v2_css += '\n' + home_css
v2_css += '\n' + (root / 'work/home-neo.css').read_text(encoding='utf-8')
v2_css += '\n' + gallery_css
v2_css += '\n' + (root / 'work/project-gallery-neo.css').read_text(encoding='utf-8')
v2_css += '\n' + cursor_css
v2_css += '\n' + section_graphics_css
js = (dist / 'app.js').read_text(encoding='utf-8')
(dist / 'index.html').write_text(v2, encoding='utf-8')
(dist / 'v1.html').write_text(v1, encoding='utf-8')
# Keep the previous Volume 2 URL working for existing links.
(dist / 'v2.html').write_text(v2, encoding='utf-8')
(dist / 'v2.css').write_text(v2_css, encoding='utf-8')
(dist / 'v2.js').write_text(js, encoding='utf-8')

def standalone(html, css, script, css_name, js_name):
    for pdf in (dist / 'downloads').glob('*.pdf'):
        uri = 'data:application/pdf;base64,' + base64.b64encode(pdf.read_bytes()).decode('ascii')
        html = html.replace(f'href="downloads/{pdf.name}"', f'href="{uri}"')
    for font in (dist / 'assets').glob('*.otf'):
        uri = 'data:font/otf;base64,' + base64.b64encode(font.read_bytes()).decode('ascii')
        css = css.replace(f"url('assets/{font.name}')", f"url('{uri}')")
    for asset in (dist / 'assets').iterdir():
        mime = {'.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif'}.get(asset.suffix.lower())
        if mime is None:
            continue
        uri = f'data:{mime};base64,' + base64.b64encode(asset.read_bytes()).decode('ascii')
        html = html.replace(f'src="assets/{asset.name}"', f'src="{uri}"')
        css = css.replace(f"url('assets/{asset.name}')", f"url('{uri}')")
    return html.replace(f'<link rel="stylesheet" href="{css_name}">', f'<style>{css}</style>').replace(f'<script defer src="{js_name}"></script>', '').replace('</body>', f'<script>{script}</script></body>')

local_v1 = standalone(v1, v1_css, js, 'styles.css', 'app.js').replace('href="index.html"', 'href="christian-portfolio.html"')
local_v2 = standalone(v2, v2_css, js, 'v2.css', 'v2.js').replace('href="v1.html"', 'href="christian-portfolio-v1.html"')
(root / 'outputs/christian-portfolio.html').write_text(local_v2, encoding='utf-8')
(root / 'outputs/christian-portfolio-v1.html').write_text(local_v1, encoding='utf-8')
(root / 'outputs/christian-portfolio-v2.html').write_text(local_v2, encoding='utf-8')
with zipfile.ZipFile(root / 'outputs/christian-portfolio-source.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
    for file in sorted(dist.rglob('*')):
        if file.is_file(): archive.write(file, file.relative_to(dist).as_posix())
print('Volume 2 is index.html; original edition is v1.html. Rebuilt standalone editions and source archive.')
