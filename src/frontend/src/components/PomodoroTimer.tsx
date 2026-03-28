import { useEffect, useRef, useState } from "react";
import { playChime, playClick, playTick } from "../utils/soundEffects";

const WORK_TIME = 25 * 60;
const BREAK_TIME = 5 * 60;
const RADIUS = 78;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function PomodoroTimer() {
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [timeLeft, setTimeLeft] = useState(WORK_TIME);
  const [sessionDone, setSessionDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalTime = isBreak ? BREAK_TIME : WORK_TIME;
  const progress = timeLeft / totalTime;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const isBreakRef = useRef(isBreak);
  isBreakRef.current = isBreak;

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setSessionDone(true);
            const nextIsBreak = !isBreakRef.current;
            setIsBreak(nextIsBreak);
            playChime();
            return nextIsBreak ? BREAK_TIME : WORK_TIME;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  const handleReset = () => {
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(WORK_TIME);
    setSessionDone(false);
  };

  const handleToggle = () => {
    const starting = !isRunning;
    setIsRunning((v) => !v);
    setSessionDone(false);
    if (starting) playClick();
    else playTick();
  };

  const timerColor = isBreak ? "#22c55e" : "#2563eb";

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative">
        <svg
          width="200"
          height="200"
          viewBox="0 0 200 200"
          role="img"
          aria-label={`Pomodoro timer: ${formatTime(timeLeft)}`}
        >
          <title>Pomodoro Timer</title>
          <circle
            cx="100"
            cy="100"
            r={RADIUS}
            fill="none"
            stroke="#1f2937"
            strokeWidth="9"
          />
          <circle
            cx="100"
            cy="100"
            r={RADIUS}
            fill="none"
            stroke={timerColor}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 100 100)"
            style={{
              transition: isRunning
                ? "stroke-dashoffset 0.9s linear"
                : "stroke-dashoffset 0.3s ease",
            }}
          />
          <text
            x="100"
            y="93"
            textAnchor="middle"
            fill="#f9fafb"
            fontSize="30"
            fontWeight="600"
            fontFamily="General Sans, sans-serif"
          >
            {formatTime(timeLeft)}
          </text>
          <text
            x="100"
            y="116"
            textAnchor="middle"
            fill="#4b5563"
            fontSize="11"
            fontWeight="500"
            fontFamily="General Sans, sans-serif"
          >
            {isBreak ? "Break Time" : "Focus Session"}
          </text>
        </svg>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          data-ocid="study.timer.toggle"
          onClick={handleToggle}
          className="px-6 py-2.5 rounded text-sm font-medium transition-colors"
          style={{ background: "#2563eb", color: "white" }}
        >
          {isRunning ? "Pause" : "Start"}
        </button>
        <button
          type="button"
          data-ocid="study.timer.reset"
          onClick={handleReset}
          className="px-4 py-2.5 rounded text-sm transition-colors"
          style={{ border: "1px solid #1f2937", color: "#4b5563" }}
        >
          Reset
        </button>
      </div>

      {sessionDone && (
        <div
          data-ocid="study.timer.success_state"
          className="w-full rounded-lg px-4 py-3 text-sm"
          style={{
            background: "rgba(34,197,94,0.1)",
            border: "1px solid rgba(34,197,94,0.3)",
            color: "#22c55e",
          }}
        >
          Session complete. Great focus!
        </div>
      )}
    </div>
  );
}
