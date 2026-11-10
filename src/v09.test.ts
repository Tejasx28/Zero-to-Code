import { describe,it,expect } from 'vitest';
import { inspectCode, combinedRepair } from './CodeClinic';
import { MORE_GAMES,MORE_EXERCISES,moreAnswer } from './moreGames';
import { CONCEPTS } from './conceptContent';
import { MICRO_LESSONS } from './microLessons';
describe('field-link guidance and additional worlds',()=>{
 it('recognizes the screenshot’s missing names and loop reset without claiming a full solution',()=>{const code='def solve(values):\n    for n in values:\n        current = values[0]\n        values[0] = result\n        total = 0\n        if n > 0:\n            total += value\n            result.append(value)\n    return result';const f=inspectCode(code,'python');expect(f.some(x=>x.title.includes('result')&&x.line===4)).toBe(true);expect(f.some(x=>x.title.includes('value')&&x.after?.includes('total += n'))).toBe(true);expect(f.some(x=>x.title.includes('resets'))).toBe(true);});
 it('combines missing result setup and matching loop names in one review',()=>{const source='def solve(values):\n    for n in values:\n        result.append(value)\n    return result';expect(combinedRepair(source,'python')).toBe('def solve(values):\n    result = []\n    for n in values:\n        result.append(n)\n    return result');});
 it('does not flag a correctly named initialized loop program',()=>expect(inspectCode('def solve(values):\n    total = 0\n    for n in values:\n        total += n\n    return total','python')).toEqual([]));
 it('distinguishes stack departures from queue dispatch and ignores empty departures',()=>{expect(moreAnswer('stack-rescue',[3,8,-1])).toEqual([3]);expect(moreAnswer('queue-relay',[3,8,-1])).toEqual([3]);expect(moreAnswer('queue-relay',[-1,4,-1,-1])).toEqual([4]);expect(moreAnswer('stack-rescue',[-1])).toEqual([]);});
 it('checks prefix state, duplicates in sorting and missing search targets',()=>{expect(moreAnswer('prefix-reactor',[4,-2,0,3])).toEqual([4,2,2,5]);expect(moreAnswer('sorting-rail',[3,-1,3])).toEqual([-1,3,3]);expect(moreAnswer('binary-intercept',[1,4,7],5)).toBe(-1);});
 it('provides five distinct executable game contracts and ten additional short topics',()=>{expect(MORE_GAMES).toHaveLength(5);expect(MORE_EXERCISES.every(e=>e.cases.length===6&&e.example.python&&e.example.java)).toBe(true);expect(CONCEPTS).toHaveLength(16);for(const c of CONCEPTS)expect(MICRO_LESSONS[c.id]?.length).toBeGreaterThan(0);});
});
