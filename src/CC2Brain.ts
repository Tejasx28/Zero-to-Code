import type { CCWorkspace } from './CCGuide';
import { matches } from './runtime';
import { reviewGameRun } from './gameMechanics';

export type TutorIntent = 'explain' | 'debug' | 'hint' | 'predict' | 'next';
export interface TutorEvidence {
  title: string;
  language: string;
  selected: number;
  total: number;
  hasRun: boolean;
  completed: boolean;
  passed: number;
  issue: 'idle' | 'running' | 'runtime' | 'test-error' | 'mismatch' | 'suite-failed' | 'passed' | 'experiment';
  label?: string;
  args?: unknown;
  expected?: unknown;
  actual?: unknown;
  error?: string;
  line?: number;
}

/** No grading claims are created from predictions, partial responses, or old runner output. */
export function tutorEvidence(w: CCWorkspace | null, selected = 0): TutorEvidence | null {
  if (!w) return null;
  const cases = w.exercise.cases;
  const index = Math.max(0, Math.min(cases.length - 1, Number.isInteger(selected) ? selected : 0));
  const test = cases[index];
  const output = w.running ? null : w.result;
  const review = output && w.mode === 'suite' ? reviewGameRun(output, cases) : null;
  const complete = w.mode === 'suite' ? Boolean(review?.countsAsAttempt)
    : Boolean(output?.attempted && !output.error && output.results.length === 1);
  const results = complete && w.mode === 'suite' ? output!.results : [];
  const passed = results.filter((row, i) => !row.error && matches(row.actual, cases[i]?.expected)).length;
  const row = complete ? output?.results[w.mode === 'custom' ? 0 : index] : undefined;
  const base: TutorEvidence = {
    title: w.exercise.title, language: w.language, selected: w.mode==='custom'?0:index,
    total: w.mode === 'custom' ? 1 : cases.length, hasRun: complete, completed: complete,
    passed, label: w.mode==='custom'?'Custom experiment':test?.label, args: w.mode === 'custom' ? w.customArgs : test?.args,
    expected: w.mode === 'custom' ? undefined : test?.expected,
    actual: row?.actual, error: row?.error ?? output?.error ?? (output&&!complete?review?.message??'The runner returned incomplete evidence.':undefined), line: row?.line,
    issue: w.running ? 'running' : output?.error ? 'runtime'
      : !output ? 'idle' : !complete ? 'runtime' : row?.error ? 'test-error'
      : w.mode === 'custom' ? 'experiment'
      : row && matches(row.actual, test?.expected) && passed === cases.length ? 'passed'
      : row && !matches(row.actual, test?.expected) ? 'mismatch' : 'suite-failed',
  };
  return base;
}

const short = (value: unknown) => {
  const raw = JSON.stringify(value) ?? 'no returned value';
  return raw.length > 180 ? raw.slice(0, 177) + '…' : raw;
};

