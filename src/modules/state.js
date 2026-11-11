/* ============================ GLOBAL STATE ============================ */
const $=id=>document.getElementById(id);
const DEBUG=new URLSearchParams(location.search).get('debug')==='1';
const GAME_VERSION='__APP_VERSION__';
const ARENA_W=48, ARENA_D=48, MAX_H=14;
const EYE_H=1.62, FOV=72*Math.PI/180, NEAR=0.08, FAR=220;
const MAG=12;
const WEAPONS=[
  {name:'PULSE',mag:12,cd:0.18,rel:1.1,dmg:18,dmgVar:8,pellets:1,spread:0,pierce:false,reserve:Infinity,max:Infinity},
  {name:'SCATTER',mag:6,cd:0.7,rel:1.5,dmg:6,dmgVar:4,pellets:7,spread:0.09,pierce:false,reserve:24,max:48},
  {name:'RAIL',mag:3,cd:0.9,rel:1.8,dmg:55,dmgVar:16,pellets:1,spread:0,pierce:true,reserve:9,max:18},
  {name:'ARC',mag:8,cd:0.32,rel:1.3,dmg:14,dmgVar:6,pellets:1,spread:0,pierce:false,reserve:16,max:32,chain:{jumps:3,radius:9,falloff:0.65}}];
