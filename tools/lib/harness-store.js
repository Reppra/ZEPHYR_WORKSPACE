import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
export const json = value => JSON.stringify(value);
export const line = value => `${json(value)}\n`;
export const TIERS = ['sm', 'mm', 'lm'];
export const DEFAULT_POLICY = {
  version: 1,
  mode: 'Manual, host-neutral local workflow; no model provider or autonomous agents.',
  authority: 'Host instructions and OS permissions remain authoritative. Role labels are workflow separation, not an OS security sandbox. Local files and allowlisted tool code must be trusted.',
  roles: ['KERNEL', 'PLANER', 'WORKER', 'MEMORY', 'DEVIL', 'HUMAN'],
  dispatch: { build: 'tools/build.js', check: 'tools/check.js' },
  gates: ['egress', 'irreversible', 'financial', 'promotion'],
  limits: { maxActions: 8, wallTimeMs: 120000, maxInputBytes: 262144, maxContextTokens: 65536, outputBytes: 1048576 },
  memory: {
    sm: { activeRows: 500, activeBytes: 262144, physicalBytes: 16777216 },
    mm: { activeRows: 250, activeBytes: 131072, physicalBytes: 16777216 },
    lm: { activeRows: 100, activeBytes: 65536, physicalBytes: 16777216 }
  },
  notes: [
    'Only build/check can run through process.execPath with fixed literal arguments. No test dispatch, arbitrary shell, or networking API.',
    'Approvals bind an exact immutable plan hash and action ID; approvals cannot clear a veto or enable unknown tools.',
    'Evidence is SHA256 bound to its exact root-relative path. Immutable snapshots detect tampering; they are not encryption or OS-enforced write protection.',
    'All mutation uses one exclusive lock. Journal intents recover interrupted appends; tier projections are append-only and recover from the journal.',
    'Compaction runs only at a closed cycle boundary. Physical history is retained; active capacity excludes explicitly compacted rows.',
    'Full tiers defer ledger memory admission, never authoritative evidence or cycle closure. Compaction admits deferred rows when capacity permits.',
    'Emergency stop is checked during execution. It terminates the direct child, cannot undo completed effects, and is not an OS process-tree sandbox.',
    'A crashed lock is never automatically stolen. An operator must confirm no live writer and remove C3.3/.mutation.lock before retrying.',
    'Context token budgets are conservative byte/4 estimates, not provider token usage.'
  ]
};

export function fail(message) { throw new Error(message); }
export function object(value, name = 'object') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`Expected ${name}`);
  return value;
}
export function keys(value, allowed, name = 'object') {
  object(value, name);
  for (const key of Object.keys(value)) if (!allowed.includes(key)) fail(`Unknown ${name} field: ${key}`);
}
export function id(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(value)) fail('Invalid ID');
  return value;
}
export function note(value, limit = 25) {
  if (typeof value !== 'string' || !value.trim() || value.length > 2000 || value.trim().split(/\s+/u).length > limit) fail(`Note must contain 1–${limit} words (maximum 2000 characters)`);
  return value.trim();
}

