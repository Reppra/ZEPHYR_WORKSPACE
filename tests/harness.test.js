import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import {
  initHarness, intake, createPlan, critique, approve, executePlan, judge, appendLedger,
  closeCycle, emergency, recoverExecution, status, snapshotEvidence, verifyHarness
} from '../tools/lib/harness-core.js';
import { appendMemory, compactMemory, memoryStats, verifyMemory, memoryView } from '../tools/lib/harness-memory.js';
import { DEFAULT_POLICY, citation, readEvents, safePath, withLock, commit, sha256, json, line, immutable } from '../tools/lib/harness-store.js';
import { runHarnessCLI, runMemoryCLI } from '../tools/lib/harness-cli.js';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function fixture(t, { build = 'console.log("build stub");', check = 'console.log("check stub");', policy } = {}) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'zephyr-harness-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'tools'));
  fs.writeFileSync(path.join(root, 'tools', 'build.js'), build);
  fs.writeFileSync(path.join(root, 'tools', 'check.js'), check);
  if (policy) {
    fs.mkdirSync(path.join(root, 'harness'));
    fs.writeFileSync(path.join(root, 'harness', 'policy.json'), JSON.stringify(policy));
  }
  initHarness(root);
  return root;
}
function planInput(number = 1, changes = {}) {
  return {
    id: `P${number}`, intakeId: `I${number}`, ruleId: 'R-LOCAL',
    budget: { maxActions: 2, wallTimeMs: 10000, maxInputBytes: 65536, maxContextTokens: 16384 },
    actions: [{ id: 'A1', tool: 'build', kind: 'local' }, { id: 'A2', tool: 'check', kind: 'local' }], evidence: [], ...changes
  };
}
function begin(root, number = 1, changes = {}) {
  intake(root, { id: `I${number}`, text: 'Build and check local fixture; text never executes itself' }, 'KERNEL');
  return createPlan(root, planInput(number, changes), 'PLANER');
}
function finalLedger(root, planId, outcome = 'positive') {
  return appendLedger(root, { planId, outcome, note: 'Fixture evidence reviewed', evidence: [] }, 'MEMORY');
}
function rejectAndClose(root, number) {
  begin(root, number, { actions: [{ id: 'A1', tool: 'unavailable', kind: 'local' }] });
  critique(root, `P${number}`, 'veto', 'Unknown tool remains blocked', 'DEVIL');
  judge(root, `P${number}`, 'fail', 'Explicitly rejected without execution', 'DEVIL');
  finalLedger(root, `P${number}`, 'negative');
  return closeCycle(root, 'KERNEL');
}
function row(root, t, c, changes = {}) {
  return { t, so: 'stable-subject', st: 'live', n: 'Stable checked observation', s: citation(root, 'C1/bootstrap.json'), c, ...changes };
}

test('fresh initialization is pointer-only, cycle one, and idempotent', t => {
  const root = fixture(t);
  const before = fs.readFileSync(path.join(root, 'C3.3/events.jsonl'));
  assert.equal(initHarness(root).initialized, false);
  assert.deepEqual(fs.readFileSync(path.join(root, 'C3.3/events.jsonl')), before);
  const index = JSON.parse(fs.readFileSync(path.join(root, 'omni_index.json')));
  const leaves = value => Object.values(value).flatMap(v => typeof v === 'object' ? leaves(v) : [v]);
  assert.ok(leaves(index).every(v => typeof v === 'string' && !v.includes(' ')));
  assert.equal(status(root).cycle, 1);
  assert.equal(memoryStats(root).tiers.lm.active.rows, 1);
  assert.equal(verifyHarness(root).ok, true);
  assert.throws(() => closeCycle(root, 'KERNEL'), /No open cycle/);
});

