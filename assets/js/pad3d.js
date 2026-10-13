/* ALVIA — Control CC01 in 3D
   The last view of the product gallery is a real-time model of the pad: cloth surface,
   overlocked edge, PU base. Everything is built here from the product's dimensions —
   there is no model file to download. Geometry is in millimetres (500 × 500 × 4).

   Nothing heavy loads until the 3D view is opened: three.js (assets/vendor) is imported
   on demand, the textures are generated in the browser, and the scene only renders
   while it is on screen. The page works the same without WebGL; the view then says so. */

const THREE_URL = new URL('../vendor/three.module.min.js', import.meta.url).href;
const LOGO_URL = new URL('../img/alvia-mark.webp', import.meta.url).href;

/* ---------- The product, in millimetres ---------- */
const PAD = { half: 250, radius: 15, thickness: 4 };
/* The overlock: thread loops per straight side and per corner. The total is a multiple
   of TILE, the number of loops in one repeat of the thread texture, so the pattern
   closes around the pad without a seam. */
const LOOPS = { side: 431, corner: 13 };
const TILE = 8;
const LOOP_HEIGHT = 0.17;   // how far a thread stands proud of the bead
const LEAN = 1.25;          // loops lean along the edge by this many loops over their length
/* Cross-section of the stitched edge. d = distance in from the outermost point,
   y = height above the desk. The bead stays just under the cloth: low-profile. */
const EDGE = {
  seamTop: { d: 6.4, y: 3.4 },
  crestTop: { d: 2.3, y: 3.84 },
  mid: 1.97,
  crestBottom: { d: 2.3, y: 0.12 },
  seamBottom: { d: 6.0, y: 0.42 },
  lockAngle: -52             // where the upper and lower looper threads interlock, in degrees round the nose
};
/* Logo print: 50 mm wide, in the lower right corner of the surface. */
const LOGO = { width: 50, right: 27, bottom: 26, aspect: 706 / 1376 };

/* Colourways. `cloth`/`thread` are the dyed colours; the *Sheen values are the soft
   highlight a fibre surface throws back at a low angle. */
const PALETTE = {
  blue: { cloth: '#0946c0', clothSheen: '#1f55e0', thread: '#1226a8', threadSheen: '#3558e8', threadGloss: '#5f86ff', chain: '#3451d6', ink: '#f2f5fa' },
  black: { cloth: '#222224', clothSheen: '#5a5a60', thread: '#0d0d0f', threadSheen: '#3c3c44', threadGloss: '#7c7c86', chain: '#26262a', ink: '#dcdde1' }
};

/* Camera presets. Angles in radians: `az` turns the pad about its vertical axis
   (π shows the back), `el` lifts the camera. `dist: 0` means "fit the whole pad". */
const VIEWS = {
  front: { az: -0.36, el: -0.28, dist: 0, tx: 0, ty: 0 },
  edge: { az: 0.62, el: -0.62, dist: 190, tx: 226, ty: -228 },
  back: { az: Math.PI - 0.36, el: -0.28, dist: 0, tx: 0, ty: 0 }
};
const FOV = 26;
const MIN_DIST = 62;

const stage = document.querySelector('[data-pad3d-stage]');
const slide = stage ? stage.closest('[data-pad3d]') : null;
if (stage && slide) init();

function init() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const thumb = document.querySelector('[data-pad3d-thumb]');
  let threeLoading = null;
  let viewer = null;
  let booting = false;

  const loadThree = () => (threeLoading ||= import(THREE_URL));
  const setState = (state) => { stage.dataset.state = state; };
  const isActive = () => slide.classList.contains('is-active');

  // Opening the view is the cue to build it; hovering its thumbnail starts the download.
  const warm = () => { loadThree().catch(() => {}); };
  thumb?.addEventListener('pointerenter', warm, { once: true });
  thumb?.addEventListener('focus', warm, { once: true });

  async function boot() {
    if (viewer || booting) return;
    booting = true;
    setState('loading');
    try {
      const THREE = await loadThree();
      viewer = await createViewer(THREE, stage, { reduced, coarse });
      setState('ready');
      viewer.setVariant(document.body.dataset.variant || 'blue', true);
      sync();
    } catch (error) {
      setState('error');
      // eslint-disable-next-line no-console
      console.warn('[ALVIA 3D] could not start:', error);
    }
    booting = false;
  }

  let onScreen = true;
  function sync() {
    if (isActive() && !viewer) boot();
    viewer?.setRunning(isActive() && onScreen && !document.hidden);
  }

  new MutationObserver(sync).observe(slide, { attributes: true, attributeFilter: ['class'] });
  new MutationObserver(() => viewer?.setVariant(document.body.dataset.variant || 'blue'))
    .observe(document.body, { attributes: true, attributeFilter: ['data-variant'] });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => { onScreen = entries[0].isIntersecting; sync(); }).observe(stage);
  }
  document.addEventListener('visibilitychange', sync);

  /* The gallery around this view listens for swipes and arrow keys to change the
     picture. Inside the model those gestures belong to the model. */
  ['touchstart', 'touchend'].forEach((type) => stage.addEventListener(type, (event) => event.stopPropagation(), { passive: true }));

  setState('idle');
  sync();
}

/* =====================================================
   Small maths
   ===================================================== */
const TAU = Math.PI * 2;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (lo, hi, v) => { const t = clamp((v - lo) / (hi - lo), 0, 1); return t * t * (3 - 2 * t); };
const fract = (v) => v - Math.floor(v);
const mod = (v, n) => ((v % n) + n) % n;
const easeInOut = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 4);
const frame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));

