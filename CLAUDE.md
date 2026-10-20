# CLAUDE.md

Context for Claude Code working in this repo.

## What this is

Personal portfolio for Vidyut Sriram, Penn State CS (graduating Dec 2026, available
Jan 2027), AI systems engineer. Audience: hiring managers and recruiters (forward-deployed
engineer and AI engineer roles). The page has one job: in sixty seconds, make someone
think "this person has done a lot, has won things, and is good at the job", then make it
easy to email him.

Stack: Vite + React 19, plain CSS with custom properties. No Tailwind, no CSS-in-JS, no
component library, no router. Single page. Runtime dependencies are react and react-dom
only. Keep it that way unless there is a real reason not to.

## The thesis: don't undermine it by accident

**"Vidyut Sriram builds safe, reliable AI systems."**

The name is the headline, literally: it is the hero h1, a white serif at the centre of the
first screen. The positioning is forward-deployed engineer and builder: someone who owns a
system end to end, modernizes workflows with AI, and sits close to the user. The flagship
build is PrismAI. The research (arXiv:2607.21641, a preprint, never "published") is
evidence of an instinct, not the headline.

Three rules encode the thesis:

1. **Color is scarce, so it means something.** The ground is deep indigo-black ("Indigo",
   see `tokens.css`). One accent, electric blue (`--acc`), means the front ring card, the
   progress line, rules, the primary action and the commit-graph ramp. Gold (`--win`) is
   for awards and nothing else. Mint (`--ok`) means live or available. Coral (`--bad`) is
   reserved for a defect state and nothing uses it today. The light beams are the only
   atmosphere; if you are about to add a second glow, a gradient wash or another accent,
   stop and ask first.

2. **Claims come with receipts, and are never fabricated.** Every number traces to a
   source (the paper, the resume, a project repo or doc, Devpost, GitHub, or something
   Vidyut said). Unknown facts get a `TODO` comment in `content.js` or an empty value,
   never invented copy. Empty links are filtered out at render time, so a link that is not
   ready simply does not appear. Never call MVR "AI" (it has no LLM). BetterBill, Yinzone
   and Terrametric are team builds and say so. PrismAI's agency scope-check and
   change-order loop is built but not live: it is always labelled "Now building" or
   "agency release, Dec 2026". TransitGuard's demo is dead: never link it.

3. **No bare numbers.** A figure never stands alone. Every number sits inside a sentence or
   a label that says what it measures and where ("Cut ~40% of the team's recurring planning
   work", "22 of 22 seeded billing errors caught"). There is no proof band under the hero;
   the four highlights come after Builds, as complete sentences.

## Page order and the argument it makes

`src/App.jsx`, top to bottom:

| Section | Job |
|---|---|
| Hero | The name beside his portrait (about 160px), lit from above by the beam field, and the orbit ring of eleven builds |
| Experience | Where he has worked; every result is a complete statement |
| Builds | PrismAI flagship, six featured builds, the paper, seven more (15 in all) |
| Highlights | Four one-line statements, after the stories they summarize |
| Proof of work | GitHub commit graph, the six wins (each hackathon win links to Devpost), four verification links |
| Principles | How he thinks about building (2x2 tiles) |
| Value | What that is worth to you (hairline rows) |
| Toolkit | The inventory, grouped chips |
| Contact | The ask: the email is the hero of the section |

Principles and Value are deliberately different shapes (tiles vs hairline rows) so they do
not read as the same module twice. Keep them visually distinct.

## The orbit ring (`components/Orbit.jsx`)

Eleven glass cards on an elliptical CSS 3D ring around the name, in Vidyut's order:
PrismAI, BetterBill, MVR, Vytal, Match Day, Yinzone, Terrametric, the paper, Quorum,
FilingWatch, NextRound. Each card is one link to its Builds entry (`#build-<id>`); a slide
`id` in `hero.carousel.slides` must equal the Builds entry id.

- One rAF loop writes transforms straight to the nodes (no React state per frame, no layout
  reads; `offsetWidth`, never `getBoundingClientRect`, because the latter includes the ring's
  own transforms). It asks for frames only while something moves.
- Geometry lives in the `--orbit-*` tokens (radius, tilt, yaw, shade, front lift, card width).
  `measure()` fits the radius to the scene width and the ring centre to the hero copy above it.
  Tuned for 11 cards; adding or removing one means re-checking the sides at 1440 and 1280.
- The front card is pushed toward the camera (`--orbit-front`) and carries the blue border and
  a progress line. Cards behind the hero copy go almost fully dark (`--orbit-behind`) and fade
  out whole (`--orbit-ghost`, written as `--vis`), and the captions of the whole back half fade
  to zero (`--cap`), so nothing shows through the text. `measure()` keeps every card at least
  16px inside the window at any width (it samples the ring's outer edge, yaw included) and, on a
  short window, eases the front lift until the control bar is on screen.
- Hover on a card pauses the ring (and lifts that card); focus inside stops it for good; only
  the front card is tabbable; ArrowLeft/Right step, Home/End jump; Pause, Prev, Next buttons.
- Below 960px wide or 640px tall it becomes a swipeable snap row. Under
  `prefers-reduced-motion` it renders one static pose with no rAF and no Pause button.
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
`--beam-a/b/c` and `--star-a/b` in `tokens.css`. No WebGL, no dependency. Do not add a third
canvas.

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
and the `--elev-1/2/3` scale; `.reveal` rises out of the same perspective; media frames tilt
toward a fine pointer (transform only) and are flat on touch and under reduced motion. Keep
it elegant: depth is a few degrees and a few shadows, never a spin.

## Type

Three faces, three jobs, self-hosted (latin subset): Instrument Serif for display (the name,
h2s, card titles, every big number, the email), Geist for UI and body, Geist Mono for labels,
nav, buttons, badges and stack lines.

## Conventions

- Class names are plain and region-prefixed (`.build-title`, `.xp-row`, `.card-link`).
  No BEM, no utility soup.
- `**double asterisks**` in `content.js` render as emphasis via `<Rich>`. That is the
  only markup supported; don't add a markdown dependency.
- Build images ship as `/builds/<id>.webp` (1200px) plus `-640` and `-900` variants; `Media`
  builds the `srcset`. Ring images are 640px in `/builds/ring/`, each with a `-320` variant for the desktop ring. The portrait ships as `portrait-180.webp` and `portrait-360.webp` (1x and 2x). Every build has a logo-led
  thumbnail; the paper, TransitGuard and AlgoQuest use the finder's compositions, not
  screenshots. Never use a frame that shows personal info.
- Breakpoints in use: 1100, 960, 760, 640, 560, 460, plus the ring's own
  `(min-width: 960px) and (min-height: 640px)`. Reuse them; don't invent more.
- Type sizes use `clamp()` and are already fluid. Never add a media query for font size.
- Animation state on a DOM node goes in a `data-*` attribute (`data-state`, `data-mode`,
  `data-ready`, `data-delay`), styled with attribute selectors.
- No em dashes or en dashes anywhere (copy, code, comments, commits). Ranges use "to".

## Quality floor: verify before calling anything done

- Works down to 360px wide with no horizontal scroll (`scrollWidth == clientWidth`).
- Keyboard focus visible everywhere (`:focus-visible` styled in `base.css`); targets at
  least 44px.
- `prefers-reduced-motion` respected: static beams, static ring pose, no tilt, no reveal, no
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
- `public/og-card-v4.jpg` is the link-preview card (1200x630, headshot, Indigo); re-render it
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
- A WebGL layer, and any effect that reads as an effects reel.
