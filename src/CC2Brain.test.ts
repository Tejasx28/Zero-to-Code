import { describe,expect,it } from 'vitest';
import type { CCWorkspace } from './CCGuide';
import { connectedTutorContext,localTutorReply,predictionVerdict,tutorEvidence } from './CC2Brain';

function workspace(results: unknown=null, source='def solve(values):\n    return []',mode:'suite'|'custom'='suite'): CCWorkspace {
  return {key:'python:arcade:dock:source',scope:'game',language:'python',source,
    exercise:{id:'quest-dock',title:'Cargo',brief:'Load positive items that fit.',contract:'solve(values, capacity)',kind:'target',independent:false,
      cases:[{args:[[4,2,3],6],expected:[4,2],label:'fits'}, {args:[[2,2],3],expected:[2],label:'reject'}]},
    result:results,mode,customArgs:null,running:false,status:'',onRun:()=>{}} as unknown as CCWorkspace;
}
const good={attempted:true,error:undefined,stdout:'',results:[{actual:[4,2]},{actual:[2]}]};

describe('C.C. 2.0 evidence-grounded tutoring',()=>{
  it('does not turn one matching test into a suite pass',()=>{
    const w=workspace({...good,results:[{actual:[4,2]},{actual:[]}]});
    const e=tutorEvidence(w,0)!;
    expect(e.issue).toBe('suite-failed');expect(e.passed).toBe(1);
    expect(localTutorReply('why?',w,0)).toContain('1/2');
    expect(localTutorReply('why?',w,0)).not.toContain('suite passed 2/2');
  });
  it('rejects an empty suite instead of claiming zero-test success',()=>{
    const w=workspace({...good,results:[]});w.exercise.cases=[];
    expect(tutorEvidence(w)!.completed).toBe(false);
    expect(tutorEvidence(w)!.issue).toBe('runtime');
    expect(predictionVerdict('[]',w,0).valid).toBe(false);
  });
  it('does not reveal predictions from partial or stale running results',()=>{
    const w=workspace({...good,results:[{actual:[4,2]}]});
    expect(predictionVerdict('[4,2]',w,0).valid).toBe(false);
    const running={...workspace(good),running:true};
    expect(tutorEvidence(running)!.actual).toBeUndefined();
    expect(predictionVerdict('[4,2]',running,0).valid).toBe(false);
  });
  it('validates custom experiment evidence independently of the authored suite',()=>{
    const w=workspace({...good,results:[{actual:12}]},undefined,'custom');
    expect(tutorEvidence(w)).toMatchObject({completed:true,passed:0,total:1,issue:'experiment'});
    expect(predictionVerdict('12',w,0)).toMatchObject({valid:true,correct:true});
    const failed=workspace({...good,results:[{error:'TypeError'}]},undefined,'custom');
    expect(tutorEvidence(failed)!.issue).toBe('test-error');
  });
  it('does not claim a run when no evidence exists',()=>{const e=tutorEvidence(workspace(),0)!;expect(e.hasRun).toBe(false);expect(e.issue).toBe('idle');expect(localTutorReply('help',workspace())).toContain('contract');});
  it('accepts a complete authoritative suite',()=>{const e=tutorEvidence(workspace(good),0)!;expect(e.completed).toBe(true);expect(e.passed).toBe(2);expect(e.issue).toBe('passed');});
  it('does not claim a pass for partial results',()=>{const e=tutorEvidence(workspace({...good,results:[{actual:[4,2]}]}),0)!;expect(e.completed).toBe(false);expect(e.issue).toBe('runtime');});
  it('grounds mismatch in actual expected and returned values',()=>{const w=workspace({...good,results:[{actual:[4]},{actual:[2]}]});const reply=localTutorReply('What went wrong?',w);expect(reply).toContain('[4,2]');expect(reply).toContain('[4]');});
  it('does not confuse a custom experiment with graded success',()=>{const w=workspace({...good,results:[{actual:[4,2]}]},undefined,'custom');expect(tutorEvidence(w)!.issue).toBe('experiment');expect(tutorEvidence(w)!.passed).toBe(0);});
  it('preserves independent task distinction for hints',()=>{const w=workspace();w.exercise.independent=true;expect(localTutorReply('hint',w,0,2)).toContain('not paste the independent solution');});
  it('reveals prediction only from recorded output, not expected',()=>{const w=workspace(good);expect(predictionVerdict('[4,2]',w,0).correct).toBe(true);expect(predictionVerdict('[4,3]',w,0).correct).toBe(false);expect(predictionVerdict('wrong',w,0).valid).toBe(false);expect(predictionVerdict('[]',workspace(),0).valid).toBe(false);});
  it('sends selected case only, not the entire test suite',()=>{const ctx=connectedTutorContext(workspace(good),1)!;expect(ctx.evidence.selected).toBe(2);expect(ctx.evidence.expected).toEqual([2]);expect(JSON.stringify(ctx)).not.toContain('"fits"');});
  it('never sends browser storage or progress metadata',()=>{const ctx=connectedTutorContext(workspace(),0)!;expect(Object.keys(ctx).sort()).toEqual(['code','evidence','language','problem']);});
});
