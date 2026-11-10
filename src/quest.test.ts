import { describe, expect, it, vi } from 'vitest';
import { ARRAY_LEVELS, expandedProgram, moveGame, newBoard, ROBOT_LEVELS, SEARCH_LEVELS, STACK_LEVELS } from './gameEngine';
import type { ArrayBoard, Direction, GameAction, GameBoard, RobotBoard, SearchBoard, SortBoard, StackBoard } from './gameEngine';
import { EXERCISES, UNITS } from './curriculum';
import { canReview, codeKey, decodeQuest, freshQuest, loadQuest, questXP, resetQuest, submitCode, TWO_DAYS, unitComplete } from './questState';
import { matches } from './runtime';
const act=(board:GameBoard,action:GameAction)=>moveGame(board,action).board;
describe('Memory Heist',()=>{
  it('blocks overwriting and preserves the original board',()=>{const b=newBoard('array') as ArrayBoard;const next=moveGame(b,{type:'shift',direction:1});expect(next.mistake).toBe(true);expect(b.slots).toEqual(ARRAY_LEVELS[0].initial);expect(next.board.moves).toBe(0);});
  it('has a valid plan within the exact budget for every mission',()=>{
    const plans:GameAction[][]=[
      [{type:'select',index:3},{type:'shift',direction:1},{type:'select',index:2},{type:'shift',direction:1},{type:'select',index:1},{type:'shift',direction:1},{type:'write'}],
      [{type:'select',index:2},{type:'delete'},{type:'select',index:3},{type:'shift',direction:-1},{type:'select',index:4},{type:'shift',direction:-1}],
      [{type:'pickup'},{type:'select',index:1},{type:'shift',direction:-1},{type:'select',index:2},{type:'shift',direction:-1},{type:'select',index:3},{type:'shift',direction:-1},{type:'place'}]
    ];
    for(let round=0;round<3;round++){let b:GameBoard=newBoard('array',round);for(const a of plans[round])b=act(b,a);expect(b.done,`round ${round}`).toBe(true);expect(b.failed).toBe(false);expect(b.moves).toBe(ARRAY_LEVELS[round].budget);}
  });
  it('detects a wasted move budget and preserves unmarked cargo',()=>{let b:GameBoard=newBoard('array');b=act(b,{type:'pickup'});b=act(b,{type:'place'});b=act(b,{type:'pickup'});b=act(b,{type:'place'});expect(b.failed).toBe(true);expect(moveGame(newBoard('array'),{type:'delete'}).mistake).toBe(true);});
});
describe('Signal Expedition',()=>{
  it('solves all rounds with evidence-backed midpoint decisions within the budget',()=>{for(let round=0;round<3;round++){let b=newBoard('search',round) as SearchBoard;const level=SEARCH_LEVELS[round];while(!b.done&&!b.failed){if(b.low>b.high){b=act(b,{type:'absent'}) as SearchBoard;break;}const mid=Math.floor((b.low+b.high)/2);b=act(b,{type:'probe',index:mid}) as SearchBoard;if(!b.done)b=act(b,{type:'discard',side:level.values[mid]<level.target?'left':'right'}) as SearchBoard;}expect(b.done).toBe(true);expect(b.moves).toBeLessThanOrEqual(level.budget);}});
  it('does not discard possible candidates after a wrong conclusion',()=>{let b=newBoard('search') as SearchBoard;b=act(b,{type:'probe',index:7}) as SearchBoard;const wrong=moveGame(b,{type:'discard',side:'right'});expect(wrong.mistake).toBe(true);expect((wrong.board as SearchBoard).low).toBe(0);expect((wrong.board as SearchBoard).high).toBe(14);expect(moveGame(newBoard('search'),{type:'absent'}).mistake).toBe(true);});
  it('requires using the current probe before probing again',()=>{const b=act(newBoard('search'),{type:'probe',index:7});expect(moveGame(b,{type:'probe',index:6}).mistake).toBe(true);});
});
describe('Sorting Workshop',()=>{
  it('completes full passes on mixed values, negatives, and duplicates',()=>{for(let round=0;round<3;round++){let b=newBoard('sort',round) as SortBoard;const original=[...b.values];while(!b.done)b=act(b,{type:'compare',swap:b.values[b.index]>b.values[b.index+1]}) as SortBoard;expect(b.values).toEqual([...original].sort((a,c)=>a-c));expect(b.moves).toBe(original.length*(original.length-1)/2);expect(b.passes).toBe(original.length-1);}});
  it('explains a wrong decision without silently advancing the pass',()=>{const b=newBoard('sort') as SortBoard;const next=moveGame(b,{type:'compare',swap:false});expect(next.mistake).toBe(true);expect((next.board as SortBoard).values).toEqual(b.values);expect(next.board.moves).toBe(0);});
});
describe('Cargo Stackyard',()=>{
  it('moves only the top item and keeps all cargo',()=>{let b=newBoard('stack') as StackBoard;b=act(b,{type:'stack',index:0}) as StackBoard;b=act(b,{type:'stack',index:1}) as StackBoard;expect(b.stacks).toEqual([[3,1],[2],[]]);expect(b.moves).toBe(1);});
  it('each planning challenge is reachable within its advertised budget',()=>{
    for(let round=0;round<3;round++){
      const level=STACK_LEVELS[round];const queue:{stacks:number[][];path:number[][]}[]=[{stacks:level.initial.map(s=>[...s]),path:[]}];const seen=new Set<string>();let solution:number[][]|null=null;
      for(let head=0;head<queue.length;head++){const item=queue[head];const key=JSON.stringify(item.stacks);if(seen.has(key))continue;seen.add(key);if(item.stacks[0].length===0&&item.stacks[1].length===0&&JSON.stringify(item.stacks[2])===JSON.stringify(level.goal)){solution=item.path;break;}if(item.path.length>=level.budget)continue;for(let from=0;from<3;from++)for(let to=0;to<3;to++){if(from===to||!item.stacks[from].length||item.stacks[to].length>=level.capacity)continue;const stacks=item.stacks.map(s=>[...s]);stacks[to].push(stacks[from].pop()!);queue.push({stacks,path:[...item.path,[from,to]]});}}
      expect(solution,`round ${round} must be solvable`).not.toBeNull();let b:GameBoard=newBoard('stack',round);for(const[from,to]of solution!){b=act(b,{type:'stack',index:from});b=act(b,{type:'stack',index:to});}expect(b.done).toBe(true);expect(b.failed).toBe(false);
    }
  });
});
describe('Robot Relay',()=>{
  it('does not ignore commands after reaching the exit',()=>{
    let b=newBoard('robot') as RobotBoard;
    for(const command of [{direction:'right',repeat:2},{direction:'left',repeat:2},{direction:'down',repeat:3},{direction:'right',repeat:4},{direction:'up',repeat:1},{direction:'down',repeat:1}] as {direction:Direction;repeat:number}[])b=act(b,{type:'append',...command}) as RobotBoard;
    for(let i=0;i<12;i++)b=act(b,{type:'step'}) as RobotBoard;
    expect(b.done).toBe(false);b=act(b,{type:'step'}) as RobotBoard;expect(b.done).toBe(false);expect(b.y).toBe(4);
  });
  it('stops on a wall and allows editing the same program afterward',()=>{let b=newBoard('robot') as RobotBoard;b=act(b,{type:'append',direction:'up',repeat:1}) as RobotBoard;b=act(b,{type:'step'}) as RobotBoard;expect(b.failed).toBe(true);const edited=act(b,{type:'edit'}) as RobotBoard;expect(edited.failed).toBe(false);expect(edited.program).toHaveLength(1);expect(edited.cursor).toBe(0);});
  it('each multi-objective map has a compressed program inside both limits',()=>{
    const directions:{dir:Direction;dx:number;dy:number}[]=[{dir:'up',dx:0,dy:-1},{dir:'right',dx:1,dy:0},{dir:'down',dx:0,dy:1},{dir:'left',dx:-1,dy:0}];
    for(let round=0;round<3;round++){
      const level=ROBOT_LEVELS[round];const initial=newBoard('robot',round) as RobotBoard;const gems:string[]=[];level.map.forEach((row,y)=>row.split('').forEach((v,x)=>{if(v==='*')gems.push(`${x},${y}`);}));
      const queue=[{x:initial.x,y:initial.y,mask:0,path:[] as Direction[]}];const seen=new Set<string>();let solution:Direction[]|null=null;
      for(let head=0;head<queue.length;head++){const s=queue[head];const key=`${s.x},${s.y},${s.mask}`;if(seen.has(key))continue;seen.add(key);if(s.mask===(1<<gems.length)-1&&level.map[s.y][s.x]==='E'){solution=s.path;break;}if(s.path.length>=level.steps)continue;for(const d of directions){const x=s.x+d.dx,y=s.y+d.dy;if(!level.map[y]||!level.map[y][x]||level.map[y][x]==='#')continue;const gem=gems.indexOf(`${x},${y}`);queue.push({x,y,mask:gem>=0?s.mask|(1<<gem):s.mask,path:[...s.path,d.dir]});}}
      expect(solution).not.toBeNull();const program:{direction:Direction;repeat:number}[]=[];for(const d of solution!){const last=program.at(-1);if(last?.direction===d&&last.repeat<4)last.repeat++;else program.push({direction:d,repeat:1});}expect(program.length).toBeLessThanOrEqual(level.slots);let b:GameBoard=initial;for(const c of program)b=act(b,{type:'append',...c});for(const _ of expandedProgram(program)){void _;b=act(b,{type:'step'});}expect(b.done).toBe(true);expect(b.failed).toBe(false);
    }
  });
});
describe('coding learning evidence and persistence',()=>{
  it('preserves the old Stack record without reusing its scores as coding evidence',()=>{
    const old=JSON.stringify({version:1,onboarded:true,name:'Learner',results:[{score:5}],notes:'Original diary'});
    const store=new Map([['dsa-quest:v0.1',old]]);
    vi.stubGlobal('localStorage',{getItem:(key:string)=>store.get(key)??null});
    try{const loaded=loadQuest().progress;expect(loaded.name).toBe('Learner');expect(loaded.onboarded).toBe(true);expect(loaded.legacyArchive).toEqual(JSON.parse(old));expect(loaded.code).toEqual({});expect(loaded.snapshots).toEqual([]);expect(resetQuest(loaded).legacyArchive).toEqual(JSON.parse(old));expect(store.get('dsa-quest:v0.1')).toBe(old);}finally{vi.unstubAllGlobals();}
  });
  it('requires code tests rather than flashcard activity for chapter completion',()=>{let p=freshQuest();p.lessons=['start'];expect(unitComplete(p,'start')).toBe(false);p=submitCode(p,'add','python',4,4,100);expect(unitComplete(p,'start')).toBe(true);p.language='java';expect(unitComplete(p,'start')).toBe(false);});
  it('keeps first submission, help, and separate languages without farming XP',()=>{let p=freshQuest();p.assisted=[codeKey('add','python')];p=submitCode(p,'add','python',1,4,100);p=submitCode(p,'add','python',4,4,200);const xp=questXP(p);p=submitCode(p,'add','python',4,4,300);expect(questXP(p)).toBe(xp);expect(p.code['python:add']).toMatchObject({firstScore:1,attempts:3,passed:true,assisted:true});expect(p.code['java:add']).toBeUndefined();});
  it('preserves a mid-game board, language drafts, and a partial assessment',()=>{const p=freshQuest();p.games.array={round:0,solved:[],board:act(newBoard('array'),{type:'select',index:3})};p.drafts={'python:add':'def solve(a, b):\n    return a + b'};p.activeQuiz={kind:'before',answers:[1,-1,-1,-1,-1],confidence:2,startedAt:100};expect(decodeQuest(JSON.stringify(p))).toEqual(p);});
  it('handles missing, malformed, or incompatible saves without throwing',()=>{for(const raw of [null,'null','bad',JSON.stringify({...freshQuest(),version:1}),JSON.stringify({...freshQuest(),activeQuiz:{answers:[]}}),JSON.stringify({...freshQuest(),games:{robot:{round:9}}}),JSON.stringify({...freshQuest(),games:{robot:{round:0,solved:[],board:{kind:'robot',round:0}}}})])expect(decodeQuest(raw)).toBeNull();});
  it('opens retention only at the original two-day boundary',()=>{const p=freshQuest();p.reviewDueAt=1000+TWO_DAYS;expect(canReview(p,p.reviewDueAt-1)).toBe(false);expect(canReview(p,p.reviewDueAt)).toBe(true);});
  it('never confuses a printed string with a returned array or number',()=>{expect(matches('7',7)).toBe(false);expect(matches('[1,2]',[1,2])).toBe(false);expect(matches([1,2],[1,2])).toBe(true);});
  it('has both language starters, real edge cases, and no worked independent answer',()=>{expect(UNITS).toHaveLength(6);for(const e of EXERCISES){expect(e.starter.python).toContain('def solve');expect(e.starter.java).toContain('public class Solution');expect(e.cases.length).toBeGreaterThanOrEqual(4);}const independent=EXERCISES.find(e=>e.independent)!;expect(independent.hint).toBe('');expect(independent.example.python).toBe('');expect(independent.example.java).toBe('');});
});