const DIFF=[{name:'EASY',count:0.7,speed:0.8,hp:0.8,dmg:0.7},{name:'NORMAL',count:1,speed:1,hp:1,dmg:1},{name:'HARD',count:1.35,speed:1.2,hp:1.3,dmg:1.3}];
const WAVE_CADENCE=[{every:20,boss:'pyre',type:11},{every:15,boss:'hive',type:6},{every:10,boss:'lance',type:5},{every:5,boss:'warden',type:4}];
function waveCadence(w){
  try{
    const wave=Math.max(1,w|0);
    for(const c of WAVE_CADENCE)if(wave%c.every===0)return {ok:true,wave,boss:c.boss,type:c.type};
    return {ok:true,wave,boss:null,type:-1};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function waveSpawnCount(w){
  try{
    const wave=Math.max(1,w|0);
    const base=4+wave*2.2+(wave>=15?(wave-14)*1.5:0);
    return Math.round(base*(DIFF[difficulty]||DIFF[1]).count*(G.dynCount||1));
  }catch(e){return 0;}
}
const PAL={cyan:[0.13,0.88,1],red:[1,0.23,0.19],orange:[1,0.42,0.17],green:[0.36,1,0.55],amber:[1,0.69,0.13],magenta:[0.69,0.38,1],pink:[1,0.3,0.85]};
// work_008 T01: types 8/9/10 (7 is taken by SWARM); plan's 7/8/9 remapped, logged deviation D-W8-01
const ETYPES={turret:{type:8,hp:34,speed:0,size:1.0,dmg:10,color:PAL.magenta,ranged:true},
  dash:{type:9,hp:22,speed:3.4,size:0.9,dmg:16,color:PAL.pink,charge:true},
  shielder:{type:10,hp:40,speed:0.9,size:1.1,dmg:6,color:PAL.amber,aura:6.0}};
const SPAWN_TABLE=[{wave:1,types:[1,2]},{wave:3,types:[1,2,9]},{wave:5,types:[1,2,9,8]},{wave:8,types:[1,2,9,8,10]}];
function spawnTableFor(w){
  try{
    const wave=Math.max(1,w|0);
    let row=SPAWN_TABLE[0];
    for(const s of SPAWN_TABLE)if(wave>=s.wave)row=s;
    return {ok:true,types:row.types.slice()};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
let heights=new Int16Array(ARENA_W*ARENA_D);
let gl=null,canvas=null,progArena=null,progDyn=null,progSky=null;
let arenaVBO=null,arenaVAO=null,quadCount=0;
let cubeVBO=null,cubeVAO=null,instVBO=null,instData=new Float32Array(8*8192),instCount=0;
const INST_MAX=8192;
let skyVBO=null,skyVAO=null;
let projM=new Float32Array(16),viewM=new Float32Array(16),vpM=new Float32Array(16);
let W=1,H=1,DPR=1;
let LOW_GPU=false,renderScale=1,frameEMA=16,contextLost=false,idleAcc=0,adaptCooldown=0,GPU_RENDERER='';
const MAX_PIXELS=1600*1000,INSTANCE_SCALE_MAX=2.0,BEAM_MAX=64;
const PERF_BUDGET={frameMs:16.6,slowMs:30,fastMs:18,scaleMin:0.7};
let progBeam=null,beamVBO=null,beamVAO=null,beamData=new Float32Array(7*6*BEAM_MAX),beamCount=0;
const LIGHT_MAX=16,GLOW_MAX=32;
let lightData=new Float32Array(LIGHT_MAX*7),lightCount=0;
let lightPosArr=new Float32Array(LIGHT_MAX*3),lightColArr=new Float32Array(LIGHT_MAX*3),lightRadArr=new Float32Array(LIGHT_MAX);
let projLightCap=8,lightSlowFrames=0,lightFastFrames=0,lightsThrottledLogged=false;
let glows=[],glowData=new Float32Array(7*6*GLOW_MAX),glowCount=0;
let bootReady=false,gameStarted=false,gameOver=false,paused=false;
let isPointerLocked=false,lastLockExit=0,lockErrors=0;const LOCK_COOLDOWN_MS=1300;
/* VM mouse drivers + the Chromium pointer-lock re-entry bug can deliver NaN or 1e9-pixel deltas.
   Every raw pointer delta passes sanitizeDelta before it can reach player.yaw. */
const MAX_LOOK_DELTA=250;
const IN={sanN:0,sanMax:0,sanRec:0,lastTel:0,lockGrantAt:0,accX:0,accY:0,evHz:0,evCount:0,vmNoted:false};
/* NaN vertex data segfaults real GPU drivers (VM paravirtual / ANGLE-D3D); software rasterizers
   silently tolerate it, which is why MESH MELTDOWN never reproduced in the sandbox. The firewall
   converts that class of crash into a one-frame glitch plus telemetry. */
const FW={nearMiss:0,total:0,lastSanN:0,lastHeal:0,hitAt:0,hitStreak:0,catches:0,cooledAt:0};
let benchmarkDone=false,benchmarkPass=false,benchRunning=false;
/* work_010 P5: true while the acceptance harness runs. stormMouse/stormTouch are the sandbox stand-in
   for the hardware-only MESH MELTDOWN signal; SUPERphone + sandbox degrades to MESH COOLED instead. */
let SANDBOX=false;
let difficulty=1,sensitivity=1.0,muted=false;
let bestScore=0;
const player={x:24,y:3,z:24,vx:0,vy:0,vz:0,yaw:0,pitch:0,hp:100,wi:0,mags:WEAPONS.map(w=>w.mag),res:WEAPONS.map(w=>w.reserve),reloadWi:0,reloading:0,fireCd:0,grounded:true,
  rapid:0,shield:0,dmgBoost:0,hurtCd:0};
let enemies=[],particles=[],pickups=[],tracers=[],eproj=[];
const G={mode:'menu',score:0,combo:1,comboTimer:0,kills:0,wave:0,waveState:'intermission',waveTimer:2.5,
  toSpawn:0,spawnTimer:0,shots:0,hits:0,wshots:[0,0,0,0],whits:[0,0,0,0],dmgTaken:0,killsBy:[0,0,0,0,0,0,0,0,0,0,0,0],tookDamage:false,time:0,shake:0,muzzle:0,hitmark:0,rng:123456789,runSeed:123456789,banner:0,bannerText:'',bannerSub:'',toast:0,toastText:'',dynCount:1,waveDmg:0,daily:false,lightsThrottled:0,flags:{}};
const keys={};
const touch={mx:0,mz:0,lookX:0,lookY:0,fire:false,jump:false,active:false,stickId:null,lookId:null,fireId:null,fireTouch:false};
const TW={lastEvent:0,fireAt:0,lookAt:0,stickAt:0,ghosts:0,stale:0,idleMs:5000,staleMs:10000};
/* work_010 P4: tap-burst tracker. The Pointer Lock API does not exist for touch, so the SUPERphone
   equivalent is setPointerCapture surfaced through LK as 'CAPTURED', with the boom shake suppressed. */
const TP={times:[],captured:false,lastId:null,boomsSuppressed:0};
function isSuperphone(){try{return ('ontouchstart' in window)||navigator.maxTouchPoints>0;}catch(e){return false;}}
const ST={errors:0,mouse:null,touch:null};
const CR={ring:[],max:60,last:null,key:'sun011_crash_card',schema:'sun011.crash_card.v1'};
/* work_010 P2/P3: MC.anchor is deck-relative, so the cheese rides the SUPERvm platform and never the ground (C1). */
const MC={on:false,mx:0,my:0,anchor:{x:0,y:0},strikes:0,fixed:0,driftMax:0,deckX:0,until:0,seeded:false};
const MC_DECK={w:150,h:46,cheeseOffX:118,cheeseOffY:-14};
/* work_010 P6: five always-on critics. Cards are findings, never heartbeats — an idle healthy game is silent. */
const CF={ring:[],max:60,key:'sun011_critic_card',schema:'sun011.critic_card.v1',runs:0,cards:0,last:{}};
const CRITIC_FLEET=[{id:'ALPHA',domain:'INPUT'},{id:'BRAVO',domain:'MESH'},{id:'CHARLIE',domain:'PHYSICS'},{id:'DELTA',domain:'PERF'},{id:'ECHO',domain:'SUPERPHONE'}];
const CRITIC_CHECK={ALPHA:function(){try{const ground=MC.on&&(MC.anchor.y>window.innerHeight*0.75);
  if(ground){MC.strikes++;if(MC.strikes>=3){MC.strikes=0;MC.fixed++;mcReAnchor();return {msg:'ground cheese x3 -> re-anchored to SUPERvm deck (auto-fix #'+MC.fixed+')',fix:'mcReAnchor'};}return {msg:'mouse still looks for GROUND cheese (strike '+MC.strikes+'/3)'};}
  if(isSuperphone()&&TP.times.length>=5&&LK.state!=='CAPTURED')return {msg:'tap burst '+TP.times.length+' without LOCK (C3 regression)'};
  MC.strikes=0;return null;}catch(e){return null;}},BRAVO:function(){try{if(isSuperphone()&&SANDBOX&&FW.nearMiss>0)return {msg:'FW nearMiss='+FW.nearMiss+' inside SUPERphone sandbox (C4 regression)'};
  if(isSuperphone()&&SANDBOX&&FW.cooledAt&&performance.now()-FW.cooledAt<1500&&!CF._cooledNote){CF._cooledNote=true;return {msg:'MESH COOLED engaged (sandbox safe mode confirmed)',fix:null};}return null;}catch(e){return null;}},CHARLIE:function(){try{if(MC.on&&MC.driftMax>1){const d=MC.driftMax;MC.driftMax=0;mcReAnchor();return {msg:'cheese drift '+d.toFixed(2)+'px vs SUPERvm deck (C2 regression)',fix:'mcReAnchor'};}return null;}catch(e){return null;}},DELTA:function(){try{const now=performance.now();if(!CF._fpsAt||now-CF._fpsAt>10000){CF._fpsRef=fpsShown;CF._fpsAt=now;}
  if((CF._fpsRef||0)>30&&(fpsShown||0)<CF._fpsRef*0.7&&now-(CF._fpsCard||0)>30000){CF._fpsCard=now;return {msg:'fps '+CF._fpsRef+' -> '+fpsShown+' (-'+Math.round(100*(1-fpsShown/CF._fpsRef))+'%)',fix:null};}return null;}catch(e){return null;}},ECHO:function(){try{if(CF._stale===undefined)CF._stale=TW.stale;if(TW.stale>CF._stale+5){const d=TW.stale-CF._stale;CF._stale=TW.stale;return {msg:'touch stale events +'+d+' (SUPERphone input health)',fix:null};}CF._stale=TW.stale;return null;}catch(e){return null;}}};

