# Phase 5: C.C. 2.0 × Code-to-World — cargo vertical slice

This implementation is an **incremental pilot**, not a site-wide C.C. rewrite or true Java execution debugger.

## What is real

- Existing `runCode` executes the learner's actual Python / Java program on the authored test cases.
- `CargoCodeWorld` projects the **actual returned list** onto the input belt, using an order-preserving match to input positions.
- The replay slider follows the input-belt timeline; when returned values cannot be assigned to input positions in order, it says so and shows no invented pickup history.
- A separate algorithm computes the *expected* decisions and warns when projected decisions differ.
- Python's preexisting optional trace can be inspected through C.C.'s X-ray panel. Java does not have an equivalent line-level trace.
- C.C. Teach / Investigate / Challenge is deterministic. Investigate responds to the real run status, case errors, return shape and capacity. Challenge is locked until a current or previously saved game pass.

## What is not claimed

- Reconstructing pickup decisions from a final return is **not** recording every executed branch, loop, or assignment. Multiple programs can return the same list with different internal steps.
- Greedy subsequence matching is ambiguous when weights repeat. The projection is deliberately labeled inferred.
- The authored six tests are strong *learning evidence*, not a formal proof that every possible input is handled.
- C.C. does not invoke a generative model or automatically determine learner intent.

## Manual verification (desktop + mobile)

1. From `main` at `c6c0c75`, create `feat/cc2-cargo-code-to-world`; run `node PATH_TO_PATCH/apply-phase5.mjs`.
2. `npm ci && npm test && npm run build && npm run dev`.
3. Open Games → Black Knights Cargo → Program; verify C.C. modes are readable and keyboard-operable. It must not show a completed result before running.
4. Run a correct Python solution against all test cases. Select each case and step through the reconstructed input belt. The manifest must be based on the **returned value**, not `expected`.
5. Run intentionally incorrect solutions: return `[]`, return `[999]`, return the right weights in the wrong order, return negative weights, exceed capacity. The world must not create an invented pickup sequence for an impossible return.
6. Run a Python function that throws an exception. C.C. must use the actual error; no successful grading or imaginary playback.
7. Switch to Java; run its reference and a broken Java solution. Ensure this shows output-based playback and makes **no claim about Java source-line tracing**.
8. Try Stop during loading and execution; stale results must not appear and the game must not pass.
9. Run with empty input cases and a legitimate `[]` return. The replay control must allow an empty result, not treat it as missing evidence.
10. Once cargo is passed, open Challenge me and its independent budget-left remix; without a cargo pass it should be locked. Existing saved passes remain valid.
11. Switch language and back, reload page, and verify drafts and completed games remain unchanged.
12. At 320, 375, 768 and 1280px widths check horizontal overflow, crate readability, labels, focus outlines and reduced motion.

## Automated tests

- `cargoReplay.test.ts` tests truthfulness, duplicates, impossible returns, oversized/invalid shape and capacity.
- `CCMissionReasoning.test.ts` tests no invented feedback, cancellation, real error and challenge gating.
- Existing tests and build must remain green; this patch introduces **no dependency** or stored-progress schema change.

## Local verification — 11 November 2026

- Applied to merged Patch 4 (`c6c0c75`) on `codex/phase5-cc-cargo`. The temporary installer normalizes Windows line endings when matching anchors; its dry run passed before any source writes.
- All 172 automated tests passed across 30 files. The production build passed with the existing large-bundle warning.
- Added regressions for completed-suite playback evidence, cancelled/failed/partial runs, valid empty output, unavailable selected cases, empty-suite coaching, and returned-order feedback. Every authored Cargo case is checked at every playback prefix.
- Real production-preview Python and Java Cargo solutions each passed six cases. An incorrect Python `[]` return showed skipped crates and targeted feedback; an actual `ValueError` showed its error and no reconstructed manifest. Stop disabled playback, preserved the draft, and showed no failed-score card.
- Empty-belt replay stayed at 0/0 with a valid `[]`. A fresh challenge stayed locked; a verified pass unlocked the independent remaining-capacity remix. Its button opened `/practice/quest-budget-left` with a fresh starter.
- After reload and language switching, separate Python/Java Cargo drafts and prior game passes remained. Phone (320px) and tablet (768px) layouts had no horizontal page overflow; coach controls were readable.
- Review fixes distinguish pending/running/error/output states, reset playback when editing or running, clamp empty timelines, reject empty-suite coaching, use actual output order instead of guessing from loop keywords, and avoid marking cancelled/incomplete runs as failed tests or scored attempts. The UI explicitly labels repeated-weight matching as inferred.
- Impossible/reordered/invalid/overloaded manifests are covered by automated tests. Broken Java, all other worlds, all mobile widths, OS reduced motion, and a full keyboard/screen-reader pass were not manually rechecked.

Phase 5 is a review branch and must not be reported as merged. Check GitHub CI separately after opening its PR.

## Follow-on architecture

After this pilot is validated, implement a **structured event stream from instrumented learner execution** (`input`, `read`, `branch`, `state`, `return`) with bounded events and consent-based recording. Python currently provides its own generic trace; Java would need its own safely instrumented execution pipeline. Do not label inferred state as actual trace.

To expand C.C.: centralize these case-specific insight rules into a testable per-concept tutor library, track learner misconceptions locally and give learner-controlled help. Keep correctness owned by execution tests.
