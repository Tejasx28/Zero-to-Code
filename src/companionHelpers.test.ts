import { describe,expect,it } from 'vitest';
import { changedValues,evidenceCase,insertPlanComments,keywordLines,movePlanStep,readSteps } from './companionHelpers';
import { EXERCISES } from './curriculum';
describe('C.C. workbench safeguards',()=>{
  it('points to an actual failing case rather than inventing a diagnosis',()=>{const exercise=EXERCISES.find(item=>item.id==='add')!;expect(evidenceCase({results:[{actual:7},{actual:0}],stdout:''},exercise)).toBe(1);expect(evidenceCase(null,exercise)).toBe(0);});
  it('marks values that actually changed, including values leaving scope',()=>{expect(changedValues({line:2,event:'line',locals:{total:0,old:2,values:[1]}},{line:3,event:'line',locals:{total:3,values:[1]}})).toEqual(['total','old']);});
  it('inserts only comments from the learner plan inside the function',()=>{expect(insertPlanComments('def solve(values):\n    pass\n','python',['remember a total','visit each value']).source).toBe('def solve(values):\n    # remember a total\n    # visit each value\n    pass\n');const out=insertPlanComments('public class Solution {\n  public static int solve(int[] values) {\n    return 0;\n  }\n}','java',['first\nsecond','\\u000a return 99;']);expect(out.source).toContain('// \\ u000a return 99;');expect(out.source).toContain('    return 0;');expect(insertPlanComments('missing signature','python',['plan']).error).toBeTruthy();});
  it('recovers malformed plans and keeps reordering immutable',()=>{expect(readSteps('{"bad":1}')).toEqual(['','','']);const steps=['first','second','third'];expect(movePlanStep(steps,2,0)).toEqual(['third','first','second']);expect(steps[0]).toBe('first');});
  it('connects keyword help to visible source lines without matching comments',()=>{expect(keywordLines('def solve(values):\n    # return later\n    for value in values:\n        pass\n    return 0','return','python')).toEqual([5]);expect(keywordLines('int x = values[0]; // next index','[index]','java')).toEqual([1]);});
});
