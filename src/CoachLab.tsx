import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Bookmark, Check, ChevronLeft, ChevronRight, FlaskConical, Play, ScanEye, Square } from 'lucide-react';
import type { CCWorkspace } from './CCGuide';
import { useCC } from './CCGuide';
import type { QuestProgress } from './questState';
import type { QuestUpdate } from './CodeLab';
import { runCode } from './runtime';
import type { CodeRun, RunResult } from './runtime';
import { TestDesigner } from './TestDesigner';
import { changedSource } from './runComparison';
import { KeywordGuide } from './KeywordGuide';
import { parseCustomInput } from './studioHelpers';

const show=(v:unknown)=>{const s=JSON.stringify(v)??'not set';return s.length>420?s.slice(0,420)+'…':s;};
export interface ExperimentEvidence {source:string;args:(number|number[])[];claim:string;actual?:unknown;error?:string;}
export function readExperiment(raw:string|undefined,w:Pick<CCWorkspace,'exercise'>):ExperimentEvidence|null {
  try{const v=JSON.parse(raw??'');if(v&&typeof v.source==='string'&&v.source.length<=60000&&typeof v.claim==='string'&&v.claim.length<=500&&!parseCustomInput(JSON.stringify(v.args),w.exercise.kind).error&&(!v.error||typeof v.error==='string'))return v;}catch{/* Keep old optional notes intact. */}return null;
}
export function experimentObservation(result:RunResult):{actual?:unknown;error?:string}|null {if(!result.attempted||!result.results[0])return null;const row=result.results[0];return{actual:row.actual,error:row.error??result.error};}
export function ExperimentLab({workspace:w,progress:p,update}:{workspace:CCWorkspace;progress:QuestProgress;update:QuestUpdate}) {
  const cc=useCC(),saveKey=`cc:experiment:${w.key}`;
  const [before,setBefore]=useState<ExperimentEvidence|null>(()=>readExperiment(p.drafts[saveKey],w)),[after,setAfter]=useState<ExperimentEvidence|null>(null),[busy,setBusy]=useState(false),[status,setStatus]=useState('');
  const handle=useRef<CodeRun|null>(null);
  useEffect(()=>{setBusy(false);setAfter(null);return()=>{handle.current?.cancel();handle.current=null;};},[w.source,w.key]);
  const failed=w.result?.results.findIndex((row,i)=>row.error||show(row.actual)!==show(w.exercise.cases[i]?.expected))??0;
  const initialArgs=w.customArgs??w.exercise.cases[Math.max(0,failed)]?.args;
  const edited=Boolean(before&&before.source!==w.source),change=before?changedSource(before.source,w.source):null;
  async function run(args:(number|number[])[],compare=false){
    if(handle.current||w.running)return;
    setBusy(true);setStatus('Running your experiment. Your task score will not change.');
    const active=runCode(w.language,w.exercise,w.source,setStatus,{cases:[args],trace:false});handle.current=active;
    const result=await active.result;if(handle.current!==active)return;handle.current=null;setBusy(false);
    const observation=experimentObservation(result);
    if(!observation){setStatus(result.error??'The run did not finish. No observation was saved.');return;}
    const entry={source:w.source,args,claim:'',...observation};
    if(compare&&before){setAfter(entry);setStatus('Same input. Two versions of your code. Compare the evidence.');cc.reactTo('explore','Here are the two returns. Run the full tests to check the other inputs.');}
    else{setBefore(entry);setAfter(null);update(old=>({...old,drafts:{...old.drafts,[saveKey]:JSON.stringify(entry)}}));setStatus('Observation saved. Edit one relevant line, then rerun this exact input.');}
  }
  return <div className="cc-experiment-lab"><span className="section-kicker">ONE INPUT · TWO VERSIONS</span><h3>Try one change.</h3><p>I’ll save what this code returns. Change a line, then rerun the same input.</p>
    {before&&<section className="experiment-anchor"><span><Bookmark size={14}/>SAVED OBSERVATION</span><code>solve({before.args.map(show).join(', ')})</code><p>{before.error??`Returned ${show(before.actual)}`}</p><button className="coach-primary" disabled={busy||w.running||!edited} onClick={()=>{void run(before.args,true);}}><FlaskConical size={16}/>{edited?'Run my changed code on this input':'Edit a line, then test the same input'}</button>{edited&&change&&<button className="coach-text-action" onClick={()=>w.onFocusLine?.(change.start)}>Inspect my change near line {change.start}<ArrowRight size={14}/></button>}</section>}
    {after&&before&&<section className="experiment-comparison"><h4>What actually changed?</h4><div><article><span>BEFORE</span><strong>{before.error?'Error':show(before.actual)}</strong>{before.error&&<small>{before.error}</small>}</article><ArrowRight size={18}/><article><span>AFTER</span><strong>{after.error?'Error':show(after.actual)}</strong>{after.error&&<small>{after.error}</small>}</article></div><p>{show(before.actual)===show(after.actual)&&before.error===after.error?'This input behaved the same. Your edit may matter on a different input.':'The behavior changed on this input. Run the full tests to check the rest.'}</p><button className="coach-text-action" onClick={()=>{setBefore(after);update(old=>({...old,drafts:{...old.drafts,[saveKey]:JSON.stringify(after)}}));setAfter(null);}}>Keep this as my next observation<Check size={14}/></button></section>}
    <details className="coach-details" open={!before}><summary>{before?'Start a different experiment':'Choose the input to investigate'}</summary><TestDesigner exercise={w.exercise} running={busy||w.running} onRun={args=>{void run(args);}} initialArgs={initialArgs}/></details>{busy&&<button className="coach-text-action" onClick={()=>{handle.current?.cancel();handle.current=null;setBusy(false);setStatus('Stopped. Your saved observation is unchanged.');}}><Square size={14}/>Stop experiment</button>}{status&&<p className="coach-feedback" role="status">{status}</p>}
  </div>;
}

