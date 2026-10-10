from pathlib import Path
import json, urllib.request, concurrent.futures

root = Path(__file__).resolve().parents[1]
manifest = root / 'work/behance-projects.json'
projects = json.loads(manifest.read_text(encoding='utf-8'))
assets = root / 'outputs/portfolio/dist/assets'

def download(project):
    url = 'https://mir-s3-cdn-cf.behance.net/project_modules/' + project['image']
    def save(url, stem):
        existing = list(assets.glob(stem + '.*'))
        if existing:
            return existing[0].name
        request = urllib.request.Request(url, headers={'User-Agent':'Mozilla/5.0'})
        data = urllib.request.urlopen(request, timeout=45).read()
        if data[:4] == b'RIFF' and data[8:12] == b'WEBP': ext = '.webp'
        elif data[:3] == b'GIF': ext = '.gif'
        elif data[:3] == b'\xff\xd8\xff': ext = '.jpg'
        elif data[:8] == b'\x89PNG\r\n\x1a\n': ext = '.png'
        else: raise ValueError('Unexpected image format: ' + url)
        dest = assets / (stem + ext)
        dest.write_bytes(data)
        return dest.name
    if project['id'] == 'spaltitude':
        project['asset'] = 'spaltitude-menu-full.webp'
    else:
        project['asset'] = save(url, 'project-' + project['id'])
    if project.get('cover'):
        project['cover_asset'] = save(project['cover'], 'project-' + project['id'] + '-cover')
    return project

with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    projects = list(pool.map(download, projects))
manifest.write_text(json.dumps(projects, indent=2, ensure_ascii=False)+'\n', encoding='utf-8')
print('Downloaded and verified original artwork for', len(projects), 'projects.')
