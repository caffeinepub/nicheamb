import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { useSubjects } from "../context/SubjectsContext";
import {
  CALENDAR_END_HOUR,
  CALENDAR_START_HOUR,
  type CalendarBlock,
  DAYS_DATES,
  DAYS_SHORT,
  ROW_HEIGHT,
  initialCalendarBlocks,
} from "../mockData";

const TOTAL_HOURS = CALENDAR_END_HOUR - CALENDAR_START_HOUR;
const TOTAL_HEIGHT = TOTAL_HOURS * ROW_HEIGHT;
const HOURS_ARRAY = Array.from(
  { length: TOTAL_HOURS },
  (_, i) => CALENDAR_START_HOUR + i,
);

const BLOCK_COLORS: Record<string, { bg: string; border: string }> = {
  "Must Do": { bg: "rgba(37,99,235,0.15)", border: "#2563eb" },
  "Should Do": { bg: "rgba(59,130,246,0.1)", border: "#3b82f6" },
  Drop: { bg: "rgba(31,41,55,0.8)", border: "#4b5563" },
};

export default function CalendarTab() {
  const { subjects } = useSubjects();
  const [blocks, setBlocks] = useState<CalendarBlock[]>(initialCalendarBlocks);
  const dragging = useRef<{
    blockId: string;
    offsetY: number;
  } | null>(null);

  const colRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleAutoSchedule = useCallback(() => {
    const prioritized: { subject: string; topic: string; priority: number }[] =
      [];
    for (const s of subjects) {
      for (const t of s.topics) {
        if (t.status === "Completed") continue;
        const p =
          (s.examWeight * (1 - t.numericConfidence / 100)) /
          Math.max(t.estimatedEffort, 0.5);
        prioritized.push({ subject: s.name, topic: t.name, priority: p });
      }
    }
    prioritized.sort((a, b) => b.priority - a.priority);

    const newBlocks: CalendarBlock[] = [...blocks];
    let dayIdx = 1;
    let hour = 9;

    for (const item of prioritized.slice(0, 7)) {
      if (dayIdx >= 7) break;
      const exists = newBlocks.some(
        (b) =>
          b.dayIndex === dayIdx &&
          b.startHour < hour + 1 &&
          b.startHour + b.durationMinutes / 60 > hour,
      );
      if (!exists) {
        newBlocks.push({
          id: `auto-${Date.now()}-${Math.random()}`,
          subject: item.subject,
          topic: item.topic,
          dayIndex: dayIdx,
          startHour: hour,
          durationMinutes: 60,
          priority: "Must Do",
        });
        hour += 2;
        if (hour >= 20) {
          hour = 9;
          dayIdx++;
        }
      } else {
        hour += 1;
        if (hour >= 20) {
          hour = 9;
          dayIdx++;
        }
      }
    }
    setBlocks(newBlocks);
    toast.success("Calendar auto-scheduled based on priority");
  }, [subjects, blocks]);

  const handleDragStart = (e: React.MouseEvent, blockId: string) => {
    const el = (e.currentTarget as HTMLElement).parentElement;
    const rect = el?.getBoundingClientRect();
    const offsetY = rect ? e.clientY - rect.top : 0;
    dragging.current = { blockId, offsetY };
    (e.currentTarget as HTMLElement).classList.add("dragging");
  };

  const handleColumnDrop = (e: React.MouseEvent, dayIndex: number) => {
    if (!dragging.current) return;
    const col = colRefs.current[dayIndex];
    if (!col) return;
    const rect = col.getBoundingClientRect();
    const relY = e.clientY - rect.top - dragging.current.offsetY;
    const newHour =
      CALENDAR_START_HOUR +
      Math.max(0, Math.min(TOTAL_HOURS - 1, Math.round(relY / ROW_HEIGHT)));
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === dragging.current!.blockId
          ? { ...b, dayIndex, startHour: newHour }
          : b,
      ),
    );
    dragging.current = null;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1
          className="text-xs font-semibold tracking-widest uppercase"
          style={{ color: "#4b5563" }}
        >
          Weekly Calendar
        </h1>
        <button
          type="button"
          data-ocid="calendar.auto_schedule.button"
          onClick={handleAutoSchedule}
          className="px-4 py-1.5 rounded text-sm transition-colors"
          style={{
            background: "rgba(37,99,235,0.12)",
            color: "#3b82f6",
            border: "1px solid rgba(37,99,235,0.3)",
          }}
        >
          Auto Schedule
        </button>
      </div>

      <div
        className="surface-card overflow-hidden"
        style={{ overflowX: "auto" }}
      >
        {/* Day headers */}
        <div
          className="grid"
          style={{
            gridTemplateColumns: "48px repeat(7, 1fr)",
            borderBottom: "1px solid #1f2937",
          }}
        >
          <div className="p-2" />
          {DAYS_SHORT.map((day, i) => (
            <div
              key={day}
              className="p-3 text-center"
              style={{ borderLeft: "1px solid #1f2937" }}
            >
              <div
                className="text-xs font-semibold"
                style={{ color: "#9ca3af" }}
              >
                {day}
              </div>
              <div className="text-xs mt-0.5" style={{ color: "#4b5563" }}>
                {DAYS_DATES[i].split(" ").slice(1).join(" ")}
              </div>
            </div>
          ))}
        </div>

        {/* Grid */}
        <div
          className="grid relative"
          style={{
            gridTemplateColumns: "48px repeat(7, 1fr)",
            height: TOTAL_HEIGHT,
          }}
        >
          {/* Hour labels */}
          <div className="relative">
            {HOURS_ARRAY.map((hour) => (
              <div
                key={`hour-label-${hour}`}
                className="absolute text-right pr-2 text-xs"
                style={{
                  top: (hour - CALENDAR_START_HOUR) * ROW_HEIGHT - 7,
                  left: 0,
                  right: 0,
                  color: "#4b5563",
                }}
              >
                {hour}:00
              </div>
            ))}
          </div>

          {/* Day columns */}
          {DAYS_SHORT.map((day, dayIdx) => (
            <div
              key={day}
              ref={(el) => {
                colRefs.current[dayIdx] = el;
              }}
              className="relative"
              style={{ borderLeft: "1px solid #1f2937", height: TOTAL_HEIGHT }}
              onMouseUp={(e) => handleColumnDrop(e, dayIdx)}
            >
              {/* Hour grid lines */}
              {HOURS_ARRAY.map((hour) => (
                <div
                  key={`gridline-${day}-${hour}`}
                  className="absolute w-full"
                  style={{
                    top: (hour - CALENDAR_START_HOUR) * ROW_HEIGHT,
                    height: ROW_HEIGHT,
                    borderTop: "1px solid #1f293720",
                  }}
                />
              ))}

              {/* Blocks */}
              {blocks
                .filter((b) => b.dayIndex === dayIdx)
                .map((block) => {
                  const topPx =
                    (block.startHour - CALENDAR_START_HOUR) * ROW_HEIGHT;
                  const heightPx = (block.durationMinutes / 60) * ROW_HEIGHT;
                  const colors =
                    BLOCK_COLORS[block.priority] ?? BLOCK_COLORS["Should Do"];
                  return (
                    <div
                      key={block.id}
                      data-ocid="calendar.block.card"
                      className="drag-block absolute left-1 right-1 rounded overflow-hidden select-none"
                      style={{
                        top: topPx,
                        height: heightPx,
                        background: colors.bg,
                        borderLeft: `3px solid ${colors.border}`,
                        padding: "3px 6px",
                      }}
                      onMouseDown={(e) => handleDragStart(e, block.id)}
                    >
                      <div
                        className="text-xs font-medium truncate"
                        style={{ color: "#f9fafb" }}
                      >
                        {block.topic}
                      </div>
                      <div
                        className="text-xs truncate mt-0.5"
                        style={{ color: "#4b5563" }}
                      >
                        {block.subject}
                      </div>
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
