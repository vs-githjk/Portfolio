/* ============================================================================
   CONTENT
   ----------------------------------------------------------------------------
   Every word on the site lives here. Nothing in this file controls design.
   Change copy here; change looks in src/styles/. The two never touch.

   THESIS: "the model is the easy part." Vidyut reads as a builder first.
   Research is evidence of an instinct, not the headline.

   TODO markers are the things only you can fill in.
   ========================================================================== */

export const meta = {
  name: 'Vidyut Sriram',
  title: 'Vidyut Sriram — safe, reliable AI systems',
  description:
    "Penn State CS '27. I build safe, reliable AI systems and modernize the workflows around them — forward-deployed engineer and entrepreneur in the making.",
  location: 'State College, PA',
};

export const nav = [
  { label: 'Work', href: '#work' },
  { label: 'Builds', href: '#builds' },
  { label: 'How I build', href: '#principles' },
  { label: 'Contact', href: '#contact' },
];

export const hero = {
  eyebrow: "AI systems engineer · forward-deployed by instinct — Penn State CS '27",
  headline: 'Vidyut Sriram',
  assertion: 'builds safe, reliable systems',
  blurb:
    "I modernize how teams work by building AI they can actually trust — retrieval that retrieves, agent graphs that don't deadlock, and pipelines that fail loudly instead of lying.",
  blurbEmphasis: "Right now that's PrismAI —",
  blurbTail:
    'a meeting intelligence platform where the bot participates live in the call, and twelve agents turn the transcript into structured, actionable output in about two seconds.',
  // Sporty silhouette next to the name. Drop your cut-out at
  // public/hero-silhouette.png (transparent PNG or SVG), then set src below.
  figure: { src: '', alt: 'Vidyut mid-play, silhouetted' }, // TODO
  availability: 'Available June 2027 · new grad & internship', // TODO: match what you're actually recruiting for
  locationNote: 'State College, PA — open to relocate',
};

/* ---------------------------------------------------------------------------
   SIGNATURE ELEMENT: the PrismAI pipeline, animated in the hero.
   Rendered by src/components/Pipeline.jsx
   ------------------------------------------------------------------------ */
export const pipeline = {
  label: 'prismai · analysis pipeline',
  project: 'two-tier LangGraph',
  ingest: { name: 'ingest', desc: 'recall.ai bot · paste · upload' },
  orchestrator: {
    name: 'orchestrator',
    desc: 'deterministic routing, no LLM — gates sentiment to 2+ speakers',
  },
  tier1: ['summarizer', 'decisions', 'action items', 'sentiment', 'speaker coach', 'classifier'],
  barrier: {
    name: 'tier-1 barrier',
    desc: 'merge → decision linker (tier 1.5) → context for tier 2',
  },
  tier2: [
    'follow-up email',
    'health score',
    'calendar suggester',
    'action executor',
    'content analyst',
  ],
  output: { name: 'sse stream', desc: 'incremental, to client' },
  timerLabel: 'elapsed',
  target: 2.0, // seconds the animation counts toward
  foot: [
    { text: 'The control plane is ' },
    { text: 'deterministic — no LLM decides the route', strong: true },
    { text: '. Tier 2 runs enriched with everything Tier 1 found.' },
  ],
};

/* Building-first. The paper is one of four, not the lead. */
export const proof = [
  { value: '4', label: 'Systems shipped', sub: 'hackathon to production' },
  { value: '3', label: 'Tracks won', sub: 'BitCamp 2026, in 36 hours' },
  { value: '40%', label: 'Effort removed', sub: 'Comcast internal tooling' },
  { value: '1', sup: 'st', label: 'Author', sub: 'arXiv:2601.00509, cs.CR' },
];

/* --------------------------------------------------------------- WHERE ---- */
export const experience = {
  heading: "Where I've worked",
  intro:
    'Engineering where the work meets real users — and teaching that keeps me honest about explaining it.',
  roles: [
    {
      org: 'Sherlock AI',
      logo: '/logos/sherlock.png',
      role: 'Software Engineer Intern',
      team: '',
      note: "Built Sherlock's public demo interview flow in Next.js — the one screen a candidate actually meets: adaptive interview behavior, recording and submission, and the branded polish that makes it feel like a product. Also a Google Meet add-on proof of concept that renders audit logs and validates the interview from a live sidebar inside the call.",
      wins: [],
      when: 'Jun 2026 — Present',
      where: 'Remote',
    },
    {
      org: 'Comcast',
      logo: '/logos/comcast.png',
      role: 'Software Development Engineer Intern',
      team: 'India Engineering Centre',
      note: 'Built an agentic system — RAG, modular pipelines, multi-step reasoning — that automated code evaluation and generation for internal teams. Wired in external APIs and data sources, then shipped a document-Q&A chatbot on top of it.',
      wins: ['40% less manual coding effort', '18% workflow efficiency gain'],
      when: 'May — Aug 2025',
      where: 'Chennai, TN',
    },
    /* One condensed teaching row — the page's evidence for the customer-facing
       half of forward-deployed work. Don't cut it. */
    {
      org: 'Penn State',
      logo: '/logos/psu.png',
      role: 'Learning Assistant · Math Peer Tutor',
      team: 'Calculus & 0–100 level courses',
      note: 'Weekly review sessions and one-on-one tutoring — explaining hard things to people who don’t share my context, and finding where a mental model broke. Same job as debugging.',
      wins: [],
      when: 'Aug 2025 — Present',
      where: 'University Park, PA',
    },
  ],
};

