import { useEffect, useRef } from 'react';

/* The one WebGL layer: a warm starfield. Raw WebGL2, no dependencies: one
   fullscreen triangle, a fragment shader, no attributes, no textures.

   A faint nebula haze (brightest top-right, behind the hero deck) plus three
   star layers that drift with scroll at different speeds, so the page has
   parallax without moving a single piece of content. Rare stars carry a soft
   four-point flare. Colors come from tokens.css at mount.

   Cost control: backing store is CSS size x min(dpr, 1.5) x 0.7 (smaller on
   phones), 30 fps, paused while the tab is hidden, never created under
   prefers-reduced-motion or without WebGL2 (the static CSS layer stays). */

const VERT = `#version 300 es
void main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.-1.,0.,1.);}`;

const FRAG = `#version 300 es
precision mediump float; out vec4 o;
uniform vec2 uRes; uniform float uT,uScroll,uDim; uniform vec3 uInk,uWarm,uAcc,uStar;
float h21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<3;i++){v+=a*vn(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}
/* one star layer: hashed point per cell, soft core, twinkle, rare 4-point flare */
vec4 stars(vec2 uv,float t,float dens,float r,float flare){
  vec2 id=floor(uv),f=fract(uv);vec4 s=vec4(0.);
  for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){
    vec2 o=vec2(float(x),float(y));vec2 c=id+o;
    float a=h21(c),b=h21(c+7.7),g=h21(c+3.3);
    if(a>dens)continue;
    vec2 pos=o+vec2(b,g)-f; float d=length(pos);
    float tw=.7+.3*sin(t*(.6+a*8.)+b*40.);
    float core=smoothstep(r,0.,d);
    float halo=smoothstep(r*5.,0.,d)*.12;
    float fl=flare*step(a,dens*.18)*(max(0.,1.-abs(pos.x)*22.)*max(0.,1.-abs(pos.y)*2.2)+max(0.,1.-abs(pos.y)*22.)*max(0.,1.-abs(pos.x)*2.2))*.35;
    float gold=step(.78,g);
    s+=vec4((core+halo+fl)*tw*(.4+.6*b),gold,0.,0.);
  }
  return s;
}
void main(){
  vec2 uv=(gl_FragCoord.xy-.5*uRes)/uRes.y;
  float t=uT;
  vec2 p=uv*1.7+vec2(.4,.2)+vec2(t*.008,-uScroll*.00012);
  float n=smoothstep(.30,.85,fbm(p));
  float spot=1.-smoothstep(.1,1.15,length((uv-vec2(.46,.26))*vec2(1.,1.35)));
  vec3 c=mix(uInk,uWarm*1.9,n*(.7+1.1*spot)*uDim);
  c=mix(c,uAcc,n*spot*.13*uDim);
  vec4 s=vec4(0.);
  s+=stars(uv*26.+vec2(0.,uScroll*.0005),t,.09,.07,0.)*.35;
  s+=stars(uv*13.+vec2(3.1,uScroll*.0011),t,.08,.06,.6)*.65;
  s+=stars(uv*6.5+vec2(9.3,uScroll*.0020),t,.085,.045,1.)*1.1;
  float lum=min(s.x,1.4)*uDim*(.55+.45*spot);
  vec3 sc=mix(uStar,uAcc,clamp(s.y,0.,1.)*.9);
  c+=sc*lum*1.1;
  o=vec4(c,1.);
}`;

const FRAME_MS = 1000 / 30;

function readToken(css, name) {
  const h = css.getPropertyValue(name).trim().replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
}

export default function BackgroundField({ onReady }) {
  const ref = useRef(null);

  useEffect(() => {
    const cv = ref.current;
    const rm = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (rm.matches) return undefined;
    const gl = cv.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'low-power' });
    if (!gl) return undefined;

    const compile = (type, src) => {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null;
    };
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return undefined;
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return undefined;
    gl.useProgram(prog);

    const css = getComputedStyle(document.documentElement);
    const U = (n) => gl.getUniformLocation(prog, n);
    gl.uniform3fv(U('uInk'), readToken(css, '--ink'));
    gl.uniform3fv(U('uWarm'), readToken(css, '--surface-2'));
    gl.uniform3fv(U('uAcc'), readToken(css, '--acc'));
    gl.uniform3fv(U('uStar'), readToken(css, '--text'));
    const uRes = U('uRes');
    const uT = U('uT');
    const uDim = U('uDim');
    const uScroll = U('uScroll');

    const small = window.innerWidth < 720;
    const SCALE = small ? 0.6 : 0.7;
    const DPR = Math.min(window.devicePixelRatio || 1, small ? 1 : 1.5);
    const size = () => {
      cv.width = Math.round(window.innerWidth * DPR * SCALE);
      cv.height = Math.round(window.innerHeight * DPR * SCALE);
      gl.viewport(0, 0, cv.width, cv.height);
      gl.uniform2f(uRes, cv.width, cv.height);
    };
    size();
    window.addEventListener('resize', size, { passive: true });

    let raf = 0;
    let last = 0;
    let running = false;
    const t0 = performance.now();
    const draw = (now) => {
      raf = requestAnimationFrame(draw);
      if (now - last < FRAME_MS) return;
      last = now;
      const y = window.scrollY;
      gl.uniform1f(uT, (now - t0) / 1000);
      gl.uniform1f(uDim, 1 - 0.5 * Math.min(1, y / 900)); // settles once you scroll into the reading
      gl.uniform1f(uScroll, y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const start = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(draw);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    const onVisibility = () => (document.hidden ? stop() : start());
    const onMotion = (e) => {
      if (e.matches) {
        stop();
        cv.style.display = 'none';
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    rm.addEventListener('change', onMotion);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
    onReady?.();
    start();

    return () => {
      stop();
      window.removeEventListener('resize', size);
      document.removeEventListener('visibilitychange', onVisibility);
      rm.removeEventListener('change', onMotion);
    };
  }, [onReady]);

  return <canvas ref={ref} className="bg-canvas" />;
}
