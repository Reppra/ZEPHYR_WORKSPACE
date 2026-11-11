/* ============================ STATE MACHINE ============================ */
function startGame(opts){
  if(!bootReady){showErr('Cannot start: boot not ready');return {ok:false,error:'boot not ready'};}
  opts=opts||{};
  G.daily=!!opts.daily;
  const seg=$('diffSeg');
  if(G.daily){
    difficulty=1;
    if($('seedInput')){$('seedInput').value=String(dailySeed());$('seedInput').disabled=true;}
    if(seg)for(const b of seg.children){b.disabled=true;b.classList.toggle('on',+b.dataset.d===1);}
  }else{
    if($('seedInput'))$('seedInput').disabled=false;
    if(seg)for(const b of seg.children){b.disabled=false;b.classList.toggle('on',+b.dataset.d===difficulty);}
  }
  ensureAudio();if(AC&&AC.state==='suspended')AC.resume();
  startMusicDirector();duckMusic(false);
  const raw=$('seedInput')?String($('seedInput').value||'').trim():'';
  G.runSeed=raw?parseSeed(raw):randomRunSeed();
  if($('seedInput'))$('seedInput').value=String(G.runSeed);
  resetGame();gameOver=false;paused=false;gameStarted=true;G.mode='playing';
  replayLog={v:2,seed:G.runSeed|0,lang:LANG,diff:difficulty,frames:[],truncated:false};replayCount=0;replayLook=[0,0];replayLastWi=-1;
  PB=null;$('pbBar').classList.add('hidden');$('pbEnd').classList.add('hidden');
  const bio=biomeFor(G.runSeed|0);showBanner(biomeDef(bio).name,t('sector')+' '+(bio+1)+'/3');
  $('overlay').classList.add('hidden');$('pauseOverlay').classList.add('hidden');$('gameOverOverlay').classList.add('hidden');
  $('hud').classList.add('on');$('crosshair').classList.add('on');$('pauseBtn').style.display='inline-flex';
  if($('photoBtn'))$('photoBtn').style.display='inline-flex';
  if('ontouchstart' in window||navigator.maxTouchPoints>0)$('touch').classList.add('on');
  $('bgfx').style.display='none';$('gridfx').style.display='none';
  renderOnce();requestLock();
  return {ok:true,error:null};
}
function togglePause(){
  if(!gameStarted||gameOver||G.mode==='playback')return;
  if(G.perkPending)return;
  paused=!paused;duckMusic(paused);
  if(paused){G.mode='paused';$('pauseOverlay').classList.remove('hidden');if(document.pointerLockElement)document.exitPointerLock();clearInput();}
  else{G.mode='playing';$('pauseOverlay').classList.add('hidden');requestLock();}
}
function toMenu(){
  gameStarted=false;gameOver=false;paused=false;G.mode='menu';clearInput();
  if(PB){difficulty=PB.bakDiff;PB=null;}
  $('pbBar').classList.add('hidden');$('pbEnd').classList.add('hidden');
  if($('watchBtn'))$('watchBtn').style.display='none';
  stopMusicDirector();duckMusic(false);startMusic();
  G.perkPending=null;if($('perkOverlay'))$('perkOverlay').classList.add('hidden');
  replayLog=null;replayCount=0;replayLook=[0,0];replayLastWi=-1;
  if(document.pointerLockElement)document.exitPointerLock();
  $('overlay').classList.remove('hidden');$('pauseOverlay').classList.add('hidden');$('gameOverOverlay').classList.add('hidden');
  $('hud').classList.remove('on');$('crosshair').classList.remove('on');$('touch').classList.remove('on');$('pauseBtn').style.display='none';
  if($('photoBtn'))$('photoBtn').style.display='none';
  $('bgfx').style.display='block';$('gridfx').style.display='block';$('lowhp').style.opacity='0';
  G.daily=false;
  if($('seedInput'))$('seedInput').disabled=false;
  const seg=$('diffSeg');if(seg)for(const b of seg.children)b.disabled=false;
  if($('goDailyWrap'))$('goDailyWrap').style.display='none';
  renderScores();renderDaily();renderMeta();
}
function showErr(msg){const e=$('errbox');e.textContent=msg;e.style.display='block';clearTimeout(e._t);e._t=setTimeout(()=>{e.style.display='none';},6000);if(DEBUG)console.warn('[SUN_011]',msg);}
function hideErr(){const e=$('errbox');e.style.display='none';clearTimeout(e._t);}

