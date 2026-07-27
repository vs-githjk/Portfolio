# Spec: neon surfaces + motion pass

Implementation spec for the next coding session (any model). Read CLAUDE.md
first — architecture rules there are binding. This file covers three features
Vidyut asked for, in priority order. Commit each separately; run
`npm run build && npm run lint` before every commit; verify the quality floor
(360px width, `prefers-reduced-motion`, visible focus) before calling any item
done.

## Status — most of this spec is now IMPLEMENTED (2026-07-27 evening)

Shipped, do not redo: neon accent tokens; scroll progress bar; Prism cursor;
org logos; product images; favicon; **Proof on neon yellow** (item 1, partial);
**Contact light-blue wipe reveal** (Vidyut changed Contact from red to light
blue — `--accent-3-light`); **GSAP pinned horizontal scroll on Principles**
(item 2); **rainbow letter ripple on Toolkit hover** (item 3).

Still open for a next session:
- Neon red (`--accent-2`) has no section surface yet — candidate: the Value
  section, or keep red as accent-only. Ask Vidyut.
- Optional ambient (non-hover) rainbow pass on Toolkit.
- Hero silhouette image (slot is live, waiting on the asset).
- Background art assets Vidyut said he'd supply; reactbits/aceternity-style
  extras once they land.

---

## 1. Neon section backgrounds

Vidyut: "when I said neon yellow, neon blue, neon red I meant as background
colors." The dark base stays, but 2–3 sections flip to full neon surfaces —
punk, high-contrast, deliberate. Do NOT tint every section; the page should
alternate dark → neon → dark so each hit lands.

Proposed mapping (confirm with Vidyut if he's around, otherwise ship this):

| Section | Surface | Text |
|---|---|---|
| Proof (the four numbers) | `--accent-1` neon yellow | dark ink |
| Value ("Who I am at work") | `--accent-3` neon blue | white |
| Contact | `--accent-2` neon red | white |

Mechanics:
- Add to `tokens.css`: `--on-accent-dark: #0c0e13; --on-accent-light: #ffffff;`
- In `sections.css`, restyle `.proof`, `.bring`, `.contact` with the neon
  backgrounds. Every text token inside those sections needs an override
  (`--text-3` mono labels are unreadable on yellow — use
  `color-mix(in srgb, var(--on-accent-dark) 70%, transparent)` style values).
- Hairlines inside neon sections: `color-mix` the ink into the surface, not
  `--hair` (which vanishes on bright backgrounds).
- Check checkmark SVGs (`Check.jsx` uses `--verified`) — on neon blue/red,
  switch to the on-accent text color via a CSS override, not a component edit.
- `::selection` and `:focus-visible` must stay visible inside neon sections.
- Update CLAUDE.md's color rule after shipping (it currently says accents are
  for interactive moments only).

## 2. "How I build" — GSAP horizontal scroll

- `npm install gsap` (first runtime dependency beyond React — that's approved
  for this).
- In `Principles.jsx`: register `ScrollTrigger`. Pin the section; translate a
  horizontal track of the four `.prin` cards across the viewport as the user
  scrolls (scrub: true). Section height ≈ `100vh + 4 * cardWidth` so the
  scroll distance feels 1:1.
- Desktop only (`matchMedia('(min-width: 900px)')` via `gsap.matchMedia()`).
  Below 900px and under `prefers-reduced-motion: reduce`, render exactly the
  current static grid — the reduced-motion branch must not pin or translate.
- Kill/cleanup all triggers in the effect's return (React 19 StrictMode runs
  effects twice — use `gsap.context()` and revert).
- Keep all styling in `sections.css` (`.prin-track` etc.); GSAP only animates
  transforms.

## 3. Toolkit — rainbow letters

- New tiny component (e.g. `RainbowText.jsx`): splits a string into
  `<span aria-hidden>` letters inside an element that keeps the full text for
  screen readers (`aria-label` on the wrapper, spans hidden).
- Apply to `.kit-cell li` items (the tool names).
- CSS: each letter gets `animation: hue 6s linear infinite` cycling
  `color` through the three accents (`--accent-1` → `--accent-2` →
  `--accent-3`), with `animation-delay: calc(var(--i) * 80ms)` set via inline
  `--i` per letter, so color ripples through the word.
- Default state: letters stay `--text-2`; the rainbow runs on `:hover` of the
  cell, plus one slow ambient pass every ~8s if easy (optional).
- `prefers-reduced-motion: reduce`: no animation; plain static color.
- Performance: animate `color` only, no filters; the Toolkit has ~40 items ×
  ~8 letters — that's fine, but do not add per-letter box-shadows.

## Quality floor (unchanged, verify per item)

- 360px wide, no horizontal scroll (`document.documentElement.scrollWidth === 360`).
- `prefers-reduced-motion` produces a fully static, correct page.
- `npm run build` and `npm run lint` pass.
- Keyboard focus visible everywhere, including inside neon sections.
