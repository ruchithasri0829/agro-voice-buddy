import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, Send, Mic, MicOff, Timer, AlertTriangle, 
  ChevronRight, Loader2 
} from "lucide-react";

const FILLER_WORDS = ["um", "uh", "like", "you know", "basically", "actually", "literally", "so", "well"];

function countFillerWords(text: string): number {
  const lower = text.toLowerCase();
  return FILLER_WORDS.reduce((count, word) => {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    return count + (lower.match(regex)?.length ?? 0);
  }, 0);
}

export default function InterviewSession() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [answer, setAnswer] = useState("");
  const [timeLeft, setTimeLeft] = useState(120);
  const [isListening, setIsListening] = useState(false);
  const [tabWarning, setTabWarning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [generatingQuestion, setGeneratingQuestion] = useState(false);

  const { data: interview } = useQuery({
    queryKey: ["interview", id],
    queryFn: async () => {
      const { data } = await supabase.from("interviews").select("*").eq("id", id!).single();
      return data;
    },
    enabled: !!id,
  });

  const { data: questions } = useQuery({
    queryKey: ["questions", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("interview_questions")
        .select("*")
        .eq("interview_id", id!)
        .order("question_number", { ascending: true });
      return data ?? [];
    },
    enabled: !!id,
  });

  const currentQ = questions?.find((q) => !q.answer_text);
  const answeredCount = questions?.filter((q) => q.answer_text).length ?? 0;
  const progress = interview ? (answeredCount / interview.total_questions) * 100 : 0;

  // Generate first question on mount
  useEffect(() => {
    if (interview && (!questions || questions.length === 0)) {
      generateQuestion();
    }
  }, [interview, questions]);

  // Timer
  useEffect(() => {
    if (!currentQ) return;
    setTimeLeft(120);
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          handleSubmitAnswer();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [currentQ?.id]);

  // Tab switch detection
  useEffect(() => {
    const handler = () => {
      if (document.hidden) {
        setTabWarning(true);
        toast({ title: "⚠️ Tab Switch Detected", description: "Please stay on the interview tab.", variant: "destructive" });
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  const generateQuestion = async () => {
    if (!interview || !user) return;
    setGeneratingQuestion(true);
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("resume_parsed")
        .eq("user_id", user.id)
        .single();

      const questionNumber = (questions?.length ?? 0) + 1;
      const res = await supabase.functions.invoke("generate-question", {
        body: {
          role: interview.role,
          difficulty: interview.difficulty,
          language: interview.language,
          questionNumber,
          totalQuestions: interview.total_questions,
          resumeData: profile?.resume_parsed,
          previousQuestions: questions?.map((q) => q.question_text) ?? [],
        },
      });

      const questionText = res.data?.question || `Tell me about your experience with ${interview.role} responsibilities.`;

      await supabase.from("interview_questions").insert({
        interview_id: interview.id,
        question_number: questionNumber,
        question_text: questionText,
      });

      queryClient.invalidateQueries({ queryKey: ["questions", id] });
    } catch (err) {
      // Fallback question
      const fallbacks = [
        "Tell me about yourself and why you're interested in this role.",
        "Describe a challenging project you've worked on recently.",
        "How do you approach problem-solving in your work?",
        "What is your greatest professional achievement?",
        "Where do you see yourself in 5 years?",
        "How do you handle working under pressure?",
        "Describe a time you had to learn a new technology quickly.",
      ];
      const qNum = (questions?.length ?? 0) + 1;
      await supabase.from("interview_questions").insert({
        interview_id: interview!.id,
        question_number: qNum,
        question_text: fallbacks[(qNum - 1) % fallbacks.length],
      });
      queryClient.invalidateQueries({ queryKey: ["questions", id] });
    } finally {
      setGeneratingQuestion(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!currentQ || !answer.trim()) return;
    setSubmitting(true);
    try {
      const fillerCount = countFillerWords(answer);
      const timeTaken = 120 - timeLeft;

      await supabase
        .from("interview_questions")
        .update({
          answer_text: answer,
          time_taken_seconds: timeTaken,
          filler_words_count: fillerCount,
        })
        .eq("id", currentQ.id);

      setAnswer("");
      
      if (answeredCount + 1 >= (interview?.total_questions ?? 5)) {
        // End interview
        await supabase
          .from("interviews")
          .update({ status: "completed", completed_at: new Date().toISOString() })
          .eq("id", id!);

        // Trigger AI analysis
        try {
          await supabase.functions.invoke("analyze-interview", { body: { interviewId: id } });
        } catch {}

        navigate(`/reports/${id}`);
      } else {
        queryClient.invalidateQueries({ queryKey: ["questions", id] });
        generateQuestion();
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Voice input
  const toggleVoice = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: "Not supported", description: "Speech recognition is not available in this browser.", variant: "destructive" });
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = interview?.language === "Hindi" ? "hi-IN" : interview?.language === "Telugu" ? "te-IN" : "en-US";

    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setAnswer(transcript);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
    setIsListening(true);
  }, [isListening, interview?.language]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  if (!interview) return <div className="min-h-screen surface-gradient flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen surface-gradient flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 glass-card">
        <div className="container flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-sm font-bold">{interview.role} Interview</h1>
              <p className="text-xs text-muted-foreground">{interview.difficulty} • Q{answeredCount + 1}/{interview.total_questions}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {tabWarning && (
              <div className="flex items-center gap-1 text-destructive text-xs">
                <AlertTriangle className="w-4 h-4" /> Tab switch detected
              </div>
            )}
            <div className={`flex items-center gap-1 text-sm font-mono ${timeLeft < 30 ? "text-destructive" : "text-muted-foreground"}`}>
              <Timer className="w-4 h-4" /> {formatTime(timeLeft)}
            </div>
          </div>
        </div>
        <div className="px-4 pb-2">
          <Progress value={progress} className="h-1.5" />
        </div>
      </header>

      {/* Question */}
      <main className="flex-1 container py-6 max-w-3xl flex flex-col gap-6">
        <Card className="glass-card border-border/30">
          <CardContent className="p-6">
            <p className="text-xs text-primary font-medium mb-2">Question {answeredCount + 1}</p>
            {generatingQuestion ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Generating question...
              </div>
            ) : (
              <p className="text-lg font-medium leading-relaxed">{currentQ?.question_text}</p>
            )}
          </CardContent>
        </Card>

        {/* Answer area */}
        <div className="flex-1 flex flex-col gap-3">
          <textarea
            ref={textareaRef}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer here..."
            className="flex-1 min-h-[180px] w-full rounded-xl p-4 bg-secondary/30 border border-border/30 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 font-sans"
          />

          <div className="flex items-center gap-3">
            {(interview.mode === "voice" || interview.mode === "video") && (
              <Button
                variant={isListening ? "destructive" : "outline"}
                size="icon"
                onClick={toggleVoice}
                className={isListening ? "mic-pulse" : ""}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>
            )}

            <Button
              onClick={handleSubmitAnswer}
              disabled={!answer.trim() || submitting}
              className="flex-1 hero-gradient glow-primary"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : answeredCount + 1 >= interview.total_questions ? (
                <>End Interview <Send className="w-4 h-4 ml-2" /></>
              ) : (
                <>Submit & Next <ChevronRight className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
