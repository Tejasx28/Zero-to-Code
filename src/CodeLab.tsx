import { WriteStepBar } from './CodeWordGuide';
import type { InsertConstruct } from './MissionEditor';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Bug, Check, ChevronDown, Code2, Download, Lightbulb, Maximize2, Minimize2, Pause, Play, RotateCcw, ShieldCheck, SkipBack, SkipForward, Square, Terminal, X } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import { EXERCISES } from './curriculum';
import type { Exercise, Language } from './curriculum';
import { codeKey, submitCode } from './questState';
import type { QuestProgress } from './questState';
import { matches, runCode } from './runtime';
import { reviewGameRun } from './gameMechanics';
import type { CodeRun, RunResult } from './runtime';
import { ALLOWED_CODING_IDS, CODING_MISSION_GROUPS, diagnosticLine, errorDirection, parseCustomInput } from './studioHelpers';
import { MissionEditor } from './MissionEditor';
import { useCC } from './CCGuide';
import { RELATED_MISSIONS } from './learningLoops';
import './studio.css';
import { CCLaunchpad } from './CCCompanion';
import { PRACTICE_DETAILS, PRACTICE_GROUPS, PRACTICE_IDS } from './practiceContent';
import { insertPlanComments } from './companionHelpers';
import { runMessage } from './coachMessages';
import { TestDesigner } from './TestDesigner';
import { changedSource, compareRuns } from './runComparison';
import type { RunComparison, RunSnapshot } from './runComparison';

export type QuestUpdate=Dispatch<SetStateAction<QuestProgress>>;
export function LanguageSwitch({language,onChange}:{language:Language;onChange:(l:Language)=>void}) {
  return <div className="language-switch" role="group" aria-label="Programming language">{(['python','java']as const).map(l=><button key={l} className={language===l?'chosen':''} onClick={()=>onChange(l)} aria-pressed={language===l}><span className={`language-dot ${l}`}/>{l==='python'?'Python':'Java'}</button>)}</div>;
}

