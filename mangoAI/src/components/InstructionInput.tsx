import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wand2, ArrowLeft, Sparkles } from "lucide-react";

interface InstructionInputProps {
  instruction: string;
  setInstruction: (instruction: string) => void;
  onGenerate: () => void;
  onBack: () => void;
  isGenerating: boolean;
}

const PRESET_PROMPTS = [
  "Summarize in bullet points for executives",
  "Extract only action items with owners and deadlines",
  "Create a detailed meeting recap with key decisions",
  "Highlight important takeaways and next steps",
  "Focus on technical discussions and requirements",
  "Extract financial discussions and budget items"
];

export const InstructionInput = ({ 
  instruction, 
  setInstruction, 
  onGenerate, 
  onBack, 
  isGenerating 
}: InstructionInputProps) => {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-elegant">
          <Wand2 className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Customize AI Instructions
        </CardTitle>
        <CardDescription className="text-base">
          Tell the AI how you want your meeting summary formatted and what to focus on
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="text-sm font-medium mb-3 block flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Quick presets
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESET_PROMPTS.map((preset, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all duration-200 hover:scale-105"
                onClick={() => setInstruction(preset)}
              >
                {preset}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-3 block">
            Custom instructions
          </label>
          <Textarea
            placeholder="Enter your custom instructions here...

Examples:
- Create a summary with key decisions, action items, and follow-up tasks
- Focus on technical requirements and implementation details
- Extract budget discussions and resource allocation decisions
- Highlight customer feedback and market insights
- Summarize strategic planning and future roadmap items"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            className="min-h-[200px] resize-none transition-all duration-300 focus:shadow-card"
            rows={8}
          />
        </div>

        <div className="flex justify-between gap-4">
          <Button 
            onClick={onBack} 
            variant="outline"
            size="lg"
            className="min-w-[120px]"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button 
            onClick={onGenerate} 
            disabled={!instruction.trim() || isGenerating}
            variant="ai"
            size="lg"
            className="min-w-[140px]"
          >
            {isGenerating ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Generate Summary
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};