function hash(x, y, seed = 0) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(seed | 0, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
// Value noise that repeats every `px` × `py` cells, so a texture built on it tiles.
function noise(x, y, px, py, seed = 0) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const fx = x - xi, fy = y - yi;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const x0 = mod(xi, px), x1 = mod(xi + 1, px), y0 = mod(yi, py), y1 = mod(yi + 1, py);
  return lerp(lerp(hash(x0, y0, seed), hash(x1, y0, seed), ux), lerp(hash(x0, y1, seed), hash(x1, y1, seed), ux), uy);
}
function noise1(x, seed = 0) {
  const xi = Math.floor(x), f = x - xi, u = f * f * (3 - 2 * f);
  return lerp(hash(xi, 7, seed), hash(xi + 1, 7, seed), u);
}

/* =====================================================
   The stitched edge, as a shape
   ===================================================== */
/* One half of the section is a rounded nose (a superellipse), the other two parts are
   the bands that run back to the seam on top and underneath. Returned as points with
   their outward normals, closely spaced where the section curves. */
function edgeProfile(bandPoints, nosePoints) {
  const { seamTop, crestTop, mid, crestBottom, seamBottom } = EDGE;
  const dive = (t) => .3 * t * t + .7 * Math.pow(t, 5);     // a band stays level, then dives into the seam
  const spow = (v, e) => Math.sign(v) * Math.pow(Math.abs(v), e);
  const raw = [];
  for (let i = bandPoints; i > 0; i--) {
    const t = i / bandPoints;
    raw.push([lerp(crestTop.d, seamTop.d, t), crestTop.y - (crestTop.y - seamTop.y) * dive(t), 0]);
  }
  for (let i = 0; i <= nosePoints; i++) {
    const angle = Math.PI / 2 - Math.PI * i / nosePoints;
    const height = angle > 0 ? crestTop.y - mid : mid - crestBottom.y;
    raw.push([crestTop.d - crestTop.d * spow(Math.cos(angle), .84), mid + height * spow(Math.sin(angle), .84), angle]);
  }
  for (let i = 1; i <= bandPoints; i++) {
    const t = i / bandPoints;
    raw.push([lerp(crestBottom.d, seamBottom.d, t), crestBottom.y + (seamBottom.y - crestBottom.y) * dive(t), -9]);
  }
  let length = 0;
  const along = raw.map((p, i) => (i ? (length += Math.hypot(p[0] - raw[i - 1][0], p[1] - raw[i - 1][1])) : 0));
  const lockRad = EDGE.lockAngle * Math.PI / 180;
  let lock = .64;
  const points = raw.map((p, i) => {
    const a = raw[Math.max(0, i - 1)], b = raw[Math.min(raw.length - 1, i + 1)];
    const td = b[0] - a[0], ty = b[1] - a[1], tl = Math.hypot(td, ty) || 1;
    if (p[2] > -9 && p[2] <= lockRad && raw[i - 1][2] > lockRad) lock = along[i] / length;
    return { d: p[0], y: p[1], nd: ty / tl, ny: -td / tl, v: along[i] / length };
  });
  return { points, length, lock };
}

/* Height of the thread surface, 0…1, at loop coordinate `u` (one unit per loop) and
   `v` along the section (0 = top seam, 1 = bottom seam). The upper looper covers the
   top and the nose, the lower looper the underside; they meet at `lock`, half a loop
   out of step. Shared by the geometry and the thread texture so both line up. */
function loopHeight(u, v, lock) {
  const x = v < lock ? u + LEAN * v : u + .5 + LEAN * (1 - v);
  const c = 2 * fract(x) - 1;
  const ends = smooth(0, .035, v) * smooth(0, .035, 1 - v);
  const pinch = 1 - .6 * Math.exp(-Math.pow((v - lock) / .014, 2));
  return Math.pow(Math.max(0, 1 - c * c), .6) * ends * pinch;
}

/* The centre line of the pad's outline, walked once round. Each sample is a point on
   the rounded square's skeleton plus the outward direction there; a point `d` in from
   the outer edge is base + out × (radius − d). `u` counts thread loops. */
function outline(perSide, perCorner) {
  const reach = PAD.half - PAD.radius;
  const samples = [];
  let loops = 0;
  for (let side = 0; side < 4; side++) {
    const angle = Math.PI / 2 - side * Math.PI / 2;
    const ox = Math.cos(angle), oz = Math.sin(angle);
    const tx = Math.sin(angle), tz = -Math.cos(angle);
    for (let i = 0; i < perSide; i++) {
      const s = -reach + 2 * reach * i / perSide;
      samples.push({ bx: ox * reach + tx * s, bz: oz * reach + tz * s, ox, oz, u: loops + LOOPS.side * i / perSide });
    }
    loops += LOOPS.side;
    const cx = ox * reach + tx * reach, cz = oz * reach + tz * reach;
    for (let i = 0; i < perCorner; i++) {
      const a = angle - Math.PI / 2 * i / perCorner;
      samples.push({ bx: cx, bz: cz, ox: Math.cos(a), oz: Math.sin(a), u: loops + LOOPS.corner * i / perCorner });
    }
    loops += LOOPS.corner;
  }
  samples.push({ ...samples[0], u: loops });
  return samples;
}

/* =====================================================
   Geometry
   ===================================================== */
function geometry(THREE, data) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(data.position, 3));
  if (data.normal) g.setAttribute('normal', new THREE.BufferAttribute(data.normal, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(data.uv, 2));
  if (data.color) g.setAttribute('color', new THREE.BufferAttribute(data.color, 3));
  g.setIndex(new THREE.BufferAttribute(data.index, 1));
  if (!data.normal) g.computeVertexNormals();
  g.computeBoundingSphere();
  return g;
}

/* A face of the pad (cloth or base): rings stepping in from the seam, each with its
   own height and shade, closed by a flat panel. The rings carry the dip the stitching
   presses into the edge, and the shade stands in for the shadow in that groove. */
