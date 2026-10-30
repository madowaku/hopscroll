"""Build a dependency-free, one-file HTML itch.io distribution."""
from pathlib import Path
base = Path(__file__).resolve().parent.parent
html = (base/'index.html').read_text(encoding='utf-8')
css = (base/'style.css').read_text(encoding='utf-8')
core = (base/'src/core.mjs').read_text(encoding='utf-8').replace('export ', '')
game = (base/'src/game.mjs').read_text(encoding='utf-8')
game = '\n'.join(line for line in game.splitlines() if not line.startswith('import '))
html=html.replace('<link rel="stylesheet" href="./style.css" />', f'<style>\n{css}\n</style>')
html=html.replace('<script type="module" src="./src/game.mjs"></script>', f'<script>\n{core}\n{game}\n</script>')
out=base/'itch-dist/index.html';out.parent.mkdir(parents=True,exist_ok=True);out.write_text(html, encoding='utf-8')
print('built',out, 'bytes',out.stat().st_size)
