import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import AnalysisTab from "./components/AnalysisTab";
import CalendarTab from "./components/CalendarTab";
import Header from "./components/Header";
import ReviewTab from "./components/ReviewTab";
import SoundPanel from "./components/SoundPanel";
import StudyModeTab from "./components/StudyModeTab";
import SubjectsTab from "./components/SubjectsTab";
import { AssessmentProvider } from "./context/AssessmentContext";
import { AudioProvider } from "./context/AudioContext";
import { SubjectsProvider } from "./context/SubjectsContext";

export type TabId = "analysis" | "study" | "calendar" | "review" | "subjects";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("analysis");

  return (
    <AudioProvider>
      <SubjectsProvider>
        <AssessmentProvider>
          <div className="min-h-screen" style={{ backgroundColor: "#07090d" }}>
            <Header activeTab={activeTab} onTabChange={setActiveTab} />
            <main className="pt-4 pb-16 px-4 md:px-6 max-w-7xl mx-auto">
              <div key={activeTab} className="tab-content">
                {activeTab === "analysis" && <AnalysisTab />}
                {activeTab === "subjects" && <SubjectsTab />}
                {activeTab === "study" && <StudyModeTab />}
                {activeTab === "calendar" && <CalendarTab />}
                {activeTab === "review" && <ReviewTab />}
              </div>
            </main>
            <SoundPanel />
            <Toaster
              position="top-center"
              toastOptions={{
                style: {
                  background: "#0f1720",
                  border: "1px solid #1f2937",
                  color: "#f9fafb",
                },
              }}
            />
          </div>
        </AssessmentProvider>
      </SubjectsProvider>
    </AudioProvider>
  );
}
