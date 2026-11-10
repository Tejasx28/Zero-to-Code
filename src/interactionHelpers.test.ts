import { describe, expect, it } from 'vitest';
import { activeCommand, hasMeaningfulChange, reorderCommands } from './interactionHelpers';
import { moveGame, newBoard } from './gameEngine';

describe('program editing and reversible play', () => {
  it('reorders whole repeated commands without losing repeats or mutating the old plan', () => {
    const original = [{ direction: 'right' as const, repeat: 3 }, { direction: 'down' as const, repeat: 2 }, { direction: 'left' as const, repeat: 1 }];
    const next = reorderCommands(original, 0, 2);
    expect(next.map(command => command.direction)).toEqual(['down', 'left', 'right']);
    expect(next.at(-1)?.repeat).toBe(3);
    expect(original[0].direction).toBe('right');
    expect(reorderCommands(original, -1, 1)).toBe(original);
  });
  it('maps execution steps to the correct repeated program row', () => {
    const plan = [{ direction: 'right' as const, repeat: 3 }, { direction: 'down' as const, repeat: 2 }];
    expect(activeCommand(plan, 0)).toBe(0);
    expect(activeCommand(plan, 2)).toBe(0);
    expect(activeCommand(plan, 3)).toBe(1);
    expect(activeCommand(plan, 5)).toBe(-1);
  });
  it('keeps inspection and feedback out of undo history, while recording actual moves', () => {
    const board = newBoard('array');
    const selected = moveGame(board, { type: 'select', index: 3 }).board;
    expect(hasMeaningfulChange(board, selected)).toBe(false);
    const shifted = moveGame(selected, { type: 'shift', direction: 1 }).board;
    expect(hasMeaningfulChange(selected, shifted)).toBe(true);
    const blocked = moveGame(board, { type: 'shift', direction: 1 }).board;
    expect(hasMeaningfulChange(board, blocked)).toBe(false);
  });
});
