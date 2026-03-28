import { ClipboardCheck, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { useAssessment } from "../context/AssessmentContext";
import { useSubjects } from "../context/SubjectsContext";
import InitialAssessment from "./InitialAssessment";

export default function AnalysisTab() {
  const { subjects } = useSubjects();
  const { assessment, resetAssessment } = useAssessment();

  const [showAssessment, setShowAssessment] = useState(false);

  const isGated = !assessment.assessmentComplete || subjects.length === 0;

  if (showAssessment || (isGated && subjects.length > 0)) {
    return <InitialAssessment onComplete={() => setShowAssessment(false)} />;
  }

  if (subjects.length === 0) {
    return (
      <div
        className="flex items-center justify-center min-h-64"
        data-ocid="analysis.empty_state"
      >
        <div
          className="text-center px-6 py-8 rounded-xl max-w-sm"
          style={{ border: "1px solid #1f2937", background: "#0f1720" }}
        >
          <p className="text-sm" style={{ color: "#4b5563" }}>
            Add subjects in the Subjects tab first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AnalysisContent
      onUpdateAssessment={() => setShowAssessment(true)}
      onReset={() => {
        resetAssessment();
        setShowAssessment(false);
      }}
    />
  );
}

function AnalysisContent({
  onUpdateAssessment,
  onReset,
}: {
  onUpdateAssessment: () => void;
  onReset: () => void;
}) {
  const { subjects } = useSubjects();
  const {
    assessment,
    getDaysRemaining,
    getConsistencyFactor,
    getEffectiveHoursPerDay,
  } = useAssessment();

  const analysis = useMemo(() => {
    const daysRemaining = getDaysRemaining();
    const effectiveHoursPerDay = getEffectiveHoursPerDay();
    const consistencyFactor = getConsistencyFactor();
    const totalPlannedDays = assessment.totalPlannedDays || daysRemaining;
    const DaysRemainingFactor = daysRemaining / Math.max(totalPlannedDays, 1);

    const testScores = assessment.subjectAssessments
      .map((a) => a.testScore)
      .filter((s): s is number => s !== null);
    const pastPerformance =
      testScores.length > 0
        ? testScores.reduce((a, b) => a + b, 0) / testScores.length
        : 65;

    const subjectStats = subjects.map((s) => {
      const sa = assessment.subjectAssessments.find(
        (a) => a.subjectId === s.id,
      );
      const total = s.topics.length;
      const completed = s.topics.filter((t) => t.status === "Completed").length;
      const avgConf =
        sa?.confidence ??
        (total > 0
          ? s.topics.reduce((a, t) => a + t.numericConfidence, 0) / total
          : 50);
      const completedRatio =
        sa?.completionPct != null
          ? sa.completionPct / 100
          : total > 0
            ? completed / total
            : 0;
      const hoursInvested = s.topics.reduce((a, t) => a + t.estimatedEffort, 0);
      const strengthScore = completedRatio * (avgConf / 100) * 100;
      const riskScore =
        s.examWeight * (1 - avgConf / 100) * (1 - completedRatio);
      return {
        ...s,
        completedRatio,
        avgConf,
        hoursInvested,
        strengthScore,
        riskScore,
        total,
        completed,
      };
    });

    const allTopics = subjects.flatMap((s) => s.topics);
    const avgCoverage =
      subjectStats.reduce((a, s) => a + s.completedRatio, 0) /
      Math.max(subjectStats.length, 1);
    const avgConfAll =
      subjectStats.reduce((a, s) => a + s.avgConf, 0) /
      Math.max(subjectStats.length, 1);
    const completionPct = Math.round(avgCoverage * 100);
    const coverageScore = avgCoverage * (avgConfAll / 100);
    const totalRequiredHours = subjects.reduce(
      (a, s) => a + s.requiredHours,
      0,
    );
    const timeFactor = Math.min(
      1,
      (effectiveHoursPerDay * daysRemaining) / Math.max(totalRequiredHours, 1),
    );
    const predictedScore = Math.round(
      0.4 * pastPerformance +
        0.3 * coverageScore * 100 +
        0.2 * timeFactor * 100 +
        0.1 * consistencyFactor * 100,
    );
    const scoreRange = `${Math.max(0, predictedScore - 4)}–${Math.min(100, predictedScore + 4)}`;

    const incompleteTopics = allTopics.filter((t) => t.status !== "Completed");
    const totalRemainingWork = incompleteTopics.reduce(
      (a, t) => a + t.estimatedEffort,
      0,
    );
    const requiredDailyHours = totalRemainingWork / Math.max(daysRemaining, 1);
    const gap = requiredDailyHours - effectiveHoursPerDay;
    const paceStatus =
      gap > 0.5 ? "Critically behind" : gap > 0 ? "Behind pace" : "On track";
    const onTrack = gap <= 0;

    const urgency =
      daysRemaining > 60
        ? "Comfortable"
        : daysRemaining > 25
          ? "Tight"
          : "Critical";
    const urgencyColor =
      urgency === "Comfortable"
        ? "#22c55e"
        : urgency === "Tight"
          ? "#f59e0b"
          : "#ef4444";
    const willFallShort = !onTrack && completionPct < 70;

    const lowEfficiency = consistencyFactor < 0.65;
    const lowCompletion = completionPct < 40;
    const highVariance =
      subjectStats.some((s) => s.completedRatio > 0.8) &&
      subjectStats.some((s) => s.completedRatio < 0.3);
    const lowConsistency = assessment.studyHabits.consistencyDays < 4;
    const highPace = gap > 1;

    let biggestProblem = "";
    let problemExplanation = "";
    if (highPace) {
      biggestProblem = "pace is insufficient";
      problemExplanation =
        "You cannot finish your syllabus at your current pace.";
    } else if (lowEfficiency && !lowCompletion) {
      biggestProblem = "low efficiency";
      problemExplanation =
        "You study enough hours, but effective output is low.";
    } else if (lowCompletion) {
      biggestProblem = "low completion";
      problemExplanation =
        "Too many topics untouched. Coverage is the bottleneck.";
    } else if (highVariance) {
      biggestProblem = "poor subject distribution";
      problemExplanation =
        "Some subjects are over-prepared. Others are neglected.";
    } else if (lowConsistency) {
      biggestProblem = "inconsistency";
      problemExplanation =
        "Study sessions are irregular. Retention is dropping.";
    } else {
      biggestProblem = "weak subject coverage";
      problemExplanation = "High-weight subjects still have significant gaps.";
    }

    const allTopicPriorities = subjects
      .flatMap((s) => {
        const sa = assessment.subjectAssessments.find(
          (a) => a.subjectId === s.id,
        );
        return s.topics.map((t) => {
          const conf = sa?.confidence ?? t.numericConfidence;
          return {
            subjectName: s.name,
            topicName: t.name,
            priority:
              (s.examWeight * (1 - conf / 100)) /
              (Math.max(t.estimatedEffort, 0.5) *
                Math.max(DaysRemainingFactor, 0.01)),
            confidence: conf,
            status: t.status,
            revisionCount: t.revisionCount,
            examWeight: s.examWeight,
          };
        });
      })
      .sort((a, b) => b.priority - a.priority);

    const highImpactTopic = allTopicPriorities.find(
      (t) => t.status !== "Completed",
    );
    const revisionCandidate = allTopicPriorities.find(
      (t) =>
        t.status === "Completed" && t.confidence < 70 && t.revisionCount < 4,
    );
    const lowRoiTopic = [...allTopicPriorities]
      .reverse()
      .find(
        (t) => t.confidence >= 75 && t.revisionCount >= 5 && t.examWeight <= 20,
      );

    const actions: { text: string; tag: string; tagColor: string }[] = [];
    if (highImpactTopic) {
      actions.push({
        text: `Study ${highImpactTopic.topicName} from ${highImpactTopic.subjectName}`,
        tag: "High impact, urgent",
        tagColor: "#2563eb",
      });
    }
    if (revisionCandidate) {
      actions.push({
        text: `Revise ${revisionCandidate.topicName} from ${revisionCandidate.subjectName}`,
        tag: "Prevent loss",
        tagColor: "#22d3ee",
      });
    }
    if (lowRoiTopic) {
      actions.push({
        text: `Drop / delay ${lowRoiTopic.topicName}`,
        tag: "Low ROI",
        tagColor: "#9ca3af",
      });
    }
    if (actions.length < 3 && allTopicPriorities.length > 1) {
      const second = allTopicPriorities.find(
        (t) =>
          t.status !== "Completed" &&
          (!highImpactTopic || t.topicName !== highImpactTopic.topicName),
      );
      if (second) {
        actions.push({
          text: `Study ${second.topicName} from ${second.subjectName}`,
          tag: "High impact",
          tagColor: "#2563eb",
        });
      }
    }
    const top3Actions = actions.slice(0, 3);

    const plannedHours = assessment.studyHabits.hoursPerDay;
    const lostHours = +(plannedHours - effectiveHoursPerDay).toFixed(1);
    const overStudiedStrong = subjectStats.some(
      (s) => s.strengthScore > 80 && s.hoursInvested > s.requiredHours * 0.7,
    );
    const timeWasteMessage = overStudiedStrong
      ? "You are over-studying strong subjects."
      : lostHours > 0.5
        ? `You lose ~${lostHours}h/day due to low focus.`
        : "No significant time waste detected.";

    const sortedByRisk = [...subjectStats].sort(
      (a, b) => b.riskScore - a.riskScore,
    );
    const focusMore = sortedByRisk[0];
    const focusLess = [...subjectStats].sort(
      (a, b) => b.strengthScore - a.strengthScore,
    )[0];

    let bestLeverSubject = subjectStats[0];
    let bestLeverGain = 0;
    for (const s of subjectStats) {
      const gain = (s.examWeight / 100) * 0.15 * 100;
      if (gain > bestLeverGain) {
        bestLeverGain = gain;
        bestLeverSubject = s;
      }
    }
    const leverMessage = `Improving ${bestLeverSubject?.name} adds ~${bestLeverGain.toFixed(0)} marks fastest.`;

    const stopItems: string[] = [];
    const overRevised = subjectStats.find(
      (s) =>
        s.strengthScore > 75 &&
        s.topics.some((t) => t.revisionCount >= 6 && t.numericConfidence >= 78),
    );
    if (overRevised) {
      const topic = overRevised.topics
        .filter((t) => t.revisionCount >= 6 && t.numericConfidence >= 78)
        .sort((a, b) => b.revisionCount - a.revisionCount)[0];
      stopItems.push(
        `Stop revising ${topic?.name ?? "strong chapters"} in ${overRevised.name}.`,
      );
    }
    stopItems.push(
      lowEfficiency
        ? "Stop passive re-reading. Switch to active recall."
        : "Stop planning what to study. Start the highest priority topic now.",
    );

    const paceDisplay = `${requiredDailyHours.toFixed(1)}h/day needed, doing ${effectiveHoursPerDay.toFixed(1)}h.`;

    return {
      scoreRange,
      effectiveHoursPerDay: +effectiveHoursPerDay.toFixed(1),
      completionPct,
      daysRemaining,
      paceStatus,
      paceDisplay,
      onTrack,
      urgency,
      urgencyColor,
      willFallShort,
      biggestProblem,
      problemExplanation,
      top3Actions,
      timeWasteMessage,
      focusMore,
      focusLess,
      leverMessage,
      stopItems: stopItems.slice(0, 2),
    };
  }, [
    subjects,
    assessment,
    getDaysRemaining,
    getConsistencyFactor,
    getEffectiveHoursPerDay,
  ]);

  const {
    scoreRange,
    effectiveHoursPerDay,
    completionPct,
    daysRemaining,
    paceStatus,
    paceDisplay,
    onTrack,
    urgency,
    urgencyColor,
    willFallShort,
    biggestProblem,
    problemExplanation,
    top3Actions,
    timeWasteMessage,
    focusMore,
    focusLess,
    leverMessage,
    stopItems,
  } = analysis;

  const statusColor =
    paceStatus === "On track"
      ? "#22c55e"
      : paceStatus === "Behind pace"
        ? "#f59e0b"
        : "#ef4444";

  return (
    <div className="space-y-3 max-w-2xl mx-auto">
      {/* 1. SNAPSHOT */}
      <div
        className="surface-card p-5"
        style={{ borderColor: "#2563eb30" }}
        data-ocid="analysis.panel"
      >
        <div className="grid grid-cols-4 gap-4 mb-4">
          <Stat label="Predicted Score" value={scoreRange} color="#f9fafb" />
          <Stat
            label="Effective Hrs/Day"
            value={`${effectiveHoursPerDay}h`}
            color="#3b82f6"
          />
          <Stat
            label="Completion"
            value={`${completionPct}%`}
            color={
              completionPct >= 60
                ? "#22c55e"
                : completionPct >= 35
                  ? "#f59e0b"
                  : "#ef4444"
            }
          />
          <Stat
            label="Days Left"
            value={`${daysRemaining}`}
            color={
              daysRemaining > 30
                ? "#9ca3af"
                : daysRemaining > 14
                  ? "#f59e0b"
                  : "#ef4444"
            }
          />
        </div>
        <div
          className="text-xs font-medium tracking-wide"
          style={{ color: statusColor }}
        >
          {paceStatus}
        </div>
      </div>

      {/* PACE */}
      <div
        className="surface-card px-5 py-3"
        style={{ borderColor: "#1f2937" }}
      >
        <div className="flex items-center justify-between">
          <span
            className="text-xs uppercase tracking-widest"
            style={{ color: "#4b5563" }}
          >
            Required Pace
          </span>
          <span
            className="text-sm font-semibold"
            style={{ color: onTrack ? "#22c55e" : "#ef4444" }}
          >
            {paceDisplay}
          </span>
        </div>
      </div>

      {/* 2. BIGGEST PROBLEM */}
      <div className="surface-card p-5" style={{ borderColor: "#f59e0b25" }}>
        <div
          className="text-xs uppercase tracking-widest mb-2"
          style={{ color: "#4b5563" }}
        >
          Biggest Problem
        </div>
        <div
          className="text-sm font-semibold mb-1"
          style={{ color: "#f9fafb" }}
        >
          Your biggest issue is:{" "}
          <span style={{ color: "#f59e0b" }}>{biggestProblem}</span>
        </div>
        <div className="text-xs" style={{ color: "#6b7280" }}>
          {problemExplanation}
        </div>
      </div>

      {/* 3. WHAT TO DO NOW */}
      <div className="surface-card p-5" style={{ borderColor: "#2563eb40" }}>
        <div
          className="text-xs uppercase tracking-widest mb-3"
          style={{ color: "#4b5563" }}
        >
          What To Do Now
        </div>
        <div className="space-y-2">
          {top3Actions.map((action, i) => (
            <div
              key={action.text}
              data-ocid={`analysis.item.${i + 1}`}
              className="flex items-center gap-3 py-2 px-3 rounded-lg"
              style={{ background: "#111827", border: "1px solid #1f2937" }}
            >
              <span
                className="text-xs font-semibold w-4 flex-shrink-0"
                style={{ color: "#374151" }}
              >
                {i + 1}
              </span>
              <span className="flex-1 text-sm" style={{ color: "#e5e7eb" }}>
                {action.text}
              </span>
              <span
                className="text-xs flex-shrink-0 px-2 py-0.5 rounded-full"
                style={{
                  background: `${action.tagColor}18`,
                  color: action.tagColor,
                  border: `1px solid ${action.tagColor}30`,
                }}
              >
                {action.tag}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4+5. TIME WASTE + SUBJECT SHIFT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="surface-card p-5" style={{ borderColor: "#f59e0b20" }}>
          <div
            className="text-xs uppercase tracking-widest mb-3"
            style={{ color: "#4b5563" }}
          >
            Time Waste
          </div>
          <div
            className="text-sm"
            style={{
              color: timeWasteMessage.startsWith("No") ? "#22c55e" : "#f59e0b",
            }}
          >
            {timeWasteMessage}
          </div>
        </div>
        <div className="surface-card p-5" style={{ borderColor: "#2563eb20" }}>
          <div
            className="text-xs uppercase tracking-widest mb-3"
            style={{ color: "#4b5563" }}
          >
            Subject Focus Shift
          </div>
          {focusMore && focusLess && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: "#ef4444" }}>
                  Focus More
                </span>
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: focusMore.color }}
                />
                <span
                  className="text-sm font-medium"
                  style={{ color: "#f9fafb" }}
                >
                  {focusMore.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: "#9ca3af" }}>
                  Focus Less
                </span>
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: focusLess.color }}
                />
                <span
                  className="text-sm font-medium"
                  style={{ color: "#6b7280" }}
                >
                  {focusLess.name}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 6+7. SCORE LEVER + URGENCY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="surface-card p-5" style={{ borderColor: "#22d3ee20" }}>
          <div
            className="text-xs uppercase tracking-widest mb-3"
            style={{ color: "#4b5563" }}
          >
            Score Lever
          </div>
          <div className="text-sm" style={{ color: "#22d3ee" }}>
            {leverMessage}
          </div>
        </div>
        <div
          className="surface-card p-5"
          style={{ borderColor: `${urgencyColor}25` }}
        >
          <div
            className="text-xs uppercase tracking-widest mb-3"
            style={{ color: "#4b5563" }}
          >
            Urgency
          </div>
          <div
            className="text-xl font-semibold mb-1"
            style={{ color: urgencyColor }}
          >
            {urgency}
          </div>
          {willFallShort && (
            <div className="text-xs" style={{ color: "#ef4444" }}>
              At current pace, you will fall short.
            </div>
          )}
        </div>
      </div>

      {/* 8. WHAT TO STOP */}
      <div className="surface-card p-5" style={{ borderColor: "#ef444420" }}>
        <div
          className="text-xs uppercase tracking-widest mb-3"
          style={{ color: "#4b5563" }}
        >
          What To Stop
        </div>
        <div className="space-y-2">
          {stopItems.map((item) => (
            <div
              key={item}
              className="flex items-start gap-2 text-sm"
              style={{ color: "#9ca3af" }}
            >
              <span
                className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: "#ef4444" }}
              />
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* UPDATE ASSESSMENT */}
      <div className="flex items-center justify-center gap-4 pt-2 pb-4">
        <button
          type="button"
          onClick={onUpdateAssessment}
          data-ocid="analysis.edit_button"
          className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg transition-all"
          style={{
            background: "#111827",
            border: "1px solid #1f2937",
            color: "#6b7280",
          }}
        >
          <ClipboardCheck size={12} />
          Update Assessment
        </button>
        <button
          type="button"
          onClick={onReset}
          data-ocid="analysis.delete_button"
          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-all"
          style={{ background: "transparent", color: "#374151" }}
        >
          <RefreshCw size={12} />
          Reset
        </button>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  color,
}: { label: string; value: string; color: string }) {
  return (
    <div className="flex flex-col">
      <span
        className="text-xs tracking-wide uppercase mb-1"
        style={{ color: "#4b5563" }}
      >
        {label}
      </span>
      <span
        className="text-2xl font-semibold"
        style={{ color, letterSpacing: "-0.03em" }}
      >
        {value}
      </span>
    </div>
  );
}
