# vidyut.dev

Personal portfolio. Vite + React 19, plain CSS.

```bash
npm install
npm run dev      # http://localhost:5173
```

**Designing with Claude Code? Read [PROMPTS.md](./PROMPTS.md).**
Architecture rules and the design thesis live in [CLAUDE.md](./CLAUDE.md).

## Where things live

```
src/
├── data/content.js      ← every word on the site. Edit copy here.
├── styles/
│   ├── tokens.css       ← THE CONTROL PANEL. Colors, type, spacing, motion.
│   ├── base.css         ← reset + shared primitives (.wrap, .sec, .eyebrow)
│   └── sections.css     ← layout per region, ordered like the page
├── components/
│   ├── Pipeline.jsx     ← the signature: PrismAI's pipeline, animated
│   ├── RepairLoop.jsx   ← the previous signature. Unmounted; swap into Hero.jsx
│   └── ...              ← structure only; no copy, no hex codes
└── hooks/
```

The rule: **content and design never mix.** Changing words means touching
`content.js` and nothing else. Changing looks means touching `styles/` and
nothing else.

## Page order

Set in `src/App.jsx`. Sections are independent — reorder or comment out freely.

Hero → Proof → Experience → Builds → Principles → Value → Toolkit → Contact

The argument: here's my claim (and a live system proving it isn't talk), here
are four numbers, here's where I've worked, here's what I've built, here's how
I think about building, here's what that's worth to you, here's the inventory,
here's how to reach me.

## Playing with the design

Start in `src/styles/tokens.css`. Almost every visual decision routes through a
variable there, so you can restyle the whole site without opening a component.

| Change | Where | Effect |
|---|---|---|
| Swap `--font-display` | `tokens.css` + font link in `index.html` | Biggest single lever on personality |
| Uncomment an alternate palette | bottom of `tokens.css` | Warm graphite, light mode, or true black |
| `--maxw: 1100px` / `1440px` | `tokens.css` | Document-tight vs editorial-wide |
| `--radius: 0` | `tokens.css` | Harder, more technical |
| `--sec-y` | `tokens.css` | Overall page density |
| `TIMING` object | `Pipeline.jsx` | Pace of the hero animation |

## Adding a project

Copy the `TEMPLATE` block at the bottom of `builds.items` in `content.js`.
Nothing else needs to change — the component maps over the array.

## Fonts

Loaded from Google Fonts in `index.html`. Change a family in **both**
`index.html` (the link) and `tokens.css` (the variable). Display faces worth
auditioning: Instrument Serif, Archivo, Anton, Syne, Fraunces.

## Deploy

Push to GitHub, import the repo at vercel.com. Vercel detects Vite
automatically — build `npm run build`, output `dist`. Every push to `main`
redeploys.

## Before going live

- [ ] GitHub URL + handle in `content.js`
- [ ] Repo and demo links for the three builds
- [ ] Name the two unlisted PrismAI agents in `pipeline.agents`
- [ ] Drop `resume.pdf` into `public/`
- [ ] OG image at `public/og.png`, uncomment the meta tag in `index.html`
- [ ] Buy a domain and point it at Vercel
