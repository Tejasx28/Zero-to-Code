import { describe,expect,it } from 'vitest';
import { EXERCISES } from './curriculum';
import { changedSource,compareRuns } from './runComparison';
import { valueChanges } from './CoachWorkbench';
describe('evidence from the learner’s actual runs',()=>{
  it('compares complete runs without counting a cancelled run as progress',()=>{const exercise=EXERCISES.find(item=>item.id==='add')!;const before={source:'old',result:{attempted:true,stdout:'',results:exercise.cases.map(()=>({actual:99}))}};const after={source:'new',result:{attempted:true,stdout:'',results:exercise.cases.map(test=>({actual:test.expected}))}};expect(compareRuns(before,after,exercise)).toMatchObject({oldScore:0,newScore:exercise.cases.length});expect(compareRuns(before,{...after,result:{stdout:'',results:[]}},exercise)).toBeNull();expect(compareRuns(null,after,exercise)).toBeNull();});
  it('shows the real changed source range, including inserted lines',()=>{expect(changedSource('a\nb\nc','a\nx\ny\nc')).toEqual({start:2,before:['b'],after:['x','y']});expect(changedSource('a','a').before).toEqual([]);});
  it('uses adjacent recorded states for changes rather than guessing what a line does',()=>{expect(valueChanges({line:3,event:'line',locals:{total:0,values:[2,3]}},{line:4,event:'line',locals:{total:2,values:[2,3]}})).toEqual([{name:'total',before:0,after:2}]);expect(valueChanges(undefined,{line:1,event:'line',locals:{n:4}})).toEqual([]);});
});
