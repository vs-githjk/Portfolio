/* The welcome portrait: him, in a round window of light, drawn with plain WebGL
   (no library, so the chunk stays a few kilobytes).

   At rest the window shows the photograph itself (public/holo/face-1024.webp,
   or face-512.webp on a phone), crisp, on a mesh that has the points' depth, so
   it turns with his head; not one point is drawn. The points come from
   public/holo/face-a.bin and face-b.bin (scripts/bake-hologram.py): for each one
   a position, a real depth, a colour from the photograph, how solid it is and
   the spacing to its neighbours. They assemble him at the start and take the
   picture apart when it lets go; if the photograph cannot be loaded they are the
   picture, soft splats painted over one another. Nov 15 2026: every version of
   his face made of blue light was judged ghostly, by him and by the models asked
   cold; his own colouring in a lit, framed picture was not.

   Every point has three homes, and the vertex shader moves it between them:

     intro  0 to 1   he is assembled from his eyes outward: the points come
                     home and the photograph follows a beat behind them
     morph  0 to 1   the picture lets go of its light: each point leaves its
                     colour behind, becomes a point of the page's blue light
                     and gathers into a small planet, from the outside in
                     (the eyes last). The window closes into the planet.
     flow   0 to 1   the planet pours onto the orbit ring of builds below it:
                     each point lands on the edge of a card and frames it,
                     then the light fades and the cards are what is left

   A point is painted (it covers) while it is part of the picture and is light
   (it adds) once it has left: one blend mode, premultiplied, with the alpha it
   writes going from its coverage to nothing.

   The planet has no ring of its own (the one ringed planet on the page is the
   giant in the sea). It is lit from the upper left: a day side, a soft
   terminator, a bright limb, a small core. When it speaks it swells with the
   words and a ripple runs over it.

   Glow: on a desktop the planet and the light in flight are drawn a second
   time into a third-size buffer that is blurred and added back. The picture
   itself is never glowed. A phone skips that pass.

   Colours of the light are (r, g, b) triples read from the tokens by the caller. */

