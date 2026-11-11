function spawnProjectile(x,y,z,vx,vy,vz,life,size,col){
  try{eproj.push({x,y,z,vx,vy,vz,life:life||2.5,size:size||0.16,col:col||PAL.magenta});return {ok:true,index:eproj.length-1};}
  catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function updateBoss(e,dt,dx,dz,d){
  try{
    const nx=e.x+(dx/d)*e.speed*dt,nz=e.z+(dz/d)*e.speed*dt;
    const g=groundAt(nx,nz);
    if(g-e.y<=2.8){e.x=nx;e.z=nz;}
    e.y=lerp(e.y,g+1.35,Math.min(1,dt*3));
    e.atkCd=Math.max(0,e.atkCd-dt);e.flash=Math.max(0,e.flash-dt);
    e.volleyCd-=dt;e.slamCd-=dt;
    if(e.volleyCd<=0){
      const base=Math.atan2(dz,dx);
      for(let i=0;i<8;i++){
        const a=base+i*Math.PI/4;
        spawnProjectile(e.x,Math.max(e.y,player.y)+1.0,e.z,Math.cos(a)*9,0,Math.sin(a)*9,2.6,0.22,PAL.orange);
      }
      e.volleyCd=6.5;burst(e.x,e.y,e.z,PAL.orange,10,4);sfx('stinger');
    }
    if(e.slamCd<=0){
      const tx=player.x-(dx/d)*6,tz=player.z-(dz/d)*6;
      if(canStand(tx,tz)){e.x=tx;e.z=tz;e.y=groundAt(tx,tz)+1.35;}
      burst(e.x,e.y,e.z,PAL.red,20,5);G.shake=1.2;e.slamCd=4;sfx('hurt');
    }
    if(d<e.size*0.6+1.0&&e.atkCd<=0){damagePlayer(e.dmg);e.atkCd=1.1;}
    return {ok:true};
  }catch(err){return {ok:false,error:String(err&&err.message||err)};}
}
function updateTurret(e,dt,dx,dz,d){
  try{
    e.atkCd=Math.max(0,e.atkCd-dt);e.flash=Math.max(0,e.flash-dt);
    if(e.atkCd<=0&&d<30){
      const eye=[e.x,e.y+0.6,e.z];
      const dir=v3norm([player.x-e.x,(player.y+EYE_H*0.7)-(e.y+0.6),player.z-e.z]);
      if(wallRayT(eye,dir,d)>=d-0.5){
        const px=player.x+player.vx*0.35,pz=player.z+player.vz*0.35;
        const aim=v3norm([px-e.x,(player.y+1.0)-(e.y+0.6),pz-e.z]);
        spawnProjectile(e.x,e.y+0.6,e.z,aim[0]*12,aim[1]*12,aim[2]*12,2.8,0.18,PAL.magenta);
        e.atkCd=1.6;sfxAt('tshot',e.x,e.z);
      }else e.atkCd=0.4;
    }
    return {ok:true,immobile:true};
  }catch(err){return {ok:false,error:String(err&&err.message||err)};}
}
function updateDash(e,dt,dx,dz,d){
  try{
    e.atkCd=Math.max(0,e.atkCd-dt);e.flash=Math.max(0,e.flash-dt);
    e.dashT=(e.dashT||0)-dt;
    if(e.dashState==='stalk'){
      const nx=e.x+(dx/d)*e.speed*dt,nz=e.z+(dz/d)*e.speed*dt;
      const g=groundAt(nx,nz);
      if(g-e.y<=2.2){e.x=nx;e.z=nz;}
      e.y=lerp(e.y,g+1.1,Math.min(1,dt*4));
      if(e.dashT<=0){e.dashState='windup';e.dashT=0.5;e.dashVec=[dx/d,dz/d];sfxAt('windup',e.x,e.z);}
    }else if(e.dashState==='windup'){
      e.windupFlash=0.5;
      if(e.dashT<=0){e.dashState='dash';e.dashT=0.35;}
    }else{
      const sp=e.speed*(e.dashMul||6);
      const nx=e.x+e.dashVec[0]*sp*dt,nz=e.z+e.dashVec[1]*sp*dt;
      const g=groundAt(nx,nz);
      if(g-e.y<=2.2){e.x=nx;e.z=nz;}
      e.y=lerp(e.y,g+1.1,Math.min(1,dt*4));
      const cd=Math.hypot(player.x-e.x,player.z-e.z);
      if(cd<e.size*0.6+0.8&&e.atkCd<=0){damagePlayer(e.dmg);e.atkCd=0.9;e.dashState='stalk';e.dashT=2.0;}
      else if(e.dashT<=0){e.dashState='stalk';e.dashT=2.0;}
    }
    e.windupFlash=Math.max(0,(e.windupFlash||0)-dt);
    return {ok:true,state:e.dashState};
  }catch(err){return {ok:false,error:String(err&&err.message||err)};}
}
function updateShielder(e,dt){
  try{
    const a2=(e.aura||6)*(e.aura||6);
    let n=0;
    for(const o of enemies){
      if(o===e||o.boss)continue;
      const ddx=o.x-e.x,ddz=o.z-e.z;
      if(ddx*ddx+ddz*ddz<a2){o.shielded=true;n++;}
    }
    e.humCd=Math.max(0,(e.humCd||0)-dt);
    if(n>0&&e.humCd<=0){e.humCd=2.4;sfxAt('hum',e.x,e.z);}
    return {ok:true,shielded:n};
  }catch(err){return {ok:false,error:String(err&&err.message||err)};}
}
function updateEnemies(dt){
  for(const e of enemies)e.shielded=false;
  for(const e of enemies){
    const dx=player.x-e.x,dz=player.z-e.z;const d=Math.hypot(dx,dz)||1;
    if(e.elite==='shield'){
      e.shieldCd=Math.max(0,(e.shieldCd||0)-dt);
      if(e.shieldCd<=0&&e.shieldHp<e.shieldMax)e.shieldHp=Math.min(e.shieldMax,e.shieldHp+8*dt);
    }
    if(e.boss){
      if(e.archetype==='lance')updateLance(e,dt,dx,dz,d);
      else if(e.archetype==='hive')updateHive(e,dt,dx,dz,d);
      else if(e.archetype==='pyre')updatePyre(e,dt,dx,dz,d);
      else updateBoss(e,dt,dx,dz,d);
      continue;
    }
    if(e.ranged){updateTurret(e,dt,dx,dz,d);continue;}
    if(e.archetype==='dash'){updateDash(e,dt,dx,dz,d);continue;}
    if(e.archetype==='shielder')updateShielder(e,dt);
    if(e.type===3){
      const keep=e.hold||13;
      const radial=d>keep+2?1:(d<keep-2?-1:0);
      let mx=(dx/d)*radial*0.65-(dz/d)*(e.strafe||1)*0.9,mz=(dz/d)*radial*0.65+(dx/d)*(e.strafe||1)*0.9;
      const ml=Math.hypot(mx,mz)||1;mx/=ml;mz/=ml;
      const nx=e.x+mx*e.speed*dt,nz=e.z+mz*e.speed*dt;
      const g=groundAt(nx,nz);
      if(g-e.y<=2.2){e.x=nx;e.z=nz;}
      e.y=lerp(e.y,g+0.9,Math.min(1,dt*4));
      e.atkCd=Math.max(0,e.atkCd-dt);e.flash=Math.max(0,e.flash-dt);
      if(e.atkCd<=0&&d<26){
        const dir=v3norm([player.x-e.x,(player.y+EYE_H)-(e.y+0.6),player.z-e.z]);
        spawnProjectile(e.x,e.y+0.6,e.z,dir[0]*14,dir[1]*14,dir[2]*14,2.5,0.16,PAL.magenta);
        e.atkCd=2.2;sfx('stinger');
      }
      if(d<e.size*0.6+0.7&&e.atkCd<=0){damagePlayer(e.dmg);if(e.elite==='vamp'){e.hp=Math.min(e.maxhp,e.hp+15);e.flash=0.12;}e.atkCd=0.9;e.x-=(dx/d)*1.2;e.z-=(dz/d)*1.2;}
      continue;
    }
    const nx=e.x+(dx/d)*e.speed*dt,nz=e.z+(dz/d)*e.speed*dt;
    const g=groundAt(nx,nz);
    if(g-e.y<=2.2){e.x=nx;e.z=nz;}
    e.y=lerp(e.y,g+1.1,Math.min(1,dt*4));
    e.atkCd=Math.max(0,e.atkCd-dt);e.flash=Math.max(0,e.flash-dt);
    if(d<e.size*0.6+0.7&&e.atkCd<=0){damagePlayer(e.dmg);if(e.elite==='vamp'){e.hp=Math.min(e.maxhp,e.hp+15);e.flash=0.12;}e.atkCd=0.9;
      e.x-=(dx/d)*1.4;e.z-=(dz/d)*1.4;}
  }
}
function beamHit(x0,z0,x1,z1,px,pz,w){
  try{
    const dx=x1-x0,dz=z1-z0;const L2=dx*dx+dz*dz;
    let t=L2>0?((px-x0)*dx+(pz-z0)*dz)/L2:0;
    t=Math.max(0,Math.min(1,t));
    const cx=x0+dx*t,cz=z0+dz*t;
    return Math.hypot(px-cx,pz-cz)<=Math.max(0,+w||0);
  }catch(e){return false;}
}
function updateLance(e,dt,dx,dz,d){
  try{
    e.flash=Math.max(0,e.flash-dt);e.atkCd=Math.max(0,e.atkCd-dt);
    if(e.chargeT>0){
      e.chargeT+=dt;
      if(e.chargeT<0.75){e.aimX=player.x;e.aimZ=player.z;}
      tracers.push({x0:e.x,y0:e.y,z0:e.z,x1:e.aimX,y1:player.y+1,z1:e.aimZ,life:0.12,col:PAL.amber});
      if(e.chargeT>=1.0){
        const hit=beamHit(e.x,e.z,e.aimX,e.aimZ,player.x,player.z,1.2);
        tracers.push({x0:e.x,y0:e.y,z0:e.z,x1:e.aimX,y1:player.y+1,z1:e.aimZ,life:0.18,col:PAL.red});
        if(hit)damagePlayer(34*(DIFF[difficulty]||DIFF[1]).dmg);
        G.shake=Math.max(G.shake,1.0);sfx('rail');
        e.chargeT=0;e.beamCd=5;
      }
      return {ok:true,phase:'charge',t:e.chargeT};
    }
    const radial=d>20?1:(d<14?-1:0);
    let mx=(dx/d)*radial*0.8-(dz/d)*(e.strafe||1)*0.7;
    let mz=(dz/d)*radial*0.8+(dx/d)*(e.strafe||1)*0.7;
    const ml=Math.hypot(mx,mz)||1;mx/=ml;mz/=ml;
    const nx=e.x+mx*e.speed*dt,nz=e.z+mz*e.speed*dt;
    const g=groundAt(nx,nz);
    if(g-e.y<=2.8){e.x=nx;e.z=nz;}
    e.y=lerp(e.y,groundAt(e.x,e.z)+1.35,Math.min(1,dt*3));
    e.beamCd-=dt;
    if(e.beamCd<=0){e.chargeT=0.0001;e.aimX=player.x;e.aimZ=player.z;}
    return {ok:true,phase:'reposition'};
  }catch(err){return {ok:false,error:String(err&&err.message||err)};}
}
function updateHive(e,dt,dx,dz,d){
  try{
    e.flash=Math.max(0,e.flash-dt);e.atkCd=Math.max(0,e.atkCd-dt);
    const radial=d>22?1:(d<16?-1:0);
    let mx=(dx/d)*radial*0.7-(dz/d)*(e.strafe||1)*0.6,mz=(dz/d)*radial*0.7+(dx/d)*(e.strafe||1)*0.6;
    const ml=Math.hypot(mx,mz)||1;mx/=ml;mz/=ml;
    const nx=e.x+mx*e.speed*dt,nz=e.z+mz*e.speed*dt;
    const g=groundAt(nx,nz);
    if(g-e.y<=2.8){e.x=nx;e.z=nz;}
    e.y=lerp(e.y,groundAt(e.x,e.z)+1.35,Math.min(1,dt*3));
    e.spawnCd=(e.spawnCd===undefined?5.5:e.spawnCd)-dt;
    const swarmAlive=enemies.filter(x=>x.swarm).length;
    if(e.spawnCd<=0&&swarmAlive<(e.maxSwarms||8)){
      const hpScale=Math.min(1+G.wave*0.12,3.0);
      for(let i=0;i<3;i++){
        const a=(i/3)*6.283+rand01()*0.5,r=2.2+rand01()*1.2;
        const sx=Math.max(2.6,Math.min(ARENA_W-2.6,e.x+Math.cos(a)*r));
        const sz=Math.max(2.6,Math.min(ARENA_D-2.6,e.z+Math.sin(a)*r));
        enemies.push({x:sx,z:sz,y:groundAt(sx,sz)+0.75,type:7,hp:10*hpScale,maxhp:10*hpScale,speed:3.8,size:0.55,
          dmg:4*(DIFF[difficulty]||DIFF[1]).dmg,atkCd:0,bob:rand01()*6.28,flash:0,strafe:rand01()<0.5?-1:1,
          hold:8,elite:null,swarm:true,shieldHp:0,shieldMax:0,shieldCd:0});
      }
      e.spawnCd=5.5;burst(e.x,e.y,e.z,PAL.amber,14,4);sfx('stinger');
    }
    if(d<e.size*0.6+1.0&&e.atkCd<=0){damagePlayer(e.dmg);e.atkCd=1.2;}
    return {ok:true,swarm:swarmAlive,spawnCd:e.spawnCd};
  }catch(err){return {ok:false,error:String(err&&err.message||err)};}
}
function updatePyre(e,dt,dx,dz,d){
  try{
    e.flash=Math.max(0,e.flash-dt);e.atkCd=Math.max(0,e.atkCd-dt);
    const frac=e.hp/e.maxhp;
    const ph=frac>0.66?1:frac>0.33?2:3;
    if(ph!==e.phase){
      e.phase=ph;
      if(ph===2){e.speed=1.4;showBanner(t('pyre')+' · '+t('pyreEnrage'),t('pyreSub'));}
      if(ph===3){e.speed=1.0;e.shieldCd=Math.min(e.shieldCd,2);}
      burst(e.x,e.y,e.z,PAL.red,24,6);sfx('boss');
    }
    const nx=e.x+(dx/d)*e.speed*dt,nz=e.z+(dz/d)*e.speed*dt;
    const g=groundAt(nx,nz);
    if(g-e.y<=2.8){e.x=nx;e.z=nz;}
    e.y=lerp(e.y,g+1.35,Math.min(1,dt*3));
    e.burstCd-=dt;
    if(e.burstCd<=0){
      const n=e.phase>=2?16:10,base=rand01()*6.283;
      for(let i=0;i<n;i++){
        const a=base+i*6.283/n;
        spawnProjectile(e.x,e.y+1.0,e.z,Math.cos(a)*8.5,0,Math.sin(a)*8.5,3.0,0.22,PAL.orange);
      }
      e.burstCd=3.2;burst(e.x,e.y,e.z,PAL.orange,12,4);sfx('stinger');
    }
    e.summonCd-=dt;
    const summons=enemies.filter(x=>x.summoned).length;
    if(e.summonCd<=0&&summons<6){
      if(e.phase<3){
        for(let i=0;i<2&&summons+i<6;i++){const r=spawnEnemyArch('dash',e.x+(i?2.5:-2.5),e.z+2);if(r.ok)enemies[enemies.length-1].summoned=true;}
        e.summonCd=6;
      }else{
        if(summons<5){
          const a=spawnEnemyArch('shielder',e.x+2.5,e.z+2);if(a.ok)enemies[enemies.length-1].summoned=true;
          const b=spawnEnemyArch('turret',e.x-2.5,e.z+2);if(b.ok)enemies[enemies.length-1].summoned=true;
        }
        e.summonCd=8;
      }
      burst(e.x,e.y,e.z,PAL.amber,10,4);
    }
    if(e.phase>=2){
      e.sweepCd-=dt;
      if(e.sweepT>0){
        e.sweepT-=dt;
        if(e.sweepT>0.4){e.sweepX=player.x;e.sweepZ=player.z;}
        else if(!e.sweepHit){
          e.sweepHit=true;
          if(beamHit(e.x,e.z,e.sweepX,e.sweepZ,player.x,player.z,1.2))damagePlayer(25*(DIFF[difficulty]||DIFF[1]).dmg);
          burst(e.sweepX,groundAt(e.sweepX,e.sweepZ)+0.5,e.sweepZ,PAL.red,16,5);sfxAt('sweep',e.x,e.z);
        }
        tracers.push({x0:e.x,y0:e.y+0.8,z0:e.z,x1:e.sweepX,y1:groundAt(e.sweepX,e.sweepZ)+0.4,z1:e.sweepZ,life:0.08});
        if(e.sweepT<=0){e.sweepT=0;e.sweepHit=false;e.sweepCd=7;}
      }else if(e.sweepCd<=0){e.sweepT=1.9;e.sweepHit=false;e.sweepX=player.x;e.sweepZ=player.z;sfx('stinger');}
    }
    if(e.phase===3){
      e.shieldCd-=dt;
      if(e.shieldT>0)e.shieldT=Math.max(0,e.shieldT-dt);
      else if(e.shieldCd<=0){e.shieldT=1.5;e.shieldCd=8;burst(e.x,e.y,e.z,PAL.cyan,14,4);}
    }
    if(d<e.size*0.6+1.0&&e.atkCd<=0){damagePlayer(e.dmg);e.atkCd=1.2;}
    return {ok:true,phase:e.phase,shield:e.shieldT>0,summons};
  }catch(err){return {ok:false,error:String(err&&err.message||err)};}
}
function updateProjectiles(dt){
  for(let i=eproj.length-1;i>=0;i--){
    const p=eproj[i];p.life-=dt;
    if(p.life<=0){eproj.splice(i,1);continue;}
    const spd=Math.hypot(p.vx,p.vy,p.vz)||1;
    const steps=Math.max(1,Math.ceil(spd*dt/0.25));
    let gone=false;
    for(let s=0;s<steps;s++){
      p.x+=p.vx*dt/steps;p.y+=p.vy*dt/steps;p.z+=p.vz*dt/steps;
      if(p.y<groundAt(p.x,p.z)||blockAt(Math.floor(p.x),Math.floor(p.y),Math.floor(p.z))){gone=true;break;}
      const ty=player.y+1.0;
      if(Math.abs(p.y-ty)<1.1&&Math.hypot(p.x-player.x,p.z-player.z)<0.55+p.size){
        damagePlayer(9*DIFF[difficulty].dmg);burst(p.x,p.y,p.z,PAL.magenta,6,3);gone=true;break;
      }
    }
    if(gone)eproj.splice(i,1);
  }
}
