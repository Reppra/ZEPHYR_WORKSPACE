function fire(){
  try{
    if(player.reloading>0||player.fireCd>0)return {ok:false,error:'busy'};
    const w=WEAPONS[player.wi];
    if(player.mags[player.wi]<=0){reload();return {ok:false,error:'empty'};}
    player.mags[player.wi]--;
    telemetryRecord('shot',player.wi);
    player.fireCd=(player.rapid>0?Math.min(0.09,w.cd):w.cd)*((player.derived&&player.derived[player.wi]||{}).cdMul||1)*((G.derived&&G.derived.cdMul)||1);
    G.muzzle=1;G.shake=Math.min(G.shake+0.5,1.2);
    if(TP.captured&&(touch.fireTouch||touch.fire))G.shake=0;
    sfx(player.wi===1?'scatter':player.wi===2?'rail':player.wi===3?'arc':'shoot');
    if(player.wi===3){
      const ar=fireArc();
      if(player.mags[player.wi]<=0)reload();
      return ar.ok?{ok:true,wi:3,mag:player.mags[3],chain:ar.hits}:ar;
    }
    const eye=[player.x,player.y+EYE_H,player.z];const base=forwardVec();
    const drl=Math.hypot(base[0],base[2])||1;const mrx=-base[2]/drl,mrz=base[0]/drl;
    let landed=false,hitCount=0;
    const critCh=(G.derived&&G.derived.crit)||0;const crit=critCh>0&&rand01()<critCh;
    for(let p=0;p<w.pellets;p++){
      let dir=base;
      if(w.spread>0){
        const ang=(rand01()-0.5)*2*w.spread;
        const ca=Math.cos(ang),sa=Math.sin(ang);
        const rx=base[0]*ca-base[2]*sa,rz=base[0]*sa+base[2]*ca;
        dir=v3norm([rx,base[1]+(rand01()-0.5)*w.spread*0.5,rz]);
      }
      const cand=rayHits(eye,dir,90);
      const firstT=cand.length?cand[0].t:90;
      const wallT=wallRayT(eye,dir,Math.min(w.pierce?90:firstT,90));
      const endT=w.pierce?wallT:Math.min(firstT,wallT);
      const beams=w.pierce?3:1;
      for(let b=0;b<beams;b++){
        const off=(b-(beams-1)/2)*0.06;
        tracers.push({x0:eye[0]+dir[0]*0.8+mrx*off,y0:eye[1]-0.28,z0:eye[2]+dir[2]*0.8+mrz*off,
          x1:eye[0]+dir[0]*endT+mrx*off,y1:eye[1]+dir[1]*endT,z1:eye[2]+dir[2]*endT+mrz*off,life:w.pierce?0.12:0.07});
      }
      for(const h of cand){
        if(h.t>wallT)break;
        const dmg=Math.round((w.dmg+Math.floor(rand01()*w.dmgVar))*(player.dmgBoost>0?2:1)*((player.derived&&player.derived[player.wi]||{}).dmgMul||1)*((G.derived&&G.derived.dmgMul)||1)*(crit?2:1));
        const r=applyDamage(h.e,dmg);
        if(r.dealt){landed=true;hitCount++;sfx('hit');burst(h.e.x,h.e.y,h.e.z,PAL.amber,w.pierce?7:5,3);}
        if(!w.pierce)break;
      }
    }
    if(landed)telemetryRecord('hit',player.wi);
    if(landed&&crit)G.critMark=0.3;
    if(!benchRunning&&w.pierce&&hitCount>=3)unlockAch('triple');
    if(player.mags[player.wi]<=0)reload();
    return {ok:true,wi:player.wi,mag:player.mags[player.wi]};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function fireArc(){
  try{
    const w=WEAPONS[3],ch=w.chain;
    const der=(player.derived&&player.derived[3])||{};
    const jumps=((G.derived&&G.derived.arcJumps)||ch.jumps)+(der.jumpAdd||0),dmgMul=der.dmgMul||1;
    const eye=[player.x,player.y+EYE_H,player.z],dir=forwardVec();
    const cand=rayHits(eye,dir,90);
    const firstT=cand.length?cand[0].t:90;
    const wallT=wallRayT(eye,dir,Math.min(firstT,90));
    const endT=Math.min(firstT,wallT);
    pushBeam([eye[0]+dir[0]*0.8,eye[1]-0.28,eye[2]+dir[2]*0.8],[eye[0]+dir[0]*endT,eye[1]+dir[1]*endT,eye[2]+dir[2]*endT],PAL.cyan);
    pushGlow(eye[0]+dir[0]*endT,eye[1]+dir[1]*endT,eye[2]+dir[2]*endT,PAL.cyan,1.6,0.25);
    const critCh=(G.derived&&G.derived.crit)||0;const crit=critCh>0&&rand01()<critCh;
    const base=Math.round(w.dmg*dmgMul*((G.derived&&G.derived.dmgMul)||1))*(player.dmgBoost>0?2:1)*(crit?2:1);
    const hitSet=new Set(),dmgLog=[];
    let landed=false;
    const first=cand.length&&cand[0].t<=wallT?cand[0].e:null;
    if(first){
      const r=applyDamage(first,base);
      if(r.dealt){landed=true;dmgLog.push(r.dealt);hitSet.add(first);burst(first.x,first.y,first.z,PAL.cyan,6,3);pushGlow(first.x,first.y,first.z,PAL.cyan,1.8,0.3);sfx('hit');}
    }
    let cur=first,prev=base;
    for(let j=0;cur&&j<jumps;j++){
      let next=null,best=ch.radius*ch.radius;
      for(const e of enemies){
        if(hitSet.has(e))continue;
        const ddx=e.x-cur.x,ddz=e.z-cur.z,d2=ddx*ddx+ddz*ddz;
        if(d2<best){best=d2;next=e;}
      }
      if(!next)break;
      const dmg=Math.round(prev*ch.falloff);prev=dmg;
      pushBeam([cur.x,cur.y,cur.z],[next.x,next.y,next.z],PAL.cyan);
      const r=applyDamage(next,dmg);
      if(r.dealt){landed=true;dmgLog.push(r.dealt);burst(next.x,next.y,next.z,PAL.cyan,5,3);pushGlow(next.x,next.y,next.z,PAL.cyan,1.5,0.25);}
      hitSet.add(next);cur=next;
    }
    if(landed)telemetryRecord('hit',3);
    if(landed&&crit)G.critMark=0.3;
    if(!benchRunning&&hitSet.size===4)unlockAch('chain4');
    return {ok:true,hits:hitSet.size,dmgLog};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function pushBeam(from,to,col){
  try{
    if(tracers.length>=BEAM_MAX)tracers.shift();
    tracers.push({x0:from[0],y0:from[1],z0:from[2],x1:to[0],y1:to[1],z1:to[2],life:0.12,col:col||PAL.cyan});
    return {ok:true,count:tracers.length};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
const WMODS={arcJump:{dmgMul:1,cdMul:1,jumpAdd:1}};
function recomputeDerived(mods){
  try{
    const list=mods||player.mods||[];
    const out=WEAPONS.map((w,i)=>{
      const m=list[i],d={dmgMul:1,cdMul:1,jumpAdd:0};
      if(m){d.dmgMul*=m.dmgMul===undefined?1:m.dmgMul;d.cdMul*=m.cdMul===undefined?1:m.cdMul;d.jumpAdd+=m.jumpAdd||0;}
      return d;
    });
    return {ok:true,derived:out};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function grantMod(wi,mod){
  try{
    const i=wi|0;
    if(i<0||i>=WEAPONS.length)return {ok:false,error:'bad weapon slot'};
    const m=typeof mod==='string'?WMODS[mod]:mod;
    if(!m)return {ok:false,error:'unknown mod'};
    player.mods=player.mods||WEAPONS.map(()=>null);
    player.mods[i]=m;
    const r=recomputeDerived(player.mods);
    if(!r.ok)return r;
    player.derived=r.derived;
    return {ok:true,wi:i,derived:player.derived[i]};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function killEnemy(e){
  const i=enemies.indexOf(e);if(i<0)return;enemies.splice(i,1);
  G.kills++;G.combo=Math.min(G.combo+1,9);G.comboTimer=3+((G.derived&&G.derived.comboGrace)||0);telemetryRecord('kill',e);
  if(G.derived&&G.derived.vamp>0)player.hp=Math.min(G.derived.maxHp,player.hp+G.derived.vamp);
  if(!benchRunning){
    if(G.kills===1)unlockAch('firstblood');
    if(G.kills>=50)unlockAch('rampage50');
    if(e.boss)unlockAch('warden');
    if(G.combo>=8)unlockAch('chain8');
  }
  const pts=(e.type===10?110:e.type===8?90:e.type===9?70:e.type===7?70:e.type===3?80:e.type===2?150:e.type===1?60:40)*G.combo;G.score+=pts;
  burst(e.x,e.y,e.z,e.type===2?PAL.magenta:e.type===6?PAL.orange:e.type===7?PAL.amber:e.type===8?PAL.magenta:e.type===9?PAL.pink:e.type===10?PAL.amber:PAL.cyan,18,5);sfx('kill');G.shake=Math.min(G.shake+0.4,1.4);
  if(e.archetype&&ETYPES[e.archetype]&&!benchRunning){
    G.archKills=G.archKills||{};
    if(!G.archKills[e.archetype]){G.archKills[e.archetype]=1;showToast(t(e.archetype+'Name')+' '+t('archDown'));}
  }
  if(e.boss){
    const arch=e.archetype;
    G.score+=arch==='pyre'?400:arch==='hive'?350:arch==='lance'?300:250;
    pickups.push({x:e.x-1.2,z:e.z,y:groundAt(e.x-1.2,e.z)+0.7,kind:0,life:15+((G.derived&&G.derived.pickGrace)||0)});
    pickups.push({x:e.x+1.2,z:e.z,y:groundAt(e.x+1.2,e.z)+0.7,kind:arch==='lance'||arch==='pyre'?4:1,life:15+((G.derived&&G.derived.pickGrace)||0)});
    burst(e.x,e.y,e.z,PAL.orange,32,6);showToast(t(arch==='pyre'?'pyreDown':arch==='hive'?'hiveDown':arch==='lance'?'lanceDown':'wardenDown'));sfx('boss');hapticFire(40);
    if(arch==='pyre'&&!benchRunning)unlockAch('pyre');
  }
  if(e.elite==='split'&&!e.child){
    for(let i=0;i<2;i++){
      const cx=e.x+(i?0.8:-0.8),cz=e.z;
      enemies.push({x:cx,z:cz,y:groundAt(cx,cz)+1.1,type:e.type,hp:e.maxhp*0.4,maxhp:e.maxhp*0.4,speed:e.speed*1.1,
        size:e.size*0.75,dmg:e.dmg*0.6,atkCd:0,bob:rand01()*6.28,flash:0,strafe:rand01()<0.5?-1:1,
        hold:10+rand01()*6,elite:null,child:true,shieldHp:0,shieldMax:0,shieldCd:0});
    }
  }
  if(rand01()<0.16){const kind=Math.floor(rand01()*5);pickups.push({x:e.x,z:e.z,y:groundAt(e.x,e.z)+0.7,kind,life:12+((G.derived&&G.derived.pickGrace)||0)});}
}
function reload(){
  const w=WEAPONS[player.wi];
  if(player.reloading>0||player.mags[player.wi]>=w.mag)return;
  if(player.res[player.wi]<=0){showToast(t('noAmmo'));return;}
  player.reloadWi=player.wi;player.reloading=w.rel*((G.derived&&G.derived.relMul)||1);sfx('reload');
}
function setWeapon(n){
  try{
    const wi=((n|0)%WEAPONS.length+WEAPONS.length)%WEAPONS.length;
    player.reloading=0;player.reloadWi=wi;player.wi=wi;player.fireCd=Math.max(player.fireCd,0.12);
    if(wi===3&&!benchRunning)showToast(t('arcReady'));
    updateHUD(0);
    return {ok:true,wi};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function damagePlayer(dmg){
  G.tookDamage=true;G.noDmgT=0;
  if(player.shield>0){player.shield=Math.max(0,player.shield-dmg*0.5);dmg*=0.3;}
  if(player.hurtCd>0)return;player.hurtCd=0.4;
  const hpBefore=player.hp;player.hp-=dmg;telemetryRecord('damage',Math.max(0,hpBefore-player.hp));G.combo=1;G.comboTimer=0;G.shake=Math.min(G.shake+0.8,1.6);sfx('hurt');hapticFire(24);
  const d=$('damage');d.style.opacity='0.9';setTimeout(()=>{d.style.opacity='0';},180);
  if(player.hp<=0){player.hp=0;endGame();}
}
function applyPickup(p){
  const mx=(G.derived&&G.derived.maxHp)||100;
  if(p.kind===0){player.hp=Math.min(mx,player.hp+30);showToast(t('pickupHealth'));}
  else if(p.kind===1){player.rapid=8;showToast(t('rapidFire'));}
  else if(p.kind===2){player.shield=60;showToast(t('shield'));}
  else if(p.kind===3){player.dmgBoost=8;showToast(t('doubleDamage'));}
  else{const gain=[0,12,3,6];for(let i=1;i<4;i++)player.res[i]+=Math.min(gain[i],Math.max(0,WEAPONS[i].max-player.res[i]));showToast(t('ammoCell'));}
  sfx('pickup');burst(p.x,p.y,p.z,PAL.green,12,4);
}
