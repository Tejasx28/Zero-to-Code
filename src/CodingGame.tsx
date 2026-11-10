import type { InsertConstruct } from './MissionEditor';
import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, ChevronLeft, ChevronRight, Code2, GripVertical, Lightbulb, Play, RotateCcw, Square, X } from 'lucide-react';
import { EXERCISES } from './curriculum';
import type { CodeCase } from './curriculum';
import type { QuestProgress } from './questState';
import type { QuestUpdate } from './CodeLab';
import { CCGuide, useCC } from './CCGuide';
import { MissionEditor } from './MissionEditor';
import { diagnosticLine, errorDirection } from './studioHelpers';
import { matches, runCode } from './runtime';
import type { CodeRun, RunResult, TraceFrame } from './runtime';
import { assembleGaps, CODE_OPERATIONS, KEYWORD_HELP, operationCompleteKey, operationDraftKey, readLineOrder, readOperationEvidence, reorderLine, sourceFromOrder } from './codeOperations';
import type { CodeOperation } from './codeOperations';
import './codingGame.css';
import { insertPlanComments } from './companionHelpers';
import { runMessage } from './coachMessages';

interface CodingGameProps { operationId: string; progress: QuestProgress; update: QuestUpdate; onCode: (exerciseId: string) => void; onBack: () => void }
const MODE_NAME = { complete: 'Complete the code', debug: 'Debug the code', arrange: 'Order the code', control: 'Code the controller', build: 'Build the function' };
const CHAPTER_NAME = { basics: 'The contract', control: 'The signal', arrays: 'The memory' };

function readStrings(raw: string | undefined, length: number): string[] {
  try { const values: unknown = JSON.parse(raw ?? ''); if (Array.isArray(values) && values.length === length && values.every(value => typeof value === 'string')) return values; } catch { /* Start with an empty scaffold if optional draft metadata is unreadable. */ }
  return Array.from({ length }, () => '');
}
const format = (value: unknown): string => value === undefined ? 'No returned value' : JSON.stringify(value);

export function CodingGame(props: CodingGameProps) {
  const operation = CODE_OPERATIONS.find(item => item.id === props.operationId) ?? CODE_OPERATIONS[0];
  return <OperationWorkspace key={`${operation.id}:${props.progress.language}`} {...props} operation={operation} />;
}

