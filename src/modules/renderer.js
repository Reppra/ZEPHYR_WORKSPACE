/* ============================ WEBGL ============================ */
function createShader(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);
  if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const log=gl.getShaderInfoLog(s);gl.deleteShader(s);throw new Error('shader: '+log);}return s;}
function createProgram(vs,fs){const p=gl.createProgram();gl.attachShader(p,createShader(gl.VERTEX_SHADER,vs));gl.attachShader(p,createShader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(p);
  if(!gl.getProgramParameter(p,gl.LINK_STATUS)){throw new Error('link: '+gl.getProgramInfoLog(p));}return p;}
const VS_ARENA=`#version 300 es
layout(location=0) in vec3 aPos;layout(location=1) in vec3 aNormal;layout(location=2) in vec3 aColor;layout(location=3) in float aAO;
uniform mat4 uVP;uniform vec3 uCam;out vec3 vColor;out vec3 vNormal;out float vAO;out float vDist;out vec3 vWorld;
void main(){vColor=aColor;vNormal=aNormal;vAO=aAO;vDist=length(aPos-uCam);vWorld=aPos;gl_Position=uVP*vec4(aPos,1.0);}`;
const FS_ARENA=`#version 300 es
precision highp float;in vec3 vColor;in vec3 vNormal;in float vAO;in float vDist;in vec3 vWorld;
uniform vec3 uLight;uniform vec3 uFog;out vec4 frag;
uniform int uLightN;uniform vec3 uLightPos[16];uniform vec3 uLightCol[16];uniform float uLightRad[16];
void main(){vec3 N=normalize(vNormal);float diff=max(dot(N,uLight),0.0);
 float rim=pow(1.0-max(dot(N,normalize(vec3(0.2,0.6,0.4))),0.0),2.0)*0.15;
 vec3 col=vColor*(0.34+0.72*diff)*vAO+vec3(0.13,0.88,1.0)*rim*vAO;
 for(int i=0;i<16;i++){if(i>=uLightN)break;float d=distance(vWorld,uLightPos[i]);float att=max(0.0,1.0-d/uLightRad[i]);col+=uLightCol[i]*att*att;}
 float fog=clamp((vDist-26.0)/95.0,0.0,1.0);col=mix(col,uFog,fog*fog);frag=vec4(col,1.0);}`;
const VS_DYN=`#version 300 es
layout(location=0) in vec3 aPos;layout(location=1) in vec3 aNormal;
layout(location=2) in vec3 iPos;layout(location=3) in float iScale;layout(location=4) in vec3 iColor;layout(location=5) in float iGlow;
uniform mat4 uVP;out vec3 vColor;out vec3 vNormal;out float vGlow;out vec3 vWorld;
void main(){vec3 wp=aPos*iScale+iPos;vColor=iColor;vNormal=aNormal;vGlow=iGlow;vWorld=wp;gl_Position=uVP*vec4(wp,1.0);}`;
const FS_DYN=`#version 300 es
precision highp float;in vec3 vColor;in vec3 vNormal;in float vGlow;in vec3 vWorld;out vec4 frag;
uniform int uLightN;uniform vec3 uLightPos[16];uniform vec3 uLightCol[16];uniform float uLightRad[16];
void main(){vec3 N=normalize(vNormal);float l=0.55+0.45*max(dot(N,normalize(vec3(0.4,0.8,0.3))),0.0);
 vec3 col=vColor*mix(l,1.7,vGlow);
 for(int i=0;i<16;i++){if(i>=uLightN)break;float d=distance(vWorld,uLightPos[i]);float att=max(0.0,1.0-d/uLightRad[i]);col+=uLightCol[i]*att*att;}
 frag=vec4(col,1.0);}`;
const VS_SKY=`#version 300 es
layout(location=0) in vec2 aPos;out vec2 vUv;void main(){vUv=aPos*0.5+0.5;gl_Position=vec4(aPos,0.999,1.0);}`;
const FS_SKY=`#version 300 es
precision highp float;in vec2 vUv;out vec4 frag;
uniform vec3 uTop;uniform vec3 uMid;uniform vec3 uBot;uniform vec3 uGlow;
void main(){vec3 col=mix(uBot,uMid,smoothstep(0.0,0.5,vUv.y));col=mix(col,uTop,smoothstep(0.5,1.0,vUv.y));
 float glow=pow(max(0.0,1.0-abs(vUv.y-0.42)*2.4),3.0)*0.10;col+=uGlow*glow;frag=vec4(col,1.0);}`;
const VS_BEAM=`#version 300 es
layout(location=0) in vec3 aPos;layout(location=1) in vec3 aColor;layout(location=2) in float aEdge;
uniform mat4 uVP;out vec3 vColor;out float vEdge;
void main(){vColor=aColor;vEdge=aEdge;gl_Position=uVP*vec4(aPos,1.0);}`;
const FS_BEAM=`#version 300 es
precision highp float;in vec3 vColor;in float vEdge;uniform float uOpacity;out vec4 frag;
void main(){float a=pow(clamp(1.0-abs(vEdge),0.0,1.0),0.7);frag=vec4(vColor*1.6,a*uOpacity);}`;
function initWebGL(){
  canvas=$('glcanvas');
  gl=canvas.getContext('webgl2',{antialias:false,alpha:false,powerPreference:'high-performance'});
  if(!gl){showErr('WebGL2 not available — this game requires a WebGL2-capable browser.');return false;}
  detectGPU();
  progArena=createProgram(VS_ARENA,FS_ARENA);
  progDyn=createProgram(VS_DYN,FS_DYN);
  progSky=createProgram(VS_SKY,FS_SKY);
  progBeam=createProgram(VS_BEAM,FS_BEAM);
  progArena.uVP=gl.getUniformLocation(progArena,'uVP');progArena.uCam=gl.getUniformLocation(progArena,'uCam');
  progArena.uLight=gl.getUniformLocation(progArena,'uLight');progArena.uFog=gl.getUniformLocation(progArena,'uFog');
  progSky.uTop=gl.getUniformLocation(progSky,'uTop');progSky.uMid=gl.getUniformLocation(progSky,'uMid');
  progSky.uBot=gl.getUniformLocation(progSky,'uBot');progSky.uGlow=gl.getUniformLocation(progSky,'uGlow');
  progDyn.uVP=gl.getUniformLocation(progDyn,'uVP');
  for(const p of [progArena,progDyn]){p.uLightN=gl.getUniformLocation(p,'uLightN');p.uLightPos=gl.getUniformLocation(p,'uLightPos[0]');p.uLightCol=gl.getUniformLocation(p,'uLightCol[0]');p.uLightRad=gl.getUniformLocation(p,'uLightRad[0]');}
  progBeam.uVP=gl.getUniformLocation(progBeam,'uVP');progBeam.uOpacity=gl.getUniformLocation(progBeam,'uOpacity');
  // unit cube
  const faces=[
    [[1,0,0],[[1,-1,-1],[1,1,-1],[1,1,1],[1,-1,1]]],[[-1,0,0],[[-1,-1,1],[-1,1,1],[-1,1,-1],[-1,-1,-1]]],
    [[0,1,0],[[-1,1,-1],[-1,1,1],[1,1,1],[1,1,-1]]],[[0,-1,0],[[-1,-1,1],[-1,-1,-1],[1,-1,-1],[1,-1,1]]],
    [[0,0,1],[[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]]],[[0,0,-1],[[1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,1,-1]]]];
  const cv=[];for(const [n,q] of faces){const idx=[0,1,2,0,2,3];for(const i of idx)cv.push(q[i][0]*0.5,q[i][1]*0.5,q[i][2]*0.5,n[0],n[1],n[2]);}
  cubeVBO=gl.createBuffer();cubeVAO=gl.createVertexArray();
  gl.bindVertexArray(cubeVAO);gl.bindBuffer(gl.ARRAY_BUFFER,cubeVBO);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(cv),gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,24,0);
  gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,3,gl.FLOAT,false,24,12);
  instVBO=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,instVBO);gl.bufferData(gl.ARRAY_BUFFER,instData.byteLength,gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(2);gl.vertexAttribPointer(2,3,gl.FLOAT,false,32,0);gl.vertexAttribDivisor(2,1);
  gl.enableVertexAttribArray(3);gl.vertexAttribPointer(3,1,gl.FLOAT,false,32,12);gl.vertexAttribDivisor(3,1);
  gl.enableVertexAttribArray(4);gl.vertexAttribPointer(4,3,gl.FLOAT,false,32,16);gl.vertexAttribDivisor(4,1);
  gl.enableVertexAttribArray(5);gl.vertexAttribPointer(5,1,gl.FLOAT,false,32,28);gl.vertexAttribDivisor(5,1);
  gl.bindVertexArray(null);
  // sky triangle
  skyVBO=gl.createBuffer();skyVAO=gl.createVertexArray();
  gl.bindVertexArray(skyVAO);gl.bindBuffer(gl.ARRAY_BUFFER,skyVBO);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,8,0);gl.bindVertexArray(null);
  // tracer beams: camera-facing thin quads, additive emissive (never a scaled cube)
  beamVBO=gl.createBuffer();beamVAO=gl.createVertexArray();
  gl.bindVertexArray(beamVAO);gl.bindBuffer(gl.ARRAY_BUFFER,beamVBO);gl.bufferData(gl.ARRAY_BUFFER,beamData.byteLength,gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,28,0);
  gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,3,gl.FLOAT,false,28,12);
  gl.enableVertexAttribArray(2);gl.vertexAttribPointer(2,1,gl.FLOAT,false,28,24);
  gl.bindVertexArray(null);
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.clearColor(0.027,0.043,0.086,1);
  canvas.addEventListener('webglcontextlost',onContextLost,false);
  canvas.addEventListener('webglcontextrestored',onContextRestored,false);
  return true;
}
function detectGPU(){
  LOW_GPU=false;GPU_RENDERER='';
  try{
    const ext=gl.getExtension('WEBGL_debug_renderer_info');
    if(!ext){LOW_GPU=true;return;}
    GPU_RENDERER=String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)||'');
    LOW_GPU=/SwiftShader|llvmpipe|softpipe|Software|Microsoft Basic|VirtualBox|VMware|Parallels|passthrough|ANGLE.*SwiftShader/i.test(GPU_RENDERER);
  }catch(e){LOW_GPU=true;}
}
function onContextLost(e){
  if(e&&e.preventDefault)e.preventDefault();
  try{crashRecord();crashCapture('context_lost','webglcontextlost',e?{statusMessage:e.statusMessage}:null);}catch(err){}
  contextLost=true;running=false;
  $('ctxOverlay').classList.remove('hidden');
  showErr('Graphics context lost — restoring in place.');
}
function onContextRestored(){restoreGraphics();}
function restoreGraphics(){
  const wasRunning=running;
  try{
    arenaVBO=arenaVAO=cubeVBO=cubeVAO=instVBO=skyVBO=skyVAO=beamVBO=beamVAO=null;
    progArena=progDyn=progSky=progBeam=null;
    if(!initWebGL())throw new Error('re-init returned false');
    buildArenaMesh();resizeGL();
    contextLost=false;renderScale=1;frameEMA=16;idleAcc=0;adaptCooldown=0;
    $('ctxOverlay').classList.add('hidden');hideErr();
    try{sessionStorage.removeItem('sun011_ctx_reload');sessionStorage.removeItem('sun010_ctx_reload');sessionStorage.removeItem('sun009_ctx_reload');sessionStorage.removeItem('sun008_ctx_reload');sessionStorage.removeItem('sun007_ctx_reload');}catch(e){}
    running=true;lastT=performance.now();renderOnce();if(!wasRunning)requestAnimationFrame(loop);
    return true;
  }catch(e){
    contextLost=true;running=false;
    $('ctxOverlay').classList.remove('hidden');
    $('ctxHint').textContent='Auto-restore failed. The button below reloads once (guarded).';
    showErr('Graphics restore failed — '+String(e&&e.message||e));
    return false;
  }
}
function computeBufferSize(vw,vh,deviceDpr,scale,lowGpu){
  const dpr=lowGpu?1:Math.min(deviceDpr||1,2);
  const s=dpr*(scale||1);
  let w=Math.max(1,Math.floor(Math.max(1,vw|0)*s)),h=Math.max(1,Math.floor(Math.max(1,vh|0)*s));
  const px=w*h;
  if(px>MAX_PIXELS){const k=Math.sqrt(MAX_PIXELS/px);w=Math.max(1,Math.floor(w*k));h=Math.max(1,Math.floor(h*k));}
  return {w,h,dpr};
}
function resizeGL(){
  const b=computeBufferSize(window.innerWidth,window.innerHeight,window.devicePixelRatio,renderScale,LOW_GPU);
  DPR=b.dpr;W=b.w;H=b.h;
  if(canvas.width!==W||canvas.height!==H){canvas.width=W;canvas.height=H;}
  projM=m4Perspective(FOV,W/H,NEAR,FAR);
}
function shapeSpec(type,elite){
  try{
    if(!SET.colorblind)return [];
    const out=[];
    if(type===1){out.push([-0.9,0,0,0.42],[0.9,0,0,0.42]);}
    else if(type===2){out.push([-0.7,0,-0.7,0.4],[0.7,0,-0.7,0.4],[-0.7,0,0.7,0.4],[0.7,0,0.7,0.4]);}
    else if(type===3){out.push([0,1.05,0,0.55],[0,-1.05,0,0.55],[1.05,0,0,0.4],[-1.05,0,0,0.4]);}
    else if(type===5){out.push([-1.1,0,0,0.45],[1.1,0,0,0.45],[0,0.95,0,0.35]);}
    else if(type===4){out.push([0,1.0,0,0.4]);}
    else if(type===6){out.push([0,1.1,0,0.42],[-0.85,0,0,0.36],[0.85,0,0,0.36]);}
    else if(type===7){out.push([0,1.0,0,0.3]);}
    else if(type===8){out.push([-1.0,0,0,0.4],[1.0,0,0,0.4],[0,-0.9,0,0.4]);}
    else if(type===9){out.push([0,1.15,0,0.3],[0,-1.15,0,0.3]);}
    else if(type===10){out.push([-1.0,0,-1.0,0.3],[1.0,0,-1.0,0.3],[-1.0,0,1.0,0.3],[1.0,0,1.0,0.3]);}
    else if(type===11){out.push([0,1.2,0,0.5],[-1.1,0,0,0.4],[1.1,0,0,0.4],[0,0,1.1,0.4],[0,0,-1.1,0.4]);}
    return out;
  }catch(e){return [];}
}
function buildEntityData(){
  instCount=0;
  const put=(x,y,z,s,c,g)=>{if(instCount>=INST_MAX)return;s=Math.max(0,Math.min(s,INSTANCE_SCALE_MAX));const o=instCount*8;instData[o]=x;instData[o+1]=y;instData[o+2]=z;instData[o+3]=s;instData[o+4]=c[0];instData[o+5]=c[1];instData[o+6]=c[2];instData[o+7]=g;instCount++;};
  for(const e of enemies){
    let c=e.type===2?PAL.magenta:e.type===3?PAL.magenta:e.type===1?PAL.pink:e.type===6?PAL.orange:e.type===7?PAL.amber:e.type===8?PAL.magenta:e.type===9?PAL.pink:e.type===10?PAL.amber:PAL.cyan;
    if(e.archetype==='dash'&&e.dashState==='windup')c=PAL.red;
    if(e.boss){
      if(e.archetype==='lance')c=PAL.magenta;
      else if(e.archetype==='hive')c=PAL.orange;
      else if(e.archetype==='pyre')c=e.phase===3?PAL.red:e.phase===2?PAL.orange:PAL.amber;
      else if(SET.colorblind)c=PAL.amber;
      else{const k=0.5+0.5*Math.sin(G.time*3);c=[PAL.red[0]*(1-k)+PAL.orange[0]*k,PAL.red[1]*(1-k)+PAL.orange[1]*k,PAL.red[2]*(1-k)+PAL.orange[2]*k];}
    }
    const s=e.size*(e.hp/e.maxhp*0.4+0.6);
    put(e.x,e.y+Math.sin(G.time*3+e.bob)*0.15,e.z,s,c,e.boss?1.0:0.85);
    if(e.boss){
      if(e.archetype==='lance'){
        const rr=e.size*0.85;
        put(e.x+rr,e.y+e.size*0.55,e.z,0.3,PAL.amber,1.0);
        put(e.x-rr,e.y+e.size*0.55,e.z,0.3,PAL.amber,1.0);
      }else if(e.archetype==='pyre'){
        const a=G.time*2.0;
        for(let q=0;q<3;q++){const aa=a+q*2.094;put(e.x+Math.cos(aa)*e.size*0.8,e.y+e.size*0.5,e.z+Math.sin(aa)*e.size*0.8,0.3,c,1.0);}
        if(e.shieldT>0){const rr=e.size*1.05;for(let q=0;q<8;q++){const aa=q*0.785+G.time;put(e.x+Math.cos(aa)*rr,e.y,e.z+Math.sin(aa)*rr,0.26,PAL.cyan,1.0);}}
      }else{
        const a=G.time*1.5;put(e.x+Math.cos(a)*e.size*0.75,e.y+e.size*0.62,e.z+Math.sin(a)*e.size*0.75,0.34,PAL.amber,1.0);
      }
    }
    if(SET.colorblind){const sp=shapeSpec(e.type,!!e.elite);for(let i=0;i<sp.length;i++){const q=sp[i];put(e.x+q[0]*e.size,e.y+q[1]*e.size,e.z+q[2]*e.size,q[3]*e.size,c,0.95);}}
    if(e.elite){
      put(e.x,e.y+e.size*0.95,e.z,0.22,PAL.amber,1.0);
      if(e.elite==='shield'&&e.shieldHp>0){
        const rr=e.size*0.85;
        put(e.x+rr,e.y,e.z,0.14,PAL.cyan,0.9);put(e.x-rr,e.y,e.z,0.14,PAL.cyan,0.9);
        put(e.x,e.y,e.z+rr,0.14,PAL.cyan,0.9);put(e.x,e.y,e.z-rr,0.14,PAL.cyan,0.9);
      }
    }
    if(e.archetype==='turret'){
      put(e.x-e.size*0.55,e.y-e.size*0.3,e.z,0.5,PAL.magenta,0.8);
      put(e.x+e.size*0.55,e.y-e.size*0.3,e.z,0.5,PAL.magenta,0.8);
      put(e.x,e.y+e.size*0.55,e.z,0.28,PAL.red,1.0);
    }else if(e.archetype==='dash'){
      put(e.x,e.y+e.size*0.7,e.z,0.35,c,0.9);
      put(e.x,e.y-e.size*0.6,e.z,0.35,c,0.9);
    }else if(e.archetype==='shielder'){
      const a=G.time*2.2,rr=(e.aura||6)*0.5;
      for(let q=0;q<4;q++){const aa=a+q*Math.PI/2;put(e.x+Math.cos(aa)*rr,e.y-0.6,e.z+Math.sin(aa)*rr,0.22,PAL.amber,0.7+0.3*Math.sin(G.time*4));}
    }
    if(e.shielded)put(e.x,e.y+e.size*0.8,e.z,0.16,PAL.amber,1.0);
  }
  for(const p of eproj){put(p.x,p.y,p.z,p.size,p.col,1.0);put(p.x-p.vx*0.06,p.y-p.vy*0.06,p.z-p.vz*0.06,p.size*0.7,p.col,0.55);}
  for(const p of pickups){const c=p.kind===0?PAL.green:p.kind===1?PAL.amber:p.kind===2?PAL.cyan:PAL.pink;put(p.x,p.y+Math.sin(G.time*2+p.x)*0.2,p.z,0.5,c,1.0);}
  for(const p of particles){put(p.x,p.y,p.z,p.size,p.col,p.glow);}
  if(G.muzzle>0){const f=forwardVec();put(player.x+f[0]*1.2,player.y+EYE_H-0.2+f[1]*1.2,player.z+f[2]*1.2,Math.min(0.7,0.3+G.muzzle*0.4),PAL.orange,1.0);}
}
function buildBeamData(f,right){
  beamCount=0;
  const half=0.045;let o=0;
  const emit=(x,y,z,r,g,b,e)=>{beamData[o]=x;beamData[o+1]=y;beamData[o+2]=z;beamData[o+3]=r;beamData[o+4]=g;beamData[o+5]=b;beamData[o+6]=e;o+=7;};
  for(const t of tracers){
    if(beamCount>=BEAM_MAX)break;
    let dx=t.x1-t.x0,dy=t.y1-t.y0,dz=t.z1-t.z0;const dl=Math.hypot(dx,dy,dz)||1;dx/=dl;dy/=dl;dz/=dl;
    // side = dir x forward (camera-facing); fall back to camera right when degenerate
    let sx=dy*f[2]-dz*f[1],sy=dz*f[0]-dx*f[2],sz=dx*f[1]-dy*f[0];
    let sl=Math.hypot(sx,sy,sz);
    if(sl<1e-4){sx=right[0];sy=right[1];sz=right[2];sl=Math.hypot(sx,sy,sz)||1;}
    sx=sx/sl*half;sy=sy/sl*half;sz=sz/sl*half;
    const c=t.col||PAL.orange,r=c[0],g=c[1],b=c[2];
    const ax=t.x0-sx,ay=t.y0-sy,az=t.z0-sz,bx=t.x0+sx,by=t.y0+sy,bz=t.z0+sz;
    const cx=t.x1+sx,cy=t.y1+sy,cz=t.z1+sz,dx2=t.x1-sx,dy2=t.y1-sy,dz2=t.z1-sz;
    emit(ax,ay,az,r,g,b,-1);emit(bx,by,bz,r,g,b,1);emit(cx,cy,cz,r,g,b,1);
    emit(ax,ay,az,r,g,b,-1);emit(cx,cy,cz,r,g,b,1);emit(dx2,dy2,dz2,r,g,b,-1);
    beamCount++;
  }
}
function forwardVec(){const cp=Math.cos(player.pitch);return [Math.sin(player.yaw)*cp,Math.sin(player.pitch),-Math.cos(player.yaw)*cp];}
function gatherLights(){
  try{
    lightCount=0;let bossSlot=-1;
    const push=(x,y,z,c,rad)=>{if(lightCount>=LIGHT_MAX)return false;const o=lightCount*7;lightData[o]=x;lightData[o+1]=y;lightData[o+2]=z;lightData[o+3]=c[0];lightData[o+4]=c[1];lightData[o+5]=c[2];lightData[o+6]=rad;lightCount++;return true;};
    if(G.muzzle>0){const f=forwardVec();push(player.x+f[0]*1.2,player.y+EYE_H-0.2+f[1]*1.2,player.z+f[2]*1.2,[1,0.93,0.8],9);}
    // bosses first under overflow: the phase aura is the strongest spatial cue; projectiles and shielder auras yield slots
    for(const e of enemies){if(e.boss&&e.archetype==='pyre'){const c=e.phase===3?PAL.red:e.phase===2?PAL.orange:PAL.amber;if(push(e.x,e.y+1,e.z,c,10)&&bossSlot<0)bossSlot=lightCount-1;}}
    let pn=0;for(const p of eproj){if(pn>=projLightCap)break;if(push(p.x,p.y,p.z,p.col||PAL.cyan,5))pn++;}
    for(const e of enemies){if(e.archetype==='shielder')push(e.x,e.y+0.5,e.z,PAL.amber,6.5);}
    return {ok:true,count:lightCount,order:'boss-first',bossSlot};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function uploadLights(prog){
  try{
    if(!gl||!prog||!prog.uLightN)return {ok:false,error:'no light locations'};
    if(!lightsFinite()){gl.uniform1i(prog.uLightN,0);FW.nearMiss++;return {ok:true,count:0,skipped:true};}
    for(let i=0;i<lightCount;i++){const o=i*7;lightPosArr[i*3]=lightData[o];lightPosArr[i*3+1]=lightData[o+1];lightPosArr[i*3+2]=lightData[o+2];lightColArr[i*3]=lightData[o+3];lightColArr[i*3+1]=lightData[o+4];lightColArr[i*3+2]=lightData[o+5];lightRadArr[i]=lightData[o+6];}
    gl.uniform1i(prog.uLightN,lightCount);
    if(lightCount>0){gl.uniform3fv(prog.uLightPos,lightPosArr.subarray(0,lightCount*3));gl.uniform3fv(prog.uLightCol,lightColArr.subarray(0,lightCount*3));gl.uniform1fv(prog.uLightRad,lightRadArr.subarray(0,lightCount));}
    return {ok:true,count:lightCount};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function pushGlow(x,y,z,col,size,life){
  try{
    if(glows.length>=GLOW_MAX)glows.shift();
    const L=life||0.3;glows.push({x:x,y:y,z:z,col:col||PAL.cyan,size:size||1.4,life:L,max:L});
    return {ok:true,count:glows.length};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function buildGlowData(f,right){
  try{
    glowCount=0;let o=0;
    const ux=right[1]*f[2]-right[2]*f[1],uy=right[2]*f[0]-right[0]*f[2],uz=right[0]*f[1]-right[1]*f[0];
    const ul=Math.hypot(ux,uy,uz)||1;
    const emit=(x,y,z,r,g,b,e)=>{glowData[o]=x;glowData[o+1]=y;glowData[o+2]=z;glowData[o+3]=r;glowData[o+4]=g;glowData[o+5]=b;glowData[o+6]=e;o+=7;};
    const quad=(x,y,z,s,c,k)=>{
      const sx=right[0]*s,sy=right[1]*s,sz=right[2]*s,tx=ux/ul*s,ty=uy/ul*s,tz=uz/ul*s;
      const r=c[0]*k,g=c[1]*k,b=c[2]*k;
      emit(x-sx-tx,y-sy-ty,z-sz-tz,r,g,b,-1);emit(x+sx-tx,y+sy-ty,z+sz-tz,r,g,b,1);emit(x+sx+tx,y+sy+ty,z+sz+tz,r,g,b,1);
      emit(x-sx-tx,y-sy-ty,z-sz-tz,r,g,b,-1);emit(x+sx+tx,y+sy+ty,z+sz+tz,r,g,b,1);emit(x-sx+tx,y-sy+ty,z-sz+tz,r,g,b,-1);
      glowCount++;
    };
    for(const g of glows){if(glowCount>=GLOW_MAX)break;quad(g.x,g.y,g.z,g.size,g.col,Math.max(0,g.life/g.max));}
    for(const p of pickups){if(glowCount>=GLOW_MAX)break;const c=p.kind===0?PAL.green:p.kind===1?PAL.amber:p.kind===2?PAL.cyan:PAL.pink;quad(p.x,p.y+Math.sin(G.time*2+p.x)*0.2,p.z,0.9,c,0.55+0.2*Math.sin(G.time*3+p.z));}
    return {ok:true,count:glowCount};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function drawGlow(f,right){
  try{
    const r=buildGlowData(f,right);if(!r.ok)return r;
    if(glowCount>0&&gl&&!contextLost){
      gl.useProgram(progBeam);gl.uniformMatrix4fv(progBeam.uVP,false,vpM);gl.uniform1f(progBeam.uOpacity,0.85);
      gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.depthMask(false);
      gl.bindVertexArray(beamVAO);gl.bindBuffer(gl.ARRAY_BUFFER,beamVBO);gl.bufferSubData(gl.ARRAY_BUFFER,0,glowData.subarray(0,glowCount*42));
      gl.drawArrays(gl.TRIANGLES,0,glowCount*6);
      gl.depthMask(true);gl.disable(gl.BLEND);
    }
    return {ok:true,count:glowCount};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function throttleLights(){
  try{
    let throttled=false;
    if(frameEMA>PERF_BUDGET.slowMs){lightSlowFrames++;lightFastFrames=0;}
    else if(frameEMA<PERF_BUDGET.fastMs){lightFastFrames++;lightSlowFrames=0;}
    else{lightSlowFrames=0;lightFastFrames=0;}
    if(lightSlowFrames>=60&&lightCount>6&&projLightCap>0){
      projLightCap=projLightCap>4?4:0;lightSlowFrames=0;throttled=true;
      if(!lightsThrottledLogged){lightsThrottledLogged=true;console.warn('[perf] lights_throttled cap='+projLightCap);}
      telemetryRecord('lights_throttled',projLightCap);
    }
    if(lightFastFrames>=120&&projLightCap<8){projLightCap=Math.min(8,projLightCap+4);lightFastFrames=0;}
    return {ok:true,throttled:throttled,cap:projLightCap,slowFrames:lightSlowFrames};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function lightsFinite(){for(let i=0;i<lightCount*7;i++)if(!Number.isFinite(lightData[i]))return false;return true;}
function recoverView(){
  try{
    if(!Number.isFinite(player.yaw))player.yaw=0;
    if(!Number.isFinite(player.pitch))player.pitch=0;
    projM=m4Perspective(FOV,(W||1)/(H||1),NEAR,FAR);
    const f=forwardVec();
    viewM=m4LookAt([player.x,player.y+EYE_H,player.z],[player.x+f[0],player.y+EYE_H+f[1],player.z+f[2]],[0,1,0]);
    vpM=m4Mul(projM,viewM);
    return {ok:true,yaw:player.yaw,pitch:player.pitch};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function meshMeltdownAllowed(){
  try{
    if(isSuperphone()&&SANDBOX){
      if(!FW.cooledAt||performance.now()-FW.cooledAt>10000){
        FW.cooledAt=performance.now();
        showToast(t('meshCooled'));
        telemetryRecord('mesh_cooled',{device:'SUPERphone',sandbox:true});
      }
      return false;
    }
    return true;
  }catch(e){return true;}
}
function nanFirewall(){
  try{
    const now=performance.now();
    let caught=0;
    if(!matFinite(vpM)||!matFinite(viewM)||!matFinite(projM)){
      recoverView();
      caught++;FW.nearMiss++;
    }
    const deep=IN.sanN>FW.lastSanN;
    if(deep){
      const n=instCount*8;
      for(let i=0;i<n;i++)if(!Number.isFinite(instData[i])){instData[i]=0;caught++;FW.nearMiss++;}
      const b=beamCount*42;
      for(let i=0;i<b;i++)if(!Number.isFinite(beamData[i])){beamData[i]=0;caught++;FW.nearMiss++;}
    }else{
      for(let i=0;i<instCount;i+=16)if(!Number.isFinite(instData[i*8])){instData[i*8]=0;caught++;FW.nearMiss++;break;}
    }
    FW.lastSanN=IN.sanN;
    if(caught>0){
      FW.total+=caught;FW.catches++;
      if(now-FW.hitAt<1000)FW.hitStreak++;else FW.hitStreak=1;
      FW.hitAt=now;
      if(FW.nearMiss>=2&&now-FW.lastHeal>3000){
        FW.lastHeal=now;
        if(meshMeltdownAllowed()){
          showErr('MESH GUARD: caught '+FW.nearMiss+' bad values — recovered');
          telemetryRecord('nan_firewall',{nearMiss:FW.nearMiss,total:FW.total});
          FW.nearMiss=0;
        }
      }
      if(FW.hitStreak>=2){FW.hitStreak=0;if(meshMeltdownAllowed()){setTimeout(()=>{try{if(!contextLost&&gl)restoreGraphics();}catch(e){}},0);}}
    }else FW.catches=0;
    return {ok:true,caught:caught,total:FW.total};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}
function drawScene(){
  if(!gl||contextLost)return;
  nanFirewall();
  gl.viewport(0,0,W,H);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  const pbOn=G.mode==='playback'&&PB&&PB.active;
  const third=pbOn&&PB.cam==='third';
  const free=pbOn&&PB.cam==='free';
  const f=forwardVec();
  let eye=[player.x,player.y+EYE_H,player.z];
  if(third)eye=[player.x-f[0]*6,player.y+EYE_H+3,player.z-f[2]*6];
  if(free){const cv=Math.cos(PB.vp);eye=[player.x-Math.sin(PB.vy)*cv*PB.dist,player.y+EYE_H*0.8+Math.sin(PB.vp)*PB.dist,player.z+Math.cos(PB.vy)*cv*PB.dist];}
  const rl=Math.hypot(f[0],f[2])||1;const right=[-f[2]/rl,0,f[0]/rl];
  let shakeX=0,shakeY=0;const shAmp=shakeAmp();if(shAmp>0&&!third&&!free){const st=performance.now()*0.045;shakeX=Math.sin(st*1.7)*shAmp*0.03;shakeY=Math.cos(st*2.3)*shAmp*0.03;}
  const center=free?[player.x,player.y+EYE_H*0.8,player.z]:third?[player.x,player.y+EYE_H*0.8,player.z]:[eye[0]+f[0]+shakeX,eye[1]+f[1]+shakeY,eye[2]+f[2]];
  let bf=f,br=right;
  if(free){const vx=center[0]-eye[0],vy=center[1]-eye[1],vz=center[2]-eye[2],vl=Math.hypot(vx,vy,vz)||1;bf=[vx/vl,vy/vl,vz/vl];const hl=Math.hypot(bf[0],bf[2])||1;br=[-bf[2]/hl,0,bf[0]/hl];}
  viewM=m4LookAt(eye,center,[0,1,0]);vpM=m4Mul(projM,viewM);
  // sky
  const bio=biomeDef(biomeFor(G.runSeed|0));
  gl.disable(gl.DEPTH_TEST);gl.useProgram(progSky);
  if(progSky.uTop){gl.uniform3fv(progSky.uTop,bio.sky.top);gl.uniform3fv(progSky.uMid,bio.sky.mid);gl.uniform3fv(progSky.uBot,bio.sky.bot);gl.uniform3fv(progSky.uGlow,bio.sky.glow);}
  gl.bindVertexArray(skyVAO);gl.drawArrays(gl.TRIANGLES,0,3);gl.enable(gl.DEPTH_TEST);
  // arena
  gatherLights();
  gl.useProgram(progArena);gl.uniformMatrix4fv(progArena.uVP,false,vpM);gl.uniform3fv(progArena.uCam,eye);
  gl.uniform3f(progArena.uLight,0.42,0.78,0.34);gl.uniform3fv(progArena.uFog,bio.fog);uploadLights(progArena);
  gl.bindVertexArray(arenaVAO);gl.drawArrays(gl.TRIANGLES,0,quadCount*6);
  // dynamic cubes (enemies, pickups, particles, muzzle) — every scale clamped
  buildEntityData();
  if(instCount>0){gl.useProgram(progDyn);gl.uniformMatrix4fv(progDyn.uVP,false,vpM);uploadLights(progDyn);
    gl.bindVertexArray(cubeVAO);gl.bindBuffer(gl.ARRAY_BUFFER,instVBO);gl.bufferSubData(gl.ARRAY_BUFFER,0,instData.subarray(0,instCount*8));
    gl.drawArraysInstanced(gl.TRIANGLES,0,36,instCount);}
  // tracer beams — thin camera-facing quads, additive emissive (never a screen-filling cube)
  buildBeamData(bf,br);
  if(beamCount>0){gl.useProgram(progBeam);gl.uniformMatrix4fv(progBeam.uVP,false,vpM);gl.uniform1f(progBeam.uOpacity,1.0);
    gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.depthMask(false);
    gl.bindVertexArray(beamVAO);gl.bindBuffer(gl.ARRAY_BUFFER,beamVBO);gl.bufferSubData(gl.ARRAY_BUFFER,0,beamData.subarray(0,beamCount*42));
    gl.drawArrays(gl.TRIANGLES,0,beamCount*6);
    gl.depthMask(true);gl.disable(gl.BLEND);}
  drawGlow(bf,br);
  gl.bindVertexArray(null);
}
function renderOnce(){drawScene();}
function readCenterNonClear(){
  const px=new Uint8Array(4*64);const cx=Math.max(0,(W>>1)-4),cy=Math.max(0,(H>>1)-4);
  gl.readPixels(cx,cy,8,8,gl.RGBA,gl.UNSIGNED_BYTE,px);
  let n=0;for(let i=0;i<64;i++){const r=px[i*4],g=px[i*4+1],b=px[i*4+2];if(Math.abs(r-7)>6||Math.abs(g-11)>6||Math.abs(b-22)>6)n++;}
  return n;
}

