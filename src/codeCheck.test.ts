import { describe,expect,it } from 'vitest';
import { canReviewCode, currentCodeChecks, resumeCheck } from './CodeCheck';
import { freshQuest, TWO_DAYS } from './questState';
describe('new coding checks keep earlier assessments distinct',()=>{
  it('does not compare earlier arithmetic forms with code-gap forms',()=>{const p=freshQuest();p.snapshots=[{kind:'after',answers:[0,0,0,0,0],confidence:3,startedAt:0,finishedAt:100,score:5}];expect(currentCodeChecks(p)).toHaveLength(0);expect(canReviewCode(p,100+TWO_DAYS)).toBe(false);});
  it('unlocks a different delayed code form at 48 hours, once',()=>{const p=freshQuest();const snapshot={kind:'after' as const,answers:[0,0,0,0,0],confidence:3,startedAt:0,finishedAt:100,score:4,format:'code-v04' as const};p.snapshots=[snapshot];expect(canReviewCode(p,99+TWO_DAYS)).toBe(false);expect(canReviewCode(p,100+TWO_DAYS)).toBe(true);p.snapshots.push({...snapshot,kind:'delayed'});expect(canReviewCode(p,100+TWO_DAYS)).toBe(false);});
  it('resumes a paused partial check and safely replaces malformed data',()=>{const p=freshQuest(),session={kind:'before',answers:[1,-1,-1,-1,-1],confidence:2,startedAt:200};p.drafts['v04:paused-check:before']=JSON.stringify(session);expect(resumeCheck(p,'before')).toEqual(session);p.drafts['v04:paused-check:before']='{"answers":"wrong"}';expect(resumeCheck(p,'before').answers).toEqual([-1,-1,-1,-1,-1]);});
});
