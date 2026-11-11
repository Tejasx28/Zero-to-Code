# DSA Quest v0.9

Learn Python and Java through short explanations, code games, real programs, and useful debugging practice. The path now introduces 16 short topics, including stacks, queues, search, sorting, and counting work.

## Run

Use Node.js 22.12 or newer. In PowerShell:

```powershell
git clone https://github.com/Tejasx28/Zero-to-Code.git
cd Zero-to-Code
npm ci
npm run dev
```

Open the Local address printed in the terminal, usually http://127.0.0.1:5173/. Keep the terminal open. On a new machine, run `npm ci` first. Ctrl+C stops the server. Use the same address and port to keep the same browser progress.

The first Python/Java runtime download needs internet. Python uses Pyodide and Java uses CheerpJ. Learner code runs in terminable browser workers. It is not executed on your host or sent to a grading backend.

`npm run build` is safe: it creates production files without deleting source or browser progress. `PLAY-DSA-QUEST.html` is a visual preview of the lessons; use the local server for the full app, Debug Lab, and code execution.

## New in v0.9

C.C. is a movable field link with an animated command hub. **Scan & repair** checks supported Python naming/reset patterns, explains each finding, and offers individual or combined reviewed patches. It does not guarantee an arbitrary algorithm is correct. Run tests after a repair. Java retains actual compiler/test evidence and reviewed spacing tools apply to Python.

**Starting structure** supplies an editable array-function scaffold in one reviewed action. **Boundary radar** runs real authored edge cases without awarding a task pass. **Branch & rewind** saves and compares a local checkpoint for the current task and language. Help is recorded separately from independent work. Full scaffolds are disabled on independent tasks.

Zero now introduces every game with a short, replayable Next/Back briefing. The former rules panel becomes an implementation lens. His masked avatar is an original code-drawn illustration.

Five new worlds: Avalon Rescue Stack, Resistance Dispatch, Zero’s Frequency Intercept, Sakuradite Reactor, and Knightmare Sorting Rail. Each has an interactive rehearsal, a free-writing Python/Java controller, six real tests, and a related problem.

Ten added topics: stacks, queues, binary search, prefix sums, sliding windows, frequency counts, linear search, two pointers, sorting, and counting work. These are short introductions with code-word cards and practice links, not a claim of a complete curriculum.

See [v0.9 walkthrough and checks](docs/V0.9-WALKTHROUGH.md).

## The rebuilt frontend

Forest green, sand beige, and purple actions keep the original identity. The page layouts and learning flow are new: a mission home, a floating six-destination dock, flip cards, animated code constructs, a focused editor, and C.C. beside the work. One language switch stays in the header. The requested elayadesign skill and its font overlay have been removed.

| Section | Purpose |
| --- | --- |
| Home | One recommended next step, with optional beginner warm-ups |
| Games | Play a rule, program it, then solve a changed contract |
| Learn | Short theory cards, a small animation, and code-word explanations |
| Code | A focused editor for story coding tasks |
| Practice | 34 problems with separate saved drafts and results |
| Repair | Fix a broken program, then rebuild it from a fresh starter |

Notes are in the footer and C.C.'s help. They do not compete with the learning sections in navigation.

## Games that lead to code

Open **Games** from the main navigation. Each world follows Play → Code → Remix:

| World | Play | Code and transfer |
| --- | --- | --- |
| Knightmare Courier | Pilot a grid route, collect beacons, and test blocked moves | Your played route becomes a case. Write the controller; then write a fresh blocked-move counter. |
| Black Knights Cargo | Load a conveyor while capacity changes | Program the loading rule; then return the remaining capacity under a changed contract. |
| Mirror Vault | Reverse the key row within a swap budget | Write the reversal; then independently swap neighboring pairs. |
| Signal Siege | Select an unbroken positive chain; handle interference and ties | Return the longest chain's boundaries; then write a below-threshold streak function. |
| Counterexample Arena | Choose an input and expected result that expose a buggy drone | Run the actual Python/Java mutant, repair its code, then write a related search. |

Four worlds offer an optional starting frame with the setup and loop shape. You still write the decisions and updates. Frames record assistance. The code is checked on varied inputs. The visual replay follows your returned result; it is not a fabricated execution trace. A game clear is separate from a fresh practice pass.

Practice now has **34 problems**, including five additional independent remixes for stacks, queues, binary search, prefix sums, and sorting. Earlier code warm-ups remain available under Learn as optional syntax support.

## C.C.: from an idea to code

Click her notification, portrait, a **What do I type?** action, or press Alt+C. Help opens alongside the editor on desktop and as a sheet on phones.

- **Code words:** choose a plain action such as “Visit every item,” “Read a position,” “Choose when to act,” or “Keep an item.” See a short animation, use the names from the current function, and tap unfamiliar syntax for its meaning. Add one construct into the actual editor at a chosen location. Its placeholder stays editable and Ctrl+Z undoes the step. This teaches syntax without supplying the full algorithm.
- **Try one change:** save a real return or error, edit code, then rerun the same input. Compare the two versions. No written guess or explanation is required; this experiment does not award a task pass.
- **Watch one value:** select an actual recorded Python variable, jump to its next change, pin a moment, and compare values or changed array slots. Java offers real compiler/return evidence and same-input experiments instead of invented snapshots.
- **Read my line / Unblock this run:** short instruction and keyword explanations, the exact error, reviewed spacing repairs, and contextual hints. Syntax checks never execute a proposed whitespace repair.
- **Debugging duel:** an optional separate faulty search. A learner-written test must expose an actual mismatch. Open the selected drone's code to repair it. This training game is excluded from independent tasks.

