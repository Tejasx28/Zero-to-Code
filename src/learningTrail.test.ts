import { describe, expect, it } from 'vitest';
import { foundationTrail } from './foundationTrail';
import { decodeQuest, freshQuest, submitCode } from './questState';
import { operationCompleteKey } from './codeOperations';

describe('beginner learning trail', () => {
  it('accepts verified mission evidence but not visits or damaged records', () => {
    const progress = freshQuest();
    progress.lessons = ['contract', 'gate', 'relay'];
    progress.drafts[operationCompleteKey('contract', 'python')] = 'yes';
    expect(foundationTrail(progress).completed).toBe(0);
    progress.drafts[operationCompleteKey('contract', 'python')] = JSON.stringify({passed:true,attempts:1,firstScore:4,lastScore:4,total:4,completedAt:123});
    expect(foundationTrail(progress).next).toBe('gate');
    expect(foundationTrail({...progress,language:'java'}).completed).toBe(0);
  });

  it('restores readability together with existing drafts and code progress', () => {
    const progress = submitCode(freshQuest(), 'add', 'python', 4, 4);
    progress.drafts['ui:readable'] = 'yes';
    progress.drafts['python:add'] = 'def solve(a, b):\n    return a + b';
    const restored = decodeQuest(JSON.stringify(progress));
    expect(restored).toEqual(progress);
    expect(foundationTrail(restored!).completed).toBe(1);
  });

  it('recommends functions on a fresh journey', () => {
    const trail = foundationTrail(freshQuest());
    expect(trail.stages.map((stage) => stage.title)).toEqual(['Functions', 'Conditions', 'Loops']);
    expect(trail.completed).toBe(0);
    expect(trail.next).toBe('contract');
    expect(trail.stages.filter((stage) => stage.recommended)).toHaveLength(1);
  });

  it('advances only after a verified code pass', () => {
    const fresh = freshQuest();
    const attempted = submitCode(fresh, 'add', 'python', 2, 6);
    expect(foundationTrail(attempted).next).toBe('contract');
    const passed = submitCode(attempted, 'add', 'python', 6, 6);
    expect(foundationTrail(passed).completed).toBe(1);
    expect(foundationTrail(passed).next).toBe('gate');
  });

  it('keeps language-specific progress separate', () => {
    let progress = submitCode(freshQuest(), 'add', 'python', 6, 6);
    progress = submitCode(progress, 'larger', 'python', 6, 6);
    expect(foundationTrail(progress).next).toBe('relay');
    expect(foundationTrail({ ...progress, language: 'java' }).next).toBe('contract');
  });

  it('celebrates completed fundamentals without hiding their links', () => {
    let progress = freshQuest();
    for (const id of ['add', 'larger', 'sum-to']) progress = submitCode(progress, id, 'python', 5, 5);
    const trail = foundationTrail(progress);
    expect(trail.completed).toBe(3);
    expect(trail.next).toBeNull();
    expect(trail.stages.every((stage) => stage.passed && !stage.recommended)).toBe(true);
  });
});