test('full intake-to-close workflow executes only fixed tools and records evidence', async t => {
  const root = fixture(t);
  const created = begin(root);
  assert.match(created.hash, /^[a-f0-9]{64}$/);
  await assert.rejects(executePlan(root, 'P1', 'WORKER'), /critique/);
  critique(root, 'P1', 'pass', 'Safe local tools and bounded work', 'DEVIL');
  const executed = await executePlan(root, 'P1', 'WORKER');
  assert.equal(executed.ok, true);
  assert.deepEqual(executed.results.map(r => r.tool), ['build', 'check']);
  assert.match(executed.results[0].stdout, /build stub/);
  await assert.rejects(executePlan(root, 'P1', 'WORKER'), /twice/);
  assert.throws(() => closeCycle(root, 'KERNEL'), /Cannot close/);
  judge(root, 'P1', 'pass', 'Output and hashes checked', 'DEVIL');
  assert.throws(() => finalLedger(root, 'P1', 'negative'), /contradicts/);
  const ledger = finalLedger(root, 'P1');
  assert.equal(ledger.evidence.length, 2);
  assert.equal(closeCycle(root, 'KERNEL').closed, 1);
  assert.equal(verifyHarness(root).ok, true);
  intake(root, { id: 'I2', text: 'Next cycle remains manual' }, 'KERNEL');
  assert.equal(status(root).cycle, 2);
  assert.throws(() => compactMemory(root, 'MEMORY'), /boundary/);
});

test('gate approval binds exact plan AND action and cannot clear a later veto', async t => {
  const root = fixture(t);
  const created = begin(root, 1, { actions: [{ id: 'A1', tool: 'build', kind: 'promotion' }, { id: 'A2', tool: 'check', kind: 'financial' }] });
  assert.throws(() => approve(root, 'P1', created.hash, 'A1', 'Reviewed', 'HUMAN'), /critique/);
  critique(root, 'P1', 'pass', 'Explicit gates are required', 'DEVIL');
  await assert.rejects(executePlan(root, 'P1', 'WORKER'), /gate/);
  assert.throws(() => approve(root, 'P1', '0'.repeat(64), 'A1', 'Reviewed', 'HUMAN'), /exact plan hash/);
  assert.throws(() => approve(root, 'P1', created.hash, 'A1', 'Reviewed', 'WORKER'), /HUMAN/);
  assert.throws(() => approve(root, 'P1', created.hash, 'missing', 'Reviewed', 'HUMAN'), /Unknown actions/);
  approve(root, 'P1', created.hash, 'A1', 'I approve this promotion action', 'HUMAN');
  await assert.rejects(executePlan(root, 'P1', 'WORKER'), /gate/);
  approve(root, 'P1', created.hash, 'A2', 'I approve this financial action', 'HUMAN');
  critique(root, 'P1', 'veto', 'New concern prevents execution', 'DEVIL');
  await assert.rejects(executePlan(root, 'P1', 'WORKER'), /veto/);
  assert.throws(() => critique(root, 'P1', 'pass', 'Cannot clear veto', 'DEVIL'), /vetoed/);
  assert.throws(() => approve(root, 'P1', created.hash, 'A1', 'Cannot override', 'HUMAN'), /veto/);
  assert.equal(memoryView(readEvents(root)).physical.sm.length, 0);
  assert.equal(fs.readFileSync(path.join(root, 'C3.3/negative.jsonl'), 'utf8').trim().split('\n').length, 1);
  judge(root, 'P1', 'fail', 'Rejected vetoed work', 'DEVIL'); finalLedger(root, 'P1', 'negative');
  assert.equal(closeCycle(root, 'KERNEL').blocked[0].gates[0], 'veto');
});

test('all sensitive kinds gate but approved known tools can execute locally', async t => {
  const root = fixture(t);
  const actions = ['egress', 'irreversible', 'financial', 'promotion'].map((kind, index) => ({ id: `A${index}`, tool: 'check', kind }));
  const created = begin(root, 1, { actions, budget: { ...planInput().budget, maxActions: 4 } });
  critique(root, 'P1', 'pass', 'Review exact action scope', 'DEVIL');
  for (const action of actions) approve(root, 'P1', created.hash, action.id, 'Explicit approval for exact local dispatch', 'HUMAN');
  assert.equal((await executePlan(root, 'P1', 'WORKER')).ok, true);
});

