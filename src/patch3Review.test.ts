import { describe, expect, it } from 'vitest';
import { normalizeWorkerResult, normalizeSyntaxChecks } from './runtime';
import { reviewGameRun, recordGameRun } from './gameMechanics';
import { compareRuns } from './runComparison';
import { freshQuest } from './questState';
import { EXERCISES } from './curriculum';

describe('Patch 3 review regressions',()=>{
  it('rejects a malformed global error even when returned values match',()=>{
    for(const error of [true,7,{},null])expect(normalizeWorkerResult({error,results:[{actual:3}]},1).attempted).toBe(false);
    expect(normalizeWorkerResult({results:[{actual:3}]},1).attempted).toBe(true);
  });
  it('never grades an empty suite or approves an empty syntax batch',()=>{
    expect(normalizeWorkerResult({results:[]},0).attempted).toBe(false);
    expect(normalizeSyntaxChecks([],0).error).toBeDefined();
    const review=reviewGameRun({attempted:true,stdout:'',results:[]},[]);
    expect(review.countsAsAttempt).toBe(false);
    expect(review.status).not.toBe('passed');
    const old=freshQuest();expect(recordGameRun(old,'python','dock',review)).toBe(old);
  });
  it('does not let circular or oversized trace metadata crash the UI',()=>{
    const cyclic:Record<string,unknown>={};cyclic.self=cyclic;
    const trace=[{line:1,event:'line',locals:cyclic},{line:2,event:'line',locals:{total:3}},{line:3,event:'line',locals:{text:'x'.repeat(128001)}}];
    const result=normalizeWorkerResult({results:[{actual:3,trace}]},1);
    expect(result.attempted).toBe(true);
    expect(result.results[0].trace).toEqual([{line:2,event:'line',locals:{total:3}}]);
    expect(()=>JSON.stringify(result)).not.toThrow();
  });
  it('compares only completed submissions, never crashed or partial snapshots',()=>{
    const exercise=EXERCISES.find(e=>e.id==='add')!;
    const good={source:'good',result:{attempted:true,stdout:'',results:exercise.cases.map(c=>({actual:c.expected}))}};
    const crashed={...good,result:{...good.result,error:'Worker crashed'}};
    const partial={...good,result:{...good.result,results:good.result.results.slice(0,1)}};
    expect(compareRuns(crashed,good,exercise)).toBeNull();
    expect(compareRuns(good,crashed,exercise)).toBeNull();
    expect(compareRuns(partial,good,exercise)).toBeNull();
    expect(compareRuns(good,partial,exercise)).toBeNull();
    expect(compareRuns(good,good,exercise)?.newScore).toBe(exercise.cases.length);
  });
});
