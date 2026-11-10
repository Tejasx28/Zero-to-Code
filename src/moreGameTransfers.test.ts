import { describe, expect, it } from 'vitest';
import { MORE_GAMES } from './moreGames';
import { MORE_TRANSFER_EXERCISES, transferAnswer } from './moreGameTransfers';
import { PRACTICE_DETAILS, PRACTICE_EXERCISES, PRACTICE_IDS } from './practiceContent';

describe('five new independent arcade transfer contracts',()=>{
  it('links each v0.9 world to a unique, independently scored, executable remix',()=>{
    const ids=MORE_TRANSFER_EXERCISES.map(x=>x.id);
    expect(ids).toHaveLength(5);
    expect(new Set(ids).size).toBe(5);
    expect(new Set(MORE_GAMES.map(g=>g.transfer)).size).toBe(5);
    for(const game of MORE_GAMES){
      const remix=MORE_TRANSFER_EXERCISES.find(e=>e.id===game.transfer);
      expect(remix).toBeDefined();
      expect(remix?.independent).toBe(true);
      expect(remix?.hint).toBe('');
      expect(remix?.cases).toHaveLength(6);
      expect(remix?.example.python).toContain('def solve');
      expect(remix?.example.java).toContain('public class Solution');
      expect(PRACTICE_IDS).toContain(game.transfer);
      expect(PRACTICE_EXERCISES.some(e=>e.id===game.transfer)).toBe(true);
      expect(PRACTICE_DETAILS.find(e=>e.id===game.transfer)).toBeDefined();
    }
  });
  it('distinguishes stack departures from queue pending and keeps independent edge rules',()=>{
    expect(transferAnswer('quest-stack-departures',[3,8,-1,2,-1])).toEqual([8,2]);
    expect(transferAnswer('quest-queue-waiting',[3,8,-1,2,-1])).toEqual([2]);
    expect(transferAnswer('quest-binary-insertion',[2,2,2,5],2)).toBe(0);
    expect(transferAnswer('quest-binary-insertion',[],7)).toBe(0);
    expect(transferAnswer('quest-highest-prefix',[-5,-2])).toBe(0);
    expect(transferAnswer('quest-highest-prefix',[4,-9,2])).toBe(4);
    expect(transferAnswer('quest-one-sort-pass',[5,2,4,1,3])).toEqual([2,4,1,3,5]);
  });
});
