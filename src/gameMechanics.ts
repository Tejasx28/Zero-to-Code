import type { CodeCase, Language } from './curriculum';
import type { RunResult } from './runtime';
import { matches } from './runtime';
import type { QuestProgress } from './questState';

export type GameRunStatus = 'cancelled' | 'runtime-error' | 'incomplete' | 'failed' | 'passed';
export interface GameRunReview {
  status: GameRunStatus;
  score: number;
  total: number;
  firstFailure: number | null;
  message: string;
  countsAsAttempt: boolean;
}

/** A worker failure or a partial suite cannot give the learner a game clear. */
export function reviewGameRun(result: RunResult, cases: readonly CodeCase[]): GameRunReview {
  const total = cases.length;
  if (!result.attempted) {
    const cancelled = result.error === 'Run cancelled. Your draft is saved.';
    return {
      status: cancelled ? 'cancelled' : 'runtime-error', score: 0, total, firstFailure: null,
      message: cancelled ? 'Run stopped. Your draft is saved; this did not count as an attempt.' : result.error || 'The code runner did not finish. No attempt was recorded.',
      countsAsAttempt: false,
    };
  }
  if (result.error) {
    return { status: 'runtime-error', score: 0, total, firstFailure: null, message: result.error, countsAsAttempt: false };
  }
  if (result.results.length !== total) {
    return {
      status: 'incomplete', score: 0, total, firstFailure: null,
      message: `The runner returned ${result.results.length} of ${total} cases. Retry; no attempt was recorded.`,
      countsAsAttempt: false,
    };
  }
  let score = 0;
  let firstFailure: number | null = null;
  for (let i = 0; i < total; i++) {
    const row = result.results[i];
    if (!row.error && matches(row.actual, cases[i].expected)) score++;
    else if (firstFailure === null) firstFailure = i;
  }
  if (firstFailure !== null) {
    const row = result.results[firstFailure];
    return {
      status: 'failed', score, total, firstFailure, countsAsAttempt: true,
      message: row.error
        ? `Case ${firstFailure + 1}: ${row.error}`
        : `Case ${firstFailure + 1}, “${cases[firstFailure].label}”: your return differed from the expected result. Check that input and change one part of your rule.`,
    };
  }
  return {
    status: 'passed', score, total, firstFailure: null, countsAsAttempt: true,
    message: `All ${total} cases passed! Now try the related problem from a fresh starter.`,
  };
}

export const gameProgressKey = (language: Language, gameId: string, field: 'passed' | 'attempts' | 'stage' | 'rehearsed') =>
  `${language}:arcade:${gameId}:${field}`;

export function recordGameRun(progress: QuestProgress, language: Language, gameId: string, review: GameRunReview, legacyAttemptKey?: string): QuestProgress {
  if (!review.countsAsAttempt) return progress;
  const attempts = gameProgressKey(language, gameId, 'attempts');
  const passed = gameProgressKey(language, gameId, 'passed');
  const previous = Math.max(Number(progress.drafts[attempts]) || 0, Number(legacyAttemptKey ? progress.drafts[legacyAttemptKey] : 0) || 0);
  const next = String(previous + 1);
  return {
    ...progress,
    drafts: {
      ...progress.drafts,
      [attempts]: next,
      ...(legacyAttemptKey ? { [legacyAttemptKey]: next } : {}),
      ...(review.status === 'passed' ? { [passed]: 'yes' } : {}),
    },
  };
}

export function hasGamePass(progress: Pick<QuestProgress, 'drafts'>, language: Language, gameId: string): boolean {
  return progress.drafts[gameProgressKey(language, gameId, 'passed')] === 'yes';
}
