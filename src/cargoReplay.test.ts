import {describe,it,expect} from 'vitest';
import {cargoRunEvidence,intendedCargoIndexes,projectCargoReturn} from './cargoReplay';
import type {CodeCase} from './curriculum';
import { QUEST_PROBLEMS } from './questArcadeContent';

describe('Code-to-World cargo return projection (not execution trace)',()=>{
 it('reconstructs every authored cargo result and each intermediate input step',()=>{
  const cases=QUEST_PROBLEMS.find(exercise=>exercise.id==='quest-dock')!.cases;
  for(const test of cases){
   const values=test.args[0] as number[],capacity=test.args[1] as number;
   for(let step=0;step<=values.length;step++){
    const view=projectCargoReturn(values,capacity,test.expected,step);
    expect(view.reconstructable).toBe(true);expect(view.agreesWithRule).toBe(true);
    expect(view.overload).toBe(false);expect(view.firstDifference).toBeNull();
    expect(view.remaining).toBe(capacity-view.manifest.reduce((sum,weight)=>sum+weight,0));
   }
  }
 });
 it('distinguishes pending, running, failed and real empty outputs',()=>{
  const cases:CodeCase[]=[{args:[[],5],expected:[],label:'empty belt'}];
  const result={attempted:true,stdout:'',results:[{actual:[]}]};
  expect(cargoRunEvidence(null,cases,0).state).toBe('not-run');
  expect(cargoRunEvidence(null,cases,0,true).state).toBe('running');
  expect(cargoRunEvidence(result,cases,0)).toMatchObject({state:'ready',actual:[]});
  expect(cargoRunEvidence({...result,error:'Worker failed'},cases,0).state).toBe('unavailable');
  expect(cargoRunEvidence({...result,results:[]},cases,0).state).toBe('unavailable');
  expect(cargoRunEvidence({...result,results:[{actual:[],error:'RuntimeError'}]},cases,0).state).toBe('unavailable');
  expect(cargoRunEvidence({...result,attempted:false},cases,0).state).toBe('unavailable');
 });
 it('does not reuse an output for an unavailable selected case',()=>{
  const cases:CodeCase[]=[{args:[[4],5],expected:[4],label:'crate'}];
  expect(cargoRunEvidence({attempted:true,stdout:'',results:[{actual:[4]}]},cases,1).state).toBe('unavailable');
 });
 it('keeps an empty belt at the zero playback step',()=>{
  const view=projectCargoReturn([],5,[],1);
  expect(view.processed).toBe(0);expect(view.agreesWithRule).toBe(true);expect(view.remaining).toBe(5);
 });
 it('matches the real returned manifest to input indexes and capacity',()=>{
  const v=projectCargoReturn([4,7,2,-1,3,1],10,[4,2,3,1],6);
  expect(v.reconstructable).toBe(true);expect(v.agreesWithRule).toBe(true);
  expect(v.manifest).toEqual([4,2,3,1]);expect(v.remaining).toBe(0);
  expect(v.crates.map(x=>x.state)).toEqual(['loaded','skipped','loaded','skipped','loaded','loaded']);
 });
 it('only displays processed crates at intermediate steps',()=>{
  const v=projectCargoReturn([4,7,2],6,[4,2],2);
  expect(v.manifest).toEqual([4]);expect(v.remaining).toBe(2);expect(v.crates[2].state).toBe('current');
 });
 it('supports repeated values without combining different positions',()=>{
  expect(intendedCargoIndexes([4,4,2],6)).toEqual([0,2]);
  const v=projectCargoReturn([4,4,2],6,[4,2],3);
  expect(v.agreesWithRule).toBe(true);expect(v.crates[1].state).toBe('skipped');
 });
 it('shows a genuine empty output as skipped instead of a fake successful selection',()=>{
  const v=projectCargoReturn([3],5,[],1);
  expect(v.reconstructable).toBe(true);expect(v.manifest).toEqual([]);expect(v.firstDifference).toBe(0);
 });
 it('refuses to invent a pickup history for an impossible output sequence',()=>{
  const v=projectCargoReturn([4,2,3],9,[3,4],3);
  expect(v.reconstructable).toBe(false);expect(v.ready).toBe(true);
 });
 it('refuses invalid return shapes and preserves the not-run state',()=>{
  expect(projectCargoReturn([4],5,undefined,0).ready).toBe(false);
  expect(projectCargoReturn([4],5,42,1).reconstructable).toBe(false);
  expect(projectCargoReturn([4],5,[4,'bad'],1).reconstructable).toBe(false);
 });
 it('detects manifest overload instead of pretending successful loading',()=>{
  const v=projectCargoReturn([4,3],4,[4,3],2);
  expect(v.overload).toBe(true);expect(v.agreesWithRule).toBe(false);
 });
});
