import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import {
  DEFAULT_POLICY, sha256, json, line, fail, keys, id, note, safePath, ensureDir, readBytes, readJson, exists,
  immutable, citation, verifyCitation, readPolicy, withLock, commit, role, stateOf, requireState
} from './harness-store.js';
import { memoryView, checkAdmission, verifyMemoryFrom, memoryStatsFrom } from './harness-memory.js';

export const DISPATCH = Object.freeze({ build: 'tools/build.js', check: 'tools/check.js' });
const KINDS = ['local', 'egress', 'irreversible', 'financial', 'promotion'];
const INDEX = {
  policy: 'harness/policy.json', bootstrap: 'C1/bootstrap.json', library: 'C2/index.json',
  plans: 'C3.1', execution: 'C3.2',
  memory: { events: 'C3.3/events.jsonl', sm: 'C3.3/sm.jsonl', mm: 'C3.3/mm.jsonl', lm: 'C3.3/lm.jsonl', compactions: 'C3.3/compactions.jsonl', positive: 'C3.3/positive.jsonl', negative: 'C3.3/negative.jsonl', spool: 'C3.3/spool' }
};
function getPlan(state, planId) {
  id(planId);
  const plan = state.plans[planId];
  if (!plan || plan.cycle !== state.cycle) fail('Plan not found in current cycle');
  return plan;
}
function currentPlan(root, state, planId) {
  const plan = getPlan(state, planId);
  verifyCitation(root, plan.snapshot);
  return plan;
}
function gates(plan) {
  return plan.actions.flatMap(action => {
    if (!Object.hasOwn(DISPATCH, action.tool)) return [{ actionId: action.id, gate: 'unknown-action', approvable: false }];
    if (action.kind !== 'local' && plan.approvals[action.id] !== plan.hash) return [{ actionId: action.id, gate: action.kind, approvable: true }];
    return [];
  });
}
function artifact(root, prefix, value, directory = 'C3.3/spool') {
  return immutable(root, `${directory}/${prefix}-${crypto.randomUUID()}.json`, line(value));
}
function boundSize(value, limit, name) { if (Buffer.byteLength(json(value)) > limit) fail(`${name} input budget exceeded`); }

