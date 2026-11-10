import type { Language } from './curriculum';
import type { QuestProgress } from './questState';

export type CodeOperationMode = 'complete' | 'debug' | 'arrange' | 'control' | 'build';
export type CodeChapter = 'basics' | 'control' | 'arrays';
export interface CodeOperation {
  id: string;
  title: string;
  chapter: CodeChapter;
  concept: string;
  exerciseId: string;
  summary: string;
  mode: CodeOperationMode;
  ccIntro: string;
  brief: string;
  keywords: string[];
  objective: string;
  nudge: string[];
  initialSource: Record<Language, string>;
  codeLines?: Record<Language, string[]>;
  gaps?: Record<Language, { label: string; before: string; after: string; placeholder: string; explanation: string }[]>;
}

export const CODE_OPERATIONS: CodeOperation[] = [
  {
    id: 'contract', title: 'The First Contract', chapter: 'basics', concept: 'Functions, inputs & return', exerciseId: 'add', mode: 'complete',
    summary: 'Complete the function that turns two inputs into one returned result.',
    ccIntro: 'A contract needs an answer, not an announcement. Let the function give its result back.',
    brief: 'Two squads report their supply counts. Complete a function that returns the combined count for any two inputs. The tests will call your function with different values.',
    keywords: ['def', 'return', 'int', 'public static'], objective: 'Write the missing code, then pass every real input case.',
    nudge: ['What information arrives as inputs, and what must leave as the result?', 'A named variable can hold a calculation. Printing it and returning it are different actions.', 'Use both inputs in the calculation, then return the computed value. Keep the function signature intact.'],
    initialSource: { python: 'def solve(a, b):\n    total = ____\n    ____ total\n', java: 'public class Solution {\n  public static int solve(int a, int b) {\n    int total = ____;\n    ____ total;\n  }\n}\n' },
    gaps: {
      python: [{ label: 'The calculation', before: 'def solve(a, b):\n    total = ', after: '\n', placeholder: 'use both inputs', explanation: 'a and b are the values passed into the function.' }, { label: 'Give the result back', before: '    ', after: ' total\n', placeholder: 'a Python keyword', explanation: 'This keyword sends the result to the caller.' }],
      java: [{ label: 'The calculation', before: 'public class Solution {\n  public static int solve(int a, int b) {\n    int total = ', after: ';\n', placeholder: 'use both inputs', explanation: 'int declares a whole-number value.' }, { label: 'Give the result back', before: '    ', after: ' total;\n  }\n}\n', placeholder: 'a Java keyword', explanation: 'This keyword sends the result to the code that called solve.' }],
    },
  },
  {
    id: 'gate', title: 'The Broken Gate', chapter: 'control', concept: 'Conditions & return paths', exerciseId: 'larger', mode: 'debug',
    summary: 'Find why the security gate returns the smaller value, then repair the code.',
    ccIntro: 'The program runs. That does not mean it keeps its promise. Find the decision that betrays the intent.',
    brief: 'The gate should choose the larger of two supply packs, but its conditional branches disagree with that promise. Edit the actual function. Check left-larger, right-larger, equal, and negative inputs.',
    keywords: ['if', 'else', '>', 'return'], objective: 'Repair the logic and pass the varied test suite.',
    nudge: ['Read the condition aloud. Which input is larger when the condition is true?', 'Follow just one example through the branch. Which value does that branch return?', 'The chosen branch must return the value proven larger; the other branch must handle the remaining case.'],
    initialSource: { python: 'def solve(a, b):\n    if a > b:\n        return b\n    return a\n', java: 'public class Solution {\n  public static int solve(int a, int b) {\n    if (a > b) {\n      return b;\n    }\n    return a;\n  }\n}\n' },
  },
  {
    id: 'relay', title: 'Relay Sequence', chapter: 'control', concept: 'Loops & accumulators', exerciseId: 'sum-to', mode: 'arrange',
    summary: 'Arrange actual code into a working loop, then run it on more than one input.',
    ccIntro: 'A good order is a hypothesis. Execution decides whether the whole sequence works.',
    brief: 'Build a function that adds every checkpoint number from 1 through n. Reorder the real code lines. Indentation and block structure travel with each line; your assembled function is compiled or executed to check it.',
    keywords: ['for', 'range', '+=', 'return'], objective: 'Assemble valid source and pass normal and boundary inputs.',
    nudge: ['A total needs a starting value before the loop can update it.', 'The repeating addition belongs inside the loop. The final result should be returned after the loop finishes.', 'Read your assembled source from top to bottom: initialize, repeat the addition, return the accumulated result.'],
    initialSource: { python: '', java: '' },
    codeLines: {
      python: ['    return total', '    for i in range(1, n + 1):', 'def solve(n):', '        total += i', '    total = 0'],
      java: ['    return total;', '    for (int i = 1; i <= n; i++) {', 'public class Solution {', '      total += i;', '  public static int solve(int n) {', '    }', '    int total = 0;', '  }', '}'],
    },
  },
  {
    id: 'knightmare', title: 'Knightmare Navigation', chapter: 'arrays', concept: 'Read commands with a loop', exerciseId: 'trace-route', mode: 'control',
    summary: 'Edit the controller function. Your returned coordinates move the unit.',
    ccIntro: 'Do not steer it with a button. Teach the controller how each command changes its position.',
    brief: 'The controller receives an array of direction codes: 1 North, 2 East, 3 South, 4 West. Start at [0, 0]. Return the final [x, y] position. North decreases y; South increases y. The visual unit uses your function’s actual returned coordinates.',
    keywords: ['for', 'if', 'elif', 'int[]'], objective: 'Write a general controller that works for every command sequence.',
    nudge: ['What two values describe a position, and which command changes each one?', 'Visit every command. Horizontal commands change x; vertical commands change y.', 'Start x and y at zero, update one coordinate per command, and return both coordinates after the loop.'],
    initialSource: { python: 'def solve(commands):\n    x = 0\n    y = 0\n    # Read each command and update x or y.\n    return [x, y]\n', java: 'public class Solution {\n  public static int[] solve(int[] commands) {\n    int x = 0;\n    int y = 0;\n    // Read each command and update x or y.\n    return new int[]{x, y};\n  }\n}\n' },
  },
  {
    id: 'memory', title: 'The Memory Sweep', chapter: 'arrays', concept: 'Array traversal & accumulation', exerciseId: 'sum-array', mode: 'build',
    summary: 'Write the traversal that reads every slot and returns a complete total.',
    ccIntro: 'A row of values is useful only when you can visit it deliberately. Make no assumptions about its length.',
    brief: 'A memory bank holds the cargo values. Write a function that visits the array and returns the total. Empty banks, repeated values, and negative values are legitimate inputs; no value should be skipped.',
    keywords: ['for', 'len', '.length', '+='], objective: 'Implement the traversal yourself and pass every input case.',
    nudge: ['What should the answer be before any values have been visited?', 'Keep a running total and add each value. Think about where return belongs relative to the loop.', 'An empty input should naturally leave the starting total unchanged. Return after visiting the whole array.'],
    initialSource: { python: 'def solve(values):\n    # Start a total, visit each value, return the result.\n    pass\n', java: 'public class Solution {\n  public static int solve(int[] values) {\n    // Start a total, visit each value, return the result.\n    return 0;\n  }\n}\n' },
  },
];

