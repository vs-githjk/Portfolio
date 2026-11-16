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
    'Vidyut Sriram builds safe, reliable AI systems. Builder of PrismAI and DuelWise, 5× hackathon winner, arXiv first author. Forward-deployed and AI engineer.',
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

/* ------------------------------------------------------------- WELCOME ---- */
/* The first screen: his face drawn in light says hello. Two short lines and a
   cue; the hero (his name, the ring) is one scroll or one click away. */
export const welcome = {
  label: 'Welcome',
  lines: ['Hey, I’m Vidyut.', 'Welcome to my portfolio.'],
  cue: 'Scroll or click to see what happens next',
  /* What the ball of light says before it breaks into the page: a line of speech
     that types under it while it pulses. */
  ball: 'Here is what I have built.',
  /* His work, as thoughts on the welcome screen: small soft holograms at the sides
     of the window that phase in and out in this order. `at` is the seat (l1 to l3
     down the left, r1 to r3 down the right). A build shows its ring thumbnail
     (/builds/ring/<id>-320.webp), the crew one Master Agents portrait, the fact the
     same "5× hackathon winner" the hero credential states. Decoration: aria-hidden. */
  hub: [
    { at: 'l1', kind: 'build', id: 'prismai', label: 'PrismAI' },
    { at: 'r1', kind: 'build', id: 'duelwise', label: 'DuelWise' },
    { at: 'l2', kind: 'crew', id: 'orchestrator', label: 'Master Agents' },
    { at: 'r2', kind: 'fact', value: '5×', label: 'hackathon winner' },
    { at: 'l3', kind: 'build', id: 'betterbill', label: 'BetterBill' },
    { at: 'r3', kind: 'build', id: 'terrametric', label: 'Terrametric' },
  ],
};

/* ---------------------------------------------------------------- HERO ---- */
/* Centre: status row, name, identity, one plain line, credentials, actions.
   Around it: the orbit ring. No figures in the hero except the live-status
   badge on the PrismAI card, which says what it counts. */
