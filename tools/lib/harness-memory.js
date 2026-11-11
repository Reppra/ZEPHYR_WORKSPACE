import { TIERS, sha256, json, line, fail, keys, id, note, readBytes, readPolicy, verifyCitation, immutable, withLock, commit, role, requireState, stateOf, expectedProjections } from './harness-store.js';

const STATES = ['live', 'positive', 'digest', 'rule', 'closed', 'blocked', 'gated', 'negative', 'residual'];
const PRESERVE = new Set(['rule', 'negative', 'closed', 'blocked', 'gated', 'residual']);

export function memoryView(events) {
  const physical = Object.fromEntries(TIERS.map(t => [t, []]));
  const retired = new Set();
  const compactions = [];
  for (const event of events) {
    for (const item of event.data.memory?.rows ?? []) {
      if (!TIERS.includes(item.tier)) fail('Invalid journal memory tier');
      physical[item.tier].push(item.row);
    }
    for (const c of event.data.memory?.compactions ?? []) {
      compactions.push(c);
      for (const source of c.ids) {
        if (retired.has(source)) fail(`Row compacted twice: ${source}`);
        retired.add(source);
      }
    }
  }
  return { physical, active: Object.fromEntries(TIERS.map(t => [t, physical[t].filter(r => !retired.has(r.t))])), compactions };
}
function deferredRows(events, view = memoryView(events)) {
  const admitted = new Set(Object.values(view.physical).flat().map(row => row.t));
  return events.flatMap(event => event.data.deferredMemory?.rows ?? []).filter(item => !admitted.has(item.row.t));
}
export function validateMemoryRow(root, row, tier, { internal = false } = {}) {
  if (!TIERS.includes(tier)) fail('Tier must be sm, mm or lm');
  keys(row, ['t', 'so', 'st', 'n', 's', 'c', 'g', 'o', 'k'], 'memory row');
  id(row.t);
  if (typeof row.so !== 'string' || !row.so.trim() || row.so.length > 160) fail('Memory subject must contain 1–160 characters');
  if (!STATES.includes(row.st)) fail('Invalid memory state');
  note(row.n);
  if (!Number.isSafeInteger(row.c) || row.c < 1) fail('Invalid memory cycle');
  if (row.g !== undefined) id(row.g);
  if (['blocked', 'gated'].includes(row.st) && !row.g) fail('Blocked/gated row requires a gate ID');
  if (!internal && (row.st === 'digest' || row.k !== undefined || row.o !== undefined)) fail('Digest fields are reserved for compaction');
  if (row.st === 'digest' && (!['live', 'positive'].includes(row.o) || !row.k || !Number.isSafeInteger(row.k.sm) || !Number.isSafeInteger(row.k.mm) || row.k.sm < 1 || row.k.mm < 0)) fail('Invalid digest provenance');
  if (tier === 'mm' && row.st !== 'digest') fail('mm accepts compaction digests only');
  if (tier === 'lm' && !['rule', 'digest'].includes(row.st)) fail('lm accepts rules or stable digests only');
  verifyCitation(root, row.s);
  if (!/^(C3\.3\/spool\/|C1\/)/.test(row.s.path)) fail('Memory cites immutable spool snapshots or C1 artifacts only');
  return row;
}
function figures(rows) {
  const bytes = Buffer.byteLength(rows.map(line).join(''));
  return { rows: rows.length, bytes, estimatedTokens: Math.ceil(bytes / 4), bytesPerRow: rows.length ? Math.round(bytes / rows.length) : 0 };
}
export function memoryStatsFrom(events, policy) {
  const view = memoryView(events);
  const tiers = {};
  for (const tier of TIERS) {
    const physical = figures(view.physical[tier]);
    const active = figures(view.active[tier]);
    const caps = policy.memory[tier];
    tiers[tier] = { physical, active, retiredRows: physical.rows - active.rows, caps, withinCapacity: active.rows <= caps.activeRows && active.bytes <= caps.activeBytes && physical.bytes <= caps.physicalBytes };
  }
  const deferred = deferredRows(events, view);
  return { cycle: stateOf(events).cycle, tokenMethod: 'UTF-8 bytes / 4, rounded up; estimate only', tiers, deferredLedgerRows: deferred.length, withinCapacity: Object.values(tiers).every(t => t.withinCapacity) };
}
export function checkAdmission(root, events, memory) {
  const seen = new Set(Object.values(memoryView(events).physical).flat().map(row => row.t));
  for (const { tier, row } of memory.rows ?? []) {
    validateMemoryRow(root, row, tier, { internal: true });
    if (seen.has(row.t)) fail(`Duplicate memory ID: ${row.t}`);
    seen.add(row.t);
  }
  const projected = [...events, { type: 'MEMORY', data: { memory } }];
  if (!memoryStatsFrom(projected, readPolicy(root)).withinCapacity) fail('Memory capacity exceeded (active or physical); no authoritative record written');
}
export function memoryStats(root) {
  return withLock(root, events => { requireState(events, { stopped: true, running: true }); return memoryStatsFrom(events, readPolicy(root)); });
}
export function appendMemory(root, tier, row, actor) {
  role(actor, 'MEMORY');
  return withLock(root, events => {
    const state = requireState(events);
    validateMemoryRow(root, row, tier);
    if (deferredRows(events).some(item => item.row.t === row.t)) fail(`Duplicate deferred memory ID: ${row.t}`);
    if (row.c !== state.cycle) fail('Memory row must name the current cycle');
    const memory = { rows: [{ tier, row }] };
    checkAdmission(root, events, memory);
    commit(root, events, actor, 'MEMORY_APPEND', { memory });
    return row;
  });
}
export function verifyMemoryFrom(root, events) {
  const view = memoryView(events);
  const ids = new Map();
  for (const tier of TIERS) for (const row of view.physical[tier]) {
    validateMemoryRow(root, row, tier, { internal: true });
    if (ids.has(row.t)) fail(`Duplicate memory ID: ${row.t}`);
    ids.set(row.t, { tier, row });
  }
  for (const event of events) for (const item of event.data.deferredMemory?.rows ?? []) {
    validateMemoryRow(root, item.row, item.tier, { internal: true });
    if (ids.has(item.row.t) && json(ids.get(item.row.t).row) !== json(item.row)) fail('Deferred ledger row differs from admitted memory');
  }
  for (const c of view.compactions) {
    if (!((c.from === 'sm' && c.to === 'mm') || (c.from === 'mm' && c.to === 'lm'))) fail('Invalid compaction direction');
    verifyCitation(root, c.source);
    const originals = c.ids.map(value => {
      const source = ids.get(value);
      if (!source || source.tier !== c.from || PRESERVE.has(source.row.st) || source.row.g) fail('Invalid or protected compaction source');
      return source.row;
    });
    if (readBytes(root, c.source.path).toString('utf8') !== originals.map(line).join('')) fail('Compaction spool does not match exact source rows');
    const target = ids.get(c.id);
    if (!target || target.tier !== c.to || json(target.row.s) !== json(c.source)) fail('Missing compaction target');
    if (c.to === 'lm' && (originals.length < 4 || new Set(originals.map(r => r.c)).size < 4 || Math.max(...originals.map(r => r.c)) - Math.min(...originals.map(r => r.c)) <= 3)) fail('Unstable long-term promotion');
  }
  for (const [relative, text] of Object.entries(expectedProjections(events))) {
    if (!readBytes(root, relative).equals(Buffer.from(text))) fail(`Projection differs from authority: ${relative}`);
  }
  return { ok: true, rows: ids.size, compactions: view.compactions.length };
}
export function verifyMemory(root) {
  return withLock(root, events => { requireState(events, { stopped: true, running: true }); return verifyMemoryFrom(root, events); });
}