function buildFace(THREE, rings, up) {
  const path = outline(1, 22);
  const n = path.length;
  const count = rings.length * n + 1;
  const position = new Float32Array(count * 3), uv = new Float32Array(count * 2), color = new Float32Array(count * 3);
  const index = [];
  const size = PAD.half * 2;
  rings.forEach((ring, r) => {
    path.forEach((p, i) => {
      const k = r * n + i;
      const x = p.bx + p.ox * (PAD.radius - ring.d), z = p.bz + p.oz * (PAD.radius - ring.d);
      position.set([x, ring.y, z], k * 3);
      uv.set([(x + PAD.half) / size, (z + PAD.half) / size], k * 2);
      color.set([ring.shade, ring.shade, ring.shade], k * 3);
    });
  });
  const centre = count - 1;
  const last = rings[rings.length - 1];
  position.set([0, last.y, 0], centre * 3);
  uv.set([.5, .5], centre * 2);
  color.set([1, 1, 1], centre * 3);
  const tri = (a, b, c) => (up ? index.push(a, b, c) : index.push(a, c, b));
  for (let r = 0; r < rings.length - 1; r++) {
    for (let i = 0; i < n - 1; i++) {
      const a = r * n + i, b = a + 1, c = a + n, d = c + 1;
      tri(a, b, d); tri(a, d, c);
    }
  }
  const inner = (rings.length - 1) * n;
  for (let i = 0; i < n - 1; i++) tri(centre, inner + i, inner + i + 1);
  return geometry(THREE, { position, uv, color, index: new Uint32Array(index) });
}

/* The overlocked bead: the edge section swept round the outline. In the close-up
   version (`ridged`) every thread loop is a real ridge, so the stitching has a true
   silhouette; the distant version is the smooth bead, because ridges smaller than a
   pixel would only shimmer. Normals are those of the smooth bead in both — the thread
   texture supplies the shading, which is why the two can be swapped unnoticed. */
function buildBead(THREE, profile, path, ridged) {
  const pts = profile.points;
  const n = path.length, m = pts.length;
  const position = new Float32Array(n * m * 3), normal = new Float32Array(n * m * 3), uv = new Float32Array(n * m * 2);
  const index = new Uint32Array((n - 1) * (m - 1) * 6);
  for (let i = 0; i < n; i++) {
    const p = path[i];
    for (let k = 0; k < m; k++) {
      const q = pts[k];
      const h = ridged ? LOOP_HEIGHT * loopHeight(p.u, q.v, profile.lock) : LOOP_HEIGHT * .6;
      const reach = PAD.radius - (q.d + q.nd * h);
      const o = (i * m + k) * 3;
      position[o] = p.bx + p.ox * reach;
      position[o + 1] = q.y + q.ny * h;
      position[o + 2] = p.bz + p.oz * reach;
      normal[o] = -q.nd * p.ox;
      normal[o + 1] = q.ny;
      normal[o + 2] = -q.nd * p.oz;
      uv[(i * m + k) * 2] = p.u / TILE;
      uv[(i * m + k) * 2 + 1] = q.v;
    }
  }
  let w = 0;
  for (let i = 0; i < n - 1; i++) {
    for (let k = 0; k < m - 1; k++) {
      const a = i * m + k, b = a + 1, c = a + m, d = c + 1;
      index[w++] = a; index[w++] = b; index[w++] = c;
      index[w++] = c; index[w++] = b; index[w++] = d;
    }
  }
  return geometry(THREE, { position, normal, uv, index });
}

/* A seam: the needle thread shows as a row of small beads, one per loop, lying in the
   groove where the loops go into the cloth. Three of these run round the pad — top
   seam, bottom seam and the line where the two loopers interlock on the nose. */
function buildChain(THREE, at, radius, path, phase, beaded) {
  const around = 5;
  const n = path.length, m = around + 1;
  const position = new Float32Array(n * m * 3), normal = new Float32Array(n * m * 3), uv = new Float32Array(n * m * 2);
  const index = new Uint32Array((n - 1) * around * 6);
  for (let i = 0; i < n; i++) {
    const p = path[i];
    const r = radius * (beaded ? .28 + .72 * Math.pow(Math.abs(Math.cos(Math.PI * (p.u + phase))), .8) : .7);
    for (let k = 0; k < m; k++) {
      const a = TAU * k / around;
      const ca = Math.cos(a), sa = Math.sin(a);
      const reach = PAD.radius - at.d + r * ca;
      const o = (i * m + k) * 3;
      position[o] = p.bx + p.ox * reach;
      position[o + 1] = at.y + r * sa;
      position[o + 2] = p.bz + p.oz * reach;
      normal[o] = p.ox * ca;
      normal[o + 1] = sa;
      normal[o + 2] = p.oz * ca;
      uv[(i * m + k) * 2] = p.u;
      uv[(i * m + k) * 2 + 1] = k / around;
    }
  }
  let w = 0;
  for (let i = 0; i < n - 1; i++) {
    for (let k = 0; k < around; k++) {
      const a = i * m + k, b = a + m, c = a + 1, d = b + 1;
      index[w++] = a; index[w++] = b; index[w++] = c;
      index[w++] = b; index[w++] = d; index[w++] = c;
    }
  }
  return geometry(THREE, { position, normal, uv, index });
}

/* =====================================================
   Textures — generated, not downloaded
   ===================================================== */
/* Samples a height field (millimetres) into a tangent-space normal map, a grey shade
   map that multiplies the material colour, and a roughness map (green channel). */
