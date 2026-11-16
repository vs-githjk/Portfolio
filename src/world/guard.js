import { Vector4 } from 'three';

/* A window for a piece made of light: it shows only inside one rectangle of the
   window (feathered at the edges) and gives nothing inside up to six keep-out
   boxes (the text inside that rectangle). Shared by the small pieces; the wyrm
   has its own, with a band and two waterlines. All in window px, y down. */
export const BOXES = 6;

export const CLIP = /* glsl */ `
uniform vec4 uClip; uniform vec4 uKeep[${BOXES}]; uniform vec2 uCRes;
float clipA(){
  vec2 p = vec2(gl_FragCoord.x, uCRes.y - gl_FragCoord.y) / uCRes.x;
  vec2 d = min(p - uClip.xy, uClip.zw - p);
  float g = smoothstep(0.0, 28.0, min(d.x, d.y));
  for (int i = 0; i < ${BOXES}; i++) {
    vec2 o = max(uKeep[i].xy - p, p - uKeep[i].zw);
    g *= smoothstep(0.0, 22.0, max(o.x, o.y));
  }
  return g;
}
`;

export function clipUniforms() {
  return {
    uClip: { value: new Vector4(-1e5, -1e5, 1e5, 1e5) },
    uKeep: { value: Array.from({ length: BOXES }, () => new Vector4(-9e4, -9e4, -9e4, -9e4)) },
    uCRes: { value: { x: 1, y: 1 } },
  };
}

/** rect and boxes in document px ([x0, y0, x1, y1]); scroll, dpr and the drawing-buffer height. */
export function setClip(U, rect, boxes, scroll, dpr, resY) {
  U.uClip.value.set(rect[0], rect[1] - scroll, rect[2], rect[3] - scroll);
  for (let i = 0; i < BOXES; i++) {
    const b = boxes[i];
    if (b) U.uKeep.value[i].set(b[0], b[1] - scroll, b[2], b[3] - scroll);
    else U.uKeep.value[i].set(-9e4, -9e4, -9e4, -9e4);
  }
  U.uCRes.value.x = dpr;
  U.uCRes.value.y = resY;
}
