import type { Exercise, Language } from './curriculum';
export interface TraceFrame {line:number;event:'line'|'return'|'exception';locals:Record<string,unknown>;returned?:unknown;exception?:string}
export interface ActualResult {actual?:unknown;error?:string;line?:number;trace?:TraceFrame[]}
export interface RunResult {results:ActualResult[];stdout:string;error?:string;attempted?:boolean}
export interface CodeRun {cancel:()=>void;result:Promise<RunResult>}
export interface RunOptions {cases?:(number|number[])[][];trace?:boolean}
export function runCode(language:Language,exercise:Exercise,source:string,status:(s:string)=>void,options:RunOptions={}):CodeRun {
  let worker:Worker|undefined,timer:number|undefined,settled=false;
  let finish:(r:RunResult)=>void=()=>{};
  const result=new Promise<RunResult>(resolve=>{
    finish=(value)=>{if(settled)return;settled=true;window.clearTimeout(timer);worker?.terminate();resolve(value);};
    try{
      if(window.location.protocol==='file:'){finish({results:[],stdout:'',error:'Start DSA Quest with npm run dev, then open the Local address it prints to run code. This HTML snapshot can preview the lessons and games.'});return;}
      const base=new URL(import.meta.env.BASE_URL,window.location.href);
      worker=new Worker(new URL(`runners/${language}-worker.js`,base));
      timer=window.setTimeout(()=>finish({results:[],stdout:'',error:'Runtime download timed out. Check your internet connection and try again. Your code is saved.'}),150000);
      worker.onerror=()=>finish({results:[],stdout:'',error:'The browser runtime could not load. Check your connection, use npm run dev, and retry. Your code is saved.'});
      worker.onmessage=({data})=>{
        if(data.type==='status')status(data.message);
        else if(data.type==='ready'){status(language==='java'?'Compiling and testing your Java…':'Running your Python tests…');window.clearTimeout(timer);timer=window.setTimeout(()=>finish({results:[],stdout:'',error:'Execution stopped. Check for a loop that never ends, then retry. Your code is saved.'}),language==='java'?45000:10000);}
        else if(data.type==='error')finish({results:[],stdout:'',error:data.message});
        else if(data.type==='result')finish({results:Array.isArray(data.results)?data.results:[],stdout:String(data.stdout??''),error:data.error,attempted:true});
      };
      worker.postMessage({source,cases:options.cases??exercise.cases.map(c=>c.args),kind:exercise.kind,trace:options.trace===true});
    }catch(error){finish({results:[],stdout:'',error:String(error)});}
  });
  return{result,cancel:()=>finish({results:[],stdout:'',error:'Run cancelled. Your draft is saved.'})};
}
export function matches(actual:unknown,expected:unknown):boolean{return JSON.stringify(actual)===JSON.stringify(expected);}

export interface SyntaxCheck {valid:boolean;line?:number;message?:string}
export function checkPythonSpacing(sources:string[],status:(message:string)=>void):{cancel:()=>void;result:Promise<{checks:SyntaxCheck[];error?:string}>}{
  let worker:Worker|undefined,timer:number|undefined,finished=false,resolveResult:(value:{checks:SyntaxCheck[];error?:string})=>void=()=>{};
  const finish=(value:{checks:SyntaxCheck[];error?:string})=>{if(finished)return;finished=true;window.clearTimeout(timer);worker?.terminate();resolveResult(value);};
  const result=new Promise<{checks:SyntaxCheck[];error?:string}>(resolve=>{
    resolveResult=resolve;
    if(window.location.protocol==='file:'){finish({checks:[],error:'Open the local website to check spacing.'});return;}
    if(!sources.length||sources.length>6||sources.some(source=>source.length>60000)){finish({checks:[],error:'This draft is too large for a spacing preview.'});return;}
    try{
      worker=new Worker(new URL('runners/python-worker.js',new URL(import.meta.env.BASE_URL,window.location.href)));
      timer=window.setTimeout(()=>finish({checks:[],error:'Python could not load. Your code has not changed.'}),150000);
      worker.onerror=()=>finish({checks:[],error:'Python could not check the preview. Your code has not changed.'});
      worker.onmessage=({data})=>{
        if(data.type==='status')status(data.message);
        else if(data.type==='ready'){status('Checking spacing with Python…');window.clearTimeout(timer);timer=window.setTimeout(()=>finish({checks:[],error:'The spacing check stopped. Your code has not changed.'}),10000);}
        else if(data.type==='syntax')finish({checks:Array.isArray(data.checks)?data.checks:[]});
        else if(data.type==='error')finish({checks:[],error:String(data.message)});
      };
      worker.postMessage({action:'syntax',sources});
    }catch{finish({checks:[],error:'The spacing check could not start. Your code has not changed.'});}
  });
  return{result,cancel:()=>finish({checks:[],error:'Spacing check stopped. Your code has not changed.'})};
}
