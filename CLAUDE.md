# CLAUDE.md

Context for Claude Code working in this repo. This describes the v3 site on branch
`overhaul` as of Nov 16 2026 (after judging round 6).

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
| Welcome (The Threshold) | His studio photograph in a round window says hello: "Hey, I'm Vidyut." and "I build worlds. Reliable ones." Enter, or scroll, or Skip intro |
| Hero (The Orrery) | The name, the role, Email me and Resume, and the ring of twelve builds standing on an engraved plate |
| Vista: surface (The Waterline) | The dive. "Under the surface: the work." |
| Experience (The Sounding) | Where he has worked; a sounding weight sinks as the roles are read |
| Builds (The Deep) | Opener (the ringed giant and a depth chart of all twenty builds), three flagships as chapters, the fleet of eight featured plates, the paper with its repair loop, More builds as rows |
| Vista: shore (The Breach) | Inside Builds: the camera rises through the second waterline into dusk |
| Crew (The Camp) | Master Agents, a character select screen, and a run that holds at each gate |
| Highlights (The Cut) | Four sentences cut as strata of rock |
| Vista: galaxy | Night over the ridges |
| Proof of work (The Ridge at night) | The nine wins (gold plaques), the dragon roosting on the commit card, the GitHub graph, four verification links |
| Principles (The Bench) | Four tiles, each with a small drawing that runs once |
| Value (Moonrise) | Hairline rows; a moon fills as they are read |
| Toolkit (The Inventory) | A label and a line of tools per group; a tool answers with the builds that use it |
| Contact (First Light) | The headshot, the email as the hero of the section, Copy email (dawn breaks and the dragon flies into it), then the colophon |

Principles and Value are different shapes on purpose (tiles vs hairline rows).

## The entry (`components/Welcome.jsx`, `shell/entry.js`, `Hologram.jsx`, `lib/holoScene.js`)

- The face is his own photograph in its own colours, in a round window: friendly first,
  never eerie. Every monochrome or glowing version of a face read as a ghost and was cut.
  No lines to his head, nothing over the face or the greeting. His work stands beside him as
  small thoughts (`welcome.hub`).
- The greeting is prerendered text and the LCP element. Never hide it to reveal it.
- Scroll is the timeline; Enter plays the same timeline on a clock (`KNOTS` in
  `Welcome.jsx`): the light lets go (a full second, so the photo and its points are seen
  together), gathers to a ball, the ball says `welcome.ball`, a ring opens out of it, and the
  points land on the ring's cards as the hero sets. Any wheel, touch or key hands the scroll
  back.
- Skip intro lands the hero at once and moves focus to the name (`.hero-name`,
  `tabIndex=-1`), so the next Tab is Email me.
- `--welcome-run` is the empty scroll under the greeting (70svh, 52svh on a phone, 0 under
  reduced motion).
- The hologram is a second, tiny WebGL context (plain WebGL, no three.js) that stops before
  the world starts. Points are baked by `scripts/bake-hologram.py` into `public/holo/`.
- Reduced motion, `?plain` and no WebGL: a still portrait, no beats, Enter is a plain anchor.

## The Orrery (`components/Orbit.jsx`, `Drift.jsx`, `shell/PlateArc.jsx`)

Twelve glass cards on an elliptical CSS 3D ring around the name, on a plate drawn from the
same projection (one tick a build). Each card links to its Builds entry (`#build-<id>`); a
slide `id` in `hero.carousel.slides` must equal the Builds id.

- One rAF loop writes transforms straight to the nodes; `offsetWidth`, never
  `getBoundingClientRect`. It asks for frames only while something moves.
- Only the front card shows its call to action and progress line; a card one step round
  shows none (at a third of full opacity it read as a disabled link). Cards behind the hero
  copy fade whole; captions wipe with a clip-path, never fade.
- Hover pauses, focus stops it; only the front card is tabbable; arrows step, Home and End
  jump; Pause, Prev, Next.
- Below 960px wide or 640px tall the ring gives way to `Drift.jsx`: the thumbnails as two
  dim drifting rows over the plate's near rim, `aria-hidden`, no captions or links. It is
  atmosphere, not a list: a captioned card row on a phone read as Builds twice (Vidyut, Oct
  2026). Do not put captioned build cards in the phone hero.
