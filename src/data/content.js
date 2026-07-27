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
  title: 'Vidyut Sriram — I build AI systems',
  description:
    "Penn State CS '27. I build the infrastructure around AI models — retrieval, orchestration, and the plumbing that turns a demo into a product.",
  location: 'State College, PA',
};

export const nav = [
  { label: 'Work', href: '#work' },
  { label: 'Builds', href: '#builds' },
  { label: 'How I build', href: '#principles' },
  { label: 'Contact', href: '#contact' },
];

export const hero = {
  eyebrow: "Vidyut Sriram — Penn State CS '27",
  headline: 'The model is',
  assertion: 'the easy part',
  blurb:
    "Swapping a model is a one-line change. Retrieval that actually retrieves, agent graphs that don't deadlock, and pipelines that fail loudly are not. I build that layer.",
  blurbEmphasis: "Right now that's PrismAI —",
  blurbTail:
    'a meeting intelligence platform running eight agents over hybrid search, streaming insight back in about two seconds.',
  availability: 'Available June 2027 · new grad & internship', // TODO: match what you're actually recruiting for
  locationNote: 'State College, PA — open to relocate',
};

/* ---------------------------------------------------------------------------
   SIGNATURE ELEMENT: the PrismAI pipeline, animated in the hero.
   Rendered by src/components/Pipeline.jsx
   ------------------------------------------------------------------------ */
