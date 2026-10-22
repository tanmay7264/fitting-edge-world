// World engine distilled from GCL Campus (site/scene.js). Everything visible comes from world.config.js.
import * as THREE from 'three';
import { MapControls } from 'three/addons/controls/MapControls.js';
import { WORLD } from './world.config.js';
import { makeInteriors } from './interiors.js';

const $ = s => document.querySelector(s);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const N = WORLD.size, C = N / 2;
const at = (x, z, y = 0) => new THREE.Vector3(x - C, y, z - C);   // grid units 0..N, centred at the origin
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Required credit (Tanmay's BM Ecosystem Builder). The world refuses to run if it is removed, hidden or changed.
const PORTFOLIO = 'https://www.tanmayportfolio.me/', REPO = 'https://github.com/tanmay7264/tanmays-bm-ecosystem-builder';
const CREDIT = `Built and designed by <a href="${PORTFOLIO}" target="_blank" rel="noopener">Tanmay</a> · <a href="${REPO}" target="_blank" rel="noopener">BM Ecosystem Builder</a>`;
const credit = document.createElement('p'); credit.className = 'card credit'; credit.innerHTML = CREDIT; document.body.append(credit);
const creditOk = () => {
  const el = document.querySelector('.credit'), s = el && getComputedStyle(el), r = el?.getBoundingClientRect();
  return !!el && el.isConnected && el.innerHTML === CREDIT && s.display !== 'none' && s.visibility === 'visible' && +s.opacity >= 0.9
    && r.width > 40 && r.height > 10 && r.right > 0 && r.bottom > 0 && r.left < innerWidth && r.top < innerHeight;
};
let creditTimer;
function creditError() {
  clearInterval(creditTimer); renderer?.setAnimationLoop(null);
  document.body.innerHTML = `<div class="credit-error" role="alert"><h1>Credit required</h1><p>This world was made with Tanmay's BM Ecosystem Builder, which requires the credit
    "Built and designed by Tanmay" with links to <a href="${PORTFOLIO}">${PORTFOLIO}</a> and <a href="${REPO}">${REPO}</a>.</p><p>Restore the credit to use this world.</p></div>`;
  throw new Error("Credit removed: Tanmay's BM Ecosystem Builder requires the credit to stay visible.");
}

const canvas = $('#scene');
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); }
catch { document.body.classList.add('no-webgl'); $('.nogl').hidden = false; throw new Error('No WebGL'); }
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0);                                   // sky gradient is CSS behind the canvas
renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(WORLD.colors.haze, N * 4.5, N * 6.5);

const mats = new Map();
const mat = (c, key = c) => { if (!mats.has(key)) mats.set(key, new THREE.MeshStandardMaterial({ color: c, roughness: 0.85 })); return mats.get(key); };
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const mesh = (geo, m, x = 0, y = 0, z = 0, shadow = true) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = shadow; o.receiveShadow = true; return o; };
const flat = (x, z, w, d, y, c) => scene.add(mesh(box(w, 0.02, d), mat(c), x - C + w / 2, y, z - C + d / 2, false));
let seed = WORLD.seed || 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647; // same world every visit

/* ---------- Camera: orthographic isometric, tilt locked, spin allowed ---------- */
const FR = N * 0.62, OFFSET = new THREE.Vector3(60, 52, 60), HOME_ZOOM = 0.9;
const camera = new THREE.OrthographicCamera(-FR, FR, FR, -FR, 30, 240);
camera.position.copy(OFFSET);
const controls = new MapControls(camera, canvas);
controls.enableDamping = !reduceMotion; controls.dampingFactor = 0.08;
controls.minZoom = 0.6; controls.maxZoom = 4; controls.zoomToCursor = true;
controls.minPolarAngle = controls.maxPolarAngle = new THREE.Spherical().setFromVector3(OFFSET).phi;

scene.add(new THREE.HemisphereLight('#E6EEFF', WORLD.colors.ground, 1.45));
const sun = new THREE.DirectionalLight('#FFF1DC', 2.1);
sun.position.set(N * 0.9, N * 1.4, N * 0.4); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -N, right: N, top: N, bottom: -N, near: 1, far: N * 4 });
sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.02; scene.add(sun);

