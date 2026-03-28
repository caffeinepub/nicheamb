import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAudioContext } from "../context/AudioContext";
import { useSubjects } from "../context/SubjectsContext";
import type { Subject, Topic } from "../mockData";
import { applySessionUpdate } from "../utils/confidenceEngine";
import {
  playChime,
  playClick,
  playTick,
  playTone,
} from "../utils/soundEffects";

type StudyMethod =
  | "Deep Work"
  | "Pomodoro"
  | "Active Recall"
  | "Revision Mode"
  | "Practice Mode";

const METHOD_DURATIONS: Record<
  StudyMethod,
  { focus: number; breakMin: number }
> = {
  "Deep Work": { focus: 60, breakMin: 10 },
  Pomodoro: { focus: 25, breakMin: 5 },
  "Active Recall": { focus: 25, breakMin: 5 },
  "Revision Mode": { focus: 25, breakMin: 5 },
  "Practice Mode": { focus: 25, breakMin: 5 },
};

const METHOD_QUALITY: Record<StudyMethod, number> = {
  "Deep Work": 90,
  Pomodoro: 85,
  "Active Recall": 88,
  "Revision Mode": 75,
  "Practice Mode": 82,
};

const METHOD_DESC: Record<StudyMethod, string> = {
  "Deep Work": "Long uninterrupted session",
  Pomodoro: "Structured 25/5 intervals",
  "Active Recall": "Recall concepts from memory",
  "Revision Mode": "Quick topic cycling",
  "Practice Mode": "Problem solving focus",
};

function getHighestPriorityTopic(
  subjects: Subject[],
): { subject: Subject; topic: Topic } | null {
  let best: { subject: Subject; topic: Topic; score: number } | null = null;
  for (const s of subjects) {
    for (const t of s.topics) {
      const score =
        (s.examWeight * (1 - t.numericConfidence / 100)) /
        Math.max(t.estimatedEffort, 0.5);
      if (!best || score > best.score) best = { subject: s, topic: t, score };
    }
  }
  return best ? { subject: best.subject, topic: best.topic } : null;
}

