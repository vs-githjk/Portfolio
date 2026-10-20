// Build-time GitHub contribution snapshot. Runs in `prebuild`; never at runtime.
// Writes src/data/github.json. If GitHub is unreachable or the parse looks wrong,
// keeps the committed snapshot and exits 0 so the build never fails offline.
import { readFile, writeFile } from 'node:fs/promises';

const USER = 'vs-githjk';
const OUT = new URL('../src/data/github.json', import.meta.url);
const TIMEOUT_MS = 8000;

async function get(url, opts = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal });
    if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
    return res;
  } finally { clearTimeout(t); }
}

// Preferred: GraphQL, only when a token is present in the build env (GITHUB_TOKEN).
async function viaGraphQL(token) {
  const query = `{ user(login:"${USER}") { contributionsCollection {
    restrictedContributionsCount totalCommitContributions totalPullRequestContributions
    contributionCalendar { totalContributions weeks { contributionDays { date contributionCount contributionLevel } } } } } }`;
  const res = await get('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  const c = (await res.json()).data.user.contributionsCollection;
  const lv = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };
  const days = c.contributionCalendar.weeks.flatMap((w) => w.contributionDays)
    .map((d) => ({ date: d.date, count: d.contributionCount, level: lv[d.contributionLevel] ?? 0 }));
  return { total: c.contributionCalendar.totalContributions, days, source: 'graphql',
    breakdown: { private: c.restrictedContributionsCount, commits: c.totalCommitContributions, prs: c.totalPullRequestContributions } };
}

// Fallback: the public calendar HTML (no token). Markup can change, so validate hard.
async function viaHTML() {
  const html = await (await get(`https://github.com/users/${USER}/contributions`, { headers: { 'User-Agent': 'portfolio-build' } })).text();
  const total = Number((html.match(/([\d,]+)\s+contributions?\s+in the last year/) || [])[1]?.replace(/,/g, ''));
  const tips = new Map();
  for (const m of html.matchAll(/<tool-tip[^>]*for="([^"]+)"[^>]*>([^<]*)/g)) tips.set(m[1], Number((m[2].match(/^(\d+) contribution/) || [0, 0])[1]));
  const days = [];
  for (const m of html.matchAll(/<td[^>]*ContributionCalendar-day[^>]*>/g)) {
    const td = m[0];
    const date = td.match(/data-date="([^"]+)"/)?.[1];
    const level = Number(td.match(/data-level="(\d)"/)?.[1] ?? 0);
    const id = td.match(/id="([^"]+)"/)?.[1];
    if (date) days.push({ date, count: tips.get(id) ?? 0, level });
  }
  days.sort((a, b) => a.date.localeCompare(b.date));
  return { total, days, source: 'html' };
}

function stats(days) {
  let longest = 0, run = 0;
  for (const d of days) { run = d.count > 0 ? run + 1 : 0; longest = Math.max(longest, run); }
  let current = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].count > 0) current++;
    else if (i === days.length - 1) continue; // today may be empty so far
    else break;
  }
  return { activeDays: days.filter((d) => d.count > 0).length, longestStreak: longest, currentStreak: current };
}

function valid(r) {
  const sum = r.days.reduce((s, d) => s + d.count, 0);
  return r.days.length >= 360 && r.days.length <= 372 && Number.isFinite(r.total) && sum === r.total;
}

try {
  const token = process.env.GITHUB_TOKEN;
  const r = token ? await viaGraphQL(token).catch(() => viaHTML()) : await viaHTML();
  if (!valid(r)) throw new Error(`parse check failed (days=${r.days.length}, total=${r.total})`);
  const out = { user: USER, fetchedAt: new Date().toISOString(), ...r, ...stats(r.days) };
  await writeFile(OUT, JSON.stringify(out) + '\n');
  console.log(`github.json: ${out.total} contributions, ${out.days.length} days (${out.source})`);
} catch (err) {
  try { await readFile(OUT); console.warn(`github.json: kept committed snapshot (${err.message})`); }
  catch { console.warn(`github.json: no snapshot and fetch failed (${err.message}); section should hide`); }
  process.exitCode = 0;
}
