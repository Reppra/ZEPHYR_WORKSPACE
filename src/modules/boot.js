function boot(){
  initKernel();
  if(!initWebGL()){clearTimeout($('errbox')._t);$('overlayBtn').disabled=true;$('benchmarkBtn').disabled=true;return;}
  resizeGL();genArena();buildArenaMesh();spawnPlayer();
  bindInput();bindUI();applySettingsUI();applyQuality();
  setLang(resolveLang());applyA11y();
  try{const s=seedFromURL();if(s&&$('seedInput'))$('seedInput').value=s;}catch(e){}
  bootReady=true;
  renderScores();renderDaily();renderMeta();
  try{sessionStorage.removeItem('sun011_ctx_reload');sessionStorage.removeItem('sun010_ctx_reload');sessionStorage.removeItem('sun009_ctx_reload');sessionStorage.removeItem('sun008_ctx_reload');sessionStorage.removeItem('sun007_ctx_reload');}catch(e){}
  setTimeout(()=>{try{const d=crashDump();if(d.ok&&d.card)showErr('PREVIOUS CRASH CAPTURED ('+d.card.kind+') — run __SUN.downloadCrashCard()');}catch(e){}},1000);
  if(DEBUG){
    window.__fps={K,gl,heights,ARENA_W,ARENA_D,player,G};
    window.__SUN={
      get gameStarted(){return gameStarted;},get gameOver(){return gameOver;},get bootReady(){return bootReady;},
      get quadCount(){return quadCount;},get isPointerLocked(){return isPointerLocked;},get lockErrors(){return lockErrors;},
      get benchmarkDone(){return benchmarkDone;},get benchmarkPass(){return benchmarkPass;},get kernelWasm(){return K_WASM;},
      get lowGpu(){return LOW_GPU;},get gpuRenderer(){return GPU_RENDERER;},get renderScale(){return renderScale;},
      get contextLost(){return contextLost;},get bufferPixels(){return W*H;},get frameEMA(){return frameEMA;},get beamCount(){return beamCount;},
      get crashCard(){return CR.last;},crashCapture,crashRecord,crashDump,downloadCrashCard,
      forceCrashCard:kind=>{crashRecord();return crashCapture(kind||'manual','forced');},
      drillContextLoss:()=>{try{const ext=gl&&gl.getExtension('WEBGL_lose_context');if(!ext)return {ok:false,error:'no WEBGL_lose_context'};ext.loseContext();setTimeout(()=>{try{ext.restoreContext();}catch(e){}},800);return {ok:true};}catch(e){return {ok:false,error:String(e&&e.message||e)};}},
      stormMouse,stormTouch,stormReport,
      get inputStats(){return {san:IN.sanN,sanMax:IN.sanMax,evHz:IN.evHz,lock:LK.state,ghosts:TW.ghosts,nearMiss:FW.nearMiss};},
      startGame,requestLock,runBenchmark,togglePause,toMenu,restoreGraphics,
      spawnEnemyType:(arch,x,z)=>{try{const r=spawnEnemyArch(arch,x,z);return r.ok?{ok:true,arch:r.arch,type:r.type}:r;}catch(e){return {ok:false,error:String(e&&e.message||e)};}},
      spawnPyre:(ph)=>{try{const r=spawnPyre();if(!r.ok)return r;const e=enemies[enemies.length-1];const p=clamp(ph|0||1,1,3);e.hp=e.maxhp*(p===1?1:p===2?0.5:0.2);e.phase=p;if(p>=2)e.speed=1.4;return {ok:true,phase:p,type:11};}catch(e){return {ok:false,error:String(e&&e.message||e)};}},
      get enemies(){return enemies;},get eproj(){return eproj;},
      gatherLights,throttleLights,forceFrameEMA:v=>{frameEMA=+v||16;return {ok:true,frameEMA:frameEMA};},
      get lightCount(){return lightCount;},get projLightCap(){return projLightCap;},get glowCount(){return glowCount;},
      get rerollUsed(){return !!(G.flags&&G.flags.rerollUsed);},
      meta:{state:()=>({xp:metaState.xp,level:metaState.level,unlocks:metaState.unlocks.slice(),flags:Object.assign({},metaState.flags)}),award:metaAward,level:levelFromXp,save:saveMeta,migrate:migrateMeta,unlock:unlockLevel,reroll:rerollPerks,render:renderMeta},
      daily:{seed:()=>dailySeed(),seedAt:s=>{const r=dailySeedAt(s);return r.ok?r.seed:NaN;},code:makeShareCode,verify:verifyDaily,best:()=>dailyBest()}
    };
  }
  running=true;lastT=performance.now();requestAnimationFrame(loop);
  console.log('%c SUN_011 · REDBOLT ','background:#0a0e1a;color:#ff3b30;font-weight:bold;padding:4px 10px;border:1px solid #ff3b30;border-radius:6px',
    'booted · kernel='+(K_WASM?'WASM':'JS-fallback')+' · quads='+quadCount+' · gpu='+(GPU_RENDERER||'unknown')+' · lowGpu='+LOW_GPU+' · buffer='+W+'x'+H+' · debug='+DEBUG);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
