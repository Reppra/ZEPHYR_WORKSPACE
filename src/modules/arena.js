/* ============================ ARENA ============================ */
let meshSeed=null;
function hidx(x,z){return z*ARENA_W+x;}
function parseSeed(v){
  try{
    const s=String(v==null?'':v).trim();
    if(!s)return 123456789;
    if(/^-?\d+$/.test(s)){const n=parseInt(s,10)|0;return n||123456789;}
    let h=2166136261>>>0;
    for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}
    return (h|0)||123456789;
  }catch(e){return 123456789;}
}
function randomRunSeed(){try{return (Math.floor(Math.random()*2147483646)+1)|0;}catch(e){return 123456789;}}
function seedFromURL(search,hash){
  try{
    const q=((search===undefined?location.search:search)||'')+'&'+((hash===undefined?location.hash:hash)||'');
    const m=/[?&#]seed=([^&]+)/.exec(q);
    return m?decodeURIComponent(m[1]).replace(/#.*$/,''):'';
  }catch(e){return '';}
}
const BIOMES=[
  {name:'NEON',amp:1.0,border:[0.06,0.32,0.42],accentA:[0.30,0.12,0.45],accentB:[0.10,0.30,0.40],
   baseA:[0.07,0.10,0.20],baseB:[0.12,0.16,0.30],fog:[0.04,0.06,0.13],
   sky:{top:[0.03,0.05,0.12],mid:[0.06,0.09,0.20],bot:[0.10,0.06,0.16],glow:[0.13,0.5,0.7]}},
  {name:'EMBER',amp:1.35,border:[0.40,0.16,0.06],accentA:[0.46,0.20,0.05],accentB:[0.40,0.10,0.06],
   baseA:[0.20,0.08,0.04],baseB:[0.30,0.14,0.06],fog:[0.14,0.05,0.03],
   sky:{top:[0.10,0.03,0.02],mid:[0.20,0.07,0.03],bot:[0.16,0.04,0.06],glow:[0.70,0.35,0.10]}},
  {name:'VOID',amp:0.55,border:[0.16,0.06,0.32],accentA:[0.36,0.10,0.55],accentB:[0.10,0.06,0.40],
   baseA:[0.08,0.05,0.18],baseB:[0.16,0.10,0.28],fog:[0.06,0.03,0.14],
   sky:{top:[0.02,0.02,0.08],mid:[0.05,0.03,0.14],bot:[0.08,0.03,0.12],glow:[0.45,0.25,0.80]}}];
function biomeFor(seed){
  const s=seed>>>0;
  if(s===123456789)return 0;
  return s%3;
}
function genArena(){
  const seed=(G.runSeed|0)||123456789;
  const legacy=seed===123456789;
  const B=biomeDef(biomeFor(seed));
  const wob=legacy?0:((K.hash2(seed,17)>>>0)%1000)/1000;
  const oct=legacy?4:4+(wob>0.66?2:wob>0.33?1:0);
  const amp=(legacy?3.2:2.4+wob*2.4)*B.amp;
  const ox=legacy?0:((K.hash2(seed,3)>>>0)%4093)/977;
  const oz=legacy?0:((K.hash2(seed,29)>>>0)%4093)/977;
  for(let z=0;z<ARENA_D;z++)for(let x=0;x<ARENA_W;x++){
    const border=(x<2||z<2||x>=ARENA_W-2||z>=ARENA_D-2);
    if(border){heights[hidx(x,z)]=6;continue;}
    const n=K.fbm2d(x*3+ox,z*3+oz,oct); // 0..1024
    let h=2+Math.floor(n/1024*amp);
    const dx=x-ARENA_W/2,dz=z-ARENA_D/2,rr=dx*dx+dz*dz;
    if(rr<36)h=3; // flat spawn pad
    else if(!legacy&&rr<64)h=Math.min(h,4); // walkable ring around the pad
    heights[hidx(x,z)]=clamp(h,1,MAX_H);
  }
}
function groundAt(x,z){const ix=clamp(Math.floor(x),0,ARENA_W-1),iz=clamp(Math.floor(z),0,ARENA_D-1);return heights[hidx(ix,iz)];}
function blockAt(x,y,z){if(x<0||z<0||x>=ARENA_W||z>=ARENA_D)return y<6?1:0;return y<heights[hidx(x,z)]?1:0;}
function arenaColor(x,z,h){
  const B=biomeDef(biomeFor(G.runSeed|0));
  const border=(x<2||z<2||x>=ARENA_W-2||z>=ARENA_D-2);
  if(border)return B.border;
  const r=(K.hash2(x,z)>>>0)%100;
  if(r<4)return B.accentA;
  if(r<9)return B.accentB;
  const t=clamp((h-2)/4,0,1);
  return [lerp(B.baseA[0],B.baseB[0],t),lerp(B.baseA[1],B.baseB[1],t),lerp(B.baseA[2],B.baseB[2],t)];
}
function buildArenaMesh(){
  const verts=[];
  const push=(px,py,pz,nx,ny,nz,col,ao)=>{verts.push(px,py,pz,nx,ny,nz,col[0],col[1],col[2],ao);};
  const quad=(p0,p1,p2,p3,n,col,ao)=>{push(...p0,...n,col,ao);push(...p1,...n,col,ao);push(...p2,...n,col,ao);push(...p0,...n,col,ao);push(...p2,...n,col,ao);push(...p3,...n,col,ao);};
  const Hh=(x,z)=>(x<0||z<0||x>=ARENA_W||z>=ARENA_D)?6:heights[hidx(x,z)];
  for(let z=0;z<ARENA_D;z++)for(let x=0;x<ARENA_W;x++){
    const h=heights[hidx(x,z)];const col=arenaColor(x,z,h);
    const ao=0.72+0.28*(((K.hash2(x*3+1,z*3+7)>>>0)%100)/100);
    // top face
    quad([x,h,z+1],[x+1,h,z+1],[x+1,h,z],[x,h,z],[0,1,0],col,ao);
    // side faces where neighbor lower
    const sides=[[1,0,[1,0,0]],[ -1,0,[-1,0,0]],[0,1,[0,0,1]],[0,-1,[0,0,-1]]];
    for(const [dx,dz,n] of sides){
      const nh=Hh(x+dx,z+dz);
      if(nh<h){
        const y0=nh,y1=h;
        if(dx===1)quad([x+1,y0,z],[x+1,y0,z+1],[x+1,y1,z+1],[x+1,y1,z],n,col,ao*0.8);
        else if(dx===-1)quad([x,y0,z+1],[x,y0,z],[x,y1,z],[x,y1,z+1],n,col,ao*0.8);
        else if(dz===1)quad([x+1,y0,z+1],[x,y0,z+1],[x,y1,z+1],[x+1,y1,z+1],n,col,ao*0.8);
        else quad([x,y0,z],[x+1,y0,z],[x+1,y1,z],[x,y1,z],n,col,ao*0.8);
      }
    }
  }
  const data=new Float32Array(verts);
  quadCount=verts.length/10/6;
  if(!arenaVBO){arenaVBO=gl.createBuffer();arenaVAO=gl.createVertexArray();}
  gl.bindVertexArray(arenaVAO);
  gl.bindBuffer(gl.ARRAY_BUFFER,arenaVBO);
  gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);
  const stride=40;
  gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,stride,0);
  gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,3,gl.FLOAT,false,stride,12);
  gl.enableVertexAttribArray(2);gl.vertexAttribPointer(2,3,gl.FLOAT,false,stride,24);
  gl.enableVertexAttribArray(3);gl.vertexAttribPointer(3,1,gl.FLOAT,false,stride,36);
  gl.bindVertexArray(null);
  meshSeed=G.runSeed|0;
}
function syncArenaMesh(){
  try{
    const want=G.runSeed|0;
    if(meshSeed===want&&arenaVBO)return {ok:true,rebuilt:false,seed:want};
    genArena();buildArenaMesh();meshSeed=want;
    return {ok:true,rebuilt:true,seed:want};
  }catch(e){return {ok:false,error:String(e&&e.message||e)};}
}

