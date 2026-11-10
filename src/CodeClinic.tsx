import { useEffect, useRef, useState } from 'react';
import type { CCWorkspace } from './CCGuide';
import type { QuestProgress } from './questState';
import type { QuestUpdate } from './CodeLab';
import { parameterNames } from './codeWords';
import { runCode } from './runtime';
import { RepairDesk } from './CoachWorkbench';

export interface Finding {line:number;title:string;why:string;before?:string;after?:string;}
export function inspectCode(source:string,language:'python'|'java'):Finding[] {
 const lines=source.split('\n'),out:Finding[]=[];
 if(language==='python') {
  const known=new Set([...parameterNames(source,language),'True','False','None','len','range','int','list','min','max','sum','abs','enumerate','print','solve']);
  const keywords=new Set('def for in if elif else return and or not while pass break continue import from as'.split(' '));
  lines.forEach((raw,i)=>{const line=raw.split('#')[0].replace(/(['"]).*?\1/g,'');
   const lhs=line.match(/^\s*([a-zA-Z_]\w*)\s*=(?!=)/)?.[1],loop=line.match(/\bfor\s+(\w+)\s+in\b/)?.[1];
   const rhs=lhs?line.slice(line.indexOf('=')+1):line;
   if(!/^\s*def\b/.test(line))for(const token of rhs.matchAll(/\b[A-Za-z_]\w*\b/g)){const name=token[0];if(rhs[token.index!-1]==='.'||known.has(name)||keywords.has(name)||name===loop)continue;
    const candidates=[...known].filter(n=>!['solve','print','range','len','int','list','min','max','sum','abs','enumerate'].includes(n));
    const replacement=candidates.includes('n')&&name==='value'?'n':candidates.includes('value')&&name==='n'?'value':null;
    if(!out.some(f=>f.title===`“${name}” has no value yet`))out.push({line:i+1,title:`“${name}” has no value yet`,why:name==='result'&&/result\.append\(/.test(source)?'append needs a list. Start result as an empty list before the loop so it keeps items between visits. This repairs the missing name, not the whole algorithm.':replacement?`Your loop calls this item ${replacement}. Use that same name here.`:`Define ${name} before reading it. A name is not created just because another example used it.`,...(name==='result'&&/result\.append\(/.test(source)&&/^def\s+solve[^\n]*:\s*$/m.test(source)?{before:source,after:source.replace(/(def\s+solve[^\n]*\n)/,'$1    result = []\n')}:replacement?{before:source,after:lines.map((l,k)=>k===i?l.replace(new RegExp(`\\b${name}\\b`,'g'),replacement):l).join('\n')}:{})});
   }
   if(lhs)known.add(lhs);if(loop)known.add(loop);
   if(/^\s*\w+\s*=\s*0\s*$/.test(line)&&lines.slice(0,i).some(l=>/^\s*for\b/.test(l)&&l.length-l.trimStart().length<raw.length-raw.trimStart().length))out.push({line:i+1,title:'This value resets on every visit',why:'If this is a running total, initialize it before the loop. Keep the update inside. If a per-item reset is intended, leave it here.'});
  });
 }
 return out;
}
export function combinedRepair(source:string,language:'python'|'java'){let after=source;for(let n=0;n<12;n++){const next=inspectCode(after,language).find(f=>f.after&&f.after!==after);if(!next)break;after=next.after!;}return after;}
export function CodeClinic({w,p,update}:{w:CCWorkspace;p:QuestProgress;update:QuestUpdate}) {
 const findings=inspectCode(w.source,w.language),[preview,setPreview]=useState<Finding|null>(null),[message,setMessage]=useState('');
 const error=w.result?.error??w.result?.results.find(r=>r.error)?.error;
 return <div className="clinic"><span className="section-kicker">CODE CLINIC</span><h3>Find the first broken link.</h3><button onClick={()=>{const after=combinedRepair(w.source,w.language);if(after===w.source){setMessage('No supported automatic patch. Follow the findings and the real error below.');return;}setPreview({line:1,title:'Combined supported fixes',why:'Review each changed instruction.',before:w.source,after});}}>Review supported fixes together</button><details><summary>What this task needs</summary><p>{w.exercise.brief}</p></details><p>{error??'A local pattern check. Run your code for compiler and test evidence.'}</p>{findings.map((f,i)=><article key={i}><button onClick={()=>w.onFocusLine?.(f.line)}>Line {f.line} · {f.title}</button><p>{f.why}</p>{f.after&&<button onClick={()=>setPreview(f)}>Review this fix</button>}</article>)}{!findings.length&&<p>No supported name/reset pattern found. This does not mean the algorithm is correct. Inspect the real run below.</p>}{preview&&<section><h4>Review before applying</h4><pre>{preview.before}</pre><span>CHANGE TO</span><pre>{preview.after}</pre><button disabled={w.running} onClick={()=>{if(w.source!==preview.before){setMessage('Your draft changed. Scan again.');setPreview(null);return;}const result=w.onApplyPatch?.(preview.before!,preview.after!);if(!result?.error)update(old=>({...old,assisted:[...new Set([...old.assisted,w.key])]}));setMessage(result?.error??'Applied. Run all tests to check the effect. Ctrl+Z undoes this edit.');setPreview(null);}}>Apply reviewed fix</button><button onClick={()=>setPreview(null)}>Cancel</button></section>}<p role="status">{message}</p><details open={!findings.length}><summary>Compiler evidence, spacing & hints</summary><RepairDesk workspace={w} progress={p} update={update}/></details></div>;
}
export function Blueprint({w,update}:{w:CCWorkspace;update:QuestUpdate}) {
 const [preview,setPreview]=useState(false),[msg,setMsg]=useState('');const a=parameterNames(w.source,w.language)[0]??'values',array=Array.isArray(w.exercise.cases[0].expected),py=w.language==='python';
 const frame=py?`def solve(${parameterNames(w.source,w.language).join(', ')}):\n    ${array?'result = []':'total = 0'}\n    for value in ${a}:\n        # Add your condition and update here.\n        pass\n    return ${array?'result':'total'}\n`:`public class Solution {\n  public static ${array?'int[]':'int'} solve(${parameterNames(w.source,w.language).map((n,i)=>`${i===0?'int[]':'int'} ${n}`).join(', ')}) {\n    ${array?`int[] result = new int[${a}.length];\n    int count = 0;`:'int total = 0;'}\n    for (int value : ${a}) {\n      // Add your condition and update here.\n    }\n    return ${array?'java.util.Arrays.copyOf(result, count)':'total'};\n  }\n}`;
 return <div><h3>Start with a structure.</h3><p>Set up → visit items → choose and update → return. You write the rule. This is a generic array scaffold, not the solution.</p>{!['array','target'].includes(w.exercise.kind)?<p>This scaffold is for array tasks. Use Code words for this function.</p>:<><button onClick={()=>setPreview(!preview)}>Preview a complete starting structure</button>{preview&&<><pre>{frame}</pre><p>This replaces the current editor text. Save a checkpoint first if you want to keep it.</p><button disabled={w.running||w.exercise.independent} onClick={()=>{const r=w.onApplyPatch?.(w.source,frame);if(!r?.error)update(old=>({...old,assisted:[...new Set([...old.assisted,w.key])]}));setMsg(r?.error??'Starting structure added. Ctrl+Z restores your previous draft.');}}>Use this structure</button>{w.exercise.independent&&<p>Scaffolds are disabled for independent tasks.</p>}</>}<p role="status">{msg}</p></>}</div>;
}
export function BoundaryRadar({w}:{w:CCWorkspace}) {
 const [busy,setBusy]=useState(false),[evidence,setEvidence]=useState('');
 const handle=useRef<ReturnType<typeof runCode>|null>(null);useEffect(()=>{setBusy(false);return()=>{handle.current?.cancel();handle.current=null;};},[w.key,w.source]);
 return <div><h3>Boundary radar</h3><p>Try a real authored edge case without changing your task score.</p>{w.exercise.cases.map((c,i)=><button className="radar-case" disabled={busy||w.running} key={i} onClick={async()=>{setBusy(true);setEvidence('Running…');const active=runCode(w.language,w.exercise,w.source,()=>{},{cases:[c.args]});handle.current=active;const r=await active.result;if(handle.current!==active)return;handle.current=null;setEvidence(`${c.label}\nInput: ${JSON.stringify(c.args)}\nExpected: ${JSON.stringify(c.expected)}\nReturned: ${JSON.stringify(r.results[0]?.actual)}\n${r.error??r.results[0]?.error??''}`);setBusy(false);}}>{c.label} <code>{JSON.stringify(c.args)}</code></button>)}<pre role="status">{evidence}</pre></div>;
}
export function Checkpoint({w,p,update}:{w:CCWorkspace;p:QuestProgress;update:QuestUpdate}) {
 const key=`cc:checkpoint:${w.key}`,saved=p.drafts[key],[review,setReview]=useState(false),[msg,setMsg]=useState('');
 return <div><h3>Branch and rewind.</h3><p>Keep a draft before trying a different approach. Restoring changes code only; it never restores a test pass.</p><button onClick={()=>{update(old=>({...old,drafts:{...old.drafts,[key]:w.source}}));setMsg('Checkpoint saved for this task and language.');}}>Save current code</button>{saved&&<><button onClick={()=>setReview(!review)}>Compare saved code</button>{review&&<><pre>{saved}</pre><button disabled={w.running} onClick={()=>{const r=w.onApplyPatch?.(w.source,saved);setMsg(r?.error??'Restored. Run your tests again.');}}>Restore this draft</button></>}</>}<p role="status">{msg}</p></div>;
}
