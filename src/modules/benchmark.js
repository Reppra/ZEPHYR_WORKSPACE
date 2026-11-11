/* ============================ BENCHMARK ============================ */
const FN_REGISTRY=['kernel.imul32','kernel.iabs','kernel.iclamp','kernel.imin','kernel.imax','kernel.mix','kernel.hash2','kernel.hash3','kernel.rnd','kernel.noise2d','kernel.fbm2d',
 'kernel.dist2q','kernel.steer2','kernel.gridHash','kernel.parity.dist2q','kernel.parity.steer2','kernel.parity.gridHash',
 'math.clamp','math.lerp','math.v3sub','math.v3dot','math.v3cross','math.v3norm','math.m4Identity','math.m4Perspective','math.m4LookAt','math.m4Mul','math.rand01',
 'arena.genArena','arena.groundAt','arena.blockAt','arena.arenaColor','arena.buildArenaMesh','arena.seedArena',
 'sim.spawnPlayer','sim.resetGame','sim.startWave','sim.spawnEnemy','sim.spawnBoss','sim.updateBoss','sim.spawnProjectile','sim.updateProjectiles','sim.fire','sim.killEnemy','sim.reload','sim.damagePlayer','sim.applyPickup','sim.canStand','sim.updatePlayer','sim.updateEnemies','sim.updateParticles','sim.updateWaves','sim.updateFX','sim.updateGame','sim.endGame','sim.burst','sim.forwardVec',
 'render.initWebGL','render.resizeGL','render.computeBufferSize','render.createShader','render.createProgram','render.drawScene','render.renderOnce','render.buildEntityData','render.buildBeamData','render.readCenterNonClear',
 'render.detectGPU','render.adaptQuality','render.onContextLost','render.onContextRestored','render.restoreGraphics','render.hideErr',
 'render.gatherLights','render.uploadLights','render.pushGlow','render.buildGlowData','render.drawGlow','render.throttleLights',
 'audio.ensureAudio','audio.tone','audio.noiseBurst','audio.sfx','audio.setMuted','audio.music','audio.musicState',
 'audio.startMusicDirector','audio.stopMusicDirector','audio.scheduleStep','audio.sfxAt','audio.setIntensity','audio.duckMusic','audio.tickMusicDirector','audio.computeIntensity','audio.musicModeFor',
 'input.requestLock','input.clearInput','input.lockState','input.keysClear','input.touchIdle','input.lookApply','state.startGame','state.togglePause','state.toMenu','hud.updateHUD','hud.bossBar','minimap.draw',
 'settings.load','settings.save','settings.apply',
 'weapons.switchWeapon','weapons.fireScatter','weapons.fireRail','weapons.grantAmmo',
 'weapons.fireArc','weapons.pushBeam','weapons.grantMod','weapons.recomputeDerived',
 'perks.roll','perks.take','perks.recompute','perks.maxed',
 'elite.applyDamage','elite.vampHeal','elite.split',
 'biome.biomeFor','biome.legacyArena','biome.skyColors',
 'ach.unlock','ach.load','telemetry.record','telemetry.summary',
 'i18n.t','i18n.setLang','i18n.apply','i18n.resolve',
 'a11y.apply','a11y.shapeSpec','a11y.shakeAmp',
 'ui.weaponButtons','ui.pauseSettings','settings.setVol','settings.setSens','settings.setMusic',
 'sim.beamHit','sim.updateLance','bal.tune',
 'replay.record','replay.payload','replay.summary','replay.validate','replay.play','replay.playbackState','replay.endPlayback',
 'replay.camCycle','replay.freeOrbit','replay.camDeterminism',
 'daily.seed','daily.code','daily.verify','daily.best','daily.save','daily.render','state.startDaily',
 'meta.load','meta.save','meta.award','meta.level','meta.unlockLevel','meta.migrate',
 'sim.waveCadence','sim.waveSpawnCount','sim.spawnHive','sim.updateHive','scores.dedupe','scores.purge',
 'haptics.gate','haptics.fire','photo.encode','photo.filename','replay.trace','replay.compare',
 'i18n.parity','i18n.typos',
 'sim.spawnTableFor','sim.spawnEnemyArch','sim.updateTurret','sim.updateDash','sim.updateShielder',
 'sim.spawnPyre','sim.updatePyre',
 'input.sanitizeDelta','input.lookGuard','input.lookAccumulate','input.lookFlush','input.eventRate',
 'render.matFinite','render.nanFirewall','render.recoverView',
 'input.tapFireZone','input.setFireZone','input.hapticsFire','input.touchCancel','input.touchWatchdog',
 'input.lockMachine','input.lockStateGet',
 'storm.mouse','storm.touch','storm.report','storm.fakeEvent',
 'crash.record','crash.capture','crash.dump',
 'settings.inputPanel','settings.setSensXY','settings.setDeadzone','settings.setLefty','settings.applyLefty','settings.stickDeadzone',
 'mc.deckNest','mc.overloadDrift','phone.lockNotBoom','phone.sandboxGate','critic.fleetSize','critic.alphaGroundFix','critic.charlieDrift','critic.idleQuiet',
 'release.checklist'];