export const KEYWORD_HELP: Record<string, string> = {
  def: 'Python keyword that defines a reusable function.',
  return: 'Send a value back to the code that called the function. It also ends that function call.',
  int: 'A Java whole-number type. int total = 0 creates a variable for a whole number.',
  'public static': 'In these Java exercises, this makes solve callable by the tests without constructing an object.',
  if: 'Run the following block only when its condition is true.',
  else: 'The alternative branch when the preceding condition is false.',
  '>': 'A comparison: true when the left value is greater than the right value.',
  for: 'Repeat a block once for each value or position in a sequence.',
  range: 'Python creates a sequence of positions or numbers. The upper bound is excluded.',
  '+=': 'Add to the current value: total += value means total = total + value.',
  elif: 'Python’s next condition to try when the earlier condition was false. Java uses else if.',
  'else if': 'Java’s next condition to try when the preceding if condition was false.',
  'int[]': 'A Java array of whole numbers. Each position is read with an index starting at zero.',
  len: 'Python function that gives the number of items, such as len(values).',
  '.length': 'Java array property giving the number of items, such as values.length.',
};

export function assembleGaps(operation: CodeOperation, language: Language, values: string[]): string {
  return (operation.gaps?.[language] ?? []).map((gap, index) => gap.before + (values[index] ?? '') + gap.after).join('');
}

export function operationDraftKey(id: string, language: Language): string { return `v04:operation:${id}:${language}`; }
export function operationCompleteKey(id: string, language: Language): string { return `v04:operation-complete:${id}:${language}`; }
export interface OperationEvidence { passed: boolean; attempts: number; firstScore: number; lastScore: number; total: number; completedAt?: number }
export function readOperationEvidence(raw: string | undefined): OperationEvidence | null {
  try {
    const record = JSON.parse(raw ?? '') as OperationEvidence;
    if (record && typeof record.passed === 'boolean' && Number.isInteger(record.attempts) && record.attempts > 0 && Number.isInteger(record.total) && record.total > 0 && Number.isInteger(record.firstScore) && record.firstScore >= 0 && record.firstScore <= record.total && Number.isInteger(record.lastScore) && record.lastScore >= 0 && record.lastScore <= record.total && (!record.passed || (typeof record.completedAt === 'number' && Number.isFinite(record.completedAt)))) return record;
  } catch { /* A malformed optional game record must not break the saved learning journey. */ }
  return null;
}
export function operationGameDone(progress: Pick<QuestProgress, 'drafts'>, id: string, language: Language): boolean {
  return readOperationEvidence(progress.drafts[operationCompleteKey(id, language)])?.passed === true;
}
export function readLineOrder(raw: string | undefined, length: number): number[] {
  try {
    const values: unknown = JSON.parse(raw ?? '');
    if (Array.isArray(values) && values.length === length && new Set(values).size === length && values.every(value => Number.isInteger(value) && value >= 0 && value < length)) return values;
  } catch { /* A corrupt row order must never remove source lines. */ }
  return Array.from({ length }, (_, index) => index);
}
export function sourceFromOrder(lines: string[], order: number[]): string { return order.map(index => lines[index]).join('\n') + '\n'; }
export function reorderLine(order: number[], from: number, to: number): number[] {
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < 0 || from >= order.length || to >= order.length) return order;
  const next = [...order], [line] = next.splice(from, 1); next.splice(to, 0, line); return next;
}