const VERT = /* glsl */ `
precision highp float;
attribute vec3 aFace;   // x, y in units of the picture's height (y up, the head's centre at 0), z toward the viewer
attribute vec3 aCol;    // its colour in the photograph
attribute vec4 aData;   // how solid it is, spacing to the neighbours (picture heights), two random numbers
attribute vec4 aBall;   // a direction on the unit sphere, and how far out along it (1 on the shell, less in the core)
attribute vec4 aMore;   // peel order (0 leaves first, 1 last), ring slot angle, place across the card, place down the card
uniform vec2 uRes;      // target size in device pixels
uniform vec2 uCenter;   // where the head's centre sits, device pixels from the top left
uniform float uSize;    // the picture's height in device pixels
uniform float uBall;    // the planet's radius in device pixels
uniform vec4 uRingA;    // ring centre x, y (device pixels), radius across, radius deep
uniform vec4 uRingB;    // sin and cos of the tilt, perspective, how far the ring has turned
uniform vec4 uRingC;    // card width and height, front lift, side shrink
uniform vec3 uRingD;    // degrees a side card turns and leans, how many cards the ring holds
uniform float uRingOn;  // 1 the orbit ring, 0 two level rows (a phone)
uniform vec2 uClear;    // how far the hero copy reaches left and right of the centre, device pixels
uniform vec4 uCopy;     // the hero copy's box in the window: left, top, right, bottom, device pixels
uniform float uCopyK;   // device pixels to a CSS pixel in this pass
uniform float uTime, uIntro, uMorph, uFlow, uTurn, uNod, uVoice, uSpeak, uStill;
uniform float uBallGap; // spacing of the points on the planet, in radii
uniform vec3 uDeep, uPale, uHot; // the colours of the light
uniform float uGain;    // its strength
uniform float uPass;    // 0 the picture, 1 the glow
uniform float uPicture; // 1 the photograph is there to show at rest, 0 the points must be the picture
uniform vec2 uEye;      // the middle of the eye line: where he starts to appear, and the last place to let go
varying vec3 vCol;    // what colour it is
varying float vAmp;   // how much of it there is
varying float vOver;  // 1 it is painted and covers, 0 it is light and adds
varying float vMask;  // 1 it belongs to the picture and stays inside the round window

const vec3 KEY = vec3(-0.545, 0.39, 0.742); // upper left, toward the viewer
const float SPREAD = 4.4; // a splat's width in spacings: wide enough that neighbours cover one another completely

vec3 turn(vec3 p, float a, float b) {
  float c = cos(a), s = sin(a);
  p = vec3(p.x * c + p.z * s, p.y, p.z * c - p.x * s);
  c = cos(b); s = sin(b);
  return vec3(p.x, p.y * c - p.z * s, p.z * c + p.y * s);
}

float ease(float x) { return x * x * (3.0 - 2.0 * x); }

void main() {
  float solid = aData.x, gap = aData.y, r1 = aData.z, r2 = aData.w;
  float t = uTime;
  float live = 1.0 - uStill;

  // ---- the portrait ----------------------------------------------------------
  vec3 f = aFace;
  // He breathes: the whole figure swells a quarter of a percent about the chest.
  f.xy = vec2(f.x, f.y + 0.45) * (1.0 + 0.0025 * sin(t * 1.25) * live) - vec2(0.0, 0.45);
  // The head turns on the neck: the whole head down to the chin turns as one,
  // the neck follows part of the way, the shoulders stay where they are. The
  // axis runs behind the face, where the spine is, not through it.
  float above = smoothstep(-0.37, -0.255, f.y);
  vec3 h = f + vec3(0.0, 0.0, 0.13);
  h = turn(h, uTurn * above, uNod * above);
  f = h - vec3(0.0, 0.0, 0.13);
  // Assembled from his eyes outward: the points nearest the middle of the eye
  // line come home first, the window's rim last. (Nearest-to-the-viewer first
  // was tried: for a third of a second it showed a face with holes for eyes.)
  // Until its turn a point waits a little outside and behind its place, unseen.
  float reach0 = min(1.0, length(vec2((aFace.x - uEye.x) / 0.3, (aFace.y - uEye.y) / 0.42)) / 2.3);
  float line = uIntro * 1.7 - 0.25;
  float drawn = 1.0 - smoothstep(line - 0.25, line, reach0 + r1 * 0.1);
  float home = ease(drawn);
  // The photograph itself follows a beat behind its points (the mesh shader uses
  // the same line), and where it has arrived the points step back: at rest the
  // window shows the picture, crisp, and not one point.
  float line2 = uIntro * 2.05 - 0.75;
  // The whole window (backdrop and shoulders too) is already there in soft focus
  // by then, so the points give way to it early: a face is never shown as a
  // cut-out head with a crumbling edge.
  float pictured = uPicture * max(ease(1.0 - smoothstep(line2 - 0.2, line2, reach0 + 0.05)), smoothstep(0.03, 0.26, uIntro));
  f = mix(vec3(f.xy * (1.12 + 0.2 * r2), f.z - 0.5 - 0.3 * r1), f, home);
  float faceSize = gap * uSize * SPREAD;
  // No light of our own on him: the photograph's is the flattering one. A point
  // is as solid as the matte says.
  float faceAmp = solid * home * home * 0.92 * (1.0 - pictured);

  // ---- the planet -------------------------------------------------------------
  float shell = step(0.99, aBall.w);
  vec3 s = aBall.xyz;
  float spin = t * 0.16 * live;
  s = vec3(s.x * cos(spin) + s.z * sin(spin), s.y, s.z * cos(spin) - s.x * sin(spin));
  float lat = s.y;
  // Folded light: three great circles of brighter points, wound round the ball at
  // different tilts and turning with it, so it reads as ribbons gathered into a
  // sphere, not as an even grain.
  float g1 = dot(s, vec3(0.0, 0.94, 0.342));
  float g2 = dot(s, vec3(0.61, 0.5, -0.614));
  float g3 = dot(s, vec3(-0.66, 0.37, 0.653));
  float bands = max(exp(-g1 * g1 * 110.0), max(exp(-g2 * g2 * 110.0), exp(-g3 * g3 * 110.0)));
  s = turn(s, 0.0, 0.32);
  s = vec3(s.x * 0.966 + s.y * 0.259, s.y * 0.966 - s.x * 0.259, s.z);
  // Speaking: it swells with the words and a ripple runs from pole to pole.
  float ripple = sin(lat * 7.0 - t * 6.5) * uSpeak;
  float rad = aBall.w * (1.0 + 0.045 * uSpeak * sin(t * 9.5) * shell + 0.028 * ripple * shell);
  // The core is a wide soft heart, not a bright dot (a dot in a disc is an eye).
  rad *= mix(2.6 * (1.0 + 0.1 * sin(t * 2.6 + r1 * 6.3) * live + 0.3 * uSpeak), 1.0, shell);
  vec3 b = s * rad;
  float day = clamp((dot(s, KEY) + 0.22) / 1.22, 0.0, 1.0);
  float limb = pow(1.0 - abs(s.z), 2.2);
  float weather = 0.86 + 0.14 * sin(lat * 9.0 + 0.8 + 1.3 * sin(lat * 23.0));
  float facing = smoothstep(-0.35, 0.25, s.z);
  float ballGlow = mix(0.02 + 0.03 * uSpeak, (0.03 + 0.42 * day * day * weather + 0.3 * limb * (0.25 + 0.75 * day) + 0.12 * ripple * day) * mix(0.06, 1.0, facing) * (0.5 + 1.25 * bands), shell);
  float ballHot = mix(0.03, 0.25 * limb * day + 0.12 * bands * day, shell);
  float ballSize = uBall * uBallGap * mix(3.6, 3.0, shell);
  float ballBloom = mix(0.1, (0.6 * limb + 0.15 + 0.2 * bands) * day, shell);

  // ---- between them: the peel ---------------------------------------------------
  float m = clamp(uMorph * 2.3 - aMore.x * 1.3, 0.0, 1.0);
  m = ease(m);
  vec3 p = mix(f * uSize, b * uBall, m);
  // On the way the points sweep round the centre, a slow vortex, not a jitter.
  float sweep = sin(m * 3.14159) * (0.7 + 0.5 * r1);
  p.xy = vec2(p.x * cos(sweep) - p.y * sin(sweep), p.x * sin(sweep) + p.y * cos(sweep));
  p.z += sin(m * 3.14159) * uSize * 0.08 * (r2 - 0.5);

  float depth = 1.0 / (1.0 - p.z / (uSize * 3.2));
  vec2 px = uCenter + vec2(p.x, -p.y) * depth;
  float size = mix(faceSize, ballSize, m) * depth;
  float glow = ballGlow;
  float hot = ballHot;
  float bloom = ballBloom;

  // ---- the hand-off: the planet pours onto the ring of builds -------------------
  float fl = ease(clamp(uFlow * 1.35 - 0.35 * r2, 0.0, 1.0));
  // Every point lands on one of the five cards at the front of the ring. The
  // cards at the back sit behind his name (Orbit.jsx hides them there): light
  // sent to them flew straight over the name and landed on it. So the point's
  // slot is folded onto the front five, wherever the ring has turned to.
  float step12 = 6.28318 / uRingD.z;
  float frontmost = mod(uRingB.w + 0.5 * step12, step12) - 0.5 * step12;
  float w = uRingOn > 0.5 ? frontmost + (mod(floor(aMore.y / step12 + 0.5), 5.0) - 2.0) * step12 : aMore.y;
  float sw = sin(w), cw = cos(w);
  float across = aMore.z, down = fract(aMore.w) - 0.5;
  vec2 land;
  float plate;
  float plateSize;
  if (uRingOn > 0.5) {
    float lead = pow(max(0.0, (cw - 0.7) / 0.3), 2.0);
    vec3 rp = vec3(uRingA.z * sw, uRingA.w * cw * uRingB.x, uRingA.w * uRingB.y * (cw - 1.0) + uRingC.z * lead);
    float shrink = 1.0 - uRingC.w * sw * sw;
    // The cards are solid and stand in front of this canvas, so light that
    // landed on a card would be hidden by it. It lands round the card instead:
    // on the edge of the thumbnail (the top of the card, five eighths as tall
    // as it is wide) and a little outside it, so each build is framed in light.
    vec2 box = vec2(0.5 * uRingC.x, 0.3125 * uRingC.x);
    float along = (across + 0.5) * 4.0 * (box.x + box.y);
    vec2 edge = along < 2.0 * box.x ? vec2(along - box.x, -box.y)
      : along < 2.0 * box.x + 2.0 * box.y ? vec2(box.x, along - 2.0 * box.x - box.y)
      : along < 4.0 * box.x + 2.0 * box.y ? vec2(3.0 * box.x + 2.0 * box.y - along, box.y)
      : vec2(-box.x, 4.0 * box.x + 3.0 * box.y - along);
    // The frame spreads a little way outward at the sides and below, never
    // above: the front card's top edge sits against the buttons under his name.
    float grow = 1.0 + 0.09 * (down + 0.5);
    edge = vec2(edge.x * grow, edge.y > 0.0 ? edge.y * grow : edge.y);
    vec2 on = (edge + vec2(0.0, -0.5 * uRingC.y + box.y)) * shrink;
    // The card's own turn, as Orbit.jsx poses it: it leans, then turns toward
    // the centre, so its outer edge swings nearer the camera. With these two
    // the corners land within a pixel of the real card (measured at 1600, 1440
    // and 1199); without them the side cards were up to 17 pixels out.
    float lean = radians(uRingD.y * sw), yaw = radians(-uRingD.x * sw);
    on = vec2(on.x * cos(lean) - on.y * sin(lean), on.x * sin(lean) + on.y * cos(lean));
    float ps = uRingB.z / (uRingB.z - rp.z + on.x * sin(yaw));
    land = uRingA.xy + (rp.xy + vec2(on.x * cos(yaw), on.y)) * ps;
    // Cards at the back of the ring are dark and small: so is their light.
    plate = mix(0.42, 0.6, smoothstep(0.4, 1.0, cw));
    plateSize = uRingC.x * 0.03 * ps * shrink;
  } else {
    // A phone: two level rows, where the thumbnails drift.
    float row = step(3.14159, mod(aMore.y, 6.28318)) - 0.5;
    land = uRingA.xy + vec2(across * uRingA.z * 2.3, row * uRingA.w * 0.52 + down * uRingA.w * 0.34);
    plate = 0.4;
    plateSize = uRingA.w * 0.03;
  }
  // On a phone the copy fills the window, so nothing may cross it: the light
  // goes out at the planet and comes up again on the rows.
  float hidden = (1.0 - uRingOn) * smoothstep(0.0, 0.22, fl) * (1.0 - smoothstep(0.78, 1.0, fl));
  // The core does not travel: it flares and is gone.
  float goes = shell;
  // The light must never cross his name. It goes up and out sideways from the
  // planet to the edge of the window, falls there, outside the copy, and comes
  // in underneath to its card: a cubic through those two corners. The name is
  // rising toward the planet all the while, so the pour is quick (every point
  // is past the corner before the name's top gets there) and the planet lifts
  // out of its way (Hologram.jsx).
  float reach = land.x - uCenter.x;
  float dirn = abs(reach) > uRes.x * 0.04 ? sign(reach) : sign(across);
  // How far out is far enough: the cubic's widest point is three quarters of
  // the way to its corners, and that must clear the copy on this side (the
  // copy reaches farther right of the centre than left) with room to spare.
  float clear = dirn < 0.0 ? uClear.x : uClear.y;
  float sideX = uCenter.x + dirn * max(abs(reach) * 1.2, (clear + 0.05 * uRes.x) / 0.75 + 0.04 * uRes.x * r1);
  vec2 c1 = vec2(sideX, px.y - 0.1 * uRes.y);
  // The second corner is well below the card: the light dips under it and wells
  // up into it, so the last leg does not cut across the lines under his name.
  vec2 c2 = vec2(sideX, land.y + 0.25 * uRes.y);
  float g = fl * goes;
  float gi = 1.0 - g;
  px = gi * gi * gi * px + 3.0 * gi * gi * g * c1 + 3.0 * gi * g * g * c2 + g * g * g * land;
  size = mix(size, plateSize, fl * goes);
  // In the air a point is a thin thread, not a cloud: it dims and shrinks on the
  // way (the mid-flight frame read as a lumpy dome when it burned bright), so
  // what the eye follows is the engraved ring opening, and the light is found
  // again where it lands.
  float air = sin(fl * 3.14159);
  glow = mix(glow, plate, fl) * goes + glow * (1.0 - goes) * (1.0 - smoothstep(0.0, 0.5, uFlow));
  glow *= 1.0 - 0.62 * air * goes;
  size *= 1.0 - 0.45 * air * goes;
  glow *= 1.0 - hidden * goes;
  hot = mix(hot, 0.1, fl) + air * 0.12;
  bloom = mix(bloom, 0.5, fl);

  gl_Position = vec4(px.x / uRes.x * 2.0 - 1.0, 1.0 - px.y / uRes.y * 2.0, 0.0, 1.0);

  gl_PointSize = max(1.0, size * mix(1.0, 2.4, uPass));
  // A guarantee, not a tuned path: while the light is pouring, a point whose
  // splat would touch the hero copy (his name and the lines and buttons under
  // it, where they really are in the window this frame) gives no light at all.
  // The glow pass keeps a wider berth, because its blur spreads.
  vec2 away = max(uCopy.xy - px, px - uCopy.zw);
  float berth = max(away.x, away.y) - 0.5 * gl_PointSize - mix(2.0, 30.0, uPass) * uCopyK;
  float clearOf = mix(1.0, smoothstep(0.0, 8.0 * uCopyK, berth), step(0.001, uFlow) * step(uCopy.x + 1.0, uCopy.z));
  // A small splat deposits its fair share of light on average, whatever its
  // size (checked by simulation down to one pixel). Only one that would be
  // narrower than a pixel is drawn a pixel wide, so it gives up the difference.
  float share = min(1.0, size * size);
  // Picture or light: m is how far this point has left the picture. As paint it
  // has its own colour and covers; as light it has the page's blue and adds.
  vec3 light = mix(uDeep, uPale, clamp(glow * 0.9, 0.0, 1.0));
  light = mix(light, uHot, clamp(hot, 0.0, 1.0));
  vCol = mix(aCol, light, m);
  float lightAmp = glow * uGain * 0.75 * mix(1.0, bloom, uPass);
  // Leaving: a point shows itself the moment it starts to move, exactly where
  // the photograph (which fades there in step, see the mesh shader) showed its
  // colour, so the picture is never swapped for the points: it is taken apart.
  float paint = max(faceAmp, solid * 0.92 * smoothstep(0.0, 0.015, m));
  vAmp = mix(paint * (1.0 - uPass), lightAmp, m) * share * clearOf;
  vOver = (1.0 - m) * (1.0 - uPass);
  vMask = 1.0 - m;
}
`;

