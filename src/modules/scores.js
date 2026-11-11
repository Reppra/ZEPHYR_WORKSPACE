/* ============================ SCORES ============================ */
const SCORES_KEY='sun011_scores',LEGACY_SCORES_KEYS=['sun010_scores','sun009_scores','sun008_scores','sun007_scores'];
function loadScores(){
  try{let raw=localStorage.getItem(SCORES_KEY);
    for(let i=0;i<LEGACY_SCORES_KEYS.length&&!raw;i++)raw=localStorage.getItem(LEGACY_SCORES_KEYS[i]);
    const list=raw?JSON.parse(raw):[];return Array.isArray(list)?list:[];}
  catch(e){return [];}
}
function dedupeScores(list){
  try{
    if(!Array.isArray(list))return {ok:false,error:'not a list'};
    const seen=new Set(),out=[];
    for(const s of list){
      if(!s||typeof s!=='object')continue;
      const k=[s.score|0,s.wave|0,s.kills|0,s.diff||'',s.seed|0,s.date||''].join('|');
      if(seen.has(k))continue;seen.add(k);out.push(s);
    }
    return {ok:true,list:out,removed:list.length-out.length};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function saveScore(entry){
  try{const dd=dedupeScores(loadScores().concat([entry]));const list=dd.ok?dd.list:loadScores().concat([entry]);
    list.sort((a,b)=>(b.score||0)-(a.score||0));
    const top=list.slice(0,10);localStorage.setItem(SCORES_KEY,JSON.stringify(top));return true;}
  catch(e){return false;}
}
function purgeScores(){
  try{
    if(benchRunning)return {ok:false,error:'blocked during benchmark'};
    localStorage.removeItem(SCORES_KEY);
    for(const k of LEGACY_SCORES_KEYS)localStorage.removeItem(k);
    renderScores();
    return {ok:true};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function renderScores(){
  const el=$('hsList');if(!el)return;
  const list=loadScores();
  if(!list.length){el.innerHTML='<span class="empty">NO RUNS YET</span>';return;}
  el.innerHTML=list.map((s,i)=>'<span'+(i===0?' class="top"':'')+'>'+String(i+1).padStart(2,' ')+'. '+String(s.score).padStart(6,' ')+'  W'+String(s.wave).padStart(2,' ')+'  K'+String(s.kills).padStart(3,' ')+'  '+String(s.diff||'-').padEnd(7,' ')+'  '+String(s.date||'')+'</span>').join('\n');
  const ac=$('achCount');if(ac)ac.textContent='ACH '+achUnlocked.length+'/'+Object.keys(ACH).length;
}

