function canStand(x,z,refY){const ry=refY===undefined?player.y:refY;if(x<2.5||z<2.5||x>ARENA_W-2.5||z>ARENA_D-2.5)return false;
  const g=groundAt(x,z);return g-ry<=1.15;}
function updatePlayer(dt){
  const f=forwardVec();const fx=f[0],fz=f[2];const fl=Math.hypot(fx,fz)||1;
  const fwd=[fx/fl,0,fz/fl],right=[-fwd[2],0,fwd[0]];
  let ix=0,iz=0;
  if(keys['KeyW']||keys['ArrowUp'])iz+=1;if(keys['KeyS']||keys['ArrowDown'])iz-=1;
  if(keys['KeyD']||keys['ArrowRight'])ix+=1;if(keys['KeyA']||keys['ArrowLeft'])ix-=1;
  ix+=touch.mx;iz+=-touch.mz;
  const il=Math.hypot(ix,iz);if(il>1){ix/=il;iz/=il;}
  const sprint=(keys['ShiftLeft']||keys['ShiftRight'])?1.6:1;
  const spd=6.2*sprint*((G.derived&&G.derived.moveMul)||1);
  const wx=(fwd[0]*iz+right[0]*ix)*spd,wz=(fwd[2]*iz+right[2]*ix)*spd;
  player.vx=lerp(player.vx,wx,Math.min(1,dt*12));player.vz=lerp(player.vz,wz,Math.min(1,dt*12));
  let nx=player.x+player.vx*dt,nz=player.z+player.vz*dt;
  if(canStand(nx,player.z))player.x=nx;else player.vx=0;
  if(canStand(player.x,nz))player.z=nz;else player.vz=0;
  const g=groundAt(player.x,player.z);
  if((keys['Space']||touch.jump)&&player.grounded){player.vy=7.2;player.grounded=false;touch.jump=false;}
  player.vy-=22*dt;player.y+=player.vy*dt;
  if(player.y<=g){player.y=g;player.vy=0;player.grounded=true;}
  if(player.y>g+0.05)player.grounded=false;
  player.fireCd=Math.max(0,player.fireCd-dt);player.hurtCd=Math.max(0,player.hurtCd-dt);
  player.rapid=Math.max(0,player.rapid-dt);player.dmgBoost=Math.max(0,player.dmgBoost-dt);
  G.noDmgT+=dt;
  const regen=(G.derived&&G.derived.shieldRegen)||0;
  if(regen>0&&G.noDmgT>=5)player.shield=Math.min(60,player.shield+regen*dt);
  else player.shield=Math.max(0,player.shield-dt*4);
  if(player.reloading>0){player.reloading-=dt;if(player.reloading<=0){
    const wi=player.reloadWi,w=WEAPONS[wi];
    const take=Math.min(w.mag-player.mags[wi],player.res[wi]);
    player.mags[wi]+=take;if(player.res[wi]!==Infinity)player.res[wi]-=take;
    player.reloading=0;
  }}
  if((keys['KeyR'])&&player.mags[player.wi]<WEAPONS[player.wi].mag)reload();
  if(touch.fire||touch.fireTouch||keys['Mouse0'])fire();
}
