# Design prompts

How to run design sessions on this repo with Claude Code without burning context
or ending up with a generic-looking page.

---

## The workflow

Design is the worst possible use of a long, drifting session. Every exploratory
turn accumulates in context, and by turn thirty the model is reasoning about a
conversation instead of about your CSS. Run it in short, disposable loops:

```
/clear                     ← start every task from zero
[scope + plan prompt]      ← plan mode, no code written
[approve or redirect]      ← cheapest place to change your mind
[implement]                ← one section, one commit
npm run build && npm run lint
git commit
/clear                     ← and again
```

**One section per session.** Never "redesign the site." The single biggest driver
of both cost and mediocrity is asking for too much at once — broad requests get
safe, average answers, because averaging is what a model does when the target is vague.

**Plan before code.** `/plan` puts Claude in read-only mode; it proposes and you
approve. Rejecting a plan costs a few hundred tokens. Rejecting an implementation
costs thousands and leaves you re-reading diffs. Plan mode also reads `CLAUDE.md`,
so the architecture rules land automatically.

**Commit between every task.** Cheap, reversible experiments are the whole point.
`git commit` after each accepted change; branch before anything drastic.

**Watch `/context`.** Quality degrades well before the window is full. If you're
past ~60%, `/clear` and re-scope rather than pushing through.

### Model choice

Fable is worth it for taste, judgment, and architecture. It's overkill for
mechanical work. A reasonable split:

- `/model` → Fable for **planning, aesthetic direction, and critique**
- a cheaper model for **applying an already-approved plan**, renaming, moving files

`/effort` raises or lowers reasoning depth per task. `/cost` shows what a session
actually spent — check it a few times early so you calibrate.

---

## The master prompt

Copy this, fill the four brackets, paste into `/plan`. It's built to keep context
small, force a real design decision, and produce something reviewable.

```
Design task on this repo. Read CLAUDE.md first — it has the thesis and the
architecture rules, and they are binding.

SCOPE — read only these files. Do not scan the repo, do not open node_modules,
dist, or package-lock.json, and do not re-read anything already in context:
  @src/styles/tokens.css
  @src/styles/sections.css
  @src/components/[COMPONENT].jsx

BRIEF
  [WHAT'S WRONG WITH IT NOW — be specific. "The Toolkit section is an
  undifferentiated wall of mono text and reads as filler." Not "make it better."]

  [WHAT IT SHOULD DO INSTEAD — the job, not the look. "It should let someone
  scan for one specific technology in under two seconds."]

INVARIANTS — violating any of these means the work is rejected:
  - Do not edit src/data/content.js. Copy is fixed for this task.
  - Every color, font, radius, and spacing value comes from a token in
    tokens.css. No hardcoded hex, px font sizes, or one-off rgba().
  - The page is grayscale. --running / --verified / --defect only ever indicate
    system state. No decorative color.
  - Reuse the existing breakpoints. No new media queries for font size —
    the type scale is already fluid via clamp().
  - prefers-reduced-motion must be respected by anything that moves.

PROCESS
  1. Give me a plan first. No code in this turn.
  2. The plan must include exactly THREE distinct directions, not three
     variations on one idea. For each: two sentences on the concept, the tokens
     it touches, and the one thing that makes it memorable.
  3. For each direction, name the obvious version of this that any competent
     designer would produce, and say how yours differs. If a direction IS the
     obvious version, cut it and think again.
  4. Recommend one and say why in a sentence.
  5. Stop. Wait for me to pick.

Keep the plan under 400 words. Prose, no tables, no ASCII mockups.
```

Then, once you've chosen:

```
Implement direction 2. Same invariants.

Show me a diff, not full file contents. Touch the minimum number of lines.
When done, run `npm run build` and `npm run lint` and report the result.
Do not summarize what you did — I'll read the diff.
```

That last line matters more than it looks. Post-hoc summaries of a diff you're
about to read are pure waste, and they're a large fraction of a typical session's
output tokens.

---

## Why this prompt is shaped this way

**"Read CLAUDE.md first"** — one file replaces a paragraph of re-explained
architecture in every prompt.

**Explicit `@` file scope** — without it, Claude explores the repo to orient
itself. On a small project that's tolerable; it's still the largest avoidable
context cost in a design session.

**"Three distinct directions, not variations"** — the default failure is three
near-identical options with different border radii. Naming the failure mode
prevents it.

