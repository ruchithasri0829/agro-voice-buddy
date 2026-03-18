import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Briefcase, Play, FileText, BarChart3, Upload, LogOut, 
  TrendingUp, Clock, Award, ChevronRight
} from "lucide-react";

export default function CandidateDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const { data: interviews } = useQuery({
    queryKey: ["interviews", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("interviews")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  const completedInterviews = interviews?.filter((i) => i.status === "completed") ?? [];
  const avgScore = completedInterviews.length
    ? Math.round(completedInterviews.reduce((s, i) => s + (i.overall_score ?? 0), 0) / completedInterviews.length)
    : 0;

  const stats = [
    { label: "Total Interviews", value: interviews?.length ?? 0, icon: Briefcase, color: "text-primary" },
    { label: "Avg. Score", value: `${avgScore}%`, icon: TrendingUp, color: "text-success" },
    { label: "Completed", value: completedInterviews.length, icon: Award, color: "text-gold" },
    { label: "Last Session", value: interviews?.[0] ? new Date(interviews[0].created_at).toLocaleDateString() : "N/A", icon: Clock, color: "text-accent" },
  ];

  return (
    <div className="min-h-screen surface-gradient">
      {/* Header */}
      <header className="border-b border-border/50 glass-card">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl hero-gradient flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gradient">InterviewAI Pro</h1>
              <p className="text-xs text-muted-foreground">Welcome, {profile?.full_name || "Candidate"}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => (
            <Card key={s.label} className="glass-card border-border/30">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary">
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            className="glass-card border-border/30 cursor-pointer hover:border-primary/30 transition-all group"
            onClick={() => navigate("/interview/setup")}
          >
            <CardContent className="p-6 text-center space-y-3">
              <div className="mx-auto w-14 h-14 rounded-2xl hero-gradient flex items-center justify-center glow-primary group-hover:animate-pulse-glow">
                <Play className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="font-semibold">Start Interview</h3>
              <p className="text-sm text-muted-foreground">AI-powered mock interview</p>
            </CardContent>
          </Card>

          <Card
            className="glass-card border-border/30 cursor-pointer hover:border-accent/30 transition-all"
            onClick={() => navigate("/resume")}
          >
            <CardContent className="p-6 text-center space-y-3">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center">
                <Upload className="w-7 h-7 text-accent" />
              </div>
              <h3 className="font-semibold">Upload Resume</h3>
              <p className="text-sm text-muted-foreground">{profile?.resume_url ? "Resume uploaded ✓" : "PDF format supported"}</p>
            </CardContent>
          </Card>

          <Card
            className="glass-card border-border/30 cursor-pointer hover:border-gold/30 transition-all"
            onClick={() => navigate("/reports")}
          >
            <CardContent className="p-6 text-center space-y-3">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-gold/20 flex items-center justify-center">
                <BarChart3 className="w-7 h-7 text-gold" />
              </div>
              <h3 className="font-semibold">View Reports</h3>
              <p className="text-sm text-muted-foreground">{completedInterviews.length} reports available</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Interviews */}
        <Card className="glass-card border-border/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Recent Interviews
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(!interviews || interviews.length === 0) ? (
              <p className="text-muted-foreground text-center py-8">No interviews yet. Start your first one!</p>
            ) : (
              interviews.slice(0, 5).map((interview) => (
                <div
                  key={interview.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-all"
                  onClick={() => navigate(`/reports/${interview.id}`)}
                >
                  <div>
                    <p className="font-medium">{interview.role}</p>
                    <p className="text-xs text-muted-foreground">
                      {interview.difficulty} • {new Date(interview.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {interview.status === "completed" ? (
                      <span className="text-sm font-semibold text-success">{interview.overall_score}%</span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-warning/20 text-warning">In Progress</span>
                    )}
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