/* ---------- Ground: presentation slab like an architect's model (layers never coplanar = no z-fight flicker) ---------- */
const SLAB = N + 10;
scene.add(mesh(box(SLAB, 0.06, SLAB), mat(WORLD.colors.ground), 0, -0.03, 0, false));
scene.add(mesh(box(SLAB + 0.04, 0.08, SLAB + 0.04), mat(WORLD.colors.trim), 0, -0.1, 0, false));
scene.add(mesh(box(SLAB, 0.9, SLAB), mat('#F3EFE7'), 0, -0.6, 0));
{ const floor = mesh(new THREE.PlaneGeometry(400, 400), mat(WORLD.colors.floor), 0, -1.2, 0, false); floor.rotation.x = -Math.PI / 2; scene.add(floor); }
for (const [x, z, w, d, c] of WORLD.areas || []) flat(x, z, w, d, 0.006, c);            // lawns, plazas, water, soil…
for (const [x, z, w, d] of WORLD.paths || []) { flat(x - 0.07, z - 0.07, w + 0.14, d + 0.14, 0.011, WORLD.colors.pathEdge || '#CDBFA6'); flat(x, z, w, d, 0.015, WORLD.colors.path); }

/* ---------- Zones: buildings (or any landmark) you can click ---------- */
const pickables = [], objects = {};
function signTexture(text, colour, px = 48) {
  const c = document.createElement('canvas'); c.width = 640; c.height = 108;
  const g = c.getContext('2d');
  g.fillStyle = colour; g.beginPath(); g.roundRect(4, 4, 632, 100, 18); g.fill();
  g.fillStyle = '#FFFFFF'; g.font = `700 ${px}px Inter, Arial, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text.toUpperCase(), 320, 58, 600);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
// Interior: floor, two full back walls (away from the camera, brand trim), two low front walls with a door gap, then props.
const INTERIORS = makeInteriors({ THREE, mesh, mat, box, rnd, signTexture });
function room(id, g, w, d, h, trimColour) {
  const inside = new THREE.Group(), walls = new THREE.Group(), props = new THREE.Group();
  inside.visible = false; g.add(inside); inside.add(walls, props);
  const wallMat = mat('#F6F1E8', 'wall'), trim = mat(trimColour);
  inside.add(mesh(box(w - 0.06, 0.04, d - 0.06), mat('#E9E4DA'), 0, 0.02, 0, false));
  const H = h * 0.95;
  const wall = (axis, pos, len, hh, gap) => {
    for (const [a, b] of gap == null ? [[-len / 2, len / 2]] : [[-len / 2, gap - 0.42], [gap + 0.42, len / 2]]) {
      const L = b - a, c = (a + b) / 2;
      walls.add(axis === 'x' ? mesh(box(L, hh, 0.08), wallMat, c, hh / 2, pos) : mesh(box(0.08, hh, L), wallMat, pos, hh / 2, c));
      if (hh > 0.5) walls.add(axis === 'x' ? mesh(box(L, 0.06, 0.1), trim, c, hh, pos) : mesh(box(0.1, 0.06, L), trim, pos, hh, c));
    }
  };
  wall('x', -d / 2 + 0.04, w, H); wall('z', -w / 2 + 0.04, d, H);           // back walls
  wall('x', d / 2 - 0.04, w, 0.3, 0); wall('z', w / 2 - 0.04, d, 0.3);      // low front walls, door gap facing the road
  const fx = INTERIORS[id](props, w, d, h);
  return { inside, walls, props, fx };
}
// Each building: plinth + an outer shell (own fading materials) that opens up to show the room inside.
for (const z of WORLD.zones) {
  const { id, x, z: zz, w, d, h, roof = 'hip', color } = z;
  const g = new THREE.Group(); g.position.copy(at(x, zz)); scene.add(g);
  const ext = new THREE.Group(), roofG = new THREE.Group(), shellMats = [];
  const sm = (c, basic) => { const m = new (basic ? THREE.MeshBasicMaterial : THREE.MeshStandardMaterial)({ color: c, roughness: 0.85, transparent: true }); shellMats.push(m); return m; };
  const body = mesh(box(w, h, d), sm(z.wall || '#F6F1E8'), 0, h / 2, 0);
  g.add(mesh(box(w + 0.2, 0.14, d + 0.2), mat('#D6CCBA'), 0, 0.07, 0), ext); ext.add(body, roofG);
  const glass = sm('#9CC3DE');
  for (let i = 0; i < Math.floor(w / 0.9); i++) {                                       // windows on the two camera-facing walls
    const wx = -w / 2 + 0.45 + i * 0.9 + (w % 0.9) / 2;
    if (Math.abs(wx) > 0.4) ext.add(mesh(box(0.42, h * 0.32, 0.04), glass, wx, h * 0.55, d / 2 + 0.02, false));
  }
  for (let i = 0; i < Math.floor(d / 0.9); i++) {
    const wz = -d / 2 + 0.45 + i * 0.9 + (d % 0.9) / 2;
    ext.add(mesh(box(0.04, h * 0.32, 0.42), glass, w / 2 + 0.02, h * 0.55, wz, false));
  }
  ext.add(mesh(box(0.5, h * 0.45, 0.05), sm('#6B5A48'), 0, h * 0.225, d / 2 + 0.03, false)); // door, faces +z (the road)
  let top;
  if (roof === 'flat') { roofG.add(mesh(box(w + 0.16, 0.18, d + 0.16), sm(color), 0, h + 0.09, 0)); top = h + 0.18; }
  else { const rh = Math.min(w, d) * 0.45, geo = new THREE.ConeGeometry(1, rh, 4); geo.rotateY(Math.PI / 4); const r = mesh(geo, sm(color), 0, h + rh / 2, 0); r.scale.set(w / 1.414 * 1.12, 1, d / 1.414 * 1.12); roofG.add(r); top = h + rh; }
  const signMat = sm('#FFFFFF', true); signMat.map = signTexture(z.name, color);
  ext.add(mesh(new THREE.PlaneGeometry(Math.min(w * 0.8, 3), 0.5), signMat, 0, h * 0.86, d / 2 + 0.05, false));
  const o = objects[id] = { group: g, body, ext, roofG, shellMats, size: new THREE.Vector3(w, h, d), baseTop: top + 0.3, top: at(x, zz, top + 0.3), r: Math.max(w, d) * 0.75, open: 0, p: 0, c: 0 };
  if (INTERIORS[id]) Object.assign(o, room(id, g, w, d, h, color));
  g.traverse(m => { if (m.isMesh) { m.userData.id = id; pickables.push(m); } });
}

/* ---------- Brand monument + phase signs painted on the ground ---------- */
const plane = (w, d, tex) => new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
if (WORLD.monument) {
  const { x, z, title, tagline } = WORLD.monument, g = new THREE.Group(); g.position.copy(at(x, z)); scene.add(g);
  g.add(mesh(box(2.7, 0.2, 1.1), mat(WORLD.colors.trim), 0, 0.1, 0), mesh(box(2.4, 1.4, 0.36), mat('#1E1F22'), 0, 0.9, 0));
  const t = plane(2.2, 0.38, signTexture(title, '#1E1F22')); t.position.set(0, 1.2, 0.19);
  const l = plane(2.2, 0.37, signTexture(tagline, WORLD.colors.trim, 30)); l.position.set(0, 0.72, 0.19);
  g.add(t, l);
}
for (const [x, z, text, c] of WORLD.phases || []) {
  const p = plane(7, 1.18, signTexture(text, c, 40)); p.rotation.x = -Math.PI / 2; p.position.copy(at(x, z, 0.03)); scene.add(p);
}

/* ---------- Nature + furniture: collision-aware seeded scatter (never on paths or zones) ---------- */
const keepClear = [...(WORLD.monument ? [[WORLD.monument.x - 1.4, WORLD.monument.z - 1, 2.8, 2]] : []), ...(WORLD.phases || []).map(([x, z]) => [x - 3.6, z - 0.6, 7.2, 1.2])];
const blocked = (x, z, pad) => [...WORLD.zones.map(o => [o.x - o.w / 2, o.z - o.d / 2, o.w, o.d]), ...(WORLD.paths || []), ...keepClear]
  .some(([bx, bz, bw, bd]) => x > bx - pad && x < bx + bw + pad && z > bz - pad && z < bz + bd + pad);
const trees = [];
for (let tries = 0; trees.length < (WORLD.trees ?? 40) && tries < 4000; tries++) {
  const x = rnd() * (N + 4) - 2, z = rnd() * (N + 4) - 2;
  if (!blocked(x, z, 0.9) && trees.every(([a, b]) => Math.hypot(a - x, b - z) > 1.3)) trees.push([x, z]);
}
const inst = (geo, m, list, fn) => {
  const im = new THREE.InstancedMesh(geo, m, list.length); im.castShadow = true; im.receiveShadow = true;
  const o = new THREE.Object3D(); list.forEach((v, i) => { o.position.set(0, 0, 0); o.scale.set(1, 1, 1); const col = fn(o, v, i); o.updateMatrix(); im.setMatrixAt(i, o.matrix); if (col) im.setColorAt(i, new THREE.Color(col)); });
  scene.add(im); return im;
};
const white = new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.9, flatShading: true }); // instance colours tint it
inst(new THREE.CylinderGeometry(0.08, 0.12, 0.8, 6), mat('#7A5A3E'), trees, (o, [x, z]) => { o.position.copy(at(x, z, 0.4)); });
inst(new THREE.IcosahedronGeometry(0.62, 0), white, trees, (o, [x, z]) => { o.position.copy(at(x, z, 1.15)); o.scale.setScalar(0.8 + rnd() * 0.5); return WORLD.colors.foliage[Math.floor(rnd() * WORLD.colors.foliage.length)]; });

/* ---------- Selection: outline, bobbing pin, pulsing ring, smooth fly-to ---------- */
const ACCENT = WORLD.colors.accent;
const pin = new THREE.Group(), pinMat = new THREE.MeshStandardMaterial({ color: ACCENT, roughness: 0.4 });
{ const tip = mesh(new THREE.ConeGeometry(0.22, 0.55, 20), pinMat, 0, 0.36, 0); tip.rotation.x = Math.PI; pin.add(mesh(new THREE.SphereGeometry(0.28, 20, 14), pinMat, 0, 0.72, 0), tip); }
const marker = new THREE.Group(); marker.add(pin); marker.visible = false; scene.add(marker);
const ring = new THREE.Mesh(new THREE.RingGeometry(1, 1.1, 56), new THREE.MeshBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.6 }));
ring.rotation.x = -Math.PI / 2; ring.visible = false; scene.add(ring);
let outline = null, selected = null, anim = null;
const offset = () => camera.position.clone().sub(controls.target);
const tween = (toT, toZ, toOff = null) => { anim = { t: reduceMotion ? 1 : 0, fromT: controls.target.clone(), toT, fromZ: camera.zoom, toZ, fromOff: offset(), toOff }; };

function select(id) {
  if (id && !objects[id]) id = null;
  selected = id;
  if (outline) { outline.parent.remove(outline); outline.geometry.dispose(); outline = null; }
  const o = objects[id];
  ring.visible = marker.visible = !!o;
  if (o) {
    outline = new THREE.LineSegments(new THREE.EdgesGeometry(box(o.size.x + 0.14, o.size.y, o.size.z + 0.14)), new THREE.LineBasicMaterial({ color: ACCENT }));
    outline.position.y = o.size.y / 2; o.group.add(outline);
    marker.position.copy(o.top); ring.position.set(o.group.position.x, 0.04, o.group.position.z); ring.scale.setScalar(o.r);
    tween(o.group.position.clone().setY(0), Math.max(camera.zoom, 2.2));
  }
  renderPanel();
  history.replaceState(null, '', id ? '#' + id : location.pathname);
}

/* ---------- Info panel (HTML card over the canvas) ---------- */
const panel = $('#panel');
function renderPanel() {
  const z = WORLD.zones.find(o => o.id === selected);
  panel.innerHTML = z
    ? `<small class="kicker" style="color:${z.color}">${esc(z.kicker || WORLD.title)}</small><h2>${esc(z.name)}</h2><p>${esc(z.blurb || '')}</p>
       ${z.facts ? `<dl>${z.facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}
       <button class="btn" data-close>Back to overview</button>`
    : `<small class="kicker">WELCOME</small><h2>${esc(WORLD.title)}</h2><p>${esc(WORLD.intro)}</p>
       <ul>${WORLD.zones.map(o => `<li><button data-select="${o.id}"><i style="background:${o.color}"></i>${esc(o.name)}</button></li>`).join('')}</ul>
       <p class="muted">Click any building · drag to pan · scroll to zoom</p>`;
}
document.addEventListener('click', e => {
  if (e.target.closest('[data-tour]')) return tour.on ? pauseTour() : playTour();
  if (e.target.closest('.maplabel, [data-select], [data-close], [data-action]')) pauseTour();
  const s = e.target.closest('[data-select]'); if (s) return select(s.dataset.select);
  if (e.target.closest('[data-close]')) { select(null); tween(new THREE.Vector3(), HOME_ZOOM, OFFSET.clone()); }
  const a = e.target.closest('[data-action]')?.dataset.action;
  if (a === 'zoomin' || a === 'zoomout') tween(controls.target.clone(), THREE.MathUtils.clamp(camera.zoom * (a === 'zoomin' ? 1.3 : 1 / 1.3), controls.minZoom, controls.maxZoom));
  if (a === 'spin') tween(controls.target.clone(), camera.zoom, offset().applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 4));
  if (a === 'home') tween(new THREE.Vector3(), HOME_ZOOM, OFFSET.clone());
});
addEventListener('keydown', e => { if (e.key === 'Escape') { pauseTour(); select(null); } });

