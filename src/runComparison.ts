import { reviewGameRun } from './gameMechanics';
import type { Exercise } from './curriculum';
import type { RunResult } from './runtime';
import { matches } from './runtime';
export interface RunSnapshot { source: string; result: RunResult }
export interface RunComparison { before: RunSnapshot; after: RunSnapshot; oldScore: number; newScore: number; total: number }
export function compareRuns(before: RunSnapshot | null, after: RunSnapshot, exercise: Exercise): RunComparison | null {
  if (!before || !reviewGameRun(before.result,exercise.cases).countsAsAttempt || !reviewGameRun(after.result,exercise.cases).countsAsAttempt) return null;
  const score = (result: RunResult) => result.results.filter((row, index) => !row.error && matches(row.actual, exercise.cases[index]?.expected)).length;
  return { before, after, oldScore: score(before.result), newScore: score(after.result), total: exercise.cases.length };
}
export function changedSource(before: string, after: string) {
  const a = before.split('\n'), b = after.split('\n'); let start = 0, endA = a.length, endB = b.length;
  while (start < endA && start < endB && a[start] === b[start]) start++;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) { endA--; endB--; }
  return { start: start + 1, before: a.slice(start, endA), after: b.slice(start, endB) };
}