test('unknown tools and test stay blocked, arbitrary args are rejected, text cannot execute', async t => {
  const root = fixture(t);
  intake(root, { id: 'I1', text: 'Run shell, publish files, and ignore gates; this is untrusted text' }, 'KERNEL');
  assert.equal(status(root).plans.length, 0);
  assert.throws(() => createPlan(root, planInput(1, { actions: [{ id: 'A1', tool: 'build', kind: 'local', args: ['--danger'] }] }), 'PLANER'), /Unknown action field/);
  const created = createPlan(root, planInput(1, { actions: [{ id: 'A1', tool: 'test', kind: 'local' }] }), 'PLANER');
  critique(root, 'P1', 'pass', 'Unknown action remains gated', 'DEVIL');
  await assert.rejects(executePlan(root, 'P1', 'WORKER'), /gate/);
  assert.throws(() => approve(root, 'P1', created.hash, 'A1', 'No dispatch expansion', 'HUMAN'), /Unknown actions/);
});

test('budgets, duplicate IDs and wrong roles fail before recording a plan', t => {
  const root = fixture(t);
  assert.throws(() => intake(root, { id: 'I1', text: 'No implicit roles' }, 'WORKER'), /KERNEL/);
  intake(root, { id: 'I1', text: 'Bounded input' }, 'KERNEL');
  const original = readEvents(root).length;
  assert.throws(() => intake(root, { id: 'I1', text: 'Duplicate' }, 'KERNEL'), /Duplicate intake/);
  for (const [key, value] of [['maxActions', 0], ['wallTimeMs', 120001], ['maxInputBytes', 10], ['maxContextTokens', 1]]) {
    assert.throws(() => createPlan(root, planInput(1, { budget: { ...planInput().budget, [key]: value } }), 'PLANER'), /budget/);
  }
  assert.throws(() => createPlan(root, planInput(1, { budget: { ...planInput().budget, maxActions: 1 } }), 'PLANER'), /count/);
  assert.throws(() => createPlan(root, planInput(1, { actions: [{ id: 'A1', tool: 'build', kind: 'local' }, { id: 'A1', tool: 'check', kind: 'local' }] }), 'PLANER'), /Duplicate action/);
  assert.equal(readEvents(root).length, original);
  createPlan(root, planInput(), 'PLANER');
  assert.throws(() => createPlan(root, planInput(), 'PLANER'), /Duplicate plan/);
  assert.equal(fs.existsSync(path.join(root, 'C3.3/.mutation.lock')), false);
});

test('evidence verifies the exact cited path, not an identical twin', async t => {
  const root = fixture(t);
  fs.writeFileSync(path.join(root, 'evidence.txt'), 'original evidence');
  fs.writeFileSync(path.join(root, 'twin.txt'), 'original evidence');
  const evidence = citation(root, 'evidence.txt');
  begin(root, 1, { evidence: [evidence] });
  critique(root, 'P1', 'pass', 'Evidence inspected', 'DEVIL');
  fs.writeFileSync(path.join(root, 'evidence.txt'), 'tampered evidence');
  assert.equal(citation(root, 'twin.txt').sha256, evidence.sha256);
  await assert.rejects(executePlan(root, 'P1', 'WORKER'), /exact path: evidence.txt/);
  assert.throws(() => verifyHarness(root), /exact path: evidence.txt/);
});

test('immutable plan snapshots and bound tool files detect tampering', async t => {
  const root = fixture(t);
  begin(root);
  critique(root, 'P1', 'pass', 'Fixed tools reviewed', 'DEVIL');
  fs.appendFileSync(path.join(root, 'tools/build.js'), '\nconsole.log("changed");');
  await assert.rejects(executePlan(root, 'P1', 'WORKER'), /tools\/build.js/);
  fs.appendFileSync(path.join(root, 'C3.1/P1.json'), ' ');
  assert.throws(() => verifyHarness(root), /C3.1\/P1.json/);
});

test('unsafe input paths and symlinks cannot enter evidence or snapshots', async t => {
  const root = fixture(t);
  for (const value of ['../escape', 'C:/Windows/test', '/absolute', 'a/../b', 'a\\b', 'a//b', 'a/./b', 'file:stream', 'NUL', 'bad.']) assert.throws(() => safePath(root, value, { missing: true }), /path|component/);
  await assert.rejects(runHarnessCLI(['intake', '--role', 'KERNEL', '--input', '@../escape.json'], root), /component/);
  const outside = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'zephyr-outside-'));
  t.after(() => fs.rmSync(outside, { recursive: true, force: true }));
  fs.writeFileSync(path.join(outside, 'secret.txt'), 'outside');
  fs.symlinkSync(outside, path.join(root, 'linked'), process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => citation(root, 'linked/secret.txt'), /Symlink/);
  assert.throws(() => snapshotEvidence(root, 'linked/secret.txt', 'MEMORY'), /Symlink/);
});

