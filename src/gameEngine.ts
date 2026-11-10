import type { GameId } from './curriculum';
export type Direction = 'up' | 'right' | 'down' | 'left';
export type RobotCommand = { direction: Direction; repeat: number };
type Base = { round: number; moves: number; done: boolean; failed: boolean; message: string };
export interface RobotBoard extends Base { kind:'robot'; x:number;y:number; program:RobotCommand[]; cursor:number; collected:string[]; started:boolean }
export interface ArrayBoard extends Base { kind:'array'; slots:(number|null)[]; selected:number; buffer:number|null; inserted:boolean; deleted:boolean }
export interface SearchBoard extends Base { kind:'search';low:number;high:number;probe:number|null;revealed:number[] }
export interface SortBoard extends Base { kind:'sort';values:number[];index:number;end:number;passes:number }
export interface StackBoard extends Base { kind:'stack';stacks:number[][];selected:number|null }
export type GameBoard = RobotBoard|ArrayBoard|SearchBoard|SortBoard|StackBoard;
export type GameAction = {type:'append';direction:Direction;repeat:number}|{type:'remove-command';index:number}|{type:'step'}|{type:'edit'}|{type:'select';index:number}|{type:'shift';direction:-1|1}|{type:'write'}|{type:'delete'}|{type:'pickup'}|{type:'place'}|{type:'probe';index:number}|{type:'discard';side:'left'|'right'}|{type:'absent'}|{type:'compare';swap:boolean}|{type:'stack';index:number};
export const ROBOT_LEVELS = [
  {map:['#######','#S.*..#','#...#.#','#*..#E#','#.....#','#######'],slots:9,steps:22},
  {map:['########','#S..#.*#','#.#.#..#','#.*...E#','#...#..#','########'],slots:10,steps:26},
  {map:['########','#S...*.#','#.##.#.#','#.*..#E#','#......#','########'],slots:11,steps:30},
];
export const ARRAY_LEVELS = [
  {initial:[4,8,2,9,null,null],goal:[4,7,8,2,9,null],insert:7,remove:null,budget:4,instruction:'Insert 7 at index 1. Preserve the order of the original cargo. Shift right from the end before writing into the gap.'},
  {initial:[6,3,8,1,5,null],goal:[6,3,1,5,null,null],insert:null,remove:8,budget:3,instruction:'Delete the 8 at index 2, then close the gap by shifting the following values left. Leave no gaps in the cargo.'},
  {initial:[9,2,7,4,null,null],goal:[2,7,4,9,null,null],insert:null,remove:null,budget:5,instruction:'Rotate the first value, 9, to the end. Use the temporary register to hold one value while the others shift left.'},
];
export const SEARCH_LEVELS = [
  {values:[3,6,9,14,18,25,31,40,44,52,60,67,75,81,90],target:44,budget:4},
  {values:[2,5,8,11,14,17,20,23,26,29,32],target:19,budget:4},
  {values:[1,4,4,7,9,12,12,15,19,19,22,26,30],target:19,budget:4},
];
export const SORT_LEVELS = [[7,3,5,1],[4,-2,4,0,3],[9,8,3,5,2]];
export const STACK_LEVELS = [
  {initial:[[3,1,2],[],[]],goal:[1,2,3],capacity:3,budget:8},
  {initial:[[4,2],[1,3],[]],goal:[1,2,3,4],capacity:4,budget:12},
  {initial:[[5,1],[4,2,3],[]],goal:[1,2,3,4,5],capacity:5,budget:16},
];
export function newBoard(kind:GameId,round=0):GameBoard {
  const base:Base={round,moves:0,done:false,failed:false,message:'Make a plan, then try it. Restarting is part of learning.'};
  if(kind==='robot'){const map=ROBOT_LEVELS[round].map;const y=map.findIndex(row=>row.includes('S'));return{...base,kind,x:map[y].indexOf('S'),y,program:[],cursor:0,collected:[],started:false};}
  if(kind==='array')return{...base,kind,slots:[...ARRAY_LEVELS[round].initial],selected:0,buffer:null,inserted:false,deleted:false};
  if(kind==='search')return{...base,kind,low:0,high:SEARCH_LEVELS[round].values.length-1,probe:null,revealed:[]};
  if(kind==='sort')return{...base,kind,values:[...SORT_LEVELS[round]],index:0,end:SORT_LEVELS[round].length-1,passes:0};
  return{...base,kind,stacks:STACK_LEVELS[round].initial.map(row=>[...row]),selected:null};
}
function note<T extends GameBoard>(board:T,message:string):T{return{...board,message};}
export function expandedProgram(program:RobotCommand[]):Direction[]{return program.flatMap(c=>Array<Direction>(c.repeat).fill(c.direction));}
export function validBoard(value:unknown):value is GameBoard {
  if(!value||typeof value!=='object')return false;
  const b=value as GameBoard;
  if(!['robot','array','search','sort','stack'].includes(b.kind)||!Number.isInteger(b.round)||b.round<0||b.round>2||!Number.isInteger(b.moves)||b.moves<0||typeof b.done!=='boolean'||typeof b.failed!=='boolean'||typeof b.message!=='string')return false;
  const integers=(a:unknown):a is number[]=>Array.isArray(a)&&a.every(Number.isInteger);
  if(b.kind==='robot')return Number.isInteger(b.x)&&Number.isInteger(b.y)&&b.x>=0&&b.x<ROBOT_LEVELS[b.round].map[0].length&&b.y>=0&&b.y<ROBOT_LEVELS[b.round].map.length&&Array.isArray(b.program)&&b.program.length<=ROBOT_LEVELS[b.round].slots&&b.program.every(c=>c&&['up','right','down','left'].includes(c.direction)&&Number.isInteger(c.repeat)&&c.repeat>=1&&c.repeat<=4)&&Number.isInteger(b.cursor)&&b.cursor>=0&&Array.isArray(b.collected)&&b.collected.every(v=>typeof v==='string')&&typeof b.started==='boolean';
  if(b.kind==='array')return Array.isArray(b.slots)&&b.slots.length===6&&b.slots.every(v=>v===null||Number.isInteger(v))&&Number.isInteger(b.selected)&&b.selected>=0&&b.selected<6&&(b.buffer===null||Number.isInteger(b.buffer))&&typeof b.inserted==='boolean'&&typeof b.deleted==='boolean';
  if(b.kind==='search')return Number.isInteger(b.low)&&Number.isInteger(b.high)&&b.low>=0&&b.low<=SEARCH_LEVELS[b.round].values.length&&b.high>=-1&&b.high<SEARCH_LEVELS[b.round].values.length&&(b.probe===null||(Number.isInteger(b.probe)&&b.probe>=0&&b.probe<SEARCH_LEVELS[b.round].values.length))&&integers(b.revealed);
  if(b.kind==='sort')return integers(b.values)&&b.values.length===SORT_LEVELS[b.round].length&&Number.isInteger(b.index)&&b.index>=0&&b.index<b.values.length-1&&Number.isInteger(b.end)&&b.end>=0&&b.end<b.values.length&&Number.isInteger(b.passes)&&b.passes>=0;
  return Array.isArray(b.stacks)&&b.stacks.length===3&&b.stacks.every(s=>integers(s)&&s.length<=STACK_LEVELS[b.round].capacity)&&(b.selected===null||(Number.isInteger(b.selected)&&b.selected>=0&&b.selected<3));
}
export function moveGame(board:GameBoard,action:GameAction):{board:GameBoard;mistake:boolean}{
  if(board.kind==='robot'&&action.type==='edit'){const next=newBoard('robot',board.round) as RobotBoard;return{board:{...next,program:board.program,message:'Route reset. Your program is ready to edit.'},mistake:false};}
  if(board.done||board.failed)return{board,mistake:false};
  const bad=(message:string)=>({board:note(board,message),mistake:true});
  const good=(next:GameBoard)=>({board:next,mistake:false});
  if(board.kind==='robot'){
    const level=ROBOT_LEVELS[board.round];
    if(action.type==='append'){
      if(board.started)return bad('Choose Edit program before changing a running route.');
      if(board.program.length>=level.slots)return bad('The program slots are full. Use a repeat to compress a straight path.');
      if(!Number.isInteger(action.repeat)||action.repeat<1||action.repeat>4)return bad('Repeat each command between 1 and 4 times.');
      return good({...board,program:[...board.program,{direction:action.direction,repeat:action.repeat}],message:'Command added. Repeats count as one program slot.'});
    }
    if(action.type==='remove-command'&&!board.started)return good({...board,program:board.program.filter((_,i)=>i!==action.index)});
    if(action.type==='edit'){const next=newBoard('robot',board.round) as RobotBoard;return good({...next,program:board.program,message:'Route reset. Your program is ready to edit.'});}
    if(action.type==='step'){
      const program=expandedProgram(board.program);const dir=program[board.cursor];
      if(!dir)return good({...board,started:true,message:'Program ended before the mission was complete. Edit the route, collect every cell, and finish on the exit.'});
      const offsets={up:[0,-1],right:[1,0],down:[0,1],left:[-1,0]};const [dx,dy]=offsets[dir];const x=board.x+dx,y=board.y+dy;
      if(!level.map[y]||level.map[y][x]==='#'||level.map[y][x]===undefined)return{board:{...board,started:true,failed:true,message:`Instruction ${board.cursor+1} hits a wall. Check the robot’s position before this move, then edit your program.`},mistake:true};
      const key=`${x},${y}`;const collected=level.map[y][x]==='*'?[...new Set([...board.collected,key])]:board.collected;
      const gems=level.map.join('').split('*').length-1;const done=collected.length===gems&&level.map[y][x]==='E'&&board.cursor+1===program.length;const moves=board.moves+1;
      return good({...board,x,y,collected,cursor:board.cursor+1,started:true,moves,done,failed:!done&&moves>=level.steps,message:done?'Every energy cell collected, exit reached. Your program worked.':`Instruction ${board.cursor+1}: move ${dir}. ${collected.length}/${gems} energy cells collected.${board.cursor+1===program.length?' Program finished. Edit to improve your route.':''}`});
    }
  }
  if(board.kind==='array'){
    const level=ARRAY_LEVELS[board.round];
    if(action.type==='select'&&action.index>=0&&action.index<board.slots.length)return good({...board,selected:action.index});
    const slots=[...board.slots];let buffer=board.buffer,inserted=board.inserted,deleted=board.deleted;
    if(action.type==='shift'){
      const to=board.selected+action.direction;if(to<0||to>=slots.length)return bad('That move would leave the array. Array indexes must stay inside its bounds.');
      if(slots[board.selected]===null)return bad('Select a cargo value to shift, not an empty slot.');
      if(slots[to]!==null)return bad('That slot is occupied. Shifting into it would overwrite cargo. Make a gap first.');
      slots[to]=slots[board.selected];slots[board.selected]=null;
    }else if(action.type==='write'){
      if(level.insert===null||inserted)return bad('This mission has no new cargo left to insert.');
      if(slots[board.selected]!==null)return bad('Writing here would lose the old value. Make the gap before inserting.');
      slots[board.selected]=level.insert;inserted=true;
    }else if(action.type==='delete'){
      if(level.remove===null||deleted||slots[board.selected]!==level.remove)return bad('Only the marked removal cargo can be deleted in this mission. Preserve everything else.');
      slots[board.selected]=null;deleted=true;
    }else if(action.type==='pickup'){
      if(buffer!==null)return bad('The temporary register already holds a value. Place it before picking up another.');
      if(slots[board.selected]===null)return bad('An empty slot has no cargo to pick up.');
      buffer=slots[board.selected];slots[board.selected]=null;
    }else if(action.type==='place'){
      if(buffer===null)return bad('The temporary register is empty.');if(slots[board.selected]!==null)return bad('Place cargo into an empty slot so no value is overwritten.');
      slots[board.selected]=buffer;buffer=null;
    }else return good(board);
    const moves=board.moves+1;const done=JSON.stringify(slots)===JSON.stringify(level.goal)&&buffer===null;
    return good({...board,slots,buffer,inserted,deleted,moves,done,failed:!done&&moves>=level.budget,message:done?'Cargo preserved, target layout reached. Notice the order in which values had to shift.':moves>=level.budget?'Move budget used. Restart and plan which gap you need first.':`Move ${moves}/${level.budget}. Compare your row with the target; preserve every unmarked value.`});
  }
  if(board.kind==='search'){
    const level=SEARCH_LEVELS[board.round];
    if(action.type==='probe'){
      if(board.probe!==null)return bad('Use this comparison to discard a half before spending another probe.');
      if(board.moves>=level.budget)return bad('No probes remain. Restart and narrow the range more efficiently.');
      if(action.index<board.low||action.index>board.high)return bad('That index has already been ruled out by the evidence.');
      const value=level.values[action.index];const done=value===level.target;
      return good({...board,probe:action.index,revealed:[...new Set([...board.revealed,action.index])],moves:board.moves+1,done,message:done?`Signal found at index ${action.index} in ${board.moves+1} probes.`:`Index ${action.index} holds ${value}. Compare it to target ${level.target}. Which half is impossible?`});
    }
    if(action.type==='discard'){
      if(board.probe===null)return bad('Probe one index first. You need evidence before discarding values.');
      const value=level.values[board.probe];const correct=value<level.target?'left':'right';
      if(action.side!==correct)return bad(`The row is sorted. ${value} is ${value<level.target?'smaller':'larger'} than ${level.target}; the target could still be on the ${correct==='left'?'right':'left'}. Do not discard that side.`);
      const low=action.side==='left'?board.probe+1:board.low;const high=action.side==='right'?board.probe-1:board.high;
      return good({...board,low,high,probe:null,failed:low<=high&&board.moves>=level.budget,message:low>high?'No candidate indexes remain. You now have enough evidence to report “not present”.':`Search range is now ${low} through ${high}. Probe near the middle to reduce the remaining work.`});
    }
    if(action.type==='absent')return board.low>board.high?good({...board,done:true,message:'Correct: the candidate range is empty, so the target is not present.'}):bad('There are still possible indexes. Rule them out using comparisons before claiming the target is absent.');
  }
  if(board.kind==='sort'&&action.type==='compare'){
    const left=board.values[board.index],right=board.values[board.index+1];const shouldSwap=left>right;
    if(action.swap!==shouldSwap)return bad(shouldSwap?`${left} is greater than ${right}. Swap these neighbors to put the smaller value first.`:`${left} is already no greater than ${right}. Keep them in this order; equal values need no swap.`);
    const values=[...board.values];if(shouldSwap)[values[board.index],values[board.index+1]]=[right,left];
    const endOfPass=board.index+1===board.end;const end=endOfPass?board.end-1:board.end;const done=end===0;
    return good({...board,values,moves:board.moves+1,index:endOfPass?0:board.index+1,end,passes:board.passes+Number(endOfPass),done,message:done?'Every pass is complete. The row is sorted, with all original values preserved.':endOfPass?'Pass complete. The largest remaining value is in place; the next pass can stop one position earlier.':shouldSwap?'Neighbors swapped. Continue the pass from left to right.':'Order preserved. Move to the next neighboring pair.'});
  }
  if(board.kind==='stack'&&action.type==='stack'){
    const level=STACK_LEVELS[board.round];if(action.index<0||action.index>2)return good(board);
    if(board.selected===null){if(!board.stacks[action.index].length)return bad('This stack is empty. Choose a source with cargo on top.');return good({...board,selected:action.index,message:'Source selected. Choose a different destination stack.'});}
    if(board.selected===action.index)return good({...board,selected:null,message:'Source selection cleared.'});
    if(board.stacks[action.index].length>=level.capacity)return bad('That destination is full. Free its top or choose another stack.');
    const stacks=board.stacks.map(s=>[...s]);const value=stacks[board.selected].pop()!;stacks[action.index].push(value);const moves=board.moves+1;
    const done=stacks[0].length===0&&stacks[1].length===0&&JSON.stringify(stacks[2])===JSON.stringify(level.goal);
    return good({...board,stacks,selected:null,moves,done,failed:!done&&moves>=level.budget,message:done?'Cargo delivered in the required bottom-to-top order. Your plan respected top-only access.':moves>=level.budget?'Move budget reached. Restart and plan the final order backward.':`Moved ${value} from ${'ABC'[board.selected]} to ${'ABC'[action.index]}. Only the top item moved.`});
  }
  return good(board);
}
