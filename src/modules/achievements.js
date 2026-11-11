/* ============================ ACHIEVEMENTS ============================ */
const ACH={firstblood:'FIRST BLOOD',wave5:'WAVE 5',warden:'WARDEN DOWN',chain8:'CHAIN x8',untouched:'UNTOUCHED',rampage50:'RAMPAGE 50',triple:'TRIPLE RAIL',pyre:'PYRE DOWN',chain4:'FULL CHAIN'};
const ACH_KEY='sun011_ach',LEGACY_ACH_KEYS=['sun010_ach','sun009_ach','sun008_ach'];
let achUnlocked=[];
function loadAch(){
  try{
    let raw=localStorage.getItem(ACH_KEY);
    for(let i=0;i<LEGACY_ACH_KEYS.length&&!raw;i++){try{raw=localStorage.getItem(LEGACY_ACH_KEYS[i]);}catch(e2){}}
    const list=raw?JSON.parse(raw):[];
    achUnlocked=[...new Set((Array.isArray(list)?list:[]).filter(x=>typeof x==='string'&&ACH[x]))];
    const ac=$('achCount');if(ac)ac.textContent='ACH '+achUnlocked.length+'/'+Object.keys(ACH).length;
    return achUnlocked.slice();
  }catch(e){achUnlocked=[];return [];}
}
function unlockAch(id){
  try{
    if(!ACH[id]||achUnlocked.indexOf(id)>=0)return {ok:false,error:'already unlocked or unknown id'};
    achUnlocked.push(id);
    try{localStorage.setItem(ACH_KEY,JSON.stringify(achUnlocked));}catch(e2){}
    const ac=$('achCount');if(ac)ac.textContent='ACH '+achUnlocked.length+'/'+Object.keys(ACH).length;
    showToast('ACH '+ACH[id]);sfx('pickup');
    return {ok:true,id,count:achUnlocked.length};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}

