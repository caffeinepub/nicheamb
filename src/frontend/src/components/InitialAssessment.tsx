import { ChevronLeft, ChevronRight, Plus, SkipForward, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import {
  type StudyHabits,
  type SubjectAssessment,
  type TimeInput,
  useAssessment,
} from "../context/AssessmentContext";
import { useSubjects } from "../context/SubjectsContext";

const STEP_TITLES = [
  "Rate Your Subjects",
  "Your Study Patterns",
  "When Is Your Exam?",
  "Optional: Quick Check",
];

const DISTRACTION_LABELS: Record<number, string> = {
  1: "Focused",
  2: "Mostly focused",
  3: "Moderate",
  4: "Often distracted",
  5: "Scattered",
};

const SUBJECT_COLORS = [
  "#3b82f6",
  "#22d3ee",
  "#f59e0b",
  "#ef4444",
  "#22c55e",
  "#a78bfa",
];

interface QuizRatings {
  [subjectId: number]: [number, number, number];
}

export default function InitialAssessment({
  onComplete,
}: {
  onComplete?: () => void;
}) {
  const { subjects, addSubject, renameSubject, deleteSubject } = useSubjects();
  const {
    assessment,
    updateSubjectAssessment,
    updateStudyHabits,
    updateTimeInput,
    completeAssessment,
  } = useAssessment();

  const [step, setStep] = useState(0);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  const [subjectInputs, setSubjectInputs] = useState<
    Record<number, SubjectAssessment>
  >(() => {
    const init: Record<number, SubjectAssessment> = {};
    for (const s of subjects) {
      const existing = assessment.subjectAssessments.find(
        (a) => a.subjectId === s.id,
      );
      init[s.id] = existing ?? {
        subjectId: s.id,
        confidence: 50,
        completionPct: 30,
        testScore: null,
        perceivedDifficulty: 3,
        quizAccuracy: null,
        weakTopics: [],
      };
    }
    return init;
  });

  const [habits, setHabits] = useState<StudyHabits>(assessment.studyHabits);
  const [timeInput, setTimeInput] = useState<TimeInput>(assessment.timeInput);
  const [quizRatings, setQuizRatings] = useState<QuizRatings>(() => {
    const init: QuizRatings = {};
    for (const s of subjects) init[s.id] = [3, 3, 3];
    return init;
  });

  const updateSubjectField = <K extends keyof SubjectAssessment>(
    id: number,
    key: K,
    val: SubjectAssessment[K],
  ) => {
    setSubjectInputs((prev) => ({
      ...prev,
      [id]: { ...prev[id], [key]: val },
    }));
  };

  const startEdit = (id: number, name: string) => {
    setEditingId(id);
    setEditingName(name);
    setTimeout(() => editInputRef.current?.select(), 30);
  };

  const commitEdit = () => {
    if (editingId !== null) {
      const trimmed = editingName.trim();
      if (trimmed) renameSubject(editingId, trimmed);
    }
    setEditingId(null);
    setEditingName("");
  };

  const handleAddSubject = () => {
    const colorIndex = subjects.length % SUBJECT_COLORS.length;
    const newId = Date.now();
    addSubject({
      name: "New Subject",
      color: SUBJECT_COLORS[colorIndex],
      examWeight: 20,
      difficulty: 3,
      totalChapters: 5,
      requiredHours: 10,
    });
    // Add default assessment entry and quiz entry for new subject
    setSubjectInputs((prev) => ({
      ...prev,
      [newId]: {
        subjectId: newId,
        confidence: 50,
        completionPct: 30,
        testScore: null,
        perceivedDifficulty: 3,
        quizAccuracy: null,
        weakTopics: [],
      },
    }));
    setQuizRatings((prev) => ({ ...prev, [newId]: [3, 3, 3] }));
    // Put new subject into edit mode right away — find by matching after render
    setTimeout(() => {
      const latest = [...subjects].sort((a, b) => b.id - a.id)[0];
      if (latest) startEdit(latest.id, "New Subject");
    }, 50);
  };

  const handleDeleteSubject = (id: number) => {
    deleteSubject(id);
    setSubjectInputs((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const canProceed = () => {
    if (step === 2) {
      if (timeInput.mode === "days") return (timeInput.daysRemaining ?? 0) > 0;
      if (timeInput.mode === "date") return !!timeInput.examDate;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 0) {
      for (const sa of Object.values(subjectInputs))
        updateSubjectAssessment(sa);
    } else if (step === 1) {
      updateStudyHabits(habits);
    } else if (step === 2) {
      updateTimeInput(timeInput);
    }
    setStep((s) => s + 1);
  };

  const handleBack = () => setStep((s) => s - 1);

  const handleFinish = (skipQuiz: boolean) => {
    if (!skipQuiz) {
      for (const s of subjects) {
        const ratings = quizRatings[s.id] ?? [3, 3, 3];
        const avg = (ratings[0] + ratings[1] + ratings[2]) / 3;
        const acc = Math.round((avg / 5) * 100);
        updateSubjectAssessment({
          ...subjectInputs[s.id],
          quizAccuracy: acc,
          weakTopics: ratings.some((r) => r <= 2) ? [s.name] : [],
        });
      }
    }
    completeAssessment();
    onComplete?.();
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#07090d" }}
    >
      {/* Step indicator */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-6 py-4"
        style={{ background: "#07090d", borderBottom: "1px solid #1f2937" }}
      >
        <div className="flex items-center gap-2">
          {STEP_TITLES.map((_, i) => (
            <div key={STEP_TITLES[i]} className="flex items-center gap-1.5">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all"
                style={{
                  background: i < step ? "#2563eb" : "transparent",
                  border:
                    i < step
                      ? "1px solid #2563eb"
                      : i === step
                        ? "2px solid #2563eb"
                        : "1px solid #374151",
                  color: i < step ? "#fff" : i === step ? "#3b82f6" : "#4b5563",
                }}
              >
                {i < step ? "✓" : i + 1}
              </div>
              {i < STEP_TITLES.length - 1 && (
                <div
                  className="w-6 h-px"
                  style={{ background: i < step ? "#2563eb" : "#1f2937" }}
                />
              )}
            </div>
          ))}
        </div>
        <span className="text-xs tracking-wide" style={{ color: "#4b5563" }}>
          {STEP_TITLES[step]}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-2xl mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* STEP 1 */}
            {step === 0 && (
              <div className="space-y-3">
                <h2
                  className="text-lg font-semibold mb-4"
                  style={{ color: "#f9fafb" }}
                >
                  Rate Your Subjects
                </h2>

                {/* Editable subject list */}
                <div
                  className="pb-5 mb-2"
                  style={{ borderBottom: "1px solid #1f2937" }}
                >
                  <p className="text-xs mb-3" style={{ color: "#6b7280" }}>
                    Edit subjects to match what you actually study.
                  </p>
                  <div className="space-y-1.5">
                    {subjects.map((s) => (
                      <SubjectEditRow
                        key={s.id}
                        subject={s}
                        isEditing={editingId === s.id}
                        editingName={editingName}
                        editInputRef={editingId === s.id ? editInputRef : null}
                        onStartEdit={() => startEdit(s.id, s.name)}
                        onNameChange={setEditingName}
                        onCommit={commitEdit}
                        onDelete={() => handleDeleteSubject(s.id)}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSubject}
                    data-ocid="assessment.subject.button"
                    className="flex items-center gap-1 mt-3 text-xs font-medium transition-opacity hover:opacity-80"
                    style={{ color: "#3b82f6" }}
                  >
                    <Plus size={13} />
                    Add Subject
                  </button>
                </div>

                {/* Rating cards */}
                {subjects.map((s) => {
                  const input = subjectInputs[s.id];
                  if (!input) return null;
                  return (
                    <div
                      key={s.id}
                      className="p-4 rounded-lg"
                      style={{
                        background: "#0f1720",
                        border: "1px solid #1f2937",
                      }}
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: s.color }}
                        />
                        <span
                          className="text-sm font-medium"
                          style={{ color: "#f9fafb" }}
                        >
                          {s.name}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SliderField
                          label="Confidence"
                          value={input.confidence}
                          min={0}
                          max={100}
                          step={1}
                          displaySuffix="%"
                          onChange={(v) =>
                            updateSubjectField(s.id, "confidence", v)
                          }
                        />
                        <SliderField
                          label="Completion"
                          value={input.completionPct}
                          min={0}
                          max={100}
                          step={5}
                          displaySuffix="%"
                          onChange={(v) =>
                            updateSubjectField(s.id, "completionPct", v)
                          }
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <span
                            className="text-xs tracking-wide block mb-1.5"
                            style={{ color: "#6b7280" }}
                          >
                            Last Test Score (optional)
                          </span>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            placeholder="e.g. 72"
                            value={input.testScore ?? ""}
                            onChange={(e) =>
                              updateSubjectField(
                                s.id,
                                "testScore",
                                e.target.value === ""
                                  ? null
                                  : Number(e.target.value),
                              )
                            }
                            className="w-full px-3 py-2 rounded-md text-sm outline-none"
                            style={{
                              background: "#111827",
                              border: "1px solid #374151",
                              color: "#f9fafb",
                            }}
                          />
                        </div>
                        <div>
                          <span
                            className="text-xs tracking-wide block mb-1.5"
                            style={{ color: "#6b7280" }}
                          >
                            Difficulty
                          </span>
                          <DotSelector
                            value={input.perceivedDifficulty}
                            count={5}
                            onChange={(v) =>
                              updateSubjectField(s.id, "perceivedDifficulty", v)
                            }
                            activeColor="#f59e0b"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* STEP 2 */}
            {step === 1 && (
              <div className="space-y-5">
                <h2
                  className="text-lg font-semibold mb-4"
                  style={{ color: "#f9fafb" }}
                >
                  Your Study Patterns
                </h2>
                <div
                  className="p-5 rounded-lg space-y-5"
                  style={{ background: "#0f1720", border: "1px solid #1f2937" }}
                >
                  <SliderField
                    label="Study Hours / Day"
                    value={habits.hoursPerDay}
                    min={0.5}
                    max={12}
                    step={0.5}
                    displaySuffix="h"
                    onChange={(v) =>
                      setHabits((p) => ({ ...p, hoursPerDay: v }))
                    }
                  />
                  <SliderField
                    label="Consistency"
                    value={habits.consistencyDays}
                    min={1}
                    max={7}
                    step={1}
                    displaySuffix=" days/week"
                    onChange={(v) =>
                      setHabits((p) => ({ ...p, consistencyDays: v }))
                    }
                  />
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className="text-xs tracking-wide"
                        style={{ color: "#6b7280" }}
                      >
                        Distraction Level
                      </span>
                      <span className="text-xs" style={{ color: "#3b82f6" }}>
                        {DISTRACTION_LABELS[habits.distractionLevel]}
                      </span>
                    </div>
                    <DotSelector
                      value={habits.distractionLevel}
                      count={5}
                      onChange={(v) =>
                        setHabits((p) => ({ ...p, distractionLevel: v }))
                      }
                      activeColor="#ef4444"
                      labels={["1", "2", "3", "4", "5"]}
                    />
                  </div>
                  <SliderField
                    label="Sleep Hours / Night"
                    value={habits.sleepHours}
                    min={4}
                    max={10}
                    step={0.5}
                    displaySuffix="h"
                    onChange={(v) =>
                      setHabits((p) => ({ ...p, sleepHours: v }))
                    }
                  />
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {step === 2 && (
              <div className="space-y-5">
                <h2
                  className="text-lg font-semibold mb-1"
                  style={{ color: "#f9fafb" }}
                >
                  When Is Your Exam?
                </h2>
                <p className="text-xs mb-4" style={{ color: "#4b5563" }}>
                  Required to unlock analysis.
                </p>
                <div
                  className="p-5 rounded-lg space-y-5"
                  style={{ background: "#0f1720", border: "1px solid #1f2937" }}
                >
                  <div className="flex gap-2">
                    {(["date", "days"] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setTimeInput((p) => ({ ...p, mode }))}
                        className="px-4 py-2 text-xs font-medium rounded-lg transition-all"
                        style={{
                          background:
                            timeInput.mode === mode ? "#2563eb" : "#111827",
                          border: `1px solid ${
                            timeInput.mode === mode ? "#2563eb" : "#374151"
                          }`,
                          color: timeInput.mode === mode ? "#fff" : "#6b7280",
                        }}
                      >
                        {mode === "date" ? "Exam Date" : "Days Remaining"}
                      </button>
                    ))}
                  </div>
                  {timeInput.mode === "date" ? (
                    <div>
                      <span
                        className="text-xs tracking-wide block mb-2"
                        style={{ color: "#6b7280" }}
                      >
                        Exam Date
                      </span>
                      <input
                        type="date"
                        value={timeInput.examDate ?? ""}
                        onChange={(e) =>
                          setTimeInput((p) => ({
                            ...p,
                            examDate: e.target.value || null,
                          }))
                        }
                        className="w-full px-3 py-2 rounded-md text-sm outline-none"
                        style={{
                          background: "#111827",
                          border: "1px solid #374151",
                          color: "#f9fafb",
                          colorScheme: "dark",
                        }}
                      />
                    </div>
                  ) : (
                    <div>
                      <span
                        className="text-xs tracking-wide block mb-2"
                        style={{ color: "#6b7280" }}
                      >
                        Days Remaining
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={365}
                        placeholder="e.g. 45"
                        value={timeInput.daysRemaining ?? ""}
                        onChange={(e) =>
                          setTimeInput((p) => ({
                            ...p,
                            daysRemaining:
                              e.target.value === ""
                                ? null
                                : Number(e.target.value),
                          }))
                        }
                        className="w-full px-3 py-2 rounded-md text-sm outline-none"
                        style={{
                          background: "#111827",
                          border: "1px solid #374151",
                          color: "#f9fafb",
                        }}
                      />
                    </div>
                  )}
                  {!canProceed() && (
                    <div
                      className="text-xs font-semibold"
                      style={{ color: "#ef4444" }}
                    >
                      Required to unlock analysis.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 4 */}
            {step === 3 && (
              <div className="space-y-4">
                <h2
                  className="text-lg font-semibold mb-1"
                  style={{ color: "#f9fafb" }}
                >
                  Optional: Quick Check
                </h2>
                <p className="text-xs mb-4" style={{ color: "#4b5563" }}>
                  Answer 3 self-rated questions per subject to improve
                  prediction accuracy.
                </p>
                {subjects.map((s) => {
                  const ratings = quizRatings[s.id] ?? [3, 3, 3];
                  const questions = [
                    `Explain the core concept of ${s.name} in one sentence.`,
                    `What is the hardest part of ${s.name} for you?`,
                    `Rate your readiness for ${s.name} exam questions.`,
                  ];
                  return (
                    <div
                      key={s.id}
                      className="p-4 rounded-lg"
                      style={{
                        background: "#0f1720",
                        border: "1px solid #1f2937",
                      }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ background: s.color }}
                        />
                        <span
                          className="text-sm font-medium"
                          style={{ color: "#f9fafb" }}
                        >
                          {s.name}
                        </span>
                      </div>
                      {questions.map((q, qi) => (
                        <div key={q} className="mb-3">
                          <p
                            className="text-xs mb-2"
                            style={{ color: "#9ca3af" }}
                          >
                            {q}
                          </p>
                          <DotSelector
                            value={ratings[qi]}
                            count={5}
                            onChange={(v) => {
                              const next = [...ratings] as [
                                number,
                                number,
                                number,
                              ];
                              next[qi] = v;
                              setQuizRatings((p) => ({ ...p, [s.id]: next }));
                            }}
                            activeColor="#2563eb"
                            labels={["1", "2", "3", "4", "5"]}
                          />
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div
        className="sticky bottom-0 flex items-center justify-between px-6 py-4"
        style={{ background: "#07090d", borderTop: "1px solid #1f2937" }}
      >
        <button
          type="button"
          onClick={handleBack}
          disabled={step === 0}
          className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg transition-all"
          style={{
            background: step === 0 ? "transparent" : "#111827",
            border: "1px solid #1f2937",
            color: step === 0 ? "#374151" : "#9ca3af",
            cursor: step === 0 ? "default" : "pointer",
          }}
        >
          <ChevronLeft size={14} />
          Back
        </button>

        {step < 3 ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={!canProceed()}
            data-ocid="assessment.primary_button"
            className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium rounded-lg transition-all"
            style={{
              background: canProceed() ? "#2563eb" : "#1e3a8a",
              color: canProceed() ? "#fff" : "#4b5563",
              cursor: canProceed() ? "pointer" : "default",
            }}
          >
            Next
            <ChevronRight size={14} />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleFinish(true)}
              data-ocid="assessment.secondary_button"
              className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg transition-all"
              style={{
                background: "#111827",
                border: "1px solid #1f2937",
                color: "#9ca3af",
              }}
            >
              <SkipForward size={14} />
              Skip & Unlock
            </button>
            <button
              type="button"
              onClick={() => handleFinish(false)}
              data-ocid="assessment.primary_button"
              className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium rounded-lg transition-all"
              style={{ background: "#2563eb", color: "#fff" }}
            >
              Finish & Unlock Analysis
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Editable Subject Row ─────────────────────────────────────────────────────

function SubjectEditRow({
  subject,
  isEditing,
  editingName,
  editInputRef,
  onStartEdit,
  onNameChange,
  onCommit,
  onDelete,
}: {
  subject: { id: number; name: string; color: string };
  isEditing: boolean;
  editingName: string;
  editInputRef: React.RefObject<HTMLInputElement | null> | null;
  onStartEdit: () => void;
  onNameChange: (v: string) => void;
  onCommit: () => void;
  onDelete: () => void;
}) {
  const [deleteHovered, setDeleteHovered] = useState(false);
  return (
    <div
      className="group flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors"
      style={{
        background: "#111827",
        border: `1px solid ${isEditing ? "#2563eb" : "#1f2937"}`,
      }}
      data-ocid="assessment.subject.row"
    >
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ background: subject.color }}
      />
      {isEditing ? (
        <input
          ref={editInputRef}
          value={editingName}
          onChange={(e) => onNameChange(e.target.value)}
          onBlur={onCommit}
          onKeyDown={(e) => {
            if (e.key === "Enter") onCommit();
            if (e.key === "Escape") onCommit();
          }}
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: "#f9fafb" }}
          data-ocid="assessment.subject.input"
        />
      ) : (
        <button
          type="button"
          onClick={onStartEdit}
          className="flex-1 text-left text-sm bg-transparent outline-none cursor-text"
          style={{ color: "#e5e7eb" }}
          data-ocid="assessment.subject.edit_button"
        >
          {subject.name}
        </button>
      )}
      <button
        type="button"
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded"
        style={{ color: deleteHovered ? "#ef4444" : "#4b5563" }}
        onMouseEnter={() => setDeleteHovered(true)}
        onMouseLeave={() => setDeleteHovered(false)}
        data-ocid="assessment.subject.delete_button"
        aria-label={`Delete ${subject.name}`}
      >
        <X size={13} />
      </button>
    </div>
  );
}

// ─── Slider Field ─────────────────────────────────────────────────────────────

function SliderField({
  label,
  value,
  min,
  max,
  step,
  displaySuffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  displaySuffix?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs tracking-wide" style={{ color: "#6b7280" }}>
          {label}
        </span>
        <span className="text-sm font-semibold" style={{ color: "#3b82f6" }}>
          {value}
          {displaySuffix ?? ""}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1 rounded-full appearance-none cursor-pointer"
        style={{
          accentColor: "#2563eb",
          background: `linear-gradient(to right, #2563eb ${
            ((value - min) / (max - min)) * 100
          }%, #1f2937 0%)`,
        }}
      />
    </div>
  );
}

// ─── Dot Selector ─────────────────────────────────────────────────────────────

function DotSelector({
  value,
  count,
  onChange,
  activeColor,
  labels,
}: {
  value: number;
  count: number;
  onChange: (v: number) => void;
  activeColor: string;
  labels?: string[];
}) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: count }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="flex flex-col items-center gap-1 transition-all"
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold transition-all"
            style={{
              background: n <= value ? `${activeColor}20` : "#111827",
              border: `1px solid ${n === value ? activeColor : "#374151"}`,
              color: n <= value ? activeColor : "#4b5563",
            }}
          >
            {labels ? labels[n - 1] : n}
          </div>
        </button>
      ))}
    </div>
  );
}