/* -------------------------------------------------------------- BUILDS ---- */
/* Ordered by what you most want someone to see. PrismAI leads.
   To add a project, copy the TEMPLATE block at the bottom of items[]. */
export const builds = {
  heading: "What I've built",
  intro:
    "Ordered by what I'd most want to talk about in an interview. Every number came from a run, not an estimate.",
  items: [
    {
      id: 'prismai',
      kind: 'Product · multi-user · in development',
      title: 'PrismAI',
      titleMuted: 'meeting intelligence',
      when: 'Apr 2026 — Present',
      oneLiner:
        'Turns a meeting into structured, searchable, citable output before you leave the call.',
      laurels: [],
      body: [
        'A bot joins your Zoom, Meet, or Teams call — and actually participates, answering questions and running tools in real time via a **two-channel voice pipeline (Deepgram Flux + Cartesia)**. After the call, **twelve specialized agents on a two-tier LangGraph pipeline** turn the transcript into summaries, action items, decisions (linked to the work that resolves them), sentiment, speaker coaching, and follow-up drafts — streamed over SSE in roughly two seconds, so the output lands while the meeting is still in your head.',
        'The hardest engineering is the **live two-channel loop — hearing, deciding, and speaking without stepping on the humans**. Underneath it, every workspace shares a RAG layer with PDF, Notion, and Drive ingestion plus automatic transcript indexing; search fuses **pgvector, BM25, and reciprocal rank fusion before an LLM rerank**, and every answer links back to the exact moment in synced playback — if the system claims something was decided, you can watch it get decided.',
      ],
      metrics: [
        { value: '12', label: 'specialized\nagents' },
        { value: '~2s', label: 'to first\ninsight (SSE)' },
        { value: '3', label: 'retrieval signals\nfused per query' },
      ],
      stack:
        'React · FastAPI · LangGraph · Claude Sonnet · GPT-5.6 · Supabase/pgvector · Deepgram · Cartesia · Recall.ai · Tavily',
      media: { image: '/builds/prismai.png', alt: 'PrismAI landing page' },
      links: [
        { label: 'Live demo', href: 'https://www.meetprismai.com/' },
        { label: 'Source', href: '' }, // TODO
      ],
    },
    {
      id: 'terrametric',
      kind: 'Hackathon · 36 hours · 3 tracks won',
      title: 'Terrametric',
      titleMuted: 'crop drought intelligence',
      when: 'Apr 2026 · BitCamp, UMD',
      oneLiner:
        'Satellite data is abundant. Irrigation decisions are still guesses. This closes the gap.',
      laurels: [
        '1st — Real World Track (Ambrook)',
        '1st — Data Science Track',
        '3rd — Open Source',
      ],
      body: [
        'Scores drought risk per field, writes an **irrigation prescription with cost and savings projections**, and lets a farmer simulate the decision before committing water to it.',
        'A 14-day per-field stress forecast and seasonal harvest outlook run on an XGBoost pipeline, with an agentic layer doing RAG over Iowa and USDA documents. The front end is a Three.js globe that drills into Leaflet field maps. Alerts go out over SMS, because that is what actually reaches a farmer standing in a field. **Built, deployed, and demoed in 36 hours.**',
      ],
      metrics: [
        { value: '14-day', label: 'per-field stress\nforecast' },
        { value: '3', label: 'tracks won\nin 36 hours' },
        { value: 'Deployed', label: 'Render +\nVercel' },
      ],
      stack:
        'React · Three.js · Leaflet · Recharts · FastAPI · XGBoost · Featherless AI / Qwen 2.5-7B · Twilio · WebSockets',
      media: { image: '/builds/terrametric.jpg', alt: 'Terrametric landing page' },
      links: [
        { label: 'Live demo', href: 'https://terrametric-delta.vercel.app/' },
        { label: 'Source', href: '' }, // TODO
      ],
    },
    {
      id: 'secure-codegen',
      kind: 'Research system · arXiv preprint',
      title: 'Self-repairing code generation',
      titleMuted: 'GCC · CodeQL · KLEE',
      when: 'Sep 2025 — Mar 2026',
      oneLiner: 'A generation loop that refuses to accept its own first answer.',
      laurels: [
        'arXiv:2601.00509 — first author, cs.CR',
        '2nd place, Engineering — PSU Undergraduate Exhibition 2026',
      ],
      body: [
        "LLMs write C that compiles about as often as it doesn't, and quietly introduce buffer overflows when they do. I wired **GCC, GitHub CodeQL, and KLEE** into one feedback loop: structured diagnostics go back to the same model across attempts, and successful repairs get embedded and retrieved as security-focused examples for later generations. Critical defects fell from 58.55% to 22.19% on a model that resisted repair.",
      ],
      metrics: [
        { value: '−96%', label: 'vulnerabilities\nDeepSeek 1.3B' },
        { value: '58.6 → 22.2%', label: 'critical defect rate\nCodeLlama-7B' },
        { value: '3,242', label: 'programs\nevaluated' },
      ],
      stack: 'Python · GCC · CodeQL · KLEE · sentence embeddings · DeepSeek-Coder · CodeLlama',
      media: { image: '', alt: 'Repair-loop results figure' }, // TODO: drop image, set src
      links: [
        { label: 'Read the paper', href: 'https://arxiv.org/abs/2601.00509' },
        { label: 'Source', href: '' }, // TODO
      ],
    },

    /* ---- TEMPLATE: copy this block to add a build -------------------------
    {
      id: 'slug',
      kind: 'Side project · weekend',
      title: 'Name',
      titleMuted: 'one-phrase descriptor',
      when: 'Month 2026',
      oneLiner: 'The single sentence that makes someone keep reading.',
      laurels: [],
      body: ['What it does, and **what was hard about it**.'],
      metrics: [{ value: '00', label: 'thing\nmeasured' }],
      stack: 'Tool · Tool · Tool',
      links: [{ label: 'Source', href: '' }],
    },
    ----------------------------------------------------------------------- */
  ],

  /* Compact tier — smaller builds get a card, not a chapter. Rendered by the
     mini grid in Builds.jsx. No metrics, no body paragraphs: title, one line,
     stack if known, links (hidden while href is empty). */
  compact: {
    heading: 'More builds',
    items: [
      {
        id: 'transitguard',
        title: 'TransitGuard',
        oneLiner:
          'Scores every transfer bag by its odds of missing the connection — layover time, delays, routing disruptions — and tells airport ops what to do about it before the bag is gone. A dashboard for operations, alerts for the passenger.',
        stack: '',
        media: { image: '/builds/transitguard.png', alt: 'TransitGuard dashboard' },
        links: [{ label: 'Source', href: '' }], // no valid link right now — stays hidden
      },
      {
        id: 'papertrail',
        title: 'PaperTrail',
        oneLiner:
          'Give it a topic, a paper title, a DOI, or a link. It finds the seed paper, builds the ancestor tree, and lays out a reading path with videos and companion resources — so you learn a field from its foundations up, not from whatever ranked first.',
        stack: '',
        media: { image: '/builds/papertrail.png', alt: 'PaperTrail reading path' },
        links: [{ label: 'Source', href: '' }], // no valid link right now — stays hidden
      },
      {
        id: 'cinemachat',
        title: 'CinemaChat',
        oneLiner:
          'Movie and TV recommendations in plain language, with a social layer. Claude decides for itself which retrieval tools to call — filmographies, semantic search — and synthesizes a recommendation instead of keyword-matching one.',
        stack: '',
        media: { image: '/builds/cinemachat.jpg', alt: 'CinemaChat conversation' },
        links: [
          { label: 'Live demo', href: 'https://cinema-chat-nine.vercel.app/' },
          { label: 'Source', href: '' }, // TODO
        ],
      },
      {
        id: 'algoquest',
        title: 'AlgoQuest',
        oneLiner:
          'Data structures and algorithms taught as a game instead of a problem set. Built in React.',
        stack: 'React',
        media: { image: '/builds/algoquest.jpg', alt: 'AlgoQuest interface' },
        links: [{ label: 'Source', href: '' }], // no valid link right now — stays hidden
      },
    ],
  },
};

