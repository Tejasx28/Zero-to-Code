import { useEffect, useRef, useState } from 'react';
import { MORE_GAMES, MORE_EXERCISES } from './moreGames';
import { MissionEditor } from './MissionEditor';
import type { InsertConstruct } from './MissionEditor';
import { runCode, matches } from './runtime';
import type { CodeRun, RunResult } from './runtime';
import { useCC } from './CCGuide';
import { ZeroBriefing } from './ZeroBriefing';
import type { QuestProgress } from './questState';
import type { QuestUpdate } from './CodeLab';
import { gameProgressKey, hasGamePass, recordGameRun, reviewGameRun } from './gameMechanics';
import type { GameRunReview } from './gameMechanics';
import { practiceKey } from './practiceContent';

/** The five newer worlds share a rehearsal → real code → independent remix contract. */
export function MoreGameSession({id,progress:p,update,onBack,onPractice}:{id:string;progress:QuestProgress;update:QuestUpdate;onBack:()=>void;onPractice:(id:string)=>void}) {
  const game=MORE_GAMES.find(g=>g.id===id)!,exercise=MORE_EXERCISES.find(g=>g.id===id)!,cc=useCC();
  const sourceKey=`${p.language}:arcade:${id}:source`,source=p.drafts[sourceKey]??exercise.starter[p.language];
  const stageKey=gameProgressKey(p.language,id,'stage');
  const [stage,setStage]=useState<'rehearse'|'program'>(()=>p.drafts[stageKey]==='program'||(!p.drafts[stageKey]&&p.drafts[sourceKey]!==undefined)?'program':'rehearse');
  const [result,setResult]=useState<RunResult|null>(null),[review,setReview]=useState<GameRunReview|null>(null);
  const [status,setStatus]=useState(''),[running,setRunning]=useState(false),[selected,setSelected]=useState(0);
  const [replay,setReplay]=useState(0),[line,setLine]=useState<{line:number;nonce:number}|null>(null);
  const handle=useRef<CodeRun|null>(null),insert=useRef<InsertConstruct|null>(null);
  const passed=hasGamePass(p,p.language,id);
  const rehearsed=p.drafts[gameProgressKey(p.language,id,'rehearsed')]==='yes';
  const remixPassed=p.code[practiceKey(game.transfer,p.language)]?.passed===true;
  const attempts=Number(p.drafts[gameProgressKey(p.language,id,'attempts')])||0;

  useEffect(()=>()=>{handle.current?.cancel();handle.current=null;},[]);
  useEffect(()=>{update(old=>old.drafts['v04:learning-started']==='yes'?old:{...old,drafts:{...old.drafts,'v04:learning-started':'yes'}});},[update]);
  function visit(next:'rehearse'|'program') {
    setStage(next);
    update(old=>({...old,drafts:{...old.drafts,[stageKey]:next}}));
  }
  function rehearsedWorld(){update(old=>old.drafts[gameProgressKey(p.language,id,'rehearsed')]==='yes'?old:{...old,drafts:{...old.drafts,[gameProgressKey(p.language,id,'rehearsed')]:'yes'}});}
  function change(text:string){
    cc.reactTo('planning');handle.current?.cancel();handle.current=null;
    setRunning(false);setResult(null);setReview(null);setStatus('');
    update(old=>({...old,drafts:{...old.drafts,[sourceKey]:text}}));
  }
  async function run(){
    if(handle.current)return;
    cc.reactTo('running');setRunning(true);setResult(null);setReview(null);setStatus('Preparing your program…');
    const active=runCode(p.language,exercise,source,setStatus,{trace:p.language==='python'});
    handle.current=active;
    const output=await active.result;
    if(handle.current!==active)return;
    handle.current=null;setRunning(false);setResult(output);
    const verdict=reviewGameRun(output,exercise.cases);
    setReview(verdict);setSelected(verdict.firstFailure??0);setStatus('');
    update(old=>recordGameRun(old,p.language,id,verdict));
    if(verdict.status==='passed')cc.reactTo('success',verdict.message);
    else if(verdict.status==='failed')cc.reactTo('bug',verdict.message);
    else cc.reactTo('explore',verdict.message);
  }
  useEffect(()=>{
    if(stage!=='program')return;
    cc.registerWorkspace({
      key:sourceKey,scope:'game',exercise,language:p.language,source,result,running,status,mode:'suite',
      onRun:()=>{void run();},
      onFocusLine:n=>setLine({line:n,nonce:Date.now()}),
      onApplyPatch:(before,after)=>{
        if(before!==source)return{error:'The source changed. Review again.'};
        change(after);update(old=>({...old,assisted:[...new Set([...old.assisted,sourceKey])]}));return{};
      },
      onInsertSnippet:(text,place)=>{
        const outcome=insert.current?.(text,place)??{error:'Open the editor first.'};
        if(!outcome.error)update(old=>({...old,assisted:[...new Set([...old.assisted,sourceKey])]}));
        return outcome;
      },
    });
    return()=>cc.clearWorkspace(sourceKey);
  },[sourceKey,stage,source,result,running,status,cc.registerWorkspace,cc.clearWorkspace]);

  return <section className="extra-game">
    <button className="extra-back" onClick={onBack}>← Training grounds</button>
    <ZeroBriefing id={id} title={game.title} steps={[game.rule,game.idea,'Rehearse the rule, write solve, run varied inputs, then try the independent remix.']} progress={p} update={update}/>
    <header className="extra-heading"><div><span className="section-kicker">{game.topic.toUpperCase()} / CODING MISSION</span><h1>{game.title}</h1><p>{game.rule}</p></div><div className="extra-progress" aria-label="Mission progress"><span>{rehearsed?'✓ Rehearsed':'1 · Explore'}</span><span>{passed?'✓ Program checked':'2 · Write code'}</span><span>{remixPassed?'✓ Remix solved':'3 · Independent remix'}</span></div></header>
    <nav className="extra-stage" aria-label="Game learning stages">
      <button aria-current={stage==='rehearse'?'step':undefined} onClick={()=>visit('rehearse')}>1 · Rehearse</button>
      <button aria-current={stage==='program'?'step':undefined} onClick={()=>visit('program')}>2 · Program</button>
      <button disabled={!passed} onClick={()=>onPractice(game.transfer)} title={!passed?'Pass the game code to unlock the recommended remix.':undefined}>3 · Independent remix →</button>
    </nav>
    {stage==='rehearse'?<div className="extra-rehearse-layout"><div><Rehearsal key={`${id}:${replay}`} id={id} onComplete={rehearsedWorld}/><button className="extra-replay" onClick={()=>setReplay(n=>n+1)}>↻ Reset the rehearsal</button></div><aside className="implementation-lens"><span>IMPLEMENTATION LENS</span><h2>{game.topic}</h2><p>{game.idea}</p><p>Manual moves teach the rule. Your program must make the decisions for inputs you have not seen.</p><button className="extra-next" onClick={()=>visit('program')}>Make code run the rule →</button>{rehearsed&&<small>Rehearsal completed in this language.</small>}</aside></div>
      :<div className="extra-workbench"><section className="extra-editor-panel"><div className="extra-code-heading"><h2>Write the controller</h2><p><code>{exercise.contract}</code></p></div><div className="extra-code-actions"><button className="extra-run" disabled={running||!source.trim()} onClick={()=>{void run();}}>{running?'Running…':'▶ Run all six tests'}</button>{running&&<button onClick={()=>handle.current?.cancel()}>■ Stop run</button>}<button onClick={()=>cc.openDesk('clinic')}>Scan & repair</button><button onClick={()=>cc.openDesk('blueprint')}>Starting structure</button></div><MissionEditor key={sourceKey} value={source} language={p.language} onChange={change} onRun={()=>{void run();}} onInsertReady={i=>{insert.current=i;}} activeLine={null} errorLine={result?.results[review?.firstFailure??0]?.line??null} errorMessage={result?.results[review?.firstFailure??0]?.error??result?.error} focusRequest={line}/><p className="extra-editor-note">Your draft is saved in this browser for {p.language}. Run tests to see what your program actually returns.</p></section>
        <aside className="extra-evidence"><h2>Real execution evidence</h2>{running&&<p role="status">{status||'Running your program…'}</p>}{review&&<div role="status" className={`extra-verdict extra-verdict-${review.status}`}><strong>{review.status==='passed'?'All six cases passed':review.status==='failed'?`${review.score}/${review.total} cases passed`:'Run not counted'}</strong><p>{review.message}</p></div>}{passed&&review?.status!=='passed'&&<p className="extra-previous-pass">Previously passed in {p.language}. Your current changes still need testing.</p>}{attempts>0&&<small>{attempts} complete {attempts===1?'attempt':'attempts'} recorded for this world and language.</small>}
          <div className="extra-test-nav" aria-label="Choose test case">{exercise.cases.map((c,i)=><button key={i} aria-pressed={selected===i} onClick={()=>setSelected(i)}>{result&&review?.countsAsAttempt?(result.results[i]&&!result.results[i].error&&matches(result.results[i].actual,c.expected)?'✓':'×'):`${i+1}`}</button>)}</div>
          {exercise.cases.map((c,i)=><article className="extra-case" key={i} hidden={i!==selected}><strong>Test {i+1}: {c.label}</strong><div>Input <code>{JSON.stringify(c.args)}</code></div><div>Expected <code>{JSON.stringify(c.expected)}</code></div><div>Returned <code>{result?.results[i]?JSON.stringify(result.results[i].actual)??'No value':'Not run yet'}</code></div>{result?.results[i]?.error&&<pre role="alert">{result.results[i].error}</pre>}</article>)}
          {review?.status==='passed'&&<div className="extra-next-remix"><strong>New rule. Fresh starter.</strong><p>The related problem checks whether you can reuse the idea independently. Game completion does not count as a remix pass.</p><button onClick={()=>onPractice(game.transfer)}>{remixPassed?'Revisit independent remix':'Write independent remix →'}</button></div>}
        </aside></div>}
  </section>;
}

