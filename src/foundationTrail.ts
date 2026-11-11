import { CODE_OPERATIONS, operationGameDone } from './codeOperations';
import { codeKey } from './questState';
import type { QuestProgress } from './questState';

/** The trail is derived from actual code evidence, never from visiting a lesson. */
export type TrailProgress = Pick<QuestProgress, 'drafts' | 'code' | 'language'>;
const FOUNDATIONS = [
  { id: 'contract', title: 'Functions', description: 'Receive inputs and return a result.', skill: 'Give the computer a job' },
  { id: 'gate', title: 'Conditions', description: 'Make a choice with if and else.', skill: 'Decide what happens next' },
  { id: 'relay', title: 'Loops', description: 'Repeat a step and remember the total.', skill: 'Build a reusable algorithm' },
] as const;

export interface TrailStage {
  id: (typeof FOUNDATIONS)[number]['id'];
  title: string;
  description: string;
  skill: string;
  exerciseId: string;
  passed: boolean;
  recommended: boolean;
}

export function foundationTrail(progress: TrailProgress): { stages: TrailStage[]; completed: number; next: TrailStage['id'] | null } {
  const evidence = FOUNDATIONS.map((stage) => {
    const operation = CODE_OPERATIONS.find((op) => op.id === stage.id);
    if (!operation) throw new Error(`Foundation mission is missing: ${stage.id}`);
    // Learners may finish in the mission itself or by completing the related Code Studio task.
    const passed = operationGameDone(progress, stage.id, progress.language) ||
      progress.code[codeKey(operation.exerciseId, progress.language)]?.passed === true;
    return { ...stage, exerciseId: operation.exerciseId, passed };
  });
  const next = evidence.find((stage) => !stage.passed)?.id ?? null;
  return {
    stages: evidence.map((stage) => ({ ...stage, recommended: stage.id === next })),
    completed: evidence.filter((stage) => stage.passed).length,
    next,
  };
}
