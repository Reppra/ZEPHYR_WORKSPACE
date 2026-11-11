import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { ROOT, build, sha256, validateHTML } from './lib/project.js';
import { createZip, inspectZip } from './lib/zip.js';

try {
  const {project,html,report,sources}=build();
  const tests=spawnSync(process.execPath,['--test','tests/*.test.js'],{cwd:ROOT,encoding:'utf8',timeout:120000});
  process.stdout.write(tests.stdout||''); process.stderr.write(tests.stderr||'');
  assert.equal(tests.status,0,tests.error?.message||'Release blocked: tests failed');
  const zip=createZip(project.artifact,html), inspected=inspectZip(zip);
  assert.equal(inspected.data.toString('utf8'),html);
  validateHTML(inspected.data.toString('utf8'),project);
  const filename=`SUN_${String(project.release).padStart(3,'0')}_v${project.version}.zip`;
  const archive=resolve(ROOT,'releases',filename);
  mkdirSync(resolve(ROOT,'releases'),{recursive:true});
  if(existsSync(archive)) assert.ok(readFileSync(archive).equals(zip),'Version already exists with different bytes; increment project version/release');
  else writeFileSync(archive,zip,{flag:'wx'});
  const receipt={version:project.version,release:project.release,archive:`releases/${filename}`,archiveBytes:zip.length,archiveSha256:sha256(zip),entries:[project.artifact],html:report,sources,tests:'node --test tests/*.test.js',runtime:'Offline browser; WebGL2 required; WASM optional; no network or package dependencies',development:'Node.js 22+; built-in modules only'};
  const receiptPath=resolve(ROOT,'releases',filename.replace('.zip','.receipt.json'));
  const receiptBody=JSON.stringify(receipt,null,2)+'\n';
  if(existsSync(receiptPath)) assert.equal(readFileSync(receiptPath,'utf8'),receiptBody,'Release receipt differs');
  else writeFileSync(receiptPath,receiptBody,{flag:'wx'});
  console.log(JSON.stringify({ok:true,...receipt},null,2));
} catch(error) { console.error(error.message); process.exitCode=1; }
