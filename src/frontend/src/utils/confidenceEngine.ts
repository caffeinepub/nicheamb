// ── Confidence Engine ─────────────────────────────────────────────────────────
// Pure functions — no side effects, fully testable.

/**
 * Session update — capped at +8 max increase per session.
 * high focus: +5 to +8 (scaled by gap to 95), low focus: +1 to +3, incomplete: -2 to 0
 */
export function applySessionUpdate(
  current: number,
  quality: "high" | "low" | "incomplete",
): number {
  let delta = 0;
  if (quality === "high") {
    // Scale increase: higher gap from 95 → larger boost, max +8
    const gap = 95 - current;
    delta = Math.min(8, Math.max(5, Math.round(gap * 0.12)));
  } else if (quality === "low") {
    delta = current <= 30 ? 3 : current <= 60 ? 2 : 1;
  } else {
    // incomplete
    delta = current <= 20 ? 0 : -2;
  }
  return Math.min(95, Math.max(0, current + delta));
}

/**
 * Quiz update — high impact.
 * Formula: (0.6 × previous) + (0.4 × quizAccuracy)
 */
export function applyQuizUpdate(
  previous: number,
  quizAccuracy: number,
): number {
  const result = 0.6 * previous + 0.4 * quizAccuracy;
  return Math.round(result * 10) / 10;
}

/**
 * Ebbinghaus-inspired decay.
 * < 3 days: no decay
 * 3–7 days: -3 per day beyond day 3
 * > 7 days: -2 per day beyond day 7 (compounded from the 7-day amount)
 * Floor at max(0, current - 40)
 */
export function applyDecay(current: number, daysSinceStudy: number): number {
  if (daysSinceStudy < 3) return current;

  let decay = 0;
  if (daysSinceStudy <= 7) {
    decay = (daysSinceStudy - 3) * 3;
  } else {
    // first 4 days (3→7): 4 × 3 = 12
    decay = 4 * 3 + (daysSinceStudy - 7) * 2;
  }

  const floor = Math.max(0, current - 40);
  return Math.max(floor, current - decay);
}

/**
 * Decay status label based on days since last study.
 */
export function getDecayStatus(
  daysSinceStudy: number,
): "Fresh" | "Fading" | "Needs Revision" {
  if (daysSinceStudy < 3) return "Fresh";
  if (daysSinceStudy <= 7) return "Fading";
  return "Needs Revision";
}

/**
 * Trend derived from confidence snapshot history.
 * Compare first vs last; ±3 threshold for stable.
 */
export function getTrend(snapshots: number[]): "up" | "down" | "stable" {
  if (snapshots.length < 2) return "stable";
  const diff = snapshots[snapshots.length - 1] - snapshots[0];
  if (diff > 3) return "up";
  if (diff < -3) return "down";
  return "stable";
}

/**
 * Subject-level confidence: weighted average by estimated effort.
 */
export function calcSubjectConfidence(
  topics: { numericConfidence: number; estimatedEffort: number }[],
): number {
  if (topics.length === 0) return 0;
  const totalWeight = topics.reduce((sum, t) => sum + t.estimatedEffort, 0);
  if (totalWeight === 0) {
    const avg =
      topics.reduce((sum, t) => sum + t.numericConfidence, 0) / topics.length;
    return Math.round(avg);
  }
  const weighted = topics.reduce(
    (sum, t) => sum + t.numericConfidence * t.estimatedEffort,
    0,
  );
  return Math.round(weighted / totalWeight);
}
