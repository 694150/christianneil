"""Optional asset preparation. Requires Pillow; deployment builds use committed files."""
from pathlib import Path
from PIL import Image
import json
import re
import shutil

ROOT = Path(__file__).resolve().parents[1]
ORIGINALS = ROOT / 'public/assets'
OUTPUT = ROOT / 'public/main-assets'
OUTPUT.mkdir(exist_ok=True)
projects = json.loads((ROOT / 'src/projects.json').read_text(encoding='utf-8'))
manifest = {}

def preview(filename, widths):
    original = ORIGINALS / filename
    image = Image.open(original).convert('RGB')  # Static gallery; original animation stays in the modal.
    variants = []
    for width in widths:
        width = min(width, image.width)
        resized = image.resize((width, round(image.height * width / image.width)), Image.Resampling.LANCZOS)
        name = f'{original.stem}-{width}.webp'
        resized.save(OUTPUT / name, 'WEBP', quality=76, method=6)
        variants.append({'file': name, 'width': width, 'height': resized.height, 'bytes': (OUTPUT / name).stat().st_size})
    manifest[filename] = {'originalBytes': original.stat().st_size, 'variants': variants}

source = (ROOT / 'src/index.html').read_text(encoding='utf-8') + (ROOT / 'src/styles/portfolio.css').read_text(encoding='utf-8')
referenced = set(re.findall(r'main-assets/([^\s\"\'\)<>]+)', source))
referenced.update(p['asset'] for p in projects)
referenced.update(['DEVICON-LICENSE.txt', 'SIMPLE-ICONS-LICENSE.md', 'skill-icons-source.txt'])
for filename in referenced:
    if (ORIGINALS / filename).is_file():
        shutil.copy2(ORIGINALS / filename, OUTPUT / filename)
for project in projects:
    preview(project['asset'], [360, 640])
for filename in ['spaltitude-menu-cover.jpg', 'project-mobile-legends-cover.jpg']:
    preview(filename, [400, 808])
# share-profile.png is a prepared 512px raster of the current colored SVG portrait.
# Keep it rather than replacing it with an older PNG portrait during thumbnail preparation.
(ROOT / 'src/asset-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
before = sum(manifest[p['asset']]['originalBytes'] for p in projects)
after = sum(manifest[p['asset']]['variants'][-1]['bytes'] for p in projects)
print(f'Gallery previews at 640px: {before:,} -> {after:,} bytes ({(1-after/before)*100:.1f}% smaller).')