const FRAG = /* glsl */ `
precision mediump float;
uniform vec3 uDisc;   // the round window: centre x, y (device pixels, y from the bottom), radius
varying vec3 vCol;
varying float vAmp;
varying float vOver;
varying float vMask;
void main() {
  vec2 d = gl_PointCoord - 0.5;
  // A Gaussian splat: neighbours overlap into one even surface.
  float a = exp(-dot(d, d) * 18.0) * vAmp;
  // The picture ends at the window's edge, to the pixel; light that has left it does not.
  float inside = 1.0 - smoothstep(uDisc.z - 0.75, uDisc.z + 0.75, distance(gl_FragCoord.xy, uDisc.xy));
  a *= mix(1.0, inside, vMask);
  // Premultiplied: paint writes its coverage as alpha, light writes none.
  gl_FragColor = vec4(vCol * a, a * vOver);
}
`;

/* The photograph, crisp, on a mesh that has the same depth as the points, so
   it turns with the head exactly as they do and they can take over from it
   anywhere. It arrives a beat behind its points (nearest first) and is taken
   apart from the outside in as they leave (the centre of his face last). */
const MESH_VERT = /* glsl */ `
precision highp float;
attribute vec3 aGrid;   // x, y in picture heights (y up, the head's centre at 0), z toward the viewer
uniform vec2 uRes, uCenter;
uniform float uSize, uTime, uIntro, uTurn, uNod, uStill;
uniform vec3 uSquare;   // the picture's square among the points: left x, top y, side
uniform mediump vec2 uEye; // the middle of the eye line (the fragment shader reads it too, at its precision)
varying vec2 vUv;
varying vec2 vAt;
varying float vIn;
varying float vBase;

vec3 turn(vec3 p, float a, float b) {
  float c = cos(a), s = sin(a);
  p = vec3(p.x * c + p.z * s, p.y, p.z * c - p.x * s);
  c = cos(b); s = sin(b);
  return vec3(p.x, p.y * c - p.z * s, p.z * c + p.y * s);
}

void main() {
  // The same breath and the same turn of the head as the points (holoScene VERT).
  vec3 f = aGrid;
  f.xy = vec2(f.x, f.y + 0.45) * (1.0 + 0.0025 * sin(uTime * 1.25) * (1.0 - uStill)) - vec2(0.0, 0.45);
  float above = smoothstep(-0.37, -0.255, f.y);
  vec3 h = f + vec3(0.0, 0.0, 0.13);
  h = turn(h, uTurn * above, uNod * above);
  f = h - vec3(0.0, 0.0, 0.13);
  float reach0 = min(1.0, length(vec2((aGrid.x - uEye.x) / 0.3, (aGrid.y - uEye.y) / 0.42)) / 2.3);
  float line2 = uIntro * 2.05 - 0.75;
  float drawn = 1.0 - smoothstep(line2 - 0.2, line2, reach0 + 0.05);
  vIn = drawn * drawn * (3.0 - 2.0 * drawn);
  // The window itself fades up whole and first; vIn is then how far each place
  // has come into focus (his eyes first, the rim last).
  vBase = smoothstep(0.03, 0.3, uIntro);
  float depth = 1.0 / (1.0 - f.z / 3.2);
  vec2 px = uCenter + vec2(f.x, -f.y) * uSize * depth;
  gl_Position = vec4(px.x / uRes.x * 2.0 - 1.0, 1.0 - px.y / uRes.y * 2.0, 0.0, 1.0);
  vUv = vec2((aGrid.x - uSquare.x) / uSquare.z, (uSquare.y - aGrid.y) / uSquare.z);
  vAt = aGrid.xy;
}
`;
const MESH_FRAG = /* glsl */ `
precision mediump float;
uniform sampler2D uTex;
uniform vec3 uDisc;     // the round window: centre x, y (device pixels, y from the bottom), radius
uniform vec2 uEye;      // the middle of the eye line: the last place to let go
uniform vec3 uRim;
uniform float uMorph, uShow, uRimA;
varying vec2 vUv;
varying vec2 vAt;
varying float vIn;
varying float vBase;
void main() {
  // The order the points leave in (parseFace): the farther from his eyes, the
  // sooner. A point of order o starts to move when uMorph * 2.3 passes o * 1.3;
  // the photograph is gone from a place just as its points take off from it.
  float far = min(1.0, length(vec2((vAt.x - uEye.x) / 0.3, (vAt.y - uEye.y) / 0.42)));
  float order = (1.0 - far) * 0.8 + 0.03;
  float front = uMorph * 1.769;
  float stays = smoothstep(front - 0.06, front, order);
  float d = distance(gl_FragCoord.xy, uDisc.xy);
  float inside = 1.0 - smoothstep(uDisc.z - 0.75, uDisc.z + 0.75, d);
  float a = vBase * stays * inside * uShow;
  // Soft focus until a place has come in: twelve taps on two small circles, none at rest.
  vec3 col = texture2D(uTex, vUv).rgb;
  // (No branch around the taps: a texture read inside one loses its derivatives
  // along the branch's edge and leaves a dotted ring where focus arrives.)
  float soft = (1.0 - vIn) * 0.013;
  vec3 sum = col * 2.0;
  for (int i = 0; i < 12; i++) {
    float ang = float(i) * 0.5236;
    float rad = soft * (mod(float(i), 2.0) < 0.5 ? 1.0 : 0.5);
    sum += texture2D(uTex, vUv + vec2(cos(ang), sin(ang)) * rad).rgb;
  }
  col = sum / 14.0;
  // One quiet hairline at the window's rim, no glow.
  float line = exp(-pow((d - uDisc.z) / 1.0, 2.0)) * 0.42 * uRimA;
  gl_FragColor = vec4(col * a + uRim * line, a);
}
`;

