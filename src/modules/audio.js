/* ============================ AUDIO ============================ */
let AC=null,master=null,musicGain=null;
function applyGain(){try{if(master)master.gain.value=muted?0:0.5*SET.vol;}catch(e){}}
function ensureAudio(){if(AC)return;try{AC=new (window.AudioContext||window.webkitAudioContext)();master=AC.createGain();applyGain();master.connect(AC.destination);
  musicGain=AC.createGain();musicGain.gain.value=0.7;musicGain.connect(master);}catch(e){}}
function setMuted(m){muted=m;applyGain();if(m)haltMusic();else if(musicWanted&&SET.music&&AC&&!benchRunning)startMusic();$('muteBtn').classList.toggle('muted',m);$('muteLbl').textContent=m?t('muteOff'):t('muteOn');}
function tone(freq,dur,type,vol,slide){if(!AC||muted)return;const o=AC.createOscillator(),g=AC.createGain();o.type=type||'square';o.frequency.value=freq;
  if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(20,slide),AC.currentTime+dur);
  g.gain.value=vol||0.2;g.gain.exponentialRampToValueAtTime(0.001,AC.currentTime+dur);o.connect(g);g.connect(master);o.start();o.stop(AC.currentTime+dur);}
function noiseBurst(dur,vol){if(!AC||muted)return;const n=AC.sampleRate*dur|0;const buf=AC.createBuffer(1,n,AC.sampleRate);const d=buf.getChannelData(0);
  for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n);const s=AC.createBufferSource();s.buffer=buf;const g=AC.createGain();g.gain.value=vol||0.2;s.connect(g);g.connect(master);s.start();}
function sfx(name){if(!AC||muted||benchRunning)return;switch(name){
  case 'shoot':tone(880,0.09,'square',0.16,220);noiseBurst(0.05,0.08);break;
  case 'stinger':tone(620,0.12,'sawtooth',0.12,180);break;
  case 'boss':tone(110,0.9,'sawtooth',0.3,30);tone(220,0.7,'square',0.15,80);break;
  case 'hit':tone(300,0.06,'square',0.14,180);break;
  case 'kill':tone(520,0.18,'sawtooth',0.2,120);tone(780,0.14,'square',0.1,260);break;
  case 'hurt':tone(140,0.25,'sawtooth',0.28,60);noiseBurst(0.12,0.14);break;
  case 'wave':tone(440,0.3,'triangle',0.2,880);tone(660,0.3,'triangle',0.12,990);break;
  case 'pickup':tone(660,0.12,'triangle',0.18,1320);break;
  case 'reload':tone(200,0.08,'square',0.1,400);break;
  case 'scatter':noiseBurst(0.09,0.2);tone(180,0.12,'square',0.2,60);break;
  case 'rail':tone(1400,0.25,'sawtooth',0.2,90);noiseBurst(0.06,0.12);break;
  case 'arc':tone(880,0.04,'sawtooth',0.25);tone(1320,0.04,'sawtooth',0.25);tone(1760,0.04,'sawtooth',0.25);break;
  case 'over':tone(330,0.7,'sawtooth',0.25,55);break;}}
const MUSIC={
  menu:{bpm:72,root:220,type:'triangle',dur:0.40,vol:0.055,steps:[0,7,3,10,0,5,12,7]},
  combat:{bpm:132,root:174.61,type:'square',dur:0.15,vol:0.040,steps:[0,7,12,15,12,7,3,10]},
  boss:{bpm:96,root:110,type:'sawtooth',dur:0.22,vol:0.050,steps:[0,1,6,7,0,3,6,1]}};
