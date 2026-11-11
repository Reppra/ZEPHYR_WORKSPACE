/* ============================ REPLAY ============================ */
const REPLAY_MAX=18000;
let replayLog=null,replayCount=0,replayLook=[0,0],replayLastWi=-1,PB=null;
function recordReplayFrame(dt){
  try{
    if(!replayLog)return {ok:false,error:'not recording'};
    if(!gameStarted||paused||gameOver||benchRunning)return {ok:false,error:'inactive'};
    if(replayCount>=REPLAY_MAX){
      if(!replayLog.truncated)replayLog.truncated=true;
      return {ok:false,error:'replay full'};
    }
    let k=0;
    if(keys['KeyW']||keys['ArrowUp'])k|=1;
    if(keys['KeyA']||keys['ArrowLeft'])k|=2;
    if(keys['KeyS']||keys['ArrowDown'])k|=4;
    if(keys['KeyD']||keys['ArrowRight'])k|=8;
    if(keys['ShiftLeft']||keys['ShiftRight'])k|=16;
    if(keys['Space']||touch.jump)k|=32;
    if(keys['KeyR'])k|=64;
    let w=-1;
    if(player.wi!==replayLastWi){w=player.wi;replayLastWi=player.wi;}
    replayLog.frames.push({k,l:[+replayLook[0].toFixed(3),+replayLook[1].toFixed(3)],
      f:(keys['Mouse0']||touch.fire)?1:0,w,j:(keys['Space']||touch.jump)?1:0,dt});
    replayLook[0]=0;replayLook[1]=0;replayCount++;
    return {ok:true,count:replayCount};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function buildReplayPayload(){
  try{
    if(!replayLog||!replayLog.frames||!replayLog.frames.length)return {ok:false,error:'no replay frames'};
    const payload={schema:'sun011.replay.v2',version:GAME_VERSION,seed:replayLog.seed|0,lang:replayLog.lang||LANG,
      diff:(DIFF[replayLog.diff!=null?replayLog.diff:difficulty]||DIFF[1]).name,
      frames:replayLog.frames.slice(),summary:replayLog.summary||null,truncated:!!replayLog.truncated};
    return {ok:true,payload,frames:payload.frames.length};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
const REPLAY_SCHEMAS=['sun011.replay.v2','sun010.replay.v2','sun009.replay.v2','sun008.replay.v1','sun007.replay.v1'];
function replaySummary(obj){
  try{
    if(!obj||typeof obj!=='object')return {ok:false,error:'not an object'};
    if(REPLAY_SCHEMAS.indexOf(obj.schema)<0)return {ok:false,error:'bad schema'};
    if(!Array.isArray(obj.frames))return {ok:false,error:'no frames array'};
    if(typeof obj.seed!=='number')return {ok:false,error:'no seed'};
    let dur=0;for(const f of obj.frames)dur+=Number(f&&f.dt)||0;
    if(!dur)dur=obj.frames.length/60;
    return {ok:true,frames:obj.frames.length,seed:obj.seed,duration:dur,truncated:!!obj.truncated,schema:obj.schema,legacy:obj.schema!==REPLAY_SCHEMAS[0]};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function replayTrace(kernel,seed,frames){
  try{
    if(!kernel||typeof kernel.rnd!=='function'||typeof kernel.imul32!=='function')return {ok:false,error:'bad kernel'};
    if(!Array.isArray(frames))return {ok:false,error:'no frames'};
    let rng=seed|0,x=0,z=0,yaw=0,vx=0,vz=0,hash=0;
    for(const f of frames){
      const dt=Math.min(0.05,Number(f&&f.dt)||0.016);
      const k=f.k|0;
      const ax=((k&8)?1:0)-((k&2)?1:0);
      const az=((k&1)?1:0)-((k&4)?1:0);
      const lx=Number(f&&f.l&&f.l[0])||0;
      yaw+=(lx||0)*0.002+((kernel.rnd(rng)>>>0)%7)/100000;
      yaw=Math.atan2(Math.sin(yaw),Math.cos(yaw));
      const speed=(k&16)?9.92:6.2;
      vx+=(Math.cos(yaw)*az-Math.sin(yaw)*ax)*speed*dt*8-vx*dt*6;
      vz+=(Math.sin(yaw)*az+Math.cos(yaw)*ax)*speed*dt*8-vz*dt*6;
      x+=vx*dt;z+=vz*dt;
      hash=kernel.imul32(hash,31)+kernel.rnd(rng);
    }
    return {ok:true,x,z,yaw,hash:hash>>>0,frames:frames.length};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function replayCompare(frames,seed,eps){
  try{
    const a=replayTrace(K,seed,frames),b=replayTrace(jsKernel(),seed,frames);
    if(!a.ok||!b.ok)return {ok:false,error:'trace failed: '+(a.error||b.error)};
    const e=Number(eps)>0?Number(eps):1e-9;
    const dx=Math.abs(a.x-b.x),dz=Math.abs(a.z-b.z),dh=Math.abs(a.yaw-b.yaw);
    const hashEqual=a.hash===b.hash;
    return {ok:dx<=e&&dz<=e&&dh<=e&&hashEqual,epsilon:e,dx,dz,dh,hashEqual,mode:K_WASM?'wasm-vs-js':'js-vs-js',a,b};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function exportReplay(){
  try{
    const pl=buildReplayPayload();
    if(!pl.ok){showToast(t('replayEmpty'));return pl;}
    const r=downloadJSON(pl.payload,'sun011_replay_'+pl.payload.seed+'_'+Date.now()+'.json');
    if(r.ok)showToast(t('replayExported'));
    return {ok:!!r.ok,frames:pl.frames,error:r.error||null};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function replayValidate(obj){
  try{
    if(!obj||typeof obj!=='object')return {ok:false,reason:'not an object',frames:0,v:0};
    if(REPLAY_SCHEMAS.indexOf(obj.schema)<0)return {ok:false,reason:'bad schema',frames:0,v:0};
    if(typeof obj.seed!=='number'||!isFinite(obj.seed))return {ok:false,reason:'no seed',frames:0,v:0};
    if(!Array.isArray(obj.frames)||!obj.frames.length)return {ok:false,reason:'no frames',frames:0,v:0};
    const v=(obj.schema==='sun011.replay.v2'||obj.schema==='sun010.replay.v2'||obj.schema==='sun009.replay.v2')?2:1;
    for(let i=0;i<obj.frames.length;i++){
      const f=obj.frames[i];
      if(!f||typeof f!=='object')return {ok:false,reason:'replay corrupt frame '+i,frames:i,v};
      if(f.p!==undefined){if(typeof f.p!=='string')return {ok:false,reason:'replay corrupt frame '+i,frames:i,v};continue;}
      const dt=Number(f.dt);
      if(!isFinite(dt)||dt<0||dt>1)return {ok:false,reason:'replay corrupt frame '+i,frames:i,v};
    }
    if(v===2&&(!obj.summary||typeof obj.summary.score!=='number'||typeof obj.summary.kills!=='number'||typeof obj.summary.waves!=='number'))
      return {ok:false,reason:'no summary',frames:obj.frames.length,v};
    return {ok:true,reason:null,frames:obj.frames.length,v};
  }catch(e){return {ok:false,reason:String(e&&e.message||e),frames:0,v:0};}
}
function replayPlay(payload,opts){
  try{
    const v=replayValidate(payload);
    if(!v.ok)return {ok:false,error:v.reason};
    opts=opts||{};
    const speed=[0.5,1,2].indexOf(+opts.speed)>=0?+opts.speed:1;
    const cam=['first','third','free'].indexOf(opts.cam)>=0?opts.cam:'first';
    if(PB&&PB.active)endPlayback(true);
    const bakDiff=difficulty;
    let di=1;for(let i=0;i<DIFF.length;i++)if(DIFF[i].name===payload.diff)di=i;
    difficulty=v.v===2?di:1;
    G.runSeed=payload.seed|0;
    resetGame();spawnPlayer();syncArenaMesh();
    gameOver=false;paused=false;gameStarted=true;G.mode='playback';
    replayLog=null;replayCount=0;replayLook=[0,0];replayLastWi=-1;
    clearInput();
    PB={active:true,i:0,speed,cam,acc:0,frames:payload.frames,seed:payload.seed|0,summary:payload.summary||null,
      degraded:v.v<2,legacy:v.v<2,done:false,match:null,paused:false,bakDiff,t0:performance.now(),
      vy:player.yaw||0,vp:0.35,dist:8,drag:null,pinch:0};
    if(document.pointerLockElement)document.exitPointerLock();
    $('overlay').classList.add('hidden');$('pauseOverlay').classList.add('hidden');$('gameOverOverlay').classList.add('hidden');
    if($('perkOverlay'))$('perkOverlay').classList.add('hidden');
    $('hud').classList.add('on');$('pauseBtn').style.display='none';
    if($('photoBtn'))$('photoBtn').style.display='none';
    $('crosshair').classList.toggle('on',cam==='first');
    $('pbBar').classList.remove('hidden');$('pbEnd').classList.add('hidden');
    updatePbBar();
    if(PB.legacy)showToast(t('pbLegacy'));
    renderOnce();
    return {ok:true,frames:PB.frames.length,v:v.v,degraded:PB.degraded,speed,cam};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function applyPlaybackFrame(f,i){
  try{
    if(!f||typeof f!=='object')return {ok:false,error:'replay corrupt frame '+i};
    if(f.p!==undefined){const r=takePerk(f.p);return r.ok?{ok:true}:{ok:false,error:'replay corrupt frame '+i};}
    const dt=Number(f.dt);
    if(!isFinite(dt)||dt<0)return {ok:false,error:'replay corrupt frame '+i};
    const k=f.k|0;
    keys['KeyW']=!!(k&1);keys['KeyA']=!!(k&2);keys['KeyS']=!!(k&4);keys['KeyD']=!!(k&8);
    keys['ShiftLeft']=!!(k&16);keys['Space']=!!(k&32);keys['KeyR']=!!(k&64);
    keys['Mouse0']=!!f.f;touch.fire=!!f.f;touch.jump=!!(k&32)||!!f.j;
    const l=Array.isArray(f.l)?f.l:[Number(f.dx)||0,Number(f.dy)||0];
    const lx=Number(l[0])||0,ly=Number(l[1])||0;
    if(lx||ly)applyLook(lx,ly,0.0022);
    if(typeof f.w==='number'&&f.w>=0&&f.w<WEAPONS.length&&f.w!==player.wi)setWeapon(f.w);
    G.time+=dt;
    updatePlayer(dt);updateEnemies(dt);updateProjectiles(dt);updateParticles(dt);updateWaves(dt);updateFX(dt);
    return {ok:true};
  }catch(e){return {ok:false,error:'replay corrupt frame '+i+': '+String(e&&e.message||e)};}
}
function stepPlayback(){
  try{
    if(!PB||!PB.active)return {ok:false,error:'no playback'};
    if(PB.paused||PB.done)return {ok:true,i:PB.i,stepped:0};
    PB.acc+=PB.speed;let n=0;
    while(PB.acc>=1&&PB.i<PB.frames.length&&n<8){
      PB.acc-=1;
      const r=applyPlaybackFrame(PB.frames[PB.i],PB.i);
      if(!r.ok){showErr(r.error);endPlayback();return {ok:false,error:r.error,i:PB.i};}
      PB.i++;n++;
      if(gameOver)break;
    }
    updatePbBar();
    return {ok:true,i:PB.i,stepped:n};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function playbackState(){
  try{
    if(!PB)return {ok:true,active:false,i:0,len:0,speed:1,cam:'first',degraded:false,legacy:false,done:false,match:null,paused:false};
    return {ok:true,active:PB.active,i:PB.i,len:PB.frames.length,speed:PB.speed,cam:PB.cam,degraded:PB.degraded,legacy:PB.legacy,done:PB.done,match:PB.match,paused:PB.paused};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function updatePbBar(){
  try{
    if(!PB)return {ok:false,error:'no playback'};
    $('pbToggle').textContent=PB.paused?t('pbPlay'):t('pause');
    if($('pbCam')){$('pbCam').textContent=t('pbCam')+': '+t(PB.cam==='free'?'pbCamFree':PB.cam==='third'?'pbCamThird':'pbCamFirst');
      $('pbCam').classList.toggle('on',PB.cam==='free');}
    const sp=$('pbBar').querySelectorAll('.pb-spd');
    for(const b of sp)b.classList.toggle('on',+b.dataset.s===PB.speed);
    $('pbInfo').textContent=PB.i+'/'+PB.frames.length;
    return {ok:true,i:PB.i};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function pbSetCam(m){
  try{
    if(!PB||!PB.active)return {ok:false,error:'no playback'};
    if(['first','third','free'].indexOf(m)<0)return {ok:false,error:'bad cam'};
    if(m==='free'&&PB.cam!=='free'){PB.vy=player.yaw||0;PB.vp=0.35;PB.dist=8;}
    PB.cam=m;PB.drag=null;PB.pinch=0;
    $('crosshair').classList.toggle('on',m==='first');
    updatePbBar();
    if(m==='free')showToast(t('pbCamHint'));
    return {ok:true,cam:m};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function pbCycleCam(){
  try{
    if(!PB||!PB.active)return {ok:false,error:'no playback'};
    const order=['first','third','free'];
    return pbSetCam(order[(order.indexOf(PB.cam)+1)%order.length]);
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function pbOrbit(dx,dy){
  try{
    if(!PB||!PB.active||PB.cam!=='free')return {ok:false,error:'not free cam'};
    const x=Number(dx),y=Number(dy);
    if(!isFinite(x)||!isFinite(y))return {ok:false,error:'bad delta'};
    PB.vy-=x*0.005;
    PB.vp=Math.min(1.35,Math.max(-1.35,PB.vp-y*0.005));
    return {ok:true,vy:PB.vy,vp:PB.vp};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function pbZoom(d){
  try{
    if(!PB||!PB.active||PB.cam!=='free')return {ok:false,error:'not free cam'};
    const x=Number(d);
    if(!isFinite(x))return {ok:false,error:'bad zoom'};
    PB.dist=Math.min(24,Math.max(3,PB.dist*(1+x*0.001)));
    return {ok:true,dist:PB.dist};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function endPlayback(exit){
  try{
    if(!PB)return {ok:false,error:'no playback'};
    if(!PB.active){if(exit&&!benchRunning){enemies=[];particles=[];pickups=[];eproj=[];tracers=[];glows=[];toMenu();}return {ok:true,match:PB.match,already:true,played:PB.i};}
    const s=PB.summary;
    const match=s?(G.score===s.score&&G.kills===s.kills&&G.wave===s.waves):null;
    if(match===false){try{console.warn('[replay] desync at frame '+PB.i+'/'+PB.frames.length+' score '+G.score+'/'+s.score+' kills '+G.kills+'/'+s.kills+' wave '+G.wave+'/'+s.waves);}catch(e){}}
    const res={ok:true,match,frames:PB.frames.length,played:PB.i,degraded:PB.degraded,score:G.score,kills:G.kills,wave:G.wave,wall:+((performance.now()-PB.t0)/1000).toFixed(3)};
    PB.done=true;PB.match=match;PB.active=false;
    difficulty=PB.bakDiff;
    clearInput();
    $('pbBar').classList.add('hidden');
    if(benchRunning)return res;
    if(exit){enemies=[];particles=[];pickups=[];eproj=[];tracers=[];glows=[];toMenu();return res;}
    $('pbEndTitle').textContent=match===false?t('pbMismatch'):match===true?t('pbMatch'):t('pbDone');
    $('pbEndSub').textContent=G.score+' '+t('score')+' · '+G.kills+' '+t('kills')+' · '+t('wave')+' '+G.wave+' · '+PB.i+'/'+PB.frames.length+'F';
    $('pbEnd').classList.remove('hidden');
    return res;
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}

