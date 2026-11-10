import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Code, Pause, Play, Wrench } from '@phosphor-icons/react';
import { useCC } from './CCGuide';
import type { CCWorkspace } from './CCGuide';
import type { QuestProgress } from './questState';
import type { QuestUpdate } from './CodeLab';
import { checkPythonSpacing, matches } from './runtime';
import type { TraceFrame } from './runtime';
import { diagnosticLine, errorDirection, hintLadder } from './studioHelpers';
import { indentWidth, missingBody, sameInstructions, spacingCandidates, visibleSpaces } from './spacing';
import type { SpacingCandidate } from './spacing';
import { TestDesigner } from './TestDesigner';
import { CounterexampleFinder } from './CounterexampleFinder';

const show = (value: unknown) => JSON.stringify(value) ?? 'not set';
export function RepairDesk({ workspace: w, progress: p, update }: { workspace: CCWorkspace; progress: QuestProgress; update: QuestUpdate }) {
  const cc = useCC(), selected = Math.min(cc.caseIndex, w.exercise.cases.length - 1);
  const row = w.result?.results[w.mode === 'custom' ? 0 : selected], test = w.exercise.cases[selected];
  const live = w.language === 'python' ? missingBody(w.source) : null;
  const error = w.result?.error ?? row?.error ?? (live ? `IndentationError: expected an indented block after statement on line ${live.parent}` : undefined);
  const line = row?.line ?? diagnosticLine(w.result?.error ?? row?.error, w.language) ?? live?.line ?? null;
  const indentation = w.language === 'python' && Boolean(error && /IndentationError|TabError|indented block|unexpected indent|unindent/i.test(error));
  const [preview, setPreview] = useState<SpacingCandidate | null>(null), [checking, setChecking] = useState(false), [feedback, setFeedback] = useState('');
  const checker = useRef<ReturnType<typeof checkPythonSpacing> | null>(null);
  useEffect(() => { setPreview(null); setFeedback(''); setChecking(false); return () => { checker.current?.cancel(); checker.current = null; }; }, [w.source, w.key]);
  const hintKey = w.scope === 'game' ? `${w.key}:hints` : `nudges:${w.key}`, hints = Math.max(0, Math.min(3, Number(p.drafts[hintKey]) || 0));
  const ladder = w.hints ?? hintLadder(w.exercise);
  const passed = w.mode === 'suite' && w.result?.results.length === w.exercise.cases.length && !w.result.error && w.result.results.every((entry, index) => !entry.error && matches(entry.actual, w.exercise.cases[index].expected));
  async function prepare() {
    if (checking || !error) return;
    const candidates = spacingCandidates(w.source, line, error);
    if (!candidates.length) { setFeedback('This needs a manual spacing check. Show the spaces in your editor, then indent the lines that belong together.'); return; }
    setChecking(true); setFeedback('Checking a spacing preview…');
    const active = checkPythonSpacing(candidates.map(item => item.source), setFeedback); checker.current = active;
    const result = await active.result; if (checker.current !== active) return;
    checker.current = null; setChecking(false);
    const valid = result.checks.findIndex(check => check.valid);
    if (valid < 0) { setFeedback(result.error ?? 'One spacing change is not enough. Use the editor controls to adjust the block, then run again.'); return; }
    setPreview(candidates[valid]); setFeedback('Python accepts this spacing. Review the changed lines before applying it.');
  }
  function apply() {
    if (!preview || !sameInstructions(w.source, preview.source)) return;
    const result = w.onApplyPatch?.(w.source, preview.source);
    if (!w.onApplyPatch) { setFeedback('Use the indentation buttons in your editor to make this change.'); return; }
    if (result?.error) { setFeedback(result.error); return; }
    update(prev => ({ ...prev, assisted: [...new Set([...prev.assisted, w.key])], drafts: { ...prev.drafts, [`spacing-help:${w.key}`]: String((Number(prev.drafts[`spacing-help:${w.key}`]) || 0) + 1) } }));
    cc.reactTo('planning', 'Spacing updated. No statements were added or removed. Run the tests to check the behavior.');
    w.onFocusLine?.(preview.edits[0]?.line ?? 1); setPreview(null);
  }
  return <div className="repair-desk">
    {!preview && (error ? <section className="coach-diagnosis"><span className="coach-eyebrow">{indentation ? 'Spacing check' : 'Run check'}</span><h3>{indentation ? `Fix spacing on line ${line ?? '—'}.` : line ? `Check line ${line}.` : 'The run stopped.'}</h3><p>{indentation && line ? `This line starts with ${indentWidth(w.source.split('\n')[line - 1] ?? '')} spaces. Python uses indentation to decide which block it belongs to.` : errorDirection(error, w.language)}</p>{line && <pre className="coach-source-line"><span>{line}</span>{visibleSpaces(w.source.split('\n')[line - 1] ?? '')}</pre>}<div className="coach-actions">{indentation && w.onApplyPatch && <button className="coach-primary" disabled={checking || w.running} onClick={() => { void prepare(); }}><Wrench size={16}/>{checking ? 'Checking…' : 'Preview spacing fix'}</button>}{line && <button className="coach-text-action" onClick={() => w.onFocusLine?.(line)}>Go to line {line}<ArrowRight size={14}/></button>}</div><details className="coach-details"><summary>Read the original error message</summary><pre>{error}</pre></details></section> : !w.result ? <section className="coach-diagnosis"><span className="coach-eyebrow">Your next step</span><h3>Make one small version.</h3><p>{w.exercise.brief}</p><button className="coach-primary" disabled={w.running} onClick={w.onRun}><Play size={16} weight="fill"/>{w.running ? 'Running…' : 'Run your code'}</button></section> : <section className="coach-diagnosis"><span className="coach-eyebrow">{passed ? 'Every test passed' : 'Follow one input'}</span><h3>{passed ? 'Try to break your solution.' : 'Find where it changes.'}</h3>{w.mode === 'suite' && <label className="coach-select">Test case<select value={selected} onChange={event => cc.setCaseIndex(Number(event.target.value))}>{w.exercise.cases.map((entry, i) => <option key={entry.label} value={i}>{entry.label}</option>)}</select></label>}<code className="coach-function-call">solve({(w.mode === 'custom' ? w.customArgs ?? [] : test.args).map(show).join(', ')})</code><div className="coach-result-pair">{w.mode === 'suite' && <div><span>Expected</span><strong>{show(test.expected)}</strong></div>}<div><span>Your return</span><strong>{show(row?.actual)}</strong></div></div><p>{passed ? 'Choose an input your code has not seen yet.' : 'Step through this input. Watch the values before changing a line.'}</p><button className="coach-primary" onClick={() => cc.setDeskTab(passed ? 'test' : 'trace')}>{passed ? 'Design a test' : 'Trace this input'}<ArrowRight size={16}/></button></section>)}
    {feedback && <p className="coach-feedback" role="status">{feedback}</p>}
    {!error && !passed && w.result && w.mode === 'suite' && <CounterexampleFinder workspace={w} caseIndex={selected}/>}
    {preview && <section className="spacing-preview"><header><strong>{preview.label}</strong><span>{preview.edits.length} {preview.edits.length === 1 ? 'line' : 'lines'}</span></header>{preview.edits.map(edit => <div key={edit.line}><small>Line {edit.line}</small><pre className="spacing-before">− {visibleSpaces(edit.before)}</pre><pre className="spacing-after">+ {visibleSpaces(edit.after)}</pre></div>)}<p>Only leading whitespace changes. Check which lines belong in the block.</p><button className="coach-primary" onClick={apply}><Check size={16}/>Apply spacing change</button><button className="coach-text-action" onClick={() => setPreview(null)}>Keep my code</button></section>}
    {!preview && !w.exercise.independent && <details className="coach-details coach-hints"><summary>Give me one hint <span>{hints}/3</span></summary>{hints > 0 && <p>{ladder[hints - 1]}</p>}<button className="coach-text-action" disabled={hints >= 3} onClick={() => { update(prev => ({ ...prev, hints: prev.hints + 1, assisted: [...new Set([...prev.assisted, w.key])], drafts: { ...prev.drafts, [hintKey]: String(hints + 1) } })); cc.reactTo('hint', ladder[hints]); }}>{hints < 3 ? 'Show the next hint' : 'All hints opened'}<ArrowRight size={14}/></button></details>}
  </div>;
}