/** Offline mode is explicit about what is observed and what is only a suggestion. */
export function localTutorReply(question: string, w: CCWorkspace | null, selected = 0, hintLevel = 0): string {
  const q = question.toLowerCase();
  if (!w) {
    if (/\b(loop|for loop|while loop|iteration)\b/.test(q)) return 'A loop repeats an action. A for-loop usually visits each item once. Imagine counting the contents of three boxes: for each box, update what you remember. Then stop when all boxes are visited.';
    if (/\b(function|return|solve)\b/.test(q)) return 'A function is a named job. The inputs go in, instructions run, and return sends the answer back. Try writing solve(a, b) as a function that returns a + b.';
    if (/\b(condition|if statement|branch)\b/.test(q)) return 'An if statement chooses a path based on whether a question is true. Trace an input that makes the question true, then a different input that makes it false.';
    if (/\b(variable|assignment)\b/.test(q)) return 'A variable is a name for a value you want to remember. Writing total = 0 stores zero; total += 1 adds one to what was already there.';
    if (/\b(array|list|index)\b/.test(q)) return 'A list stores values in order. Its indexes typically begin at zero. For [5, 8, 2], index 0 holds 5 and index 2 holds 2.';
    return 'Choose a lesson or coding game so I can look at your current code. Meanwhile, ask me about functions, loops, variables, arrays, or conditions.';
  }
  const evidence = tutorEvidence(w, selected)!;
  const independent = w.exercise.independent;
  if (evidence.issue === 'running') return 'Your code is running now. I will use the actual test evidence when it finishes. If it takes too long, use Stop; that will not count as a pass.';
  if (/\b(what (is|are)|explain (a|the)|teach me)\b/.test(q) && /\b(loop|iteration|for|while)\b/.test(q)) return 'A loop repeats one action. A for-loop visits each item, one by one. Ask yourself what value needs to survive between visits. Try tracing two items on paper before changing the code.';
  if (/\b(what (is|are)|explain (a|the)|teach me)\b/.test(q) && /\b(function|return)\b/.test(q)) return 'A function is a small job that accepts inputs and sends back one result. The tests call solve(...) with different inputs. return gives the result to the caller; print only displays it.';
  if (/\b(what (is|are)|explain (a|the)|teach me)\b/.test(q) && /\b(if|condition|branch)\b/.test(q)) return 'A condition selects which instructions execute. Read it as a question with a true and false path. Try an input that takes each path and compare the returned values.';
  if (/\b(variable|assignment|equals sign)\b/.test(q)) return 'A variable is a name for a value you want to remember. An assignment such as total = 0 replaces the old value; total += value adds to what was there. Watch what the variable holds before and after one step.';
  if (/\b(array|list|index|position)\b/.test(q) && /\b(what|why|explain|teach|understand)\b/.test(q)) return 'An array or list keeps items in order. Positions usually start at 0, so a three-item list has indexes 0, 1, and 2. Try one tiny row and point to the position of each value.';
  if (/\b(why|explain|teach)\b/.test(q) && /\b(error|bug|wrong|fail|broken)\b/.test(q) && evidence.issue === 'idle') return 'There is no completed run to inspect yet. Run your code once, select a failed test, and I can compare the real return with the expected contract. I will not invent a failure.';
  const selectedLine = q.match(/\bline\s+(\d{1,4})\b/);
  if (selectedLine) {
    const n=Number(selectedLine[1]);const line=w.source.split('\n')[n-1]?.trim();
    if(line)return `Line ${n} says: ${line.slice(0,180)}. ${/\breturn\b/.test(line)?'This ends the function call and sends a value back.':'Describe the value before this instruction, then what should change after it.'}`;
  }
  if (/\b(predict|quiz|challenge|guess|duel)\b/.test(q)) return evidence.hasRun
    ? `Prediction duel: choose the selected test “${evidence.label ?? 'current input'}”, predict the value your code returns, then reveal the recorded result. This is about what the code actually did, not what it should do.`
    : 'Run the tests once to collect evidence. Then we can make a prediction about an actual recorded input without pretending to execute anything.';
  if (evidence.issue === 'runtime' || evidence.issue === 'test-error') {
    const line = evidence.line ? ` near line ${evidence.line}` : '';
    return `The recorded runner reported${line}: ${evidence.error ?? 'an incomplete result'}. This is evidence, not a guess. Read the first error and check the inputs and syntax around it. ${independent ? 'I will help you investigate without giving away the independent solution.' : 'Which line do you want to inspect first?'}`;
  }
  if (evidence.issue === 'mismatch') {
    const source = w.source;
    if (/\bfor\b/.test(source) && /\b(total|sum)\s*=\s*(value|item|number)\b/.test(source)) {
      return `For “${evidence.label}”, the required result is ${short(evidence.expected)}, but your code returned ${short(evidence.actual)}. I notice a running value may be replaced during each loop visit. Try two items: what does that variable remember after the second visit?`;
    }
    if (/\breturn\b[^\n]*\n/.test(source) && hintLevel > 0) {
      return `Recorded input: ${short(evidence.args)}. Expected ${short(evidence.expected)}; returned ${short(evidence.actual)}. One possible place to investigate is where return sits relative to your loops and conditions. Does it end the function before all items are visited?`;
    }
    return `Your selected test “${evidence.label}” expected ${short(evidence.expected)}, but your code returned ${short(evidence.actual)}. This doesn't reveal which line caused it. Trace the smallest input and tell me which intermediate value first differs from your plan.${independent ? ' I will keep the answer yours.' : ''}`;
  }
  if (evidence.issue === 'suite-failed') return `This selected test matched, but the suite passed ${evidence.passed}/${evidence.total} tests. Choose a failing test under “What I can see” to inspect the difference. A matching test alone does not complete the mission.`;
  if (evidence.issue === 'passed') return `This recorded suite passed ${evidence.passed}/${evidence.total} tests. Try an independent remix to use the same idea with a new input.`;
  if (evidence.issue === 'experiment') return `Your experiment returned ${short(evidence.actual)} for ${short(evidence.args)}. Custom experiments do not grant a mission pass. Does that result match the rule you intended?`;
  if (/\b(hint|help|stuck|next step)\b/.test(q)) {
    const n = Math.max(0, hintLevel);
    if (n === 0) return `Start with the function contract: ${w.exercise.contract}. What state has to be remembered from one step to the next? Describe it in words before editing.`;
    if (n === 1) return `Take the first test, ${short(w.exercise.cases[0]?.args)}. Trace exactly one iteration or decision. What should change, and what must stay the same?`;
    return `Look at the code that updates your state. Verify the initial value, update condition, and final return against one example. ${independent ? 'I will not paste the independent solution.' : 'If you tell me your intended next step, I can check your reasoning.'}`;
  }
  return `You're working on “${w.exercise.title}” in ${w.language}. ${evidence.hasRun ? 'I can use your recorded result to investigate this, but I need a specific question.' : 'Run a test or ask about a line, a condition, or a variable so we have something concrete to examine.'} Which step feels unclear?`;
}

