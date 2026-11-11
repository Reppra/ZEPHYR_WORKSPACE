import { createServer } from 'node:http';
import { build, config } from './lib/project.js';

const port=Number(process.argv[2]||4173);
if(!Number.isInteger(port)||port<1024||port>65535) throw new Error('Port must be 1024–65535');
const server=createServer((request,response)=>{
  const path=new URL(request.url,'http://localhost').pathname;
  if(path==='/favicon.ico') { response.writeHead(204); response.end(); return; }
  if(request.method!=='GET'||!['/','/'+config().artifact].includes(path)) { response.writeHead(404); response.end('Not found'); return; }
  try {
    const {html}=build();
    response.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    response.end(html);
  } catch(error) { response.writeHead(500,{'Content-Type':'text/plain'}); response.end(error.message); }
});
server.on('error',error=>{console.error(error.message);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>console.log(`REDBOLT dev server http://127.0.0.1:${port} (loopback only)`));
