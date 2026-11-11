/* ============================ PERKS ============================ */
const PERKS={
  dmg15:{n:'OVERCHARGE',d:'+15% weapon damage',apply:s=>{s.dmgMul*=1.15;}},
  reload20:{n:'GREASED MAGS',d:'+20% reload speed',apply:s=>{s.relMul*=0.8;}},
  move10:{n:'LIGHTFRAME',d:'+10% move speed',apply:s=>{s.moveMul*=1.10;}},
  hp25:{n:'PLATING',d:'+25 max HP',apply:s=>{s.maxHp+=25;}},
  vamp2:{n:'LEECH ROUNDS',d:'+2 HP per kill',apply:s=>{s.vamp+=2;}},
  jump1:{n:'TESLA COIL',d:'+1 ARC chain jump',apply:s=>{s.arcJumps+=1;}},
  combo2:{n:'FLOW STATE',d:'combo decays 2s slower',apply:s=>{s.comboGrace+=2;}},
  reserve2:{n:'DEEP POCKETS',d:'+2 reserve mags all weapons',apply:s=>{s.resMags+=2;}},
  cdr10:{n:'TRIGGER DISCIPLINE',d:'-10% fire cooldown',apply:s=>{s.cdMul*=0.9;}},
  shieldregen:{n:'PHASE SKIN',d:'shield 1 HP/s after 5s no damage',apply:s=>{s.shieldRegen+=1;}},
  pick20:{n:'MAGNET',d:'pickups last +20s and pull from +2m',apply:s=>{s.pickGrace+=20;}},
  crit10:{n:'WEAKPOINT SCAN',d:'10% chance x2 damage',apply:s=>{s.crit+=0.10;}}
};
const PERK_MAX=3;
G.perks={};G.perkPending=null;G.noDmgT=0;G.critMark=0;
function basePerkStats(){return {dmgMul:1,relMul:1,moveMul:1,maxHp:100,vamp:0,arcJumps:WEAPONS[3].chain.jumps,comboGrace:0,resMags:0,cdMul:1,shieldRegen:0,pickGrace:0,crit:0};}
function recomputePerks(){
  try{
    const s=basePerkStats();
    for(const id of Object.keys(G.perks)){const p=PERKS[id];if(!p)continue;const n=Math.min(PERK_MAX,G.perks[id]|0);for(let i=0;i<n;i++)p.apply(s);}
    G.derived=s;return {ok:true,stats:s};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function perkMaxed(id){return (G.perks[id]|0)>=PERK_MAX;}
function rollPerks(salt){
  try{
    // rng-neutral: choices are a pure function of current seed state (replay determinism)
    const save=G.rng;
    for(let i=0;i<((salt|0)||0);i++)rand01();
    const pool=Object.keys(PERKS).filter(id=>!perkMaxed(id));
    const choices=[];
    while(choices.length<3&&pool.length)choices.push(pool.splice(Math.floor(rand01()*pool.length),1)[0]);
    G.rng=save;
    return {ok:true,choices};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function takePerk(id){
  try{
    if(!PERKS[id])return {ok:false,error:'unknown perk'};
    if(perkMaxed(id))return {ok:false,error:'maxed'};
    G.perks[id]=(G.perks[id]|0)+1;
    recomputePerks();
    if(id==='reserve2'){for(let i=0;i<WEAPONS.length;i++)if(player.res[i]!==Infinity)player.res[i]+=2*WEAPONS[i].mag;}
    if(replayLog&&replayLog.frames)replayLog.frames.push({p:id});
    renderPerkList();
    return {ok:true,id,count:G.perks[id]};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function renderPerkList(){
  const el=$('perkList');if(!el)return;
  const ids=Object.keys(G.perks).filter(id=>G.perks[id]>0);
  el.textContent=ids.length?'PERKS: '+ids.map(id=>PERKS[id].n+' x'+G.perks[id]).join(' · '):'';
}
function showPerkOverlay(choices){
  try{
    const box=$('perkChoices');if(!box)return {ok:false,error:'missing perkChoices'};
    box.innerHTML='';
    for(const id of choices){
      const p=PERKS[id];if(!p)continue;
      const b=document.createElement('button');
      b.className='btn primary perk-btn';b.type='button';
      b.innerHTML='<b>'+p.n+'</b><span>'+p.d+'</span><em>'+t('perkOwned').replace('x',String(G.perks[id]|0))+'</em>';
      b.addEventListener('click',()=>choosePerk(id));
      box.appendChild(b);
    }
    $('perkTitle').textContent=t('perkTitle');$('perkPick').textContent=t('perkPick');
    const rb=$('perkRerollBtn');
    if(rb){const can=hasUnlock('perkReroll')&&!(G.flags&&G.flags.rerollUsed);rb.style.display=can?'inline-flex':'none';rb.textContent=t(can?'perkReroll':'rerollUsed');}
    $('perkOverlay').classList.remove('hidden');
    const first=box.querySelector('button');if(first)first.focus();
    return {ok:true,n:box.children.length};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function choosePerk(id){
  try{
    const r=takePerk(id);if(!r.ok)return r;
    G.perkPending=null;$('perkOverlay').classList.add('hidden');
    paused=false;G.mode='playing';duckMusic(false);requestLock();
    return r;
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function rerollPerks(){
  try{
    if(!hasUnlock('perkReroll'))return {ok:false,error:'locked'};
    if(!G.perkPending)return {ok:false,error:'no pending perk'};
    if(G.flags&&G.flags.rerollUsed)return {ok:false,error:'already used'};
    const r=rollPerks(3);
    if(!r.ok)return r;
    G.flags.rerollUsed=true;
    G.perkPending=r.choices;
    const vis=showPerkOverlay(r.choices);
    return {ok:true,choices:r.choices,shown:vis.ok};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
recomputePerks();

