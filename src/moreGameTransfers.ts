import type { CodeCase, Exercise, Language } from './curriculum';

/** Independent coding contracts for the five v0.9 arcade worlds. No hints or completed code in the editor. */
const py = (args:string,body:string)=>`def solve(${args}):\n${body}\n`;
const java = (args:string,body:string,type:'int'|'int[]'='int[]')=>
  `public class Solution {\n  public static ${type} solve(${args}) {\n${body}\n  }\n}`;
const row = (args:(number|number[])[], expected:number|number[], label:string):CodeCase=>({args,expected,label});
const make = (id:string,title:string,brief:string,kind:'array'|'target',examples:Record<Language,string>,cases:CodeCase[]):Exercise=>({
  id,title,unit:'arrays',kind,brief,contract:`${kind==='target'?'solve(values, target)':'solve(values)'} → ${Array.isArray(cases[0].expected)?'list / int[]':'whole number'}. ${brief}`,
  hint:'',independent:true,
  starter:{python:kind==='target'?'def solve(values, target):\n    # Build your independent solution.\n    pass\n':'def solve(values):\n    # Build your independent solution.\n    pass\n',
    java:java(kind==='target'?'int[] values, int target':'int[] values',`    // Build your independent solution.\n    return ${Array.isArray(cases[0].expected)?'new int[0]':'0'};`,Array.isArray(cases[0].expected)?'int[]':'int')},
  example:examples,cases,
});

export function transferAnswer(id:string,values:number[],target=0):number|number[]{
  if(id==='quest-stack-departures'){
    const waiting:number[]=[],departed:number[]=[];
    for(const value of values){if(value>0)waiting.push(value);else if(value<0&&waiting.length)departed.push(waiting.pop()!);}
    return departed;
  }
  if(id==='quest-queue-waiting'){
    const waiting:number[]=[];
    for(const value of values){if(value>0)waiting.push(value);else if(value<0&&waiting.length)waiting.shift();}
    return waiting;
  }
  if(id==='quest-binary-insertion'){
    let low=0,high=values.length;
    while(low<high){const mid=low+Math.floor((high-low)/2);if(values[mid]<target)low=mid+1;else high=mid;}
    return low;
  }
  if(id==='quest-highest-prefix'){
    let running=0,best=0;
    for(const v of values){running+=v;best=Math.max(best,running);}
    return best;
  }
  if(id==='quest-one-sort-pass'){
    const result=[...values];
    for(let i=0;i+1<result.length;i++)if(result[i]>result[i+1])[result[i],result[i+1]]=[result[i+1],result[i]];
    return result;
  }
  throw new Error(`Unknown independent game contract: ${id}`);
}

const sequenceCases:[number[],string][]=[
  [[3,8,-1,2,-1,-1],'Multiple departures'],
  [[7,2,-1,9],'A later arrival'],
  [[], 'Empty orders'],
  [[-1,0,-1,4,-1],'Empty departures and zero'],
  [[5,5,-1,3,-1],'Repeated IDs'],
  [[-2,9,1,-1,4],'Ignore invalid departures'],
];
const sortedCases:[number[],number,string][]=[
  [[1,4,7,10],5,'Insert inside'],
  [[1,4,7],4,'Existing value'],
  [[],8,'Empty row'],
  [[-5,-1,0],-9,'Before all'],
  [[2,2,2,5],2,'Before repeated values'],
  [[-2,1,3,9],20,'After all'],
];
const numericCases:[number[],string][]=[
  [[4,-2,5,-8,6],'Peak before the finish'],
  [[-4,-2,-1],'All negative'],
  [[], 'Empty readings'],
  [[0,0,5],'Zeros and a peak'],
  [[3,-3,3,-3],'Repeated peaks'],
  [[-7,2,8,-1],'Late recovery'],
];
const sortCases:[number[],string][]=[
  [[5,2,4,1,3],'One pass only'],
  [[2,1,3],'Single inversion'],
  [[], 'Empty row'],
  [[-1,-4,0],'Negative numbers'],
  [[3,3,2,2],'Repeated values'],
  [[7], 'Single value'],
];

