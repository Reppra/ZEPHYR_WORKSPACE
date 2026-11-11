function updateParticles(dt){
  for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=dt;if(p.life<=0){particles.splice(i,1);continue;}
    p.vy-=9*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.size*=0.985;}
  for(let i=tracers.length-1;i>=0;i--){tracers[i].life-=dt;if(tracers[i].life<=0)tracers.splice(i,1);}
  for(let i=glows.length-1;i>=0;i--){glows[i].life-=dt;if(glows[i].life<=0)glows.splice(i,1);}
  for(let i=pickups.length-1;i>=0;i--){const p=pickups[i];p.life-=dt;if(p.life<=0){pickups.splice(i,1);continue;}
    if(Math.hypot(p.x-player.x,p.z-player.z)<1.3+((G.derived&&G.derived.pickGrace)>0?2:0)&&Math.abs(p.y-player.y)<2.5){applyPickup(p);pickups.splice(i,1);}}
}
function updateWaves(dt){
  if(G.waveState==='intermission'){G.waveTimer-=dt;if(G.waveTimer<=0)startWave();return;}
  if(G.toSpawn>0){
    if(enemies.length>=Math.round(24*DIFF[difficulty].count)){G.spawnTimer=0.25;return;}
    G.spawnTimer-=dt;if(G.spawnTimer<=0){spawnEnemy();G.toSpawn--;G.spawnTimer=Math.max(0.25,1.1-G.wave*0.05);}
  }
  else if(enemies.length===0){G.waveState='intermission';G.waveTimer=3.2;G.score+=G.wave*50;
    player.hp=Math.min((G.derived&&G.derived.maxHp)||100,player.hp+12);showBanner(t('wave')+' '+G.wave+' '+t('waveCleared'),'+'+(G.wave*50)+' '+t('bonus'));sfx('wave');
    if(!benchRunning&&!gameOver&&G.mode!=='playback'){const r=rollPerks();if(r.ok&&r.choices.length){G.perkPending=r.choices;paused=true;G.mode='paused';duckMusic(true);if(document.pointerLockElement)document.exitPointerLock();clearInput();showPerkOverlay(r.choices);}}}
}
function updateFX(dt){
  G.shake=Math.max(0,G.shake-dt*3);G.muzzle=Math.max(0,G.muzzle-dt*8);G.hitmark=Math.max(0,G.hitmark-dt*4);G.critMark=Math.max(0,(G.critMark||0)-dt*3);
  G.comboTimer=Math.max(0,G.comboTimer-dt);if(G.comboTimer<=0&&G.combo>1)G.combo=1;
  if(MD.on)setIntensity(computeIntensity());
  if(G.banner>0){G.banner-=dt;if(G.banner<=0)$('waveBanner').style.opacity='0';}
  if(G.toast>0){G.toast-=dt;if(G.toast<=0)$('powerToast').style.opacity='0';}
  $('hitmarker').style.opacity=G.hitmark>0?String(G.hitmark):'0';
  $('hitmarker').style.transform='translate(-50%,-50%) rotate(45deg) scale('+(G.critMark>0?1.6:1)+')';
  $('lowhp').style.opacity=player.hp<30&&gameStarted&&!gameOver?'1':'0';
}
function updateGame(dt){
  G.time+=dt;
  recordReplayFrame(dt);
  updatePlayer(dt);updateEnemies(dt);updateProjectiles(dt);updateParticles(dt);updateWaves(dt);updateFX(dt);
}
function endGame(){
  const inPB=G.mode==='playback';
  gameOver=true;if(!inPB)G.mode='gameover';sfx('over');hapticFire(60);stopMusicDirector();duckMusic(false);
  if(replayLog)replayLog.summary={score:G.score,kills:G.kills,waves:G.wave,time:+G.time.toFixed(3)};
  if(document.pointerLockElement)document.exitPointerLock();
  if(!inPB)bestScore=Math.max(bestScore,G.score);
  if(!benchRunning&&!inPB){
    saveScore({score:G.score,wave:Math.max(1,G.wave),kills:G.kills,diff:(DIFF[difficulty]||DIFF[1]).name,seed:G.runSeed,dmg:Math.round(G.dmgTaken),kb:(G.killsBy||[]).slice(),date:new Date().toISOString().slice(0,10)});
    renderScores();
    metaAward(G.score,G.wave,G.kills,!!G.daily);
  }
  $('goScore').textContent=G.score;$('goWave').textContent=G.wave;$('goKills').textContent=G.kills;
  $('goAcc').textContent=(G.shots?Math.round(G.hits/G.shots*100):0)+'%';$('goTime').textContent=Math.floor(G.time)+'s';$('goBest').textContent=bestScore;
  $('goSeed').textContent=G.runSeed;$('goDmg').textContent=Math.round(G.dmgTaken);
  const kb=G.killsBy||[0,0,0,0,0,0,0,0,0,0,0,0],wa=telemetrySummary().weaponAcc||[0,0,0];
  $('goDetail').textContent='KILLS  GRUNT '+kb[0]+'  RUNNER '+kb[1]+'  BRUTE '+kb[2]+'  STINGER '+kb[3]+'  WARDEN '+kb[4]+'  LANCE '+(kb[5]||0)+'  HIVE '+(kb[6]||0)+'  SWARM '+(kb[7]||0)+'  '+t('turretName')+' '+(kb[8]||0)+'  '+t('dashName')+' '+(kb[9]||0)+'  '+t('shielderName')+' '+(kb[10]||0)+'  '+t('pyre')+' '+(kb[11]||0)+'\nACC  PULSE '+wa[0]+'%  SCATTER '+wa[1]+'%  RAIL '+wa[2]+'%  ARC '+(wa[3]||0)+'%';
  if(!inPB){
    $('gameOverOverlay').classList.remove('hidden');$('hud').classList.remove('on');$('crosshair').classList.remove('on');$('touch').classList.remove('on');$('pauseBtn').style.display='none';
    if($('photoBtn'))$('photoBtn').style.display='none';
  }
  if($('watchBtn'))$('watchBtn').style.display=(!inPB&&replayLog&&replayLog.frames.length)?'inline-flex':'none';
  if(G.daily&&!inPB&&!benchRunning){
    const dr=dailySeedAt(),sc=makeShareCode(G.runSeed,G.score,G.kills,G.wave);
    if(dr.ok&&sc.ok){
      saveDaily({date:dr.ymd,score:G.score,kills:G.kills,waves:G.wave,hash:sc.hash,code:sc.code});
      if($('goDailyWrap')){$('goDailyWrap').style.display='';$('goDailyCode').textContent=sc.code;}
    }
  }else if($('goDailyWrap'))$('goDailyWrap').style.display='none';
}

