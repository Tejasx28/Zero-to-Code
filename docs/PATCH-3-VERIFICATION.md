# Patch 3 — Execution reliability verification

This patch hardens the existing browser-worker runtime. It deliberately **does not** change the teaching curriculum, Python/Java function contracts, game designs, C.C. behavior, or the progress storage key.

## Changes

1. **Reliable suite results.** Code Studio uses the same complete-suite verdict as the games. It cannot award a pass or count an attempt for a cancelled worker, global runtime failure, malformed result, or incomplete suite.
2. **Worker response validation.** Every run checks the exact number of cases, the shape of per-case results, reasonable return size, and trace frame structure before exposing evidence to the UI.
3. **Lifecycle safeguards.** Workers terminate on completion, cancellation, startup failure, unreadable messages, and timeouts. Duplicate `ready` events cannot extend the execution timeout; late events cannot revive a cancelled run.
4. **Separate startup/execution deadlines.** The first runtime download retains its 150-second budget; Python execution retains 10 seconds; Java execution retains 45 seconds. These are hard stops, not claims of guaranteed execution speed.
5. **Safer spacing checks.** The syntax preview must return one well-formed verdict for each candidate before any repair tool can trust the result.
6. **Submission guard.** A zero-test or invalid score cannot become a stored pass. Previously earned valid passes remain preserved.
7. **Bounded payloads.** Source size (60,000 characters), return size (128,000 JSON characters per test), and traces (180 frames per test) have defensive limits to prevent oversized UI evidence.

## Commands

```powershell
npm ci
npm test
npm run build
npm run dev
```

Optional maintainer verification when native Python and Java are installed:

```powershell
node scripts/verify-examples.mjs
```

## Manual browser checklist

- [ ] Start a Python Code Studio run; see load and execution status, then six test outcomes where the mission defines six cases.
- [ ] Start a Java run; verify its real compiler output and returned test values.
- [ ] Put `while True: pass` inside the Python function, press **Run all tests**, and verify the run eventually stops with a loop/step error rather than awarding a pass.
- [ ] Start a run and press **Stop**. The draft remains; no new successful attempt appears.
- [ ] Start a run, modify source while loading or executing, and verify the old run does not overwrite the new draft's evidence.
- [ ] Change the current language during a run; verify the previous worker stops, drafts stay separate, and no old result appears.
- [ ] Use C.C.'s Python spacing preview. A valid source reports valid; a malformed indentation sample reports the exact syntax failure. Stopping the preview never applies a patch.
- [ ] Complete a correct program in both languages; confirm earlier passes remain after editing to a failing program.
- [ ] Test a game and a new independent remix. Game and Code Studio result accounting remain consistent.
- [ ] If offline, try starting a **new** runtime on a browser profile without cached Pyodide/CheerpJ files and confirm the error is actionable without losing the draft.

## Security and performance constraints

- **Each run deliberately gets a new worker.** Reusing a worker after executing arbitrary learner code risks state leaking into later attempts. This patch prioritizes isolation over a potentially faster warm-worker pool.
- These workers are **not a hardened server security boundary**. Do not deploy unrestricted learner execution to a privileged environment.
- The first Pyodide/CheerpJ download and initialization can still take time, depending on network and device. No performance speedup is claimed until measured with reproducible browser benchmarks.

## Acceptance gate

Run the full test suite and production build. Manually verify cancellation, timeout, stale-result handling, normal solutions, and Python/Java language switching. Open a PR; wait for GitHub Actions to pass before merging.

## Local verification — 11 November 2026

- All 148 automated tests passed across 27 files; the production build passed. The existing large-bundle warning remains.
- Native reference verification passed 754 cases across 57 reference solutions, plus seven deliberately broken solutions and four incomplete frames per language. Authored spacing repairs and Python trace-recorder checks also passed.
- In the production preview, real Python and Java addition solutions each passed all four cases. Stopping Python left the submission count unchanged; an infinite loop produced a step-limit error. Editing during a run cleared stale evidence. Switching languages during a run prevented old results from appearing and preserved separate drafts. An earlier valid pass remained after a failing program.
- Worker startup/execution deadlines, malformed messages, cancellation races, and spacing-response validation have automated coverage. Cold offline startup, the full C.C. spacing interface, and every game/remix were not manually rechecked.
- Additional review fixes reject malformed global error data and empty suites, exclude incomplete/crashed runs from comparisons, and discard circular or oversized trace metadata before the UI reads it. Four regression tests cover these gaps.
- The supplied installer needed Windows line-ending normalization in its temporary text-matching helper before application. No archive payload was changed by that adjustment.

The branch is ready for pull-request review; this record does not claim GitHub CI has run or approve merging.
