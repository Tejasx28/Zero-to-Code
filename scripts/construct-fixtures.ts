import { construct, defaultWords, planConstructInsert } from '../src/codeWords';
import type { CodeIntent, WordChoices } from '../src/codeWords';
import type { Language } from '../src/curriculum';
// Authored maintainer fixtures. These never execute a learner's saved draft.
function program(language:Language,collect=false) {
  let source=language==='python'?'def solve(values):\n    return []':'public class Solution {\n  public static '+(collect?'int[]':'int')+' solve(int[] values) {\n    return '+(collect?'new int[0]':'0')+';\n  }\n}';
  const c=defaultWords(source,language);
  const steps:[CodeIntent,Partial<WordChoices>][]=[['remember',collect?{storeMode:'list'}:{}],['loop',{}],['condition',{}],[collect?'collect':'update',collect?{}:{value:'value'}],['return',{value:collect?(language==='python'?'result':'java.util.Arrays.copyOf(result, resultCount)'):'total'}]];
  for(const [intent,patch] of steps){Object.assign(c,patch);const step=construct(intent,language,c);if(step.error)throw new Error(step.error);const plan=planConstructInsert(source,0,step.code,language,step.place);if(plan.error)throw new Error(plan.error);source=source.slice(0,plan.from)+plan.text+source.slice(plan.to);}
  return source;
}
export const CONSTRUCT_FIXTURES=[false,true].map(collect=>({id:`construct:${collect?'positive-row':'positive-total'}`,kind:'array',example:{python:program('python',collect),java:program('java',collect)},cases:[{args:[[4,-2,0,3]],expected:collect?[4,3]:7},{args:[[]],expected:collect?[]:0},{args:[[-4,0]],expected:collect?[]:0}]}));
