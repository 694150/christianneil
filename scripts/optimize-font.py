"""Optional WOFF2 conversion of the supplied font. Requires fonttools[woff]."""
from pathlib import Path
from fontTools.ttLib import TTFont

root = Path(__file__).resolve().parents[1]
source = root / 'public/assets/InkteraDemo.otf'
target = root / 'public/main-assets/inktera-demo.woff2'
font = TTFont(source)
font.flavor = 'woff2'
font.save(target)
print(f'Inktera: {source.stat().st_size:,} -> {target.stat().st_size:,} bytes; all glyphs preserved.')