test('wall-time and failed process budgets produce negative execution evidence', async t => {
  const root = fixture(t, { build: 'setTimeout(() => console.log("late"), 10000);' });
  begin(root, 1, { actions: [{ id: 'A1', tool: 'build', kind: 'local' }], budget: { ...planInput().budget, wallTimeMs: 150 } });
  critique(root, 'P1', 'pass', 'Bounded slow fixture', 'DEVIL');
  const result = await executePlan(root, 'P1', 'WORKER');
  assert.equal(result.ok, false);
  assert.match(result.failure, /wall-time-budget/);
  assert.throws(() => judge(root, 'P1', 'pass', 'Cannot pass timeout', 'DEVIL'), /successful/);
  judge(root, 'P1', 'fail', 'Wall budget exceeded', 'DEVIL'); finalLedger(root, 'P1', 'negative');
  assert.equal(closeCycle(root, 'KERNEL').closed, 1);
});

test('nonzero tool exit is recorded without dispatching later actions', async t => {
  const root = fixture(t, { build: 'console.error("intentional failure"); process.exitCode = 7;' });
  begin(root); critique(root, 'P1', 'pass', 'Failure test reviewed', 'DEVIL');
  const result = await executePlan(root, 'P1', 'WORKER');
  assert.equal(result.ok, false); assert.equal(result.results.length, 1); assert.equal(result.results[0].code, 7);
});

test('output capture is bounded', async t => {
  const policy = structuredClone(DEFAULT_POLICY); policy.limits.outputBytes = 100;
  const root = fixture(t, { policy, build: 'console.log("x".repeat(10000));' });
  begin(root); critique(root, 'P1', 'pass', 'Output is bounded', 'DEVIL');
  const result = await executePlan(root, 'P1', 'WORKER');
  assert.equal(result.ok, false); assert.equal(result.failure, 'output-budget');
  assert.ok(Buffer.byteLength(result.results[0].stdout) <= 100);
});

test('HUMAN emergency stop interrupts work and requires acknowledgement before resume', async t => {
  const root = fixture(t, { build: 'setTimeout(() => {}, 10000);' });
  begin(root); critique(root, 'P1', 'pass', 'Stop test reviewed', 'DEVIL');
  const running = executePlan(root, 'P1', 'WORKER');
  assert.throws(() => emergency(root, 'stop', 'Stop now', 'WORKER'), /HUMAN/);
  assert.throws(() => emergency(root, 'stop', '', 'HUMAN'), /Note/);
  emergency(root, 'stop', 'I acknowledge emergency stop', 'HUMAN');
  assert.throws(() => emergency(root, 'resume', 'Cannot race execution', 'HUMAN'), /running/);
  assert.throws(() => recoverExecution(root, 'P1', 'Cannot supersede live PID', 'HUMAN'), /still alive/);
  const report = await running;
  assert.equal(report.ok, false); assert.equal(report.failure, 'emergency-stop');
  assert.throws(() => intake(root, { id: 'I2', text: 'Blocked' }, 'KERNEL'), /Emergency stop/);
  assert.throws(() => emergency(root, 'resume', 'Review complete', 'DEVIL'), /HUMAN/);
  emergency(root, 'resume', 'I reviewed and acknowledge resuming', 'HUMAN');
  judge(root, 'P1', 'fail', 'Stopped execution reviewed', 'DEVIL'); finalLedger(root, 'P1', 'negative');
  closeCycle(root, 'KERNEL');
});

test('exclusive lock rejects competing mutation and finally cleans up after errors', t => {
  const root = fixture(t);
  const count = readEvents(root).length;
  withLock(root, () => {
    assert.throws(() => intake(root, { id: 'I1', text: 'Do not race' }, 'KERNEL'), /Mutation lock held/);
    const cli = spawnSync(process.execPath, [path.join(project, 'tools/harness.js'), 'status', '--root', root], { encoding: 'utf8', timeout: 10000 });
    assert.equal(cli.status, 1); assert.match(cli.stderr, /Mutation lock held/);
  });
  assert.equal(readEvents(root).length, count);
  assert.throws(() => withLock(root, () => { throw new Error('failure'); }), /failure/);
  assert.equal(fs.existsSync(path.join(root, 'C3.3/.mutation.lock')), false);
  assert.equal(status(root).cycle, 1);
});