- The ring registers the `orrery` binding for Receipts in both modes (in row mode from the
  plate's rim, measured on resize only).

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

### The dragon (`src/world/dragon.js`, `dragonStations.js`, `scripts/bake-dragon.py`)

A rigged, animated 3D model (Vidyut, Nov 16: the creature drawn from commit weeks "looks like
a dragonfly", he wanted a real dragon, much larger). It is no longer built from data and has no
Receipts line.

- **The model.** "Low Poly Ice Dragon" by xterryx, OpenGameArt, CC0 1.0
  (https://opengameart.org/content/low-poly-ice-dragon), credited under Credits ("Borrowed,
  with thanks", `contact.credits.borrowed`). `scripts/bake-dragon.py` (Blender, run by hand)
  applies the mirror, lengthens the wings, subdivides (two levels, one for the phone file),
  bakes three masks into the vertex colours (wing skin, occlusion, points) and writes four
  clips as functions of phase: Fly, Glide, Perch, Roar. Then `npx @gltf-transform/cli
  resample` and `meshopt` give `public/dragon/dragon.glb` (41k triangles, 552 KB, 306 KB
  gzip) and `dragon-lite.glb` (10k, 304 KB, 122 KB gzip; phones). No textures.
- **The look is a shader**, lit by the place it is in (`LIGHT` in `dragonStations.js`, from the
  page's palette and the `--dragon-*` tokens): plates with seams and a finer layer inside
  them, each plate a low dome, the wing's bones as ridges with the skin hanging between,
  light through the wing when the sun is behind it, the fire in the seams under the throat,
  caustics under water, distance haze. A depth-only pass is drawn first so a fade never shows
  the far wing through the near one.
- **Four stations and nowhere else.** One lap across the giant's face (scroll is the clock;
  it comes from behind the giant and goes back behind it); the breach as the reader comes up
  through the surface, then across the low sun; the roost (it flies in once, lands on the
  commit card, roars once, then keeps watch; choosing a week makes it look at that column);
  a low pass over the limb at Contact and, when the email is copied, the flight into the dawn.
- **It loads last.** Its code is a chunk of its own (`dragon-*.js`, GLTFLoader and the meshopt
  decoder), asked for by `World.jsx` only after the world has drawn its first frame and the
  page is idle (`<html data-dragon="on">` once it is in the scene). `?plain`, no WebGL and
  reduced motion never ask for it. Under reduced motion the roost band holds a still of it
  (`public/dragon/perch.webp`, a screenshot of `kit-demo.html`, see `src/world/demo.js`).
- **Text.** Its light is held inside the station's band and gives nothing inside the text
  boxes there (the same guard the pieces of light use). Measured Nov 16 with the dragon alone
  on black at 56 scroll steps and both the timed stations: zero lit pixels in a text box at
  1440 and at 390. The section's calm ground would lie over it at the roost, so `#verify`
  opens that ground over the band (`--roost-top`, `--roost-bottom`, written by the scene).
  Re-measure after moving a path.
- `kit-demo.html` (dev only) shows it alone: `?clip=`, `?light=`, `?yaw=`, `?still`.
- Cold-read rule: crop every station at 390 and 1440 and ask non-Claude vision models "what
  is this creature, and does it look impressive or cheap?" with no hint, with the rejected
  line-drawn version as a control.

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

- A flagship is a chapter (`.ch`): index line, a very large title, its own world glyph
  (`ScenePlate`), the descriptor, the one-liner (with receipts), one hero figure, links,
  then stills and the story. The three are told apart with the text hidden.
- The fleet: eight plates in pairs, one height by construction. A plate's dossier is the
  NEXT element, laid under the whole row, so opening one never changes a plate's height.
  Without the script every dossier is open. On a phone a plate is a row (small thumbnail,
  name, one-liner, links) and its results open with the dossier.
- More builds are rows with Read more (`<details>`).
- Height, measured Nov 16: 6,299px at 1440 (baseline 9,163) and 8,755px at 390 (baseline
  19,488). Keep it at or under these.
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
  shell), `v3-world.css`. `scripts/check-classes.mjs` fails the build when the shell sheet
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
- Taste calls waiting on Vidyut: a rim of light points round the resting photo on the first
  screen; a shorter phone Builds (it would hide the one-liners); the shore camp's tents

## Things deliberately left out

Don't add these back without asking:

- Phone number. An "Objective" or "Summary" section. Testimonials, a blog, a visitor
  counter, a "currently listening to" widget. Skill percentage bars. A dark/light toggle.
- GitHub stars, follower counts, commit totals or streaks.
- A proof band of bare numbers under the hero, and any halo or nebula.
- Alltr (not his project) and TransitGuard's dead demo link.
- A second world canvas, and any effect that reads as an effects reel.
- A face in monochrome light, lines to his head, panels over his face, a wandering guide
  that follows the reader down the page.
- Glass cards or blur scrims behind text (the calm ground does that job).
- Captioned build cards in the phone hero.
