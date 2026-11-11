import { useState } from 'react';
import { ArrowRight, BookOpen, Bug, Code2, Play, ShieldCheck } from 'lucide-react';
import { CCAvatar, useCC } from './CCGuide';
import type { CodeCase, Language } from './curriculum';
import type { RunResult } from './runtime';
import { cargoCoachHint } from './CCMissionReasoning';
import type { CargoCoachMode } from './CCMissionReasoning';

/** An in-context C.C. partner for the first Code-to-World mission. Rules depend on real test evidence. */
export function CCMissionCoach({source,language,cases,result,selected,running,canChallenge,onInspectCase,onRun,onPractice}:
 {source:string;language:Language;cases:readonly CodeCase[];result:RunResult|null;selected:number;running:boolean;canChallenge:boolean;onInspectCase:(index:number)=>void;onRun:()=>void;onPractice:()=>void}){
  const cc=useCC(),[mode,setMode]=useState<CargoCoachMode>('debug');
  const insight=cargoCoachHint(mode,source,language,cases,result,selected,canChallenge);
  return <section className="cc-mission-coach" aria-label="C.C. guided mission partner">
    <header><CCAvatar/><div><small>C.C. / MISSION PARTNER</small><strong>Look at what your code did.</strong></div></header>
    <div className="cc-mission-modes" role="group" aria-label="How C.C. can help">{([
      {id:'teach' as const,text:'Teach me',icon:BookOpen},
      {id:'debug' as const,text:'Investigate',icon:Bug},
      {id:'challenge' as const,text:'Challenge me',icon:ShieldCheck},
    ]).map(item=>{const Icon=item.icon;return <button key={item.id} type="button" aria-pressed={mode===item.id} onClick={()=>setMode(item.id)}><Icon size={14}/>{item.text}</button>;})}</div>
    <div className="cc-mission-insight" aria-live="polite"><h3>{running?'Testing your draft…':insight.heading}</h3><p>{running?'Wait for the results. Then we can inspect what happened.':insight.message}</p></div>
    <div className="cc-mission-actions">{!running&&insight.action==='run'&&<button onClick={onRun}><Play size={14}/>Run my code<ArrowRight size={14}/></button>}
    {insight.action==='inspect'&&insight.caseIndex!==null&&<button onClick={()=>onInspectCase(insight.caseIndex!)}>Inspect test {insight.caseIndex+1}<ArrowRight size={14}/></button>}
    {insight.action==='code-words'&&<button onClick={()=>cc.openDesk('build')}><Code2 size={14}/>Show the code words<ArrowRight size={14}/></button>}
    {insight.action==='remix'&&<button disabled={!canChallenge} onClick={onPractice}><ShieldCheck size={14}/>Try independent remix<ArrowRight size={14}/></button>}
    {result?.results.some(row=>(row.trace?.length??0)>0)&&language==='python'&&<button onClick={()=>cc.openDesk('xray')}>Inspect actual Python trace<ArrowRight size={14}/></button>}</div>
    <small className="cc-mission-limit">Advice uses your draft and test results. Playback shows your returned array; X-ray shows recorded Python lines.</small>
  </section>;
}
