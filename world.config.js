// The whole world as data. Grid units 0..size on x (left→right) and z (top→bottom of the plan); zones are centred on (x, z).
// Zone order = walk-through order. The road is an S: Seed row (z 8, left→right), Expand row (z 16, right→left), Scale row (z 25, left→right).
export const WORLD = {
  title: 'Fitting Edge · Phased GTM',
  intro: 'See the Difference. Live the Upgrade. Walk the three-phase go-to-market plan: prove the product, build the channel, then scale the experience. Every building is one move in the plan.',
  size: 32,
  seed: 7,
  trees: 30,
  colors: {
    ground: '#2E3238', trim: '#C8A15A', floor: '#E9E6E0', haze: '#EEF0F2', path: '#1E1F22', pathEdge: '#C8A15A',
    accent: '#C8A15A', foliage: ['#7DA67F', '#6C9A70', '#8DB38A', '#5E8C66'],
  },
  // [x, z, w, d, colour]: the three phase districts
  areas: [[-1, 1, 34, 9.5, '#CFE3D4'], [-1, 10.5, 34, 7.5, '#D5E6F0'], [-1, 18, 34, 13, '#EADCC2']],
  // [x, z, w, d]: the S-shaped road (top-left corner + size)
  paths: [[-1, 7.3, 31, 1.4], [28.6, 7.3, 1.4, 9.4], [2, 15.3, 28, 1.4], [2, 15.3, 1.4, 10.4], [2, 24.3, 29, 1.4]],
  // Walk-through road: start point, row centre lines (z) and the x where the road turns down to the next row
  road: { start: [-0.5, 8], rows: [8, 16, 25], turns: [29.3, 2.7] },
  // Phase signs painted on the ground: [x, z, text, colour]
  phases: [[15.5, 9.75, 'Phase 1 · Seed · Months 1–6', '#5E8C66'], [15.5, 17.4, 'Phase 2 · Expand · Months 7–18', '#3F7FA6'], [15.5, 27.2, 'Phase 3 · Scale · Months 19–36', '#A67C3A']],
  // Brand monument at the start of the road
  monument: { x: 1.2, z: 4.2, title: 'Fitting Edge', tagline: 'See the Difference. Live the Upgrade.' },
  zones: [
    // ---------- SEED ----------
    { id: 'lab', name: 'Engineering Lab', kicker: 'SEED · MONTHS 1–6', x: 5.5, z: 4, w: 4, d: 3.2, h: 1.8, color: '#8A929C', roof: 'flat',
      blurb: '"Engineered for Indian Water." Polymer where it has a functional edge, reinforced interfaces where mechanical loads demand them, and premium finishes across the range. Nothing is claimed until product-specific tests back it.',
      facts: [['Taps & mixers', 'PTMT body or hybrid metal-core'], ['Showers', 'ABS, UV and hot-water tested'], ['Cartridges', 'POM precision parts'], ['Finishes', 'Matte black · brushed gold · graphite']] },
    { id: 'hardwater', name: 'Hard-Water Pilot Counter', kicker: 'SEED · MONTHS 1–6', x: 12.5, z: 4.5, w: 3.4, d: 3, h: 1.5, color: '#4BA3C7',
      blurb: 'Launch selected products in researched hard-water, high-potential clusters. Compact partner-hosted displays at sanitaryware dealers test demand before any showroom spend.',
      facts: [['Format', 'Dealer counter + sample display'], ['Validates', 'Demand, pricing, install quality'], ['Not yet', 'Standalone showrooms']] },
    { id: 'visualiser', name: 'My Bathroom, My Way', kicker: 'SEED · DIGITAL PLATFORM', x: 19.5, z: 4, w: 4, d: 3.2, h: 1.9, color: '#C8A15A', roof: 'flat',
      blurb: 'The Lenskart of bathrooms. Upgrade one zone at a time (Sink, Shower, Toilet & Hygiene, or the Complete Bath Edit), with compatibility checks and itemised prices for products, installation and service plans.',
      facts: [['Pick One', 'Single replacement'], ['Upgrade a Zone', 'Coordinated bundle'], ['Complete the Look', 'Multi-zone + install'], ['Flow', 'Look → products → quote → install']] },
    { id: 'pilots', name: 'Pilot Partners', kicker: 'SEED · MONTHS 1–6', x: 26.5, z: 4, w: 3.8, d: 3, h: 1.6, color: '#7FA38A',
      blurb: 'Pilot with plumbers, PG/hostel operators and affordable-housing partners to prove the proposition and the unit economics before expanding.',
      facts: [['Milestones', 'Product qualification, pilot conversion'], ['Gate', 'Viable unit economics'], ['Feedback', 'Customers, plumbers, dealers']] },
    // ---------- EXPAND ----------
    { id: 'dealers', name: 'Dealer Network', kicker: 'EXPAND · MONTHS 7–18', x: 25, z: 12.5, w: 4, d: 3, h: 1.7, color: '#5C6B7A',
      blurb: 'Expand dealers into more validated clusters, with sustainable trade terms and display support that reward actual sell-through.',
      facts: [['Retail margin', '28–32% (hypothesis to test)'], ['Tracks', 'Sell-through, reorder rate'], ['Mix scenario', '50% retail · 20% wholesale']] },
    { id: 'plumbers', name: 'Plumber Hub', kicker: 'EXPAND · MONTHS 7–18', x: 18.5, z: 12.5, w: 3.8, d: 3, h: 1.6, color: '#E08A3C', roof: 'flat',
      blurb: 'Win the plumber. Tamper-resistant QR codes on every eligible pack earn verified rewards, alongside installer certification and an installation toolkit.',
      facts: [['QR reward', '₹30–75/scan (hypothesis)'], ['Training', 'Compatibility, install, warranty'], ['Tracks', 'Active installers, repeat recs']] },
    { id: 'ecom', name: 'E-com & Quick-commerce', kicker: 'EXPAND · MONTHS 7–18', x: 12, z: 12.5, w: 3.6, d: 3, h: 1.5, color: '#6E7FB8', roof: 'flat',
      blurb: 'Design is the hook and proof converts. Pinterest moodboards inspire, Reels create desire, "Plastic? Prove It." builds trust and retargeting brings visitors back to saved designs. Easy-to-ship replacements go on e-com and quick-commerce.',
      facts: [['Pinterest', 'Inspire'], ['Reels', 'Create desire'], ['Proof content', 'Build trust'], ['Retargeting', 'Convert']] },
    { id: 'watersmart', name: 'Water-Smart & Repair Centre', kicker: 'EXPAND · SUSTAINABILITY', x: 5.5, z: 12.5, w: 4, d: 3, h: 1.6, color: '#3E8E7E',
      blurb: '"Small Change. Better Bathroom." Water-Smart bundles with verified flow performance, a repair-first service and spare parts that extend product life, plus modular upgrades that cut renovation waste.',
      facts: [['Bundle', 'Water-Smart Bathroom'], ['Service', 'Repair before replacement'], ['KPI', 'Repairs done, verified flow']] },
    // ---------- SCALE ----------
    { id: 'studio', name: 'Experience Studio', kicker: 'SCALE · MONTHS 19–36', x: 8, z: 20.5, w: 4.6, d: 3.4, h: 2.4, color: '#C8A15A', wall: '#2B2D31', roof: 'flat',
      blurb: 'Selected studios in metro and Tier-1 cities, opened only after demand, conversion and location economics are proven. Each is a design, demo and conversion hub, with assisted home consultations.',
      facts: [['Where', 'Metro + Tier-1'], ['Gate', 'Location-level contribution'], ['KPI', 'Sales per location']] },
    { id: 'b2b', name: 'B2B Projects', kicker: 'SCALE · MONTHS 19–36', x: 15.5, z: 20.5, w: 4.4, d: 3.4, h: 2.6, color: '#7B6E9E', roof: 'flat',
      blurb: 'Standardised Project Pro packages for builders, bulk fittings and maintenance contracts for hotels, modular refreshes for rental operators, and high-usage fittings for schools, malls and cinemas.',
      facts: [['Builders', 'Project orders'], ['Hotels', 'Bulk + recurring service'], ['Designers', 'Trade programme'], ['Mix scenario', '20% B2B']] },
    { id: 'global', name: 'Global Gateway', kicker: 'SCALE · MONTHS 19–36', x: 23.5, z: 20.5, w: 3.8, d: 3, h: 2, color: '#B0563F',
      blurb: 'After domestic validation: international OEM, licensing or distribution, and an assessment of GCC entry with the required approvals.',
      facts: [['Standards', 'BIS · WRAS · NSF · GSO'], ['First market', 'GCC (to assess)'], ['KPI', 'Compliance readiness']] },
    { id: 'home', name: 'Beautifully Sorted', kicker: 'THE OUTCOME', x: 29, z: 20.5, w: 3.6, d: 3, h: 1.8, color: '#4BA3C7',
      blurb: 'Engineered performance wins trust, design creates desire, modular bundles convert, installation and service keep the trust, and dealers, B2B and studios scale it. Each phase starts only when quality, demand and contribution targets are met.',
      facts: [['Demand', 'Lead → order, AOV'], ['Trust', 'Returns, leak complaints'], ['Service', 'First-time-fix rate'], ['Profit', 'Contribution after CAC']] },
  ],
};