function OperationWorkspace({ operation, progress: p, update, onCode, onBack }: CodingGameProps & { operation: CodeOperation }) {
  const { reactTo, registerWorkspace, clearWorkspace, openDesk, setLineNumber } = useCC();
  const lastReaction = useRef('');
  const exercise = EXERCISES.find(item => item.id === operation.exerciseId) ?? EXERCISES[0];
  const language = p.language;
  const keywords = operation.keywords
    .filter(keyword => language === 'python' ? !['int', 'int[]', 'public static', '.length'].includes(keyword) : !['def', 'range', 'len'].includes(keyword))
    .map(keyword => language === 'java' && keyword === 'elif' ? 'else if' : keyword);
  const key = operationDraftKey(operation.id, language);
  const lines = operation.codeLines?.[language] ?? [];
  const gaps = operation.gaps?.[language] ?? [];
  const gapValues = readStrings(p.drafts[`${key}:gaps`], gaps.length);
  const order = readLineOrder(p.drafts[`${key}:order`], lines.length);
  const initialSource = lines.length ? sourceFromOrder(lines, order) : operation.initialSource[language];
  const source = p.drafts[key] ?? initialSource;
  const evidence = readOperationEvidence(p.drafts[operationCompleteKey(operation.id, language)]);
  const hints = Math.min(3, Math.max(0, Number(p.drafts[`${key}:hints`]) || 0));
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<RunResult | null>(null);
  const [selected, setSelected] = useState(0);
  const [traceStep, setTraceStep] = useState(0);
  const [help, setHelp] = useState<string | null>(null);
  const [showPlan, setShowPlan] = useState(false);
  const [resetArmed, setResetArmed] = useState(false);
  const [editorChanged, setEditorChanged] = useState(p.drafts[`${key}:free`] === 'yes');
  const [dragging, setDragging] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const constructInserter=useRef<InsertConstruct|null>(null);
  const runRef = useRef<CodeRun | null>(null),sourceRef=useRef(source);sourceRef.current=source;
  useEffect(() => () => { runRef.current?.cancel(); runRef.current = null; }, []);
  const test = exercise.cases[selected] ?? exercise.cases[0];
  const actual = result?.results[selected];
  const trace = actual?.trace ?? [];
  const frame = trace[Math.min(traceStep, Math.max(0, trace.length - 1))];
  const error = actual?.error ?? result?.error;
  const errorLine = actual?.line ?? diagnosticLine(error, language);
  const score = result?.results.filter((item, index) => !item.error && matches(item.actual, exercise.cases[index]?.expected)).length ?? 0;
  const allPassed = result !== null && !result.error && result.results.length === exercise.cases.length && score === exercise.cases.length;
  const attempted = result?.attempted === true;

  function saveDraft(fields: Record<string, string>) { update(previous => ({ ...previous, drafts: { ...previous.drafts, ...fields } })); }
  function planning() { if (lastReaction.current !== 'planning') { reactTo('planning'); lastReaction.current = 'planning'; } }
  function invalidate() {
    runRef.current?.cancel(); runRef.current = null;
    setRunning(false); setResult(null); setStatus(''); setTraceStep(0); setResetArmed(false);
  }
  function changeSource(value: string) { if (value === source) return; invalidate(); planning(); setEditorChanged(true); saveDraft({ [key]: value, [`${key}:free`]: 'yes' }); }
  function changeGap(index: number, value: string) {
    const next = gapValues.map((old, item) => item === index ? value : old);
    invalidate(); planning(); setEditorChanged(false);
    saveDraft({ [key]: assembleGaps(operation, language, next.map(item => item || '____')), [`${key}:gaps`]: JSON.stringify(next), [`${key}:free`]: 'no' });
  }
  function moveLine(from: number, to: number) {
    const next = reorderLine(order, from, to);
    if (next === order || from === to) return;
    invalidate(); planning(); setEditorChanged(false);
    saveDraft({ [key]: sourceFromOrder(lines, next), [`${key}:order`]: JSON.stringify(next), [`${key}:free`]: 'no' });
    setAnnouncement(`Code line moved to position ${to + 1}. The source below is updated.`);
  }
  async function execute() {
    if (!exercise || running || runRef.current) return;
    reactTo('running'); lastReaction.current = 'running';
    setRunning(true); setResult(null); setStatus('Preparing the language runtime…'); setTraceStep(0); setResetArmed(false);
    const handle = runCode(language, exercise, source, setStatus, { trace: language === 'python' });
    runRef.current = handle;
    try {
      const outcome = await handle.result;
      if (runRef.current !== handle) return;
      setResult(outcome); setRunning(false); runRef.current = null;
      const passed = outcome.results.reduce((total, item, index) => total + Number(!item.error && matches(item.actual, exercise.cases[index]?.expected)), 0);
      const complete = !outcome.error && outcome.results.length === exercise.cases.length && passed === exercise.cases.length;
      if (complete) { reactTo('success', 'Every case passed. Now try writing it without the scaffold.'); lastReaction.current = 'success'; }
      else if (outcome.attempted === true) { reactTo('bug',runMessage(outcome,exercise)); lastReaction.current = 'bug'; }
      else { reactTo('explore', 'The runtime could not finish. Your draft is safe; you can try again.'); lastReaction.current = 'explore'; }
      setStatus(outcome.attempted === true ? `${passed} of ${exercise.cases.length} cases passed` : 'The runtime could not finish. Your code is saved.');
      const firstFailure = outcome.results.findIndex((item, index) => item.error || !matches(item.actual, exercise.cases[index]?.expected));
      setSelected(firstFailure >= 0 ? firstFailure : 0);
      if (outcome.attempted === true) {
        update(previous => {
          const recordKey = operationCompleteKey(operation.id, language);
          const old = readOperationEvidence(previous.drafts[recordKey]);
          const record = { passed: old?.passed === true || complete, attempts: (old?.attempts ?? 0) + 1, firstScore: old?.firstScore ?? passed, lastScore: passed, total: exercise.cases.length, ...(old?.completedAt ? { completedAt: old.completedAt } : complete ? { completedAt: Date.now() } : {}) };
          return { ...previous, drafts: { ...previous.drafts, [recordKey]: JSON.stringify(record) } };
        });
      }
    } catch (failure) {
      if (runRef.current !== handle) return;
      runRef.current = null; setRunning(false); setStatus('The runtime stopped. Your code is saved.');
      setResult({ results: [], stdout: '', error: failure instanceof Error ? failure.message : 'The language runtime could not finish.' });
    }
  }
  function stop() { const wasRunning = Boolean(runRef.current); runRef.current?.cancel(); runRef.current = null; setRunning(false); setStatus('Run stopped. Your source is saved.'); if(wasRunning)reactTo('explore','Paused. Your source is safe. Take your time with the next change.'); }
  function reset() {
    if (!resetArmed) { setResetArmed(true); return; }
    invalidate(); setEditorChanged(false);
    saveDraft({ [key]: lines.length ? sourceFromOrder(lines, lines.map((_, index) => index)) : operation.initialSource[language], [`${key}:gaps`]: JSON.stringify(gaps.map(() => '')), [`${key}:order`]: JSON.stringify(lines.map((_, index) => index)), [`${key}:free`]: 'no' });
  }
  function revealHint() {
    if (hints >= 3) return;
    reactTo('hint', operation.nudge[hints]); lastReaction.current = 'hint';
    update(previous => ({ ...previous, hints: previous.hints + 1, drafts: { ...previous.drafts, [`${key}:hints`]: String(hints + 1) } }));
  }
  const [focusRequest,setFocusRequest]=useState<{line:number;nonce:number}|null>(null),jumpSequence=useRef(0);
  useEffect(()=>{if(!exercise)return;registerWorkspace({key,scope:'game',exercise,language,source,result,running,status,mode:'suite',hints:operation.nudge,onInsertSnippet:(text,place)=>{if(!constructInserter.current)return{error:'Open the editor first.'};const result=constructInserter.current(text,place);if(!result.error)update(prev=>({...prev,assisted:[...new Set([...prev.assisted,key])]}));return result;},onApplyPatch:(before,after)=>{if(sourceRef.current!==before)return{error:'Your draft changed. Build a new preview first.'};changeSource(after);return{};},onRun:()=>{void execute();},onFocusLine:line=>setFocusRequest({line,nonce:++jumpSequence.current}),onInsertPlan:steps=>{const out=insertPlanComments(source,language,steps);if(out.source)changeSource(out.source);return out;}});},[key,exercise,language,source,result,running,status,operation.nudge,registerWorkspace]);
  useEffect(()=>()=>clearWorkspace(key),[key,clearWorkspace]);
  useEffect(()=>setFocusRequest(null),[traceStep,selected,source]);
  const operationIndex = CODE_OPERATIONS.indexOf(operation) + 1;
  return <section className="coding-operation">
    <header className="op-header">
      <button className="op-back" onClick={onBack}><ArrowLeft size={16} /> Mission brief</button>
      <span className="op-header-status"><span /> Operation {String(operationIndex).padStart(2, '0')} / 05</span>
      
    </header>
    <div className="op-introduction">
      <div><div className="op-kicker">{CHAPTER_NAME[operation.chapter]} <span>/</span> {MODE_NAME[operation.mode]}</div><h1>{operation.title}<span>.</span></h1><p>{operation.brief}</p></div>
      <div className="op-cc-guide"><CCGuide compact><p>{operation.ccIntro}</p></CCGuide></div>
    </div>
    <div className="op-mission-strip"><span><Code2 size={17} /> {operation.concept}</span><p>{operation.objective}</p>{evidence?.passed && <strong><Check size={15} /> Previously cleared · {language === 'python' ? 'Python' : 'Java'}</strong>}</div>
    <div className="op-thinking">
      <button onClick={() => setShowPlan(value => !value)} aria-expanded={showPlan}><span>{showPlan ? '−' : '+'}</span> Make a plan in your own words <small>optional · saved with this mission</small></button>
      {showPlan && <label className="op-plan">What does the function need to do, in order?<textarea value={p.drafts[`${key}:plan`] ?? ''} onChange={event => saveDraft({ [`${key}:plan`]: event.target.value })} placeholder={operation.mode === 'debug' ? 'I think the mistake is… I will test it with…' : 'First… then… finally…'} rows={3} /></label>}
    </div>
    <div className={`op-workspace op-mode-${operation.mode}`}>
      <main className="op-code-area">
        {operation.mode === 'complete' && <section className="op-scaffold" aria-label="Complete the code">
          <div className="op-section-heading"><b>01 / Write the missing pieces</b><span>Typed code, executed below</span></div>
          <div className="op-gap-list">{gaps.map((gap, index) => <label key={gap.label}><span>{String(index + 1).padStart(2, '0')} / {gap.label}</span><input value={gapValues[index]} onChange={event => changeGap(index, event.target.value)} placeholder={gap.placeholder} autoComplete="off" autoCapitalize="off" spellCheck={false} /><small>{gap.explanation}</small></label>)}</div>
          {editorChanged && <p className="op-scaffold-note">You edited the full source. Changing a piece above rebuilds that source from the scaffold.</p>}
        </section>}
        {operation.mode === 'arrange' && <section className="op-scaffold" aria-label="Reorder actual code lines">
          <div className="op-section-heading"><b>01 / Put the program in order</b><span>Drag a line or use its arrow buttons</span></div>
          <ol className="op-code-order">{order.map((lineIndex, position) => <li key={lineIndex} draggable onDragStart={event => { setDragging(position); event.dataTransfer.setData('text/plain', String(position)); event.dataTransfer.effectAllowed = 'move'; }} onDragEnd={() => setDragging(null)} onDragOver={event => { if (dragging !== null) { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; } }} onDrop={event => { event.preventDefault(); if (dragging !== null) moveLine(dragging, position); setDragging(null); }} className={dragging === position ? 'is-dragging' : ''}>
            <span className="op-line-grip" aria-hidden="true"><GripVertical size={14} /></span><span className="op-line-number">{position + 1}</span><code>{lines[lineIndex]}</code><div><button onClick={() => moveLine(position, position - 1)} disabled={position === 0} aria-label={`Move line ${position + 1} up`}><ArrowUp size={14} /></button><button onClick={() => moveLine(position, position + 1)} disabled={position === order.length - 1} aria-label={`Move line ${position + 1} down`}><ArrowDown size={14} /></button></div>
          </li>)}</ol>
          <p className="op-scaffold-note">The tests execute your assembled source. Indentation and braces matter. {editorChanged && 'You edited the full source; moving a row rebuilds it from these lines.'}</p>
        </section>}
        <section className="op-editor-panel" aria-label="Source editor">
          <div className="op-editor-heading"><div><span className="op-file-dot" /><b>{language === 'python' ? `${operation.mode === 'control' ? 'controller' : operation.id}.py` : 'Solution.java'}</b><span>/{operation.id}</span></div><span>saved on this device</span></div>
          <MissionEditor onInsertReady={insert=>{constructInserter.current=insert;}} onExplainLine={line=>{setLineNumber(line);openDesk('words');}} focusRequest={focusRequest} value={source} language={language} onChange={changeSource} onRun={() => { void execute(); }} activeLine={focusRequest?.line ?? (frame?.event !== 'return' ? frame?.line ?? null : null)} errorLine={errorLine} errorMessage={error} />
          <div className="op-editor-footer" id="mission-editor-help"><span>Ctrl / ⌘ + Enter to run · Ctrl / ⌘ + Z to undo · Ctrl + M lets Tab leave the editor</span><button onClick={reset} className={resetArmed ? 'op-reset-confirm' : ''}><RotateCcw size={13} /> {resetArmed ? 'Confirm reset source' : 'Reset source'}</button>{resetArmed && <button onClick={() => setResetArmed(false)}>Cancel</button>}</div>
          <div className="op-run-bar"><div>{running ? <button className="op-run-button op-stop" onClick={stop}><Square size={14} /> Stop run</button> : <button className="op-run-button" onClick={() => { void execute(); }}><Play size={15} fill="currentColor" /> Run all {exercise.cases.length} cases</button>}<span>{running ? 'Executing your actual source…' : `${language === 'python' ? 'Python' : 'Java'} · real execution`}</span></div><span className="op-run-status" role="status" aria-live="polite">{status}</span></div>
        </section>
        <div className="op-keywords"><span>Syntax at hand</span>{keywords.map(keyword => <button key={keyword} aria-expanded={help === keyword} onClick={() => setHelp(help === keyword ? null : keyword)}><code>{keyword}</code></button>)}</div>
        {help && <div className="op-keyword-help" role="status"><code>{help}</code><p>{KEYWORD_HELP[help]}</p><button onClick={() => setHelp(null)} aria-label="Close syntax explanation"><X size={15} /></button></div>}
      </main>
      <aside className="op-observation">
        <section className="op-test-panel">
          <div className="op-section-heading"><b>The proving ground</b><span>{attempted ? `${score} / ${exercise.cases.length} passed` : `${exercise.cases.length} varied cases`}</span></div>
          <p className="op-panel-lede">The same function runs with each input. Use the evidence to improve your code.</p>
          <div className="op-test-tabs" role="group" aria-label="Inspect a test case">{exercise.cases.map((item, index) => { const caseOutcome = result?.results[index]; const state = caseOutcome ? !caseOutcome.error && matches(caseOutcome.actual, item.expected) ? 'pass' : 'fail' : ''; return <button key={item.label} onClick={() => { setSelected(index); setTraceStep(0); }} className={`${selected === index ? 'selected' : ''} ${state}`} aria-pressed={selected === index}><span>{state === 'pass' ? <Check size={13} /> : state === 'fail' ? <X size={13} /> : String(index + 1).padStart(2, '0')}</span>{item.label}</button>; })}</div>
          <div className="op-case-detail"><span className="op-detail-label">Input to your function</span><code>solve({test.args.map(format).join(', ')})</code>{actual || result?.error ? <><div className="op-return-grid"><div><span>Expected return</span><code>{format(test.expected)}</code></div><div className={actual && !actual.error && matches(actual.actual, test.expected) ? 'correct' : ''}><span>Your return</span><code>{actual?.error || result?.error ? 'Error' : format(actual?.actual)}</code></div></div>{error && <div className="op-error"><b>{errorLine ? `Check line ${errorLine}` : 'Read the runtime message'}</b><p>{errorDirection(error, language)}</p><details><summary>Full error message</summary><pre>{error}</pre></details></div>}</> : <p className="op-think-note">Before running: follow your code with this input. Where could it go wrong?</p>}</div>
          {operation.mode === 'control' && <RouteBoard test={test} actual={actual?.actual} hasResult={Boolean(actual && !actual.error)} />}
          {operation.mode === 'build' && <MemoryBank values={test.args[0]} frame={frame} />}
          {trace.length > 0 && <div className="op-trace"><div><b>Follow the actual execution</b><span>{traceStep + 1} / {trace.length}</span></div><div className="op-trace-controls"><button onClick={() => setTraceStep(value => Math.max(0, value - 1))} disabled={traceStep === 0} aria-label="Previous executed line"><ChevronLeft size={16} /></button><input type="range" aria-label="Execution step" min={0} max={Math.max(0, trace.length - 1)} value={traceStep} onChange={event => setTraceStep(Number(event.target.value))} /><button onClick={() => setTraceStep(value => Math.min(trace.length - 1, value + 1))} disabled={traceStep >= trace.length - 1} aria-label="Next executed line"><ChevronRight size={16} /></button></div><p>{frame?.event === 'return' ? `Returned ${format(frame.returned)}` : frame?.event === 'exception' ? 'Execution stopped on an error.' : `About to execute line ${frame?.line ?? '—'}`}</p><dl>{Object.entries(frame?.locals ?? {}).filter(([name]) => !name.startsWith('__')).map(([name, value]) => <div key={name}><dt>{name}</dt><dd>{format(value)}</dd></div>)}</dl></div>}
          {language === 'java' && result?.attempted && <p className="op-trace-note">These results come from compiled Java. Step through the branches in your editor using the selected input.</p>}
          {result?.stdout && <details className="op-stdout"><summary>Printed output</summary><pre>{result.stdout}</pre></details>}
        </section>
        <section className="op-hints"><div><Lightbulb size={18} /><b>Need a nudge?</b><span>{hints} / 3</span></div><p>Try one change first. Hints help you reason through the next step.</p>{operation.nudge.slice(0, hints).map((nudge, index) => <div className="op-nudge" key={nudge}><span>0{index + 1}</span><p>{nudge}</p></div>)}{hints < 3 && <button onClick={revealHint}>{hints === 0 ? 'Give me a small nudge' : 'One more nudge'} <ArrowRight size={14} /></button>}</section>
      </aside>
    </div>
    {allPassed && <section className="op-success" role="status"><div className="op-success-symbol"><Check size={23} /></div><div><span>Every case passed.</span><h2>The code is yours. Now lose the scaffolding.</h2><p>You cleared this guided operation. Next, write the related function in the Code studio. That is checked separately.</p></div><button onClick={() => onCode(operation.exerciseId)}>Write it on my own <ArrowRight size={17} /></button></section>}
    {!allPassed && <footer className="op-bottom"><span>{evidence?.passed ? 'Your earlier clear is saved. New edits need a fresh run to verify them.' : 'A useful failure tells you where to think next. Your draft is saved.'}</span><button onClick={() => onCode(operation.exerciseId)}>Open the full coding task <ArrowRight size={15} /></button></footer>}
    <div className="op-sr-only" role="status" aria-live="polite">{announcement}</div>
  </section>;
}

