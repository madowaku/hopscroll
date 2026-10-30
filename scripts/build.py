"""Build a dependency-free, one-file HTML itch.io distribution."""
import base64
from pathlib import Path
base = Path(__file__).resolve().parent.parent
html = (base/'index.html').read_text(encoding='utf-8')
css = (base/'style.css').read_text(encoding='utf-8')
core = (base/'src/core.mjs').read_text(encoding='utf-8').replace('export ', '')
game = (base/'src/game.mjs').read_text(encoding='utf-8')
game = '\n'.join(line for line in game.splitlines() if not line.startswith('import '))
html=html.replace('<link rel="stylesheet" href="./style.css" />', f'<style>\n{css}\n</style>')
html=html.replace('<script type="module" src="./src/game.mjs"></script>', f'<script>\n{core}\n{game}\n</script>')
# Inline local media so the itch build stays a single file. The BGM is not committed (third-party license):
# drop it at assets/bgm/love-it-rabbit.mp3 locally; without it the game simply plays with SFX only.
for rel, mime in [('assets/bgm/love-it-rabbit.mp3', 'audio/mpeg'), ('assets/img/star-rabbit.png', 'image/png')]:
    src = base/rel
    if src.exists():
        html = html.replace('./'+rel, f'data:{mime};base64,'+base64.b64encode(src.read_bytes()).decode('ascii'))
    else:
        print('note: missing', rel, '(not inlined)')
out=base/'itch-dist/index.html';out.parent.mkdir(parents=True,exist_ok=True);out.write_text(html, encoding='utf-8')
print('built',out, 'bytes',out.stat().st_size)
