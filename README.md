# vidyut.dev

Personal portfolio. Vite + React 19, plain CSS, prerendered at build time.

```bash
npm install
npm run dev       # http://localhost:5173 (client-rendered)
npm run build     # GitHub snapshot, client build, SSR build, prerender into dist/index.html
npm run preview   # serve the production build
npm run lint
```

Architecture rules and the design thesis live in [CLAUDE.md](./CLAUDE.md). Read it before
changing anything.

## Where things live

```
src/
├── data/content.js      every word on the site. Edit copy here.
├── styles/
│   ├── tokens.css       THE CONTROL PANEL: fonts, colors, type, depth, ring geometry
│   ├── base.css         reset + shared primitives (.wrap, .sec, .btn, .badge, .reveal)
│   └── sections.css     layout per region, ordered like the page
├── components/          structure only: no copy, no hex codes
│   ├── Orbit.jsx        the hero's 3D ring of builds
│   └── BackgroundField.jsx   the light-beam canvas
└── hooks/ lib/
scripts/
├── fetch-github.mjs     build-time contribution snapshot
└── prerender.mjs        writes the rendered page into dist/index.html
public/                  fonts, build images (webp), logos, resume, share card
```

The rule: **content and design never mix.** Changing words means touching `content.js`
and nothing else. Changing looks means touching `styles/` and nothing else.

## Page order

Set in `src/App.jsx`: Hero, Experience, Builds, Highlights, Proof of work, Principles,
Value, Toolkit, Contact.

## Adding a project

Add an entry to `builds.items` or `builds.more.items` in `content.js` (copy an existing
one), add its image as `public/builds/<id>.webp` plus `-640` and `-900` variants, and, if it
belongs on the ring, a slide with the same `id` and a 640px image in `public/builds/ring/`.

## Deploy

Vercel: build `npm run build`, output `dist`. Every push to `main` redeploys.
