import type { GameBoard, RobotCommand } from './gameEngine';

export function reorderCommands(program: RobotCommand[], from: number, to: number): RobotCommand[] {
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < 0 || from >= program.length || to >= program.length) return program;
  const next = program.map(command => ({ ...command }));
  const [command] = next.splice(from, 1);
  next.splice(to, 0, command);
  return next;
}

export function activeCommand(program: RobotCommand[], cursor: number): number {
  let end = 0;
  for (let index = 0; index < program.length; index++) {
    end += program[index].repeat;
    if (cursor < end) return index;
  }
  return -1;
}

export function hasMeaningfulChange(before: GameBoard, after: GameBoard): boolean {
  if (before.kind !== after.kind || before.round !== after.round) return false;
  if (before.moves !== after.moves || before.failed !== after.failed || before.done !== after.done) return true;
  if (before.kind === 'robot' && after.kind === 'robot') return before.cursor !== after.cursor || before.started !== after.started || JSON.stringify(before.program) !== JSON.stringify(after.program);
  if (before.kind === 'search' && after.kind === 'search') return before.low !== after.low || before.high !== after.high;
  return false;
}

export const MISSION_HINTS = {
  robot: [
    'Before adding commands, trace a path with your eyes. Which checkpoints must you visit before the exit?',
    'Look for a straight stretch. One repeated direction can replace several separate instructions.',
    'Check the robot’s position at the end of each stretch. The final instruction must leave it on the exit after every cell is collected.',
  ],
  array: [
    'Which value would be lost if you wrote into the selected slot right now?',
    'Find the empty space. Can you move an occupied neighbor into that gap without losing its value?',
    'For insertion, work backward from the spare space. For deletion, close the gap from left to right. A rotation needs a temporary place to hold the first value.',
  ],
  search: [
    'What does sorted order tell you about all the values on either side of a probe?',
    'Compare the revealed value with the target. Which side could still contain the answer?',
    'If the probe is smaller than the target, discard the probe and the left side. If larger, discard the probe and the right side. Near-middle probes remove more possibilities.',
  ],
  sort: [
    'Look only at the two highlighted neighbors. Which value belongs first in ascending order?',
    'A pass carries a large value toward the right edge. What happens if you stop after just one comparison?',
    'Swap only when the left neighbor is greater. Finish the entire pass, then leave its final rightmost value alone.',
  ],
  stack: [
    'Look at the target from bottom to top. Which container must arrive at stack C first?',
    'If that container is buried, where could you park the containers above it?',
    'Plan the final order backward, using the spare stacks as temporary memory. Only a top item can be moved, even when a buried item looks tempting.',
  ],
};
