import fs from 'node:fs';
import path from 'node:path';
import { readBytes, fail, role, DEFAULT_POLICY } from './harness-store.js';
import { initHarness, status, snapshotEvidence, intake, createPlan, critique, approve, executePlan, judge, appendLedger, closeCycle, emergency, recoverExecution, verifyHarness } from './harness-core.js';
import { memoryStats, verifyMemory, appendMemory, compactMemory } from './harness-memory.js';

export const HARNESS_HELP = `Zephyr local workflow harness — Node built-ins only
Roles describe manual workflow separation, NOT authentication or an OS sandbox.
No autonomous AI provider, arbitrary shell, networking, Git, or test dispatch.
Host instructions and permissions prevail. No source-project authority is inherited.

Run from this project (or add --root ABSOLUTE_PROJECT_PATH):
  node tools/harness.js init
  node tools/harness.js status
  node tools/harness.js verify
  node tools/harness.js intake --role KERNEL --input @request.json
  node tools/harness.js plan --role PLANER --input @plan.json
  node tools/harness.js critique --role DEVIL --plan P1 --decision pass --note "Budget and evidence reviewed"
  node tools/harness.js approve --role HUMAN --plan P1 --hash FULL_PLAN_SHA256 --action A1 --ack "I approve this exact action"
  node tools/harness.js execute --role WORKER --plan P1
  node tools/harness.js judge --role DEVIL --plan P1 --decision pass --note "Checked the execution evidence"
  node tools/harness.js ledger --role MEMORY --input @ledger.json
  node tools/harness.js close --role KERNEL
  node tools/harness.js snapshot --role MEMORY --input path/to/evidence.txt
  node tools/harness.js stop --role HUMAN --ack "Stop local execution now"
  node tools/harness.js resume --role HUMAN --ack "I reviewed the stop and acknowledge resuming"
  node tools/harness.js recover --role HUMAN --plan P1 --ack "Dead executor reviewed; effects remain unknown"

Input accepts inline JSON, @root-relative/file.json, a root-relative path, or - (stdin).
Paths must use forward slashes; traversal, absolute input paths and symlinks are rejected.
request.json: {"id":"I1","text":"Build and check the local application"}
plan.json: {"id":"P1","intakeId":"I1","ruleId":"R-LOCAL","budget":{"maxActions":2,"wallTimeMs":30000,"maxInputBytes":65536,"maxContextTokens":16384},"actions":[{"id":"A1","tool":"build","kind":"local"},{"id":"A2","tool":"check","kind":"local"}],"evidence":[]}
ledger.json: {"planId":"P1","outcome":"positive","note":"Build and check passed review","evidence":[]}
Evidence entries: {"path":"C3.3/spool/exact-file.bin","sha256":"FULL_LOWERCASE_SHA256"}.
Snapshot returns a full citation. Plan/run citations are added to the final ledger automatically.

Only fixed tools/build.js and tools/check.js run, using this Node executable and no user arguments.
Kinds: local, egress, irreversible, financial, promotion. Non-local kinds require HUMAN approval
for the exact immutable plan hash AND action ID, after DEVIL pass. Approval never enables
networking or unknown tools. Unknown tools stay gated; test is deliberately not allowlisted.
Veto cannot be cleared or approved: record fail judgement/negative ledger, then create a new plan.
Pending gates cannot silently execute. Rejected gated work remains cited in the close record.
One execution per plan. Failed work requires fail judgement and a negative ledger before closing.
Every intake needs a plan and every plan needs judgement plus evidence before close.
A full memory tier defers the ledger's memory row, never its authoritative evidence or cycle closure.
The next intake starts the next cycle. Compaction is allowed only at a closed boundary.

Emergency stop requires explicit HUMAN acknowledgement and interrupts the direct child.
It cannot undo effects or sandbox child code. Resume cannot race a running execution.
If an executor died, stop then recover checks that its PID is absent; effects remain unknown.
A crashed .mutation.lock is not automatically stolen: confirm no writer, remove only that
lock manually, then retry to recover the durable intent and append-only projections.
Input/context budgets are UTF-8 byte/4 estimates, not measured provider token usage.
Files and allowlisted tool code must be trusted; no encryption or OS immutability is claimed.
`;
export const MEMORY_HELP = `Zephyr append-only memory control
  node tools/memctl.js stats
  node tools/memctl.js verify
  node tools/memctl.js capacity
  node tools/memctl.js append --role MEMORY --tier sm --input @row.json
  node tools/memctl.js compact --role MEMORY
All commands accept --root ABSOLUTE_PROJECT_PATH. JSON input also accepts - or inline JSON.
row.json: {"t":"M1","so":"build-review","st":"positive","n":"Local build evidence reviewed","s":{"path":"C3.3/spool/evidence-ID.bin","sha256":"FULL_LOWERCASE_SHA256"},"c":1}
Use harness snapshot to freeze evidence first. Notes contain at most 25 words.
sm accepts live/positive/rule/negative/closed/blocked/gated/residual; blocked/gated need g (gate ID).
lm accepts manual rules; mm and digest rows are compactor-owned. IDs are globally unique.
Compaction only at an explicitly closed boundary: older eligible sm groups become mm;
4 matching mm rows from 4 distinct cycles spanning MORE than 3 cycles may become lm.
Rules, negatives, tombstones, blocked/gated/residual rows and rows naming gates are preserved.
Original tiers and immutable spool snapshots are never deleted. Compaction records derive active rows.
Stats distinguish physical history, active capacity and deferred ledger rows; token figures estimate UTF-8 bytes / 4.
Boundary compaction admits deferred ledger rows when capacity permits; evidence stays in the journal.
Capacity exits nonzero on any active row/byte or physical byte cap breach.
Role labels are workflow separation, not authentication or an OS security sandbox.
`;

