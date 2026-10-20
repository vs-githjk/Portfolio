import { useCallback, useEffect, useRef, useState } from 'react';
import { hero } from '../data/content';
import { useReducedMotion } from '../hooks/useMediaQuery';
import Badge from './Badge';
import PaperTile from './PaperTile';
import { ChevronLeftIcon, ChevronRightIcon, PauseIcon, PlayIcon } from './Icons';

/* "What I've built": a deck of frosted-glass project cards, one on top and two
   peeking behind it. Each card is one link to its Builds entry (#build-<id>).

   Behavior (WAI-ARIA carousel, basic pattern):
   - autoplay, paused by hover, focus inside, a hidden tab, or the toggle;
   - the toggle is the first focusable control in the region (absent under
     prefers-reduced-motion, where nothing ever plays);
   - arrow keys keep focus inside the carousel: focus follows the new slide;
   - prev / next / progress buttons / arrow keys restart the dwell;
   - prefers-reduced-motion: no autoplay, instant swap, manual picker.
   Card positions live in data-pos ('0' | '1' | '2' | 'out' | 'hid') and are
   styled in CSS, so only transform and opacity ever animate. */

const { carousel } = hero;
const slides = carousel.slides;
const N = slides.length;
const MS = 5200; // keep in sync with --slide-ms in tokens.css

const pad = (n) => String(n).padStart(2, '0');
const fill = (tpl, vars) => tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k]);

function posOf(n, view) {
  const rel = (n - view.i + N) % N;
  if (rel === 0) return '0';
  if (rel === 1) return '1';
  if (rel === 2) return '2';
  return n === view.prev && rel === N - 1 ? 'out' : 'hid';
}

/* The award badge shows in the caption row on wide cards and over the corner
   of the screenshot on phones, so the card height never depends on it. Only
   one of the two is displayed at a time. */
function Caption({ slide, k }) {
  return (
    <span className="deck-cap">
      <b>{slide.title}</b>
      {slide.award && <Badge>{slide.award}</Badge>}
      <span className="deck-line">{slide.oneLiner}</span>
      <span className="deck-cta">{carousel.slideCta} →</span>
      <span className="deck-idx" aria-hidden="true">
        {pad(k + 1)} / {pad(N)}
      </span>
    </span>
  );
}

function Shot({ slide, k }) {
  return (
    <span className="deck-shot">
      {slide.image ? (
        <img
          src={slide.image.src}
          alt={slide.image.alt}
          width="1600"
          height="1000"
          loading={k === 0 ? 'eager' : 'lazy'}
          decoding="async"
        />
      ) : (
        <PaperTile className="deck-tile" />
      )}
      {slide.award && (
        <span className="deck-shot-badge">
          <Badge>{slide.award}</Badge>
        </span>
      )}
    </span>
  );
}

export default function Deck() {
  const reduced = useReducedMotion();
  const [view, setView] = useState({ i: 0, prev: -1 });
  const [userPaused, setUserPaused] = useState(reduced);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(false);
  // Bumped whenever the dwell restarts, so the progress fill restarts with it.
  const [cycle, setCycle] = useState(0);
  const links = useRef([]);
  const refocus = useRef(false);

  const paused = userPaused || hovered || focused || hidden || reduced;

  // An arrow key pressed on a slide moves focus to the new top slide, so a
  // keyboard user is never dropped onto <body> when the old one goes inert.
  useEffect(() => {
    if (refocus.current) {
      refocus.current = false;
      links.current[view.i]?.focus({ preventScroll: true });
    }
  }, [view.i]);

  const go = useCallback((k) => {
    setView((v) => ({ i: (k + N) % N, prev: v.i }));
    setCycle((c) => c + 1);
  }, []);

  // Dwell timer: restarts on every slide change and on every resume.
  useEffect(() => {
    if (paused) return undefined;
    const id = setTimeout(() => go(view.i + 1), MS);
    return () => clearTimeout(id);
  }, [paused, view.i, cycle, go]);

  useEffect(() => {
    const onVis = () => setHidden(document.hidden);
    onVis();
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  // A user who turns reduced motion on mid-session stops autoplay.
  useEffect(() => {
    if (reduced) setUserPaused(true);
  }, [reduced]);

  // The sizer is an invisible copy of the longest caption: it keeps the deck's
  // height without any JS measurement.
  const tallest = slides.reduce((a, b) => (b.oneLiner.length > a.oneLiner.length ? b : a));

  const toggle = () => {
    setUserPaused((p) => !p);
    setCycle((c) => c + 1);
  };

  const onKeyDown = (e) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    refocus.current = !!e.target.closest?.('.deck-link');
    go(view.i + step);
  };

  return (
    <section
      className="deck"
      aria-roledescription="carousel"
      aria-label={carousel.label}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false);
      }}
      onKeyDown={onKeyDown}
    >
      <div className="deck-head">
        <span className="eyebrow">{carousel.label}</span>
        <div className="deck-ctl">
          {!reduced && (
            <button
              type="button"
              aria-label={userPaused ? carousel.controls.play : carousel.controls.pause}
              aria-pressed={userPaused}
              onClick={toggle}
            >
              {userPaused ? <PlayIcon /> : <PauseIcon />}
            </button>
          )}
          <button type="button" aria-label={carousel.controls.prev} onClick={() => go(view.i - 1)}>
            <ChevronLeftIcon />
          </button>
          <button type="button" aria-label={carousel.controls.next} onClick={() => go(view.i + 1)}>
            <ChevronRightIcon />
          </button>
        </div>
      </div>

      <div className="deck-stage" aria-live={paused ? 'polite' : 'off'}>
        <div className="deck-card deck-sizer" aria-hidden="true">
          <span className="deck-link">
            <span className="deck-shot" />
            <span className="deck-cap">
              <b>{tallest.title}</b>
              <Badge>{tallest.award || tallest.title}</Badge>
              <span className="deck-line">{tallest.oneLiner}</span>
              <span className="deck-cta">{carousel.slideCta} →</span>
            </span>
          </span>
        </div>
        {slides.map((s, k) => {
          const pos = posOf(k, view);
          const on = pos === '0';
          return (
            <div
              key={s.id}
              className="deck-card"
              role="group"
              aria-roledescription="slide"
              aria-label={`${k + 1} of ${N}: ${s.title}`}
              data-pos={pos}
              aria-hidden={on ? 'false' : 'true'}
              inert={!on}
            >
              <a
                className="deck-link"
                href={`#build-${s.id}`}
                ref={(el) => {
                  links.current[k] = el;
                }}
              >
                <Shot slide={s} k={k} />
                <Caption slide={s} k={k} />
              </a>
            </div>
          );
        })}
      </div>

      <div className="deck-seg" role="group" aria-label={carousel.controls.choose}>
        {slides.map((s, k) => {
          const current = k === view.i;
          return (
            <button
              key={s.id}
              type="button"
              aria-label={fill(carousel.controls.goTo, { k: k + 1, n: N })}
              aria-current={current ? 'true' : undefined}
              onClick={() => go(k)}
            >
              {current && <span key={cycle} className="deck-fill" data-paused={paused ? '' : undefined} />}
            </button>
          );
        })}
      </div>
    </section>
  );
}
