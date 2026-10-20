/* ============================================================================
   CONTENT (v4)
   ----------------------------------------------------------------------------
   Every word on the site lives here. Nothing in this file controls design.
   Change copy here; change looks in src/styles/. The two never touch.

   THESIS: "Vidyut Sriram builds safe, reliable AI systems."
   Goal for a reader, in 60 seconds: he builds AI systems that work, he has
   won things, and he owns what he ships. Then: email him.

   Rules for this file:
   - Every number sits inside a sentence or label that says what it measures
     and where. No bare figures. The claim-to-source map is in copy-notes.md.
   - Unknown facts are omitted (empty href/value is filtered at render) or
     marked TODO. Never invent.
   - **double asterisks** = emphasis, the only markup.
   - No em dashes or en dashes anywhere. Date ranges use "to".

   v4 changes for the builder:
   - `proof` (the six-number band under the hero) is GONE. Its facts now live
     in Experience, Builds and the paper. `highlights` (below Builds) is the
     optional replacement: four complete one-line statements, not figures.
   - `hero.proofLine` is gone; `hero.credential` replaces it.
   - `hero.carousel.slides` (the orbit ring) has 11 cards in Vidyut's order
     (V4 SIGN-OFF, Oct 20): PrismAI, BetterBill, MVR, Vytal, Match Day,
     Yinzone, Terrametric, the paper, Quorum, FilingWatch, NextRound. Tune the
     ring geometry for 11; do not drop cards.
   - NextRound and prep-console are ONE entry, `nextround` (Vidyut, Oct 20).
   - Every ring card and build card now has an image: the finder's logo-led
     thumbnails, including the paper, TransitGuard and AlgoQuest. Alts
     describe the thumbnail. `tile` stays only as a fallback.
   - `builds.flagship.media` is now a gallery: one `lead` still plus a
     `stack` of three, to fill the empty left column (V4 feedback 6).
   - `builds.compact` is replaced by `builds.more`: same card shape as
     `builds.items`, each with an image or a typographic `tile`.
   - Image paths follow /builds/<id>.webp (plus <id>-640.webp for phones). Source files for every image are
     listed in copy-notes.md ("Media"). Logo-led thumbnails can replace any of
     them at the same path.
   ========================================================================== */

export const meta = {
  name: 'Vidyut Sriram',
  title: 'Vidyut Sriram | safe, reliable AI systems',
  description:
    'Vidyut Sriram builds safe, reliable AI systems. Builder of PrismAI, 1st in four hackathon tracks, arXiv first author. Forward-deployed and AI engineer, from Jan 2027.',
  location: 'State College, PA',
};

/* Sticky nav: four section links plus one Email pill. */
export const nav = {
  brand: 'Vidyut Sriram',
  skip: 'Skip to content',
  links: [
    { label: 'Work', href: '#work' },
    { label: 'Builds', href: '#builds' },
    { label: 'Proof', href: '#verify' },
    { label: 'How I build', href: '#principles' },
  ],
  cta: { label: 'Email', href: 'mailto:vidyut0712@gmail.com' },
};

/* ---------------------------------------------------------------- HERO ---- */
/* Centre: status row, name, identity, one plain line, credentials, actions.
   Around it: the orbit ring. No figures in the hero except the live-status
   badge on the PrismAI card, which says what it counts. */
