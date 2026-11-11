import type { Exercise, Language } from './curriculum';

export interface TraceFrame {line:number;event:'line'|'return'|'exception';locals:Record<string,unknown>;returned?:unknown;exception?:string}
export interface ActualResult {actual?:unknown;error?:string;line?:number;trace?:TraceFrame[]}
export interface RunResult {results:ActualResult[];stdout:string;error?:string;attempted?:boolean}
export interface CodeRun {cancel:()=>void;result:Promise<RunResult>}
export interface RunOptions {cases?:(number|number[])[][];trace?:boolean}
export interface SyntaxCheck {valid:boolean;line?:number;message?:string}

export const RUN_CANCELLED = 'Run cancelled. Your draft is saved.';
const MAX_SOURCE_LENGTH = 60000;
const MAX_CASES = 60;
const MAX_TRACE_FRAMES = 180;
const MAX_RETURN_SIZE = 128000;
const BOOT_TIMEOUT_MS = 150000;
const RUN_TIMEOUT_MS: Record<Language,number> = {python:10000,java:45000};

const failed = (message:string):RunResult=>({results:[],stdout:'',error:message,attempted:false});
const record = (value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const own = (value:Record<string,unknown>,key:string)=>Object.prototype.hasOwnProperty.call(value,key);

/** Treat a worker message as untrusted until its complete case count is checked. */
export function normalizeWorkerResult(payload:unknown,expectedCases:number):RunResult {
  if(!Number.isInteger(expectedCases)||expectedCases<1||expectedCases>MAX_CASES)return failed('The runner needs a non-empty valid test suite. No attempt was recorded.');
  if(!record(payload))return failed('The runner returned an invalid response. Retry your code. Your draft is saved.');
  if(own(payload,'error')&&payload.error!==undefined&&typeof payload.error!=='string')return failed('The runner returned an invalid error report. Retry; no attempt was recorded.');
  if(typeof payload.error==='string'&&payload.error.trim())return failed(payload.error.slice(0,2000));
  if(!Array.isArray(payload.results))return failed('The runner did not return test results. Retry; no attempt was recorded.');
  if(payload.results.length!==expectedCases)return failed(`The runner returned ${payload.results.length} of ${expectedCases} cases. Retry; no attempt was recorded.`);
  const results:ActualResult[]=[];
  for(let i=0;i<payload.results.length;i++){
    const value:unknown=payload.results[i];
    if(!record(value)||(!own(value,'actual')&&typeof value.error!=='string'))return failed(`Test ${i+1} had an invalid result. Retry; no attempt was recorded.`);
    if(own(value,'error')&&typeof value.error!=='string')return failed(`Test ${i+1} had an invalid error report. Retry; no attempt was recorded.`);
    const row:ActualResult={};
    if(own(value,'actual')){
      try{
        const encoded=JSON.stringify(value.actual);
        if(encoded===undefined||encoded.length>MAX_RETURN_SIZE)return failed(`Test ${i+1} returned too much data. Check your return value and retry.`);
      }catch{return failed(`Test ${i+1} returned an unreadable value. Check your return value and retry.`);}
      row.actual=value.actual;
    }
    if(typeof value.error==='string')row.error=value.error.slice(0,2000);
    if(Number.isInteger(value.line)&&(value.line as number)>0)row.line=value.line as number;
    if(Array.isArray(value.trace)){
      row.trace=[];
      let traceSize=0;
      for(const frame of value.trace.slice(0,MAX_TRACE_FRAMES)){
        if(!record(frame)||!Number.isInteger(frame.line)||(frame.line as number)<1||typeof frame.event!=='string'||!['line','return','exception'].includes(frame.event)||!record(frame.locals))continue;
        try{
          const encoded=JSON.stringify({line:frame.line,event:frame.event,locals:frame.locals,...(own(frame,'returned')?{returned:frame.returned}:{}),...(typeof frame.exception==='string'?{exception:frame.exception.slice(0,1000)}:{})});
          if(traceSize+encoded.length>MAX_RETURN_SIZE)break;
          row.trace.push(JSON.parse(encoded) as TraceFrame);traceSize+=encoded.length;
        }catch{/* Skip unreadable trace metadata; grading still uses the actual returned value. */}
      }
    }
    results.push(row);
  }
  return {results,stdout:typeof payload.stdout==='string'?payload.stdout.slice(0,4096):'',attempted:true};
}

/** Starts an isolated worker for each run, so learner code cannot leak into the next one. */
export function runCode(language:Language,exercise:Exercise,source:string,status:(s:string)=>void,options:RunOptions={}):CodeRun {
  let worker:Worker|undefined,timer:number|undefined,settled=false,phase:'loading'|'running'='loading';
  let finish:(r:RunResult)=>void=()=>{};
  const result=new Promise<RunResult>(resolve=>{
    finish=value=>{
      if(settled)return;
      settled=true;
      window.clearTimeout(timer);
      try{worker?.terminate();}catch{/* The result must settle even when cleanup fails. */}
      worker=undefined;
      resolve(value);
    };
    try{
      if(window.location.protocol==='file:'){
        finish(failed('Start DSA Quest with npm run dev and open the Local address. The HTML snapshot cannot execute code.'));
        return;
      }
      if(source.length>MAX_SOURCE_LENGTH){finish(failed('This program is too long for the browser runner. Keep the source under 60,000 characters.'));return;}
      const cases=options.cases??exercise.cases.map(test=>test.args);
      if(!Array.isArray(cases)||cases.length<1||cases.length>MAX_CASES){finish(failed('This run needs between 1 and 60 test cases. No attempt was recorded.'));return;}
      const base=new URL(import.meta.env.BASE_URL,window.location.href);
      worker=new Worker(new URL(`runners/${language}-worker.js`,base));
      timer=window.setTimeout(()=>finish(failed('Runtime download timed out. Check your internet connection and retry. Your draft is saved.')),BOOT_TIMEOUT_MS);
      worker.onerror=()=>finish(failed('The browser runtime could not load or crashed. Check your connection and retry. Your draft is saved.'));
      worker.onmessageerror=()=>finish(failed('The browser could not read a runtime message. Retry; your draft is saved.'));
      worker.onmessage=({data}:MessageEvent<unknown>)=>{
        if(settled||!record(data))return;
        if(data.type==='status'){
          if(typeof data.message==='string')status(data.message.slice(0,300));
        }else if(data.type==='ready'){
          if(phase==='running')return; // A duplicated ready event must not extend execution time.
          phase='running';
          status(language==='java'?'Compiling and testing your Java…':'Running your Python tests…');
          window.clearTimeout(timer);
          timer=window.setTimeout(()=>finish(failed('Execution stopped. Check for a loop that never ends, then retry. Your code is saved.')),RUN_TIMEOUT_MS[language]);
        }else if(data.type==='error'){
          finish(failed(typeof data.message==='string'?data.message.slice(0,2000):'The runtime encountered an unknown error. Your draft is saved.'));
        }else if(data.type==='result'){
          if(phase!=='running')finish(failed('The runner replied before it was ready. Retry; no attempt was recorded.'));
          else finish(normalizeWorkerResult(data,cases.length));
        }
      };
      worker.postMessage({source,cases,kind:exercise.kind,trace:options.trace===true});
    }catch(error){finish(failed(`The code runner could not start. ${String(error).slice(0,500)}`));}
  });
  return{result,cancel:()=>finish(failed(RUN_CANCELLED))};
}

export function matches(actual:unknown,expected:unknown):boolean{return JSON.stringify(actual)===JSON.stringify(expected);}

export function normalizeSyntaxChecks(payload:unknown,expectedSources:number):{checks:SyntaxCheck[];error?:string} {
  if(!Number.isInteger(expectedSources)||expectedSources<1||expectedSources>6)return{checks:[],error:'The spacing checker needs a non-empty candidate list.'};
  if(!Array.isArray(payload)||payload.length!==expectedSources)return{checks:[],error:'The Python spacing check returned incomplete evidence. The draft has not changed.'};
  const checks:SyntaxCheck[]=[];
  for(const item of payload){
    if(!record(item)||typeof item.valid!=='boolean')return{checks:[],error:'The Python spacing check returned invalid evidence. The draft has not changed.'};
    if(item.valid){checks.push({valid:true});continue;}
    if(!Number.isInteger(item.line)||(item.line as number)<1||typeof item.message!=='string')return{checks:[],error:'The Python spacing check returned invalid error details. The draft has not changed.'};
    checks.push({valid:false,line:item.line as number,message:item.message.slice(0,1000)});
  }
  return{checks};
}

export function checkPythonSpacing(sources:string[],status:(message:string)=>void):{cancel:()=>void;result:Promise<{checks:SyntaxCheck[];error?:string}>}{
  let worker:Worker|undefined,timer:number|undefined,finished=false,phase:'loading'|'running'='loading',resolveResult:(value:{checks:SyntaxCheck[];error?:string})=>void=()=>{};
  const finish=(value:{checks:SyntaxCheck[];error?:string})=>{
    if(finished)return;
    finished=true;
    window.clearTimeout(timer);
    try{worker?.terminate();}catch{/* Still resolve the check. */}
    worker=undefined;
    resolveResult(value);
  };
  const result=new Promise<{checks:SyntaxCheck[];error?:string}>(resolve=>{
    resolveResult=resolve;
    if(window.location.protocol==='file:'){finish({checks:[],error:'Open the local website to check spacing.'});return;}
    if(!Array.isArray(sources)||!sources.length||sources.length>6||sources.some(source=>typeof source!=='string'||source.length>MAX_SOURCE_LENGTH)){
      finish({checks:[],error:'This draft is too large for a spacing preview.'});return;
    }
    try{
      worker=new Worker(new URL('runners/python-worker.js',new URL(import.meta.env.BASE_URL,window.location.href)));
      timer=window.setTimeout(()=>finish({checks:[],error:'Python could not load. Your code has not changed.'}),BOOT_TIMEOUT_MS);
      worker.onerror=()=>finish({checks:[],error:'Python could not check the preview. Your code has not changed.'});
      worker.onmessageerror=()=>finish({checks:[],error:'The spacing checker sent an unreadable response. Your code has not changed.'});
      worker.onmessage=({data}:MessageEvent<unknown>)=>{
        if(finished||!record(data))return;
        if(data.type==='status'){
          if(typeof data.message==='string')status(data.message.slice(0,300));
        }else if(data.type==='ready'){
          if(phase==='running')return;
          phase='running';
          status('Checking spacing with Python…');
          window.clearTimeout(timer);
          timer=window.setTimeout(()=>finish({checks:[],error:'The spacing check stopped. Your code has not changed.'}),RUN_TIMEOUT_MS.python);
        }else if(data.type==='syntax'){
          finish(phase==='running'?normalizeSyntaxChecks(data.checks,sources.length):{checks:[],error:'The spacing checker replied before it was ready.'});
        }else if(data.type==='error'){
          finish({checks:[],error:typeof data.message==='string'?data.message.slice(0,2000):'The spacing checker failed.'});
        }
      };
      worker.postMessage({action:'syntax',sources});
    }catch{finish({checks:[],error:'The spacing check could not start. Your code has not changed.'});}
  });
  return{result,cancel:()=>finish({checks:[],error:'Spacing check stopped. Your code has not changed.'})};
}
