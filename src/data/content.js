/* ============================================================================
   CONTENT
   ----------------------------------------------------------------------------
   Every word on the site lives here. Nothing in this file controls design.
   Change copy here; change looks in src/styles/. The two never touch.

   THESIS: "Vidyut Sriram builds safe, reliable AI systems."
   Goal for a recruiter, in 60 seconds: he has done a lot, he has won things,
   and he is good at the job. Then: email him.

   Rules for this file:
   - Every number traces to a source. The map is in copy-notes.md.
   - Unknown facts are omitted (empty href/value is filtered at render) or
     marked TODO. Never invent.
   - **double asterisks** = emphasis, the only markup.
   - No em dashes or en dashes anywhere. Date ranges use "to".
   ========================================================================== */

export const meta = {
  name: 'Vidyut Sriram',
  title: 'Vidyut Sriram | safe, reliable AI systems',
  description:
    'Vidyut Sriram builds safe, reliable AI systems. Penn State CS, graduating Dec 2026, available Jan 2027. Builder of PrismAI, six awards, first author on arXiv:2607.21641.',
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
/* Left: name, identity, proof, actions. Right: the project carousel.
   proofLine says "six awards": LA Hacks AI Hackathon (2) + BitCamp 2026 (3) +
   Penn State Exhibition 2026 (1). Keep it in sync with proof[0] and with the
   awards[] arrays below (2 + 3 + 1). */
export const hero = {
  status: 'Available Jan 2027',
  /* Studio headshot: 600px and 1200px (2x) squares, shown as a circle. */
  portrait: {
    src: '/portrait.jpg',
    src2x: '/portrait@2x.jpg',
    alt: 'Vidyut Sriram, smiling, in a light blue polo',
  },
  headline: 'Vidyut Sriram',
  identity: 'Builds safe, reliable AI systems.',
  identitySub: 'Penn\u00A0State CS, graduating Dec\u00A02026.',
  proofLine:
    'Shipped **PrismAI to 14 beta users**, interned at **Comcast** and **Sherlock AI**, first author on an **arXiv preprint**, and **six awards**, four of them first place.',
  locationNote: 'State College, PA',
  /* Buttons. Email is the one primary action. */
  actions: [
    { label: 'Email me', href: 'mailto:vidyut0712@gmail.com', primary: true },
    { label: 'Resume', href: '/resume.pdf' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/vidyut-sriram-4b5a012aa' },
    { label: 'GitHub', href: 'https://github.com/vs-githjk' },
  ],

  /* ---- Carousel: "What I've built" ----------------------------------------
     Slide id = Builds card id, so the slide links to #build-<id>.
     oneLiner: 8 words or fewer. award: badge text, '' = no badge.
     JPEG q82, under 180KB) into image.src before shipping.
     The paper slide has no image: it renders the typographic tile from
     builds.research.tile. MVR is never called AI. */
  carousel: {
    label: "What I've built",
    slideCta: 'See the build',
    controls: {
      pause: 'Stop automatic slide show',
      play: 'Start automatic slide show',
      prev: 'Previous project',
      next: 'Next project',
      choose: 'Choose project',
      goTo: 'Go to project {k} of {n}',
    },
    slides: [
      {
        id: 'prismai',
        title: 'PrismAI',
        oneLiner: 'Turns meetings into follow-up emails and tasks.',
        award: '',
        image: {
          src: '/builds/prismai-analysis.jpg',
          alt: 'PrismAI meeting analysis: a summary, topics covered, action items, decisions and a health score',
        },
      },
      {
        id: 'betterbill',
        title: 'BetterBill',
        oneLiner: 'Snap a hospital bill, find charges worth questioning.',
        award: '2 first places · LA Hacks',
        image: {
          src: '/builds/betterbill.jpg',
          alt: 'BetterBill results screen with flagged bill lines and a fair balance',
        },
      },
      {
        id: 'mvr',
        title: 'MVR',
        oneLiner: 'Maps legacy code, every claim linked to evidence.',
        award: '',
        image: {
          src: '/builds/mvr.jpg',
          alt: 'MVR system model where every claim about the codebase is linked to evidence',
        },
      },
      {
        id: 'vytal',
        title: 'Vytal',
        oneLiner: 'Coaching platform for fitness coaches, live in beta.',
        award: '',
        image: {
          src: '/builds/vytal.jpg',
          alt: 'Vytal coach overview showing which trainees need attention first (synthetic data)',
        },
      },
      {
        id: 'matchday',
        title: 'Match Day',
        oneLiner: 'Run a racket tournament from one screen.',
        award: '',
        image: {
          src: '/builds/matchday.jpg',
          alt: 'Match Day command center flagging matches that are running late',
        },
      },
      {
        id: 'yinzone',
        title: 'Yinzone',
        oneLiner: 'Where new housing can go in Pittsburgh.',
        award: '',
        image: {
          src: '/builds/yinzone.jpg',
          alt: 'Yinzone 3D map of Pittsburgh at street scale',
        },
      },
      {
        id: 'terrametric',
        title: 'Terrametric',
        oneLiner: 'Field-level drought risk and irrigation plans for farmers.',
        award: '3 awards · BitCamp 2026',
        image: {
          src: '/builds/terrametric.jpg', // already in public/builds/
          alt: 'Terrametric landing page with a field-level crop stress map',
        },
      },
      {
        id: 'secure-codegen',
        title: 'Research paper',
        oneLiner: 'A repair loop that makes LLM-written C safer.',
        award: '2nd · PSU Exhibition 2026',
        image: null, // typographic slide: renders builds.research.tile
      },
    ],
  },
};

/* ---------------------------------------------------------- PROOF STRIP ---- */
/* Six cells, directly under the hero. Done stuff, won stuff.
   Awards = 6: LA Hacks AI Hackathon 1st Visa track + 1st Photon track (2);
   BitCamp 2026 1st Real World + 1st Data Science + 3rd Open Source (3);
   Penn State Undergraduate Exhibition 2026 2nd, Engineering (1).
   First places = 4 (2 LA Hacks + 2 BitCamp).
   Builds = 12: PrismAI + 6 featured + the paper + 4 compact. */
export const proof = [
  {
    value: '6',
    label: 'Awards',
    sub: '4 first places. Awards by event: LA Hacks AI Hackathon 2, BitCamp 3, Penn State Exhibition 1.',
  },
  { value: '12', label: 'Builds', sub: 'products, hackathon builds, research' },
  { value: '14', label: 'Live beta users', sub: 'PrismAI, multi-tenant' },
  { value: '100+', label: 'Meetings analyzed', sub: 'PrismAI beta' },
  { value: '~40%', label: 'Coordination work cut', sub: 'Comcast, 40-person eng team' },
  { value: '83.7%', label: 'Fewer CodeQL errors', sub: 'first-author arXiv preprint' },
];

/* --------------------------------------------------------------- WHERE ---- */
/* `wins` render as neutral outcome pills. */
export const experience = {
  eyebrow: "Where I've worked",
  heading: 'Experience',
  roles: [
    {
      org: 'Sherlock AI',
      logo: '/logos/sherlock.png',
      role: 'Software Engineering Intern',
      team: '',
      note: 'Owned the public demo interview flow end to end in Next.js: adaptive interview behavior, in-browser recording and submission. It is the surface prospective customers evaluate before they talk to the team. Also prototyped a Google Meet add-on that shows audit logs and checks interview integrity from a sidebar inside the live call.',
      wins: [],
      when: 'Jun to Aug 2026',
      where: 'Remote',
    },
    {
      org: 'Comcast',
      logo: '/logos/comcast.png',
      role: 'Software Development Engineer Intern',
      team: 'India Engineering Centre',
      note: 'Asked whether low-code agent tooling could work inside engineering teams. I scoped the problem, chose Langflow and shipped the pilot: one interface for planning, budget tracking, structured data and team communication, plus a code-input surface. Then I added RAG over internal docs based on real usage.',
      wins: [
        'Adopted by a 40-person engineering team',
        '~40% less recurring planning and coordination work',
        '~18% further gain in communication efficiency',
      ],
      when: 'May to Aug 2025',
      where: 'Chennai, India',
    },
    /* The teaching row is the evidence for the customer-facing half of
       forward-deployed work. Keep it. */
    {
      org: 'Penn State',
      logo: '/logos/psu.png',
      role: 'Learning Assistant · Math Peer Tutor',
      team: 'B.S. Computer Science, Math minor',
      note: 'Calculus review sessions and one-on-one tutoring across introductory math: explaining hard ideas to people who do not share my context, and finding where a mental model broke.',
      wins: ['GPA 3.84', "Dean's List 6 of 6"],
      when: 'LA · Aug 2025 to May 2026\nTutor · Jan 2026 to Present',
      where: 'University Park, PA',
    },
  ],
};

/* -------------------------------------------------------------- BUILDS ---- */
/* Order (Vidyut's): PrismAI, BetterBill, MVR, Vytal, Match Day, Yinzone,
   Terrametric, the paper; then CinemaChat, TransitGuard, PaperTrail,
   AlgoQuest.
   Shape of every build:
   id (= carousel slide id; card anchor is #build-<id>), kind, title,
   descriptor, when, oneLiner, awards (verified only; badge text), role
   (team builds), body (outcome first), metrics (sourced only, max 3), stack,
   links (empty href hides), media. Cards reuse the carousel images. */
export const builds = {
  eyebrow: "What I've built",
  heading: 'Builds',
  intro:
    'Twelve builds: a flagship product, six more products and hackathon wins, a first-author paper and four smaller projects. Every number here has a source I can show you.',

  /* ---- Flagship panel ---------------------------------------------------- */
  flagship: {
    id: 'prismai',
    kind: 'Product · live beta · public launch Dec 2026',
    title: 'PrismAI',
    descriptor: 'approval-first meeting agent',
    when: 'Mar 2026 to Present',
    oneLiner: 'A meeting agent that turns what people promise on a call into work that gets done.',
    awards: [],
    role: '',
    body: [
      '**Live in beta with 14 users across isolated workspaces, 100+ meetings analyzed**, built from zero in about six months. A Recall.ai bot joins Meet, Zoom or Teams, and **12 LangGraph agents** turn the call into decisions, action items, follow-up emails and Jira or Linear tasks, with hybrid search (pgvector plus BM25, fused) and an MCP connector for Claude and ChatGPT.',
      'Building now for agencies and client-services teams: PrismAI checks each client request against the signed agreement, quotes the clause, and drafts a change order at the agency’s own rates. **Code computes the money, not a model, and nothing is sent until the owner approves.**',
      'Tenancy is enforced, not hoped for: a route-coverage test fails the build for any unregistered route, and a cross-tenant attack suite blocks CI.',
    ],
    metrics: [
      { value: '14', label: 'live beta\nusers' },
      { value: '100+', label: 'meetings\nanalyzed' },
      { value: '12', label: 'LangGraph\nagents' },
    ],
    stack:
      'React · FastAPI · LangGraph · Claude · OpenAI · Supabase/pgvector · BM25/RRF · MCP · Recall.ai · Deepgram · Cartesia',
    media: {
      /* The live product doing work: a meeting analysis with summary, topics,
         action items, decisions and a health score (Chrome Web Store
         screenshot, Vidyut's own meeting). The scope-check storyboard film is
         a design preview of an unbuilt feature, so it is not shown as product. */
      video: '', // TODO: a screen-recording loop of the live product
      image: '/builds/prismai-analysis.jpg',
      alt: 'PrismAI meeting analysis: a summary, topics covered, action items, decisions and a health score',
    },
    links: [
      { label: 'Live site', href: 'https://www.meetprismai.com/' },
      { label: 'Source', href: '' }, // private repo
    ],
  },

  /* ---- Featured cards (2-column grid), in Vidyut's order ------------------ */
  items: [
    {
      id: 'betterbill',
      kind: 'Hackathon · 24 hours · team\u00A0of\u00A04',
      title: 'BetterBill',
      descriptor: 'hospital bill advocate',
      when: 'Oct 2026 · LA Hacks AI Hackathon 2026',
      oneLiner:
        'Snap a hospital bill. It flags charges worth questioning, shows the proof, and acts only after you approve.',
      /* Confirmed by Vidyut in chat. Official challenge titles (event portal,
         per ~/hackathons/la-hacks-2026/plan/sat/challenges.md): Visa, "The
         Future of Shopping: Powered by AI, Secured by Visa"; Photon,
         messaging and calling agents. No public results page found. */
      awards: ['1st · Visa track', '1st · Photon track'],
      role: 'I owned bill intelligence: the rules engine, the bill readers, the API and Sentry AI monitoring.',
      body: [
        'Our team won **1st place in the Visa track**, and **1st place in the Photon track** for the voice agent that calls the billing office over a Photon line once you approve. The model only transcribes; a deterministic rules engine computes every flag and dollar in integer cents, each tied to a source. On test bills with planted errors it caught **22 of 22 with zero false flags** on clean bills.',
      ],
      metrics: [
        { value: '2', label: 'first places\nLA Hacks AI Hackathon' },
        { value: '22/22', label: 'planted errors\ncaught' },
        { value: '88.8%', label: 'line recall on\n35 bill photos' },
      ],
      stack:
        'TypeScript · TanStack Start · Expo · oRPC · Drizzle · Postgres · StepFun · Gemini · ElevenLabs · Photon · Sentry',
      media: {
        image: '/builds/betterbill.jpg',
        alt: 'BetterBill results screen with flagged bill lines and a fair balance',
      },
      links: [
        { label: 'Live site', href: 'https://betterbill.matmanna.dev' }, // TODO: open in a browser before shipping
        { label: 'Source', href: 'https://github.com/matmanna/betterbill' },
        { label: 'Video', href: 'https://vimeo.com/matmanna/betterbillgg' },
        { label: 'Devpost', href: 'https://devpost.com/software/betterbill' },
      ],
    },
    {
      id: 'mvr',
      kind: 'Product · proof of concept',
      title: 'MVR',
      descriptor: 'verified software modernization',
      when: 'Sep 2026 to Present',
      oneLiner:
        'Rebuilds an existing codebase into a model where every claim links to evidence, before anyone changes a line.',
      awards: [],
      role: '', // TODO: confirm solo build
      body: [
        'A working proof of concept, run locally on synthetic codebases. Seven deterministic analyzers turn a content-addressed snapshot into a system model, and anything they cannot prove is recorded as unknown, never guessed. On its own evaluation it made **zero false-certainty claims**, with tenant isolation enforced by forced Postgres row-level security.',
      ],
      metrics: [
        { value: '0', label: 'false-certainty\nclaims' },
        { value: '2,320', label: 'unit tests\npassing' },
        { value: '312', label: 'tenant-isolation\ntests' },
      ],
      stack:
        'FastAPI · React 19 · TypeScript · PostgreSQL (forced RLS) · Temporal · S3 · OIDC · OpenTelemetry',
      media: {
        image: '/builds/mvr.jpg',
        alt: 'MVR system model where every claim about the codebase is linked to evidence',
      },
      links: [{ label: 'Source', href: '' }], // private repo, no public URL
    },
    {
      id: 'vytal',
      kind: 'Product · controlled beta',
      title: 'Vytal',
      descriptor: 'coaching platform for fitness coaches',
      when: 'Jul 2026 to Present', // TODO: confirm still active
      oneLiner:
        'Coaching software where the coach stays in charge: explainable scores, and AI only where a person confirms it.',
      awards: [],
      role: '', // TODO: confirm solo build
      body: [
        'Live at joinvytal.live in a controlled beta for multi-coach organizations. Every score is deterministic, versioned and explained with reason codes; the one model in the loop turns a meal photo into a macro estimate the trainee must confirm. Access control runs through a single policy check, and trainee reassignments keep an append-only audit trail.',
      ],
      metrics: [{ value: '333', label: 'commits in\n12 weeks' }],
      stack:
        'FastAPI · SQLAlchemy · PostgreSQL · React · TypeScript · TanStack Query · Claude Haiku 4.5 · Cloudflare R2 · Render · Vercel',
      media: {
        image: '/builds/vytal.jpg',
        alt: 'Vytal coach overview showing which trainees need attention first (synthetic data)',
      },
      links: [
        { label: 'Live site', href: 'https://joinvytal.live' },
        { label: 'Source', href: '' }, // private repo
      ],
    },
    {
      id: 'matchday',
      kind: 'Product · live',
      title: 'Match Day',
      descriptor: 'racket tournament platform',
      when: '2026', // TODO: build dates
      oneLiner:
        'Run a racket tournament from one screen: the draw, courts, schedule and live scores on every phone.',
      awards: [],
      role: '', // TODO: solo or team? If team, "Team of N. I built ..."
      body: [
        'Live at joinmatchday.com. Organizers seed the draw, schedule courts and score matches live; the scheduler flags double-booked players and courts, and entry caps are enforced in the database so two people cannot take the last slot. A command center shows which matches are running late and which court is overloaded.',
      ],
      metrics: [],
      stack: '', // TODO: confirm stack (public bundle suggests React, Vite, Supabase, Vercel)
      media: {
        image: '/builds/matchday.jpg',
        alt: 'Match Day command center flagging matches that are running late',
      },
      links: [
        { label: 'Live site', href: 'https://www.joinmatchday.com' },
        { label: 'Source', href: '' },
      ],
    },
    {
      id: 'yinzone',
      kind: 'Hackathon · 30 hours · team\u00A0of\u00A05',
      title: 'Yinzone',
      descriptor: 'where new housing can go in Pittsburgh',
      when: 'Sep 2026 · AI for Housing Hackathon, Track 3',
      oneLiner:
        'Click any lot in Pittsburgh and see which of 16 housing types fit, by what approval path, and what stands in the way.',
      awards: [], // Not in the published top 3 (Technical.ly, Oct 8 2026). No badge.
      role: 'I built the explain-only AI chat: voice, cited answers, and a guard that drops any sentence with a number not in the facts.',
      body: [
        'Scores **about 142,000 city parcels** on 53 indicators drawn from 134 public datasets. Deterministic code decides every score and legal status; AI only explains, and a person is flagged when the model is unsure.',
      ],
      metrics: [
        { value: '142K', label: 'parcels\nscored' },
        { value: '53', label: 'indicators' },
        { value: '134', label: 'public\ndatasets' },
      ],
      stack:
        'TypeScript · React 19 · TanStack Start · MapLibre GL · oRPC · Drizzle · Neon Postgres + PostGIS · Gemini · Vercel',
      media: {
        image: '/builds/yinzone.jpg',
        alt: 'Yinzone 3D map of Pittsburgh at street scale',
      },
      links: [
        { label: 'Live site', href: '' }, // yin.zone is suspended (WHOIS verification page, Oct 19 2026); restore once it serves the app
        { label: 'Source', href: 'https://github.com/matmanna/yinzone' },
        { label: 'Video', href: 'https://youtu.be/ECZnv7R-q_8' },
      ],
    },
    {
      id: 'terrametric',
      kind: 'Hackathon · 36 hours · team\u00A0of\u00A03',
      title: 'Terrametric',
      descriptor: 'crop drought intelligence',
      when: 'Apr 2026 · BitCamp, UMD',
      oneLiner:
        'Satellite data is abundant. Irrigation decisions are still guesses. This closes the gap.',
      awards: ['1st · Real World track', '1st · Data Science track', '3rd · Open Source'],
      role: '', // TODO: solo or team?
      body: [
        'Three awards at BitCamp 2026, including **1st in the Real World track (Ambrook)** and **1st in Data Science**. It scores drought risk per field, writes an irrigation prescription with cost and savings projections, and lets a farmer simulate the decision first. A 14-day per-field forecast runs on XGBoost, a RAG agent grounds it in Iowa and USDA documents, and alerts go out by SMS.',
      ],
      metrics: [
        { value: '3', label: 'awards in\n36 hours' },
        { value: '14-day', label: 'per-field stress\nforecast' },
      ],
      stack: 'React · Three.js · Leaflet · FastAPI · XGBoost · Qwen 2.5-7B · Twilio · WebSockets',
      media: {
        image: '/builds/terrametric.jpg',
        alt: 'Terrametric landing page with a field-level crop stress map',
      },
      links: [
        { label: 'Live demo', href: 'https://terrametric-delta.vercel.app/' },
        { label: 'Source', href: 'https://github.com/vs-githjk/Terrametric' },
        { label: 'Devpost', href: 'https://devpost.com/software/terrametric' },
      ],
    },
  ],

  /* ---- Research row (its own shape, after the six cards) ------------------ */
  /* A preprint. Never "published". */
  research: {
    id: 'secure-codegen',
    kind: 'Research · arXiv preprint · first author',
    title: 'Tool-guided repair for LLM-generated C',
    fullTitle: 'Tool-Guided Retrieval-Augmented Repair for Securing LLM-Generated C Code',
    descriptor: 'GCC · CodeQL · KLEE',
    when: 'Sep 2025 to Jul 2026',
    oneLiner:
      'A repair loop that does not accept a model’s C code until the compiler and a static analyzer agree.',
    awards: ['2nd · PSU Exhibition 2026'],
    awardsLong: '2nd Place, Engineering · Penn State Undergraduate Exhibition 2026',
    role: 'First author, with Saatvik Pradhan and Suman Saha.',
    body: [
      'Across 5,000 C tasks, the loop **cut CodeLlama 7B’s CodeQL errors from 15,088 to 2,463** and nearly halved DeepSeek Coder 1.3B’s compile failures, 42% to 22%, with its security defects falling from 35% to 15%. Each repair round retrieves lessons from a growing library of past fixes, ranked by how far they got through GCC, CodeQL and KLEE symbolic execution.',
    ],
    metrics: [
      { value: '83.7%', label: 'fewer CodeQL errors\nCodeLlama 7B' },
      { value: '42 → 22%', label: 'compile failures\nDeepSeek 1.3B' },
      { value: '5,000', label: 'C tasks\nevaluated' },
    ],
    /* Typographic tile: used by the research row and carousel slide 8.
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

  /* ---- Compact tier: hairline index rows ---------------------------------- */
  compact: {
    heading: 'More builds',
    indexLabel: 'Index {from} to {to}',
    items: [
      {
        id: 'cinemachat',
        title: 'CinemaChat',
        oneLiner:
          'Movie and TV picks in plain language. Claude chooses which retrieval tools to call (filmographies, semantic search) and reasons to a recommendation instead of keyword-matching one.',
        stack: 'JavaScript · Claude',
        year: 'Mar 2026', // repo created
        links: [
          { label: 'Live demo', href: 'https://cinema-chat-nine.vercel.app/' },
          { label: 'Source', href: 'https://github.com/vs-githjk/CinemaChat' },
        ],
      },
      {
        id: 'transitguard',
        title: 'TransitGuard',
        oneLiner:
          'Scores each transfer bag by its odds of missing the connection, then tells airport ops what to do before the bag is gone.',
        stack: 'FastAPI · Next.js · TypeScript',
        year: 'Mar 2026', // repo created
        links: [{ label: 'Source', href: 'https://github.com/vs-githjk/TransitGuard' }],
      },
      {
        id: 'papertrail',
        title: 'PaperTrail',
        oneLiner:
          'Give it a topic, title, DOI or link. It finds the seed paper, builds the ancestor tree and lays out a reading path from the foundations up.',
        stack: 'JavaScript · TypeScript',
        year: 'Apr 2026', // repo created
        links: [{ label: 'Source', href: 'https://github.com/vs-githjk/PaperTrail' }],
      },
      {
        id: 'algoquest',
        title: 'AlgoQuest',
        oneLiner: 'Data structures and algorithms taught as a game instead of a problem set.',
        stack: 'React · JavaScript',
        year: 'Apr 2026', // repo created
        links: [{ label: 'Source', href: 'https://github.com/vs-githjk/AlgoQuest' }],
      },
    ],
  },
};

/* ---------------------------------------------------------- HOW I BUILD --- */
/* 2x2 grid. Each one carries a receipt from the builds above. */
export const principles = {
  eyebrow: 'How I build',
  heading: 'Principles',
  items: [
    {
      title: 'Code decides. The model explains.',
      body: 'In BetterBill, Yinzone, Vytal and PrismAI, deterministic code computes every score, flag and dollar. The model reads, drafts and explains. When the number matters, it should not come from a guess.',
    },
    {
      title: 'Distrust the first output.',
      body: 'Every system I build has something that can say no: a compiler, a static analyzer, a claim checker, a human at the gate. If nothing can say no, the output is a guess with good formatting.',
    },
    {
      title: 'Measure, then claim.',
      body: '~40% at Comcast, 5,000 tasks in the paper, 22 of 22 planted errors in BetterBill’s eval. "Feels better" is a hunch, not a result.',
    },
    {
      title: 'End to end, then optimize.',
      body: 'Terrametric went from satellite data to an SMS in a farmer’s hand in 36 hours because the whole path ran before any part of it was polished. You cannot tune what does not run.',
    },
  ],
};

/* ------------------------------------------------------------ THE SELL ---- */
/* Hairline rows: tag, claim, receipts. Keep distinct from Principles. */
export const value = {
  eyebrow: 'Who I am at work',
  heading: 'Value',
  claims: [
    {
      tag: 'Reliability',
      claim: 'I care most about the gap between "works in the demo" and "works."',
      receipts: [
        'My repair loop cut CodeLlama 7B’s CodeQL errors **83.7%** across 5,000 C tasks.',
        'In PrismAI, a **cross-tenant attack suite blocks CI**, so one customer’s data cannot leak into another’s.',
      ],
    },
    {
      tag: 'Forward-deployed',
      claim: 'I want to sit where the system meets the user, not two teams away.',
      receipts: [
        'At Sherlock AI I owned the **demo flow prospective customers evaluate** before they talk to the team.',
        'At Comcast I **drove adoption across a 40-person team**, then iterated on how they actually used it.',
      ],
    },
    {
      tag: 'Owner',
      claim: 'I treat every build as mine to run, not mine to hand off.',
      receipts: [
        'PrismAI: **1,120 of its 1,352 commits are mine**, from first commit to 14 live beta users.',
        'Vytal: **333 commits in 12 weeks**, live in a controlled beta at joinvytal.live.',
      ],
    },
    {
      tag: 'Modernizer',
      claim: 'I see a manual workflow and cannot leave it alone.',
      receipts: [
        'At Comcast the pilot I shipped removed **~40% of a team’s recurring planning and coordination work**.',
        'MVR exists to modernize legacy software safely: **every claim about the old system links to evidence**.',
      ],
    },
  ],
  footer:
    'What that adds up to: an engineer who owns an AI system end to end, keeps it safe and reliable, and sits close enough to the users to know whether it is helping.',
};

/* --------------------------------------------------------------- TOOLKIT --- */
/* Only tools Vidyut used himself: resume Technical Skills plus stacks of
   projects or lanes he owned (PrismAI, Vytal, MVR, Terrametric, the paper,
   Comcast, Sherlock AI, his BetterBill and Yinzone lanes). Team-only tools
   from BetterBill/Yinzone (ElevenLabs, Photon, Browser Use, PostGIS, Expo)
   and Match Day's unconfirmed stack are left out. Groq stays out. */
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
        'RAG',
        'pgvector',
        'BM25 / RRF',
        'MCP',
        'Anthropic API',
        'OpenAI API',
        'Gemini',
        'Langflow',
        'XGBoost',
      ],
    },
    {
      name: 'Voice & meetings',
      items: ['Recall.ai', 'Deepgram', 'Cartesia', 'Pipecat'],
    },
    {
      name: 'Backend & data',
      items: [
        'FastAPI',
        'PostgreSQL',
        'Row-level security',
        'Supabase',
        'Drizzle',
        'Temporal',
        'Multi-tenant isolation',
      ],
    },
    {
      name: 'Frontend',
      items: [
        'React 19',
        'Next.js',
        'TanStack Start',
        'Three.js',
        'Chrome extensions',
      ],
    },
    {
      name: 'Verification & testing',
      items: ['GitHub CodeQL', 'KLEE', 'pytest'],
    },
    {
      name: 'Infra & observability',
      items: [
        'Docker',
        'Vercel',
        'Render',
        'OpenTelemetry',
        'Sentry',
      ],
    },
    {
      name: 'Integrations',
      items: [
        'Slack',
        'Microsoft Teams',
        'Jira',
        'Linear',
        'GitHub',
        'Twilio',
      ],
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
    'Everything above leaves a public trail. Each hackathon win links to its Devpost page.',
  github: {
    eyebrow: 'GitHub · last 12 months',
    handle: '@vs-githjk',
    href: 'https://github.com/vs-githjk',
    graphLabel: '{n} contributions in the last year',
    stats: {
      total: 'contributions',
      active: 'active days',
      streak: 'longest streak',
      streakUnit: ' days',
      month: 'in {month} so far',
    },
    note: 'Includes private repos (PrismAI, Vytal, MVR).',
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
        event: 'LA Hacks AI Hackathon 2026 · Oct 2026',
        href: 'https://devpost.com/software/betterbill',
      },
      {
        title: 'BetterBill · 1st, Photon track (voice agent)',
        event: 'LA Hacks AI Hackathon 2026 · Oct 2026',
        href: 'https://devpost.com/software/betterbill',
      },
      {
        title: 'Terrametric · 1st, Real World track',
        event: 'BitCamp 2026 · Apr 2026',
        href: 'https://devpost.com/software/terrametric',
      },
      {
        title: 'Terrametric · 1st, Data Science track',
        event: 'BitCamp 2026 · Apr 2026',
        href: 'https://devpost.com/software/terrametric',
      },
      {
        title: 'Terrametric · 3rd, Open Source',
        event: 'BitCamp 2026 · Apr 2026',
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
      detail: 'Public listing · updated Aug 2026',
      href: 'https://chromewebstore.google.com/detail/prismai-notetaker/bmnjdhgofbbjlngcahneegalddlpjkbh',
    },
    {
      kind: 'LinkedIn',
      value: '/in/vidyut-sriram',
      detail: 'Roles, dates and references',
      href: 'https://www.linkedin.com/in/vidyut-sriram-4b5a012aa',
    },
  ],
};

/* --------------------------------------------------------------- CONTACT --- */
export const contact = {
  eyebrow: 'Contact',
  heading: "Tell me what's",
  headingEm: 'broken.',
  blurb:
    'Hiring for 2027, building with agents or retrieval, or want to push back on something above? Write to me.',
  email: 'vidyut0712@gmail.com',
  copyLabel: 'Copy',
  copiedLabel: 'Copied',
  links: [
    {
      kind: 'LinkedIn',
      value: '/in/vidyut-sriram',
      href: 'https://www.linkedin.com/in/vidyut-sriram-4b5a012aa',
    },
    { kind: 'GitHub', value: '@vs-githjk', href: 'https://github.com/vs-githjk' },
    { kind: 'arXiv', value: '2607.21641', href: 'https://arxiv.org/abs/2607.21641' },
    { kind: 'Resume', value: 'Download', href: '/resume.pdf' },
  ],
  footerLeft: 'Vidyut Sriram · State College, PA',
  footerRight: 'Built from scratch · 2026',
};
