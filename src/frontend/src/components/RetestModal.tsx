import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { useSubjects } from "../context/SubjectsContext";
import { applyQuizUpdate } from "../utils/confidenceEngine";

interface Question {
  text: string;
  options: string[];
  correctIndex: number;
}

// ── Static question bank keyed by topic name keywords ────────────────────────
const QUESTION_BANK: Record<string, Question[]> = {
  quadratic: [
    {
      text: "The discriminant b²−4ac determines:",
      options: [
        "Nature of roots",
        "Sum of roots",
        "Product of roots",
        "Degree of equation",
      ],
      correctIndex: 0,
    },
    {
      text: "For ax²+bx+c=0, sum of roots equals:",
      options: ["-b/a", "b/a", "c/a", "-c/a"],
      correctIndex: 0,
    },
    {
      text: "A quadratic equation has at most how many roots?",
      options: ["2", "1", "3", "Infinite"],
      correctIndex: 0,
    },
  ],
  trigonometry: [
    {
      text: "sin²θ + cos²θ equals:",
      options: ["1", "0", "2", "tanθ"],
      correctIndex: 0,
    },
    {
      text: "sin(90° − θ) equals:",
      options: ["cosθ", "sinθ", "tanθ", "−sinθ"],
      correctIndex: 0,
    },
    {
      text: "The range of sinθ is:",
      options: ["[−1, 1]", "[0, 1]", "(−∞, ∞)", "[0, ∞)"],
      correctIndex: 0,
    },
  ],
  algebra: [
    {
      text: "(a+b)² expands to:",
      options: ["a²+2ab+b²", "a²+b²", "a²−2ab+b²", "2a+2b"],
      correctIndex: 0,
    },
    {
      text: "The identity element for multiplication is:",
      options: ["1", "0", "-1", "∞"],
      correctIndex: 0,
    },
    {
      text: "If 2x+4=10, then x equals:",
      options: ["3", "4", "2", "5"],
      correctIndex: 0,
    },
  ],
  statistics: [
    {
      text: "The sum of all probabilities in a sample space equals:",
      options: ["1", "0", "100", "Depends on events"],
      correctIndex: 0,
    },
    {
      text: "Mean of [2, 4, 6, 8] is:",
      options: ["5", "4", "6", "4.5"],
      correctIndex: 0,
    },
    {
      text: "Standard deviation measures:",
      options: [
        "Spread of data",
        "Average value",
        "Middle value",
        "Most frequent value",
      ],
      correctIndex: 0,
    },
  ],
  calculus: [
    {
      text: "The derivative of x² is:",
      options: ["2x", "x", "x²", "2"],
      correctIndex: 0,
    },
    {
      text: "Integration is the inverse of:",
      options: [
        "Differentiation",
        "Multiplication",
        "Addition",
        "Exponentiation",
      ],
      correctIndex: 0,
    },
    {
      text: "The limit of (sin x)/x as x → 0 is:",
      options: ["1", "0", "∞", "x"],
      correctIndex: 0,
    },
  ],
  newton: [
    {
      text: "Newton's first law is also called:",
      options: [
        "Law of Inertia",
        "Law of Action",
        "Law of Gravity",
        "Law of Motion",
      ],
      correctIndex: 0,
    },
    {
      text: "F = ma represents Newton's:",
      options: ["Second Law", "First Law", "Third Law", "Fourth Law"],
      correctIndex: 0,
    },
    {
      text: "For every action there is an equal and opposite reaction — Newton's:",
      options: ["Third Law", "First Law", "Second Law", "Law of Gravity"],
      correctIndex: 0,
    },
  ],
  thermodynamics: [
    {
      text: "The first law of thermodynamics states conservation of:",
      options: ["Energy", "Mass", "Momentum", "Charge"],
      correctIndex: 0,
    },
    {
      text: "Entropy increases in a(n):",
      options: [
        "Irreversible process",
        "Reversible process",
        "Isothermal process",
        "Adiabatic process",
      ],
      correctIndex: 0,
    },
    {
      text: "Absolute zero is approximately:",
      options: ["-273°C", "0°C", "-100°C", "-373°C"],
      correctIndex: 0,
    },
  ],
  organic: [
    {
      text: "Organic chemistry primarily studies compounds of:",
      options: ["Carbon", "Nitrogen", "Oxygen", "Hydrogen"],
      correctIndex: 0,
    },
    {
      text: "A functional group −OH is characteristic of:",
      options: ["Alcohols", "Aldehydes", "Ketones", "Acids"],
      correctIndex: 0,
    },
    {
      text: "Benzene has how many carbon atoms?",
      options: ["6", "4", "8", "5"],
      correctIndex: 0,
    },
  ],
  bonding: [
    {
      text: "Covalent bonds form by:",
      options: [
        "Sharing electrons",
        "Transferring electrons",
        "Gaining protons",
        "Losing neutrons",
      ],
      correctIndex: 0,
    },
    {
      text: "Ionic bonds form between:",
      options: [
        "Metal and non-metal",
        "Two non-metals",
        "Two metals",
        "Metal and metalloid",
      ],
      correctIndex: 0,
    },
    {
      text: "Hydrogen bonding occurs when H is bonded to:",
      options: ["N, O, or F", "C, S, or P", "Na, K, or Li", "Cl, Br, or I"],
      correctIndex: 0,
    },
  ],
  essay: [
    {
      text: "The thesis statement typically appears:",
      options: [
        "End of introduction",
        "Middle of essay",
        "Start of conclusion",
        "First sentence",
      ],
      correctIndex: 0,
    },
    {
      text: "A topic sentence introduces:",
      options: [
        "Main idea of a paragraph",
        "The entire essay",
        "A supporting example",
        "The conclusion",
      ],
      correctIndex: 0,
    },
    {
      text: "Cohesion in writing refers to:",
      options: [
        "Logical flow between ideas",
        "Word count",
        "Paragraph length",
        "Vocabulary range",
      ],
      correctIndex: 0,
    },
  ],
};

