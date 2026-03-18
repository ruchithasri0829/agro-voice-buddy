import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, FileText, CheckCircle, Loader2 } from "lucide-react";

export default function ResumeUpload() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.type !== "application/pdf") {
      toast({ title: "Invalid file", description: "Please upload a PDF file.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum 5MB allowed.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const path = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from("resumes").upload(path, file);
      if (uploadError) throw uploadError;

      await supabase
        .from("profiles")
        .update({ resume_url: path })
        .eq("user_id", user.id);

      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      toast({ title: "Resume uploaded!", description: "Your resume has been saved." });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen surface-gradient">
      <header className="border-b border-border/50 glass-card">
        <div className="container flex items-center gap-3 py-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold">Upload Resume</h1>
        </div>
      </header>

      <main className="container py-6 max-w-lg space-y-6">
        <Card className="glass-card border-border/30">
          <CardContent className="p-8 text-center space-y-6">
            {profile?.resume_url ? (
              <div className="space-y-3">
                <CheckCircle className="w-16 h-16 text-success mx-auto" />
                <h3 className="font-semibold text-lg">Resume Uploaded</h3>
                <p className="text-sm text-muted-foreground">Your resume is ready for AI-powered interviews.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <FileText className="w-16 h-16 text-muted-foreground mx-auto" />
                <h3 className="font-semibold text-lg">No Resume Yet</h3>
                <p className="text-sm text-muted-foreground">Upload your resume for personalized interview questions.</p>
              </div>
            )}

            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleUpload}
            />

            <Button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="hero-gradient glow-primary"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
              {profile?.resume_url ? "Replace Resume" : "Upload PDF"}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
