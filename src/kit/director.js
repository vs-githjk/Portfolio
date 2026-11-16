/* One owner of requestAnimationFrame for the shell. A task is a function
   (now, frame) that returns true while it still wants frames; the loop runs only
   while some task does, wakes on scroll, resize and a tab coming back, and sleeps
   in a hidden tab. `frame` is read once and shared: the scroll offset, the window
   size and whether the page is still moving. Nothing here measures layout. */
const tasks = new Set();
const frame = { y: 0, w: 0, h: 0, dy: 0, moving: false, now: 0 };
let raf = 0;
let listening = false;
let lastY = -1;

function tick(now) {
  raf = 0;
  if (document.hidden) return;
  frame.now = now;
  frame.y = window.scrollY;
  frame.w = window.innerWidth;
  frame.h = window.innerHeight;
  frame.dy = lastY < 0 ? 0 : frame.y - lastY;
  frame.moving = frame.dy !== 0;
  lastY = frame.y;
  let more = false;
  for (const task of tasks) if (task(now, frame) === true) more = true;
  if (more) raf = requestAnimationFrame(tick);
}

export function kick() {
  if (!raf && tasks.size) raf = requestAnimationFrame(tick);
}

export function add(task) {
  tasks.add(task);
  if (!listening) {
    listening = true;
    window.addEventListener('scroll', kick, { passive: true });
    window.addEventListener('resize', kick, { passive: true });
    document.addEventListener('visibilitychange', kick);
  }
  kick();
  return () => tasks.delete(task);
}

export const current = () => frame;
