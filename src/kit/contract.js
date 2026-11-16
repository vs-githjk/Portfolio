/* The world kit contract: every event, CSS variable and anchor name the shell,
   the scene and the sections share. Frozen for a build night; changes go
   through the integrator. No site words here. */
export const EV = {
  week: 'world:week', // { index }
  dawn: 'world:dawn', // {}
  agent: 'world:agent', // { hue, id }
  focus: 'world:focus', // { kind: 'build' | 'win' | 'tool', id | null }
  run: 'world:run', // { state: 'idle' | 'step' | 'hold' | 'done', step, gate }
  travel: 'world:travel', // { dir: 1 | -1, phase: 'out' | 'in' }
  receipts: 'world:receipts', // { on }
  bindings: 'world:bindings', // [{ id, x, y, side, visible }], at most 10 a second, only while on
  loaded: 'world:loaded', // { stage: 'beams' | 'chunk' | 'compiled' }
  sound: 'world:sound', // { cue: 'line' | 'tick' | 'pass' | 'go' | 'copy' }
};

export const VAR = {
  line: '--w-line', // surface waterline, px from window top, -1 when off screen
  shore: '--w-shore', // second waterline, same
  depth: '--w-depth', // 0 to 1 down the page from heroOrigin()
  px: '--px',
  py: '--py', // pointer, -1 to 1, fine pointers only
};

export const ANCHOR = [
  'surface', 'giant', 'flag-prismai', 'flag-duelwise', 'flag-snapback', 'fleet-fishmarket',
  'shore', 'camp', 'galaxy', 'roost', 'graph', 'wins', 'value', 'contact', 'horizon',
];

export const BINDING = ['orrery', 'wyrm', 'giant', 'prism', 'board', 'scan', 'school', 'fires', 'stars', 'moon'];
