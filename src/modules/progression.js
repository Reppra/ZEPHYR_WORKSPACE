/* ============================ META PROGRESSION ============================ */
const META_KEY='sun011_meta',LEGACY_META_KEYS=['sun010_meta','sun009_meta','sun008_meta','sun007_meta'],LEGACY_META_SCORE_KEYS=['sun010_scores','sun009_scores','sun008_scores','sun007_scores'];
let metaState={xp:0,level:1,unlocks:[],flags:{}};
const UNLOCK_DEFS=[
  {level:2,id:'arcJumpMod',label:'uArc'},
  {level:3,id:'goldBiome',label:'uGold'},
  {level:5,id:'perkReroll',label:'uReroll'},
  {level:8,id:'startShield',label:'uShield'}];
const GOLD={name:'GOLD',amp:1.35,border:[0.42,0.30,0.04],accentA:[0.52,0.40,0.06],accentB:[0.46,0.28,0.04],
  baseA:[0.20,0.14,0.03],baseB:[0.32,0.24,0.05],fog:[0.12,0.09,0.02],
  sky:{top:[0.08,0.06,0.01],mid:[0.20,0.15,0.03],bot:[0.16,0.10,0.04],glow:[0.92,0.72,0.12]}};
function xpForLevel(l){const n=Math.max(1,l|0)-1;return 250*n*n;}
function levelFromXp(xp){try{const v=Math.max(0,+xp||0);return Math.max(1,Math.floor(Math.sqrt(v/250))+1);}catch(e){return 1;}}
function hasUnlock(id){return metaState.unlocks.indexOf(id)>=0;}
function biomeDef(i){try{const n=i|0;return (n===1&&hasUnlock('goldBiome')&&SET.goldBiome!==false)?GOLD:(BIOMES[n]||BIOMES[0]);}catch(e){return BIOMES[i]||BIOMES[0];}}
function saveMeta(){
  try{
    localStorage.setItem(META_KEY,JSON.stringify({xp:metaState.xp|0,level:metaState.level|0,unlocks:metaState.unlocks.slice(),flags:Object.assign({},metaState.flags)}));
    return {ok:true,xp:metaState.xp,level:metaState.level};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function applyUnlocks(){
  try{
    const gained=[];
    for(const u of UNLOCK_DEFS){
      if(metaState.level>=u.level&&!hasUnlock(u.id)){metaState.unlocks.push(u.id);gained.push(u.id);}
    }
    return gained;
  }catch(e){return [];}
}
function migrateMeta(){
  try{
    let existing=null;try{existing=localStorage.getItem(META_KEY);}catch(e2){existing=null;}
    if(existing)return {ok:true,migrated:false,added:0,xp:metaState.xp,level:metaState.level,reason:'already'};
    let top=null;
    for(const k of LEGACY_META_SCORE_KEYS){
      let list=null;try{list=JSON.parse(localStorage.getItem(k)||'null');}catch(e3){list=null;}
      if(!Array.isArray(list))continue;
      for(const s of list){const v=s?(s.score|0):0;if(top===null||v>top)top=v;}
    }
    if(top===null)return {ok:true,migrated:false,added:0,xp:metaState.xp,level:metaState.level,reason:'no-legacy'};
    const add=250+Math.floor(Math.max(0,top)/1000);
    metaState.xp+=add;metaState.level=levelFromXp(metaState.xp);applyUnlocks();
    metaState.flags.migrated8=true;
    saveMeta();renderMeta();
    try{console.info('[meta] migrated legacy scores top='+top+' xp+'+add+' total='+metaState.xp+' level='+metaState.level);}catch(e4){}
    return {ok:true,migrated:true,added:add,top,xp:metaState.xp,level:metaState.level};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function loadMeta(){
  try{
    let raw=null;try{raw=localStorage.getItem(META_KEY);}catch(e2){raw=null;}
    for(let i=0;i<LEGACY_META_KEYS.length&&!raw;i++){try{raw=localStorage.getItem(LEGACY_META_KEYS[i]);}catch(e3){}}
    if(raw){
      let d=null;try{d=JSON.parse(raw);}catch(e3){d=null;}
      if(d&&typeof d==='object'){
        metaState={xp:Math.max(0,d.xp|0),level:1,unlocks:Array.isArray(d.unlocks)?d.unlocks.filter(id=>UNLOCK_DEFS.some(u=>u.id===id)):[],flags:(d.flags&&typeof d.flags==='object')?d.flags:{}};
        metaState.level=levelFromXp(metaState.xp);
        applyUnlocks();
        renderMeta();
        try{if(!localStorage.getItem(META_KEY))saveMeta();}catch(e4){}
        return {ok:true,xp:metaState.xp,level:metaState.level,migrated:!!metaState.flags.migrated8};
      }
    }
    metaState={xp:0,level:1,unlocks:[],flags:{}};
    const m=migrateMeta();
    renderMeta();
    return {ok:!!m.ok,xp:metaState.xp,level:metaState.level,migrated:!!m.migrated,error:m.error};
  }catch(e){metaState={xp:0,level:1,unlocks:[],flags:{}};return {ok:false,error:String(e&&e.message||e)};}
}
function metaAward(score,wave,kills,daily){
  try{
    const xp=Math.floor((+score||0)/100)+Math.max(0,wave|0)*10+Math.max(0,kills|0)*2+(daily?50:0);
    const before=metaState.level;
    metaState.xp+=xp;
    metaState.level=levelFromXp(metaState.xp);
    const gained=applyUnlocks();
    saveMeta();renderMeta();
    const levelUp=metaState.level>before;
    try{console.info('[meta] award xp+'+xp+' total='+metaState.xp+' level='+metaState.level);}catch(e2){}
    if(levelUp&&!benchRunning){
      showBanner(t('levelUp')+' -> '+metaState.level,t('xp')+' '+metaState.xp);
      showToast(t('levelUp')+' -> '+metaState.level);sfx('pickup');
    }
    return {ok:true,xp,level:metaState.level,levelUp,unlocks:gained,xpTotal:metaState.xp};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function unlockLevel(id){
  try{
    const def=UNLOCK_DEFS.find(u=>u.id===id);
    if(!def)return {ok:false,error:'unknown unlock'};
    if(hasUnlock(id))return {ok:true,id,level:def.level,already:true};
    if(metaState.level<def.level)return {ok:false,error:'locked',need:def.level,level:metaState.level};
    metaState.unlocks.push(id);saveMeta();renderMeta();
    return {ok:true,id,level:def.level};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function renderMeta(){
  try{
    const lv=metaState.level|0,xp=Math.max(0,metaState.xp|0),nx=xpForLevel(lv+1);
    const b=$('metaBadge');if(b)b.textContent=t('lvl')+' '+lv+' · '+xp+'/'+nx+' XP';
    const box=$('unlocksPanel');
    if(box)box.innerHTML=UNLOCK_DEFS.map(u=>{
      const got=hasUnlock(u.id);
      return '<div class="unlock'+(got?' got':'')+'">'+(got?'✓':t('lvl')+' '+u.level)+' · '+t(u.label)+'</div>';
    }).join('');
    const rb=$('perkRerollBtn');
    if(rb){
      const can=hasUnlock('perkReroll')&&!(G.flags&&G.flags.rerollUsed);
      rb.style.display=can?'inline-flex':'none';
    }
    return {ok:true,level:lv,xp,next:nx};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}

