import type { Exercise } from './curriculum';
import type { RunResult } from './runtime';
import { matches } from './runtime';

export function expectedReturn(id: string, args: (number | number[])[]): number | number[] | undefined {
  if (!Array.isArray(args[0])) return undefined;
  const a = args[0], target = typeof args[1] === 'number' ? args[1] : 0;
  switch (id) {
    case 'sum-array': case 'debug-early-return': return a.reduce((sum, value) => sum + value, 0);
    case 'max-scan': return a.length ? Math.max(...a) : -1;
    case 'debug-negative-maximum': return a.length ? Math.max(...a) : 0;
    case 'rotate-left': case 'debug-lost-first': return a.length ? [...a.slice(1), a[0]] : [];
    case 'practice-rotate-right': return a.length ? [a[a.length - 1], ...a.slice(0, -1)] : [];
    case 'practice-reverse-row': return [...a].reverse();
    case 'practice-count-evens': return a.filter(value => value % 2 === 0).length;
    case 'practice-sum-positive': return a.filter(value => value > 0).reduce((sum, value) => sum + value, 0);
    case 'practice-count-target': case 'debug-last-slot': return a.filter(value => value === target).length;
    case 'practice-first-positive': return a.findIndex(value => value > 0);
    case 'practice-last-match': return a.lastIndexOf(target);
    case 'practice-nondecreasing': return Number(a.every((value, i) => !i || value >= a[i - 1]));
    case 'practice-clamp-negatives': return a.map(value => Math.max(0, value));
    case 'practice-prefix-totals': { let total = 0; return a.map(value => total += value); }
    case 'practice-adjacent-deltas': return a.map((value, i) => i ? value - a[i - 1] : value);
    case 'practice-positive-streak': { let current = 0, best = 0; for (const value of a) { current = value > 0 ? current + 1 : 0; best = Math.max(best, current); } return best; }
    case 'trace-route': { let x = 0, y = 0; for (const value of a) { if (value === 1) y--; else if (value === 2) x++; else if (value === 3) y++; else if (value === 4) x--; } return [x, y]; }
    default: return undefined;
  }
}
export function supportsShrink(exercise: Exercise): boolean { return !exercise.independent && ['array', 'target'].includes(exercise.kind) && expectedReturn(exercise.id, exercise.cases[0].args) !== undefined; }
export function smallerInputs(args: (number | number[])[], limit = 24): (number | number[])[][] {
  if (!Array.isArray(args[0]) || !args[0].length) return [];
  const values = args[0], candidates: number[][] = [[], values.slice(0, Math.ceil(values.length / 2)), values.slice(Math.floor(values.length / 2))];
  for (const value of [...new Set(values)].slice(0, 10)) candidates.push([value]);
  for (let i = 0; i < values.length; i++) candidates.push(values.filter((_, index) => index !== i));
  for (let n = 2; n < values.length; n++) candidates.push(values.slice(0, n), values.slice(-n));
  const unique = new Map<string, number[]>();
  for (const values of candidates) if (values.length < (args[0] as number[]).length) unique.set(JSON.stringify(values), values);
  const short = [...unique.values()].sort((a, b) => a.length - b.length).slice(0, Math.max(0, limit - 1));
  return [...short, [...values]].map(values => [values, ...args.slice(1)]);
}
export function smallerFailure(exercise: Exercise, args: (number | number[])[], inputs: (number | number[])[][], outcome: RunResult) {
  if (!Array.isArray(args[0]) || outcome.error || !outcome.attempted) return null;
  const length = args[0].length;
  for (let i = 0; i < inputs.length; i++) {
    const expected = expectedReturn(exercise.id, inputs[i]), row = outcome.results[i], values = inputs[i][0];
    if (Array.isArray(values) && values.length < length && expected !== undefined && row && (row.error || !matches(row.actual, expected))) return { args: inputs[i], expected, row, tested: inputs.length };
  }
  return null;
}
