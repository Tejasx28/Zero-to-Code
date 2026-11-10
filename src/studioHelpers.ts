import type { Exercise } from './curriculum';
import { PRACTICE_DETAILS } from './practiceContent';
export interface ParsedInput { args?: (number | number[])[]; error?: string }
export function parseCustomInput(text:string,kind:Exercise['kind']):ParsedInput {
  let value:unknown;
  try { value=JSON.parse(text); } catch { return {error:'Use a JSON list of inputs, such as [3, 4] or [[3, 8, 2]].'}; }
  const integer=(v:unknown):v is number=>typeof v==='number'&&Number.isSafeInteger(v)&&Math.abs(v)<=1000000;
  const array=(v:unknown):v is number[]=>Array.isArray(v)&&v.length<=60&&v.every(integer);
  if(!Array.isArray(value))return{error:'Wrap the function inputs in square brackets.'};
  const valid=kind==='pair'?value.length===2&&value.every(integer):kind==='single'?value.length===1&&integer(value[0]):kind==='array'?value.length===1&&array(value[0]):value.length===2&&array(value[0])&&integer(value[1]);
  if(!valid)return{error:kind==='pair'?'This function takes two whole numbers: [3, 4].':kind==='single'?'This function takes one whole number: [4].':kind==='array'?'This function takes one array: [[3, 8, 2]]. Keep arrays to 60 values.':'This function takes an array and a whole number: [[8, 3, 9], 3].'};
  return{args:value as (number|number[])[]};
}
export function diagnosticLine(error:string|undefined,language:'python'|'java'):number|null {
  if(!error)return null;
  const match=language==='java'?error.match(/Solution\.java:(\d+)/):error.match(/line (\d+)/);
  return match?Number(match[1]):null;
}
export function errorDirection(error:string,language:'python'|'java'):string {
  if(/indent/i.test(error))return 'Look at the spacing before this line. In Python, the lines in a function, loop, or condition must be indented together.';
  if(/';' expected|semicolon/i.test(error))return 'The compiler expected a semicolon. Check the end of the highlighted statement and the line immediately above it.';
  if(/SyntaxError|expected.*:|invalid syntax/i.test(error))return 'The computer could not read this instruction. Check the punctuation near the reported line before changing your algorithm.';
  if(/IndexError|ArrayIndexOutOfBounds/i.test(error))return 'An index reached beyond the row. For length n, the valid positions are 0 through n − 1. Which boundary did this input reveal?';
  if(/NameError|cannot find symbol/i.test(error))return 'A name is not defined where it is used. Check spelling, capitalization, and whether you created it before this line.';
  if(/TypeError|incompatible types/i.test(error))return 'The values have different shapes or types than this operation expects. Check whether you are using a whole number, an array, or a returned value.';
  if(/too many steps|never ends|execution stopped/i.test(error))return 'Trace how your loop changes its condition. What becomes different after each repetition, and what makes it stop?';
  if(/NoSuchMethod|solve|public static/i.test(error))return language==='java'?'Keep the public class Solution and the public static solve signature from the starter. The tests call that method with the listed input types.':'Keep a function named solve with the inputs shown in the contract. The tests call it and inspect its returned value.';
  return 'Start with the first reported error. Describe what you expected this line to do, then compare that idea with the input and the actual result.';
}
export function hintLadder(exercise:Exercise):string[] {
  const questions:Record<string,string[]>={
    add:['If each team has a separate count, what operation combines them without losing either contribution?','Try the smallest input, including a zero. Which value should be sent back to the caller?'],
    larger:['What comparison tells you which pack is larger? What if both values are equal?','Walk through both possible paths. Does every path send a result back?'],
    'sum-to':['Write the values you would visit when n is 4. What information must survive between visits?','How could you keep a running total? Where should you return so every checkpoint contributes?'],
    'sum-array':['If the row is empty, what total makes sense before you have visited anything?','Pretend you are the loop: visit one value, update your total, then move on. Which statement belongs after all visits?'],
    'find-index':['You need a position, not just a value. How will you keep track of where you are?','If the first item does not match, are you allowed to conclude the target is absent? What must you inspect first?'],
    'sort-array':['Compare two neighbors on paper. When are they in the wrong order, and how can you exchange them without losing a value?','After one pass, which value is guaranteed to be in place? Which part of the row still needs work?'],
    'top-after':['Point to the top before removing anything. How does its index change after each removal?','What should happen if the removal count reaches or exceeds the number of values?'],
    'trace-route':['What two values describe a position? Which direction changes each one?','Trace [2, 2, 1] from [0, 0]. How could a condition inside a loop update x or y for every code?'],
    'rotate-left':['Which value disappears if you overwrite the first slot before remembering it?','Try [8, 3, 5] on paper. Where will each value go, and which one needs a temporary home?'],
    'binary-search':['What does a middle value smaller than the target prove about the candidates to its left?','After ruling out a half, how must low or high change so the same middle is not checked forever?'],
    'max-scan':['What should you remember after visiting the first value? Would starting at zero work for an all-negative row?','Try [-5, -2, -8]. When does the best value change? What will you return if there are no values?'],
    'reverse-cargo':['Which value will leave first if only the top of a stack can be removed?','Push [4, 8, 2] in that order. Trace each pop into a new result. When is the work finished?'],
  };
  return[...(questions[exercise.id]??PRACTICE_DETAILS.find(item=>item.id===exercise.id)?.questions??['What information do you need to keep while inspecting the input?','Trace one small input before writing more code.']),exercise.hint];
}