The site explains the concepts. Students are not asked to teach the theory back or fill in free-text reasoning before they can code. Algorithm-specific hints are withheld in independent tasks; using the generic construct builder records assistance. A fresh task pass should be interpreted with that help record.

C.C. has calm, thinking, concerned, and proud reactions tied to edits and actual runs, plus a greeting interaction. Calm mode and reduced-motion preferences reduce animation. She is an authored guide, not an LLM.

The editor supports four-space Python indentation, two-space Java indentation, Enter auto-indentation, indent/unindent, visible spaces, line jumps, source downloads, focus mode, and undoable reviewed patches. A construct is inserted only when the function/block structure can be located safely; otherwise the guide explains what to fix first.

## Patch 2 — game mechanics stabilization

All ten worlds now share the same complete-suite pass rules and language-specific progress. Failed runs point to a particular test; cancelled, incomplete or runtime-error runs never award a pass. The five newer worlds offer a responsive rehearsal/program workspace, a stop button, clearly labeled real execution results, and a separate independent remix. Previously earned passes remain saved, even after a later failed attempt. Returning to a world restores its selected learning stage. The mission home now progresses through functions, conditions and loops before recommending cargo for new learners. Five additional independently graded remixes raise Practice to 34 problems; original drafts and pass keys are unchanged.

See [Patch 2 verification checklist](docs/PATCH-2-VERIFICATION.md). Run npm test and npm run build in the updated project. A real browser and live Python/Java runs are still needed to verify the changed experience.

## Navigation

Each section and selected task has its own URL. Links support normal new-tab actions. Back, Forward, direct refresh, page titles, and saved drafts work together. This remains a React application using client-side routes, rather than separate server-rendered HTML pages.

The current base is the domain root. Vite handles direct URLs in development and preview. For deployment, configure an index.html fallback for application routes. `public/_redirects` covers hosts supporting that file. Other hosts need their equivalent rewrite configuration. No public deployment was performed.

## Verify

```powershell
npm test
npm run build
npm run preview
```

The v0.9 baseline reported 117 automated tests; the stabilization pass adds backup compatibility tests. GitHub Actions also runs the Vitest suite and a production build for pull requests and pushes. Maintainers with Python and a JDK can also run `node scripts/verify-examples.mjs`. It checks 694 real-language cases: 52 reference programs and 7 intentionally broken programs and 4 incomplete starting frames in each language. Every reference must pass; every broken program must expose a failing test. Maintainers can also run `node scripts/verify-spacing.mjs` (five authored spacing fixtures) and `node scripts/verify-python-trace.mjs` (three recorder regressions). Students do not need a host Python or Java installation.

## Patch 3: Browser runner reliability

Python and Java runs use isolated, terminable workers. The UI now validates complete per-case results before granting a Code Studio pass, refuses malformed responses, handles cancellation and startup/execution timeouts consistently, and clears outdated run comparisons after edits. The Python spacing preview also rejects incomplete or malformed evidence. First runtime download still needs internet; no speedup or hardened security sandbox is claimed. See [Patch 3 verification](docs/PATCH-3-VERIFICATION.md).

## Saved progress

The existing `dsa-quest:v0.2` save key and version remain unchanged. Guided games, story coding tasks, practice, debug repairs, and rebuilds have separate keys. A debugging pass does not award story completion. Rebuild unlocks are language-specific. First-attempt scores remain preserved. Download progress from My notes before clearing browser data or changing devices. You can restore a saved DSA Quest JSON file from My notes → Device storage and starting over. The app previews the learner and saved results, then requires confirmation before replacing the current browser save. Download your current progress before importing another file.

Passing finite cases does not prove an original algorithm or student mastery. Optional before/after/48-hour code checks remain available; writing a fresh program is separate evidence.

## Key files

- `src/ContractApp.tsx`, `src/routes.ts`: page navigation and shell.
- `src/DebugLab.tsx`, `src/debugContent.ts`: repair/rebuild workflow and cases.
- `src/MissionDeck.tsx`, `src/frontier.css`: new home and frontend.
- `src/Concepts.tsx`, `src/microLessons.ts`: short animated lessons.
- `src/CodeWordGuide.tsx`, `src/codeWords.ts`: action-to-syntax guidance and safe editor insertion.
- `src/CCGuide.tsx`, `src/CCPartner.tsx`, `src/CoachLab.tsx`: authored help, experiments, and factual reactions.
- `src/CodeLab.tsx`, `src/MissionEditor.tsx`: editor and real tests.
- `src/runtime.ts`, `public/runners/`: browser execution.
- `src/questState.ts`: persisted progress.

See [research and design decisions](docs/V0.8-RESEARCH.md), [try-it guide](docs/V0.8-TRY-IT.md), and [verification](docs/V0.8-VERIFICATION.md). Prior vision, self-test, art, and deployment/AI documents are retained as project history. No new images, backend, accounts, model training, or public deployment were added.
