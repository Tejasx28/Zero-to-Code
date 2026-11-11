# Phase 6 — C.C. 2.0 validation

## Why this exists

The previous C.C. UI exposed many disconnected tools and low-context prompt templates. Phase 6 replaces the main interaction layer with one tutoring conversation; the existing editor, game grading, saved progress and runner remain authoritative.

## Scope

- New dock portrait and responsive conversational panel, with state-sensitive styling and reduced-motion support.
- Code Studio's legacy C.C. action grid is replaced with a single invitation to talk.
- C.C. chat uses actual workspace metadata, selected test, recorded errors and results. No fabricated runtime results.
- On-device tutor works with no API. Real provider-backed AI is available **only** when server-side environment is configured and the learner explicitly opts in.
- Prediction Duel asks for a forecast **before** showing the previously recorded result. It doesn't award or change progress.
- The API is limited to context, code and recent chat; never send the whole learner profile, notes, saved progress, other files or API keys.
- Existing C.C. open actions redirect to the same unified conversation surface; old menus are not the primary interface.

## Run automated verification

```
npm ci
npm test
npm run build
node scripts/verify-cc2-backend.mjs
npm run dev
```

Check that no TypeScript errors appear and no legacy tests regress. A simulated response test does **not** prove a working paid API key.

## Manual desktop checks

1. Open Home, then C.C. (floating portrait). Verify first-run welcome, focus into input, Escape to close, Alt+C toggling and focus restoration.
2. Open Code Studio in Python. Verify Code Studio displays the new C.C. invitation, not the old tool grid.
3. Type an incorrect loop accumulation (`total = value` where `total += value` is intended), run tests, ask why it failed. Check that the reply says *possible cause* and references the actual selected input/output.
4. Open a suite where tests pass. Verify C.C. reports the complete result, not an invented pass.
5. Stop a run. Verify no pass is claimed; C.C. identifies incomplete or cancelled evidence.
6. Change from Python to Java and confirm the conversation resets to avoid mixing evidence.
7. Select a test, open Prediction Duel, and enter incorrect/correct JSON forecasts. Verify the revealed output comes from `RunResult`, not `expected`, and doesn't change scores.
8. Click "Line N" when the runner reports one. Verify the editor focuses the requested line if supported.
9. Open old lessons where the C.C. avatar appears. Verify the redesigned inline portrait is present and still opens the new chat.
10. Open the Notes page; exported progress, reimport, language-scoped passes and old game checks still work.

## Manual mobile and accessibility checks

1. At 360px / 390px / tablet widths, check that panel text, composer, portrait and all buttons fit with no horizontal scrolling.
2. With keyboard only, test summon, send (Enter), newline (Shift+Enter), quick prompts, clear chat and Escape. Focus should return to the opener.
3. With Reduce Motion active, verify portrait and message animations are disabled.
4. On a slow network, verify Stop prevents a stale AI answer being inserted after cancellation or navigating to another exercise.

## Privacy and failure cases

- In the default off mode, using C.C. never sends code to `/api/cc2`.
- With no `CC2_ENABLED=true` or no key, connected mode responds unavailable and continues with explicitly labelled **Local guide** output.
- In real connected mode, only the current code, selected test evidence, question and up to 10 previous messages are posted.
- Do not commit `.env.local`; environment keys must stay server-side. Confirm `VITE_*` variables contain no secrets.
- Validate short, malformed, oversized, cross-origin, and rate-limited API requests with the included backend smoke test.
- Enable platform-level protection before exposing a billable API publicly: this patch has only best-effort per-instance limits, not production-grade global abuse protection.

## Local verification — 11 November 2026

- Applied to merged Phase 5 (`f87aeca`) on `codex/phase6-cc2-redesign`. The installer dry run passed after adapting its branch guard to the review branch and normalizing Windows line endings in its temporary source reads.
- All 185 tests passed across 31 files. The production build passed with the existing large-bundle warning. Added the missing `@types/node` development dependency required by the new Vite server code.
- All 19 backend smoke checks passed with simulated upstream responses. Checks include request validation, allowlisted context, disabled service, missing key, origin/scheme restrictions, malformed/oversized requests, provider errors, and rate limiting. CI now runs this script alongside unit tests.
- Fixed misleading tutoring for mixed suites, empty suites, custom experiments, incomplete results, and stale running evidence. Prediction Duel now requires completed recorded evidence. Added four regression tests for these cases.
- Local browser chat explained a function without connected AI. A real Python program returning constant `7` passed only one of four tests; C.C. correctly distinguished the matching Example test from the failed suite. Prediction Duel compared forecast `8` with actual `7`, separately identifying expected `8`.
- Real Java addition passed all four tests, and C.C. reported 4/4. Recorded Python steps remained accessible. The Code Studio invitation is visible when chat is closed; the selected C.C. test can be changed in the evidence panel.
- Verified composer focus, Escape/focus restoration, Alt+C toggling, chat clearing, and conversation/consent reset on language changes. Explicit opt-in against the disabled local endpoint produced a labelled Local guide fallback; no real model request was made.
- Fixed phone clipping and nested scrolling; checked 360px/390px panel layout with composer/footer reachable while evidence and duel were expanded. The existing Readable setting also covers new chat text. OS reduced-motion, full assistive-technology testing, and every legacy game were not manually rechecked.
- Context is allowlisted server-side; `.env` files are ignored. Pending requests abort on source/test/result changes or opt-out, and predictions reset with evidence. Live slow-provider cancellation remains a manual deployment check; no paid API key, real AI quality, or Netlify deployment was verified.

The branch is for review. It has not been merged, and local checks do not establish a GitHub Actions result.

## Known limitations

- Real AI responses require a backend configured with an API key; the offline tutor is intentionally limited and will not understand every question.
- C.C. cannot execute new code or rewrite the learner's file through a response; use the existing runner and editor controls.
- C.C. does not claim Java statement-by-statement traces; Python X-ray remains a separate recorded execution feature.
- This phase does not create a hidden persistent profile of chat messages. Questions are kept in component memory during the active workspace and can be cleared.
- A live end-to-end API call, accessibility audit with assistive technology, and real learner research remain deployment gates.
