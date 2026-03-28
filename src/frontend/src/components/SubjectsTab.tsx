import { useRef, useState } from "react";
import { toast } from "sonner";
import { useSubjects } from "../context/SubjectsContext";
import type { Subject, Topic } from "../mockData";
import {
  calcSubjectConfidence,
  getDecayStatus,
  getTrend,
} from "../utils/confidenceEngine";
import { playClick, playTick } from "../utils/soundEffects";
import RetestModal from "./RetestModal";

type StatusCycle = "Not Started" | "In Progress" | "Completed";
const STATUS_NEXT: Record<StatusCycle, StatusCycle> = {
  "Not Started": "In Progress",
  "In Progress": "Completed",
  Completed: "Not Started",
};
const STATUS_COLOR: Record<StatusCycle, string> = {
  "Not Started": "#4b5563",
  "In Progress": "#f59e0b",
  Completed: "#22c55e",
};
const DECAY_COLOR: Record<"Fresh" | "Fading" | "Needs Revision", string> = {
  Fresh: "#22c55e",
  Fading: "#f59e0b",
  "Needs Revision": "#ef4444",
};

// ── Inline editable text ─────────────────────────────────────────────────────
function InlineEdit({
  value,
  onSave,
  className,
  style,
}: {
  value: string;
  onSave: (v: string) => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const commit = () => {
    setEditing(false);
    if (draft.trim() && draft.trim() !== value) onSave(draft.trim());
    else setDraft(value);
  };

  if (editing) {
    return (
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        className={className}
        style={{
          ...style,
          background: "transparent",
          borderBottom: "1px solid #2563eb",
          outline: "none",
          minWidth: 80,
        }}
      />
    );
  }

  return (
    <button
      type="button"
      className={className}
      style={{
        ...style,
        cursor: "text",
        background: "transparent",
        border: "none",
        padding: 0,
        textAlign: "left",
      }}
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      title="Click to edit"
    >
      {value}
    </button>
  );
}

// ── Confidence Badge ─────────────────────────────────────────────────────────
function ConfidenceBadge({
  topic,
  onRetest,
}: {
  topic: Topic;
  onRetest: () => void;
}) {
  const daysSince =
    (Date.now() - (topic.lastStudiedTimestamp ?? Date.now())) / 86400000;
  const decayStatus = getDecayStatus(daysSince);
  const trend = getTrend(topic.confidenceTrend ?? [topic.numericConfidence]);
  const trendArrow = trend === "up" ? "↑" : trend === "down" ? "↓" : "—";
  const trendColor =
    trend === "up" ? "#22c55e" : trend === "down" ? "#ef4444" : "#9ca3af";
  const decayColor = DECAY_COLOR[decayStatus];

  return (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      {/* Confidence % + trend */}
      <span
        className="text-xs font-semibold tabular-nums"
        style={{ color: "#f9fafb" }}
      >
        {topic.numericConfidence}%
      </span>
      <span className="text-xs font-bold" style={{ color: trendColor }}>
        {trendArrow}
      </span>
      {/* Decay badge */}
      <span
        className="text-xs px-1.5 py-0.5 rounded"
        style={{
          background: `${decayColor}18`,
          color: decayColor,
          border: `1px solid ${decayColor}35`,
        }}
      >
        {decayStatus}
      </span>
      {/* Retest button */}
      <button
        type="button"
        data-ocid="subjects.topic.retest_button"
        onClick={(e) => {
          e.stopPropagation();
          onRetest();
        }}
        className="text-xs px-1.5 py-0.5 rounded transition-colors"
        style={{
          background: "rgba(37,99,235,0.1)",
          color: "#3b82f6",
          border: "1px solid rgba(37,99,235,0.25)",
        }}
      >
        Retest →
      </button>
    </div>
  );
}

// ── Topic Row ────────────────────────────────────────────────────────────────
function TopicRow({
  topic,
  subjectId,
  onUpdate,
  onDelete,
}: {
  topic: Topic;
  subjectId: number;
  onUpdate: (updates: Partial<Topic>) => void;
  onDelete: () => void;
}) {
  const [retestOpen, setRetestOpen] = useState(false);
  const { updateTopicConfidence } = useSubjects();

  return (
    <>
      <div
        className="flex items-center gap-3 p-3 rounded-lg"
        style={{ background: "#07090d", border: "1px solid #1f2937" }}
      >
        {/* Status cycle */}
        <button
          type="button"
          onClick={() => {
            const nextStatus = STATUS_NEXT[topic.status as StatusCycle];
            onUpdate({ status: nextStatus });
            playTick();
            if (nextStatus === "Completed") {
              const newConf = Math.min(95, topic.numericConfidence + 4);
              updateTopicConfidence(subjectId, topic.id, newConf);
            }
          }}
          className="flex-shrink-0 px-2 py-0.5 rounded text-xs font-semibold transition-colors"
          style={{
            background: `${STATUS_COLOR[topic.status as StatusCycle]}15`,
            color: STATUS_COLOR[topic.status as StatusCycle],
            border: `1px solid ${STATUS_COLOR[topic.status as StatusCycle]}30`,
            minWidth: 90,
          }}
        >
          {topic.status}
        </button>

        {/* Inline topic name edit */}
        <InlineEdit
          value={topic.name}
          onSave={(v) => onUpdate({ name: v })}
          className="flex-1 text-sm"
          style={{ color: "#f9fafb" }}
        />

        {/* Dynamic confidence badge */}
        <ConfidenceBadge topic={topic} onRetest={() => setRetestOpen(true)} />

        {/* Confidence number input */}
        <div
          className="flex flex-col gap-0.5 flex-shrink-0"
          style={{ minWidth: 90 }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: "#4b5563" }}>
              conf
            </span>
            <input
              type="number"
              min={0}
              max={100}
              value={topic.numericConfidence}
              onChange={(e) =>
                onUpdate({
                  numericConfidence: Math.min(
                    100,
                    Math.max(0, Number(e.target.value)),
                  ),
                })
              }
              aria-label={`Confidence for ${topic.name}`}
              className="w-12 text-xs text-right rounded px-1 py-0.5 bg-transparent"
              style={{ border: "1px solid #1f2937", color: "#9ca3af" }}
            />
          </div>
          <div
            className="h-0.5 rounded-full"
            style={{ background: "#1f2937", width: 90 }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${topic.numericConfidence}%`,
                background:
                  topic.numericConfidence >= 65
                    ? "#22c55e"
                    : topic.numericConfidence >= 40
                      ? "#f59e0b"
                      : "#ef4444",
              }}
            />
          </div>
        </div>

        {/* Effort */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-xs" style={{ color: "#4b5563" }}>
            h
          </span>
          <input
            type="number"
            min={0.5}
            step={0.5}
            value={topic.estimatedEffort}
            onChange={(e) =>
              onUpdate({ estimatedEffort: Number(e.target.value) })
            }
            aria-label={`Effort hours for ${topic.name}`}
            className="w-12 text-xs text-right rounded px-1 py-0.5 bg-transparent"
            style={{ border: "1px solid #1f2937", color: "#9ca3af" }}
          />
        </div>

        {/* Revision count */}
        <button
          type="button"
          onClick={() => onUpdate({ revisionCount: topic.revisionCount + 1 })}
          className="flex-shrink-0 text-xs px-2 py-0.5 rounded transition-colors"
          style={{
            background: "rgba(34,211,238,0.08)",
            color: "#22d3ee",
            border: "1px solid rgba(34,211,238,0.2)",
          }}
          title="Increment revision count"
        >
          rev {topic.revisionCount} +
        </button>

        {/* Last studied */}
        <span
          className="text-xs flex-shrink-0"
          style={{ color: "#4b5563", minWidth: 60 }}
        >
          {topic.lastStudied}
        </span>

        {/* Delete */}
        <button
          type="button"
          onClick={onDelete}
          className="text-xs px-2 py-1 rounded transition-colors flex-shrink-0"
          style={{ color: "#4b5563", border: "1px solid #1f2937" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#ef4444";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#4b5563";
          }}
        >
          ×
        </button>
      </div>

      <RetestModal
        open={retestOpen}
        onClose={() => setRetestOpen(false)}
        subjectId={subjectId}
        topicId={topic.id}
        topicName={topic.name}
        currentConfidence={topic.numericConfidence}
      />
    </>
  );
}

// ── Subject Detail ────────────────────────────────────────────────────────────
function SubjectDetail({
  subject,
  onBack,
}: { subject: Subject; onBack: () => void }) {
  const { updateTopic, deleteTopic, addTopic, renameSubject } = useSubjects();
  const [newTopicName, setNewTopicName] = useState("");

  const completed = subject.topics.filter(
    (t) => t.status === "Completed",
  ).length;
  const progress =
    subject.topics.length > 0 ? (completed / subject.topics.length) * 100 : 0;
  const subjectConfidence = calcSubjectConfidence(subject.topics);

  const handleAddTopic = () => {
    if (!newTopicName.trim()) return;
    addTopic(subject.id, {
      name: newTopicName.trim(),
      status: "Not Started",
      numericConfidence: 30,
      estimatedEffort: 5,
      lastStudied: "Never",
      lastStudiedTimestamp: Date.now() - 30 * 86400000,
      confidenceTrend: [30],
      revisionCount: 0,
    });
    playTick();
    setNewTopicName("");
    toast.success(`Topic "${newTopicName.trim()}" added`);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          data-ocid="subjects.back.button"
          onClick={() => {
            playClick();
            onBack();
          }}
          className="text-sm px-3 py-1.5 rounded transition-colors"
          style={{
            color: "#9ca3af",
            border: "1px solid #1f2937",
            background: "#0f1720",
          }}
        >
          ← Back
        </button>
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ background: subject.color }}
        />
        <InlineEdit
          value={subject.name}
          onSave={(v) => renameSubject(subject.id, v)}
          className="text-xl font-semibold"
          style={{ color: "#f9fafb" }}
        />
        <div className="ml-auto flex items-center gap-3">
          {/* Subject confidence */}
          <span
            className="text-xs px-2 py-1 rounded"
            style={{
              background: "rgba(37,99,235,0.1)",
              color: "#9ca3af",
              border: "1px solid #1f2937",
            }}
          >
            Subject Confidence:{" "}
            <span
              style={{
                color:
                  subjectConfidence >= 65
                    ? "#22c55e"
                    : subjectConfidence >= 40
                      ? "#f59e0b"
                      : "#ef4444",
                fontWeight: 700,
              }}
            >
              {subjectConfidence}%
            </span>
          </span>
          <span className="text-sm" style={{ color: "#4b5563" }}>
            {subject.examWeight}% weight · {subject.requiredHours}h required
          </span>
        </div>
      </div>

      <div className="surface-card p-4">
        <div className="flex justify-between text-sm mb-2">
          <span style={{ color: "#9ca3af" }}>Syllabus Progress</span>
          <span style={{ color: "#f9fafb", fontWeight: 600 }}>
            {completed}/{subject.topics.length} topics · {Math.round(progress)}%
          </span>
        </div>
        <div className="h-1.5 rounded-full" style={{ background: "#1f2937" }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${progress}%`, background: subject.color }}
          />
        </div>
      </div>

      <div className="surface-card p-5">
        <div
          className="text-xs font-semibold tracking-widest uppercase mb-4"
          style={{ color: "#4b5563" }}
        >
          Topics
          <span
            className="ml-2 normal-case font-normal"
            style={{ color: "#1f2937" }}
          >
            — click name or status to edit
          </span>
        </div>
        <div className="space-y-2">
          {subject.topics.map((t) => (
            <TopicRow
              key={t.id}
              topic={t}
              subjectId={subject.id}
              onUpdate={(updates) => updateTopic(subject.id, t.id, updates)}
              onDelete={() => {
                deleteTopic(subject.id, t.id);
                toast.success(`"${t.name}" removed`);
              }}
            />
          ))}
          {subject.topics.length === 0 && (
            <div
              className="text-sm py-4 text-center"
              style={{ color: "#4b5563" }}
            >
              No topics yet. Add one below.
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          <input
            type="text"
            id="new-topic-input"
            value={newTopicName}
            onChange={(e) => setNewTopicName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddTopic()}
            placeholder="Add a topic..."
            data-ocid="subjects.topic.input"
            className="flex-1 px-3 py-2 rounded text-sm bg-transparent"
            style={{
              border: "1px solid #1f2937",
              color: "#f9fafb",
              outline: "none",
            }}
          />
          <button
            type="button"
            data-ocid="subjects.topic.button"
            onClick={handleAddTopic}
            className="px-4 py-2 rounded text-sm font-medium transition-colors"
            style={{ background: "#2563eb", color: "#fff" }}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Subject Card (with drag handle) ──────────────────────────────────────────
function SubjectCard({
  subject,
  idx,
  onClick,
  onDragStart,
  onDragOver,
  onDrop,
  onDelete,
}: {
  subject: Subject;
  idx: number;
  onClick: () => void;
  onDragStart: (idx: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (toIdx: number) => void;
  onDelete: () => void;
}) {
  const completed = subject.topics.filter(
    (t) => t.status === "Completed",
  ).length;
  const progress =
    subject.topics.length > 0 ? (completed / subject.topics.length) * 100 : 0;
  const subjectConfidence = calcSubjectConfidence(subject.topics);
  const strength =
    subjectConfidence >= 65
      ? "High"
      : subjectConfidence >= 40
        ? "Medium"
        : "Low";
  const strengthColor =
    strength === "High"
      ? "#22c55e"
      : strength === "Medium"
        ? "#f59e0b"
        : "#ef4444";

  return (
    <div
      draggable
      onDragStart={() => onDragStart(idx)}
      onDragOver={onDragOver}
      onDrop={() => onDrop(idx)}
      className="relative group surface-card p-5 cursor-pointer transition-all"
      data-ocid={`subjects.item.${idx + 1}`}
    >
      {/* Drag handle */}
      <div
        className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab"
        style={{ color: "#4b5563" }}
        title="Drag to reorder"
      >
        <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor">
          <title>Drag</title>
          <circle cx="3" cy="2" r="1.5" />
          <circle cx="7" cy="2" r="1.5" />
          <circle cx="3" cy="6" r="1.5" />
          <circle cx="7" cy="6" r="1.5" />
          <circle cx="3" cy="10" r="1.5" />
          <circle cx="7" cy="10" r="1.5" />
          <circle cx="3" cy="14" r="1.5" />
          <circle cx="7" cy="14" r="1.5" />
        </svg>
      </div>

      {/* Delete */}
      <button
        type="button"
        data-ocid={`subjects.delete_button.${idx + 1}`}
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute top-3 right-3 w-5 h-5 rounded flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}
      >
        ×
      </button>

      {/* Content — clickable */}
      <button type="button" onClick={onClick} className="w-full text-left">
        <div className="flex items-start justify-between mb-3 pr-4">
          <div className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: subject.color }}
            />
            <span className="font-medium" style={{ color: "#f9fafb" }}>
              {subject.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Subject confidence inline */}
            <span
              className="text-xs tabular-nums"
              style={{
                color:
                  subjectConfidence >= 65
                    ? "#22c55e"
                    : subjectConfidence >= 40
                      ? "#f59e0b"
                      : "#ef4444",
              }}
            >
              {subjectConfidence}%
            </span>
            <span
              className="pill text-xs"
              style={{
                background: `${strengthColor}15`,
                color: strengthColor,
                border: `1px solid ${strengthColor}30`,
              }}
            >
              {strength}
            </span>
          </div>
        </div>
        <div
          className="h-1 rounded-full mb-3"
          style={{ background: "#1f2937" }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${progress}%`, background: subject.color }}
          />
        </div>
        <div className="flex justify-between text-xs">
          <span style={{ color: "#4b5563" }}>
            {completed}/{subject.topics.length} topics
          </span>
          <span style={{ color: "#4b5563" }}>{subject.examWeight}% weight</span>
        </div>
      </button>
    </div>
  );
}

const FORM_FIELDS = [
  { key: "name" as const, label: "Name", type: "text" },
  { key: "examWeight" as const, label: "Exam Weight %", type: "number" },
  { key: "difficulty" as const, label: "Difficulty (1-5)", type: "number" },
  { key: "totalChapters" as const, label: "Total Chapters", type: "number" },
  { key: "requiredHours" as const, label: "Required Hours", type: "number" },
] as const;

// ── Main SubjectsTab ──────────────────────────────────────────────────────────
export default function SubjectsTab() {
  const { subjects, addSubject, deleteSubject, reorderSubjects } =
    useSubjects();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const dragFromRef = useRef<number | null>(null);
  const [form, setForm] = useState({
    name: "",
    examWeight: 20,
    difficulty: 3,
    totalChapters: 5,
    requiredHours: 50,
    color: "#3b82f6",
  });

  const selectedSubject = subjects.find((s) => s.id === selectedId);

  if (selectedSubject) {
    return (
      <SubjectDetail
        subject={selectedSubject}
        onBack={() => setSelectedId(null)}
      />
    );
  }

  const handleAddSubject = () => {
    if (!form.name.trim()) return;
    addSubject({ ...form });
    setForm({
      name: "",
      examWeight: 20,
      difficulty: 3,
      totalChapters: 5,
      requiredHours: 50,
      color: "#3b82f6",
    });
    setShowAdd(false);
    playTick();
    toast.success(`Subject "${form.name}" added`);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1
          className="text-xs font-semibold tracking-widest uppercase"
          style={{ color: "#4b5563" }}
        >
          Subjects & Syllabus
        </h1>
        <button
          type="button"
          data-ocid="subjects.add.button"
          onClick={() => {
            setShowAdd((v) => !v);
            playClick();
          }}
          className="px-4 py-1.5 rounded text-sm transition-colors"
          style={{
            border: "1px solid #2563eb",
            color: "#3b82f6",
            background: "transparent",
          }}
        >
          + Add Subject
        </button>
      </div>

      {showAdd && (
        <div className="surface-card p-5 space-y-3">
          <h2
            className="text-xs font-semibold tracking-widest uppercase"
            style={{ color: "#4b5563" }}
          >
            New Subject
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {FORM_FIELDS.map((field) => (
              <div key={field.key}>
                <label
                  htmlFor={`subject-field-${field.key}`}
                  className="text-xs block mb-1"
                  style={{ color: "#4b5563" }}
                >
                  {field.label}
                </label>
                <input
                  id={`subject-field-${field.key}`}
                  type={field.type}
                  value={form[field.key]}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      [field.key]:
                        field.type === "number"
                          ? Number(e.target.value)
                          : e.target.value,
                    }))
                  }
                  data-ocid={`subjects.${field.key}.input`}
                  className="w-full px-3 py-2 rounded text-sm bg-transparent"
                  style={{
                    border: "1px solid #1f2937",
                    color: "#f9fafb",
                    outline: "none",
                  }}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              data-ocid="subjects.add.submit_button"
              onClick={handleAddSubject}
              className="px-4 py-2 rounded text-sm font-medium"
              style={{ background: "#2563eb", color: "#fff" }}
            >
              Create Subject
            </button>
            <button
              type="button"
              data-ocid="subjects.add.cancel_button"
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 rounded text-sm"
              style={{ border: "1px solid #1f2937", color: "#9ca3af" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {subjects.length === 0 ? (
        <div
          data-ocid="subjects.empty_state"
          className="surface-card p-16 text-center space-y-4"
        >
          <p style={{ color: "#4b5563" }}>Add your first subject to begin.</p>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="px-6 py-2 rounded text-sm font-medium"
            style={{ background: "#2563eb", color: "#fff" }}
          >
            Add Subject
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((s, idx) => (
            <SubjectCard
              key={s.id}
              subject={s}
              idx={idx}
              onClick={() => {
                setSelectedId(s.id);
                playClick();
              }}
              onDragStart={(i) => {
                dragFromRef.current = i;
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(toIdx) => {
                if (
                  dragFromRef.current !== null &&
                  dragFromRef.current !== toIdx
                ) {
                  reorderSubjects(dragFromRef.current, toIdx);
                }
                dragFromRef.current = null;
              }}
              onDelete={() => {
                deleteSubject(s.id);
                toast.success(`"${s.name}" removed`);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
