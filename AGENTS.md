# A2 harness entry point

Read `omni_index.json` and `harness/policy.json` first. Use `node tools/harness.js --help` and `node tools/memctl.js --help` for supported workflow and memory commands.

This is a local, host-neutral development harness. Role labels organize work; they are not OS permissions, separate model processes, or an encryption guarantee. Host instructions and permission controls remain authoritative. Never install DSH hooks or change Qoder settings as part of this project.

Use KERNEL for routing, PLANER for budgeted plans, DEVIL for critique, WORKER for approved execution, MEMORY for evidence and memory, and HUMAN for explicit gated decisions. Keep evidence path-bound and SHA-256 verified. Do not inherit A1 approvals, queues, task history, seals or live memory. Historical governance is reference data in `harness/source-reference.json`.

Never use Git. Keep application JavaScript in `src/modules/*.js` and all executable project tools in modular `.js` files. `project.json` defines source order and release identity. These application modules share one classic-script lexical scope intentionally; do not wrap them separately or reorder them without testing.

Build with `node tools/build.js`; validate with `node tools/check.js`; run `node --test tests/*.test.js`. Use `node tools/serve.js` for loopback browser checks. Run benchmarks in EN and DE, exercise gameplay and replay, and check the extracted artifact via `file://`. Do not claim target-device GPU, touch or browser compatibility without evidence.

Deliver with `node tools/release.js`. Each immutable versioned ZIP in `releases/` must contain exactly one self-contained HTML, with inline JavaScript, CSS, shaders and generated WASM. No network resources, package dependencies, sidecars, documentation or source files inside the ZIP. Development requires Node.js 22+; the released HTML does not. WebGL2 is a browser requirement, not a bundled dependency. Preserve storage/replay schema compatibility independently of the release filename.

Increment `project.json` version and release number, and synchronize `package.json`, before changed releases. Never overwrite a published version. Keep build receipts and browser evidence outside the ZIP. Do not edit generated `dist/` HTML directly; rebuild it from modules.