/* ---------- Picking + hover ---------- */
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
const pickAt = e => {
  const r = canvas.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  return ray.intersectObjects(pickables, false)[0]?.object.userData.id ?? null;
};
let down = null, hovered = null;
canvas.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; anim = null; pauseTour(); });
canvas.addEventListener('wheel', () => pauseTour(), { passive: true });
canvas.addEventListener('pointerup', e => { if (down && Math.hypot(e.clientX - down[0], e.clientY - down[1]) < 5) select(pickAt(e)); down = null; }); // a click, not a drag
canvas.addEventListener('pointermove', e => {
  if (e.buttons) return;
  const id = pickAt(e); if (id === hovered) return;
  objects[hovered]?.body.material.emissive.set('#000000');
  hovered = id; objects[id]?.body.material.emissive.set(ACCENT).multiplyScalar(0.12);
  canvas.style.cursor = id ? 'pointer' : '';
});

/* ---------- HTML labels pinned to 3D anchors, decluttered every frame ---------- */
const labels = WORLD.zones.map(z => {
  const el = document.createElement('button'); el.type = 'button'; el.className = 'maplabel';
  el.innerHTML = `<i style="background:${z.color}"></i>${esc(z.name)}`;
  el.addEventListener('click', () => select(z.id)); $('#labels').append(el);
  return { id: z.id, el, anchor: objects[z.id].top, x: 0, y: 0, w: 0, h: 0 };
});
let measured = 0, panels = [];
function declutter() {             // selected label first; hide any that would overlap a placed label, a UI card or the edge
  if (performance.now() - measured > 400) {
    measured = performance.now();
    for (const l of labels) { l.w = l.el.offsetWidth; l.h = l.el.offsetHeight; }
    panels = [...document.querySelectorAll('.card')].map(e => e.getBoundingClientRect()).filter(r => r.width);
  }
  const placed = [], cw = canvas.clientWidth, ch = canvas.clientHeight;
  for (const l of [...labels].sort((a, b) => (b.id === selected) - (a.id === selected))) {
    const r = { left: l.x - l.w / 2 - 3, top: l.y - l.h - 9, right: l.x + l.w / 2 + 3, bottom: l.y + 3 };
    const hit = q => r.left < q.right && r.right > q.left && r.top < q.bottom && r.bottom > q.top;
    const off = !l.w || r.left < 0 || r.right > cw || r.top < 0 || r.bottom > ch || panels.some(hit) || placed.some(hit);
    l.el.classList.toggle('hid', off); l.el.classList.toggle('on', l.id === selected);
    if (!off) placed.push(r);
  }
}

