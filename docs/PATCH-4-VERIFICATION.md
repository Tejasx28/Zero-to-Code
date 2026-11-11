# Patch 4 — Experience polish and accessibility verification

## Scope

This patch improves the *existing* Zero-to-Code website. It does not introduce new execution engines, change grades, alter saved code formats, or start C.C. 2.0 / Code-to-World.

### Delivered

1. An always-visible three-part foundation trail on Home: Functions → Conditions → Loops. Its status comes from actual current-language code passes; lesson visits alone do not earn completion.
2. A persistent `Aa Readable` header toggle for stronger small-text legibility and a larger code editor display.
3. More usable mobile navigation: minimum 44px target width when practical, larger tab labels, safe-area offsets, and mobile code font at least 14px.
4. C.C.'s floating panel uses non-modal dialog semantics (intentionally does **not** trap focus: editor and coach must remain usable together), labelled heading, and cancelled-pointer drag cleanup.
5. A second skip link to navigation, with the main workspace link retained.
6. Reduced animations for the new learning trail and decorative elements when users request reduced motion.
7. Unit tests for foundation progress calculation, language isolation, and next-step recommendations.

## Automated validation

```powershell
npm ci
npm test
npm run build
npm run dev
```

The complete suite must pass before opening a PR. The patch has been syntax-checked but not run as a complete Vite application in the source-authoring environment.

## Browser acceptance checklist

### Home and learning trail
- [ ] Fresh profile: 0/3; Functions is recommended, Conditions and Loops are available but not marked passed.
- [ ] Complete the first function's authored test cases: Functions shows completed and Conditions is recommended.
- [ ] Complete the conditions code challenge: Loops becomes recommended.
- [ ] Finish the loop's tests: 3/3, no next-step marker; Cargo remains available.
- [ ] Changing language recalculates checkmarks for that language only; changing back restores original checkmarks.
- [ ] Button, stages, and progress `<progress>` are navigable and announced without mouse.

### Readability and persistence
- [ ] Toggle Aa Readable on/off: labels, small test text, and code editor respond immediately.
- [ ] Refresh while on: readable mode remains active.
- [ ] Export and restore progress: preference returns; no existing grades or drafts change.
- [ ] Verify content wraps properly at browser zoom 200% and 400%.

### Mobile
- [ ] Test widths 320, 375, 430, and 768 pixels. All six dock tabs remain tappable; avoid horizontal page scrolling.
- [ ] On an iPhone-style safe area, bottom dock does not cover the device gesture bar.
- [ ] Open Code Studio, run tests, inspect errors and switch language: editor remains legible.
- [ ] Rotate to landscape: navigation and editor remain reachable.

### Keyboard/accessibility
- [ ] Tab from address bar: Skip to workspace, then Skip to navigation appear when focused.
- [ ] Esc closes C.C.'s floating panel and returns focus to the previous element.
- [ ] While C.C. is open, Tab can still reach the code editor (non-modal design).
- [ ] Move the coach while using a pointer; cancel the gesture and verify dragging stops.
- [ ] Enable system 'Reduce motion': decorative movement is reduced.
- [ ] Use a screen reader to check heading hierarchy, button names, dialog label and current recommended lesson.

### Regression
- [ ] Both languages run code and preserve separate saved drafts.
- [ ] All ten games remain accessible, at least one case is run in each category, and the independent remixes still work.
- [ ] Existing saved progress and imported older backups remain valid.
- [ ] GitHub Actions shows a green PR build before merging.

## Notes

### Local verification — 11 November 2026

- All 154 tests passed across 28 test files; the production build passed with the existing large-bundle warning. Added coverage for verified mission evidence, damaged records, and saved readability alongside existing drafts/progress.
- Fixed a Windows TypeScript module-resolution failure by naming the pure helper `foundationTrail.ts`, avoiding the `LearningTrail.tsx` / `learningTrail.ts` capitalization collision.
- Fixed a mobile header overflow introduced by the new control: the brand and language/readability controls now use separate rows on phones and fit tablet widths.
- Production-preview checks confirmed a fresh 0/3 trail, Functions recommendation and lesson navigation, Python/Java switching, and Readable mode surviving refresh. At 320, 375, 430, and 768 pixels, Home had no horizontal overflow and all six dock targets were at least 44 by 44 pixels.
- Confirmed the labelled non-modal C.C. dialog, Escape dismissal with focus returning to the launcher, and the navigation skip link focusing its target.
- Full screen-reader testing, operating-system reduced-motion/safe-area testing, 200%/400% zoom, drag cancellation, the complete export/restore UI, and every runtime/game regression were not manually rechecked. Preference restoration and language-specific trail progression are covered by automated tests.
- The temporary installer normalizes Windows line endings for matching; the archive's source payload was otherwise applied as supplied before the fixes above.

Patch 4 remains a review branch. GitHub CI results must be checked separately before merging.

- Preserve `src/App.tsx` and `src/QuestApp.tsx` for now. They are inactive historical implementations, but deletion is a separate migration after import/reference checking.
- Avoid changing the saved-progress schema: readable mode uses the existing validated `drafts` string dictionary.
- C.C.'s companion remains authored and deterministic. Reworking it belongs to the later C.C. 2.0 milestone.