export interface LabSession {exercise:Exercise;storageId:string;eyebrow:string;heading:string;hints:string[]}
export function CodeLab({progress:p,update,exerciseId,onExercise,onLearn,practice=false,session}:{progress:QuestProgress;update:QuestUpdate;exerciseId:string;onExercise:(id:string)=>void;onLearn:(id:string)=>void;practice?:boolean;session?:LabSession}) {
  const {reactTo,registerWorkspace,clearWorkspace,deskOpen,deskTab,openDesk,setLineNumber}=useCC();
  const availableIds=practice?PRACTICE_IDS:ALLOWED_CODING_IDS;
  const exercise=session?.exercise??EXERCISES.find(e=>e.id===exerciseId&&availableIds.includes(e.id))??EXERCISES.find(e=>e.id===availableIds[0])!;
  const key=codeKey(session?.storageId??(practice?`practice:${exercise.id}`:exercise.id),p.language),source=p.drafts[key]??exercise.starter[p.language],record=p.code[key];
  const [running,setRunning]=useState(false),[status,setStatus]=useState(''),[result,setResult]=useState<RunResult|null>(null);
  const [mode,setMode]=useState<'suite'|'custom'>('suite'),[customArgs,setCustomArgs]=useState<(number|number[])[]|null>(null);
  const [showExperiment,setShowExperiment]=useState(false),[resetArmed,setResetArmed]=useState(false),[focused,setFocused]=useState(false),[traceLine,setTraceLine]=useState<number|null>(null);
  const constructInserter=useRef<InsertConstruct|null>(null);
  const runRef=useRef<CodeRun|null>(null),sourceRef=useRef(source),lastSuite=useRef<RunSnapshot|null>(null);sourceRef.current=source;
  const [comparison,setComparison]=useState<RunComparison|null>(null);
  useEffect(()=>{
    setRunning(false);setStatus('');setResult(null);setCustomArgs(null);setShowExperiment(false);setResetArmed(false);setTraceLine(null);lastSuite.current=null;setComparison(null);reactTo('explore');
    return()=>{runRef.current?.cancel();runRef.current=null;};
  },[key,reactTo]);
  useEffect(()=>{if(!focused)return;const escape=(event:KeyboardEvent)=>{if(event.key==='Escape')setFocused(false);};window.addEventListener('keydown',escape);return()=>window.removeEventListener('keydown',escape);},[focused]);

  function changeSource(value:string){
    reactTo('planning');
    if(runRef.current){runRef.current.cancel();runRef.current=null;setRunning(false);setStatus('');}
    setResult(null);setResetArmed(false);setTraceLine(null);setComparison(null);
    update(prev=>({...prev,drafts:{...prev.drafts,[key]:value}}));
  }
  async function execute(kind:'suite'|'custom',overrideArgs?:(number|number[])[]){
    if(running||runRef.current)return;
    let args:(number|number[])[]|undefined;
    if(kind==='custom'){if(!overrideArgs)return;const input=parseCustomInput(JSON.stringify(overrideArgs),exercise.kind);if(input.error)return;args=input.args;setCustomArgs(args??null);setShowExperiment(true);}
    setMode(kind);setRunning(true);setResult(null);setTraceLine(null);setComparison(null);setStatus('Preparing to run your code…');
    reactTo('running',kind==='custom'?'Your own input is a good experiment. Let’s see what your instructions actually do.':undefined);
    const active=runCode(p.language,exercise,source,setStatus,{cases:args?[args]:undefined,trace:p.language==='python'});
    runRef.current=active;const output=await active.result;if(runRef.current!==active)return;
    runRef.current=null;setRunning(false);setStatus('');setResult(output);
    if(output.error==='Run cancelled. Your draft is saved.'){reactTo('explore','Paused. Your draft is safe. Change the next line when you are ready.');return;}
    if(kind==='suite'){
      const review=reviewGameRun(output,exercise.cases);
      if(review.countsAsAttempt){
        const snapshot={source,result:output};
        setComparison(compareRuns(lastSuite.current,snapshot,exercise));
        lastSuite.current=snapshot;
        update(prev=>submitCode(prev,session?.storageId??(practice?`practice:${exercise.id}`:exercise.id),p.language,review.score,review.total));
        reactTo(review.status==='passed'?'success':'bug',runMessage(output,exercise));
      }else reactTo('explore',review.message);
    }else if(output.error||output.results.some(r=>r.error))reactTo('bug',output.attempted?undefined:'The runner could not finish. Your draft is safe, and this has not counted as a coding attempt.');
    else if(kind==='custom')reactTo('explore','Your experiment returned a result. Compare it with your own rule—does it behave the way you intended?');
  }
  function download(){const blob=new Blob([source],{type:'text/plain'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=p.language==='java'?'Solution.java':`${exercise.id}.py`;a.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000);}
  const firstError=result?.error??result?.results.find(r=>r.error)?.error;
  const errorLine=result?.results.find(r=>r.error)?.line??diagnosticLine(firstError,p.language);
  const practiceDetail=PRACTICE_DETAILS.find(item=>item.id===exercise.id);
  const related=(session?[]:practice&&practiceDetail?[{id:practiceDetail.related,why:'Keep the foundation. Work out what this new problem needs you to change.'}]:RELATED_MISSIONS[exercise.id]??[]).filter(entry=>entry.id!==exercise.id&&availableIds.includes(entry.id)&&EXERCISES.some(e=>e.id===entry.id));
  const transfer=related.find(entry=>!p.code[codeKey(practice?`practice:${entry.id}`:entry.id,p.language)]?.passed)??related[0];
  const next=transfer?EXERCISES.find(e=>e.id===transfer.id):undefined;

  const [focusRequest,setFocusRequest]=useState<{line:number;nonce:number}|null>(null),jumpSequence=useRef(0);
  useEffect(()=>{registerWorkspace({key,scope:session?'debug':practice?'practice':'story',exercise,language:p.language,source,result,running,status,mode,customArgs,hints:session?.hints,onInsertSnippet:(text,place)=>{if(!constructInserter.current)return{error:'Open the editor first.'};const result=constructInserter.current(text,place);if(!result.error)update(prev=>({...prev,assisted:[...new Set([...prev.assisted,key])]}));return result;},onApplyPatch:(before,after)=>{if(sourceRef.current!==before)return{error:'Your draft changed. Build a new preview first.'};changeSource(after);return{};},onRun:()=>{void execute('suite');},onTryCase:args=>{void execute('custom',args);},onFocusLine:line=>{setTraceLine(line);setFocusRequest({line,nonce:++jumpSequence.current});},onInsertPlan:steps=>{const out=insertPlanComments(source,p.language,steps);if(out.source)changeSource(out.source);return out;}});},[key,practice,exercise,p.language,source,result,running,status,mode,customArgs,session,registerWorkspace]);
  useEffect(()=>()=>clearWorkspace(key),[key,clearWorkspace]);

  return <section className={`mission-studio ${focused?'studio-focus':''}`}>
    <header className="studio-heading">
      <div><span className="studio-eyebrow">{session?.eyebrow??(practice?'PRACTICE / YOUR OWN SOLUTION':'CODE STUDIO')}</span><h1>{session?.heading??(practice?'Solve this problem.':'Write. Run. Improve.')}</h1><p>Write a solution. Run the tests. Use the results to improve it.</p></div>
      <div className="studio-heading-controls">{!session&&<label htmlFor="coding-mission">Choose a problem<select id="coding-mission" value={exercise.id} onChange={e=>onExercise(e.target.value)}>{(practice?PRACTICE_GROUPS:CODING_MISSION_GROUPS).map(group=><optgroup key={group.label} label={group.label}>{group.ids.map(id=>{const e=EXERCISES.find(item=>item.id===id)!;return <option key={id} value={id}>{e.title}{p.code[codeKey(practice?`practice:${id}`:id,p.language)]?.passed?' ✓':''}</option>;})}</optgroup>)}</select></label>}</div>
    </header>

    <section className="studio-task" aria-label="Coding mission instructions"><div><h2>{exercise.title}</h2><p>{exercise.brief}</p></div><details className="studio-task-detail"><summary>Function contract & example <ChevronDown size={13}/></summary><code>{exercise.contract}</code><div><span>Inputs <code>{JSON.stringify(exercise.cases[0].args)}</code></span><ArrowRight size={13}/><span>Return <code>{JSON.stringify(exercise.cases[0].expected)}</code></span></div></details>{exercise.independent&&<span className="studio-independent"><ShieldCheck size={13}/>{session?'Fresh starter · no solution hints':'Independent check · no solution hints'}</span>}</section>

    <div className="studio-workspace">
      <div className="studio-code-column">
        <section className="studio-editor-panel" aria-label="Code editor">
          <div className="studio-editor-top"><span><i/><code>{p.language==='python'?`${exercise.id}.py`:'Solution.java'}</code><small>{p.language==='python'?'PYTHON':'JAVA 17'}</small></span><div><span className="studio-saved"><Check size={11}/>Saved</span><button className="studio-run-primary" disabled={running||!source.trim()} onClick={()=>void execute('suite')}><Play size={14}/>{running?'Running…':'Run all tests'}</button>{running&&<button className="studio-stop" onClick={()=>runRef.current?.cancel()} aria-label="Stop code execution"><Square size={13}/></button>}</div></div>
          <WriteStepBar arrayTask={exercise.kind==='array'||exercise.kind==='target'}/><MissionEditor onInsertReady={insert=>{constructInserter.current=insert;}} onExplainLine={line=>{setLineNumber(line);openDesk('words');}} key={key} focusRequest={focusRequest} value={source} language={p.language} onChange={changeSource} onRun={()=>void execute('suite')} activeLine={traceLine} errorLine={errorLine??null} errorMessage={firstError}/>
          <div id="mission-editor-help" className="studio-editor-help"><span>Tab indents · Ctrl/⌘+Enter runs · Ctrl/⌘+F finds</span><span>Ctrl+M lets Tab leave the editor</span></div>
          <div className="studio-editor-tools"><button onClick={()=>setShowExperiment(v=>!v)} className={showExperiment?'selected':''}><Bug size={14}/>Design a test</button><div><button onClick={download} aria-label="Download my source" title="Download source"><Download size={15}/></button><button onClick={()=>{if(resetArmed){changeSource(exercise.starter[p.language]);setResetArmed(false);}else setResetArmed(true);}}><RotateCcw size={14}/><span>{resetArmed?'Confirm reset':'Reset'}</span></button><button onClick={()=>setFocused(v=>!v)} aria-label={focused?'Exit focus mode':'Enter focus mode'} title={focused?'Exit focus mode (Escape)':'Focus on code'}>{focused?<Minimize2 size={15}/>:<Maximize2 size={15}/>}</button></div></div>
          {showExperiment&&!(deskOpen&&deskTab==='test')&&<div className="custom-experiment"><div className="experiment-heading"><strong>Design a test</strong><button onClick={()=>setShowExperiment(false)} aria-label="Close custom test"><X size={15}/></button></div><TestDesigner exercise={exercise} running={running} onRun={args=>void execute('custom',args)} initialArgs={customArgs}/></div>}
        </section>
        {comparison&&<RunChange comparison={comparison}/>}
        <StudioFeedback result={result} running={running} status={status} exercise={exercise} language={p.language} mode={mode} customArgs={customArgs} source={source} onTraceLine={setTraceLine} onNext={next?()=>onExercise(next.id):undefined} nextTitle={next?.title} nextWhy={transfer?.why}/>
      </div>

      <div className="studio-guide-column"><CCLaunchpad progress={p} update={update}/><button className="studio-concept-link" onClick={()=>onLearn(exercise.unit)}><Code2 size={15}/>Review this concept<ArrowRight size={14}/></button></div>
    </div>
    <p className="studio-runtime-credit">{record?.passed?'Previously passed in this language. New edits can be tested again. ':''}{p.language==='python'?'Python runs in your browser through Pyodide.':'Java runs in your browser through CheerpJ.'} First launch needs internet.{p.language==='java'&&<> <a href="https://cheerpj.com" target="_blank" rel="noreferrer">Built with CheerpJ.</a></>}</p>
  </section>;
}

interface FeedbackProps {result:RunResult|null;running:boolean;status:string;exercise:Exercise;language:Language;mode:'suite'|'custom';customArgs:(number|number[])[]|null;source:string;onTraceLine:(line:number|null)=>void;onNext?:()=>void;nextTitle?:string;nextWhy?:string}
function StudioFeedback({result,running,status,exercise,language,mode,customArgs,source,onTraceLine,onNext,nextTitle,nextWhy}:FeedbackProps){
  const[selected,setSelected]=useState(0),[showTrace,setShowTrace]=useState(false),[traceStep,setTraceStep]=useState(0),[playing,setPlaying]=useState(false);
  useEffect(()=>{const first=result?.results.findIndex((r,i)=>r.error||(mode==='suite'&&!matches(r.actual,exercise.cases[i]?.expected)))??-1;setSelected(Math.max(0,first));setTraceStep(0);setPlaying(false);setShowTrace(false);},[result,mode,exercise.id]);
  const selectedResult=result?.results[selected],trace=selectedResult?.trace??[],frame=showTrace?trace[traceStep]:undefined;
  useEffect(()=>{onTraceLine(frame?.line??null);return()=>onTraceLine(null);},[frame?.line,onTraceLine]);
  useEffect(()=>{if(!playing||traceStep>=trace.length-1){setPlaying(false);return;}const timer=window.setTimeout(()=>setTraceStep(s=>s+1),650);return()=>window.clearTimeout(timer);},[playing,traceStep,trace.length]);
  const review=mode==='suite'&&result?reviewGameRun(result,exercise.cases):null;
  const score=review?.score??0;
  const passed=review?.status==='passed';
  const input=mode==='custom'?customArgs:exercise.cases[selected]?.args;
  return <section className={`studio-feedback ${passed?'mission-passed':''}`} aria-label="Code test results" aria-live="polite">
    <header><span><Terminal size={15}/><strong>{running?'Running your code…':passed?'Your solution passed.':result?mode==='custom'?'Your experiment':'Test results':'Run your code to see the results.'}</strong></span>{result&&mode==='suite'&&!result.error&&<small>{score}/{exercise.cases.length} passed</small>}{result&&mode==='custom'&&<small>Practice only</small>}</header>
    {running?<div className="studio-loading"><span/><p>{status||'Running your code…'} You can stop without losing your draft.</p></div>:!result?<p className="studio-feedback-empty">Write your first version and select <strong>Run all tests</strong>. You will see the input, the expected result, and what your code returned.</p>:result.error?<div className="studio-error"><strong>{result.attempted?'Check the reported line.':'The runner needs attention.'}</strong>{result.attempted&&!exercise.independent&&<p>{errorDirection(result.error,language)}</p>}<pre>{result.error}</pre></div>:<>
      <div className="studio-test-tabs" role="tablist" aria-label="Choose a test to investigate">{result.results.map((r,i)=><button key={i} role="tab" aria-selected={selected===i} className={`${selected===i?'selected':''} ${mode==='suite'&&!r.error&&matches(r.actual,exercise.cases[i]?.expected)?'passed':r.error||mode==='suite'?'failed':''}`} onClick={()=>{setSelected(i);setTraceStep(0);setPlaying(false);}}>{mode==='suite'&&!r.error&&matches(r.actual,exercise.cases[i]?.expected)?<Check size={12}/>:r.error||mode==='suite'?<X size={12}/>:<Bug size={12}/>}<span>{mode==='custom'?'My input':exercise.cases[i]?.label??`Test ${i+1}`}</span></button>)}</div>
      <div className="studio-evidence"><div><span>INPUT</span><code>{JSON.stringify(input)}</code></div>{mode==='suite'&&<div><span>EXPECTED</span><code>{JSON.stringify(exercise.cases[selected]?.expected)}</code></div>}<div className={selectedResult?.error?'is-error':''}><span>{selectedResult?.error?'ERROR':'YOUR RETURN'}</span><code>{selectedResult?.error??JSON.stringify(selectedResult?.actual)}</code></div></div>
      {selectedResult?.error&&!exercise.independent&&<p className="studio-error-direction"><Lightbulb size={15}/>{errorDirection(selectedResult.error,language)}</p>}
      {language==='python'&&trace.length>0&&<div className="trace-workbench"><div className="trace-heading"><span><Bug size={15}/>Watch the code run, one line at a time.</span><button onClick={()=>{setShowTrace(v=>!v);setPlaying(false);}}>{showTrace?'Close trace':'Open trace'}<ChevronDown size={12}/></button></div>{showTrace&&<><div className="trace-controls"><button onClick={()=>{setTraceStep(0);setPlaying(false);}} disabled={traceStep===0} aria-label="First trace step"><SkipBack size={14}/></button><button onClick={()=>{setTraceStep(s=>Math.max(0,s-1));setPlaying(false);}} disabled={traceStep===0} aria-label="Previous trace step"><ArrowLeft size={14}/></button><button className="trace-play" onClick={()=>{if(traceStep>=trace.length-1)setTraceStep(0);setPlaying(v=>!v);}} aria-label={playing?'Pause trace replay':'Play trace replay'}>{playing?<Pause size={14}/>:<Play size={14}/>}</button><button onClick={()=>{setTraceStep(s=>Math.min(trace.length-1,s+1));setPlaying(false);}} disabled={traceStep>=trace.length-1} aria-label="Next trace step"><ArrowRight size={14}/></button><button onClick={()=>{setTraceStep(trace.length-1);setPlaying(false);}} disabled={traceStep>=trace.length-1} aria-label="Last trace step"><SkipForward size={14}/></button><label><span>{traceStep+1} / {trace.length}</span><input aria-label="Trace step" type="range" min={0} max={trace.length-1} value={traceStep} onChange={e=>{setTraceStep(Number(e.target.value));setPlaying(false);}}/></label></div><div className="trace-state"><div><span>{frame?.event==='line'?'BEFORE':frame?.event==='return'?'RETURN AT':'ERROR AT'} LINE {frame?.line}</span><code>{source.split('\n')[(frame?.line??1)-1]?.trim()}</code>{frame?.event==='return'&&<p>Returned: <strong>{JSON.stringify(frame.returned)}</strong></p>}{frame?.exception&&<p>{frame.exception}</p>}</div><div className="trace-locals"><span>VALUES RIGHT NOW</span>{Object.entries(frame?.locals??{}).length?Object.entries(frame?.locals??{}).map(([name,value])=><div key={name}><code>{name}</code><code>{JSON.stringify(value)}</code></div>):<p>No local values yet.</p>}</div></div><p className="trace-note">This replays actual Python execution. Line events show values before the line runs. Up to 180 events are recorded per test.</p></>}</div>}
      {language==='java'&&<p className="java-debug-note">Java shows real compiler diagnostics and test results. Variable-by-variable trace replay is available for Python.</p>}
    </>}
    {result?.stdout&&<details className="studio-printed-output"><summary>Printed output</summary><pre>{result.stdout}</pre></details>}
    {passed&&<div className="studio-completion" style={{display:'block'}}><span><ShieldCheck size={19}/>{exercise.independent?'Independent task complete.':'You made it work.'}</span>{onNext&&<div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:14,marginTop:14,flexWrap:'wrap'}}><div style={{flex:'1 1 220px'}}><strong style={{fontSize:11,fontWeight:650}}>Try a related problem</strong>{nextWhy&&<p style={{fontSize:10,margin:'5px 0 0',color:'#708462'}}>{nextWhy}</p>}</div><button onClick={onNext}>{nextTitle}<ArrowRight size={13}/></button></div>}</div>}
  </section>;
}

function RunChange({comparison:c}:{comparison:RunComparison}) {
  const difference=changedSource(c.before.source,c.after.source);
  return <details className="run-change"><summary><span>Last run <strong>{c.oldScore}/{c.total}</strong><ArrowRight size={14}/>Now <strong>{c.newScore}/{c.total}</strong></span><span>Compare my change<ChevronDown size={14}/></span></summary>{difference.before.length||difference.after.length?<div className="run-source-diff"><div><span>Before · line {difference.start}</span><pre>{difference.before.slice(0,16).join('\n')||'(no lines)'}</pre></div><div><span>Now · line {difference.start}</span><pre>{difference.after.slice(0,16).join('\n')||'(no lines)'}</pre></div></div>:<p>The source stayed the same between these runs.</p>}<small>These are your last two full test runs in this workspace.</small></details>;
}