export function initHarness(root) {
  for (const dir of ['harness', 'C1', 'C2', 'C3.1', 'C3.2', 'C3.3', 'C3.3/spool']) ensureDir(root, dir);
  return withLock(root, events => {
    if (stateOf(events).initialized) return { initialized: false, message: 'Already initialized; existing state was not overwritten', cycle: stateOf(events).cycle };
    if (events.length) fail('Unexpected journal without INIT');
    if (!exists(root, 'harness/policy.json')) immutable(root, 'harness/policy.json', `${JSON.stringify(DEFAULT_POLICY, null, 2)}\n`);
    readPolicy(root);
    const bootstrap = {
      name: 'Zephyr local workflow harness', version: 1, cycleOrigin: 1,
      roles: DEFAULT_POLICY.roles,
      rule: 'Host instructions and permissions prevail. Explicit gates, exact evidence, append-only history. No autonomous model provider; role labels are not a security sandbox.'
    };
    // Deterministic bootstrap artifacts permit safe recovery of an interrupted first initialization.
    const created = {};
    for (const [relative, value] of [['C1/bootstrap.json', bootstrap], ['C2/index.json', { rules: ['C1/bootstrap.json'] }], ['omni_index.json', INDEX]]) {
      const bytes = `${JSON.stringify(value, null, 2)}\n`;
      if (exists(root, relative)) {
        if (!readBytes(root, relative).equals(Buffer.from(bytes))) fail(`Refusing to overwrite existing initialization artifact: ${relative}`);
        created[relative] = citation(root, relative);
      } else created[relative] = immutable(root, relative, bytes);
    }
    const row = { t: 'R-LOCAL', so: 'local-authority', st: 'rule', n: 'Host instructions prevail. Explicit gates and exact-path evidence are mandatory. Role labels are not an OS sandbox.', s: created['C1/bootstrap.json'], c: 1 };
    const memory = { rows: [{ tier: 'lm', row }] };
    checkAdmission(root, events, memory);
    commit(root, events, 'KERNEL', 'INIT', { cycle: 1, artifacts: Object.values(created), memory });
    return { initialized: true, cycle: 1, index: 'omni_index.json', ruleId: row.t };
  });
}
export function status(root) {
  return withLock(root, events => {
    const state = requireState(events, { running: true, stopped: true });
    const plans = Object.values(state.plans).filter(p => p.cycle === state.cycle).map(p => ({ id: p.id, hash: p.hash, snapshot: p.snapshot.path, critique: p.critique, veto: p.veto, gates: gates(p), execution: p.execution, judgement: p.judgement, ledger: p.ledger?.outcome ?? null }));
    let next = { action: 'intake', owner: 'KERNEL', gate: null, pointer: 'omni_index.json' };
    if (state.stopped) next = { action: 'resume', owner: 'HUMAN', gate: 'emergency-stop', pointer: 'C3.3/events.jsonl' };
    else if (state.running) next = { action: 'wait-or-stop', owner: 'WORKER', gate: 'execution-in-progress', pointer: 'C3.2' };
    else if (!state.boundary) {
      const unplanned = Object.values(state.intakes).find(i => i.cycle === state.cycle && !Object.values(state.plans).some(p => p.intakeId === i.id));
      const p = plans.find(p => !p.ledger);
      if (unplanned) next = { action: 'plan', owner: 'PLANER', gate: 'budget-and-rule-citation', pointer: 'C3.3/events.jsonl' };
      else if (!p) next = { action: 'close', owner: 'KERNEL', gate: null, pointer: 'C3.1' };
      else if (p.judgement) next = { action: 'ledger', owner: 'MEMORY', gate: 'evidence-required', pointer: p.snapshot };
      else if (p.veto) next = { action: 'reject-or-replan', owner: 'DEVIL', gate: 'veto', pointer: p.snapshot };
      else if (!p.critique) next = { action: 'critique', owner: 'DEVIL', gate: 'explicit-critique', pointer: p.snapshot };
      else if (p.gates.some(g => !g.approvable)) next = { action: 'reject-or-replan', owner: 'DEVIL', gate: 'unknown-action', pointer: p.snapshot };
      else if (p.gates.length) next = { action: 'review-gates', owner: 'HUMAN', gate: p.gates.map(g => g.gate).join(','), pointer: p.snapshot };
      else if (!p.execution) next = { action: 'execute', owner: 'WORKER', gate: null, pointer: p.snapshot };
      else if (!p.judgement) next = { action: 'judge', owner: 'DEVIL', gate: 'explicit-judgement', pointer: p.execution.result?.path ?? p.snapshot };
      else next = { action: 'ledger', owner: 'MEMORY', gate: 'evidence-required', pointer: p.snapshot };
    }
    const blockedHistory = events.filter(e => e.type === 'CLOSE').flatMap(e => e.data.blocked ?? []);
    return { cycle: state.cycle, boundary: state.boundary, stopped: state.stopped, running: state.running, events: events.length, plans, blockedHistory, next };
  });
}
export function snapshotEvidence(root, relative, actor) {
  role(actor, 'MEMORY');
  return withLock(root, events => {
    requireState(events);
    const bytes = readBytes(root, relative, readPolicy(root).limits.maxInputBytes);
    const source = { path: relative, sha256: sha256(bytes) };
    const ref = immutable(root, `C3.3/spool/evidence-${crypto.randomUUID()}.bin`, bytes);
    commit(root, events, actor, 'SNAPSHOT', { source, snapshot: ref });
    return ref;
  });
}
export function intake(root, input, actor) {
  role(actor, 'KERNEL');
  keys(input, ['id', 'text'], 'intake');
  id(input.id);
  if (typeof input.text !== 'string' || !input.text.trim()) fail('Intake text required; it is data, never executable instructions');
  return withLock(root, events => {
    const state = requireState(events);
    boundSize(input, readPolicy(root).limits.maxInputBytes, 'Intake');
    if (Object.hasOwn(state.intakes, input.id)) fail('Duplicate intake ID');
    const cycle = state.closed ? state.cycle + 1 : state.cycle;
    commit(root, events, actor, 'INTAKE', { cycle, intake: input });
    return { id: input.id, cycle, next: 'plan' };
  });
}
export function createPlan(root, input, actor) {
  role(actor, 'PLANER');
  keys(input, ['id', 'intakeId', 'ruleId', 'budget', 'actions', 'evidence'], 'plan');
  id(input.id); id(input.intakeId); id(input.ruleId);
  keys(input.budget, ['maxActions', 'wallTimeMs', 'maxInputBytes', 'maxContextTokens'], 'budget');
  if (!Array.isArray(input.actions) || !input.actions.length) fail('Plan requires at least one action');
  if (!Array.isArray(input.evidence)) fail('Plan requires an evidence array (may be empty)');
  const actionIds = new Set();
  for (const action of input.actions) {
    keys(action, ['id', 'tool', 'kind'], 'action'); id(action.id); id(action.tool);
    if (actionIds.has(action.id)) fail('Duplicate action ID');
    actionIds.add(action.id);
    if (!KINDS.includes(action.kind)) fail('Unknown action kind');
  }
  return withLock(root, events => {
    const state = requireState(events);
    const policy = readPolicy(root);
    const request = state.intakes[input.intakeId];
    if (state.boundary || !request || request.cycle !== state.cycle) fail('A current-cycle intake is required');
    if (Object.hasOwn(state.plans, input.id)) fail('Duplicate plan ID');
    const rule = memoryView(events).active.lm.find(r => r.t === input.ruleId && r.st === 'rule');
    if (!rule) fail('Plan must cite an active long-term rule ID');
    verifyCitation(root, rule.s);
    for (const key of ['maxActions', 'wallTimeMs', 'maxInputBytes', 'maxContextTokens']) {
      const value = input.budget[key];
      if (!Number.isSafeInteger(value) || value < 1 || value > policy.limits[key]) fail(`Invalid or exceeded plan budget: ${key}`);
    }
    if (input.actions.length > input.budget.maxActions) fail('Action count exceeds budget');
    const tools = Object.fromEntries([...new Set(input.actions.map(a => a.tool))].filter(t => Object.hasOwn(DISPATCH, t)).map(t => [t, citation(root, DISPATCH[t])]));
    const plan = { ...input, tools, rule: rule.s };
    const inputLimit = Math.min(input.budget.maxInputBytes, input.budget.maxContextTokens * 4);
    let inputBytes = Buffer.byteLength(json(plan)) + Buffer.byteLength(json(request));
    if (inputBytes > inputLimit) fail('Input or estimated context budget exceeded');
    for (const ref of input.evidence) inputBytes += verifyCitation(root, ref, inputLimit - inputBytes).length;
    plan.measured = { inputBytes, estimatedContextTokens: Math.ceil(inputBytes / 4) };
    const relative = `C3.1/${input.id}.json`;
    const bytes = line(plan);
    const snapshot = { path: relative, sha256: sha256(bytes) };
    if (exists(root, relative)) verifyCitation(root, snapshot);
    else immutable(root, relative, bytes);
    commit(root, events, actor, 'PLAN', { cycle: state.cycle, plan, snapshot });
    return { id: input.id, hash: snapshot.sha256, snapshot, gates: gates({ ...plan, approvals: {}, hash: snapshot.sha256 }) };
  });
}
export function critique(root, planId, decision, reason, actor) {
  role(actor, 'DEVIL');
  if (!['pass', 'veto'].includes(decision)) fail('Critique decision must be pass or veto');
  const n = note(reason);
  return withLock(root, events => {
    const state = requireState(events);
    const plan = currentPlan(root, state, planId);
    if (plan.execution || plan.judgement || plan.veto) fail('Executed, judged, or vetoed plan cannot receive another critique; create a new plan');
    const data = { planId, planHash: plan.hash, decision, note: n };
    if (decision === 'veto') {
      const ref = artifact(root, 'veto', data);
      data.ledger = { id: `V-${crypto.randomUUID()}`, planId, planHash: plan.hash, outcome: 'negative', note: n, evidence: [plan.snapshot, ref], cycle: state.cycle, gate: 'veto' };
      // The veto must remain available even when memory admission is full; its journal ledger is authoritative.
    }
    commit(root, events, actor, 'CRITIQUE', data);
    return data;
  });
}
export function approve(root, planId, planHash, actionId, acknowledgement, actor) {
  role(actor, 'HUMAN'); note(acknowledgement); id(actionId);
  return withLock(root, events => {
    const state = requireState(events);
    const plan = currentPlan(root, state, planId);
    if (plan.hash !== planHash) fail('Approval must name the exact plan hash');
    if (plan.veto || plan.critique !== 'pass') fail('Pending critique or veto blocks approval');
    if (plan.execution || plan.judgement) fail('Plan has already progressed beyond approval');
    const action = plan.actions.find(a => a.id === actionId);
    if (!action || !Object.hasOwn(DISPATCH, action.tool)) fail('Unknown actions cannot be approved or dispatched');
    if (action.kind === 'local') fail('Local actions require critique, not a HUMAN approval');
    if (plan.approvals[actionId]) fail('Action already approved');
    commit(root, events, actor, 'APPROVE', { planId, planHash, actionId, acknowledgement });
    return { approved: actionId, planHash };
  });
}
function safeEnvironment() {
  // Do not inherit Node injection flags or executable search customizations.
  const env = {};
  for (const name of ['SystemRoot', 'SYSTEMROOT', 'WINDIR', 'TEMP', 'TMP', 'TMPDIR', 'HOME', 'USERPROFILE', 'LANG']) if (process.env[name] !== undefined) env[name] = process.env[name];
  env.NO_COLOR = '1';
  return env;
}
function runTool(root, tool, remaining, outputLimit, startSeq) {
  return new Promise(resolve => {
    const start = Date.now();
    let stdout = Buffer.alloc(0), stderr = Buffer.alloc(0), reason = null, poll;
    let child;
    const finish = (code, signal, error = null) => {
      clearInterval(poll); clearTimeout(timer);
      resolve({ tool, code, signal, error, reason, wallTimeMs: Date.now() - start, stdout: stdout.toString('utf8'), stderr: stderr.toString('utf8'), ok: code === 0 && !reason && !error });
    };
    // Literal arrays only: no user arguments, no shell, no test dispatch.
    const argv = tool === 'build' ? [safePath(root, 'tools/build.js')] : [safePath(root, 'tools/check.js')];
    child = spawn(process.execPath, argv, { cwd: path.resolve(root), shell: false, windowsHide: true, env: safeEnvironment(), stdio: ['ignore', 'pipe', 'pipe'] });
    const kill = why => { if (!reason) reason = why; child.kill('SIGKILL'); };
    const timer = setTimeout(() => kill('wall-time-budget'), remaining);
    const capture = (chunk, channel) => {
      const available = outputLimit - stdout.length - stderr.length;
      const keep = chunk.subarray(0, Math.max(0, available));
      if (channel === 'stdout') stdout = Buffer.concat([stdout, keep]); else stderr = Buffer.concat([stderr, keep]);
      if (chunk.length > available) kill('output-budget');
    };
    child.stdout.on('data', chunk => capture(chunk, 'stdout'));
    child.stderr.on('data', chunk => capture(chunk, 'stderr'));
    let spawnError = null;
    child.on('error', error => { spawnError = error.message; });
    child.on('close', (code, signal) => finish(code, signal, spawnError));
    poll = setInterval(() => {
      try {
        const stopped = withLock(root, events => events.some(e => e.type === 'STOP' && e.seq > startSeq));
        if (stopped) kill('emergency-stop');
      } catch (error) {
        if (!error.message.startsWith('Mutation lock held')) kill(`journal-error: ${error.message}`);
      }
    }, 40);
  });
}
export async function executePlan(root, planId, actor) {
  role(actor, 'WORKER');
  const prepared = withLock(root, events => {
    const state = requireState(events);
    const plan = currentPlan(root, state, planId);
    if (plan.execution || plan.judgement) fail('Plan cannot execute twice or after judgement');
    if (plan.veto || plan.critique !== 'pass') fail('Explicit passing critique required; veto remains blocked');
    if (gates(plan).length) fail('Unresolved HUMAN or unknown-action gate');
    for (const ref of [plan.rule, ...plan.evidence, ...Object.values(plan.tools)]) verifyCitation(root, ref);
    const policy = readPolicy(root);
    for (const key of ['maxActions', 'wallTimeMs', 'maxInputBytes', 'maxContextTokens']) {
      if (plan.budget[key] > policy.limits[key]) fail(`Plan budget exceeds current policy: ${key}`);
    }
    const started = commit(root, events, actor, 'EXECUTE_START', { planId, planHash: plan.hash, pid: process.pid });
    return { plan, seq: started.seq, policy };
  });
  const began = Date.now();
  const results = [];
  let failure = null;
  try {
    for (const action of prepared.plan.actions) {
      const remaining = prepared.plan.budget.wallTimeMs - (Date.now() - began);
      if (remaining <= 0) { failure = 'wall-time-budget'; break; }
      const stopped = withLock(root, events => events.some(e => e.type === 'STOP' && e.seq > prepared.seq));
      if (stopped) { failure = 'emergency-stop'; break; }
      verifyCitation(root, prepared.plan.tools[action.tool]);
      const result = await runTool(root, action.tool, remaining, prepared.policy.limits.outputBytes, prepared.seq);
      results.push({ actionId: action.id, ...result });
      if (!result.ok) { failure = result.reason ?? result.error ?? 'tool-failed'; break; }
    }
  } catch (error) { failure = error.message; }
  return withLock(root, events => {
    const state = requireState(events, { running: true, stopped: true });
    if (state.running?.seq !== prepared.seq) fail('Execution state changed; HUMAN recovery record already superseded this run');
    if (events.some(e => e.type === 'STOP' && e.seq > prepared.seq)) failure = 'emergency-stop';
    const report = { planId, planHash: prepared.plan.hash, ok: !failure && results.length === prepared.plan.actions.length, failure, wallTimeMs: Date.now() - began, results };
    if (report.wallTimeMs > prepared.plan.budget.wallTimeMs) { report.ok = false; report.failure ??= 'wall-time-budget'; }
    const result = artifact(root, 'run', report, 'C3.2');
    commit(root, events, actor, 'EXECUTE_END', { planId, planHash: prepared.plan.hash, ok: report.ok, result });
    return { ...report, evidence: result };
  });
}
export function judge(root, planId, decision, reason, actor) {
  role(actor, 'DEVIL');
  if (!['pass', 'fail'].includes(decision)) fail('Judgement must be pass or fail');
  note(reason);
  return withLock(root, events => {
    const state = requireState(events);
    const plan = currentPlan(root, state, planId);
    if (plan.judgement || plan.ledger) fail('Plan already judged');
    if (decision === 'pass' && (plan.veto || !plan.execution?.ok || gates(plan).length)) fail('Only successful, ungated execution can pass judgement');
    if (!plan.execution && !plan.critique) fail('Critique is required before judging an unexecuted plan');
    if (plan.execution?.result) verifyCitation(root, plan.execution.result);
    if (decision === 'pass') for (const ref of [plan.rule, ...plan.evidence, ...Object.values(plan.tools)]) verifyCitation(root, ref);
    commit(root, events, actor, 'JUDGE', { planId, planHash: plan.hash, decision, note: reason });
    return { planId, decision };
  });
}
export function appendLedger(root, input, actor) {
  role(actor, 'MEMORY');
  keys(input, ['planId', 'outcome', 'note', 'evidence'], 'ledger'); note(input.note);
  if (!['positive', 'negative'].includes(input.outcome) || !Array.isArray(input.evidence)) fail('Ledger requires outcome and evidence array');
  return withLock(root, events => {
    const state = requireState(events);
    const plan = currentPlan(root, state, input.planId);
    if (!plan.judgement || plan.ledger) fail('One explicit judgement and no prior final ledger required');
    if ((plan.judgement === 'pass') !== (input.outcome === 'positive')) fail('Ledger outcome contradicts judgement');
    const evidence = [...input.evidence, plan.snapshot, ...(plan.execution?.result ? [plan.execution.result] : [])];
    for (const ref of evidence) verifyCitation(root, ref);
    const ledger = { id: `L-${crypto.randomUUID()}`, planId: plan.id, planHash: plan.hash, outcome: input.outcome, note: input.note, evidence, cycle: state.cycle };
    if (plan.veto || gates(plan).length) ledger.gate = plan.veto ? 'veto' : gates(plan).map(g => g.gate).join(',');
    const bytes = line(ledger);
    const ref = { path: `C3.3/spool/ledger-${crypto.randomUUID()}.json`, sha256: sha256(bytes) };
    const row = { t: ledger.id, so: plan.id, st: input.outcome, n: input.note, s: ref, c: state.cycle };
    if (ledger.gate) row.g = 'review-required';
    const memory = { rows: [{ tier: 'sm', row }] };
    const memoryDeferred = !memoryStatsFrom([...events, { type: 'MEMORY', data: { memory } }], readPolicy(root)).withinCapacity;
    immutable(root, ref.path, bytes);
    if (!memoryDeferred) checkAdmission(root, events, memory);
    commit(root, events, actor, 'LEDGER', { planId: plan.id, ledger, snapshot: ref, ...(memoryDeferred ? { deferredMemory: memory } : { memory }) });
    return { ...ledger, memoryDeferred };
  });
}
export function closeCycle(root, actor) {
  role(actor, 'KERNEL');
  return withLock(root, events => {
    const state = requireState(events);
    if (state.boundary) fail('No open cycle to close');
    const plans = Object.values(state.plans).filter(p => p.cycle === state.cycle);
    const requests = Object.values(state.intakes).filter(i => i.cycle === state.cycle);
    if (!plans.length || plans.some(p => !p.ledger) || requests.some(i => !plans.some(p => p.intakeId === i.id))) fail('Cannot close: every intake needs a plan, judgement, and evidence ledger');
    verifyFrom(root, events);
    const blocked = plans.filter(p => p.veto || gates(p).length).map(p => ({ planId: p.id, gates: p.veto ? ['veto'] : gates(p).map(g => g.gate), pointer: p.snapshot.path }));
    commit(root, events, actor, 'CLOSE', { cycle: state.cycle, blocked, next: { action: 'intake-or-review-blocked', owner: 'KERNEL', pointer: 'omni_index.json' } });
    return { closed: state.cycle, nextCycle: state.cycle + 1, blocked };
  });
}
export function emergency(root, operation, acknowledgement, actor) {
  role(actor, 'HUMAN'); note(acknowledgement);
  if (!['stop', 'resume'].includes(operation)) fail('Expected stop or resume');
  return withLock(root, events => {
    const state = requireState(events, { running: true, stopped: true });
    if (operation === 'resume' && !state.stopped) fail('Harness is not stopped');
    if (operation === 'resume' && state.running) fail('Wait for running work to terminate or explicitly recover before resuming');
    commit(root, events, actor, operation.toUpperCase(), { acknowledgement });
    return { stopped: operation === 'stop' };
  });
}
export function recoverExecution(root, planId, acknowledgement, actor) {
  role(actor, 'HUMAN'); note(acknowledgement);
  return withLock(root, events => {
    const state = requireState(events, { running: true, stopped: true });
    if (!state.stopped || state.running?.planId !== planId) fail('Recovery requires emergency stop and the exact running plan');
    // Do not supersede a still-live executor. PID reuse conservatively blocks recovery.
    try { process.kill(state.running.pid, 0); fail('Executor PID is still alive; wait for it to finish'); } catch (error) { if (error.code !== 'ESRCH') throw error; }
    const plan = currentPlan(root, state, planId);
    const result = artifact(root, 'interrupted', { planId, ok: false, acknowledgement, residual: 'Executor ended without a completion record. Effects are unknown; no retry is automatic.' }, 'C3.2');
    commit(root, events, actor, 'EXECUTE_END', { planId, planHash: plan.hash, ok: false, result, recovered: true });
    return { recovered: planId, evidence: result, next: 'HUMAN resume, then DEVIL fail judgement and negative ledger' };
  });
}
export function verifyFrom(root, events) {
  readPolicy(root);
  for (const event of events) {
    const d = event.data;
    for (const ref of d.artifacts ?? []) verifyCitation(root, ref);
    if (d.snapshot) verifyCitation(root, d.snapshot);
    if (d.result) verifyCitation(root, d.result);
    if (d.plan) {
      if (!readBytes(root, d.snapshot.path).equals(Buffer.from(line(d.plan)))) fail('Plan snapshot differs from journal');
      for (const ref of [d.plan.rule, ...d.plan.evidence, ...Object.values(d.plan.tools)]) verifyCitation(root, ref);
    }
    for (const ref of d.ledger?.evidence ?? []) verifyCitation(root, ref);
  }
  const memory = verifyMemoryFrom(root, events);
  return { ok: true, events: events.length, memory, capacity: memoryStatsFrom(events, readPolicy(root)).withinCapacity };
}
export function verifyHarness(root) {
  return withLock(root, events => { requireState(events, { running: true, stopped: true }); return verifyFrom(root, events); });
}