export default function StudyModeTab() {
  const { subjects, updateTopicConfidence, updateTopic } = useSubjects();
  const { audioState } = useAudioContext();
  const [method, setMethod] = useState<StudyMethod>("Pomodoro");
  const [currentTask, setCurrentTask] = useState(() =>
    getHighestPriorityTopic(subjects),
  );
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState<"Focus" | "Break">("Focus");
  const [sessionCount, setSessionCount] = useState(0);
  const [totalTodaySec, setTotalTodaySec] = useState(0);
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);

  const durations = METHOD_DURATIONS[method];
  const focusSec = durations.focus * 60;
  const breakSec = durations.breakMin * 60;
  const [secsLeft, setSecsLeft] = useState(focusSec);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const methodRef = useRef(method);
  const phaseRef = useRef(phase);
  const focusSecRef = useRef(focusSec);
  const subjectsRef = useRef(subjects);
  const currentTaskRef = useRef(currentTask);

  methodRef.current = method;
  phaseRef.current = phase;
  focusSecRef.current = focusSec;
  subjectsRef.current = subjects;
  currentTaskRef.current = currentTask;

  useEffect(() => {
    setSecsLeft(phase === "Focus" ? focusSec : breakSec);
    setIsRunning(false);
  }, [phase, focusSec, breakSec]);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setSecsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setIsRunning(false);
          if (phaseRef.current === "Focus") {
            setSessionCount((c) => c + 1);
            setTotalTodaySec((t) => t + focusSecRef.current);
            const quality = METHOD_QUALITY[methodRef.current];

            // ── Dynamic confidence update on session complete ──────────────
            const task = currentTaskRef.current;
            if (task) {
              // Look up live confidence from current subjects state
              const liveSubject = subjectsRef.current.find(
                (s) => s.id === task.subject.id,
              );
              const liveTopic = liveSubject?.topics.find(
                (t) => t.id === task.topic.id,
              );
              const liveConfidence =
                liveTopic?.numericConfidence ?? task.topic.numericConfidence;
              const newConf = applySessionUpdate(liveConfidence, "high");
              updateTopicConfidence(task.subject.id, task.topic.id, newConf);
            }

            const next = getHighestPriorityTopic(subjectsRef.current);
            setLastFeedback(
              `Session complete. Focus quality: ${quality}%. Next: ${next?.topic.name ?? "Review your notes"}.`,
            );
            playChime();
            setTimeout(() => playTone(), 400);
            toast.success("Session complete!");
            setPhase("Break");
          } else {
            setPhase("Focus");
            setLastFeedback(null);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, updateTopicConfidence]);

  const handleMarkCompleted = () => {
    const task = currentTask;
    if (!task) return;
    // Look up live confidence
    const liveSubject = subjects.find((s) => s.id === task.subject.id);
    const liveTopic = liveSubject?.topics.find((t) => t.id === task.topic.id);
    const liveConfidence =
      liveTopic?.numericConfidence ?? task.topic.numericConfidence;
    const newConf = applySessionUpdate(liveConfidence, "high");
    updateTopic(task.subject.id, task.topic.id, { status: "Completed" });
    updateTopicConfidence(task.subject.id, task.topic.id, newConf);
    playTick();
    toast.success("Task marked complete. Confidence updated.");
    const next = getHighestPriorityTopic(subjects);
    setCurrentTask(next);
  };

  const totalSec = phase === "Focus" ? focusSec : breakSec;
  const progress = 1 - secsLeft / totalSec;
  const mins = Math.floor(secsLeft / 60);
  const secs = secsLeft % 60;
  const timeStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  const R = 80;
  const C = 2 * Math.PI * R;
  const strokeOffset = C * (1 - progress);

  const totalTodayMins = Math.floor(totalTodaySec / 60);
  const audioPlaying =
    audioState.isPlaying && audioState.focusMode !== "silence";

  return (
    <div className="max-w-lg mx-auto space-y-5">
      {/* Current Task */}
      <div className="surface-card p-5">
        <div
          className="text-xs font-semibold tracking-widest uppercase mb-3"
          style={{ color: "#4b5563" }}
        >
          Current Task
        </div>
        {currentTask ? (
          <div>
            <div className="text-lg font-medium" style={{ color: "#f9fafb" }}>
              {currentTask.topic.name}
            </div>
            <div className="text-sm mt-0.5" style={{ color: "#9ca3af" }}>
              {currentTask.subject.name}
            </div>
          </div>
        ) : (
          <div style={{ color: "#4b5563" }}>No tasks available.</div>
        )}
        <div className="flex gap-2 mt-3 flex-wrap">
          <button
            type="button"
            data-ocid="study.next_task.button"
            onClick={() => {
              playTick();
              setCurrentTask(getHighestPriorityTopic(subjects));
              toast.success("Next highest priority task selected");
            }}
            className="text-sm px-4 py-2 rounded transition-colors"
            style={{
              background: "rgba(37,99,235,0.12)",
              color: "#3b82f6",
              border: "1px solid rgba(37,99,235,0.3)",
            }}
          >
            Start Next Task
          </button>
          {currentTask && !isRunning && (
            <button
              type="button"
              data-ocid="study.mark_completed.button"
              onClick={handleMarkCompleted}
              className="text-sm px-4 py-2 rounded transition-colors"
              style={{
                background: "rgba(34,197,94,0.12)",
                color: "#22c55e",
                border: "1px solid rgba(34,197,94,0.3)",
              }}
            >
              Mark as Completed
            </button>
          )}
        </div>
      </div>

      {/* Study Method */}
      <div className="surface-card p-5">
        <div
          className="text-xs font-semibold tracking-widest uppercase mb-3"
          style={{ color: "#4b5563" }}
        >
          Study Method
        </div>
        <div className="grid grid-cols-1 gap-2">
          {(Object.keys(METHOD_DESC) as StudyMethod[]).map((m) => (
            <button
              key={m}
              type="button"
              data-ocid={`study.method.${m.toLowerCase().replace(/ /g, "_")}.button`}
              onClick={() => {
                playClick();
                setMethod(m);
              }}
              className="flex items-center justify-between px-4 py-3 rounded text-sm text-left transition-all"
              style={{
                background: method === m ? "rgba(37,99,235,0.1)" : "#07090d",
                border:
                  method === m ? "1px solid #2563eb" : "1px solid #1f2937",
                color: method === m ? "#f9fafb" : "#9ca3af",
              }}
            >
              <span className="font-medium">{m}</span>
              <span
                className="text-xs"
                style={{ color: method === m ? "#3b82f6" : "#4b5563" }}
              >
                {METHOD_DESC[m]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Timer */}
      <div className="surface-card p-6 flex flex-col items-center">
        <div
          className="text-xs font-semibold tracking-widest uppercase mb-4"
          style={{ color: "#4b5563" }}
        >
          {phase} · {method}
        </div>

        <div className="relative" style={{ width: 200, height: 200 }}>
          <svg
            width={200}
            height={200}
            style={{
              transform: "rotate(-90deg)",
              animation: audioPlaying
                ? "timerPulse 2s ease-in-out infinite"
                : "none",
            }}
            role="img"
            aria-label={`${phase} timer: ${timeStr} remaining`}
          >
            <title>
              {phase} timer: {timeStr} remaining
            </title>
            <circle
              cx={100}
              cy={100}
              r={R}
              fill="none"
              stroke="#1f2937"
              strokeWidth={6}
            />
            <circle
              cx={100}
              cy={100}
              r={R}
              fill="none"
              stroke={phase === "Focus" ? "#2563eb" : "#22c55e"}
              strokeWidth={6}
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={strokeOffset}
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="font-semibold tabular-nums"
              style={{
                fontSize: "2.5rem",
                color: "#f9fafb",
                letterSpacing: "-0.04em",
              }}
            >
              {timeStr}
            </span>
            <span className="text-xs mt-1" style={{ color: "#4b5563" }}>
              {phase === "Focus" ? "Focus" : "Break"}
            </span>
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button
            type="button"
            data-ocid="study.timer.toggle.button"
            onClick={() => {
              playClick();
              setIsRunning((v) => !v);
            }}
            className="px-6 py-2.5 rounded text-sm font-medium transition-colors"
            style={{ background: "#2563eb", color: "#fff" }}
          >
            {isRunning ? "Pause" : "Start"}
          </button>
          <button
            type="button"
            data-ocid="study.timer.reset.button"
            onClick={() => {
              playClick();
              setIsRunning(false);
              setPhase("Focus");
              setSecsLeft(focusSec);
              setLastFeedback(null);
            }}
            className="px-4 py-2.5 rounded text-sm transition-colors"
            style={{ border: "1px solid #1f2937", color: "#4b5563" }}
          >
            Reset
          </button>
        </div>

        <div className="mt-5 flex gap-6 text-center">
          <div>
            <div className="text-xl font-semibold" style={{ color: "#f9fafb" }}>
              {sessionCount}
            </div>
            <div className="text-xs" style={{ color: "#4b5563" }}>
              Sessions today
            </div>
          </div>
          <div>
            <div className="text-xl font-semibold" style={{ color: "#f9fafb" }}>
              {totalTodayMins}m
            </div>
            <div className="text-xs" style={{ color: "#4b5563" }}>
              Total today
            </div>
          </div>
        </div>
      </div>

      {lastFeedback && (
        <div
          data-ocid="study.feedback.card"
          className="surface-card p-4 text-sm"
          style={{ color: "#9ca3af", borderColor: "#22c55e40" }}
        >
          {lastFeedback}
        </div>
      )}
    </div>
  );
}