test('durable intent repairs a partial journal append and incomplete tier projection exactly once', t => {
  const root = fixture(t);
  const events = readEvents(root);
  const added = row(root, 'RECOVERED', 1);
  const body = { v: 1, seq: events.length + 1, prev: events.at(-1).hash, at: new Date().toISOString(), role: 'MEMORY', type: 'MEMORY_APPEND', data: { memory: { rows: [{ tier: 'sm', row: added }] } } };
  const record = { ...body, hash: sha256(json(body)) };
  fs.writeFileSync(path.join(root, 'C3.3/pending.json'), line(record));
  fs.appendFileSync(path.join(root, 'C3.3/events.jsonl'), line(record).slice(0, 57));
  fs.writeFileSync(path.join(root, 'C3.3/sm.jsonl'), line(added).slice(0, 30));
  assert.equal(memoryStats(root).tiers.sm.physical.rows, 1);
  assert.equal(fs.existsSync(path.join(root, 'C3.3/pending.json')), false);
  assert.equal(memoryStats(root).tiers.sm.physical.rows, 1);
  assert.equal(readEvents(root).length, events.length + 1);
  assert.equal(verifyHarness(root).ok, true);
});

test('journal and projection corruption fail closed without silently rewriting history', t => {
  const root = fixture(t);
  fs.appendFileSync(path.join(root, 'C3.3/sm.jsonl'), '{"fabricated":true}\n');
  assert.throws(() => memoryStats(root), /projection mismatch/);
  assert.equal(fs.readFileSync(path.join(root, 'C3.3/sm.jsonl'), 'utf8'), '{"fabricated":true}\n');
  const other = fixture(t);
  const file = path.join(other, 'C3.3/events.jsonl');
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('R-LOCAL', 'R-FALSE'));
  assert.throws(() => verifyHarness(other), /hash chain/);
});

test('memory notes, global IDs, immutable citations and tier guards validate before writes', t => {
  const root = fixture(t);
  const count = readEvents(root).length;
  assert.throws(() => appendMemory(root, 'sm', row(root, 'M1', 1, { n: Array(26).fill('word').join(' ') }), 'MEMORY'), /25/);
  assert.throws(() => appendMemory(root, 'sm', row(root, 'M1', 2), 'MEMORY'), /current cycle/);
  assert.throws(() => appendMemory(root, 'mm', row(root, 'M1', 1), 'MEMORY'), /digests only/);
  assert.throws(() => appendMemory(root, 'sm', row(root, 'M1', 1, { st: 'blocked' }), 'MEMORY'), /gate ID/);
  assert.throws(() => appendMemory(root, 'sm', row(root, 'M1', 1, { s: citation(root, 'tools/build.js') }), 'MEMORY'), /immutable/);
  assert.equal(readEvents(root).length, count);
  appendMemory(root, 'sm', row(root, 'M1', 1), 'MEMORY');
  assert.throws(() => appendMemory(root, 'sm', row(root, 'M1', 1), 'MEMORY'), /Duplicate/);
  assert.throws(() => appendMemory(root, 'sm', row(root, 'R-LOCAL', 1), 'MEMORY'), /Duplicate/);
  assert.equal(verifyMemory(root).ok, true);
});

test('capacity distinguishes active and physical usage and prevents overflow atomically', t => {
  const policy = structuredClone(DEFAULT_POLICY); policy.memory.sm.activeRows = 1;
  const root = fixture(t, { policy });
  appendMemory(root, 'sm', row(root, 'M1', 1), 'MEMORY');
  const count = readEvents(root).length;
  assert.throws(() => appendMemory(root, 'sm', row(root, 'M2', 1), 'MEMORY'), /capacity/);
  assert.equal(readEvents(root).length, count);
  const stats = memoryStats(root);
  assert.equal(stats.tiers.sm.physical.rows, 1); assert.equal(stats.tiers.sm.active.rows, 1); assert.equal(stats.withinCapacity, true);
  policy.memory.sm.physicalBytes = 1;
  fs.writeFileSync(path.join(root, 'harness/policy.json'), JSON.stringify(policy));
  assert.equal(memoryStats(root).withinCapacity, false);
  const cli = spawnSync(process.execPath, [path.join(project, 'tools/memctl.js'), 'capacity', '--root', root], { encoding: 'utf8', timeout: 10000 });
  assert.equal(cli.status, 1);
});

