/* ============================ MATH ============================ */
function clamp(v,a,b){return v<a?a:v>b?b:v;}
function lerp(a,b,t){return a+(b-a)*t;}
function rand01(){G.rng=(K.rnd(G.rng)||123456789)|0;return ((G.rng>>>0)%100000)/100000;}
function v3sub(a,b){return [a[0]-b[0],a[1]-b[1],a[2]-b[2]];}
function v3dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];}
function v3cross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
function v3norm(a){const l=Math.hypot(a[0],a[1],a[2])||1;return [a[0]/l,a[1]/l,a[2]/l];}
function m4Identity(){return new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);}
function m4Perspective(fovy,aspect,near,far){const f=1/Math.tan(fovy/2),nf=1/(near-far);
  return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*nf,-1,0,0,2*far*near*nf,0]);}
function m4LookAt(eye,center,up){const z=v3norm(v3sub(eye,center)),x=v3norm(v3cross(up,z)),y=v3cross(z,x);
  return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-v3dot(x,eye),-v3dot(y,eye),-v3dot(z,eye),1]);}
function m4Mul(a,b){const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++){let s=0;for(let k=0;k<4;k++)s+=a[k*4+r]*b[c*4+k];o[c*4+r]=s;}return o;}
function matFinite(m){if(!m||m.length<16)return false;for(let i=0;i<16;i++)if(!Number.isFinite(m[i]))return false;return true;}

