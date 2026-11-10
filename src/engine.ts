export type Stage = 'discover' | 'lab' | 'practice' | 'code' | 'post' | 'transfer';
export type TestKind = 'pre' | 'post' | 'transfer' | 'delayed' | 'rehearsal';
export type Screen = 'dashboard' | 'lesson' | 'practice' | 'journal';
export interface Question { prompt: string; context?: string; options: string[]; answer: number; why: string }
export interface TestSession { kind: TestKind; form: number; answers: number[]; startedAt: number; confidence: number }
export interface TestResult extends TestSession { score: number; total: number; finishedAt: number; independent: boolean }
export interface Progress {
  version: 1; onboarded: boolean; name: string; baselineSkipped: boolean;
  completed: Stage[]; results: TestResult[]; activeTest: TestSession | null;
  tower: string[]; removed: string[]; hints: number; mistakes: number; moves: number;
  practiceDone: string[]; codeAnswers: string[]; notes: string; reviewDueAt: number | null;
  activitySeconds: number;
}
export const INITIAL_TOWER = ['violet', 'red', 'orange', 'blue', 'green'];
export const REWARDS: Record<Stage, number> = { discover: 40, lab: 30, practice: 50, code: 40, post: 40, transfer: 100 };
export const REVIEW_DELAY = 48 * 60 * 60 * 1000;
export function freshProgress(): Progress {
  return { version: 1, onboarded: false, name: '', baselineSkipped: false, completed: [], results: [], activeTest: null,
    tower: [...INITIAL_TOWER], removed: [], hints: 0, mistakes: 0, moves: 0,
    practiceDone: [], codeAnswers: ['', '', ''], notes: '', reviewDueAt: null, activitySeconds: 0 };
}
export function complete(p: Progress, stage: Stage): Progress {
  return p.completed.includes(stage) ? p : { ...p, completed: [...p.completed, stage] };
}
export function xpFor(p: Progress): number { return p.completed.reduce((sum, key) => sum + REWARDS[key], 0); }
export function removeBlock(tower: string[], block: string): { tower: string[]; removed?: string; message: string; valid: boolean } {
  if (!tower.length) return { tower, valid: false, message: 'The tower is empty. There is nothing to take off.' };
  if (tower.at(-1) !== block) return { tower, valid: false, message: `The ${block} block has blocks above it. Remove the top block first to make a path to it.` };
  return { tower: tower.slice(0, -1), removed: block, valid: true, message: block === 'red' ? 'Rescued! You made room by removing the newest blocks first.' : `The ${block} block is off. Which block can you reach now?` };
}
export type Operation = 'push' | 'pop' | 'peek';
export function stackOperation(stack: number[], operation: Operation, value?: number): { stack: number[]; returned?: number; message: string } {
  if (operation === 'push') {
    if (value === undefined || !Number.isInteger(value) || value < -99 || value > 99) return { stack, message: 'Choose a whole number from −99 to 99.' };
    if (stack.length >= 6) return { stack, message: 'This small playground holds six items. Pop one to make room.' };
    return { stack: [...stack, value], message: `push(${value}) adds ${value} at the top. The size is now ${stack.length + 1}.` };
  }
  if (!stack.length) return { stack, message: `${operation}() returns undefined on an empty JavaScript array. There is no top item.` };
  const returned = stack.at(-1)!;
  return operation === 'peek' ? { stack: [...stack], returned, message: `peek() returns ${returned}. It looks at the top and leaves all ${stack.length} items in place.` }
    : { stack: stack.slice(0, -1), returned, message: `pop() removes and returns ${returned}. The item below it is now on top.` };
}
export function scoreAnswers(questions: Question[], answers: number[]): number {
  return questions.reduce((sum, q, index) => sum + Number(answers[index] === q.answer), 0);
}
export function finishTest(p: Progress, questions: Question[], now = Date.now()): Progress {
  const session = p.activeTest;
  if (!session || session.answers.length !== questions.length || session.answers.some(a => !Number.isInteger(a) || a < 0) || questions.some((q, i) => session.answers[i] > q.options.length)) return p;
  if (session.kind === 'delayed' && (!reviewReady(p, now) || session.startedAt < (p.reviewDueAt ?? Infinity))) return p;
  const independent = !p.results.some(r => r.kind === session.kind && r.form === session.form);
  const result: TestResult = { ...session, score: scoreAnswers(questions, session.answers), total: questions.length, finishedAt: now, independent };
  let next: Progress = { ...p, activeTest: null, results: [...p.results, result] };
  if (session.kind === 'post') {
    next = complete(next, 'post');
    if (!next.reviewDueAt) next.reviewDueAt = now + REVIEW_DELAY;
  }
  if (session.kind === 'transfer' && independent && result.score === questions.length && p.completed.includes('code') && p.completed.includes('post')) next = complete(next, 'transfer');
  return next;
}
export function nextTransferForm(p: Progress): number | null {
  const form = [0, 1, 2].find(f => !p.results.some(r => r.kind === 'transfer' && r.form === f));
  return form ?? null;
}
export function reviewReady(p: Progress, now = Date.now()): boolean { return p.reviewDueAt !== null && now >= p.reviewDueAt && !p.results.some(r => r.kind === 'delayed'); }
