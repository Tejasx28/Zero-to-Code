import { useMemo } from 'react';
import { ArrowLeft, ArrowRight, Bug, Check, LockKeyhole } from 'lucide-react';
import { CodeLab } from './CodeLab';
import type { QuestUpdate } from './CodeLab';
import type { QuestProgress } from './questState';
import { canRebuild, DEBUG_CASES, debugExercise, debugKey, debugStorageId } from './debugContent';
import type { DebugPhase } from './debugContent';
import './debugLab.css';

export function DebugLab({ progress: p, update, id, phase = 'repair', onOpen, onConcept }: { progress: QuestProgress; update: QuestUpdate; id?: string; phase?: DebugPhase; onOpen: (id?: string, phase?: DebugPhase) => void; onConcept: (id: string) => void }) {
  const item = DEBUG_CASES.find(entry => entry.id === id);
  const session = useMemo(() => item ? {
    exercise: debugExercise(item, phase), storageId: debugStorageId(item.id, phase),
    eyebrow: phase === 'repair' ? 'DEBUG LAB / FIX IT' : 'DEBUG LAB / WRITE IT AGAIN',
    heading: item.title, hints: item.hints,
  } : undefined, [item, phase]);
  if (!item || !session) return <section className="debug-board"><header className="debug-board-heading"><div><span className="section-kicker">DEBUG LAB</span><h1>Find the bug.<br/><em>Make it work.</em></h1><p>Fix a broken program. Then write it again from a starter.</p></div></header><div className="debug-card-grid">{DEBUG_CASES.map((entry, index) => {
    const repaired = canRebuild(p, entry.id, p.language), rebuilt = p.code[debugKey(entry.id, 'rebuild', p.language)]?.passed;
    return <button className="debug-card" key={entry.id} onClick={() => onOpen(entry.id)}><div><span>CASE {String(index + 1).padStart(2, '0')}</span>{rebuilt ? <Check size={20}/> : <Bug size={20}/>}</div><small>{entry.topic}</small><h2>{entry.title}</h2><p>{entry.summary}</p><footer><span>{rebuilt ? 'Fixed and rebuilt' : repaired ? 'Fixed · ready to rebuild' : '6 tests · find what breaks'}</span><ArrowRight size={17}/></footer></button>;
  })}</div><p className="debug-board-note">C.C. can help with the fix. Rebuilding starts fresh, with different tests and no solution hints.</p></section>;
  const ready = canRebuild(p, item.id, p.language);
  return <section className="debug-session"><div className="debug-wayfinding"><button onClick={() => onOpen()}><ArrowLeft size={15}/>All bugs</button><div aria-label="Debugging stages"><button aria-current={phase === 'repair' ? 'step' : undefined} onClick={() => onOpen(item.id, 'repair')}>{ready ? <Check size={14}/> : <span>1</span>}Fix it</button><ArrowRight size={13}/><button aria-current={phase === 'rebuild' ? 'step' : undefined} disabled={!ready} onClick={() => onOpen(item.id, 'rebuild')}>{ready ? <span>2</span> : <LockKeyhole size={13}/>}Write it again</button></div></div>{phase === 'rebuild' && !ready ? <div className="debug-locked"><h1>Fix this bug first.</h1><p>Fix it in {p.language==='python'?'Python':'Java'} to unlock a fresh starter.</p><button onClick={() => onOpen(item.id, 'repair')}>Open the broken program<ArrowRight size={15}/></button></div> : <><p className="debug-session-note">{phase === 'repair' ? 'Run the broken code first. Inspect one failing test, then change the code.' : 'Same task. Fresh starter and different tests. Write the solution yourself.'}</p><CodeLab key={`${item.id}:${phase}:${p.language}`} progress={p} update={update} exerciseId={item.exercise.id} onExercise={() => {}} onLearn={() => onConcept(item.id === 'early-return' ? 'loops' : item.id === 'lost-first' ? 'updates' : 'arrays')} session={session}/>{phase === 'repair' && ready && <button className="debug-rebuild-action" onClick={() => onOpen(item.id, 'rebuild')}>Now write it from a starter<ArrowRight size={17}/></button>}</>}</section>;
}