export const MORE_TRANSFER_EXERCISES:Exercise[]=[
  make('quest-stack-departures','Recover the launched rescue pods','Apply the same stack rule, but return every launched pod ID in launch order, rather than the pods still waiting. Ignore zero and empty departures.','array',{
    python:py('values','    waiting = []\n    departed = []\n    for code in values:\n        if code > 0:\n            waiting.append(code)\n        elif code < 0 and waiting:\n            departed.append(waiting.pop())\n    return departed'),
    java:java('int[] values','    java.util.ArrayList<Integer> waiting = new java.util.ArrayList<>();\n    java.util.ArrayList<Integer> departed = new java.util.ArrayList<>();\n    for (int code : values) {\n      if (code > 0) waiting.add(code);\n      else if (code < 0 && !waiting.isEmpty()) departed.add(waiting.remove(waiting.size()-1));\n    }\n    return departed.stream().mapToInt(Integer::intValue).toArray();'),
  },sequenceCases.map(([v,label])=>row([v],transferAnswer('quest-stack-departures',v),label))),
  make('quest-queue-waiting','Who is still waiting?','Apply the same queue dispatch rule, but return the remaining IDs in their arrival order after all orders are processed. Departures remove the oldest waiting ID.','array',{
    python:py('values','    waiting = []\n    for code in values:\n        if code > 0:\n            waiting.append(code)\n        elif code < 0 and waiting:\n            waiting.pop(0)\n    return waiting'),
    java:java('int[] values','    java.util.ArrayDeque<Integer> waiting = new java.util.ArrayDeque<>();\n    for (int code : values) {\n      if (code > 0) waiting.addLast(code);\n      else if (code < 0 && !waiting.isEmpty()) waiting.removeFirst();\n    }\n    return waiting.stream().mapToInt(Integer::intValue).toArray();'),
  },sequenceCases.map(([v,label])=>row([v],transferAnswer('quest-queue-waiting',v),label))),
  make('quest-binary-insertion','Find the insertion point','A sorted row can contain duplicates. Return the first index where target could be inserted while keeping sorted order. If target exists, return its first position.','target',{
    python:py('values, target','    low, high = 0, len(values)\n    while low < high:\n        mid = (low + high) // 2\n        if values[mid] < target:\n            low = mid + 1\n        else:\n            high = mid\n    return low'),
    java:java('int[] values, int target','    int low = 0, high = values.length;\n    while (low < high) {\n      int mid = low + (high - low)/2;\n      if (values[mid] < target) low = mid+1;\n      else high = mid;\n    }\n    return low;','int'),
  },sortedCases.map(([v,target,label])=>row([v,target],transferAnswer('quest-binary-insertion',v,target),label))),
  make('quest-highest-prefix','Find the highest energy reached','Process readings in order. Start energy at zero, then return the highest running total ever reached (including the starting zero). Empty input returns zero.','array',{
    python:py('values','    running = 0\n    best = 0\n    for value in values:\n        running += value\n        if running > best:\n            best = running\n    return best'),
    java:java('int[] values','    int running = 0, best = 0;\n    for (int value : values) {\n      running += value;\n      if (running > best) best = running;\n    }\n    return best;','int'),
  },numericCases.map(([v,label])=>row([v],transferAnswer('quest-highest-prefix',v),label))),
  make('quest-one-sort-pass','Repair one sorting pass','Perform exactly one left-to-right pass of neighboring comparisons, swapping out-of-order neighbors. Return the row after that single pass, not a fully sorted row.','array',{
    python:py('values','    result = list(values)\n    for i in range(len(result)-1):\n        if result[i] > result[i+1]:\n            result[i], result[i+1] = result[i+1], result[i]\n    return result'),
    java:java('int[] values','    int[] result = values.clone();\n    for (int i = 0; i+1 < result.length; i++) {\n      if (result[i] > result[i+1]) {\n        int saved = result[i]; result[i] = result[i+1]; result[i+1] = saved;\n      }\n    }\n    return result;'),
  },sortCases.map(([v,label])=>row([v],transferAnswer('quest-one-sort-pass',v),label))),
];
