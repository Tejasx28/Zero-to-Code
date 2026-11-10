import type { Exercise, Language } from './curriculum';
import type { QuestProgress } from './questState';

export type DebugPhase = 'repair' | 'rebuild';
export interface DebugCase {
  id: string; title: string; topic: string; summary: string;
  exercise: Exercise; freshCases: Exercise['cases'];
  broken: Record<Language, string>; hints: string[];
}
const pair = (label: string, values: number[], expected: number | number[]): Exercise['cases'][number] => ({ label, args: [values], expected });
const target = (label: string, values: number[], wanted: number, expected: number): Exercise['cases'][number] => ({ label, args: [values, wanted], expected });
const java = (body: string, type = 'int', args = 'int[] values') => `public class Solution {\n  public static ${type} solve(${args}) {\n${body}\n  }\n}\n`;
const blank = { python: 'def solve(values):\n    # Write your solution\n    pass\n', java: java('    // Write your solution\n    return 0;') };

export const DEBUG_CASES: DebugCase[] = [
  {
    id: 'early-return', title: 'The total stops too soon', topic: 'Loops · return', summary: 'Some values never reach the total.',
    exercise: {
      id: 'debug-early-return', unit: 'control', title: 'Add every value', kind: 'array',
      brief: 'Return the sum of every value. Return 0 for an empty array.', contract: 'solve(values) → whole-number total',
      starter: blank,
      example: { python: 'def solve(values):\n    total = 0\n    for value in values:\n        total += value\n    return total\n', java: java('    int total = 0;\n    for (int value : values) {\n      total += value;\n    }\n    return total;') },
      hint: 'Check when return ends the function.',
      cases: [pair('Several values', [4, 7, -2], 9), pair('Empty array', [], 0), pair('One value', [6], 6), pair('All negative', [-4, -3], -7), pair('Zero first', [0, 8], 8), pair('Cancel out', [5, -5, 2], 2)],
    },
    freshCases: [pair('New mix', [3, -8, 12, 2], 9), pair('No values', [], 0), pair('One negative', [-9], -9), pair('Repeated values', [4, 4, 4], 12), pair('Only zeroes', [0, 0], 0), pair('Last value matters', [2, -2, 11], 11)],
    broken: { python: 'def solve(values):\n    total = 0\n    for value in values:\n        total += value\n        return total\n    return total\n', java: java('    int total = 0;\n    for (int value : values) {\n      total += value;\n      return total;\n    }\n    return total;') },
    hints: ['Follow the second value. Does the function reach it?', 'return ends the whole function, even inside a loop.', 'The final total needs every visit. Check the indentation or braces around return.'],
  },
  {
    id: 'last-slot', title: 'The last match goes missing', topic: 'Arrays · boundaries', summary: 'A match at the end is never counted.',
    exercise: {
      id: 'debug-last-slot', unit: 'arrays', title: 'Count every match', kind: 'target',
      brief: 'Return how many values equal target. Count repeated matches too.', contract: 'solve(values, target) → match count',
      starter: { python: 'def solve(values, target):\n    # Write your solution\n    pass\n', java: java('    // Write your solution\n    return 0;', 'int', 'int[] values, int target') },
      example: { python: 'def solve(values, target):\n    count = 0\n    for value in values:\n        if value == target:\n            count += 1\n    return count\n', java: java('    int count = 0;\n    for (int value : values) {\n      if (value == target) count++;\n    }\n    return count;', 'int', 'int[] values, int target') },
      hint: 'Check which positions the loop visits.',
      cases: [target('Match at the end', [2, 4, 4], 4, 2), target('One match', [7], 7, 1), target('Empty array', [], 3, 0), target('No match', [1, 2], 8, 0), target('Every value matches', [3, 3, 3], 3, 3), target('Negative target', [-2, 4, -2], -2, 2)],
    },
    freshCases: [target('New positions', [5, 1, 5, 5], 5, 3), target('No values', [], 0, 0), target('Only the last one', [3, 8, 9], 9, 1), target('One different value', [-7], 2, 0), target('Zero matches', [0, 1, 0], 0, 2), target('Repeated negatives', [-1, -1, -1, 2], -1, 3)],
    broken: { python: 'def solve(values, target):\n    count = 0\n    for i in range(len(values) - 1):\n        if values[i] == target:\n            count += 1\n    return count\n', java: java('    int count = 0;\n    for (int i = 0; i < values.length - 1; i++) {\n      if (values[i] == target) count++;\n    }\n    return count;', 'int', 'int[] values, int target') },
    hints: ['Try an array with one matching value. Which position gets visited?', 'Python range stops before its upper bound. Java checks the condition before each visit.', 'Include every valid position, from 0 through length - 1.'],
  },
  {
    id: 'negative-maximum', title: 'A maximum that was never there', topic: 'Arrays · starting values', summary: 'Negative inputs expose a bad starting value.',
    exercise: {
      id: 'debug-negative-maximum', unit: 'arrays', title: 'Find the largest value', kind: 'array',
      brief: 'Return the largest value in the array. Return 0 only when the array is empty.', contract: 'solve(values) → largest value; empty → 0', starter: blank,
      example: { python: 'def solve(values):\n    if len(values) == 0:\n        return 0\n    best = values[0]\n    for value in values:\n        if value > best:\n            best = value\n    return best\n', java: java('    if (values.length == 0) return 0;\n    int best = values[0];\n    for (int value : values) {\n      if (value > best) best = value;\n    }\n    return best;') },
      hint: 'The answer must come from the input unless it is empty.',
      cases: [pair('All negative', [-8, -3, -6], -3), pair('Empty array', [], 0), pair('One negative', [-4], -4), pair('Mixed signs', [-2, 5, 1], 5), pair('Largest first', [9, 2, 3], 9), pair('Repeated largest', [-1, -1, -5], -1)],
    },
    freshCases: [pair('New negatives', [-10, -2, -7], -2), pair('No values', [], 0), pair('One value', [-11], -11), pair('Zero is present', [-4, 0, -8], 0), pair('Largest last', [1, 4, 12], 12), pair('Equal values', [3, 3], 3)],
    broken: { python: 'def solve(values):\n    best = 0\n    for value in values:\n        if value > best:\n            best = value\n    return best\n', java: java('    int best = 0;\n    for (int value : values) {\n      if (value > best) best = value;\n    }\n    return best;') },
    hints: ['For [-8, -3, -6], is 0 one of the available answers?', 'Check where best gets its starting value.', 'Handle empty input first. For a nonempty input, start with a value that is actually in the array.'],
  },
  {
    id: 'lost-first', title: 'The first value disappears', topic: 'Array updates', summary: 'Shifting the row overwrites a value you still need.',
    exercise: {
      id: 'debug-lost-first', unit: 'arrays', title: 'Rotate left once', kind: 'array',
      brief: 'Move the first value to the end. Shift every other value one place left. An empty array stays empty.', contract: 'solve(values) → rotated array',
      starter: { python: blank.python, java: java('    // Write your solution\n    return values;', 'int[]') },
      example: { python: 'def solve(values):\n    if len(values) == 0:\n        return values\n    first = values[0]\n    for i in range(len(values) - 1):\n        values[i] = values[i + 1]\n    values[len(values) - 1] = first\n    return values\n', java: java('    if (values.length == 0) return values;\n    int first = values[0];\n    for (int i = 0; i < values.length - 1; i++) {\n      values[i] = values[i + 1];\n    }\n    values[values.length - 1] = first;\n    return values;', 'int[]') },
      hint: 'Save any value you will need after overwriting its position.',
      cases: [pair('Three distinct values', [4, 8, 2], [8, 2, 4]), pair('Empty array', [], []), pair('One value', [5], [5]), pair('Two values', [1, 9], [9, 1]), pair('Repeated values', [3, 3, 2], [3, 2, 3]), pair('Negative values', [-4, 2, 0], [2, 0, -4])],
    },
    freshCases: [pair('New row', [7, 1, 9, 3], [1, 9, 3, 7]), pair('No values', [], []), pair('One negative', [-6], [-6]), pair('Two zeroes', [0, 0], [0, 0]), pair('Different signs', [-2, -1, 4], [-1, 4, -2]), pair('Repeated start', [8, 5, 8], [5, 8, 8])],
    broken: { python: 'def solve(values):\n    for i in range(len(values) - 1):\n        values[i] = values[i + 1]\n    if len(values) > 0:\n        values[len(values) - 1] = values[0]\n    return values\n', java: java('    for (int i = 0; i < values.length - 1; i++) {\n      values[i] = values[i + 1];\n    }\n    if (values.length > 0) {\n      values[values.length - 1] = values[0];\n    }\n    return values;', 'int[]') },
    hints: ['Follow the original first value. What happens after the first assignment?', 'Reading values[0] after shifting gives you its new value.', 'Keep the original first value before shifting. Use that saved value at the end.'],
  },
];

export const debugStorageId = (id: string, phase: DebugPhase) => `debug:${id}:${phase}`;
export const debugKey = (id: string, phase: DebugPhase, language: Language) => `${language}:${debugStorageId(id, phase)}`;
export function debugExercise(item: DebugCase, phase: DebugPhase): Exercise {
  return { ...item.exercise, starter: phase === 'repair' ? item.broken : item.exercise.starter, cases: phase === 'repair' ? item.exercise.cases : item.freshCases, independent: phase === 'rebuild' };
}
export function canRebuild(progress: QuestProgress, id: string, language: Language) { return progress.code[debugKey(id, 'repair', language)]?.passed === true; }
