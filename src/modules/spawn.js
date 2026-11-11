/* ============================ GAMEPLAY ============================ */
function spawnPlayer(){player.x=ARENA_W/2;player.z=ARENA_D/2;player.y=groundAt(player.x,player.z);player.vx=player.vy=player.vz=0;
  player.yaw=0;player.pitch=0;player.hp=100;player.wi=0;player.mags=WEAPONS.map(w=>w.mag);player.res=WEAPONS.map(w=>w.reserve);player.reloadWi=0;player.reloading=0;player.fireCd=0;player.grounded=true;
  player.rapid=0;player.shield=0;player.dmgBoost=0;player.hurtCd=0;player.mods=WEAPONS.map(()=>null);player.derived=recomputeDerived(player.mods).derived;}
function resetGame(){
  enemies=[];particles=[];pickups=[];tracers=[];eproj=[];glows=[];
  replayLog=null;replayCount=0;replayLook=[0,0];replayLastWi=-1;
  G.score=0;G.combo=1;G.comboTimer=0;G.kills=0;G.wave=0;G.waveState='intermission';G.waveTimer=2.0;
  G.toSpawn=0;G.spawnTimer=0;G.shots=0;G.hits=0;G.wshots=[0,0,0,0];G.whits=[0,0,0,0];G.dmgTaken=0;G.killsBy=[0,0,0,0,0,0,0,0,0,0,0,0];G.archKills={};G.tookDamage=false;G.time=0;G.shake=0;G.muzzle=0;G.hitmark=0;G.rng=G.runSeed||123456789;G.banner=0;G.toast=0;G.dynCount=1;G.waveDmg=0;G.lightsThrottled=0;lightSlowFrames=0;lightFastFrames=0;
  G.perks={};G.perkPending=null;G.noDmgT=0;G.critMark=0;recomputePerks();renderPerkList();
  if($('perkOverlay'))$('perkOverlay').classList.add('hidden');
  syncArenaMesh();
  spawnPlayer();
  G.flags={rerollUsed:false};
  if(!benchRunning){
    if(hasUnlock('startShield'))player.shield=25;
    if(hasUnlock('arcJumpMod'))grantMod(3,'arcJump');
  }
}
function startWave(){
  G.wave++;G.waveState='active';
  if(!benchRunning){
    if(G.wave>=5)unlockAch('wave5');
    if(G.wave>=3&&!G.tookDamage)unlockAch('untouched');
  }
  G.tookDamage=false;
  const d=DIFF[difficulty];
  if(SET.autotune){
    const dmgPrev=Math.max(0,G.dmgTaken-(G.waveDmg||0));
    G.dynCount=(dmgPrev===0&&G.wave>=5)?1.15:(player.hp<30?0.85:1);
    try{console.info('[tune] wave',G.wave,'dmg',Math.round(G.dmgTaken),'dynCount',G.dynCount);}catch(e){}
  }else G.dynCount=1;
  G.waveDmg=G.dmgTaken;
  G.toSpawn=waveSpawnCount(G.wave);
  G.spawnTimer=0.4;
  const cad=waveCadence(G.wave);
  if(cad.boss){spawnBoss();showBanner(t(cad.boss+'Protocol'),t(cad.boss+'Sub'));}
  else showBanner(t('wave')+' '+G.wave,t('hostilesInbound'));
  sfx('wave');
}
function spawnHive(){
  try{
    const d=DIFF[difficulty];
    let bx=ARENA_W/2,bz=ARENA_D*0.25;
    for(let i=0;i<10;i++){
      const tx=6+rand01()*(ARENA_W-12),tz=6+rand01()*(ARENA_D-12);
      if(canStand(tx,tz,groundAt(tx,tz))){bx=tx;bz=tz;break;}
    }
    const hp=(180+G.wave*18)*d.hp;
    enemies.push({x:bx,z:bz,y:groundAt(bx,bz)+1.1,type:6,boss:true,archetype:'hive',hp,maxhp:hp,speed:1.0,size:2.4,
      dmg:20*d.dmg,atkCd:0,bob:rand01()*6.28,flash:0,phase:0,spawnCd:5.5,maxSwarms:8,strafe:rand01()<0.5?-1:1});
    return {ok:true,arch:'hive',type:6,hp:enemies[enemies.length-1].hp};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function spawnPyre(){
  try{
    const d=DIFF[difficulty];
    let bx=ARENA_W/2,bz=ARENA_D*0.25;
    for(let i=0;i<10;i++){
      const tx=6+rand01()*(ARENA_W-12),tz=6+rand01()*(ARENA_D-12);
      if(canStand(tx,tz,groundAt(tx,tz))){bx=tx;bz=tz;break;}
    }
    const hp=520*d.hp;
    enemies.push({x:bx,z:bz,y:groundAt(bx,bz)+1.35,type:11,boss:true,archetype:'pyre',hp,maxhp:hp,speed:0.8,size:3.0,
      dmg:24*d.dmg,atkCd:0,bob:rand01()*6.28,flash:0,phase:1,burstCd:3.2,summonCd:6,shieldT:0,shieldCd:8,
      sweepT:0,sweepCd:7,sweepLock:0,sweepX:0,sweepZ:0,strafe:rand01()<0.5?-1:1});
    return {ok:true,arch:'pyre',type:11,hp:enemies[enemies.length-1].hp,phase:1};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function spawnBoss(){
  try{
    const cad=waveCadence(G.wave);
    if(cad.boss==='pyre')return spawnPyre();
    if(cad.boss==='hive')return spawnHive();
    const d=DIFF[difficulty];
    const lance=cad.boss==='lance';
    let bx=ARENA_W/2,bz=ARENA_D*0.25;
    for(let i=0;i<10;i++){
      const tx=6+rand01()*(ARENA_W-12),tz=6+rand01()*(ARENA_D-12);
      if(canStand(tx,tz,groundAt(tx,tz))){bx=tx;bz=tz;break;}
    }
    if(lance){
      const hp=(220+G.wave*22)*d.hp;
      enemies.push({x:bx,z:bz,y:groundAt(bx,bz)+1.1,type:5,boss:true,archetype:'lance',hp,maxhp:hp,speed:1.1,size:2.2,
        dmg:18*d.dmg,atkCd:0,bob:rand01()*6.28,flash:0,phase:0,beamCd:4,chargeT:0,aimX:0,aimZ:0,strafe:rand01()<0.5?-1:1});
      return {ok:true,arch:'lance',type:5,hp:enemies[enemies.length-1].hp};
    }
    const hp=(260+G.wave*30)*d.hp;
    enemies.push({x:bx,z:bz,y:groundAt(bx,bz)+1.1,type:4,boss:true,archetype:'warden',hp,maxhp:hp,speed:1.4,size:2.6,
      dmg:26*d.dmg,atkCd:0,bob:rand01()*6.28,flash:0,phase:0,volleyCd:6.5,slamCd:4});
    return {ok:true,arch:'warden',type:4,hp:enemies[enemies.length-1].hp};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function spawnEnemy(){
  try{
    const d=DIFF[difficulty];const edge=Math.floor(rand01()*4);let x,z;
    if(edge===0){x=3+rand01()*(ARENA_W-6);z=3;}else if(edge===1){x=3+rand01()*(ARENA_W-6);z=ARENA_D-3;}
    else if(edge===2){x=3;z=3+rand01()*(ARENA_D-6);}else{x=ARENA_W-3;z=3+rand01()*(ARENA_D-6);}
    const tbl=spawnTableFor(G.wave);
    const pool=tbl.ok?tbl.types.filter(v=>v>=8):[];
    if(pool.length&&rand01()<0.28){
      const ty=pool[Math.floor(rand01()*pool.length)];
      const arch=ty===8?'turret':ty===9?'dash':'shielder';
      return spawnEnemyArch(arch,x,z);
    }
    let type=0;const r=rand01();
    if(G.wave>=12){
      if(r<0.30)type=1;else if(r<0.60)type=3;else if(r<0.75)type=2;else type=0;
    }else{
      if(G.wave>=3&&r<0.22)type=1;if(G.wave>=5&&r>0.86)type=2;if(G.wave>=4&&r>=0.22&&r<0.42)type=3;
    }
    const hpScale=Math.min(1+G.wave*0.12,3.0),spScale=Math.min(1+G.wave*0.03,1.6);
    const baseHp=(type===2?70:type===3?16:type===1?24:40)*d.hp*hpScale;
    const speed=(type===1?3.4:type===2?1.9:type===3?1.6:2.3)*d.speed*spScale;
    const elite=G.wave>=6&&rand01()<0.12?['shield','vamp','split'][Math.floor(rand01()*3)]:null;
    enemies.push({x,z,y:groundAt(x,z)+1.1,type,hp:baseHp,maxhp:baseHp,speed,size:type===2?1.5:type===3?0.8:type===1?0.7:1.0,
      dmg:(type===2?22:type===3?6:type===1?8:12)*d.dmg,atkCd:0,bob:rand01()*6.28,flash:0,
      strafe:rand01()<0.5?-1:1,hold:10+rand01()*6,elite,
      shieldHp:elite==='shield'?40:0,shieldMax:40,shieldCd:elite==='shield'?4:0});
    return {ok:true,type,arch:null};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function spawnEnemyArch(arch,x,z){
  try{
    const def=ETYPES[arch];if(!def)return {ok:false,error:'unknown arch '+arch};
    const d=DIFF[difficulty];
    if(x===undefined||z===undefined){
      const edge=Math.floor(rand01()*4);
      if(edge===0){x=3+rand01()*(ARENA_W-6);z=3;}else if(edge===1){x=3+rand01()*(ARENA_W-6);z=ARENA_D-3;}
      else if(edge===2){x=3;z=3+rand01()*(ARENA_D-6);}else{x=ARENA_W-3;z=3+rand01()*(ARENA_D-6);}
    }
    x=clamp(x,3,ARENA_W-3);z=clamp(z,3,ARENA_D-3);
    const hpScale=Math.min(1+G.wave*0.12,3.0),spScale=Math.min(1+G.wave*0.03,1.6);
    const hp=def.hp*d.hp*hpScale;
    const elite=G.wave>=6&&rand01()<0.12?['shield','vamp','split'][Math.floor(rand01()*3)]:null;
    enemies.push({x,z,y:groundAt(x,z)+1.1,type:def.type,archetype:arch,hp,maxhp:hp,speed:def.speed*d.speed*spScale,size:def.size,
      dmg:def.dmg*d.dmg,atkCd:arch==='turret'?1.6:0,bob:rand01()*6.28,flash:0,strafe:rand01()<0.5?-1:1,hold:12,elite,
      shieldHp:elite==='shield'?40:0,shieldMax:40,shieldCd:elite==='shield'?4:0,
      ranged:!!def.ranged,aura:def.aura||0,dashState:'stalk',dashT:2.0,dashVec:[0,0],dashMul:4,windupFlash:0,shielded:false});
    return {ok:true,type:def.type,arch};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
