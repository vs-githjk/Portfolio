import { EV } from './contract';
import { on } from './bus';

/* The synth. Everything is made in the browser with Web Audio (oscillators and
   filtered noise): no audio file is ever requested. It exists only after the
   reader switches sound on (this module is a lazy chunk and the AudioContext is
   made inside start(), which runs from that click), it is quiet (the master gain
   is -18 dB at most), and it is silent in a hidden tab.

   A bed per realm, cross-faded when <html data-at> changes: `beds` maps a realm
   name ('' is the first one) to 'fifth' (two sines a fifth apart), 'water'
   (low-passed noise) or 'wind' (band-passed noise, slowly swelling). Five cues,
   asked for with EV.sound { cue }: line, tick, pass, go, copy. A waterline crossing
   the bar (<html data-split>) plays `line` by itself. */
const MASTER = Math.pow(10, -18 / 20);

export function createSound({ beds = { '': 'fifth' } } = {}) {
  let ctx = null;
  let master = null;
  let noise = null;
  let live = null; // the bed that is playing: { name, gain, stop }
  let offs = [];
  const root = document.documentElement;

  function noiseBuffer() {
    if (noise) return noise;
    noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = noise.getChannelData(0);
    let b = 0;
    for (let i = 0; i < data.length; i++) {
      b = 0.98 * b + 0.02 * (Math.random() * 2 - 1); // browner than white: no hiss
      data[i] = b * 6;
    }
    return noise;
  }

  function bed(kind) {
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(master);
    const nodes = [];
    if (kind === 'fifth') {
      for (const [hz, level] of [[110, 0.5], [164.8, 0.32], [220.4, 0.12]]) {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.frequency.value = hz;
        g.gain.value = level;
        osc.connect(g).connect(gain);
        osc.start();
        nodes.push(osc);
      }
    } else {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer();
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = kind === 'water' ? 'lowpass' : 'bandpass';
      filter.frequency.value = kind === 'water' ? 320 : 520;
      filter.Q.value = kind === 'water' ? 0.4 : 0.9;
      const lfo = ctx.createOscillator();
      const depth = ctx.createGain();
      lfo.frequency.value = kind === 'water' ? 0.09 : 0.06;
      depth.gain.value = kind === 'water' ? 90 : 260;
      lfo.connect(depth).connect(filter.frequency);
      src.connect(filter).connect(gain);
      src.start();
      lfo.start();
      nodes.push(src, lfo);
    }
    return {
      gain,
      stop(after) {
        gain.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
        setTimeout(() => {
          nodes.forEach((n) => n.stop());
          gain.disconnect();
        }, after);
      },
    };
  }

  function follow() {
    if (!ctx) return;
    const kind = beds[root.dataset.at ?? ''] ?? null;
    if (live && live.kind === kind) return;
    if (live) live.stop(2400);
    live = null;
    if (!kind) return;
    live = { kind, ...bed(kind) };
    live.gain.gain.setTargetAtTime(kind === 'fifth' ? 0.5 : 0.9, ctx.currentTime, 0.5);
  }

  // One short voice: a sine that rises or falls and dies away.
  function note(hz, to, len, level, type = 'sine', at = 0) {
    const t = ctx.currentTime + at;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(hz, t);
    if (to !== hz) osc.frequency.exponentialRampToValueAtTime(to, t + len);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(level, t + Math.min(0.02, len / 4));
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    osc.connect(g).connect(master);
    osc.start(t);
    osc.stop(t + len + 0.05);
  }

  function wash(len, from, to, level) {
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer();
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 0.8;
    filter.frequency.setValueAtTime(from, t);
    filter.frequency.exponentialRampToValueAtTime(to, t + len);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(level, t + len * 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    src.connect(filter).connect(g).connect(master);
    src.start(t);
    src.stop(t + len + 0.05);
  }

  const cues = {
    line: () => wash(0.7, 1400, 260, 1.4),
    tick: () => {
      const hz = 620 * Math.pow(2, Math.floor(Math.random() * 5) / 12); // one tick, five pitches
      note(hz, hz, 0.06, 0.5, 'triangle');
    },
    pass: () => note(58, 82, 1.8, 0.9),
    go: () => {
      note(392, 392, 0.14, 0.45);
      note(587.3, 587.3, 0.22, 0.45, 'sine', 0.09);
    },
    copy: () => {
      note(880, 880, 0.5, 0.35);
      note(1318.5, 1318.5, 0.7, 0.22, 'sine', 0.06);
    },
  };

  function play(cue) {
    if (ctx && ctx.state === 'running' && cues[cue]) cues[cue]();
  }

  const onHidden = () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend();
    else ctx.resume();
  };

  function start() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);
    }
    ctx.resume();
    master.gain.setTargetAtTime(MASTER, ctx.currentTime, 0.3);
    follow();
    if (!offs.length) {
      const mo = new MutationObserver((records) => {
        follow();
        if (records.some((r) => r.attributeName === 'data-split') && root.dataset.split) play('line');
      });
      mo.observe(root, { attributes: true, attributeFilter: ['data-at', 'data-split'] });
      document.addEventListener('visibilitychange', onHidden);
      offs = [() => mo.disconnect(), () => document.removeEventListener('visibilitychange', onHidden), on(EV.sound, ({ cue }) => play(cue))];
    }
    play('tick');
    return true;
  }

  function stop() {
    if (!ctx) return;
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
    if (live) live.stop(900);
    live = null;
    offs.forEach((off) => off());
    offs = [];
    setTimeout(() => {
      if (ctx.state === 'running' && master.gain.value < 0.001) ctx.suspend();
    }, 1200);
  }

  return { start, stop, play, state: () => (ctx ? ctx.state : 'none'), level: () => (master ? master.gain.value : 0), max: MASTER };
}
