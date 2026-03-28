import { type ReactNode, createContext, useContext, useState } from "react";
import { type Subject, type Topic, initialSubjects } from "../mockData";

interface SubjectsContextValue {
  subjects: Subject[];
  addSubject: (s: Omit<Subject, "id" | "topics">) => void;
  updateSubject: (id: number, updates: Partial<Subject>) => void;
  deleteSubject: (id: number) => void;
  renameSubject: (id: number, newName: string) => void;
  reorderSubjects: (fromIndex: number, toIndex: number) => void;
  addTopic: (subjectId: number, topic: Omit<Topic, "id">) => void;
  updateTopic: (
    subjectId: number,
    topicId: number,
    updates: Partial<Topic>,
  ) => void;
  deleteTopic: (subjectId: number, topicId: number) => void;
}

const SubjectsCtx = createContext<SubjectsContextValue | null>(null);

export function SubjectsProvider({ children }: { children: ReactNode }) {
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);

  const addSubject = (s: Omit<Subject, "id" | "topics">) => {
    setSubjects((prev) => [...prev, { ...s, id: Date.now(), topics: [] }]);
  };

  const updateSubject = (id: number, updates: Partial<Subject>) => {
    setSubjects((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    );
  };

  const renameSubject = (id: number, newName: string) => {
    setSubjects((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name: newName } : s)),
    );
  };

  const reorderSubjects = (fromIndex: number, toIndex: number) => {
    setSubjects((prev) => {
      const arr = [...prev];
      const [item] = arr.splice(fromIndex, 1);
      arr.splice(toIndex, 0, item);
      return arr;
    });
  };

  const deleteSubject = (id: number) => {
    setSubjects((prev) => prev.filter((s) => s.id !== id));
  };

  const addTopic = (subjectId: number, topic: Omit<Topic, "id">) => {
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId
          ? { ...s, topics: [...s.topics, { ...topic, id: Date.now() }] }
          : s,
      ),
    );
  };

  const updateTopic = (
    subjectId: number,
    topicId: number,
    updates: Partial<Topic>,
  ) => {
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId
          ? {
              ...s,
              topics: s.topics.map((t) =>
                t.id === topicId ? { ...t, ...updates } : t,
              ),
            }
          : s,
      ),
    );
  };

  const deleteTopic = (subjectId: number, topicId: number) => {
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId
          ? { ...s, topics: s.topics.filter((t) => t.id !== topicId) }
          : s,
      ),
    );
  };

  return (
    <SubjectsCtx.Provider
      value={{
        subjects,
        addSubject,
        updateSubject,
        deleteSubject,
        renameSubject,
        reorderSubjects,
        addTopic,
        updateTopic,
        deleteTopic,
      }}
    >
      {children}
    </SubjectsCtx.Provider>
  );
}

export function useSubjects(): SubjectsContextValue {
  const ctx = useContext(SubjectsCtx);
  if (!ctx) throw new Error("useSubjects must be used inside SubjectsProvider");
  return ctx;
}
