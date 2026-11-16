import { useSyncExternalStore } from 'react';
import { EV } from '../kit/contract';
import { emit } from '../kit/bus';

/* The shell's switches, one small store:

     receipts  label every living thing with its fact (EV.receipts, <html data-receipts>)
     sound     the synth, loaded the first time it is switched on (kit/sound.js)
     plain     the page alone, no canvases (<html data-plain>; Background.jsx obeys)
     chart     the Chart dialog is open

   The first three are remembered for the session. `?plain` in the address starts
   the page in plain view and `?receipts` with the labels on, without being
   remembered. Nothing here makes a sound or loads a chunk by itself. */
const KEY = 'shell-switches';
const state = { receipts: false, sound: false, plain: false, chart: false };
const subs = new Set();
let started = false;
let synth = null;
let soundOptions = {};

/* How the synth should sound on this site (its beds per realm); set before it is ever loaded. */
export function configureSound(options) {
  soundOptions = options;
}

function persist() {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify({ receipts: state.receipts, sound: state.sound, plain: state.plain }));
  } catch {
    /* private mode: the switches simply start off next time */
  }
}

function apply(name) {
  const root = document.documentElement;
  if (name === 'receipts') {
    if (state.receipts) root.dataset.receipts = '';
    else delete root.dataset.receipts;
    emit(EV.receipts, { on: state.receipts });
  } else if (name === 'plain') {
    if (state.plain) root.dataset.plain = '';
    else delete root.dataset.plain;
  } else if (name === 'sound') {
    if (state.sound && !synth) {
      import('../kit/sound').then((m) => {
        synth = m.createSound(soundOptions);
        if (state.sound) synth.start();
      });
    } else if (synth) {
      if (state.sound) synth.start();
      else synth.stop();
    }
  }
}

export function startSwitches() {
  if (started) return;
  started = true;
  const query = new URLSearchParams(window.location.search);
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(KEY) || '{}');
    state.receipts = saved.receipts === true;
    state.plain = saved.plain === true;
    // Sound never comes back by itself: a browser needs a gesture to start audio.
  } catch {
    /* nothing saved */
  }
  if (query.has('plain')) state.plain = true;
  if (query.has('receipts')) state.receipts = true;
  if (state.plain) apply('plain');
  if (state.receipts) apply('receipts');
  for (const fn of subs) fn();
}

export function setSwitch(name, value) {
  const next = value ?? !state[name];
  if (state[name] === next) return;
  state[name] = next;
  if (name !== 'chart') {
    apply(name);
    persist();
  }
  for (const fn of subs) fn();
}

export const getSwitch = (name) => state[name];

const subscribe = (fn) => {
  subs.add(fn);
  return () => subs.delete(fn);
};

export function useSwitch(name) {
  return useSyncExternalStore(
    subscribe,
    () => state[name],
    () => false
  );
}