function Rehearsal({id,onComplete}:{id:string;onComplete:()=>void}) {
  const orders=[3,8,-1,2,-1,-1,-1,4],initial=id==='sorting-rail'?[5,2,4,1,3]:[2,4,7,10,13,18,25];
  const [at,setAt]=useState(0),[row,setRow]=useState<number[]>(id==='sorting-rail'?initial:[]),[sent,setSent]=useState<number[]>([]),[message,setMessage]=useState(''),[low,setLow]=useState(0),[high,setHigh]=useState(6),[done,setDone]=useState(false),[moves,setMoves]=useState(0);
  function act(kind:string){
    if(at>=orders.length)return;
    const v=orders[at];
    if(id==='prefix-reactor'){
      if(kind==='reset'){setMessage('Reset would forget earlier readings. Keep the total between visits.');return;}
      setSent([...sent,(sent.at(-1)??0)+v]);setAt(at+1);if(at+1===orders.length)onComplete();return;
    }
    const expected=v>0?'join':row.length?'leave':'ignore';
    if(kind!==expected){setMessage(v>0?'This is an arrival. Keep it before handling the next order.':row.length?'A departure must use the correct end of the waiting row.':'No pod is waiting. Ignore this departure safely.');return;}
    if(kind==='join')setRow([...row,v]);
    if(kind==='leave'){setSent([...sent,id==='stack-rescue'?row.at(-1)!:row[0]]);setRow(id==='stack-rescue'?row.slice(0,-1):row.slice(1));}
    setMessage('Order processed. The waiting state carries into the next step.');setAt(at+1);if(at+1===orders.length)onComplete();
  }
  if(id==='binary-intercept')return <div className="rehearsal-world"><span>INTERCEPT TARGET 18 · ACTIVE INTERVAL {low}…{high}</span><div className="token-row">{initial.map((v,i)=><button disabled={done||i<low||i>high} key={i} onClick={()=>{const mid=Math.floor((low+high)/2);if(i!==mid){setMessage(`Probe the middle index: floor((${low}+${high})/2) = ${mid}.`);return;}setMoves(moves+1);if(v===18){setDone(true);onComplete();setMessage(`Intercepted at index ${i} in ${moves+1} probes.`);}else if(v<18){setLow(i+1);setMessage('The middle value is too small. Discard it and everything to its left.');}else{setHigh(i-1);setMessage('The middle value is too large. Keep only the left interval.');}}}><small>index {i}</small>{v}</button>)}</div><p role="status">{message||'Select the middle candidate to cut the search interval.'}</p>{done&&<strong>Rule understood through rehearsal. Now write the search in code.</strong>}</div>;
  if(id==='sorting-rail')return <div className="rehearsal-world"><span>ADJACENT SWAPS · {moves} USED / 7 ALLOWED</span><div className="token-row">{row.map((v,i)=><div key={i}><b>{v}</b>{i<row.length-1&&<button disabled={moves>=7||done} onClick={()=>{if(row[i]<=row[i+1]){setMessage('These neighbors are already ordered. Save your swap for an inversion.');return;}const next=[...row];[next[i],next[i+1]]=[next[i+1],next[i]];setRow(next);setMoves(moves+1);const solved=next.every((x,k)=>k===0||next[k-1]<=x);setDone(solved);if(solved)onComplete();setMessage('One inversion repaired. Check the remaining neighbors.');}}>Swap →</button>}</div>)}</div><p role="status">{done?'Rail cleared. Now express repeated neighbor comparisons in code.':message||'Repair neighboring inversions without wasting swaps.'}</p></div>;
  return <div className="rehearsal-world"><span>{id==='prefix-reactor'?'ENERGY READINGS':'ARRIVAL / DEPARTURE ORDERS'} · {at}/{orders.length}</span><div className="token-row">{orders.map((v,i)=><b className={i===at?'active':''} key={i}>{v}</b>)}</div><h3>{id==='prefix-reactor'?'Recorded running balances':'Waiting row'}</h3><div className="token-row">{(id==='prefix-reactor'?sent:row).map((v,i)=><b key={i}>{v}</b>)}</div>{id!=='prefix-reactor'&&<p>Launched: [{sent.join(', ')}]</p>}{at<orders.length?<div className="rehearsal-actions">{id==='prefix-reactor'?<><button onClick={()=>act('accumulate')}>Add reading & record balance</button><button onClick={()=>act('reset')}>Reset before reading</button></>:<><button onClick={()=>act('join')}>Dock arrival</button><button onClick={()=>act('leave')}>{id==='stack-rescue'?'Launch newest':'Dispatch oldest'}</button><button onClick={()=>act('ignore')}>Ignore empty departure</button></>}</div>:<h3>Rehearsal complete. Program this rule for new orders.</h3>}<p role="status">{message}</p></div>;
}
