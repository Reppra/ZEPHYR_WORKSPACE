"use strict";
/* work_010 critics: C1 ground-cheese | C2 overload drift | C3 lock-not-boom | C4 sandbox segfault gate | C5 critic fleet. MODE: BUILD */
/* ============================ WASM KERNEL (validated, stateless) ============================ */
function buildKernel(){
  const U = n => { const b=[]; n>>>=0; do { let x=n&0x7f; n>>>=7; if(n) x|=0x80; b.push(x); } while(n); return b; };
  const S = n => { const b=[]; let more=true; while(more){ let x=n&0x7f; n>>=7; if((n===0&&(x&0x40)===0)||(n===-1&&(x&0x40)!==0)) more=false; else x|=0x80; b.push(x); } return b; };
  const str = s => { const b=[]; for(let i=0;i<s.length;i++) b.push(s.charCodeAt(i)); return [...U(b.length), ...b]; };
  const vec = items => [...U(items.length), ...[].concat(...items)];
  const sec = (id, payload) => [id, ...U(payload.length), ...payload];
  const I = { get:i=>[0x20,...U(i)], set:i=>[0x21,...U(i)], tee:i=>[0x22,...U(i)],
    cst:n=>[0x41,...S(n|0)], add:[0x6a], sub:[0x6b], mul:[0x6c], divs:[0x6d], xor:[0x73], and:[0x71],
    shl:[0x74], shru:[0x76], shrs:[0x75], rotl:[0x77], eqz:[0x45], lts:[0x48], gts:[0x4a], les:[0x4c], ges:[0x4e],
    sel:[0x1b], call:i=>[0x10,...U(i)], end:[0x0b], ret:[0x0f], if:[0x04,0x40], clz:[0x67],
    block:[0x02,0x40], loop:[0x03,0x40], br:d=>[0x0c,...U(d)], brif:d=>[0x0d,...U(d)] };
  const ftype = (p,r)=>[0x60,...vec(p.map(t=>[t])),...vec(r.map(t=>[t]))];
  const i32=0x7f;
  const types=[ ftype([i32,i32],[i32]), ftype([i32],[i32]), ftype([i32,i32,i32],[i32]),
    ftype([i32,i32,i32,i32,i32,i32],[i32]), ftype([i32,i32,i32,i32],[i32]), ftype([],[i32]) ];
  const fns=[ {n:'imul32',t:0},{n:'iabs',t:1},{n:'iclamp',t:2},{n:'imin',t:0},{n:'imax',t:0},
    {n:'mix',t:2},{n:'hash2',t:0},{n:'hash3',t:2},{n:'rnd',t:1},{n:'noise2d',t:0},{n:'fbm2d',t:2},
    {n:'bilerp',t:3},{n:'smooth',t:1},{n:'fade',t:1},
    {n:'dist2q',t:4},{n:'steer2',t:2},{n:'gridHash',t:2} ];
  const exportIdx=[0,1,2,3,4,5,6,7,8,9,10,14,15,16];
  const body=(locals,code)=>{ const lc = locals>0 ? [...U(1),...U(locals),i32] : [...U(0)]; const b=[...lc,...code,I.end]; return [...U(b.length),...b]; };
  const bodies=[
    body(0,[...I.get(0),...I.get(1),I.mul]),
    body(0,[...I.cst(0),...I.get(0),I.sub,...I.get(0),...I.get(0),...I.cst(0),I.lts,I.sel]),
    body(1,[...I.get(1),...I.get(0),...I.get(0),...I.get(1),I.lts,I.sel,...I.set(3),
      ...I.get(3),...I.get(2),...I.get(2),...I.get(3),I.gts,I.sel]),
    body(0,[...I.get(0),...I.get(1),...I.get(0),...I.get(1),I.lts,I.sel]),
    body(0,[...I.get(0),...I.get(1),...I.get(0),...I.get(1),I.gts,I.sel]),
    body(0,[...I.get(0),...I.get(1),...I.get(0),I.sub,...I.get(2),I.mul,...I.cst(10),I.shrs,I.add]),
    body(1,[...I.get(0),...I.cst(374761393),I.mul,...I.get(1),...I.cst(668265263),I.mul,I.add,...I.set(2),
      ...I.get(2),...I.get(2),...I.cst(13),I.shru,I.xor,...I.cst(1274126177),I.mul,...I.set(2),
      ...I.get(2),...I.get(2),...I.cst(16),I.shru,I.xor]),
    body(1,[...I.get(0),...I.cst(374761393),I.mul,...I.get(1),...I.cst(668265263),I.mul,I.add,...I.get(2),...I.cst(2246822519),I.mul,I.add,...I.set(3),
      ...I.get(3),...I.get(3),...I.cst(13),I.shru,I.xor,...I.cst(1274126177),I.mul,...I.set(3),
      ...I.get(3),...I.get(3),...I.cst(16),I.shru,I.xor]),
    body(1,[...I.get(0),...I.set(1),...I.get(1),...I.get(1),...I.cst(13),I.shl,I.xor,...I.set(1),
      ...I.get(1),...I.get(1),...I.cst(17),I.shru,I.xor,...I.set(1),
      ...I.get(1),...I.get(1),...I.cst(5),I.shl,I.xor,...I.set(1),...I.get(1)]),
    body(6,[...I.get(0),...I.cst(4),I.shru,...I.set(2), ...I.get(1),...I.cst(4),I.shru,...I.set(3),
      ...I.get(0),...I.cst(15),I.and,...I.set(4), ...I.get(1),...I.cst(15),I.and,...I.set(5),
      ...I.get(4),...I.call(13),...I.set(4), ...I.get(5),...I.call(13),...I.set(5),
      ...I.get(2),...I.get(3),...I.call(6),...I.cst(1023),I.and,
      ...I.get(2),...I.cst(1),I.add,...I.get(3),...I.call(6),...I.cst(1023),I.and,
      ...I.get(2),...I.get(3),...I.cst(1),I.add,...I.call(6),...I.cst(1023),I.and,
      ...I.get(2),...I.cst(1),I.add,...I.get(3),...I.cst(1),I.add,...I.call(6),...I.cst(1023),I.and,
      ...I.get(4),...I.get(5),...I.call(11)]),
    body(7,[...I.get(2),...I.cst(1),...I.get(2),...I.cst(1),I.gts,I.sel,...I.set(2),
      ...I.get(2),...I.cst(8),...I.get(2),...I.cst(8),I.lts,I.sel,...I.set(2),
      ...I.cst(0),...I.set(3), ...I.cst(1024),...I.set(4), ...I.cst(0),...I.set(5),
      ...I.cst(0),...I.set(6), ...I.cst(0),...I.set(7),
      ...I.block, ...I.loop,
        ...I.get(3),...I.get(0),...I.cst(4),I.shl,...I.get(6),I.shl,...I.get(1),...I.cst(4),I.shl,...I.get(6),I.shl,...I.call(9),...I.get(4),I.mul,I.add,...I.set(3),
        ...I.get(5),...I.get(4),I.add,...I.set(5),
        ...I.get(4),...I.cst(1),I.shru,...I.set(4),
        ...I.get(6),...I.cst(1),I.add,...I.tee(6),...I.get(2),I.lts,...I.brif(0),
      ...I.end, ...I.end,
      ...I.get(3),...I.get(5),...I.cst(1),I.shru,I.add,...I.get(5),I.divs]),
    body(0,[...I.get(0),...I.get(1),...I.get(4),...I.call(5),
      ...I.get(2),...I.get(3),...I.get(4),...I.call(5),
      ...I.get(5),...I.call(5)]),
    body(0,[...I.get(0),...I.cst(1023),I.and,...I.get(0),...I.cst(10),I.shru,...I.cst(1024),I.add,I.mul]),
    body(2,[...I.get(0),...I.cst(64),I.mul,...I.set(1),
      ...I.get(1),...I.get(1),I.mul,...I.cst(10),I.shru,...I.set(2),
      ...I.get(2),...I.get(1),I.mul,...I.cst(10),I.shru,...I.set(1),
      ...I.cst(3),...I.get(2),I.mul,...I.cst(2),...I.get(1),I.mul,I.sub]),
    // dist2q(x1,z1,x2,z2): squared distance, i32-wrapped like the JS mirror
    body(2,[...I.get(2),...I.get(0),I.sub,...I.set(4),
      ...I.get(3),...I.get(1),I.sub,...I.set(5),
      ...I.get(4),...I.get(4),I.mul,...I.get(5),...I.get(5),I.mul,I.add]),
    // steer2(dx,dz,speedQ10): Q10 velocity component along (dx,dz); sentinel 0x80000000 at d2=0; overflow saturates
    body(5,[...I.cst(0),...I.cst(0),...I.get(0),...I.get(1),...I.call(14),...I.set(3),
      ...I.get(3),I.eqz,...I.if,...I.cst(-2147483648),I.ret,I.end,
      ...I.get(3),...I.cst(0),I.lts,...I.if,
        ...I.get(0),...I.cst(0),I.gts,...I.if,...I.cst(4096),I.ret,I.end,
        ...I.get(0),...I.cst(0),I.lts,...I.if,...I.cst(-4096),I.ret,I.end,
        ...I.cst(0),I.ret,
      I.end,
      ...I.cst(32),...I.get(3),I.clz,I.sub,...I.cst(1),I.add,...I.cst(1),I.shru,...I.set(4),
      ...I.cst(1),...I.get(4),I.shl,...I.set(4),
      ...I.get(4),...I.get(3),...I.get(4),I.divs,I.add,...I.cst(1),I.shru,...I.set(4),
      ...I.get(4),...I.get(3),...I.get(4),I.divs,I.add,...I.cst(1),I.shru,...I.set(4),
      ...I.get(4),...I.get(3),...I.get(4),I.divs,I.add,...I.cst(1),I.shru,...I.set(4),
      ...I.get(4),...I.cst(1),I.lts,...I.if,...I.cst(1),...I.set(4),I.end,
      ...I.get(0),...I.get(2),I.mul,...I.get(4),I.divs,...I.set(5),
      ...I.get(5),...I.cst(-4096),...I.cst(4096),...I.call(2)]),
    // gridHash(x,z,log2cell): hash3 of the unsigned cell coords with fixed salt 7
    body(0,[...I.get(0),...I.get(2),I.shru,...I.get(1),...I.get(2),I.shru,...I.cst(7),...I.call(7)])
  ];
  const typeSec=sec(1,vec(types));
  const funcSec=sec(3,vec(fns.map(f=>U(f.t))));
  const expSec=sec(7,vec(exportIdx.map(i=>[...str(fns[i].n),0x00,...U(i)])));
  const codeSec=sec(10,vec(bodies));
  const bytes=new Uint8Array([0,0x61,0x73,0x6d,1,0,0,0,...typeSec,...funcSec,...expSec,...codeSec]);
  return { bytes, names: exportIdx.map(i=>fns[i].n) };
}
/* JS fallback mirrors the kernel semantics if WASM is unavailable. */
function jsKernel(){
  const imul=Math.imul;
  const hash2=(x,y)=>{let h=(imul(x,374761393)+imul(y,668265263))|0;h=imul(h^(h>>>13),1274126177);return (h^(h>>>16))|0;};
  const hash3=(x,y,z)=>{let h=(imul(x,374761393)+imul(y,668265263)+imul(z,2246822519))|0;h=imul(h^(h>>>13),1274126177);return (h^(h>>>16))|0;};
  const rnd=s=>{let x=s|0;x^=x<<13;x^=x>>>17;x^=x<<5;return x|0;};
  const mix=(a,b,t)=>(a+(((b-a)*t)>>10))|0;
  const fade=x=>{const u=x*64;const u2=(u*u)>>10;const u3=(u2*u)>>10;return (3*u2-2*u3)|0;};
  const noise2d=(x,y)=>{const cx=x>>4,cy=y>>4,fx=fade(x&15),fy=fade(y&15);
    const h00=hash2(cx,cy)&1023,h10=hash2(cx+1,cy)&1023,h01=hash2(cx,cy+1)&1023,h11=hash2(cx+1,cy+1)&1023;
    return mix(mix(h00,h10,fx),mix(h01,h11,fx),fy);};
  const fbm2d=(x,y,oct)=>{oct=Math.max(1,Math.min(8,oct|0));let sum=0,amp=1024,tot=0,f=0;
    for(let i=0;i<oct;i++){sum+=noise2d((x<<4)<<f,(y<<4)<<f)*amp;tot+=amp;amp>>=1;f++;}
    return Math.trunc((sum+(tot>>1))/tot);};
  const dist2q=(x1,z1,x2,z2)=>{const dx=(x2-x1)|0,dz=(z2-z1)|0;return (imul(dx,dx)+imul(dz,dz))|0;};
  const steer2=(dx,dz,speedQ10)=>{
    const d2=dist2q(0,0,dx,dz);
    if(d2===0)return -2147483648;
    if(d2<0)return dx>0?4096:dx<0?-4096:0;
    const k=32-Math.clz32(d2);
    let s=1<<((k+1)>>1);
    s=(s+((d2/s)|0))>>1;s=(s+((d2/s)|0))>>1;s=(s+((d2/s)|0))>>1;
    if(s<1)s=1;
    const out=(imul(dx,speedQ10)/s)|0;
    return out<-4096?-4096:out>4096?4096:out;
  };
  const gridHash=(x,z,l)=>hash3(x>>>l,z>>>l,7);
  return {imul32:(a,b)=>imul(a,b),iabs:a=>Math.abs(a|0),iclamp:(v,l,h)=>Math.max(l,Math.min(h,v)),
    imin:(a,b)=>Math.min(a,b),imax:(a,b)=>Math.max(a,b),mix,hash2,hash3,rnd,noise2d,fbm2d,dist2q,steer2,gridHash};
}
let K=null, K_WASM=false, K_BYTES=null;
function initKernel(){
  try{
    const k=buildKernel(); K_BYTES=k.bytes;
    if(typeof WebAssembly!=='undefined' && WebAssembly.validate(k.bytes)){
      K=new WebAssembly.Instance(new WebAssembly.Module(k.bytes)).exports; K_WASM=true; return;
    }
  }catch(e){ showErr('WASM init failed, using JS fallback: '+(e&&e.message||e)); }
  K=jsKernel(); K_WASM=false;
}

