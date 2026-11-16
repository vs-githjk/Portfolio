# CLAUDE.md

Context for Claude Code working in this repo. This describes the v3 site on branch
`overhaul` as of Nov 16 2026 (after judging round 6 and the v4 opening: the hologram,
the hero without the ring, the ring in Builds).

## What this is

Personal portfolio for Vidyut Sriram, Penn State CS (graduating Dec 2026, available
Jan 2027), AI systems engineer. Audience: hiring managers and recruiters (forward-deployed
engineer and AI engineer roles). The page has one job: in sixty seconds, make someone
think "this person has done a lot, has won things, and is good at the job", then make it
easy to email him.

Vidyut's brief for v3: "My projects define me as an engineer, the UI defines me as a
person. I build worlds, reliable worlds." The page is one descent through one world (space,
then the sea, then the earth), and every living thing in that world is drawn from his data.

Stack: Vite + React 19, plain CSS with custom properties. No Tailwind, no CSS-in-JS, no
component library, no router. Single page. Runtime dependencies are react, react-dom and
three (pinned to 0.170.0, used only by the world, in its own lazy chunk). Keep it that way.

## The thesis: don't undermine it by accident

**"Vidyut Sriram builds safe, reliable AI systems."**

The name is the hero h1. The positioning is forward-deployed engineer and builder. The
flagships are PrismAI (the name here stays PrismAI, whatever its own site's wordmark says),
DuelWise and SNAPBACK. The research (arXiv:2607.21641) is a preprint, never "published".

Four rules encode the thesis:

1. **Color is scarce, so it means something.** Three palettes, one per realm, in
   `tokens.css`: `:root` is space (indigo ground, electric blue accent), `[data-realm='sea']`
   (petrol ground, shallows cyan; Experience and Builds), `[data-realm='earth']` (warm basalt,
   bone text, ember; the camp and everything after). One accent per realm; the nav and its
   Email pill take the realm under them. Gold (`--win`) is for awards and nothing else, mint
   (`--ok`) means live or available, coral (`--bad`) is reserved. The one place with other
   colours is the Master Agents crew art. Tokens built from other tokens are declared again
   under `[data-realm]`. A fourth palette, a second accent in a realm, a glow or a gradient
   wash: stop and ask first.

2. **Claims come with receipts, and are never fabricated.** Every number traces to a source
   (the paper, the resume, a repo or doc, Devpost, GitHub, or something Vidyut said). Unknown
   facts get a `TODO` in `content.js` or an empty value. Empty links are filtered at render.
   Never call MVR "AI" (it has no LLM). BetterBill, Yinzone and Terrametric are team builds
   and say so. SNAPBACK has no award, and its ring-finder numbers are labelled synthetic.
   Fish Market's prize reads "Winner". PrismAI's agency scope check and change orders are
   live since Oct 20 2026; its in-call private note is built but off ("Now building").
   TransitGuard's demo is dead: never link it.

3. **No bare numbers.** A figure sits inside a sentence or label that says what it measures,
   over what sample and when ("won 96% of its 82 matches against people in the week to Nov
   12", "22 of 22 seeded billing errors caught"). A bold phrase listed in `receipts.on`
   (`content.js`) becomes a Receipt button (`Rich` with `receipts`; `Receipt.jsx`, a popover:
   what it measures, where to check). A receipt only repeats facts already in `content.js`.

4. **GitHub totals: only in the Proof of work stats row.** On Nov 16 Vidyut first cut commit
   and contribution totals, streaks and month counts as vanity (he can make 333 commits in
   three days), then asked for them back the same day ("the old GitHub told me what commits
   and all, it gave me the numbers; this one doesn't give me the numbers"). So the stats row
   over the commit skyline is back as it was on the old page (the year's contributions, the
   longest streak, the month so far), each figure computed from `github.json` in
   `ProofOfWork.jsx`, never typed. They stay there: no totals in the hero, Highlights or
   anywhere else as a headline.

The colophon quotes Lighthouse runs measured on the production build (`colophon.lighthouse`
in `content.js`): every run in the batch, its date, never a floor that one run broke.
Re-measure when the build changes, or set it to null.

## Page order

`src/App.jsx`, top to bottom. The Chart names each place (`places` in `data/world.js`).

| Section (place) | Job |
|---|---|
| Welcome (The Threshold) | A hologram of him on a projector plate says hello: "Hey, I'm Vidyut." and "I build worlds. Reliable ones." Enter, or scroll, or Skip intro |
| Hero (The Landing) | His name, very large, the status, the thesis, one plain line, Email me, Resume and links; at the right his real studio photograph. No builds here |
| Vista: surface (The Waterline) | The dive. "Under the surface: the work." |
| Experience (The Sounding) | Where he has worked; a sounding weight sinks as the roles are read |
| Builds (The Deep) | Opener (the heading, the ringed giant, and under them the ring of twelve build cards as the index; the dot chart of all twenty on a phone or without scripts), three flagships as chapters, the fleet of eight featured plates, the paper with its repair loop, More builds as rows |
| Vista: shore (The Breach) | Inside Builds: the camera rises through the second waterline into dusk |
| Crew (The Camp) | Master Agents, a character select screen, and a run that holds at each gate |
| Highlights (The Cut) | Four sentences cut as strata of rock |
| Vista: galaxy | Night over the ridges |
| Proof of work (The Ridge at night) | The nine wins (gold plaques), the dragon roosting on the commit card, the GitHub graph, four verification links |
| Principles (The Bench) | Four tiles, each with a small drawing that runs once |
| Value (Moonrise) | Hairline rows; a moon fills as they are read |
| Toolkit (The Inventory) | A label and a line of tools per group; a tool answers with the builds that use it |
| Contact (First Light) | The hologram figure in a column of its own (1100px and up: a two-column grid, so no text can run under it; smaller beside the label below that), the email as the hero of the section, Copy email (dawn breaks over the limb), then the colophon |

Principles and Value are different shapes on purpose (tiles vs hairline rows).

## The entry (`components/Welcome.jsx`, `shell/entry.js`, `Hologram.jsx`, `lib/holoScene.js`, `lib/face.js`)

Vidyut, Nov 16: "I asked for a hologram [and got] a normal picture of my face", then, of a
framed hologram of the photo, "it shouldn't be a box". The first screen is a projection room.

- **The figure.** `welcome.figure` in `content.js` is ONE picture with a transparent
  background (PNG or WebP with alpha, any aspect, bust or whole body). Its alpha is its
  silhouette: nothing rectangular is drawn round it. The scene adds the hologram: the
  picture's tones on the `--holo-*` ramp with a share of its own colour (`--holo-warm`), light
  along its edge, a glow in the air round it, scan lines (`--holo-pitch`), a slow band of
  light, the foot dissolving into the cone (`--holo-foot`), and a plate under it. Try another
  picture with `?figure=/holo/<file>` (a path on this site only).
  **The figure today** is him in a robe of stars with a staff and a crystal
  (`public/holo/wizard-1.webp`, 1400 px tall, and `wizard-1-phone.webp`; Contact shows a second take, `wizard-2`), made from his own
  photograph. `scripts/matte-figure.py <figure-on-black.png>` cuts it out in one command
  (rembg with birefnet-portrait for the body, brightness for the glow, so the ring of glyphs
  is clear inside) and prints the size to put in `welcome.figure`. Run
  `scripts/tidy-hair.py` on the source first: in blue light a flat mass of dark hair read
  as a fur hat, so it trims the crown a few pixels and spreads the hair's tones. The face will be swapped
  again from a sharper photo: rerun the script. `--holo-foot` is small (0.035) and the plate
  sits right under the feet, so he stands in the beam.
- **Never** a point cloud of his face (judged "scary"), never a plain photograph, never a
  frame or a box, never a row slip or any distortion of the picture (he read one as an eye
  glitch). The shimmer is brightness only. Check "friendly or eerie" with other model
  families, cold, against the plain photo as a control, before shipping a new figure.
- **Only he is a hologram** (Vidyut, Nov 16: "that stuff doesn't have to be holograms. That
  stuff can actually be real. I did all of that. I'm the hologram because I'm the wizard.").
  His work stands round him as real things: six crisp, full-colour cards (`welcome.hub`,
  `.hub-card`: the builds' own thumbnails, no tint, no scan lines, no blur, no plates) in a
  mirrored arc, three a side, each in a thin metal frame with its name and one word. A phone
  shows the first two. Never tint, blur or project a build again.
- **The inscription.** `welcome.plate` ("5× hackathon winner · 6 first places") is gold
  light set into the floor at the foot of the projector: five small stars, the words, a
  hairline running out each side, lit like the runes. In the page's flow between the figure
  and the greeting. It was a gold panel among the builds (read as DuelWise's label), then a
  gold pill ("not thematic"): a fact about him never sits beside a build, and never as a UI
  pill.
- **The room is deliberately little** (`WelcomeScene.jsx`): a floor of light round the plate
  with a band of gold runes, and four faint constellations high at the sides (he likes
  them). Cut after being read as "incomplete ... still making it": circuit traces with
  numbered nodes, drifting glyphs, ember sparks, blue-tinted panels at three depths.
- **The sky** (`WelcomeBackdrop.jsx`, in the fixed stack under the hologram's canvas, moved
  with the scroll): one band of aurora, vivid at the sides and along the horizon (gold, ember, violet, blue),
  with a fine grain, and a dark column behind him so his robe of stars reads against
  night. No shapes: a mountain range and a setting sun were cut ("that doesn't make sense").
  `--room-gold` and `--room-ember` live only there and in the runes; blue leads near him;
  `--win` is still for awards (the plaque). This is the one screen where rule 1's "one
  accent" is widened, on purpose.
- Nothing touches the figure or sits on the greeting (measured Nov 16: greeting 10:1 or more
  at 1440, 390 and 360). Under reduced motion it is all still.
- **No second act.** There is no ball and no line of speech between him and his name. On Enter
  (a clock, `KNOTS` in `Welcome.jsx`) or on scroll, two curtains of light close over the figure
  (it turns to light as they come and is never squeezed), leave one vertical beam, and the
  beam lifts off the plate as the hero arrives. Any wheel, touch or key hands the scroll back.
- The greeting is prerendered text and the LCP element. Never hide it to reveal it. The
  picture is fetched by script and drawn in the canvas; it is never an element of the page.
- Skip intro lands the hero at once and moves focus to the name (`.hero-name`,
  `tabIndex=-1`), so the next Tab is Email me.
- `--welcome-run` is the empty scroll under the greeting (16svh, 8svh on a phone, 0 under
  reduced motion).
- The hologram is a second, tiny WebGL context (plain WebGL, one fragment shader, no
  three.js) that stops before the world starts.
- Reduced motion: one still frame of the figure and three still panels. `?plain` and no
  WebGL: no figure, the greeting and then the hero; Enter is a plain anchor.

## The hero (`components/Hero.jsx`)

Vidyut, Nov 16: "If I'm already doing 'Hey, I'm Vidyut', why is there an orbit right here
that talks about projects?" and "the hologram to start off with, then just an image of my
face, because that's a real thing." The hero has no builds and no hologram. It is the
status and the place, his name in two lines of the display face (`--fs-name`), the thesis,
one plain sentence, the credentials and the actions, and at its right his own photograph
(`hero.portrait`: the one he chose, shirt and tie, centred on him with both shoulders, in
a round frame; small above the name on a phone). This is the only place his
photograph is shown; the hologram figure is everywhere else he appears.

## Toolkit and the foot

Toolkit is a plain inventory: a label and a line of tools per group, nothing to pick and
no answer line ("What's the point? They'll see the projects.").
The footer is one quiet line (llms.txt, Roll the credits, Back to the top) so Contact is
the last thing on the page; the credits open under it only when asked for.

## The ring (`components/RingStage.jsx`, `Orbit.jsx`, `Drift.jsx`)

Twelve glass cards on an elliptical CSS 3D ring, on a plate drawn from the same projection
(one tick a card). It stands at the top of Builds as the index (Vidyut chose this over a
ring of wins in Proof of work, which was built and removed). The opener is the ring's centre
block and the front arc hangs under it: five cards in sight, the back half never shown.
Each card links to its Builds entry (`#build-<id>`; a slide `id` in `hero.carousel.slides`
must equal the Builds id).

Calm on purpose (Vidyut: "Builds looks crowded, doesn't feel natural"): the opener is the
heading and ONE short line; the giant's window is lifted (`--giant-lift`) so the planet ends
above the ring; `--ring-air` is the clear air under the heading; no dot chart on a wide
window. Do not add a paragraph, a legend or a second set piece to the opener.

- One rAF loop writes transforms straight to the nodes; `offsetWidth`, never
  `getBoundingClientRect`. It asks for frames only while something moves.
- The cards wait unlit until the ring is first seen, then land on their ticks front first.
- Only the front card shows its call to action and progress line. Captions wipe with a
  clip-path, never fade.
- Hover pauses, focus stops it; only the front card is tabbable; arrows step, Home and End
  jump; Pause, Prev, Next.
- Below 960px wide or 640px tall the ring gives way to `Drift.jsx`: the thumbnails as two
  dim drifting rows, `aria-hidden`, no captions or links. It is atmosphere, not a list.
  Without scripts there is no ring and the dot chart is the index.
- The plate takes the accent of the realm it stands in (`--plate-*` are declared on
  `.ring-stage`).
- The ring registers the `orrery` binding for Receipts.

## The world (`components/World.jsx`, `lib/worldScene.js`, `lib/worldBackdrop.js`, `lib/worldLand.js`, `src/world/`)

One WebGL canvas in the fixed stack, drawn with three.js: space bleeds into the sea at the
first waterline, the sea ends at the shore, then dusk, night and dawn over a desert earth.

- **The earth is a coast** (`lib/worldLand.js`; Vidyut, Nov 16: the flat buttes were "bland and
  boring", the camp had "two tents"). One heightfield, sea level at y = 0: the beach with surf
  where the reader comes out of the water, the camp on a rise (nine tents, banners, crates,
  eight figures, loose rock, a worn path), an inlet of the sea running away toward the sun,
  foothills, then two ranges of ridged mountains, the far one snow-capped. The ranges part
  where the inlet runs, so the sun sets down the water; on a narrow window the inlet narrows
  so the mountains stay in view. Pine stands grow on the foothills and lower slopes only (never between the reader and the
  camp, never on the beach or at the water's edge), and the near shore carries a green turf tint in the
  ground's shader. There are no grass tufts and no small pines by the water or the camp front: Vidyut, Nov 16,
  "next to the ocean they don't look like trees, just sharp spikes; they look like desert". Rock, scrub, snow and green are `--land-rock`,
  `--land-scrub`, `--land-snow`, `--land-green`. The camp and the pines are one mesh. Do not flatten it back to dunes and mesas.
- One unit is one CSS pixel on the plane z = 0; depth is parallax. The scene reads the page:
  an element marked `data-world-anchor="<name>"` (names in `ANCHOR`, `data/world.js`) is
  where a piece lives, and layout runs again whenever the page height changes.
- **Pieces are drawn from data** and say so in Receipts (`BINDING`, `receipts()`): the giant
  (twenty builds: moons and ring lights), a small world per flagship (`flagWorlds.js`,
  counts from each flagship's `scene` in `content.js`, checked by
  `scripts/check-scenes.mjs`), the school (Fish Market), the camp's fires (one per agent),
  the constellation (one gold star per win) and the moon (the Value rows). The dragon is
  a model, not data.
- **Text stays readable.** Drifting things keep to the margins; every section paints calm
  ink behind its column (`.sec::before`, `--world-calm`) and the backdrop gives up its
  brightest values there (`hush()` in `worldBackdrop.js`). Both ramps are long (about 300px)
  and eased: a short ramp under the first waterline drew a dark box on the water. Re-measure
  contrast after changing either.
- The footer has no top line under the world: the limb fades into its ground.
- Budget: the chunk is requested on the first scroll (or after idle on a desktop), never
  before first paint; it draws only while visible; DPR capped; phones get fewer points.
  `scripts/check-budget.mjs` holds the chunk (with three's core, which the dragon shares)
  and the dragon's own chunk and files under their ceilings.
- Reduced motion: one still frame per place (`data-world="still"`). `?plain` or the World
  switch: no canvases and no world chunk at all. No WebGL: `data-world="off"`.
- Do not add another WebGL canvas. The hologram is the one exception.

### The dragon (`src/world/dragon.js`, `dragonStations.js`, `scripts/prep-dragon.py`)

A rigged, animated 3D model (Vidyut, Nov 16: the creature drawn from commit weeks "looks like
a dragonfly"; he wanted a real dragon, grand, much larger). It is not built from data and has
no Receipts line.

- **The model.** "European Dragon" by Nonexistent 101 on Sketchfab, CC BY 4.0
  (https://sketchfab.com/3d-models/european-dragon-82f393a2e6c048ad80c171ce3b3a7b87). The
  credit is a condition of the licence: it is in the footer credits ("Borrowed, with
  thanks", `contact.credits.borrowed`) with the title, author, link, licence and what was
  changed. Never remove it. The 29 MB download is not in the repo; `scripts/prep-dragon.py`
  and the gltf-transform commands in its header make `public/dragon/dragon.glb` (42k
  triangles, two 1024 px maps, 1.12 MB, 661 KB gzip) and `dragon-lite.glb` (phones: 17k,
  512 px maps, 785 KB, 385 KB gzip). Clips kept: Fly, Perch (its "Idle Sit"), Stand.
  An earlier CC0 low-poly model was replaced the same day.
- **Repainted in the shader** (he did not like the model's own colours): sapphire scales with
  a sheen, a gold belly and claws, red wing skin with the light through it, faint glowing
  eyes, a soft rim (`--dragon-hide`, `--dragon-belly`, `--dragon-wing`, `--dragon-glow`; its
  yellow is its own, `--win` stays the awards' gold). Only the light and dark of the model's
  base colour and its normal map are used. Which part is which comes from the skin weights at
  load (wing bones, toe bones); the horns have no bones, so they are the part of the skull
  behind the head's joint at rest, and they are gold too. It is lit by the place it is in (`LIGHT` in
  `dragonStations.js`). A depth-only pass is drawn first so a fade never shows the far wing
  through the near one.
- **The Fly clip hovers upright.** `lean` (about 1.2 rad) tips it toward level for the passes;
  the head is lifted with `look`. The model is measured at load and brought to the stations'
  frame (head toward +z, 8.4 units tall sitting), so another model can be swapped in.
- **Three stations and nowhere else, and grand**: big in frame, slow wingbeats (0.4 to 0.85 a
  second). One lap across the giant's face; the breach as the reader comes up through the
  surface, then a long sweep across the low sun; the roost (it sits on the commit card on watch, turning
  its head and, every sixteen seconds, slowly opening its wings: `unfurl` turns the wing
  bones over the Idle Sit clip; choosing a week makes it look at that column). It is not at
  Contact: the low pass over the limb and the flight into the dawn on Copy email were cut
  (Vidyut, Nov 16: "a little odd, out of place"). The limb and the sunrise on Copy email stay.
  Do not add a station on the last screen back.
- **It loads last.** Its code is a chunk of its own (GLTFLoader and the meshopt decoder),
  asked for by `World.jsx` only after the world has drawn its first frame and the page is
  idle (`<html data-dragon="on">`). `?plain`, no WebGL and reduced motion never ask for it.
  Under reduced motion the roost band holds a still (`public/dragon/perch.webp`, a
  screenshot of `kit-demo.html`, see `src/world/demo.js`).
- **Text.** Its light is held inside the station's band and gives nothing inside the text
  boxes there. Measure with the dragon alone on black (`?solo=dragon` in dev) through every
  station at 1440 and 390 after moving a path: zero lit pixels in a text box is the bar. The
  section's calm ground opens over the roost band (`--roost-top`, `--roost-bottom`).
- `kit-demo.html` (dev only) shows it alone: `?clip=`, `?light=`, `?yaw=`, `?lean=`, `?still`.
- Cold-read rule: crop every station at 390 and 1440 and ask non-Claude vision models "what
  is this creature, and does it look impressive or cheap?" with no hint.

## Phones: everything is there, and scrolling is cheap (Nov 16 2026)

Vidyut on his phone: "a little slow, a little shaky", then "instead of the phone loading
stuff, the phone can just have everything there". Measured on the production build with
Chrome's phone emulation (390x844, DPR 3, CPU slowed 4x), one touch scroll down the whole
page: 52.7ms a frame on average and 150ms at the 95th percentile before, 202 long tasks;
after, about 17ms and 16.8ms, 9 long tasks. Rules that keep it there:

- **Never write a per-frame CSS variable on `<html>`.** A custom property there is inherited
  by every element, so each write restyles the whole document. That alone was most of the
  cost: `--w-depth`, `--w-line` and `--w-shore` were written on the root on every frame of a
  scroll. `kit/signals.js` now writes each on the element that reads it (`scope` in
  `Shell.jsx`: the bar for the lines, the rail for the depth) and not at all when that reader
  is not displayed (a phone has no rail). `data-at` and `data-split` stay on the root: they
  change a few times a page. The unused root `--px`/`--py` were removed.
- **Nothing waits for the scroll on a phone or a touch screen** (`(max-width: 760px),
  (pointer: coarse)`): `.reveal` is shown from the first paint (`base.css`) and `useReveal`
  marks everything at once; the commit skyline stands in its final pose.
- **Pictures arrive ahead of the reader** (`lib/eager.js`, every width): after the first
  scroll, touch, key or pointer, the lazy pictures are promoted to eager in page order, three
  at a time. Nothing is asked for before that first sign, so the first paint is untouched.
  (FireSight's thumbnail was measured arriving after its card had passed; this fixed it.)
- **Nothing changes height under the reader on a phone**: figures do not count up there
  (`Count.jsx`: while one counted, the label beside it rewrapped and the page moved 48px at
  360px), the DuelWise status keeps room for two lines below 460px, and the typefaces of the
  product stages are fetched with the picture queue, before their stage is reached. A walk of
  the whole page at 360 and 390 measured a layout shift of under 0.005 in total.
- **The phone world is lighter**: canvas at 1.25 (not 1.5; the quality steps still lower it
  on a slow phone), 300 snow points and 900 galaxy points, 15 frames a second at rest, asleep on a timer between them (every
  frame while the page moves, so set pieces keep their place), no blur behind the bar.
- **The phone's moon is a picture** (`public/world/moon.webp`, a 256px still cut from a
  desktop render of the scene's own moon; `--moon-art`, `--moon-phone`; the rule is at the
  end of `v4-opening.css`). The scene does not draw its moon on a phone but still lights the
  ground by it. To remake it: hide `.page` and `.rail` in dev at 1800px wide, DPR 3, shoot
  the Value section and cut the disc out by brightness.
- **The phone's limb keeps near the page** (`sizes.limbZ`): at the desktop depth it ran
  ahead of the scroll and its rim crossed the last Contact link for a moment.
- Desktop is unchanged by all of this except the first rule and the picture queue, neither
  of which is visible.

## The shell (`src/shell/`, `src/kit/`)

Everything over the page and the world. `src/kit` and `src/shell` hold no site words: names,
labels and receipt sentences live in `data/world.js`; events and shared CSS variables in
`kit/contract.js`.

- **The Chart** (M, or the bar's tool): a dialog with the descent as a scale, eleven places,
  every build as a dot, and the switches. The current place has a fill and an accent edge;
  hover fills only where a pointer hovers.
- **Receipts** (R, or `?receipts`): each living thing in the window gets a label (name, fact,
  source file). Beside the piece in a free window, in the margin when it is wide enough, else
  in a ledger slip along the foot (a phone). `scroll-padding-bottom` keeps a jump clear of it.
- **The depth rail** down the right edge; **Sound** (synthesized, never plays by itself);
  **World** on or plain.

## Builds (`components/Builds.jsx`, `Flagship.jsx`, `BuildCard.jsx`, `ResearchRow.jsx`, `CompactRows.jsx`)

- A flagship is a chapter (`.ch`): index line, a very large title, its stage, the
  one-liner (with receipts), one hero figure, links, then stills and the story.
- The stage (`Stage.jsx`, `SnapHouse.jsx`, `hooks/useStage.js`, `styles/v4-flagships.css`,
  Nov 16: Vidyut wanted each flagship to carry its own product's UI) is the product itself
  inside the page's cut-corner frame, in the product's own type and colours, read from its
  live site: PrismAI's record page (Lato, the red thread, the three prisms: two promises get
  an owner and a date, the client's ask is marked outside clause 2.1, a change order waits
  for approval); DuelWise's home (Fraunces, its four portraits, a Four in a Row match that
  Sable wins); SNAPBACK's home (Atkinson Hyperlegible, the cutaway house, the sample ad's
  photos flying to their walls, the verdict card, the measured tally). Rules:
  - The product palettes and faces (`--pm-*`, `--dw-*`, `--sb-*`, six subset fonts in
    `public/fonts/products`, about 51 KB) are used inside a stage and nowhere else.
  - Every word is in the build's `stage` object in `content.js`, with its source beside it.
    Never a number without a source: no price on the change order, a record only for Sable.
    The stage carries the product's headline, so the chapter no longer prints the descriptor.
  - A stage plays as steps while it is on screen and rests on the last one, which is also
    what the server renders, what a reader without scripts gets and what reduced motion
    shows. It is one picture to a screen reader (`role="img"`, `stage.alt`).
  - Counts a stage draws come from `scene` and are checked by `scripts/check-scenes.mjs`.
    The DuelWise winner is found by code from the moves (`playOut`), never typed.
  - Layout inside a stage follows the stage's own width (container queries, `cqw`), not
    the page breakpoints.
  - The three.js flagship worlds (`world/flagWorlds.js`) no longer draw: a scene kind
    without a builder is skipped. The piece is still in the world chunk; removing it is a
    separate change to `worldScene.js` and `data/world.js` (the prism, board and scan
    receipts are idle).
- The fleet: eight plates in pairs, one height by construction. A plate's dossier is the
  NEXT element, laid under the whole row, so opening one never changes a plate's height.
  Without the script every dossier is open. On a phone a plate is a row (small thumbnail,
  name, one-liner, links) and its results open with the dossier.
- More builds are rows with Read more (`<details>`).
- Height, measured Nov 16 with the ring as the index: 6,654px at 1440 (it was 6,299 with
  the dot chart; baseline 9,163) and 8,951px at 390 (it was 8,755; baseline 19,488). The
  flagship stages then took it to 7,542px at 1440 and 10,379px at 390 (a stage is 560 to
  640px tall where the old window was 260). Vidyut, Nov 16: the laptop is fine as it is;
  the phone had to come back down. So below 760px a flagship is its stage, the one-liner,
  one figure and the links, and its story panel (stills, second figure, role, what is
  being built, the story) opens from the Inside bar (`.ch-file`: three stills dealt like
  cards, one teasing line from `tease` in `content.js`, an Open handle; a button with
  `aria-expanded`, shown only under `html.js`, so without scripts the panel is simply
  there). SNAPBACK's stage drops its sample ad and tally on a phone. Below 560px a
  featured plate leads with its one-liner and one proof (its award, or its first result
  when it has none) and its descriptor opens with the dossier; the paper's second figure
  and author line open with its story. Builds is 8,860px at 390 now; keep it at or under
  about 8,900, and leave the laptop alone.
- Images are flat and straight; only the ring is 3D.

## Master Agents (`components/NowBuilding.jsx`, `CrewRun.jsx`, `builds.building`)

The loudest section on purpose: a character select screen. Cut corners, the title at
`--fs-mega`, one sentence drawn as a prompt that runs through the crew and holds at each
gate, a stage with one character large, the roster of fourteen as a tablist (arrow keys,
Home, End). On a roster tile the selection frame is on the edge and the focus ring is a
separate ring inside it, so a focused and chosen tile shows two rings. Art is
`/agents/<id>.webp`. Every claim was confirmed by Vidyut on Nov 12 2026. It stays "Now
building", has no link (private repo), sits beside no build, and never compares the crew
with anyone else's agents.

## Proof of work (`components/ProofOfWork.jsx`, `SkyStage.jsx`, `Skyline.jsx`, `Heatmap.jsx`)

The graph is drawn from a build-time snapshot: `scripts/fetch-github.mjs` (prebuild) writes
`src/data/github.local.json` (gitignored); the committed `github.json` is the fallback. No
runtime third-party calls. Every GitHub figure is computed from that JSON. The graph is the 3D commit skyline again (Vidyut, Nov 16: "I like the old GitHub, we
had more: it told me what commits, it gave me the numbers"): `Skyline.jsx`, one 2D canvas, no
WebGL, every day a tower (height count^0.4, colour ranked within the year), laid by
`SkyStage.jsx` exactly over the flat graph once its first frame is drawn. Pointing at a tower,
or tapping it, gives that day's exact count; the week under the pointer is sent to the scene
(`world:week`) so the dragon on the roost glances at it. It rises as the card scrolls in on a
desktop and simply stands on phones and under reduced motion. The flat `Heatmap` (a ridge of
weekly buttes over the calendar) stays underneath as the accessible image, the keyboard range
control and the scene's "graph" anchor. The stats row over it (total, longest streak, month so far) came back the same
day (rule 4). A phone crops the graph to
the latest half year and its label says "last 6 months" (only with the script: without it
the graph is whole and the label stays twelve). Choosing a week makes the dragon on the roost look at that column.

## One shape language: cut corners

A panel's corner is cut, not rounded (the CUT CORNERS block in `sections.css`). The cut edge
is a 1px diagonal drawn in a background tile, because a border cannot follow a clip-path; a
clipped panel has no outer shadow, and a focus ring on one is drawn inside it. Media frames,
buttons and badges keep their soft radius. Value and Toolkit are hairline rows with no
boxes. The Highlights beds dip at every edge, the foot of the last one included.

## Build and prerender

`npm run build`: prebuild (`check-classes.mjs`, `fetch-github.mjs`), `vite build`, the SSR
build, then `scripts/prerender.mjs` (renders the app into `dist/index.html`, inlines the
stylesheet, requests the bundle only after the first largest-contentful-paint entry). The
first paint needs no JavaScript and JS-off shows every fact, link and build. Hydration rules:
nothing reads `window` or `matchMedia` during render (`useMediaQuery` has a `false` server
snapshot), nothing random or time-based renders. `.reveal` hides only under `html.js`.

## Architecture rules

- `src/data/content.js` is every word on the site; `src/data/world.js` is the world's own
  words and wiring (place names, shell labels, receipt sentences), with every count computed.
- `src/styles/` is every visual decision: `tokens.css` (the control panel), `base.css`,
  `sections.css` and `v3-sections.css` (per region, top to bottom), `v3-shell.css` (the
  shell), `v3-world.css`, `v4-opening.css` (the projections, the hero, the ring's homes;
  loaded last). `scripts/check-classes.mjs` fails the build when the shell sheet
  and a sections sheet both claim a bare class name (`.plate` and `.chart` once did).
- `src/components/` is structure only. Never hardcode a color, font or radius: use a token.
- Editing copy means `content.js`; editing looks means `styles/`. Say so before a change
  that needs both.

## Type

Self-hosted, latin subsets, all open source: **Sprat** for display (one static cut per
realm; it has no digits, so figures fall through), **Brygada 1918** for reading sentences
and figures, **Schibsted Grotesk** for UI and body, **Martian Mono** for labels, nav,
buttons and badges. Never Geist, Inter, Instrument Serif or a system font as the identity.

## Conventions

- Class names are plain and region-prefixed. No BEM, no utility soup.
- `**double asterisks**` in `content.js` render as emphasis via `<Rich>`; nothing else.
- Build images ship as `/builds/<id>.webp` plus `-640` and `-900`; ring images in
  `/builds/ring/` with a `-320` variant. Never use a frame that shows personal info.
- Breakpoints: 1100, 960, 760, 640, 560, 460, the ring's `(min-width: 960px) and
  (min-height: 640px)`, and the complements 961, 761, 561, 959.98 and 1199. Don't invent more.
- Type sizes use `clamp()`. Never add a media query for font size.
- Animation state on a node goes in a `data-*` attribute.
- No em dashes or en dashes anywhere (copy, code, comments, commits). Ranges use "to".
- Commits: plain one-line messages, no trailers.

## Quality floor: verify before calling anything done

- No horizontal scroll from 360 to 1600 (`scrollWidth == clientWidth` through the whole page).
- Focus visible everywhere; targets at least 44px (a pseudo hit area counts: prove it with
  `elementFromPoint`).
- Reduced motion: nothing moves (0 running animations down the page). `?plain`: no canvas,
  no world or hologram chunk. JS off: every fact, link and build.
- WCAG AA on every text and surface pair, measured against the scene behind it.
- `npm run lint` and `npm run build` pass; Lighthouse mobile performance 95 or more on a
  quiet machine, accessibility, best practices and SEO 100. A run seconds after a build, or
  beside other headless browsers, can read 67 on one long task: take several and quote all.
- Screenshots with headless puppeteer only. Never click or open a `mailto:` link in a test.
- Judges who sample an animation at a few fixed times report cuts and smears that are not
  there: re-shoot at 200 ms steps before building their fix.

## Commands

```bash
npm run dev      # dev server, hot reload (client-rendered)
npm run build    # prebuild checks and GitHub snapshot, client build, SSR build, prerender
npm run preview  # serve the production build
npm run lint     # oxlint
```

## Open TODOs

Search the repo for `TODO`:

- Match Day: build dates, solo or team role line, and the stack line
- Vytal: confirm the "Jul 2026 to Present" dates are still current
- A silent screen-recording loop of the PrismAI UI for the flagship (`media.video` is empty)
- Source links for the paper, MVR, Match Day and Vytal (private repos today)
- Yinzone and BetterBill "Live site" links (hidden until Vidyut sends them)
- `public/og-card-v8.jpg` is the link-preview card; bump the filename and re-render it when
  the headline facts change
- The hologram's face will be swapped from a sharper photo: rerun `scripts/matte-figure.py`
- `public/portrait-180.webp` and `portrait-360.webp` (the sunset silhouette) are no longer used
- No longer used and still in the repo: `public/holo/face-a.bin`, `face-b.bin`,
  `face-1024.webp`, `face-512.webp` and `scripts/bake-hologram.py` (the point cloud); delete
  them once Vidyut agrees
- `colophon.lighthouse` is null since the opening was rebuilt: measure the production build
  again on a quiet machine (two runs on a busy one read 89 and 98, LCP 2.3 s)
- Taste calls waiting on Vidyut: a shorter phone
  Builds (it would hide the one-liners); the shore camp's tents

## Things deliberately left out

Don't add these back without asking:

- Phone number. An "Objective" or "Summary" section. Testimonials, a blog, a visitor
  counter, a "currently listening to" widget. Skill percentage bars. A dark/light toggle.
- GitHub stars or follower counts, and commit totals or streaks anywhere but the Proof of
  work stats row (rule 4).
- A proof band of bare numbers under the hero, and any halo or nebula.
- Alltr (not his project) and TransitGuard's dead demo link.
- A second world canvas, and any effect that reads as an effects reel.
- A point cloud of his face, a plain photograph or a framed box on the first screen, a ball
  or any second act between the welcome and the hero, the ring or build thumbnails in the
  hero, lines to his head, panels over the figure, a wandering guide that follows the reader.
- Glass cards or blur scrims behind text (the calm ground does that job).
- Build cards of any kind in the hero.
