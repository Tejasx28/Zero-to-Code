/**
 * The Code-to-World cargo projection is intentionally OUTPUT-BASED.
 * It matches the REAL returned manifest back to the supplied input belt.
 * This does not claim to be a line-by-line record of the learner's algorithm.
 */
import type { CodeCase } from './curriculum';
import type { RunResult } from './runtime';
import { reviewGameRun } from './gameMechanics';

export interface CargoRunEvidence {
  state: 'not-run' | 'running' | 'unavailable' | 'ready';
  actual?: unknown;
  message: string;
}

/** Only completed, error-free case output can drive the reconstructed world. */
export function cargoRunEvidence(result:RunResult|null,cases:readonly CodeCase[],selected:number,running=false):CargoRunEvidence {
  if(running)return {state:'running',message:'Your program is running. Playback appears when the tests finish.'};
  if(!result)return {state:'not-run',message:'Run your program to see its returned cargo manifest.'};
  const review=reviewGameRun(result,cases);
  if(!review.countsAsAttempt)return {state:'unavailable',message:review.message};
  const row=result.results[selected];
  if(!row)return {state:'unavailable',message:'Choose a test with a recorded result.'};
  if(row.error)return {state:'unavailable',message:'This test stopped with an error. Fix it and run again to see a manifest.'};
  return {state:'ready',actual:row.actual,message:'Playback uses the returned manifest, not a source-line trace.'};
}

export type CargoCrateState = 'waiting' | 'current' | 'loaded' | 'skipped';
export interface CargoCrate {
  index: number;
  weight: number;
  state: CargoCrateState;
  differsFromRule: boolean;
}
export interface CargoProjection {
  ready: boolean;
  reconstructable: boolean;
  explanation: string;
  crates: CargoCrate[];
  manifest: number[];
  capacity: number;
  remaining: number;
  used: number;
  processed: number;
  firstDifference: number | null;
  agreesWithRule: boolean;
  overload: boolean;
}

const safeNumber = (value:unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && Math.abs(value) <= 1_000_000;

/** Independently computes what a correct cargo rule WOULD select, by input position. */
export function intendedCargoIndexes(values:readonly number[], capacity:number):number[] {
  const chosen:number[]=[];
  let remaining=capacity;
  for(let i=0;i<values.length;i++){
    const weight=values[i];
    if(weight>0&&weight<=remaining){chosen.push(i);remaining-=weight;}
  }
  return chosen;
}

export function projectCargoReturn(values:readonly number[], capacity:number, actual:unknown, processed:number):CargoProjection {
  const step=Math.max(0,Math.min(values.length,Number.isFinite(processed)?Math.trunc(processed):0));
  const expectedIndexes=intendedCargoIndexes(values,capacity);
  const expected=new Set(expectedIndexes);
  const fallback=(explanation:string,ready:boolean):CargoProjection=>({
    ready,reconstructable:false,explanation,manifest:[],capacity,remaining:capacity,used:0,processed:step,
    firstDifference:null,agreesWithRule:false,overload:false,
    crates:values.map((weight,index)=>({index,weight,state:index===step?'current':'waiting',differsFromRule:false})),
  });
  if(actual===undefined)return fallback('Run your program to see how its returned manifest maps to the input belt.',false);
  if(!Array.isArray(actual))return fallback('The program returned a non-array value. A cargo manifest must be an array.',true);
  if(actual.length>values.length||!actual.every(safeNumber))return fallback('The returned manifest is invalid. Check its values and length; no pickup decisions have been invented.',true);

  // Greedy subsequence matching gives a reproducible projection even with duplicate weights.
  // It cannot establish what the program did internally, so the UI labels it accordingly.
  const selected:number[]=[];
  let from=0;
  for(const weight of actual){
    let match=-1;
    for(let index=from;index<values.length;index++)if(values[index]===weight){match=index;break;}
    if(match<0)return fallback('The returned weights cannot be matched in order to the input belt. Showing no invented pickup history.',true);
    selected.push(match);from=match+1;
  }

  const chosen=new Set(selected);
  const crates=values.map((weight,index):CargoCrate=>({
    index,weight,
    state:index<step?(chosen.has(index)?'loaded':'skipped'):index===step?'current':'waiting',
    differsFromRule:index<step&&chosen.has(index)!==expected.has(index),
  }));
  const manifest=selected.filter(index=>index<step).map(index=>values[index]);
  const used=manifest.reduce((total,weight)=>total+weight,0);
  const firstDifference=crates.find(crate=>crate.differsFromRule)?.index??null;
  const agreesWithRule=selected.length===expectedIndexes.length&&selected.every((index,i)=>index===expectedIndexes[i]);
  const overload=used>capacity||manifest.some(weight=>weight<=0);
  return {
    ready:true,reconstructable:true,
    explanation:agreesWithRule?'Returned manifest matches the cargo rule on this input.':'Returned manifest differs from the cargo rule on this input.',
    crates,manifest,capacity,remaining:capacity-used,used,processed:step,firstDifference,agreesWithRule,overload,
  };
}
