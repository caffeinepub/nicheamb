import type { TabId } from "../App";

const TABS: { id: TabId; label: string }[] = [
  { id: "analysis", label: "Analysis" },
  { id: "subjects", label: "Subjects" },
  { id: "study", label: "Study" },
  { id: "calendar", label: "Calendar" },
  { id: "review", label: "Review" },
];

interface Props {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export default function Header({ activeTab, onTabChange }: Props) {
  return (
    <header
      className="sticky top-0 z-30"
      style={{
        backgroundColor: "#07090d",
        borderBottom: "1px solid #1f2937",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center gap-8">
        {/* Wordmark */}
        <span
          className="flex-shrink-0 text-sm font-semibold tracking-widest lowercase"
          style={{ color: "#f9fafb", letterSpacing: "0.2em" }}
        >
          nicheamb
        </span>

        {/* Tabs */}
        <nav className="flex items-center gap-0">
          {TABS.map((tab) => (
            <button
              type="button"
              key={tab.id}
              data-ocid={`header.${tab.id}.tab`}
              onClick={() => onTabChange(tab.id)}
              className="relative px-4 py-4 text-sm transition-colors duration-200"
              style={{
                color: activeTab === tab.id ? "#3b82f6" : "#4b5563",
                fontWeight: activeTab === tab.id ? 500 : 400,
                borderBottom:
                  activeTab === tab.id
                    ? "2px solid #2563eb"
                    : "2px solid transparent",
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id)
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "#9ca3af";
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id)
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "#4b5563";
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Right: days remaining */}
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs" style={{ color: "#4b5563" }}>
            45 days remaining
          </span>
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
            style={{ backgroundColor: "#1f2937", color: "#9ca3af" }}
          >
            S
          </div>
        </div>
      </div>
    </header>
  );
}