/* ---------------------------------------------------------- HOW I BUILD --- */
export const principles = {
  heading: 'How I build',
  intro: 'Habits I keep coming back to. Opinions loosely held — but tested in every repo above.',
  items: [
    {
      title: 'Ship the boring layer first.',
      body: 'Retrieval quality, error handling, and the eval harness decide whether a demo becomes a product. I try to start where the risk actually lives, not where the demo shines.',
    },
    {
      title: 'Distrust the first output.',
      body: 'Every system I build has something checking it — a compiler, a static analyzer, a reranker, a second agent. If nothing can say no, the output is a guess with good formatting.',
    },
    {
      title: 'Measure, then claim.',
      body: 'I benchmark before I talk \u2014 40% at Comcast, 3,242 programs in the paper, ~2s end to end in PrismAI. "Feels faster" is a hunch, not a result.',
    },
    {
      title: 'End to end, then optimize.',
      body: 'Terrametric went from satellite data to an SMS in a farmer\u2019s hand in 36 hours because the whole path existed before any part of it was good. You cannot tune what does not run.',
    },
  ],
};

/* ------------------------------------------------------------ THE SELL ---- */
export const value = {
  heading: 'Who I am\nat work',
  intro: "Less a list of what I've shipped — more how I operate when you drop me into a problem.",
  claims: [
    {
      tag: 'Reliability',
      claim: 'I care most about the gap between "works in the demo" and "works."',
      receipts: [
        'The repair loop in my paper cut **critical defects 58.55% → 22.19%** on a model that resisted repair — I build the checks before I extend the trust.',
        'Every PrismAI answer **links back to the exact meeting moment** behind it. If it claims a decision, you can watch the decision.',
      ],
    },
    {
      tag: 'Forward-deployed',
      claim: 'I want to sit where the system meets the user, not two teams away.',
      receipts: [
        'At Sherlock AI I build the **candidate-facing demo interview flow** — the first screen a real user meets.',
        'Teaching calculus **weekly at Penn State since Aug 2025** — explaining hard things to people who don’t share my context is the customer half of this job.',
      ],
    },
    {
      tag: 'Owner',
      claim: 'I treat every build like it’s mine to run, not mine to hand off.',
      receipts: [
        'Terrametric: **satellite data → ML → backend → globe UI → SMS, deployed in 36 hours** — one owner, the whole path.',
        'If it breaks at 2am, I want to be the person who already knows why.',
      ],
    },
    {
      tag: 'Modernizer',
      claim: 'I see a manual workflow and can’t leave it alone.',
      receipts: [
        'At Comcast, the loop I automated handed a real team back **40% of its manual coding effort**.',
        'The pattern under everything I build: **find the slow, human-hostile loop and automate it safely**.',
      ],
    },
  ],
  footer:
    'What that adds up to: a forward-deployed engineer in the making — someone who wants to own an AI system end to end, keep it safe and reliable, and sit close enough to the users to know whether it’s actually helping.',
};