function RouteBoard({ test, actual, hasResult }: { test: CodeCase; actual: unknown; hasResult: boolean }) {
  const expected = test.expected as number[];
  const returned = Array.isArray(actual) && actual.length === 2 && actual.every(value => Number.isInteger(value)) ? actual as number[] : null;
  const extent = Math.min(5, Math.max(3, ...expected.map(Math.abs), ...(returned?.filter(value => Math.abs(value) <= 5).map(Math.abs) ?? [])));
  const size = extent * 2 + 1;
  const commands = Array.isArray(test.args[0]) ? test.args[0] : [];
  return <div className="op-route"><div className="op-route-legend"><b>Controller output</b><span>North ↑ · East →</span></div><div className="op-direction-codes" aria-label="Input commands">{commands.length ? commands.map((value, index) => <span key={index} title={`${value}: ${['', 'North', 'East', 'South', 'West'][value]}`}>{['', '↑', '→', '↓', '←'][value]}<small>{value}</small></span>) : <i>No commands</i>}</div><div className="op-coordinate-board" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }} role="img" aria-label={`Coordinate grid. Origin zero, zero. Goal ${format(expected)}.${hasResult ? ` Your function returned ${format(actual)}.` : ' Run your code to place your unit.'}`}>{Array.from({ length: size * size }, (_, index) => { const x = index % size - extent; const y = Math.floor(index / size) - extent; const goal = x === expected[0] && y === expected[1]; const unit = hasResult && returned && x === returned[0] && y === returned[1]; return <div key={index} className={`${x === 0 || y === 0 ? 'axis' : ''} ${goal ? 'goal' : ''} ${unit ? 'unit' : ''}`} aria-hidden="true">{unit ? <span>◆</span> : goal ? <span>◎</span> : x === 0 && y === 0 ? <small>0,0</small> : null}</div>; })}</div><p><span>◎ Goal {format(expected)}</span><span>◆ {hasResult ? `Your return: ${format(actual)}` : 'Unit awaits your code'}</span></p>{hasResult && !returned && <p className="op-route-warning">Return an array containing two whole-number coordinates.</p>}{returned && returned.some(value => Math.abs(value) > extent) && <p className="op-route-warning">Your position is outside this grid. Its exact coordinates are shown above.</p>}</div>;
}

function MemoryBank({ values, frame }: { values: number | number[]; frame?: TraceFrame }) {
  const array = Array.isArray(values) ? values : [];
  const index = typeof frame?.locals.i === 'number' ? frame.locals.i : typeof frame?.locals.index === 'number' ? frame.locals.index : null;
  return <div className="op-memory"><div><b>The input bank</b><span>{array.length} slots · indexes start at 0</span></div><div className="op-memory-slots">{array.length ? array.map((value, position) => <div key={position} className={position === index ? 'active' : ''}><code>{value}</code><span>{position}</span></div>) : <p>An empty array still needs a valid returned total.</p>}</div><p>{index !== null ? `Your execution is visiting index ${index}.` : 'Each box is one value. A general solution must visit every value.'}</p></div>;
}
