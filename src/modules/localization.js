/* ============================ I18N + A11Y ============================ */
const STR={
  en:{eyebrow:'NEON ARENA · WAVE SURVIVAL · WEBGL2 + WASM',
    tagline:'Hold the arena against escalating waves of neon drones. Chain kills for combo multipliers, grab power-ups, and survive as long as you can. Built clean from zero — a stateless WASM math kernel drives the procedural arena.',
    difficulty:'DIFFICULTY',easy:'EASY',normal:'NORMAL',hard:'HARD',sensitivity:'MOUSE SENSITIVITY',seed:'RUN SEED',blankRandom:'BLANK = RANDOM',randomPh:'random',
    enter:'ENTER WORLD',benchmark:'BENCHMARK',benchAria:'Run benchmark',importReplay:'IMPORT REPLAY',bestRuns:'BEST RUNS · TOP 10',
    exportJson:'EXPORT JSON',exportAria:'Export JSON',copyResults:'COPY RESULTS',
    settings:'SETTINGS',volume:'VOLUME',invertY:'INVERT Y',minimap:'MINIMAP',music:'MUSIC',quality:'QUALITY',auto:'AUTO',low:'LOW',high:'HIGH',
    language:'LANGUAGE',reducedMotion:'REDUCED MOTION',highContrast:'HIGH CONTRAST',colorblind:'COLORBLIND',autotune:'AUTOTUNE',haptics:'HAPTICS',
    photo:'PHOTO',photoAria:'Capture photo',photoSaved:'PHOTO SAVED',photoFailed:'PHOTO FAILED',
    clearScores:'CLEAR SCORES',purgeConfirm:'CONFIRM?',scoresCleared:'SCORES CLEARED',
    suspended:'SIMULATION SUSPENDED',paused:'PAUSED',resume:'RESUME',menu:'MENU',pauseHint:'Pointer released. Click RESUME to re-enter the arena.',
    signalLost:'SIGNAL LOST',gameOver:'GAME OVER',kills:'KILLS',accuracy:'ACCURACY',survived:'SURVIVED',best:'BEST',seedShort:'SEED',dmgTaken:'DMG TAKEN',
    retry:'RETRY',exportReplay:'EXPORT REPLAY',pause:'PAUSE',muteAria:'Toggle sound',pauseAria:'Pause game',
    score:'SCORE',wave:'WAVE',combo:'COMBO',warden:'WARDEN',fire:'FIRE',jump:'JUMP',rld:'RLD',muteOn:'SOUND ON',muteOff:'SOUND OFF',
    lanceProtocol:'LANCE PROTOCOL',lanceSub:'MARKSMAN UNIT — BREAK LINE OF SIGHT',lanceDown:'LANCE DOWN +300',lance:'LANCE',
    wardenProtocol:'WARDEN PROTOCOL',wardenSub:'ELITE UNIT DETECTED',
    hiveProtocol:'HIVE PROTOCOL',hiveSub:'SWARM CARRIER — KILL THE NEST',hiveDown:'HIVE DOWN +350',hive:'HIVE',swarm:'SWARM',
    turretName:'TURRET',dashName:'DASH',shielderName:'SHIELDER',archDown:'DOWN',
    pyreProtocol:'PYRE PROTOCOL',pyreSub:'FURNACE CORE — BREAK THE SHIELD CYCLE',pyre:'PYRE',pyreDown:'PYRE DOWN +400',pyreEnrage:'ENRAGE',
    arcName:'ARC',arcReady:'ARC ONLINE',
    perkTitle:'UPGRADE',perkPick:'CHOOSE ONE',perkOwned:'OWNED x',
    hostilesInbound:'HOSTILES INBOUND',sector:'SECTOR',waveCleared:'WAVE CLEARED',bonus:'BONUS',
    noAmmo:'NO AMMO',pickupHealth:'+30 HEALTH',rapidFire:'RAPID FIRE',shield:'SHIELD',doubleDamage:'DOUBLE DAMAGE',ammoCell:'AMMO CELL',
    minimapOn:'MINIMAP ON',minimapOff:'MINIMAP OFF',wardenDown:'WARDEN DOWN +250',ach:'ACH',reloading:'RELOADING…',
    cooldown:'COOLDOWN — WAIT A MOMENT',lockIssue:'POINTER LOCK ISSUE — CLICK AGAIN',
    lockNotBoom:'POINTER LOCK - TAP STREAM CAPTURED',meshCooled:'MESH COOLED - SANDBOX SAFE MODE',
    running:'RUNNING…',ready:'READY',noRuns:'NO RUNS YET',
    replayEmpty:'NO REPLAY DATA',replayImported:'REPLAY LOADED',replayInvalid:'INVALID REPLAY FILE',replayExported:'REPLAY SAVED',
    watch:'WATCH',pbTitle:'PLAYBACK',pbPlay:'PLAY',pbSpeed:'SPEED',pbExit:'EXIT',pbMatch:'RUN VERIFIED',pbMismatch:'DESYNC DETECTED',pbDone:'PLAYBACK DONE',pbLegacy:'LEGACY REPLAY — NORMAL DIFFICULTY ASSUMED',
    pbCam:'CAM',pbCamFirst:'FIRST',pbCamThird:'THIRD',pbCamFree:'FREE',pbCamHint:'FREE CAM — DRAG TO ORBIT · WHEEL / PINCH TO ZOOM · C TO CYCLE',
    dailyTitle:'DAILY CHALLENGE',dailySeedLbl:"TODAY'S SEED",dailyBestLbl:'BEST TODAY',dailyVerify:'VERIFY',dailyPlay:'PLAY DAILY',dailyCodePh:'paste code',dailyShare:'SHARE CODE',dailyCopy:'COPY CODE',dailyVerified:'VERIFIED',dailyInvalid:'INVALID CODE',dailyCopied:'CODE COPIED',dailyNone:'NO RUN TODAY',
    lvl:'LV',unlocks:'UNLOCKS',levelUp:'LEVEL UP',xp:'XP',perkReroll:'REROLL',rerollUsed:'REROLL USED',
    uArc:'ARC CHAIN +1',uGold:'GOLD BIOME',uReroll:'PERK REROLL',uShield:'START SHIELD 25',
    tapFire:'TAP FIRE',fireZone:'FIRE ZONE',fireZoneHint:'LEFT SIDE TAPS FIRE',zoneTint:'FIRE ZONE',
    sensX:'SENS X',sensY:'SENS Y',deadzone:'DEADZONE',lefty:'LEFT-HANDED'},
  de:{eyebrow:'NEON-ARENA · WELLEN-ÜBERLEBEN · WEBGL2 + WASM',
    tagline:'Halte die Arena gegen eskalierende Wellen von Neon-Drohnen. Verkette Abschüsse für Kombo-Multiplikatoren, sammle Power-ups und überlebe so lange wie möglich. Von Grund auf neu gebaut — ein zustandsloser WASM-Mathekern erzeugt die prozedurale Arena.',
    difficulty:'SCHWIERIGKEIT',easy:'LEICHT',normal:'NORMAL',hard:'SCHWER',sensitivity:'MAUS-EMPFINDLICHKEIT',seed:'LAUF-SEED',blankRandom:'LEER = ZUFÄLLIG',randomPh:'zufall',
    enter:'WELT BETRETEN',benchmark:'BENCHMARK',benchAria:'Benchmark ausführen',importReplay:'REPLAY IMPORTIEREN',bestRuns:'BESTE LÄUFE · TOP 10',
    exportJson:'JSON EXPORT',exportAria:'JSON exportieren',copyResults:'ERGEBNISSE KOPIEREN',
    settings:'EINSTELLUNGEN',volume:'LAUTSTÄRKE',invertY:'Y-ACHSE UMKEHREN',minimap:'MINIKARTE',music:'MUSIK',quality:'QUALITÄT',auto:'AUTO',low:'NIEDRIG',high:'HOCH',
    language:'SPRACHE',reducedMotion:'REDUZIERTE BEWEGUNG',highContrast:'HOHER KONTRAST',colorblind:'FARBENBLIND',autotune:'AUTOTUNE',haptics:'HAPTIK',
    photo:'FOTO',photoAria:'Foto aufnehmen',photoSaved:'FOTO GESPEICHERT',photoFailed:'FOTO FEHLGESCHLAGEN',
    clearScores:'PUNKTE LÖSCHEN',purgeConfirm:'BESTÄTIGEN?',scoresCleared:'PUNKTE GELÖSCHT',
    suspended:'SIMULATION ANGEHALTEN',paused:'PAUSE',resume:'FORTSETZEN',menu:'MENÜ',pauseHint:'Zeiger freigegeben. Klicke FORTSETZEN, um in die Arena zurückzukehren.',
    signalLost:'SIGNAL VERLOREN',gameOver:'SPIEL VORBEI',kills:'ABSCHÜSSE',accuracy:'GENAUIGKEIT',survived:'ÜBERLEBT',best:'BEST',seedShort:'SEED',dmgTaken:'SCHADEN',
    retry:'NOCHMAL',exportReplay:'REPLAY EXPORT',pause:'PAUSE',muteAria:'Ton umschalten',pauseAria:'Spiel pausieren',
    score:'PUNKTE',wave:'WELLE',combo:'KOMBO',warden:'WARDEN',fire:'FEUER',jump:'SPRUNG',rld:'NACH',muteOn:'TON AN',muteOff:'TON AUS',
    lanceProtocol:'LANCE-PROTOKOLL',lanceSub:'SCHÜTZEN-EINHEIT — SICHTLINIE BRECHEN',lanceDown:'LANCE ZERSTÖRT +300',lance:'LANCE',
    wardenProtocol:'WARDEN-PROTOKOLL',wardenSub:'ELITE-EINHEIT ENTDECKT',
    hiveProtocol:'HIVE-PROTOKOLL',hiveSub:'SCHWARM-TRÄGER — ZERSTÖRE DAS NEST',hiveDown:'HIVE ZERSTÖRT +350',hive:'HIVE',swarm:'SCHWARM',
    turretName:'TURM',dashName:'STURM',shielderName:'SCHILDER',archDown:'ZERSTÖRT',
    pyreProtocol:'PYRE-PROTOKOLL',pyreSub:'OFENKERN — BRICH DEN SCHILDKREISLAUF',pyre:'PYRE',pyreDown:'PYRE ZERSTÖRT +400',pyreEnrage:'RASEREI',
    arcName:'ARC',arcReady:'ARC ONLINE',
    perkTitle:'UPGRADE',perkPick:'WÄHLE EINS',perkOwned:'MAL GEHABT x',
    hostilesInbound:'FEINDE IM ANFLUG',sector:'SEKTOR',waveCleared:'WELLE GESCHAFFT',bonus:'BONUS',
    noAmmo:'KEINE MUNITION',pickupHealth:'+30 LEBEN',rapidFire:'SCHNELLFEUER',shield:'SCHILD',doubleDamage:'DOPPELTER SCHADEN',ammoCell:'MUNITIONSZELLE',
    minimapOn:'MINIKARTE AN',minimapOff:'MINIKARTE AUS',wardenDown:'WARDEN ZERSTÖRT +250',ach:'ERFOLGE',reloading:'NACHLADEN…',
    cooldown:'ABKLINGZEIT — KURZ WARTEN',lockIssue:'ZEIGERSPERRE-PROBLEM — ERNEUT KLICKEN',
    lockNotBoom:'ZEIGERSPERRE - TIPPSTROM ERFASST',meshCooled:'MESH GEKUEHLT - SANDBOX-SICHERHEITSMODUS',
    running:'LÄUFT…',ready:'BEREIT',noRuns:'NOCH KEINE LÄUFE',
    replayEmpty:'KEINE REPLAY-DATEN',replayImported:'REPLAY GELADEN',replayInvalid:'UNGÜLTIGE REPLAY-DATEI',replayExported:'REPLAY GESPEICHERT',
    watch:'ANSEHEN',pbTitle:'WIEDERGABE',pbPlay:'LOS',pbSpeed:'TEMPO',pbExit:'BEENDEN',pbMatch:'LAUF VERIFIZIERT',pbMismatch:'DESYNC ERKANNT',pbDone:'WIEDERGABE BEENDET',pbLegacy:'ALTES REPLAY — NORMALE SCHWIERIGKEIT ANGENOMMEN',
    pbCam:'KAM',pbCamFirst:'EGO',pbCamThird:'3P',pbCamFree:'FREI',pbCamHint:'FREIE KAMERA — ZIEHEN ZUM ORBITIEREN · RAD / PINCH ZUM ZOOMEN · C ZUM WECHSELN',
    dailyTitle:'TÄGLICHE HERAUSFORDERUNG',dailySeedLbl:'HEUTIGER SEED',dailyBestLbl:'HEUTE BESTE',dailyVerify:'PRÜFEN',dailyPlay:'TÄGLICH SPIELEN',dailyCodePh:'Code einfügen',dailyShare:'TEILE-CODE',dailyCopy:'CODE KOPIEREN',dailyVerified:'VERIFIZIERT',dailyInvalid:'UNGÜLTIGER CODE',dailyCopied:'CODE KOPIERT',dailyNone:'HEUTE KEIN LAUF',
    lvl:'STUFE',unlocks:'FREISCHALTUNG',levelUp:'STUFENAUFSTIEG',xp:'XP',perkReroll:'NEU WÜRFELN',rerollUsed:'NEU WÜRFELN VERBRAUCHT',
    uArc:'ARC-KETTE +1',uGold:'GOLD-BIOM',uReroll:'PERK-NEUWURF',uShield:'STARTSCHILD 25',
    tapFire:'TIPPFEUER',fireZone:'FEUERZONE',fireZoneHint:'LINKE SEITE TIPPEN = FEUER',zoneTint:'FEUERZONE',
    sensX:'SENS X',sensY:'SENS Y',deadzone:'TOTZONE',lefty:'LINKSHÄNDIG'}
};
let LANG='en';
function t(k){try{return (STR[LANG]&&STR[LANG][k])||(STR.en&&STR.en[k])||k;}catch(e){return k;}}
function applyLang(){
  try{
    document.documentElement.lang=LANG;
    const nodes=document.querySelectorAll('[data-i18n]');
    for(let i=0;i<nodes.length;i++){const n=nodes[i],k=n.getAttribute('data-i18n');if(k)n.textContent=t(k);}
    const aria=document.querySelectorAll('[data-i18n-aria]');
    for(let i=0;i<aria.length;i++){const n=aria[i],k=n.getAttribute('data-i18n-aria');if(k)n.setAttribute('aria-label',t(k));}
    const ml=$('muteLbl');if(ml)ml.textContent=muted?t('muteOff'):t('muteOn');
    return {ok:true,lang:LANG};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function setLang(l){
  try{
    if(l&&!STR[l])return {ok:false,error:'unknown lang '+l};
    LANG=l||'en';applyLang();return {ok:true,lang:LANG};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function resolveLang(){
  try{
    let q='';
    try{q=(new URLSearchParams(location.search)).get('lang')||'';}catch(e2){}
    if(q&&STR[q])return q;
    if(SET&&SET.lang&&STR[SET.lang])return SET.lang;
    const nav=String((navigator.language||'en')).slice(0,2).toLowerCase();
    return STR[nav]?nav:'en';
  }catch(e){return 'en';}
}
function applyA11y(){
  try{
    if(!document.body)return {ok:false,error:'no body'};
    document.body.classList.toggle('a11y-motion',!!SET.reducedMotion);
    document.body.classList.toggle('a11y-contrast',!!SET.highContrast);
    document.body.classList.toggle('a11y-color',!!SET.colorblind);
    return {ok:true,motion:!!SET.reducedMotion,contrast:!!SET.highContrast,color:!!SET.colorblind};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function strParity(){
  try{
    const en=STR.en||{},de=STR.de||{};
    const missing=Object.keys(en).filter(k=>typeof de[k]!=='string'||!de[k].trim());
    const extra=Object.keys(de).filter(k=>typeof en[k]!=='string');
    return {ok:missing.length===0&&extra.length===0,missing,extra,keys:Object.keys(en).length};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function strTypos(){
  try{
    const issues=[];const de=STR.de||{};
    if(/Kills/.test(String(de.tagline||'')))issues.push('de.tagline: Kills');
    if(de.doubleDamage!=='DOPPELTER SCHADEN')issues.push('de.doubleDamage');
    if(de.lanceDown!=='LANCE ZERSTÖRT +300')issues.push('de.lanceDown');
    for(const lang of ['en','de'])for(const k in (STR[lang]||{})){
      const v=STR[lang][k];if(typeof v!=='string'||!v.trim())issues.push(lang+'.'+k+': empty');
    }
    return {ok:issues.length===0,issues};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function shakeAmp(){
  try{return (Number(G&&G.shake)||0)*(SET.reducedMotion?0.15:1);}catch(e){return 0;}
}
function hapticGate(reducedMotion,vibrateFn){
  try{
    if(reducedMotion)return {ok:false,reason:'reduced-motion'};
    if(typeof vibrateFn!=='function')return {ok:false,reason:'unsupported'};
    return {ok:true,reason:'ready'};
  }catch(e){return {ok:false,reason:'error',error:String(e&&e.message||e)};}
}
function hapticFire(ms,nav){
  try{
    if(!SET.haptics)return {ok:false,reason:'disabled'};
    const n=nav||((typeof navigator!=='undefined')?navigator:{});
    const gate=hapticGate(!!SET.reducedMotion,n.vibrate);
    if(!gate.ok)return gate;
    const dur=Math.max(1,Math.min(80,ms|0||12));
    n.vibrate(dur);
    return {ok:true,ms:dur};
  }catch(e){return {ok:false,reason:'error',error:String(e&&e.message||e)};}
}

