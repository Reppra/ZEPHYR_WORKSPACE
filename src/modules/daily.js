/* ============================ DAILY CHALLENGE ============================ */
const DAILY_KEY='sun011_daily',LEGACY_DAILY_KEYS=['sun010_daily','sun009_daily','sun008_daily'];
function dailySeedAt(dateStr){
  try{
    const d=dateStr===undefined?new Date():new Date(dateStr);
    if(isNaN(d.getTime()))return {ok:false,error:'bad date'};
    const ymd=d.getUTCFullYear()*10000+(d.getUTCMonth()+1)*100+d.getUTCDate();
    return {ok:true,seed:K.hash2(ymd,1337)>>>0,ymd};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function dailySeed(){const r=dailySeedAt();return r.ok?r.seed:0;}
function makeShareCode(seed,score,kills,wave){
  try{
    seed=seed|0;score=score|0;kills=kills|0;wave=wave|0;
    const runHash=K.hash3(seed,score,(kills*1000+wave)|0)>>>0;
    const code=[(seed>>>0).toString(36),score.toString(36),kills.toString(36),wave.toString(36),runHash.toString(36)].join('-');
    return {ok:true,code,hash:runHash};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function verifyDaily(code){
  try{
    const parts=String(code==null?'':code).trim().toLowerCase().split('-');
    if(parts.length!==5)return {ok:false,error:'bad code'};
    const seed=parseInt(parts[0],36),score=parseInt(parts[1],36),kills=parseInt(parts[2],36),wave=parseInt(parts[3],36),hash=parseInt(parts[4],36);
    if([seed,score,kills,wave,hash].some(n=>!isFinite(n)||n<0))return {ok:false,error:'bad code'};
    const want=K.hash3(seed|0,score|0,(kills*1000+wave)|0)>>>0;
    if(want!==(hash>>>0))return {ok:false,error:'bad hash'};
    if((seed>>>0)!==dailySeed())return {ok:false,error:'wrong day'};
    return {ok:true,score,kills,waves:wave,seed:seed>>>0};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function dailyBest(){
  try{
    const r=dailySeedAt();if(!r.ok)return {ok:false,error:r.error};
    let list=[];try{let raw=localStorage.getItem(DAILY_KEY);for(let i=0;i<LEGACY_DAILY_KEYS.length&&!raw;i++)raw=localStorage.getItem(LEGACY_DAILY_KEYS[i]);list=raw?JSON.parse(raw):[];}catch(e2){list=[];}
    if(!Array.isArray(list))list=[];
    const entry=list.find(x=>x&&x.date===r.ymd)||null;
    return {ok:true,entry,ymd:r.ymd};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function saveDaily(entry){
  try{
    if(benchRunning)return {ok:false,error:'blocked during benchmark'};
    if(!entry||typeof entry.date!=='number')return {ok:false,error:'bad entry'};
    let list=[];try{let raw=localStorage.getItem(DAILY_KEY);for(let i=0;i<LEGACY_DAILY_KEYS.length&&!raw;i++)raw=localStorage.getItem(LEGACY_DAILY_KEYS[i]);list=raw?JSON.parse(raw):[];}catch(e2){list=[];}
    if(!Array.isArray(list))list=[];
    const prev=list.find(x=>x&&x.date===entry.date)||null;
    list=list.filter(x=>x&&x.date!==entry.date);
    list.push(prev&&(prev.score|0)>(entry.score|0)?prev:entry);
    list.sort((a,b)=>(b.date||0)-(a.date||0));
    list=list.slice(0,30);
    localStorage.setItem(DAILY_KEY,JSON.stringify(list));
    return {ok:true,kept:list.length,score:(prev&&(prev.score|0)>(entry.score|0)?prev:entry).score};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function renderDaily(){
  try{
    const sv=$('dailySeedVal');if(sv)sv.textContent=String(dailySeed());
    const bv=$('dailyBestVal');
    if(bv){const b=dailyBest();bv.textContent=b.ok&&b.entry?(b.entry.score+' · W'+b.entry.waves+' · K'+b.entry.kills):t('dailyNone');}
    return {ok:true};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function startDaily(){
  try{
    const r=startGame({daily:true});
    return r;
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}