function bakeMaps(THREE, { width, height, mmWide, mmHigh, wrapY = true, sample }) {
  const heights = new Float32Array(width * height);
  const shade = new Uint8Array(width * height * 4), rough = new Uint8Array(width * height * 4), normal = new Uint8Array(width * height * 4);
  const out = { height: 0, shade: 1, rough: .8 };
  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      sample((i + .5) / width, (j + .5) / height, i, j, out);
      const k = j * width + i;
      heights[k] = out.height;
      const s = clamp(out.shade, 0, 1) * 255;
      shade[k * 4] = s; shade[k * 4 + 1] = s; shade[k * 4 + 2] = s; shade[k * 4 + 3] = 255;
      const r = clamp(out.rough, 0, 1) * 255;
      rough[k * 4] = s; rough[k * 4 + 1] = r; rough[k * 4 + 2] = 0; rough[k * 4 + 3] = 255;
    }
  }
  const dx = mmWide / width, dy = mmHigh / height;
  for (let j = 0; j < height; j++) {
    const up = wrapY ? mod(j + 1, height) : Math.min(height - 1, j + 1);
    const down = wrapY ? mod(j - 1, height) : Math.max(0, j - 1);
    for (let i = 0; i < width; i++) {
      const sx = (heights[j * width + mod(i + 1, width)] - heights[j * width + mod(i - 1, width)]) / (2 * dx);
      const sy = (heights[up * width + i] - heights[down * width + i]) / ((up - down || 1) * dy);
      const inv = 1 / Math.hypot(sx, sy, 1);
      const k = (j * width + i) * 4;
      normal[k] = (-sx * inv * .5 + .5) * 255;
      normal[k + 1] = (-sy * inv * .5 + .5) * 255;
      normal[k + 2] = (inv * .5 + .5) * 255;
      normal[k + 3] = 255;
    }
  }
  const texture = (data, srgb) => {
    const t = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    if (!wrapY) t.wrapT = THREE.ClampToEdgeWrapping;
    t.magFilter = THREE.LinearFilter;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.generateMipmaps = true;
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.needsUpdate = true;
    return t;
  };
  return { shade: texture(shade, true), rough: texture(rough, false), normal: texture(normal, false) };
}

/* Thread: one repeat is TILE loops wide and the whole section high. Each loop is a
   bundle of filaments with a slight twist; no two loops are quite the same width. */
function threadMaps(THREE, profile) {
  const pitch = (PAD.half - PAD.radius) * 2 / LOOPS.side;
  const lock = profile.lock;
  return bakeMaps(THREE, {
    width: 512, height: 512, mmWide: TILE * pitch, mmHigh: profile.length, wrapY: false,
    sample(x, v, i, j, out) {
      const u = x * TILE + .07 * (noise(x * TILE * 2, v * 9, TILE * 2, 64, 3) - .5);
      const along = v < lock ? u + LEAN * v : u + .5 + LEAN * (1 - v);
      const loop = mod(Math.floor(along), TILE) + (v < lock ? 0 : 31);
      const across = fract(along);
      const body = loopHeight(u, v, lock);
      // Filaments: fine streaks across the loop that drift as the thread twists.
      const twist = v * 5.5 + hash(loop, 3, 5) * 9;
      const fibre = .6 * noise1(across * 13 + loop * 17.13 + twist, 11) + .4 * noise1(across * 31 + loop * 5.7 + twist * 1.7, 12);
      const swell = .92 + .16 * noise1(v * 7 + loop * 3.3, 13);
      out.height = LOOP_HEIGHT * body * swell * (1 + .2 * (fibre - .5));
      const groove = Math.pow(body, .55);
      const seam = .5 + .5 * smooth(0, .09, v) * smooth(0, .09, 1 - v);
      out.shade = (.5 + .5 * groove) * (.86 + .28 * fibre) * (.9 + .2 * hash(loop, 1, 9)) * seam;
      out.rough = .4 + .26 * (1 - groove) + .18 * (fibre - .5);
    }
  });
}

/* Cloth: a plain weave, 64 threads to the repeat (about 0.3 mm each), with a little
   grain so the surface catches light the way a fine textile does. */
function clothMaps(THREE) {
  const cells = 64;
  return bakeMaps(THREE, {
    width: 512, height: 512, mmWide: cells * .3, mmHigh: cells * .3,
    sample(x, y, i, j, out) {
      const cx = x * cells, cy = y * cells;
      const ix = Math.floor(cx), iy = Math.floor(cy);
      const a = Math.sin(Math.PI * (cx - ix)), b = Math.sin(Math.PI * (cy - iy));
      const warpOver = ((ix + iy) & 1) === 0;
      const yarn = warpOver ? a * (.5 + .5 * b) * (.92 + .16 * hash(ix, 0, 21)) : b * (.5 + .5 * a) * (.92 + .16 * hash(0, iy, 22));
      const grain = hash(i, j, 23) - .5;
      out.height = .05 * yarn + .012 * grain;
      out.shade = .8 + .2 * yarn + .07 * grain;
      out.rough = .9 + .08 * grain - .05 * yarn;
    }
  });
}

/* Base: a fine grid of anti-slip studs on a matt skin. */
function baseMaps(THREE) {
  const studs = 8;
  return bakeMaps(THREE, {
    width: 256, height: 256, mmWide: studs * .85, mmHigh: studs * .85,
    sample(x, y, i, j, out) {
      const gy = y * studs, row = Math.floor(gy);
      const gx = x * studs + (row & 1) * .5;
      const stud = smooth(.4, .2, Math.hypot(fract(gx) - .5, fract(gy) - .5));
      const grain = hash(i, j, 31) - .5;
      out.height = .055 * stud + .008 * grain;
      out.shade = .78 + .22 * stud + .06 * grain;
      out.rough = .74 - .14 * stud + .1 * grain;
    }
  });
}

/* Large, soft variation laid once over the whole surface: dyed cloth is never one flat
   value, and it hides the repeat of the weave. */
function mottleTexture(THREE) {
  const size = 256;
  const data = new Uint8Array(size * size * 4);
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      const x = i / size, y = j / size;
      const v = .5 * noise(x * 6, y * 6, 6, 6, 41) + .3 * noise(x * 17, y * 17, 17, 17, 42) + .2 * noise(x * 43, y * 43, 43, 43, 43);
      data.fill(v * 255, (j * size + i) * 4, (j * size + i) * 4 + 3);
      data[(j * size + i) * 4 + 3] = 255;
    }
  }
  const t = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.needsUpdate = true;
  return t;
}