let musicTimer=null,musicMode='menu',musicStep=0,musicWanted=false;
function musicModeFor(){
  try{
    if(!gameStarted||G.mode==='menu'||G.mode==='over')return 'menu';
    if(enemies.some(e=>e.boss))return 'boss';
    return enemies.length>0?'combat':'menu';
  }catch(e){return 'menu';}
}
function haltMusic(){if(musicTimer!==null){clearTimeout(musicTimer);musicTimer=null;}}
function stopMusic(){haltMusic();musicWanted=false;return {ok:true,playing:false};}
function stepMusic(){
  musicTimer=null;
  if(!AC||muted||!SET.music||benchRunning)return {ok:true,playing:false,reason:'guarded'};
  if(MD.on)return {ok:true,playing:false,reason:'director'};
  try{
    const mode=musicModeFor(),m=MUSIC[mode]||MUSIC.menu;
    if(mode!==musicMode){musicMode=mode;musicStep=0;}
    const semis=m.steps[musicStep%m.steps.length];musicStep++;
    const freq=m.root*Math.pow(2,semis/12);
    const o=AC.createOscillator(),g=AC.createGain();
    o.type=m.type;o.frequency.value=freq;
    g.gain.setValueAtTime(0.0001,AC.currentTime);
    g.gain.exponentialRampToValueAtTime(m.vol,AC.currentTime+0.02);
    g.gain.exponentialRampToValueAtTime(0.0001,AC.currentTime+m.dur);
    o.connect(g);g.connect(musicGain||master);
    o.start();o.stop(AC.currentTime+m.dur+0.05);
    musicTimer=setTimeout(stepMusic,Math.max(60,(60/m.bpm)*1000/2));
    return {ok:true,playing:true,mode,freq,step:musicStep};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function startMusic(){
  if(!AC||muted||!SET.music||benchRunning)return {ok:false,error:'music gated (ctx/mute/off/bench)'};
  musicWanted=true;
  if(musicTimer!==null)return {ok:true,already:true,mode:musicMode};
  musicMode=musicModeFor();musicStep=0;
  return stepMusic();
}
const MD={bpm:112,step:0,next:0,on:false,intensity:0,layers:{bass:false,arp:false,pad:false,lead:false}};
const MD_ROOTS=[55,65.41,41.2,49];
const MD_SCALE=[55,65.41,73.42,82.41,98,110,130.81,146.83];
const MD_MELODY=[440,523.25,587.33,659.25,587.33,523.25,440,392,440,523.25,659.25,587.33,523.25,440,392,329.63];
function musicState(){
  try{return {ok:true,playing:MD.on,bpm:MD.bpm,intensity:MD.intensity,layers:Object.assign({},MD.layers)};}
  catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function setIntensity(v){
  try{
    MD.intensity=clamp(+v||0,0,1);
    MD.layers.bass=true;MD.layers.arp=MD.intensity>0.35;MD.layers.pad=enemies.some(e=>e.boss);MD.layers.lead=MD.intensity>0.7;
    return {ok:true,intensity:MD.intensity,layers:Object.assign({},MD.layers)};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function computeIntensity(){
  try{return clamp(0.25+G.wave*0.05+(enemies.some(e=>e.boss)?0.25:0)+(player.hp<35?0.2:0)+(G.combo>=5?0.1:0),0,1);}
  catch(e){return 0.25;}
}
function startMusicDirector(){
  try{
    haltMusic();
    MD.on=true;MD.step=0;MD.next=AC?AC.currentTime+0.05:0;
    setIntensity(computeIntensity());
    return {ok:true,on:true,bpm:MD.bpm};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function stopMusicDirector(){MD.on=false;return {ok:true,on:false};}
function mdTone(freq,dur,type,vol,at){
  const o=AC.createOscillator(),g=AC.createGain();
  o.type=type;o.frequency.value=freq;
  g.gain.setValueAtTime(0.0001,at);
  g.gain.exponentialRampToValueAtTime(vol,at+0.015);
  g.gain.exponentialRampToValueAtTime(0.0001,at+dur);
  o.connect(g);g.connect(musicGain||master);
  o.start(at);o.stop(at+dur+0.05);
}
function scheduleStep(step){
  try{
    if(!AC||muted||benchRunning||AC.state!=='running')return {ok:true,silent:true,step};
    const at=Math.max(MD.next,AC.currentTime),bar=Math.floor(step/4);
    if(MD.layers.bass&&step%4===0)mdTone(MD_ROOTS[bar%4],0.11,'triangle',0.20,at);
    if(MD.layers.arp&&step%2===0)mdTone(MD_SCALE[(step/2)%8]*4,0.06,'square',0.07,at);
    if(MD.layers.pad&&step%16===0){const r=MD_ROOTS[bar%4]*2;mdTone(r,1.8,'sine',0.05,at);mdTone(r*1.005,1.8,'sine',0.05,at);}
    if(MD.layers.lead)mdTone(MD_MELODY[step%16],0.09,'sawtooth',0.06,at);
    return {ok:true,step,at};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function tickMusicDirector(){
  try{
    if(!MD.on||!AC)return {ok:true,on:MD.on,scheduled:0};
    let n=0;
    while(MD.next<=AC.currentTime+0.12&&n<8){scheduleStep(MD.step++);MD.next+=60/MD.bpm/2;n++;}
    if(MD.next<AC.currentTime-0.5)MD.next=AC.currentTime+0.05;
    return {ok:true,scheduled:n};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function duckMusic(duck){
  try{
    if(!AC||!musicGain)return {ok:true,silent:true,duck:!!duck};
    const target=duck?0.175:0.7;
    musicGain.gain.cancelScheduledValues(AC.currentTime);
    musicGain.gain.setValueAtTime(musicGain.gain.value,AC.currentTime);
    musicGain.gain.linearRampToValueAtTime(target,AC.currentTime+0.3);
    return {ok:true,duck:!!duck,target};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
const SFXAT_MAP={tshot:{f:620,d:0.12,type:'sawtooth',v:0.12,slide:180},windup:{f:200,d:0.3,type:'sawtooth',v:0.14,slide:700},hum:{f:110,d:0.5,type:'sine',v:0.08},sweep:{f:1400,d:0.25,type:'sawtooth',v:0.16,slide:90}};
function sfxAt(name,x,z){
  try{
    const pan=clamp((x-player.x)/24,-1,1),dist=Math.hypot(x-player.x,z-player.z);
    const s=SFXAT_MAP[name];if(!s)return {ok:false,error:'unknown sfx',pan,dist};
    if(!AC||muted||benchRunning||AC.state!=='running')return {ok:true,silent:true,pan,dist};
    const g=AC.createGain();g.gain.value=s.v/(1+dist/14);
    let out=g;
    if(AC.createStereoPanner){const p=AC.createStereoPanner();p.pan.value=pan;g.connect(p);out=p;}
    out.connect(master);
    const o=AC.createOscillator();o.type=s.type;o.frequency.value=s.f;
    if(s.slide)o.frequency.exponentialRampToValueAtTime(Math.max(20,s.slide),AC.currentTime+s.d);
    g.gain.exponentialRampToValueAtTime(0.001,AC.currentTime+s.d);
    o.connect(g);o.start();o.stop(AC.currentTime+s.d);
    return {ok:true,pan,dist};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}