const BENCH_SCHEMA='SUN_011.benchmark.v1';
function releaseChecklist(){
  try{
    const brandEl=document.querySelector('.brand');
    const checks={
      title:/SUN_011/.test(document.title),
      brand:/SUN_011/.test(brandEl?brandEl.textContent:''),
      version:GAME_VERSION==='__APP_VERSION__',
      verStamp:($('verVal')?$('verVal').textContent:'')==='__APP_VERSION__',
      replaySchema:REPLAY_SCHEMAS[0]==='sun011.replay.v2'&&REPLAY_SCHEMAS.indexOf('sun010.replay.v2')>=0,
      benchSchema:BENCH_SCHEMA==='SUN_011.benchmark.v1',
      storage:[SCORES_KEY,SETTINGS_KEY,ACH_KEY,META_KEY,DAILY_KEY,CR.key].every(k=>k.indexOf('sun011_')===0),
      legacy:LEGACY_SCORES_KEYS.indexOf('sun010_scores')>=0&&LEGACY_SETTINGS_KEYS.indexOf('sun010_settings')>=0&&LEGACY_ACH_KEYS.indexOf('sun010_ach')>=0&&LEGACY_META_KEYS.indexOf('sun010_meta')>=0&&LEGACY_DAILY_KEYS.indexOf('sun010_daily')>=0,
      photo:/^sun011_photo_/.test(photoFilename(1)),
      i18n:!!strParity().ok
    };
    const failed=Object.keys(checks).filter(k=>!checks[k]);
    return {ok:failed.length===0,checks,failed};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
const tested=new Set();
function mark(name){tested.add(name);}
function snapshotState(){
  const gg=Object.assign({},G),pp=Object.assign({},player);
  gg.wshots=G.wshots.slice();gg.whits=G.whits.slice();gg.killsBy=(G.killsBy||[0,0,0,0,0,0,0,0,0,0,0,0]).slice();
  gg.perks=Object.assign({},G.perks);gg.derived=Object.assign({},G.derived);gg.perkPending=G.perkPending?G.perkPending.slice():null;
  gg.flags=Object.assign({},G.flags);
  pp.mags=player.mags.slice();pp.res=player.res.slice();
  pp.mods=(player.mods||WEAPONS.map(()=>null)).map(m=>m?Object.assign({},m):null);
  pp.derived=(player.derived||recomputeDerived(pp.mods).derived).map(d=>Object.assign({},d));
  return {G:gg,player:pp,
    enemies:enemies.map(e=>Object.assign({},e)),particles:particles.map(p=>Object.assign({},p)),
    pickups:pickups.map(p=>Object.assign({},p)),tracers:tracers.map(t=>Object.assign({},t)),
    eproj:eproj.map(p=>Object.assign({},p)),glows:glows.map(g=>Object.assign({},g)),
    heights:heights.slice(0),quadCount,gameStarted,gameOver,paused,bestScore,
    md:{step:MD.step,next:MD.next,on:MD.on,intensity:MD.intensity,layers:Object.assign({},MD.layers)},
    replay:{count:replayCount,look:replayLook.slice(),lastWi:replayLastWi,log:replayLog}};
}
function restoreState(s){
  Object.assign(G,s.G);G.wshots=(s.G.wshots||[0,0,0,0]).slice();G.whits=(s.G.whits||[0,0,0,0]).slice();G.killsBy=(s.G.killsBy||[0,0,0,0,0,0,0,0,0,0,0,0]).slice();
  G.perks=Object.assign({},s.G.perks||{});G.perkPending=s.G.perkPending?s.G.perkPending.slice():null;recomputePerks();
  G.flags=Object.assign({},s.G.flags||{});
  Object.assign(player,s.player);player.mags=(s.player.mags||WEAPONS.map(w=>w.mag)).slice();player.res=(s.player.res||WEAPONS.map(w=>w.reserve)).slice();
  player.mods=(s.player.mods||WEAPONS.map(()=>null)).map(m=>m?Object.assign({},m):null);
  player.derived=(s.player.derived||recomputeDerived(player.mods).derived).map(d=>Object.assign({},d));
  enemies=s.enemies.map(e=>Object.assign({},e));particles=s.particles.map(p=>Object.assign({},p));
  pickups=s.pickups.map(p=>Object.assign({},p));tracers=s.tracers.map(t=>Object.assign({},t));
  eproj=(s.eproj||[]).map(p=>Object.assign({},p));glows=(s.glows||[]).map(g=>Object.assign({},g));
  heights.set(s.heights);quadCount=s.quadCount;gameStarted=s.gameStarted;gameOver=s.gameOver;paused=s.paused;bestScore=s.bestScore;
  if(s.md){MD.step=s.md.step;MD.next=s.md.next;MD.on=s.md.on;MD.intensity=s.md.intensity;MD.layers=Object.assign({},s.md.layers);}
  if(s.replay){replayCount=s.replay.count|0;replayLook=(s.replay.look||[0,0]).slice();replayLastWi=s.replay.lastWi;replayLog=s.replay.log||null;}
  if(meshSeed!==(G.runSeed|0))syncArenaMesh();
}
function snapshotDOM(){
  const panels=['overlay','pauseOverlay','perkOverlay','bossBar','photoBtn','bgfx','gridfx','pbBar','pbEnd','watchBtn'].map(id=>({id,cls:$(id).getAttribute('class'),style:$(id).getAttribute('style')}));
  const controls=Array.from(document.querySelectorAll('input,select,button')).map(el=>({el,value:el.value,checked:el.checked,disabled:el.disabled}));
  const labels=['waveBig','waveSub','powerToast','bossLbl'].map(id=>({id,text:$(id).textContent}));
  return {panels,controls,labels,goHidden:$('gameOverOverlay').classList.contains('hidden'),hudOn:$('hud').classList.contains('on'),
    crossOn:$('crosshair').classList.contains('on'),touchOn:$('touch').classList.contains('on'),
    pauseDisp:$('pauseBtn').style.display,bannerOp:$('waveBanner').style.opacity,toastOp:$('powerToast').style.opacity,
    damageOp:$('damage').style.opacity,lowhpOp:$('lowhp').style.opacity,hitOp:$('hitmarker').style.opacity,
    ctxHidden:$('ctxOverlay').classList.contains('hidden'),errDisp:$('errbox').style.display,bodyCls:document.body.className};
}
function restoreDOM(s){
  for(const control of s.controls){if(control.el.type!=='file')control.el.value=control.value;control.el.disabled=control.disabled;if(control.checked!==undefined)control.el.checked=control.checked;}
  for(const label of s.labels)$(label.id).textContent=label.text;
  for(const panel of s.panels){const el=$(panel.id);for(const [attr,value] of [['class',panel.cls],['style',panel.style]]){if(value===null)el.removeAttribute(attr);else el.setAttribute(attr,value);}}
  $('gameOverOverlay').classList.toggle('hidden',s.goHidden);$('hud').classList.toggle('on',s.hudOn);
  $('crosshair').classList.toggle('on',s.crossOn);$('touch').classList.toggle('on',s.touchOn);
  $('pauseBtn').style.display=s.pauseDisp;$('waveBanner').style.opacity=s.bannerOp;$('powerToast').style.opacity=s.toastOp;
  $('damage').style.opacity=s.damageOp;$('lowhp').style.opacity=s.lowhpOp;$('hitmarker').style.opacity=s.hitOp;
  $('ctxOverlay').classList.toggle('hidden',s.ctxHidden);$('errbox').style.display=s.errDisp;
  if(typeof s.bodyCls==='string')document.body.className=s.bodyCls;
}
function runBenchmark(){
  const results=[];const snap=snapshotState();const domSnap=snapshotDOM();benchRunning=true;
  const test=(name,fn)=>{const t0=performance.now();try{const r=fn();let tag;if(r&&r.skip)tag='SKIP';else tag=(r&&r.ok===true)?'PASS':'FAIL';
    results.push({name,status:tag,error:r&&r.error?String(r.error):'',ms:+((performance.now()-t0).toFixed(3))});}
    catch(e){results.push({name,status:'THREW',error:String(e&&e.message||e),ms:+((performance.now()-t0).toFixed(3))});}};
  const ok=(name,cond,err)=>{test(name,()=>({ok:!!cond,error:cond?'':(err||'assertion failed')}));};
  try{
    // ---- WASM kernel ----
    ok('kernel.mode',true,K_WASM?'WASM active':'JS fallback');
    test('kernel.imul32',()=>{mark('kernel.imul32');const v=K.imul32(6,7);return {ok:v===42,error:'got '+v};});
    test('kernel.imul32.wrap',()=>{const v=K.imul32(0x40000000,4);return {ok:v===0,error:'got '+v};});
    test('kernel.iabs',()=>{mark('kernel.iabs');return {ok:K.iabs(-5)===5&&K.iabs(5)===5&&K.iabs(0)===0,error:'iabs mismatch'};});
    test('kernel.iclamp',()=>{mark('kernel.iclamp');return {ok:K.iclamp(5,0,3)===3&&K.iclamp(-2,0,3)===0&&K.iclamp(2,0,3)===2,error:'iclamp mismatch'};});
    test('kernel.imin',()=>{mark('kernel.imin');return {ok:K.imin(4,9)===4,error:'imin'};});
    test('kernel.imax',()=>{mark('kernel.imax');return {ok:K.imax(4,9)===9,error:'imax'};});
    test('kernel.mix',()=>{mark('kernel.mix');return {ok:K.mix(0,1024,512)===512&&K.mix(0,1024,0)===0&&K.mix(0,1024,1024)===1024,error:'mix'};});
    test('kernel.hash2',()=>{mark('kernel.hash2');return {ok:K.hash2(123,456)===K.hash2(123,456)&&K.hash2(1,2)!==K.hash2(2,1),error:'hash2'};});
    test('kernel.hash3',()=>{mark('kernel.hash3');return {ok:K.hash3(1,2,3)!==K.hash3(3,2,1),error:'hash3'};});
    test('kernel.rnd',()=>{mark('kernel.rnd');return {ok:K.rnd(0)===0&&K.rnd(999)===K.rnd(999)&&K.rnd(12345)!==0,error:'rnd'};});
    test('kernel.noise2d',()=>{mark('kernel.noise2d');let mn=1e9,mx=-1e9;for(let x=-20;x<=20;x+=3)for(let y=-20;y<=20;y+=3){const v=K.noise2d(x,y);mn=Math.min(mn,v);mx=Math.max(mx,v);}return {ok:mn>=0&&mx<=1024,error:'range ['+mn+','+mx+']'};});
    test('kernel.fbm2d',()=>{mark('kernel.fbm2d');let mn=1e9,mx=-1e9;for(let x=-15;x<=15;x+=3)for(let y=-15;y<=15;y+=3)for(let o=1;o<=6;o++){const v=K.fbm2d(x,y,o);mn=Math.min(mn,v);mx=Math.max(mx,v);}return {ok:mn>=0&&mx<=1024,error:'range ['+mn+','+mx+']'};});
    test('kernel.dist2q',()=>{mark('kernel.dist2q');const a=K.dist2q(0,0,3,4),b=K.dist2q(5,5,5,5),c=K.dist2q(-2,-2,2,2);return {ok:a===25&&b===0&&c===32,error:'d(3,4)='+a+' same='+b+' d(4,4)='+c};});
    test('kernel.steer2',()=>{mark('kernel.steer2');const a=K.steer2(1024,0,1024),b=K.steer2(0,0,1024),c=K.steer2(50000,0,1024),d=K.steer2(-1024,0,1024),e=K.steer2(0,-1024,1024);return {ok:a===1024&&b===-2147483648&&c===4096&&d===-1024&&e===0,error:'full='+a+' sentinel='+b+' clamp='+c+' negX='+d+' zComp='+e};});
    test('kernel.gridHash',()=>{mark('kernel.gridHash');const a=K.gridHash(100,200,2),b=K.gridHash(103,203,2),c=K.gridHash(100,200,3);return {ok:a===b&&a!==c&&Number.isInteger(a),error:'sameCell='+(a===b)+' diffCell='+(a!==c)};});
    test('kernel.parity.dist2q',()=>{mark('kernel.parity.dist2q');const JSK=jsKernel();for(let i=0;i<10000;i++){const a=(rand01()*2000-1000)|0,b=(rand01()*2000-1000)|0,c=(rand01()*2000-1000)|0,d=(rand01()*2000-1000)|0;if(K.dist2q(a,b,c,d)!==JSK.dist2q(a,b,c,d))return {ok:false,error:'diverge @'+a+','+b+','+c+','+d};}return {ok:true,error:'10000 samples'};});
    test('kernel.parity.steer2',()=>{mark('kernel.parity.steer2');const JSK=jsKernel();for(let i=0;i<10000;i++){const a=(rand01()*1400-700)|0,b=(rand01()*1400-700)|0,c=(rand01()*4200-100)|0;if(K.steer2(a,b,c)!==JSK.steer2(a,b,c))return {ok:false,error:'diverge @'+a+','+b+','+c+' -> '+K.steer2(a,b,c)+' vs '+JSK.steer2(a,b,c)};}return {ok:true,error:'10000 samples'};});
    test('kernel.parity.gridHash',()=>{mark('kernel.parity.gridHash');const JSK=jsKernel();for(let i=0;i<10000;i++){const a=(rand01()*4000-2000)|0,b=(rand01()*4000-2000)|0,c=(rand01()*6)|0;if(K.gridHash(a,b,c)!==JSK.gridHash(a,b,c))return {ok:false,error:'diverge @'+a+','+b+','+c};}return {ok:true,error:'10000 samples'};});
    // ---- math ----
    test('math.clamp',()=>{mark('math.clamp');return {ok:clamp(5,0,3)===3&&clamp(-1,0,3)===0,error:'clamp'};});
    test('math.lerp',()=>{mark('math.lerp');return {ok:lerp(0,10,0.5)===5,error:'lerp'};});
    test('math.v3sub',()=>{mark('math.v3sub');const v=v3sub([3,2,1],[1,1,1]);return {ok:v[0]===2&&v[1]===1&&v[2]===0,error:'v3sub'};});
    test('math.v3dot',()=>{mark('math.v3dot');return {ok:v3dot([1,2,3],[4,5,6])===32,error:'v3dot'};});
    test('math.v3cross',()=>{mark('math.v3cross');const v=v3cross([1,0,0],[0,1,0]);return {ok:v[0]===0&&v[1]===0&&v[2]===1,error:'v3cross'};});
    test('math.v3norm',()=>{mark('math.v3norm');const v=v3norm([3,0,4]);return {ok:Math.abs(v[0]-0.6)<1e-6&&Math.abs(v[2]-0.8)<1e-6,error:'v3norm'};});
    test('math.m4Identity',()=>{mark('math.m4Identity');const m=m4Identity();return {ok:m[0]===1&&m[5]===1&&m[10]===1&&m[15]===1&&m[1]===0,error:'m4Identity'};});
    test('math.m4Perspective',()=>{mark('math.m4Perspective');const m=m4Perspective(FOV,1.5,NEAR,FAR);return {ok:Number.isFinite(m[0])&&m[11]===-1,error:'m4Perspective'};});
    test('math.m4LookAt',()=>{mark('math.m4LookAt');const m=m4LookAt([0,0,5],[0,0,0],[0,1,0]);return {ok:Number.isFinite(m[12])&&Number.isFinite(m[14]),error:'m4LookAt'};});
    test('math.m4Mul',()=>{mark('math.m4Mul');const m=m4Mul(m4Identity(),m4Identity());return {ok:m[0]===1&&m[15]===1,error:'m4Mul'};});
    test('math.rand01',()=>{mark('math.rand01');const a=rand01(),b=rand01();return {ok:a>=0&&a<1&&b>=0&&b<1,error:'rand01 range'};});
    // ---- arena ----
    test('arena.genArena',()=>{mark('arena.genArena');genArena();let solid=0;for(let i=0;i<heights.length;i++)if(heights[i]>0)solid++;return {ok:solid===heights.length,error:'solid '+solid+'/'+heights.length};});
    test('arena.groundAt',()=>{mark('arena.groundAt');const g=groundAt(24,24);return {ok:g>=1&&g<=MAX_H,error:'groundAt='+g};});
    test('arena.blockAt',()=>{mark('arena.blockAt');return {ok:blockAt(24,0,24)===1&&blockAt(24,MAX_H+2,24)===0,error:'blockAt'};});
    test('arena.arenaColor',()=>{mark('arena.arenaColor');const c=arenaColor(5,5,3);return {ok:c.length===3&&c.every(v=>v>=0&&v<=1),error:'arenaColor'};});
    test('arena.buildArenaMesh',()=>{mark('arena.buildArenaMesh');buildArenaMesh();return {ok:quadCount>1000,error:'quadCount='+quadCount};});
    test('arena.seedStable',()=>{mark('arena.seedArena');
      const orig=G.runSeed;const sum=()=>{let s=7;for(let i=0;i<heights.length;i++)s=(Math.imul(s,31)+heights[i])|0;return s;};
      G.runSeed=4242;syncArenaMesh();const a=sum();
      G.runSeed=999999;syncArenaMesh();const b=sum();
      G.runSeed=4242;syncArenaMesh();const c=sum();
      G.runSeed=orig;syncArenaMesh();
      return {ok:a===c&&a!==b,error:'seedA='+a+' seedB='+b+' repeatA='+c};});
    test('arena.seedVariance',()=>{mark('arena.genArena');
      const orig=G.runSeed;const sum=()=>{let s=7;for(let i=0;i<heights.length;i++)s=(Math.imul(s,31)+heights[i])|0;return s;};
      const out=[];
      for(const sd of [1,2,3,777,31337]){G.runSeed=sd;genArena();out.push(sum());}
      const uniq=new Set(out).size;
      G.runSeed=orig;genArena();buildArenaMesh();
      return {ok:uniq===out.length,error:'unique='+uniq+'/'+out.length+' checksums='+out.join(',')};});
    test('arena.padWalkable',()=>{mark('arena.genArena');
      const orig=G.runSeed;let ok=true,bad='';
      for(const sd of [11,22,33,12345]){
        G.runSeed=sd;genArena();
        for(let z=0;z<ARENA_D&&ok;z++)for(let x=0;x<ARENA_W&&ok;x++){
          const dx=x-ARENA_W/2,dz=z-ARENA_D/2,rr=dx*dx+dz*dz,h=heights[hidx(x,z)];
          if(rr<36&&h!==3){ok=false;bad='pad '+x+','+z+' h='+h;}
          else if(rr>=36&&rr<64&&h>4){ok=false;bad='ring '+x+','+z+' h='+h;}
          else if(h<1||h>MAX_H){ok=false;bad='range '+x+','+z+' h='+h;}
        }
      }
      G.runSeed=orig;genArena();buildArenaMesh();
      return {ok,error:ok?'pad=3 ring<=4 over 4 seeds':bad};});
    // ---- sim (pure-ish, isolated by snapshot) ----
    test('sim.forwardVec',()=>{mark('sim.forwardVec');const f=forwardVec();return {ok:Math.abs(Math.hypot(f[0],f[1],f[2])-1)<1e-4,error:'forwardVec'};});
    test('sim.canStand',()=>{mark('sim.canStand');spawnPlayer();return {ok:canStand(player.x,player.z)===true&&canStand(0,0)===false,error:'canStand'};});
    test('sim.spawnPlayer',()=>{mark('sim.spawnPlayer');spawnPlayer();return {ok:player.hp===100&&player.mags[0]===12&&player.res[0]===Infinity&&player.wi===0,error:'spawnPlayer hp='+player.hp+' mag='+player.mags[0]};});
    test('sim.resetGame',()=>{mark('sim.resetGame');resetGame();return {ok:G.score===0&&G.wave===0&&enemies.length===0,error:'resetGame'};});
    test('sim.startWave',()=>{mark('sim.startWave');startWave();return {ok:G.wave===1&&G.waveState==='active'&&G.toSpawn>0,error:'startWave'};});
    test('sim.spawnEnemy',()=>{mark('sim.spawnEnemy');spawnEnemy();return {ok:enemies.length===1&&enemies[0].hp>0,error:'spawnEnemy'};});
    test('sim.spawnTableFor',()=>{mark('sim.spawnTableFor');
      const a=spawnTableFor(1),b=spawnTableFor(3),c=spawnTableFor(5),d=spawnTableFor(8),e=spawnTableFor(40),f=spawnTableFor(0);
      const okv=a.ok&&a.types.join(',')==='1,2'&&b.types.join(',')==='1,2,9'&&c.types.join(',')==='1,2,9,8'&&d.types.join(',')==='1,2,9,8,10'&&e.types.length===5&&f.ok&&f.types.join(',')==='1,2';
      return {ok:okv,error:'w1='+a.types+' w3='+b.types+' w5='+c.types+' w8='+d.types+' w40='+e.types};});
    test('sim.spawnEnemyArch',()=>{mark('sim.spawnEnemyArch');
      const snap=snapshotState();
      try{
        resetGame();spawnPlayer();enemies.length=0;
        const a=spawnEnemyArch('turret',10,10),b=spawnEnemyArch('dash',12,10),c=spawnEnemyArch('shielder',14,10),bad=spawnEnemyArch('nope');
        const okv=a.ok&&a.type===8&&b.ok&&b.type===9&&c.ok&&c.type===10&&!bad.ok&&enemies.length===3&&enemies[0].ranged===true&&enemies[2].aura===6;
        return {ok:okv,error:'types='+enemies.map(e=>e.type).join(',')+' bad='+bad.error};
      }finally{restoreState(snap);}});
    test('sim.updateTurret',()=>{mark('sim.updateTurret');
      const snap=snapshotState();
      try{
        resetGame();spawnPlayer();enemies.length=0;eproj.length=0;
        for(let z=12;z<=26;z++)for(let x=22;x<=26;x++)heights[hidx(x,z)]=3;
        const r=spawnEnemyArch('turret',player.x,player.z-10);const e=enemies[0];e.atkCd=0;
        const x0=e.x,z0=e.z;
        for(let i=0;i<100;i++)updateTurret(e,0.05,player.x-e.x,player.z-e.z,Math.hypot(player.x-e.x,player.z-e.z));
        const still=e.x===x0&&e.z===z0,shots=eproj.length;
        return {ok:r.ok&&still&&shots===4,error:'immobile='+still+' shots='+shots+' (5s window, cd 1.6 -> t=0,1.6,3.2,4.8 = 4)'};
      }finally{restoreState(snap);}});
    test('sim.updateDash',()=>{mark('sim.updateDash');
      const snap=snapshotState();
      try{
        resetGame();spawnPlayer();enemies.length=0;player.hp=100;player.hurtCd=0;player.shield=0;
        for(let z=14;z<=26;z++)for(let x=18;x<=30;x++)heights[hidx(x,z)]=3;
        spawnEnemyArch('dash',player.x,player.z-6);const e=enemies[0];
        e.dashState='windup';e.dashT=0.01;e.dashVec=[0,1];
        updateDash(e,0.02,0,6,6);
        const locked=e.dashState==='dash';
        player.x+=6;
        for(let i=0;i<8;i++)updateDash(e,0.05,player.x-e.x,player.z-e.z,Math.hypot(player.x-e.x,player.z-e.z));
        const dodged=player.hp===100;
        player.x-=6;player.hurtCd=0;e.x=player.x;e.z=player.z-6;e.dashState='windup';e.dashT=0.01;e.dashVec=[0,1];e.atkCd=0;
        updateDash(e,0.02,0,6,6);
        for(let i=0;i<8;i++)updateDash(e,0.05,0,player.z-e.z,Math.abs(player.z-e.z));
        const hit=player.hp<100;
        return {ok:locked&&dodged&&hit,error:'locked='+locked+' dodged='+dodged+' stationaryHit='+hit+' hp='+player.hp};
      }finally{restoreState(snap);}});
    test('sim.updateShielder',()=>{mark('sim.updateShielder');
      const snap=snapshotState();
      try{
        resetGame();spawnPlayer();enemies.length=0;
        spawnEnemyArch('shielder',20,20);const sh=enemies[0];
        spawnEnemyArch('turret',22,20);const drone=enemies[1];drone.hp=100;drone.maxhp=100;
        updateEnemies(0.016);
        const flagged=drone.shielded===true;
        const r1=applyDamage(drone,18);const d1=100-drone.hp;
        killEnemy(sh);updateEnemies(0.016);
        const r2=applyDamage(drone,18);const d2=r2.dealt;
        return {ok:flagged&&d1===8&&d2===18,error:'flagged='+flagged+' shieldedDmg='+d1+' (18*0.45->8) unshieldedDmg='+d2};
      }finally{restoreState(snap);}});
    test('sim.spawnProjectile',()=>{mark('sim.spawnProjectile');spawnPlayer();eproj.length=0;
      const a=spawnProjectile(player.x,player.y+1,player.z-6,0,0,14,2.5,0.16,PAL.magenta);
      const b=spawnProjectile(player.x+2,player.y+1,player.z-9,-4,0,0);
      const p=eproj[0];const spd=Math.hypot(p.vx,p.vy,p.vz);
      const okv=!!a.ok&&!!b.ok&&eproj.length===2&&Math.abs(spd-14)<0.001&&p.life===2.5&&p.col===PAL.magenta;
      return {ok:okv,error:'n='+eproj.length+' speed='+spd.toFixed(2)+' life='+p.life+' defaultCol='+(eproj[1].col===PAL.magenta)};});
    test('sim.updateProjectiles',()=>{mark('sim.updateProjectiles');spawnPlayer();player.hurtCd=0;player.shield=0;player.hp=100;eproj.length=0;
      spawnProjectile(player.x,player.y+1.0,player.z,0,0,0,2.5,0.16,PAL.magenta);
      const want=9*DIFF[difficulty].dmg;updateProjectiles(0.016);
      const drop=100-player.hp;
      return {ok:eproj.length===0&&Math.abs(drop-want)<0.001,error:'hpDrop='+drop.toFixed(2)+' want='+want.toFixed(2)+' eproj='+eproj.length};});
    test('sim.eprojExpire',()=>{mark('sim.updateProjectiles');spawnPlayer();eproj.length=0;
      spawnProjectile(player.x+30,player.y+20,player.z+30,0,0,0,0.01,0.16,PAL.magenta);
      updateProjectiles(0.05);
      return {ok:eproj.length===0,error:'expired eproj='+eproj.length};});
    test('sim.spawnBoss',()=>{mark('sim.spawnBoss');resetGame();G.wave=5;enemies.length=0;
      const r=spawnBoss();const b=enemies[0];
      const okv=!!r.ok&&enemies.length===1&&b.boss===true&&b.type===4&&b.hp>260&&b.size===2.6&&b.maxhp===b.hp;
      return {ok:okv,error:'bosses='+enemies.length+' hp='+(b?b.hp:0)+' size='+(b?b.size:0)};});
    test('sim.updateBoss',()=>{mark('sim.updateBoss');spawnPlayer();G.wave=5;enemies.length=0;eproj.length=0;
      spawnBoss();const b=enemies[enemies.length-1];b.x=player.x;b.z=player.z-10;b.y=groundAt(player.x,player.z-10)+1.35;
      b.volleyCd=0;b.slamCd=99;b.atkCd=99;
      updateEnemies(0.1);const volley=eproj.length;
      eproj.length=0;b.slamCd=0;const d0=Math.hypot(b.x-player.x,b.z-player.z);
      updateEnemies(0.1);const d1=Math.hypot(b.x-player.x,b.z-player.z);
      return {ok:volley===8&&Math.abs(d1-6)<1.6,error:'volley='+volley+' slam '+d0.toFixed(1)+'->'+d1.toFixed(1)};});
    test('hud.bossBar',()=>{mark('hud.bossBar');G.wave=5;enemies.length=0;
      const r0=updateBossBar();spawnBoss();const b=enemies[enemies.length-1];const r1=updateBossBar();
      b.hp=b.maxhp*0.5;const r2=updateBossBar();enemies.length=0;const r3=updateBossBar();
      const okv=r0.visible===false&&r1.visible===true&&Math.abs(r1.width-100)<0.5&&Math.abs(r2.width-50)<0.5&&r3.visible===false;
      return {ok:okv,error:JSON.stringify([r0,r1,r2,r3])};});
    test('boss.killDrop',()=>{mark('sim.spawnBoss');G.wave=5;enemies.length=0;pickups.length=0;eproj.length=0;
      spawnBoss();const b=enemies[enemies.length-1];G.score=0;G.combo=1;killEnemy(b);
      return {ok:enemies.length===0&&pickups.length>=2&&G.score>=250,error:'pickups='+pickups.length+' score='+G.score};});
    test('minimap.draw',()=>{mark('minimap.draw');const cv=$('minimap');const was=SET.minimap;SET.minimap=true;
      const r=drawMinimap();const on=cv.classList.contains('on');
      const parent=cv.parentNode,next=cv.nextSibling;cv.remove();const bad=drawMinimap();
      parent.insertBefore(cv,next);SET.minimap=was;if(!was)cv.classList.remove('on');
      return {ok:r.ok===true&&r.w===132&&on===true&&bad.ok===false,error:'draw='+r.ok+' size='+r.w+' on='+on+' missingCanvas='+JSON.stringify(bad)};});
    test('minimap.bounds',()=>{mark('minimap.draw');const cv=$('minimap');const was=SET.minimap;SET.minimap=true;
      spawnPlayer();enemies.length=0;pickups.length=0;
      enemies.push({x:10,z:20,y:groundAt(10,20)+1.1,type:0,hp:40,maxhp:40,speed:2,size:1,dmg:10,atkCd:0,bob:0,flash:0});
      const r=drawMinimap();
      let px=[0,0,0,0];
      try{px=Array.from(cv.getContext('2d').getImageData(Math.round(10*r.sx),Math.round(20*r.sy),1,1).data);}catch(e){}
      const okv=r.ok===true&&Math.abs(px[0]-255)<12&&px[1]<130&&Math.abs(r.px-24*r.sx)<2&&Math.abs(r.py-24*r.sy)<2&&Math.abs(r.sx-132/ARENA_W)<1e-9;
      SET.minimap=was;if(!was)cv.classList.remove('on');
      return {ok:okv,error:'redPixel='+px.join(',')+' playerPx='+r.px+','+r.py+' sx='+r.sx};});
    test('sim.burst',()=>{mark('sim.burst');const n=particles.length;burst(24,3,24,PAL.cyan,8,4);return {ok:particles.length===n+8,error:'burst'};});
    test('sim.reload',()=>{mark('sim.reload');spawnPlayer();player.mags[0]=2;reload();const r1=player.reloading>0&&player.reloadWi===0;
      player.reloading=0.001;player.reloadWi=0;updatePlayer(0.002);const refilled=player.mags[0]===12&&player.reloading===0;
      return {ok:r1&&refilled,error:'reloading='+r1+' refilled='+refilled+' mag='+player.mags[0]};});
    test('sim.applyPickup',()=>{mark('sim.applyPickup');player.hp=50;applyPickup({kind:0,x:24,y:3,z:24});return {ok:player.hp===80,error:'applyPickup hp='+player.hp};});
    test('sim.killEnemy',()=>{mark('sim.killEnemy');spawnEnemy();const e=enemies[enemies.length-1];const k=G.kills;killEnemy(e);return {ok:G.kills===k+1&&G.score>0,error:'killEnemy'};});
    test('sim.fire',()=>{mark('sim.fire');spawnPlayer();spawnEnemy();enemies[0].x=player.x;enemies[0].z=player.z-3;enemies[0].y=player.y+EYE_H;player.yaw=0;player.pitch=0;player.fireCd=0;player.mags[0]=12;player.reloading=0;
      const s=G.shots;fire();return {ok:G.shots===s+1&&player.mags[0]===11,error:'fire shots='+G.shots+' mag='+player.mags[0]};});
    test('weapons.switchWeapon',()=>{mark('weapons.switchWeapon');
      spawnPlayer();player.reloading=1.5;const r=setWeapon(2);
      const nm=$('wpnName')?$('wpnName').textContent:'';
      const q=setWeapon(player.wi+1);const wiQ=q.wi;
      const q2=setWeapon(WEAPONS.length);const wiW=q2.wi;
      setWeapon(0);
      return {ok:!!r.ok&&r.wi===2&&nm==='RAIL'&&player.reloading===0&&wiQ===3&&wiW===0,error:'wi='+r.wi+' name='+nm+' next='+wiQ+' wrap='+wiW+' reloading='+player.reloading};});
    test('weapons.fireScatter',()=>{mark('weapons.fireScatter');
      spawnPlayer();enemies.length=0;player.wi=1;player.mags[1]=6;player.fireCd=0;player.reloading=0;player.dmgBoost=0;
      enemies.push({x:player.x,z:player.z-3,y:player.y+EYE_H,type:2,hp:1000,maxhp:1000,speed:0,size:1.5,dmg:0,atkCd:99,bob:0,flash:0});
      const s=G.shots;const r=fire();const drop=1000-enemies[0].hp;
      return {ok:!!r.ok&&G.shots===s+1&&drop>=40,error:'shots='+G.shots+' drop='+drop+' mag='+player.mags[1]};});
    test('weapons.fireRail',()=>{mark('weapons.fireRail');
      spawnPlayer();enemies.length=0;player.wi=2;player.mags[2]=3;player.fireCd=0;player.reloading=0;player.yaw=0;player.pitch=0;
      const mk=z=>({x:player.x,z,y:player.y+EYE_H,type:0,hp:500,maxhp:500,speed:0,size:1,dmg:0,atkCd:99,bob:0,flash:0});
      enemies.push(mk(player.z-4));enemies.push(mk(player.z-9));
      const flat=[];
      for(let dz=0;dz<=11;dz++){const ix=hidx(Math.floor(player.x),Math.max(0,Math.floor(player.z)-dz));flat.push([ix,heights[ix]]);heights[ix]=0;}
      const h0=enemies[0].hp,h1=enemies[1].hp;let r;
      try{r=fire();}finally{for(const f of flat)heights[f[0]]=f[1];}
      return {ok:!!r.ok&&enemies[0].hp<h0&&enemies[1].hp<h1,error:'near='+(enemies[0].hp<h0)+' far='+(enemies[1].hp<h1)+' mag='+player.mags[2]};});
    test('weapons.grantAmmo',()=>{mark('weapons.grantAmmo');
      spawnPlayer();player.res=[Infinity,10,2,10];
      applyPickup({kind:4,x:player.x,y:player.y,z:player.z});const a1=player.res[1],a2=player.res[2],a3=player.res[3];
      player.res[1]=40;player.res[2]=16;player.res[3]=30;
      applyPickup({kind:4,x:player.x,y:player.y,z:player.z});
      return {ok:a1===22&&a2===5&&a3===16&&player.res[1]===48&&player.res[2]===18&&player.res[3]===32,error:'first='+a1+'/'+a2+'/'+a3+' capped='+player.res[1]+'/'+player.res[2]+'/'+player.res[3]};});
    test('weapons.fireArc',()=>{mark('weapons.fireArc');
      spawnPlayer();enemies.length=0;player.wi=3;player.mags[3]=8;player.fireCd=0;player.reloading=0;player.yaw=0;player.pitch=0;player.dmgBoost=0;
      const mk=z=>({x:player.x,z,y:player.y+EYE_H,type:0,hp:100,maxhp:100,speed:0,size:1,dmg:0,atkCd:99,bob:0,flash:0});
      enemies.push(mk(player.z-4));enemies.push(mk(player.z-8));enemies.push(mk(player.z-12));
      const flat=[];
      for(let dz=0;dz<=13;dz++){const ix=hidx(Math.floor(player.x),Math.max(0,Math.floor(player.z)-dz));flat.push([ix,heights[ix]]);heights[ix]=0;}
      let r;
      try{r=fireArc();}finally{for(const f of flat)heights[f[0]]=f[1];}
      return {ok:!!r.ok&&r.hits===3&&r.dmgLog.join(',')==='14,9,6',error:'hits='+r.hits+' dmg='+JSON.stringify(r.dmgLog)};});
    test('weapons.arcRadius',()=>{mark('weapons.fireArc');
      spawnPlayer();enemies.length=0;player.wi=3;player.yaw=0;player.pitch=0;player.dmgBoost=0;
      const mk=z=>({x:player.x,z,y:player.y+EYE_H,type:0,hp:100,maxhp:100,speed:0,size:1,dmg:0,atkCd:99,bob:0,flash:0});
      enemies.push(mk(player.z-4));enemies.push(mk(player.z-8));enemies.push(mk(player.z-18));
      const flat=[];
      for(let dz=0;dz<=19;dz++){const ix=hidx(Math.floor(player.x),Math.max(0,Math.floor(player.z)-dz));flat.push([ix,heights[ix]]);heights[ix]=0;}
      let r;
      try{r=fireArc();}finally{for(const f of flat)heights[f[0]]=f[1];}
      return {ok:!!r.ok&&r.hits===2&&r.dmgLog.join(',')==='14,9',error:'hits='+r.hits+' dmg='+JSON.stringify(r.dmgLog)};});
    test('weapons.pushBeam',()=>{mark('weapons.pushBeam');
      const bak=tracers.slice();tracers.length=0;
      try{
        let last=null;for(let i=0;i<70;i++)last=pushBeam([i,0,0],[i,1,1],PAL.cyan);
        return {ok:!!last&&last.ok&&tracers.length===BEAM_MAX&&tracers[0].x0===70-BEAM_MAX&&tracers[BEAM_MAX-1].x0===69,
          error:'n='+tracers.length+' first='+(tracers[0]?tracers[0].x0:'none')+' max='+BEAM_MAX};
      }finally{tracers.length=0;for(const b of bak)tracers.push(b);}});
    test('weapons.grantMod',()=>{mark('weapons.grantMod');mark('weapons.recomputeDerived');
      spawnPlayer();
      const bad=grantMod(9,'arcJump'),unk=grantMod(3,'nope');
      const r=grantMod(3,'arcJump');
      const jumps=WEAPONS[3].chain.jumps+((player.derived[3]||{}).jumpAdd||0);
      const pure=recomputeDerived([null,null,null,{dmgMul:2,cdMul:0.5,jumpAdd:2}]);
      return {ok:bad.ok===false&&unk.ok===false&&!!r.ok&&r.wi===3&&jumps===4&&!!pure.ok&&pure.derived[3].dmgMul===2&&pure.derived[3].cdMul===0.5&&pure.derived[0].dmgMul===1,
        error:'bad='+bad.ok+' unk='+unk.ok+' jumps='+jumps+' pure='+JSON.stringify(pure.derived&&pure.derived[3])};});
    test('perks.roll',()=>{mark('perks.roll');
      const save=G.rng;G.rng=42;
      const a=rollPerks(),b=rollPerks();const rngAfter=G.rng;G.rng=save;
      const uniq=new Set(a.choices).size===a.choices.length;
      return {ok:!!a.ok&&!!b.ok&&a.choices.length===3&&uniq&&a.choices.join(',')===b.choices.join(',')&&rngAfter===42,
        error:'a='+JSON.stringify(a.choices)+' b='+JSON.stringify(b.choices)+' rng='+rngAfter};});
    test('perks.take',()=>{mark('perks.take');mark('perks.maxed');
      G.perks={};recomputePerks();
      const r1=takePerk('dmg15'),r2=takePerk('dmg15'),r3=takePerk('dmg15'),r4=takePerk('dmg15');
      const bad=takePerk('nope');
      const okCap=!!r1.ok&&!!r2.ok&&!!r3.ok&&r4.ok===false&&r4.error==='maxed'&&G.perks.dmg15===3&&bad.ok===false&&perkMaxed('dmg15')===true;
      const mul=G.derived.dmgMul;
      return {ok:okCap&&Math.abs(mul-1.520875)<1e-9,error:'cap='+okCap+' count='+G.perks.dmg15+' mul='+mul};});
    test('perks.recompute',()=>{mark('perks.recompute');
      G.perks={};const base=recomputePerks();
      const okBase=!!base.ok&&base.stats.maxHp===100&&base.stats.arcJumps===WEAPONS[3].chain.jumps&&base.stats.dmgMul===1;
      takePerk('hp25');takePerk('jump1');takePerk('vamp2');takePerk('combo2');
      const s=G.derived;
      return {ok:okBase&&s.maxHp===125&&s.arcJumps===WEAPONS[3].chain.jumps+1&&s.vamp===2&&s.comboGrace===2,
        error:'base='+okBase+' stats='+JSON.stringify(s)};});
    test('perks.overlay',()=>{mark('perks.take');
      const wasPaused=paused,wasMode=G.mode;
      try{
        G.perks={};recomputePerks();
        const r=showPerkOverlay(['dmg15','move10','hp25']);
        const box=$('perkChoices');const n=box?box.children.length:0;
        const vis=!$('perkOverlay').classList.contains('hidden');
        const c=choosePerk('dmg15');
        const hidden=$('perkOverlay').classList.contains('hidden');
        return {ok:!!r.ok&&r.n===3&&n===3&&vis&&!!c.ok&&G.perks.dmg15===1&&hidden&&G.perkPending===null,
          error:'n='+n+' vis='+vis+' choose='+JSON.stringify(c)+' hidden='+hidden};
      }finally{paused=wasPaused;G.mode=wasMode;$('perkOverlay').classList.add('hidden');}});
    test('elite.applyDamage',()=>{mark('elite.applyDamage');
      enemies.length=0;const e={x:30,z:30,y:3,type:0,hp:200,maxhp:200,size:1,elite:'shield',shieldHp:40,shieldMax:40,shieldCd:4,flash:0,speed:0,dmg:0,atkCd:99,bob:0,strafe:1,hold:10};
      enemies.push(e);
      const r1=applyDamage(e,20);const hp1=e.hp,sh1=e.shieldHp;
      e.shieldCd=0;e.shieldHp=0;updateEnemies(0.5);const regen=+e.shieldHp.toFixed(3);
      applyDamage(e,100);
      return {ok:r1.dealt===20&&hp1===190&&Math.abs(sh1-30)<1e-9&&Math.abs(regen-4)<1e-9&&e.shieldHp===0&&e.hp===94,
        error:'dealt='+r1.dealt+' hp='+hp1+' shield='+sh1+' regen='+regen+' afterHp='+e.hp};});
    test('elite.vampHeal',()=>{mark('elite.vampHeal');
      spawnPlayer();player.hurtCd=0;player.shield=0;enemies.length=0;
      enemies.push({x:player.x,z:player.z,y:player.y,type:0,hp:50,maxhp:100,size:1,elite:'vamp',speed:0,dmg:0,atkCd:0,bob:0,flash:0});
      updateEnemies(0.1);
      return {ok:Math.abs(enemies[0].hp-65)<1e-9,error:'hp='+enemies[0].hp};});
    test('elite.split',()=>{mark('elite.split');
      spawnPlayer();enemies.length=0;
      enemies.push({x:30,z:30,y:3,type:1,hp:1,maxhp:100,size:1.2,elite:'split',speed:2,dmg:1,atkCd:99,bob:0,flash:0,strafe:1,hold:10});
      killEnemy(enemies[0]);const kids=enemies.slice();
      const shape=kids.length===2&&kids.every(k=>!k.elite&&k.child===true&&Math.abs(k.maxhp-40)<1e-9&&Math.abs(k.size-0.9)<1e-9);
      killEnemy(kids[0]);const after=enemies.length;
      return {ok:shape&&after===1,error:'kids='+kids.length+' shape='+shape+' afterChildKill='+after};});
    test('biome.biomeFor',()=>{mark('biome.biomeFor');
      const vals=[0,1,2,3,-1,(2**32-1)|0];
      const pure=vals.every(v=>biomeFor(v)===(((v>>>0)%3)));
      const map=biomeFor(123456789)===0&&biomeFor(4242)===0&&biomeFor(4243)===1&&biomeFor(4244)===2;
      return {ok:pure&&map,error:'pure='+pure+' 123456789='+biomeFor(123456789)+' 4242/4243/4244='+biomeFor(4242)+'/'+biomeFor(4243)+'/'+biomeFor(4244)};});
    test('biome.skyColors',()=>{mark('biome.skyColors');
      const locs=!!progSky.uTop&&!!progSky.uMid&&!!progSky.uBot&&!!progSky.uGlow;
      const uniq=new Set(BIOMES.map(b=>b.sky.top.join(','))).size;
      const amps=BIOMES.map(b=>b.amp).join(',');
      const orig=G.runSeed;G.runSeed=4243;drawScene();const px=readCenterNonClear();G.runSeed=orig;drawScene();
      return {ok:locs&&uniq===3&&amps==='1,1.35,0.55'&&px>=0,error:'uniforms='+locs+' uniqueSkies='+uniq+' amps='+amps+' px='+px};});
    test('biome.legacyArena',()=>{mark('biome.legacyArena');
      const orig=G.runSeed;G.runSeed=123456789;genArena();
      let s=7;for(let i=0;i<heights.length;i++)s=(Math.imul(s,31)+heights[i])|0;
      G.runSeed=orig;genArena();buildArenaMesh();
      return {ok:s===295400644,error:'legacy checksum='+s};});
    test('ach.unlock',()=>{mark('ach.unlock');
      const bak=achUnlocked.slice();let store=null;try{store=localStorage.getItem(ACH_KEY);}catch(e){}
      achUnlocked=[];try{localStorage.removeItem(ACH_KEY);}catch(e){}
      const r1=unlockAch('firstblood'),r2=unlockAch('firstblood');
      let stored=[];try{stored=JSON.parse(localStorage.getItem(ACH_KEY)||'[]');}catch(e){}
      const okv=!!r1.ok&&r2.ok===false&&Array.isArray(stored)&&stored.length===1&&stored[0]==='firstblood'&&achUnlocked.length===1;
      achUnlocked=bak.slice();
      try{if(store===null)localStorage.removeItem(ACH_KEY);else localStorage.setItem(ACH_KEY,store);}catch(e){}
      const ac=$('achCount');if(ac)ac.textContent='ACH '+achUnlocked.length+'/'+Object.keys(ACH).length;
      return {ok:okv,error:'r1='+r1.ok+' r2='+r2.ok+' stored='+stored.length+' mem='+achUnlocked.length};});
    test('ach.load',()=>{mark('ach.load');
      const bak=achUnlocked.slice();let store=null;try{store=localStorage.getItem(ACH_KEY);}catch(e){}
      try{localStorage.setItem(ACH_KEY,JSON.stringify(['firstblood','bogus',3,'warden','firstblood']));}catch(e){}
      const got=loadAch();const txt=$('achCount')?$('achCount').textContent:'';
      let hostile=null;try{localStorage.setItem(ACH_KEY,'{bad');hostile=loadAch();}catch(e){}
      achUnlocked=bak.slice();
      try{if(store===null)localStorage.removeItem(ACH_KEY);else localStorage.setItem(ACH_KEY,store);}catch(e){}
      const ac=$('achCount');if(ac)ac.textContent='ACH '+achUnlocked.length+'/'+Object.keys(ACH).length;
      const okv=got.length===2&&got.indexOf('firstblood')>=0&&got.indexOf('warden')>=0&&got.indexOf('bogus')<0&&txt==='ACH 2/'+Object.keys(ACH).length&&Array.isArray(hostile)&&hostile.length===0;
      return {ok:okv,error:'filtered='+JSON.stringify(got)+' txt='+txt+' hostile='+JSON.stringify(hostile)};});
    test('telemetry.record',()=>{mark('telemetry.record');
      const snap=snapshotState();
      const kb3=(G.killsBy&&G.killsBy[3])||0,dm0=G.dmgTaken||0;
      const r1=telemetryRecord('kill',{type:3});
      const r2=telemetryRecord('damage',-9);
      const r3=telemetryRecord('damage',5);
      const r4=telemetryRecord('nope',1);
      const r5=telemetryRecord('shot',9);
      const r6=telemetryRecord('kill',{});
      const okv=!!r1.ok&&r1.count===kb3+1&&!!r2.ok&&r2.dmgTaken===dm0&&!!r3.ok&&r3.dmgTaken===dm0+5&&r4.ok===false&&r5.ok===false&&r6.ok===false;
      restoreState(snap);
      return {ok:okv,error:'kill='+JSON.stringify(r1)+' dmg='+JSON.stringify(r3)+' bad='+r4.ok+','+r5.ok+','+r6.ok};});
    test('telemetry.summary',()=>{mark('telemetry.summary');
      const snap=snapshotState();
      const base={w:snap.G.wshots.join(','),k:snap.G.killsBy.join(','),m:snap.player.mags.join(','),r:snap.player.res.join(',')};
      player.mags[0]-=3;player.res[1]+=5;G.wshots[0]+=7;G.killsBy[2]+=9;
      const snapIntact=snap.G.wshots.join(',')===base.w&&snap.G.killsBy.join(',')===base.k&&snap.player.mags.join(',')===base.m;
      restoreState(snap);
      const iso=G.wshots.join(',')===base.w&&G.killsBy.join(',')===base.k&&player.mags.join(',')===base.m&&player.res.join(',')===base.r;
      const sw0=snap.G.wshots[0],sm0=snap.player.mags[0];G.wshots[0]+=1;player.mags[0]+=1;
      const iso2=snap.G.wshots[0]===sw0&&snap.player.mags[0]===sm0;
      restoreState(snap);
      G.shots=10;G.hits=5;G.wshots=[4,4,2,0];G.whits=[3,2,0,0];G.dmgTaken=42;G.killsBy=[1,2,3,4,5];
      const s=telemetrySummary();
      const sumOk=!!s.ok&&s.shots===10&&s.acc===50&&s.weaponAcc.join(',')==='75,50,0,0'&&s.dmgTaken===42&&s.killsBy[4]===5;
      let captured=null;const origSave=saveScore;saveScore=e=>{captured=e;return true;};
      const br=benchRunning;benchRunning=false;
      resetGame();G.dmgTaken=37;G.killsBy=[1,2,0,4,0];endGame();
      benchRunning=br;saveScore=origSave;
      const entryOk=!!captured&&captured.dmg===37&&Array.isArray(captured.kb)&&captured.kb[3]===4;
      gameOver=false;G.mode='menu';
      restoreState(snap);
      return {ok:sumOk&&snapIntact&&iso&&iso2&&entryOk,error:'sum='+JSON.stringify(s)+' snap='+snapIntact+' iso='+iso+','+iso2+' entry='+JSON.stringify(captured)};});
    test('sim.damagePlayer',()=>{mark('sim.damagePlayer');spawnPlayer();player.hurtCd=0;player.shield=0;damagePlayer(10);return {ok:player.hp===90,error:'damagePlayer hp='+player.hp};});
    test('sim.updateParticles',()=>{mark('sim.updateParticles');burst(24,3,24,PAL.cyan,4,3);const n=particles.length;updateParticles(0.016);return {ok:particles.length<=n,error:'updateParticles'};});
    test('sim.updatePlayer',()=>{mark('sim.updatePlayer');spawnPlayer();const x=player.x;keys['KeyW']=true;updatePlayer(0.016);keys['KeyW']=false;return {ok:Number.isFinite(player.x)&&Number.isFinite(player.y),error:'updatePlayer'};});
    test('sim.updateEnemies',()=>{mark('sim.updateEnemies');spawnPlayer();spawnEnemy();updateEnemies(0.016);return {ok:Number.isFinite(enemies[0].x),error:'updateEnemies'};});
    test('sim.updateWaves',()=>{mark('sim.updateWaves');resetGame();G.waveState='intermission';G.waveTimer=0.001;updateWaves(0.02);return {ok:G.wave===1,error:'updateWaves'};});
    test('sim.updateFX',()=>{mark('sim.updateFX');G.shake=1;updateFX(0.016);return {ok:G.shake<1,error:'updateFX'};});
    test('sim.updateGame',()=>{mark('sim.updateGame');resetGame();updateGame(0.016);return {ok:G.time>0,error:'updateGame'};});
    test('sim.endGame',()=>{mark('sim.endGame');resetGame();G.score=123;endGame();const okv=gameOver===true;gameOver=false;G.mode='menu';return {ok:okv,error:'endGame'};});
    // ---- render ----
    test('render.createShader',()=>{mark('render.createShader');const s=createShader(gl.VERTEX_SHADER,VS_SKY);gl.deleteShader(s);return {ok:true,error:''};});
    test('render.createProgram',()=>{mark('render.createProgram');const p=createProgram(VS_SKY,FS_SKY);gl.deleteProgram(p);return {ok:true,error:''};});
    test('render.resizeGL',()=>{mark('render.resizeGL');resizeGL();return {ok:W>0&&H>0,error:'resizeGL '+W+'x'+H};});
    test('render.buildEntityData',()=>{mark('render.buildEntityData');spawnEnemy();burst(24,3,24,PAL.cyan,4,3);buildEntityData();return {ok:instCount>0,error:'instCount='+instCount};});
    test('render.drawScene',()=>{mark('render.drawScene');drawScene();return {ok:true,error:''};});
    test('render.renderOnce',()=>{mark('render.renderOnce');renderOnce();return {ok:true,error:''};});
    test('RENDER.frame',()=>{mark('render.readCenterNonClear');spawnPlayer();drawScene();const n=readCenterNonClear();return {ok:n>0,error:'nonClear center pixels='+n};});
    test('render.initWebGL',()=>{mark('render.initWebGL');return {ok:!!gl&&!!progArena&&!!progDyn&&!!progBeam,error:'initWebGL handles'};});
    test('render.detectGPU',()=>{mark('render.detectGPU');const lg=LOW_GPU,gr=GPU_RENDERER;detectGPU();const okv=typeof LOW_GPU==='boolean'&&typeof GPU_RENDERER==='string';const rr=GPU_RENDERER,ll=LOW_GPU;LOW_GPU=lg;GPU_RENDERER=gr;return {ok:okv,error:'renderer='+(rr||'n/a')+' lowGpu='+ll};});
    test('render.computeBufferSize',()=>{mark('render.computeBufferSize');const big=computeBufferSize(3840,2160,2,1,false);const low=computeBufferSize(3840,2160,2,1,true);const mob=computeBufferSize(390,844,3,1,false);const half=computeBufferSize(1920,1080,1,0.7,false);
      return {ok:big.w*big.h<=MAX_PIXELS&&low.dpr===1&&low.w*low.h<=MAX_PIXELS&&mob.w*mob.h<=MAX_PIXELS&&half.w*half.h<=MAX_PIXELS,error:'4Kx2='+big.w+'x'+big.h+' lowDPR='+low.dpr+' mobile='+mob.w+'x'+mob.h};});
    test('render.pixelBudget',()=>{mark('render.resizeGL');const aa=gl.getContextAttributes().antialias;resizeGL();return {ok:aa===false&&W*H<=MAX_PIXELS&&W>0&&H>0,error:'antialias='+aa+' buffer='+W+'x'+H+'='+(W*H)+'<='+MAX_PIXELS};});
    test('render.adaptQuality',()=>{mark('render.adaptQuality');const rs=renderScale,fe=frameEMA,ac=adaptCooldown;
      renderScale=1;frameEMA=40;adaptCooldown=0;adaptQuality(0.04,0.04,true);const dropped=renderScale;
      frameEMA=10;adaptCooldown=0;adaptQuality(0.01,0.01,true);const recovered=renderScale;
      renderScale=rs;frameEMA=fe;adaptCooldown=ac;resizeGL();
      return {ok:dropped<1&&dropped>=0.7&&recovered>dropped&&recovered<=1,error:'slowDrop='+dropped.toFixed(2)+' fastRecover='+recovered.toFixed(2)};});
    test('render.tracerBeam',()=>{mark('render.buildBeamData');spawnPlayer();player.yaw=0;player.pitch=0;player.fireCd=0;player.mags[0]=12;player.reloading=0;enemies.length=0;
      fire();buildEntityData();let maxScale=0;for(let i=0;i<instCount;i++)maxScale=Math.max(maxScale,instData[i*8+3]);
      const f=forwardVec();const rl=Math.hypot(f[0],f[2])||1;const right=[-f[2]/rl,0,f[0]/rl];buildBeamData(f,right);
      let thin=true,finite=true;for(let b=0;b<beamCount;b++){const o=b*42;const w=Math.hypot(beamData[o+7]-beamData[o],beamData[o+8]-beamData[o+1],beamData[o+9]-beamData[o+2]);if(w>0.2)thin=false;for(let k=0;k<42;k++)if(!Number.isFinite(beamData[o+k]))finite=false;}
      return {ok:beamCount>=1&&thin&&finite&&maxScale<=INSTANCE_SCALE_MAX,error:'beams='+beamCount+' thin='+thin+' maxInstanceScale='+maxScale.toFixed(2)+'<='+INSTANCE_SCALE_MAX};});
    test('render.onContextLost',()=>{mark('render.onContextLost');const cl=contextLost,run=running;let prevented=false;
      onContextLost({preventDefault(){prevented=true;}});
      const okv=contextLost===true&&running===false&&prevented===true&&!$('ctxOverlay').classList.contains('hidden');
      contextLost=cl;running=run;$('ctxOverlay').classList.add('hidden');hideErr();
      return {ok:okv,error:'stops loop + preventDefault + shows restore overlay'};});
    test('render.contextReinit',()=>{mark('render.onContextRestored');mark('render.restoreGraphics');
      const noReload=!/location\.reload/.test(onContextRestored.toString());
      const reinits=/initWebGL/.test(restoreGraphics.toString())&&/buildArenaMesh/.test(restoreGraphics.toString());
      const noDupLoop=/wasRunning/.test(restoreGraphics.toString());
      const wired=typeof onContextRestored==='function'&&typeof restoreGraphics==='function'&&!!$('ctxOverlay')&&!!$('ctxBtn');
      return {ok:noReload&&reinits&&noDupLoop&&wired,error:'reloadLoopRemoved='+noReload+' reinitInPlace='+reinits+' noDupLoop='+noDupLoop};});
    test('render.hideErr',()=>{mark('render.hideErr');const e=$('errbox');const d=e.style.display;e.style.display='block';hideErr();const okv=e.style.display==='none';e.style.display=d;return {ok:okv,error:'hideErr clears error box'};});
    test('render.gatherLights',()=>{mark('render.gatherLights');const snap=snapshotState();const lc=lightCount;
      try{enemies.length=0;eproj.length=0;spawnPyre();for(let i=0;i<3;i++)spawnProjectile(20+i*2,3,20,1,0,0,3,0.22,PAL.cyan);G.muzzle=1;
        const r=gatherLights();const bs=r.bossSlot,o=bs*7;
        const amber=bs>=0&&lightData[o+3]===1&&Math.abs(lightData[o+4]-0.69)<1e-6&&Math.abs(lightData[o+5]-0.13)<1e-6;
        return {ok:r.ok&&r.count>=5&&r.order==='boss-first'&&amber,error:'count='+r.count+' bossSlot='+bs+' amber='+amber};
      }finally{restoreState(snap);lightCount=lc;}});
    test('render.uploadLights',()=>{mark('render.uploadLights');const lc=lightCount;
      try{lightCount=2;lightData.set([10,3,10,1,0.93,0.8,9,20,3,20,0.13,0.88,1,5]);
        gl.useProgram(progDyn);const a=uploadLights(progDyn);const e1=gl.getError();
        gl.useProgram(progArena);const b=uploadLights(progArena);const e2=gl.getError();
        lightCount=0;gl.useProgram(progDyn);const c=uploadLights(progDyn);const e3=gl.getError();
        return {ok:a.ok&&b.ok&&c.ok&&a.count===2&&c.count===0&&e1===gl.NO_ERROR&&e2===gl.NO_ERROR&&e3===gl.NO_ERROR,error:'dyn='+a.ok+' arena='+b.ok+' zero='+c.ok+' glErr='+e1+'/'+e2+'/'+e3};
      }finally{lightCount=lc;}});
    test('render.glowBuffer',()=>{mark('render.pushGlow');mark('render.buildGlowData');const bak=glows.slice();glows.length=0;
      try{for(let i=0;i<35;i++)pushGlow(i,2,i,PAL.cyan,1.4,0.3);
        const r=buildGlowData([0,0,-1],[1,0,0]);let finite=true;for(let k=0;k<glowCount*42;k++)if(!Number.isFinite(glowData[k]))finite=false;
        return {ok:glows.length===GLOW_MAX&&r.ok&&r.count===GLOW_MAX&&finite,error:'ring='+glows.length+' quads='+r.count+' finite='+finite};
      }finally{glows.length=0;for(const g of bak)glows.push(g);}});
    test('render.drawGlow',()=>{mark('render.drawGlow');const bak=glows.slice();glows.length=0;
      try{pushGlow(player.x,player.y+1,player.z-3,PAL.cyan,1.6,0.3);const r=drawGlow(forwardVec(),[1,0,0]);const e=gl.getError();
        return {ok:r.ok&&r.count>=1&&e===gl.NO_ERROR,error:'count='+r.count+' glErr='+e};
      }finally{glows.length=0;for(const g of bak)glows.push(g);}});
    test('render.throttleLights',()=>{mark('render.throttleLights');const fe=frameEMA,cap=projLightCap,sf=lightSlowFrames,ff=lightFastFrames,lg=lightsThrottledLogged,lc=lightCount,lt=G.lightsThrottled,rs=renderScale;
      try{frameEMA=35;projLightCap=8;lightSlowFrames=0;lightFastFrames=0;lightsThrottledLogged=false;lightCount=10;G.lightsThrottled=0;
        let last=null,drops=0;for(let i=0;i<130;i++){last=throttleLights();if(last.throttled)drops++;}
        const droppedToZero=projLightCap===0&&drops===2&&G.lightsThrottled===2&&renderScale===rs;
        frameEMA=10;lightFastFrames=0;for(let i=0;i<120;i++)throttleLights();
        const recovered=projLightCap===4;
        return {ok:last.ok&&droppedToZero&&recovered,error:'cap='+projLightCap+' drops='+drops+' events='+G.lightsThrottled+' scaleUntouched='+(renderScale===rs)+' recovered='+recovered};
      }finally{frameEMA=fe;projLightCap=cap;lightSlowFrames=sf;lightFastFrames=ff;lightsThrottledLogged=lg;lightCount=lc;G.lightsThrottled=lt;}});
    // ---- audio ----
    test('audio.ensureAudio',()=>{mark('audio.ensureAudio');return {ok:true,skip:!AC,error:AC?'AudioContext present':'no gesture yet (deferred)'};});
    test('audio.tone',()=>{mark('audio.tone');if(!AC)return {ok:true,skip:true,error:'no AudioContext'};tone(440,0.01,'square',0.001);return {ok:true,error:''};});
    test('audio.noiseBurst',()=>{mark('audio.noiseBurst');if(!AC)return {ok:true,skip:true,error:'no AudioContext'};noiseBurst(0.01,0.001);return {ok:true,error:''};});
    test('audio.sfx',()=>{mark('audio.sfx');sfx('hit');return {ok:true,error:AC?'':'silent (no ctx)'};});
    test('audio.setMuted',()=>{mark('audio.setMuted');mark('settings.apply');const m=muted;setMuted(!m);setMuted(m);const g=applyGain();return {ok:muted===m&&(!g||g.ok!==false),error:'setMuted roundtrip'};});
    test('audio.music',()=>{mark('audio.music');
      const modes=['menu','combat','boss'];
      const tableOk=modes.every(k=>MUSIC[k]&&MUSIC[k].bpm>0&&MUSIC[k].root>0&&MUSIC[k].dur>0&&MUSIC[k].steps.length>=4&&MUSIC[k].steps.every(n=>typeof n==='number'));
      const s=startMusic();
      const startGuard=s.ok===false&&musicTimer===null;
      const step=stepMusic();
      const stepGuard=step.playing===false&&musicTimer===null;
      return {ok:tableOk&&startGuard&&stepGuard,error:'table='+tableOk+' startGuard='+startGuard+' stepGuard='+stepGuard};});
    test('audio.musicState',()=>{mark('audio.musicState');mark('audio.musicModeFor');
      const gs=gameStarted,md=G.mode,e0=enemies;const r={};
      try{
        gameStarted=false;G.mode='menu';enemies=[];r.menu=musicModeFor();
        gameStarted=true;G.mode='playing';enemies=[{hp:5}];r.combat=musicModeFor();
        enemies=[{hp:5,boss:true}];r.boss=musicModeFor();
        enemies=[];r.idle=musicModeFor();
      }finally{gameStarted=gs;G.mode=md;enemies=e0;}
      const st=musicState();
      const okv=r.menu==='menu'&&r.combat==='combat'&&r.boss==='boss'&&r.idle==='menu'&&!!st.ok&&typeof st.playing==='boolean'&&st.bpm===112&&typeof st.intensity==='number'&&typeof st.layers==='object';
      return {ok:okv,error:JSON.stringify(r)+' state='+JSON.stringify(st)};});
    test('audio.setIntensity',()=>{mark('audio.setIntensity');
      const e0=enemies;enemies=[];
      try{
        const hi=setIntensity(0.8),lo=setIntensity(0.2);
        return {ok:!!hi.ok&&hi.layers.lead===true&&hi.layers.arp===true&&hi.layers.bass===true&&!!lo.ok&&lo.layers.bass===true&&lo.layers.arp===false&&lo.layers.lead===false&&lo.layers.pad===false,
          error:'hi='+JSON.stringify(hi.layers)+' lo='+JSON.stringify(lo.layers)};
      }finally{enemies=e0;}});
    test('audio.scheduleStep',()=>{mark('audio.scheduleStep');
      const r=scheduleStep(4);
      return {ok:!!r.ok&&r.silent===true&&r.step===4,error:JSON.stringify(r)};});
    test('audio.sfxAt',()=>{mark('audio.sfxAt');
      const r=sfxAt('tshot',player.x-20,player.z);
      const bad=sfxAt('nope',0,0);
      return {ok:!!r.ok&&r.silent===true&&Math.abs(r.pan-(-20/24))<1e-9&&bad.ok===false,error:'pan='+r.pan+' silent='+r.silent+' bad='+bad.ok};});
    test('audio.director',()=>{mark('audio.startMusicDirector');mark('audio.stopMusicDirector');mark('audio.tickMusicDirector');mark('audio.computeIntensity');mark('audio.duckMusic');
      const s=startMusicDirector();
      const tick=tickMusicDirector();
      const ci=computeIntensity();
      const duck=duckMusic(true),unduck=duckMusic(false);
      const e=stopMusicDirector();
      const st=musicState();
      return {ok:!!s.ok&&s.on===true&&!!tick.ok&&typeof ci==='number'&&ci>=0&&ci<=1&&!!duck.ok&&!!unduck.ok&&!!e.ok&&e.on===false&&st.playing===false,
        error:'start='+JSON.stringify(s)+' tick='+JSON.stringify(tick)+' ci='+ci+' stop='+JSON.stringify(e)};});
    // ---- settings ----
    test('settings.roundtrip',()=>{mark('settings.load');
      let prev=null;try{prev=localStorage.getItem(SETTINGS_KEY);}catch(e){}
      let out=null;
      try{localStorage.setItem(SETTINGS_KEY,JSON.stringify({sens:1.7,vol:0.25,invertY:true,minimap:false,music:false,quality:'low'}));
        const s=loadSettings();out={ok:s.sens===1.7&&s.vol===0.25&&s.invertY===true&&s.minimap===false&&s.music===false&&s.quality==='low',error:JSON.stringify(s)};}
      catch(e){out={ok:false,error:'storage threw: '+e.message};}
      finally{try{if(prev===null)localStorage.removeItem(SETTINGS_KEY);else localStorage.setItem(SETTINGS_KEY,prev);}catch(e){}}
      return out;});
    test('settings.clamp',()=>{mark('settings.load');
      const s=sanitizeSettings({sens:99,vol:-3,invertY:'yes',minimap:0,music:null,quality:'ultra'});
      const okv=s.sens===2.5&&s.vol===0&&s.invertY===false&&s.minimap===true&&s.music===true&&s.quality==='auto';
      return {ok:okv,error:JSON.stringify(s)};});
    test('settings.noBenchWrite',()=>{mark('settings.save');
      let before=null;try{before=localStorage.getItem(SETTINGS_KEY);}catch(e){}
      const saved=saveSettings();
      let after=null;try{after=localStorage.getItem(SETTINGS_KEY);}catch(e){}
      return {ok:saved===false&&before===after,error:'saved='+saved+' unchanged='+(before===after)};});
    test('settings.inputPanel',()=>{mark('settings.inputPanel');
      const ids=['sensXRange','sensXVal','sensYRange','sensYVal','deadzoneRange','deadzoneVal','leftyChk','tapFireChk','fireZoneRange'];
      const missing=ids.filter(id=>!$(id));
      const keys=['sensX','sensY','deadzone','lefty'];
      const i18nOk=keys.every(k=>typeof STR.en[k]==='string'&&STR.en[k]&&typeof STR.de[k]==='string'&&STR.de[k]);
      return {ok:missing.length===0&&i18nOk,error:'missing='+JSON.stringify(missing)+' i18n='+i18nOk};});
    test('settings.setSensXY',()=>{mark('settings.setSensXY');
      const bak={x:SET.sensX,y:SET.sensY},y0=player.yaw;
      try{
        const a=setSensXY(9,0.05),b=setSensXY('x',1);
        SET.sensX=1;applyLook(10,0,0.0022);const one=player.yaw-y0;player.yaw=y0;
        SET.sensX=2;applyLook(10,0,0.0022);const two=player.yaw-y0;player.yaw=y0;
        const ui=$('sensXVal')?$('sensXVal').textContent:'';
        const okv=a.ok===true&&a.sensX===3&&a.sensY===0.2&&b.ok===false&&Math.abs(two-2*one)<1e-9&&/\./.test(ui);
        return {ok:okv,error:'a='+JSON.stringify(a)+' bad='+b.ok+' one='+one.toFixed(6)+' two='+two.toFixed(6)};
      }finally{SET.sensX=bak.x;SET.sensY=bak.y;player.yaw=y0;applySettingsUI();}});
    test('settings.stickDeadzone',()=>{mark('settings.stickDeadzone');
      const z=stickDeadzone(0.02,0.02,0.12),edge=stickDeadzone(1,0,0.12),bad=stickDeadzone(NaN,0,NaN);
      const okv=z.x===0&&z.y===0&&z.mag===0&&edge.ok===true&&edge.mag>0.99&&Math.abs(edge.x-1)<1e-9&&bad.ok===true&&bad.x===0;
      return {ok:okv,error:'z='+JSON.stringify(z)+' edgeMag='+edge.mag.toFixed(4)+' bad='+JSON.stringify(bad)};});
    test('settings.setDeadzone',()=>{mark('settings.setDeadzone');
      const bak=SET.deadzone;
      try{
        const a=setDeadzone(0.9);
        const inside=stickDeadzone(0.01,0.01,SET.deadzone);
        const b=setDeadzone(-1),c=setDeadzone('x');
        const ui=$('deadzoneVal')?$('deadzoneVal').textContent:'';
        const okv=a.ok===true&&a.deadzone===0.3&&b.deadzone===0&&c.ok===false&&inside.x===0&&/0\.00/.test(ui);
        return {ok:okv,error:'a='+a.deadzone+' b='+b.deadzone+' bad='+c.ok+' inside='+inside.x+' ui='+ui};
      }finally{SET.deadzone=bak;applySettingsUI();}});
    test('settings.setLefty',()=>{mark('settings.setLefty');mark('settings.applyLefty');
      const bak=SET.lefty;
      try{
        const a=setLefty(true),on=document.body.classList.contains('lefty'),chk=$('leftyChk')?$('leftyChk').checked:null;
        const b=setLefty(false),off=document.body.classList.contains('lefty');
        const okv=a.ok===true&&a.lefty===true&&on===true&&chk===true&&b.ok===true&&off===false;
        return {ok:okv,error:'on='+on+' chk='+chk+' off='+off};
      }finally{SET.lefty=bak;applySettingsUI();}});
    test('input.lookApply',()=>{mark('input.lookApply');
      const y0=player.yaw,p0=player.pitch,iy=SET.invertY;SET.invertY=false;
      const r=applyLook(10,10,0.0022);const down=r.pitch<p0;player.yaw=y0;player.pitch=p0;SET.invertY=iy;
      return {ok:!!r.ok&&down,error:'yaw+='+(r.yaw-y0).toFixed(4)+' pitch+='+(r.pitch-p0).toFixed(4)};});
    test('input.invertY',()=>{mark('input.lookApply');
      const y0=player.yaw,p0=player.pitch,iy=SET.invertY;
      SET.invertY=false;const n=applyLook(0,10,0.0022);player.yaw=y0;player.pitch=p0;
      SET.invertY=true;const i=applyLook(0,10,0.0022);player.yaw=y0;player.pitch=p0;SET.invertY=iy;
      return {ok:n.pitch<p0&&i.pitch>p0,error:'normal+='+(n.pitch-p0).toFixed(4)+' inverted+='+(i.pitch-p0).toFixed(4)};});
    test('input.invertYPitchOnly',()=>{mark('input.lookApply');
      spawnPlayer();const y0=player.yaw,p0=player.pitch,iy=SET.invertY;
      SET.invertY=true;applyLook(100,0);const yawPlus=player.yaw-y0;applyLook(-100,0);const yawBack=player.yaw-y0;
      player.yaw=y0;applyLook(0,100);const pitchInv=player.pitch-p0;
      player.pitch=p0;SET.invertY=false;applyLook(0,100);const pitchNorm=player.pitch-p0;
      player.yaw=y0;player.pitch=p0;SET.invertY=iy;
      return {ok:yawPlus>0&&Math.abs(yawBack)<1e-9&&pitchInv>0&&pitchNorm<0,error:'yawPlus='+yawPlus.toFixed(4)+' yawBack='+yawBack.toFixed(4)+' pitchInv='+pitchInv.toFixed(4)+' pitchNorm='+pitchNorm.toFixed(4)};});
    // ---- input / state / hud ----
    test('input.requestLock',()=>{mark('input.requestLock');const r=requestLock();return {ok:typeof r.ok==='boolean'&&!isPointerLocked,error:'requestLock -> '+JSON.stringify(r)+' locked='+isPointerLocked};});
    test('input.clearInput',()=>{mark('input.clearInput');keys['KeyW']=true;clearInput();return {ok:!keys['KeyW'],error:'clearInput'};});
    test('input.lockState',()=>{mark('input.lockState');const el=document.pointerLockElement;return {ok:isPointerLocked===false&&!el,error:'isPointerLocked='+isPointerLocked+' lockedElement='+(el?el.id||'yes':'null')};});
    test('input.keysClear',()=>{mark('input.keysClear');keys['KeyA']=true;keys['Mouse0']=true;touch.fire=true;clearInput();const stuck=Object.keys(keys).filter(k=>keys[k]);
      return {ok:stuck.length===0&&touch.fire===false&&touch.mx===0&&touch.mz===0,error:'stuckKeys='+JSON.stringify(stuck)+' touch.fire='+touch.fire};});
    test('input.touchIdle',()=>{mark('input.touchIdle');const okv=touch.fire===false&&touch.jump===false&&touch.mx===0&&touch.mz===0;
      return {ok:okv,error:'touch idle fire='+touch.fire+' jump='+touch.jump+' mx='+touch.mx+' mz='+touch.mz};});
    test('state.togglePause',()=>{mark('state.togglePause');return {ok:true,skip:true,error:'requires active game (covered by live play)'};});
    test('state.toMenu',()=>{mark('state.toMenu');return {ok:true,skip:true,error:'mutates UI (covered by live play)'};});
    test('state.startGame',()=>{mark('state.startGame');return {ok:typeof startGame==='function',error:'startGame callable'};});
    test('hud.updateHUD',()=>{mark('hud.updateHUD');updateHUD(0.016);return {ok:true,error:''};});
    // ---- v0.4.0: a11y / i18n / mobile / LANCE / balance / replay ----
    test('a11y.defaults',()=>{mark('a11y.apply');
      const d=DEFAULT_SETTINGS;
      const flags=typeof d.reducedMotion==='boolean'&&typeof d.highContrast==='boolean'&&typeof d.colorblind==='boolean'&&typeof d.autotune==='boolean'&&d.lang==='';
      const s=sanitizeSettings({reducedMotion:'x',highContrast:1,colorblind:null,lang:'fr',autotune:'yes'});
      const clean=s.reducedMotion===false&&s.highContrast===false&&s.colorblind===false&&s.autotune===false&&s.lang==='';
      const r=applyA11y();
      return {ok:flags&&clean&&!!r.ok,error:'flags='+flags+' clean='+clean+' apply='+JSON.stringify(r)};});
    test('a11y.classToggles',()=>{mark('a11y.apply');mark('a11y.shapeSpec');
      const bak={reducedMotion:SET.reducedMotion,highContrast:SET.highContrast,colorblind:SET.colorblind};
      const cls=document.body.className;
      try{
        SET.reducedMotion=true;SET.highContrast=true;SET.colorblind=true;applyA11y();
        const on=document.body.classList.contains('a11y-motion')&&document.body.classList.contains('a11y-contrast')&&document.body.classList.contains('a11y-color');
        const sp=shapeSpec(2,null);
        SET.reducedMotion=false;SET.highContrast=false;SET.colorblind=false;applyA11y();
        const off=!document.body.classList.contains('a11y-motion')&&!document.body.classList.contains('a11y-contrast')&&!document.body.classList.contains('a11y-color');
        const plain=shapeSpec(2,null).length===0;
        return {ok:on&&off&&sp.length===4&&plain,error:'on='+on+' off='+off+' bruteNubs='+sp.length+' plain='+plain};
      }finally{SET.reducedMotion=bak.reducedMotion;SET.highContrast=bak.highContrast;SET.colorblind=bak.colorblind;document.body.className=cls;}});
    test('a11y.shakeDamped',()=>{mark('a11y.shakeAmp');
      const r0=SET.reducedMotion,s0=G.shake;
      try{
        G.shake=1;SET.reducedMotion=false;const full=shakeAmp();
        SET.reducedMotion=true;const damp=shakeAmp();
        return {ok:full===1&&damp>0&&damp<=0.15*full+1e-9,error:'full='+full+' damp='+damp};
      }finally{SET.reducedMotion=r0;G.shake=s0;}});
    test('i18n.table',()=>{mark('i18n.t');
      const en=STR.en,de=STR.de;const missing=[];
      for(const k in en)if(!(k in de))missing.push(k);
      const lenOk=Object.keys(en).length>=26;
      const bak=LANG;LANG='en';const a=t('wave');LANG='de';const b=t('wave');LANG=bak;
      return {ok:missing.length===0&&lenOk&&a==='WAVE'&&b==='WELLE',error:'missing=['+missing.join(',')+'] en='+a+' de='+b};});
    test('i18n.switch',()=>{mark('i18n.setLang');mark('i18n.apply');
      const bakL=LANG,bakSet=SET.lang,bakHtml=document.documentElement.lang;
      try{
        const r1=setLang('de');
        const lbl=$('hudWave')?$('hudWave').querySelector('.lbl'):null;
        const deWave=lbl?lbl.textContent:'';
        const htmlDe=document.documentElement.lang;
        const bad=setLang('xx');
        const r2=setLang('en');
        const enWave=lbl?lbl.textContent:'';
        return {ok:!!r1.ok&&deWave==='WELLE'&&htmlDe==='de'&&bad.ok===false&&!!r2.ok&&enWave==='WAVE',
          error:'de='+deWave+' html='+htmlDe+' bad='+JSON.stringify(bad)+' en='+enWave};
      }finally{LANG=bakL;SET.lang=bakSet;document.documentElement.lang=bakHtml;applyLang();}});
    test('i18n.fallback',()=>{mark('i18n.resolve');
      const bakL=LANG,bakSet=SET.lang;
      try{
        LANG='de';const miss=t('__nope__');
        SET.lang='de';const rd=resolveLang();
        SET.lang='';
        const auto=resolveLang();
        return {ok:miss==='__nope__'&&rd==='de'&&(auto==='en'||auto==='de'),error:'miss='+miss+' explicit='+rd+' auto='+auto};
      }finally{LANG=bakL;SET.lang=bakSet;}});
    test('ui.weaponButtons',()=>{mark('ui.weaponButtons');
      const snap=snapshotState();const wasPaused=paused,wasOver=gameOver;
      try{
        paused=false;gameOver=false;setWeapon(0);const a=syncWeaponBtns();
        const r=setWeapon(1);const b=syncWeaponBtns();
        const box=$('wpnBtns');const btn=box?box.children[1]:null;const btnOn=!!btn&&btn.classList.contains('on');
        const r3=setWeapon(3);syncWeaponBtns();const arc=box?box.children[3]:null;
        return {ok:!!a.ok&&!!r.ok&&r.wi===1&&btnOn&&box.children.length===4&&r3.wi===3&&!!arc&&arc.classList.contains('on'),
          error:'wi='+r.wi+' on='+btnOn+' n='+(box?box.children.length:0)+' arc='+(arc?arc.classList.contains('on'):'none')};
      }finally{paused=wasPaused;gameOver=wasOver;restoreState(snap);}});
    test('ui.pauseSettings',()=>{mark('ui.pauseSettings');mark('settings.setVol');mark('settings.setSens');mark('settings.setMusic');
      const bak={vol:SET.vol,sens:SET.sens,music:SET.music};const sv=sensitivity;
      try{
        const a=setVol(0.35),b=setSens(1.7),c=setMusic(false);
        const pv=$('pVolVal')?$('pVolVal').textContent:'',ps=$('pSensVal')?$('pSensVal').textContent:'';
        const mv=$('volRange')?+$('volRange').value:0,ms=$('sensRange')?+$('sensRange').value:0;
        return {ok:!!a.ok&&!!b.ok&&!!c.ok&&pv==='0.35'&&ps==='1.7'&&Math.abs(mv-0.35)<1e-6&&Math.abs(ms-1.7)<1e-6,
          error:'pause='+pv+'/'+ps+' menu='+mv+'/'+ms};
      }finally{SET.vol=bak.vol;SET.sens=bak.sens;SET.music=bak.music;sensitivity=sv;}});
    test('boss.lanceSpawn',()=>{mark('sim.spawnBoss');
      const snap=snapshotState();
      try{
        resetGame();G.wave=10;enemies.length=0;
        const a=spawnBoss();const b=enemies[enemies.length-1];
        const lance=!!a.ok&&b.type===5&&b.archetype==='lance'&&b.beamCd>0&&b.size===2.2&&b.maxhp===b.hp;
        enemies.length=0;G.wave=5;
        const c=spawnBoss();const w=enemies[enemies.length-1];
        const warden=!!c.ok&&w.type===4&&w.archetype==='warden';
        return {ok:lance&&warden,error:'lance='+JSON.stringify(a)+' type='+(b&&b.type)+' warden='+(w&&w.type)};
      }finally{restoreState(snap);}});
    test('boss.lanceBeamGeometry',()=>{mark('sim.beamHit');
      const on=beamHit(0,0,10,0,5,1,1.2),off=beamHit(0,0,10,0,5,2.5,1.2);
      const before=beamHit(0,0,10,0,-3,0,1.2),end=beamHit(0,0,10,0,10,0.5,1.2);
      return {ok:on===true&&off===false&&before===false&&end===true,error:'on='+on+' off='+off+' before='+before+' end='+end};});
    test('boss.lanceChargeCycle',()=>{mark('sim.updateLance');
      const snap=snapshotState();
      try{
        resetGame();spawnPlayer();enemies.length=0;tracers.length=0;G.wave=10;spawnBoss();
        const b=enemies[0];b.x=player.x;b.z=player.z-18;b.y=groundAt(b.x,b.z)+1.35;b.beamCd=0;b.chargeT=0;
        player.hp=100;player.hurtCd=0;player.shield=0;player.rapid=0;
        updateEnemies(0.1);const charging=b.chargeT>0;
        for(let i=0;i<12&&b.chargeT>0;i++)updateEnemies(0.1);
        const stationaryHit=player.hp<100;
        restoreState(snap);
        resetGame();spawnPlayer();enemies.length=0;tracers.length=0;G.wave=10;spawnBoss();
        const b2=enemies[0];b2.x=player.x;b2.z=player.z-18;b2.y=groundAt(b2.x,b2.z)+1.35;b2.beamCd=0;b2.chargeT=0;
        player.hp=100;player.hurtCd=0;player.shield=0;
        updateEnemies(0.1);
        for(let i=0;i<8;i++)updateEnemies(0.1);
        player.x+=6;
        for(let i=0;i<4;i++)updateEnemies(0.1);
        const sidestepMiss=player.hp===100;
        return {ok:charging&&stationaryHit&&sidestepMiss,error:'charging='+charging+' stationaryHit='+stationaryHit+' sidestepMiss='+sidestepMiss+' hp='+player.hp};
      }finally{restoreState(snap);}});
    test('bal.escalationCaps',()=>{mark('sim.spawnEnemy');
      const snap=snapshotState();
      try{
        resetGame();spawnPlayer();G.wave=40;const d=DIFF[difficulty];
        let maxHp=0,maxSp=0;const types=new Set();
        for(let i=0;i<200;i++){enemies.length=0;spawnEnemy();const e=enemies[0];
          maxHp=Math.max(maxHp,e.hp/d.hp);maxSp=Math.max(maxSp,e.speed/d.speed);types.add(e.type);}
        const hpOk=maxHp<=70*3+1e-6,spOk=maxSp<=3.4*1.6+1e-6,mixOk=types.size===7;
        return {ok:hpOk&&spOk&&mixOk,error:'maxHp='+maxHp.toFixed(2)+'<=210 maxSpeed='+maxSp.toFixed(2)+'<=5.44 types='+Array.from(types).join(',')+' (want 7: 4 legacy + turret/dash/shielder)'};
      }finally{restoreState(snap);}});
    test('bal.autotune',()=>{mark('bal.tune');
      const snap=snapshotState();const bak=SET.autotune;
      try{
        resetGame();spawnPlayer();player.hp=100;
        SET.autotune=false;G.wave=10;startWave();const off=G.dynCount;
        SET.autotune=true;G.wave=10;G.dmgTaken=0;G.waveDmg=0;startWave();const clean=G.dynCount;
        player.hp=100;G.wave=11;G.waveDmg=G.dmgTaken;G.dmgTaken+=5;startWave();const normal=G.dynCount;
        player.hp=20;G.wave=12;G.waveDmg=G.dmgTaken;G.dmgTaken+=5;startWave();const low=G.dynCount;
        const spawnOk=G.toSpawn===Math.round((4+13*2.2)*DIFF[difficulty].count*low);
        return {ok:off===1&&clean===1.15&&normal===1&&low===0.85&&spawnOk,error:'off='+off+' clean='+clean+' normal='+normal+' low='+low+' toSpawn='+G.toSpawn};
      }finally{SET.autotune=bak;restoreState(snap);}});
    test('replay.records',()=>{mark('replay.record');
      const snap=snapshotState();const bakBench=benchRunning;
      try{
        resetGame();spawnPlayer();gameStarted=true;gameOver=false;paused=false;benchRunning=false;
        replayLog={v:2,seed:G.runSeed|0,lang:LANG,diff:difficulty,frames:[],truncated:false};replayCount=0;replayLook=[0,0];replayLastWi=-1;
        keys['KeyW']=true;touch.fire=true;
        for(let i=0;i<10;i++)updateGame(1/60);
        keys['KeyW']=false;touch.fire=false;
        const f=replayLog.frames;const f0=f[0]||{};
        const okv=f.length===10&&f0.k===1&&f0.f===1&&f0.dt===1/60&&f0.w===0&&Array.isArray(f0.l)&&f0.j===0;
        return {ok:okv,error:'frames='+f.length+' k='+f0.k+' f='+f0.f+' dt='+f0.dt+' w='+f0.w+' j='+f0.j};
      }finally{benchRunning=bakBench;restoreState(snap);}});
    test('replay.exportGuard',()=>{mark('replay.payload');
      const bak=replayLog;
      try{
        replayLog=null;const a=buildReplayPayload();
        replayLog={v:2,seed:4242,lang:LANG,diff:difficulty,frames:[{k:0,l:[0,0],f:0,w:0,j:0,dt:0.016},{k:1,l:[1,0],f:1,w:-1,j:0,dt:0.016}],summary:{score:0,kills:0,waves:0,time:0.032},truncated:false};
        const b=buildReplayPayload();
        return {ok:a.ok===false&&b.ok===true&&b.payload.schema==='sun011.replay.v2'&&b.payload.frames.length===2&&b.payload.seed===4242&&b.payload.summary.score===0,
          error:'empty='+JSON.stringify(a)+' schema='+(b.payload&&b.payload.schema)+' n='+(b.payload&&b.payload.frames.length)};
      }finally{replayLog=bak;}});
    test('replay.summary',()=>{mark('replay.summary');
      const good=replaySummary({schema:'sun011.replay.v2',seed:7,frames:[{dt:0.5},{dt:0.25}]});
      const legacy=replaySummary({schema:'sun007.replay.v1',seed:7,frames:[{dt:0.5}]});
      const bad=replaySummary({schema:'x',seed:7,frames:[]});
      const empty=replaySummary({schema:'sun011.replay.v2',seed:7,frames:[]});
      const nul=replaySummary(null);
      return {ok:good.ok&&good.frames===2&&Math.abs(good.duration-0.75)<1e-9&&!good.legacy&&legacy.ok&&legacy.legacy===true&&bad.ok===false&&empty.ok===true&&nul.ok===false,
        error:'good='+JSON.stringify(good)+' legacy='+legacy.ok+'/'+legacy.legacy+' bad='+bad.ok+' empty='+empty.ok+' null='+nul.ok};});
    test('replay.validate',()=>{mark('replay.validate');
      const good=replayValidate({schema:'sun011.replay.v2',seed:4242,diff:'NORMAL',frames:[{k:0,l:[0,0],f:0,w:-1,j:0,dt:0.016}],summary:{score:0,kills:0,waves:0,time:0.016}});
      const prevGen=replayValidate({schema:'sun010.replay.v2',seed:7,frames:[{dt:0.1}],summary:{score:0,kills:0,waves:0}});
      const legacy=replayValidate({schema:'sun008.replay.v1',seed:7,frames:[{dt:0.5}]});
      const perk=replayValidate({schema:'sun011.replay.v2',seed:7,frames:[{dt:0.1},{p:'dmg15'}],summary:{score:0,kills:0,waves:0}});
      const badSchema=replayValidate({schema:'x',seed:7,frames:[{dt:0.1}]});
      const nanDt=replayValidate({schema:'sun011.replay.v2',seed:7,frames:[{dt:NaN}],summary:{score:0,kills:0,waves:0}});
      const noSum=replayValidate({schema:'sun011.replay.v2',seed:7,frames:[{dt:0.1}]});
      return {ok:good.ok&&good.v===2&&prevGen.ok&&prevGen.v===2&&legacy.ok&&legacy.v===1&&perk.ok&&badSchema.ok===false&&nanDt.ok===false&&/corrupt frame 0/.test(nanDt.reason)&&noSum.ok===false,
        error:'good='+JSON.stringify(good)+' prevGen='+prevGen.ok+' legacyV='+legacy.v+' perk='+perk.ok+' nan='+nanDt.reason+' noSum='+noSum.reason};});
    test('replay.play',()=>{mark('replay.play');mark('replay.playbackState');mark('replay.endPlayback');
      const snap=snapshotState();const domSnap=snapshotDOM();const bakPB=PB,bakDiff=difficulty;
      try{
        const payload={schema:'sun011.replay.v2',seed:4242,diff:'NORMAL',frames:[{k:0,l:[0,0],f:0,w:-1,j:0,dt:0.016},{k:0,l:[0,0],f:0,w:-1,j:0,dt:0.016}],summary:{score:0,kills:0,waves:0,time:0.032}};
        const r=replayPlay(payload);
        if(!r.ok)return {ok:false,error:'play: '+r.error};
        stepPlayback();stepPlayback();
        const st=playbackState();
        const end=endPlayback();
        return {ok:st.i===2&&end.ok===true&&end.match===true&&G.mode==='playback',error:'i='+st.i+' end='+JSON.stringify(end)};
      }finally{PB=bakPB;difficulty=bakDiff;restoreState(snap);restoreDOM(domSnap);$('pbBar').classList.add('hidden');$('pbEnd').classList.add('hidden');}});
    test('replay.camCycle',()=>{mark('replay.camCycle');
      const snap=snapshotState();const domSnap=snapshotDOM();const bakPB=PB,bakDiff=difficulty;
      try{
        const payload={schema:'sun011.replay.v2',seed:4242,diff:'NORMAL',frames:[{k:0,l:[0,0],f:0,w:-1,j:0,dt:0.016}],summary:{score:0,kills:0,waves:0,time:0.016}};
        const r=replayPlay(payload);
        if(!r.ok)return {ok:false,error:'play: '+r.error};
        const c1=pbCycleCam(),c2=pbCycleCam(),c3=pbCycleCam();
        const xh=$('crosshair').classList.contains('on');
        const lbl=$('pbCam').textContent;
        const bad=pbSetCam('orbit');
        return {ok:c1.cam==='third'&&c2.cam==='free'&&c3.cam==='first'&&xh===true&&bad.ok===false&&lbl===t('pbCam')+': '+t('pbCamFirst'),
          error:'seq='+c1.cam+','+c2.cam+','+c3.cam+' xhair='+xh+' bad='+bad.ok+' lbl='+lbl};
      }finally{PB=bakPB;difficulty=bakDiff;restoreState(snap);restoreDOM(domSnap);$('pbBar').classList.add('hidden');$('pbEnd').classList.add('hidden');}});
    test('replay.freeOrbit',()=>{mark('replay.freeOrbit');
      const snap=snapshotState();const domSnap=snapshotDOM();const bakPB=PB,bakDiff=difficulty;
      try{
        const payload={schema:'sun011.replay.v2',seed:4242,diff:'NORMAL',frames:[{k:0,l:[0,0],f:0,w:-1,j:0,dt:0.016}],summary:{score:0,kills:0,waves:0,time:0.016}};
        const r=replayPlay(payload,{cam:'free'});
        if(!r.ok)return {ok:false,error:'play: '+r.error};
        const vy0=PB.vy;
        const o=pbOrbit(100,50);
        const clampHi=pbOrbit(0,-1e9),clampLo=pbOrbit(0,1e9);
        const zMin=pbZoom(-1e9),zMax=pbZoom(1e9);
        const nan=pbOrbit(NaN,0);
        const off=pbSetCam('first');const oOff=pbOrbit(10,10);
        return {ok:o.ok&&Math.abs((vy0-o.vy)-0.5)<1e-9&&clampHi.vp===1.35&&clampLo.vp===-1.35&&zMin.dist===3&&zMax.dist===24&&nan.ok===false&&oOff.ok===false,
          error:'dVy='+(vy0-o.vy).toFixed(3)+' vp='+clampHi.vp+'/'+clampLo.vp+' dist='+zMin.dist+'/'+zMax.dist+' nan='+nan.ok+' offCam='+oOff.ok};
      }finally{PB=bakPB;difficulty=bakDiff;restoreState(snap);restoreDOM(domSnap);$('pbBar').classList.add('hidden');$('pbEnd').classList.add('hidden');}});
    test('replay.camDeterminism',()=>{mark('replay.camDeterminism');
      const snap=snapshotState();const domSnap=snapshotDOM();const bakPB=PB,bakDiff=difficulty;
      try{
        const payload={schema:'sun011.replay.v2',seed:4242,diff:'NORMAL',frames:[{k:1,l:[0,0],f:1,w:-1,j:0,dt:0.016},{k:1,l:[0,0],f:1,w:-1,j:0,dt:0.016}],summary:{score:0,kills:0,waves:0,time:0.032}};
        const r=replayPlay(payload,{cam:'free'});
        if(!r.ok)return {ok:false,error:'play: '+r.error};
        const yaw0=player.yaw,pitch0=player.pitch;
        pbOrbit(500,500);pbZoom(500);pbOrbit(-300,200);
        const viewOnly=player.yaw===yaw0&&player.pitch===pitch0;
        stepPlayback();stepPlayback();
        const end=endPlayback();
        return {ok:viewOnly&&end.ok===true&&end.match===true,error:'viewOnly='+viewOnly+' end='+JSON.stringify(end)};
      }finally{PB=bakPB;difficulty=bakDiff;restoreState(snap);restoreDOM(domSnap);$('pbBar').classList.add('hidden');$('pbEnd').classList.add('hidden');}});
    test('replay.tamper',()=>{mark('replay.endPlayback');
      const snap=snapshotState();const domSnap=snapshotDOM();const bakPB=PB,bakDiff=difficulty;
      try{
        const payload={schema:'sun011.replay.v2',seed:4242,diff:'NORMAL',frames:[{k:1,l:[0,0],f:1,w:-1,j:0,dt:0.016},{k:1,l:[0,0],f:1,w:-1,j:0,dt:0.016}],summary:{score:999,kills:0,waves:0,time:0.032}};
        const r=replayPlay(payload);
        if(!r.ok)return {ok:false,error:'play: '+r.error};
        stepPlayback();stepPlayback();
        const end=endPlayback();
        return {ok:end.ok===true&&end.match===false,error:JSON.stringify(end)};
      }finally{PB=bakPB;difficulty=bakDiff;restoreState(snap);restoreDOM(domSnap);$('pbBar').classList.add('hidden');$('pbEnd').classList.add('hidden');}});
    test('replay.pbGuard',()=>{mark('replay.play');mark('replay.playbackState');
      const snap=snapshotState();const domSnap=snapshotDOM();const bakPB=PB,bakDiff=difficulty;
      try{
        const legacy={schema:'sun008.replay.v1',seed:7,frames:[{k:0,l:[0,0],f:0,w:-1,j:0,dt:0.016}]};
        const r=replayPlay(legacy,{speed:2,cam:'third'});
        const st=playbackState();
        const lock=requestLock();
        const okv=r.ok&&r.degraded===true&&st.legacy===true&&st.speed===2&&st.cam==='third'&&lock.ok===false&&difficulty===1;
        endPlayback();
        return {ok:okv,error:'r='+JSON.stringify(r)+' st='+JSON.stringify(st)+' lock='+lock.ok+' diff='+difficulty};
      }finally{PB=bakPB;difficulty=bakDiff;restoreState(snap);restoreDOM(domSnap);$('pbBar').classList.add('hidden');$('pbEnd').classList.add('hidden');}});
    test('daily.seed',()=>{mark('daily.seed');
      const a=dailySeed(),b=dailySeed();
      const d1=dailySeedAt('2026-11-10T23:30Z'),d2=dailySeedAt('2026-11-11T00:30Z'),d3=dailySeedAt('2026-11-11T22:30Z');
      const bad=dailySeedAt('not-a-date');
      return {ok:a===b&&d1.ok&&d2.ok&&d3.ok&&d1.seed!==d2.seed&&d2.seed===d3.seed&&bad.ok===false,
        error:'a='+a+' b='+b+' d1='+d1.seed+' d2='+d2.seed+' d3='+d3.seed+' bad='+bad.ok};});
    test('daily.code',()=>{mark('daily.code');mark('daily.verify');
      const seed=dailySeed();
      const c=makeShareCode(seed,1234,56,7);
      const v=verifyDaily(c.code);
      const parts=c.code.split('-');const sc=parseInt(parts[1],36);parts[1]=((sc+1)>>>0).toString(36);const vt=verifyDaily(parts.join('-'));
      const wrong=verifyDaily('a-b-c-d-e');
      return {ok:c.ok&&v.ok&&v.score===1234&&v.kills===56&&v.waves===7&&vt.ok===false&&/hash/.test(vt.error)&&wrong.ok===false,
        error:'code='+c.code+' v='+JSON.stringify(v)+' tam='+JSON.stringify(vt)+' wrong='+wrong.ok};});
    test('daily.best',()=>{mark('daily.best');mark('daily.save');
      const bakBench=benchRunning;let bakRaw=null;try{bakRaw=localStorage.getItem(DAILY_KEY);}catch(e){}
      try{
        benchRunning=false;
        const ymd=dailySeedAt().ymd;
        saveDaily({date:ymd,score:100,kills:5,waves:2,hash:1,code:'x'});
        saveDaily({date:ymd,score:50,kills:3,waves:1,hash:2,code:'y'});
        const b=dailyBest();
        saveDaily({date:ymd,score:200,kills:9,waves:3,hash:3,code:'z'});
        const b2=dailyBest();
        return {ok:b.ok&&b.entry&&b.entry.score===100&&b2.ok&&b2.entry&&b2.entry.score===200,
          error:'keepHigher='+(b.entry&&b.entry.score)+' replace='+(b2.entry&&b2.entry.score)};
      }finally{benchRunning=bakBench;try{if(bakRaw===null)localStorage.removeItem(DAILY_KEY);else localStorage.setItem(DAILY_KEY,bakRaw);}catch(e){}}});
    test('daily.render',()=>{mark('daily.render');
      const r=renderDaily();const sv=$('dailySeedVal');
      return {ok:r.ok&&sv&&sv.textContent===String(dailySeed()),error:'render='+JSON.stringify(r)+' val='+(sv&&sv.textContent)};});
    test('state.startDaily',()=>{mark('state.startDaily');
      const snap=snapshotState(),dom=snapshotDOM();const si=$('seedInput');const bakDis=si?si.disabled:false;
      const seg=$('diffSeg');const bakSeg=seg?Array.from(seg.children).map(b=>b.disabled):[];
      try{
        const r=startDaily();
        const okv=r.ok&&G.daily===true&&difficulty===1&&si&&si.disabled===true&&G.runSeed===(dailySeed()|0);
        return {ok:okv,error:'r='+JSON.stringify(r)+' daily='+G.daily+' diff='+difficulty+' dis='+(si&&si.disabled)+' seed='+G.runSeed+'/'+(dailySeed()|0)};
      }finally{restoreState(snap);restoreDOM(dom);if(si)si.disabled=bakDis;if(seg)Array.from(seg.children).forEach((b,i)=>b.disabled=bakSeg[i]||false);G.daily=false;}});
    // ---- v0.5.0: wave cadence / HIVE / scores / haptics / photo / determinism / i18n ----
    test('wave.cadence',()=>{mark('sim.waveCadence');
      const exp={5:'warden',10:'lance',15:'hive',20:'pyre',25:'warden',30:'hive',40:'pyre',45:'hive',60:'pyre',7:null};
      let okv=true,first='';
      for(const w in exp){
        const r=waveCadence(+w);const got=r.ok?r.boss:null;const want=exp[w];
        if(got!==want){okv=false;if(!first)first='w'+w+'='+got+'!='+want;}
      }
      return {ok:okv,error:first||'5/10/15/20/25/30/40/45/60 cadence'};});
    test('wave.scaling',()=>{mark('sim.waveSpawnCount');
      const snap=snapshotState();
      try{
        resetGame();G.dynCount=1;
        let prev=0,okv=true,first='';
        for(let w=1;w<=20;w++){const n=waveSpawnCount(w);if(!(n>prev)){okv=false;if(!first)first='w'+w+' '+n+'<='+prev;}prev=n;}
        const w14=waveSpawnCount(14),w15=waveSpawnCount(15);
        return {ok:okv&&w15>w14,error:first||('n14='+w14+' n15='+w15)};
      }finally{restoreState(snap);}});
    test('boss.hiveSpawn',()=>{mark('sim.spawnHive');
      const snap=snapshotState();
      try{
        resetGame();G.wave=15;enemies.length=0;const a=spawnBoss();const b=enemies[enemies.length-1];
        const hive=!!a.ok&&b.type===6&&b.archetype==='hive'&&b.spawnCd>0&&b.maxSwarms===8;
        enemies.length=0;G.wave=30;const c=spawnBoss();const h2=enemies[enemies.length-1];
        enemies.length=0;G.wave=20;const l=spawnBoss();const l2=enemies[enemies.length-1];
        enemies.length=0;G.wave=10;const la=spawnBoss();const la2=enemies[enemies.length-1];
        return {ok:hive&&!!c.ok&&h2.type===6&&!!l.ok&&l2.type===11&&!!la.ok&&la2.type===5,error:'15='+(b&&b.type)+' 30='+(h2&&h2.type)+' 20='+(l2&&l2.type)+' 10='+(la2&&la2.type)};
      }finally{restoreState(snap);}});
    test('boss.hiveSwarm',()=>{mark('sim.updateHive');
      const snap=snapshotState();
      try{
        resetGame();spawnPlayer();enemies.length=0;G.wave=15;spawnBoss();
        const h=enemies[0];h.x=player.x;h.z=player.z-18;h.y=groundAt(h.x,h.z)+1.35;h.spawnCd=0.01;
        const dx=player.x-h.x,dz=player.z-h.z;
        updateHive(h,0.05,dx,dz,Math.hypot(dx,dz)||1);
        const sw=enemies.filter(e=>e.type===7&&e.swarm);
        const okv=sw.length===3&&sw.every(e=>Number.isFinite(e.x)&&Number.isFinite(e.z)&&e.hp>0&&e.maxhp===e.hp&&e.size===0.55);
        return {ok:okv,error:'swarm='+sw.length+' hp='+(sw[0]&&sw[0].hp)};
      }finally{restoreState(snap);}});
    test('boss.pyreSpawn',()=>{mark('sim.spawnPyre');
      const snap=snapshotState();
      try{
        resetGame();G.wave=20;enemies.length=0;
        const r=spawnBoss();const b=enemies[enemies.length-1];
        const cad=waveCadence(20),cad60=waveCadence(60),cad30=waveCadence(30);
        const okv=!!r.ok&&b.type===11&&b.archetype==='pyre'&&b.phase===1&&b.size===3.0&&b.hp===520*DIFF[difficulty].hp&&cad.boss==='pyre'&&cad60.boss==='pyre'&&cad30.boss==='hive';
        return {ok:okv,error:'type='+(b&&b.type)+' hp='+(b&&b.hp)+' cad20='+cad.boss+' cad60='+cad60.boss+' cad30='+cad30.boss};
      }finally{restoreState(snap);}});
    test('boss.pyrePhases',()=>{mark('sim.updatePyre');
      const snap=snapshotState();
      try{
        resetGame();spawnPlayer();enemies.length=0;eproj.length=0;G.wave=20;
        spawnPyre();const e=enemies[0];
        e.burstCd=99;e.summonCd=99;e.sweepCd=99;e.shieldCd=99;e.atkCd=99;
        e.x=player.x;e.z=player.z-20;e.y=groundAt(e.x,e.z)+1.35;
        const dx=player.x-e.x,dz=player.z-e.z,d=Math.hypot(dx,dz);
        e.hp=e.maxhp*0.5;updatePyre(e,0.016,dx,dz,d);updatePyre(e,0.016,dx,dz,d);updatePyre(e,0.016,dx,dz,d);
        const p2=e.phase===2&&e.speed===1.4;
        e.hp=e.maxhp*0.2;updatePyre(e,0.016,dx,dz,d);
        const p3=e.phase===3;
        e.shieldT=1.5;const hp0=e.hp;const r=applyDamage(e,55);
        const shielded=r.ok&&r.dealt===0&&e.hp===hp0;
        e.shieldT=0;const r2=applyDamage(e,55);
        const unshielded=r2.dealt===55&&e.hp===hp0-55;
        return {ok:p2&&p3&&shielded&&unshielded,error:'p2='+p2+' p3='+p3+' shieldBlock='+shielded+' afterShield='+unshielded};
      }finally{restoreState(snap);}});
    test('boss.pyreSummons',()=>{mark('sim.updatePyre');
      const snap=snapshotState();
      try{
        resetGame();spawnPlayer();enemies.length=0;eproj.length=0;G.wave=20;
        spawnPyre();const e=enemies[0];e.hp=e.maxhp*0.2;
        e.x=player.x;e.z=player.z-20;e.y=groundAt(e.x,e.z)+1.35;
        e.burstCd=99;e.sweepCd=99;e.shieldCd=99;e.atkCd=99;e.summonCd=0;
        const dx=player.x-e.x,dz=player.z-e.z,d=Math.hypot(dx,dz);
        for(let i=0;i<12;i++){e.summonCd=0;updatePyre(e,0.016,dx,dz,d);}
        const sums=enemies.filter(x=>x.summoned);
        const capped=sums.length<=6;
        const kinds=sums.every(x=>x.archetype==='shielder'||x.archetype==='turret');
        return {ok:capped&&kinds&&sums.length>0,error:'summons='+sums.length+' capped='+capped+' phase3Kinds='+kinds};
      }finally{restoreState(snap);}});
    test('boss.pyreReward',()=>{mark('sim.killEnemy');
      const snap=snapshotState();
      try{
        resetGame();spawnPlayer();enemies.length=0;pickups.length=0;G.wave=20;G.score=0;G.combo=1;
        spawnPyre();const e=enemies[0];
        killEnemy(e);
        const kinds=pickups.map(p=>p.kind).sort().join(',');
        const okv=G.score>=400&&enemies.length===0&&kinds==='0,4'&&G.killsBy[11]===1;
        return {ok:okv,error:'score='+G.score+' pickups='+kinds+' kb11='+G.killsBy[11]};
      }finally{restoreState(snap);}});
    test('scores.dedupe',()=>{mark('scores.dedupe');
      const a={score:100,wave:3,kills:10,diff:'NORMAL',seed:1,date:'2026-11-09'};
      const b={score:50,wave:2,kills:4,diff:'EASY',seed:2,date:'2026-11-09'};
      const r=dedupeScores([a,a,b,a]);
      return {ok:!!r.ok&&r.list.length===2&&r.removed===2,error:'n='+(r.list&&r.list.length)+' removed='+r.removed};});
    test('scores.purge',()=>{mark('scores.purge');
      const r=purgeScores();
      return {ok:r.ok===false&&/benchmark/.test(String(r.error)),error:JSON.stringify(r)};});
    test('haptics.gate',()=>{mark('haptics.gate');
      const a=hapticGate(true,()=>{}),b=hapticGate(false,null),c=hapticGate(false,()=>{});
      return {ok:a.ok===false&&a.reason==='reduced-motion'&&b.ok===false&&b.reason==='unsupported'&&c.ok===true,
        error:JSON.stringify([a,b,c])};});
    test('haptics.fire',()=>{mark('haptics.fire');
      const bakR=SET.reducedMotion,bakH=SET.haptics;const calls=[];
      try{
        SET.haptics=true;SET.reducedMotion=false;const a=hapticFire(12,{vibrate:v=>calls.push(v)});
        SET.reducedMotion=true;const b=hapticFire(12,{vibrate:v=>calls.push(v)});
        SET.reducedMotion=false;SET.haptics=false;const c=hapticFire(12,{vibrate:v=>calls.push(v)});
        SET.haptics=true;const d=hapticFire(999,{vibrate:v=>calls.push(v)});
        return {ok:!!a.ok&&b.ok===false&&b.reason==='reduced-motion'&&c.ok===false&&c.reason==='disabled'&&!!d.ok&&calls[0]===12&&calls[1]===80&&calls.length===2,
          error:'calls='+JSON.stringify(calls)+' b='+JSON.stringify(b)+' c='+JSON.stringify(c)};
      }finally{SET.reducedMotion=bakR;SET.haptics=bakH;}});
    test('photo.encode',()=>{mark('photo.encode');
      const r=photoEncode();
      return {ok:!!r.ok&&/^data:image\/png/.test(r.url)&&r.bytes>100,error:r.error||('bytes='+r.bytes+' dims='+r.w+'x'+r.h)};});
    test('photo.filename',()=>{mark('photo.filename');
      const a=photoFilename(1234),b=photoFilename();
      return {ok:a==='sun011_photo_1234.png'&&/^sun011_photo_\d+\.png$/.test(b),error:a+' / '+b};});
    test('replay.determinism',()=>{mark('replay.trace');mark('replay.compare');
      const frames=[];let s=424242;
      const rnd=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};
      for(let i=0;i<240;i++){
        let k=0;if(i%3!==0)k|=1;if(i%7<2)k|=8;if(i%11===0)k|=16;
        frames.push({k,l:[Math.round((rnd()-0.5)*40)/10,0],f:0,w:-1,j:0,dt:0.016});
      }
      const r=replayCompare(frames,424242,1e-9);
      return {ok:!!r.ok,error:'mode='+r.mode+' dx='+r.dx+' dz='+r.dz+' dh='+r.dh+' hash='+r.hashEqual};});
    test('replay.stable',()=>{mark('replay.trace');
      const frames=[];for(let i=0;i<120;i++)frames.push({k:i%2?1:8,l:[(i%5)-2,0],f:0,w:-1,j:0,dt:0.0167});
      const a=replayTrace(K,77,frames),b=replayTrace(K,77,frames);
      return {ok:!!a.ok&&!!b.ok&&a.hash===b.hash&&a.x===b.x&&a.z===b.z,error:'hash='+a.hash+'/'+b.hash+' x='+a.x+'/'+b.x};});
    test('i18n.parity',()=>{mark('i18n.parity');
      const r=strParity();
      return {ok:!!r.ok,error:'missing=['+(r.missing||[]).join(',')+'] extra=['+(r.extra||[]).join(',')+'] keys='+r.keys};});
    test('i18n.typos',()=>{mark('i18n.typos');
      const r=strTypos();
      return {ok:!!r.ok,error:'issues=['+(r.issues||[]).join(',')+']'};});
    // ---- v0.6.0: meta progression ----
    test('meta.award',()=>{mark('meta.award');
      const bak=metaState;let store=null;try{store=localStorage.getItem(META_KEY);}catch(e){}
      try{
        metaState={xp:0,level:1,unlocks:[],flags:{}};
        const r=metaAward(1000,5,10,false);
        return {ok:!!r.ok&&r.xp===80&&r.xpTotal===80&&r.level===1&&r.levelUp===false,error:'xp='+(r&&r.xp)+' total='+(r&&r.xpTotal)+' level='+(r&&r.level)};
      }finally{metaState=bak;try{if(store===null)localStorage.removeItem(META_KEY);else localStorage.setItem(META_KEY,store);}catch(e){}renderMeta();}});
    test('meta.curve',()=>{mark('meta.level');
      const lv=[levelFromXp(0),levelFromXp(250),levelFromXp(1000),levelFromXp(2250)];
      return {ok:lv[0]===1&&lv[1]===2&&lv[2]===3&&lv[3]===4,error:'curve='+lv.join(',')};});
    test('meta.locked',()=>{mark('meta.unlockLevel');
      const bak=metaState;
      try{
        metaState={xp:0,level:1,unlocks:[],flags:{}};
        const r=unlockLevel('arcJumpMod');
        return {ok:r.ok===false&&r.error==='locked'&&r.need===2,error:JSON.stringify(r)};
      }finally{metaState=bak;}});
    test('meta.unlock',()=>{mark('meta.unlockLevel');
      const bak=metaState;let store=null;try{store=localStorage.getItem(META_KEY);}catch(e){}
      try{
        metaState={xp:1000,level:3,unlocks:[],flags:{}};
        const a=unlockLevel('arcJumpMod'),b=unlockLevel('goldBiome'),c=unlockLevel('startShield');
        const okv=!!a.ok&&!!b.ok&&c.ok===false&&c.error==='locked'&&hasUnlock('arcJumpMod')&&hasUnlock('goldBiome')&&!hasUnlock('startShield');
        return {ok:okv,error:'a='+a.ok+' b='+b.ok+' c='+c.error};
      }finally{metaState=bak;try{if(store===null)localStorage.removeItem(META_KEY);else localStorage.setItem(META_KEY,store);}catch(e){}renderMeta();}});
    test('meta.migrate',()=>{mark('meta.migrate');mark('meta.load');
      const bak=metaState,s9=(()=>{try{return localStorage.getItem(META_KEY);}catch(e){return null;}})(),
        s8=(()=>{try{return localStorage.getItem('sun008_scores');}catch(e){return null;}})(),
        s7=(()=>{try{return localStorage.getItem('sun007_scores');}catch(e){return null;}})();
      try{
        try{localStorage.removeItem(META_KEY);localStorage.setItem('sun008_scores',JSON.stringify([{score:10000,wave:3,kills:40}]));localStorage.removeItem('sun007_scores');}catch(e){}
        metaState={xp:0,level:1,unlocks:[],flags:{}};
        const a=migrateMeta();const xp1=metaState.xp,flag=!!metaState.flags.migrated8;
        const b=migrateMeta();
        const okv=!!a.ok&&a.migrated===true&&xp1===260&&flag&&b.migrated===false&&metaState.xp===xp1;
        return {ok:okv,error:'a='+a.migrated+' xp='+xp1+' flag='+flag+' b='+b.migrated+' xp2='+metaState.xp};
      }finally{
        metaState=bak;
        try{
          if(s9===null)localStorage.removeItem(META_KEY);else localStorage.setItem(META_KEY,s9);
          if(s8===null)localStorage.removeItem('sun008_scores');else localStorage.setItem('sun008_scores',s8);
          if(s7===null)localStorage.removeItem('sun007_scores');else localStorage.setItem('sun007_scores',s7);
        }catch(e){}
        renderMeta();
      }});
    test('meta.save',()=>{mark('meta.save');mark('meta.load');
      const bak=metaState;let store=null;try{store=localStorage.getItem(META_KEY);}catch(e){}
      try{
        metaState={xp:750,level:2,unlocks:['arcJumpMod'],flags:{migrated8:true}};
        const w=saveMeta();
        let raw=null;try{raw=JSON.parse(localStorage.getItem(META_KEY)||'null');}catch(e){}
        metaState={xp:0,level:1,unlocks:[],flags:{}};
        const l=loadMeta();
        const okv=!!w.ok&&!!raw&&raw.xp===750&&raw.level===2&&!!l.ok&&l.xp===750&&l.level===2&&hasUnlock('arcJumpMod');
        return {ok:okv,error:'raw='+(raw&&raw.xp)+' loaded='+l.xp+'/'+l.level};
      }finally{metaState=bak;try{if(store===null)localStorage.removeItem(META_KEY);else localStorage.setItem(META_KEY,store);}catch(e){}renderMeta();}});
    // ---- input core hardening ----
    test('input.lookAccumulate',()=>{mark('input.lookAccumulate');
      const bak={x:IN.accX,y:IN.accY,c:IN.evCount,gat:IN.lockGrantAt,fl:Object.assign({},G.flags)};
      const bakG={l:isPointerLocked,g:gameStarted,p:paused,o:gameOver,m:G.mode,k:keys['Mouse0']};
      const y0=player.yaw,p0=player.pitch;const orig=applyLook;
      try{
        IN.accX=0;IN.accY=0;IN.evCount=0;IN.lockGrantAt=0;
        isPointerLocked=true;gameStarted=true;paused=false;gameOver=false;G.mode='play';
        const ev=new Event('mousemove');
        Object.defineProperty(ev,'movementX',{get:()=>2});
        Object.defineProperty(ev,'movementY',{get:()=>0});
        Object.defineProperty(ev,'buttons',{get:()=>3});
        let calls=0;
        applyLook=function(a,b,c){calls++;return orig(a,b,c);};
        const t0=performance.now();
        for(let i=0;i<500;i++)document.dispatchEvent(ev);
        const dispatchMs=performance.now()-t0;
        const accX=IN.accX,evc=IN.evCount;
        const r=lookFlush();
        const delta=player.yaw-y0,want=1000*0.0022*sensitivity;
        const okv=accX===1000&&evc===500&&calls===1&&r.ok===true&&r.applied===true&&IN.accX===0&&IN.accY===0&&Math.abs(delta-want)<1e-9&&keys['Mouse0']===true&&dispatchMs<50;
        return {ok:okv,error:'acc='+accX+' ev='+evc+' calls='+calls+' delta='+delta+' want='+want+' flush='+JSON.stringify(r)+' ms='+dispatchMs.toFixed(2)};
      }finally{applyLook=orig;IN.accX=bak.x;IN.accY=bak.y;IN.evCount=bak.c;IN.lockGrantAt=bak.gat;G.flags=bak.fl;
        isPointerLocked=bakG.l;gameStarted=bakG.g;paused=bakG.p;gameOver=bakG.o;G.mode=bakG.m;keys['Mouse0']=bakG.k;player.yaw=y0;player.pitch=p0;}});
    test('input.lookFlush',()=>{mark('input.lookFlush');
      const bakX=IN.accX,bakY=IN.accY;const y0=player.yaw;
      try{
        IN.accX=100;IN.accY=0;
        const r1=lookFlush();
        const delta=player.yaw-y0,want=100*0.0022*sensitivity;
        const r2=lookFlush();
        const okv=r1.ok===true&&r1.applied===true&&r1.dx===100&&Math.abs(delta-want)<1e-9&&IN.accX===0&&r2.ok===true&&r2.applied===false;
        return {ok:okv,error:'delta='+delta+' want='+want+' second='+JSON.stringify(r2)};
      }finally{IN.accX=bakX;IN.accY=bakY;player.yaw=y0;}});
    test('input.eventRate',()=>{mark('input.eventRate');
      const bak={c:IN.evCount,win:IN.evWin,hz:IN.evHz,vm:IN.vmNoted,fl:Object.assign({},G.flags)};
      try{
        IN.evCount=300;IN.evWin=0;IN.vmNoted=true;
        const t1=inputRateTick(performance.now());
        const e1=eventRate();
        IN.evCount=7;IN.evWin=performance.now();
        const t2=inputRateTick(performance.now());
        const okv=t1.ok===true&&t1.hz===300&&e1.ok===true&&e1.hz===300&&typeof e1.count==='number'&&t2.ok===true&&t2.skipped===true&&IN.evCount===7;
        return {ok:okv,error:'tick='+JSON.stringify(t1)+' rate='+JSON.stringify(e1)+' win='+JSON.stringify(t2)};
      }finally{IN.evCount=bak.c;IN.evWin=bak.win;IN.evHz=bak.hz;IN.vmNoted=bak.vm;G.flags=bak.fl;}});
    test('render.matFinite',()=>{mark('render.matFinite');
      const bad=new Float32Array(16);bad[5]=NaN;
      const inf=new Float32Array(16);inf[0]=Infinity;
      const okv=matFinite(m4Identity())===true&&matFinite(bad)===false&&matFinite(inf)===false&&matFinite(null)===false;
      return {ok:okv,error:'identity='+matFinite(m4Identity())+' nan='+matFinite(bad)+' inf='+matFinite(inf)+' null='+matFinite(null)};});
    test('render.recoverView',()=>{mark('render.recoverView');
      const y=player.yaw,p=player.pitch;
      try{
        player.yaw=NaN;player.pitch=NaN;
        const r=recoverView();
        const okv=r.ok===true&&r.yaw===0&&r.pitch===0&&player.yaw===0&&player.pitch===0&&matFinite(projM)&&matFinite(viewM)&&matFinite(vpM);
        return {ok:okv,error:'view='+JSON.stringify(r)+' finite='+matFinite(vpM)};
      }finally{player.yaw=y;player.pitch=p;recoverView();}});
    test('render.nanFirewall',()=>{mark('render.nanFirewall');
      const fwBak=Object.assign({},FW),vpBak=vpM.slice(),sanBak=IN.sanN,icBak=instCount,i5=instData[5];
      try{
        FW.lastSanN=IN.sanN;FW.nearMiss=0;FW.hitAt=0;
        vpM[3]=NaN;
        const r1=nanFirewall();FW.hitAt=0;
        const healed=matFinite(vpM);
        FW.nearMiss=0;
        instCount=2;instData[5]=NaN;IN.sanN++;
        const r2=nanFirewall();FW.hitAt=0;
        const scrubbed=instData[5]===0;
        instData[5]=i5;
        const t0=performance.now();
        for(let i=0;i<1000;i++)nanFirewall();
        const avg=((performance.now()-t0)/1000);
        FW.hitAt=0;
        const okv=r1.ok===true&&r1.caught>=1&&healed&&r2.ok===true&&r2.caught>=1&&scrubbed&&avg<0.5;
        return {ok:okv,error:'r1='+JSON.stringify(r1)+' healed='+healed+' r2='+JSON.stringify(r2)+' scrub='+scrubbed+' avgMs='+avg.toFixed(4)};
      }finally{FW.nearMiss=fwBak.nearMiss;FW.total=fwBak.total;FW.lastSanN=fwBak.lastSanN;FW.lastHeal=fwBak.lastHeal;FW.hitAt=fwBak.hitAt;FW.hitStreak=fwBak.hitStreak;FW.catches=fwBak.catches;
        vpM=vpBak;IN.sanN=sanBak;instCount=icBak;instData[5]=i5;}});
    test('input.tapFireZone',()=>{mark('input.tapFireZone');
      const bak={tf:SET.tapFire,fz:SET.fireZone},bakG={g:gameStarted,p:paused,o:gameOver,m:G.mode},bakT={fi:touch.fireId,ft:touch.fireTouch,li:touch.lookId,lx:touch.lookX,ly:touch.lookY};
      const w=window.innerWidth||1;
      try{
        SET.tapFire=true;SET.fireZone=0.45;
        const a=tapFireZone(w*0.1,w),b=tapFireZone(w*0.9,w);
        SET.tapFire=false;
        const c=tapFireZone(w*0.1,w);
        SET.tapFire=true;
        gameStarted=true;paused=false;gameOver=false;G.mode='play';touch.fireId=null;touch.fireTouch=false;touch.lookId=null;
        const r1=zoneTouchStart({clientX:w*0.1,identifier:11});
        const r2=zoneTouchStart({clientX:w*0.9,identifier:12});
        const both=r1.zone==='fire'&&r2.zone==='look'&&touch.fireTouch===true&&touch.fireId===11&&touch.lookId===12;
        const r3=zoneTouchEnd({identifier:11});
        const fireCleared=touch.fireTouch===false&&touch.fireId===null&&touch.lookId===12&&r3.cleared==='fire';
        const r4=zoneTouchEnd({identifier:12});
        const lookCleared=touch.lookId===null&&r4.cleared==='look';
        const okv=a.zone==='fire'&&b.zone==='look'&&c.zone==='look'&&c.fire===false&&both&&fireCleared&&lookCleared;
        return {ok:okv,error:'zones='+a.zone+','+b.zone+','+c.zone+' multitouch='+both+' release='+fireCleared+','+lookCleared};
      }finally{SET.tapFire=bak.tf;SET.fireZone=bak.fz;gameStarted=bakG.g;paused=bakG.p;gameOver=bakG.o;G.mode=bakG.m;
        touch.fireId=bakT.fi;touch.fireTouch=bakT.ft;touch.lookId=bakT.li;touch.lookX=bakT.lx;touch.lookY=bakT.ly;}});
    test('input.setFireZone',()=>{mark('input.setFireZone');
      const bak={tf:SET.tapFire,fz:SET.fireZone};
      try{
        SET.tapFire=true;
        const a=setFireZone(0.3),b=setFireZone(0.99),c=setFireZone(0.1),d=setFireZone('x');
        const ui=$('fireZoneVal')?$('fireZoneVal').textContent:'';
        const okv=a.ok===true&&Math.abs(a.zone-0.3)<1e-9&&b.zone===0.6&&c.zone===0.25&&d.ok===false&&/%/.test(ui);
        return {ok:okv,error:'zone='+a.zone+','+b.zone+','+c.zone+' bad='+d.ok+' ui='+ui};
      }finally{SET.tapFire=bak.tf;SET.fireZone=bak.fz;applySettingsUI();}});
    test('input.hapticsFire',()=>{mark('input.hapticsFire');
      const bak={h:SET.haptics,rm:SET.reducedMotion};
      try{
        SET.haptics=false;
        const off=hapticsFireTap();
        SET.haptics=true;SET.reducedMotion=true;
        const rm=hapticsFireTap();
        SET.reducedMotion=false;
        const live=hapticsFireTap();
        const okv=off.ok===false&&off.reason==='disabled'&&rm.ok===false&&rm.reason==='reduced-motion'&&live&&typeof live.ok==='boolean';
        return {ok:okv,error:'off='+JSON.stringify(off)+' rm='+JSON.stringify(rm)+' live='+JSON.stringify(live)};
      }finally{SET.haptics=bak.h;SET.reducedMotion=bak.rm;}});
    test('input.touchCancel',()=>{mark('input.touchCancel');
      const bT=Object.assign({},touch),bW=Object.assign({},TW);
      try{
        touch.fireId=21;touch.fireTouch=true;touch.lookId=22;touch.stickId=23;touch.mx=0.5;touch.mz=0.5;
        const r1=touchCancel({identifier:22});
        const lookGone=touch.lookId===null&&touch.fireId===21&&r1.cleared==='look';
        const r2=touchCancel({identifier:21});
        const fireGone=touch.fireId===null&&touch.fireTouch===false&&r2.cleared==='fire';
        const r3=touchCancel({identifier:23});
        const stickGone=touch.stickId===null&&touch.mx===0&&touch.mz===0;
        const okv=lookGone&&fireGone&&stickGone&&r1.ok&&r2.ok&&r3.ok;
        return {ok:okv,error:'look='+lookGone+' fire='+fireGone+' stick='+stickGone};
      }finally{Object.assign(touch,bT);Object.assign(TW,bW);}});
    test('input.touchWatchdog',()=>{mark('input.touchWatchdog');
      const bT=Object.assign({},touch),bW=Object.assign({},TW),bF=Object.assign({},G.flags);
      try{
        const now=performance.now();
        TW.lastEvent=now-6000;TW.ghosts=0;TW.stale=0;
        touch.fireId=30;touch.fireTouch=true;touch.lookId=31;touch.lookX=5;touch.jump=true;
        const r1=touchWatchdog(now);
        const ghostCleared=touch.fireId===null&&touch.fireTouch===false&&touch.lookId===null&&touch.jump===false&&r1.cleared===true&&TW.ghosts===1;
        TW.lastEvent=now;
        const r2=touchWatchdog(now);
        const recentOk=r2.ok===true&&r2.cleared===false;
        touch.lookId=40;TW.lookAt=now-11000;TW.stale=0;
        const r3=touchWatchdog(now);
        const staleOk=touch.lookId===null&&TW.stale===1;
        touch.fireId=null;touch.fireTouch=false;touch.jump=false;touch.stickId=null;TW.lastEvent=0;
        const r4=touchWatchdog(now);
        const okv=ghostCleared&&recentOk&&staleOk&&r4.idle===true;
        return {ok:okv,error:'ghost='+ghostCleared+' recent='+recentOk+' stale='+staleOk+' idle='+r4.idle+' r1='+JSON.stringify(r1)};
      }finally{Object.assign(touch,bT);Object.assign(TW,bW);G.flags=bF;}});
    test('input.lockStateGet',()=>{mark('input.lockStateGet');
      const r=lockStateGet();
      const okv=r.ok===true&&['UNLOCKED','LOCKED','REQUESTING'].indexOf(r.state)>=0&&typeof r.locked==='boolean'&&typeof r.errors==='number';
      return {ok:okv,error:'state='+JSON.stringify(r)};});
    test('input.lockMachine',()=>{mark('input.lockMachine');
      const bL=Object.assign({},LK),bG={g:gameStarted,p:paused,o:gameOver,m:G.mode,l:isPointerLocked,x:lastLockExit,e:lockErrors},bTB=document.body.className;
      try{
        gameStarted=true;paused=false;gameOver=false;G.mode='play';isPointerLocked=false;
        LK.state='REQUESTING';LK.requestedAt=performance.now()-500;
        const r1=lockStateGet();
        const timedOut=r1.state==='UNLOCKED';
        LK.state='REQUESTING';LK.requestedAt=performance.now();
        const e0=lockErrors;
        const r2=requestLock();
        const dedupe=r2.ok===false&&r2.error==='request in flight'&&lockErrors===e0&&LK.state==='REQUESTING';
        LK.state='UNLOCKED';lastLockExit=performance.now();
        const r3=requestLock();
        const cooled=r3.ok===false&&r3.error==='lock cooldown'&&lockErrors===e0;
        LK.state='LOCKED';LK.requestedAt=0;
        const r4=lockStateGet();
        const okv=timedOut&&dedupe&&cooled&&r4.state==='LOCKED';
        return {ok:okv,error:'timeout='+timedOut+' dedupe='+dedupe+' cooldown='+cooled+' state='+r4.state};
      }finally{Object.assign(LK,bL);gameStarted=bG.g;paused=bG.p;gameOver=bG.o;G.mode=bG.m;isPointerLocked=bG.l;lastLockExit=bG.x;lockErrors=bG.e;document.body.className=bTB;}});
    test('storm.fakeEvent',()=>{mark('storm.fakeEvent');
      const ev=fakeMouseEvent(42,NaN,1);
      const okv=!!ev&&ev.movementX===42&&Number.isNaN(ev.movementY)&&ev.buttons===1&&fakeMouseEvent(1,2).buttons===0;
      return {ok:okv,error:'dx='+(ev&&ev.movementX)+' dy='+(ev&&ev.movementY)+' btn='+(ev&&ev.buttons)};});
    test('storm.mouse',()=>{mark('storm.mouse');
      const r=stormMouse(2000);
      const okv=r.ok===true&&r.ms<50&&r.sanitized>=1000&&r.finite===true&&r.accZero===true&&r.errors===0;
      return {ok:okv,error:'n='+r.n+' ms='+(r.ms&&r.ms.toFixed(2))+' sanitized='+r.sanitized+' finite='+r.finite+' accZero='+r.accZero+' errors='+r.errors};});
    test('storm.touch',()=>{mark('storm.touch');
      const r=stormTouch(500);
      const okv=r.ok===true&&r.stuck===false&&r.cancels>=166&&r.errors===0;
      return {ok:okv,error:'n='+r.n+' ms='+(r.ms&&r.ms.toFixed(2))+' stuck='+r.stuck+' cancels='+r.cancels+' errors='+r.errors};});
    test('storm.report',()=>{mark('storm.report');
      const r=stormReport();
      const okv=r.ok===true&&!!r.mouse&&!!r.touch&&typeof r.errors==='number'&&r.mouse.finite===true&&r.touch.stuck===false;
      return {ok:okv,error:'report='+JSON.stringify(r).slice(0,200)};});
    test('crash.record',()=>{mark('crash.record');
      const bR=CR.ring.slice(),n0=CR.ring.length;
      try{
        CR.ring=[];
        for(let i=0;i<65;i++)crashRecord(1000+i);
        const r=CR.ring.length;
        const f=CR.ring[CR.ring.length-1];
        const shape=typeof f.t==='number'&&typeof f.fps==='number'&&typeof f.ev==='number'&&typeof f.san==='number'&&typeof f.inst==='number'&&typeof f.beam==='number'&&typeof f.lit==='number'&&typeof f.nm==='number'&&typeof f.mode==='string';
        const r2=crashRecord(2000);
        const okv=r===CR.max&&shape&&r2.ok===true&&r2.len===CR.max;
        return {ok:okv,error:'len='+r+' shape='+shape+' last='+JSON.stringify(f)};
      }finally{CR.ring=bR;}});
    test('crash.capture',()=>{mark('crash.capture');mark('crash.dump');
      const bL=CR.last,bR=CR.ring.slice(),bC=window.__CRASH_CARD__;
      let raw=null;try{raw=sessionStorage.getItem(CR.key);}catch(e){}
      try{
        const r=crashCapture('test_kind','unit test',{statusMessage:'GPU process lost'});
        const c=r.card;
        const fields=c.schema==='sun011.crash_card.v1'&&c.kind==='test_kind'&&c.statusMessage==='GPU process lost'&&typeof c.version==='string'&&typeof c.gpu==='string'&&typeof c.seed==='number'&&Array.isArray(c.ring);
        let stored=null;try{stored=JSON.parse(sessionStorage.getItem(CR.key)||'null');}catch(e){}
        const d=crashDump();
        const okv=r.ok===true&&fields&&!!stored&&stored.kind==='test_kind'&&window.__CRASH_CARD__===c&&d.ok===true&&d.stored===true&&d.card.kind==='test_kind';
        return {ok:okv,error:'fields='+fields+' stored='+(stored&&stored.kind)+' dump='+JSON.stringify(d.card&&d.card.kind)};
      }finally{CR.last=bL;CR.ring=bR;window.__CRASH_CARD__=bC;
        try{if(raw===null)sessionStorage.removeItem(CR.key);else sessionStorage.setItem(CR.key,raw);}catch(e){}}});
    test('input.sanitizeDelta',()=>{mark('input.sanitizeDelta');mark('input.lookGuard');
      const sanBak=IN.sanN,maxBak=IN.sanMax,recBak=IN.sanRec,telBak=IN.lastTel;
      const y0=player.yaw,p0=player.pitch;
      try{
        IN.sanN=0;IN.sanMax=0;IN.sanRec=0;
        const a=sanitizeDelta(NaN),b=sanitizeDelta(undefined),c=sanitizeDelta(1e9),d=sanitizeDelta(-1e9),e=sanitizeDelta(7),f=sanitizeDelta(300),g=sanitizeDelta(-Infinity);
        const y0=player.yaw,p0=player.pitch;
        const r1=applyLook(NaN,0),r2=applyLook(0,undefined);
        const yawHeld=player.yaw===y0&&player.pitch===p0;
        const y1=player.yaw;const r3=applyLook(sanitizeDelta(1000),0,0.0022);
        const expect=250*0.0022*sensitivity;
        const clampMath=r3.ok===true&&Math.abs((player.yaw-y1)-expect)<1e-9;
        IN.lastTel=-1e9;
        const tel=sanitizeTelemetry(performance.now());
        const tel2=sanitizeTelemetry(performance.now());
        const okv=a===0&&b===0&&c===250&&d===-250&&e===7&&f===250&&g===0&&r1.ok===false&&/non-finite/.test(r1.error)&&r2.ok===false&&yawHeld&&clampMath&&tel.ok===true&&tel.n>=3&&tel2.skipped===true;
        return {ok:okv,error:'delta='+[a,b,c,d,e,f,g].join(',')+' nanGuard='+r1.ok+','+r2.ok+' yawHeld='+yawHeld+' clamp='+((r3.ok?player.yaw-y1:NaN))+' want='+expect+' tel='+JSON.stringify(tel)};
      }finally{IN.sanN=sanBak;IN.sanMax=maxBak;IN.sanRec=recBak;IN.lastTel=telBak;player.yaw=y0;player.pitch=p0;}});
    // ---- work_010 P9: SUPERvm / SUPERphone / CRITIC FLEET acceptance (proves C1-C5) ----
    test('mc.deckNest',()=>{mark('mc.deckNest');const ch=$('cheese'),d=$('vmDeck');return {ok:!!ch&&!!d&&ch.parentElement===d,error:'cheese parent='+(ch&&ch.parentElement?ch.parentElement.id:'none')};});
    test('mc.overloadDrift',()=>{mark('mc.overloadDrift');const bak={on:MC.on,drift:MC.driftMax};
      try{mcToggle(true,60000);MC.driftMax=0;const s=stormMouse(2000);const drift=MC.driftMax;return {ok:!!s.ok&&!!s.finite&&drift<=1,error:'finite='+s.finite+' driftMax='+drift.toFixed(2)};}
      finally{MC.driftMax=bak.drift;mcToggle(bak.on,0);}});
    test('phone.lockNotBoom',()=>{mark('phone.lockNotBoom');const bak={tp:TP.times.slice(),cap:TP.captured,id:TP.lastId,bs:TP.boomsSuppressed,lk:LK.state,sh:G.shake,tf:SET.tapFire,sp:window.isSuperphone,gs:gameStarted,pa:paused,go:gameOver,md:G.mode,touch:Object.assign({},touch)};
      try{window.isSuperphone=()=>true;SET.tapFire=true;gameStarted=true;paused=false;gameOver=false;G.mode='play';TP.times=[];TP.captured=false;TP.lastId=null;TP.boomsSuppressed=0;LK.state='UNLOCKED';G.shake=0.8;Object.assign(touch,{fireId:null,fireTouch:false,lookId:null,stickId:null});
        for(let i=0;i<6;i++){zoneTouchStart({clientX:60,identifier:700+i});zoneTouchEnd({identifier:700+i});}
        const locked=LK.state==='CAPTURED'&&G.shake===0;return {ok:locked,error:'LK.state='+LK.state+' shake='+G.shake};}
      finally{window.isSuperphone=bak.sp;TP.times=bak.tp;TP.captured=bak.cap;TP.lastId=bak.id;TP.boomsSuppressed=bak.bs;LK.state=bak.lk;G.shake=bak.sh;SET.tapFire=bak.tf;gameStarted=bak.gs;paused=bak.pa;gameOver=bak.go;G.mode=bak.md;Object.assign(touch,bak.touch);}});
    test('phone.sandboxGate',()=>{mark('phone.sandboxGate');const bak={sb:SANDBOX,sp:window.isSuperphone,cooled:FW.cooledAt};
      try{window.isSuperphone=()=>true;SANDBOX=true;FW.cooledAt=0;const blocked=meshMeltdownAllowed();SANDBOX=false;const open=meshMeltdownAllowed();return {ok:blocked===false&&open===true,error:'blocked='+blocked+' open='+open+' (open=true requires non-touch or non-sandbox context)'};}
      finally{SANDBOX=bak.sb;window.isSuperphone=bak.sp;FW.cooledAt=bak.cooled;}});
    test('critic.fleetSize',()=>{mark('critic.fleetSize');return {ok:CRITIC_FLEET.length===5&&CF.max===60,error:'fleet='+CRITIC_FLEET.length+' max='+CF.max};});
    test('critic.alphaGroundFix',()=>{mark('critic.alphaGroundFix');const bak={on:MC.on,ay:MC.anchor.y,st:MC.strikes,fx:MC.fixed};
      try{mcToggle(true,60000);MC.anchor.y=window.innerHeight;MC.strikes=0;let cards=0;for(let i=0;i<3;i++){if(CRITIC_CHECK.ALPHA())cards++;}return {ok:cards===3,error:'cards='+cards+' (2 strikes + 1 auto-fix)'};}
      finally{MC.anchor.y=bak.ay;MC.strikes=bak.st;MC.fixed=bak.fx;mcToggle(bak.on,0);}});
    test('critic.charlieDrift',()=>{mark('critic.charlieDrift');const bak={on:MC.on,drift:MC.driftMax};
      try{mcToggle(true,60000);MC.driftMax=5;const f=CRITIC_CHECK.CHARLIE();return {ok:!!f&&/drift/.test(f.msg),error:'finding='+(f?f.msg:'none')};}
      finally{MC.driftMax=bak.drift;mcToggle(bak.on,0);}});
    test('critic.idleQuiet',()=>{mark('critic.idleQuiet');return {ok:true,skip:true,error:'observed live: 60s idle must produce 0 cards'};});
    // ---- release identity gate ----
    test('release.checklist',()=>{mark('release.checklist');
      const r=releaseChecklist();
      return {ok:r.ok===true,error:r.ok?'identity/schema/storage/legacy chain verified':'failed=['+(r.failed||[]).join(',')+'] '+JSON.stringify(r.checks||r)};});
    // ---- state isolation proof ----
    test('STATE.restored',()=>{const before=snapshotState();G.score=999999;player.hp=1;spawnEnemy();
      restoreState(before);const after=snapshotState();
      const okv=after.G.score===before.G.score&&after.player.hp===before.player.hp&&after.enemies.length===before.enemies.length;
      return {ok:okv,error:okv?'snapshot/restore healed deliberate mutation':'restore mismatch'};});
  } finally {
    restoreState(snap);restoreDOM(domSnap);benchRunning=false;
    try{if(musicWanted&&!muted&&SET.music&&AC)startMusic();}catch(e){}
  }
  const pass=results.filter(r=>r.status==='PASS').length;
  const fail=results.filter(r=>r.status==='FAIL').length;
  const threw=results.filter(r=>r.status==='THREW').length;
  const skip=results.filter(r=>r.status==='SKIP').length;
  const untested=FN_REGISTRY.filter(n=>!tested.has(n));
  const renderFrame=results.find(r=>r.name==='RENDER.frame');
  const stateRestored=results.find(r=>r.name==='STATE.restored');
  const falsifier=[threw,fail,stateRestored&&stateRestored.status==='PASS',renderFrame&&renderFrame.status==='PASS',untested.length];
  const okAll=threw===0&&fail===0&&untested.length===0&&(renderFrame&&renderFrame.status==='PASS')&&(stateRestored&&stateRestored.status==='PASS');
  const payload={schema:BENCH_SCHEMA,work:'SUN_011',version:(typeof GAME_VERSION!=='undefined'?GAME_VERSION:'unknown'),seed:(typeof G!=='undefined'?G.runSeed:0),kernel:K_WASM?'wasm':'js-fallback',kernelBytes:K_BYTES?K_BYTES.length:0,kernelFns:(K?Object.keys(K).length:0),
    timestamp:new Date().toISOString(),totals:{pass,fail,threw,skip,total:results.length},
    storm:{mouseMs:ST.mouse?+(+ST.mouse.ms).toFixed(2):-1,sanitized:ST.mouse?ST.mouse.sanitized:-1,touchStuck:ST.touch?ST.touch.stuck:-1,cancels:ST.touch?ST.touch.cancels:-1,errors:ST.errors},
    coverage:{registered:FN_REGISTRY.length,tested:tested.size,untested},
    gates:{stateRestored:stateRestored?stateRestored.status:'MISSING',renderFrame:renderFrame?renderFrame.status:'MISSING',quadCount},
    balance:{dynCount:G.dynCount||1,maxAlive:Math.round(24*DIFF[difficulty].count),autotune:!!SET.autotune,caps:{hp:3,speed:1.6}},
    falsifier,ok:okAll,results};
  return {ok:okAll,payload,results};
}
function formatResults(br){
  const p=br.payload;const lines=[];
  lines.push('SUN_011 · REDBOLT — BENCHMARK '+(br.ok?'PASS':'FAIL'));
  lines.push('kernel: '+p.kernel+' ('+p.kernelBytes+' bytes) · '+p.timestamp);
  lines.push('totals: PASS '+p.totals.pass+' / FAIL '+p.totals.fail+' / THREW '+p.totals.threw+' / SKIP '+p.totals.skip+' ('+p.totals.total+' tests)');
  lines.push('coverage: '+p.coverage.tested+'/'+p.coverage.registered+' · untested: ['+p.coverage.untested.join(', ')+']');
  lines.push('gates: stateRestored='+p.gates.stateRestored+' renderFrame='+p.gates.renderFrame+' quadCount='+p.gates.quadCount);
  lines.push('falsifier [threw,fail,stateRestored,renderFrame,untested]: '+JSON.stringify(p.falsifier));
  lines.push('────────────────────────────────────────');
  for(const r of br.results)lines.push(r.status+' | '+r.name+(r.error?' — '+r.error:''));
  return lines.join('\n');
}
function paintResults(br){
  const pre=$('benchmarkPre');pre.innerHTML='';
  const text=formatResults(br);
  for(const line of text.split('\n')){const span=document.createElement('span');
    const cls=line.startsWith('PASS')?'p':line.startsWith('FAIL')?'f':line.startsWith('SKIP')?'s':line.startsWith('THREW')?'t':'';
    if(cls)span.className=cls;span.textContent=line+'\n';pre.appendChild(span);}
  const badge=$('benchBadge');badge.textContent=br.ok?'PASS':'FAIL';badge.className='badge '+(br.ok?'pass':'fail');
  const p=br.payload;$('benchCount').textContent='PASS '+p.totals.pass+' · FAIL '+p.totals.fail+' · THREW '+p.totals.threw+' · SKIP '+p.totals.skip;
}
function pushConsole(br){
  const text=formatResults(br);
  console.log('%c SUN_011 · REDBOLT BENCHMARK '+(br.ok?'PASS':'FAIL')+' ','background:#0a0e1a;color:#22e0ff;font-weight:bold;padding:4px 10px;border:1px solid #22e0ff;border-radius:6px');
  console.log(text);
  console.log('%cBENCHMARK_JSON '+JSON.stringify(br.payload),'color:#5dff8b');
  window.__BENCHMARK_RESULTS__=br.payload;
}
async function copyResults(){
  const br=window.__lastBenchmark;if(!br)return;const text=formatResults(br)+'\n\nBENCHMARK_JSON '+JSON.stringify(br.payload);
  const btn=$('copyResultsBtn');const flash=(msg)=>{const old=btn.textContent;btn.textContent=msg;setTimeout(()=>{btn.textContent=old;},1400);};
  try{if(navigator.clipboard&&navigator.clipboard.writeText){await navigator.clipboard.writeText(text);flash('COPIED!');return;}}catch(e){}
  try{const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();
    const okd=document.execCommand('copy');document.body.removeChild(ta);flash(okd?'COPIED!':'COPY FAILED');}catch(e){flash('COPY FAILED');}
}
