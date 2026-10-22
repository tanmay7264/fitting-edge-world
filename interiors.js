// What happens inside each building when it opens up (pattern from GCL Campus, design.md §5.5).
// INTERIORS[id](props, w, d, h) adds furniture to `props` (building-local, floor at y = 0, back walls at -z and -x,
// door gap at the front-centre of +z) and returns fx(p, t): p = 0..1 through the visit in 3 equal sub-steps, t = seconds.
export function makeInteriors({ THREE, mesh, mat, box, rnd, signTexture }) {
  const ease = x => 1 - Math.pow(1 - THREE.MathUtils.clamp(x, 0, 1), 3);
  const pop = (o, v) => { o.visible = v > 0.01; o.scale.setScalar(Math.max(0.001, v)); };
  const sub = p => Math.min(2, Math.floor(p * 3)), within = (p, i) => p * 3 - i;
  const grow = (o, v) => { o.scale.y = Math.max(0.001, ease(v)); };
  const cyl = (a, b, h, n = 12) => new THREE.CylinderGeometry(a, b, h, n);
  const glow = c => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0, roughness: 0.6 });
  const dropGeo = new THREE.SphereGeometry(0.028, 6, 4), drop = mat('#4BA3C7');
  const GOLD = '#C8A15A', BLACK = '#1E1F22', GRAPHITE = '#5C6470', WHITE = '#F2EEE6';

  const board = (props, wd, ht, x, y, z, axis = 'z', frame = GRAPHITE) => { // a board hung on a back wall
    const b = new THREE.Group(); b.position.set(x, y, z); if (axis === 'x') b.rotation.y = Math.PI / 2; props.add(b);
    b.add(mesh(box(wd + 0.1, ht + 0.1, 0.03), mat(frame), 0, 0, 0), mesh(box(wd, ht, 0.02), mat('#FFFFFF'), 0, 0, 0.02, false));
    return b;
  };
  const tile = (parent, c, x, y, wd = 0.2, ht = 0.16, m = mat(c)) => { const n = mesh(box(wd, ht, 0.012), m, x, y, 0.04, false); parent.add(n); return n; };
  const bars = (parent, hs, x0, y0, gap, c, wd = 0.16) => hs.map((hh, i) => { // a bar chart, each bar grows with scale.y
    const pv = new THREE.Group(); pv.position.set(x0 + i * gap, y0, 0.04); parent.add(pv);
    pv.add(mesh(box(wd, hh, 0.012), mat(Array.isArray(c) ? c[i % c.length] : c), 0, hh / 2, 0, false)); return pv;
  });
  const table = (props, w2, d2, x, z, top = '#B98A55') => props.add(mesh(box(w2 - 0.1, 0.4, d2 - 0.1), mat('#D9D6CF'), x, 0.2, z), mesh(box(w2, 0.05, d2), mat(top), x, 0.43, z));
  const tap = (parent, x, y, z, c = GOLD, s = 1) => { // a low-poly basin tap: body, spout, lever
    const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(s); parent.add(g);
    g.add(mesh(cyl(0.035, 0.045, 0.2), mat(c), 0, 0.1, 0, false), mesh(box(0.04, 0.035, 0.16), mat(c), 0, 0.19, 0.07, false), mesh(box(0.1, 0.025, 0.03), mat(c), 0, 0.23, -0.02, false));
    return g;
  };
  const gauge = (parent, x, y, z, axis, frame) => { // round dial on a wall; returns the needle (rotation.z sweeps)
    const b = board(parent, 0.7, 0.7, x, y, z, axis, frame);
    const dial = mesh(cyl(0.28, 0.28, 0.02, 28), mat('#FFFFFF'), 0, 0, 0.04, false); dial.rotation.x = Math.PI / 2; b.add(dial);
    [['#3E8E7E', 0.6], [GOLD, 0], ['#B0563F', -0.6]].forEach(([c, a]) => { const t = mesh(box(0.08, 0.03, 0.01), mat(c), Math.cos(Math.PI / 2 + a) * 0.22, Math.sin(Math.PI / 2 + a) * 0.22, 0.055, false); t.rotation.z = a; b.add(t); });
    const needle = new THREE.Group(); needle.position.z = 0.06; b.add(needle);
    needle.add(mesh(box(0.24, 0.025, 0.01), mat(BLACK), 0.12, 0, 0, false));
    return needle;
  };
  const stream = (parent, n, x, y, z, len, r = 0.06) => Array.from({ length: n }, (_, i) => { // falling water drops
    const a = i * 2.4, m = mesh(dropGeo, drop, x + Math.cos(a) * r * (i % 3) / 2, y, z + Math.sin(a) * r * (i % 3) / 2, false);
    Object.assign(m.userData, { y, len, ph: (i * 0.37) % 1 }); parent.add(m); return m;
  });
  const fall = (ds, t, n = ds.length, speed = 1.4) => ds.forEach((m, i) => { m.visible = i < n; m.position.y = m.userData.y - ((t * speed + m.userData.ph) % 1) * m.userData.len; });
  const label = (parent, text, c, x, y, z, wd = 1.2) => { const s = new THREE.Mesh(new THREE.PlaneGeometry(wd, wd * 0.17), new THREE.MeshBasicMaterial({ map: signTexture(text, c, 44), transparent: true })); s.position.set(x, y, z); parent.add(s); return s; };

  return {
    // Engineering Lab: test bench. Materials picked → pressure test → PASS.
    lab(props, w, d) {
      table(props, 2.4, 0.6, -0.1, -d / 2 + 0.5, '#8A929C');
      const sw = [[WHITE, 'PTMT'], ['#4BA3C7', 'ABS'], [BLACK, 'POM']].map(([c], i) => { const m = mesh(box(0.24, 0.24, 0.24), mat(c), -1.0 + i * 0.34, 0.58, -d / 2 + 0.5); props.add(m); return m; });
      const specimen = tap(props, 0.6, 0.45, -d / 2 + 0.45, GOLD, 1.6);
      const water = stream(props, 6, 0.6, 0.72, -d / 2 + 0.62, 0.25, 0.01);
      const needle = gauge(props, -w / 2 + 0.12, 1.15, -0.1, 'x', '#8A929C');
      label(props, 'Engineered for Indian Water', '#8A929C', 0.4, 1.5, -d / 2 + 0.1, 1.6);
      const passM = glow('#3E8E7E'), pass = mesh(new THREE.OctahedronGeometry(0.15), passM, 0.6, 1.1, -d / 2 + 0.45, false); props.add(pass);
      return (p, t) => {
        sw.forEach((m, i) => pop(m, ease(within(p, 0) * 2.4 - i * 0.35)));
        needle.rotation.z = Math.PI * 0.85 - ease(within(p, 1) * 1.5) * Math.PI * 0.7 + (sub(p) === 1 ? Math.sin(t * 25) * 0.04 : 0);
        fall(water, t, sub(p) >= 1 ? 6 : 0);
        specimen.rotation.y = sub(p) === 2 ? Math.sin(t * 1.5) * 0.4 : 0;
        pop(pass, ease(within(p, 2) * 2)); pass.rotation.y = t * 2; passM.emissiveIntensity = 0.4 + Math.sin(t * 4) * 0.2;
      };
    },
    // Hard-water pilot counter: sample wall → cluster map lights up → interest grows.
    hardwater(props, w, d) {
      const b = board(props, 2.2, 1.0, -0.3, 1.0, -d / 2 + 0.12, 'z', '#4BA3C7');
      const taps = [-0.8, -0.4, 0, 0.4, 0.8].map((x, i) => tap(b, x, -0.42, 0.05, [GOLD, BLACK, GRAPHITE][i % 3], 1.1));
      const dotM = glow('#4BA3C7'), dots = [[-0.7, 0.3], [-0.45, 0.2], [-0.2, 0.32], [0.3, 0.15], [0.55, 0.3], [0.8, 0.22]].map(([x, y]) => { const m = mesh(new THREE.SphereGeometry(0.05, 10, 8), dotM, x, y, 0.05, false); b.add(m); return m; });
      table(props, 1.4, 0.5, w / 2 - 0.85, -0.2, '#4BA3C7'); // dealer counter
      const ch = new THREE.Group(); ch.position.set(w / 2 - 0.85, 0.46, -0.2); props.add(ch);
      const interest = bars(ch, [0.18, 0.3, 0.45], -0.3, 0, 0.3, '#4BA3C7', 0.18);
      return (p, t) => {
        taps.forEach((g, i) => pop(g, ease(within(p, 0) * 2.4 - i * 0.25)));
        dots.forEach((m, i) => pop(m, sub(p) >= 1 ? ease(within(p, 1) * 2.4 - i * 0.2) * (1 + Math.sin(t * 4 + i) * 0.2) : 0));
        dotM.emissiveIntensity = 0.5;
        interest.forEach((pv, i) => grow(pv, within(p, 2) * 2.4 - i * 0.3));
      };
    },
    // My Bathroom, My Way: visualiser screen. Pick zones → swap finishes → itemised quote.
    visualiser(props, w, d) {
      const scr = board(props, 2.8, 1.3, -0.2, 1.15, -d / 2 + 0.12, 'z', BLACK);
      const zones = [['#CFE3D4', 'Sink'], ['#D5E6F0', 'Shower'], ['#EADCC2', 'Hygiene']].map(([c, n], i) => { const m = tile(scr, c, -0.9 + i * 0.9, 0.05, 0.8, 0.95); label(m, n, GRAPHITE, 0, 0.36, 0.01, 0.6); return m; });
      const fitM = glow(BLACK), fits = [-0.9, 0, 0.9].map(x => tile(scr, BLACK, x, -0.1, 0.36, 0.1, fitM));
      table(props, 1.2, 0.6, w / 2 - 0.8, -0.35, GOLD); // consultation desk
      const quoteM = glow('#FFFFFF'), quote = mesh(box(0.5, 0.02, 0.38), quoteM, w / 2 - 0.8, 0.47, -0.35, false); props.add(quote);
      const lines = [0, 1, 2, 3].map(i => { const l = mesh(box(0.34, 0.012, 0.035), mat(i === 3 ? GOLD : GRAPHITE), w / 2 - 0.8, 0.49, -0.48 + i * 0.09, false); props.add(l); return l; });
      const FIN = [BLACK, GOLD, GRAPHITE];
      return (p, t) => {
        zones.forEach((m, i) => pop(m, ease(within(p, 0) * 2.4 - i * 0.35)));
        fits.forEach(f => pop(f, ease(within(p, 1) * 3)));
        fitM.color.set(sub(p) >= 1 ? FIN[Math.floor(t * 1.2) % 3] : BLACK);
        pop(quote, ease(within(p, 2) * 2.5)); lines.forEach((l, i) => pop(l, ease(within(p, 2) * 2.5 - 0.3 - i * 0.25)));
        quoteM.emissive.set(GOLD); quoteM.emissiveIntensity = sub(p) === 2 ? 0.2 + Math.sin(t * 4) * 0.1 : 0;
      };
    },
    // Pilot Partners: a PG/hostel. Wash basins in → fittings installed → unit economics proven.
    pilots(props, w, d) {
      for (const zz of [-0.75, 0.45]) props.add( // bunk beds along the side wall
        mesh(box(0.6, 0.08, 1.0), mat('#7FA38A'), -w / 2 + 0.45, 0.35, zz), mesh(box(0.6, 0.08, 1.0), mat('#7FA38A'), -w / 2 + 0.45, 0.9, zz),
        mesh(box(0.05, 1.05, 0.05), mat(GRAPHITE), -w / 2 + 0.75, 0.52, zz - 0.47), mesh(box(0.05, 1.05, 0.05), mat(GRAPHITE), -w / 2 + 0.75, 0.52, zz + 0.47));
      const basins = [0.0, 0.75].map(x => { const g = new THREE.Group(); g.position.set(x, 0, -d / 2 + 0.3); props.add(g); g.add(mesh(box(0.1, 0.6, 0.1), mat('#D9D6CF'), 0, 0.3, 0), mesh(box(0.45, 0.12, 0.32), mat('#FFFFFF'), 0, 0.66, 0)); return g; });
      const taps = basins.map(g => tap(g, 0, 0.72, -0.1));
      const water = basins.map(g => stream(g, 4, 0, 0.9, -0.03, 0.18, 0.005));
      const b = board(props, 0.9, 0.75, w / 2 - 0.6, 1.25, -d / 2 + 0.12, 'z', '#7FA38A');
      const econ = bars(b, [0.2, 0.32, 0.46], -0.25, -0.3, 0.25, '#3E8E7E');
      return (p, t) => {
        basins.forEach((g, i) => pop(g, ease(within(p, 0) * 2.4 - i * 0.4)));
        taps.forEach((g, i) => pop(g, ease(within(p, 1) * 2.4 - i * 0.4)));
        water.forEach(ws => fall(ws, t, sub(p) >= 1 ? 4 : 0));
        econ.forEach((pv, i) => grow(pv, within(p, 2) * 2.4 - i * 0.3));
      };
    },
    // Dealer Network: stocked shelf → sell-through → reorders glow.
    dealers(props, w, d) {
      const sh = new THREE.Group(); sh.position.set(-0.4, 0, -d / 2 + 0.3); props.add(sh);
      sh.add(mesh(box(2.5, 1.3, 0.36), mat('#5C6B7A'), 0, 0.65, 0));
      const boxes = [];
      for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) { const m = mesh(box(0.3, 0.26, 0.2), glow([GOLD, BLACK, WHITE][(r + c) % 3]), -1.0 + c * 0.4, 0.27 + r * 0.42, 0.25, false); sh.add(m); boxes.push(m); }
      table(props, 1.2, 0.5, w / 2 - 0.75, 0.0, GOLD);
      const arrowM = glow('#3E8E7E'), arrow = mesh(new THREE.TorusGeometry(0.22, 0.045, 8, 28, Math.PI * 1.6), arrowM, w / 2 - 0.75, 0.95, 0.0, false); props.add(arrow);
      label(props, 'Sell-through · Reorders', '#5C6B7A', -0.4, 1.55, -d / 2 + 0.1, 1.5);
      return (p, t) => {
        boxes.forEach((m, i) => {
          const sold = sub(p) === 1 && i % 3 === 0 && within(p, 1) * 1.2 > (i % 6) / 6;
          pop(m, sold ? 0 : ease(within(p, 0) * 2.2 - (i % 6) * 0.12));
          m.material.emissiveIntensity = sub(p) === 2 && i % 3 === 0 ? 0.3 + Math.sin(t * 4) * 0.15 : 0;
        });
        pop(arrow, ease(within(p, 2) * 2)); arrow.rotation.z = -t * 2.5; arrowM.emissiveIntensity = 0.4;
      };
    },
    // Plumber Hub: toolkits handed out → QR scanned → rewards rain in.
    plumbers(props, w, d) {
      const b = board(props, 1.6, 1.1, -0.4, 1.05, -d / 2 + 0.12, 'z', '#E08A3C');
      const qr = [];
      for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) {
        const finder = (i < 2 && j < 2) || (i > 4 && j < 2) || (i < 2 && j > 4);
        if (finder || (i * 3 + j * 5 + i * j) % 3 === 0) qr.push(tile(b, BLACK, -0.62 + i * 0.09, 0.3 - j * 0.09, 0.08, 0.08));
      }
      [0.25, 0.1, -0.05, -0.2].forEach((y, i) => tile(b, i ? '#E8D9C8' : '#E08A3C', 0.35, y, 0.6 - i * 0.08, 0.06));
      table(props, 1.4, 0.5, w / 2 - 0.85, -0.5, '#B98A55');
      const kits = [-0.4, 0, 0.4].map(x => { const k = mesh(box(0.28, 0.16, 0.16), mat('#B0563F'), w / 2 - 0.85 + x, 0.54, -0.5); props.add(k); return k; });
      const coinM = glow(GOLD), coins = [0, 1, 2, 3, 4].map(i => { const c = mesh(cyl(0.09, 0.09, 0.03, 16), coinM, -0.6 + i * 0.28, 0, 0.3, false); c.rotation.x = Math.PI / 2; props.add(c); return c; });
      return (p, t) => {
        kits.forEach((k, i) => pop(k, ease(within(p, 0) * 2.4 - i * 0.35)));
        qr.forEach((m, i) => pop(m, ease(within(p, 1) * 3 - (i / qr.length) * 2)));
        coinM.emissiveIntensity = 0.4;
        coins.forEach((c, i) => { c.visible = sub(p) === 2; c.position.y = 0.4 + ((t * 0.6 + i * 0.2) % 1) * 1.1; c.rotation.z = t * 4 + i; });
      };
    },
    // E-com & Quick-commerce: Pinterest moodboard → Reels phone → parcels ship.
    ecom(props, w, d) {
      const b = board(props, 1.4, 1.1, -0.7, 1.05, -d / 2 + 0.12, 'z', '#6E7FB8');
      const TC = ['#CFE3D4', GOLD, '#4BA3C7', BLACK, '#EADCC2', '#B0563F', '#D5E6F0', '#7FA38A', '#8A929C'];
      const tiles = TC.map((c, i) => tile(b, c, -0.45 + (i % 3) * 0.45, 0.33 - Math.floor(i / 3) * 0.33, 0.38, 0.27 + (i % 2) * 0.03));
      const stand = new THREE.Group(); stand.position.set(0.95, 0, -d / 2 + 0.45); props.add(stand);
      stand.add(mesh(cyl(0.12, 0.16, 0.6), mat('#D9D6CF'), 0, 0.3, 0));
      const phM = glow('#6E7FB8'), ph = mesh(box(0.24, 0.42, 0.03), phM, 0, 0.85, 0, false); stand.add(ph);
      props.add(mesh(box(w - 0.6, 0.1, 0.36), mat(BLACK), 0, 0.33, -0.1)); // conveyor
      const parcels = [0, 1, 2, 3].map(() => { const m = mesh(box(0.24, 0.2, 0.24), mat(GOLD), 0, 0.48, -0.1, false); props.add(m); return m; });
      const RC = ['#6E7FB8', GOLD, '#4BA3C7'];
      return (p, t) => {
        tiles.forEach((m, i) => pop(m, ease(within(p, 0) * 2.6 - i * 0.15)));
        pop(ph, ease(within(p, 1) * 2.5)); ph.rotation.y = Math.sin(t * 1.5) * 0.4;
        phM.color.set(RC[Math.floor(t * 1.5) % 3]); phM.emissive.copy(phM.color); phM.emissiveIntensity = sub(p) >= 1 ? 0.35 : 0;
        const L = w - 0.9; parcels.forEach((m, i) => { m.visible = sub(p) === 2; m.position.x = -L / 2 + ((t * 0.35 + i / 4) % 1) * L; });
      };
    },
    // Water-Smart & Repair: heavy flow → water-smart flow (gauge drops) → repair-first + leaf.
    watersmart(props, w, d) {
      const sx = -w / 2 + 0.5, sz = -0.35;
      props.add(mesh(box(0.75, 0.05, 0.75), mat('#D5E6F0'), sx, 0.03, sz), mesh(cyl(0.02, 0.02, 1.55, 6), mat('#8A929C'), -w / 2 + 0.12, 0.8, sz), mesh(box(0.38, 0.02, 0.02), mat('#8A929C'), sx - 0.19, 1.57, sz));
      props.add(mesh(cyl(0.16, 0.11, 0.06, 16), mat(GOLD), sx, 1.53, sz));
      const water = stream(props, 16, sx, 1.48, sz, 1.4, 0.11);
      const needle = gauge(props, 0.5, 1.1, -d / 2 + 0.12, 'z', '#3E8E7E');
      label(props, 'Small Change. Better Bathroom.', '#3E8E7E', 0.5, 1.6, -d / 2 + 0.1, 1.5);
      table(props, 1.0, 0.5, w / 2 - 0.7, -0.55, '#3E8E7E');
      const wrench = new THREE.Group(); wrench.position.set(w / 2 - 0.7, 0.85, -0.55); props.add(wrench);
      wrench.add(mesh(box(0.45, 0.06, 0.06), mat('#8A929C'), 0, 0, 0, false), mesh(box(0.1, 0.16, 0.06), mat('#8A929C'), 0.24, 0, 0, false));
      const leafM = glow('#3E8E7E'), leafG = new THREE.Group(); leafG.position.set(w / 2 - 0.7, 1.3, -0.55); props.add(leafG);
      const leaf = mesh(new THREE.SphereGeometry(0.18, 10, 8), leafM, 0, 0, 0, false); leaf.scale.set(0.55, 1, 0.2); leaf.rotation.z = 0.6; leafG.add(leaf);
      return (p, t) => {
        fall(water, t, sub(p) === 0 ? 16 : 5, sub(p) === 0 ? 1.8 : 1.1);
        needle.rotation.z = Math.PI * 0.15 + ease(within(p, 1) * 2) * Math.PI * 0.6;
        pop(wrench, ease(within(p, 2) * 2)); wrench.rotation.z = Math.sin(t * 4) * 0.6;
        pop(leafG, ease(within(p, 2) * 2 - 0.3)); leafG.rotation.y = t; leafM.emissiveIntensity = 0.3 + Math.sin(t * 3) * 0.15;
      };
    },
    // Experience Studio: spotlit vignettes → finish swatches → sales per location.
    studio(props, w, d) {
      const vig = [-1.3, 0, 1.3].map((x, i) => {
        const g = new THREE.Group(); g.position.set(x, 0, -d / 2 + 0.4); props.add(g);
        g.add(mesh(box(1.0, 1.7, 0.06), mat([BLACK, '#EADCC2', GRAPHITE][i]), 0, 0.85, -0.2), mesh(box(0.12, 0.6, 0.12), mat(WHITE), 0, 0.3, 0.05), mesh(box(0.55, 0.14, 0.36), mat(WHITE), 0, 0.66, 0.05));
        const mir = mesh(cyl(0.22, 0.22, 0.02, 24), mat('#D5E6F0'), 0, 1.25, -0.15, false); mir.rotation.x = Math.PI / 2; g.add(mir);
        tap(g, 0, 0.73, -0.05, [GOLD, BLACK, GOLD][i]);
        return g;
      });
      const beamM = new THREE.MeshBasicMaterial({ color: '#FFF1C9', transparent: true, opacity: 0.2, depthWrite: false });
      const beams = vig.map(g => { const b = new THREE.Mesh(new THREE.ConeGeometry(0.55, 2.0, 20, 1, true), beamM); b.position.set(g.position.x, 1.0, g.position.z + 0.25); props.add(b); return b; });
      const ped = new THREE.Group(); ped.position.set(w / 2 - 0.65, 0, 0.2); props.add(ped);
      ped.add(mesh(cyl(0.25, 0.3, 0.6), mat(GOLD), 0, 0.3, 0));
      const sw = [BLACK, GOLD, GRAPHITE].map((c, i) => { const m = mesh(cyl(0.09, 0.09, 0.04, 16), mat(c), Math.cos(i * 2.09) * 0.14, 0.64, Math.sin(i * 2.09) * 0.14, false); ped.add(m); return m; });
      const b = board(props, 0.8, 0.75, -w / 2 + 0.12, 1.3, 0.7, 'x', GOLD);
      const sales = bars(b, [0.15, 0.28, 0.42], -0.24, -0.3, 0.24, GOLD);
      return (p, t) => {
        vig.forEach((g, i) => pop(g, ease(within(p, 0) * 2.4 - i * 0.35)));
        beams.forEach((bm, i) => { bm.visible = within(p, 0) * 2.4 - i * 0.35 > 0.6; });
        beamM.opacity = 0.16 + Math.sin(t * 2) * 0.04;
        ped.rotation.y = t * 0.8; sw.forEach((m, i) => pop(m, ease(within(p, 1) * 2.4 - i * 0.3)));
        sales.forEach((pv, i) => grow(pv, within(p, 2) * 2.4 - i * 0.3));
      };
    },
    // B2B Projects: project models rise → partner contracts → recurring service loop.
    b2b(props, w, d) {
      table(props, 2.0, 1.1, -0.6, -0.65, '#D9D6CF');
      const towers = [[-1.2, -0.9, 0.5], [-0.8, -0.45, 0.85], [-0.3, -0.9, 0.65], [0.0, -0.4, 0.45], [-0.6, -0.95, 0.35]].map(([x, z, hh]) => {
        const pv = new THREE.Group(); pv.position.set(x, 0.46, z); props.add(pv);
        pv.add(mesh(box(0.22, hh, 0.22), mat('#7B6E9E'), 0, hh / 2, 0), mesh(box(0.23, 0.04, 0.23), mat(GOLD), 0, hh, 0)); return pv;
      });
      const b = board(props, 1.3, 0.9, w / 2 - 0.85, 1.2, -d / 2 + 0.12, 'z', '#7B6E9E');
      const cards = [['#7B6E9E', 'Builders'], [GOLD, 'Hotels'], ['#4BA3C7', 'Institutions']].map(([c, n], i) => { const m = tile(b, c, -0.42 + i * 0.42, 0, 0.36, 0.5); label(m, n, GRAPHITE, 0, -0.32, 0.01, 0.4); return m; });
      props.add(mesh(cyl(0.1, 0.14, 0.5), mat('#D9D6CF'), w / 2 - 0.85, 0.25, -0.2));
      const loopM = glow(GOLD), loop = mesh(new THREE.TorusGeometry(0.28, 0.045, 8, 32, Math.PI * 1.7), loopM, w / 2 - 0.85, 0.9, -0.2, false); props.add(loop);
      return (p, t) => {
        towers.forEach((pv, i) => grow(pv, within(p, 0) * 2.2 - i * 0.2));
        cards.forEach((m, i) => pop(m, ease(within(p, 1) * 2.4 - i * 0.3)));
        pop(loop, ease(within(p, 2) * 2)); loop.rotation.z = -t * 2; loopM.emissiveIntensity = 0.35;
      };
    },
    // Global Gateway: globe → India-to-GCC route → certification badges.
    global(props, w, d) {
      const gx = -0.5, gz = -0.45;
      props.add(mesh(cyl(0.2, 0.28, 0.45), mat('#D9D6CF'), gx, 0.22, gz));
      const globe = new THREE.Group(); globe.position.set(gx, 1.0, gz); props.add(globe);
      const spin = new THREE.Group(); globe.add(spin);
      spin.add(mesh(new THREE.SphereGeometry(0.48, 24, 16), mat('#4BA3C7'), 0, 0, 0));
      const eq = mesh(new THREE.TorusGeometry(0.5, 0.01, 6, 48), mat(WHITE), 0, 0, 0, false); eq.rotation.x = Math.PI / 2; spin.add(eq);
      const ll = (lat, lon, r) => new THREE.Vector3().setFromSphericalCoords(r, THREE.MathUtils.degToRad(90 - lat), THREE.MathUtils.degToRad(lon));
      const IN = ll(21, 78, 0.5), GCC = ll(24, 50, 0.5);
      const pinM = glow(GOLD), pins = [IN, GCC].map(v => { const m = mesh(new THREE.SphereGeometry(0.055, 10, 8), pinM, v.x, v.y, v.z, false); spin.add(m); return m; });
      const curve = new THREE.QuadraticBezierCurve3(IN, IN.clone().add(GCC).multiplyScalar(0.5).setLength(0.85), GCC);
      const arcGeo = new THREE.TubeGeometry(curve, 32, 0.016, 6), arc = mesh(arcGeo, glow(GOLD), 0, 0, 0, false); arc.material.emissiveIntensity = 0.5; spin.add(arc);
      spin.rotation.y = -1.2;
      const b = board(props, 1.5, 0.75, w / 2 - 1.0, 1.15, -d / 2 + 0.12, 'z', '#B0563F');
      const badges = [['BIS', '#B0563F'], ['WRAS', '#4BA3C7'], ['NSF', '#3E8E7E'], ['GSO', GOLD]].map(([n, c], i) => {
        const m = mesh(cyl(0.15, 0.15, 0.02, 24), mat(c), -0.54 + i * 0.36, 0.08, 0.05, false); m.rotation.x = Math.PI / 2; b.add(m);
        label(b, n, c, -0.54 + i * 0.36, -0.22, 0.05, 0.34); return m;
      });
      return (p, t) => {
        pop(globe, ease(within(p, 0) * 2)); spin.rotation.y = -1.2 + Math.sin(t * 0.4) * 0.5;
        pins.forEach(m => pop(m, sub(p) >= 1 ? 1 + Math.sin(t * 5) * 0.25 : 0)); pinM.emissiveIntensity = 0.5;
        arc.visible = sub(p) >= 1; arcGeo.setDrawRange(0, Math.floor(arcGeo.index.count * ease(within(p, 1) * 1.5) / 3) * 3);
        badges.forEach((m, i) => pop(m, ease(within(p, 2) * 2.4 - i * 0.3)));
      };
    },
    // Beautifully Sorted: the upgraded bathroom, zone by zone, then sparkle.
    home(props, w, d) {
      props.add(mesh(box(w - 0.2, 0.012, d - 0.2), mat('#E8E2D6'), 0, 0.05, 0, false));
      const sink = new THREE.Group(); sink.position.set(-w / 2 + 0.7, 0, -d / 2 + 0.35); props.add(sink);
      sink.add(mesh(box(0.8, 0.6, 0.4), mat(BLACK), 0, 0.3, 0), mesh(box(0.7, 0.08, 0.38), mat('#FFFFFF'), 0, 0.64, 0));
      const mir = mesh(cyl(0.25, 0.25, 0.02, 24), mat('#D5E6F0'), 0, 1.2, -0.17, false); mir.rotation.x = Math.PI / 2; sink.add(mir, mesh(new THREE.TorusGeometry(0.26, 0.02, 6, 32), mat(GOLD), 0, 1.2, -0.16, false));
      tap(sink, 0, 0.68, -0.1);
      const wc = new THREE.Group(); wc.position.set(0.15, 0, -d / 2 + 0.35); props.add(wc);
      wc.add(mesh(cyl(0.17, 0.13, 0.38, 16), mat('#FFFFFF'), 0, 0.19, 0.08), mesh(box(0.42, 0.42, 0.14), mat('#FFFFFF'), 0, 0.55, -0.1), mesh(box(0.06, 0.12, 0.05), mat(GOLD), 0.32, 0.55, -0.12));
      const shower = new THREE.Group(); shower.position.set(w / 2 - 0.6, 0, -d / 2 + 0.6); props.add(shower);
      shower.add(mesh(box(0.9, 0.06, 0.9), mat('#FFFFFF'), 0, 0.03, 0));
      shower.add(mesh(box(0.02, 1.5, 0.85), new THREE.MeshStandardMaterial({ color: '#BFE0EE', transparent: true, opacity: 0.35, roughness: 0.1 }), -0.45, 0.8, 0, false));
      shower.add(mesh(cyl(0.02, 0.02, 1.5, 6), mat(GOLD), 0.3, 0.8, -0.4), mesh(cyl(0.14, 0.1, 0.05, 16), mat(GOLD), 0.1, 1.5, -0.25, false));
      const water = stream(shower, 10, 0.1, 1.45, -0.25, 1.35, 0.1);
      const spark = Array.from({ length: 18 }, () => { const m = mesh(new THREE.OctahedronGeometry(0.05), glow(GOLD), (rnd() - 0.5) * (w - 0.6), 0.4 + rnd() * 1.2, (rnd() - 0.5) * (d - 0.8), false); m.material.emissiveIntensity = 0.6; m.userData.ph = rnd() * 6; props.add(m); return m; });
      return (p, t) => {
        pop(sink, ease(within(p, 0) * 2));
        pop(shower, ease(within(p, 1) * 2)); pop(wc, ease(within(p, 1) * 2 - 0.5));
        fall(water, t, sub(p) >= 1 ? 10 : 0);
        spark.forEach(m => { m.visible = sub(p) === 2; m.scale.setScalar(0.5 + Math.abs(Math.sin(t * 3 + m.userData.ph))); m.rotation.y = t * 2; });
      };
    },
  };
}