/* ---------- Walk-through: a customer and a plumber walk the GTM road, stopping at each zone in config order ---------- */
const SKIN = ['#E8B992', '#C98E63', '#A66E47', '#8A5A3B'];
const cap = (r, l) => new THREE.CapsuleGeometry(r, l, 3, 8), ball = r => new THREE.SphereGeometry(r, 14, 10);
function person(shirt, pants, hair) {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body); g.scale.setScalar(1.25);
  const skin = mat(SKIN[Math.floor(rnd() * SKIN.length)]), top = mat(shirt), legM = mat(pants), shoe = mat('#2B2530');
  const legs = [], arms = [];
  for (const side of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(0, 0.46, side * 0.055);
    hip.add(mesh(cap(0.043, 0.15), legM, 0, -0.11, 0));
    const knee = new THREE.Group(); knee.position.y = -0.22; hip.add(knee);
    knee.add(mesh(cap(0.037, 0.14), legM, 0, -0.1, 0), mesh(box(0.11, 0.045, 0.066), shoe, 0.026, -0.215, 0));
    body.add(hip); legs.push({ hip, knee });
  }
  const torso = mesh(cap(0.1, 0.17), top, 0, 0.66, 0); torso.scale.set(0.7, 1, 1); body.add(torso);
  const head = new THREE.Group(); head.position.y = 0.97; body.add(head);
  const hairCap = mesh(new THREE.SphereGeometry(0.092, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), mat(hair), -0.01, 0.01, 0); hairCap.rotation.z = 0.45;
  head.add(mesh(ball(0.085), skin, 0, 0, 0), hairCap);
  for (const side of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(0, 0.82, side * 0.13);
    sh.add(mesh(cap(0.032, 0.13), top, 0, -0.09, 0));
    const el = new THREE.Group(); el.position.y = -0.19; sh.add(el);
    el.add(mesh(cap(0.028, 0.12), top, 0, -0.08, 0), mesh(ball(0.03), skin, 0, -0.17, 0));
    body.add(sh); arms.push({ sh, el });
  }
  scene.add(g);
  return { g, body, head, legs, arms, hairCap, pose: 'idle', phase: rnd() * 20 };
}
// Poses (from GCL): limbs hang along -y, so +z rotation swings them forward and -z bends a knee back.
function animate(r, t) {
  const k = t + r.phase, gest = Math.pow(Math.max(0, Math.sin(k * 0.8)), 3);
  let hip = [0, 0], knee = [0, 0], sh = [0.04, 0.04], el = [0.15, 0.15], y = 0, hy = Math.sin(k * 0.4) * 0.12;
  if (r.pose === 'walk') { const s = Math.sin(k * 7.5); hip = [0.5 * s, -0.5 * s]; knee = [-Math.max(0, -s) * 0.8, -Math.max(0, s) * 0.8]; sh = [-0.4 * s, 0.4 * s]; el = [0.35, 0.35]; y = Math.abs(Math.cos(k * 7.5)) * 0.02; hy = 0; }
  if (r.pose === 'talk') { sh = [0.1, 0.15 + gest * 0.9]; el = [0.25, 0.3 + gest * 0.9]; hy = Math.sin(k * 0.6) * 0.3; }
  if (r.pose === 'listen') { sh = [0.25, 0.25]; el = [0.9, 0.9]; }
  if (r.pose === 'present') { sh = [0.1 + gest * 0.5, 1.2]; el = [0.3 + gest * 0.6, 0.15]; hy = Math.sin(k * 0.7) * 0.45; }
  r.legs.forEach((l, i) => { l.hip.rotation.z = hip[i]; l.knee.rotation.z = knee[i]; });
  r.arms.forEach((a, i) => { a.sh.rotation.z = sh[i]; a.el.rotation.z = el[i]; });
  r.body.position.y = y; r.head.rotation.y = hy;
}
const customer = person('#4BA3C7', '#2F3B52', '#2B2023');
customer.arms[1].el.add(mesh(box(0.1, 0.14, 0.05), mat(WORLD.colors.trim), 0, -0.26, 0));          // shopping bag
const plumber = person('#E08A3C', '#26324A', '#1F1B2D');
plumber.hairCap.material = mat('#F2C14E');                                                          // hard hat
plumber.arms[1].el.add(mesh(box(0.18, 0.1, 0.07), mat('#B0563F'), 0, -0.24, 0));                    // toolbox

