from pathlib import Path
import shutil
import struct

root = Path(__file__).resolve().parents[1]
dist = root / 'outputs/portfolio/dist'
source = root.parent / 'cartoon-transform-this-attached-photo-into/outputs'
assets = dist / 'assets'
assets.mkdir(exist_ok=True)
for subject in ('selfie', 'cafe'):
    original = source / f'neo-brutalist-{subject}-transparent.png'
    target = assets / f'christian-{subject}.png'
    shutil.copy2(original, target)
    width, height = struct.unpack('>II', target.read_bytes()[16:24])
    print(f'{target.name}: {width} x {height}; original image preserved')

html_path = dist / 'index.html'
html = html_path.read_text(encoding='utf-8')
for variant in ('intro', 'profile'):
    before = f'<div class="avatar {variant}-avatar" role="img" aria-label="Portrait placeholder: Estabillo, Christian Neil"><span>cn.</span><small>PHOTO COMING SOON</small></div>'
    after = f'<div class="avatar {variant}-avatar portrait-avatar"><img src="assets/christian-selfie.png" alt="Illustrated portrait of Estabillo, Christian Neil" width="1254" height="1254" decoding="async" fetchpriority="high"></div>'
    assert before in html
    html = html.replace(before, after)
html = html.replace('<p>Graphic Artist &amp; WordPress Developer</p>', '<p class="intro-roles">Graphic Artist · WordPress Developer · Gamer</p>')
html = html.replace('Opening my creative workspace', 'Loading my creative world')
html = html.replace('WordPress Developer</p><p class="bio">', 'WordPress Developer<span class="gamer-label">Gamer at heart</span></p><p class="bio">')
html = html.replace('A little space for my design work, websites, and the ideas in between.', 'Designing visuals, building websites, and finding time for the next game.')
start = html.index('          <section class="page" id="about"')
end = html.index('          <section class="page" id="contact"', start)
about = '''          <section class="page" id="about" aria-labelledby="about-title">
            <div class="page-meta"><span><svg><use href="#i-user"/></svg>WORKSPACE / ABOUT</span><span>03 — 04</span></div>
            <div class="page-heading"><div><p class="eyebrow">BEHIND THE WORK</p><h2 id="about-title">A little <em>about me.</em></h2></div></div>
            <p class="page-description">Graphic Artist. WordPress Developer. Gamer at heart.</p>
            <div class="about-story">
              <figure class="cafe-portrait"><div class="cafe-crop"><img src="assets/christian-cafe.png" alt="Illustration of Christian Neil at a café with an iced coffee" width="1079" height="1448" decoding="async"></div><figcaption>A LITTLE LIFE BEYOND THE SCREEN</figcaption></figure>
              <div class="about-copy"><p class="eyebrow">DESIGN / DEVELOP / PLAY</p><h3>Creative by trade.<br><em>Gamer at heart.</em></h3><p>I’m Christian Neil, a Graphic Artist and WordPress Developer.</p><p>When I’m not designing graphics or building WordPress websites, you’ll find me gaming—whether it’s a competitive match, an MMORPG, or a console game.</p><span class="about-signature">Estabillo, Christian Neil</span></div>
            </div>
            <section class="gaming-card" aria-labelledby="gaming-title"><div class="gaming-heading"><span class="gaming-icon" aria-hidden="true">✚</span><div><p class="eyebrow">OFF-DUTY / IN-GAME</p><h3 id="gaming-title">What I play.</h3></div></div><ul class="game-tags" aria-label="Games and gaming interests"><li>Valorant</li><li>League of Legends</li><li>Teamfight Tactics</li><li>Mobile Legends</li><li>MMORPGs</li><li>Console games</li></ul></section>
          </section>
'''
about = about.replace('id="about" aria-', 'id="about" hidden aria-')
html = html[:start] + about + html[end:]
html_path.write_text(html, encoding='utf-8')
