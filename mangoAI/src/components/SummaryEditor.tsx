import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Edit3, Mail, Send, ArrowLeft, Copy, Check, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SummaryEditorProps {
  summary: string;
  setSummary: (summary: string) => void;
  onBack: () => void;
}

export const SummaryEditor = ({ summary, setSummary, onBack }: SummaryEditorProps) => {
  const [emailAddresses, setEmailAddresses] = useState<string[]>([]);
  const [currentEmail, setCurrentEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const addEmail = () => {
    if (currentEmail && !emailAddresses.includes(currentEmail)) {
      setEmailAddresses([...emailAddresses, currentEmail]);
      setCurrentEmail("");
    }
  };

  const removeEmail = (email: string) => {
    setEmailAddresses(emailAddresses.filter(e => e !== email));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addEmail();
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "Summary has been copied to your clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again or copy manually",
        variant: "destructive",
      });
    }
  };

  const sendEmails = async () => {
    if (emailAddresses.length === 0) {
      toast({
        title: "No recipients",
        description: "Please add at least one email address",
        variant: "destructive",
      });
      return;
    }
    setIsSending(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: emailAddresses,
          subject: "Your AI Meeting Summary",
          summary,
        })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to send email");
      }
      toast({
        title: "Emails sent successfully!",
        description: `Summary shared with ${emailAddresses.length} recipient${emailAddresses.length > 1 ? 's' : ''}`,
      });
      setEmailAddresses([]);
    } catch (err: any) {
      toast({
        title: "Failed to send email",
        description: err.message || "An error occurred while sending the summary.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-elegant">
          <Edit3 className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Review & Share Summary
        </CardTitle>
        <CardDescription className="text-base">
          Edit your AI-generated summary and share it with your team
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="text-sm font-medium mb-3 block flex items-center gap-2">
            <Edit3 className="h-4 w-4 text-primary" />
            Generated Summary (Markdown Preview)
          </label>
          <div className="prose prose-primary max-w-none bg-muted/40 rounded-lg p-4 mb-4">
            {/* Gemini always returns Markdown-formatted output. */}
            <ReactMarkdown>{summary}</ReactMarkdown>
          </div>
          <Textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="min-h-[200px] resize-none transition-all duration-300 focus:shadow-card"
            rows={8}
            placeholder="Your AI-generated summary will appear here..."
          />
          <div className="flex justify-end mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className="gap-2"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied!" : "Copy to Clipboard"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            <strong>Note:</strong> AI Summarizer always returns summaries in Markdown format. The preview above shows the formatted result.
          </p>
        </div>

        <div className="border-t pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Share via Email</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Add recipient email addresses
              </label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter email address..."
                  value={currentEmail}
                  onChange={(e) => setCurrentEmail(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="flex-1"
                />
                <Button 
                  onClick={addEmail}
                  variant="outline"
                  size="icon"
                  disabled={!currentEmail}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {emailAddresses.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Recipients ({emailAddresses.length})
                </label>
                <div className="flex flex-wrap gap-2">
                  {emailAddresses.map((email, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="gap-2 pr-1"
                    >
                      {email}
                      <button
                        onClick={() => removeEmail(email)}
                        className="hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between gap-4 pt-4 border-t">
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
            onClick={sendEmails} 
            disabled={emailAddresses.length === 0 || isSending}
            variant="ai"
            size="lg"
            className="min-w-[140px]"
          >
            {isSending ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Summary
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};