const R = WORLD.road, ROUTE = [R.start], STOPS = [];
let row = 0;
for (const z of WORLD.zones) {
  const r = Math.max(0, R.rows.findIndex(rz => rz > z.z));                                          // the road row in front of the zone
  for (; row < r; row++) ROUTE.push([R.turns[row], R.rows[row]], [R.turns[row], R.rows[row + 1]]);
  const door = [z.x, z.z + z.d / 2 + 0.3], inside = [z.x, z.z + z.d / 2 - 0.85];                    // in through the door, then back out
  ROUTE.push([z.x, R.rows[r]], door, inside); STOPS.push({ id: z.id, i: ROUTE.length - 1, look: at(z.x, z.z - z.d) });
  ROUTE.push(door, [z.x, R.rows[r]]);
}
const pts = ROUTE.map(([x, z]) => at(x, z)), L = [0];
for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + pts[i].distanceTo(pts[i - 1]));
const posAt = (s, out) => {
  let i = 0; while (i < L.length - 2 && L[i + 1] < s) i++;
  out.lerpVectors(pts[i], pts[i + 1], THREE.MathUtils.clamp((s - L[i]) / ((L[i + 1] - L[i]) || 1), 0, 1));
  return pts[i + 1].clone().sub(pts[i]);
};
const SPEED = 2.2, DWELL = 9, TRAIL = 0.8;
const tour = { on: false, k: 0, s: 0, phase: 'walk', dwell: 0 };
const tourEl = document.createElement('div'); tourEl.className = 'card tour'; document.body.append(tourEl);
function renderTour() {
  const z = tour.phase === 'dwell' && WORLD.zones.find(o => o.id === STOPS[tour.k].id);
  tourEl.innerHTML = `<button data-tour aria-label="${tour.on ? 'Pause' : 'Play'} walk-through">${tour.on ? 'II' : '▶'}</button>
    <div><small class="kicker">GTM WALK-THROUGH · ${tour.k + 1}/${STOPS.length}</small><b>${z ? esc(z.name) : tour.on ? 'Walking to ' + esc(WORLD.zones.find(o => o.id === STOPS[tour.k].id).name) : 'Play the customer + plumber journey'}</b></div>`;
}
function playTour() { tour.on = true; if (tour.phase === 'dwell') tour.dwell = Math.min(tour.dwell, 1.5); renderTour(); }
function pauseTour() { if (!tour.on) return; tour.on = false; renderTour(); }
const lp = new THREE.Vector3(), tp = new THREE.Vector3();
function updateTour(dt, t) {
  if (tour.on) {
    const target = L[STOPS[tour.k].i];
    if (tour.phase === 'walk') {
      tour.s = reduceMotion ? target : Math.min(target, tour.s + SPEED * dt);
      if (tour.s >= target) { tour.phase = 'dwell'; tour.dwell = DWELL; select(STOPS[tour.k].id); renderTour(); }
    } else if ((tour.dwell -= dt) <= 0) {
      tour.phase = 'walk';
      if (++tour.k >= STOPS.length) { tour.k = 0; tour.s = 0; select(null); tween(new THREE.Vector3(), HOME_ZOOM, OFFSET.clone()); } // loop from the monument
      renderTour();
    }
  }
  const walking = tour.on && tour.phase === 'walk', stop = STOPS[tour.k];
  const d1 = posAt(tour.s, lp), d2 = posAt(Math.max(0, tour.s - TRAIL), tp);
  customer.g.position.copy(lp); plumber.g.position.copy(tp);
  for (const [r, d, p] of [[customer, d1, lp], [plumber, d2, tp]]) {
    const to = tour.phase === 'dwell' ? stop.look.clone().sub(p) : d;
    if (to.lengthSq() > 1e-6) r.g.rotation.y = Math.atan2(-to.z, to.x);
    r.pose = walking ? 'walk' : tour.phase === 'dwell' ? (r === customer ? 'talk' : stop.id === 'plumbers' ? 'present' : 'listen') : 'idle';
    if (!reduceMotion) animate(r, t);
  }
  if (walking && !anim) {                                   // follow camera glides after the customer
    const before = controls.target.clone(); controls.target.lerp(lp.clone().setY(0), Math.min(1, dt * 2.5));
    camera.position.add(controls.target.clone().sub(before));
  }
}
// Which building the tour is in (or about to enter): it opens up as the walkers reach the door.
const tourHere = () => tour.on && (tour.phase === 'dwell' || L[STOPS[tour.k].i] - tour.s < 2) ? STOPS[tour.k].id : null;

