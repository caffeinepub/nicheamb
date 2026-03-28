import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface SubjectAssessment {
  subjectId: number;
  confidence: number; // 0–100
  completionPct: number; // 0–100
  testScore: number | null;
  perceivedDifficulty: number; // 1–5
  quizAccuracy: number | null; // 0–100
  weakTopics: string[];
}

export interface StudyHabits {
  hoursPerDay: number;
  consistencyDays: number; // 1–7
  distractionLevel: number; // 1–5
  sleepHours: number;
}

export interface TimeInput {
  mode: "date" | "days";
  examDate: string | null;
  daysRemaining: number | null;
}

export interface AssessmentData {
  subjectAssessments: SubjectAssessment[];
  studyHabits: StudyHabits;
  timeInput: TimeInput;
  assessmentComplete: boolean;
  totalPlannedDays: number;
}

const DEFAULT_HABITS: StudyHabits = {
  hoursPerDay: 4,
  consistencyDays: 5,
  distractionLevel: 2,
  sleepHours: 7,
};

const DEFAULT_TIME: TimeInput = {
  mode: "days",
  examDate: null,
  daysRemaining: null,
};

const DEFAULT_DATA: AssessmentData = {
  subjectAssessments: [],
  studyHabits: DEFAULT_HABITS,
  timeInput: DEFAULT_TIME,
  assessmentComplete: false,
  totalPlannedDays: 0,
};

const LS_KEY = "nicheamb_assessment";

interface AssessmentContextValue {
  assessment: AssessmentData;
  updateSubjectAssessment: (data: SubjectAssessment) => void;
  updateStudyHabits: (habits: StudyHabits) => void;
  updateTimeInput: (time: TimeInput) => void;
  completeAssessment: () => void;
  resetAssessment: () => void;
  getDaysRemaining: () => number;
  getConsistencyFactor: () => number;
  getEffectiveHoursPerDay: () => number;
}

const AssessmentCtx = createContext<AssessmentContextValue | null>(null);

export function AssessmentProvider({ children }: { children: ReactNode }) {
  const [assessment, setAssessment] = useState<AssessmentData>(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) return JSON.parse(raw) as AssessmentData;
    } catch {}
    return DEFAULT_DATA;
  });

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(assessment));
  }, [assessment]);

  const updateSubjectAssessment = useCallback((data: SubjectAssessment) => {
    setAssessment((prev) => {
      const existing = prev.subjectAssessments.findIndex(
        (s) => s.subjectId === data.subjectId,
      );
      const next =
        existing >= 0
          ? prev.subjectAssessments.map((s, i) => (i === existing ? data : s))
          : [...prev.subjectAssessments, data];
      return { ...prev, subjectAssessments: next };
    });
  }, []);

  const updateStudyHabits = useCallback((habits: StudyHabits) => {
    setAssessment((prev) => ({ ...prev, studyHabits: habits }));
  }, []);

  const updateTimeInput = useCallback((time: TimeInput) => {
    setAssessment((prev) => ({ ...prev, timeInput: time }));
  }, []);

  const completeAssessment = useCallback(() => {
    setAssessment((prev) => {
      const days = getDaysRemainingFrom(prev.timeInput);
      return {
        ...prev,
        assessmentComplete: true,
        totalPlannedDays:
          prev.totalPlannedDays > 0 ? prev.totalPlannedDays : days,
      };
    });
  }, []);

  const resetAssessment = useCallback(() => {
    setAssessment(DEFAULT_DATA);
  }, []);

  const getDaysRemaining = useCallback(() => {
    return getDaysRemainingFrom(assessment.timeInput);
  }, [assessment.timeInput]);

  const getConsistencyFactor = useCallback(() => {
    const h = assessment.studyHabits;
    return (h.consistencyDays / 7) * (1 - (h.distractionLevel - 1) / 8);
  }, [assessment.studyHabits]);

  const getEffectiveHoursPerDay = useCallback(() => {
    const cf =
      (assessment.studyHabits.consistencyDays / 7) *
      (1 - (assessment.studyHabits.distractionLevel - 1) / 8);
    return assessment.studyHabits.hoursPerDay * cf;
  }, [assessment.studyHabits]);

  return (
    <AssessmentCtx.Provider
      value={{
        assessment,
        updateSubjectAssessment,
        updateStudyHabits,
        updateTimeInput,
        completeAssessment,
        resetAssessment,
        getDaysRemaining,
        getConsistencyFactor,
        getEffectiveHoursPerDay,
      }}
    >
      {children}
    </AssessmentCtx.Provider>
  );
}

function getDaysRemainingFrom(timeInput: TimeInput): number {
  if (timeInput.mode === "days" && timeInput.daysRemaining !== null) {
    return timeInput.daysRemaining;
  }
  if (timeInput.mode === "date" && timeInput.examDate) {
    const diff = new Date(timeInput.examDate).getTime() - Date.now();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }
  return 30; // fallback
}

export function useAssessment(): AssessmentContextValue {
  const ctx = useContext(AssessmentCtx);
  if (!ctx)
    throw new Error("useAssessment must be used inside AssessmentProvider");
  return ctx;
}
