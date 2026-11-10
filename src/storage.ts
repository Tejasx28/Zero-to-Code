import { freshProgress } from './engine';
import type { Progress, Stage, TestKind, TestResult, TestSession } from './engine';

export const STORAGE_KEY = 'dsa-quest:v0.1';
const stages: Stage[] = ['discover', 'lab', 'practice', 'code', 'post', 'transfer'];
const kinds: TestKind[] = ['pre', 'post', 'transfer', 'delayed', 'rehearsal'];
const colors = ['violet', 'red', 'orange', 'blue', 'green'];
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;
function sessionValid(v: unknown): v is TestSession {
  if (!v || typeof v !== 'object') return false;
  const s = v as TestSession;
  return kinds.includes(s.kind) && Number.isInteger(s.form) && s.form >= 0 && s.form < 3 && finite(s.startedAt)
    && Array.isArray(s.answers) && s.answers.length <= 5 && s.answers.every(a => Number.isInteger(a) && a >= -1 && a <= 3)
    && Number.isInteger(s.confidence) && s.confidence >= 1 && s.confidence <= 5;
}
function resultValid(v: unknown): v is TestResult {
  if (!sessionValid(v)) return false;
  const r = v as TestResult;
  return finite(r.finishedAt) && finite(r.score) && finite(r.total) && r.score <= r.total && typeof r.independent === 'boolean';
}
export function decodeProgress(raw: string | null): { progress: Progress; recovered: boolean } {
  if (raw === null) return { progress: freshProgress(), recovered: false };
  try {
    const p = JSON.parse(raw) as Progress;
    if (p.version !== 1 || typeof p.onboarded !== 'boolean' || typeof p.name !== 'string' || typeof p.baselineSkipped !== 'boolean'
      || !Array.isArray(p.completed) || !p.completed.every(s => stages.includes(s))
      || !Array.isArray(p.results) || !p.results.every(resultValid)
      || (p.activeTest !== null && !sessionValid(p.activeTest))
      || !Array.isArray(p.tower) || !p.tower.every(s => colors.includes(s))
      || !Array.isArray(p.removed) || !p.removed.every(s => colors.includes(s))
      || ![p.hints, p.mistakes, p.moves, p.activitySeconds].every(finite)
      || !Array.isArray(p.practiceDone) || !p.practiceDone.every(s => typeof s === 'string')
      || !Array.isArray(p.codeAnswers) || p.codeAnswers.length !== 3 || !p.codeAnswers.every(s => typeof s === 'string')
      || typeof p.notes !== 'string' || (p.reviewDueAt !== null && !finite(p.reviewDueAt))) throw new Error('Invalid save');
    return { progress: { ...p, completed: [...new Set(p.completed)], name: p.name.slice(0, 30) }, recovered: false };
  } catch { return { progress: freshProgress(), recovered: true }; }
}
export function readProgress(): { progress: Progress; warning: string } {
  try {
    const { progress, recovered } = decodeProgress(localStorage.getItem(STORAGE_KEY));
    return { progress, warning: recovered ? 'Your saved progress could not be read. A fresh journey is ready. You can still export new progress from Field notes.' : '' };
  } catch { return { progress: freshProgress(), warning: 'Browser storage is unavailable. You can play, but refresh will lose progress. Export it from Field notes before leaving.' }; }
}
