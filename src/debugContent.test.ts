import { describe, expect, it } from 'vitest';
import { canRebuild, DEBUG_CASES, debugExercise, debugKey, debugStorageId } from './debugContent';
import { codeCompleted, decodeQuest, freshQuest, submitCode } from './questState';

describe('debugging practice and rebuild evidence', () => {
  it('uses distinct cases and starters for repair and rebuild', () => {
    expect(new Set(DEBUG_CASES.map(item => item.id)).size).toBe(4);
    for (const item of DEBUG_CASES) {
      const repair = debugExercise(item, 'repair'), rebuild = debugExercise(item, 'rebuild');
      expect(repair.cases.length).toBeGreaterThanOrEqual(6); expect(rebuild.cases.length).toBeGreaterThanOrEqual(6);
      expect(rebuild.independent).toBe(true); expect(repair.independent).toBe(false);
      expect(rebuild.starter).not.toEqual(repair.starter);
      expect(JSON.stringify(rebuild.cases)).not.toBe(JSON.stringify(repair.cases));
    }
  });
  it('unlocks only after a language-specific repair pass and preserves first attempts', () => {
    let p = submitCode(freshQuest(), debugStorageId('early-return', 'repair'), 'python', 2, 6, 1);
    expect(canRebuild(p, 'early-return', 'python')).toBe(false);
    p = submitCode(p, debugStorageId('early-return', 'repair'), 'python', 6, 6, 2);
    expect(canRebuild(p, 'early-return', 'python')).toBe(true);
    expect(canRebuild(p, 'early-return', 'java')).toBe(false);
    expect(p.code[debugKey('early-return', 'repair', 'python')].firstScore).toBe(2);
    expect(p.code[debugKey('early-return', 'rebuild', 'python')]).toBeUndefined();
    expect(codeCompleted(p)).toBe(0);
    expect(canRebuild(decodeQuest(JSON.stringify(p))!, 'early-return', 'python')).toBe(true);
  });
});
