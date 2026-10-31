# HOPSCROLL Moon Journey generated art provenance

Date: 2026-10-31 (requested asset date).

Tool: OpenAI built-in `image_gen.imagegen` (exposed as `image_gen__imagegen`). Model: not disclosed by the tool; no model identifier was returned. Native image generation, not API/CLI fallback.

The tool automatically cached originals under its managed generated_images directory. All explicit project writes were confined to art/generated/moon-journey/. No source code was edited and no Git commands were run. No background removal, color-keying or alpha reconstruction was performed. Transparent assets were generated with native alpha, then resized preserving that alpha.

## References

- `art/generated/michiru/michiru-sheet.png`: canonical Michiru identity, attached in the request and explicitly supplied as an image path during the title identity correction.
- Owner title concept (`concept-title.png`): owner-provided concept images, style reference only (mood, palette, luminous painted anime). Supplied in conversation; no layout, text, logo or buttons copied.
- Owner gameplay concept (`concept-play.png`): owner-provided concept images, style reference only (moonlight crystal bridge, hanging crescents, Earth). Supplied in conversation; no other elements copied.
- Initial generation calls used the reference descriptions and attached conversation context; no explicit image-path reference argument was used for those calls. Edit calls explicitly referenced the generated asset being revised; the first title edit additionally supplied the canonical sheet.

## title-earthwatch.png

Pillow LANCZOS resize from 943 x 1667 to 1088 x 1920. Full image retained, no crop. Bridge aspect ratio changed from 3:1 to 4:1; title aspect adjusted slightly to the requested 1088 x 1920.

### Prompt

Use case: illustration-story. Generate title key art for HOPSCROLL Moon Journey, portrait 9:16 ideally 1088x1920. Use the attached canonical Michiru character sheet as identity reference; owner-provided title concept for mood, palette and luminous painted anime style ONLY; owner-provided gameplay concept for Earth style ONLY. Do not copy their layouts. NO TEXT, letters, logos, buttons, UI, watermark or signature. Michiru sits on the edge of the Moon surface watching the Earth, lower-middle third, three-quarter view slightly behind and to her side, face partly visible, looking upward with gentle smile. EXACT identity: moon-rabbit girl 2.5-3 heads tall, silver-white/pale-lilac bob hair, large dark-brown eyes, rosy cheeks, two long white pink-inner rabbit ears, HER LEFT ear clearly folded/drooping at tip and other upright; white-lilac SHORT coat with wide sleeves and navy #243052 lining, thin gold sash, white boots. Holds one skewer with exactly three dango pink, white, green, all visible. Large beautiful Earth upper-right BETWEEN y=29% and y=54%, deep blue oceans, white swirling clouds, natural green-brown continents, thin blue atmosphere rim, partial night side with warm golden city lights. Michiru between y=52% and y=77%, no important detail below y=78%. Pale lilac-grey regolith, small craters, a few glowing pale-blue moon flowers and silver grass at her feet, Earth rim lighting. Deep navy #0d1630 to violet sky, dense small restrained stars, one shooting star, faint nebula. TOP 28% calm unobstructed sky for later logo: no Earth or large bright features in this band. BOTTOM 22% calm darker moon ground, no important detail for later buttons. Luminous soft painted anime, gentle glow, limited navy violet lilac pale gold Earth blue palette, not photorealistic. No floating ruins or buildings.

### Revision prompt

Revise this title art to match the CANONICAL CHARACTER SHEET exactly. First image is title art edit target, second is canonical identity. Replace the girl with the tiny chibi from second image: only 2.5 heads tall, oversized round head, very short legs and body, simple short white lilac coat, solid navy lining, THIN plain gold sash, simple white ankle boots, no embroidery or added ornament. Silver lilac BOB hair, large DARK BROWN eyes, rosy cheeks, HER LEFT rabbit ear folded tip, other upright. Seated in same slightly rear three-quarter view, face partly seen smiling toward Earth, holding pink white green three-dango skewer. Fit ENTIRE character including ears between 46% and 76% canvas height. Reduce Earth to fit fully within upper-right between 29% and 55% height with small right margin. Keep TOP 28% calm dark sky, BOTTOM 22% smooth DARK moon regolith with virtually no craters, plants or prominent texture. Moon flowers and silver grass only next to character above bottom band. Luminous soft PAINTED ANIME, not realistic, match simplified canonical design. No text letters logos UI signatures watermark. Portrait 1088x1920 or nearest 9:16.

### Revision prompt

