/* ============================ HUD ============================ */
let fpsAcc=0,fpsFrames=0,fpsShown=0;
function updateBossBar(){
  try{
    const bb=$('bossBar'),fi=$('bossFill');if(!bb||!fi)return {ok:false,error:'missing bossBar'};
    let boss=null;for(const e of enemies)if(e.boss){boss=e;break;}
    if(boss){bb.style.display='block';const pct=Math.max(0,Math.min(100,boss.hp/boss.maxhp*100));fi.style.width=pct+'%';
      const lbl=$('bossLbl');if(lbl)lbl.textContent=boss.archetype==='lance'?t('lance'):boss.archetype==='hive'?t('hive'):boss.archetype==='pyre'?t('pyre'):t('warden');
      return {ok:true,visible:true,width:pct};}
    bb.style.display='none';return {ok:true,visible:false,width:0};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
/* ============================ MINIMAP ============================ */
let mmLayer=null,mmSeed=null,mmAcc=0;
function mmTerrain(seed){
  try{
    if(mmLayer&&mmSeed===seed)return mmLayer;
    const c=document.createElement('canvas');c.width=ARENA_W;c.height=ARENA_D;
    const g2=c.getContext('2d');if(!g2)return null;
    const img=g2.createImageData(ARENA_W,ARENA_D);
    for(let z=0;z<ARENA_D;z++)for(let x=0;x<ARENA_W;x++){
      const h=heights[hidx(x,z)];
      const t=Math.max(0,Math.min(1,(h-1)/(MAX_H-1)));
      const o=(z*ARENA_W+x)*4;
      img.data[o]=16+t*26;img.data[o+1]=34+t*58;img.data[o+2]=58+t*86;img.data[o+3]=235;
    }
    g2.putImageData(img,0,0);
    mmLayer=c;mmSeed=seed;return c;
  }catch(e){return null;}
}
function drawMinimap(){
  try{
    const cv=$('minimap');if(!cv)return {ok:false,error:'no minimap canvas'};
    if(!SET.minimap){cv.classList.remove('on');return {ok:true,hidden:true};}
    cv.classList.add('on');
    const ctx=cv.getContext('2d');if(!ctx)return {ok:false,error:'no 2d context'};
    const W2=cv.width,H2=cv.height,sx=W2/ARENA_W,sy=H2/ARENA_D;
    ctx.clearRect(0,0,W2,H2);
    const layer=mmTerrain(G.runSeed||0);
    if(layer){ctx.imageSmoothingEnabled=false;ctx.drawImage(layer,0,0,W2,H2);}
    else{ctx.fillStyle='rgba(20,34,60,.85)';ctx.fillRect(0,0,W2,H2);}
    ctx.fillStyle='#ffb84c';
    for(const p of pickups)ctx.fillRect(p.x*sx-1.5,p.z*sy-1.5,3,3);
    for(const e of enemies){
      if(e.boss){ctx.fillStyle=e.archetype==='lance'?'#b061ff':e.archetype==='hive'?'#ff3b8a':e.archetype==='pyre'?'#ff5a1f':'#ff8a3d';ctx.beginPath();ctx.arc(e.x*sx,e.z*sy,e.archetype==='hive'?4.5:e.archetype==='pyre'?5:3.5,0,6.283);ctx.fill();}
      else if(e.type===7){ctx.fillStyle='#ffd24c';ctx.fillRect(e.x*sx-1,e.z*sy-1,2,2);}
      else if(e.type===8){ctx.fillStyle='#b061ff';ctx.fillRect(e.x*sx-2,e.z*sy-2,4,4);}
      else if(e.type===9){ctx.fillStyle='#ff4cd9';ctx.fillRect(e.x*sx-1.5,e.z*sy-1.5,3,3);}
      else if(e.type===10){ctx.fillStyle='#ffb84c';ctx.fillRect(e.x*sx-2,e.z*sy-2,4,4);
        ctx.strokeStyle='rgba(255,184,76,.55)';ctx.beginPath();ctx.arc(e.x*sx,e.z*sy,(e.aura||6)*sx,0,6.283);ctx.stroke();}
      else{ctx.fillStyle='#ff3b30';ctx.fillRect(e.x*sx-1.5,e.z*sy-1.5,3,3);}
      if(e.elite){ctx.strokeStyle='#ffb84c';ctx.strokeRect(e.x*sx-3,e.z*sy-3,6,6);}
    }
    ctx.save();ctx.translate(player.x*sx,player.z*sy);ctx.rotate(player.yaw);
    ctx.fillStyle='#22e0ff';ctx.beginPath();ctx.moveTo(0,-5);ctx.lineTo(3.5,4);ctx.lineTo(-3.5,4);ctx.closePath();ctx.fill();
    ctx.restore();
    return {ok:true,w:W2,h:H2,sx,sy,px:player.x*sx,py:player.z*sy};
  }catch(e){
    try{$('minimap').classList.remove('on');}catch(e2){}
    return {ok:false,error:String(e&&e.message||e)};
  }
}
function updateHUD(dt){
  fpsAcc+=dt;fpsFrames++;if(fpsAcc>=0.5){fpsShown=Math.round(fpsFrames/fpsAcc);fpsAcc=0;fpsFrames=0;}
  $('scoreVal').textContent=G.score;$('waveVal').textContent=Math.max(1,G.wave);$('comboVal').textContent='×'+G.combo;
  const hp=Math.max(0,Math.round(player.hp)),mx=(G.derived&&G.derived.maxHp)||100;$('hpFill').style.width=Math.min(100,hp/mx*100)+'%';$('hpTxt').textContent=hp;
  $('hpFill').classList.toggle('low',hp<30);
  const w=WEAPONS[player.wi];
  $('hudAmmo').innerHTML=player.reloading>0?'<b>RELOADING…</b>':
    '<span id="wpnName">'+w.name+'</span> <b id="magVal">'+player.mags[player.wi]+'</b>/'+w.mag+' R:<span id="resVal">'+(player.res[player.wi]===Infinity?'INF':player.res[player.wi])+'</span>';
  $('reloadHint').textContent=player.mags[player.wi]===0&&player.reloading<=0?'[R] reload':'';
  $('perfFps').textContent=fpsShown;$('perfQuads').textContent=quadCount;$('perfEnt').textContent=enemies.length;
  $('hudPos').textContent=Math.round(player.x)+','+Math.round(player.y)+','+Math.round(player.z);
  $('seedVal').textContent=G.runSeed;
  const evEl=$('hudEv');if(evEl)evEl.textContent=IN.evHz;
  const hb=$('hudBiome');if(hb)hb.textContent=biomeDef(biomeFor(G.runSeed|0)).name;
  updateBossBar();syncWeaponBtns();
}
function syncWeaponBtns(){
  try{
    const box=$('wpnBtns');if(!box)return {ok:false,error:'no wpnBtns'};
    box.style.display=(paused||gameOver)?'none':'';
    const btns=box.children;
    for(let i=0;i<btns.length;i++)btns[i].classList.toggle('on',+btns[i].dataset.w===player.wi);
    return {ok:true,wi:player.wi};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}