/* =====================================================
   Light: a small photo studio, rendered once into an environment map
   ===================================================== */
function studio(THREE, renderer) {
  const scene = new THREE.Scene();
  const panel = (w, h, level, tint, position, target = [0, 0, 0]) => {
    const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(tint).multiplyScalar(level), side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
    mesh.position.set(...position);
    mesh.lookAt(...target);
    scene.add(mesh);
  };
  scene.add(new THREE.Mesh(new THREE.BoxGeometry(60, 40, 60), new THREE.MeshBasicMaterial({ color: new THREE.Color('#0b0c10').multiplyScalar(.5), side: THREE.BackSide })));
  panel(16, 11, 7.5, '#fff6ea', [-9, 11, 12]);        // key: a large softbox, up and to the left
  panel(26, 26, 1.1, '#eef2ff', [0, 19, 0]);          // ceiling wash
  panel(2.4, 20, 26, '#ffffff', [17, 2, -4]);         // rim: a tall strip on the right
  panel(3.5, 16, 9, '#cfdcff', [-18, 0, -9]);         // cool kicker from behind on the left
  panel(22, 5, 1.6, '#ffffff', [0, -9, 16]);          // low fill, so the underside is never black
  panel(10, 3, 5, '#ffffff', [6, 14, -14]);           // hair light
  const pmrem = new THREE.PMREMGenerator(renderer);
  const map = pmrem.fromScene(scene, .03).texture;
  pmrem.dispose();
  scene.traverse((o) => { o.geometry?.dispose(); o.material?.dispose(); });
  return map;
}

/* =====================================================
   The viewer
   ===================================================== */
