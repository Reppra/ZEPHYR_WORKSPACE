import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createContext, runInContext } from 'node:vm';
import { ROOT } from '../tools/lib/project.js';

const replay=readFileSync(resolve(ROOT,'src/modules/replay.js'),'utf8');
test('recorded timestep preserves wave-boundary precision through JSON',()=>{
  const context=createContext({gameStarted:true,paused:false,gameOver:false,benchRunning:false,keys:{},touch:{},player:{wi:0}});
  runInContext(replay.slice(0,replay.indexOf('function buildReplayPayload()')),context);
  const result=runInContext(`replayLog={frames:[]};for(let i=0;i<120;i++)recordReplayFrame(1/60);JSON.parse(JSON.stringify(replayLog.frames))`,context);
  assert.equal(result.length,120);
  assert.ok(result.every(frame=>frame.dt===1/60));
  const live=Array.from({length:120},()=>1/60).reduce((sum,dt)=>sum+dt,0);
  const playback=result.reduce((sum,frame)=>sum+frame.dt,0);
  assert.equal(playback,live);
  assert.equal(playback>=2,live>=2);
});
