# v0.1 verification record

Verified on 9 November 2026. These are development checks using synthetic QA answers, not evidence that a human learner improved.

## Automated checks

- `npm run build`: passed strict TypeScript compilation and Vite production build; generated the bundled portable preview.
- `npm test`: 17 tests passed in `src/engine.test.ts`.
- Coverage includes blocked tower moves, rescue order, immutable LIFO operations, zero/duplicate values, non-mutating peek, empty stack, invalid values, six-item capacity, idempotent rewards, uncertainty responses, incomplete answers, fresh-only mastery and prerequisites, form exhaustion, first-post retention timing, early-retention rejection, rehearsal separation, valid question keys, persistence round-trip, and malformed-save recovery.

## Browser walkthrough

Verified in the in-app browser on the local development server, plus the bundled production HTML served over HTTP:

- Welcome, name, five-question baseline, confidence, and baseline-skip path.
- “Not sure” submits successfully and scores as incorrect.
- Refresh during baseline resumes at the unanswered question, preserving previous answers.
- Baseline result hides explanations until the discovery puzzle is complete.
- Dashboard next action, locked milestones, and honest skipped-baseline reporting.
- Covered red-block attempt explains the obstruction; progressive hint works.
- Correct rescue awards 40 XP; playground follows discovery.
- Push 21, peek 21, pop 21 produces the correct returned values and original remaining [8, 13].
- Practice prediction, Undo, and debugging; wrong answer → hint → correct retry; all three complete.
- Guided JavaScript choices and explanatory code trace; stage completion unlocks check-in.
- Immediate result, first-score gain, and 48-hour review scheduling.
- Fresh independent form, no hints or answer feedback during the check, explanations after submission, 3/3 mastery badge, and 300 total XP at full completion.
- Reload preserves six completed stages, scores, confidence, diary notes, and XP.
- Diary download inspected: project identifier, three result records, timestamp, and saved reflection were present.
- Explicit reset guard: reset is disabled until RESET is typed. Synthetic QA progress was cleared afterward.
- Console check after the production preview: no warning or error entries.

## Responsive and keyboard checks

- Desktop and narrow phone breakpoint inspected, including dashboard, Field notes, and tower controls.
- Phone navigation opens with focus on the first navigation action; hidden navigation is removed from the accessibility tree.
- Narrow-screen history overflow was found and fixed. Document scroll width equals client width on the phone dashboard, tower, and Field notes. The wide history table scrolls within its own container.
- Menu and reset dialog contain keyboard focus and support Escape. Visible focus styles and reduced-motion rules are included.
- Temporary viewport override was reset after verification.

## Verification limits

- The 48-hour gate and completed-retention state were verified with deterministic time-boundary tests; no actual two-day human retention experiment has happened yet.
- Three fresh independent forms exist. Transfer is currently multiple-choice; free-response coding mastery remains outside v0.1.
- The portable HTML was verified over HTTP using its inline production bundle. Direct `file://` navigation is blocked by the automated browser’s URL policy, so double-click behavior was not verified through that browser. Use the documented Vite server if your browser restricts local-file execution or storage.
- A full external accessibility audit, broad browser/device matrix, and trials with real beginners are next-stage work.
- No remote deployment, backend, AI tutor, accounts, or full curriculum were introduced.