function parse(argv) {
  const command = argv[0] ?? 'help';
  if (command === '--help' || command === '-h') return { command: 'help', options: {} };
  const options = {};
  for (let index = 1; index < argv.length; index += 2) {
    const name = argv[index];
    const value = argv[index + 1];
    if (!/^--[a-z]+$/.test(name) || value === undefined || value.startsWith('--')) fail('Options require --name value pairs; use help for concrete usage');
    const key = name.slice(2);
    if (Object.hasOwn(options, key)) fail(`Duplicate option: ${name}`);
    options[key] = value;
  }
  return { command, options };
}
function allowed(options, names) {
  for (const name of Object.keys(options)) if (!['root', ...names].includes(name)) fail(`Unknown option: --${name}`);
}
function required(options, name) { if (!options[name]) fail(`Missing --${name}`); return options[name]; }
export function inputJson(root, spec) {
  if (!spec) fail('Missing --input');
  let bytes;
  if (spec === '-') {
    const chunks = []; let total = 0;
    const buffer = Buffer.alloc(8192);
    for (;;) {
      const count = fs.readSync(0, buffer, 0, buffer.length, null);
      if (!count) break;
      total += count;
      if (total > DEFAULT_POLICY.limits.maxInputBytes) fail('Input budget exceeded');
      chunks.push(Buffer.from(buffer.subarray(0, count)));
    }
    bytes = Buffer.concat(chunks);
  } else if (spec.trim().startsWith('{')) bytes = Buffer.from(spec);
  else bytes = readBytes(root, spec.startsWith('@') ? spec.slice(1) : spec, DEFAULT_POLICY.limits.maxInputBytes);
  if (bytes.length > DEFAULT_POLICY.limits.maxInputBytes) fail('Input budget exceeded');
  return JSON.parse(bytes.toString('utf8'));
}
function rootFor(options, defaultRoot) {
  const root = options.root ?? defaultRoot;
  if (!path.isAbsolute(root)) fail('--root must be an absolute path');
  return path.resolve(root);
}
export async function runHarnessCLI(argv, defaultRoot) {
  const { command, options: o } = parse(argv);
  const root = rootFor(o, defaultRoot);
  switch (command) {
    case 'help': allowed(o, []); return HARNESS_HELP;
    case 'init': allowed(o, ['role']); if (o.role) role(o.role, 'KERNEL'); return initHarness(root);
    case 'status': allowed(o, []); return status(root);
    case 'verify': allowed(o, []); return verifyHarness(root);
    case 'intake': allowed(o, ['role', 'input']); return intake(root, inputJson(root, o.input), required(o, 'role'));
    case 'plan': allowed(o, ['role', 'input']); return createPlan(root, inputJson(root, o.input), required(o, 'role'));
    case 'critique': allowed(o, ['role', 'plan', 'decision', 'note']); return critique(root, required(o, 'plan'), required(o, 'decision'), required(o, 'note'), required(o, 'role'));
    case 'approve': allowed(o, ['role', 'plan', 'hash', 'action', 'ack']); return approve(root, required(o, 'plan'), required(o, 'hash'), required(o, 'action'), required(o, 'ack'), required(o, 'role'));
    case 'execute': allowed(o, ['role', 'plan']); return executePlan(root, required(o, 'plan'), required(o, 'role'));
    case 'judge': allowed(o, ['role', 'plan', 'decision', 'note']); return judge(root, required(o, 'plan'), required(o, 'decision'), required(o, 'note'), required(o, 'role'));
    case 'ledger': allowed(o, ['role', 'input']); return appendLedger(root, inputJson(root, o.input), required(o, 'role'));
    case 'close': allowed(o, ['role']); return closeCycle(root, required(o, 'role'));
    case 'snapshot': allowed(o, ['role', 'input']); return snapshotEvidence(root, required(o, 'input'), required(o, 'role'));
    case 'stop': case 'resume': allowed(o, ['role', 'ack']); return emergency(root, command, required(o, 'ack'), required(o, 'role'));
    case 'recover': allowed(o, ['role', 'plan', 'ack']); return recoverExecution(root, required(o, 'plan'), required(o, 'ack'), required(o, 'role'));
    default: fail(`Unknown harness command: ${command}. Use help.`);
  }
}
export async function runMemoryCLI(argv, defaultRoot) {
  const { command, options: o } = parse(argv);
  const root = rootFor(o, defaultRoot);
  switch (command) {
    case 'help': allowed(o, []); return MEMORY_HELP;
    case 'stats': case 'capacity': allowed(o, []); return memoryStats(root);
    case 'verify': allowed(o, []); return verifyMemory(root);
    case 'append': allowed(o, ['role', 'tier', 'input']); return appendMemory(root, required(o, 'tier'), inputJson(root, o.input), required(o, 'role'));
    case 'compact': allowed(o, ['role']); return compactMemory(root, required(o, 'role'));
    default: fail(`Unknown memory command: ${command}. Use help.`);
  }
}