const GENERIC_QUESTIONS: Question[] = [
  {
    text: "Can you recall the main concept without notes?",
    options: ["Yes, clearly", "Mostly yes", "With some effort", "No"],
    correctIndex: 0,
  },
  {
    text: "Rate your confidence applying this topic under exam conditions:",
    options: [
      "Very confident",
      "Somewhat confident",
      "Unsure",
      "Not confident",
    ],
    correctIndex: 0,
  },
  {
    text: "Which best describes your mastery of this topic?",
    options: [
      "I can explain it clearly",
      "I can apply it with effort",
      "I vaguely remember it",
      "I need to review it",
    ],
    correctIndex: 0,
  },
];

function getQuestions(topicName: string): Question[] {
  const lower = topicName.toLowerCase();
  for (const [key, qs] of Object.entries(QUESTION_BANK)) {
    if (lower.includes(key)) return qs;
  }
  return GENERIC_QUESTIONS;
}

// ── Component ────────────────────────────────────────────────────────────────
interface RetestModalProps {
  open: boolean;
  onClose: () => void;
  subjectId: number;
  topicId: number;
  topicName: string;
  currentConfidence: number;
}

export default function RetestModal({
  open,
  onClose,
  subjectId,
  topicId,
  topicName,
  currentConfidence,
}: RetestModalProps) {
  const { updateTopicConfidence } = useSubjects();
  const questions = getQuestions(topicName);
  const [step, setStep] = useState<"quiz" | "result">("quiz");
  const [currentQ, setCurrentQ] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [newConfidence, setNewConfidence] = useState(currentConfidence);

  const handleAnswer = (optionIndex: number) => {
    const isCorrect = optionIndex === questions[currentQ].correctIndex;
    const updatedCorrect = isCorrect ? correctCount + 1 : correctCount;

    if (currentQ + 1 < questions.length) {
      setCorrectCount(updatedCorrect);
      setCurrentQ((q) => q + 1);
    } else {
      // All questions done
      const accuracy = (updatedCorrect / questions.length) * 100;
      const updated = applyQuizUpdate(currentConfidence, accuracy);
      setNewConfidence(Math.round(updated));
      updateTopicConfidence(subjectId, topicId, Math.round(updated));
      setCorrectCount(updatedCorrect);
      setStep("result");
    }
  };

  const handleClose = () => {
    setStep("quiz");
    setCurrentQ(0);
    setCorrectCount(0);
    setNewConfidence(currentConfidence);
    onClose();
  };

  const accuracyPct =
    step === "result" ? Math.round((correctCount / questions.length) * 100) : 0;
  const delta = Math.round(newConfidence - currentConfidence);
  const trendLabel =
    delta > 1 ? "improved" : delta < -1 ? "dropped" : "unchanged";
  const trendColor = delta > 1 ? "#22c55e" : delta < -1 ? "#ef4444" : "#f59e0b";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent
        data-ocid="retest.dialog"
        style={{
          background: "#0f1720",
          border: "1px solid #1f2937",
          color: "#f9fafb",
          maxWidth: 480,
        }}
      >
        <DialogHeader>
          <DialogTitle
            style={{ color: "#f9fafb", fontSize: "1rem", fontWeight: 600 }}
          >
            {topicName}
          </DialogTitle>
          <p className="text-sm" style={{ color: "#6b7280" }}>
            Re-test this topic to validate your understanding.
          </p>
        </DialogHeader>

        {step === "quiz" && (
          <div className="space-y-4 mt-2">
            {/* Progress */}
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: "#4b5563" }}>
                Question {currentQ + 1} of {questions.length}
              </span>
              <div className="flex gap-1">
                {questions.map((q, i) => (
                  <div
                    key={q.text}
                    className="h-0.5 w-8 rounded-full"
                    style={{
                      background: i <= currentQ ? "#2563eb" : "#1f2937",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Question */}
            <div
              className="p-4 rounded-lg"
              style={{ background: "#1f2937", border: "1px solid #374151" }}
            >
              <p className="text-sm font-medium" style={{ color: "#f9fafb" }}>
                {questions[currentQ].text}
              </p>
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 gap-2">
              {questions[currentQ].options.map((opt, i) => (
                <button
                  key={opt}
                  type="button"
                  data-ocid={`retest.option.${i + 1}`}
                  onClick={() => handleAnswer(i)}
                  className="text-left px-4 py-3 rounded text-sm transition-all"
                  style={{
                    background: "#111827",
                    border: "1px solid #1f2937",
                    color: "#d1d5db",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "#2563eb";
                    (e.currentTarget as HTMLButtonElement).style.color =
                      "#f9fafb";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "#1f2937";
                    (e.currentTarget as HTMLButtonElement).style.color =
                      "#d1d5db";
                  }}
                >
                  <span style={{ color: "#2563eb", marginRight: 8 }}>
                    {String.fromCharCode(65 + i)}.
                  </span>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "result" && (
          <div className="space-y-4 mt-2" data-ocid="retest.success_state">
            {/* Score */}
            <div
              className="p-4 rounded-lg text-center"
              style={{ background: "#1f2937", border: "1px solid #374151" }}
            >
              <div
                className="text-3xl font-semibold tabular-nums"
                style={{ color: "#f9fafb" }}
              >
                {accuracyPct}%
              </div>
              <div className="text-xs mt-1" style={{ color: "#6b7280" }}>
                {correctCount}/{questions.length} correct
              </div>
            </div>

            {/* Confidence delta */}
            <div
              className="flex items-center justify-between p-3 rounded-lg"
              style={{ background: "#111827", border: "1px solid #1f2937" }}
            >
              <div>
                <div className="text-xs" style={{ color: "#6b7280" }}>
                  New confidence
                </div>
                <div
                  className="text-lg font-semibold"
                  style={{ color: "#f9fafb" }}
                >
                  {newConfidence}%
                </div>
              </div>
              <div className="text-right">
                <div
                  className="text-sm font-medium"
                  style={{ color: trendColor }}
                >
                  {delta > 0 ? `+${delta}` : delta} pts
                </div>
                <div className="text-xs" style={{ color: trendColor }}>
                  {trendLabel}
                </div>
              </div>
            </div>

            <button
              type="button"
              data-ocid="retest.close_button"
              onClick={handleClose}
              className="w-full py-2.5 rounded text-sm font-medium transition-colors"
              style={{ background: "#2563eb", color: "#fff" }}
            >
              Done
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
