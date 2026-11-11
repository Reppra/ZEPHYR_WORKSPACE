/* ============================ MAIN LOOP ============================ */
let lastT=0,running=false;
function perfLog(){console.warn('[perf] scale '+renderScale.toFixed(2)+' fps~'+Math.round(1000/Math.max(1,frameEMA))+' budget '+PERF_BUDGET.frameMs+'ms');}
function applyQuality(){
  try{
    if(SET.quality==='low')renderScale=PERF_BUDGET.scaleMin;
    else if(SET.quality==='high')renderScale=1;
    else return {ok:true,scale:renderScale};
    adaptCooldown=1.0;resizeGL();
    return {ok:true,scale:renderScale};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function adaptQuality(rawDt,dt,active){
  if(rawDt>0&&rawDt<0.25)frameEMA+=(rawDt*1000-frameEMA)*0.1;
  if(!active)return;
  const lt=throttleLights();
  if(lt.ok&&lt.throttled){adaptCooldown=1.0;return;}
  if(adaptCooldown>0){adaptCooldown-=dt;return;}
  if(frameEMA>PERF_BUDGET.slowMs&&renderScale>PERF_BUDGET.scaleMin){renderScale=Math.max(PERF_BUDGET.scaleMin,renderScale-0.1);adaptCooldown=1.0;resizeGL();perfLog();}
  else if(frameEMA<PERF_BUDGET.fastMs&&renderScale<1){renderScale=Math.min(1,renderScale+0.05);adaptCooldown=1.5;resizeGL();perfLog();}
}
function loop(t){
  if(!running)return;
  requestAnimationFrame(loop);
  if(contextLost){lastT=t;return;}
  const rawDt=(t-lastT)/1000;lastT=t;
  const dt=Math.min(0.05,rawDt||0.016);
  const active=gameStarted&&!paused&&!gameOver&&G.mode!=='playback';
  inputRateTick(t);
  touchWatchdog(t);
  phoneReleaseIfIdle();
  mcDeckFrame(t);
  if(active)updateMascot(dt);
  if(gameStarted)crashRecord(t);
  if(active)lookFlush();
  adaptQuality(rawDt,dt,active&&document.visibilityState==='visible'&&SET.quality==='auto');
  tickMusicDirector();
  if(active)updateGame(dt);
  else if(G.mode==='playback'){stepPlayback();if(PB&&PB.active&&!PB.done&&(PB.i>=PB.frames.length||gameOver))endPlayback();}
  else if(G.mode==='menu')player.yaw+=dt*0.08;
  if(active||G.mode==='playback')drawScene();
  else{idleAcc+=dt;if(idleAcc>=1/30){idleAcc=0;drawScene();}}
  if(gameStarted)updateHUD(dt);
  mmAcc+=dt;if(mmAcc>=0.1){mmAcc=0;drawMinimap();}
}
