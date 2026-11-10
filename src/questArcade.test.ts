import { describe, expect, it } from 'vitest';
import { ARCADE_GAMES, BEACONS, BUG_DRONES, landing, loadOf, mergePlayedCase, QUEST_PROBLEMS, routeOf, streakOf, WALLS } from './questArcadeContent';
import { PRACTICE_DETAILS, PRACTICE_IDS } from './practiceContent';
import { pagePath, readPage } from './routes';
import { readPlay, readArenaLaunch } from './QuestArcade';

describe('a playable rule that transfers to real code',()=>{
  it('rejects walls and map edges without losing the current position',()=>{
    expect(landing(17,1)).toBe(17);expect(landing(17,3)).toBe(17);expect(landing(14,4)).toBe(14);expect(landing(0,1)).toBe(0);expect(landing(17,9)).toBe(17);
    expect(routeOf([4,4,3,3,2,2,2,2,2,1,1])).toEqual([16,15,22,29,30,31,32,33,34,27,20]);
    const path=routeOf([4,4,3,3,2,2,2,2,2,1,1]);expect(BEACONS.every(v=>path.includes(v))).toBe(true);expect(path.some(v=>WALLS.includes(v))).toBe(false);
  });
  it('loads in order using the remaining capacity, not an optimal-subset shortcut',()=>{
    expect(loadOf([4,7,2,-1,3,1],10)).toEqual([4,2,3,1]);expect(loadOf([4,3,3],6)).toEqual([4]);expect(loadOf([0,-2,1],0)).toEqual([]);expect(loadOf([],8)).toEqual([]);
  });
  it('uses inclusive signal boundaries and keeps the earliest equally long run',()=>{
    expect(streakOf([2,4,0,8,3,2,-1,5])).toEqual([3,5]);expect(streakOf([1,2,0,4,5])).toEqual([0,1]);expect(streakOf([0,-1])).toEqual([-1,-1]);expect(streakOf([])).toEqual([-1,-1]);expect(streakOf([0,4,5,6])).toEqual([1,3]);
  });
  it('connects every new world to a separate coding remix and valid page URL',()=>{
    expect(ARCADE_GAMES).toHaveLength(5);expect(QUEST_PROBLEMS).toHaveLength(8);expect(new Set(QUEST_PROBLEMS.map(e=>e.id)).size).toBe(8);
    for(const game of ARCADE_GAMES){expect(PRACTICE_IDS).toContain(game.transferId);expect(readPage(pagePath({view:'arcade',id:game.id}))).toEqual({view:'arcade',id:game.id});}
    expect(PRACTICE_DETAILS).toHaveLength(29);expect(QUEST_PROBLEMS.filter(e=>e.independent)).toHaveLength(4);expect(BUG_DRONES).toHaveLength(3);
  });
  it('preserves a selected duel when opening its repair and ignores malformed requests',()=>{expect(readArenaLaunch(JSON.stringify({drone:2,at:100}))).toBe(2);expect(readArenaLaunch(JSON.stringify({drone:5,at:100}))).toBeNull();expect(readArenaLaunch('broken')).toBeNull();});
  it('rejects malformed optional rehearsal metadata',()=>{expect(readPlay('not json')).toBeNull();expect(readPlay('{"args":2}')).toBeNull();expect(readPlay(JSON.stringify({args:[[1,2]],expected:[18,19],steps:['Remember the position']}))).not.toBeNull();});
  it('does not count a played input twice or replace an authored expected result',()=>{const exercise=QUEST_PROBLEMS[1],test=exercise.cases[0];const cases=mergePlayedCase(exercise,{args:test.args,expected:[999]});expect(cases).toHaveLength(exercise.cases.length);expect(cases[0]).toEqual({...test,label:'Your played example'});expect(new Set(cases.map(c=>JSON.stringify(c.args))).size).toBe(cases.length);});
});
