import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { checkPythonSpacing, normalizeSyntaxChecks, normalizeWorkerResult, RUN_CANCELLED, runCode } from './runtime';
import type { Exercise } from './curriculum';

class FakeWorker {
  static instances:FakeWorker[]=[];
  onmessage:((event:MessageEvent)=>void)|null=null;
  onerror:((event:ErrorEvent)=>void)|null=null;
  onmessageerror:((event:MessageEvent)=>void)|null=null;
  readonly sent:unknown[]=[];
  terminated=false;
  constructor(readonly url:URL){FakeWorker.instances.push(this);}
  postMessage(data:unknown){this.sent.push(data);}
  terminate(){this.terminated=true;}
  emit(data:unknown){this.onmessage?.({data} as MessageEvent);}
}
const exercise={kind:'array',cases:[{args:[[1,2]],expected:3,label:'Sum'}]} as Exercise;
const validResponse={type:'result',results:[{actual:3}],stdout:''};
const worker=()=>FakeWorker.instances.at(-1)!;

beforeEach(()=>{
  vi.useFakeTimers();
  FakeWorker.instances=[];
  vi.stubGlobal('window',{
    location:{protocol:'http:',href:'http://localhost:5173/'},
    setTimeout:(fn:()=>void,ms:number)=>setTimeout(fn,ms),
    clearTimeout:(id:number|undefined)=>clearTimeout(id),
  });
  vi.stubGlobal('Worker',FakeWorker);
});
afterEach(()=>{vi.clearAllTimers();vi.useRealTimers();vi.unstubAllGlobals();});

describe('browser execution reliability',()=>{
  it('accepts a complete suite and marks it as an actual attempt',async()=>{
    const status:string[]=[];
    const run=runCode('python',exercise,'def solve(values): return sum(values)',message=>status.push(message));
    expect(FakeWorker.instances).toHaveLength(1);
    expect(worker().sent).toHaveLength(1);
    worker().emit({type:'status',message:'Loading Python…'});
    worker().emit({type:'ready'});
    worker().emit(validResponse);
    expect(await run.result).toMatchObject({results:[{actual:3}],attempted:true});
    expect(worker().terminated).toBe(true);
    expect(status).toContain('Loading Python…');
  });
  it('treats missing or extra cases as unfinished, never a passing attempt',()=>{
    expect(normalizeWorkerResult({results:[],stdout:''},1)).toMatchObject({attempted:false,error:expect.stringContaining('0 of 1')});
    expect(normalizeWorkerResult({results:[{actual:3},{actual:3}]},1).attempted).toBe(false);
    expect(normalizeWorkerResult({results:[{}]},1).attempted).toBe(false);
  });
  it('keeps per-case compiler or runtime errors as a genuine failed attempt',()=>{
    const result=normalizeWorkerResult({results:[{error:'NameError: x is not defined',line:4}],stdout:''},1);
    expect(result).toMatchObject({attempted:true,results:[{error:expect.stringContaining('NameError'),line:4}]});
  });
  it('rejects a global worker error even if all returned rows happen to match',()=>{
    const result=normalizeWorkerResult({results:[{actual:3}],error:'Java crashed'},1);
    expect(result.attempted).toBe(false);
  });
  it('caps returned traces and fails oversized results without granting a pass',()=>{
    const frames=Array.from({length:250},(_,i)=>({line:i+1,event:'line',locals:{x:i}}));
    expect(normalizeWorkerResult({results:[{actual:3,trace:frames}]},1).results[0].trace).toHaveLength(180);
    expect(normalizeWorkerResult({results:[{actual:'x'.repeat(128001)}]},1).attempted).toBe(false);
  });
  it('cancelled runs terminate their worker, do not count, and ignore late replies',async()=>{
    const status:string[]=[];
    const run=runCode('python',exercise,'def solve(values): return 3',s=>status.push(s));
    const w=worker();run.cancel();w.emit({type:'ready'});w.emit(validResponse);
    expect(await run.result).toMatchObject({attempted:false,error:RUN_CANCELLED});
    expect(status).toEqual([]);
    expect(w.terminated).toBe(true);
  });
  it('a duplicate ready signal cannot extend Python execution time',async()=>{
    const run=runCode('python',exercise,'def solve(values): return 3',()=>{});
    worker().emit({type:'ready'});
    vi.advanceTimersByTime(6000);
    worker().emit({type:'ready'});
    vi.advanceTimersByTime(4000);
    expect(await run.result).toMatchObject({attempted:false,error:expect.stringContaining('Execution stopped')});
  });
  it('distinguishes a cold-start timeout from a running-loop timeout',async()=>{
    const cold=runCode('python',exercise,'def solve(values): return 3',()=>{});
    vi.advanceTimersByTime(150000);
    expect(await cold.result).toMatchObject({attempted:false,error:expect.stringContaining('download timed out')});
    const active=runCode('java',exercise,'public class Solution {}',()=>{});
    worker().emit({type:'ready'});
    vi.advanceTimersByTime(45000);
    expect(await active.result).toMatchObject({attempted:false,error:expect.stringContaining('Execution stopped')});
  });
  it('invalid source length fails before allocating a worker',async()=>{
    const run=runCode('python',exercise,'x'.repeat(60001),()=>{});
    expect((await run.result).attempted).toBe(false);
    expect(FakeWorker.instances).toHaveLength(0);
  });
  it('ignores malformed worker events and rejects replies that arrive too early',async()=>{
    const run=runCode('python',exercise,'def solve(values): return 3',()=>{});
    worker().emit(null);worker().emit(validResponse);
    expect(await run.result).toMatchObject({attempted:false,error:expect.stringContaining('before it was ready')});
  });
});

describe('Python spacing preview',()=>{
  it('requires one valid syntax result for each preview source',()=>{
    expect(normalizeSyntaxChecks([{valid:true}],2).error).toContain('incomplete');
    expect(normalizeSyntaxChecks([{valid:'yes'}],1).error).toContain('invalid');
    expect(normalizeSyntaxChecks([{valid:false,line:2,message:'indentation'}],1).checks).toEqual([{valid:false,line:2,message:'indentation'}]);
  });
  it('rejects partial spacing responses without changing the source',async()=>{
    const run=checkPythonSpacing(['def solve():\n pass','def solve():\n return 1'],()=>{});
    worker().emit({type:'ready'});
    worker().emit({type:'syntax',checks:[{valid:true}]});
    expect(await run.result).toMatchObject({checks:[],error:expect.stringContaining('incomplete')});
  });
  it('stops spacing validation without approving any patch',async()=>{
    const run=checkPythonSpacing(['def solve():\n return 1'],()=>{});
    run.cancel();
    expect(await run.result).toMatchObject({checks:[],error:expect.stringContaining('stopped')});
    expect(worker().terminated).toBe(true);
  });
});
