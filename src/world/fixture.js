/* Dev only (World.jsx imports this behind import.meta.env.DEV and ?fixture):
   stand-ins for the anchors the shell and the sections render, so the world's
   pieces can be built and measured before those lanes land. Each is an empty
   box with a data-world-anchor; nothing here ships. */
export function mountFixture() {
  if (document.querySelector('[data-world-fixture]')) return;
  const box = (name, css, before) => {
    if (!before || document.querySelector(`[data-world-anchor="${name}"]`)) return;
    const el = document.createElement('div');
    el.dataset.worldAnchor = name;
    el.dataset.worldFixture = '';
    el.setAttribute('aria-hidden', 'true');
    el.style.cssText = `position:relative;pointer-events:none;${css}`;
    before.parentNode.insertBefore(el, before);
  };
  // The Builds opener: one screen with a heading, a line and a row of dots in it.
  const giant = document.querySelector('.vista[data-set="giant"]');
  if (giant && !document.querySelector('[data-world-anchor="giant"]')) {
    giant.dataset.worldAnchor = 'giant';
    giant.dataset.worldFixture = '';
    giant.style.height = '100svh';
    const copy = document.createElement('div');
    copy.style.cssText = 'position:absolute;left:max(16px,calc(50% - 528px));bottom:14%;max-width:min(520px,calc(100% - 32px));color:var(--ink);';
    copy.innerHTML = '<p style="font:500 clamp(64px,13vw,150px)/0.95 var(--font-display);margin:0">Builds</p><p style="margin:14px 0 0;font-size:18px">Fixture line: twenty-one builds, three I run today.</p><p style="margin:18px 0 0;font:12px var(--font-mono);letter-spacing:.08em">FLAGSHIPS . . .  FLEET . . . . . . . .  PAPER .  MORE . . . . . . . .</p>';
    giant.appendChild(copy);
  }
  // The roost: a band over the commit graph.
  box('roost', 'height:clamp(130px,24svh,210px);', document.querySelector('.pow-card'));
  // A window of its own for each flagship's world, above its panel.
  for (const id of ['prismai', 'duelwise', 'snapback']) {
    box(`flag-${id}`, 'height:clamp(340px,62svh,620px);', document.querySelector(`#build-${id}`));
  }
  // The wins: the plaques' own list.
  const wins = document.querySelector('.plaque')?.closest('ul, ol, div');
  if (wins && !document.querySelector('[data-world-anchor="wins"]')) {
    wins.dataset.worldAnchor = 'wins';
    wins.dataset.worldFixture = '';
  }
}