/* The glow: a full-target triangle pair, a nine-tap blur and a plain copy. */
const QUAD_VERT = /* glsl */ `
attribute vec2 aPos;
varying vec2 vUv;
void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }
`;
const BLUR_FRAG = /* glsl */ `
precision mediump float;
uniform sampler2D uTex;
uniform vec2 uStep;
uniform float uGain;
varying vec2 vUv;
void main() {
  vec4 c = texture2D(uTex, vUv) * 0.227;
  c += (texture2D(uTex, vUv + uStep * 1.385) + texture2D(uTex, vUv - uStep * 1.385)) * 0.316;
  c += (texture2D(uTex, vUv + uStep * 3.231) + texture2D(uTex, vUv - uStep * 3.231)) * 0.07;
  gl_FragColor = c * uGain;
}
`;

const TAU = Math.PI * 2;
const STRIDE = 8; // bytes a point
const HEADER = 28;
const Z_RANGE = 0.3; // picture heights covered by 127 depth steps (bake-hologram.py)
const RELIEF = 1; // how much of the baked depth is used
// The head's centre is the pivot: 0.51 across and 0.327 down the picture.
const PIVOT = [0.51, 0.327];

/* Read the baked files into typed arrays. `buffers` is the base tier and,
   on a desktop, the fill-in after it. `slots` is how many cards the orbit ring
   holds: each point is given one to land on. */
