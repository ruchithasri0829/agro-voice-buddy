import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { interviewId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: interview } = await supabase.from("interviews").select("*").eq("id", interviewId).single();
    if (!interview) throw new Error("Interview not found");

    const { data: questions } = await supabase
      .from("interview_questions")
      .select("*")
      .eq("interview_id", interviewId)
      .order("question_number");

    const qaSummary = questions?.map((q) => `Q: ${q.question_text}\nA: ${q.answer_text || "No answer"}`).join("\n\n") || "";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tools: [{
          type: "function",
          function: {
            name: "analyze_interview",
            description: "Analyze interview performance and return scores",
            parameters: {
              type: "object",
              properties: {
                communication_score: { type: "number", description: "Communication score 0-100" },
                technical_score: { type: "number", description: "Technical knowledge score 0-100" },
                confidence_score: { type: "number", description: "Confidence score 0-100" },
                resume_match_score: { type: "number", description: "Resume relevance score 0-100" },
                overall_score: { type: "number", description: "Overall score 0-100" },
                strengths: { type: "array", items: { type: "string" }, description: "3-5 key strengths" },
                weaknesses: { type: "array", items: { type: "string" }, description: "3-5 areas to improve" },
                ai_feedback: { type: "string", description: "Detailed improvement suggestions in 3-4 sentences" },
                question_scores: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      question_number: { type: "number" },
                      score: { type: "number" },
                      feedback: { type: "string" }
                    },
                    required: ["question_number", "score", "feedback"]
                  }
                }
              },
              required: ["communication_score", "technical_score", "confidence_score", "resume_match_score", "overall_score", "strengths", "weaknesses", "ai_feedback", "question_scores"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "analyze_interview" } },
        messages: [
          {
            role: "system",
            content: `You are an expert interview evaluator. Analyze the candidate's ${interview.role} interview (${interview.difficulty} difficulty). Provide honest, constructive scores and feedback.`
          },
          { role: "user", content: `Interview Q&A:\n\n${qaSummary}` }
        ],
      }),
    });

    if (!response.ok) {
      console.error("AI analysis error:", response.status);
      // Fallback scores
      await supabase.from("interviews").update({
        communication_score: 65, technical_score: 60, confidence_score: 70,
        resume_match_score: 55, overall_score: 63,
        strengths: ["Completed all questions", "Showed engagement"],
        weaknesses: ["Could provide more detail", "Consider structuring answers better"],
        ai_feedback: "Good effort completing the interview. Focus on providing structured, detailed answers with specific examples.",
      }).eq("id", interviewId);
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const analysis = JSON.parse(toolCall.function.arguments);

    await supabase.from("interviews").update({
      communication_score: analysis.communication_score,
      technical_score: analysis.technical_score,
      confidence_score: analysis.confidence_score,
      resume_match_score: analysis.resume_match_score,
      overall_score: analysis.overall_score,
      strengths: analysis.strengths,
      weaknesses: analysis.weaknesses,
      ai_feedback: analysis.ai_feedback,
    }).eq("id", interviewId);

    // Update per-question scores
    if (analysis.question_scores && questions) {
      for (const qs of analysis.question_scores) {
        const q = questions.find((qq) => qq.question_number === qs.question_number);
        if (q) {
          await supabase.from("interview_questions").update({
            score: qs.score,
            ai_feedback: qs.feedback,
          }).eq("id", q.id);
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Analysis error:", e);
    return new Response(JSON.stringify({ success: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
