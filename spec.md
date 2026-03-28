# nicheamb — Dynamic Confidence System

## Current State
- Topic model has `numericConfidence: number` (0–100), `lastStudied: string` (human-readable, not a timestamp), `revisionCount: number`.
- Confidence is set at assessment and can be edited inline in SubjectsTab but does not change automatically.
- No decay logic. No trend tracking. No retest UI.
- StudyModeTab completes sessions but does not update confidence.
- AssessmentContext has `quizAccuracy` per subject but only used at assessment time.
- AnalysisTab uses `numericConfidence` from topics for priority and score prediction — these values stay static after assessment.

## Requested Changes (Diff)

### Add
- `lastStudiedTimestamp: number` field on Topic (Unix ms). Replaces the string `lastStudied` for decay calculations. Keep string field for display.
- `confidenceTrend: number[]` field on Topic — last 5 confidence snapshots for trend direction.
- `decayStatus` derived value (computed, not stored): `"Fresh"` (< 3 days), `"Fading"` (3–7 days), `"Needs Revision"` (> 7 days), based on `lastStudiedTimestamp`.
- `ConfidenceEngine` utility module (`src/frontend/src/utils/confidenceEngine.ts`) exporting:
  - `applySessionUpdate(current, focusQuality: 'high'|'low'|'incomplete'): number` — caps increase per session, prevents jumps.
  - `applyQuizUpdate(previous, quizAccuracy): number` — formula: `0.6 × prev + 0.4 × quizAccuracy`.
  - `applyDecay(current, daysSinceStudy): number` — gradual decay inspired by Ebbinghaus curve.
  - `getDecayStatus(daysSinceStudy): 'Fresh'|'Fading'|'Needs Revision'`.
  - `getTrend(snapshots: number[]): 'up'|'down'|'stable'`.
  - `calcSubjectConfidence(topics, examWeight): number` — weighted average.
- `updateTopicConfidence(subjectId, topicId, newConfidence)` action in SubjectsContext — pushes to `confidenceTrend` array (max 5 entries).
- Retest Modal component (`RetestModal.tsx`) — 3–5 questions per topic (from a small seeded bank), outputs accuracy %, calls `applyQuizUpdate`, updates confidence immediately. Prompt: "Re-test this topic to validate your understanding."
- Visual confidence badge on each topic row in SubjectsTab: `XX%` + trend arrow (↑ / ↓ / —) + decay label badge (`Fresh` / `Fading` / `Needs Revision` in appropriate colors).
- Subject-level confidence display in SubjectsTab subject header (weighted average of topics).
- Auto-decay runner: on app load and on tab focus, run `applyDecay` for all topics based on `lastStudiedTimestamp`, update `numericConfidence` silently.
- Study session confidence update: when StudyModeTab completes a session, call `applySessionUpdate` with focus quality derived from timer completion (full session = high, partial = low, cancelled = incomplete), update topic confidence and set `lastStudiedTimestamp = Date.now()`.

### Modify
- `Topic` interface in `mockData.ts`: add `lastStudiedTimestamp: number`, `confidenceTrend: number[]`.
- `initialSubjects` in `mockData.ts`: populate `lastStudiedTimestamp` values (relative to now) and `confidenceTrend` with 3–4 realistic snapshot values.
- `SubjectsContext`: add `updateTopicConfidence` action; persist subjects to localStorage so confidence changes survive page reload.
- `StudyModeTab`: on session complete, call `updateTopicConfidence` with updated value from `applySessionUpdate`.
- `AnalysisTab`: Priority Engine and Score Prediction already use `numericConfidence` — no formula changes needed, but now values will update dynamically. Add subject-level confidence column to subject summary section.
- `SubjectsTab`: render confidence badge, trend arrow, and decay status label per topic.

### Remove
- Nothing removed.

## Implementation Plan
1. Update `Topic` interface and `initialSubjects` in `mockData.ts`.
2. Create `src/frontend/src/utils/confidenceEngine.ts` with all confidence logic.
3. Update `SubjectsContext`: add `updateTopicConfidence`, persist subjects to localStorage, run decay on init.
4. Update `StudyModeTab` to call confidence update on session completion.
5. Create `RetestModal.tsx` with topic question bank and confidence update on submit.
6. Update `SubjectsTab` to show confidence %, trend arrow, decay badge, and subject-level confidence.
7. Validate build.
