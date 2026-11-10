import { useEffect, useRef, useState } from 'react';
import { ArrowRight, MagnifyingGlass, Stop } from '@phosphor-icons/react';
import type { CCWorkspace } from './CCGuide';
import { useCC } from './CCGuide';
import { runCode } from './runtime';
import type { CodeRun } from './runtime';
import { smallerFailure, smallerInputs, supportsShrink } from './counterexample';

export function CounterexampleFinder({ workspace: w, caseIndex }: { workspace: CCWorkspace; caseIndex: number }) {
  const cc = useCC(), handle = useRef<CodeRun | null>(null);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [found, setFound] = useState<ReturnType<typeof smallerFailure>>(null);
  useEffect(() => { setFound(null); setMessage(''); setBusy(false); return () => { handle.current?.cancel(); handle.current = null; }; }, [w.source, w.key, caseIndex]);
  const test = w.exercise.cases[caseIndex];
  if (!test || !supportsShrink(w.exercise) || !Array.isArray(test.args[0]) || test.args[0].length < 2) return null;
  async function find() {
    if (busy || w.running || !test) return;
    const inputs = smallerInputs(test.args); setBusy(true); setFound(null); setMessage('Trying shorter versions of this input…');
    const active = runCode(w.language, w.exercise, w.source, setMessage, { cases: inputs, trace: false }); handle.current = active;
    const outcome = await active.result; if (handle.current !== active) return;
    handle.current = null; setBusy(false);
    const result = smallerFailure(w.exercise, test.args, inputs, outcome); setFound(result);
    setMessage(result ? `Fewer values. This input still fails. Checked ${inputs.length} related inputs.` : outcome.error ?? 'No smaller failure appeared in these inputs. Try the walkthrough of the original case.');
    if (result) cc.reactTo('explore', 'We found a smaller failing input. Compare this result with the task’s rule.');
  }
  return <section className="counterexample-finder"><p>Too many values to follow?</p>{busy ? <button className="coach-text-action" onClick={() => { handle.current?.cancel(); handle.current = null; setBusy(false); setMessage('Stopped. Your source is saved.'); }}><Stop size={16}/>Stop search</button> : <button className="coach-text-action" disabled={w.running} onClick={() => { void find(); }}><MagnifyingGlass size={16}/>Find a smaller failing input</button>}{message && <p role="status">{message}</p>}{found && <div className="counterexample-result"><code>solve({found.args.map(value => JSON.stringify(value)).join(', ')})</code><dl><div><dt>Expected</dt><dd>{JSON.stringify(found.expected)}</dd></div><div><dt>Your return</dt><dd>{found.row.error ? 'Error' : JSON.stringify(found.row.actual)}</dd></div></dl><small>This is a smaller failure among the inputs tested. Your code stays unchanged.</small>{w.onTryCase && <button className="coach-primary" onClick={() => { w.onTryCase?.(found.args); cc.setDeskTab('test'); }}>Run this input in my workspace<ArrowRight size={16}/></button>}</div>}</section>;
}
