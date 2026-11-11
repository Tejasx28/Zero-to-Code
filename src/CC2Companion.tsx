import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, BookOpen, BrainCircuit, Check, ChevronDown, Code2, Eye, Lightbulb, MessageCircle, RotateCcw, Send, Sparkles, Square, X } from 'lucide-react';
import type { QuestProgress } from './questState';
import type { QuestUpdate } from './CodeLab';
import { useCC } from './CCGuide';
import type { CCWorkspace } from './CCGuide';
import { connectedTutorContext, localTutorReply, predictionVerdict, tutorEvidence } from './CC2Brain';
import './cc2.css';
import { TraceXRay } from './CoachLab';

type Speaker = 'learner' | 'cc';
type Channel = 'offline' | 'connected';
interface ChatLine {id:number;who:Speaker;text:string;channel?:Channel}
const opening:ChatLine = {id:0,who:'cc',text:'I’m here to help you understand your code, not replace your thinking. Ask a question, or choose a starting point below.',channel:'offline'};
const promptMap:Record<string,string> = {
  clinic:'Help me understand my current code and test results.',clue:'Compare the selected test using its actual input and output.',
  build:'I know the idea but don’t know what to type next. Help me reason about one step.',
  trace:'Help me follow a variable through this program.',xray:'Help me follow a variable through this program.',
  radar:'What boundary case should I investigate?',words:'Explain the current code words in simple language.',
  lab:'Help me compare what changed after editing my code.',test:'Help me design a useful test.',
  blueprint:'Help me plan the next step without writing my full solution.',
  checkpoint:'What should I verify before changing my code?',plan:'Help me plan one small step.',
  duel:'I want to predict what my code returns.',
};
const fmt = (value:unknown) => {const raw = JSON.stringify(value) ?? 'not returned';return raw.length > 100 ? raw.slice(0,97)+'…':raw;};
function Portrait({mood,small=false}:{mood:'thinking'|'proud'|'concerned'|'calm';small?:boolean}){
  return <span className={`cc2-portrait cc2-mood-${mood} ${small?'cc2-portrait-small':''}`} aria-hidden="true"><span className="cc2-portrait-ring"/><span className="cc2-portrait-core"><img src="/art/cc2-avatar.svg" alt="" loading="lazy"/><span className="cc2-portrait-scan"/></span><span className="cc2-portrait-star"/></span>;
}
function useCurrentEvidence(w:CCWorkspace|null,selected:number){return useMemo(()=>tutorEvidence(w,selected),[w,selected]);}

