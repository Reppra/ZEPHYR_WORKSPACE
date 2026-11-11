import { readFileSync, realpathSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname, relative, isAbsolute, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { Script } from 'node:vm';
import assert from 'node:assert/strict';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const sha256 = body => createHash('sha256').update(body).digest('hex');
export function sourceFile(root, path) {
  assert.equal(typeof path,'string');
  assert.ok(!isAbsolute(path) && !path.split(/[\\/]/).includes('..'), 'Source path must stay inside project');
  const file = realpathSync(resolve(root,path));
  const rel = relative(realpathSync(root),file);
  assert.ok(rel !== '..' && !rel.startsWith('..'+sep) && !isAbsolute(rel), 'Source symlink escapes project');
  return file;
}
export function config(root = ROOT) {
  const value = JSON.parse(readFileSync(resolve(root,'project.json'),'utf8'));
  assert.match(value.version,/^\d+\.\d+\.\d+$/);
  assert.ok(Number.isSafeInteger(value.release) && value.release > 0);
  assert.equal(value.artifact,`SUN_${String(value.release).padStart(3,'0')}.html`);
  assert.ok(Array.isArray(value.modules) && value.modules.length > 1);
  assert.equal(new Set(value.modules).size,value.modules.length);
  assert.ok(value.modules.every(path=>/^src\/modules\/[a-z0-9-]+\.js$/.test(path)));
  return value;
}
export function assemble(root = ROOT) {
  const project = config(root);
  const read = path => readFileSync(sourceFile(root,path),'utf8');
  const template = read(project.template);
  for(const slot of ['{{STYLES}}','{{SCRIPTS}}']) assert.equal(template.split(slot).length,2,`Expected one ${slot}`);
  const modules = project.modules.map(path=>({path,body:read(path)}));
  modules.forEach(({path,body})=>new Script(body,{filename:path}));
  const scripts = modules.map(s=>s.body).join('').replaceAll('__APP_VERSION__',project.version);
  const html = template.replaceAll('{{VERSION}}',project.version).replace('{{STYLES}}',()=>read(project.styles)).replace('{{SCRIPTS}}',()=>scripts);
  const report = validateHTML(html,project);
  const sources = [project.template,project.styles,...project.modules].map(path=>({path,sha256:sha256(read(path))}));
  return {project,html,report,sources};
}
export function validateHTML(html, project) {
  assert.match(html,/^<!DOCTYPE html>/i);
  assert.equal((html.match(/<script\b/gi)||[]).length,1,'Exactly one inline script required');
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)];
  assert.equal(scripts.length,1);
  assert.ok(!/\bsrc\s*=|\btype\s*=/.test(scripts[0][1]),'Script must be inline classic JavaScript');
  new Script(scripts[0][2],{filename:project.artifact});
  assert.ok(!/\b(?:src|href|poster)\s*=\s*["'](?!data:|blob:|#)[^"']+/i.test(html),'External resource attribute');
  const styles = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi)].map(match=>match[1]).join('\n');
  assert.ok(!/@import\b|url\(\s*["']?(?!data:|blob:|#)/i.test(styles),'External CSS resource');
  assert.ok(!/\b(?:fetch|importScripts|WebSocket|EventSource|XMLHttpRequest|sendBeacon)\s*\(/.test(scripts[0][2]),'Runtime network dependency');
  assert.ok(!/\bimport\s*(?:\(|[{*])/.test(scripts[0][2]),'Runtime module dependency');
  assert.ok(!/\{\{(?:VERSION|STYLES|SCRIPTS)\}\}|__APP_VERSION__/.test(html),'Unresolved build token');
  assert.ok(html.includes(`const GAME_VERSION='${project.version}'`),'Version mismatch');
  assert.ok(html.includes(`id="verVal">${project.version}<`),'Version stamp mismatch');
  assert.ok(Buffer.byteLength(html)<1024*1024,'HTML exceeds 1 MiB budget');
  const testCount = (scripts[0][2].match(/\btest\('/g)||[]).length;
  assert.ok(testCount>=226,'Inherited benchmark tests missing');
  return {ok:true,bytes:Buffer.byteLength(html),sha256:sha256(html),inlineScripts:1,externalDependencies:0,benchmarkTestDeclarations:testCount};
}
export function build(root = ROOT) {
  const result = assemble(root);
  const directory = resolve(root,'dist');
  mkdirSync(directory,{recursive:true});
  writeFileSync(resolve(directory,result.project.artifact),result.html);
  return result;
}
