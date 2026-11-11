function showBanner(big,sub){G.banner=2.2;G.bannerText=big;G.bannerSub=sub;const b=$('waveBanner');$('waveBig').textContent=big;$('waveSub').textContent=sub;b.style.opacity='1';}
function showToast(txt){G.toast=1.6;G.toastText=txt;const t=$('powerToast');t.textContent=txt;t.style.opacity='1';}
function burst(x,y,z,col,n,spd){for(let i=0;i<n;i++){const a=rand01()*6.283,e=(rand01()-0.5)*3.14;const s=spd*(0.4+rand01());
  particles.push({x,y,z,vx:Math.cos(a)*Math.cos(e)*s,vy:Math.sin(e)*s+1.5,vz:Math.sin(a)*Math.cos(e)*s,life:0.5+rand01()*0.5,max:1,size:0.12+rand01()*0.18,col,glow:1});}}
function wallRayT(eye,dir,maxT){
  for(let t=0.5;t<maxT;t+=0.4){const px=eye[0]+dir[0]*t,py=eye[1]+dir[1]*t,pz=eye[2]+dir[2]*t;
    if(blockAt(Math.floor(px),Math.floor(py),Math.floor(pz)))return t;}
  return maxT;
}
function rayHits(eye,dir,maxT){
  const hits=[];
  for(const e of enemies){
    const oc=[e.x-eye[0],e.y-eye[1],e.z-eye[2]];const t=v3dot(oc,dir);if(t<0||t>maxT)continue;
    const px=eye[0]+dir[0]*t,py=eye[1]+dir[1]*t,pz=eye[2]+dir[2]*t;
    const d2=(px-e.x)**2+(py-e.y)**2+(pz-e.z)**2;const rad=e.size*0.75+0.25;
    if(d2<rad*rad)hits.push({e,t});
  }
  hits.sort((a,b)=>a.t-b.t);
  return hits;
}
function applyDamage(e,dmg){
  try{
    if(!e)return {ok:false,error:'no target'};
    if(e.boss&&e.shieldT>0){e.flash=0.06;return {ok:true,dealt:0,hp:e.hp,shield:0,absorbed:true};}
    let d=Math.max(0,Math.round(e.shielded?dmg*0.45:dmg));if(!d)return {ok:false,error:'zero damage'};
    let dealt=0;
    if(e.elite==='shield'&&e.shieldHp>0){
      const absorb=Math.min(e.shieldHp,d*0.5);
      e.shieldHp-=absorb;e.shieldCd=4;dealt+=absorb;d-=absorb;
    }
    if(d>0){e.hp-=d;dealt+=d;}
    e.flash=0.12;G.hitmark=1;
    if(e.hp<=0)killEnemy(e);
    return {ok:true,dealt:Math.round(dealt),hp:e.hp,shield:Math.round(e.shieldHp||0)};
  }catch(err){return {ok:false,error:String(err&&err.message||err)};}
}
function telemetryRecord(kind,val){
  try{
    if(kind==='kill'){
      const e=val;if(!e||typeof e.type!=='number'||G.killsBy[e.type]===undefined)return {ok:false,error:'bad kill target'};
      G.killsBy[e.type]++;return {ok:true,type:e.type,count:G.killsBy[e.type]};
    }
    if(kind==='damage'){const n=Math.max(0,+val||0);G.dmgTaken+=n;return {ok:true,dmgTaken:G.dmgTaken};}
    if(kind==='shot'){const wi=val|0;if(G.wshots[wi]===undefined)return {ok:false,error:'bad weapon'};G.shots++;G.wshots[wi]++;return {ok:true,shots:G.shots};}
    if(kind==='hit'){const wi=val|0;if(G.whits[wi]===undefined)return {ok:false,error:'bad weapon'};G.hits++;G.whits[wi]++;return {ok:true,hits:G.hits};}
    if(kind==='lights_throttled'){G.lightsThrottled=(G.lightsThrottled||0)+1;return {ok:true,events:G.lightsThrottled,cap:val|0};}
    if(kind==='input_sanitized'||kind==='input_high_hz'||kind==='nan_firewall'||kind==='ghost_touch'){
      const key='tel_'+(kind==='input_sanitized'?'sanitized':kind==='input_high_hz'?'highhz':kind==='nan_firewall'?'nan':'ghost');
      G.flags[key]=(G.flags[key]||0)+1;
      return {ok:true,kind:kind,count:G.flags[key],val:val&&typeof val==='object'?Object.assign({},val):val};
    }
    return {ok:false,error:'unknown kind'};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function telemetrySummary(){
  try{
    const acc=wi=>{const s=G.wshots[wi]||0;return s?Math.round((G.whits[wi]||0)/s*100):0;};
    return {ok:true,shots:G.shots,hits:G.hits,acc:G.shots?Math.round(G.hits/G.shots*100):0,dmgTaken:Math.round(G.dmgTaken||0),
      kills:G.kills,killsBy:(G.killsBy||[]).slice(),wshots:(G.wshots||[]).slice(),whits:(G.whits||[]).slice(),lightsThrottled:G.lightsThrottled||0,
      weaponAcc:[acc(0),acc(1),acc(2),acc(3)]};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