/** Replaces the previous tool maze. Existing CCGuide/CodeLab actions open this single tutor. */
export function CC2Companion({progress:p,onConcept,onPractice,onNotes,onArcade}:{progress:QuestProgress;update:QuestUpdate;onConcept:(id?:string)=>void;onPractice:()=>void;onNotes:()=>void;onArcade:()=>void;onArena:(drone:number)=>void}){
  const cc=useCC();
  const w=cc.workspace;
  const evidence=useCurrentEvidence(w,cc.caseIndex);
  const [draft,setDraft]=useState('');
  const [messages,setMessages]=useState<ChatLine[]>([opening]);
  const [aiOptIn,setAiOptIn]=useState(false);
  const [sending,setSending]=useState(false);
  const [hintLevel,setHintLevel]=useState(0);
  const [prediction,setPrediction]=useState('');
  const [duel,setDuel]=useState(false);
  const [duelResult,setDuelResult]=useState<string|null>(null);
  const [showEvidence,setShowEvidence]=useState(false);
  const [notice,setNotice]=useState('');
  const nextId=useRef(1);
  const abort=useRef<AbortController|null>(null);
  const previousFocus=useRef<HTMLElement|null>(null);
  const composer=useRef<HTMLTextAreaElement|null>(null);
  const transcriptEnd=useRef<HTMLDivElement|null>(null);
  const dialog=useRef<HTMLElement|null>(null);
  const workspaceScope=`${p.language}:${w?.key??'home'}`;
  const scope=useRef(workspaceScope);
  const successes=Object.entries(p.code).filter(([key,row])=>key.startsWith(p.language+':')&&row.passed).length;
  const mood= sending||w?.running?'thinking':evidence?.issue==='passed'?'proud':evidence?.issue==='mismatch'||evidence?.issue==='suite-failed'||evidence?.issue==='test-error'||evidence?.issue==='runtime'?'concerned':'calm';

  useEffect(()=>{
    if(scope.current===workspaceScope)return;
    scope.current=workspaceScope;
    abort.current?.abort();abort.current=null;setSending(false);
    setHintLevel(0);setDuel(false);setDuelResult(null);setNotice('');
    setAiOptIn(false);setDraft('');setPrediction('');setShowEvidence(false);
    setMessages([opening]);nextId.current=1;
  },[workspaceScope]);
  useEffect(()=>{
    setDuelResult(null);setPrediction('');
    if(!abort.current)return;
    abort.current.abort();abort.current=null;setSending(false);
    setNotice('The code or selected test changed. The earlier AI request was stopped.');
  },[w?.source,w?.result,w?.running,w?.mode,cc.caseIndex]);
  useEffect(()=>{if(cc.deskTab==='xray'||cc.deskTab==='trace')setShowEvidence(true);},[cc.deskTab]);
  useEffect(()=>{
    return()=>{abort.current?.abort();abort.current=null;};
  },[]);
  useEffect(()=>{
    if(!cc.deskOpen)return;
    previousFocus.current=document.activeElement instanceof HTMLElement ? document.activeElement:null;
    const task=window.requestAnimationFrame(()=>composer.current?.focus());
    const key=(event:KeyboardEvent)=>{
      if(event.key==='Escape'&&!event.defaultPrevented){event.preventDefault();cc.closeDesk();}
    };
    window.addEventListener('keydown',key);
    return()=>{window.cancelAnimationFrame(task);window.removeEventListener('keydown',key);previousFocus.current?.focus?.();};
  },[cc.deskOpen,cc.closeDesk]);
  useEffect(()=>{
    const key=(event:KeyboardEvent)=>{
      if(event.altKey&&event.key.toLowerCase()==='c'){event.preventDefault();if(cc.deskOpen)cc.closeDesk();else cc.openDesk('home');}
    };
    window.addEventListener('keydown',key);
    return()=>window.removeEventListener('keydown',key);
  },[cc.deskOpen,cc.openDesk,cc.closeDesk]);
  useEffect(()=>{if(cc.deskOpen)transcriptEnd.current?.scrollIntoView({block:'end'});},[messages,cc.deskOpen]);

  const add=(who:Speaker,text:string,channel?:Channel)=>setMessages(prev=>[...prev,{id:nextId.current++,who,text,channel}].slice(-32));
  async function ask(question:string){
    const message=question.trim().slice(0,1200);
    if(!message||sending)return;
    setDraft('');setNotice('');
    const before=messages.slice(-10);
    add('learner',message);
    if(/\b(hint|stuck|next step|more help)\b/i.test(message))setHintLevel(level=>Math.min(level+1,3));
    if(/\b(predict|quiz|challenge|duel)\b/i.test(message))setDuel(true);
    if(!aiOptIn){add('cc',localTutorReply(message,w,cc.caseIndex,hintLevel),'offline');return;}
    const controller=new AbortController();abort.current=controller;
    setSending(true);
    try{
      const timeout=window.setTimeout(()=>controller.abort(),20000);
      try{
        const response=await fetch('/api/cc2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message,context:connectedTutorContext(w,cc.caseIndex),history:before.map(item=>({role:item.who==='cc'?'assistant':'user',content:item.text.slice(0,1200)}))}),signal:controller.signal});
        if(!response.ok)throw Error(response.status===503?'Connected AI is not configured on this site.':`Tutor service returned ${response.status}.`);
        const data:unknown=await response.json();
        if(!data||typeof data!=='object'||!('reply' in data)||typeof data.reply!=='string'||!data.reply.trim())throw Error('The tutor did not return a usable message.');
        if(!controller.signal.aborted)add('cc',data.reply.slice(0,3500),'connected');
      }finally{window.clearTimeout(timeout);}
    }catch(err){
      if(abort.current!==controller)return;
      if(!controller.signal.aborted){
        setNotice(`${err instanceof Error?err.message:'AI is unavailable.'} Continuing with on-device evidence guidance.`);
        add('cc',localTutorReply(message,w,cc.caseIndex,hintLevel),'offline');
      }else{
        setNotice('The AI request was stopped. Your code and progress have not changed.');
      }
    }finally{if(abort.current===controller){abort.current=null;setSending(false);}}
  }
  const tabSuggestion=cc.deskTab==='words'?`Explain line ${cc.lineNumber} in my current code.`:promptMap[cc.deskTab];
  const selectedInput=evidence?.args;
  const canDuel=Boolean(evidence?.completed&&!evidence.error&&evidence.actual!==undefined);
  return <>
    <aside className="cc2-dock" aria-label="C.C. 2.0 coding partner">
      <button className={`cc2-summon cc2-${mood}`} onClick={()=>cc.openDesk('home')} aria-label="Open C.C. 2.0 coding partner" aria-keyshortcuts="Alt+C" aria-expanded={cc.deskOpen}>
        <Portrait mood={mood} small/><span className="cc2-summon-text"><strong>C.C. <em>2.0</em></strong><small>{sending?'Thinking about your question…':w?.running?'Watching your program…':evidence?.issue==='mismatch'?'A test needs attention':evidence?.issue==='passed'?'Your test evidence is ready':'Your coding partner'}</small></span><MessageCircle size={18}/>
      </button>
    </aside>
    {cc.deskOpen&&<div className="cc2-panel-layer" role="presentation">
      <div className="cc2-dismiss-area" onClick={cc.closeDesk} aria-hidden="true"/>
      <section className="cc2-panel" ref={dialog} role="dialog" aria-modal="false" aria-labelledby="cc2-title" aria-describedby="cc2-description">
        <header className="cc2-head"><Portrait mood={mood}/><div className="cc2-head-copy"><span className="cc2-overline"><Sparkles size={12}/> YOUR CODING PARTNER</span><h2 id="cc2-title">C.C. <span>2.0</span></h2><p id="cc2-description">One question. One useful next step.</p></div><button className="cc2-icon" aria-label="Close C.C. 2.0" onClick={cc.closeDesk}><X size={19}/></button></header>
        <div className="cc2-context"><div><span className="cc2-signal"/><span>{w?`${w.exercise.title} · ${w.language.toUpperCase()}`:'Ready for your first mission'}</span></div><button onClick={()=>setShowEvidence(v=>!v)} aria-expanded={showEvidence}><Eye size={14}/>What I can see <ChevronDown size={12}/></button></div>
        <div className="cc2-body">
        {showEvidence&&<div className="cc2-evidence" role="note"><strong>Evidence, not guesses</strong>{!w?<p>No code workspace is open yet.</p>:<><p>I can read your active source, the exercise contract, and any recorded test results. I cannot see unpublished runtime state or your other files.</p>{w.mode==='suite'&&<label className="cc2-case-picker">Test C.C. is inspecting<select value={evidence?.selected??0} onChange={event=>cc.setCaseIndex(Number(event.target.value))}>{w.exercise.cases.map((test,index)=><option key={index} value={index}>{test.label}</option>)}</select></label>}<div><span>Current test:</span><code>{evidence?.label??`Case ${cc.caseIndex+1}`}</code></div><div><span>Execution:</span><code>{w.running?'In progress':evidence?.completed?(w.mode==='custom'?'Custom experiment recorded':`${evidence.passed}/${evidence.total} tests passed`):evidence?.issue??'Not run'}</code></div>{evidence?.line&&<button onClick={()=>w.onFocusLine?.(evidence.line!)}>Go to reported line {evidence.line}<ArrowRight size={13}/></button>}{w.language==='python'&&w.result?.results.some(row=>Boolean(row.trace?.length))&&<details className="cc2-recorded-trace"><summary>Recorded Python steps</summary><TraceXRay workspace={w}/></details>}</>}<p className="cc2-privacy-note">Connected AI is opt-in. Its request includes the current code, selected test evidence and recent chat messages. No API key is placed in the browser.</p></div>}
        <div className="cc2-transcript" role="log" aria-live="polite" aria-label="Conversation with C.C.">
          <div className="cc2-entry-card"><Sparkles size={15}/><div><strong>Think. Test. Understand.</strong><p>You've completed {successes} coding checks in {p.language}. I won't claim a test passed without the runner's evidence.</p></div></div>
          {messages.map(item=><article className={`cc2-message cc2-message-${item.who}`} key={item.id}><div className="cc2-message-label">{item.who==='cc'?'C.C.':'YOU'}{item.channel&&<span>{item.channel==='connected'?'Connected AI':'Local guide'}</span>}</div><p>{item.text}</p></article>)}
          {sending&&<div className="cc2-thinking" role="status"><span/><span/><span/> Looking at the selected evidence… <button onClick={()=>abort.current?.abort()}><Square size={12}/>Stop</button></div>}
          {notice&&<p className="cc2-notice" role="status">{notice}</p>}
          <div ref={transcriptEnd}/>
        </div>
        {duel&&<div className="cc2-duel"><div className="cc2-duel-title"><BrainCircuit size={17}/><strong>Prediction Duel</strong><button aria-label="Close prediction duel" onClick={()=>{setDuel(false);setDuelResult(null);}}><X size={15}/></button></div><p>Before revealing the recorded output, predict what <code>solve({fmt(selectedInput)})</code> returns.</p><form onSubmit={event=>{event.preventDefault();const verdict=predictionVerdict(prediction,w,cc.caseIndex);setDuelResult(verdict.message);if(verdict.valid)add('cc',verdict.message,'offline');}}><input aria-label="Predicted result in JSON" maxLength={2000} value={prediction} onChange={event=>{setPrediction(event.target.value);setDuelResult(null);}} placeholder="e.g. 7 or [1,2]" disabled={!canDuel}/><button disabled={!canDuel||!prediction.trim()}>Reveal</button></form>{!canDuel&&<small>Run code and select a completed test first.</small>}{duelResult&&<p className="cc2-duel-verdict" role="status">{duelResult}</p>}</div>}
        </div>
        <div className="cc2-quick" aria-label="Quick questions"><button disabled={sending} onClick={()=>void ask(tabSuggestion??'Explain the function in my current code.')}><Lightbulb size={14}/>Explain my code</button><button disabled={sending} onClick={()=>void ask('Give me one hint, not the full solution.')}><Code2 size={14}/>One hint</button><button disabled={sending} onClick={()=>{setDuel(true);setDuelResult(null);setPrediction('');}}><BrainCircuit size={14}/>Prediction duel</button></div>
        <form className="cc2-composer" onSubmit={event=>{event.preventDefault();void ask(draft);}}><label htmlFor="cc2-input">Ask C.C. about your code</label><div><textarea id="cc2-input" ref={composer} value={draft} onChange={event=>setDraft(event.target.value)} rows={2} maxLength={1200} placeholder={w?'Why did this test fail? What does this line do?':'How do functions work?'} onKeyDown={event=>{if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();void ask(draft);}}}/><button aria-label="Send question to C.C." disabled={sending||!draft.trim()} type="submit"><Send size={17}/></button></div><div className="cc2-composer-meta"><label><input type="checkbox" checked={aiOptIn} onChange={event=>{setAiOptIn(event.target.checked);if(!event.target.checked){abort.current?.abort();abort.current=null;setSending(false);setNotice('Connected AI is off. Questions stay on this device.');}}}/><span>Allow connected AI for this chat</span></label><span>{aiOptIn?'Sends current code + selected test to the server':'On-device guidance only'}</span></div></form>
        <footer className="cc2-foot"><button onClick={()=>{abort.current?.abort();abort.current=null;setSending(false);setMessages([opening]);nextId.current=1;setHintLevel(0);setDuel(false);setDuelResult(null);setPrediction('');setDraft('');setAiOptIn(false);setNotice('');}}><RotateCcw size={14}/>Clear chat</button>{w?.onRun&&<button onClick={w.onRun} disabled={w.running}><Check size={14}/>Run tests</button>}{w?.onFocusLine&&evidence?.line&&<button onClick={()=>w.onFocusLine?.(evidence.line!)}><Eye size={14}/>Line {evidence.line}</button>}<button onClick={()=>{cc.closeDesk();onNotes();}}><BookOpen size={14}/>Notes</button></footer>
        {!w&&<div className="cc2-get-started"><button onClick={()=>{cc.closeDesk();onConcept('functions');}}><BookOpen size={14}/>Learn functions</button><button onClick={()=>{cc.closeDesk();onArcade();}}><Sparkles size={14}/>Play a coding game</button><button onClick={()=>{cc.closeDesk();onPractice();}}><Code2 size={14}/>Practice coding</button></div>}
      </section>
    </div>}
  </>;
}

/** A single doorway instead of the old three-column tool menu in Code Studio. */
export function CC2Launchpad(_props:{progress:QuestProgress;update:QuestUpdate}) {
  const cc=useCC();
  const w=cc.workspace;
  return <aside className="cc2-launchpad" aria-label="C.C. conversation shortcut"><div className="cc2-launchpad-top"><Portrait mood={w?.running?'thinking':'calm'} small/><div><span>YOUR PARTNER IS HERE</span><h2>Ask C.C. anything about this code.</h2></div></div><p>Stuck on a line? Not sure why a test failed? Talk through it with C.C., then make the next edit yourself.</p><button onClick={()=>cc.openDesk('clinic')}><MessageCircle size={16}/>Talk about my current code<ArrowRight size={15}/></button><small>She uses recorded test evidence and gives hints—not fake execution results.</small></aside>;
}
