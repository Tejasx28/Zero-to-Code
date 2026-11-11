import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { handleCC2Request } from './server/cc2-handler.mjs';

export default defineConfig(({mode})=>{
  // Unlike VITE_* variables, OPENAI_API_KEY is only ever read by this server-side dev handler.
  const localEnv=loadEnv(mode,process.cwd(),'');
  return {
    plugins:[react(),{
      name:'cc2-local-api',
      configureServer(server){
        server.middlewares.use('/api/cc2',(req,res)=>{
          if(req.method!=='POST'){res.writeHead(405,{'Content-Type':'application/json','Allow':'POST'});res.end(JSON.stringify({error:'POST is required.'}));return;}
          void (async()=>{
            const decoder=new TextDecoder();let raw='';let length=0;
            for await(const chunk of req){
              const bytes=typeof chunk==='string'?new TextEncoder().encode(chunk):chunk as Uint8Array;
              length+=bytes.byteLength;
              if(length>26000){res.writeHead(413,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Request too large.'}));return;}
              raw+=decoder.decode(bytes,{stream:true});
            }
            raw+=decoder.decode();
            const request=new Request(`http://${req.headers.host||'localhost'}/api/cc2`,{
              method:'POST',headers:{'content-type':req.headers['content-type']||'application/json',...(req.headers.origin?{origin:req.headers.origin}:{})},
              body:raw,
            });
            const answer=await handleCC2Request(request,{...process.env,...localEnv});
            res.writeHead(answer.status,Object.fromEntries(answer.headers.entries()));res.end(await answer.text());
          })().catch(()=>{if(!res.headersSent){res.writeHead(500,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Local tutor unavailable.'}));}});
        });
      },
    }],
    base:'/',
    server:{watch:{ignored:['**/PLAY-DSA-QUEST.html','**/work-verification/**']}},
  };
});
