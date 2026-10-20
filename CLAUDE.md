# CLAUDE.md

Context for Claude Code working in this repo.

## What this is

Personal portfolio for Vidyut Sriram, Penn State CS (graduating Dec 2026, available
Jan 2027), AI systems engineer. Audience: hiring managers and recruiters. The page has
one job: in sixty seconds, make someone think "this person has done a lot, has won
things, and is good at the job", then make it easy to email him.

Stack: Vite + React 19, plain CSS with custom properties. No Tailwind, no CSS-in-JS, no
component library, no router. Single page. Runtime dependencies are react and react-dom
only. Keep it that way unless there is a real reason not to.

## The thesis: don't undermine it by accident

**"Vidyut Sriram builds safe, reliable AI systems."**

The name is the headline, literally: it is the hero h1, in a serif, with "Sriram" in
italic brass. The positioning is forward-deployed engineer and builder: someone who
owns a system end to end, modernizes workflows with AI, and sits close to the user. The
flagship build is PrismAI. The research (arXiv:2607.21641, a preprint, never
"published") is evidence of an instinct, not the headline.

Two rules encode the thesis visually:

1. **Color is scarce, so it means something.** The base is warm graphite. One accent,
   brass (`--acc`), means exactly four things: the italic half of the name and of three
   headings, the primary action, an award, and the proof band plus the commit-graph
   ramp. Mint (`--ok`) means available or live. Coral (`--bad`) is reserved for a
   defect state and nothing uses it today. If you are about to add a gradient wash or a
   second accent, stop and ask first.

2. **Claims come with receipts, and are never fabricated.** Every number traces to a
   source (the paper, the resume, a project repo or doc, Devpost, GitHub, or something
   Vidyut said). Unknown facts get a `TODO` comment in `content.js` or an empty value,
   never invented copy. Empty links are filtered out at render time, so a link that is
   not ready simply does not appear. Never call MVR "AI" (it has no LLM). BetterBill,
   Yinzone and Terrametric are team builds and say so. PrismAI's agency scope-check
   and change-order loop is built but not live: say "building now, public launch
   planned Dec 2026".

## Page order and the argument it makes

`src/App.jsx`, top to bottom:

