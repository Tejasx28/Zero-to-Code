import { ArrowRight, Check, Code2 } from 'lucide-react';
import type { QuestProgress } from './questState';
import { foundationTrail } from './foundationTrail';

/** Visible, keyboard-accessible map of the very first three coding skills. */
export function LearningTrail({ progress, onMission }: { progress: QuestProgress; onMission: (id: string) => void }) {
  const trail = foundationTrail(progress);
  return <section className="foundation-trail" aria-labelledby="foundation-trail-heading">
    <header className="foundation-trail-header">
      <div>
        <span className="section-kicker">YOUR FIRST THREE CODING WINS</span>
        <h2 id="foundation-trail-heading">Your coding foundation</h2>
        <p>Each step gives you a real program to write. Pass the code tests to earn a checkmark. You can revisit any step.</p>
      </div>
      <div className="foundation-trail-progress">
        <strong>{trail.completed} / {trail.stages.length}</strong>
        <span>skills checked</span>
        <progress aria-label="Coding foundation completion" value={trail.completed} max={trail.stages.length} />
      </div>
    </header>
    <ol className="foundation-trail-steps">
      {trail.stages.map((stage, index) => <li key={stage.id}>
        <button type="button" onClick={() => onMission(stage.id)}
          className={`foundation-trail-step ${stage.passed ? 'is-passed' : stage.recommended ? 'is-next' : ''}`}
          aria-current={stage.recommended ? 'step' : undefined}
          aria-label={`${stage.title}: ${stage.passed ? 'completed' : stage.recommended ? 'recommended next' : 'available to explore'}. Open lesson.`}>
          <span className="foundation-trail-number" aria-hidden="true">{stage.passed ? <Check size={20} /> : `0${index + 1}`}</span>
          <span className="foundation-trail-copy">
            <small>{stage.passed ? 'CODE PASSED' : stage.recommended ? 'RECOMMENDED NEXT' : 'AVAILABLE ANYTIME'}</small>
            <strong>{stage.title}</strong>
            <span>{stage.description}</span>
            <em>{stage.skill}</em>
          </span>
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </li>)}
    </ol>
    <p className="foundation-trail-note"><Code2 size={17} aria-hidden="true" />
      {trail.next ? 'Your goal is to write and test each program yourself, not just read the explanation.' : 'Foundations complete. Try Cargo, then apply the same code ideas to a fresh problem.'}
    </p>
  </section>;
}
