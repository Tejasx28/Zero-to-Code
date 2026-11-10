import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Bug, Check, Shield, Square, Swords } from 'lucide-react';
import type { QuestProgress } from './questState';
import type { QuestUpdate } from './CodeLab';
import { runCode } from './runtime';
import type { CodeRun } from './runtime';
import { ARENA_EXERCISE, BUG_DRONES, firstMatch } from './questArcadeContent';
import { TestDesigner } from './TestDesigner';
import { useCC } from './CCGuide';
export const defeatedKey=(language:string,id:string)=>`${language}:arcade:arena:defeated:${id}`;
export function BugArena({progress:p,update,droneIndex=0,onDrone,onRepair}:{progress:QuestProgress;update:QuestUpdate;droneIndex?:number;onDrone?:(index:number)=>void;onRepair?:()=>void}) {
  const cc=useCC(),drone=BUG_DRONES[droneIndex]??BUG_DRONES[0],handle=useRef<CodeRun|null>(null);
  const [expected,setExpected]=useState(''),[busy,setBusy]=useState(false),[status,setStatus]=useState(''),[evidence,setEvidence]=useState<{input:string;expected:number;actual:unknown;error?:string;won:boolean}|null>(null);
  useEffect(()=>{setExpected('');setEvidence(null);setBusy(false);setStatus('');return()=>{handle.current?.cancel();handle.current=null;};},[drone.id,p.language]);
  const defeated=p.drafts[defeatedKey(p.language,drone.id)]==='yes';
  async function challenge(args:(number|number[])[]) {
    if(handle.current)return;
    if(!/^-?\d+$/.test(expected.trim())){setStatus('Write the first matching index you expect, or -1 when the target is absent.');return;}
    const correct=firstMatch(args);
    if(Number(expected)!==correct){setStatus(`Check your expected result first. The first matching index is ${correct}. Indices start at zero.`);return;}
    setBusy(true);setEvidence(null);setStatus('Calling the drone with your input…');
    const run=runCode(p.language,ARENA_EXERCISE,drone.source[p.language],setStatus,{cases:[args],trace:false});handle.current=run;
    const result=await run.result;if(handle.current!==run)return;handle.current=null;setBusy(false);
    const row=result.results[0];
    if(!result.attempted||!row){setStatus(result.error??'The runtime did not finish. No victory was recorded.');return;}
    const won=Boolean(row.error)||JSON.stringify(row.actual)!==JSON.stringify(correct);
    setEvidence({input:`solve(${args.map(v=>JSON.stringify(v)).join(', ')})`,expected:correct,actual:row.actual,error:row.error,won});
    setStatus(won?'Your test exposed a real mismatch. Now fix the program.':'The drone survived this test. Find an input where its code breaks the rule.');
    if(won){update(old=>({...old,drafts:{...old.drafts,[defeatedKey(p.language,drone.id)]:'yes'}}));cc.reactTo('success','You found evidence, not just a guess. Repair the instruction that caused it.');}
    else cc.reactTo('challenge','That input agrees with the buggy program. Try a case that separates it from the promised rule.');
  }
  return <section className="bug-arena">
    <div className="drone-lineup" aria-label="Choose a buggy drone">{BUG_DRONES.map((entry,i)=><button key={entry.id} aria-pressed={drone.id===entry.id} disabled={busy} onClick={()=>onDrone?.(i)}><span className={`drone-avatar ${p.drafts[defeatedKey(p.language,entry.id)]==='yes'?'defeated':''}`}>{p.drafts[defeatedKey(p.language,entry.id)]==='yes'?<Check/>:<Bug/>}</span><small>{entry.name}</small></button>)}</div>
    <div className={`arena-target ${evidence?.won?'drone-hit':''}`}><div className="arena-crosshair"/><Shield size={38}/><div><span>{defeated?'COUNTEREXAMPLE FOUND':'YOUR OPPONENT'}</span><h3>{drone.name}</h3><p>{drone.claim}</p></div></div>
    <details className="arena-source" open><summary>Read the drone’s actual {p.language==='python'?'Python':'Java'} code</summary><pre>{drone.source[p.language]}</pre></details>
    <label className="expected-input">My expected return<input value={expected} onChange={e=>setExpected(e.target.value)} placeholder="first matching index, or -1" inputMode="numeric" aria-label="Expected result for my drone test"/></label>
    <TestDesigner key={`${drone.id}:${p.language}`} suggestions={false} initialArgs={[[2,4],2]} exercise={ARENA_EXERCISE} running={busy} onRun={args=>{void challenge(args);}}/>
    {busy&&<button className="arcade-stop" onClick={()=>{handle.current?.cancel();handle.current=null;setBusy(false);setStatus('Stopped. Your input is safe.');}}><Square size={14}/>Stop drone run</button>}
    {status&&<p role="status" className="duel-status">{status}</p>}
    {evidence&&<div className={`duel-evidence ${evidence.won?'won':''}`}><code>{evidence.input}</code><div><span>Expected<strong>{evidence.expected}</strong></span><Swords size={22}/><span>Drone returned<strong>{evidence.error?'Error':JSON.stringify(evidence.actual)}</strong></span></div></div>}
    {defeated&&onRepair&&<button className="primary-action" onClick={onRepair}>Repair this drone’s code<ArrowRight size={16}/></button>}
  </section>;
}
