import {describe,it,expect} from 'vitest';
import {cargoCoachHint} from './CCMissionReasoning';
import type {CodeCase} from './curriculum';
const cases:CodeCase[]=[{args:[[4,7,2],6],expected:[4,2],label:'small belt'},{args:[[0,-2,3],3],expected:[3],label:'damaged belt'}];
describe('evidence-driven cargo C.C.',()=>{
 it('does not infer a pass or unlock a challenge from an empty suite',()=>{
  const result={results:[],stdout:'',attempted:true};
  expect(cargoCoachHint('debug','','python',[],result,0,false).action).toBe('none');
  expect(cargoCoachHint('challenge','','python',[],result,0,true).action).not.toBe('remix');
 });
 it('uses impossible returned order as evidence without guessing about code keywords',()=>{
  const result={results:[{actual:[2,4]},{actual:[3]}],stdout:'',attempted:true};
  const hint=cargoCoachHint('debug','# for while\ndef solve(values, limit): return [2,4]','python',cases,result,0,false);
  expect(hint.heading).toContain('input order');expect(hint.action).toBe('inspect');expect(hint.caseIndex).toBe(0);
 });
 it('does not invent feedback before an actual run',()=>{
  expect(cargoCoachHint('debug','def solve(values, limit): pass','python',cases,null,0,false).action).toBe('run');
 });
 it('does not describe an interrupted run as a learner mistake',()=>{
  const hint=cargoCoachHint('debug','', 'python',cases,{results:[],stdout:'',error:'Run cancelled. Your draft is saved.',attempted:false},0,false);
  expect(hint.heading).toContain('did not finish');
 });
 it('uses actual error and case index for targeted investigation',()=>{
  const hint=cargoCoachHint('debug','def solve(values, limit): return []','python',cases,{results:[{actual:[],error:'IndexError: list index out of range'},{actual:[3]}],stdout:'',attempted:true},0,false);
  expect(hint.action).toBe('inspect');expect(hint.caseIndex).toBe(0);
 });
 it('recognizes overloaded returned results',()=>{
  const hint=cargoCoachHint('debug','for x in values: pass','python',cases,{results:[{actual:[4,7,2]},{actual:[3]}],stdout:'',attempted:true},0,false);
  expect(hint.message).toContain('capacity');
 });
 it('unlocks challenge only from verified prior or current game pass',()=>{
  expect(cargoCoachHint('challenge','','python',cases,null,0,false).action).toBe('run');
  expect(cargoCoachHint('challenge','','java',cases,null,0,true).action).toBe('remix');
 });
});
