import assert from 'node:assert/strict';
import {handleCC2Request,validateTutorRequest} from '../server/cc2-handler.mjs';
let passed=0;
async function run(name,fn){await fn();passed++;console.log('PASS',name);}
const sample={message:'Why?',context:{language:'python',problem:{title:'Hello',brief:'Add',contract:'solve(a,b)',independent:false},code:'def solve(a,b):\n  return a+b',evidence:{issue:'passed'}},history:[]};
const make=(body=sample,overrides={})=>new Request('http://localhost:5173/api/cc2',{method:'POST',headers:{'content-type':'application/json',...overrides},body:JSON.stringify(body)});
const env={CC2_ENABLED:'true',OPENAI_API_KEY:'test-token',CC2_MODEL:'test-model'};
await run('validator requires a real question',()=>assert.equal(validateTutorRequest({...sample,message:''}),null));
await run('validator accepts scoped evidence',()=>assert.equal(validateTutorRequest(sample).message,'Why?'));
await run('validator refuses browser-shaped junk',()=>assert.equal(validateTutorRequest({...sample,context:{secret:'all localStorage'}}),null));
await run('validator enforces message and code limits',()=>assert.equal(validateTutorRequest({...sample,message:'x'.repeat(1201)}),null));
await run('no API without explicit server enablement',async()=>{const r=await handleCC2Request(make(),{...env,CC2_ENABLED:'false'});assert.equal(r.status,503);});
await run('no API without a server secret',async()=>{const r=await handleCC2Request(make(),{CC2_ENABLED:'true'});assert.equal(r.status,503);});
await run('cross-origin requests blocked',async()=>{const r=await handleCC2Request(make(sample,{origin:'https://attacker.example'}),env);assert.equal(r.status,403);});
await run('invalid content type rejected',async()=>{const r=await handleCC2Request(new Request('http://localhost/api/cc2',{method:'POST',headers:{'content-type':'text/plain'},body:'anything'}),env);assert.equal(r.status,415);});
await run('valid AI explanation is parsed and sent back',async()=>{
let requested;const fake=async(url,options)=>{requested={url,options};return new Response(JSON.stringify({output:[{content:[{type:'output_text',text:'Check the loop condition.'}]}]}),{status:200,headers:{'Content-Type':'application/json'}});};
const r=await handleCC2Request(make(),env,fake);assert.equal(r.status,200);assert.equal((await r.json()).reply,'Check the loop condition.');const sent=JSON.parse(requested.options.body);assert.equal(sent.store,false);assert.equal(sent.max_output_tokens,420);assert.equal(sent.model,'test-model');assert(!JSON.stringify(sent).includes('test-token'));assert(requested.url.endsWith('/v1/responses'));
});
await run('upstream errors never leak provider data',async()=>{const r=await handleCC2Request(make(),env,async()=>new Response('SECRET INTERNAL DETAILS',{status:500}));assert.equal(r.status,502);assert(!JSON.stringify(await r.json()).includes('SECRET'));});
await run('empty upstream output is rejected',async()=>{const r=await handleCC2Request(make(),env,async()=>new Response(JSON.stringify({output:[]}),{status:200}));assert.equal(r.status,502);});
await run('context is allowlisted rather than forwarding extra profile data',()=>{
  const parsed=validateTutorRequest({...sample,context:{...sample.context,notes:'PRIVATE_PROFILE',problem:{...sample.context.problem,notes:'PRIVATE_PROFILE'},evidence:{issue:'passed',notes:'PRIVATE_PROFILE'}}});
  assert(parsed);assert(!JSON.stringify(parsed).includes('PRIVATE_PROFILE'));
});
await run('malformed history is rejected',()=>assert.equal(validateTutorRequest({...sample,history:{role:'system'}}),null));
await run('same host with a different scheme is cross-origin',async()=>assert.equal((await handleCC2Request(make(sample,{origin:'https://localhost:5173'}),env)).status,403));
await run('GET is rejected',async()=>assert.equal((await handleCC2Request(new Request('http://localhost/api/cc2'),env)).status,405));
await run('malformed JSON is rejected',async()=>assert.equal((await handleCC2Request(new Request('http://localhost/api/cc2',{method:'POST',headers:{'content-type':'application/json'},body:'{'}),env)).status,400));
await run('oversized requests are rejected',async()=>assert.equal((await handleCC2Request(make({...sample,message:'x'.repeat(27000)}),env)).status,413));
await run('provider exceptions do not expose internal data',async()=>{
  const response=await handleCC2Request(make(sample,{'x-nf-client-connection-ip':'exceptions-check'}),env,async()=>{throw Error('SECRET_INTERNAL');});
  assert.equal(response.status,502);assert(!(await response.text()).includes('SECRET_INTERNAL'));
});
await run('message rate limit stops upstream calls',async()=>{
  let calls=0;
  const fake=async()=>{calls++;return new Response(JSON.stringify({output:[{content:[{type:'output_text',text:'One short hint.'}]}]}));};
  for(let i=0;i<13;i++){
    const response=await handleCC2Request(make(sample,{'x-nf-client-connection-ip':'rate-limit-check'}),env,fake);
    assert.equal(response.status,i<12?200:429);
  }
  assert.equal(calls,12);
});
console.log(`${passed} backend checks passed.`);