test('boundary compaction is idempotent, preserves protected rows and never deletes physical history', t => {
  const root = fixture(t);
  appendMemory(root, 'sm', row(root, 'LIVE1', 1), 'MEMORY');
  appendMemory(root, 'sm', row(root, 'LIVE2', 1), 'MEMORY');
  for (const st of ['rule', 'negative', 'closed', 'blocked', 'gated', 'residual']) appendMemory(root, 'sm', row(root, `KEEP-${st}`, 1, { st, ...(['blocked', 'gated'].includes(st) ? { g: 'human-review' } : {}) }), 'MEMORY');
  appendMemory(root, 'sm', row(root, 'KEEP-live-gate', 1, { g: 'pending-gate' }), 'MEMORY');
  assert.throws(() => compactMemory(root, 'MEMORY'), /boundary/);
  rejectAndClose(root, 1);
  assert.equal(compactMemory(root, 'MEMORY').compacted, 0);
  rejectAndClose(root, 2);
  const physical = fs.readFileSync(path.join(root, 'C3.3/sm.jsonl'));
  const result = compactMemory(root, 'MEMORY');
  assert.equal(result.compacted, 2); assert.equal(result.rows, 1);
  assert.deepEqual(fs.readFileSync(path.join(root, 'C3.3/sm.jsonl')), physical);
  const stats = memoryStats(root);
  assert.equal(stats.tiers.sm.retiredRows, 2); assert.equal(stats.tiers.mm.active.rows, 1);
  const count = readEvents(root).length;
  assert.equal(compactMemory(root, 'MEMORY').compacted, 0); assert.equal(readEvents(root).length, count);
  const active = memoryView(readEvents(root)).active.sm;
  assert.equal(active.filter(r => r.t.startsWith('KEEP')).length, 7);
  assert.equal(verifyMemory(root).ok, true);
});

test('long-term digest requires four matching rows stable across more than three cycles', t => {
  const root = fixture(t);
  for (let cycle = 1; cycle <= 7; cycle++) {
    // Append before the first intake, or start the next cycle before assigning its row.
    if (cycle > 1) intake(root, { id: `EXTRA${cycle}`, text: 'Open next cycle for memory observation' }, 'KERNEL');
    if ([1, 2, 3, 5].includes(cycle)) appendMemory(root, 'sm', row(root, `STABLE${cycle}`, cycle), 'MEMORY');
    if (cycle > 1) {
      createPlan(root, planInput(`E${cycle}`, { intakeId: `EXTRA${cycle}`, actions: [{ id: 'A1', tool: 'unknown', kind: 'local' }] }), 'PLANER');
      critique(root, `PE${cycle}`, 'veto', 'Unknown remains blocked', 'DEVIL');
      judge(root, `PE${cycle}`, 'fail', 'Explicit rejection', 'DEVIL'); finalLedger(root, `PE${cycle}`, 'negative');
    }
    rejectAndClose(root, cycle);
    compactMemory(root, 'MEMORY');
    const digests = memoryView(readEvents(root)).active.lm.filter(r => r.st === 'digest');
    if (cycle < 7) assert.equal(digests.length, 0, `must not promote in cycle ${cycle}`);
    else { assert.equal(digests.length, 1); assert.equal(digests[0].k.mm, 4); assert.equal(digests[0].k.sm, 4); }
  }
  assert.equal(verifyMemory(root).ok, true);
});

test('tampered spool fails even with an unchanged same-hash twin', t => {
  const root = fixture(t);
  fs.writeFileSync(path.join(root, 'source.txt'), 'frozen source');
  const ref = snapshotEvidence(root, 'source.txt', 'MEMORY');
  fs.copyFileSync(path.join(root, ref.path), path.join(root, 'C3.3/spool/twin.bin'));
  appendMemory(root, 'sm', row(root, 'M1', 1, { s: ref }), 'MEMORY');
  fs.writeFileSync(path.join(root, ref.path), 'tampered');
  assert.throws(() => verifyMemory(root), /exact path/);
});

