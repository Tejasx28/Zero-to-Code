import { describe, expect, it } from 'vitest';
import { EXERCISES } from './curriculum';
import { runMessage } from './coachMessages';

describe('C.C. uses actual run evidence', () => {
  const exercise = EXERCISES.find(item => item.id === 'practice-difference')!;
  it('names the first real failing input and its actual return', () => {
    const message = runMessage({ attempted: true, stdout: '', results: [{ actual: 11 }] }, exercise);
    expect(message).toContain('[8,3]'); expect(message).toContain('expected 5'); expect(message).toContain('returned 11');
  });
  it('distinguishes a stopped runtime from a learner error and a complete pass', () => {
    expect(runMessage({ stdout: '', results: [], error: 'download failed' }, exercise)).toContain('runner stopped');
    expect(runMessage({ attempted: true, stdout: '', results: [{ error: 'NameError', line: 2 }] }, exercise)).toContain('line 2');
    expect(runMessage({ attempted: true, stdout: '', results: exercise.cases.map(test => ({ actual: test.expected })) }, exercise)).toContain('All 6 tests passed');
  });
});
