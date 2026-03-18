import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, Download, Share2, MessageSquare, Brain, 
  Heart, Target, TrendingUp, Loader2, CheckCircle, XCircle
} from "lucide-react";

function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--secondary))" strokeWidth="6" />
        <circle
          cx="50" cy="50" r="45" fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" className="score-ring transition-all duration-1000"
        />
        <text x="50" y="50" textAnchor="middle" dy="0.35em" className="fill-foreground text-xl font-bold rotate-90 origin-center">{score}%</text>
      </svg>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export default function InterviewReport() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: interview, isLoading } = useQuery({
    queryKey: ["report", id],
    queryFn: async () => {
      const { data } = await supabase.from("interviews").select("*").eq("id", id!).single();
      return data;
    },
    enabled: !!id,
  });

  const { data: questions } = useQuery({
    queryKey: ["report-questions", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("interview_questions")
        .select("*")
        .eq("interview_id", id!)
        .order("question_number");
      return data ?? [];
    },
    enabled: !!id,
  });

  if (isLoading) return <div className="min-h-screen surface-gradient flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!interview) return <div className="min-h-screen surface-gradient flex items-center justify-center text-muted-foreground">Interview not found.</div>;

  const scores = [
    { label: "Communication", score: interview.communication_score ?? 0, color: "hsl(252, 85%, 60%)" },
    { label: "Technical", score: interview.technical_score ?? 0, color: "hsl(185, 90%, 48%)" },
    { label: "Confidence", score: interview.confidence_score ?? 0, color: "hsl(42, 95%, 55%)" },
    { label: "Resume Match", score: interview.resume_match_score ?? 0, color: "hsl(152, 70%, 45%)" },
  ];

  return (
    <div className="min-h-screen surface-gradient">
      <header className="border-b border-border/50 glass-card">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold">Interview Report</h1>
              <p className="text-xs text-muted-foreground">{interview.role} • {interview.difficulty}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm"><Share2 className="w-4 h-4 mr-1" /> Share</Button>
            <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" /> PDF</Button>
          </div>
        </div>
      </header>

      <main className="container py-6 max-w-4xl space-y-6">
        {/* Overall Score */}
        <Card className="glass-card border-border/30 text-center p-8">
          <div className="mx-auto w-32 h-32 rounded-full hero-gradient flex items-center justify-center glow-primary mb-4">
            <span className="text-4xl font-black text-primary-foreground">{interview.overall_score ?? 0}%</span>
          </div>
          <h2 className="text-xl font-bold">Overall Performance</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {(interview.overall_score ?? 0) >= 80 ? "Excellent performance!" : (interview.overall_score ?? 0) >= 60 ? "Good performance with room for improvement." : "Keep practicing to improve your scores."}
          </p>
        </Card>

        {/* Score breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {scores.map((s) => (
            <Card key={s.label} className="glass-card border-border/30">
              <CardContent className="p-4 flex justify-center">
                <ScoreRing score={s.score} label={s.label} color={s.color} />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="glass-card border-border/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4 text-success" /> Strengths</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {interview.strengths?.map((s, i) => (
                <p key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-success shrink-0 mt-0.5" /> {s}
                </p>
              )) || <p className="text-sm text-muted-foreground">Analysis pending...</p>}
            </CardContent>
          </Card>
          <Card className="glass-card border-border/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><XCircle className="w-4 h-4 text-destructive" /> Areas to Improve</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {interview.weaknesses?.map((w, i) => (
                <p key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <Target className="w-4 h-4 text-warning shrink-0 mt-0.5" /> {w}
                </p>
              )) || <p className="text-sm text-muted-foreground">Analysis pending...</p>}
            </CardContent>
          </Card>
        </div>

        {/* AI Feedback */}
        {interview.ai_feedback && (
          <Card className="glass-card border-border/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><Brain className="w-4 h-4 text-primary" /> AI Improvement Suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{interview.ai_feedback}</p>
            </CardContent>
          </Card>
        )}

        {/* Question-by-question review */}
        <Card className="glass-card border-border/30">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2"><MessageSquare className="w-4 h-4 text-accent" /> Question Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {questions?.map((q) => (
              <div key={q.id} className="p-4 rounded-lg bg-secondary/20 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-primary">Q{q.question_number}</p>
                  {q.score != null && <span className="text-xs font-semibold text-success">{q.score}%</span>}
                </div>
                <p className="text-sm font-medium">{q.question_text}</p>
                {q.answer_text && <p className="text-sm text-muted-foreground">{q.answer_text}</p>}
                {q.ai_feedback && <p className="text-xs text-accent mt-1">💡 {q.ai_feedback}</p>}
                <div className="flex gap-4 text-xs text-muted-foreground">
                  {q.time_taken_seconds != null && <span>⏱ {q.time_taken_seconds}s</span>}
                  {q.filler_words_count != null && q.filler_words_count > 0 && <span>🔤 {q.filler_words_count} filler words</span>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
