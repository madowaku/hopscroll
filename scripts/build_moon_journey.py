"""Build only admitted Moon Journey assets into an offline itch ZIP.

The third-party BGM is excluded from public-ready builds by default. Explicit
INCLUDE_BGM=1 opt-in requires a prior license/redistribution review."""
from pathlib import Path
import shutil
import os
from zipfile import ZipFile, ZIP_DEFLATED

base = Path(__file__).resolve().parent.parent
out = base / 'itch-dist' / 'moon-journey'
out.mkdir(parents=True, exist_ok=True)
files = ['moon-lab.css', 'src/moon-sky.mjs', 'src/moon-i18n.mjs', 'src/core.mjs', 'src/star-run-core.mjs', 'src/moon-levels.mjs',
         'src/moon-journey-levels.mjs', 'src/moon-core.mjs', 'src/moon-lab.mjs',
         'src/moon-audio.mjs', 'src/michiru.mjs', 'assets/img/michiru-sprites.png',
         'assets/img/title-earthwatch.jpg', 'assets/img/earth.webp', 'assets/img/moon-bridge.webp', 'assets/img/meteor-bridge.webp']
BGM = 'assets/bgm/love-it-rabbit.mp3'
html = (base / 'moon-journey.html').read_text(encoding='utf-8')
if os.environ.get('INCLUDE_BGM') == '1' and (base / BGM).exists():
    files.append(BGM)
    html = html.replace('<body data-journey="true">', f'<body data-journey="true" data-bgm="{BGM}">')
else:
    print(f'note: third-party BGM not included; explicit INCLUDE_BGM=1 and local file required')
(out / 'index.html').write_text(html, encoding='utf-8')
for name in files:
    target = out / name
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(base / name, target)
credits = """HOPSCROLL — Moon Journey v0.5
Original game and character direction: madowaku.
Michiru sprite B: approved reference extraction and processing by Claude Code.
Image provenance: art/generated/michiru/PROVENANCE.md and art/generated/moon-journey/PROVENANCE.md in the source repository.
Title art, Earth and bridge art: generated with OpenAI native image generation via codex exec (see provenance).
Integration, stage admission, procedural scenery and verification: OpenAI Codex.
Landing audio: original procedural Web Audio synthesis.
Music (when included): "Love it Rabbit" by えだまめ88 (OpenTracks).
No fonts, music or remote dependencies are downloaded at runtime.
Source: https://github.com/madowaku/hopscroll

Controls: hold Space / HOLD / playfield for FAST, release for SLOW.
Moon bridges support only released landings. Dango is optional, collected on landing.
The moon mark allows recovery. FULL MOON means clear without using recovery.
To run locally, serve this directory with a loopback-only HTTP server and open index.html.
"""
(out / 'CREDITS.txt').write_text(credits, encoding='utf-8')
(out / 'PROVENANCE.md').write_text('\n\n'.join((base / p).read_text(encoding='utf-8') for p in
    ['art/generated/michiru/PROVENANCE.md', 'art/generated/moon-journey/PROVENANCE.md']), encoding='utf-8')
archive = base / 'itch-dist' / 'HOPSCROLL-Moon-Journey-v0.5.zip'
# Explicit allowlist excludes stale files.
with ZipFile(archive, 'w', ZIP_DEFLATED) as z:
    for name in ['index.html', *files, 'CREDITS.txt', 'PROVENANCE.md']:
        z.write(out / name, name)
print(f'built {archive} ({archive.stat().st_size} bytes); root index.html, {len(files)+3} files')
