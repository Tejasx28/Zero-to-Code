import { describe, expect, it } from 'vitest';
import { EXERCISES } from './curriculum';
import { DEBUG_CASES, debugExercise } from './debugContent';
import { expectedReturn, smallerFailure, smallerInputs, supportsShrink } from './counterexample';

describe('smaller real failing inputs', () => {
  it('matches the declared contracts of every supported authored test', () => {
    const exercises = [...EXERCISES, ...DEBUG_CASES.map(item => debugExercise(item, 'repair'))];
    for (const exercise of exercises) if (supportsShrink(exercise)) for (const test of exercise.cases) expect(expectedReturn(exercise.id, test.args), `${exercise.id}: ${test.label}`).toEqual(test.expected);
  });
  it('keeps targets and source values intact and limits auxiliary runs', () => {
    const inputs = smallerInputs([[7, -2, 7, 9], 7]);
    expect(inputs.length).toBeLessThanOrEqual(24); expect(inputs.every(args => args[1] === 7)).toBe(true); expect(inputs).toContainEqual([[-2], 7]); expect(inputs[inputs.length - 1]).toEqual([[7, -2, 7, 9], 7]);
  });
  it('reports only a witnessed smaller failure and excludes independent tasks', () => {
    const exercise = debugExercise(DEBUG_CASES.find(item => item.id === 'negative-maximum')!, 'repair');
    const inputs = smallerInputs([[-8, -3, -6]]), outcome = { attempted: true, stdout: '', results: inputs.map(() => ({ actual: 0 })) };
    const found = smallerFailure(exercise, [[-8, -3, -6]], inputs, outcome);
    expect(found?.args[0]).toEqual([-8]); expect(found?.expected).toBe(-8); expect(smallerFailure(exercise, [[-8]], [[[-8]]], outcome)).toBeNull(); expect(supportsShrink({ ...exercise, independent: true })).toBe(false);
  });
});