export function traceChanges(frames:NonNullable<NonNullable<RunResult['results'][0]['trace']>>,watch:string) {return frames.map((frame,index)=>({frame,index})).filter(({frame,index})=>index===0||show(frame.locals[watch])!==show(frames[index-1].locals[watch]));}
export function TraceXRay({workspace:w}:{workspace:CCWorkspace}) {
  const cc=useCC(),selected=Math.min(cc.caseIndex,w.exercise.cases.length-1),row=w.result?.results[w.mode==='custom'?0:selected],frames=(row?.trace??[]).filter(f=>Object.keys(f.locals).length||f.event!=='line');
  const names=[...new Set(frames.flatMap(f=>Object.keys(f.locals)))],namesKey=names.join('|');
  const [watch,setWatch]=useState(''),[at,setAt]=useState(0),[pinned,setPinned]=useState(0);
  useEffect(()=>{const name=names.find(n=>!['values','commands','n','a','b','target','limit'].includes(n)&&frames.some(f=>typeof f.locals[n]==='number'))??names[0]??'';const first=Math.max(0,frames.findIndex(f=>Object.prototype.hasOwnProperty.call(f.locals,name)));setWatch(name);setAt(first);setPinned(first);},[w.result,selected,namesKey]);
  if(w.language==='java')return <div className="cc-xray"><ScanEye size={28}/><h3>Use an experiment for Java.</h3><p>Java gives real compiler errors and returned values. Variable snapshots are recorded for Python.</p>{row?.error&&<pre className="coach-source-line">{row.error}</pre>}<button className="coach-primary" onClick={()=>cc.setDeskTab('lab')}>Compare two versions on one input<ArrowRight size={16}/></button></div>;
  if(!frames.length)return <div className="cc-xray"><ScanEye size={28}/><h3>Record one full run.</h3><p>{row?.error?'Fix the syntax so Python can enter the function.':'Run the full tests in Python to record variable snapshots. Experiments compare returned results.'}</p><button className="coach-primary" disabled={w.running} onClick={row?.error?()=>cc.setDeskTab('clue'):w.onRun}>{row?.error?'Inspect the error':'Run my code'}<Play size={15}/></button></div>;
  const current=frames[Math.min(at,frames.length-1)],anchor=frames[Math.min(pinned,frames.length-1)],changes=traceChanges(frames,watch),next=changes.find(item=>item.index>at),numeric=frames.map((f,i)=>({i,value:f.locals[watch]})).filter((v):v is {i:number;value:number}=>typeof v.value==='number'&&Number.isFinite(v.value));
  const min=Math.min(...numeric.map(v=>v.value)),max=Math.max(...numeric.map(v=>v.value)),spread=max-min||1;
  return <div className="cc-xray"><span className="section-kicker">FREEZE TWO MOMENTS</span><h3>Where did this value change?</h3>{w.mode==='suite'&&<label className="coach-select">Input to inspect<select value={selected} onChange={e=>cc.setCaseIndex(Number(e.target.value))}>{w.exercise.cases.map((test,i)=><option key={test.label} value={i}>{test.label}</option>)}</select></label>}<label className="coach-select">Value to watch<select value={watch} onChange={e=>{const name=e.target.value,first=Math.max(0,frames.findIndex(f=>Object.prototype.hasOwnProperty.call(f.locals,name)));setWatch(name);setAt(first);setPinned(first);}}>{names.map(name=><option key={name}>{name}</option>)}</select></label>
    {numeric.length>1&&<svg className="watch-chart" viewBox="0 0 320 90" role="img" aria-label={`Recorded values of ${watch}`}><line x1="8" x2="312" y1="78" y2="78"/><polyline points={numeric.map(({i,value})=>`${8+i/Math.max(1,frames.length-1)*304},${78-(value-min)/spread*62}`).join(' ')}/><line className="chart-cursor" x1={8+at/Math.max(1,frames.length-1)*304} x2={8+at/Math.max(1,frames.length-1)*304} y1="8" y2="80"/></svg>}
    <div className="xray-moments">{[{title:'PINNED',frame:anchor,index:pinned},{title:'NOW',frame:current,index:at}].map(item=><article key={item.title}><span>{item.title} · step {item.index+1}</span><code>{watch}</code><strong>{show(item.frame.locals[watch])}</strong><small>{item.frame.event==='return'?'Returned after':item.frame.event==='exception'?'Error on':'Before'} line {item.frame.line}</small></article>)}</div>
    {Array.isArray(current.locals[watch])&&<div className="xray-array">{(current.locals[watch] as unknown[]).slice(0,24).map((value,i)=><div key={i} className={show((anchor.locals[watch] as unknown[]|undefined)?.[i])!==show(value)?'changed':''}><small>{i}</small><code>{show(value)}</code></div>)}</div>}
    <pre className="coach-active-instruction"><span>{current.line}</span>{w.source.split('\n')[current.line-1]}</pre><input aria-label="C.C. variable timeline" type="range" min={0} max={frames.length-1} value={at} onChange={e=>setAt(Number(e.target.value))}/><div className="xray-controls"><button disabled={at===0} aria-label="Previous recorded moment" onClick={()=>setAt(n=>n-1)}><ChevronLeft size={16}/></button><button onClick={()=>setPinned(at)}><Bookmark size={14}/>Pin this moment</button><button disabled={!next} onClick={()=>next&&setAt(next.index)}>Next change<ChevronRight size={16}/></button></div><button className="coach-text-action" onClick={()=>w.onFocusLine?.(current.line)}>See this line in my editor<ArrowRight size={14}/></button><details className="coach-details"><summary>Jump to a change in {watch}</summary><div className="change-tape">{changes.slice(0,24).map(({frame,index})=><button key={index} onClick={()=>setAt(index)}><span>step {index+1} · line {frame.line}</span><code>{show(frame.locals[watch])}</code></button>)}</div></details>{(row?.trace?.length??0)>=180&&frames.at(-1)?.event!=='return'&&<p className="coach-feedback">Only the first 180 events were recorded. Try a shorter input.</p>}
  </div>;
}