export function ExperimentDesk({ workspace: w }: { workspace: CCWorkspace }) {
  const cc = useCC(), row = w.mode === 'custom' ? w.result?.results[0] : null;
  return <div className="experiment-desk"><span className="coach-eyebrow">Test your thinking</span><h3>Choose the input.</h3>{w.onTryCase ? <TestDesigner exercise={w.exercise} running={w.running} onRun={w.onTryCase} initialArgs={w.customArgs}/> : <p>This guided game runs its full test set. Open the coding task to design your own inputs.</p>}{row && <section className="coach-experiment-result"><span>Last experiment</span><code>solve({w.customArgs?.map(show).join(', ')})</code>{row.error ? <p>{row.error}</p> : <><h4>Returned {show(row.actual)}</h4><button className="coach-text-action" onClick={() => cc.setDeskTab('trace')}>Follow this run<ArrowRight size={14}/></button></>}</section>}</div>;
}

export function valueChanges(before: TraceFrame | undefined, after: TraceFrame | undefined) {
  if (!before || !after) return [];
  return [...new Set([...Object.keys(before.locals), ...Object.keys(after.locals)])].filter(name => show(before.locals[name]) !== show(after.locals[name])).map(name => ({ name, before: before.locals[name], after: after.locals[name] }));
}
export function ExecutionCoach({ workspace: w }: { workspace: CCWorkspace }) {
  const cc = useCC(), selected = Math.min(cc.caseIndex, w.exercise.cases.length - 1);
  const actual = w.result?.results[w.mode === 'custom' ? 0 : selected];
  const frames = (actual?.trace ?? []).filter(frame => Object.keys(frame.locals).length || frame.event !== 'line');
  const [step, setStep] = useState(0), [playing, setPlaying] = useState(false);
  useEffect(() => { setStep(0); setPlaying(false); }, [selected, w.result]);
  useEffect(() => { if (!playing || step >= frames.length - 1) { setPlaying(false); return; } const timer = window.setTimeout(() => setStep(old => old + 1), 850); return () => window.clearTimeout(timer); }, [playing, step, frames.length]);
  const current = frames[Math.min(step, Math.max(0, frames.length - 1))], previous = step > 0 ? frames[step - 1] : undefined, changed = valueChanges(previous, current);
  if (w.language === 'java') return <section className="coach-diagnosis"><Code size={24}/><h3>Use Java’s test evidence.</h3><p>Variable replay is available for Python. Java shows the actual compiler message and returned result.</p><button className="coach-primary" onClick={() => cc.setDeskTab('clue')}>Inspect this run<ArrowRight size={16}/></button></section>;
  if (!current) return <section className="coach-diagnosis"><h3>{actual?.error ? 'Fix the syntax first.' : 'Run a first version.'}</h3><p>{actual?.error ? 'Python needs to read the code before it can record the steps.' : 'The walkthrough uses your actual inputs and variable values.'}</p><button className="coach-primary" disabled={w.running} onClick={actual?.error ? () => cc.setDeskTab('clue') : w.onRun}>{actual?.error ? 'Help me fix this' : 'Run my code'}<ArrowRight size={16}/></button></section>;
  return <div className="execution-coach"><span className="coach-eyebrow">Actual execution</span><h3>{current.event === 'return' ? 'The function returned.' : current.event === 'exception' ? 'The run stopped here.' : `Next: line ${current.line}`}</h3>{w.mode === 'suite' && <label className="coach-select">Input to follow<select value={selected} onChange={event => cc.setCaseIndex(Number(event.target.value))}>{w.exercise.cases.map((entry, i) => <option value={i} key={entry.label}>{entry.label}</option>)}</select></label>}<code className="coach-function-call">solve({(w.mode==='custom'?w.customArgs??[]:w.exercise.cases[selected].args).map(show).join(', ')})</code><pre className="coach-active-instruction"><span>{current.line}</span>{w.source.split('\n')[current.line - 1]}</pre><div className="coach-step-controls"><button aria-label="Previous C.C. step" disabled={step === 0} onClick={() => { setStep(old => old - 1); setPlaying(false); }}>Back</button><button aria-label={playing ? 'Pause C.C. walkthrough' : 'Play C.C. walkthrough'} onClick={() => { if (step >= frames.length - 1) setStep(0); setPlaying(old => !old); }}>{playing ? <Pause size={18}/> : <Play size={18} weight="fill"/>}</button><button aria-label="Next C.C. step" disabled={step >= frames.length - 1} onClick={() => { setStep(old => old + 1); setPlaying(false); }}>Next<ArrowRight size={14}/></button><span>{step + 1}/{frames.length}</span></div><input aria-label="C.C. execution timeline" type="range" min={0} max={frames.length - 1} value={step} onChange={event => { setStep(Number(event.target.value)); setPlaying(false); }}/>{current.event === 'return' && <div className="coach-return"><span>Returned</span><strong>{show(current.returned)}</strong></div>}{step===0&&<section className="coach-changes"><h4>Start with these inputs</h4>{Object.entries(current.locals).slice(0,4).map(([name,value])=><div key={name}><code>{name}</code><strong>{show(value)}</strong></div>)}</section>}{changed.length ? <section className="coach-changes"><h4>After line {previous?.line}</h4>{changed.map(change => <div key={change.name}><code>{change.name}</code><span>{show(change.before)}<ArrowRight size={14}/><strong>{show(change.after)}</strong></span></div>)}</section> : <p className="coach-step-note">{step === 0 ? 'These are the values before the first instruction runs.' : current.event === 'return' ? 'Returning sends this value back and ends the function call.' : 'No tracked value changed in the previous step.'}</p>}<details className="coach-details"><summary>All values at this step</summary><dl className="coach-all-values">{Object.entries(current.locals).map(([name, value]) => <div key={name}><dt>{name}</dt><dd>{show(value)}</dd></div>)}</dl></details>{current.exception && <p className="test-input-error">{current.exception}</p>}{(actual?.trace?.length??0)>=180&&frames[frames.length-1]?.event!=='return'&&<p className="coach-step-note">The recorder kept the first 180 events. The final return was {show(actual?.actual)}. Choose a smaller input for a complete walkthrough.</p>}<button className="coach-text-action" onClick={() => w.onFocusLine?.(current.line)}>Open this line in my editor<ArrowRight size={14}/></button></div>;
}
