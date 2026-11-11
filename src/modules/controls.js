let lastBenchJSON='';
function setVol(v){
  try{
    SET.vol=Math.min(1,Math.max(0,+v));if($('volVal'))$('volVal').textContent=(+SET.vol).toFixed(2);
    if($('pVolVal'))$('pVolVal').textContent=(+SET.vol).toFixed(2);
    if($('volRange'))$('volRange').value=SET.vol;if($('pVolRange'))$('pVolRange').value=SET.vol;
    applyGain();saveSettings();return {ok:true,vol:SET.vol};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function setSens(v){
  try{
    SET.sens=Math.min(2.5,Math.max(0.3,+v));sensitivity=SET.sens;
    if($('sensVal'))$('sensVal').textContent=sensitivity.toFixed(1);
    if($('pSensVal'))$('pSensVal').textContent=sensitivity.toFixed(1);
    if($('sensRange'))$('sensRange').value=SET.sens;if($('pSensRange'))$('pSensRange').value=SET.sens;
    saveSettings();return {ok:true,sens:SET.sens};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function setSensXY(x,y){
  try{
    const nx=+x,ny=+y;
    if(!Number.isFinite(nx)||!Number.isFinite(ny))return {ok:false,error:'bad sens axis'};
    SET.sensX=Math.min(3,Math.max(0.2,nx));SET.sensY=Math.min(3,Math.max(0.2,ny));
    if($('sensXVal'))$('sensXVal').textContent=SET.sensX.toFixed(1);
    if($('sensYVal'))$('sensYVal').textContent=SET.sensY.toFixed(1);
    if($('sensXRange'))$('sensXRange').value=SET.sensX;
    if($('sensYRange'))$('sensYRange').value=SET.sensY;
    saveSettings();return {ok:true,sensX:SET.sensX,sensY:SET.sensY};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function setDeadzone(v){
  try{
    const n=+v;
    if(!Number.isFinite(n))return {ok:false,error:'bad deadzone'};
    SET.deadzone=Math.min(0.3,Math.max(0,n));
    if($('deadzoneVal'))$('deadzoneVal').textContent=SET.deadzone.toFixed(2);
    if($('deadzoneRange'))$('deadzoneRange').value=SET.deadzone;
    saveSettings();return {ok:true,deadzone:SET.deadzone};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function applyLefty(){
  try{
    const on=!!SET.lefty;
    if(document.body&&document.body.classList)document.body.classList.toggle('lefty',on);
    if($('leftyChk'))$('leftyChk').checked=on;
    return {ok:true,lefty:on};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function setLefty(b){
  try{SET.lefty=!!b;applyLefty();saveSettings();return {ok:true,lefty:SET.lefty};}
  catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function setMusic(b){
  try{
    SET.music=!!b;
    if($('musicChk'))$('musicChk').checked=SET.music;if($('pMusicChk'))$('pMusicChk').checked=SET.music;
    saveSettings();
    if(SET.music){if(AC&&!muted&&!benchRunning)startMusic();}else stopMusic();
    return {ok:true,music:SET.music};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