/* ---------- Ambient life: a branded delivery van on the road, people chatting outside ---------- */
const VAN = [R.start]; R.rows.forEach((rz, i) => { if (i < R.turns.length) VAN.push([R.turns[i], rz], [R.turns[i], R.rows[i + 1]]); });
VAN.push(R.end);
const vpts = VAN.map(([x, z]) => at(x, z)), VL = [0];
for (let i = 1; i < vpts.length; i++) VL.push(VL[i - 1] + vpts[i].distanceTo(vpts[i - 1]));
const van = new THREE.Group(); scene.add(van);
{ const b = new THREE.Group(); b.position.y = 0.12; van.add(b);
  b.add(mesh(box(0.95, 0.5, 0.46), mat('#1E1F22'), -0.1, 0.3, 0), mesh(box(0.32, 0.38, 0.44), mat(WORLD.colors.trim), 0.5, 0.24, 0),
    mesh(box(0.04, 0.16, 0.38), mat('#9CC3DE', 'glass'), 0.66, 0.32, 0, false), mesh(box(0.96, 0.06, 0.47), mat(WORLD.colors.trim), -0.1, 0.36, 0, false));
  for (const [wx, wz] of [[-0.35, 0.22], [-0.35, -0.22], [0.42, 0.22], [0.42, -0.22]]) { const wh = mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.08, 12), mat('#2B2530'), wx, 0, wz); wh.rotation.x = Math.PI / 2; b.add(wh); }
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.14), new THREE.MeshBasicMaterial({ map: signTexture('Fitting Edge', '#1E1F22', 52), transparent: true })); logo.position.set(-0.1, 0.3, 0.235); b.add(logo); }
let vanS = 0, vanDir = 1;
function updateVan(dt) {
  vanS += vanDir * dt * 1.6;
  if (vanS > VL.at(-1) || vanS < 0) { vanDir *= -1; vanS = THREE.MathUtils.clamp(vanS, 0, VL.at(-1)); }
  let i = 0; while (i < VL.length - 2 && VL[i + 1] < vanS) i++;
  const dir = vpts[i + 1].clone().sub(vpts[i]).normalize().multiplyScalar(vanDir);
  van.position.lerpVectors(vpts[i], vpts[i + 1], (vanS - VL[i]) / ((VL[i + 1] - VL[i]) || 1));
  van.position.add(new THREE.Vector3(dir.z, 0, -dir.x).multiplyScalar(0.38));   // keep to the left lane, away from the walkers
  van.rotation.y = Math.atan2(-dir.z, dir.x);
}
const chatters = [];
for (const id of ['hardwater', 'pilots', 'plumbers', 'dealers', 'studio', 'b2b', 'global']) {
  const z = WORLD.zones.find(o => o.id === id); if (!z) continue;
  const cx = z.x + z.w / 2 + 0.75, cz = z.z + z.d / 2 - 0.4, SH = ['#4BA3C7', '#E08A3C', '#7FA38A', '#7B6E9E', '#C8A15A', '#B0563F'];
  [[-0.28, 0], [0.28, 0]].forEach(([dx], k) => {
    const r = person(id === 'plumbers' ? '#E08A3C' : SH[Math.floor(rnd() * SH.length)], k ? '#2F3B52' : '#5C6470', ['#2B2023', '#1F1B2D', '#6B4A2E'][k]);
    r.g.position.copy(at(cx + dx, cz)); r.g.rotation.y = k ? Math.PI : 0; r.pose = k ? 'listen' : 'talk'; chatters.push(r);
  });
}

