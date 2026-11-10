import { describe, expect, it } from 'vitest';
import { LEARNING_LOOPS, moveStep, RELATED_MISSIONS, validStepOrder } from './learningLoops';
import { EXERCISES, GAMES } from './curriculum';
describe('game to code pathways',()=>{
  it('connects every simulation to a real, related coding mission and a rehearsal',()=>{for(const game of GAMES){const loop=LEARNING_LOOPS[game.id];expect(EXERCISES.find(e=>e.id===loop.exercise)?.unit).toBe(game.unit);expect(loop.steps).toHaveLength(4);expect(RELATED_MISSIONS[loop.exercise]?.length).toBeGreaterThan(0);}});
  it('keeps related mission destinations valid',()=>{for(const links of Object.values(RELATED_MISSIONS))for(const link of links)expect(EXERCISES.some(e=>e.id===link.id)).toBe(true);});
  it('reorders without losing steps and only confirms a complete algorithm',()=>{expect(moveStep([2,0,3,1],0,2)).toEqual([0,3,2,1]);expect(validStepOrder([0,1,2,3],4)).toBe(true);expect(validStepOrder([0,1,2,2],4)).toBe(false);expect(validStepOrder([0,1],4)).toBe(false);});
});
