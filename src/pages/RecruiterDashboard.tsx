import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  LogOut, Users, BarChart3, Star, ChevronRight,
  Search, Briefcase, TrendingUp, Loader2
} from "lucide-react";

export default function RecruiterDashboard() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [minScore, setMinScore] = useState("");

  const { data: candidates, isLoading } = useQuery({
    queryKey: ["all-candidates"],
    queryFn: async () => {
      const { data } = await supabase
        .from("interviews")
        .select("*, profiles!interviews_user_id_fkey(full_name, email, resume_url)")
        .eq("status", "completed")
        .order("overall_score", { ascending: false });
      return data ?? [];
    },
  });

  const { data: shortlisted } = useQuery({
    queryKey: ["shortlisted"],
    queryFn: async () => {
      const { data } = await supabase.from("shortlisted").select("candidate_id, interview_id");
      return data ?? [];
    },
  });

  const isShortlisted = (candidateId: string, interviewId: string) =>
    shortlisted?.some((s) => s.candidate_id === candidateId && s.interview_id === interviewId);

  const toggleShortlist = async (candidateId: string, interviewId: string) => {
    const existing = shortlisted?.find(
      (s) => s.candidate_id === candidateId && s.interview_id === interviewId
    );
    if (existing) {
      await supabase.from("shortlisted").delete().match({ candidate_id: candidateId, interview_id: interviewId });
    } else {
      await supabase.from("shortlisted").insert({ recruiter_id: (await supabase.auth.getUser()).data.user!.id, candidate_id: candidateId, interview_id: interviewId });
    }
    queryClient.invalidateQueries({ queryKey: ["shortlisted"] });
    toast({ title: existing ? "Removed from shortlist" : "Added to shortlist" });
  };

  const filtered = candidates?.filter((c) => {
    const name = (c as any).profiles?.full_name?.toLowerCase() ?? "";
    const matchSearch = name.includes(search.toLowerCase()) || c.role.toLowerCase().includes(search.toLowerCase());
    const matchScore = minScore ? (c.overall_score ?? 0) >= Number(minScore) : true;
    return matchSearch && matchScore;
  });

  return (
    <div className="min-h-screen surface-gradient">
      <header className="border-b border-border/50 glass-card">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl hero-gradient flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gradient">Recruiter Dashboard</h1>
              <p className="text-xs text-muted-foreground">InterviewAI Pro</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="glass-card border-border/30">
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xl font-bold">{candidates?.length ?? 0}</p>
                <p className="text-xs text-muted-foreground">Total Candidates</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border-border/30">
            <CardContent className="p-4 flex items-center gap-3">
              <Star className="w-5 h-5 text-gold" />
              <div>
                <p className="text-xl font-bold">{shortlisted?.length ?? 0}</p>
                <p className="text-xs text-muted-foreground">Shortlisted</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border-border/30">
            <CardContent className="p-4 flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-success" />
              <div>
                <p className="text-xl font-bold">
                  {candidates?.length ? Math.round(candidates.reduce((s, c) => s + (c.overall_score ?? 0), 0) / candidates.length) : 0}%
                </p>
                <p className="text-xs text-muted-foreground">Avg Score</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search candidates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-secondary/50 border-border/50"
            />
          </div>
          <Input
            type="number"
            placeholder="Min score"
            value={minScore}
            onChange={(e) => setMinScore(e.target.value)}
            className="w-28 bg-secondary/50 border-border/50"
          />
        </div>

        {/* Candidates list */}
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : !filtered?.length ? (
          <p className="text-center text-muted-foreground py-12">No candidates found.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((c, rank) => (
              <Card key={c.id} className="glass-card border-border/30 hover:border-primary/20 transition-all">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-muted-foreground w-8">#{rank + 1}</span>
                    <div>
                      <p className="font-medium">{(c as any).profiles?.full_name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{c.role} • {c.difficulty} • {(c as any).profiles?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-lg font-bold text-success">{c.overall_score ?? 0}%</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleShortlist(c.user_id, c.id)}
                    >
                      <Star className={`w-5 h-5 ${isShortlisted(c.user_id, c.id) ? "fill-gold text-gold" : "text-muted-foreground"}`} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/reports/${c.id}`)}>
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
