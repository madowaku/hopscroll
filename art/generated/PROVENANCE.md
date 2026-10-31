# HOPSCROLL generated art provenance

Date: 2026-10-30 (requested asset date).

Tool: OpenAI built-in `image_gen.imagegen` (exposed as `image_gen__imagegen`). Model: not disclosed by the tool; no model identifier was returned. Generated with native image generation, not the API/CLI fallback.

The tool automatically cached original outputs under its managed generated_images directory. All project writes were confined to art/generated/. No source code was edited and no Git commands were run.

## cover-630x500.png

Referenced the initial standalone rabbit image. Pillow ImageOps.fit with LANCZOS to exactly 630x500.

### Prompt

Use case: illustration-story. Create a landscape game cover for HOPSCROLL, aspect ratio 630:500, ideally 1260x1000. NO TEXT. Use the preceding rabbit image as character identity reference, simplifying its shading to clean flat vector-like 2D shapes. A tiny star-rabbit hops across a meteor lane in the night sky. White/pale cream chunky round rabbit, two long pink-inner ears streaming backward with speed, tiny pale-gold five-pointed STAR tail, small dark oval eyes, pink cheeks, tiny nose, faint blue-white rim glow, no clothes/accessories. Rabbit mid-hop on LEFT THIRD, facing and leaning right, white-blue stardust trail behind. Below: floating FLAT strips of pale glowing blue-white light with crisp straight horizontal top edges and dark night-sky gaps, no rocks. Far RIGHT: a clearly visible golden STAR GATE, open gate with five-pointed star crown and gold landing pad. Exactly two collectible five-pointed gold stars float along route. Deep navy #0d1630 to blue-violet #2a2a66 sky with pale aqua horizon haze, faint nebula, many tiny understated stars and pale moon. Upper 25 percent remains calm dark negative space for later title overlay: no prominent objects there. Gold #ffd84a reserved for collectibles and gate, with pale-gold rabbit star tail. Calm uncluttered composition, rounded forms, limited palette, soft glow, minimal flat shading. No photorealism, painterly noise, text, letters, logos, watermark, signature, UI frames, mockup chrome, or extra characters.

## star-rabbit-512.png

Generated with a native transparent-background request. Pillow ImageOps.fit with LANCZOS to exactly 512x512, preserving generated alpha; no background removal or fabricated transparency.

### Prompt

Use case: illustration-story. Generate a standalone game character asset, square 1024x1024 for downscaling to 512x512. A tiny star-rabbit alone, centered, full body side view facing right, mid-hop pose, generous transparent margin around all ears and paws. White to pale cream chunky round body, two long rabbit ears with soft pink inner ears, tiny pale-gold FIVE-POINTED STAR-shaped tail attached at rump on left, simple cute face with small dark oval eyes, small pink cheeks, tiny nose. Soft pale blue-white rim glow, clean flat vector-like 2D illustration, rounded shapes, limited palette, minimal shading, no painterly noise. Strong readable rabbit silhouette even at 48px tall. No clothes or accessories. Native genuinely TRANSPARENT background with actual alpha transparency, no solid background, no checkerboard painted into image, no ground, no scenery, no shadow plane, no stardust. No text, letters, logos, watermarks, signatures, UI frames, mockup chrome, or extra characters.

## star-rabbit-sheet.png

Referenced the standalone rabbit and cover for character continuity. Original generated PNG copied without resizing.

### Prompt

Use case: illustration-story. Make a simple wide character reference sheet, 1536x640 or similar wide landscape, plain uniform dark navy #0d1630 background. Use the rabbit in the supplied preceding images as the SAME character identity. Show exactly FOUR depictions of this one rabbit in a single evenly spaced left-to-right row, all facing right, fully visible with generous margin and no overlaps. Left-to-right poses: 1 idle round seated body and two long upright ears; 2 stretched take-off with hind legs pushing and front paws reaching forward; 3 squashed landing, body short and wide with paws braced and ears upright; 4 FAST hop, leaning forward horizontally with ears swept back. Keep same design, underlying proportions, palette and size in every pose, deform only for squash/stretch. White to pale cream chunky round body, two long soft-pink-inner ears, a TINY pale-gold FIVE-POINTED STAR tail on rump, small dark oval eyes, pink cheeks, tiny pink nose, faint pale-blue-white edge glow. Clean FLAT vector-like 2D illustration, simple rounded shapes, limited palette, minimal shading and no fur detail, readable as a rabbit at 48px tall. This sheet is reference for hand-coded Canvas art. No clothes, accessories, scenery, ground, stars except attached tails, extra characters beyond four poses, text, pose labels, letters, numbers, logos, watermarks, signatures, UI frames, borders, panel dividers, or mockup chrome.


## Verified outputs (Pillow)

| File | Pixels | Mode | Alpha | Transparent pixels |
| --- | --- | --- | --- | --- |
| cover-630x500.png | 630 x 500 | RGB | No | 0 |
| star-rabbit-512.png | 512 x 512 | RGBA | Yes, range 0-255 | 261986 pixels with alpha below 255 |
| star-rabbit-sheet.png | 1942 x 809 | RGB | No | 0 |

