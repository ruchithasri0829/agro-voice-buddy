import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, FileText, ChevronRight, Loader2 
} from "lucide-react";

export default function ReportsList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { data: interviews, isLoading } = useQuery({
    queryKey: ["all-interviews", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("interviews")
        .select("*")
        .eq("user_id", user!.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  const filtered = interviews?.filter((i) =>
    i.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen surface-gradient">
      <header className="border-b border-border/50 glass-card">
        <div className="container flex items-center gap-3 py-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">Interview Reports</h1>
            <p className="text-xs text-muted-foreground">{interviews?.length ?? 0} completed interviews</p>
          </div>
        </div>
      </header>

      <main className="container py-6 max-w-2xl space-y-4">
        <Input
          placeholder="Search by role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-secondary/50 border-border/50"
        />

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : !filtered?.length ? (
          <p className="text-center text-muted-foreground py-12">No completed interviews found.</p>
        ) : (
          filtered.map((interview) => (
            <Card
              key={interview.id}
              className="glass-card border-border/30 cursor-pointer hover:border-primary/30 transition-all"
              onClick={() => navigate(`/reports/${interview.id}`)}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{interview.role}</p>
                    <p className="text-xs text-muted-foreground">
                      {interview.difficulty} • {new Date(interview.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-lg font-bold text-success">{interview.overall_score ?? 0}%</p>
                    <p className="text-2xs text-muted-foreground">Score</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </main>
    </div>
  );
}