export const hero = {
  status: 'Forward-deployed and AI engineer · available Jan 2027',
  /* Studio headshot: 180px and 360px (2x) squares, shown at about 160px beside
     the name on a laptop and 112px on a phone. The 600px and 1200px originals
     stay in public/ for the share card. */
  portrait: {
    src: '/portrait-180.webp',
    src2x: '/portrait-360.webp',
    alt: 'Vidyut Sriram, smiling, in a light blue polo',
  },
  headline: 'Vidyut Sriram',
  identity: 'Builds safe, reliable AI systems.',
  /* The plain line under the identity: what that means in practice. */
  identitySub:
    'Agents that do real work, with code checking the numbers and a person approving before anything goes out.',
  /* One short form everywhere (it clears the side cards at 1440 and stays a caption
     on a phone). "1st place in four tracks" = Visa + Photon (LA Hacks AI
     Hackathon) + Real World + Data Science (Bitcamp). */
  credential: 'Comcast · Sherlock AI · 1st in 4 hackathon tracks · arXiv first author',
  locationNote: 'Penn State CS, graduating Dec 2026 · State College, PA · open to relocate',
  /* Buttons. Email is the one primary action. */
  actions: [
    { label: 'Email me', href: 'mailto:vidyut0712@gmail.com', primary: true },
    { label: 'Resume', href: '/resume.pdf' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/vidyut-sriram-4b5a012aa' },
    { label: 'GitHub', href: 'https://github.com/vs-githjk' },
  ],

  /* ---- Orbit ring: "What I've built" ---------------------------------------
     Slide id = Builds card id, so a card links to #build-<id>.
     oneLiner: plain "what it does", 9 words or fewer, fits two lines at 13px.
     badge: award text, or a live receipt when there is no award; '' = none.
     badgeKind: 'win' (gold, an award), 'live' (mint, live or in beta) or ''
     (plain). The Builds cards reuse the badge of the slide with the same id.
     Images are the logo-led thumbnails (v4-assets/thumbs); alts describe
     them. If the paper image is missing, render builds.research.tile.
     MVR is never called AI. */
  carousel: {
    label: "What I've built",
    slideCta: 'See the build',
    controls: {
      pause: 'Stop the rotation',
      play: 'Start the rotation',
      prev: 'Previous project',
      next: 'Next project',
      choose: 'Choose project',
      goTo: 'Go to project {k} of {n}',
    },
    slides: [
      {
        id: 'prismai',
        title: 'PrismAI',
        oneLiner: 'Joins your calls and does the follow-up work.',
        badge: 'Live beta · 14 users',
        badgeKind: 'live',
        image: {
          src: '/builds/ring/prismai.webp',
          alt: 'PrismAI logo and the line "Joins your calls. Does the follow-up. You approve every word." beside its live-meeting view with the meeting health score, decisions and action items',
        },
      },
      {
        id: 'betterbill',
        title: 'BetterBill',
        oneLiner: 'Finds hospital charges you may not owe.',
        badge: '2× 1st · LA Hacks',
        badgeKind: 'win',
        tone: 'light', // pale thumbnail: the ring dims it further at the back
        image: {
          src: '/builds/ring/betterbill.webp',
          alt: 'BetterBill: "Know the price before you go. Fix the bill after. We make the call." beside its price, bill-check and billing-call screens (sample bill, synthetic)',
        },
      },
      {
        id: 'mvr',
        title: 'MVR',
        oneLiner: 'Maps legacy code, every claim evidenced.',
        badge: 'Proof of concept',
        badgeKind: '',
        image: {
          src: '/builds/ring/mvr.webp',
          alt: 'MVR logo, "Verified software modernization", beside its evidence view: "Every claim is linked to evidence."',
        },
      },
      {
        id: 'vytal',
        title: 'Vytal',
        oneLiner: 'Coaching software where the coach decides.',
        badge: 'Controlled beta',
        badgeKind: 'live',
        image: {
          src: '/builds/ring/vytal.webp',
          alt: 'Vytal logo, "One place to coach. One place to train.", beside its coach workspace (synthetic data)',
        },
      },
      {
        id: 'matchday',
        title: 'Match Day',
        oneLiner: 'Runs a racket tournament from one screen.',
        badge: 'Live',
        badgeKind: 'live',
        image: {
          src: '/builds/ring/matchday.webp',
          alt: 'Match Day wordmark, "Play. Compete. Belong.", beside its tournament command center',
        },
      },
      {
        id: 'yinzone',
        title: 'Yinzone',
        oneLiner: 'Shows where new housing can go in Pittsburgh.',
        badge: '~142k parcels scored',
        badgeKind: '',
        image: {
          src: '/builds/ring/yinzone.webp',
          alt: 'Yinzone logo over a 3D street-scale map of Pittsburgh: "Where could new housing go in Pittsburgh, and what stands in the way?"',
        },
      },
      {
        id: 'terrametric',
        title: 'Terrametric',
        oneLiner: 'Drought risk and irrigation plans, per field.',
        badge: '2× 1st · Bitcamp',
        badgeKind: 'win',
        image: {
          src: '/builds/ring/terrametric.webp',
          alt: 'Terrametric wordmark, "Soil, weather and crop stress, turned into early warnings", beside a globe marking an Iowa field cluster',
        },
      },
      {
        id: 'secure-codegen',
        title: 'Research paper',
        oneLiner: 'A repair loop that makes LLM-written C safer.',
        badge: '2nd · Penn State Exhibition',
        badgeKind: 'win',
        image: {
          src: '/builds/ring/paper.webp',
          alt: 'The paper title and "83.7% fewer CodeQL errors" beside a diagram of the GCC, CodeQL and repair loop, with KLEE as the final check',
        },
      },
      {
        id: 'quorum',
        title: 'Quorum',
        oneLiner: 'An AI teammate that joins the call and acts.',
        badge: 'Hackathon · YHack',
        badgeKind: '',
        image: {
          src: '/builds/ring/quorum.webp',
          alt: 'Quorum logo, "Joins your meeting, listens, takes the action, and speaks back", beside a meeting where someone says "Hey Q, file a GitHub issue for the auth bug"',
        },
      },
      {
        id: 'filingwatch',
        title: 'FilingWatch',
        oneLiner: 'Reports what was filed, never what it means.',
        badge: 'Solo build',
        badgeKind: '',
        tone: 'light', // pale thumbnail: the ring dims it further at the back
        image: {
          src: '/builds/ring/filingwatch.webp',
          alt: 'FilingWatch "8K" mark, "Reports what was filed, never what it means", beside its feed of recent SEC 8-K filings',
        },
      },
      {
        id: 'nextround',
        title: 'NextRound',
        oneLiner: 'Plans your prep and diagnoses every miss.',
        badge: 'Working build',
        badgeKind: '',
        image: {
          src: '/builds/ring/nextround.webp',
          alt: 'NextRound logo and the line "Readiness, measured." beside its interactive prototype',
        },
      },
    ],
  },
};

/* --------------------------------------------------------------- WHERE ---- */
/* `wins` render as neutral outcome pills. Each pill is a complete statement:
   it names what changed and for whom, so no number stands alone. */
export const experience = {
  eyebrow: "Where I've worked",
  heading: 'Experience',
  roles: [
    {
      org: 'Sherlock AI',
      logo: '/logos/sherlock.webp',
      role: 'Software Engineering Intern',
      team: '',
      note: 'Owned the public demo interview flow end to end in Next.js: adaptive interview behavior, in-browser recording and submission. It is the surface prospective customers evaluate before they ever talk to the team. I also prototyped a Google Meet add-on that shows audit logs and checks interview integrity from a sidebar inside the live call, so review happens where the interview already takes place.',
      wins: ['Owned the public demo prospects evaluate, in Next.js', 'Prototyped a Google Meet add-on for interview integrity'],
      when: 'Jun to Aug 2026',
      where: 'Remote',
    },
    {
      org: 'Comcast',
      logo: '/logos/comcast.webp',
      role: 'Software Development Engineer Intern',
      team: 'India Engineering Centre',
      note: 'I was asked whether low-code agent tooling could work inside engineering teams. I scoped the problem, chose Langflow and shipped the pilot: one place for planning, budget tracking, structured data and team communication, plus a surface that turns a coding question into a generated solution. Then I watched how the team actually used it and added RAG over internal documentation.',
      wins: [
        'Adopted across a 40-person engineering team',
        'Cut ~40% of the team’s recurring planning and coordination work',
        'RAG over internal docs: a further ~18% gain in communication efficiency',
      ],
      when: 'May to Aug 2025',
      where: 'Chennai, India',
    },
    /* The teaching row is the evidence for the customer-facing half of
       forward-deployed work. Keep it. */
    {
      org: 'Penn State',
      logo: '/logos/psu.webp',
      role: 'Learning Assistant · Math Peer Tutor',
      team: 'B.S. Computer Science, Math minor',
      note: 'As a Learning Assistant I ran calculus review sessions, and as a peer tutor I work one on one across introductory math. The work is explaining hard ideas to people who do not share my context, and finding the exact spot where a mental model broke. It is the same skill a forward-deployed engineer uses with a customer.',
      wins: ['GPA 3.84 of 4.00', "Dean's List, 6 of 6 semesters"],
      when: 'Learning Assistant · Aug 2025 to May 2026\nTutor · Jan 2026 to Present',
      where: 'University Park, PA',
    },
  ],
};

/* -------------------------------------------------------------- BUILDS ---- */
/* Order: PrismAI (flagship); items = BetterBill, MVR, Vytal, Match Day,
   Yinzone, Terrametric; then the paper (research); then `more` = Quorum,
   FilingWatch, NextRound (same order as the end of the ring), CinemaChat,
   TransitGuard, PaperTrail, AlgoQuest.
   Shape of every card (items and more):
   id (= ring slide id; card anchor is #build-<id>), kind, title,
   descriptor, when, oneLiner, awards (verified only; badge text), role
   (team builds: his part, strongest accurate form), body (outcome first,
   2 to 3 sentences), metrics (max 2; each label says what the value
   measures), stack, links (empty href hides), media { image, alt } or
   tile { eyebrow, number, line } when no honest image exists. */
export const builds = {
  eyebrow: "What I've built",
  heading: 'Builds',
  intro:
    'Fifteen builds, flagship first: products, hackathon wins, a first-author paper and the smaller tools in between. Every number here has a source I can show you.',

  /* ---- Flagship panel ---------------------------------------------------- */
  flagship: {
    id: 'prismai',
    kind: 'Product · live beta',
    title: 'PrismAI',
    descriptor: 'approval-first meeting agent',
    when: 'Mar 2026 to Present',
    oneLiner:
      'A meeting agent that turns what people promise on a call into finished work, and asks before it acts.',
    awards: [],
    role: 'I wrote 1,120 of its 1,352 commits, starting with the first one.',
    /* Shipped and live. */
    body: [
      'I took PrismAI from an empty repo to a **live beta** in about six months. A Recall.ai bot joins Meet, Zoom or Teams, and **12 LangGraph agents** turn the call into decisions, action items, follow-up emails and Jira or Linear tasks.',
      'Hybrid search (pgvector plus BM25) answers questions across every past meeting, an MCP connector brings that context into Claude and ChatGPT, and a cross-tenant attack suite blocks CI.',
    ],
    /* In development: always rendered under this label. */
    now: {
      label: 'Now building · agency release, Dec 2026',
      text: 'For agencies and client-services teams, PrismAI checks each client request against the signed agreement, quotes the clause, and drafts a priced change order at the agency’s own rates. **Code computes every dollar, and nothing reaches the client until the owner approves.**',
    },
    metrics: [
      { value: '14', label: 'live beta users\nin isolated workspaces' },
      { value: '100+', label: 'meetings analyzed\nin the beta' },
    ],
    stack:
      'React · FastAPI · LangGraph · Claude · OpenAI · Supabase/pgvector · BM25/RRF · MCP · Recall.ai · Deepgram · Cartesia',
    /* Gallery fills the left column (V4 feedback 6): a lead still, then a
       stack of three. The live-meeting and agents frames are product
       illustrations from PrismAI's own landing page, not a customer meeting;
       captions say so. The agency frame is the in-development release. */
    media: {
      video: '', // TODO: a screen-recording loop of the new UI
      lead: {
        image: '/builds/prismai-agency.webp',
        alt: 'PrismAI agency release: a client asks for an iPhone app on a weekly call, PrismAI checks it against clause 3.2 of the agreement and drafts change order #3 for approval',
        badge: '', // the caption and the box below carry the label
        caption: 'Agency release, in development: a client’s extra ask, checked against the agreement and drafted as a change order you approve.',
      },
      stack: [
        {
          image: '/builds/prismai-live-meeting.webp',
          alt: 'PrismAI live-meeting view with highlighted commitments, a meeting health score, decisions and action items with owners',
          caption: 'The live-meeting view, from PrismAI’s landing page.',
        },
        {
          image: '/builds/prismai-agents.webp',
          alt: 'PrismAI after the call: a health score with clarity, participation and outcomes, and action items with owners checked off',
          caption: 'Twelve agents work through every meeting (from PrismAI’s landing page).',
        },
        {
          image: '/builds/prismai-standin.webp',
          alt: 'PrismAI stand-in tab: open action items, decisions, and notes on what PrismAI should know about you',
          caption: 'Stand-in: PrismAI covers a meeting you cannot attend.',
        },
      ],
    },
    links: [
      { label: 'Live site', href: 'https://www.meetprismai.com/' },
      {
        label: 'Chrome extension',
        href: 'https://chromewebstore.google.com/detail/prismai-notetaker/bmnjdhgofbbjlngcahneegalddlpjkbh',
      },
      { label: 'Source', href: '' }, // private repo
    ],
  },

  /* ---- Featured cards (2-column grid), in Vidyut's order ------------------ */
  items: [
    {
      id: 'betterbill',
      kind: 'Hackathon · 24 hours · team of 4',
      title: 'BetterBill',
      descriptor: 'hospital bill advocate',
      when: 'Oct 2026 · AI Hackathon 2026 by LA Hacks, UCLA',
      oneLiner:
        'Snap a hospital bill. It finds the charges worth questioning, shows the proof, and calls the billing office once you approve.',
      /* Devpost prize names: "Visa - The Future of Shopping: Powered by AI,
         Secured by Visa" and "Photon: Best Voice Agent". "1st" per Vidyut
         and his resume. */
      awards: ['1st · Visa track', '1st · Photon, Best Voice Agent'],
      role: 'I owned bill intelligence: the deterministic rules engine, the photo and text bill readers, the API, and Sentry monitoring of every AI call.',
      body: [
        'We took **1st place in the Visa track** and **1st place for Photon’s Best Voice Agent**, the agent that calls the billing office over a Photon line once you approve the script. The model only transcribes the bill; a deterministic rules engine computes every flag and dollar in integer cents, each tied to its source. On test bills seeded with errors it caught **every one, with zero false flags on clean bills**.',
      ],
      metrics: [
        { value: '22 of 22', label: 'seeded billing errors caught,\nzero false flags on clean bills' },
        { value: '88.8%', label: 'of bill lines recovered\nfrom 35 phone photos' },
      ],
      stack:
        'TypeScript · TanStack Start · Expo · oRPC · Drizzle · Postgres · StepFun · Gemini · ElevenLabs · Photon · Sentry',
      media: {
        image: '/builds/betterbill.webp',
        alt: 'BetterBill: "Know the price before you go. Fix the bill after. We make the call." beside its price, bill-check and billing-call screens (sample bill, synthetic)',
      },
      links: [
        { label: 'Live site', href: '' }, // pending from Vidyut (brief: keep hidden until he sends it)
        { label: 'Devpost', href: 'https://devpost.com/software/betterbill' },
        { label: 'Source', href: 'https://github.com/matmanna/betterbill' },
        { label: 'Video', href: 'https://vimeo.com/matmanna/betterbillgg' },
      ],
    },
    {
      id: 'mvr',
      kind: 'Product · working proof of concept · solo',
      title: 'MVR',
      descriptor: 'verified software modernization',
      when: 'Sep 2026 to Present',
      oneLiner:
        'Before anyone rewrites a legacy system, MVR rebuilds it as a model where every claim links to evidence.',
      awards: [],
      role: 'Solo build: every commit in the repo is mine.',
      body: [
        'MVR captures a codebase as an immutable, content-addressed snapshot, and seven deterministic analyzers turn it into a system model where every claim points to the exact evidence behind it. Anything they cannot prove is recorded as unknown, never guessed. In its own evaluation, on held-out synthetic fixtures, it **never claimed certainty it could not prove**, with tenant isolation enforced by forced Postgres row-level security.',
      ],
      metrics: [
        { value: '0', label: 'false-certainty claims on\nheld-out synthetic fixtures' },
        { value: '2,320', label: 'unit tests passing,\nplus 312 tenant-isolation tests' },
      ],
      stack:
        'FastAPI · React 19 · TypeScript · PostgreSQL (forced RLS) · Temporal · S3 · OIDC · OpenTelemetry',
      media: {
        image: '/builds/mvr.webp',
        alt: 'MVR logo, "Verified software modernization", beside its evidence view: "Every claim is linked to evidence." (local run on a synthetic codebase)',
      },
      links: [{ label: 'Source', href: '' }], // private repo, no public URL
    },
    {
      id: 'vytal',
      kind: 'Product · controlled beta · solo',
      title: 'Vytal',
      descriptor: 'coaching platform for fitness coaches',
      when: 'Jul 2026 to Present', // TODO: confirm still active
      oneLiner:
        'Coaching software where the coach stays in charge: every score explains itself, and AI acts only where a person confirms it.',
      awards: [],
      role: 'Solo build: 333 commits in 12 weeks, all mine.',
      body: [
        'Live at joinvytal.live in a controlled beta for multi-coach organizations. Every score is deterministic, versioned and explained with reason codes; the one model in the loop turns a meal photo into a macro estimate that the trainee confirms before it is logged. Access control runs through a single policy check, and every trainee reassignment leaves an append-only audit trail.',
      ],
      metrics: [],
      stack:
        'FastAPI · SQLAlchemy · PostgreSQL · React · TypeScript · TanStack Query · Claude Haiku 4.5 · Cloudflare R2 · Render · Vercel',
      media: {
        image: '/builds/vytal.webp',
        alt: 'Vytal logo, "One place to coach. One place to train.", beside its coach workspace showing which trainee needs attention first (synthetic data)',
      },
      links: [
        { label: 'Live site', href: 'https://joinvytal.live' },
        { label: 'Source', href: '' }, // private repo
      ],
    },
    {
      id: 'matchday',
      /* Copy from Vidyut's own Match Day write-up (Oct 20). Team build; his
         exact lane and the build dates are not stated, so neither is claimed. */
      kind: 'Product · live · team build',
      title: 'Match Day',
      descriptor: 'racket tournament platform',
      when: '2026 · live at joinmatchday.com',
      oneLiner:
        'Tournament day, coordinated: registration, draws, courts and live scoring for racket sports in one system.',
      awards: [],
      role: 'Built with a team, badminton-first, for organizers, players, scorers, officials and spectators.',
      body: [
        'Replaces the spreadsheets, WhatsApp threads, paper check-in sheets and separate scoring tools most tournaments still run on. Players register for singles or doubles, check in, and follow their courts, live scores, rankings and history. Organizers configure categories, manage waitlists, seed players, generate draws, schedule matches, assign staff and handle disputes.',
        'Live scoring runs inside the tournament workflow, with game-state management, score corrections and an **offline scoring queue for unreliable venue internet**. Spectators follow draws, courts and live matches without an account. Scoring, draws, scheduling, rankings and the tournament lifecycle sit in **isolated, testable business logic** behind one repository layer.',
      ],
      metrics: [],
      stack:
        'React 19 · Vite · React Router · Tailwind CSS · Motion · Supabase (Postgres, Auth, row-level security, Realtime, Storage, Edge Functions)',
      media: {
        image: '/builds/matchday.webp',
        alt: 'Match Day wordmark, "Play. Compete. Belong.", beside its command center flagging matches that are running late',
      },
      links: [
        { label: 'Live site', href: 'https://www.joinmatchday.com' },
        { label: 'Source', href: '' },
      ],
    },
    {
      id: 'yinzone',
      kind: 'Hackathon · 30 hours · team of 5',
      title: 'Yinzone',
      descriptor: 'where new housing can go in Pittsburgh',
      when: 'Sep 2026 · AI Horizons 2026: AI for Housing Hackathon, Track 3',
      oneLiner:
        'Click any lot in Pittsburgh and see which of 16 housing types fit, by what approval path, and what stands in the way.',
      awards: [], // Not in the published top 3 (Technical.ly, Oct 8 2026). No badge.
      role: 'I built the AI chat: voice, cited answers, what-if reruns of the real scorer, and a guard that drops any sentence with a number that is not in the facts.',
      body: [
        'Yinzone scores the city’s parcels on indicators drawn from 134 public datasets. Deterministic code decides every score and every legal status. AI explains and advises: a site-fit model rates each housing type with a confidence, and when it is unsure, it flags a human instead of guessing.',
      ],
      metrics: [
        { value: '~142,000', label: 'Pittsburgh parcels scored\non 53 indicators' },
      ],
      stack:
        'TypeScript · React 19 · TanStack Start · MapLibre GL · oRPC · Drizzle · Neon Postgres + PostGIS · Gemini · Vercel',
      media: {
        image: '/builds/yinzone.webp',
        alt: 'Yinzone logo over a 3D street-scale map of Pittsburgh: "Where could new housing go in Pittsburgh, and what stands in the way?"',
      },
      links: [
        { label: 'Live site', href: '' }, // pending from Vidyut (yin.zone was suspended on Oct 19 2026)
        { label: 'Source', href: 'https://github.com/matmanna/yinzone' },
        { label: 'Video', href: 'https://youtu.be/ECZnv7R-q_8' },
      ],
    },
    {
      id: 'terrametric',
      kind: 'Hackathon · 36 hours · team of 3',
      title: 'Terrametric',
      descriptor: 'crop drought intelligence',
      when: 'Apr 2026 · Bitcamp 2026, University of Maryland',
      oneLiner:
        'Tells farmers which fields are heading into drought stress, and what irrigating them will cost and save.',
      awards: ['2× 1st · Bitcamp 2026'],
      role: 'The idea was mine, and I led the build: system orchestration, model training, the grounded RAG chat and the stress metrics. I also led the live pitch to the judges.',
      body: [
        'Three prizes at Bitcamp 2026, including **1st in the Real World track (Ambrook)** and **1st in the Intermediate Data Science track**. It scores drought stress per field, forecasts it 14 days ahead with XGBoost, and writes an irrigation prescription with cost and savings projections that a farmer can simulate before committing. A RAG agent grounds its answers in Iowa and USDA agronomy documents, and alerts go out by SMS for farmers who never open a dashboard.',
      ],
      metrics: [
        { value: '14-day', label: 'drought-stress forecast\nfor every field' },
      ],
      stack: 'React · Three.js · Leaflet · FastAPI · XGBoost · Qwen 2.5-7B · Twilio · WebSockets',
      media: {
        image: '/builds/terrametric.webp',
        alt: 'Terrametric wordmark, "Soil, weather and crop stress, turned into early warnings", beside a globe marking an Iowa field cluster',
      },
      links: [
        { label: 'Live demo', href: 'https://terrametric-delta.vercel.app/' },
        { label: 'Devpost', href: 'https://devpost.com/software/terrametric' },
        { label: 'Source', href: 'https://github.com/vs-githjk/Terrametric' },
      ],
    },
  ],

  /* ---- Research row (its own shape, after the six cards) ------------------ */
  /* A preprint. Never "published". Two models in the results, never three. */
  research: {
    id: 'secure-codegen',
    kind: 'Research · arXiv preprint · first author',
    title: 'Tool-guided repair for LLM-generated C',
    fullTitle: 'Tool-Guided Retrieval-Augmented Repair for Securing LLM-Generated C Code',
    descriptor: 'GCC · CodeQL · KLEE',
    when: 'Sep 2025 to Jul 2026 · 2nd Place, Engineering, Penn State Undergraduate Exhibition 2026',
    oneLiner:
      'A repair loop that sends compiler and static-analyzer findings back to the model, so LLM-written C comes out compiling and safer.',
    awards: ['2nd · Penn State Exhibition 2026'],
    role: 'First author, with Saatvik Pradhan and Suman Saha.',
    body: [
      'Without help, the models we tested failed to compile up to 46% of their C programs and left security defects in up to 49%. My loop feeds GCC and CodeQL findings back to the model for up to three repair rounds, guided by a growing library of past fixes ranked by how far each got through GCC, CodeQL and KLEE symbolic execution.',
      'Across 5,000 C tasks it **cut CodeLlama 7B’s CodeQL errors by 83.7%**, and nearly halved DeepSeek Coder 1.3B’s compile failures while its security defects fell from 35% to 15%.',
    ],
    metrics: [
      { value: '15,088 → 2,463', label: 'CodeQL errors in CodeLlama 7B’s\nC code, across 5,000 tasks' },
      { value: '42% → 22%', label: 'compile failures for\nDeepSeek Coder 1.3B' },
    ],
    /* Logo-led thumbnail (finder's typeset card with the repair-loop
       diagram). Same file as the ring card. */
    media: {
      image: '/builds/paper.webp',
      alt: 'The paper title and "83.7% fewer CodeQL errors" beside a diagram of the GCC, CodeQL and repair loop, with KLEE as the final check',
    },
    /* Typographic tile: fallback only, if the image is not shipped.
       The arrow is a glyph, never a dash. */
    tile: {
      eyebrow: 'arXiv:2607.21641 · first author',
      number: '15,088 → 2,463',
      line: 'CodeQL errors in CodeLlama 7B’s C code, before and after the repair loop, across 5,000 tasks.',
    },
    stack: 'Python · GCC · CodeQL · KLEE · retrieval · DeepSeek Coder · CodeLlama',
    links: [
      { label: 'Read the paper', href: 'https://arxiv.org/abs/2607.21641' },
      { label: 'Source', href: '' }, // TODO
    ],
  },

  /* ---- More builds: same card shape as `items`, smaller in the layout ----- */
  more: {
    readMore: 'Read more',
    readMoreSr: ' about {title}',
    heading: 'More builds',
    intro: 'A hackathon meeting agent, an interview-prep product, public tools and side projects. Every one has a public repo you can open.',
    items: [
      {
        id: 'quorum',
        kind: 'Hackathon · weekend · team of 4',
        title: 'Quorum',
        descriptor: 'AI meeting participant',
        when: 'Mar 2026 · YHack',
        oneLiner:
          'An AI teammate that sits in the meeting, listens, talks back, and does the task you ask for out loud.',
        awards: [],
        role: 'I wrote most of the code.',
        body: [
          'Quorum joins a live meeting as a participant: it listens in real time, contributes ideas, speaks back, takes actions like filing a GitHub issue on request, and can drive a shared screen. Built over a weekend on Recall.ai, Deepgram, Claude and ElevenLabs, it attacks the same problem I keep working on in PrismAI.',
        ],
        metrics: [],
        stack: 'Python · FastAPI · Claude · Recall.ai · Deepgram · ElevenLabs',
        media: {
          image: '/builds/quorum.webp',
          alt: 'Quorum logo, "Joins your meeting, listens, takes the action, and speaks back", beside a meeting where someone says "Hey Q, file a GitHub issue for the auth bug"',
        },
        links: [
          { label: 'Devpost', href: 'https://devpost.com/software/quorum-vntz2e' },
          { label: 'Source', href: 'https://github.com/vs-githjk/Quorum' },
        ],
      },
      {
        id: 'filingwatch',
        kind: 'Tool · solo · public repo',
        title: 'FilingWatch',
        descriptor: 'SEC 8-K monitor',
        when: 'Sep 2026',
        oneLiner:
          'Watches SEC filings for the companies you follow and tells you what was filed, never what it means.',
        awards: [],
        role: '',
        body: [
          'Once a day it checks EDGAR for new 8-Ks, marks each one notable or routine with fixed rules on item codes (every verdict names the rule that decided it), and emails a digest. Claude Haiku 4.5 writes a one-sentence factual summary, and an output check throws out any summary that drifts into advice, price prediction or opinion. A missing summary is acceptable; a slanted one never ships.',
        ],
        metrics: [],
        stack: 'Python · FastAPI · Claude Haiku 4.5 · SEC EDGAR · APScheduler',
        media: {
          image: '/builds/filingwatch.webp',
          alt: 'FilingWatch "8K" mark, "Reports what was filed, never what it means", beside its feed of recent SEC 8-K filings with notable ones marked',
        },
        links: [{ label: 'Source', href: 'https://github.com/vs-githjk/filingwatch' }],
      },
      /* NextRound = ~/NextRound (platform repo, public) + ~/prep-console
         (the working build, private). One project per Vidyut, Oct 20. */
      {
        id: 'nextround',
        kind: 'Product · private build · public prototype',
        title: 'NextRound',
        descriptor: 'interview readiness, measured',
        when: 'Jul to Sep 2026',
        oneLiner:
          'Interview prep for software engineers: it plans each day, diagnoses what went wrong, and computes every score in code instead of asking a model.',
        awards: [],
        role: 'I wrote 75 of the 78 commits across its two repos, including the architecture.',
        body: [
          'I built the working version for my own prep first. It plans each day to a minute budget, picks problems just above my level in each topic, schedules spaced re-solves and runs a mock interview with a voiced interviewer. When a problem goes badly, Claude diagnoses why, but **every rating and the green, amber or red verdict a mentor sees are computed in code**, with the reasons attached.',
          'On the multi-user platform I measured cost from the first week. Every model call is logged with its tokens and cost, and live probes showed **prompt caching cut the input cost of a 12-turn mock interview by 73%**. A teammate set up the staging deploy. The public prototype is a concept demo of that platform, not the working build.',
        ],
        metrics: [
          { value: '73%', label: 'lower input cost per 12-turn\nmock interview, with prompt caching' },
        ],
        stack: 'React 19 · Vite · Vercel functions · Supabase · Claude API · ElevenLabs · FastAPI · PostgreSQL · Redis',
        media: {
          image: '/builds/nextround.webp',
          alt: 'NextRound logo and the line "Readiness, measured." beside its interactive prototype',
        },
        links: [
          { label: 'Concept demo', href: 'https://vs-githjk.github.io/NextRound-demo/' },
          { label: 'Source', href: 'https://github.com/vs-githjk/NextRound' },
          // The working build (prep-console) is a private repo and a personal
          // deployment that spends API credit: never linked.
        ],
      },
      {
        id: 'cinemachat',
        kind: 'Side project · solo',
        title: 'CinemaChat',
        descriptor: 'agentic movie and TV picks',
        when: 'Mar to Apr 2026',
        oneLiner: 'Ask for a movie the way you would ask a friend, and get picks with reasons.',
        awards: [],
        role: '',
        body: [
          'Every request runs a Claude tool-use loop: Claude decides which tools to call (semantic search over about 1,000 movies, actor and director filmographies, a friend’s taste profile) and how many times, then ranks its picks with a reason for each. It also handles the social part: ask for something you and a friend would both love, or blend your tastes into one shared playlist.',
        ],
        metrics: [],
        stack: 'React · Node/Express · Claude tool use · Pinecone · PostgreSQL · TMDB',
        media: {
          image: '/builds/cinemachat.webp',
          alt: 'CinemaChat wordmark, "Turns vibes into watchlists.", beside its landing page with a row of movie posters',
        },
        links: [
          { label: 'Live demo', href: 'https://cinema-chat-nine.vercel.app/' },
          { label: 'Source', href: 'https://github.com/vs-githjk/CinemaChat' },
        ],
      },
      {
        id: 'transitguard',
        kind: 'Project · solo',
        title: 'TransitGuard',
        descriptor: 'baggage risk dashboard for airport ops',
        when: 'Mar to Apr 2026',
        oneLiner:
          'Flags the transfer bags most likely to miss their connection, while there is still time to save them.',
        awards: [],
        role: '',
        body: [
          'A machine-learning model gives every transfer bag a live risk score from its connection window, delays, gate or terminal changes and congestion. The dashboard ranks bags by urgency, recommends the fix (prioritize the transfer, expedite customs, escalate to a supervisor), and lets staff log each action from flag to resolution. It retrains on historical outcomes from a CSV upload, so it can adapt to a different airport.',
        ],
        metrics: [],
        stack: 'FastAPI · Next.js · TypeScript · ML risk model',
        /* Logo-led thumbnail; no product screenshot (the demo backend is
           gone and is never linked, PROJECT DECISIONS Oct 20). */
        media: {
          image: '/builds/transitguard.webp',
          alt: 'TransitGuard logo, "Missed-connection risk for transfer bags, before the bag misses the flight", beside high, medium and low risk levels',
        },
        tile: { // fallback only
          eyebrow: 'Airport ops · risk scoring',
          number: '0 to 100',
          line: 'A live miss-risk score for every transfer bag, ranked so staff act on the worst first.',
        },
        links: [{ label: 'Source', href: 'https://github.com/vs-githjk/TransitGuard' }],
      },
      {
        id: 'papertrail',
        kind: 'Side project · team of 2',
        title: 'PaperTrail',
        descriptor: 'reading paths for research papers',
        when: 'Apr 2026',
        oneLiner: 'Give it a topic, title, DOI or link, and it maps the papers to read first.',
        awards: [],
        role: 'I wrote most of the code.',
        body: [
          'PaperTrail finds the likely seed paper, builds its ancestor tree from Semantic Scholar and arXiv citations, and lays it out in learning layers, from the paper itself back to its earliest foundations. Broad prompts like "rag" or "agents" get a short clarifying question first, so the tree starts from the right paper.',
        ],
        metrics: [],
        stack: 'React · Vite · D3 · Node/Express · PostgreSQL · Redis · Neo4j',
        media: {
          image: '/builds/papertrail.webp',
          alt: 'PaperTrail wordmark, "Give it a topic, title, DOI or link. It maps the lineage and the reading path.", beside its search screen',
        },
        links: [
          { label: 'Live demo', href: 'https://paper-trail-three-kappa.vercel.app/' },
          { label: 'Source', href: 'https://github.com/vs-githjk/PaperTrail' },
        ],
      },
      {
        id: 'algoquest',
        kind: 'Side project · team of 2',
        title: 'AlgoQuest',
        descriptor: 'algorithms as a game',
        when: 'Apr to May 2026',
        oneLiner: 'Data structures and algorithms taught as a game instead of a problem set.',
        awards: [],
        role: '',
        body: [
          'Eight core algorithms, from bubble sort to Dijkstra, each with a step-by-step visualizer, code in JavaScript and Python, and a short quiz. XP, levels, badges and a timed daily quest keep a learner coming back.',
        ],
        metrics: [],
        stack: 'React · React Router · CSS Modules',
        /* Logo-led thumbnail; the bars are decorative, not a screenshot. */
        media: {
          image: '/builds/algoquest.webp',
          alt: 'AlgoQuest logo, "Learn data structures and algorithms through play", beside decorative sorting bars',
        },
        tile: { // fallback only
          eyebrow: 'DSA, as a game',
          number: 'Bubble sort → Dijkstra',
          line: 'Eight algorithms with step-through visualizers, quizzes and XP.',
        },
        links: [{ label: 'Source', href: 'https://github.com/vs-githjk/AlgoQuest' }],
      },
    ],
  },
};

/* ----------------------------------------------------------- HIGHLIGHTS --- */
/* Optional strip. Never directly under the hero: place it after Builds (or
   inside Proof of work). Each line is a complete statement: what changed,
   by how much, for whom, where. Replaces the old `proof` band. */
export const highlights = {
  eyebrow: 'In one line each',
  items: [
    'Cut **~40% of recurring planning and coordination work** for a 40-person engineering team at Comcast.',
    'Took PrismAI from an empty repo to **14 beta users and 100+ meetings analyzed** in about six months.',
    'Cut CodeLlama 7B’s **CodeQL errors by 83.7% across 5,000 C tasks**, as first author on an arXiv preprint.',
    'Won **1st place in four hackathon tracks** in 2026: two at the AI Hackathon by LA Hacks, two at Bitcamp.',
  ],
};

/* ---------------------------------------------------------- HOW I BUILD --- */
/* 2x2 grid. Each one carries a receipt from the builds above. */
export const principles = {
  eyebrow: 'How I build',
  heading: 'Principles',
  items: [
    {
      title: 'The model explains. Code decides.',
      body: 'In BetterBill, Vytal, FilingWatch and NextRound, deterministic code computes every score, flag, verdict and dollar, and the model reads, drafts and explains. PrismAI’s agency release (in development, Dec 2026) prices change orders the same way. When a number matters, it should never come from a guess.',
    },
    {
      title: 'Something has to be able to say no.',
      body: 'Every system I build has at least one check that can reject the output: a compiler, a static analyzer, an output guard, a test that fails the build, or a person at the approval gate. If nothing can say no, the output is a guess with good formatting.',
    },
    {
      title: 'Measure, then claim.',
      body: 'Every number I publish says what it measures, and where I can, how: BetterBill’s catch rate comes with the fact that we planted the errors, and the paper’s error reduction comes with the set of tasks it was measured on. "Feels better" stays a hunch until a number backs it.',
    },
    {
      title: 'End to end first, then polish.',
      body: 'Terrametric ran from field data to a 14-day forecast to an SMS alert inside 36 hours, because the whole path worked before any part of it was pretty. You cannot tune what does not run.',
    },
  ],
};

/* ------------------------------------------------------------ THE SELL ---- */
/* Hairline rows: tag, claim, receipts. Keep distinct from Principles. */
export const value = {
  eyebrow: 'Who I am at work',
  heading: 'What you get',
  claims: [
    {
      tag: 'Reliability',
      claim: 'I care most about the gap between a good demo and a system people can depend on.',
      receipts: [
        'BetterBill’s rules engine does all of its arithmetic in **integer cents**, so a model’s rounding can never reach a dollar figure.',
        'In PrismAI, a **cross-tenant attack suite blocks CI**, so a data leak between customers fails the build before it can ship.',
      ],
    },
    {
      tag: 'Forward-deployed',
      claim: 'I want to work where the system meets the people using it.',
      receipts: [
        'At Sherlock AI I owned the **demo prospective customers evaluate** before they talk to the team.',
        'At Comcast I **scoped the question, picked the tool and shipped the pilot**, then improved it based on how the team actually used it.',
      ],
    },
    {
      tag: 'Owner',
      claim: 'I run what I build, from the first commit to the first users.',
      receipts: [
        'PrismAI: **1,120 of its 1,352 commits are mine**, from an empty repo to a live beta.',
        'Vytal and MVR are **solo builds**: Vytal is live in a controlled beta, MVR is a working proof of concept.',
      ],
    },
    {
      tag: 'Modernizer',
      claim: 'When I see a manual workflow, I want to rebuild it.',
      receipts: [
        'At Comcast the pilot I shipped **put planning, budget tracking and team communication in one interface**.',
        'MVR exists to modernize legacy software safely: **every claim about the old system links to evidence**.',
      ],
    },
  ],
  footer:
    'What that adds up to: an engineer who can own an AI system end to end, keep it safe and measurable, and stay close enough to the people using it to know whether it helps.',
};

/* --------------------------------------------------------------- TOOLKIT --- */
/* Only tools Vidyut used himself: resume Technical Skills plus stacks of
   projects or lanes he owned (PrismAI, Vytal, MVR, Terrametric, the paper,
   FilingWatch, CinemaChat, Comcast, Sherlock AI, his BetterBill and Yinzone
   lanes, NextRound). Team-only tools from BetterBill/Yinzone (Photon,
   Browser Use, PostGIS, Expo) and Match Day's unconfirmed stack are left
   out. ElevenLabs is in because he wired it himself in NextRound's voiced
   interviewer. Groq stays out. */
export const toolkit = {
  eyebrow: 'Toolkit',
  heading: 'Shipped with,',
  headingEm: 'not read about.',
  groups: [
    {
      name: 'Languages',
      items: ['Python', 'TypeScript', 'JavaScript', 'Java', 'C', 'C++', 'SQL'],
    },
    {
      name: 'AI systems',
      items: [
        'LangGraph',
        'Tool calling',
        'RAG',
        'pgvector',
        'BM25 / RRF',
        'Pinecone',
        'MCP',
        'Prompt caching',
        'Anthropic API',
        'OpenAI API',
        'Gemini',
        'Langflow',
        'XGBoost',
      ],
    },
    {
      name: 'Voice & meetings',
      items: ['Recall.ai', 'Deepgram', 'Cartesia', 'Pipecat', 'ElevenLabs'],
    },
    {
      name: 'Backend & data',
      items: [
        'FastAPI',
        'PostgreSQL',
        'Row-level security',
        'Multi-tenant isolation',
        'Supabase',
        'Redis',
        'SQLAlchemy',
        'Drizzle',
        'Temporal',
        'SSE / WebSockets',
      ],
    },
    {
      name: 'Frontend',
      items: ['React 19', 'Next.js', 'TanStack Start', 'Tailwind CSS', 'Chrome extensions'],
    },
    {
      name: 'Verification & testing',
      items: ['GitHub CodeQL', 'KLEE', 'GCC', 'pytest', 'Vitest', 'Playwright'],
    },
    {
      name: 'Infra & observability',
      items: ['Docker', 'Vercel', 'Render', 'OpenTelemetry', 'Sentry'],
    },
    {
      name: 'Integrations',
      items: ['Slack', 'Microsoft Teams', 'Jira', 'Linear', 'Notion', 'GitHub', 'Twilio'],
    },
  ],
};

/* ----------------------------------------------------------- PROOF OF WORK --- */
/* The one-click verification section. Numbers on the GitHub card are computed
   at build time from src/data/github.json (scripts/fetch-github.mjs), never
   typed here. Wins repeat the award badges above (6 in total). "1st" rests on
   Vidyut's confirmation and his resume; Devpost itself says "Winner" and the
   prize name. Event names follow Devpost. */
export const proofOfWork = {
  eyebrow: 'Proof of work',
  heading: 'Verify me in',
  headingEm: 'one click.',
  intro:
    'Most of what is above leaves a public trail: the graph counts my private-repo work too, and every hackathon win links to its Devpost page.',
  github: {
    eyebrow: 'GitHub · last 12 months',
    handle: '@vs-githjk',
    href: 'https://github.com/vs-githjk',
    graphLabel: '{n} contributions in the last year',
    stats: {
      total: 'contributions',
      streak: 'longest streak',
      streakUnit: ' days',
      month: 'contributions, {month} 1 to {day}',
    },
    note: '',
    phoneNote: 'The graph shows the latest six months on a phone; the totals cover the whole year.',
    updated: 'Updated',
    keyLess: 'Less',
    keyMore: 'More',
  },
  wins: {
    eyebrow: 'Wins',
    link: { label: 'Devpost', href: 'https://devpost.com/vs-githjk' },
    items: [
      {
        title: 'BetterBill · 1st, Visa track',
        event: 'AI Hackathon 2026 by LA Hacks · Oct 2026',
        href: 'https://devpost.com/software/betterbill',
      },
      {
        title: 'BetterBill · 1st, Photon: Best Voice Agent',
        event: 'AI Hackathon 2026 by LA Hacks · Oct 2026',
        href: 'https://devpost.com/software/betterbill',
      },
      {
        title: 'Terrametric · 1st, Real World track (Ambrook)',
        event: 'Bitcamp 2026 · Apr 2026',
        href: 'https://devpost.com/software/terrametric',
      },
      {
        title: 'Terrametric · 1st, Intermediate Data Science track',
        event: 'Bitcamp 2026 · Apr 2026',
        href: 'https://devpost.com/software/terrametric',
      },
      {
        title: 'Terrametric · 3rd, Open Source (Featherless)',
        event: 'Bitcamp 2026 · Apr 2026',
        href: 'https://devpost.com/software/terrametric',
      },
      {
        title: 'Research paper · 2nd Place, Engineering',
        event: 'Penn State Undergraduate Exhibition 2026',
        href: '', // resume only, no public results page
      },
    ],
  },
  tiles: [
    {
      kind: 'Devpost',
      value: 'vs-githjk',
      detail: '5 prize wins across 2 projects',
      href: 'https://devpost.com/vs-githjk',
    },
    {
      kind: 'arXiv',
      value: '2607.21641',
      detail: 'First author · preprint, Jul 2026',
      href: 'https://arxiv.org/abs/2607.21641',
    },
    {
      kind: 'Chrome Web Store',
      value: 'PrismAI Notetaker',
      detail: 'Sends the PrismAI notetaker into a meeting in one click',
      href: 'https://chromewebstore.google.com/detail/prismai-notetaker/bmnjdhgofbbjlngcahneegalddlpjkbh',
    },
    {
      kind: 'LinkedIn',
      value: 'Vidyut Sriram',
      detail: 'Roles and dates',
      href: 'https://www.linkedin.com/in/vidyut-sriram-4b5a012aa',
    },
  ],
};

/* --------------------------------------------------------------- CONTACT --- */
export const contact = {
  eyebrow: 'Contact',
  heading: 'Tell me what’s',
  headingEm: 'broken.',
  blurb:
    'Hiring a forward-deployed engineer or an AI engineer, or building agents that have to hold up with real users? Write to me. I am available from January 2027 and open to relocating. If you think I got something on this page wrong, tell me that too.',
  email: 'vidyut0712@gmail.com',
  copyLabel: 'Copy',
  copiedLabel: 'Copied',
  links: [
    {
      kind: 'LinkedIn',
      value: 'Vidyut Sriram',
      href: 'https://www.linkedin.com/in/vidyut-sriram-4b5a012aa',
    },
    { kind: 'GitHub', value: '@vs-githjk', href: 'https://github.com/vs-githjk' },
    { kind: 'arXiv', value: '2607.21641', href: 'https://arxiv.org/abs/2607.21641' },
    { kind: 'Resume', value: 'Download', href: '/resume.pdf' },
  ],
  footerLeft: 'Vidyut Sriram · State College, PA',
  footerRight: 'Built from scratch · 2026',
  footerTop: 'Back to top',
};
