import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { Script, createContext, runInContext } from 'node:vm';
import { ROOT, assemble, sourceFile, validateHTML } from '../tools/lib/project.js';
import { crc32, createZip, inspectZip } from '../tools/lib/zip.js';

const bundle=assemble();
test('all application JavaScript modules are included exactly once',()=>{
  const files=readdirSync(resolve(ROOT,'src/modules')).filter(n=>n.endsWith('.js')).map(n=>'src/modules/'+n).sort();
  assert.deepEqual([...bundle.project.modules].sort(),files);
  assert.equal(files.length,30);
});
test('build is deterministic and fully inline',()=>{
  assert.equal(assemble().html,bundle.html);
  assert.equal(bundle.report.externalDependencies,0);
  assert.equal(bundle.report.inlineScripts,1);
  assert.equal(bundle.report.benchmarkTestDeclarations,226);
});
test('no third-party development dependencies',()=>{
  const pkg=JSON.parse(readFileSync(resolve(ROOT,'package.json'),'utf8'));
  assert.equal(Object.keys(pkg.dependencies||{}).length,0);
  assert.equal(Object.keys(pkg.devDependencies||{}).length,0);
  assert.equal(pkg.version,bundle.project.version);
});
test('source reference records lossless absorption',()=>{
  const source=JSON.parse(readFileSync(resolve(ROOT,'harness/source-reference.json'),'utf8'));
  assert.equal(source.reconstruction,'byte-identical before version substitution');
  assert.equal(source.modules.length,30);
  assert.equal(source.sha256,'678015011f921721a37efc3e560fed7c0b03e6532a0f2e1e92dc201b454974dc');
});
test('source paths cannot escape project',()=>{
  for(const path of ['../A1/SUN_013.html','src/../../A1/SUN_013.html','C:/Windows/win.ini']) assert.throws(()=>sourceFile(ROOT,path));
});
test('validation rejects dependencies, broken syntax and stale version',()=>{
  for(const candidate of [
    bundle.html.replace('<script>','<script src="remote.js">'),
    bundle.html.replace('</head>','<link rel="stylesheet" href="remote.css"></head>'),
    bundle.html.replace('<style>','<style>@import "remote.css";'),
    bundle.html.replace('"use strict";','"use strict"; fetch("remote.json");'),
    bundle.html.replace('"use strict";','const broken = ;'),
    bundle.html.replace("const GAME_VERSION='0.8.2'","const GAME_VERSION='0.0.0'")
  ]) assert.throws(()=>validateHTML(candidate,bundle.project));
});
test('kernel WASM compiles and equals JavaScript fallback',()=>{
  const kernel=readFileSync(resolve(ROOT,'src/modules/kernel.js'),'utf8');
  const context=createContext({WebAssembly,showErr:()=>{}});
  new Script(kernel).runInContext(context);
  const result=runInContext(`(()=>{initKernel();const js=jsKernel();for(let i=-1000;i<1000;i++){if(K.hash2(i,i+2)!==js.hash2(i,i+2))return false;if(K.dist2q(i,3,i+1,5)!==js.dist2q(i,3,i+1,5))return false;}return K_WASM&&WebAssembly.validate(K_BYTES);})()`,context);
  assert.equal(result,true);
  const fallback=createContext({WebAssembly:undefined,showErr:()=>{}});
  new Script(kernel).runInContext(fallback);
  assert.equal(runInContext('initKernel(); !K_WASM && K.imul32(6,7)===42',fallback),true);
});
test('ZIP CRC matches standard test vector',()=>assert.equal(crc32(Buffer.from('123456789')),0xcbf43926));
test('ZIP is deterministic and contains exactly one standalone HTML',()=>{
  const zip=createZip(bundle.project.artifact,bundle.html);
  assert.deepEqual(zip,createZip(bundle.project.artifact,bundle.html));
  const result=inspectZip(zip);
  assert.equal(result.entries,1);
  assert.equal(result.name,bundle.project.artifact);
  assert.equal(result.data.toString(),bundle.html);
});
test('ZIP validator rejects corruption, extra entries, traversal and truncation',()=>{
  const zip=createZip(bundle.project.artifact,bundle.html);
  const badCrc=Buffer.from(zip);badCrc[14]^=1;
  const multiple=Buffer.from(zip);multiple.writeUInt16LE(2,multiple.length-12);
  const corrupt=Buffer.from(zip);corrupt[60]^=255;
  for(const bad of [badCrc,multiple,corrupt,zip.subarray(0,-5)]) assert.throws(()=>inspectZip(bad));
  assert.throws(()=>createZip('../escape.html',bundle.html));
});
