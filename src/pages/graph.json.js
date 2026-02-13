/* src/pages/graph.json.js — Self-Organising Nebula */
import { getCollection } from 'astro:content';
import { readFileSync } from 'fs';

export async function GET() {
  const posts = await getCollection('garden');

  const nodes = [];
  const links = [];
  const existingSlugs = new Set();

  // --- TELEMETRY: Load cost data from static file ---
  let costMap = new Map();
  try {
    const telemetryData = JSON.parse(readFileSync('./public/telemetry.json', 'utf-8'));
    if (telemetryData.projects) {
      telemetryData.projects.forEach(project => {
        // Map project_name to cost (normalize for matching)
        costMap.set(project.project_name.toLowerCase(), project.total_cost);
      });
    }
  } catch (err) {
    console.warn('⚠️  Telemetry data not available (graph will render without cost data)');
  }

  // --- CONFIG ---
  const TOTAL_PLOTS    = 1463;
  const MAX_GHOST_HUBS = 8;   // Nebula density cap. Tags beyond this fold via modulo.

  // --- 1. TAG INDEX — ghost hub count derived from content, not hard-coded ---
  const tagSet = new Set();
  posts.forEach(post => {
    (post.data.tags || []).forEach(tag => tagSet.add(tag));
  });
  const tags = [...tagSet];
  const GHOST_HUBS = Math.max(Math.min(tags.length, MAX_GHOST_HUBS), 1);

  // Tag → ghost group. Excess tags fold into existing hubs.
  const tagToGroup = {};
  tags.forEach((tag, i) => { tagToGroup[tag] = i % GHOST_HUBS; });

  // Single source of truth for ghost IDs — used at creation AND link time
  const ghostId = (i) => `ghost-${i}`;

  // --- 2. SLUG MANIFEST — collected first so reference scan can validate targets ---
  posts.forEach(post => existingSlugs.add(post.slug));

  // --- 3. REFERENCE INDEX — incoming [[wikilink]] count per node.
  // Nodes cited by many others become visual attractors: stronger primary pull,
  // larger render radius, greater charge repulsion. Fully dormant until
  // [[wikilinks]] appear in content — then activates automatically.
  const refCount = {};
  posts.forEach((post) => {
    const matches = post.body.match(/\[\[([^\]]+)\]\]/g) || [];
    matches.forEach(match => {
      const target = match.slice(2, -2);
      if (target === post.slug)       return;   // no self-references
      if (!existingSlugs.has(target)) return;   // target must exist
      refCount[target] = (refCount[target] || 0) + 1;
    });
  });

  // --- 4. ACTIVE NODES + TAG LINKS ---
  posts.forEach((post) => {
    const postTags     = post.data.tags || [];
    const primaryGroup = postTags.length > 0 ? tagToGroup[postTags[0]] : 0;
    const refs         = refCount[post.slug] || 0;

    // Match title to project_name for cost lookup (case-insensitive)
    const titleKey = post.data.title.toLowerCase();
    const cost_usd = costMap.has(titleKey) ? costMap.get(titleKey) : null;

    nodes.push({
      id:    post.slug,
      label: post.data.title,
      type:  'active',
      val:   20,
      group: primaryGroup,
      refs,              // incoming wikilink count — drives charge & radius in ForceGarden
      cost_usd           // null = no data, 0 = free, >0 = measured cost
    });

    // Link to every tag's ghost hub.
    // Primary tag (index 0) pulls strongest — tighter cluster membership.
    // Secondary tags pull weaker — lighter threads to related clusters.
    // Primary strength is boosted by incoming reference count: each ref
    // adds +0.04 to the spring (capped at +0.20). A node cited by 5 others
    // pulls at 0.35 vs the base 0.15 — it becomes a visual anchor.
    // TODO: boost could also factor in water/donation count once that data
    //       surface exists (see support / stripe integration).
    postTags.forEach((tag, i) => {
      const base  = i === 0 ? 0.15 : 0.05;
      const boost = i === 0 ? Math.min(refs * 0.04, 0.20) : 0;
      links.push({
        source:   post.slug,
        target:   ghostId(tagToGroup[tag]),
        strength: base + boost
      });
    });
  });

  // --- 5. WIKILINK EDGES — direct node-to-node relationships ---
  // Scans each post body for [[slug]] syntax. Creates edges between real nodes.
  // Deduplicates: A↔B and B↔A collapse to one undirected edge.
  // Currently dormant — no [[wikilinks]] in content yet. Activate by adding
  // [[target-slug]] anywhere in a markdown file body.
  const wikilinkSet = new Set();
  posts.forEach((post) => {
    const matches = post.body.match(/\[\[([^\]]+)\]\]/g) || [];
    matches.forEach(match => {
      const target = match.slice(2, -2);                // strip [[ ]]
      if (target === post.slug)            return;      // no self-loops
      if (!existingSlugs.has(target))      return;      // target must be a real node
      const key = [post.slug, target].sort().join('--');
      if (wikilinkSet.has(key))            return;      // already added from the other side
      wikilinkSet.add(key);
      links.push({ source: post.slug, target, strength: 0.08 });
    });
  });

  // --- 6. LATENT SCAFFOLDING (The Nebula) ---
  // Ghost nodes are created first (i < GHOST_HUBS), then latent plots fill the rest.
  // Distribution is deterministic (modulo), not random — clusters are stable across requests.
  for (let i = 0; i < TOTAL_PLOTS; i++) {
    const id = `plot-${i.toString().padStart(4, '0')}`;
    if (existingSlugs.has(id)) continue;

    const isGhost = i < GHOST_HUBS;
    nodes.push({
      id:    isGhost ? ghostId(i) : id,
      type:  isGhost ? 'ghost' : 'latent',
      val:   isGhost ? 50 : 1,
      group: isGhost ? i : (i % GHOST_HUBS)
    });

    // Latent → single ghost hub link (one per node, even spread)
    if (!isGhost) {
      links.push({
        source:   id,
        target:   ghostId(i % GHOST_HUBS),
        strength: 0.1
      });
    }
  }

  return new Response(JSON.stringify({ nodes, links }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