export function compactMemory(root, actor) {
  role(actor, 'MEMORY');
  return withLock(root, events => {
    const state = requireState(events);
    if (!state.boundary || !state.closed) fail('Compaction requires an explicitly closed cycle boundary');
    verifyMemoryFrom(root, events);
    const view = memoryView(events);
    const rows = [];
    const compactions = [];
    const snapshots = [];
    function group(values) {
      const groups = new Map();
      for (const row of values) {
        const key = json([row.so, row.o ?? row.st, row.n]);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(row);
      }
      return [...groups.values()];
    }
    function digest(from, to, sources) {
      sources.sort((a, b) => a.t.localeCompare(b.t, 'en'));
      const bytes = sources.map(line).join('');
      const digestId = `D-${sha256(json([from, to, sources.map(r => r.t)])).slice(0, 32)}`;
      const relative = `C3.3/spool/${digestId}.jsonl`;
      const source = { path: relative, sha256: sha256(bytes) };
      snapshots.push({ relative, bytes, source });
      const row = {
        t: digestId, so: sources[0].so, st: 'digest', n: sources[0].n, s: source, c: state.cycle,
        o: sources[0].o ?? sources[0].st,
        k: { sm: sources.reduce((sum, r) => sum + (r.k?.sm ?? 1), 0), mm: from === 'mm' ? sources.length : 0 }
      };
      rows.push({ tier: to, row });
      compactions.push({ from, to, ids: sources.map(r => r.t), id: digestId, source, cycle: state.cycle });
    }
    const short = view.active.sm.filter(r => r.c < state.cycle && !r.g && ['live', 'positive'].includes(r.st));
    for (const sources of group(short)) digest('sm', 'mm', sources);
    // New midterm rows wait until a later boundary before they may enter longterm.
    for (const sources of group(view.active.mm.filter(r => r.c < state.cycle && r.st === 'digest' && !r.g))) {
      const cycles = sources.map(r => r.c);
      const oldest = Math.min(...cycles);
      const newest = Math.max(...cycles);
      const contradiction = [...view.physical.sm, ...view.physical.mm].some(r => r.so === sources[0].so && r.c >= oldest && r.c <= state.cycle && (PRESERVE.has(r.st) || r.g || ((r.o ?? r.st) === sources[0].o && r.n !== sources[0].n)));
      if (sources.length >= 4 && new Set(cycles).size >= 4 && newest - oldest > 3 && !contradiction) digest('mm', 'lm', sources);
    }
    const memory = { rows, compactions };
    const policy = readPolicy(root);
    if (!memoryStatsFrom([...events, { type: 'MEMORY', data: { memory } }], policy).withinCapacity) fail('Memory capacity exceeded by compaction');
    const pending = deferredRows(events, view);
    let admitted = 0;
    for (const item of pending) {
      const projected = { rows: [...rows, item], compactions };
      if (memoryStatsFrom([...events, { type: 'MEMORY', data: { memory: projected } }], policy).withinCapacity) { rows.push(item); admitted++; }
    }
    if (!rows.length) return { compacted: 0, rows: 0, deferred: pending.length };
    for (const snapshot of snapshots) {
      try { immutable(root, snapshot.relative, snapshot.bytes); } catch (error) {
        if (error.code !== 'EEXIST') throw error;
        verifyCitation(root, snapshot.source); // An interrupted uncommitted snapshot is safe to reuse only byte-exactly.
      }
    }
    checkAdmission(root, events, memory);
    commit(root, events, actor, 'MEMORY_COMPACT', { memory });
    return { compacted: compactions.reduce((n, c) => n + c.ids.length, 0), rows: rows.length, deferred: pending.length - admitted };
  });
}
