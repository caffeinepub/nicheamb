// ── Core data model ──────────────────────────────────────────────────────────

export interface Topic {
  id: number;
  name: string;
  status: "Not Started" | "In Progress" | "Completed";
  numericConfidence: number; // 0–100
  estimatedEffort: number; // hours
  lastStudied: string;
  revisionCount: number;
}

export interface Subject {
  id: number;
  name: string;
  examWeight: number; // 0–100 percentage
  difficulty: number; // 1–5
  totalChapters: number;
  requiredHours: number;
  topics: Topic[];
  color: string;
}

export interface StudySession {
  date: string;
  subjectId: number;
  topicId: number;
  focusedMinutes: number;
  totalMinutes: number;
  method: string;
}

export const studyConfig = {
  studyHoursPerDay: 4,
  consistencyFactor: 0.72,
  daysRemaining: 45,
  pastPerformance: 68,
};

export const initialSubjects: Subject[] = [
  {
    id: 1,
    name: "Mathematics",
    examWeight: 30,
    difficulty: 4,
    totalChapters: 8,
    requiredHours: 80,
    color: "#3b82f6",
    topics: [
      {
        id: 101,
        name: "Quadratic Equations",
        status: "In Progress",
        numericConfidence: 30,
        estimatedEffort: 8,
        lastStudied: "2 days ago",
        revisionCount: 3,
      },
      {
        id: 102,
        name: "Trigonometry",
        status: "Not Started",
        numericConfidence: 20,
        estimatedEffort: 10,
        lastStudied: "5 days ago",
        revisionCount: 1,
      },
      {
        id: 103,
        name: "Algebra Fundamentals",
        status: "Completed",
        numericConfidence: 65,
        estimatedEffort: 6,
        lastStudied: "1 day ago",
        revisionCount: 5,
      },
      {
        id: 104,
        name: "Statistics & Probability",
        status: "Not Started",
        numericConfidence: 25,
        estimatedEffort: 9,
        lastStudied: "7 days ago",
        revisionCount: 1,
      },
      {
        id: 105,
        name: "Calculus Basics",
        status: "Not Started",
        numericConfidence: 15,
        estimatedEffort: 12,
        lastStudied: "Never",
        revisionCount: 0,
      },
    ],
  },
  {
    id: 2,
    name: "Physics",
    examWeight: 25,
    difficulty: 4,
    totalChapters: 7,
    requiredHours: 70,
    color: "#2563eb",
    topics: [
      {
        id: 201,
        name: "Newton's Laws",
        status: "In Progress",
        numericConfidence: 55,
        estimatedEffort: 7,
        lastStudied: "1 day ago",
        revisionCount: 4,
      },
      {
        id: 202,
        name: "Thermodynamics",
        status: "Not Started",
        numericConfidence: 30,
        estimatedEffort: 9,
        lastStudied: "4 days ago",
        revisionCount: 1,
      },
      {
        id: 203,
        name: "Optics & Waves",
        status: "In Progress",
        numericConfidence: 45,
        estimatedEffort: 8,
        lastStudied: "2 days ago",
        revisionCount: 2,
      },
      {
        id: 204,
        name: "Electrostatics",
        status: "Completed",
        numericConfidence: 70,
        estimatedEffort: 6,
        lastStudied: "Today",
        revisionCount: 6,
      },
      {
        id: 205,
        name: "Modern Physics",
        status: "Not Started",
        numericConfidence: 20,
        estimatedEffort: 10,
        lastStudied: "Never",
        revisionCount: 0,
      },
    ],
  },
  {
    id: 3,
    name: "Chemistry",
    examWeight: 20,
    difficulty: 3,
    totalChapters: 6,
    requiredHours: 55,
    color: "#22d3ee",
    topics: [
      {
        id: 301,
        name: "Organic Chemistry",
        status: "In Progress",
        numericConfidence: 50,
        estimatedEffort: 10,
        lastStudied: "1 day ago",
        revisionCount: 3,
      },
      {
        id: 302,
        name: "Chemical Bonding",
        status: "Completed",
        numericConfidence: 75,
        estimatedEffort: 6,
        lastStudied: "Today",
        revisionCount: 7,
      },
      {
        id: 303,
        name: "Thermochemistry",
        status: "In Progress",
        numericConfidence: 55,
        estimatedEffort: 8,
        lastStudied: "3 days ago",
        revisionCount: 2,
      },
      {
        id: 304,
        name: "Electrochemistry",
        status: "Not Started",
        numericConfidence: 30,
        estimatedEffort: 7,
        lastStudied: "8 days ago",
        revisionCount: 1,
      },
      {
        id: 305,
        name: "Nuclear Chemistry",
        status: "Not Started",
        numericConfidence: 20,
        estimatedEffort: 5,
        lastStudied: "Never",
        revisionCount: 0,
      },
    ],
  },
  {
    id: 4,
    name: "English",
    examWeight: 15,
    difficulty: 2,
    totalChapters: 5,
    requiredHours: 40,
    color: "#22c55e",
    topics: [
      {
        id: 401,
        name: "Essay Writing",
        status: "In Progress",
        numericConfidence: 72,
        estimatedEffort: 6,
        lastStudied: "Today",
        revisionCount: 5,
      },
      {
        id: 402,
        name: "Literary Analysis",
        status: "In Progress",
        numericConfidence: 60,
        estimatedEffort: 7,
        lastStudied: "2 days ago",
        revisionCount: 3,
      },
      {
        id: 403,
        name: "Grammar & Syntax",
        status: "Completed",
        numericConfidence: 80,
        estimatedEffort: 4,
        lastStudied: "1 day ago",
        revisionCount: 8,
      },
      {
        id: 404,
        name: "Comprehension",
        status: "Completed",
        numericConfidence: 85,
        estimatedEffort: 5,
        lastStudied: "Today",
        revisionCount: 6,
      },
    ],
  },
  {
    id: 5,
    name: "History",
    examWeight: 10,
    difficulty: 2,
    totalChapters: 6,
    requiredHours: 35,
    color: "#f59e0b",
    topics: [
      {
        id: 501,
        name: "World War II Causes",
        status: "Completed",
        numericConfidence: 88,
        estimatedEffort: 5,
        lastStudied: "Today",
        revisionCount: 9,
      },
      {
        id: 502,
        name: "Cold War Dynamics",
        status: "Completed",
        numericConfidence: 84,
        estimatedEffort: 6,
        lastStudied: "1 day ago",
        revisionCount: 7,
      },
      {
        id: 503,
        name: "Industrial Revolution",
        status: "Completed",
        numericConfidence: 78,
        estimatedEffort: 5,
        lastStudied: "2 days ago",
        revisionCount: 5,
      },
      {
        id: 504,
        name: "Colonialism & Decolonisation",
        status: "In Progress",
        numericConfidence: 60,
        estimatedEffort: 7,
        lastStudied: "3 days ago",
        revisionCount: 3,
      },
      {
        id: 505,
        name: "Historiography",
        status: "In Progress",
        numericConfidence: 55,
        estimatedEffort: 6,
        lastStudied: "1 day ago",
        revisionCount: 4,
      },
    ],
  },
];

