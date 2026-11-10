import type { CodeCase, Exercise, Language } from './curriculum';

export type ArcadeId = 'courier' | 'dock' | 'vault' | 'signal' | 'arena';
export const WALLS = [10, 11, 24];
export const BEACONS = [15, 29, 20];
export function landing(position: number, command: number) {
  const x = position % 7, y = Math.floor(position / 7);
  const nx = x + Number(command === 2) - Number(command === 4);
  const ny = y + Number(command === 3) - Number(command === 1);
  const next = ny * 7 + nx;
  return nx < 0 || nx >= 7 || ny < 0 || ny >= 5 || WALLS.includes(next) ? position : next;
}
export function routeOf(commands: number[]) { let position = 17; return commands.map(command => position = landing(position, command)); }
export function loadOf(values: number[], capacity: number) { const loaded: number[] = []; let remaining = capacity; for (const weight of values) if (weight > 0 && weight <= remaining) { loaded.push(weight); remaining -= weight; } return loaded; }
export function mergePlayedCase(exercise:Exercise,evidence:{args:(number|number[])[];expected:number|number[]}|null):CodeCase[] {
  if(!evidence)return exercise.cases;
  const key=JSON.stringify(evidence.args),known=exercise.cases.find(test=>JSON.stringify(test.args)===key);
  return [{args:evidence.args,expected:known?.expected??evidence.expected,label:'Your played example'},...exercise.cases.filter(test=>JSON.stringify(test.args)!==key)];
}
export function streakOf(values: number[], accepts = (value: number) => value > 0) {
  let start = -1, bestStart = -1, bestEnd = -1;
  for (let i = 0; i < values.length; i++) {
    if (!accepts(values[i])) { start = -1; continue; }
    if (start < 0) start = i;
    if (i - start + 1 > bestEnd - bestStart + Number(bestStart >= 0)) { bestStart = start; bestEnd = i; }
  }
  return [bestStart, bestEnd];
}
const py = (args: string, body: string) => `def solve(${args}):\n${body}\n`;
const java = (args: string, body: string, type = 'int[]') => `public class Solution {\n  public static ${type} solve(${args}) {\n${body}\n  }\n}\n`;
const c = (values: number[], expected: number | number[], label: string, target?: number): CodeCase => ({ args: target === undefined ? [values] : [values, target], expected, label });
function exercise(id: string, title: string, brief: string, kind: Exercise['kind'], example: Record<Language, string>, cases: CodeCase[], hint: string, independent = false): Exercise {
  const arrayResult = Array.isArray(cases[0].expected);
  return { id, title, unit: 'arrays', brief, contract: `solve(values${kind === 'target' ? id==='find-index'?', target':', limit' : ''}) → ${arrayResult ? 'list / int[]' : 'whole number'}. ${brief}`, kind, hint, independent,
    starter: { python: py(kind === 'target' ? 'values, limit' : 'values', '    # Build your solution.\n    pass'), java: java(kind === 'target' ? 'int[] values, int limit' : 'int[] values', '    // Build your solution.\n    return ' + (arrayResult ? 'new int[0];' : '0;'), arrayResult ? 'int[]' : 'int') }, example, cases };
}
const routeExample = {
  python: py('values', '    walls = [10, 11, 24]\n    x, y = 3, 2\n    result = []\n    for command in values:\n        nx, ny = x, y\n        if command == 1: ny -= 1\n        elif command == 2: nx += 1\n        elif command == 3: ny += 1\n        elif command == 4: nx -= 1\n        if 0 <= nx < 7 and 0 <= ny < 5 and ny * 7 + nx not in walls:\n            x, y = nx, ny\n        result.append(y * 7 + x)\n    return result'),
  java: java('int[] values', '    int x = 3, y = 2;\n    int[] result = new int[values.length];\n    for (int i = 0; i < values.length; i++) {\n      int nx = x, ny = y;\n      int command = values[i];\n      if (command == 1) ny--;\n      else if (command == 2) nx++;\n      else if (command == 3) ny++;\n      else if (command == 4) nx--;\n      int cell = ny * 7 + nx;\n      if (nx >= 0 && nx < 7 && ny >= 0 && ny < 5 && cell != 10 && cell != 11 && cell != 24) { x = nx; y = ny; }\n      result[i] = y * 7 + x;\n    }\n    return result;')
};
const dockExample = {
  python: py('values, limit', '    remaining = limit\n    loaded = []\n    for weight in values:\n        if weight > 0 and weight <= remaining:\n            loaded.append(weight)\n            remaining -= weight\n    return loaded'),
  java: java('int[] values, int limit', '    int remaining = limit, count = 0;\n    int[] loaded = new int[values.length];\n    for (int weight : values) {\n      if (weight > 0 && weight <= remaining) { loaded[count++] = weight; remaining -= weight; }\n    }\n    return java.util.Arrays.copyOf(loaded, count);')
};
const reverseExample = {
  python: py('values', '    left, right = 0, len(values) - 1\n    while left < right:\n        values[left], values[right] = values[right], values[left]\n        left += 1\n        right -= 1\n    return values'),
  java: java('int[] values', '    int left = 0, right = values.length - 1;\n    while (left < right) {\n      int saved = values[left];\n      values[left] = values[right];\n      values[right] = saved;\n      left++; right--;\n    }\n    return values;')
};
const streakExample = {
  python: py('values', '    start = -1\n    best_start, best_end = -1, -1\n    for i in range(len(values)):\n        if values[i] <= 0:\n            start = -1\n        else:\n            if start == -1: start = i\n            if i - start + 1 > best_end - best_start + (1 if best_start >= 0 else 0):\n                best_start, best_end = start, i\n    return [best_start, best_end]'),
  java: java('int[] values', '    int start = -1, bestStart = -1, bestEnd = -1;\n    for (int i = 0; i < values.length; i++) {\n      if (values[i] <= 0) start = -1;\n      else {\n        if (start == -1) start = i;\n        int bestLength = bestStart < 0 ? 0 : bestEnd - bestStart + 1;\n        if (i - start + 1 > bestLength) { bestStart = start; bestEnd = i; }\n      }\n    }\n    return new int[]{bestStart, bestEnd};')
};
const routeInputs = [[4,4,3,3,2,2,2,2,2,1,1], [1,2,2,3,4], [], [4,4,4,4,4], [3,3,3,2,2,2,2], [9,0,1,4]];
const dockInputs: [number[],number][] = [[[4,7,2,-1,3,1],10], [[8,2,3,1],6], [[],5], [[0,-3,4],0], [[2,2,2,2],5], [[9,1,1,4],7]];
const mirrorInputs = [[4,8,2,9,5],[3,1,3,8],[],[7],[2,2],[-1,0,4,8]];
const streakInputs = [[2,4,0,8,3,2,-1,5],[0,-1,0],[],[5],[1,2,0,4,5],[0,4,5,6]];
export const QUEST_PROBLEMS: Exercise[] = [
  exercise('quest-courier','Keep the patrol on the map','Use a 7×5 grid. Start at x=3, y=2 (cell 17). Commands 1=N, 2=E, 3=S, 4=W. Ignore other commands. Walls are cells 10, 11, 24. A blocked or out-of-bounds move stays put. Return the cell y*7+x after every command.', 'array', routeExample, routeInputs.map((v,i)=>c(v,routeOf(v),['The beacon route','Walls in the way','No commands','Map boundary','Blocked and free moves','Unknown commands'][i])), 'Keep old coordinates until a proposed move passes both the boundary and wall checks.'),
  exercise('quest-dock','Load the next crate that fits','Visit weights in order. Load every positive weight that fits the remaining capacity. Skip zero, negative, or too-heavy weights. Decrease capacity only after loading. Return the loaded weights in order.', 'target', dockExample, dockInputs.map(([v,n],i)=>c(v,loadOf(v,n),['A changing capacity','Skip the heavy crate','Empty belt','No room','Repeated weights','A late crate fits'][i],n)), 'Remember remaining capacity. A skipped crate does not change it.'),
  exercise('quest-vault','Reverse the vault row','Return all values in reverse order, keeping duplicates and empty rows. Try swapping the two ends and moving the pointers inward.', 'array', reverseExample, mirrorInputs.map((v,i)=>c(v,[...v].reverse(),['Odd vault','Repeated key','Empty vault','One key','Equal keys','Mixed keys'][i])), 'Save a value before overwriting it. Stop when the pointers meet or cross.'),
  exercise('quest-signal','Find the strongest signal chain','Positive readings form a continuous chain. Zero or negative readings break it. Return [start, end] for the longest chain, including both indexes. Keep the earliest chain on a tie. Return [-1,-1] when none exists.', 'array', streakExample, streakInputs.map((v,i)=>c(v,streakOf(v),['Separated chains','Only interference','Empty signal','One reading','Equal chains','Chain at the end'][i])), 'Keep the current start and the best start/end separately. Update the best only when the new chain is longer.'),
  exercise('quest-budget-left','A new cargo contract','Use the same loading rule: visit positive weights in order and load each one that fits. This time return the remaining capacity, not the selected weights.', 'target', {
    python: py('values, limit','    remaining = limit\n    for weight in values:\n        if 0 < weight <= remaining:\n            remaining -= weight\n    return remaining'),
    java: java('int[] values, int limit','    int remaining = limit;\n    for (int weight : values) if (weight > 0 && weight <= remaining) remaining -= weight;\n    return remaining;','int')
  }, dockInputs.map(([v,n],i)=>c(v,n-loadOf(v,n).reduce((a,b)=>a+b,0),['Mixed belt','A skipped weight','Empty belt','Zero capacity','Repeated weights','Later small weights'][i],n)), '', true),
  exercise('quest-blocked-moves','Count rejected patrol moves','Use the same 7×5 map, start (3,2), and walls 10,11,24. Count only valid-direction commands whose proposed move is blocked by a wall or edge. Ignore unknown commands. Return the count.', 'array', {
    python: routeExample.python.replace('result = []','rejected = 0').replace('        result.append(y * 7 + x)','        elif command in [1, 2, 3, 4]:\n            rejected += 1').replace('return result','return rejected'),
    java: routeExample.java.replace('int[] result = new int[values.length];','int rejected = 0;').replace('      result[i] = y * 7 + x;','      else if (command >= 1 && command <= 4) rejected++;').replace('return result;','return rejected;').replace('static int[] solve','static int solve')
  }, routeInputs.map((v,i)=>{let p=17,blocked=0;for(const cmd of v){const n=landing(p,cmd);if(n===p&&cmd>=1&&cmd<=4)blocked++;p=n;}return c(v,blocked,['Patrol','Walls','Empty orders','Edge','Lower edge','Unknown orders'][i]);}), '', true),
  exercise('quest-pair-swap','Swap neighboring keys','Swap positions 0 and 1, then 2 and 3, and so on. Leave an unpaired final key where it is. Return the changed row.', 'array', {
    python: py('values','    for i in range(0, len(values) - 1, 2):\n        values[i], values[i + 1] = values[i + 1], values[i]\n    return values'),
    java: java('int[] values','    for (int i = 0; i + 1 < values.length; i += 2) {\n      int saved = values[i]; values[i] = values[i + 1]; values[i + 1] = saved;\n    }\n    return values;')
  },mirrorInputs.map((v,i)=>{const out=[...v];for(let n=0;n+1<out.length;n+=2)[out[n],out[n+1]]=[out[n+1],out[n]];return c(v,out,['Odd length','Repeated values','Empty row','One key','Equal keys','Even length'][i]);}), '', true),
  exercise('quest-low-chain','Track a quiet interval','Return the length of the longest continuous run of readings strictly below limit. A reading equal to limit breaks the run. Empty input returns 0.', 'target', {
    python: py('values, limit','    current = 0\n    best = 0\n    for value in values:\n        current = current + 1 if value < limit else 0\n        if current > best: best = current\n    return best'),
    java: java('int[] values, int limit','    int current = 0, best = 0;\n    for (int value : values) { current = value < limit ? current + 1 : 0; if (current > best) best = current; }\n    return best;','int')
  }, [c([2,1,5,2,3,1],3,'Strict threshold',4),c([],0,'Empty',2),c([3,3],0,'Equal breaks',3),c([-2,-1,0],2,'Negative readings',0),c([1],1,'One reading',2),c([5,1,2,3],3,'Run at the end',4)], '', true)
];
export interface ArcadeGame {id:ArcadeId;title:string;subtitle:string;concept:string;exerciseId:string;transferId:string;brief:string;subgoals:string[];}
export const ARCADE_GAMES: ArcadeGame[] = [
  {id:'courier',title:'Knightmare Courier',subtitle:'Pilot first. Program the controller.',concept:'State · conditions · loops',exerciseId:'quest-courier',transferId:'quest-blocked-moves',brief:'Collect the three beacons. The moves you make become a test for your controller.',subgoals:['Remember the current position','Propose one move','Keep it only when the map allows it','Record the landing cell']},
  {id:'dock',title:'Black Knights Cargo',subtitle:'A conveyor. A changing capacity. Your rules.',concept:'Filtering · arrays · state',exerciseId:'quest-dock',transferId:'quest-budget-left',brief:'Load the belt in order. Every valid crate that fits must travel. The ship has limited room.',subgoals:['Remember remaining capacity','Inspect the next weight','Load it only when it fits','Return the loaded row']},
  {id:'vault',title:'Mirror Vault',subtitle:'Open the vault with as few swaps as possible.',concept:'Indexes · temporary values · two pointers',exerciseId:'quest-vault',transferId:'quest-pair-swap',brief:'Reverse the key row. Select two slots to swap. You have floor(length / 2) swaps.',subgoals:['Start at the two ends','Save a value before replacing it','Swap and move inward','Return the row']},
  {id:'signal',title:'Signal Siege',subtitle:'Find a chain that interference cannot break.',concept:'Loop state · ranges · ties',exerciseId:'quest-signal',transferId:'quest-low-chain',brief:'Select the first and last reading of the longest positive chain. On a tie, keep the earlier one.',subgoals:['Remember the current chain start','Reset at interference','Save a longer chain','Return its inclusive indexes']},
  {id:'arena',title:'Counterexample Arena',subtitle:'Break the bug. Then repair the program.',concept:'Test design · boundaries · debugging',exerciseId:'find-index',transferId:'practice-last-match',brief:'Three drones hide three different search bugs. Design an input that exposes each one, then repair its real code.',subgoals:['Read the promised result','Choose an input that separates correct and wrong behavior','Run the evidence','Repair and test the function']}
];
export interface BugDrone { id:string;name:string;claim:string;source:Record<Language,string>;witness:{values:number[];target:number;expected:number}; }
export const BUG_DRONES: BugDrone[] = [
  {id:'early',name:'The impatient drone',claim:'Return the first matching index, or -1 if the target is absent.',source:{python:py('values, target','    for i in range(len(values)):\n        if values[i] == target:\n            return i\n        return -1\n    return -1'),java:java('int[] values, int target','    for (int i = 0; i < values.length; i++) {\n      if (values[i] == target) return i;\n      return -1;\n    }\n    return -1;','int')},witness:{values:[2,9],target:9,expected:1}},
  {id:'last',name:'The forgetful drone',claim:'Return the first matching index, even when values repeat.',source:{python:py('values, target','    found = -1\n    for i in range(len(values)):\n        if values[i] == target:\n            found = i\n    return found'),java:java('int[] values, int target','    int found = -1;\n    for (int i = 0; i < values.length; i++) if (values[i] == target) found = i;\n    return found;','int')},witness:{values:[4,4],target:4,expected:0}},
  {id:'edge',name:'The short-sighted drone',claim:'Search the entire row, including its final slot.',source:{python:py('values, target','    for i in range(len(values) - 1):\n        if values[i] == target:\n            return i\n    return -1'),java:java('int[] values, int target','    for (int i = 0; i < values.length - 1; i++) if (values[i] == target) return i;\n    return -1;','int')},witness:{values:[7],target:7,expected:0}}
];
export function firstMatch(args:(number|number[])[]) { return (args[0] as number[]).indexOf(args[1] as number); }
export const ARENA_EXERCISE = exercise('find-index','Find the first matching signal','Return the first index equal to the target. Return -1 when absent. Search the entire row and keep the first match.', 'target', {
  python:py('values, target','    for i in range(len(values)):\n        if values[i] == target:\n            return i\n    return -1'),
  java:java('int[] values, int target','    for (int i = 0; i < values.length; i++) if (values[i] == target) return i;\n    return -1;','int')
},[c([2,9],1,'A later match',9),c([4,4],0,'Keep the first',4),c([7],0,'The final slot',7),c([],-1,'Empty row',2),c([2,3],-1,'Target absent',8),c([-2,0,5],0,'Negative target',-2)],'An unsuccessful first comparison does not prove that the target is absent.');
export const ARCADE_FRAMES:Record<Exclude<ArcadeId,'arena'>,Record<Language,string>> = {
  courier:{python:py('values','    walls = [10, 11, 24]\n    x, y = 3, 2\n    result = []\n    for command in values:\n        # Propose a move. Check it. Record the landing cell.\n        pass\n    return result'),java:java('int[] values','    int x = 3, y = 2;\n    int[] result = new int[values.length];\n    for (int i = 0; i < values.length; i++) {\n      int command = values[i];\n      // Propose a move. Check it. Record the cell in result[i].\n    }\n    return result;')},
  dock:{python:py('values, limit','    remaining = limit\n    loaded = []\n    for weight in values:\n        # Decide whether this weight travels. Update remaining room.\n        pass\n    return loaded'),java:java('int[] values, int limit','    int remaining = limit, count = 0;\n    int[] loaded = new int[values.length];\n    for (int weight : values) {\n      // Decide whether this weight travels. Store it and update room.\n    }\n    return java.util.Arrays.copyOf(loaded, count);')},
  vault:{python:py('values','    for left in range(len(values) // 2):\n        right = len(values) - 1 - left\n        # Swap the values without losing either one.\n        pass\n    return values'),java:java('int[] values','    for (int left = 0; left < values.length / 2; left++) {\n      int right = values.length - 1 - left;\n      // Swap the values without losing either one.\n    }\n    return values;')},
  signal:{python:py('values','    start = -1\n    best_start, best_end = -1, -1\n    for i in range(len(values)):\n        # Extend or reset the current chain. Keep a longer best chain.\n        pass\n    return [best_start, best_end]'),java:java('int[] values','    int start = -1, bestStart = -1, bestEnd = -1;\n    for (int i = 0; i < values.length; i++) {\n      // Extend or reset the current chain. Keep a longer best chain.\n    }\n    return new int[]{bestStart, bestEnd};')}
};