**"Name the obvious version and say how yours differs"** — this is the single
highest-leverage line in the whole prompt. It forces an explicit check against
the generic answer instead of letting the model land there by gravity. Most
AI-generated design looks the same because nothing ever asked it not to.

**Invariants as rejection criteria, not preferences** — "try to use tokens" gets
ignored under pressure. "Violating this means the work is rejected" doesn't.

**Word limit on the plan** — plans expand to fill available space. Cap them.

---

## Ready-made prompts

### Explore a whole new visual direction, safely

```
/plan
Read CLAUDE.md. Read only @src/styles/tokens.css.

I want to see this site in a completely different register while keeping the
grayscale-plus-state-color rule intact.

Propose three token-only palettes-and-type-pairings — no structural changes,
nothing outside tokens.css. For each: the palette as 6 named hex values, a
display/body/mono type triad available on Google Fonts, and one sentence on
the feeling it produces and who it's aimed at.

None of them may be: cream background with a serif and a terracotta accent;
near-black with a single acid-green or vermilion accent; or a newspaper
broadsheet look. Those are the three defaults every AI design lands on and I
will recognize them.

Under 300 words.
```

Then: `Apply palette 2 on a branch called design/warm. Only tokens.css.`

Because everything routes through tokens, this genuinely restyles the whole site
from one file. Branch per direction, `git checkout` to compare, keep the winner.

### Critique before you build

```
/plan
Read CLAUDE.md. Read only @src/styles/sections.css and @src/App.jsx.

Act as a design director reviewing this before it goes to a client. Give me the
five weakest things about the page, ordered by how much they cost. For each:
what's wrong, why it reads that way, and the smallest change that fixes it.

Be blunt. Do not compliment anything. Do not propose code.
```

Run this before you start building, not after. It's the cheapest quality
improvement available and it costs one short turn.

### Add a new section

```
/plan
Read CLAUDE.md. Read only @src/data/content.js, @src/components/Principles.jsx,
and @src/styles/sections.css.

Add a section called [NAME] between [X] and [Y]. It should [JOB IT DOES].

Follow the existing pattern exactly: content shape goes in content.js, a
component in components/, styles appended to sections.css in page order, and
the component mounted in App.jsx.

It must not look like Principles or Value — those are a 2x2 grid and hairline
rows respectively. Find a third shape.

Plan only. Under 300 words.
```

### Tune the hero animation

```
Read only @src/components/Pipeline.jsx.

The pipeline animation feels [too frantic / too slow / mechanical]. Adjust only
the TIMING object and the CSS transition durations it depends on. Explain each
change in one clause. Do not restructure the component.
```

### Mobile pass

```
Read CLAUDE.md. Read only @src/styles/sections.css.

Audit this stylesheet for anything that breaks between 360px and 480px wide.
List problems with the line number and the fix. Do not edit yet.

Pay attention to: .pipe-flow, .agents, .proj-grid, .claim, .prin-grid,
.proof-grid, .metrics.
```

---

## Cost and context hygiene

| Do | Don't |
|---|---|
| `/clear` between unrelated tasks | Let one session run all day |
| Name exact files with `@` | "Look at the project and tell me…" |
| `/plan` before anything structural | Let it write code then argue |
| Ask for diffs | Accept full-file rewrites |
| Commit after every accepted change | Stack five experiments, then debug |
| `/context` when replies feel vague | Push through a degrading session |
| Fable for judgment, cheaper for typing | Fable to rename a variable |

Two more, specific to this repo:

- **Update `CLAUDE.md` when you change your mind.** If you decide to break the
  grayscale rule, edit the rule. Otherwise you'll spend every future session
  fighting your own documentation — and you'll lose, because it's read first.

- **Add `.gitignore`d scratch files, not conversation.** If you're iterating on
  copy, put drafts in a `notes/` file rather than keeping them alive in context.

---

## Anti-patterns

**"Make it look better."** Produces the average of every portfolio ever scraped.
Describe the job the section does and what's failing about it.

**"Make it pop."** Reliably means: add a gradient, add a glow, add a color.
All three break the design rule this site is built on.

**Accepting the first output.** The first version is the model's median. Ask for
three, reject the obvious one, then push the survivor further.

**Letting it touch `content.js` during a design task.** Copy and design drift
together and you lose the ability to tell which change caused what.

**Long sessions.** Everything above is downstream of this one.
