# CLAUDE.md

Context for Claude Code working in this repo.

## What this is

Personal portfolio for Vidyut Sriram, Penn State CS (graduating Dec 2026, available
Jan 2027), AI systems engineer. Audience: hiring managers and recruiters (forward-deployed
engineer and AI engineer roles). The page has one job: in sixty seconds, make someone
think "this person has done a lot, has won things, and is good at the job", then make it
easy to email him.

**Nov 15 2026, the three-worlds overhaul (branch `overhaul`).** Vidyut: "I don't like the
monochromatic all-blue thing... galaxy, water, then earth... a very nature-effect thing...
no AI slop, no AI fonts"; and later: "My projects define me as an engineer, but the UI is
what defines me as a person." The page is now one descent through three worlds, each with
its own palette, and every section has one signature moment. Where an older paragraph below
says "The Deep" or "one accent", the sections marked (three worlds) are the current truth.

Stack: Vite + React 19, plain CSS with custom properties. No Tailwind, no CSS-in-JS, no
component library, no router. Single page. Runtime dependencies are react, react-dom and
three (pinned to an exact version, used only by the world below the hero, in its own lazy
chunk). Keep it that way unless there is a real reason not to.

## The thesis: don't undermine it by accident

**"Vidyut Sriram builds safe, reliable AI systems."**

The name is the headline, literally: it is the hero h1, a white serif at the centre of the
first screen. The positioning is forward-deployed engineer and builder: someone who owns a
system end to end, modernizes workflows with AI, and sits close to the user. The flagship
build is PrismAI (its own site shows a "Prism" wordmark; Vidyut, Nov 12: the name here stays
PrismAI), with DuelWise as the second flagship. The research (arXiv:2607.21641, a preprint, never "published") is
evidence of an instinct, not the headline.

Three rules encode the thesis:

1. **Color is scarce, so it means something (three worlds).** There are three palettes, one
   per world, declared in `tokens.css`: `:root` is the galaxy (indigo ground, electric blue
   accent: the hologram's light, the hero, the ring); `[data-realm='sea']` is the sea (deep
   petrol ground, a sunlit-shallows cyan accent; Experience and Builds); `[data-realm='earth']`
   is the earth (warm basalt ground, bone text, an ember accent; the crew's panel and
   everything after it). Inside a world there is still exactly one accent, and it still means
   the active thing, the rule, the primary action and the graph ramp. Gold (`--win`) is for
   awards and nothing else, mint (`--ok`) means live or available, coral (`--bad`) is
   reserved, in every world. The atmosphere is the scene behind the page and nothing else:
   the beams on the first screen, then the water, then the land and sky. The one place with
   other colours is the Master Agents crew art. If you are about to add another glow, a
   gradient wash, a fourth palette or a second accent inside a world, stop and ask first.
   Tokens built from other tokens (`--win-bg`, `--badge-bg`, `--glass`, `--elev-*`, `--rule`)
   are declared again for `[data-realm]`, because a custom property resolves where it is
   declared. `<html data-at="sea|earth">` (written by `Background.jsx`) gives the nav the
   palette of the world under it.

2. **Claims come with receipts, and are never fabricated.** Every number traces to a
   source (the paper, the resume, a project repo or doc, Devpost, GitHub, or something
   Vidyut said). Unknown facts get a `TODO` comment in `content.js` or an empty value,
   never invented copy. Empty links are filtered out at render time, so a link that is not
   ready simply does not appear. Never call MVR "AI" (it has no LLM). BetterBill, Yinzone
   and Terrametric are team builds and say so. PrismAI's agency scope check and change
   orders are live since Oct 20 2026; its in-call private note is built but off, so it
   sits under "Now building". TransitGuard's demo is dead: never link it.

