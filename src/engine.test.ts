import { describe, expect, it } from 'vitest';
import { complete, finishTest, freshProgress, INITIAL_TOWER, nextTransferForm, removeBlock, REVIEW_DELAY, reviewReady, scoreAnswers, stackOperation, xpFor } from './engine';
import type { Progress, TestKind } from './engine';
import { DELAYED, POST, PRE, questionsFor, TRANSFER } from './content';
import { decodeProgress } from './storage';
const begin = (p: Progress, kind: TestKind, form = 0, startedAt = 100): Progress => ({ ...p, activeTest: { kind, form, startedAt, confidence: 3, answers: questionsFor(kind, form).map(q => q.answer) } });
describe('discovering the tower', () => {
  it('keeps a blocked block in place and explains the obstruction', () => {
    const original = [...INITIAL_TOWER]; const result = removeBlock(original, 'red');
    expect(result.valid).toBe(false); expect(result.tower).toEqual(INITIAL_TOWER); expect(result.message).toContain('above'); expect(original).toEqual(INITIAL_TOWER);
  });
  it('rescues red only after the three newer blocks are removed', () => {
    let tower = [...INITIAL_TOWER];
    for (const color of ['green', 'blue', 'orange', 'red']) { const result = removeBlock(tower, color); expect(result.valid).toBe(true); tower = result.tower; }
    expect(tower).toEqual(['violet']); expect(removeBlock([], 'red').valid).toBe(false);
  });
});
describe('stack semantics', () => {
  it('adds at the top and pops in reverse order without mutating the input', () => {
    const original = [4]; const pushed = stackOperation(original, 'push', 9);
    expect(original).toEqual([4]); expect(pushed.stack).toEqual([4, 9]);
    const popped = stackOperation(pushed.stack, 'pop'); expect(popped.returned).toBe(9); expect(popped.stack).toEqual([4]);
  });
  it('peek preserves the stack, including duplicate and zero values', () => {
    const result = stackOperation([7, 0, 0], 'peek'); expect(result.returned).toBe(0); expect(result.stack).toEqual([7, 0, 0]);
  });
  it('handles empty pop and peek accurately', () => {
    for (const op of ['pop', 'peek'] as const) { const result = stackOperation([], op); expect(result.returned).toBeUndefined(); expect(result.stack).toEqual([]); expect(result.message).toContain('undefined'); }
  });
  it('guards invalid input and the visualization capacity', () => {
    for (const value of [undefined, NaN, Infinity, 1.5, 100, -100]) expect(stackOperation([1], 'push', value).stack).toEqual([1]);
    expect(stackOperation([1, 2, 3, 4, 5, 6], 'push', 7).stack).toHaveLength(6);
    expect(stackOperation([], 'push', -99).stack).toEqual([-99]);
  });
});
describe('honest progress and assessment', () => {
  it('does not award duplicate XP for replaying a lesson', () => { let p = complete(freshProgress(), 'discover'); p = complete(p, 'discover'); expect(p.completed).toEqual(['discover']); expect(xpFor(p)).toBe(40); });
  it('scores not-sure as wrong and permits submitting honest uncertainty', () => {
    const p = begin(freshProgress(), 'pre'); p.activeTest!.answers = [3, 3, 3, 3, 3];
    const next = finishTest(p, PRE, 200); expect(next.results[0].score).toBe(0); expect(next.activeTest).toBeNull();
  });
  it('does not submit missing or out-of-range answers', () => {
    for (const answers of [[0], [-1, 0, 0, 0, 0], [4, 0, 0, 0, 0]]) { const p = begin(freshProgress(), 'pre'); p.activeTest!.answers = answers; expect(finishTest(p, PRE)).toBe(p); }
  });
  it('requires fresh independent success and the coding/check-in prerequisites for mastery', () => {
    const noPrereq = finishTest(begin(freshProgress(), 'transfer'), TRANSFER[0], 200); expect(noPrereq.completed).not.toContain('transfer');
    let p = complete(complete(freshProgress(), 'code'), 'post');
    p = finishTest(begin(p, 'transfer'), TRANSFER[0], 200); expect(p.completed).toContain('transfer'); expect(xpFor(p)).toBe(180);
    p = finishTest(begin(p, 'transfer'), TRANSFER[0], 300); expect(xpFor(p)).toBe(180); expect(p.results[1].independent).toBe(false); expect(nextTransferForm(p)).toBe(1);
  });
  it('cannot earn a badge by repeating an exposed failed form', () => {
    let p = complete(complete(freshProgress(), 'code'), 'post'); p = begin(p, 'transfer'); p.activeTest!.answers = [3, 3, 3];
    p = finishTest(p, TRANSFER[0], 200); p = finishTest(begin(p, 'transfer'), TRANSFER[0], 300);
    expect(p.completed).not.toContain('transfer');
    p = finishTest(begin(p, 'transfer', 1), TRANSFER[1], 400); expect(p.completed).toContain('transfer');
  });
  it('exhausts the three independent forms instead of silently reusing one', () => {
    let p = freshProgress(); for (const form of [0, 1, 2]) p = finishTest(begin(p, 'transfer', form), TRANSFER[form], 200 + form);
    expect(nextTransferForm(p)).toBeNull();
  });
  it('anchors the delayed test to the first post-test and excludes early retention', () => {
    let p = finishTest(begin(freshProgress(), 'post'), POST, 1000); expect(p.reviewDueAt).toBe(1000 + REVIEW_DELAY);
    p = finishTest(begin(p, 'post'), POST, 5000); expect(p.reviewDueAt).toBe(1000 + REVIEW_DELAY);
    expect(reviewReady(p, p.reviewDueAt! - 1)).toBe(false); expect(reviewReady(p, p.reviewDueAt!)).toBe(true);
    const early = begin(p, 'delayed', 0, p.reviewDueAt! - 1); expect(finishTest(early, DELAYED, p.reviewDueAt! - 1)).toBe(early);
    p = finishTest(begin(p, 'delayed', 0, p.reviewDueAt!), DELAYED, p.reviewDueAt! + 100); expect(p.results.at(-1)?.kind).toBe('delayed'); expect(reviewReady(p, Infinity)).toBe(false);
  });
  it('keeps rehearsal results separate and never unlocks retention or mastery', () => {
    const p = finishTest(begin(freshProgress(), 'rehearsal'), questionsFor('rehearsal'), 200); expect(p.reviewDueAt).toBeNull(); expect(p.completed).toEqual([]);
  });
  it('has valid keys and different before/after/delayed question sets', () => {
    for (const kind of ['pre', 'post', 'delayed', 'rehearsal', 'transfer'] as const) { const qs = questionsFor(kind); expect(scoreAnswers(qs, qs.map(q => q.answer))).toBe(qs.length); for (const q of qs) expect(q.options[q.answer]).toBeTruthy(); }
    expect(PRE.map(q => q.prompt)).not.toEqual(POST.map(q => q.prompt)); expect(POST.map(q => q.prompt)).not.toEqual(DELAYED.map(q => q.prompt));
  });
});
describe('saving and recovery', () => {
  it('round-trips a partially answered assessment, notes, and tower progress', () => {
    const p = begin(complete(freshProgress(), 'discover'), 'post'); p.notes = 'I can explain the top.'; p.tower = ['violet']; p.activeTest!.answers = [0, -1, -1, -1, -1];
    expect(decodeProgress(JSON.stringify(p))).toEqual({ progress: p, recovered: false });
  });
  it('recovers from malformed JSON, unsupported versions, and damaged nested data', () => {
    for (const raw of ['{bad', 'null', JSON.stringify({ ...freshProgress(), version: 2 }), JSON.stringify({ ...freshProgress(), completed: ['invented'] }), JSON.stringify({ ...freshProgress(), results: [{}] }), JSON.stringify({ ...freshProgress(), tower: 'red' })]) expect(decodeProgress(raw).recovered).toBe(true);
    expect(decodeProgress(null).recovered).toBe(false);
  });
});
