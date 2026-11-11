/* ============================ SETTINGS ============================ */
const DEFAULT_SETTINGS={sens:1.0,sensX:1.0,sensY:1.0,deadzone:0.12,tapFire:true,fireZone:0.45,lefty:false,vol:0.5,invertY:false,minimap:true,music:true,quality:'auto',lang:'',reducedMotion:false,highContrast:false,colorblind:false,autotune:false,haptics:true,goldBiome:true};
const SETTINGS_KEY='sun011_settings',LEGACY_SETTINGS_KEYS=['sun010_settings','sun009_settings','sun008_settings','sun007_settings'];
function sanitizeSettings(o){
  const d=Object.assign({},DEFAULT_SETTINGS);
  try{
    if(!o||typeof o!=='object')return d;
    const num=v=>{const n=+v;return Number.isFinite(n)?n:null;};
    const sens=num(o.sens),vol=num(o.vol);
    if(sens!==null)d.sens=Math.min(2.5,Math.max(0.3,sens));
    if(vol!==null)d.vol=Math.min(1,Math.max(0,vol));
    if(typeof o.invertY==='boolean')d.invertY=o.invertY;
    if(typeof o.minimap==='boolean')d.minimap=o.minimap;
    if(typeof o.music==='boolean')d.music=o.music;
    if(typeof o.quality==='string'&&['auto','low','high'].indexOf(o.quality)>=0)d.quality=o.quality;
    if(typeof o.lang==='string'&&['','en','de'].indexOf(o.lang)>=0)d.lang=o.lang;
    if(typeof o.reducedMotion==='boolean')d.reducedMotion=o.reducedMotion;
    if(typeof o.highContrast==='boolean')d.highContrast=o.highContrast;
    if(typeof o.colorblind==='boolean')d.colorblind=o.colorblind;
    if(typeof o.autotune==='boolean')d.autotune=o.autotune;
    if(typeof o.haptics==='boolean')d.haptics=o.haptics;
    if(typeof o.goldBiome==='boolean')d.goldBiome=o.goldBiome;
    if(typeof o.tapFire==='boolean')d.tapFire=o.tapFire;
    const fz=num(o.fireZone);
    if(fz!==null)d.fireZone=Math.min(0.6,Math.max(0.25,fz));
    const sx=num(o.sensX),sy=num(o.sensY);
    if(sx!==null)d.sensX=Math.min(3,Math.max(0.2,sx));
    if(sy!==null)d.sensY=Math.min(3,Math.max(0.2,sy));
    const dz=num(o.deadzone);
    if(dz!==null)d.deadzone=Math.min(0.3,Math.max(0,dz));
    if(typeof o.lefty==='boolean')d.lefty=o.lefty;
  }catch(e){}
  return d;
}
function loadSettings(){
  try{
    let raw=localStorage.getItem(SETTINGS_KEY);
    for(let i=0;i<LEGACY_SETTINGS_KEYS.length&&!raw;i++){try{raw=localStorage.getItem(LEGACY_SETTINGS_KEYS[i]);}catch(e2){}}
    if(!raw){
      const d=Object.assign({},DEFAULT_SETTINGS);
      try{d.reducedMotion=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);}catch(e3){}
      return d;
    }
    return sanitizeSettings(JSON.parse(raw));
  }catch(e){return Object.assign({},DEFAULT_SETTINGS);}
}
function saveSettings(){
  if(benchRunning)return false;
  try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(SET));return true;}
  catch(e){return false;}
}
let SET=loadSettings();
sensitivity=SET.sens;
loadAch();
loadMeta();

