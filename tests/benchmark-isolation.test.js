import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createContext, runInContext } from 'node:vm';
import { ROOT } from '../tools/lib/project.js';

const code=readFileSync(resolve(ROOT,'src/modules/benchmark.js'),'utf8');
const snapshotCode=code.slice(code.indexOf('function snapshotDOM()'),code.indexOf('function runBenchmark()'));
function fixture() {
  const elements=new Map();
  function element(id) {
    if(elements.has(id)) return elements.get(id);
    const classes=new Set(), attributes=new Map();
    const el={id,type:'text',value:'4242',disabled:false,checked:false,textContent:id,style:{display:'',opacity:''},
      classList:{contains:key=>classes.has(key),toggle:(key,on)=>on?classes.add(key):classes.delete(key)},
      getAttribute:key=>attributes.get(key)??null,setAttribute:(key,value)=>attributes.set(key,value),removeAttribute:key=>attributes.delete(key)};
    elements.set(id,el);return el;
  }
  const input=element('seedInput'), button=element('benchmarkBtn'), upload=element('replayFile');
  upload.type='file';Object.defineProperty(upload,'value',{get:()=>'',set:()=>{throw new Error('File inputs cannot restore a selected path');}});
  const context=createContext({$:element,document:{body:{className:'original'},querySelectorAll:()=>[input,button,upload]}});
  runInContext(snapshotCode,context);
  return {context,element,input,button};
}
test('benchmark restores menu, panels, seed, disabled controls and labels',()=>{
  const {context,element,input,button}=fixture();
  runInContext('globalThis.saved=snapshotDOM()',context);
  element('overlay').setAttribute('class','hidden');element('photoBtn').setAttribute('style','display:flex');
  input.value='different';input.disabled=true;button.disabled=true;
  element('waveBig').textContent='PYRE';
  runInContext('restoreDOM(saved)',context);
  assert.equal(element('overlay').getAttribute('class'),null);
  assert.equal(element('photoBtn').getAttribute('style'),null);
  assert.equal(input.value,'4242');assert.equal(input.disabled,false);assert.equal(button.disabled,false);
  assert.equal(element('waveBig').textContent,'waveBig');
});
test('camera benchmark uses active translation rather than English literal',()=>{
  assert.ok(code.includes("lbl===t('pbCam')+': '+t('pbCamFirst')"));
  assert.ok(!code.includes('/CAM/.test(lbl)'));
});
test('benchmark finalization retains restored replay recording',()=>{
  const cleanup=code.slice(code.indexOf('} finally {\n    restoreState(snap)'),code.indexOf('  const pass=results.filter'));
  assert.ok(cleanup.includes('restoreState(snap)'));
  assert.ok(!cleanup.includes('replayLog=null'));
});
test('benchmark never requests native pointer lock',()=>{
  const input=readFileSync(resolve(ROOT,'src/modules/input.js'),'utf8');
  const fn=input.slice(input.indexOf('function requestLock()'),input.indexOf('function clearInput()'));
  const context=createContext({$:()=>({requestPointerLock:()=>{throw new Error('Native request attempted');}}),gameStarted:true,gameOver:false,paused:false,G:{mode:'playing'},LK:{state:'UNLOCKED',TIMEOUT:500},document:{pointerLockElement:null,hidden:false},isPointerLocked:false,performance:{now:()=>10000},lastLockExit:0,LOCK_COOLDOWN_MS:1000,benchRunning:true,lockErrors:0});
  runInContext(fn,context);
  const result=runInContext('requestLock()',context);
  assert.equal(result.ok,false);assert.equal(result.error,'benchmark isolation');
});
