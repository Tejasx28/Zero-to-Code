# Test the lesson on yourself

Use the same browser, device, and address throughout the experiment. Local-file and localhost progress are separate. Do not read source questions, automated tests, or answer keys before taking the learner checks.

## Day 0 — before learning

1. If a developer test journey is present, export it and use Field notes → Start a fresh experiment. Type RESET. Only do this before the real baseline.
2. Enter an optional name and choose the baseline. Answer without help. Use “I’m not sure yet” honestly.
3. Set confidence from 1 (unsure) to 5 (can explain it). This is separate from your score.
4. The app saves the first baseline. If you skip it, gain remains unmeasured; do not invent a later “before” score.

## Day 0 — play, observe, practice, code

1. Rescue the red block. Try your own approach before using hints.
2. In the playground, try each operation. Predict the next result before clicking. Try repeated peek, an empty stack, zero, duplicates, and the six-item limit.
3. Complete prediction, Undo, and debugging practice. Hints and retries are part of learning here.
4. Complete the three code choices. Explain what each line does. Reading a completed solution is not the same as being able to write it independently.
5. Write what changed in your understanding and where the website confused you in Field notes.

## Day 0 — immediate and independent checks

1. Take the five-question after-learning check without hints, notes, or outside help.
2. The first result and confidence are saved. Gain = after percentage − before percentage, in percentage points.
3. Attempt a fresh independent form. The app shows no hints or correctness until all three answers are submitted.
4. A perfect fresh result after coding/check-in earns Pattern Explorer. A failed form remains in history; the next try uses a different form. Only three fresh forms exist in v0.1.
5. In your own words, explain why the newest item comes out first and where the pattern is useful. Check your explanation against the self-review list. It is not automatically graded.
6. Export the diary. Do not reset the experiment.

## 48–72 hours later — retention

1. Return before rereading the lesson. The fresh memory check unlocks 48 hours after the first immediate check.
2. Take it independently and set your current confidence.
3. Explain the idea again, including what feels weaker than before.
4. Export the updated diary. A practice rehearsal is always labeled practice and does not replace this result.

## Decide what the website should change

| Observation | Next design investigation |
| --- | --- |
| I could not find the next action | Navigation, labels, or progression |
| I solved the tower but cannot explain its rule | Discovery-to-explanation connection |
| I know LIFO but cannot predict operations | Visualization and deliberate prediction |
| I confuse peek with pop | Show a comparison of state before/after |
| I understand the picture but not the code | Array indexing and notation bridge |
| I pass familiar questions but fail transfer | Add a contrasting application before a fresh check |
| I do well immediately but forget later | Spaced practice and retrieval design |

One learner’s improvement can guide changes, but repeated exposure, guessing, varied difficulty, and outside learning affect results. Validate with other beginners later. A multiple-choice transfer check is an early measure, not a substitute for eventual open-ended problem solving and code.

## Developer/manual smoke checks

- Fresh welcome and diagnostic skip path both reach a clear next action.
- Attempting a covered block preserves the tower and explains the mistake.
- Correct rescue takes green, blue, orange, then red; replay does not add XP.
- Push/pop/peek match the visible array and returned value. Empty operations are safe; invalid pushes and the six-item cap explain their limits.
- Practice wrong answer → hint → retry works; correct completion survives refresh.
- Code selections survive refresh; incorrect choices explain the misconception.
- Assessment navigation never reveals correctness before submission. “Not sure” can be submitted and counts as incorrect. Refresh resumes a partial check.
- A new perfect transfer form earns the badge; an exposed form cannot. After all three forms, no form is called fresh again.
- Delayed check is locked before 48 hours; rehearsal stays separate. The boundary is verified with the automated clock tests, without changing a real learner’s clock or save.
- Notes and first scores survive refresh; JSON export includes the record; reset requires the explicit phrase.
- Try a narrow phone viewport, menu, all controls, keyboard focus, browser zoom, and reduced-motion preference.
- Run the production build and the automated tests before delivering changes.
