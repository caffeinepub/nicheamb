import { useMemo } from "react";
import { useSubjects } from "../context/SubjectsContext";
import { studyConfig } from "../mockData";

const HABIT_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HABIT_STUDIED = [true, true, false, true, true, false, true];

export default function ReviewTab() {
  const { subjects } = useSubjects();

  const stats = useMemo(() => {
    const subjectStats = subjects.map((s) => {
      const total = s.topics.length;
      const completed = s.topics.filter((t) => t.status === "Completed").length;
      const avgConf =
        total > 0
          ? s.topics.reduce((a, t) => a + t.numericConfidence, 0) / total
          : 0;
      const completedRatio = total > 0 ? completed / total : 0;
      const strengthScore = completedRatio * (avgConf / 100) * 100;
      return { ...s, strengthScore, avgConf };
    });

    const sorted = [...subjectStats].sort(
      (a, b) => b.strengthScore - a.strengthScore,
    );
    const strongest = sorted[0];
    const weakest = sorted[sorted.length - 1];

    const studiedDays = HABIT_STUDIED.filter(Boolean).length;
    const consistency = Math.round((studiedDays / 7) * 100);
    const streak = 4;
    const avgHours =
      studyConfig.studyHoursPerDay * studyConfig.consistencyFactor;
    const sessionsCompleted = studiedDays * 2;
    const sessionsPlanned = 14;
    const efficiency = Math.round(studyConfig.consistencyFactor * 100);

    const mistakeTopics: {
      subject: string;
      topic: string;
      conf: number;
      revisions: number;
    }[] = [];
    for (const s of subjects) {
      for (const t of s.topics) {
        if (t.revisionCount > 2 && t.numericConfidence < 50) {
          mistakeTopics.push({
            subject: s.name,
            topic: t.name,
            conf: t.numericConfidence,
            revisions: t.revisionCount,
          });
        }
      }
    }
    mistakeTopics.sort((a, b) => b.revisions - a.revisions);

    return {
      strongest,
      weakest,
      consistency,
      streak,
      avgHours,
      sessionsCompleted,
      sessionsPlanned,
      efficiency,
      mistakeTopics,
    };
  }, [subjects]);

  const summaryCards = [
    {
      label: "Sessions",
      value: `${stats.sessionsCompleted}/${stats.sessionsPlanned}`,
      color: "#3b82f6",
    },
    {
      label: "Efficiency",
      value: `${stats.efficiency}%`,
      color:
        stats.efficiency >= 70
          ? "#22c55e"
          : stats.efficiency >= 50
            ? "#f59e0b"
            : "#ef4444",
    },
    {
      label: "Strongest",
      value: stats.strongest?.name ?? "—",
      color: "#22c55e",
    },
    { label: "Weakest", value: stats.weakest?.name ?? "—", color: "#ef4444" },
  ];

  const habitStats = [
    {
      label: "Consistency",
      value: `${stats.consistency}%`,
      color: stats.consistency >= 70 ? "#22c55e" : "#f59e0b",
    },
    {
      label: "Avg. Study Hours",
      value: `${stats.avgHours.toFixed(1)}h`,
      color: "#3b82f6",
    },
    {
      label: "Current Streak",
      value: `${stats.streak} days`,
      color: "#22d3ee",
    },
  ];

  const insights = [
    `Your study consistency this week was ${stats.consistency}%.`,
    stats.strongest && stats.weakest && stats.strongest.id !== stats.weakest.id
      ? `Your strongest subject ${stats.strongest.name} needs less time — redirect effort to ${stats.weakest.name}.`
      : null,
    `You completed ${stats.sessionsCompleted} of ${stats.sessionsPlanned} planned sessions (${Math.round((stats.sessionsCompleted / stats.sessionsPlanned) * 100)}%).`,
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-5">
      {/* Weekly Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((stat) => (
          <div
            key={stat.label}
            className="surface-card p-4 text-center"
            data-ocid={`review.${stat.label.toLowerCase()}.card`}
          >
            <div
              className="text-xl font-semibold"
              style={{ color: stat.color, letterSpacing: "-0.02em" }}
            >
              {stat.value}
            </div>
            <div className="text-xs mt-1" style={{ color: "#4b5563" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Habit Tracking */}
      <div className="surface-card p-5">
        <h2
          className="text-xs font-semibold tracking-widest uppercase mb-4"
          style={{ color: "#4b5563" }}
        >
          Habit Tracking
        </h2>
        <div className="flex gap-2 mb-4">
          {HABIT_DAYS.map((day, i) => (
            <div key={day} className="flex flex-col items-center gap-1.5">
              <div
                className="w-8 h-8 rounded-full"
                style={{
                  background: HABIT_STUDIED[i] ? "#2563eb" : "#1f2937",
                  border: `1px solid ${HABIT_STUDIED[i] ? "#2563eb" : "#1f2937"}`,
                }}
              />
              <span className="text-xs" style={{ color: "#4b5563" }}>
                {day}
              </span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {habitStats.map((s) => (
            <div
              key={s.label}
              className="rounded-lg p-3 text-center"
              style={{ background: "#111827", border: "1px solid #1f2937" }}
            >
              <div className="text-lg font-semibold" style={{ color: s.color }}>
                {s.value}
              </div>
              <div className="text-xs mt-0.5" style={{ color: "#4b5563" }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weak Topic Tracker */}
      <div className="surface-card p-5">
        <h2
          className="text-xs font-semibold tracking-widest uppercase mb-4"
          style={{ color: "#4b5563" }}
        >
          Repeatedly Weak Topics
        </h2>
        {stats.mistakeTopics.length === 0 ? (
          <div
            data-ocid="review.mistakes.empty_state"
            className="text-sm"
            style={{ color: "#4b5563" }}
          >
            No consistently weak topics identified.
          </div>
        ) : (
          <div className="space-y-2">
            {stats.mistakeTopics.map((item, idx) => (
              <div
                key={`${item.subject}-${item.topic}`}
                data-ocid={`review.mistake.item.${idx + 1}`}
                className="flex items-center gap-3 p-3 rounded-lg"
                style={{ background: "#111827", border: "1px solid #1f2937" }}
              >
                <span
                  className="text-lg font-semibold w-8 text-center flex-shrink-0"
                  style={{ color: "#1f2937" }}
                >
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div
                    className="text-sm font-medium"
                    style={{ color: "#f9fafb" }}
                  >
                    {item.topic}
                  </div>
                  <div className="text-xs" style={{ color: "#4b5563" }}>
                    {item.subject}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm" style={{ color: "#ef4444" }}>
                    {item.conf}% conf
                  </div>
                  <div className="text-xs" style={{ color: "#4b5563" }}>
                    {item.revisions} revisions
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Insights */}
      <div className="surface-card p-5">
        <h2
          className="text-xs font-semibold tracking-widest uppercase mb-4"
          style={{ color: "#4b5563" }}
        >
          Insights
        </h2>
        <div className="space-y-2">
          {insights.map((insight) => (
            <div
              key={insight}
              className="p-3 rounded-lg text-sm"
              style={{
                border: "1px solid #1f2937",
                background: "#111827",
                color: "#9ca3af",
              }}
            >
              {insight}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs py-4" style={{ color: "#4b5563" }}>
        © {new Date().getFullYear()}.{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#4b5563" }}
          className="hover:underline"
        >
          Built with ♥ using caffeine.ai
        </a>
      </div>
    </div>
  );
}