export const pipeline = {
  label: 'prismai · live pipeline',
  project: 'two-tier LangGraph',
  ingest: { name: 'recall.ai', desc: 'bot joins the call, streams transcript' },
  // TODO: your resume says 8 agents; only 6 are named there. Add the other two
  // and the on-screen counter updates itself.
  agents: [
    'summary',
    'action items',
    'decisions',
    'sentiment',
    'speaker coaching',
    'follow-up email',
  ],
  synthesis: { name: 'synthesis', desc: 'tier 2 merge · hybrid retrieval · rerank' },
  output: { name: 'sse stream', desc: 'incremental, to client' },
  timerLabel: 'elapsed',
  target: 2.0, // seconds the animation counts toward
  foot: [
    { text: 'Retrieval fuses ' },
    { text: 'pgvector + BM25 + reciprocal rank fusion', strong: true },
    { text: ', then reranks. Answers link back to the exact moment in synced playback.' },
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
    'One production internship, and two teaching roles that keep me honest about explaining hard things simply.',
  roles: [
    {
      org: 'Comcast',
      role: 'Software Development Engineer Intern',
      team: 'India Engineering Centre',
      note: 'Built an agentic system — RAG, modular pipelines, multi-step reasoning — that automated code evaluation and generation for internal teams. Wired in external APIs and data sources, then shipped a document-Q&A chatbot on top of it.',
      wins: ['40% less manual coding effort', '18% workflow efficiency gain'],
      when: 'May — Aug 2025',
      where: 'Chennai, TN',
    },
    {
      org: 'Penn State',
      role: 'Learning Assistant',
      team: 'Calculus',
      note: 'Run weekly review sessions with faculty using active-learning methods — limits, derivatives, integrals. Measurable gains in grades, participation, and comprehension.',
      wins: [],
      when: 'Aug 2025 — Present',
      where: 'University Park, PA',
    },
    {
      org: 'Penn State',
      role: 'Math Peer Tutor',
      team: '0–100 level courses',
      note: "One-on-one and small-group tutoring. Mostly a job in diagnosing where someone's mental model broke, which turns out to be the same job as debugging.",
      wins: [],
      when: 'Jan 2026 — Present',
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
        'A bot joins your Zoom, Meet, or Teams call. **Eight specialized agents on a two-tier LangGraph pipeline** turn the transcript into summaries, action items, decisions, sentiment, speaker coaching, and follow-up drafts — streamed over SSE in roughly two seconds, so the output lands while the meeting is still in your head.',
        'The interesting engineering is the retrieval, not the agents. Every workspace shares a RAG layer with PDF, Notion, and Drive ingestion plus automatic transcript indexing, and search fuses **pgvector, BM25, and reciprocal rank fusion before an LLM rerank**. Every answer links back to the exact moment in synced playback — if the system claims something was decided, you can watch it get decided.',
      ],
      metrics: [
        { value: '8', label: 'specialized\nagents' },
        { value: '~2s', label: 'to first\ninsight (SSE)' },
        { value: '3', label: 'retrieval signals\nfused per query' },
      ],
      stack:
        'React · FastAPI · LangGraph · Groq Llama 3.3-70B · OpenAI · Supabase/pgvector · Recall.ai · Tavily',
      links: [
        { label: 'Live demo', href: '' }, // TODO
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
      links: [
        { label: 'Live demo', href: '' }, // TODO
        { label: 'Source', href: '' }, // TODO
      ],
    },
    {
      id: 'secure-codegen',
      kind: 'Research system · published',
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
};

/* ---------------------------------------------------------- HOW I BUILD --- */
export const principles = {
  heading: 'How I build',
  intro: 'Four opinions I hold strongly enough that they show up in every repo above.',
  items: [
    {
      title: 'Ship the boring layer first.',
      body: 'Retrieval quality, error handling, and the eval harness decide whether a demo becomes a product. The model is a config value. The plumbing is the work.',
    },
    {
      title: 'Distrust the first output.',
      body: 'Every system I build has something checking it — a compiler, a static analyzer, a reranker, a second agent. If nothing can say no, the output is a guess with good formatting.',
    },
    {
      title: 'A number, or it did not happen.',
      body: 'I benchmark before I claim. 40% at Comcast, 3,242 programs in the paper, ~2s end to end in PrismAI. "Feels faster" is not a result.',
    },
    {
      title: 'End to end, then optimize.',
      body: 'Terrametric went from satellite data to an SMS in a farmer\u2019s hand in 36 hours because I built the whole path before making any part of it good. You cannot tune what does not run.',
    },
  ],
};

/* ------------------------------------------------------------ THE SELL ---- */
export const value = {
  heading: 'What I bring\nto the table',
  intro:
    'Four claims. Each one has a receipt underneath it, because a claim without evidence is just a personality trait.',
  claims: [
    {
      tag: 'Systems',
      claim:
        'I build the infrastructure around the model, which is where the actual difficulty is.',
      receipts: [
        'PrismAI: **hybrid retrieval, an 8-agent graph, and SSE streaming behind a real multi-user product** — not a notebook.',
        'At Comcast, built agentic pipelines that removed **40% of manual coding effort** from a real team\u2019s workflow.',
      ],
    },
    {
      tag: 'Velocity',
      claim: "I can take something from raw data to a person's phone without handing it off.",
      receipts: [
        'Terrametric: **ML pipeline, FastAPI backend, Three.js frontend, SMS delivery, deployed — in 36 hours.** Won three tracks.',
        'Across the stack — **Python, C, React, Postgres, Docker** — so I am not waiting on someone for the other half.',
      ],
    },
    {
      tag: 'Rigor',
      claim: "I don't trust a model's first answer, and I build the tooling that doesn't either.",
      receipts: [
        'Wired GCC, CodeQL, and KLEE into a repair loop; **critical defects fell 58.55% → 22.19%** on a model that resisted repair.',
        'This is what AI teams are short on right now: **evaluation and guardrails, not prompt-writing**.',
      ],
    },
    {
      tag: 'Clarity',
      claim:
        "I've spent two years explaining hard things to people who didn't get them the first time.",
      receipts: [
        'Learning Assistant and peer tutor at Penn State — **weekly sessions, measurable gains** in comprehension.',
        'Took the research to judges and placed **2nd in Engineering**. Design docs and code review are the same muscle.',
      ],
    },
  ],
  footer:
    "What that adds up to: someone you can drop onto an AI feature that has to actually work — where the interesting problem isn't getting a model to respond, it's making the response fast, grounded, and safe to ship.",
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
    { kind: 'GitHub', value: '@yourhandle', href: '' }, // TODO
    { kind: 'arXiv', value: '2601.00509', href: 'https://arxiv.org/abs/2601.00509' },
    { kind: 'Résumé', value: 'PDF', href: '/resume.pdf' }, // drop resume.pdf in /public
  ],
  footerLeft: 'Vidyut Sriram — State College, PA',
  footerRight: 'Built from scratch · 2026',
};
