import type { Exercise } from './curriculum';
import type { RunResult } from './runtime';
import { matches } from './runtime';

const short = (value: unknown) => { const text = JSON.stringify(value) ?? 'no value'; return text.length > 65 ? `${text.slice(0, 62)}…` : text; };
export function runMessage(result: RunResult, exercise: Exercise): string {
  if (!result.attempted) return 'The code runner stopped. Your draft is saved. Try running it again.';
  if (result.error) return 'The code could not finish. Open the error message and check the reported line.';
  const failed = result.results.findIndex((row, index) => row.error || !matches(row.actual, exercise.cases[index]?.expected));
  if (failed === -1 && result.results.length === exercise.cases.length) return `All ${exercise.cases.length} tests passed. Try a new input, check a different case.`;
  const row = result.results[failed], test = exercise.cases[failed];
  if (!row || !test) return 'Some tests did not finish. Open the results and check the first error.';
  if (row.error && /IndentationError|TabError/.test(row.error)) return `Python stopped on spacing${row.line ? ` at line ${row.line}` : ''}. I can check a spacing preview beside your code.`;
  if (row.error) return `The test “${test.label}” stopped${row.line ? ` at line ${row.line}` : ''}. Open the error and check that line.`;
  return `For ${short(test.args)}, expected ${short(test.expected)}. Your code returned ${short(row.actual)}. Let’s follow that input.`;
}