export const toolkit = {
  heading: 'Toolkit',
  intro: "Things I've shipped with, not things I've read about.",
  groups: [
    { name: 'Languages', items: ['Python', 'Java', 'C', 'C++', 'SQL', 'JavaScript'] },
    {
      name: 'Backend',
      items: ['FastAPI', 'REST', 'PostgreSQL', 'SQLite', 'Docker', 'WebSockets', 'SSE', 'Git'],
    },
    {
      name: 'AI / ML',
      items: [
        'RAG',
        'LangGraph',
        'Tool-calling',
        'pgvector',
        'BM25 / RRF',
        'XGBoost',
        'scikit-learn',
        'Groq',
        'OpenAI API',
      ],
    },
    { name: 'Frontend', items: ['React', 'Three.js', 'R3F', 'Tailwind', 'Vite', 'Recharts'] },
    { name: 'Verification', items: ['CodeQL', 'KLEE', 'GCC diagnostics', 'Symbolic execution'] },
    {
      name: 'Infra & services',
      items: ['Supabase', 'Vercel', 'Render', 'Railway', 'Recall.ai', 'Twilio', 'Tavily', 'n8n'],
    },
  ],
};

export const contact = {
  eyebrow: 'Contact',
  heading: "Tell me what's broken.",
  blurb:
    'Hiring for 2027, building something with agents or retrieval, or want to push back on something above — all good reasons to write. I reply within a day.',
  email: 'vidyut0712@gmail.com',
  links: [
    {
      kind: 'LinkedIn',
      value: '/in/vidyut-sriram',
      href: 'https://www.linkedin.com/in/vidyut-sriram-4b5a012aa',
    },
    { kind: 'GitHub', value: '@vs-githjk', href: 'https://github.com/vs-githjk' },
    { kind: 'arXiv', value: '2601.00509', href: 'https://arxiv.org/abs/2601.00509' },
    { kind: 'Résumé', value: 'Download', href: '/resume.pdf' },
  ],
  footerLeft: 'Vidyut Sriram — State College, PA',
  footerRight: 'Built from scratch · 2026',
};