function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight, a = w / h, fr = a < 1 ? FR / a * 0.75 : FR; // portrait: widen
  renderer.setSize(w, h, false);
  Object.assign(camera, { left: -fr * a, right: fr * a, top: fr, bottom: -fr }); camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(canvas); resize();
camera.zoom = HOME_ZOOM; camera.updateProjectionMatrix();

const v = new THREE.Vector3(), clock = new THREE.Clock(), BOUND = N * 0.55;
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
  if (anim) {                                              // 0.9s cubic ease-out
    anim.t = Math.min(1, anim.t + dt / 0.9); const k = 1 - Math.pow(1 - anim.t, 3);
    controls.target.lerpVectors(anim.fromT, anim.toT, k);
    const off = anim.toOff ? anim.fromOff.clone().lerp(anim.toOff, k).setLength(anim.fromOff.length()) : anim.fromOff;
    camera.position.copy(controls.target).add(off);
    camera.zoom = THREE.MathUtils.lerp(anim.fromZ, anim.toZ, k); camera.updateProjectionMatrix();
    if (anim.t >= 1) anim = null;
  }
  const before = controls.target.clone();                  // keep the world on screen
  controls.target.x = THREE.MathUtils.clamp(controls.target.x, -BOUND, BOUND);
  controls.target.z = THREE.MathUtils.clamp(controls.target.z, -BOUND, BOUND);
  camera.position.add(controls.target.clone().sub(before));
  controls.update();
  if (!reduceMotion) { pin.position.y = Math.sin(t * 2.4) * 0.12; ring.material.opacity = 0.35 + Math.sin(t * 2.4) * 0.25; }
  updateTour(dt, t);
  if (!reduceMotion) { updateVan(dt); for (const r of chatters) animate(r, t); }
  const here = tourHere(), open = tour.on ? here : selected;
  for (const z of WORLD.zones) {                           // open up: roof lifts, shell fades, walls rise, the room plays
    const o = objects[z.id]; if (!o.inside) continue;
    const want = z.id === open ? 1 : 0;
    o.open += (want - o.open) * (reduceMotion ? 1 : Math.min(1, dt * 2.5));
    const k = o.open;
    o.ext.visible = k < 0.99;
    for (const m of o.shellMats) { m.opacity = 1 - k; m.depthWrite = k < 0.5; }
    o.roofG.position.y = k * 1.6; o.body.castShadow = k < 0.5;
    o.top.y = o.baseTop + k * 1.6;                         // the label rises with the roof
    o.inside.visible = k > 0.01;
    o.walls.scale.y = Math.max(0.001, k); o.props.visible = k > 0.35;
    if (!o.inside.visible) { o.p = o.c = 0; continue; }
    if (z.id === here) o.p = tour.phase === 'dwell' ? 1 - tour.dwell / DWELL : 0;
    else { o.c += dt / DWELL; o.p = reduceMotion ? 1 : Math.min(1, o.c % 1.4); } // opened by a click: play, hold, replay
    o.fx(o.p, reduceMotion ? 0 : t);
  }
  if (selected) marker.position.copy(objects[selected].top);
  renderer.render(scene, camera);
  const w = canvas.clientWidth, h = canvas.clientHeight;
  for (const l of labels) {
    v.copy(l.anchor).project(camera); l.x = (v.x + 1) / 2 * w; l.y = (1 - v.y) / 2 * h;
    l.el.style.transform = `translate(${l.x.toFixed(1)}px, ${l.y.toFixed(1)}px) translate(-50%, -100%)`;
  }
  declutter();
});

select(location.hash.slice(1) || null);                    // deep links: #<zone-id>
renderTour(); if (!location.hash && !reduceMotion) setTimeout(playTour, 1500); // auto-play unless a deep link was opened
if (!creditOk()) creditError();
creditTimer = setInterval(() => { if (!creditOk()) creditError(); }, 1500);
// ponytail: client-side check only; anyone editing this file can strip it. Real enforcement = a license, not code.