// ── Calendar ──────────────────────────────────────────────────────────────────

export interface CalendarBlock {
  id: string;
  subject: string;
  topic: string;
  dayIndex: number;
  startHour: number;
  durationMinutes: number;
  priority: "Must Do" | "Should Do" | "Drop";
}

export const initialCalendarBlocks: CalendarBlock[] = [
  {
    id: "b1",
    subject: "Mathematics",
    topic: "Quadratic Equations",
    dayIndex: 0,
    startHour: 9,
    durationMinutes: 60,
    priority: "Must Do",
  },
  {
    id: "b2",
    subject: "Physics",
    topic: "Newton's Laws",
    dayIndex: 0,
    startHour: 14,
    durationMinutes: 60,
    priority: "Must Do",
  },
  {
    id: "b3",
    subject: "Chemistry",
    topic: "Organic Chemistry",
    dayIndex: 1,
    startHour: 10,
    durationMinutes: 90,
    priority: "Should Do",
  },
  {
    id: "b4",
    subject: "English",
    topic: "Essay Writing",
    dayIndex: 1,
    startHour: 15,
    durationMinutes: 60,
    priority: "Should Do",
  },
  {
    id: "b5",
    subject: "Mathematics",
    topic: "Trigonometry",
    dayIndex: 2,
    startHour: 9,
    durationMinutes: 60,
    priority: "Must Do",
  },
  {
    id: "b6",
    subject: "Physics",
    topic: "Thermodynamics",
    dayIndex: 3,
    startHour: 11,
    durationMinutes: 60,
    priority: "Must Do",
  },
  {
    id: "b7",
    subject: "Chemistry",
    topic: "Chemical Bonding",
    dayIndex: 4,
    startHour: 9,
    durationMinutes: 60,
    priority: "Should Do",
  },
];

export const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const DAYS_DATES = [
  "Mon Mar 30",
  "Tue Mar 31",
  "Wed Apr 1",
  "Thu Apr 2",
  "Fri Apr 3",
  "Sat Apr 4",
  "Sun Apr 5",
];
export const CALENDAR_START_HOUR = 8;
export const CALENDAR_END_HOUR = 22;
export const ROW_HEIGHT = 56;