export function explainCodeLine(source:string,language:'python'|'java') {
  const line=source.trim();
  if(!line)return ['This line is empty. It separates ideas without doing any work.'];
  if(/^(#|\/\/)/.test(line))return ['This is a comment. It explains an idea to a reader.','The computer does not execute this comment.'];
  if(/^public\s+class\b/.test(line))return ['A Java class groups code. This workspace looks for a class named Solution.','The solve method goes inside its braces.'];
  if(/^pass\b/.test(line))return ['Pass does nothing. It keeps an unfinished Python block valid.','Replace it with the instructions your function needs.'];
  if(/^(def |public |private |static )/.test(line)&&/solve\s*\(/.test(line))return ['This names the function the tests will call.','The names inside the parentheses receive its inputs.','The function body must produce the promised result.'];
  if(/^return\b/.test(line))return ['Return sends this value back to the caller.','The current function call ends here. A return inside a loop also stops that loop.'];
  if(/^(for\b)/.test(line))return ['Repeat the indented or braced body for each value or index.',language==='python'?'Read the starting point and stopping rule. The stop value of range is excluded.':'Read the initial value, loop condition, and update. The condition is checked before each repetition.'];
  if(/^while\b/.test(line))return ['Check the condition before each repetition.','Something in the body must change so the loop can eventually stop.'];
  if(/^(if\b|elif\b|else if)/.test(line))return ['This condition chooses whether its body runs.','Try one input that makes it true and one that makes it false.'];
  if(/^(else\b)/.test(line))return ['Run this branch when the earlier condition did not choose its branch.'];
  if(/\.append\(/.test(line))return ['Append adds one value to the end of this Python list.','The existing order stays intact. The list becomes one element longer.'];
  if(/\+=|-=|\+\+|--/.test(line))return ['Update a value using its previous value.','Ask what this name held before the line and what it should hold afterward.'];
  if(/(?<![=!<>])=(?!=)/.test(line))return ['Compute the right side first, then store it on the left.','An indexed write replaces the old value in that position. Save it first if you still need it.'];
  if(/^[{};]+$/.test(line))return [language==='java'?'Braces group Java statements into a block. A closing brace ends that block.':'Check whether this punctuation belongs in Python. Python groups blocks with indentation.'];
  return ['Read the names and operations in this statement.','Run a small input. Inspect the values before and after this line.'];
}
export function LineReader({workspace:w}:{workspace:CCWorkspace}) {
  const cc=useCC(),lines=w.source.split('\n'),selected=Math.max(1,Math.min(lines.length,cc.lineNumber));
  return <div className="cc-line-reader"><span className="section-kicker">ONE LINE, IN PLAIN WORDS</span><h3>Read the instruction.</h3><label className="coach-select">Line<select value={selected} onChange={e=>cc.setLineNumber(Number(e.target.value))}>{lines.map((line,i)=><option value={i+1} key={i}>{i+1} · {line.trim().slice(0,48)||'(empty)'}</option>)}</select></label><pre className="coach-active-instruction"><span>{selected}</span>{lines[selected-1]}</pre><ul>{explainCodeLine(lines[selected-1],w.language).map(item=><li key={item}>{item}</li>)}</ul><button className="coach-text-action" onClick={()=>w.onFocusLine?.(selected)}>Go to this line<ArrowRight size={15}/></button><details className="coach-details"><summary>Explain a keyword in this code</summary><KeywordGuide language={w.language} source={w.source} onLocate={line=>{cc.setLineNumber(line);w.onFocusLine?.(line);}}/></details></div>;
}