test('dead executor recovery is explicitly HUMAN acknowledged and never retries effects', t => {
  const root = fixture(t);
  const plan = begin(root);
  critique(root, 'P1', 'pass', 'Recovery fixture reviewed', 'DEVIL');
  const exited = spawnSync(process.execPath, ['-e', 'process.exit(0)'], { timeout: 10000 });
  assert.equal(exited.status, 0);
  withLock(root, events => commit(root, events, 'WORKER', 'EXECUTE_START', { planId: 'P1', planHash: plan.hash, pid: exited.pid }));
  assert.throws(() => recoverExecution(root, 'P1', 'No implicit recovery', 'HUMAN'), /emergency stop/);
  emergency(root, 'stop', 'Review dead executor before recovery', 'HUMAN');
  assert.throws(() => recoverExecution(root, 'P1', 'Wrong role', 'WORKER'), /HUMAN/);
  assert.equal(recoverExecution(root, 'P1', 'Effects are unknown and reviewed', 'HUMAN').recovered, 'P1');
  assert.equal(status(root).running, null);
  emergency(root, 'resume', 'I acknowledge resuming after recovery', 'HUMAN');
  judge(root, 'P1', 'fail', 'Interrupted effects remain unknown', 'DEVIL');
  finalLedger(root, 'P1', 'negative');
  closeCycle(root, 'KERNEL');
  assert.equal(verifyHarness(root).ok, true);
});

test('tightened policy budgets reject execution before its start record', async t => {
  const root = fixture(t);
  begin(root); critique(root, 'P1', 'pass', 'Original budget reviewed', 'DEVIL');
  const policy = structuredClone(DEFAULT_POLICY); policy.limits.wallTimeMs = 9999;
  fs.writeFileSync(path.join(root, 'harness/policy.json'), JSON.stringify(policy));
  const count = readEvents(root).length;
  await assert.rejects(executePlan(root, 'P1', 'WORKER'), /current policy/);
  assert.equal(readEvents(root).length, count);
  assert.equal(status(root).running, null);
});

test('full memory defers ledger rows without blocking closure or later compaction', t => {
  const policy = structuredClone(DEFAULT_POLICY); policy.memory.sm.activeRows = 2;
  const root = fixture(t, { policy });
  appendMemory(root, 'sm', row(root, 'FULL', 1), 'MEMORY');
  rejectAndClose(root, 1);
  assert.equal(compactMemory(root, 'MEMORY').compacted, 0);
  begin(root, 2); critique(root, 'P2', 'veto', 'Blocked work', 'DEVIL'); judge(root, 'P2', 'fail', 'Explicit rejection', 'DEVIL');
  const ledger = finalLedger(root, 'P2', 'negative');
  assert.equal(ledger.memoryDeferred, true);
  assert.equal(memoryStats(root).deferredLedgerRows, 1);
  assert.equal(status(root).next.action, 'close');
  closeCycle(root, 'KERNEL');
  const compacted = compactMemory(root, 'MEMORY');
  assert.equal(compacted.compacted, 1);
  assert.equal(compacted.deferred, 0);
  assert.equal(memoryStats(root).deferredLedgerRows, 0);
  assert.equal(memoryStats(root).tiers.sm.active.rows, 2);
  assert.equal(verifyHarness(root).ok, true);
  assert.equal(compactMemory(root, 'MEMORY').compacted, 0);
});

test('CLI help, explicit role validation, JSON file input and unknown flags', async t => {
  const root = fixture(t);
  assert.match(await runHarnessCLI(['help'], root), /NOT authentication/);
  assert.match(await runMemoryCLI(['help'], root), /25 words/);
  await assert.rejects(runHarnessCLI(['intake', '--input', '{"id":"I1","text":"No default role"}'], root), /Missing --role/);
  await assert.rejects(runHarnessCLI(['status', '--shell', 'true'], root), /Unknown option/);
  await assert.rejects(runHarnessCLI(['status', '--root', root, '--root', root], root), /Duplicate option/);
  fs.writeFileSync(path.join(root, 'request.json'), JSON.stringify({ id: 'I1', text: 'Manual input file' }));
  const result = await runHarnessCLI(['intake', '--role', 'KERNEL', '--input', '@request.json'], root);
  assert.equal(result.id, 'I1');
  const cli = spawnSync(process.execPath, [path.join(project, 'tools/harness.js'), 'status', '--root', root], { encoding: 'utf8', timeout: 10000 });
  assert.equal(cli.status, 0); assert.equal(JSON.parse(cli.stdout).cycle, 1);
});