export const hero = {
  status: 'Forward-deployed and AI engineer',
  /* Vidyut's own photo (Oct 2026): his silhouette on a beach at sunset, 180px and
     360px (2x) squares, shown at about 160px beside the name on a laptop and 112px
     on a phone. The share card still uses the studio headshot originals in public/. */
  portrait: {
    src: '/portrait-180.webp',
    src2x: '/portrait-360.webp',
    alt: 'Vidyut Sriram in silhouette on a beach at sunset, the sky orange over the waves',
  },
  headline: 'Vidyut Sriram',
  identity: 'Builds safe, reliable AI systems.',
  /* The plain line under the identity: what that means in practice. */
  identitySub:
    'Agents that do real work, with code checking the numbers and a person approving before anything goes out.',
  /* One short form everywhere (it clears the side cards at 1440 and stays a caption
     on a phone). "5× hackathon winner" = SF Startup Challenge, super{set} SF, Cal Hacks 13.0, LA Hacks,
     Bitcamp. Six first places = 1st overall (SF Startup Challenge) + Track 1 (super{set} SF) + Visa + Photon (LA Hacks AI
     Hackathon) + Real World + Data Science (Bitcamp). */
  credential: 'Comcast · Sherlock AI · 5× hackathon winner · arXiv first author',
  locationNote: 'Penn State CS, graduating Dec 2026 · State College, PA',
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
        oneLiner: 'Knows who promised what on every call.',
        badge: 'Live beta · 14 users',
        badgeKind: 'live',
        tone: 'light', // pale thumbnail: the ring dims it further at the back
        image: {
          src: '/builds/ring/prismai.webp',
          alt: 'PrismAI’s landing page: "Know who promised what." beside a glass prism on an open notebook',
        },
      },
      {
        id: 'duelwise',
        title: 'DuelWise',
        oneLiner: 'Ten games. Four AI opponents. Beat them.',
        badge: 'Live · duelwise.app',
        badgeKind: 'live',
        tone: 'light',
        image: {
          src: '/builds/ring/duelwise.webp',
          alt: 'DuelWise: "Can you beat my agents?" above its four opponents, Pip, Marlow, Vesper and Sable',
        },
      },
      {
        id: 'snapback',
        title: 'SNAPBACK',
        oneLiner: 'Checks a rental ad before you pay.',
        badge: 'Live · HackPrinceton',
        badgeKind: 'live',
        tone: 'light',
        image: {
          src: '/builds/ring/snapback.webp',
          alt: 'SNAPBACK landing page: "Trust the home, not the ad." beside a cutaway 3D house over a city',
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
        oneLiner: 'Runs a tournament in any sport from one screen.',
        badge: 'Live',
        badgeKind: 'live',
        image: {
          src: '/builds/ring/matchday.webp',
          alt: 'Match Day wordmark, "Play. Compete. Belong.", beside its tournament command center',
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
        id: 'prismkeep',
        title: 'PrismKeep',
        oneLiner: 'Six agents run a founder’s follow-ups.',
        badge: '1st overall · SF Startup',
        badgeKind: 'win',
        image: {
          src: '/builds/ring/prismkeep.webp',
          alt: 'PrismKeep logo, "Promises kept. Stories straight.", beside an investor draft "No churn risk this quarter" marked Not true against a customer call saying "We’ll look at alternatives"',
        },
      },
      {
        id: 'firesight',
        title: 'FireSight',
        oneLiner: 'A cited 3D arrival brief for fire officers.',
        badge: '1st · Track 1, super{set}',
        badgeKind: 'win',
        image: {
          src: '/builds/ring/firesight.webp',
          alt: 'FireSight on 140 New Montgomery St: the 26-story tower lit in the 3D San Francisco city beside its Hazards panel, 6 danger and 29 caution records such as the battery rooms on floors 22 and 23',
        },
      },
      {
        id: 'fishmarket',
        title: 'Fish Market',
        oneLiner: 'Seller agents compete; nothing fishy gets paid.',
        badge: 'Winner · Fetch.ai',
        badgeKind: 'win',
        tone: 'light', // pale thumbnail: the ring dims it further at the back
        image: {
          src: '/builds/ring/fishmarket.webp',
          alt: 'Fish Market landing page: "The secure agentic marketplace. Where buyers and sellers thrive." beside a sealed bidding round on the floor',
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
      note: 'At Sherlock, the first thing a prospective customer touches is the demo interview. I owned it end to end in Next.js, then took interview review to where reviewers already are: inside the live call.',
      wins: ['Shipped the demo interview flow: adaptive questions, in-browser recording, submission', 'Prototyped a Google Meet add-on that shows audit logs and checks interview integrity in a sidebar'],
      when: 'Jun to Aug 2026',
      where: 'Remote',
    },
    {
      org: 'Comcast',
      logo: '/logos/comcast.webp',
      role: 'Software Development Engineer Intern',
      team: 'India Engineering Centre',
      note: 'The question was whether low-code agent tooling could survive inside a real engineering team. I scoped it, chose Langflow and shipped a pilot, then watched how the team actually used it before adding anything.',
      wins: [
        'One place for planning, budget tracking, structured data and team communication, adopted across a 40-person team',
        'Cut **~40% of the team’s recurring planning and coordination work**',
        'Added RAG over internal documentation after watching how the team really used it',
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
      wins: ['**GPA 3.84 of 4.00**', "**Dean's List, 6 of 6 semesters**"],
      when: 'Learning Assistant · Aug 2025 to May 2026\nTutor · Jan 2026 to Present',
      where: 'University Park, PA',
    },
  ],
};

/* -------------------------------------------------------------- BUILDS ---- */
/* Order: PrismAI and DuelWise (flagships); items = BetterBill, MVR, Vytal, Match Day,
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
  /* {Total} and {flagships} are counted from the lists below and written as words
     (components/counts.js), so the sentence can never disagree with the page. */
  intro:
    '{Total} builds, my {flagships} strongest first: products, hackathon wins, a first-author paper and the smaller tools in between. Every number here has a source I can show you.',
  /* The depth chart under the heading: one dot per build, in page order, each a
     link to its entry. A gold dot is a build with an award. */
  chart: {
    label: 'Every build, in order',
    groups: { flagships: 'Flagships', items: 'Featured', research: 'The paper', more: 'More builds' },
    legend: 'Gold marks an award.',
  },
  /* Labels for the controls inside a build. */
  labels: {
    of: 'of',
    story: 'The full story',
    storySr: ' of {title}',
    stills: 'Stills from {title}',
    still: 'Still {n} of {total}',
    dossier: 'Dossier',
    dossierSr: ': role, story and stack of {title}',
    fleet: 'Featured builds',
  },

  /* ---- Flagship panels: PrismAI, then DuelWise ---------------------------- */
  /* Sources (Nov 12 2026): PrismAI's live site meetprismai.com, its README on
     main (Project status: the agency release is live in production since
     Oct 20; the live private note is built and waits on an accuracy
     evaluation; free public launch planned Dec 21 2026) and the sample-data
     dashboard. DuelWise: duelwise.app (home and /ai), the public repo
     README and git log (solo). Its own site shows the wordmark "Prism"; Vidyut
     (Nov 12): the name stays PrismAI on this site. */
  flagships: [
    {
      id: 'prismai',
      // Counts for its world in the scene; each must appear in this entry's own metrics or story (scripts/check-scenes.mjs).
      scene: { kind: 'prism', cells: 14 },
      figure: 2, // which metric is the one large figure on its arrival screen
      kind: 'Product · live · free while in beta',
      title: 'PrismAI',
      descriptor: 'know who promised what',
      when: 'Mar 2026 to Present · meetprismai.com',
      oneLiner:
        'Every call ends in promises. PrismAI remembers who promised what and by when, catches the ask that is outside your contract, and drafts the change order for you to approve.',
      awards: [],
      role: 'The idea was mine, I built it from the first commit, and I run it on my own now.',
      body: [
        'I took PrismAI from an empty repo to a **live product** in about eight months. A bot joins Meet, Zoom or Teams, a team of AI agents works through the call in parallel, and decisions, owners, dates and follow-ups appear on the page as each one finishes, in English, Hindi or Tamil. Approve a task and it goes to Slack, Linear or Jira.',
        'Since Oct 20 the **agency release is live**: PrismAI reads the signed agreement, checks every client ask against it and **quotes the clause**, then drafts a change order from the agency’s own rates.',
        '**It shows its receipts.** Every quote is the speaker’s own words, checked against the transcript; it will never mistake “send 14” for “send 40” or drop a “not”, and anything it cannot find goes to a person. A borderline ask is marked unclear instead of guessed, code does the money to the cent, and once the owner approves an email, any edit cancels the approval.',
        // Vidyut, Oct 28 2026: pitched at the conference with Amazon's CFO in the room, and met him. The photo stays off the site.
        'I pitched PrismAI at the **Penn State Venture & IP Conference** in front of **Amazon’s CFO**, and met him there.',
      ],
      /* Built or in pilot, not switched on for everyone: always under this label. */
      now: {
        label: 'Now building · public launch, Dec 21 2026',
        text: 'A **private note during the call** that flags an out-of-scope ask to your side only (built, and switched on once it passes an accuracy evaluation), and interview notes that point to the **exact moment** a candidate said it (in pilot).',
      },
      metrics: [
        { value: '14', label: 'beta users in\nisolated workspaces' },
        { value: '100+', label: 'meetings analyzed\nin the beta' },
        { value: '100%', label: 'of quoted promises matched\nagainst the call before they show' },
      ],
      stack:
        'React · Vite · FastAPI · LangGraph · Claude · OpenAI · Supabase (Postgres, pgvector, RLS on every table) · MCP · Recall.ai · Deepgram · Chrome extension',
      media: {
        video: '',
        lead: {
          image: '/builds/prismai-hero.webp',
          alt: 'PrismAI’s new landing page: "Know who promised what." beside a glass prism on an open notebook and a quote from the call, "I can have the staging link to you Tuesday."',
          badge: '',
          caption: 'The new PrismAI, live at meetprismai.com.',
        },
        stack: [
          {
            image: '/builds/prismai-home.webp',
            alt: 'PrismAI Home in the sample workspace: "11 things need you.", the week’s meetings with their health scores, open actions and decisions',
            caption: 'Home: what needs you, from every meeting (sample data).',
          },
          {
            image: '/builds/prismai-meeting.webp',
            alt: 'A PrismAI meeting after the call: health score 84, a one-line summary, topics, a verdict, and tabs for action items, decisions and follow-ups (sample data)',
            caption: 'After the call: the summary, owners, decisions and a verdict (sample data).',
          },
          {
            image: '/builds/prismai-scope.webp',
            alt: 'PrismAI on a client call: "Could you also add a Spanish version of the site?" marked Outside the agreement, citing clause 2.1, One English-language site',
            caption: 'Client calls: a new ask, checked against the agreement (from PrismAI’s landing page).',
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
    {
      id: 'duelwise',
      // Counts for its world in the scene; each must appear in this entry's own metrics or story (scripts/check-scenes.mjs).
      scene: { kind: 'board', moons: 10, lights: 151 },
      figure: 0,
      kind: 'Product · live · solo',
      title: 'DuelWise',
      descriptor: 'can you beat my agents?',
      when: 'Oct 2026 to Present · duelwise.app',
      oneLiner:
        'Ten games, four AI opponents, and not one strength number they have not earned in games actually played. Sable, the champion, beats people 96% of the time.',
      awards: [],
      role: 'Solo build: the idea, the ten games, the agents and the site are mine.',
      body: [
        'Pick a game, from chess and heads-up poker to a 2.5D fighter and a first-person arena shooter, and sit down across from Pip, Marlow, Vesper or Sable. Each opponent is built per game: chess nets trained on public Lichess games, **AlphaZero-style self-play** for Four in a Row, counterfactual-regret strategy for Hold’em, and **reinforcement-learning leagues** for the real-time games, all running in your browser on ONNX Runtime Web.',
        'A level shows a strength number only once it **beats the level below it** (a 95% lower bound over hundreds of games), and the site re-checks that evidence before it shows one; until then it says In training. The server replays every match from the seed it issued, so a tampered record never gains rating or reaches training.',
        'And it is **multiplayer** now: pass one device between you, or challenge a friend by link on two devices and keep a head-to-head record.',
      ],
      now: {
        label: 'Now building',
        text: 'Human matches training **every** learned agent, through the filter and the promote-only-if-it-wins gate Four in a Row already has, plus chess strength anchored to an outside engine.',
      },
      // duelwise.app owner dashboard, Nov 12 2026, human only (his own games and
      // automated test runs excluded): 135 players and 853 matches Oct 30 to Nov 12;
      // Vidyut, Nov 15 2026: 151 people have played it since launch.
      // Sable won 96% of 82 matches against people over the last 7 days.
      metrics: [
        { value: '151', label: 'people have played it since\nit launched on Oct 30' },
        { value: '853', label: 'matches in its first two weeks,\nnot counting mine or test runs' },
      ],
      stack:
        'TypeScript · TanStack Start · React 19 · Tailwind 4 · ONNX Runtime Web · Web Workers · PyTorch · Drizzle · Postgres (Neon) · Better Auth · Sentry · Vercel',
      media: {
        video: '',
        lead: {
          image: '/builds/duelwise-hero.webp',
          alt: 'DuelWise: "Can you beat my agents?" above its four opponents, Pip, Marlow, Vesper and Sable, each with its wins and losses against people',
          badge: '',
          caption: 'Four opponents, one per level, in every game. Live at duelwise.app.',
        },
        stack: [
          {
            image: '/builds/duelwise-games.webp',
            alt: 'The DuelWise game shelf: chess, Four in a Row and heads-up poker',
            caption: 'Ten games, from chess to a first-person shooter.',
          },
          {
            image: '/builds/duelwise-play.webp',
            alt: 'A DuelWise chess match against Pip, the easy level, measured at site Elo 1000',
            caption: 'Chess against Pip, the easiest of the four.',
          },
          {
            image: '/builds/duelwise-coldstore.webp',
            alt: 'Coldstore, the DuelWise first-person arena shooter: a 3D arena in the buy phase of round one against Pip',
            caption: 'Coldstore, the first-person shooter, in its buy phase.',
          },
        ],
      },
      links: [
        { label: 'Play it', href: 'https://duelwise.app' },
        { label: 'Source', href: 'https://github.com/vs-githjk/duelwise' },
      ],
    },
    {
      /* Sources (Nov 15 2026): repo DevSingh05/snapback (README "Measured" and
         "Honest limits", 314 commits, 191 his), plan/devpost-final.md, live at
         snapback-navy.vercel.app. HackPrinceton Fall 2026, team of 4. No prize
         (Vidyut, Nov 15): no award badge. */
      id: 'snapback',
      // Counts for its world in the scene; each must appear in this entry's own metrics or story (scripts/check-scenes.mjs).
      scene: { kind: 'scan', photos: 48, placed: 43, decoys: 30, decoysPlaced: 0 },
      figure: 0,
      kind: 'Hackathon · HackPrinceton 2026 · team of 4',
      title: 'SNAPBACK',
      descriptor: 'trust the home, not the ad',
      when: 'Nov 2026 · live at snapback-navy.vercel.app',
      oneLiner:
        'A renter near Houston paid $2,200 for a house the poster did not own. SNAPBACK checks the ad against the home’s own record before you pay, and tells you who to really call.',
      awards: [],
      role: 'The idea was mine, and I helped orchestrate the build.',
      body: [
        'Send it the ad by iMessage or on the web: a link, its text or screenshots. It checks **the place, the person and the price** against the home’s own record and gives one verdict in plain words, from “Checks passed” to “Don’t pay. Something here doesn’t match.” Code sets every verdict; no model sees or chooses it, and SNAPBACK never pays, books or sends anything for you.',
        'The wow is literal: it **puts the ad’s photos inside the building’s own Matterport 3D scan** (DINOv2 retrieval, then DISK and LightGlue matching with RANSAC). A photo from a different building is a red flag. It also matches the ad’s phone against the leasing office on record without ever showing the digits, flags lookalike links and a rent far below the building’s lowest, and a ring finder spots the same scam reworded across many ads.',
        'It publishes its limits: aerial imagery stays evidence only because one held-out next-door building would still pass, and the ring finder’s numbers come from synthetic data, so they are not claimed as real-world accuracy.',
      ],
      now: {
        label: 'Next',
        text: 'Telling scam rings apart from each other, and matching building footprints so aerial imagery can earn a place in the verdict.',
      },
      // README "Measured", LIVE rows (real CoStar kit data, real listing photos).
      metrics: [
        { value: '43 of 48', label: 'real listing photos placed in\nthe right home, 0 in a wrong one' },
        { value: '0 of 30', label: 'decoy photos placed in\nthe claimed building' },
      ],
      stack:
        'Python · FastAPI · DINOv2 · DISK and LightGlue (kornia) · LangChain deepagents · LangSmith · Claude · Photon (iMessage) · ElevenLabs · MapLibre · CoStar · Matterport · Vercel',
      media: {
        video: '',
        lead: {
          image: '/builds/snapback-hero.webp',
          alt: 'SNAPBACK landing page: "Trust the home, not the ad." beside a cutaway 3D house over a city, with Check an ad and See how it works',
          badge: '',
          caption: 'Live at snapback-navy.vercel.app. The house is a drawing, not a real home.',
        },
        stack: [
          {
            image: '/builds/snapback-scan.webp',
            alt: 'A listing photo placed inside the building’s Matterport scan beside its floor plan: 43 of 48 in the right home, 0 in the wrong one, LIVE run',
            caption: 'An ad’s photo, found inside the building’s own 3D scan.',
          },
          {
            image: '/builds/snapback-report.webp',
            alt: 'A SNAPBACK report: "Hold off: it asks for money before you’ve seen the place", with the reasons and a Who do I call? button (sample photos)',
            caption: 'One verdict, the reasons, and who to call (sample case).',
          },
          {
            image: '/builds/snapback-rings.webp',
            alt: 'The investigator view: 10 of 10 seeded scam rings flagged in a 90-day synthetic stream, median 2.5 days to detect',
            caption: 'The ring finder over a 90-day stream (synthetic data).',
          },
        ],
      },
      links: [
        { label: 'Try it', href: 'https://snapback-navy.vercel.app' },
        { label: 'Source', href: 'https://github.com/DevSingh05/snapback' },
      ],
    },
  ],

  /* ---- Featured cards (2-column grid), in Vidyut's order ------------------ */
  items: [
    {
      id: 'betterbill',
      kind: 'Hackathon · 24 hours · team of 4',
      title: 'BetterBill',
      descriptor: 'hospital bill advocate',
      when: 'Oct 2026 · AI Hackathon 2026 by LA Hacks, UCLA',
      oneLiner:
        'Your hospital bill might be wrong. Snap a photo: BetterBill finds what you may not owe, then calls billing for you.',
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
        'Nobody remembers what the legacy system really does. MVR proves it, claim by claim, then guides the rewrite.',
      awards: [],
      role: 'Solo build: every commit in the repo is mine.',
      body: [
        'MVR captures a codebase as an immutable, content-addressed snapshot, and seven deterministic analyzers turn it into a system model where every claim points to the exact evidence behind it. Anything they cannot prove is recorded as unknown, never guessed. In its own evaluation, on held-out synthetic fixtures, it **never claimed certainty it could not prove**, with tenant isolation enforced by forced Postgres row-level security.',
      ],
      metrics: [
        { value: '0', label: 'false-certainty claims on\nheld-out synthetic fixtures' },
        { value: '312', label: 'tenant-isolation tests\nunder forced row-level security' },
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
        'The AI on a coaching team should be the assistant, not the coach. In Vytal it cannot rewrite a program on its own, because the code has no way to say it.',
      awards: [],
      role: 'Solo build: I designed and wrote all of it.',
      body: [
        'Live at joinvytal.live in a controlled beta for multi-coach organizations. Every score is deterministic, versioned and explained with reason codes; the one model in the loop turns a meal photo into a macro estimate that the trainee confirms before it is logged. Access control runs through a single policy check, and every trainee reassignment leaves an append-only audit trail.',
      ],
      // 988 passed, 1 skipped: backend pytest run on Oct 20, 2026. Usage stays unquoted (small closed beta).
      metrics: [
        { value: '988', label: 'automated backend tests,\nall passing' },
        { value: '1', label: 'policy check that every\ntrainee access goes through' },
      ],
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
      descriptor: 'multi-sport tournament platform',
      when: '2026 · live at joinmatchday.com',
      oneLiner:
        'A whole tournament, in any sport, run from one system: sign-ups, draws, courts and live scores on every phone, and now a live win probability on every rally.',
      awards: [],
      role: 'Built with a team, badminton-first. We are now talking with badminton coaching centres about hosting their tournaments on it.',
      body: [
        'New: **Matchday Pulse** gives every player a verified skill rating, puts a live win probability on every rally and turns each match into a story card.',
        'Replaces the spreadsheets, WhatsApp threads, paper check-in sheets and separate scoring tools most tournaments still run on. Players register for singles or doubles, check in, and follow their courts, live scores, rankings and history. Organizers configure categories, manage waitlists, seed players, generate draws, schedule matches, assign staff and handle disputes.',
        'Live scoring runs inside the tournament workflow, with game-state management, score corrections and an **offline scoring queue for unreliable venue internet**. Spectators follow draws, courts and live matches without an account. Scoring, draws, scheduling, rankings and the tournament lifecycle sit in **isolated, testable business logic** behind one repository layer.',
      ],
      // No usage figures yet (Oct 20): in talks with coaching centres, no hosted events. Never invent any.
      metrics: [
        { value: '5', label: 'roles in one system: organizers,\nplayers, scorers, officials, spectators' },
      ],
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
        'Click any lot in Pittsburgh. See what housing could go there, and exactly what is stopping it.',
      awards: [], // Not in the published top 3 (Technical.ly, Oct 8 2026). No badge.
      role: 'I built the AI chat: voice, cited answers, what-if reruns of the real scorer, and a guard that drops any sentence with a number that is not in the facts.',
      body: [
        'Yinzone scores the city’s parcels on indicators drawn from 134 public datasets. Zoning law is not a vibe, so the legal status of every lot comes from rules, never from a model. The model’s job is judgement where judgement is honest: a site-fit rating for each housing type, with a confidence, and a hand-off to a person when it is unsure.',
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
        'Drought shows up in the data before it shows up in the crop. Terrametric tells farmers which fields, and what saving them costs.',
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
    {
      id: 'firesight',
      /* Repo github.com/Devaj6190/FireSight (README, Oct 22 2026). Team roles are
         from its README. 1st in Track 1 (Hacking with Public Data APIs) confirmed by
         Vidyut (Oct 22). Its Devpost page
         lists him; the page itself shows no prize. */
      kind: 'Hackathon · one day · team of 4',
      title: 'FireSight',
      descriptor: 'arrival briefs for fire officers',
      when: 'Oct 2026 · super{set} SF, Track 1: Public Data APIs',
      oneLiner:
        'Firefighters roll up to buildings they have never been inside. FireSight opens the fire floor in 3D before the wheels stop.',
      awards: ['1st · Track 1: Public Data APIs'],
      role: 'I built the spoken brief (ElevenLabs), the AR view on Android, the AI and the MCP server, and planned the build for the team.',
      body: [
        '**1st in Track 1, Hacking with Public Data APIs,** at super{set} SF. The brief comes life first: people relative to the fire floor, what occupies it, what to bring and check, the nearest hydrants and the wind, then what to verify on arrival. It is assembled from the records by rules, so it is the same every time; Claude only answers free questions, and a validator drops any line without a citation. When two records disagree, both show as a **CONFLICT**, and stairs and standpipes, which no public record has, are listed as checks and **never drawn**.',
        'Spoken updates such as "people trapped on floor 23" become one typed decision with a confidence score, and below 0.5 it asks "Say again?" instead of guessing. An independent one-day prototype, **not affiliated with SFFD** and not for operational use.',
      ],
      metrics: [
        { value: '88', label: 'public sources queried\nfor every building' },
      ],
      stack: 'React · three.js · React Three Fiber · Hono · Zod · Claude · ElevenLabs · MCP · DataSF',
      media: {
        image: '/builds/firesight.webp',
        alt: 'FireSight on 140 New Montgomery St: the 26-story tower lit in the 3D San Francisco city beside its Hazards panel of 56 cited city records (6 danger, 29 caution), including battery rooms on floors 22 and 23 and past building fires',
      },
      links: [
        { label: 'Live demo', href: 'https://firesight-ten.vercel.app' },
        { label: 'Devpost', href: 'https://devpost.com/software/firesight-fnt4le' },
        { label: 'Source', href: 'https://github.com/Devaj6190/FireSight' },
      ],
    },
    {
      id: 'fishmarket',
      /* Repo github.com/vs-githjk/fish-market-nothing-fishy (README, Oct 25 2026).
         Cal Hacks 13.0, Oct 23 to 25 2026. Devpost lists the award as "Winner,
         [Fetch.ai] Best Use of Fetch.ai" (Nov 2); use that wording, never "1st". Role line in his words: his idea, he orchestrated
         the build, and he plans to keep building it. Every figure below is from the README's
         measured-results table; the shield numbers are reported as the README states
         them, misses included. */
      kind: 'Hackathon · Cal Hacks 13.0 · team of 4',
      title: 'Fish Market',
      descriptor: 'secure agentic marketplace',
      when: 'Oct 2026 · Cal Hacks 13.0, Fetch.ai track',
      oneLiner:
        'AI agents fight for your order, a scam detector screens every listing, and nothing big gets paid until your phone rings.',
      awards: ['Winner · Best Use of Fetch.ai'],
      role: 'The idea was mine, and I orchestrated the whole build. I plan to keep building it.',
      body: [
        'Nine agents on Fetch.ai, eight of them registered on Agentverse and reachable from ASI:One. Before any money moves, Smell Test screens every listing for hidden instructions and payee swaps, a deterministic Quality Advocate checks fit and CPSC recalls and can veto the cheapest bid, and the winning price is re-read live. Above your allowance a Cartesia voice agent calls you, but **code decides**: only the one-time code on your screen plus "approve" passes, and payment runs in Stripe test mode.',
        'Every claim is labelled LIVE, MIRROR, SIM or SANDBOX, and the README publishes its misses: Smell Test stopped **13 of 20 held-out attacks** while wrongly blocking 2 of 10 honest listings, so "secure" is the goal we build toward, not a claim yet.',
      ],
      metrics: [
        { value: '9', label: 'agents on Fetch.ai,\n8 live on Agentverse' },
        { value: '26 of 27', label: 'planted purchasing errors\ncaught on a blind first run' },
      ],
      stack: 'Python · Next.js · TypeScript · Fetch.ai uAgents · ASI:One · SpacetimeDB · Cartesia · Stripe (test mode) · Apify · Bright Data',
      media: {
        image: '/builds/fishmarket.webp',
        alt: 'Fish Market landing page: "The secure agentic marketplace. Where buyers and sellers thrive." beside a sealed bidding round on the floor, and a dashboard of goal, round, approval and receipt',
      },
      links: [
        { label: 'Live site', href: 'https://fishmarket.dev' },
        { label: 'Devpost', href: 'https://devpost.com/software/fish-market-of6te2' },
        { label: 'Video', href: 'https://youtu.be/kv0vo8mmN5U' },
        { label: 'Source', href: 'https://github.com/vs-githjk/fish-market-nothing-fishy' },
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
      'Secure code generation with tool-guided feedback: a repair loop hands compiler and static-analyzer findings back to the model to fix, and cut CodeLlama 7B’s CodeQL errors by 83.7%.',
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
    /* The repair loop, drawn (ResearchRow.jsx). `rounds` is the "up to three repair
       rounds" of the story; the bar lengths are read from the first metric above,
       never typed again (scripts/check-scenes.mjs checks both). */
    loop: {
      rounds: 3,
      model: 'Model',
      checks: ['GCC', 'CodeQL'],
      final: 'KLEE',
      back: 'findings go back',
      lap: 'round',
      before: 'before',
      after: 'after the loop',
      alt: 'The repair loop: the model writes C, GCC and CodeQL check it, and their findings go back to the model for up to three repair rounds, with KLEE as the final check. CodeQL errors in CodeLlama 7B’s C code fell from {before} to {after} across 5,000 tasks.',
    },
    links: [
      { label: 'Read the paper', href: 'https://arxiv.org/abs/2607.21641' },
      { label: 'Source', href: '' }, // TODO
    ],
  },

  /* ---- Now building: one panel after More builds -------------------------- */
  /* Master Agents, his private Claude Code crew (repo vs-githjk/master-agents,
     private, so no link). Facts confirmed by Vidyut on Nov 12 2026: one sentence
     runs the playbook to a reviewed branch and stops at his three gates; 12
     specialist agents plus Codex as a second model; 52 skills; model routing with
     every run logged; the five-seat council; the self-improving loop; the
     anti-generic filter. Listed as work in progress, never as a shipped product,
     and never compared with anyone else's agents. Character art: /agents/<id>.webp
     (294px) and /agents/<id>-148.webp, cropped from the crew's roster sheet. */
  building: {
    eyebrow: 'Now building',
    title: 'Master Agents',
    descriptor: 'my own Claude Code crew',
    when: 'Oct 2026 to Present · private repo',
    oneLiner: 'One sentence in. A reviewed branch out.',
    lead: 'An orchestrator, **twelve specialists** and a second model. They research, plan, design, build test first, review and judge, and they stop only where I told them to.',
    prompt: {
      label: 'You',
      lines: ['I’m at <hackathon>', 'use the master playbook'],
      or: 'or',
      stepsLabel: 'The crew',
      steps: ['plan', 'research', 'design', 'build', 'review', 'judge'],
      outLabel: 'Out',
      out: 'a reviewed branch',
      gatesLabel: 'Stops only at my gates',
      /* A gate may become { name, before: '<step>' } once Vidyut confirms where it
         sits among the steps (TODO: ask him). Until then the run on the page holds
         once, before the branch, and names all three. */
      gates: ['the plan', 'the design direction', 'the overnight build'],
      /* The run you can press (CrewRun.jsx). It waits for the reader's own Go. */
      run: {
        start: 'Run it',
        again: 'Run it again',
        go: 'Go',
        gate: 'my go',
        given: 'go given',
        rest: 'Press Run it. It will stop and wait for you.',
        typing: 'One sentence in.',
        step: 'The crew: {step}.',
        hold: 'Stopped. A real run waits for me at each gate: {gates}. This one waits for you. Nothing moves until you say go.',
        done: 'Out: a reviewed branch. Nothing was pushed.',
      },
    },
    rosterLabel: 'The crew',
    rosterHint: '{Crew} characters, one job each. Pick one.', // {Crew} is crew.length, as a word
    of: 'of',
    crew: [
      { id: 'orchestrator', name: 'The Orchestrator', job: 'runs the room', does: 'Takes the one sentence, hands every task to the cheapest model that can do it well, and makes the final call.' },
      { id: 'scout', name: 'The Scout', job: 'research', does: 'Researches with live signals and comes back with sources, numbers and data ready for code.' },
      { id: 'strategist', name: 'The Strategist', job: 'plans', does: 'Turns a rough idea into ranked options, a spec and an hour-by-hour plan.' },
      { id: 'judge', name: 'The Judge', job: 'judges', does: 'Scores the work the way a real hackathon judge would, then red-teams it.' },
      { id: 'artist', name: 'The Artist', job: 'design', does: 'Studies real references, shows the boldest direction first, then ships code in the project’s own stack.' },
      { id: 'engineer', name: 'The Engineer', job: 'builds', does: 'Builds one task at a time, test first, on its own branch. Never pushes.' },
      { id: 'codex', name: 'Codex', job: 'second model', does: 'OpenAI’s model reviews every change Claude makes, because two models miss different things.' },
      { id: 'inspector', name: 'The Inspector', job: 'reviews', does: 'Reruns every test itself and answers in one of three words: PASS, FIX or STOP.' },
      { id: 'xo', name: 'The XO', job: 'coordinates', does: 'Keeps the shared memory, tracks who is doing what and keeps the loops running overnight.' },
      { id: 'sentinel', name: 'The Sentinel', job: 'ops and security', does: 'Watches deploys, logs and security. Changes nothing until I say go.' },
      { id: 'director', name: 'The Director', job: 'demo video', does: 'Cuts raw clips into the demo video: captions, music, titles and the thumbnail.' },
      { id: 'wordsmith', name: 'The Wordsmith', job: 'writes', does: 'Writes the emails, the write-up and the pitch script.' },
      { id: 'prospector', name: 'The Prospector', job: 'finds leads', does: 'Finds and researches the people worth reaching. Never sends a thing.' },
      { id: 'mentor', name: 'The Mentor', job: 'teaches', does: 'Teaches me the field I have not tried yet, then drills the pitch and the judge Q&A.' },
    ],
    system: [
      {
        label: 'Routing',
        title: 'The right model for each job',
        rows: [
          { k: 'Judgement', v: 'Opus' },
          { k: 'Building', v: 'Sonnet' },
          { k: 'Watching and polling', v: 'Haiku' },
          { k: 'Bulk and first passes', v: 'Codex · Gemini · OpenRouter' },
        ],
        foot: 'Every run is logged with its tokens and its cost.',
      },
      {
        label: 'The council',
        title: 'Five model families, one vote',
        seats: ['Claude', 'OpenAI', 'Gemini', 'DeepSeek', 'Grok'],
        text: 'For calls that are hard to reverse (a plan pick, a design pick, a risky diff, final judging before a submit), five seats answer the same brief **alone**, read each other once **with the names removed**, then vote. The orchestrator decides.',
      },
      {
        label: 'The loop',
        title: 'It gets better on its own',
        text: 'Every failure becomes an eval case, and a change to an agent is kept only if it **beats the current version with no regressions**. Ideas pass an anti-generic filter that throws out anything a default model would suggest.',
      },
    ],
    facts: [
      { value: '12', label: 'specialist agents,\nplus Codex as a second model' },
      { value: '52', label: 'skills the crew\nworks from' },
      { value: '5', label: 'model families seated\non the council' },
      { value: '0', label: 'pushes, deploys, sends or\nspends without my go' },
    ],
    close: 'I use it on every project, this site included.',
    stack: 'Claude Code · subagents · skills · workflows · OpenAI Codex · Gemini · OpenRouter · MCP · GitHub',
  },

  /* ---- More builds: same card shape as `items`, smaller in the layout ----- */
  more: {
    readMore: 'Read more',
    readMoreSr: ' about {title}',
    heading: 'More builds',
    intro: 'A hackathon meeting agent, an interview-prep product, public tools and side projects. Every one has a public repo you can open.',
    items: [
      {
        id: 'prismkeep',
        /* Repo github.com/vs-githjk/sf-startup-challenge, plan/devpost.md "Results
           from today's run". 1st overall confirmed by Vidyut (Oct 22). Demo data is
           synthetic. TODO: Devpost link when he has it. */
        kind: 'Hackathon · team of 4',
        title: 'PrismKeep',
        descriptor: 'founder follow-up agents',
        when: 'Oct 2026 · SF Startup Challenge',
        oneLiner:
          'Your AI just promised an investor something a customer contradicted yesterday. PrismKeep’s six agents catch it before it sends.',
        awards: ['1st overall'],
        role: 'I built the agents and their Band rooms, and wired in meetings from PrismAI.',
        body: [
          '**1st overall at the SF Startup Challenge.** Six agents share one Cognee memory of every investor meeting, customer call and support ticket. A Listener flagged a cross-meeting contradiction without being asked, a Brain agent forgot 5 stale facts on one founder correction, and every outbound draft went out with **0 unverified claims**, approved by the founder, with the sha256 of the approved text matching what was sent. A Security Reviewer blocked a fix until Snyk Code came back clean.',
        ],
        metrics: [],
        stack: 'Python · FastAPI · LangGraph · Band · Claude Code · Codex · Cognee · Neo4j · Snyk · Flexprice',
        media: {
          image: '/builds/prismkeep.webp',
          alt: 'PrismKeep logo, "Promises kept. Stories straight.", beside an investor draft marked Not true against a customer call saying "We’ll look at alternatives"',
        },
        links: [
          { label: 'Source', href: 'https://github.com/vs-githjk/sf-startup-challenge' },
        ],
      },
      {
        id: 'quorum',
        kind: 'Hackathon · weekend · team of 4',
        title: 'Quorum',
        descriptor: 'AI meeting participant',
        when: 'Mar 2026 · YHack',
        oneLiner:
          'An AI teammate that joins your meeting, talks back, and does the task you ask for out loud.',
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
          'An AI that reads SEC filings and is forbidden from having an opinion: what was filed, never what it means.',
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
          'Interview prep that tells you why you missed, from a coach that is not allowed to grade you.',
        awards: [],
        role: 'I designed the architecture and wrote nearly all of it; a teammate set up the staging deploy.',
        body: [
          'I built the working version for my own prep first. It plans each day to a minute budget, picks problems just above my level in each topic, schedules spaced re-solves and runs a mock interview with a voiced interviewer. When a problem goes badly, Claude explains why, and the scoreboard stays out of its hands: **ratings and the green, amber or red verdict a mentor sees come from formulas**, with the reasons attached.',
          'On the multi-user platform I measured cost from the first week. Every model call is logged with its tokens and cost, and live probes showed **prompt caching cut the input cost of a 12-turn mock interview by 73%**. The public prototype is a concept demo of that platform, not the working build.',
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
        oneLiner: 'Ask for a movie the way you would ask a friend. Get picks, with reasons.',
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
          'Your bag is about to miss its connection. TransitGuard flags it while there is still time to save it.',
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
        oneLiner: 'Drop in a topic or a paper, and it maps the papers to read first.',
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
        oneLiner: 'Algorithms, taught as a game you want to win instead of a problem set you have to finish.',
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
  /* Four strata, the newest on top. `bed` is the label on the edge of the cut:
     where the claim comes from and when, the way a bed in a rock face is dated. */
  items: [
    {
      bed: 'Hackathons · 2026',
      text: '**5× hackathon winner** in 2026, with six first places, including **1st overall** at the SF Startup Challenge.',
    },
    {
      bed: 'arXiv · 2026',
      text: 'Cut CodeLlama 7B’s **CodeQL errors by 83.7% across 5,000 C tasks**, as first author on an arXiv preprint.',
    },
    {
      bed: 'PrismAI · 2026',
      text: 'Took PrismAI from an empty repo to **14 beta users and 100+ meetings analyzed** in about six months, and shipped its agency release two months later.',
    },
    {
      bed: 'Comcast · 2025',
      text: 'Cut **~40% of recurring planning and coordination work** for a 40-person engineering team at Comcast.',
    },
  ],
};

/* ------------------------------------------------------------- RECEIPTS ---- */
/* The thesis rule "claims come with receipts", made touchable: a bold figure in
   Highlights, Value or Experience is a button that opens what the figure measures
   and where it can be checked. `on` maps the exact bold phrase to a receipt.
   Rules: a receipt only repeats facts and links that are already in this file,
   and when there is no public page it says so. Never invent a source. */
export const receipts = {
  label: 'Receipt',
  open: 'Receipt for',
  measures: 'What it measures',
  check: 'Where to check',
  close: 'Close',
  on: {
    '~40% of recurring planning and coordination work': 'comcast',
    '~40% of the team’s recurring planning and coordination work': 'comcast',
    '14 beta users and 100+ meetings analyzed': 'prismai-beta',
    'CodeQL errors by 83.7% across 5,000 C tasks': 'paper',
    '5× hackathon winner': 'wins',
    '1st overall': 'prismkeep',
    'GPA 3.84 of 4.00': 'psu',
    "Dean's List, 6 of 6 semesters": 'psu',
    '151 people have played': 'duelwise-play',
    'no strength number it has not earned': 'duelwise-gate',
  },
  items: {
    comcast: {
      measures:
        'Recurring planning and coordination work for a 40-person engineering team, after the Langflow pilot I scoped and shipped at Comcast’s India Engineering Centre, May to Aug 2025.',
      links: [
        { label: 'Resume, Comcast entry', href: '/resume.pdf' },
        { label: 'LinkedIn, roles and dates', href: 'https://www.linkedin.com/in/vidyut-sriram-4b5a012aa' },
      ],
    },
    'prismai-beta': {
      measures:
        'Beta users, each in an isolated workspace, and meetings analyzed in the beta. These are PrismAI’s own counts, so there is no public page for them; the product itself is live.',
      links: [
        { label: 'PrismAI, live site', href: 'https://www.meetprismai.com/' },
        { label: 'The build on this page', href: '#build-prismai' },
      ],
    },
    paper: {
      measures:
        'CodeQL errors in CodeLlama 7B’s C code across 5,000 tasks: 15,088 without the repair loop, 2,463 with it. A preprint, with me as first author.',
      links: [
        { label: 'arXiv:2607.21641', href: 'https://arxiv.org/abs/2607.21641' },
        { label: 'The paper on this page', href: '#build-secure-codegen' },
      ],
    },
    wins: {
      measures:
        'Five hackathons in 2026 where a build of mine or my team’s took a prize: Bitcamp, the AI Hackathon by LA Hacks, Cal Hacks 13.0, super{set} SF and the SF Startup Challenge. Six of those prizes are first places.',
      links: [
        { label: 'Devpost, vs-githjk', href: 'https://devpost.com/vs-githjk' },
        { label: 'Every win, with its page', href: '#wins' },
      ],
    },
    prismkeep: {
      measures:
        'PrismKeep, 1st overall at the SF Startup Challenge, AWS Builder Loft, Oct 2026. I do not have a public results page to link yet; the code is public.',
      links: [
        { label: 'Source on GitHub', href: 'https://github.com/vs-githjk/sf-startup-challenge' },
        { label: 'The build on this page', href: '#build-prismkeep' },
      ],
    },
    psu: {
      measures: 'Penn State, B.S. Computer Science with a Math minor, graduating Dec 2026.',
      links: [{ label: 'Resume, Education', href: '/resume.pdf' }],
    },
    'duelwise-play': {
      measures:
        'People who have played DuelWise since it launched on Oct 30 2026 (151 as of Nov 15), and 853 matches against its agents in the first two weeks, counted on the site’s owner dashboard. My own games and automated test runs are left out.',
      links: [
        { label: 'DuelWise, live', href: 'https://duelwise.app' },
        { label: 'Source on GitHub', href: 'https://github.com/vs-githjk/duelwise' },
      ],
    },
    'duelwise-gate': {
      measures:
        'A level shows a strength number only once it beats the level below it: a 95% lower bound over hundreds of games, re-checked before the site shows one. Until then it says In training.',
      links: [
        { label: 'DuelWise, live', href: 'https://duelwise.app' },
        { label: 'The build on this page', href: '#build-duelwise' },
      ],
    },
  },
};

/* ---------------------------------------------------------- HOW I BUILD --- */
/* 2x2 grid. Each one carries a receipt from the builds above, and each runs once
   as a tiny machine (`demo`, drawn by Principles.jsx). A demo either uses a fact
   that is already on this page (BetterBill's 22 of 22, Terrametric's 36 hours) or
   says in its own label that it is an illustration. `alt` is what a screen reader
   hears in place of the drawing. */
export const principles = {
  eyebrow: 'How I build',
  heading: 'Principles',
  replay: 'Replay',
  items: [
    {
      title: 'The model explains. Code decides.',
      body: 'In BetterBill, Vytal, FilingWatch and NextRound, deterministic code computes every score, flag, verdict and dollar, and the model reads, drafts and explains. PrismAI’s agency release prices change orders the same way: the model estimates the hours, and code computes every dollar. When a number matters, it should never come from a guess.',
      demo: {
        kind: 'decide',
        alt: 'Illustration: the model writes “about $1,240”; it is struck out and code’s computed “$1,180.00” takes its place.',
        from: 'Model writes',
        fromValue: 'about $1,240',
        to: 'Code computes',
        toValue: '$1,180.00',
        note: 'Illustrative figures',
      },
    },
    {
      title: 'Something has to be able to say no.',
      body: 'Every system I build has at least one check that can reject the output: a compiler, a static analyzer, an output guard, a test that fails the build, or a person at the approval gate. If nothing can say no, the output is a guess with good formatting.',
      demo: {
        kind: 'gate',
        alt: 'Illustration: an unchecked output reaches the check and is stopped; a corrected one is let through.',
        gate: 'The check',
        no: 'Stopped',
        yes: 'Let through',
        note: 'Illustration',
      },
    },
    {
      title: 'Measure, then claim.',
      body: 'Every number I publish says what it measures, and where I can, how: BetterBill’s catch rate comes with the fact that we planted the errors, and the paper’s error reduction comes with the set of tasks it was measured on. "Feels better" stays a hunch until a number backs it.',
      demo: {
        kind: 'measure',
        alt: 'BetterBill: twenty-two seeded billing errors are counted one by one, and only then does the claim “22 of 22 seeded billing errors caught” ink in.',
        label: 'Counted first',
        source: 'BetterBill',
        count: 22,
        tally: '22 of 22',
        claim: '22 of 22 seeded billing errors caught',
      },
    },
    {
      title: 'End to end first, then polish.',
      body: 'Terrametric ran from field data to a 14-day forecast to an SMS alert inside 36 hours, because the whole path worked before any part of it was pretty. You cannot tune what does not run.',
      demo: {
        kind: 'wire',
        alt: 'Terrametric: a wire lights from field data through the forecast to the SMS alert, and only then is each stage finished.',
        nodes: ['Field data', 'Forecast', 'SMS alert'],
        note: 'Terrametric: end to end inside 36 hours',
      },
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
        'In PrismAI, a **cross-tenant attack suite blocks CI**, so a data leak between customers fails the build before it can ship.',
        'DuelWise shows **no strength number it has not earned**: a level must beat the one below it over hundreds of games before the site shows one.',
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
        'PrismAI and DuelWise are **live, and I run both**: PrismAI has beta users in isolated workspaces, and **151 people have played** against DuelWise’s agents since it launched on Oct 30.',
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
/* The section is a reverse index (Toolkit.jsx): a tool that appears in the stack
   line of a build on this page is a button, and picking it lists those builds.
   The index is computed from the `stack` lines above, never typed. `aliases`
   maps a toolkit name to the exact spellings stack lines use for the same tool.
   A tool with no stack line here (the resume, or work outside these builds) stays
   plain text. `answer` never shows a bare count: it names the builds. */
export const toolkit = {
  eyebrow: 'Toolkit',
  heading: 'Shipped with,',
  headingEm: 'not read about.',
  hint: 'Pick an underlined tool and the builds that list it in their stack answer.',
  first: 'LangGraph',
  answer: '{tool} is in the stack of {builds}.',
  and: 'and',
  aliases: {
    'Anthropic API': ['Claude', 'Claude API', 'Claude Haiku 4.5', 'Claude tool use'],
    'OpenAI API': ['OpenAI'],
    'Tool calling': ['Claude tool use'],
    RAG: ['retrieval'],
    PostgreSQL: ['Postgres'],
    'Row-level security': ['RLS on every table', 'forced RLS'],
    'SSE / WebSockets': ['WebSockets'],
    'Tailwind CSS': ['Tailwind 4'],
    'Chrome extensions': ['Chrome extension'],
    'GitHub CodeQL': ['CodeQL'],
    Vercel: ['Vercel functions'],
  },
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
   typed here. Wins repeat the award badges above (9 in total). "1st" rests on
   Vidyut's confirmation and his resume; Devpost itself says "Winner" and the
   prize name. Event names follow Devpost. */
export const proofOfWork = {
  eyebrow: 'Proof of work',
  heading: 'Verify me in',
  headingEm: 'one click.',
  intro:
    'Most of what is above leaves a public trail: every hackathon win links to its Devpost page, and the graph under them counts my private-repo work too.',
  github: {
    eyebrow: 'GitHub · last 12 months',
    handle: '@vs-githjk',
    href: 'https://github.com/vs-githjk',
    /* No totals, streaks or month counts here (Vidyut, Nov 16: he can make 333
       commits in three days, so a total says nothing). The graph is the evidence. */
    graphLabel: 'My GitHub contribution graph for the last 12 months, one column per week',
    note: '',
    phoneNote: 'On a phone the graph shows the latest six months.',
    /* The ridge above the calendar: one butte per week. The same record stands on
       the night horizon behind this section (the world scene). */
    ridge: 'Each butte is one week; its height follows that week’s contributions.',
    weekTip: 'Week of {date}: {n} contributions',
    dayTip: '{n} contributions on {date}',
    scrub: 'Step through the weeks of the graph',
    updated: 'Updated',
    keyLess: 'Less',
    keyMore: 'More',
  },
  /* Plaques, ordered by placing (rank 1 first, then the "Winner", then 2nd and
     3rd). `place` is the word struck on the plaque; Fish Market's is "Winner"
     because that is all its Devpost page says. Gold is used here and nowhere else. */
  wins: {
    eyebrow: 'Wins',
    link: { label: 'Devpost', href: 'https://devpost.com/vs-githjk' },
    provenance:
      'Devpost shows each prize as “Winner” with the prize’s name; the placings (1st, 2nd, 3rd) are as they stand on my resume. Most recent win: Oct 2026.',
    items: [
      {
        place: '1st',
        prize: 'overall',
        project: 'PrismKeep',
        event: 'SF Startup Challenge, AWS Builder Loft · Oct 2026',
        href: '', // TODO: Devpost link when Vidyut has it
      },
      {
        place: '1st',
        prize: 'Track 1: Hacking with Public Data APIs',
        project: 'FireSight',
        event: 'super{set} SF · Oct 2026',
        href: 'https://devpost.com/software/firesight-fnt4le',
      },
      {
        place: '1st',
        prize: 'Visa track',
        project: 'BetterBill',
        event: 'AI Hackathon 2026 by LA Hacks · Oct 2026',
        href: 'https://devpost.com/software/betterbill',
      },
      {
        place: '1st',
        prize: 'Photon: Best Voice Agent',
        project: 'BetterBill',
        event: 'AI Hackathon 2026 by LA Hacks · Oct 2026',
        href: 'https://devpost.com/software/betterbill',
      },
      {
        place: '1st',
        prize: 'Real World track (Ambrook)',
        project: 'Terrametric',
        event: 'Bitcamp 2026 · Apr 2026',
        href: 'https://devpost.com/software/terrametric',
      },
      {
        place: '1st',
        prize: 'Intermediate Data Science track',
        project: 'Terrametric',
        event: 'Bitcamp 2026 · Apr 2026',
        href: 'https://devpost.com/software/terrametric',
      },
      {
        place: 'Winner',
        prize: 'Best Use of Fetch.ai',
        project: 'Fish Market',
        event: 'Cal Hacks 13.0 · Oct 2026',
        href: 'https://devpost.com/software/fish-market-of6te2',
      },
      {
        place: '2nd',
        prize: 'Engineering',
        project: 'Research paper',
        event: 'Penn State Undergraduate Exhibition 2026',
        href: '', // resume only, no public results page
      },
      {
        place: '3rd',
        prize: 'Open Source (Featherless)',
        project: 'Terrametric',
        event: 'Bitcamp 2026 · Apr 2026',
        href: 'https://devpost.com/software/terrametric',
      },
    ],
  },
  checkLabel: 'Check it yourself',
  tiles: [
    {
      kind: 'Devpost',
      value: 'vs-githjk',
      detail: '6 prize wins across 3 projects',
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
    'Building agents that have to hold up with real users? Write to me. If you think I got something on this page wrong, tell me that too.',
  /* His studio headshot, so a face is on the page once (the hero uses his sunset
     silhouette). 240px and 480px (2x) squares from public/portrait@2x.jpg. */
  portrait: {
    src: '/headshot-240.webp',
    src2x: '/headshot-480.webp',
    alt: 'Vidyut Sriram, smiling, in a light blue polo',
  },
  /* Mint means available. He graduates in Dec 2026 and can start in Jan 2027. */
  availability: 'Available from January 2027',
  email: 'vidyut0712@gmail.com',
  /* The email link opens a draft that already has a subject and a first line. */
  mail: {
    subject: 'Hello from your portfolio',
    body: 'Hi Vidyut,\n\n',
  },
  copyLabel: 'Copy email',
  copiedLabel: 'Copied',
  copiedSay: 'Email address copied.',
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
  footerTop: 'Back to orbit',
  /* The credits at the foot (Footer.jsx). {Crew} is the size of the crew, counted. */
  credits: {
    label: 'Credits',
    cast: 'The crew · {Crew} agents, one job each',
    world: 'In the world',
    faces: {
      label: 'The faces',
      rows: [
        { where: 'First screen', what: 'My studio photograph in a round window, gathered from points of light and let go into the ball' },
        { where: 'Under my name', what: 'A silhouette on a beach at sunset' },
        { where: 'Contact', what: 'The studio headshot' },
      ],
    },
  },
  /* The colophon: how the site was made. `lighthouse` holds numbers measured on
     the production build on the date given, on Lighthouse's phone profile; leave
     it null rather than quote a number that was not measured that day. */
  colophon: {
    label: 'Colophon',
    made: 'Written by hand in React and plain CSS; the world behind the page is one three.js scene, and the face on the first screen is my photograph, with points of light baked from it that gather into the picture and let go.',
    type: 'Set in Sprat, Brygada 1918, Schibsted Grotesk and Martian Mono, all open source.',
    measured: 'Lighthouse, phone profile, {date}: performance {performance}, accessibility {accessibility}, best practices {bestPractices}, SEO {seo}.',
    // Measured Nov 15 2026 on the production build (npm run build, npm run preview), Lighthouse 12.2.1,
    // --form-factor=mobile: three quiet runs gave 96, 100, 100, 100 (LCP 2.6 s, TBT 0 to 10 ms).
    lighthouse: { date: 'Nov 15 2026', performance: 96, accessibility: 100, bestPractices: 100, seo: 100 },
    llms: { label: 'This page as plain text: llms.txt', href: '/llms.txt' },
  },
};

/* The two waterlines of the journey (Vista.jsx): one short line each, naming the
   world the reader is entering. Added Nov 15 2026 with the three-worlds overhaul. */
export const worlds = {
  surface: 'Under the surface: the work.',
  shore: 'On solid ground: the crew I am building, then the proof.',
  /* The place each section is, shown beside its eyebrow (PlaceName.jsx) until the
     shell's chart lists it in data/world.js. Keys are section ids. */
  places: {
    work: 'The Sounding',
    builds: 'The Deep',
    crew: 'The Camp',
    highlights: 'The Cut',
    verify: 'The Ridge at night',
    principles: 'The Bench',
    value: 'Moonrise',
    toolkit: 'The Inventory',
    contact: 'First Light',
  },
};

/* Numbers as words, for sentences whose count is computed (components/counts.js). */
export const numberWords = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty',
  'twenty-one', 'twenty-two', 'twenty-three', 'twenty-four', 'twenty-five', 'twenty-six', 'twenty-seven', 'twenty-eight', 'twenty-nine', 'thirty',
];
