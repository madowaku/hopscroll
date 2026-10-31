"""Build only admitted Moon Journey assets into an offline itch ZIP (never BGM)."""
from pathlib import Path
import shutil
from zipfile import ZipFile, ZIP_DEFLATED

base = Path(__file__).resolve().parent.parent
out = base / 'itch-dist' / 'moon-journey'
out.mkdir(parents=True, exist_ok=True)
files = ['moon-lab.css', 'src/core.mjs', 'src/star-run-core.mjs', 'src/moon-levels.mjs',
         'src/moon-journey-levels.mjs', 'src/moon-core.mjs', 'src/moon-lab.mjs',
         'src/moon-audio.mjs', 'src/michiru.mjs', 'assets/img/michiru-sprites.png']
shutil.copyfile(base / 'moon-journey.html', out / 'index.html')
for name in files:
    target = out / name
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(base / name, target)
credits = """HOPSCROLL — Moon Journey v0.1
Original game and character direction: madowaku.
Michiru sprite B: approved reference extraction and processing by Claude Code.
Image provenance: art/generated/michiru/PROVENANCE.md in the source repository.
Integration, stage admission, procedural scenery and verification: OpenAI Codex.
Landing audio: original procedural Web Audio synthesis; no soundtrack included.
No fonts, music or remote dependencies are downloaded at runtime.
Source: https://github.com/madowaku/hopscroll

Controls: hold Space / HOLD / playfield for FAST, release for SLOW.
Moon bridges support only released landings. Dango is optional, collected on landing.
The moon mark allows recovery. FULL MOON means clear without using recovery.
To run locally, serve this directory with a loopback-only HTTP server and open index.html.
"""
(out / 'CREDITS.txt').write_text(credits, encoding='utf-8')
(out / 'PROVENANCE.md').write_text((base / 'art/generated/michiru/PROVENANCE.md').read_text(encoding='utf-8'), encoding='utf-8')
archive = base / 'itch-dist' / 'HOPSCROLL-Moon-Journey-v0.1.zip'
# Explicit allowlist excludes stale files and unreviewed third-party music.
with ZipFile(archive, 'w', ZIP_DEFLATED) as z:
    for name in ['index.html', *files, 'CREDITS.txt', 'PROVENANCE.md']:
        z.write(out / name, name)
print(f'built {archive} ({archive.stat().st_size} bytes); root index.html, {len(files)+3} files')