/** Sends a minimized, explicit view of the active workspace to the optional online tutor. */
export function connectedTutorContext(w: CCWorkspace | null, selected: number) {
  if (!w) return null;
  const e = tutorEvidence(w, selected)!;
  return {
    language: w.language,
    problem: {title: w.exercise.title, brief: w.exercise.brief.slice(0, 1300), contract: w.exercise.contract.slice(0, 1000), independent: Boolean(w.exercise.independent)},
    code: w.source.slice(0, 7500),
    evidence: {
      issue: e.issue, selected: e.selected + 1, total: e.total, passed: e.passed,
      completed: e.completed, label: e.label, args: e.args, expected: e.expected,
      actual: e.actual, error: e.error?.slice(0, 800), line: e.line,
    },
  };
}

export function predictionVerdict(raw: string, w: CCWorkspace | null, selected: number): {valid: boolean;correct?: boolean;message: string} {
  const evidence=tutorEvidence(w,selected);
  if (!w?.result || !evidence?.completed) return {valid: false, message: 'Run your program first. A prediction needs completed recorded evidence.'};
  const row = w.result.results[w.mode === 'custom' ? 0 : evidence.selected];
  if (!row || row.error || !Object.prototype.hasOwnProperty.call(row, 'actual')) return {valid: false, message: 'This test has no returned value to compare. Fix the runtime error first.'};
  let guess: unknown;
  try {guess = JSON.parse(raw);} catch {return {valid: false, message: 'Use JSON: 7 for a number, [1,2] for an array, or null.'};}
  const correct = matches(guess, row.actual);
  return {valid: true, correct, message: `${correct ? 'That matches the recorded execution.' : 'Your prediction and the recorded result differ.'} You predicted ${short(guess)}; your code returned ${short(row.actual)}. ${w.mode === 'suite' ? `The contract expected ${short(evidence.expected)}.` : 'This was a custom experiment, not a graded test.'} Compare the return line with this input.`};
}
