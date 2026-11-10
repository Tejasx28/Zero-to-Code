# Zero-to-Code v0.9 — Patch 2 verification

## Scope

This patch stabilizes the existing ten-world Play → Code → Remix learning system. It does **not** add an LLM tutor, Code-to-World visualization, backend service, accounts, or a redesign of C.C. It preserves the original `dsa-quest:v0.2` browser-save format and the original programming-game pass keys.

## Automated acceptance tests

After applying to a branch from the Patch 1 merge:

```powershell
npm ci
npm test
npm run build
```

If the computer also has Python and a JDK available, run the optional maintainer fixtures:

```powershell
node scripts/verify-examples.mjs
```

This additionally executes the five new reference remixes in both languages. It can take several minutes and is not required for students.

## Browser verification — both Python and Java

1. **Foundation progression.** Use a fresh browser profile. Home recommends Functions. Complete `contract` and its code task; next recommendation should be Conditions (`gate`). After Conditions it should recommend Loops (`relay`). The cargo game should appear after all three foundations. Existing advanced-user game completions should remain respected.
2. **Black Knights Cargo.** Go Games → Cargo. Rehearse the valid/invalid crate decisions, open Code, and pass all six authored cases. Refresh. Confirm the pass and selected Code stage remain saved; open the `quest-budget-left` independent remix and verify it is a separate task.
3. **Five v0.9 worlds.** Open stack, queue, binary, prefix, and sorting. Rehearsal must respond to choices, have a reset button, and remember completion independently per language. Each game's Program stage must show six cases, expected and returned values, and its first failing case.
4. **Remix transfer.** After passing each game, the recommended independent remix must be the corresponding new task, not an unrelated exercise. Confirm new practice IDs: `quest-stack-departures`, `quest-queue-waiting`, `quest-binary-insertion`, `quest-highest-prefix`, `quest-one-sort-pass`.
5. **Failure feedback.** Submit a starter or deliberately incorrect program and verify the first failed test is highlighted. A failing run must never mark a new game as passed. A good run must award a pass, which is still remembered after later unsuccessful edits.
6. **Worker interruption.** Start a run and press Stop. It must not award a pass or increment the new complete-attempt counter. An unavailable runtime should show an error rather than displaying false ✓ marks.
7. **Language independence.** Pass a game in Python, change to Java, and verify Java keeps a different source and has its own pass state. Switch back and confirm the Python draft and result are preserved.
8. **Revisit.** Switch from Rehearse to Program, navigate to Home, then return. The chosen stage should be restored for that game and language.
9. **Legacy saves.** Import a Patch 1 progress backup. Previously saved story, games, practice, debug, notes, and quiz results must still display correctly. Old independent remixes must remain available in Practice.
10. **Responsive design.** Check the new worlds at 1440 px and 390 px widths. The editor, code-run controls, C.C. panel, stage buttons, and six test selectors must remain usable without page-wide horizontal scrolling.

## Important meaning of completion

- **Rehearsed:** the learner completed the manual demonstration, not a coding pass.
- **Program checked:** all six real authored cases were passed in the selected language.
- **Independent remix:** a separate practice problem with a fresh starter; hint and full scaffold are disabled.
- **Saved pass:** historical pass evidence. A later failing draft does not erase that record, but it is not falsely shown as a current passing result.
- **Invalid/incomplete worker run:** not counted as a completed attempt or a pass.

Passing a finite suite does not prove mastery; fresh-task performance and learner tests remain necessary.

## Suggested PR checklist

- [x] Automated unit tests pass on developer machine
- [x] Production build passes
- [x] Additional Python and Java authored reference fixtures pass (where native tools available)
- [x] Both language runtimes verified in browser
- [ ] All ten Play → Code → Remix paths inspected
- [ ] Existing progress restored and drafts remain separate
- [ ] CI checks on PR pass
- [x] No changes merged before review

## Local verification — 11 November 2026

- 126 tests passed across 24 files. Production build passed; the existing large-chunk warning remains.
- Native authored-program verification checked 754 Python/Java cases across 57 reference programs, seven deliberately broken programs and four incomplete frames in each language.
- Browser checks used an isolated local origin: Reactor failed correctly at the first test, a stopped run did not increment its attempt counter or award a pass, and correct Python and Java controllers each passed all six cases.
- Refresh restored Program stage and saved pass. The recommendation opened the fresh, independent highest-prefix contract with no solution hints. Java started with its own unpassed state and draft.
- Phone-width check at 390 px showed a 375 px document width, without page-wide horizontal overflow.
- The patch omitted updating the existing practiceContent count assertions. These were updated from 29 to 34; all contract and uniqueness checks remain intact.
- This is targeted browser verification, not a completed manual traversal of every world. The unchecked broader checks and PR CI remain for review.