export function parseFace(buffers, slots = 12) {
  const heads = buffers.map((buffer) => {
    const view = new DataView(buffer);
    const magic = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
    if (magic !== 'HOL3') throw new Error('hologram: not a face file');
    const count = view.getUint32(4, true);
    if (buffer.byteLength < HEADER + count * STRIDE) throw new Error('hologram: face file is cut short');
    return { view, count };
  });
  const n = heads.reduce((sum, h) => sum + h.count, 0);
  const first = heads[0].view;
  const aspect = first.getUint16(8, true) / 1000;
  const eye = [(first.getUint16(10, true) / 65535 - PIVOT[0]) * aspect, PIVOT[1] - first.getUint16(12, true) / 65535];
  // The round window, in the same units as the points: where its centre sits
  // from the head's centre (x right, y up) and its radius. And the wall's colour.
  const disc = {
    x: ((first.getUint16(14, true) * 2) / 65535 - PIVOT[0]) * aspect,
    y: PIVOT[1] - (first.getUint16(16, true) * 2) / 65535,
    r: (first.getUint16(18, true) * 2) / 65535,
  };
  const wall = [first.getUint8(20) / 255, first.getUint8(21) / 255, first.getUint8(22) / 255];

  const face = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  const data = new Float32Array(n * 4);
  const ball = new Float32Array(n * 4);
  const more = new Float32Array(n * 4);
  // A tiny seeded generator: the same cloud on every load.
  let s = 20261115;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  let i = 0;
  let shell = 0;
  // The base tier's spacings were measured on its own. With the fill-in between
  // them its points stand closer: the fill-in file carries those spacings at its end.
  const fill = heads[1];
  const closer = fill && fill.view.byteLength >= HEADER + fill.count * STRIDE + heads[0].count ? HEADER + fill.count * STRIDE : -1;
  // Painted points cover what was drawn before them, so the order matters: the
  // backdrop goes down first (both tiers), then him. Otherwise a wide backdrop
  // point lands on the fine points of an ear and the edge crumbles.
  for (const him of [0, 1]) {
    for (const [tier, { view, count }] of heads.entries()) {
      for (let k = 0, o = HEADER; k < count; k += 1, o += STRIDE) {
        const flags = view.getUint8(o + 6);
        if ((flags & 1) !== him) continue;
        const xy = (view.getUint8(o) << 16) | (view.getUint8(o + 1) << 8) | view.getUint8(o + 2);
        const x = ((xy >>> 12) / 4095 - PIVOT[0]) * aspect;
        const y = PIVOT[1] - (xy & 4095) / 4095;
        const c565 = view.getUint16(o + 4, true);
        face[i * 3] = x;
        face[i * 3 + 1] = y;
        face[i * 3 + 2] = ((view.getUint8(o + 3) - 128) / 127) * Z_RANGE * RELIEF;
        col[i * 3] = (c565 >> 11) / 31;
        col[i * 3 + 1] = ((c565 >> 5) & 63) / 63;
        col[i * 3 + 2] = (c565 & 31) / 31;
        data[i * 4] = (flags >> 1) / 127;
        data[i * 4 + 1] = (tier === 0 && closer >= 0 ? fill.view.getUint8(closer + k) : view.getUint8(o + 7)) / 3 / 1200;
        data[i * 4 + 2] = rnd();
        data[i * 4 + 3] = rnd();
        // The planet: most points on its shell, one in twelve in the core.
        const up = rnd() * 2 - 1;
        const round = rnd() * TAU;
        const q = Math.sqrt(1 - up * up);
        const core = rnd() < 0.08;
        if (!core) shell += 1;
        ball[i * 4] = q * Math.cos(round);
        ball[i * 4 + 1] = up;
        ball[i * 4 + 2] = q * Math.sin(round);
        ball[i * 4 + 3] = core ? 0.03 + 0.13 * Math.cbrt(rnd()) : 1;
        // The peel: the farther from the middle of the eye line, the sooner a point
        // leaves. (No special case for the eyes: with the photograph under them, two
        // crisp eyes left hanging on their own would be exactly the wrong picture.)
        const far = Math.min(1, Math.hypot((x - eye[0]) / 0.3, (y - eye[1]) / 0.42));
        more[i * 4] = (1 - far) * 0.8 + 0.06 * rnd();
        // Its card on the ring, and its place on that card's thumbnail.
        more[i * 4 + 1] = (Math.floor(rnd() * slots) / slots) * TAU;
        more[i * 4 + 2] = rnd() - 0.5;
        more[i * 4 + 3] = 0.02 + 0.96 * rnd();
        i += 1;
      }
    }
  }
  // The mesh the photograph is drawn on: a grid over the window's square, with
  // the points' own depth (averaged onto its nodes, gaps filled, smoothed), so the
  // picture and the points turn as one.
  // The mesh reaches a little past the window all round: the backdrop stands
  // behind the picture plane, so seen in perspective its edge falls inside the
  // window's rim, and a mesh no wider than the window showed flat cuts there.
  // (Past the photograph's own edge the texture repeats its last pixels: backdrop.)
  const G = 96;
  const REACH = 1.14;
  const left = disc.x - disc.r * REACH;
  const top = disc.y + disc.r * REACH;
  const side = disc.r * 2 * REACH;
  const nodes = (G + 1) * (G + 1);
  const sum = new Float32Array(nodes);
  const hits = new Float32Array(nodes);
  for (let k = 0; k < n; k += 1) {
    const gx = Math.round(((face[k * 3] - left) / side) * G);
    const gy = Math.round(((top - face[k * 3 + 1]) / side) * G);
    if (gx < 0 || gy < 0 || gx > G || gy > G) continue;
    sum[gy * (G + 1) + gx] += face[k * 3 + 2];
    hits[gy * (G + 1) + gx] += 1;
  }
  let depth = new Float32Array(nodes);
  for (let k = 0; k < nodes; k += 1) depth[k] = hits[k] ? sum[k] / hits[k] : NaN;
  const around = (src, gx, gy, skipNaN) => {
    let total = 0;
    let count = 0;
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        const x = gx + dx;
        const y = gy + dy;
        if (x < 0 || y < 0 || x > G || y > G) continue;
        const v = src[y * (G + 1) + x];
        if (skipNaN && Number.isNaN(v)) continue;
        total += v;
        count += 1;
      }
    }
    return count ? total / count : NaN;
  };
  for (let pass = 0; pass < 12; pass += 1) {
    const next = depth.slice();
    let holes = 0;
    for (let gy = 0; gy <= G; gy += 1) {
      for (let gx = 0; gx <= G; gx += 1) {
        const at = gy * (G + 1) + gx;
        if (!Number.isNaN(depth[at])) continue;
        next[at] = around(depth, gx, gy, true);
        if (Number.isNaN(next[at])) holes += 1;
      }
    }
    depth = next;
    if (!holes) break;
  }
  for (let pass = 0; pass < 2; pass += 1) {
    const next = depth.slice();
    for (let gy = 0; gy <= G; gy += 1) {
      for (let gx = 0; gx <= G; gx += 1) {
        const at = gy * (G + 1) + gx;
        next[at] = Number.isNaN(depth[at]) ? -0.13 : around(depth, gx, gy, true);
      }
    }
    depth = next;
  }
  const grid = new Float32Array(nodes * 3);
  for (let gy = 0; gy <= G; gy += 1) {
    for (let gx = 0; gx <= G; gx += 1) {
      const at = gy * (G + 1) + gx;
      grid[at * 3] = left + (gx / G) * side;
      grid[at * 3 + 1] = top - (gy / G) * side;
      grid[at * 3 + 2] = depth[at];
    }
  }
  const cells = new Uint16Array(G * G * 6);
  for (let gy = 0, o = 0; gy < G; gy += 1) {
    for (let gx = 0; gx < G; gx += 1, o += 6) {
      const a = gy * (G + 1) + gx;
      cells.set([a, a + 1, a + G + 1, a + G + 1, a + 1, a + G + 2], o);
    }
  }
  return { n, base: heads[0].count, face, col, data, ball, more, disc, wall, eye, grid, cells, square: [disc.x - disc.r, disc.y + disc.r, disc.r * 2], ballGap: Math.sqrt((4 * Math.PI) / Math.max(1, shell)) };
}

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || 'hologram: shader');
  return shader;
}

