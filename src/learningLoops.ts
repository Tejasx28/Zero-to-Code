import type { GameId } from './curriculum';

export interface LearningLoop { concept: string; observation: string; task: string; exercise: string; question: string; steps: string[]; connections: string[] }
export const LEARNING_LOOPS: Record<GameId, LearningLoop> = {
  robot: {concept:'A program changes state, one instruction at a time.',observation:'Your robot kept a position while the same move repeated. A loop can do that work for any route.',task:'Write a route interpreter',exercise:'trace-route',question:'How can the same four direction rules work for a completely different route?',steps:['Start x and y at zero.','Visit each direction code in the route.','Change x or y according to that direction.','After every direction has been processed, return [x, y].'],connections:['position → variables','each instruction → loop','direction → condition','final position → return']},
  array: {concept:'Moving data safely means remembering what would be overwritten.',observation:'The gap and temporary register protected values during a shift. Reuse that idea to rotate a whole row one place left.',task:'Rotate a memory row',exercise:'rotate-left',question:'Which item needs a temporary home before the other items shift?',steps:['If the row is empty, return it unchanged.','Remember the first value in a temporary variable.','Move each later value into the slot immediately before it.','Place the remembered value in the last slot, then return the row.'],connections:['memory slot → index','register → temporary variable','repeated shift → loop','no lost cargo → preserve every value']},
  search: {concept:'A comparison can prove which possibilities are impossible.',observation:'You used sorted order to discard candidates. Code needs to remember the remaining range and update it after every probe.',task:'Code the signal search',exercise:'binary-search',question:'Why must the probe itself be excluded when you narrow the range?',steps:['Start with low at the first index and high at the last.','While low is no greater than high, inspect the middle index.','Return the index on a match; otherwise move low or high past the middle.','If no candidates remain, return -1.'],connections:['candidate range → low and high','probe → middle index','evidence → if / else','empty range → loop stops']},
  sort: {concept:'A small correct rule becomes an algorithm when repeated deliberately.',observation:'A complete pass carried a large value to the right. The code repeats that pass over the part still out of order.',task:'Write your comparison-and-swap rule',exercise:'sort-array',question:'What is guaranteed after a full pass, and which part still needs attention?',steps:['Choose the right boundary of the unsorted part.','Compare each pair of neighbors up to that boundary, swapping if the left is greater.','Move the boundary left and repeat until no unsorted part remains.','Return the row with every original value preserved.'],connections:['neighbors → indexes i and i + 1','exchange → temporary value','one pass → inner loop','all passes → outer loop']},
  stack: {concept:'Last in, first out is a rule you can use in a program.',observation:'Only the top container could move. A simpler related task uses that same restriction to reverse any incoming row.',task:'Reverse the cargo using a stack',exercise:'reverse-cargo',question:'If values arrive as [4, 8, 2], which one will leave first? Why?',steps:['Create an empty stack and an empty result.','Push each incoming value onto the stack.','While the stack is not empty, pop its top into the result.','Return the result after the stack is empty.'],connections:['container arrives → push','top container leaves → pop','spare storage → stack','reverse arrival order → LIFO']},
};
export const RELATED_MISSIONS: Record<string, {id:string;why:string}[]> = {
  add:[{id:'larger',why:'Keep two inputs; replace addition with a decision.'}],
  larger:[{id:'sum-to',why:'Make the next step from one decision to repeated work.'}],
  'sum-to':[{id:'trace-route',why:'Reuse a loop while remembering two changing values.'}],
  'trace-route':[{id:'sum-to',why:'Keep the repetition; change what the loop accumulates.'},{id:'sum-array',why:'Process any row, not only direction codes.'}],
  'sum-array':[{id:'max-scan',why:'Visit the same row; remember the largest value instead of a total.'},{id:'rotate-left',why:'Move from reading values to updating their positions safely.'}],
  'rotate-left':[{id:'max-scan',why:'Can you inspect every value without moving any of them?'},{id:'sum-array',why:'Reuse traversal with a different result to remember.'}],
  'max-scan':[{id:'count-above',why:'Independent transfer: combine a traversal, a condition, and a count.'}],
  'binary-search':[{id:'find-index',why:'Remove sorted order. Which part of your strategy stops being valid?'}],
  'find-index':[{id:'binary-search',why:'Add sorted order. Can comparisons rule out more than one position?'}],
  'sort-array':[{id:'max-scan',why:'Find the largest value without sorting the entire row.'}],
  'reverse-cargo':[{id:'top-after',why:'Predict what remains after only some top items are removed.'}],
  'top-after':[{id:'reverse-cargo',why:'Use repeated top removals to build a new row.'}],
};

export function moveStep(order:number[],from:number,to:number):number[]{
  if(from<0||to<0||from>=order.length||to>=order.length)return order;
  const next=[...order];const [step]=next.splice(from,1);next.splice(to,0,step);return next;
}
export function validStepOrder(order:number[],length:number):boolean{return order.length===length&&order.every((step,index)=>step===index);}
