import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FileText, Upload } from "lucide-react";

interface TranscriptUploadProps {
  transcript: string;
  setTranscript: (transcript: string) => void;
  onNext: () => void;
}

export const TranscriptUpload = ({ transcript, setTranscript, onNext }: TranscriptUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setError(null);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await handleFileUpload(files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files.length > 0) {
      await handleFileUpload(e.target.files[0]);
    }
  };

  const handleBoxClick = () => {
    if (!uploading && inputRef.current) {
      inputRef.current.value = ""; // reset so same file can be selected again
      inputRef.current.click();
    }
  };

  const handleFileUpload = async (file: File) => {
    const allowedTypes = [
      "text/plain",
      "application/pdf",
      "image/jpeg",
      "image/jpg",
    ];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(txt|pdf|jpe?g)$/i)) {
      setError("Unsupported file type. Please upload a .txt, .pdf, .jpg, or .jpeg file.");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to extract text");
      }
      const data = await response.json();
      setTranscript(data.text || "");
    } catch (err: any) {
      setError(err.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-elegant">
          <FileText className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Upload Meeting Transcript
        </CardTitle>
        <CardDescription className="text-base">
          Paste your meeting notes or upload a text file to get started
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div
          className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-all duration-300 ${
            isDragOver
              ? "border-primary bg-gradient-hero shadow-elegant"
              : "border-border hover:border-primary/50 hover:bg-gradient-hero/50"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleBoxClick}
          style={{ cursor: uploading ? "not-allowed" : "pointer" }}
        >
          <Upload className="mx-auto mb-4 h-8 w-8 text-muted-foreground" />
          <p className="mb-2 text-sm font-medium">Drop or click to select a .txt, .pdf, .jpg, or .jpeg file</p>
          <p className="text-xs text-muted-foreground">or paste your transcript below</p>
          <input
            ref={inputRef}
            type="file"
            accept=".txt,.pdf,.jpg,.jpeg"
            onChange={handleFileChange}
            style={{ display: "none" }}
            disabled={uploading}
          />
          {uploading && <p className="text-xs text-blue-500 mt-2">Extracting text from file...</p>}
          {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        </div>

        <Textarea
          placeholder="Paste your meeting transcript here... 

Example:
Meeting started at 9:00 AM with the product team...
John: We need to focus on the Q4 roadmap...
Sarah: I agree, but we should also consider user feedback...
[Action Item] John to review the user research by Friday..."
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          className="min-h-[300px] resize-none transition-all duration-300 focus:shadow-card"
          rows={12}
        />

        <div className="flex justify-end">
          <Button 
            onClick={onNext} 
            disabled={!transcript.trim()}
            variant="ai"
            size="lg"
            className="min-w-[120px]"
          >
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};