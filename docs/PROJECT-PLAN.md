# DSA Quest — executable project plan

Active status: v0.6 implemented; see `V0.6-DIRECTION.md` for the current coding-first plan. The milestones below preserve the original v0.1 history. Owner and first learner: the project creator. Date: 9 November 2026. The retained vision is in `VISION-AND-DECISIONS.md`.

## Milestone 1 — the Stack vertical slice (implemented)

| Work package | Deliverable | Acceptance check | Status |
| --- | --- | --- | --- |
| Foundation | React/TypeScript/Vite, pure learning rules, versioned local state | Build passes; corrupted saves handled | Done |
| Welcome | Optional name and baseline, skip path | A new learner can start without DSA vocabulary or an account | Done |
| Dashboard | Next action, six-step trail, XP, levels, mastery state | Locked steps have prerequisites; continue points to the next unfinished activity | Done |
| Discover | Red-block puzzle, top-only rule, hints, useful mistakes, restart | Red cannot be removed through covering blocks; reward is once only | Done |
| Observe/understand | Push/pop/peek playground, LIFO explanation after discovery | Returned value, size, top, empty behavior are correct | Done |
| Practice | Prediction, Undo, debug challenges | Wrong attempts get feedback; hints never penalize exploration | Done |
| Coding bridge | Guided JavaScript push/pop/peek | Correct array methods and last index connect visuals to code | Done |
| Check/transfer | Immediate questions, three novel-context forms | No hints or correctness until submission; exposed forms cannot earn fresh mastery | Done |
| Retention | Fresh check at 48 hours, separate rehearsal | Early rehearsal cannot replace retention; original due time stays fixed | Done |
| Field notes | Scores, confidence, gain, activity, reflection, history, export | First snapshots remain distinct; baseline skip never invents a gain | Done |
| Quality | Meaningful rule tests, production build, browser walkthrough, responsive checks | See `VERIFICATION.md` | Done |

## Milestone 2 — learn from the creator’s actual experience (next)

1. Start a fresh experiment and complete the baseline without external help.
2. Play each lesson step. Write down every “what do I do now?” or unexplained surprise.
3. Take the immediate and independent checks honestly. Save the diary.
4. Return in 48–72 hours, before reviewing, and take the delayed check.
5. Triage each difficulty: interaction, rule, explanation, notation, code, transfer, retention.
6. Choose the largest learning obstacle. Write the observed failure, proposed change, and expected learning outcome.
7. Implement that change and check rules again. Use a fresh question form or a new learner when measuring improvement; do not compare a repeatedly memorized test as if unseen.

**Exit criteria:** creator can explain LIFO, predict an unseen sequence including peek, distinguish pop from peek, complete the code bridge, apply the pattern to a fresh situation, and retain it later. If not, keep iterating here.

## Milestone 3 — other beginners

Recruit 3–5 willing beginners with varied backgrounds. Use the same unassisted protocol, record consent and a pseudonymous learner identifier, and avoid coaching during measurement. Capture confusing clicks, hints, mistakes, time, explanations, pre/post/delayed scores, and novel transfer. Define success thresholds before the trial. Review qualitative failures alongside scores. Add and review new equivalent forms before repeated trials.

**Exit criteria:** learners navigate without the creator explaining the UI, and independently apply the concept. The small sample supports design decisions, not broad efficacy claims.

## Milestone 4 — expand only the parts that worked

Build Arrays/Sorting and Queues as complete new loops. Reuse feedback, assessment, persistence, and progress primitives while giving each concept a distinct concrete game. Add explicit topic state and data migrations. Expand the adventure map only when a real lesson exists. Test each topic before continuing to trees, search, or graph exploration.

## Milestone 5 — richer coding and adaptation

Add pseudocode ordering, code traces, free-response code, and a separately designed safe code runner. Replace fixed selectors only when the beginner transition is clear. Start with deterministic recommendations based on misconceptions. Build a Revision Room with fresh spaced checks. Test accessibility, screen-reader flow, touch, and slower devices more broadly.

## Milestone 6 — services only when needed

Add accounts, cross-device progress, a FastAPI/PostgreSQL service, and appropriate privacy/data controls when local testing requires them. Consider an AI tutor only after curated feedback gaps are observed. Keep the tutor away from hint-free independent checks. Daily missions, optional leaderboards, more worlds, and richer adventure visuals remain product choices rather than blockers.

## Release workflow

For every content or behavior change: state the learning problem → modify the smallest relevant step → run `npm test` and `npm run build` → walk through affected screens on desktop and phone → check a refresh and a revisit → update verification notes → collect learner feedback. Record new product decisions in the retained vision document.

Backlog priority: learning blockers → incorrect feedback or scoring → save/recovery issues → accessibility/navigation obstacles → explanation/code transitions → cosmetic refinements → new topics → infrastructure.