// Reject lexical escape, Windows aliases, alternate data streams and every symlink component.
export function safePath(root, relative, { missing = false } = {}) {
  if (typeof relative !== 'string' || !relative || relative.includes('\\') || relative.includes('\0') || path.posix.isAbsolute(relative) || /^[A-Za-z]:/.test(relative)) fail('Expected a root-relative forward-slash path');
  const parts = relative.split('/');
  for (const part of parts) {
    if (!part || part === '.' || part === '..' || /[<>:"|?*\x00-\x1f]/.test(part) || /[. ]$/.test(part) || /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(?:\.|$)/i.test(part)) fail('Unsafe path component');
  }
  const base = path.resolve(root);
  if (fs.lstatSync(base).isSymbolicLink()) fail('Symlink workspace root is forbidden');
  // Also inspect ancestors, so a root hidden behind a junction is not accepted.
  for (let current = path.dirname(base); ; current = path.dirname(current)) {
    if (fs.lstatSync(current).isSymbolicLink()) fail('Symlink workspace ancestor is forbidden');
    if (current === path.dirname(current)) break;
  }
  let current = base;
  for (const [index, part] of parts.entries()) {
    current = path.join(current, part);
    try {
      const st = fs.lstatSync(current);
      if (st.isSymbolicLink()) fail(`Symlink path rejected: ${relative}`);
      if (index < parts.length - 1 && !st.isDirectory()) fail(`Not a directory: ${relative}`);
    } catch (error) {
      if (error.code !== 'ENOENT' || !missing) throw error;
    }
  }
  return current;
}
export function ensureDir(root, relative) {
  const target = safePath(root, relative, { missing: true });
  fs.mkdirSync(target, { recursive: true });
  safePath(root, relative);
}
export function readBytes(root, relative, max = Infinity) {
  const target = safePath(root, relative);
  const st = fs.statSync(target);
  if (!st.isFile() || st.size > max) fail(`Not a regular file or input budget exceeded: ${relative}`);
  return fs.readFileSync(target);
}
export function readJson(root, relative) { return JSON.parse(readBytes(root, relative, 16777216)); }
export function exists(root, relative) {
  try { safePath(root, relative); return true; } catch (error) { if (error.code === 'ENOENT') return false; throw error; }
}
export function immutable(root, relative, bytes) {
  const target = safePath(root, relative, { missing: true });
  const temporary = path.join(path.dirname(target), `.${path.basename(target)}-${crypto.randomUUID()}.tmp`);
  const fd = fs.openSync(temporary, 'wx');
  try {
    try { fs.writeFileSync(fd, bytes); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
    fs.linkSync(temporary, target);
  } finally { fs.unlinkSync(temporary); }
  return { path: relative, sha256: sha256(bytes) };
}
export function citation(root, relative) { return { path: relative, sha256: sha256(readBytes(root, relative)) }; }
export function verifyCitation(root, ref, max = 16777216) {
  keys(ref, ['path', 'sha256'], 'citation');
  if (!/^[a-f0-9]{64}$/.test(ref.sha256)) fail('Citation requires full lowercase SHA256');
  const bytes = readBytes(root, ref.path, max);
  if (sha256(bytes) !== ref.sha256) fail(`Evidence hash mismatch at exact path: ${ref.path}`);
  return bytes;
}
export function readPolicy(root) {
  const policy = readJson(root, 'harness/policy.json');
  if (policy.version !== 1 || json(policy.dispatch) !== json(DEFAULT_POLICY.dispatch) || json(policy.gates) !== json(DEFAULT_POLICY.gates)) fail('Unsupported policy or dispatch allowlist');
  for (const [key, ceiling] of Object.entries(DEFAULT_POLICY.limits)) {
    if (!Number.isSafeInteger(policy.limits?.[key]) || policy.limits[key] < 1 || policy.limits[key] > ceiling) fail(`Invalid policy limit: ${key}`);
  }
  for (const tier of TIERS) for (const key of ['activeRows', 'activeBytes', 'physicalBytes']) {
    if (!Number.isSafeInteger(policy.memory?.[tier]?.[key]) || policy.memory[tier][key] < 1) fail(`Invalid capacity: ${tier}.${key}`);
  }
  return policy;
}
export function readEvents(root) {
  if (!exists(root, 'C3.3/events.jsonl')) return [];
  const text = readBytes(root, 'C3.3/events.jsonl').toString('utf8');
  if (text && !text.endsWith('\n')) fail('Incomplete journal: retry a mutation to recover its pending intent');
  const events = text ? text.slice(0, -1).split('\n').map(value => JSON.parse(value)) : [];
  let previous = '0'.repeat(64);
  for (const [index, event] of events.entries()) {
    const { hash, ...body } = event;
    if (event.seq !== index + 1 || event.prev !== previous || sha256(json(body)) !== hash) fail('Journal hash chain or sequence mismatch');
    previous = hash;
  }
  return events;
}
function appendSuffix(root, relative, expected) {
  const bytes = Buffer.from(expected);
  const actual = exists(root, relative) ? readBytes(root, relative) : Buffer.alloc(0);
  if (actual.length > bytes.length || !bytes.subarray(0, actual.length).equals(actual)) fail(`Append-only projection mismatch: ${relative}`);
  if (actual.length === bytes.length && exists(root, relative)) return;
  const fd = fs.openSync(safePath(root, relative, { missing: true }), 'a');
  try { fs.writeFileSync(fd, bytes.subarray(actual.length)); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
}
export function expectedProjections(events) {
  const output = Object.fromEntries(TIERS.map(t => [`C3.3/${t}.jsonl`, '']));
  output['C3.3/compactions.jsonl'] = '';
  output['C3.3/positive.jsonl'] = '';
  output['C3.3/negative.jsonl'] = '';
  for (const event of events) {
    for (const item of event.data.memory?.rows ?? []) output[`C3.3/${item.tier}.jsonl`] += line(item.row);
    for (const row of event.data.memory?.compactions ?? []) output['C3.3/compactions.jsonl'] += line(row);
    if (event.data.ledger) output[`C3.3/${event.data.ledger.outcome}.jsonl`] += line(event.data.ledger);
  }
  return output;
}
export function recover(root) {
  if (exists(root, 'C3.3/pending.json')) {
    const pending = readJson(root, 'C3.3/pending.json');
    const { hash, ...body } = pending;
    if (sha256(json(body)) !== hash) fail('Invalid recovery intent');
    const raw = exists(root, 'C3.3/events.jsonl') ? readBytes(root, 'C3.3/events.jsonl') : Buffer.alloc(0);
    const lines = raw.toString('utf8').split('\n');
    const before = lines.slice(0, pending.seq - 1).join('\n') + (pending.seq > 1 ? '\n' : '');
    const completeBefore = before ? before.slice(0, -1).split('\n').map(v => JSON.parse(v)) : [];
    if (completeBefore.length !== pending.seq - 1 || (completeBefore.at(-1)?.hash ?? '0'.repeat(64)) !== pending.prev) fail('Recovery sequence mismatch');
    // Validate the complete preceding chain before finishing any interrupted append.
    let previous = '0'.repeat(64);
    for (const [index, record] of completeBefore.entries()) {
      const { hash: h, ...b } = record;
      if (record.seq !== index + 1 || record.prev !== previous || sha256(json(b)) !== h) fail('Recovery chain mismatch');
      previous = h;
    }
    appendSuffix(root, 'C3.3/events.jsonl', before + line(pending));
  }
  const events = readEvents(root);
  for (const [relative, text] of Object.entries(expectedProjections(events))) appendSuffix(root, relative, text);
  if (exists(root, 'C3.3/pending.json')) fs.unlinkSync(safePath(root, 'C3.3/pending.json'));
  return events;
}
export function withLock(root, fn) {
  ensureDir(root, 'C3.3');
  const lock = safePath(root, 'C3.3/.mutation.lock', { missing: true });
  let fd;
  try { fd = fs.openSync(lock, 'wx'); } catch (error) {
    if (error.code === 'EEXIST') fail('Mutation lock held; retry after the writer exits. Never steal an unverified stale lock.');
    throw error;
  }
  try {
    fs.writeFileSync(fd, line({ pid: process.pid, at: new Date().toISOString() }));
    const events = recover(root);
    const result = fn(events);
    if (result && typeof result.then === 'function') fail('Lock callback must be synchronous');
    return result;
  } finally { fs.closeSync(fd); fs.unlinkSync(lock); }
}
export function commit(root, events, role, type, data) {
  const body = { v: 1, seq: events.length + 1, prev: events.at(-1)?.hash ?? '0'.repeat(64), at: new Date().toISOString(), role, type, data };
  const event = { ...body, hash: sha256(json(body)) };
  immutable(root, 'C3.3/pending.json', line(event));
  recover(root);
  return event;
}
export function role(actual, expected) { if (actual !== expected) fail(`Role ${expected} required; labels are not authentication`); }
export function stateOf(events) {
  const state = { initialized: false, cycle: 1, boundary: true, closed: false, stopped: false, intakes: Object.create(null), plans: Object.create(null), running: null };
  for (const event of events) {
    const d = event.data;
    switch (event.type) {
      case 'INIT': state.initialized = true; break;
      case 'INTAKE': state.cycle = d.cycle; state.boundary = false; state.closed = false; state.intakes[d.intake.id] = { ...d.intake, cycle: d.cycle }; break;
      case 'PLAN': state.plans[d.plan.id] = { ...d.plan, snapshot: d.snapshot, hash: d.snapshot.sha256, cycle: d.cycle, approvals: Object.create(null), critique: null, veto: false, execution: null, judgement: null, ledger: null }; break;
      case 'CRITIQUE': {
        const p = state.plans[d.planId]; p.critique = d.decision; if (d.decision === 'veto') p.veto = true; break;
      }
      case 'APPROVE': state.plans[d.planId].approvals[d.actionId] = d.planHash; break;
      case 'EXECUTE_START': state.running = { planId: d.planId, seq: event.seq, pid: d.pid }; state.plans[d.planId].execution = { state: 'running', seq: event.seq }; break;
      case 'EXECUTE_END': state.plans[d.planId].execution = { state: 'finished', ...d }; state.running = null; break;
      case 'JUDGE': state.plans[d.planId].judgement = d.decision; break;
      case 'LEDGER': state.plans[d.planId].ledger = d.ledger; break;
      case 'CLOSE': state.boundary = true; state.closed = true; break;
      case 'STOP': state.stopped = true; break;
      case 'RESUME': state.stopped = false; break;
    }
  }
  return state;
}
export function requireState(events, { running = false, stopped = false } = {}) {
  const state = stateOf(events);
  if (!state.initialized) fail('Run harness init first');
  if (state.stopped && !stopped) fail('Emergency stop active; explicit HUMAN resume acknowledgement required');
  if (state.running && !running) fail('An execution is already running');
  return state;
}
