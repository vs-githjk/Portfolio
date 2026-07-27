# CLAUDE.md

Context for Claude Code working in this repo.

## What this is

Personal portfolio for Vidyut Sriram — Penn State CS '27, AI systems engineer.
Audience: hiring managers and recruiters. The page has one job: convince someone
in sixty seconds that this person **builds things that work**, then make it easy
to email him.

Stack: Vite + React 19, plain CSS with custom properties. No Tailwind, no
CSS-in-JS, no component library, no router. Single page. Keep it that way unless
there's a real reason not to.

## The thesis — don't undermine it by accident

**"The model is the easy part."**

He is read as a builder first. The flagship is PrismAI. Research (arXiv:2601.00509)
is evidence of an instinct, not the headline — if you find yourself moving the
paper toward the top of the page, that's a regression, ask first.

Two rules encode the thesis visually:

1. **The page is grayscale.** Color appears *only* where a system reports state:
   `--running` (amber, working) and `--verified` (green, done); `--defect` (red)
   is available for failure states. Color is information, not decoration.
   If you're about to add a brand hue, gradient, or colored accent — stop. That
   breaks the one idea holding the design together. Ask first.

2. **Claims come with receipts.** The Value section pairs every assertion with
   concrete evidence. Never add a claim without a number or verifiable fact.

The signature element is the animated PrismAI pipeline in the hero
(`components/Pipeline.jsx`). It's what the page is remembered by. Boldness is
spent there; everything else stays quiet and disciplined.

`components/RepairLoop.jsx` is the previous signature (the paper's GCC → CodeQL →
KLEE loop). It's unmounted but kept — swap it into `Hero.jsx` for a research-first
framing.

## Page order and the argument it makes

`src/App.jsx`, top to bottom:

| Section | Job |
|---|---|
| Hero | The claim + a live system proving it isn't talk |
| Proof | Four numbers |
| Experience | Where I've worked |
| Builds | What I've built |
| Principles | How I think about building |
| Value | What that's worth to you |
| Toolkit | The boring inventory |
| Contact | The ask |

Principles and Value are deliberately different shapes — a 2×2 grid vs hairline
rows — so they don't read as the same module twice. Keep them visually distinct.

## Architecture rules

**Content and design never mix.**

- `src/data/content.js` — every word on the site. No styling, no JSX.
- `src/styles/` — every visual decision. No copy.
- `src/components/` — structure only. Components read from `content.js` and apply
  classes from `styles/`. Almost no hardcoded strings.

Editing copy → touch `content.js` only. Editing looks → touch `styles/` only.
When a change genuinely needs both, say so before starting.

**Styles are three layers, loaded in this order** (`src/main.jsx`):

1. `tokens.css` — the control panel. Colors, type scale, spacing, motion.
   Everything downstream consumes these. Prefer changing a token over adding a rule.
2. `base.css` — reset, element defaults, shared primitives (`.wrap`, `.sec`,
   `.eyebrow`, `.sec-head`, `.reveal`).
3. `sections.css` — per-region layout, ordered top-to-bottom to mirror the page.

**Never hardcode a color, font, or radius** in a component or in `sections.css`.
Use a token. If one doesn't exist, add it to `tokens.css` rather than inlining a hex.

## Conventions

- Class names are plain and region-prefixed (`.proj-title`, `.xp-row`, `.pipe-bar`).
  No BEM, no utility soup.
- `**double asterisks**` in `content.js` render as emphasis via `<Rich>`. That's the
  only markup supported — don't add a markdown dependency.
- Links with an empty `href` in `content.js` are filtered out at render time.
  A link that isn't ready simply doesn't appear rather than 404ing.
- Breakpoints in use: 960, 900, 860, 760, 720, 640, 460. Reuse them; don't invent more.
- Type sizes use `clamp()` and are already fluid. Never add a media query for font size.
- Animation state on a DOM node goes in a `data-state` attribute, styled with
  `[data-state='...']` selectors. See `.chip` and `.node`.

## Quality floor — verify before calling anything done

- Works down to 360px wide.
- Keyboard focus visible everywhere (`:focus-visible` styled in `base.css`).
- `prefers-reduced-motion` respected. `Pipeline` renders its finished state instead
  of animating; `.reveal` elements appear immediately. Any new animation must do the same.
- `npm run build` and `npm run lint` both pass.

## Commands

```bash
npm run dev      # dev server, hot reload
npm run build    # production build to dist/
npm run preview  # serve the production build
npm run lint     # oxlint
```

## Open TODOs

Search the repo for `TODO`:

- GitHub URL and handle (`content.js` → `contact.links`)
- Repo and live-demo URLs for all three builds
- The two unnamed PrismAI agents (`content.js` → `pipeline.agents`)
- `public/resume.pdf`
- Optional OG image at `public/og.png`, then uncomment the meta tag in `index.html`

## Things deliberately left out

Don't add these back without asking:

- Phone number. It's on the résumé; a public page is a scraper magnet.
- An "Objective" or "Summary" section. The hero does that job with more force.
- Testimonials, a blog, a visitor counter, a "currently listening to" widget.
- Skill percentage bars. Nobody is 87% at Python.
- A dark/light toggle. The design is committed to one mode; pick a side.
