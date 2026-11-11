import { describe, expect, it } from 'vitest';
import { reviewGameRun } from './gameMechanics';
import { freshQuest, submitCode, codeKey } from './questState';

const cases=[{args:[1,2],expected:3,label:'Positive'},{args:[-2,2],expected:0,label:'Mixed signs'}];

describe('Code Studio completion safeguards',()=>{
  it('never awards success for a global runtime failure that contains matching rows',()=>{
    const result={attempted:true,error:'Worker crashed',results:[{actual:3},{actual:0}],stdout:''};
    const review=reviewGameRun(result,cases);
    expect(review.countsAsAttempt).toBe(false);
    expect(review.status).toBe('runtime-error');
  });
  it('does not record incomplete suites as submissions',()=>{
    const review=reviewGameRun({attempted:true,results:[{actual:3}],stdout:''},cases);
    expect(review.status).toBe('incomplete');
    expect(review.countsAsAttempt).toBe(false);
  });
  it('keeps genuine failed cases as counted attempts, without a pass',()=>{
    const review=reviewGameRun({attempted:true,results:[{actual:3},{actual:9}],stdout:''},cases);
    expect(review).toMatchObject({status:'failed',countsAsAttempt:true,score:1,firstFailure:1});
    const progress=submitCode(freshQuest(),'add','python',review.score,review.total);
    expect(progress.code[codeKey('add','python')].passed).toBe(false);
  });
  it('does not mark zero/zero or nonsensical scores as passing',()=>{
    const progress=freshQuest();
    expect(submitCode(progress,'add','python',0,0)).toBe(progress);
    expect(submitCode(progress,'add','python',3,2)).toBe(progress);
    expect(submitCode(progress,'add','python',NaN,2)).toBe(progress);
  });
  it('preserves an earlier earned pass after a later failed valid attempt',()=>{
    const passed=submitCode(freshQuest(),'add','python',2,2,100);
    const retried=submitCode(passed,'add','python',0,2,200);
    expect(retried.code[codeKey('add','python')]).toMatchObject({passed:true,attempts:2,firstScore:2,updatedAt:200});
    expect(retried.code[codeKey('add','java')]).toBeUndefined();
  });
});