test('interrupted immutable writes never publish partial intents or snapshots', t => {
  const root = fixture(t);
  const write = fs.writeFileSync;
  let interrupt = true;
  t.mock.method(fs, 'writeFileSync', (file, bytes, ...args) => {
    if (interrupt && typeof file === 'number' && String(bytes).includes('interrupt-me')) {
      write(file, String(bytes).slice(0, 8), ...args);
      throw Object.assign(new Error('Simulated full disk'), { code: 'ENOSPC' });
    }
    return write(file, bytes, ...args);
  });
  const count = readEvents(root).length;
  assert.throws(() => intake(root, { id: 'I1', text: 'interrupt-me' }, 'KERNEL'), /full disk/);
  assert.equal(fs.existsSync(path.join(root, 'C3.3/pending.json')), false);
  assert.equal(readEvents(root).length, count);
  assert.equal(status(root).running, null);
  assert.throws(() => immutable(root, 'C3.3/spool/retry.json', 'interrupt-me'), /full disk/);
  assert.equal(fs.existsSync(path.join(root, 'C3.3/spool/retry.json')), false);
  interrupt = false;
  intake(root, { id: 'I1', text: 'interrupt-me' }, 'KERNEL');
  immutable(root, 'C3.3/spool/retry.json', 'interrupt-me');
  assert.throws(() => immutable(root, 'C3.3/spool/retry.json', 'replacement'), /EEXIST/);
  assert.equal(fs.readFileSync(path.join(root, 'C3.3/spool/retry.json'), 'utf8'), 'interrupt-me');
  assert.ok(!fs.readdirSync(path.join(root, 'C3.3')).some(name => name.endsWith('.tmp')));
  assert.ok(!fs.readdirSync(path.join(root, 'C3.3/spool')).some(name => name.endsWith('.tmp')));
  assert.equal(verifyHarness(root).ok, true);
});

test('oversized evidence is rejected before reading or hashing its body', t => {
  const root = fixture(t);
  fs.writeFileSync(path.join(root, 'large.bin'), Buffer.alloc(131072));
  intake(root, { id: 'I1', text: 'Check evidence budget' }, 'KERNEL');
  const read = fs.readFileSync;
  let reads = 0;
  t.mock.method(fs, 'readFileSync', (file, ...args) => {
    if (typeof file === 'string' && path.basename(file) === 'large.bin') { reads++; throw new Error('Unbounded evidence read'); }
    return read(file, ...args);
  });
  const count = readEvents(root).length;
  assert.throws(() => createPlan(root, planInput(1, { evidence: [{ path: 'large.bin', sha256: '0'.repeat(64) }] }), 'PLANER'), /input budget/);
  assert.equal(reads, 0);
  assert.equal(readEvents(root).length, count);
});

test('status routes critique before approvals and rejects unapprovable tools', t => {
  const root = fixture(t);
  begin(root, 1, { actions: [{ id: 'A1', tool: 'build', kind: 'promotion' }] });
  assert.equal(status(root).next.action, 'critique');
  critique(root, 'P1', 'pass', 'Review bounded promotion', 'DEVIL');
  assert.equal(status(root).next.action, 'review-gates');
  judge(root, 'P1', 'fail', 'Approval not provided', 'DEVIL');
  assert.equal(status(root).next.action, 'ledger');
  finalLedger(root, 'P1', 'negative'); closeCycle(root, 'KERNEL');
  begin(root, 2, { actions: [{ id: 'A1', tool: 'unknown', kind: 'local' }] });
  assert.equal(status(root).next.action, 'critique');
  critique(root, 'P2', 'pass', 'Tool remains unavailable', 'DEVIL');
  assert.equal(status(root).next.action, 'reject-or-replan');
  assert.equal(status(root).next.owner, 'DEVIL');
});
