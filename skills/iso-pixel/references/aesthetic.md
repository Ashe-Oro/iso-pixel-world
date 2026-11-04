# iso-pixel aesthetic reference

What makes these scenes look like a beautiful indie pixel-art game rather than a programming
exercise. Read before designing the palette and composition. Respect any direction the user gives
(palette, mood, subject) over these defaults.

## The look in one paragraph

A small, warm, lived-in world seen from above at a 2:1 isometric angle, rendered at a low native
resolution (640×360) and scaled up with hard pixel edges. Every surface has a hand-made pattern:
planks with seams, wallpaper with tiny motifs, tiles with grout and a highlight pixel. Light comes
from inside the scene (lamps, fire, candles, bulbs) as flat bands of warmer, brighter palette
steps with thin dithered edges. Shadows lean violet rather than grey. The outside is cool,
desaturated and moving (rain, clouds, distant lights), which makes the interior feel like a
sanctuary. Characters are small and chibi-proportioned, readable by silhouette, with one or two
pixels of expression.

## Palette

Build named ramps rather than loose colours, 4-6 steps each, with hue shifting: darker steps move
toward violet-blue, lighter steps toward warm cream. A cozy-night set that works:

- warm wood: deep brown → honey (`#3a2318 #55331f #744628 #965c35 #b67a46 #d09a5e #e6bc84`)
- cream / paper: `#bfa784 #dcc9a3 #efe0c0 #fbf1dc`
- honey / amber: `#a85e24 #d89236 #efba5c #f8d991`
- dusty rose: `#5e2a3c #82404f #a75a68 #c87f87 #e3a9a8`
- terracotta: `#5e271d #843a29 #ac5536 #cb7550`
- muted sage: `#273629 #3a4d3d #526a52 #6f8a69 #97ad86 #bfcfa6`
- midnight blue: `#0c0f22 #141a33 #1d2546 #29345f #3c4c80 #5d72a8`
- rainy violet: `#231d38 #342a4f #4c3f6e #6c5d93 #9688ba`
- charcoal: `#1a181f #28252e #393540 #534e5b #76707f #a49eab`
- emissive (unaffected by light): flame `#7a1f12 #c2401a #ec7a22 #fbb444 #ffe38a #fff8d6`,
  bulb `#fff2c4`, fairy lights in five colours, rain `#3b4778 #5d6ea3 #8496c6 #b5c3e6`,
  sky bands `#090b1a` → `#3a3a6c`

Let each area own a distinct palette pairing so it is recognisable at a glance (sage walls with a
rose sofa; cream gingham with terracotta checker tiles; dusty-rose star wallpaper with a patchwork
quilt; bare dark planks for an attic). Complementary pairs (sage/rose, blue/amber) give warmth
without loudness.

## Light and atmosphere

- Light sources are the stars: every lamp or fire produces a visible pool of brighter, warmer
  bands on the floor and nearby walls, with flicker on flames.
- Corners, floors under furniture and wall bases are darker (baked AO). This alone adds a lot of
  depth.
- The exterior sits at the low end of the ramp plus a cool cast, with a few warm accents:
  glowing windows seen from outside, a street lamp lighting the rain around it.
- Dither only at band edges. Large uniform checkerboards look like a filter, not pixel art.
- Glossy floors catch a shimmering reflection under bright lights.
- Lightning should be rare and brief: a flash of cool light across the exterior and a bolt far away.

## Composition

- One focal object filling most of the frame height, framed in a 16:9 canvas with breathing room
  of atmosphere around it (a floating island, a block, a hill). Fixed camera, no scrolling.
- Budget the screen first (see engine.md: `W + D + Ztop ≈ 330` px at 640×360).
- Layer depth behind the focal object: sky bands, moon, two cloud layers, misty ridgelines with
  tiny town lights. Keep the background low-contrast so the focal object pops.
- Keep tall objects off the front edge of open rooms; low clutter at the front (a basket, a plant
  at a corner) frames the view without hiding it.
- Exterior cues that say "house": a roof band of shingles, a gable, a chimney with smoke, siding
  with a glowing window, a gutter and downspout, a lamp post, flowers, puddles.

## Detail density

- No empty surfaces. Every wall gets wallpaper plus at least two decorations (pictures, a clock,
  shelves, drawings taped on, a calendar, hanging utensils, fairy lights).
- Every floor gets a pattern and a rug or mat; every table top holds 2-4 small objects.
- Use procedural variety (rows of books with random heights and colours, patchwork from hashed
  colours, random plank lengths) so repetition never shows.
- Hide small secrets for long viewing: a mouse hole, a firefly jar, a treasure map, a toy left
  out, a sleeping pet's breathing, a moth at a bulb, a fish in a bowl.
- Objects should look like objects, not boxes: rolled sofa arms, tufted backrests, cushions with
  piping, chair spindles, a round table with a scalloped cloth, a kettle with a spout, a retro
  fridge with magnets.

## Characters

- Silhouette first: big head, a distinctive hairdo (messy, with a side ponytail and an upright
  strand), an oversized sweater, contrasting legwear, coloured slippers.
- Pets need their signature trait to be unmistakable: a dachshund's long low body and drooping
  ears darker than its coat; a cat's ears, tail curl and a white bib.
- Expressions are 1-2 pixel changes; that is enough.
- Characters must contrast with what they stand in front of. Check a honey sweater against honey
  floors, or a brown dog against brown planks, and adjust values.

## Things that make it look generated (avoid)

- Flat-coloured rectangles as furniture; oversized generic objects; empty rooms.
- Gradients, blur, glow halos, anti-aliased edges, sub-pixel motion that smears.
- Uniform dithering across whole surfaces.
- Fast, busy motion everywhere. The scene should be calm, with lots of slow, small loops and a
  few rare events.
- Grey shadows; a single global light; everything the same brightness.
