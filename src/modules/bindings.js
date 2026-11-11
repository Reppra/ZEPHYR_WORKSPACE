function bindUI(){
  $('overlayBtn').addEventListener('click',()=>startGame());
  $('overlayBtn').addEventListener('keydown',e=>{if(e.code==='Enter'||e.code==='Space'){e.preventDefault();startGame();}});
  $('retryBtn').addEventListener('click',()=>startGame());
  $('goMenuBtn').addEventListener('click',toMenu);
  $('pauseMenuBtn').addEventListener('click',toMenu);
  $('resumeBtn').addEventListener('click',togglePause);
  $('pauseBtn').addEventListener('click',togglePause);
  $('muteBtn').addEventListener('click',()=>{ensureAudio();setMuted(!muted);});
  $('benchmarkBtn').addEventListener('click',()=>{
    const btn=$('benchmarkBtn');btn.disabled=true;
    $('benchPanel').classList.add('on');$('copyResultsBtn').classList.remove('on');
    $('benchBadge').textContent='RUNNING';$('benchBadge').className='badge run';
    $('benchmarkPre').textContent='RUNNING…';
    setTimeout(()=>{
      const br=runBenchmark();window.__lastBenchmark=br;
      benchmarkDone=true;benchmarkPass=br.ok;lastBenchJSON=JSON.stringify(br.payload);
      paintResults(br);pushConsole(br);
      $('copyResultsBtn').classList.add('on');$('exportBtn').classList.add('on');btn.disabled=false;
      $('benchScroll').scrollTop=0;
    },30);
  });
  $('copyResultsBtn').addEventListener('click',copyResults);
  $('exportBtn').addEventListener('click',()=>downloadBench());
  $('diffSeg').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;difficulty=+b.dataset.d;
    for(const x of $('diffSeg').children)x.classList.toggle('on',x===b);});
  $('sensRange').addEventListener('input',e=>{setSens(e.target.value);});
  $('volRange').addEventListener('input',e=>{setVol(e.target.value);});
  $('invertYChk').addEventListener('change',e=>{SET.invertY=!!e.target.checked;saveSettings();});
  $('minimapChk').addEventListener('change',e=>{SET.minimap=!!e.target.checked;saveSettings();});
  $('musicChk').addEventListener('change',e=>{setMusic(e.target.checked);});
  if($('pSensRange'))$('pSensRange').addEventListener('input',e=>{setSens(e.target.value);});
  if($('pVolRange'))$('pVolRange').addEventListener('input',e=>{setVol(e.target.value);});
  if($('pMusicChk'))$('pMusicChk').addEventListener('change',e=>{setMusic(e.target.checked);});
  $('qualitySel').addEventListener('change',e=>{SET.quality=e.target.value;applyQuality();saveSettings();});
  if($('langSel'))$('langSel').addEventListener('change',e=>{
    SET.lang=($('langSel').value||'')===''?'':$('langSel').value;
    saveSettings();setLang(SET.lang||resolveLang());
  });
  const a11y=[[$('a11yMotionChk'),'reducedMotion'],[$('a11yContrastChk'),'highContrast'],[$('a11yColorChk'),'colorblind']];
  for(const [el,key] of a11y){if(el)el.addEventListener('change',()=>{SET[key]=!!el.checked;saveSettings();applyA11y();});}
  if($('autotuneChk'))$('autotuneChk').addEventListener('change',e=>{SET.autotune=!!e.target.checked;saveSettings();});
  if($('hapticChk'))$('hapticChk').addEventListener('change',e=>{SET.haptics=!!e.target.checked;saveSettings();});
  if($('goldBiomeChk'))$('goldBiomeChk').addEventListener('change',e=>{SET.goldBiome=!!e.target.checked;saveSettings();});
  if($('tapFireChk'))$('tapFireChk').addEventListener('change',e=>{SET.tapFire=!!e.target.checked;saveSettings();});
  if($('fireZoneRange'))$('fireZoneRange').addEventListener('input',e=>{setFireZone(e.target.value);});
  if($('sensXRange'))$('sensXRange').addEventListener('input',e=>{setSensXY(e.target.value,SET.sensY);});
  if($('sensYRange'))$('sensYRange').addEventListener('input',e=>{setSensXY(SET.sensX,e.target.value);});
  if($('deadzoneRange'))$('deadzoneRange').addEventListener('input',e=>{setDeadzone(e.target.value);});
  if($('leftyChk'))$('leftyChk').addEventListener('change',e=>{setLefty(!!e.target.checked);});
  if($('perkRerollBtn'))$('perkRerollBtn').addEventListener('click',()=>rerollPerks());
  if($('photoBtn'))$('photoBtn').addEventListener('click',()=>photoSave());
  if($('purgeScoresBtn')){
    let purgeArm=0;
    $('purgeScoresBtn').addEventListener('click',()=>{
      const b=$('purgeScoresBtn'),now=Date.now();
      if(now<purgeArm){
        purgeArm=0;const r=purgeScores();b.textContent=t('clearScores');
        if(r.ok)showToast(t('scoresCleared'));
        return;
      }
      purgeArm=now+3000;b.textContent=t('purgeConfirm');
      setTimeout(()=>{if(Date.now()>=purgeArm){purgeArm=0;b.textContent=t('clearScores');}},3100);
    });
  }
  if($('replayBtn'))$('replayBtn').addEventListener('click',()=>exportReplay());
  if($('watchBtn'))$('watchBtn').addEventListener('click',()=>{
    const pl=buildReplayPayload();
    if(!pl.ok){showToast(t('replayEmpty'));return;}
    const r=replayPlay(pl.payload);
    if(!r.ok)showToast(t('replayInvalid'));
  });
  if($('pbToggle'))$('pbToggle').addEventListener('click',()=>{if(PB&&PB.active){PB.paused=!PB.paused;updatePbBar();}});
  if($('pbCam'))$('pbCam').addEventListener('click',()=>pbCycleCam());
  if($('pbBar')){for(const b of $('pbBar').querySelectorAll('.pb-spd'))b.addEventListener('click',()=>{if(PB&&PB.active){PB.speed=+b.dataset.s||1;updatePbBar();}});}
  if($('pbExit'))$('pbExit').addEventListener('click',()=>endPlayback(true));
  if($('pbEndOk'))$('pbEndOk').addEventListener('click',()=>endPlayback(true));
  if($('dailyBtn'))$('dailyBtn').addEventListener('click',()=>startDaily());
  if($('dailyVerifyBtn'))$('dailyVerifyBtn').addEventListener('click',()=>{
    const r=verifyDaily($('dailyCodeInput')?$('dailyCodeInput').value:'');
    showToast(r.ok?t('dailyVerified'):t('dailyInvalid'));
  });
  if($('goDailyCopy'))$('goDailyCopy').addEventListener('click',async()=>{
    const code=$('goDailyCode')?$('goDailyCode').textContent:'';
    try{if(navigator.clipboard&&navigator.clipboard.writeText){await navigator.clipboard.writeText(code);showToast(t('dailyCopied'));return;}}catch(e){}
    try{const ta=document.createElement('textarea');ta.value=code;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);showToast(t('dailyCopied'));}catch(e){showToast(t('dailyInvalid'));}
  });
  if($('importReplayBtn'))$('importReplayBtn').addEventListener('click',()=>{const f=$('replayFile');if(f)f.click();});
  if($('replayFile'))$('replayFile').addEventListener('change',e=>{
    const file=e.target.files&&e.target.files[0];if(!file)return;
    try{
      const rd=new FileReader();
      rd.onload=()=>{
        try{
          const obj=JSON.parse(String(rd.result||''));
          const sum=replaySummary(obj);
          if(sum.ok){
            const r=replayPlay(obj);
            if(r.ok){if(!sum.legacy)showToast(t('replayImported')+' · '+sum.frames+'F · '+Math.round(sum.duration)+'s · S'+sum.seed);}
            else showToast(t('replayInvalid'));
          }
          else showToast(t('replayInvalid'));
        }catch(e2){showToast(t('replayInvalid'));}
      };
      rd.onerror=()=>showToast(t('replayInvalid'));
      rd.readAsText(file);
    }catch(e2){showToast(t('replayInvalid'));}
    try{e.target.value='';}catch(e3){}
  });
  $('ctxBtn').addEventListener('click',()=>{
    if(gl&&!gl.isContextLost()){restoreGraphics();return;}
    try{
      if(sessionStorage.getItem('sun011_ctx_reload')==='1'||sessionStorage.getItem('sun010_ctx_reload')==='1'||sessionStorage.getItem('sun009_ctx_reload')==='1'||sessionStorage.getItem('sun008_ctx_reload')==='1'){showErr('Reload already attempted — graphics unavailable on this device.');return;}
      sessionStorage.setItem('sun011_ctx_reload','1');
    }catch(e){}
    location.reload();
  });
}

