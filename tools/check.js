import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { ROOT, assemble, validateHTML } from './lib/project.js';
try {
  const {project,html,sources} = assemble();
  const actual = readFileSync(resolve(ROOT,'dist',project.artifact),'utf8');
  assert.equal(actual,html,'Built HTML is stale; run node tools/build.js');
  const report = validateHTML(actual,project);
  console.log(JSON.stringify({command:'check',version:project.version,modules:sources.length-2,...report},null,2));
} catch(error) { console.error(error.message); process.exitCode=1; }