async function createViewer(THREE, stage, { reduced, coarse }) {
  const canvas = document.createElement('canvas');
  canvas.className = 'pad3d__canvas';
  canvas.setAttribute('aria-hidden', 'true');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.02;
  const sharp = Math.min(8, renderer.capabilities.getMaxAnisotropy());

  const scene = new THREE.Scene();
  scene.environment = studio(THREE, renderer);
  scene.environmentIntensity = .85;
  /* The pad turns, the lights stay: a lamp close enough that its light falls off
     across the surface (a flat pad under even light is a flat rectangle), a kicker
     low on the other side for the edge, and two distant lights for the base level. */
  const lamp = new THREE.PointLight('#fff8f0', 3.6e6, 0, 2);
  lamp.position.set(-420, 520, 900);
  const kicker = new THREE.PointLight('#f1f4ff', 1.5e6, 0, 2);
  kicker.position.set(620, -300, 520);
  const key = new THREE.DirectionalLight('#ffffff', .9);
  key.position.set(-.5, .9, .8);
  const rim = new THREE.DirectionalLight('#eef2ff', 1.3);
  rim.position.set(.9, .25, -.55);
  scene.add(lamp, kicker, key, rim);

  const camera = new THREE.PerspectiveCamera(FOV, 3 / 4, 8, 6000);

  /* ----- textures (spread over a few frames so the page keeps moving) ----- */
  const profile = edgeProfile(7, coarse ? 14 : 20);
  await frame();
  const thread = threadMaps(THREE, profile);
  await frame();
  const cloth = clothMaps(THREE);
  await frame();
  const base = baseMaps(THREE);
  const mottle = mottleTexture(THREE);
  [thread, cloth, base].forEach((set) => Object.values(set).forEach((t) => { t.anisotropy = sharp; }));
  const weave = PAD.half * 2 / (64 * .3);
  [cloth.shade, cloth.normal, cloth.rough].forEach((t) => t.repeat.set(Math.round(weave), Math.round(weave)));
  const studs = Math.round(PAD.half * 2 / (8 * .85));
  [base.shade, base.normal, base.rough].forEach((t) => t.repeat.set(studs, studs));
  const logo = await new THREE.TextureLoader().loadAsync(LOGO_URL);
  logo.colorSpace = THREE.NoColorSpace;
  logo.anisotropy = sharp;
  logo.wrapS = logo.wrapT = THREE.ClampToEdgeWrapping;

  /* ----- materials ----- */
  const clothMaterial = new THREE.MeshPhysicalMaterial({
    map: cloth.shade, normalMap: cloth.normal, normalScale: new THREE.Vector2(.85, .85), roughnessMap: cloth.rough,
    roughness: .94, metalness: 0, specularIntensity: .5, sheen: .7, sheenRoughness: .6, vertexColors: true
  });
  /* The cloth shader gets two additions: the soft mottling over the whole surface and
     the printed logo, which sits in the weave rather than on top of it. */
  const size = PAD.half * 2;
  const logoHeight = LOGO.width * LOGO.aspect;
  const print = {
    uInkMap: { value: logo },
    uInkRect: { value: new THREE.Vector4((size - LOGO.right - LOGO.width) / size, (size - LOGO.bottom - logoHeight) / size, LOGO.width / size, logoHeight / size) },
    uInk: { value: new THREE.Color() },
    uMottle: { value: mottle }
  };
  clothMaterial.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, print);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vPadUv;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvPadUv = uv;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec2 vPadUv;
        uniform sampler2D uInkMap;
        uniform sampler2D uMottle;
        uniform vec4 uInkRect;
        uniform vec3 uInk;
        float padInk = 0.0;`)
      .replace('#include <map_fragment>', `#include <map_fragment>
        float padMottle = .6 * texture2D( uMottle, vPadUv * 1.0 ).r + .4 * texture2D( uMottle, vPadUv * 4.3 ).r;
        diffuseColor.rgb *= .93 + .14 * padMottle;
        vec2 inkUv = ( vPadUv - uInkRect.xy ) / uInkRect.zw;
        float inkInside = step( 0.0, inkUv.x ) * step( inkUv.x, 1.0 ) * step( 0.0, inkUv.y ) * step( inkUv.y, 1.0 );
        float inkValue = texture2D( uInkMap, vec2( inkUv.x, 1.0 - inkUv.y ) ).r;
        float inkEdge = max( fwidth( inkValue ), .02 );
        padInk = smoothstep( .5 - inkEdge, .5 + inkEdge, inkValue ) * inkInside;
        diffuseColor.rgb = mix( diffuseColor.rgb, uInk * ( .9 + .1 * texture2D( map, vMapUv ).r ), padInk * .94 );`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = mix( roughnessFactor, .66, padInk * .7 );`);
  };
  /* Thread is a bundle of filaments: its highlight is stretched across the loop and
     takes the colour of the dye instead of the colour of the lamp. */
  const threadMaterial = new THREE.MeshPhysicalMaterial({
    map: thread.shade, normalMap: thread.normal, normalScale: new THREE.Vector2(.7, .7), roughnessMap: thread.rough, aoMap: thread.rough,
    roughness: 1, metalness: 0, ior: 1.75, anisotropy: .6, sheen: .5, sheenRoughness: .5
  });
  const chainMaterial = new THREE.MeshPhysicalMaterial({ roughness: .5, metalness: 0, ior: 1.75, sheen: .5, sheenRoughness: .5 });
  const baseMaterial = new THREE.MeshPhysicalMaterial({
    color: '#1b1b1e', map: base.shade, normalMap: base.normal, normalScale: new THREE.Vector2(1, 1), roughnessMap: base.rough,
    roughness: 1, metalness: 0, sheen: .5, sheenColor: new THREE.Color('#55555f'), sheenRoughness: .6, vertexColors: true
  });

  /* ----- the pad ----- */
  await frame();
  const { seamTop, seamBottom } = EDGE;
  const top = PAD.thickness;
  const rings = coarse ? 2 : 4;
  const lockPoint = profile.points.reduce((best, p) => (Math.abs(p.v - profile.lock) < Math.abs(best.v - profile.lock) ? p : best));
  const seams = [
    [{ d: seamTop.d - .02, y: seamTop.y + .1 }, .3, 0],
    [{ d: seamBottom.d - .02, y: seamBottom.y - .1 }, .3, .5],
    [{ d: lockPoint.d, y: lockPoint.y }, .16, .25]
  ];
  // The stitching exists twice: every loop modelled for close-ups, a smooth stand-in
  // for when a loop is smaller than a few pixels (see `place`).
  const stitched = (path, detailed) => {
    const group = new THREE.Group();
    group.add(new THREE.Mesh(buildBead(THREE, profile, path, detailed), threadMaterial));
    seams.forEach(([at, radius, phase]) => group.add(new THREE.Mesh(buildChain(THREE, at, radius, path, phase, detailed), chainMaterial)));
    return group;
  };
  const near = stitched(outline(LOOPS.side * rings, LOOPS.corner * rings), true);
  await frame();
  const far = stitched(outline(1, 20), false);
  near.visible = false;
  const pad = new THREE.Group();
  pad.add(
    new THREE.Mesh(buildFace(THREE, [
      { d: 5.4, y: 3.0, shade: .3 }, { d: seamTop.d, y: seamTop.y - .02, shade: .46 }, { d: 6.9, y: 3.6, shade: .74 },
      { d: 7.6, y: 3.78, shade: .9 }, { d: 8.6, y: 3.93, shade: .97 }, { d: 9.8, y: 3.99, shade: 1 }, { d: 11.2, y: top, shade: 1 }
    ], true), clothMaterial),
    new THREE.Mesh(buildFace(THREE, [
      { d: 5.1, y: .7, shade: .3 }, { d: seamBottom.d, y: seamBottom.y + .02, shade: .5 }, { d: 6.5, y: .27, shade: .76 },
      { d: 7.2, y: .13, shade: .92 }, { d: 8.2, y: .04, shade: .98 }, { d: 9.4, y: 0, shade: 1 }
    ], false), baseMaterial),
    near,
    far
  );
  // Built lying on the desk; stood up so that turning it shows front, edge and back.
  pad.rotation.x = Math.PI / 2;
  pad.position.z = -top / 2;
  const spin = new THREE.Group();
  spin.add(pad);
  scene.add(spin);

  stage.prepend(canvas);

  /* ----- colourway ----- */
  const tone = Object.fromEntries(Object.keys(PALETTE.blue).map((k) => [k, new THREE.Color()]));
  let toneFrom = null, toneTo = null, toneStart = 0;
  const applyTone = () => {
    clothMaterial.color.copy(tone.cloth);
    clothMaterial.sheenColor.copy(tone.clothSheen);
    threadMaterial.color.copy(tone.thread);
    threadMaterial.sheenColor.copy(tone.threadSheen);
    threadMaterial.specularColor.copy(tone.threadGloss);
    chainMaterial.color.copy(tone.chain);
    chainMaterial.sheenColor.copy(tone.threadSheen);
    chainMaterial.specularColor.copy(tone.threadGloss);
    print.uInk.value.copy(tone.ink);
  };
  function setVariant(name, instant) {
    const target = PALETTE[name] || PALETTE.blue;
    toneTo = Object.fromEntries(Object.keys(tone).map((k) => [k, new THREE.Color(target[k])]));
    if (instant || reduced) {
      Object.keys(tone).forEach((k) => tone[k].copy(toneTo[k]));
      toneTo = null;
      applyTone();
    } else {
      toneFrom = Object.fromEntries(Object.keys(tone).map((k) => [k, tone[k].clone()]));
      toneStart = performance.now();
    }
    wake();
  }

  /* ----- camera ----- */
  const now = { az: 0, el: 0, dist: 1500, tx: 0, ty: 0 };
  const goal = { ...now };
  let fit = 1500;
  let tween = null;
  let velocity = 0;
  let sway = 0;          // 0…1: how much of the idle turn is applied
  let swaying = !reduced;
  let swayClock = 0;
  let activeView = 'front';
  let dragging = false;

  const resolve = (view) => ({ ...view, dist: view.dist || fit });
  function nearest(az, from) { return az + Math.round((from - az) / TAU) * TAU; }

  function setView(name, instant) {
    const view = VIEWS[name];
    if (!view) return;
    activeView = name;
    markView();
    const to = resolve(view);
    to.az = nearest(to.az, now.az);
    velocity = 0;
    if (instant || reduced) {
      Object.assign(now, to); Object.assign(goal, to); tween = null;
    } else {
      tween = { from: { ...now }, to, start: performance.now(), duration: 1500, ease: easeInOut };
    }
    swaying = !reduced;
    wake();
  }
  function markView() {
    stage.querySelectorAll('[data-pad3d-view]').forEach((button) => {
      const on = button.dataset.pad3dView === activeView;
      button.classList.toggle('is-active', on);
      button.setAttribute('aria-pressed', String(on));
    });
  }
  // Any direct handling ends the preset and the idle turn.
  function take() {
    tween = null;
    swaying = false;
    if (activeView) { activeView = null; markView(); }
    stage.classList.add('is-touched');
  }
  function zoomBy(factor) {
    take();
    goal.dist = clamp(goal.dist * factor, MIN_DIST, fit * 1.15);
    // Pulling back to the whole pad brings it back to the middle of the frame.
    if (goal.dist > fit * .82) { goal.tx = 0; goal.ty = 0; }
    wake();
  }

  function resize() {
    const width = stage.clientWidth, height = stage.clientHeight;
    if (!width || !height) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    const vertical = Math.tan(FOV * Math.PI / 360);
    const previous = fit;
    fit = PAD.half * 1.1 / Math.min(vertical, vertical * camera.aspect);
    [now, goal].forEach((s) => { if (Math.abs(s.dist - previous) < 1) s.dist = fit; });
    if (tween && Math.abs(tween.to.dist - previous) < 1) tween.to.dist = fit;
    wake();
  }

  const target = new THREE.Vector3();
  const loopPitch = (PAD.half - PAD.radius) * 2 / LOOPS.side;
  function place() {
    const turn = now.az + sway * .11 * Math.sin(swayClock * .55);
    spin.rotation.y = -turn;
    target.set(now.tx, now.ty, 0).applyAxisAngle(THREE.Object3D.DEFAULT_UP, -turn);
    camera.position.set(target.x, target.y + Math.sin(now.el) * now.dist, target.z + Math.cos(now.el) * now.dist);
    camera.lookAt(target);
    // Modelled loops once one is about three pixels wide; the margin stops flicker.
    const loopPixels = loopPitch * canvas.height / (2 * now.dist * Math.tan(FOV * Math.PI / 360));
    if (near.visible ? loopPixels < 2.8 : loopPixels > 3.3) { near.visible = !near.visible; far.visible = !near.visible; }
  }

  /* ----- loop: only while visible, and only while something is moving ----- */
  let running = false, raf = 0, last = 0, dirty = true;
  function wake() { dirty = true; if (running && !raf) raf = requestAnimationFrame(tick); }
  function tick(time) {
    raf = 0;
    if (!running) return;
    const dt = Math.min(.05, (time - last) / 1000 || .016);
    last = time;
    let moving = false;

    if (tween) {
      const p = clamp((time - tween.start) / tween.duration, 0, 1);
      const e = tween.ease(p);
      for (const k in tween.to) { now[k] = lerp(tween.from[k], tween.to[k], e); goal[k] = now[k]; }
      if (p >= 1) tween = null;
      moving = true;
    } else {
      if (Math.abs(velocity) > .002 && !dragging) {
        goal.az += velocity * dt;
        velocity *= Math.exp(-dt / .24);
        moving = true;
      }
      const k = 1 - Math.exp(-dt / .085);
      for (const key in goal) {
        const delta = goal[key] - now[key];
        if (Math.abs(delta) > (key === 'az' || key === 'el' ? .0004 : .02)) { now[key] += delta * k; moving = true; } else now[key] = goal[key];
      }
    }

    const wantSway = swaying && !tween ? 1 : 0;
    if (Math.abs(wantSway - sway) > .001) { sway += (wantSway - sway) * (1 - Math.exp(-dt / .7)); moving = true; } else sway = wantSway;
    if (sway > 0) { swayClock += dt; moving = true; }

    if (toneTo) {
      const p = clamp((time - toneStart) / 900, 0, 1), e = easeInOut(p);
      Object.keys(tone).forEach((k2) => tone[k2].lerpColors(toneFrom[k2], toneTo[k2], e));
      applyTone();
      if (p >= 1) toneTo = null;
      moving = true;
    }

    if (moving || dirty) {
      dirty = false;
      place();
      renderer.render(scene, camera);
    }
    if (moving) raf = requestAnimationFrame(tick);
  }
  function setRunning(on) {
    if (on === running) return;
    running = on;
    if (on) { last = performance.now(); resize(); wake(); if (!started) intro(); } else if (raf) { cancelAnimationFrame(raf); raf = 0; }
  }

  /* ----- first appearance: the pad turns in from its back ----- */
  let started = false;
  function intro() {
    started = true;
    const to = resolve(VIEWS.front);
    if (reduced) { Object.assign(now, to); Object.assign(goal, to); }
    else {
      Object.assign(now, { az: to.az - 2.5, el: .62, dist: fit * 1.5, tx: 0, ty: 0 });
      Object.assign(goal, now);
      tween = { from: { ...now }, to, start: performance.now() + 120, duration: 2400, ease: easeOut };
    }
    stage.classList.add('is-live');
    markView();
    wake();
  }

  /* ----- pointer: drag turns, two fingers pinch and pan, ctrl + wheel zooms ----- */
  const pointers = new Map();
  let pinch = null;
  let lastMove = 0;
  const ray = new THREE.Raycaster();
  const plane = new THREE.Plane();
  const hit = new THREE.Vector3();

  // Slides the point being looked at across the pad, in the direction of the drag.
  function pan(dx, dy) {
    const scale = 2 * now.dist * Math.tan(FOV * Math.PI / 360) / stage.clientHeight;
    goal.tx = clamp(goal.tx - dx * scale * Math.cos(now.az), -PAD.half, PAD.half);
    goal.ty = clamp(goal.ty + dy * scale, -PAD.half, PAD.half);
  }
  canvas.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button > 2) return;
    canvas.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY, t: event.timeStamp, pan: event.button === 2 || event.shiftKey });
    take();
    dragging = true;
    velocity = 0;
    stage.classList.add('is-grabbing');
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch = { gap: Math.hypot(a.x - b.x, a.y - b.y), dist: goal.dist };
    }
    wake();
  });
  canvas.addEventListener('pointermove', (event) => {
    const p = pointers.get(event.pointerId);
    if (!p) return;
    const dx = event.clientX - p.x, dy = event.clientY - p.y;
    const dt = Math.max(1, event.timeStamp - p.t) / 1000;
    p.x = event.clientX; p.y = event.clientY; p.t = event.timeStamp;
    lastMove = event.timeStamp;
    if (pointers.size === 1) {
      if (p.pan) pan(dx, dy);
      else {
        const turn = dx / stage.clientWidth * Math.PI * 1.15;
        goal.az -= turn;
        goal.el = clamp(goal.el + dy / stage.clientHeight * Math.PI * .9, -1.45, 1.45);
        velocity = lerp(velocity, -turn / dt, .35);
      }
    } else if (pinch) {
      const [a, b] = [...pointers.values()];
      const gap = Math.hypot(a.x - b.x, a.y - b.y);
      goal.dist = clamp(pinch.dist * pinch.gap / Math.max(gap, 1), MIN_DIST, fit * 1.15);
      pan(dx / 2, dy / 2);
    }
    wake();
  });
  const release = (event) => {
    if (!pointers.delete(event.pointerId)) return;
    if (pointers.size < 2) pinch = null;
    if (!pointers.size) {
      dragging = false;
      stage.classList.remove('is-grabbing');
      // A flick lets the pad coast a little; a drag that came to rest stays where it is.
      velocity = reduced || event.timeStamp - lastMove > 90 ? 0 : clamp(velocity, -4.5, 4.5);
    }
    wake();
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());
  canvas.addEventListener('wheel', (event) => {
    if (!event.ctrlKey && !event.metaKey) return;      // a plain wheel still scrolls the page
    event.preventDefault();
    zoomBy(Math.exp(event.deltaY * .01));
  }, { passive: false });
  // Double click: move in on that spot, or back out to the whole pad.
  canvas.addEventListener('dblclick', (event) => {
    if (goal.dist < fit * .6) { setView('front'); return; }
    const box = canvas.getBoundingClientRect();
    ray.setFromCamera(new THREE.Vector2((event.clientX - box.left) / box.width * 2 - 1, -(event.clientY - box.top) / box.height * 2 + 1), camera);
    plane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 0, 1).applyAxisAngle(THREE.Object3D.DEFAULT_UP, spin.rotation.y), new THREE.Vector3());
    if (!ray.ray.intersectPlane(plane, hit)) return;
    hit.applyAxisAngle(THREE.Object3D.DEFAULT_UP, -spin.rotation.y);
    take();
    goal.tx = clamp(hit.x, -PAD.half, PAD.half);
    goal.ty = clamp(hit.y, -PAD.half, PAD.half);
    goal.dist = Math.max(MIN_DIST, fit * .2);
    wake();
  });

  /* ----- buttons and keys ----- */
  stage.addEventListener('click', (event) => {
    const view = event.target.closest('[data-pad3d-view]');
    if (view) { setView(view.dataset.pad3dView); return; }
    const zoom = event.target.closest('[data-pad3d-zoom]');
    if (zoom) zoomBy(zoom.dataset.pad3dZoom === 'in' ? .62 : 1.6);
  });
  stage.addEventListener('keydown', (event) => {
    if (event.target.closest('button')) {
      // Arrow keys on a button here are not a request for the next picture.
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') event.stopPropagation();
      return;
    }
    const step = { ArrowLeft: ['az', .26], ArrowRight: ['az', -.26], ArrowUp: ['el', .18], ArrowDown: ['el', -.18] }[event.key];
    if (step) {
      event.preventDefault(); event.stopPropagation();
      take();
      goal[step[0]] += step[1];
      goal.el = clamp(goal.el, -1.45, 1.45);
      wake();
    } else if (event.key === '+' || event.key === '=') { event.preventDefault(); zoomBy(.72); }
    else if (event.key === '-') { event.preventDefault(); zoomBy(1.4); }
    else if (event.key === 'Home' || event.key === '0') { event.preventDefault(); setView('front'); }
  });

  canvas.addEventListener('webglcontextlost', (event) => { event.preventDefault(); stage.dataset.state = 'error'; });
  canvas.addEventListener('webglcontextrestored', () => { stage.dataset.state = 'ready'; wake(); });
  new ResizeObserver(resize).observe(stage);
  resize();

  const api = {
    setRunning,
    setVariant,
    view: setView,
    /* Where the camera is, and a way to put it somewhere exact (used for the stills
       of the model: the thumbnails in assets/img were taken from the front view). */
    pose: () => ({ ...now }),
    set(values) { take(); Object.assign(goal, values); Object.assign(now, goal); swaying = false; sway = 0; velocity = 0; wake(); }
  };
  stage.pad3d = api;
  return api;
}