function link(gl, vert, frag) {
  const program = gl.createProgram();
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, vert));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, frag));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || 'hologram: link');
  return program;
}

/* Build the scene on a canvas. Throws if WebGL is not there. `colors` holds
   three [r, g, b] arrays in 0 to 1: deep, pale and hot. `bloom` is the strength
   of the glow (0 turns the second pass off). */
export function createHologram(canvas, cloud, colors, bloom = 1) {
  const gl = canvas.getContext('webgl', { alpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
  if (!gl) throw new Error('hologram: no WebGL');

  const program = link(gl, VERT, FRAG);
  const blur = link(gl, QUAD_VERT, BLUR_FRAG);
  const mesh = link(gl, MESH_VERT, MESH_FRAG);
  const buffers = [];
  const attrs = [];
  const attribute = (name, array, size) => {
    const buffer = gl.createBuffer();
    buffers.push(buffer);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);
    attrs.push({ at: gl.getAttribLocation(program, name), buffer, size });
  };
  attribute('aFace', cloud.face, 3);
  attribute('aCol', cloud.col, 3);
  attribute('aData', cloud.data, 4);
  attribute('aBall', cloud.ball, 4);
  attribute('aMore', cloud.more, 4);
  const quad = gl.createBuffer();
  buffers.push(quad);
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  const quadAt = gl.getAttribLocation(blur, 'aPos');

  const u = {};
  for (const name of ['uRes', 'uCenter', 'uSize', 'uBall', 'uRingA', 'uRingB', 'uRingC', 'uRingD', 'uRingOn', 'uClear', 'uCopy', 'uCopyK', 'uTime', 'uIntro', 'uMorph', 'uFlow', 'uTurn', 'uNod', 'uVoice', 'uSpeak', 'uStill', 'uBallGap', 'uDisc', 'uPass', 'uPicture', 'uEye', 'uDeep', 'uPale', 'uHot', 'uGain']) {
    u[name] = gl.getUniformLocation(program, name);
  }
  const ub = { uTex: gl.getUniformLocation(blur, 'uTex'), uStep: gl.getUniformLocation(blur, 'uStep'), uGain: gl.getUniformLocation(blur, 'uGain') };
  // The photograph's mesh: its grid, its triangles and (once it has loaded) its texture.
  const um = {};
  for (const name of ['uRes', 'uCenter', 'uSize', 'uTime', 'uIntro', 'uTurn', 'uNod', 'uStill', 'uSquare', 'uTex', 'uDisc', 'uEye', 'uRim', 'uMorph', 'uShow', 'uRimA']) {
    um[name] = gl.getUniformLocation(mesh, name);
  }
  const gridAt = gl.getAttribLocation(mesh, 'aGrid');
  const gridBuffer = gl.createBuffer();
  buffers.push(gridBuffer);
  gl.bindBuffer(gl.ARRAY_BUFFER, gridBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cloud.grid, gl.STATIC_DRAW);
  const cellBuffer = gl.createBuffer();
  buffers.push(cellBuffer);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cellBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cloud.cells, gl.STATIC_DRAW);
  gl.useProgram(mesh);
  gl.uniform3fv(um.uSquare, cloud.square);
  gl.uniform2fv(um.uEye, cloud.eye);
  gl.uniform3fv(um.uRim, colors.pale);
  let picture = null; // the photograph's texture, when there is one

  /* Give the scene the photograph (an image whose sides are a power of two, so it
     can be mipmapped and stays clean when drawn smaller than it is). */
  function setPicture(image) {
    picture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, picture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }
  gl.useProgram(program);
  gl.uniform3fv(u.uDeep, colors.deep);
  gl.uniform3fv(u.uPale, colors.pale);
  gl.uniform3fv(u.uHot, colors.hot);
  gl.uniform1f(u.uBallGap, cloud.ballGap);
  gl.uniform2fv(u.uEye, cloud.eye);

  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  // Premultiplied: a painted point covers by the alpha it writes, a point of light writes none and adds.
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  // Two third-size targets for the glow: the points go into one, the blur
  // ping-pongs between them.
  const SHRINK = 3;
  const targets = [0, 1].map(() => ({ fbo: gl.createFramebuffer(), tex: gl.createTexture(), w: 1, h: 1 }));
  function sizeTargets() {
    for (const tg of targets) {
      tg.w = Math.max(2, Math.round(canvas.width / SHRINK));
      tg.h = Math.max(2, Math.round(canvas.height / SHRINK));
      gl.bindTexture(gl.TEXTURE_2D, tg.tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, tg.w, tg.h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindFramebuffer(gl.FRAMEBUFFER, tg.fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tg.tex, 0);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  let dpr = 1;
  function resize(width, height, ratio) {
    dpr = ratio;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    if (bloom > 0) sizeTargets();
  }

  function points(s, scale, pass) {
    const k = dpr * scale;
    const r = s.ring;
    gl.useProgram(program);
    for (const a of attrs) {
      gl.bindBuffer(gl.ARRAY_BUFFER, a.buffer);
      gl.enableVertexAttribArray(a.at);
      gl.vertexAttribPointer(a.at, a.size, gl.FLOAT, false, 0, 0);
    }
    gl.uniform2f(u.uRes, canvas.width * scale, canvas.height * scale);
    gl.uniform2f(u.uCenter, s.cx * k, s.cy * k);
    gl.uniform1f(u.uSize, s.size * k);
    gl.uniform1f(u.uBall, s.ball * k);
    gl.uniform4f(u.uRingA, r.x * k, r.y * k, r.rx * k, r.rz * k);
    gl.uniform4f(u.uRingB, r.sinT, r.cosT, r.persp * k, r.theta);
    gl.uniform4f(u.uRingC, r.cardW * k, r.cardH * k, r.front * k, r.side);
    gl.uniform3f(u.uRingD, r.yaw || 0, r.lean || 0, r.n || 12);
    gl.uniform2f(u.uClear, (r.clearL || 0) * k, (r.clearR || 0) * k);
    gl.uniform4f(u.uCopy, (r.copyL || 0) * k, (r.copyT || 0) * k, (r.copyR || 0) * k, (r.copyB || 0) * k);
    gl.uniform1f(u.uCopyK, k);
    gl.uniform1f(u.uRingOn, r.on ? 1 : 0);
    gl.uniform1f(u.uPass, pass);
    gl.uniform1f(u.uPicture, picture ? 1 : 0);
    gl.uniform3f(u.uDisc, s.disc.x * k, canvas.height * scale - s.disc.y * k, s.disc.r * k);
    gl.uniform1f(u.uTime, s.time);
    gl.uniform1f(u.uIntro, s.intro);
    gl.uniform1f(u.uMorph, s.morph);
    gl.uniform1f(u.uFlow, s.flow);
    gl.uniform1f(u.uTurn, s.turn);
    gl.uniform1f(u.uNod, s.nod);
    gl.uniform1f(u.uVoice, s.voice);
    gl.uniform1f(u.uSpeak, s.speak ?? 0);
    gl.uniform1f(u.uStill, s.still ? 1 : 0);
    gl.uniform1f(u.uGain, s.gain);
    gl.drawArrays(gl.POINTS, 0, cloud.n);
  }

  function pass(from, to, sx, sy, gain) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, to ? to.fbo : null);
    gl.viewport(0, 0, to ? to.w : canvas.width, to ? to.h : canvas.height);
    if (to) {
      gl.disable(gl.BLEND);
    } else {
      gl.enable(gl.BLEND);
    }
    gl.useProgram(blur);
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.enableVertexAttribArray(quadAt);
    gl.vertexAttribPointer(quadAt, 2, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, from.tex);
    gl.uniform1i(ub.uTex, 0);
    gl.uniform2f(ub.uStep, sx / from.w, sy / from.h);
    gl.uniform1f(ub.uGain, gain);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.enable(gl.BLEND);
  }

  /* The photograph, under the points. */
  function photograph(s) {
    gl.useProgram(mesh);
    gl.bindBuffer(gl.ARRAY_BUFFER, gridBuffer);
    gl.enableVertexAttribArray(gridAt);
    gl.vertexAttribPointer(gridAt, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cellBuffer);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, picture);
    gl.uniform1i(um.uTex, 0);
    gl.uniform2f(um.uRes, canvas.width, canvas.height);
    gl.uniform2f(um.uCenter, s.cx * dpr, s.cy * dpr);
    gl.uniform1f(um.uSize, s.size * dpr);
    gl.uniform1f(um.uTime, s.time);
    gl.uniform1f(um.uIntro, s.intro);
    gl.uniform1f(um.uTurn, s.turn);
    gl.uniform1f(um.uNod, s.nod);
    gl.uniform1f(um.uStill, s.still ? 1 : 0);
    gl.uniform1f(um.uMorph, s.morph);
    gl.uniform1f(um.uShow, 1);
    gl.uniform1f(um.uRimA, s.rim);
    gl.uniform3f(um.uDisc, s.disc.x * dpr, canvas.height - s.disc.y * dpr, s.disc.r * dpr);
    gl.drawElements(gl.TRIANGLES, cloud.cells.length, gl.UNSIGNED_SHORT, 0);
  }

  /* One frame. Lengths are CSS pixels; `s` is the state:
     { time, intro, morph, flow, turn, nod, voice, speak, still, gain, glow, cx, cy, size, ball,
       disc: { x, y, r } the round window the picture is cut to, rim: how strong its hairline is,
       ring: { on, x, y, rx, rz, sinT, cosT, persp, theta, cardW, cardH, front, side, yaw, lean, n, clearL, clearR, copyL, copyT, copyR, copyB } } */
  function render(s) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (s.gain <= 0.002) return;
    // The photograph first: whole at rest, and what is left of it while he is being
    // assembled or taken apart. Past half way through the peel there is none left.
    if (picture && s.morph < 0.6) photograph(s);
    // Only light glows, and there is none until the picture starts to let go.
    if (bloom > 0 && s.morph > 0.001) {
      const [a, b] = targets;
      gl.bindFramebuffer(gl.FRAMEBUFFER, a.fbo);
      gl.viewport(0, 0, a.w, a.h);
      gl.clear(gl.COLOR_BUFFER_BIT);
      points(s, 1 / SHRINK, 1);
      pass(a, b, 1.2, 0, 1);
      pass(b, a, 0, 1.2, 1);
      pass(a, b, 2.4, 0, 1);
      pass(b, a, 0, 2.4, 1);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      pass(a, null, 0, 0, bloom * 0.62 * (s.glow ?? 1));
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    // At rest every point has stepped back behind the photograph: nothing to draw.
    if (!(picture && s.intro >= 1 && s.morph <= 0)) points(s, 1, 0);
  }

  function dispose() {
    buffers.forEach((b) => gl.deleteBuffer(b));
    targets.forEach((tg) => {
      gl.deleteFramebuffer(tg.fbo);
      gl.deleteTexture(tg.tex);
    });
    gl.deleteProgram(program);
    gl.deleteProgram(blur);
    gl.deleteProgram(mesh);
    if (picture) gl.deleteTexture(picture);
  }

  return { resize, render, setPicture, dispose };
}
