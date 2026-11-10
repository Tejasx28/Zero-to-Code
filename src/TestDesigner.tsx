import { useEffect, useState } from 'react';
import { ArrowRight, Play, Shuffle } from '@phosphor-icons/react';
import { useCC } from './CCGuide';
import type { Exercise } from './curriculum';
import { parseCustomInput } from './studioHelpers';

export function buildTest(kind: Exercise['kind'], first: string, second: string): ReturnType<typeof parseCustomInput> {
  const value = first.trim();
  if ((kind === 'single' || kind === 'pair') && !/^-?\d+$/.test(value)) return {error:'Enter a whole number for the first input.'};
  if ((kind === 'pair' || kind === 'target') && !/^-?\d+$/.test(second.trim())) return {error:kind==='target'?'Enter a whole number for the target.':'Enter a whole number for the second input.'};
  const array = value.startsWith('[') ? value : `[${value}]`;
  const json = kind === 'single' ? `[${value}]` : kind === 'pair' ? `[${value},${second.trim()}]` : kind === 'array' ? `[${array}]` : `[${array},${second.trim()}]`;
  const parsed = parseCustomInput(json, kind);
  return parsed.error ? {error:kind==='array'||kind==='target'?'Use up to 60 whole numbers separated by commas. Keep each number between −1,000,000 and 1,000,000.':'Keep each whole number between −1,000,000 and 1,000,000.'} : parsed;
}
export function TestDesigner({ exercise, running, onRun, initialArgs, suggestions = true }: { exercise: Exercise; running: boolean; onRun: (args: (number | number[])[]) => void; initialArgs?: (number | number[])[] | null; suggestions?: boolean }) {
  const cc = useCC();
  const secondName=['quest-dock','quest-budget-left'].includes(exercise.id)?'Capacity':exercise.id==='quest-low-chain'?'Limit':'Target';
  const [dealt, setDealt] = useState(0);
  const [first, setFirst] = useState(''), [second, setSecond] = useState(''), [error, setError] = useState('');
  const argsKey=JSON.stringify(initialArgs??null);
  useEffect(() => { const args = initialArgs ?? exercise.cases[0].args; setFirst(Array.isArray(args[0]) ? args[0].join(', ') : String(args[0])); setSecond(args[1] !== undefined ? String(args[1]) : ''); setError(''); }, [exercise.id,argsKey]);
  const parsed = buildTest(exercise.kind, first, second);
  function run(args?: (number | number[])[]) { const input = args ? { args } : parsed; if ('error' in input && input.error) { setError(input.error.replace('the target',`the ${secondName.toLowerCase()}`)); return; } setError(''); if (input.args) onRun(input.args); }
  return <section className="test-designer"><p>Choose an input that could reveal a bug.</p>{suggestions&&<button className="cc-deal-test" disabled={running} onClick={() => { const test = exercise.cases[Math.floor(Math.random() * exercise.cases.length)]; setFirst(Array.isArray(test.args[0]) ? test.args[0].join(', ') : String(test.args[0])); setSecond(test.args[1] !== undefined ? String(test.args[1]) : ''); setError(''); setDealt(old => old + 1); cc.reactTo('challenge', `My pick: ${test.label.toLowerCase()}. Think through your code, then try the input.`); }}><Shuffle size={16}/>C.C., deal me a test</button>}<div className="test-presets" hidden={!suggestions} aria-label="Test ideas">{exercise.cases.slice(0, 5).map(test => <button key={test.label} disabled={running} onClick={() => { setFirst(Array.isArray(test.args[0]) ? test.args[0].join(', ') : String(test.args[0])); setSecond(test.args[1] !== undefined ? String(test.args[1]) : ''); setError(''); }}>{test.label}</button>)}</div><form onSubmit={event => { event.preventDefault(); run(); }}><label>{exercise.kind === 'array' || exercise.kind === 'target' ? 'Array values' : exercise.kind === 'pair' ? 'First number' : 'Input number'}<input aria-label={exercise.kind === 'array' || exercise.kind === 'target' ? 'Test array values' : 'Test first number'} value={first} onChange={event => { setFirst(event.target.value); setError(''); }} placeholder={exercise.kind === 'array' || exercise.kind === 'target' ? '4, -2, 7' : '4'} spellCheck={false}/></label>{(exercise.kind === 'pair' || exercise.kind === 'target') && <label>{exercise.kind === 'target' ? secondName : 'Second number'}<input aria-label={exercise.kind === 'target' ? `Test ${secondName.toLowerCase()}` : 'Test second number'} value={second} onChange={event => { setSecond(event.target.value); setError(''); }} spellCheck={false}/></label>}<div key={dealt} className={`test-call ${dealt ? 'test-card-dealt' : ''}`}><span>Calls your function</span><code>{parsed.args ? `solve(${parsed.args.map(value => JSON.stringify(value)).join(', ')})` : 'Finish the inputs above'}</code></div>{error && <p className="test-input-error" role="alert">{error}</p>}<button className="coach-primary" disabled={running} type="submit"><Play size={16} weight="fill"/>{running ? 'Running…' : 'Run this input'}<ArrowRight size={16}/></button><small>This is an experiment. It does not change your score.</small></form></section>;
}
