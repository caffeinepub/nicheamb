import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface UpdateEvent {
    id: bigint;
    topic: string;
    dayOfWeek: bigint;
    completed: boolean;
    durationMinutes: bigint;
    subjectId: bigint;
    startHour: bigint;
}
export type Time = bigint;
export interface CalendarEvent {
    id: bigint;
    topic: string;
    dayOfWeek: bigint;
    completed: boolean;
    durationMinutes: bigint;
    subjectId: bigint;
    startHour: bigint;
}
export interface UpdateGoal {
    id: bigint;
    targetScore: bigint;
    deadline: Time;
    subjectId: bigint;
    currentScore: bigint;
}
export interface UpdateSession {
    id: bigint;
    startTime: Time;
    focusRating: bigint;
    topic: string;
    endTime: Time;
    completed: boolean;
    durationMinutes: bigint;
    subjectId: bigint;
}
export interface StudySession {
    id: bigint;
    startTime: Time;
    focusRating: bigint;
    topic: string;
    endTime: Time;
    completed: boolean;
    durationMinutes: bigint;
    subjectId: bigint;
}
export interface UpdateSubject {
    id: bigint;
    revisionDueDate?: Time;
    name: string;
    lastStudied: Time;
    confidenceLabel: ConfidenceLabel;
    strengthScore: bigint;
    timeInvested: bigint;
    priority: Priority;
}
export interface Subject {
    id: bigint;
    revisionDueDate?: Time;
    name: string;
    lastStudied: Time;
    confidenceLabel: ConfidenceLabel;
    strengthScore: bigint;
    timeInvested: bigint;
    priority: Priority;
}
export interface Goal {
    id: bigint;
    targetScore: bigint;
    deadline: Time;
    subjectId: bigint;
    currentScore: bigint;
}
export enum ConfidenceLabel {
    low = "low",
    high = "high",
    medium = "medium"
}
export enum Priority {
    must_do = "must_do",
    should_do = "should_do",
    drop = "drop"
}
export interface backendInterface {
    createCalendarEvent(subjectId: bigint, dayOfWeek: bigint, startHour: bigint, durationMinutes: bigint, topic: string): Promise<bigint>;
    createGoal(subjectId: bigint, targetScore: bigint, currentScore: bigint, deadline: Time): Promise<bigint>;
    createStudySession(subjectId: bigint, startTime: Time, endTime: Time, focusRating: bigint, topic: string): Promise<bigint>;
    createSubject(name: string): Promise<bigint>;
    deleteCalendarEvent(id: bigint): Promise<void>;
    deleteGoal(id: bigint): Promise<void>;
    deleteStudySession(id: bigint): Promise<void>;
    deleteSubject(id: bigint): Promise<void>;
    getAllCalendarEvents(): Promise<Array<CalendarEvent>>;
    getAllGoals(): Promise<Array<Goal>>;
    getAllStudySessions(): Promise<Array<StudySession>>;
    getAllSubjects(): Promise<Array<Subject>>;
    getAvoidedSubjects(): Promise<Array<Subject>>;
    getCalendarEvent(id: bigint): Promise<CalendarEvent>;
    getGoal(id: bigint): Promise<Goal>;
    getRevisionDueSubjects(): Promise<Array<Subject>>;
    getStudySession(id: bigint): Promise<StudySession>;
    getSubject(id: bigint): Promise<Subject>;
    getSubjectsByPriority(): Promise<Array<Subject>>;
    updateCalendarEvent(input: UpdateEvent): Promise<void>;
    updateGoal(input: UpdateGoal): Promise<void>;
    updateStudySession(input: UpdateSession): Promise<void>;
    updateSubject(input: UpdateSubject): Promise<void>;
    updateSubjectLastStudied(subjectId: bigint, timestamp: Time): Promise<void>;
}