Edit this title image only to refine overlay-safe composition. Preserve exactly this chibi Michiru identity, folded ear, pose, three-color dango, painted colors and Earth. Move and scale Michiru and flowers slightly UP so lowest boot, clothing and ALL flowers and grass end above y=76% canvas height. Make bottom 24% completely calm smooth darker lilac-grey ground, no important objects, plants or prominent craters. Move and scale Earth slightly left so full round Earth and thin blue halo fit inside right boundary with 4% margin. Top 28% calm sky must remain empty of Earth or character; reduce bright nebula in top 28%. Keep one shooting star below top band. Character face looks gently upward toward Earth, not viewer. No text logo UI signature watermark. Keep portrait 9:16.

## moon-bridge.png

Pillow LANCZOS resize from 2172 x 724 to 1536 x 384. Full image retained, no crop. Bridge aspect ratio changed from 3:1 to 4:1; title aspect adjusted slightly to the requested 1088 x 1920.

### Prompt

Use case: stylized-concept. Game platform asset moon-bridge.png. Wide landscape 1536x384 or closest supported wide ratio. Native genuinely TRANSPARENT background with real alpha channel, no background color, no painted checkerboard, no scenery or shadow plane. Single floating slab of translucent pale-lilac moonlight crystal, strict SIDE elevation, PERFECTLY STRAIGHT FLAT HORIZONTAL top edge with thin bright rim. Thin slab about 15% of total image height, in upper portion y=20%-35%. Build as 3-slice: left 20% end cap, middle 60% absolutely plain uniform horizontally repeatable band with NO unique features, cracks, sparkles, facets, beads or pendants; right 20% end cap. Center has only a vertically graded uniform lilac crystal cross section with constant horizontal rim, identical at every horizontal position. Small crescent moons and pearl beads hang on SHORT delicate chains ONLY under end caps, within canvas. Ends have subtle crystalline faceting. Leave transparent margin around entire silhouette and soft glow. Owner-provided gameplay concept is style reference ONLY for translucent lilac bridge and hanging crescents, do not reproduce its shape or composition. Luminous soft painted anime, pale lilac white moonlight, crisp silhouette, modest soft glow. NO text letters logos watermark signature UI. No curved top, perspective, tilted top, scenery or extra platforms.

### Revision prompt

Edit this moon bridge asset. Retain real native transparent alpha background and lilac color, straight horizontal glowing top and the two decorated end caps with hanging crescents and pearls. CRITICAL: replace entire middle 60% (x20%-80%) with a COMPLETELY UNIFORM featureless pale-lilac translucent crystal band, strictly identical at every x column, no grain, mottling, cloud texture, highlights, chips, cracks, glitter, facets, beads or pendants in that central region. Only a smooth vertical gradient is allowed, top and bottom lines perfectly horizontal and parallel. This center must tile seamlessly horizontally. Slab thickness about 15% of canvas height. Place slab top at y=20% in upper part. Left and right 20% retain decorative end caps only. Native transparency with soft alpha glow around silhouette; no opaque background or checkerboard. Wide 4:1, ideally 1536x384. No text UI letters watermarks.

## meteor-bridge.png

Pillow LANCZOS resize from 2172 x 724 to 1536 x 384. Full image retained, no crop. Bridge aspect ratio changed from 3:1 to 4:1; title aspect adjusted slightly to the requested 1088 x 1920.

### Prompt

Use case: stylized-concept. Generate meteor-bridge.png game platform, wide landscape 1536x384 or closest supported. Native genuinely TRANSPARENT background REAL alpha, no background color, no painted checkerboard, no scenery, no shadow plane. One fallen shooting star transformed into a warm GOLD-WHITE flat glowing slab, strict side elevation. PERFECTLY STRAIGHT FLAT HORIZONTAL top edge with thin bright rim; thin slab about 15% canvas height, upper portion y=20%-35%. THREE SLICE layout: left 20% end cap with comet-like streaks trailing off toward LEFT only, middle 60% completely plain uniform horizontally repeatable band with constant gold-white rim and uniform vertical gold gradient, no unique features, cracks, streaks or sparkles in middle. Right 20% neat end cap. Small gold sparkles along bottom at END CAPS only. Leave margins and contain left comet tails within canvas. Luminous soft painted anime, gold and white only, crisp silhouette with modest glow. Clearly distinct from lilac moonlight crystal. No crescent pendants. No curved top, tilted top, perspective, text, letters, logos, UI, watermark or signature.

### Revision prompt

