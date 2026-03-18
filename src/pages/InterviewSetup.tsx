import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Play, Mic, Video, MessageSquare, Zap } from "lucide-react";

const roles = ["Software Engineer", "Data Analyst", "HR Manager", "Product Manager", "DevOps Engineer"];
const difficulties = ["Easy", "Medium", "Hard"];
const languages = ["English", "Hindi", "Telugu"];
const modes = [
  { value: "text", label: "Text", icon: MessageSquare, desc: "Type your answers" },
  { value: "voice", label: "Voice", icon: Mic, desc: "Speak your answers" },
  { value: "video", label: "Video", icon: Video, desc: "Full video interview" },
];

export default function InterviewSetup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [role, setRole] = useState("Software Engineer");
  const [difficulty, setDifficulty] = useState("Medium");
  const [language, setLanguage] = useState("English");
  const [mode, setMode] = useState("text");
  const [loading, setLoading] = useState(false);

  const startInterview = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("interviews")
        .insert({
          user_id: user.id,
          role,
          difficulty,
          language,
          mode,
          total_questions: difficulty === "Easy" ? 3 : difficulty === "Medium" ? 5 : 7,
        })
        .select()
        .single();
      if (error) throw error;
      navigate(`/interview/${data.id}`);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen surface-gradient">
      <header className="border-b border-border/50 glass-card">
        <div className="container flex items-center gap-3 py-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">Interview Setup</h1>
            <p className="text-xs text-muted-foreground">Configure your AI interview</p>
          </div>
        </div>
      </header>

      <main className="container py-6 max-w-2xl space-y-6">
        <Card className="glass-card border-border/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-gold" /> Interview Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Target Role</label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="bg-secondary/50 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Difficulty Level</label>
              <div className="grid grid-cols-3 gap-2">
                {difficulties.map((d) => (
                  <Button
                    key={d}
                    variant={difficulty === d ? "default" : "outline"}
                    onClick={() => setDifficulty(d)}
                    className={difficulty === d ? "hero-gradient" : ""}
                  >
                    {d}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Language</label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="bg-secondary/50 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Interview Mode</label>
              <div className="grid grid-cols-3 gap-3">
                {modes.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setMode(m.value)}
                    className={`p-4 rounded-xl border transition-all text-center ${
                      mode === m.value
                        ? "border-primary bg-primary/10 glow-primary"
                        : "border-border/30 bg-secondary/20 hover:border-border/60"
                    }`}
                  >
                    <m.icon className={`w-6 h-6 mx-auto mb-2 ${mode === m.value ? "text-primary" : "text-muted-foreground"}`} />
                    <p className="text-sm font-medium">{m.label}</p>
                    <p className="text-2xs text-muted-foreground">{m.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={startInterview}
          disabled={loading}
          className="w-full h-14 text-lg hero-gradient glow-primary"
        >
          <Play className="w-5 h-5 mr-2" />
          {loading ? "Starting..." : "Start Interview"}
        </Button>
      </main>
    </div>
  );
}
