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

4. **No vanity totals.** Commit and contribution totals, streaks and month counts are never
   headline figures (Vidyut: he can make 333 commits in three days). The graph is the evidence.

The colophon quotes Lighthouse runs measured on the production build (`colophon.lighthouse`
in `content.js`): every run in the batch, its date, never a floor that one run broke.
Re-measure when the build changes, or set it to null.

## Page order

`src/App.jsx`, top to bottom. The Chart names each place (`places` in `data/world.js`).

| Section (place) | Job |
|---|---|
| Welcome (The Threshold) | A hologram of him on a projector plate says hello: "Hey, I'm Vidyut." and "I build worlds. Reliable ones." Enter, or scroll, or Skip intro |
| Hero (The Landing) | His name, very large, the thesis, one plain line, Email me, Resume and links, beside a card with his portrait, status and place. No builds here |
| Vista: surface (The Waterline) | The dive. "Under the surface: the work." |
| Experience (The Sounding) | Where he has worked; a sounding weight sinks as the roles are read |
| Builds (The Deep) | Opener (the heading, the ringed giant, and under them the ring of twelve build cards as the index; the dot chart of all twenty on a phone or without scripts), three flagships as chapters, the fleet of eight featured plates, the paper with its repair loop, More builds as rows |
| Vista: shore (The Breach) | Inside Builds: the camera rises through the second waterline into dusk |
| Crew (The Camp) | Master Agents, a character select screen, and a run that holds at each gate |
| Highlights (The Cut) | Four sentences cut as strata of rock |
| Vista: galaxy | Night over the ridges |
| Proof of work (The Ridge at night) | The nine wins (gold plaques), the dragon on watch, the GitHub graph, four verification links |
| Principles (The Bench) | Four tiles, each with a small drawing that runs once |
| Value (Moonrise) | Hairline rows; a moon fills as they are read |
| Toolkit (The Inventory) | A label and a line of tools per group; a tool answers with the builds that use it |
| Contact (First Light) | The headshot, the email as the hero of the section, Copy email (dawn breaks and the dragon flies into it), then the colophon |

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
  **Today the figure is a stand-in** (his studio photograph, cut out). The avatar Vidyut is
  choosing (a friendly, magical figure of himself) replaces `public/holo/figure-*.webp`.
- **Never** a point cloud of his face (judged "scary"), never a plain photograph, never a
  frame or a box, never a row slip or any distortion of the picture (he read one as an eye
  glitch). The shimmer is brightness only. Check "friendly or eerie" with other model
  families, cold, against the plain photo as a control, before shipping a new figure.
- **One visual language.** The panels at the sides (`welcome.hub`) are projections of the same
  kind, in CSS (`v4-opening.css`): the same ramp, line pitch, frame split, cone and plate. They
  take turns, never touch the figure, and are `aria-hidden`.
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
that talks about projects? Isn't that the same as Builds?" The hero has no builds. It is his
name in two lines of the display face (`--fs-name`), the thesis, one plain sentence, the
credentials and the actions, and on the right a card: the portrait, the status, the place.
A phone stacks the card over the name. Do not put build cards, a ring or drifting thumbnails
back in the hero.

## The ring (`components/RingStage.jsx`, `Orbit.jsx`, `Drift.jsx`)

Twelve glass cards on an elliptical CSS 3D ring, on a plate drawn from the same projection
(one tick a card). It stands where it is an index, and `RING_HOME` in `data/world.js` is the
one line that picks where:

- `'builds'` (the default): at the top of Builds. The opener (heading, giant) is the ring's
  centre block and the front arc of the ring hangs under it (`mode="under"`): five cards in
  sight, the back half never shown, so nothing crosses the heading. Each card links to its
  Builds entry (`#build-<id>`; a slide `id` in `hero.carousel.slides` must equal the Builds
  id). It replaces the dot chart on a wide window.
- `'proof'`: in Proof of work, the whole ring turns around "Verify me in one click"
  (`mode="around"`), a card a win, each opening its public page; it replaces the plaques on a
  wide window. Built and screenshotted as the alternative; not the default because it repeats
  thumbnails (three Terrametric wins) and hides the gold plaques.

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

- One unit is one CSS pixel on the plane z = 0; depth is parallax. The scene reads the page:
  an element marked `data-world-anchor="<name>"` (names in `ANCHOR`, `data/world.js`) is
  where a piece lives, and layout runs again whenever the page height changes.
- **Pieces are drawn from data** and say so in Receipts (`BINDING`, `receipts()`): the giant
  (twenty builds: moons and ring lights), a small world per flagship (`flagWorlds.js`,
  counts from each flagship's `scene` in `content.js`, checked by
  `scripts/check-scenes.mjs`), the school (Fish Market), the camp's fires (one per agent),
  the constellation (one gold star per win), the moon (the Value rows), and the dragon.