| Section | Job |
|---|---|
| Hero | Name, identity, proof line, CTAs on the left; a deck of glass project cards on the right |
| Proof | A full-bleed brass band of six numbers (the one loud moment) |
| Experience | Where he has worked |
| Builds | PrismAI flagship, six featured builds, the paper, four compact rows (Vidyut's order) |
| Proof of work | GitHub commit graph + monthly ramp, the six wins, four verification links |
| Principles | How he thinks about building (2x2 cards) |
| Value | What that is worth to you (hairline rows) |
| Toolkit | The inventory, grouped chips |
| Contact | The ask: the email is the hero of the section, no color flood |

Principles and Value are deliberately different shapes (cards vs hairline rows) so they
do not read as the same module twice. Keep them visually distinct.

## The hero deck (`components/Deck.jsx`)

A WAI-ARIA carousel of frosted-glass cards, one on top and two peeking behind. Each
slide is one link to its Builds entry (`#build-<id>`). Slide data is
`hero.carousel.slides` in `content.js`; a slide `id` must equal the Builds entry id.
Card position is a `data-pos` attribute (`0`, `1`, `2`, `out`, `hid`) styled in CSS, so
only transform and opacity animate. Autoplay pauses on hover, on focus inside, on a
hidden tab, and via the toggle; under `prefers-reduced-motion` there is no autoplay and
the swap is instant. The rotation toggle must stay the first focusable control inside
the region. Slide 8 has no image and renders the paper's typographic tile
(`builds.research.tile`). Never use a frame that shows personal info.

## The background (`components/Background.jsx`, `BackgroundField.jsx`)

One WebGL layer for the whole site: a warm starfield with a faint nebula and three
parallax star layers, raw WebGL2, no dependency. It is lazy-imported after first paint,
capped at about 0.7 x min(dpr, 1.5) resolution and 30 fps, paused when the tab is
hidden, and never created under `prefers-reduced-motion` or without WebGL2. A static CSS
sky (`.bg-static`, tokens only) is always rendered under it and is the whole fallback.
Shader colors are read from tokens at mount, so a palette change in `tokens.css`
recolors the sky. Do not add a second canvas.

## Proof of work (`components/ProofOfWork.jsx`)

The commit graph is drawn from `src/data/github.json`, a snapshot written by
`scripts/fetch-github.mjs` as the `prebuild` step (GraphQL if `GITHUB_TOKEN` is set,
else the public contributions page, else the committed snapshot; it validates before
overwriting and never fails the build offline). There are no runtime third-party calls.
Every GitHub number on the page is computed from that JSON, never typed in. Running
`npm run build` rewrites `github.json`; commit it when you want a fresher snapshot.

## Architecture rules

**Content and design never mix.**

- `src/data/content.js` is every word on the site. No styling, no JSX.
- `src/styles/` is every visual decision. No copy.
- `src/components/` is structure only. Components read from `content.js` and apply
  classes from `styles/`. Almost no hardcoded strings.

Editing copy means touching `content.js` only. Editing looks means touching `styles/`
only. When a change genuinely needs both, say so before starting.

**Styles are three layers, loaded in this order** (`src/main.jsx`):

1. `tokens.css`: the control panel. Colors, type scale, spacing, motion. Everything
   downstream consumes these. Prefer changing a token over adding a rule.
2. `base.css`: reset, element defaults, shared primitives (`.wrap`, `.sec`, `.eyebrow`,
   `.sec-head`, `.btn`, `.badge`, `.metrics`, `.links`, `.reveal`).
3. `sections.css`: per-region layout, ordered top to bottom to mirror the page.

**Never hardcode a color, font, or radius** in a component or in `sections.css`. Use a
token. If one does not exist, add it to `tokens.css` rather than inlining a hex.

## Type

Three faces, three jobs, from Google Fonts (see `index.html`): Instrument Serif for
display (the name, h2s, card titles, every big number, the email), Geist for UI and
body, Geist Mono for labels, nav, buttons, badges and stack lines.

## Conventions

- Class names are plain and region-prefixed (`.build-title`, `.xp-row`, `.deck-card`).
  No BEM, no utility soup.
- `**double asterisks**` in `content.js` render as emphasis via `<Rich>`. That is the
  only markup supported; don't add a markdown dependency. Italic-brass heading halves
  are separate fields (`heading` + `headingEm`).
- Breakpoints in use: 960, 760, 640, 460. Reuse them; don't invent more.
- Type sizes use `clamp()` and are already fluid. Never add a media query for font size.
- Animation state on a DOM node goes in a `data-state` or `data-pos` attribute, styled
  with attribute selectors. See `.deck-card` and `.copy`.
- No em dashes or en dashes anywhere (copy, code, comments, commits). Ranges use "to".

## Quality floor: verify before calling anything done

- Works down to 360px wide with no horizontal scroll (`scrollWidth == clientWidth`).
- Keyboard focus visible everywhere (`:focus-visible` styled in `base.css`).
- `prefers-reduced-motion` respected: static sky, flat brass name, manual deck, final
  proof numbers, no reveal. Any new animation must do the same.
- WebGL2 unavailable shows the static sky with no console error.
- `npm run build` and `npm run lint` both pass.

## Commands

```bash
npm run dev      # dev server, hot reload
npm run build    # prebuild (GitHub snapshot) then production build to dist/
npm run preview  # serve the production build
npm run lint     # oxlint
```

## Open TODOs

Search the repo for `TODO`:

- Build dates and solo-or-team role lines for MVR, Vytal, Match Day, Terrametric
- Match Day stack line, and which of Vytal's dates are still current
- Compact-row stack and year cells (CinemaChat, TransitGuard, PaperTrail, AlgoQuest)
- A silent PrismAI loop for the flagship panel (needs ffmpeg), and a Yinzone Devpost link
- Live demo links for TransitGuard and PaperTrail; source links for the paper and MVR
- Open yin.zone and betterbill.matmanna.dev in a browser before shipping the links
- A fresh `public/og-card-v2.png` that matches the new look (the current one is the old design)

## Things deliberately left out

Don't add these back without asking:

- Phone number. It is on the resume; a public page is a scraper magnet.
- An "Objective" or "Summary" section. The hero does that job with more force.
- Testimonials, a blog, a visitor counter, a "currently listening to" widget.
- Skill percentage bars. Nobody is 87% at Python.
- A dark/light toggle. The design is committed to one mode; pick a side.
- GitHub stars or follower counts (zero followers, zero to two stars). Use the commit graph.
- More than one WebGL layer, and any effect that reads as an effects reel.