export const CODING_MISSION_GROUPS=[
  {label:'Basics & conditions',ids:['add','larger']},
  {label:'Loops & sequences',ids:['sum-to','trace-route']},
  {label:'Arrays & updates',ids:['sum-array','rotate-left','max-scan']},
  {label:'Independent check',ids:['count-above']},
];
export const ALLOWED_CODING_IDS=CODING_MISSION_GROUPS.flatMap(group=>group.ids);
export interface BrainstormPrompt {id:'input'|'state'|'steps';label:string;question:string;placeholder:string}
export function brainstormPrompts(exercise:Exercise):BrainstormPrompt[] {
  const questions:Record<string,[string,string,string]>={
    add:['Which two input names does solve receive? Which value must it give back to the caller?','Do you need to keep an intermediate value, or can you return one expression?','What instruction will combine the two inputs, and what instruction sends the result back?'],
    larger:['What should happen when a is larger, when b is larger, and when they are equal?','Which comparison will decide which input becomes the answer?','Write the two branches in words. Does every possible path return a value?'],
    'sum-to':['For n = 4, which checkpoint numbers must the loop visit? Does your range include n?','What will hold the running total between one checkpoint and the next?','When should the total change, and where should return go so all checkpoints are visited?'],
    'trace-route':['What do direction codes 1, 2, 3, and 4 mean? Where does the robot start?','Which two values describe the current position? Which directions change each value?','For each command, how will a condition choose which coordinate to update? What do you return after all commands?'],
    'sum-array':['What inputs can this row contain? What result makes sense for an empty row?','What value should the total have before the first item, and how will it change after a visit?','Describe one repetition, then say where return belongs relative to the loop.'],
    'rotate-left':['Which item moves to the end, and which relative order must stay the same?','Which value must you save before its original position is overwritten?','Which direction will you traverse the row while shifting? Where does the saved value go last?'],
    'max-scan':['How should empty input behave? How would an all-negative row challenge your first guess?','After visiting one value, what does “best so far” mean? Which input value can initialize it?','During each visit, what condition updates the best value? What happens if no update is needed?'],
  };
  const own:[string,string,string]=['Restate the given inputs and required output in your own words.','Decide what information your solution will keep while it works.','Outline your own steps. These notes are not checked or suggested by the guide.'];
  const practice=PRACTICE_DETAILS.find(item=>item.id===exercise.id);
  const prompts=exercise.independent?own:(questions[exercise.id]??(practice?[`What inputs and output does “${exercise.title}” promise?`,...practice.questions] as [string,string,string]:own));
  return [
    {id:'input',label:'Inputs',question:prompts[0],placeholder:'The function receives…\nIt must return…'},
    {id:'state',label:'Remember',question:prompts[1],placeholder:'While the code runs, I need to remember…'},
    {id:'steps',label:'Steps',question:prompts[2],placeholder:'First…\nFor each…\nFinally…'},
  ];
}
