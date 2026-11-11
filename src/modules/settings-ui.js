function applySettingsUI(){
  try{
    $('sensRange').value=SET.sens;$('sensVal').textContent=(+SET.sens).toFixed(1);
    $('volRange').value=SET.vol;$('volVal').textContent=(+SET.vol).toFixed(2);
    $('invertYChk').checked=!!SET.invertY;$('minimapChk').checked=!!SET.minimap;$('musicChk').checked=!!SET.music;
    $('qualitySel').value=SET.quality;
    if($('pSensRange')){$('pSensRange').value=SET.sens;$('pSensVal').textContent=(+SET.sens).toFixed(1);}
    if($('pVolRange')){$('pVolRange').value=SET.vol;$('pVolVal').textContent=(+SET.vol).toFixed(2);}
    if($('pMusicChk'))$('pMusicChk').checked=!!SET.music;
    if($('langSel'))$('langSel').value=SET.lang||'';
    if($('a11yMotionChk'))$('a11yMotionChk').checked=!!SET.reducedMotion;
    if($('a11yContrastChk'))$('a11yContrastChk').checked=!!SET.highContrast;
    if($('a11yColorChk'))$('a11yColorChk').checked=!!SET.colorblind;
    if($('autotuneChk'))$('autotuneChk').checked=!!SET.autotune;
    if($('hapticChk'))$('hapticChk').checked=!!SET.haptics;
    if($('goldBiomeChk'))$('goldBiomeChk').checked=SET.goldBiome!==false;
    if($('tapFireChk'))$('tapFireChk').checked=SET.tapFire!==false;
    if($('fireZoneRange'))$('fireZoneRange').value=SET.fireZone;
    if($('fireZoneVal'))$('fireZoneVal').textContent=Math.round(SET.fireZone*100)+'%';
    if($('sensXRange'))$('sensXRange').value=SET.sensX;
    if($('sensXVal'))$('sensXVal').textContent=(+SET.sensX).toFixed(1);
    if($('sensYRange'))$('sensYRange').value=SET.sensY;
    if($('sensYVal'))$('sensYVal').textContent=(+SET.sensY).toFixed(1);
    if($('deadzoneRange'))$('deadzoneRange').value=SET.deadzone;
    if($('deadzoneVal'))$('deadzoneVal').textContent=(+SET.deadzone).toFixed(2);
    applyLefty();
    sensitivity=SET.sens;
    applyGain();applyA11y();
    return {ok:true};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