- **Text stays readable.** Drifting things keep to the margins; every section paints calm
  ink behind its column (`.sec::before`, `--world-calm`) and the backdrop gives up its
  brightest values there (`hush()` in `worldBackdrop.js`). Both ramps are long (about 300px)
  and eased: a short ramp under the first waterline drew a dark box on the water. Re-measure
  contrast after changing either.
- The footer has no top line under the world: the limb fades into its ground.
- Budget: the chunk is requested on the first scroll (or after idle on a desktop), never
  before first paint; it draws only while visible; DPR capped; phones get fewer points.
  `scripts/check-budget.mjs` holds the chunk under its ceiling.
- Reduced motion: one still frame per place (`data-world="still"`). `?plain` or the World
  switch: no canvases and no world chunk at all. No WebGL: `data-world="off"`.
- Do not add another WebGL canvas. The hologram is the one exception.

### The dragon (`src/world/wyrm.js`, `wyrmStations.js`)

A creature of light whose body is the last year of weekly GitHub records: one vertebra a
week, girth and spike height from that week's count, seven day lights over each. It has five
stations and is nowhere else (nothing wanders without a reason): a glimpse under the first
waterline, one pass round the giant, the breach at the shore, the watch over the commit
graph, and the flight into the dawn when the email is copied.

- **The watch (Proof of work).** One vertebra over each week's column; the newest nine weeks
  rise as its neck, the head is held high looking out, the near wing is swept back and the
  far wing raised (a V), the tail curls up to fit the room it has. Laid flat it read as a
  lizard or a horse. On a phone, and on a laptop too narrow for columns plus head and tail,
  it is drawn whole between the gutters with the vertebrae closer together, and fuller.
- Its band is the `roost` anchor, rising past the note above it only where the note stops
  short of its tall half (`.pow-prov` is capped at 60ch for this), and never nearer than 8px
  under the win cards. It never relies on a keep-out box to stay off text. Measured Nov 16:
  zero lit pixels in text boxes at 360, 390, 1199, 1440 and 1600.
- The head is a blunt muzzle with a nostril bump and a heavy brow (`HEAD`); a long even
  taper read as a horse's skull. Bat wings, back spikes, legs with claws, horns, a tail barb.
  Fins, a sail or barbels read as a fish.
- Cold-read rule: before changing its silhouette, crop every station at 390 and 1440 and ask
  three non-Claude vision models "what creature is this?" with no hint. Nov 16: dragon first
  from at least two of three at all eight crops, no repeated source named.

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

## Proof of work (`components/ProofOfWork.jsx`, `Heatmap.jsx`)

The graph is drawn from a build-time snapshot: `scripts/fetch-github.mjs` (prebuild) writes
`src/data/github.local.json` (gitignored); the committed `github.json` is the fallback. No
runtime third-party calls. Every GitHub figure is computed from that JSON, and there is no
total. A ridge of buttes stands over the calendar, one a week. A phone crops the graph to
the latest half year and its label says "last 6 months" (only with the script: without it
the graph is whole and the label stays twelve). Choosing a week lights the dragon's vertebra.

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
- The avatar for the hologram (Vidyut is choosing it): drop it in as `welcome.figure`, then
  delete the stand-in `public/holo/figure-*.webp`
- No longer used and still in the repo: `public/holo/face-a.bin`, `face-b.bin`,
  `face-1024.webp`, `face-512.webp` and `scripts/bake-hologram.py` (the point cloud); delete
  them once Vidyut agrees
- `colophon.lighthouse` is null since the opening was rebuilt: measure the production build
  again on a quiet machine (two runs on a busy one read 89 and 98, LCP 2.3 s)
- Taste calls waiting on Vidyut: the ring's home (Builds or Proof of work); a shorter phone
  Builds (it would hide the one-liners); the shore camp's tents

## Things deliberately left out

Don't add these back without asking:

- Phone number. An "Objective" or "Summary" section. Testimonials, a blog, a visitor
  counter, a "currently listening to" widget. Skill percentage bars. A dark/light toggle.
- GitHub stars, follower counts, commit totals or streaks.
- A proof band of bare numbers under the hero, and any halo or nebula.
- Alltr (not his project) and TransitGuard's dead demo link.
- A second world canvas, and any effect that reads as an effects reel.
- A point cloud of his face, a plain photograph or a framed box on the first screen, a ball
  or any second act between the welcome and the hero, the ring or build thumbnails in the
  hero, lines to his head, panels over the figure, a wandering guide that follows the reader.
- Glass cards or blur scrims behind text (the calm ground does that job).
- Build cards of any kind in the hero.
