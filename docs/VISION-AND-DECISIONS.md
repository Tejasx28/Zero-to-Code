# DSA Quest — vision and retained decisions

Source: the complete referenced “Design DSA Learning Website” conversation, recovered on 9 November 2026. Conversation ID: `6af14fc1-b6a8-83ee-9df5-c1dada9897c2`. This document preserves the product decisions and their reasons; illustrative chat widgets and sample scores were concepts, not implemented features or observed research results.

## The project’s purpose

Build a gamified, interactive, beginner-first Data Structures and Algorithms learning platform. Its creator begins with little DSA knowledge and is the first learner. If the creator cannot learn independently from the experience, investigate and improve the experience. The target outcome is moving from “I don’t understand DSA” to “I can independently solve a new problem and explain my reasoning.”

The chosen direction combines a structured learning platform with an adventure-game experience. It is a learning laboratory, with puzzles, maps, missions, and meaningful achievements serving understanding. Self-testing refines the prototype; it does not establish effectiveness for all beginners.

## Teaching commitments

1. Discover through a concrete puzzle before introducing technical terminology.
2. Make invisible behavior visible through manipulable, step-by-step simulations.
3. Use the loop Discover → Observe → Understand → Predict → Practice → Code → Review.
4. Connect everyday intuition to the technical idea, then to pseudocode or code.
5. Make mistakes useful: explain the learner’s actual action and the rule it revealed.
6. Offer contextual, progressive hints that support thinking. No AI is needed for common misconceptions.
7. Use safe retries; avoid penalties for honest exploration.
8. Separate activity, familiarity, and independent understanding. XP never implies mastery.
9. Earn mastery only through genuinely different, hint-free application.
10. Ask learners to explain ideas in their own words. Begin with a human-written self-review checklist, rather than pretending to automatically understand every explanation.
11. Capture before, immediate-after, delayed (2–3 day), and new-context performance separately, using different but comparable questions.
12. Log hints, mistakes, time, confidence, and confusion to guide revisions.

## End-to-end user journey

Friendly welcome with no prerequisites → optional, low-pressure starting-point diagnostic → adventure dashboard/map → one concept learned through the full teaching loop → novel independent check → personalized next activity and reflection → delayed revision → more topics after the lesson proves useful.

The larger diagnostic vision includes ordering numbered blocks, predicting a top-only removal, and finding a hidden number with few guesses. v0.1 deliberately uses five concrete Stack-related baseline questions to measure the first lesson. This narrows the assessment to the tested topic; it does not claim general placement across DSA.

The eventual world can include a Sorting Playground (sorting blocks, strategies, move comparisons), Queue Simulator (ticket-counter fairness and FIFO), Maze Explorer (BFS/DFS exploration), Tree Builder (structure and traversal), algorithm detective/debugging games, prediction games, and boss battles combining ideas. Arrays and Queues follow the Stack slice only after its learning experience is tested.

## Screens retained in the product vision

- Dashboard: current topic, daily quest, XP, completed topics, review needs, Continue action.
- Adventure map: progression, unlocked worlds, challenges, mastery.
- Puzzle Playground: interaction, immediate feedback, hints, safe restart.
- Algorithm Lab: Play, Pause, Next Step, Reset; eventually tie code to visual execution.
- Learning progress: strengths, repeated mistakes, retention, improvement.
- Later: Coding Practice Arena, Revision Room, AI Tutor.

v0.1 combines these into onboarding, dashboard, a multi-step lesson, practice yard, assessment/results, and Field notes. There are no fake playable future worlds or working AI claims.

## First lesson: Stack Tower

Rescue red from a tower using only top removal. Observe last-in-first-out. Learn push, pop, and peek. Predict a sequence. Connect the idea to Undo. Find an incorrect operation implementation. Complete guided JavaScript. Apply the idea to new contexts independently.

No mastery badge for merely finishing the animation or replaying the tower. The v0.1 checkpoint requires a fresh perfect three-question transfer result after coding and the immediate check. Retention remains a separate measure.

## Scope and architecture decisions

| Decision | Reason |
| --- | --- |
| One excellent complete Stack lesson first | A complete vertical slice is more testable than many unfinished topics. This refined the earlier, broader Arrays/Stacks/Queues phase-one idea. |
| React + TypeScript + Vite | Reusable interactive components, explicit learning state, simple frontend iteration. |
| CSS and code-native visuals | A consistent responsive interface without a styling runtime or image dependency; Tailwind was suggested, not a required product decision. |
| Pure learning engine with curated feedback | Correct, inexpensive, inspectable behavior before AI. |
| LocalStorage | Save early learning records without accounts or a backend. |
| Guided code now, full runner later | Bridge intuition to syntax without execution infrastructure. |
| FastAPI + PostgreSQL later | Possible future account/progress services after learning validation, not a present requirement. |
| Adaptive rules before AI | Recommend simpler or alternative examples based on actual misconceptions first. |

## Gamification decisions

Use XP, levels, safe retries, boss challenges, and mastery badges to make improvement satisfying. Reward completion once; avoid grinding the same action for XP. Boss checks must apply ideas in a different setting. Daily missions are a later feature. Leaderboards are optional, not a prerequisite for the experience. A mastery badge means a defined check was passed, not that a learner has mastered all stack programming.

## Evaluation decisions

Maintain a diary: Before → After puzzle → After coding → 2–3 days later. Ask “what can I solve independently?” as well as “did I enjoy it?” Record concrete breakdowns: puzzle mechanics vs concept, concept vs notation, notation vs code, immediate success vs later recall.

Use these findings to change instructions, hints, explanations, progression, and examples. Later invite other beginners, with varied experience, to attempt unseen pre/post/delayed problems. Do not generalize from the creator’s experience alone.

## Definition of a successful v0.1

A beginner navigates without personal assistance; the simulation is correct; the learner explains top-only removal; errors produce useful feedback; at least one unfamiliar Stack application is solved independently; progress survives returning; and the next action is clear. If those learning outcomes fail, improve the Stack journey before expanding the curriculum.
