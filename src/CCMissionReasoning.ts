/** Evidence-based C.C. guidance. No LLM, invented trace or unobserved learner intent. */
import type {CodeCase, Language} from './curriculum';
import type {RunResult} from './runtime';
import { reviewGameRun } from './gameMechanics';
import { projectCargoReturn } from './cargoReplay';

export type CargoCoachMode = 'teach' | 'debug' | 'challenge';
export interface CargoCoachHint {heading:string;message:string;action:'run'|'inspect'|'code-words'|'remix'|'none';caseIndex:number|null}
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
const asList=(v:unknown)=>Array.isArray(v)?v:null;
export function cargoCoachHint(mode:CargoCoachMode,source:string,language:Language,cases:readonly CodeCase[],result:RunResult|null,selected:number,canChallenge:boolean):CargoCoachHint {
  const picked=cases[Math.max(0,Math.min(selected,cases.length-1))];
  const hint=(heading:string,message:string,action:CargoCoachHint['action']='none',caseIndex:number|null=null):CargoCoachHint=>({heading,message,action,caseIndex});
  if(cases.length===0)return hint('No tests available.','This mission has no test cases. No pass or challenge can be verified.');
  if(mode==='challenge')return canChallenge
    ?hint('Keep the idea. Change the output.','In the independent remix you must return remaining capacity, not the list of loaded crates. Start fresh and prove the new contract.', 'remix')
    :hint('Earn the transfer.','First pass the game tests with your own code. The independent remix unlocks when the game is verified.','run');
  if(mode==='teach'){
    const values=asList(picked?.args[0])??[];
    const limit=picked?.args[1];
    const n=values.length;
    return hint('Visit. Decide. Remember.',`This case has ${n} ${n===1?'crate':'crates'} and capacity ${typeof limit==='number'?limit:'unknown'}. Start with ${language==='python'?'for weight in values':'for (int weight : values)'}, keep the remaining room, and return selected weights. A skipped crate must not use capacity.`, 'code-words');
  }
  if(!result)return !source.trim()
    ?hint('Start with the contract.','Your solve function receives a list of weights and a capacity. Write the first step, then run the tests.','code-words')
    :hint('Use a test as evidence.','Run your draft. C.C. will compare the actual return with the required one instead of guessing what is wrong.','run');
  if(!result.attempted||result.error)return hint('The run did not finish.',result.error||'The runner returned no reliable evidence. Retry; this is not a failed solution.','run');
  const review=reviewGameRun(result,cases);
  if(!review.countsAsAttempt)return hint('Missing test evidence.',review.message,'run');
  const fail=result.results.findIndex((row,i)=>row.error||!same(row.actual,cases[i]?.expected));
  if(fail<0)return hint('The tested contract holds.','Your current code passed the authored cases. The independent remix will ask for different output using the same underlying rule.','remix');
  const row=result.results[fail],test=cases[fail];
  if(row.error)return hint(`Case ${fail+1}: execution error`,`${row.error.slice(0,240)} Check the reported line. Change one relevant step, then run again.`, 'inspect',fail);
  if(!Array.isArray(row.actual))return hint(`Case ${fail+1}: wrong return shape`,'The test expects a list / int[] of selected weights. Your function returned something else. Check the value after return.','inspect',fail);
  const limit=typeof test.args[1]==='number'?test.args[1]:0;
  const returned=row.actual;
  const positive=returned.every(v=>typeof v==='number'&&v>0);
  const used=returned.filter((v):v is number=>typeof v==='number'&&Number.isFinite(v)).reduce((a,b)=>a+b,0);
  if(!positive)return hint(`Case ${fail+1}: invalid crate`,'A returned weight is zero, negative, or not a positive number. The rule loads only positive weights.','inspect',fail);
  if(used>limit)return hint(`Case ${fail+1}: capacity exceeded`,`Your returned weights total ${used}, but the ship has capacity ${limit}. Where does your program update the remaining room?`,'inspect',fail);
  if(returned.length===0&&Array.isArray(test.expected)&&test.expected.length>0)return hint(`Case ${fail+1}: nothing loaded`,'The returned manifest is empty, although this input contains cargo that fits. Inspect the condition and where the selected list is updated.','inspect',fail);
  const values=asList(test.args[0]) as number[]|null;
  if(values&&!projectCargoReturn(values,limit,returned,values.length).reconstructable)return hint(`Case ${fail+1}: check the input order`,'Your returned weights cannot be matched to the input in order. Keep each selected weight unchanged and in the order it arrives.','inspect',fail);
  return hint(`Case ${fail+1}: one rule disagrees`,`Input: ${JSON.stringify(test.args)}. Expected ${JSON.stringify(test.expected)}, but returned ${JSON.stringify(row.actual)}. Try tracing the remaining capacity after each decision.`,'inspect',fail);
}
