import { useState } from "react";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
import { TranscriptUpload } from "@/components/TranscriptUpload";
import { InstructionInput } from "@/components/InstructionInput";
import { SummaryEditor } from "@/components/SummaryEditor";
import { Brain, FileText, Edit3, Share } from "lucide-react";

type Step = "upload" | "instruction" | "summary";

const Index = () => {
  const [currentStep, setCurrentStep] = useState<Step>("upload");
  const [transcript, setTranscript] = useState("");
  const [instruction, setInstruction] = useState("");
  const [summary, setSummary] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const generateSummary = async () => {
    setIsGenerating(true);
    try {
  const response = await fetch(`${BACKEND_URL}/api/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, instruction })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to generate summary");
      }
      const data = await response.json();
      setSummary(data.summary || "No summary generated.");
      setCurrentStep("summary");
    } catch (err: any) {
      setSummary("Error: " + (err.message || "Failed to generate summary."));
      setCurrentStep("summary");
    } finally {
      setIsGenerating(false);
    }
  };

  const stepIndicators = [
    { key: "upload", icon: FileText, label: "Upload Transcript", active: currentStep === "upload" },
    { key: "instruction", icon: Brain, label: "AI Instructions", active: currentStep === "instruction" },
    { key: "summary", icon: Edit3, label: "Review & Share", active: currentStep === "summary" },
  ];

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow">
              <Brain className="h-8 w-8" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              AI Meeting Summarizer
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transform your meeting transcripts into professional summaries with AI-powered intelligence
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center gap-4 bg-card/50 backdrop-blur-sm rounded-full px-6 py-3 shadow-card">
            {stepIndicators.map((step, index) => (
              <div key={step.key} className="flex items-center gap-2">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ${
                  step.active 
                    ? "bg-gradient-primary text-primary-foreground shadow-elegant" 
                    : "bg-muted text-muted-foreground"
                }`}>
                  <step.icon className="h-5 w-5" />
                </div>
                <span className={`text-sm font-medium ${
                  step.active ? "text-primary" : "text-muted-foreground"
                }`}>
                  {step.label}
                </span>
                {index < stepIndicators.length - 1 && (
                  <div className="h-px w-8 bg-border ml-4" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex justify-center">
          {currentStep === "upload" && (
            <TranscriptUpload
              transcript={transcript}
              setTranscript={setTranscript}
              onNext={() => setCurrentStep("instruction")}
            />
          )}
          
          {currentStep === "instruction" && (
            <InstructionInput
              instruction={instruction}
              setInstruction={setInstruction}
              onGenerate={generateSummary}
              onBack={() => setCurrentStep("upload")}
              isGenerating={isGenerating}
            />
          )}

          {currentStep === "summary" && (
            <SummaryEditor
              summary={summary}
              setSummary={setSummary}
              onBack={() => setCurrentStep("instruction")}
            />
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-muted-foreground">
          <p className="text-sm">
            Powered by advanced AI technology • Secure & Private • No data stored
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;