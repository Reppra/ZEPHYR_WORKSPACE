import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(process.argv[2] || '../A1/SUN_013.html');
const original = readFileSync(source, 'utf8');
const lines = original.split('\n');
const sha = value => createHash('sha256').update(value).digest('hex');
assert.match(original, /const GAME_VERSION='0\.8\.1'/);
assert.equal(lines[535].trim(), '<script>');
assert.equal(lines[5534].trim(), '</script>');
const ranges = [
  ['kernel',537,675], ['state',676,777], ['math',778,793],
  ['scores',794,836], ['daily',837,906], ['progression',907,1021],
  ['achievements',1022,1046], ['localization',1047,1197], ['settings',1198,1253],
  ['perks',1254,1351], ['arena',1352,1465], ['renderer',1466,1887],
  ['audio',1888,2038], ['spawn',2039,2180], ['combat',2181,2242],
  ['weapons',2243,2436], ['player',2437,2473], ['enemies',2474,2750],
  ['simulation',2751,2813], ['hud',2814,2901], ['input',2902,3397],
  ['transitions',3398,3457], ['replay',3458,3709], ['benchmark',3710,5189],
  ['downloads',5190,5238], ['controls',5239,5299], ['bindings',5300,5418],
  ['loop',5419,5463], ['settings-ui',5464,5494], ['boot',5495,5534]
];
const slice = (start,end) => lines.slice(start-1,end).join('\n')+'\n';
const css = slice(8,273);
const scripts = ranges.map(([name,start,end]) => ({name,path:`src/modules/${name}.js`,start,end,body:slice(start,end)}));
const template = slice(1,7)+'{{STYLES}}'+slice(274,536)+'{{SCRIPTS}}'+lines.slice(5534).join('\n');
assert.equal(template.replace('{{STYLES}}',css).replace('{{SCRIPTS}}',scripts.map(s=>s.body).join('')), original, 'Extraction must reconstruct A1 byte for byte');
const files = [
  ['src/index.template.html',template.replaceAll('0.8.1','{{VERSION}}')],
  ['src/styles.css',css],
  ...scripts.map(s=>[s.path,s.body.replaceAll("'0.8.1'","'__APP_VERSION__'")]),
  ['project.json',JSON.stringify({name:'REDBOLT',harness:'Zephyr',version:'0.8.2',release:14,artifact:'SUN_014.html',sourceVersion:'0.8.1',scriptScope:'ordered-classic-shared',template:'src/index.template.html',styles:'src/styles.css',modules:scripts.map(s=>s.path)},null,2)+'\n'],
  ['harness/source-reference.json',JSON.stringify({source:'A1',sourceArtifact:'SUN_013.html',sha256:sha(original),reconstruction:'byte-identical before version substitution',modules:scripts.map(({body,...s})=>({...s,sha256:sha(body)})),governance:['AGENTS.md','CONSTITUTION.md','MANIFESTO.md','MEM.md'].map(name=>{const text=readFileSync(resolve(dirname(source),name),'utf8');return {name,sha256:sha(text),text};}),scope:'Historical reference only. No old approvals, cycles, memory, remote settings or supremacy over host instructions are inherited.'},null,2)+'\n'],
  ['LICENSE',readFileSync(resolve(dirname(source),'SUN_012_repo/LICENSE'),'utf8')]
];
for(const [path] of files) assert.ok(!existsSync(resolve(root,path)),`Refusing to overwrite ${path}`);
for(const [path,body] of files) writeFileSync(resolve(root,path),body,{flag:'wx'});
console.log(JSON.stringify({ok:true,sourceSha256:sha(original),modules:scripts.length,reconstruction:'byte-identical',version:'0.8.2'}));