3. **No bare numbers.** A figure never stands alone. Every number sits inside a sentence or
   a label that says what it measures and where ("Cut ~40% of the team's recurring planning
   work", "22 of 22 seeded billing errors caught"). There is no proof band under the hero;
   the four highlights come after Builds, as complete sentences.

## Page order and the argument it makes

`src/App.jsx`, top to bottom:

| Section | Job |
|---|---|
| Welcome | His portrait, in its own colours in a round window of light, says hello (two lines and a cue); one scroll or a click turns it to light and plays it into the hero |
| Hero | The name beside his portrait (about 160px), lit from above by the beam field, and the orbit ring of builds |
| Vista: surface | The sea's surface in section; the reader dives through it. One line: "Under the surface: the work." |
| Experience (sea) | Where he has worked; every result is a complete statement. Moment: light shafts and caustics, and a sounding line whose weight sinks as the roles are read |
| Vista: giant | The amber ringed giant and the manta |
| Builds (sea) | Three flagship panels (PrismAI, DuelWise, SNAPBACK), the featured builds, the paper, the compact grid. Moment: a shaft of light finds the card under the pointer |
| Vista: shore | A whole screen: warm light, the camera rises through a second waterline into dusk on a desert shore. One line: "On solid ground: the proof." |
| Crew (earth) | The Now building panel (Master Agents, a character select screen with the crew's art), now its own `<section class="sec crew">`: the command post, with the mast, the lamp and one figure on the hill behind it |
| Highlights | Four one-line statements, after the stories they summarize, cut as four strata of rock (one column of beds, palest on top) |
| Vista: galaxy | Night: the spiral galaxy rises over the ridges |
| Proof of work | GitHub commit graph (ember towers), the nine wins (each hackathon win with a Devpost page links to it), four verification links |
| Principles | How he thinks about building (2x2 tiles that lean to the pointer) |
| Value | What that is worth to you (hairline rows). Moment: a moon that fills from crescent to full as the rows are read |
| Toolkit | The inventory: a label and a line of tools per group; the marks between tools are small stars |
| Contact | The ask: his studio headshot (the welcome shows the same studio headshot in a round window; the hero is a sunset silhouette), then the email as the hero of the section, at dawn on the limb of the earth |

Principles and Value are deliberately different shapes (tiles vs hairline rows) so they do
not read as the same module twice. Keep them visually distinct.

## The orbit ring (`components/Orbit.jsx`)

Twelve glass cards on an elliptical CSS 3D ring around the name, his strongest, in
Vidyut's order: PrismAI, DuelWise, BetterBill, MVR, Vytal, Match Day, Terrametric, the paper,
PrismKeep, FireSight, Fish Market, with SNAPBACK third (DuelWise added Nov 12, SNAPBACK Nov 15). Everything else lives only in Builds (Oct 28: fourteen
was too crowded). Each card is one link to its Builds entry (`#build-<id>`); a slide
`id` in `hero.carousel.slides` must equal the Builds entry id.

- One rAF loop writes transforms straight to the nodes (no React state per frame, no layout
  reads; `offsetWidth`, never `getBoundingClientRect`, because the latter includes the ring's
  own transforms). It asks for frames only while something moves.
- Geometry lives in the `--orbit-*` tokens (radius, tilt, yaw, shade, front lift, card width).
  `measure()` fits the radius to the scene width and the ring centre to the hero copy above it.
  Tuned for 11 cards (checked at 1600, 1440 and 1199 on Nov 12); adding or removing one means re-checking the sides.
- The front card is pushed toward the camera (`--orbit-front`) and carries the blue border and
  a progress line. Cards behind the hero copy go almost fully dark (`--orbit-behind`) and fade
  out whole (`--orbit-ghost`, written as `--vis`). "Behind the copy" is measured, not assumed:
  `measure()` reads the portrait's left edge and the name block's right end, and a card whose
  projected edge overlaps that span fades. A card is a thumbnail panel plus a caption panel; the
  caption panel (glass, border, text) is wiped away from its foot with a clip-path, never faded
  (`--cap` runs from 0 at a depth of 0.5 to 1 at 0.7; the panel and the thumbnail always share
  one opacity, so a card in motion is a shorter card, not a ghost; the text fades in the last
  quarter of the wipe). The side cards that rest two steps from the front read as logo
  thumbnails, and the back half never shows empty boxes. `measure()` keeps every card at least
  16px inside the window at any width (it samples the ring's outer edge, yaw included) and, on a
  short window, eases the front lift until the control bar is on screen.
- Hover on a card pauses the ring (and lifts that card); focus inside stops it for good; only
  the front card is tabbable; ArrowLeft/Right step, Home/End jump; Pause, Prev, Next buttons.
- Below 960px wide or 640px tall the ring is hidden and `Drift.jsx` stands in: the same
  thumbnails as two rows drifting in opposite directions on a plane tilted back into the
  beams, dimmed (`--drift-*` tokens), faded at the edges, `aria-hidden`, no captions, links
  or controls, static under reduced motion. It is atmosphere, not a list: on a phone a
  captioned card row read as the Builds section twice (Vidyut, Oct 2026). Under
  `prefers-reduced-motion` the ring renders one static pose with no rAF and no Pause button.
- The ring stays `opacity: 0` until the script has posed it (`data-ready`), so the
  prerendered HTML never shows eleven stacked cards.

## The background (`components/Background.jsx`, `BackgroundField.jsx`)

A fixed stack behind the page: a CSS glow, a CSS fallback of the beams, a 2D canvas of vertical
light beams (indigo, blue, violet) and a 2D canvas of stars. Each beam is pre-rendered once
into its own offscreen canvas (the blur is applied there) and composited per frame with
`lighter` and a slowly breathing alpha: about 24 fps, a dozen `drawImage` calls. Positions are
seeded, so the field is the same on every load. Scroll sets `--bg-y` and `--bg-fade` on `.bg`;
CSS turns them into parallax (transform only) and a fade to nothing after the first screen,
and the loop stops once the layer is invisible, when the tab is hidden, and under
`prefers-reduced-motion` (drawn once, no shimmer, no parallax). Colors come from
`--beam-a/b/c` and `--star-a/b` in `tokens.css`. No WebGL, no dependency.

### The welcome hologram (`components/Welcome.jsx`, `Hologram.jsx`, `lib/holoScene.js`)

The first screen (Nov 12 2026, Vidyut's idea: "a 3D face of me made of blue light" that greets
the visitor, then becomes a ball of energy that gives way to the page). `Welcome.jsx` is the
HTML: an empty box for the face, the greeting, the cue. `Hologram.jsx` draws the face into the
fixed background stack with plain WebGL (no three.js).

**The face is not blue light any more (Nov 15 to 16, Vidyut: the realistic blue version "looks
like a bloody horror thing... make me look nice").** It is a portrait: the studio photograph
itself, crisp, on its own backdrop, inside a round window. Points assemble him at the start
and take the picture apart when it lets go; it only becomes blue light then (the peel into
the planet). How that was decided, so
nobody repeats it: eleven stills (two of them controls) were judged cold by three model
families (friendly and creepy, 1 to 10). Every face made of blue light (the realistic stipple, a hood of light, an engraved
hatch, a painterly glow, each also tried with warm skin) was called ghostly, spectral or
uncanny; his real photo cut out on the dark ground was too; his own colouring in a lit, framed
picture scored within a point of the untouched headshot with the two judges that could tell
images apart (built portrait: friendly 8 to 9, creepy 1 to 2; headshot: 8 and 1). The third, Gemini flash-lite, scored the untouched
headshot creepy 6, so its scores carry no information here. A first build drew the portrait
with the points alone: friendly, but every judge called it soft and low-resolution. So the
photograph itself is now shipped as a texture (the conductor's decision, Nov 16: the headshot
is already public at Contact). Do not go back to a face of monochrome light, a hood, a halo
ring, a cut-out head on the dark ground, a dissolving bust, or glowing eyes: each was named
as the eerie part by a judge.

- Everything is baked offline by `scripts/bake-hologram.py` from the studio headshot
  (`~/Portfolio-notes/design/portrait-1200.jpg`; the Contact files in `public/` are only 480px
  and are not registered to the points, so they are not the source) into `public/holo/`:
  `face-1024.webp` (47 KB) and `face-512.webp` (15 KB, a phone's), the square the round window
  sits in; `face-a.bin` (18,000 points, 141 KB, all a phone downloads) and `face-b.bin`
  (24,000 more, 205 KB, the fill-in a desktop adds). Eight bytes a point: position, real
  depth (Depth Anything V2 Small, so the head can turn), a colour from the photograph (5-6-5
  bits, in the same grade as the texture), how solid it is, and the spacing to its
  neighbours. Re-run the script by hand if the portrait changes (torch and transformers; the
  measurements at its top are for that source).
- Scroll is the timeline, counted from the top of the page to the hero (`lib/origin.js`,
  `heroOrigin()`): the face peels into a small planet of light (0.04 to 0.37), the planet has
  the window to itself over the empty run under the greeting (`--welcome-run`) and says its
  line (typed 0.41 to 0.57), then its light pours onto the orbit ring (0.68 to 0.86) and fades
  (0.92 to 1), all gone when the hero sits under the nav (the cue's glide stops there; measured
  Nov 15 on the canvas alone: no lit pixel at the hero at 1440 or 390). The canvas is fixed, so the light
  stays in the window while the page leaves. The cue is a real link to `#top`; with scripts it
  glides there in 5.6s (`GLIDE_MS`) and any wheel, touch or key hands the scroll back.
- The greeting is prerendered text and is the LCP element. It waits dim (`--say-idle`), and is
  typed in steps while the face draws (`html[data-holo='in']`; "seen" after, or at once for a
  visitor who watched it this session; "late" if the hologram says nothing for 3.6s; "off"
  without WebGL, which closes the screen up to the greeting). Never hide the text to reveal it.
- Everything that used to count from the top of the page counts from `heroOrigin()`: the beam
  fade, `--bg-y`, The Deep's fade and its chunk request, so the hero and the ring behave as
  before. The beams are lit at `--welcome-beams` behind the face and rise to full as the hero
  arrives (`--bg-open`).
- Budget: mounted when the page is idle, after first paint; DPR capped at 1.75 (1.5 on a
  phone); a phone fetches and draws the base tier only; it draws every frame only while the
  scroll moves or the face is being drawn, about 30 a second otherwise, and not at all past the
  hero or in a hidden tab. Mobile Lighthouse on the production build measured 96, 98 and 97
  with the photograph in place (Nov 16), and the greeting was the only LCP entry at 390 and
  1440 (read with a PerformanceObserver: Lighthouse 12.2.1's own LCP-element audit errors on
  this machine). The chunk is 12.9 KB gzipped.
- Under `prefers-reduced-motion` it is one still frame that scrolls away with the page: no
  drawing in, no typing, no ball, no empty run.
- **How the portrait is drawn.** At rest: the photograph, on a mesh (96 by 96) that has the
  points' own depth, so it turns with his head exactly as they would; not one point is drawn.
  The image is loaded by script and lives only in the canvas, never in the page, so it cannot
  become the largest contentful paint (checked: the greeting is still the only LCP entry). The
  mesh reaches a little past the window's rim (the backdrop stands behind the picture plane,
  so in perspective a mesh no wider than the window showed flat cuts at the sides). The window
  is cut to the pixel in the fragment shader and has one quiet hairline at its rim, no glow.
  Nothing is painted before he arrives (an empty grey disc used to show for half a second).
  **Assembling:** from his eyes outward, points first and the photograph a beat behind them;
  where the photograph has arrived the points step back. (Nearest-to-the-viewer first was
  tried: for a third of a second it showed a face with holes for eyes.) **Letting go:** from
  the outside in, the centre of his face last; the photograph fades from a place exactly as
  its points take off from it, each point showing itself the moment it moves, in the colour
  the picture had there, so the picture is never swapped for a softer copy: it is taken
  apart. (No "eyes last" rule: two crisp eyes left hanging alone would be the wrong picture.)
  Points are painted, not added, while they are picture (premultiplied alpha: a point writes
  its coverage as paint and none as light, so one blend mode serves both), backdrop points
  first and his after. If the photograph fails to load, the points are the picture, soft, as
  in the first build. No light of ours falls on him: the photograph's own is the flattering
  one. The glow pass runs only once light exists. Lessons that still hold: a splat's size is
  the mean distance to its six nearest neighbours; `half` and `out` are reserved words in
  GLSL ES, a uniform shared by a vertex and a fragment shader must have one precision, and a
  shader that fails to compile or link turns the scene off silently (`data-holo='off'`; in
  dev the reason is logged), so a screenshot script must refuse to run when it sees that. He
  breathes and looks slowly from side to side and a little toward the pointer; the head turns
  on the neck as one piece and the backdrop stays put (it sits on the turn's axis).
- **The contract with the entry beats** (`lib/face.js`; the v3 entry is another lane's). The
  portrait keeps `<html data-holo>` (`in`, `seen`, `late`, `off`). It publishes its box and seed
  point on `<html>` as `--face-rect-x|y|w|h` and `--face-seed-x|y` (document pixels; also the
  `face` export), from `Welcome.jsx` at mount, so they exist before the points load; they are
  cleared when there is no portrait (`off`). It reads `--face-out` (0 to 1) from `<html>`'s
  inline style each frame: when set, that drives how far the light has left, and the planet
  forms on the seed (the middle of the window across, 58% down the box); when it is removed
  the scroll drives it again. Checked Nov 16: at `--face-out: 1` the planet's lit extent is
  centred within 13px of the seed at 1440 and 1px at 390, and removing the property restores
  the picture (re-checked with the photograph in place). The box is the round window's
  bounding square. The portrait has its own dissolve (the photograph is taken apart into
  points, see above), so the spec's fallback (scaling the canvas toward the seed) is not
  needed. The planet it becomes has no ring; the v3 spec's "ring opens" beat assumes one,
  and that is the entry lane's to settle.
- **The ball is a small planet with no ring** (the one ringed planet on the page is the giant
  in the sea): a shell of points of the page's blue light, lit from the upper left (a day side, a soft
  terminator, a bright limb) round a faint core. The face peels into it from the outside in:
  hair and shoulders first, the eyes last. When it speaks it swells with the words and a
  ripple runs over it (`uSpeak`).
- **The hand-off: the light lands on the builds.** `Orbit.jsx` publishes the ring's geometry
  in `lib/ring.js` (centre, radii, tilt, perspective, card size, how far it has turned, and
  each side card's turn and lean); that is the only thing the hologram knows about the hero.
  The planet's points go up and out in two curtains to the sides of the window, fall there
  outside the copy, dip under the cards and well up onto the edge of each thumbnail, framing
  the five cards at the front of the ring, then fade. Three things keep the light off his
  name, and all three were needed (each was measured on the canvas alone, with the page
  hidden; a contact sheet is too small to see it, and for a long while the light did cross
  the name unnoticed): only the front five cards are targets (the back ones sit behind the
  name, so light sent to them flew over it); the pour is quick and the planet lifts as it
  empties, because the name is rising toward it; and, as a guarantee rather than a tuned
  path, the shader gives no light to any point whose splat would touch the hero copy's real
  box that frame (`uCopy`, read from `.who-main`). Measured Nov 15 at twelve scroll steps
  across the pour, at 1600, 1440, 1199 and 390: no lit pixel on the name or anywhere in the
  copy block. The cards are solid and in front of the canvas, so light that landed on a
  card would be hidden: it lands round them. The landing formula (with each side card's
  turn and lean) puts the thumbnail's corners within 0.3px of the real ones at 1600, 1440
  and 1199 (checked in JS against the DOM; the shader is a line-for-line port). Re-run both
  checks if the ring's geometry or card count changes. On a phone the copy fills the window, so the light goes out
  at the planet and comes up again on the two drifting rows (`.drift`).
- Past the hero the canvas is cleared once (a nav jump used to leave the last frame of the
  ball and a half-typed line on screen).
- Tried and dropped: the face inside the ring behind the hero copy (the shield hides it, or it
  hurts the name) and in the portrait's slot (a 190px thumbnail with no room to transform).
- No film or show names, logos or assets anywhere near it; it is his own face, in his own colours.

Run 4 (Nov 12 2026, Vidyut's notes while watching it live):

- **A pure first screen.** On load the window shows only the face, the greeting and the cue.
  The nav is in the DOM but out of sight until the reader is half way through the hand-off
  (`Nav.jsx` sets `<html data-nav="on">`; CSS hides it only under `html.js`, never when the
  hologram is off, never while something in it has focus, so the skip link and Tab reach it).
- **The face is calm and anatomical.** The head turns on the neck (the turn is weighted by
  height, the axis runs behind the face, the shoulders stay put), about eight degrees each
  way on one slow sine; the relief is shallow (0.09) so the skull never pushes out; the jaw
  eases while the greeting types. No row slips, no flicker: he read those as an eye glitch.
- **His work comes to him like thoughts** (run 5). At the sides of the first screen, never
  touching the head, six small soft holograms (`welcome.hub`: PrismAI, DuelWise, BetterBill,
  Terrametric, a Master Agents portrait and the "5× hackathon winner" readout) take turns:
  each phases in from a blur with a short shimmer, holds and bobs, and phases out upward as
  the next appears, two or three in sight at once (`hub-think`, all CSS). `Hologram.jsx`
  writes `--head` so they drift a few pixels with his turn. A phone keeps four in the corners.
  Two earlier versions were cut: crew cards orbiting his head ("not the best") and panels
  wired to his head by lines ("weird"). No lines to his head or body, no panel over the face
  or the greeting.
- **The ball speaks.** Once the face is a ball, `welcome.ball` ("Here is what I have built.")
  types as a caption under it while the ball pulses with the words (`--speak`, `--speak-on`,
  `--ball-y`, written by `Hologram.jsx`); then its light pours onto the ring of builds. The cue's glide
  slows for a beat on the line (`BEATS` in `Welcome.jsx`); `--welcome-run` is 70svh so the
  hero arrives under it. A version where the ball opened into the words was cut: it must read
  as speech.
- **Nothing follows the reader down the page.** A spark that survived the burst and rode the
  margin was cut in run 5 ("nonsense": it crossed his name and sat on the planet). Do not add
  a wandering guide back; anything that moves needs a place and a reason.

### The three worlds (`components/World.jsx`, `lib/worldScene.js`, `lib/worldBackdrop.js`, `components/Vista.jsx`)

Below the hero the page is one descent (Nov 15 2026; it grew out of "The Deep", Nov 12). One
WebGL canvas in the fixed stack, drawn with three.js 0.170.0. Research and reasoning:
`scratchpad/overhaul/research.md` in the session that built it (igloo.inc for one continuous
place, Cargo for a depth grade and god rays, Immersive Garden for landscape as flat painted
planes, Bruno Simon's 2025 folio for a personal world with its own day cycle).

- **Two full-window passes do the worlds** (`worldBackdrop.js`). BACK is drawn first, under
  every object: nothing above the sea's surface (the canvas is clear there, so the hero's
  beams and stars show), the water below it, and the sky of the earth once the camera is up.
  LAND is drawn last, over every object, so the sun, the moon and the galaxy set behind the
  ridges. Both work in CSS pixels from the top left of the window.
- **Two waterlines are the only hard edges.** `uTop` is a place in the page (the `surface`
  vista, 36% down it) and leaves through the top of the window: the dive. `uExit` comes down
  from the top of the window over about half a screen of scroll as the `shore` vista arrives:
  the camera rising. While it is on screen the land stands on it (`uBase`), an over and under
  split shot. Everything else is a grade.
- **The sea.** A grade from just under the surface (`--sea-shallow`) to the deep
  (`--sea-abyss`) over a screen and a half; the hero's blue beams carry on down as the first
  shafts (`uBeam`), so space bleeds into water; caustics (four steps, three on a phone) only
  where there is light. In it: marine snow (clipped to the water), the amber ringed giant
  (`--giant-*`: a warm world in teal water is the page's one complementary contrast), the
  manta, medusae in the margins of Builds, a school of light fish under the shore. In the
  last screen and a half the low sun reaches the water (`--sea-warm`, `--sea-ray-warm`).
- **The earth.** Sky: dusk to night to dawn (`uDusk`, `uDawn`, the `dusk`/`dawn` tracks in
  `layout()`): golden hour at the shore, the last light as the crew's panel leaves, night by
  the galaxy vista, first light from Contact. A flat pale sun (a screen print's disc), stars
  that come out with the dark, one meteor at night. Land: five flat planes (sharp far range,
  mesas and buttes, hills, dunes, the ground underfoot), each paler toward its foot where the
  mist lies, far planes in the colour of the air (`--ridge-far`), near ones umber (`--ridge`).
  They drift sideways with the scroll, near planes faster (`uDrift`). `uLand` (the `land`
  track) stands the land tall at the shore and the galaxy and sinks it to a low band while
  the reader reads; it is gone at the foot, where the lit limb of the earth rises.
- **The command post** (Vidyut: "mountains, a commander, Master Agents in that world"): on
  the hills plane, a mast with a lamp that breathes and one figure beside it, drawn as signed
  distance shapes in the LAND shader. About 60px tall, shown only while the land stands tall
  at dusk. It is a place, not a mascot: it does not move or follow.
- **The moon** stands far back (z = -2600), so it crosses the window slowly through Value, in
  the right margin; its light turns with the scroll, a thin crescent at the heading and full
  by the last row.
- One unit is one CSS pixel on the plane z = 0 and the camera sits at y = -(scroll + half a
  screen), so depth is parallax. A `<Vista set="surface|giant|shore|galaxy|horizon" />` is an
  empty window in the page; `layout()` reads their places and builds the tracks, and runs
  again whenever the page height changes.
- Less but more still holds: the reading sections (`QUIET`) are near-empty, the medusae are
  gone a screen and a half before the shore, the land is a silhouette behind text. Do not
  raise the counts; make one better.
- Text stays readable the same three ways (margins, the calm ground `.sec::before`, the ink
  halo); `--world-calm` is 0.4 in the sea (a heavier ground reads as a box in bright water)
  and 0.62 elsewhere. The crew section has no calm ground (its panel is its own).
- Budget: the chunk (about 47 KB of scene code plus three.js) is requested on the first
  scroll, never before the first paint. It draws only while visible, about 30 frames a second
  idle. DPR capped at 1.75 (1.5 on phones). `worldFade` brings the canvas up in the first
  fifth of a screen after the hero starts to leave.
- **No moving world:** under `prefers-reduced-motion` the scene draws nothing
  (`<html data-world="still">`), and without WebGL it is `off`. In both, and before the chunk
  has loaded, every section paints a still ground in its own world's colours (the STILL
  GROUNDS rules at the top of `sections.css`, `--ground-*`), the two waterline vistas shrink
  to their line of text, and the other vistas close.
- Do not add another WebGL canvas. The welcome hologram is the one exception.

In Proof of work, `Skyline.jsx` stands the commit graph up into 3D towers as it scrolls in
(height is count^0.4, colour ranked within the year; the tooltip keeps the exact count). It turns
in as it rises and comes to rest square to the reader, with the camera far enough back that
every tower stands upright (Vidyut, Nov 12: "why is it not straight"). The flat
SVG stays as the accessible image. Principles tiles lean a few degrees toward the pointer
(`useTilt`, mouse only).

## One shape language: cut corners

The panels share the Master Agents edge: a corner is cut, not rounded (the CUT CORNERS block
near the end of `sections.css`). The flagships, the paper, the Proof of work cards and the
Highlights slab lose two corners (top left, bottom right, `--cut-lg`, `--cut-md` on a phone);
featured cards, compact cards and Principles tiles lose one (bottom right). The cut edge is a
1px diagonal drawn in a background tile, because a border cannot follow a clip-path; a clipped
panel has no outer shadow. Media frames, buttons and badges keep their soft radius. Value and
Toolkit stay hairline rows with no boxes.

Reading sections are airy on purpose (Nov 12: "crowded, cramped"): Experience outcomes are a
plain list behind accent ticks, not pills; Toolkit is a mono label and a line of tools with dot
separators, not forty chips; rows are padded 36 to 56px.

## Master Agents (`components/NowBuilding.jsx`, `builds.building`)

The Now building panel is the loudest section on the page on purpose (Vidyut, Nov 12: the old
one was "bland, one color, rounded-edge AI look"). It is a character select screen: cut
corners instead of round ones (`--cut-*`; the frame is a 1px gradient the inner panel covers,
because a border cannot follow a clip-path), the title at `--fs-mega`, the one sentence drawn
as a prompt that runs through the crew to a reviewed branch, then a stage with one character
large, lit by a blurred copy of their own art, with the previous and next in the wings. The
roster of fourteen is a tablist (arrow keys, Home and End; hover and click choose); until
someone touches it the stage walks the roster while it is on screen, never under reduced
motion. Below: routing, the council, the loop, then four labelled facts.

Art is `/agents/<id>.webp` (294px) and `-148`, cropped from the crew's roster sheet (the
source is 300px a portrait, so the large card is a little soft on a retina screen; ask Vidyut
for larger art before making it bigger). Every claim there was confirmed by Vidyut on Nov 12
2026. It stays labelled "Now building", has no link (private repo) and never compares the
crew with anyone else's agents.

## Proof of work (`components/ProofOfWork.jsx`)

The commit graph is drawn from a build-time snapshot. `scripts/fetch-github.mjs` (the
`prebuild` step) writes `src/data/github.local.json`, which is gitignored (GraphQL if
`GITHUB_TOKEN` is set, else the public contributions page; it validates first and never
fails the build offline). The committed `src/data/github.json` is the fallback, so a plain
build never dirties git. Copy `github.local.json` over `github.json` when you want a
fresher committed snapshot. There are no runtime third-party calls. Every GitHub number on
the page is computed from that JSON, never typed in. The graph is five `<path>`s, one per
level, with a hover tooltip read from pointer coordinates. There is deliberately no monthly
ramp: a chunk of the early PrismAI commits used an email GitHub does not link, so the months
before May under-count his real work.

## Build and prerender

`npm run build` runs three steps: `vite build` (client bundle), `vite build --ssr
src/entry-server.jsx --outDir dist-ssr` (gitignored), then `scripts/prerender.mjs`, which
renders the app to a string, writes it into `dist/index.html`, inlines the stylesheet and
marks the module script `fetchpriority="low"`. The first paint therefore needs no JavaScript;
the client hydrates the same markup (`main.jsx` falls back to `createRoot` in `npm run dev`).
Rules that keep hydration clean: nothing reads `window` or `matchMedia` during render
(`useMediaQuery` uses `useSyncExternalStore` with a `false` server snapshot), and nothing
random or time-based renders. Fonts are self-hosted in `public/fonts` and declared in
`tokens.css`; the two that paint the first screen are preloaded in `index.html`.

## Architecture rules

**Content and design never mix.**

- `src/data/content.js` is every word on the site. No styling, no JSX.
- `src/styles/` is every visual decision. No copy.
- `src/components/` is structure only. Components read from `content.js` and apply
  classes from `styles/`. Almost no hardcoded strings.

Editing copy means touching `content.js` only. Editing looks means touching `styles/`
only. When a change genuinely needs both, say so before starting.

**Styles are three layers, loaded in this order** (`src/main.jsx`):

1. `tokens.css`: the control panel. Fonts, colors, type scale, spacing, depth, ring geometry,
   motion. Everything downstream consumes these. Prefer changing a token over adding a rule.
2. `base.css`: reset, element defaults, shared primitives (`.wrap`, `.sec`, `.eyebrow`,
   `.sec-head`, `.btn`, `.badge`, `.metrics`, `.links`, `.reveal`).
3. `sections.css`: per-region layout, ordered top to bottom to mirror the page.

**Never hardcode a color, font, or radius** in a component or in `sections.css`. Use a
token. If one does not exist, add it to `tokens.css` rather than inlining a hex.

**One camera for the whole page.** Every raised surface shares `--persp`, one top highlight
and the `--elev-1/2/3` scale; `.reveal` rises out of the same perspective; media frames stay
flat (the 3D objects are the ring, The Deep, the commit skyline and the wings of the Master Agents stage). Keep it elegant: depth is a few degrees and a few
shadows, never a spin.

## Type

Three faces, three jobs, self-hosted (latin subset), all SIL Open Font License, chosen on Nov
15 2026 so the page has a voice of its own (Geist, Geist Mono and Instrument Serif were
retired as the look of every generated page):

- **Brygada 1918** for display (the name, h2s, card titles, every big number, the email): a
  Polish text face cut in 1918 and revived in 2018. Sturdy strokes, wedge serifs that look
  carved, lining figures, a real italic; rare enough to be his. Two static files, roman and
  italic at weight 400 (about 14 KB each). There is no bold: never set `font-weight` above
  400 on the display face. Fraunces was tried first and dropped the same night: the
  impeccable detector lists it with Inter and Geist as a face generated pages converge on.
- **Schibsted Grotesk** for UI and body (variable 400 to 700).
- **Spline Sans Mono** for labels, nav, buttons, badges and stack lines (variable 400 to 600).

## Conventions

- Class names are plain and region-prefixed (`.build-title`, `.xp-row`, `.card-link`).
  No BEM, no utility soup.
- `content.js` has a `worlds` export: the two lines on the waterline vistas.
- `**double asterisks**` in `content.js` render as emphasis via `<Rich>`. That is the
  only markup supported; don't add a markdown dependency.
- Build images ship as `/builds/<id>.webp` (1200px) plus `-640` and `-900` variants; `Media`
  builds the `srcset`. Ring images are 640px in `/builds/ring/`, each with a `-320` variant for the desktop ring. The portrait ships as `portrait-180.webp` and `portrait-360.webp` (1x and 2x). Every build has a logo-led
  thumbnail; the paper, TransitGuard and AlgoQuest use the finder's compositions, not
  screenshots. Never use a frame that shows personal info.
- Breakpoints in use: 1100, 960, 760, 640, 560, 460, plus the ring's own
  `(min-width: 960px) and (min-height: 640px)`. Reuse them; don't invent more. Three
  complements of those are allowed so a range has no overlap: 961, 761 and 561 (one above
  the listed value), 959.98 (just under 960), and 1199 for the narrow-laptop ring (the
  upper end of the 960 to 1199 band).
- Type sizes use `clamp()` and are already fluid. Never add a media query for font size.
- Animation state on a DOM node goes in a `data-*` attribute (`data-state`, `data-mode`,
  `data-ready`, `data-delay`), styled with attribute selectors.
- No em dashes or en dashes anywhere (copy, code, comments, commits). Ranges use "to".

## Quality floor: verify before calling anything done

- Works down to 360px wide with no horizontal scroll (`scrollWidth == clientWidth`).
- Keyboard focus visible everywhere (`:focus-visible` styled in `base.css`); targets at
  least 44px.
- `prefers-reduced-motion` respected: static beams, static ring pose, no reveal, no
  rAF loop. Any new animation must do the same.
- WCAG AA contrast on every text and surface pair (Lighthouse accessibility 100).
- `npm run build` and `npm run lint` both pass; Lighthouse performance 95+ on mobile,
  accessibility, best practices and SEO 100.

## Commands

```bash
npm run dev      # dev server, hot reload (client-rendered)
npm run build    # prebuild (GitHub snapshot), client build, SSR build, prerender
npm run preview  # serve the production build
npm run lint     # oxlint
```

## Open TODOs

Search the repo for `TODO`:

- Match Day: build dates, solo or team role line, and the stack line
- Vytal: confirm the "Jul 2026 to Present" dates are still current
- A silent screen-recording loop of the new PrismAI UI for the flagship (`media.video` is empty; `Flagship.jsx` does not render video yet)
- Source links for the paper, MVR, Match Day and Vytal (private repos today)
- Yinzone and BetterBill "Live site" links (Vidyut is sending them; hidden until then)
- `public/og-card-v8.jpg` is the link-preview card (1200x630, headshot, Indigo, "5× hackathon winner · 6 first places"); bump the filename and re-render it
  when the headline facts change

## Things deliberately left out

Don't add these back without asking:

- Phone number. It is on the resume; a public page is a scraper magnet.
- An "Objective" or "Summary" section. The hero does that job with more force.
- Testimonials, a blog, a visitor counter, a "currently listening to" widget.
- Skill percentage bars. Nobody is 87% at Python.
- A dark/light toggle. The design is committed to one mode; pick a side.
- GitHub stars or follower counts (zero followers, zero to two stars). Use the commit graph.
- A proof band of bare numbers under the hero (see rule 3), and any halo or nebula.
- Alltr (not his project) and TransitGuard's dead demo link.
- A second WebGL layer (the three-worlds scene is the one), and any effect that reads as an effects reel.
- Geist, Inter, Instrument Serif or a system font as the identity; glass cards or blur scrims behind text (Gemini suggested them twice on Nov 15; the calm ground does that job).

## Later rounds: layout rules worth keeping

- Cards in a row have one height and aligned fields (Vidyut's rule, Oct 2026). The six
  featured cards are pairs; each card is a `subgrid` on the same seven rows (media, kind,
  title, one-liner, results, links, read more); the role line and the stack open inside
  Read more (Oct 28: shorter cards, a catchy one-liner does the hooking), so every field starts on one
  line across the pair and a field one card lacks leaves its row empty. "Read more" (a
  native `<details>`, so the text stays in the HTML) is the LAST row, at the card foot:
  opening one story grows that row in both cards, and the row mate gets padding at its foot,
  never a hole between its fields. Do not move it back above the stack. Do not restore
  `align-items: start`. Section padding is `--sec-y` (56 to 100px); the page is about
  12,600px at 1440.
- Every card in a lane is one width and one height, across rows too (Vidyut's rule, Oct
  2026). More builds is an 8-column grid of eight cards, each span 2, two rows of four (3 + 3 + 2
  on six columns below 1100 with the last two centred, four rows of two below 760, one
  column below 560). The featured grid is 4 columns with each card span 2, so an odd last
  card (FireSight today) sits centred at the same width. Compact cards show gold award
  badges too (PrismKeep). Each card is a subgrid on six rows (media, kind, title, one-liner, links, read
  more); the role line opens inside Read more. `useEqualRows` reads the natural track sizes and writes the tallest of
  each (all but Read more) to `--tracks`, which both grids use as `grid-auto-rows`, so the
  three featured rows and the two More builds rows match. Read more stays auto: opening a
  story grows only its own row. A row without a field (Vytal and Match Day have no metrics)
  keeps that row's space, so its stack and links sit on the same line as the other rows'.
- Images are flat and straight: build thumbnails and stills never carry a 3D angle, and
  `Media` has no pointer tilt. Only the orbit ring is 3D.
- The PrismAI lead still contributes no height of its own on desktop (`contain: size`, a
  268px floor): the story sets the row height, the still crops (cover, top left) to fit,
  and the role line shares its bottom edge with the "Now building" box. Do not give the
  still its natural height back: it opens a 140 to 150px hole in the story column. The
  paper's stack and links sit on the foot of its left column.
- Below 960px the four section links become a second row of the sticky nav (`--nav-h` is 104px
  there, which `scroll-margin-top` reads), and the footer has a back-to-top link. On a phone
  that bar slides away while the reader scrolls down and returns on the first scroll up
  (`Nav.jsx` sets `data-hide`; keyboard focus inside it keeps it shown).
- A nav link lands with the section heading about 24px under the bar: `.sec` subtracts its
  own top padding (`--pad-top`) from `scroll-margin-top`.
- `.reveal` hides only under `html.js`; `index.html` sets `js` and removes it after 4s if
  `useReveal` has not marked `<html data-reveal>`, so prerendered content is never stranded.
- Mobile LCP (Lighthouse simulation) was 2.4 to 2.6s because the 85 KB bundle was requested
  before the first paint, and Lighthouse counts everything requested before the LCP entry.
  `scripts/prerender.mjs` now requests the bundle only after the first
  largest-contentful-paint entry (1.5s fallback), which measured about 2.0s. Do not turn it
  back into a plain `<script type="module">` in the head.
