import { describe, expect, it } from 'vitest';
import { freshQuest } from './questState';
import { gameProgressKey, hasGamePass, recordGameRun, reviewGameRun } from './gameMechanics';
import type { CodeCase } from './curriculum';

const cases: CodeCase[] = [
  { label: 'Changing room', args: [[4, 7, 2], 6], expected: [4, 2] },
  { label: 'Empty belt', args: [[], 4], expected: [] },
];

describe('consistent arcade grading and progress', () => {
  it('records exactly one pass only for a complete real suite', () => {
    const review = reviewGameRun({ attempted: true, stdout: '', results: [{ actual: [4, 2] }, { actual: [] }] }, cases);
    expect(review).toMatchObject({ status: 'passed', score: 2, total: 2, countsAsAttempt: true });
    const updated = recordGameRun(freshQuest(), 'python', 'dock', review);
    expect(updated.drafts[gameProgressKey('python', 'dock', 'attempts')]).toBe('1');
    expect(hasGamePass(updated, 'python', 'dock')).toBe(true);
    expect(hasGamePass(updated, 'java', 'dock')).toBe(false);
  });
  it('pinpoints the first wrong case without incorrectly clearing the world', () => {
    const review = reviewGameRun({ attempted: true, stdout: '', results: [{ actual: [4] }, { actual: [] }] }, cases);
    expect(review).toMatchObject({ status: 'failed', score: 1, firstFailure: 0, countsAsAttempt: true });
    expect(review.message).toContain('Changing room');
    const updated = recordGameRun(freshQuest(), 'python', 'dock', review);
    expect(hasGamePass(updated, 'python', 'dock')).toBe(false);
    expect(updated.drafts[gameProgressKey('python', 'dock', 'attempts')]).toBe('1');
  });
  it('never counts a cancelled, crashed or incomplete run as a solution attempt', () => {
    const invalid = [
      { stdout: '', error: 'Run cancelled. Your draft is saved.', results: [] },
      { stdout: '', error: 'Runtime download timed out.', results: [] },
      { stdout: '', attempted: true, results: [{ actual: [4, 2] }] },
    ];
    for (const result of invalid) {
      const review = reviewGameRun(result, cases);
      expect(review.countsAsAttempt).toBe(false);
      expect(recordGameRun(freshQuest(), 'python', 'dock', review).drafts).toEqual({});
    }
  });
  it('retains a historically earned game pass while another attempt fails', () => {
    const passed = recordGameRun(freshQuest(), 'java', 'queue-relay', reviewGameRun({ attempted: true, stdout: '', results: [{ actual: [4, 2] }, { actual: [] }] }, cases));
    const failed = recordGameRun(passed, 'java', 'queue-relay', reviewGameRun({ attempted: true, stdout: '', results: [{ error: 'Boom' }, { actual: [] }] }, cases));
    expect(hasGamePass(failed, 'java', 'queue-relay')).toBe(true);
    expect(failed.drafts[gameProgressKey('java', 'queue-relay', 'attempts')]).toBe('2');
  });
  it('continues the existing original-game attempt counter without deleting its history', () => {
    const legacy='python:arcade:dock:source:attempts';
    const old={...freshQuest(),drafts:{[legacy]:'4'}};
    const next=recordGameRun(old,'python','dock',reviewGameRun({attempted:true,stdout:'',results:[{actual:[4,2]},{actual:[]}]},cases),legacy);
    expect(next.drafts[legacy]).toBe('5');
    expect(next.drafts[gameProgressKey('python','dock','attempts')]).toBe('5');
  });
});
