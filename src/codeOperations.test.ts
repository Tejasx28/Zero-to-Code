import { describe, expect, it } from 'vitest';
import { EXERCISES } from './curriculum';
import { assembleGaps, CODE_OPERATIONS, operationCompleteKey, operationDraftKey, operationGameDone, readLineOrder, readOperationEvidence, reorderLine, sourceFromOrder } from './codeOperations';

describe('coding operation safeguards', () => {
  it('links all five game modes to real varied coding exercises in the three beginner arcs', () => {
    expect(new Set(CODE_OPERATIONS.map(operation => operation.mode)).size).toBe(5);
    expect(new Set(CODE_OPERATIONS.map(operation => operation.chapter))).toEqual(new Set(['basics', 'control', 'arrays']));
    for (const operation of CODE_OPERATIONS) {
      const exercise = EXERCISES.find(item => item.id === operation.exerciseId);
      expect(exercise, operation.id).toBeDefined();
      expect(exercise!.cases.length).toBeGreaterThanOrEqual(4);
      expect(new Set(exercise!.cases.map(item => JSON.stringify(item.args))).size).toBe(exercise!.cases.length);
    }
  });
  it('composes both language scaffolds into complete executable source rather than a visual answer flag', () => {
    const operation = CODE_OPERATIONS.find(item => item.id === 'contract')!;
    expect(assembleGaps(operation, 'python', ['a + b', 'return'])).toBe('def solve(a, b):\n    total = a + b\n    return total\n');
    expect(assembleGaps(operation, 'java', ['a + b', 'return'])).toBe('public class Solution {\n  public static int solve(int a, int b) {\n    int total = a + b;\n    return total;\n  }\n}\n');
  });
  it('preserves repeated source lines and the original order when moving code', () => {
    const order = [0, 1, 2, 3];
    const next = reorderLine(order, 3, 1);
    expect(order).toEqual([0, 1, 2, 3]);
    expect(next).toEqual([0, 3, 1, 2]);
    expect(sourceFromOrder(['start', '}', '}', 'end'], next)).toBe('start\nend\n}\n}\n');
    expect(reorderLine(order, -1, 2)).toBe(order);
  });
  it('recovers every line when persisted order is truncated, duplicated, or out of bounds', () => {
    for (const raw of ['[1,1,2]', '[0,1]', '[0,1,7]', '[0,1,2.5]', '{"0":1}', 'broken']) expect(readLineOrder(raw, 3)).toEqual([0, 1, 2]);
    expect(readLineOrder('[2,0,1]', 3)).toEqual([2, 0, 1]);
  });
  it('keeps guided completion separate from source drafts and independent coding grades', () => {
    const sourceKey = operationDraftKey('memory', 'python');
    const completeKey = operationCompleteKey('memory', 'python');
    const drafts = { [sourceKey]: 'def solve(values):\n    return 0', [completeKey]: JSON.stringify({ passed: false, attempts: 1, firstScore: 1, lastScore: 1, total: 5 }) };
    expect(operationGameDone({ drafts }, 'memory', 'python')).toBe(false);
    drafts[completeKey] = JSON.stringify({ passed: true, attempts: 2, firstScore: 1, lastScore: 5, total: 5, completedAt: 1000 });
    expect(operationGameDone({ drafts }, 'memory', 'python')).toBe(true);
    expect(operationGameDone({ drafts }, 'memory', 'java')).toBe(false);
    expect(sourceKey).not.toBe('python:sum-array');
  });
  it('does not accept a bare completion flag or corrupt score as cleared evidence', () => {
    for (const raw of ['true', '{}', '{"passed":true}', JSON.stringify({ passed: true, attempts: 1, firstScore: 8, lastScore: 5, total: 5, completedAt: 1000 }), JSON.stringify({ passed: true, attempts: 1, firstScore: 5, lastScore: 5, total: 5 })]) expect(readOperationEvidence(raw)).toBeNull();
  });
});