Edit this golden meteor bridge asset. Keep native transparent alpha background, gold-white palette, left-only comet trails and decorated end caps. Replace entire middle 60% (x20%-80%) with COMPLETELY UNIFORM featureless gold-white band, identical at each horizontal coordinate: NO grain, texture, particles, cracks, facets or mottling. Only smooth vertical gradient permitted. Center must tile horizontally without seams. Thin slab around 15% canvas height. Move slab UP so perfectly straight flat horizontal top edge is at y=20%, bottom around y=35%. End caps occupy only outer 20% each, left comet trails contained in canvas, small gold sparkles underneath end caps only. Make glow restrained and local to silhouette; rest of canvas entirely alpha zero, NOT black paint. Native genuine transparent output, no opaque background, no painted checkerboard. Wide 4:1 ideally 1536x384. No text UI letters watermarks.

## earth.png

Native RGBA output 1254 x 1254 resized with Pillow LANCZOS to 840 x 840, then centered at (92, 92) on a 1024 x 1024 transparent canvas. Original generated alpha retained without masking; added outer margin only.

### Prompt

Use case: stylized-concept. earth.png standalone game art, square 1024x1024. A single beautiful EARTH, geometrically PERFECT CIRCLE centered at (50%,50%) diameter 78% of canvas with generous transparent margin including halo. Blue oceans, white swirling clouds, natural green-brown recognizable continents, thin glowing blue atmosphere halo. RIGHT THIRD of globe in night shadow with warm golden city lights; left two-thirds blue daylight. Luminous soft painted anime illustration matching owner-provided concept images, style reference only, not photographic. Native genuinely TRANSPARENT background, actual alpha channel, all space outside thin atmosphere halo completely transparent. NO stars, scenery, background color, checkerboard pattern, text, letters, logos, watermark, signature or UI.

## Verified outputs (Pillow)

| File | Pixels | Mode | Alpha range | Fully transparent pixels (alpha 0) | Pixels with alpha below 255 |
| --- | --- | --- | --- | --- | --- |
| title-earthwatch.png | 1088 x 1920 | RGB | No alpha | 0 | 0 |
| moon-bridge.png | 1536 x 384 | RGBA | 0-254 | 390927 | 589824 |
| meteor-bridge.png | 1536 x 384 | RGBA | 0-255 | 400198 | 589648 |
| earth.png | 1024 x 1024 | RGBA | 0-254 | 527468 | 1048576 |

## Visual review and limitations

All four final saved images were opened and visually inspected. No visible text, UI, logo, signature or watermark. Native transparent pixels verified in both bridge originals and Earth original as well as final files. Alpha maxima below 255 in moon-bridge and Earth are properties of the generated/resampled alpha, not an opaque background.

- Title: recognizable canonical chibi identity, folded ear, bob hair, brown eyes, navy sleeve lining, thin gold sash, boots and pink/white/green dango. Three-quarter seated pose watching Earth, moon flowers and silver grass. Top approximately 28% is sky and bottom approximately 22% is darker ground; these boundaries are approximate: a shooting star/nebula appears within the upper band, and a few grass tips reach into the upper edge of the lower band. Not an exactly measured clear overlay mask. Earth and character remain the main middle-region subjects.
- Moon bridge: flat horizontal top, thin lilac crystal band, end-cap crescent/pearl chains and a mostly plain center. Some subtle painted variation and alpha-glow variation remain; exact seamless horizontal tiling was not achieved or certified.
- Meteor bridge: flat horizontal gold-white band with left comet trails and lower sparkles. End decorations extend beyond the requested 20% cap boundaries (especially left, approximately 28%), so the full central 60% is NOT strictly featureless. Plain stretchable center is visually closer to x=30%-78%. Exact requested 20/60/20 seamless 3-slice specification is not fully met; no code-based repainting was used to conceal this.
- Earth: centered circular globe, blue atmosphere, clouds and recognizable continents, right-side night shadow and city lights, transparent margin. Glow edge retains slight generated irregularity. Rendering is more detailed/realistic than the soft character painting.

No project documentation/code discrepancy was encountered in the limited provenance read; repository code and Git were not inspected, as requested.


## Game assets derived from these files (Claude Code, 2026-10-31)

`scripts/make_moon_art.py` shrinks the originals above into `assets/img/`, using Pillow LANCZOS. It does not repaint or remove any background.

| Asset | Source | Processing |
| --- | --- | --- |
| title-earthwatch.jpg | title-earthwatch.png | resized to 720 px wide, JPEG q84 |
| earth.webp | earth.png | cropped to alpha > 8, resized to 384 px wide, WebP q86 with alpha |
| moon-bridge.webp | moon-bridge.png | cropped to alpha > 8, resized to 768 px wide, WebP q88 with alpha |
| meteor-bridge.webp | meteor-bridge.png | cropped to alpha > 8, resized to 768 px wide, WebP q88 with alpha |

In the game, the bridges are drawn as 3-slice images. The cut positions are in `SLICE` in `src/moon-sky.mjs`. The code-drawn versions remain as the fallback when an image does not load.
