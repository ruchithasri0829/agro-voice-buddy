import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { role, difficulty, language, questionNumber, totalQuestions, resumeData, previousQuestions } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are an expert interviewer for ${role} positions. Generate exactly ONE interview question.
Rules:
- Difficulty: ${difficulty}
- Language: ${language}
- Question ${questionNumber} of ${totalQuestions}
- Do NOT repeat previous questions
- If resume data is provided, tailor questions to the candidate's experience
- Mix technical and behavioral questions
- Return ONLY the question text, no numbering or prefix`;

    const userPrompt = `Previous questions: ${previousQuestions?.join("; ") || "None"}
Resume highlights: ${resumeData ? JSON.stringify(resumeData).slice(0, 500) : "Not provided"}
Generate question ${questionNumber}:`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ question: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const question = data.choices?.[0]?.message?.content?.trim() || null;

    return new Response(JSON.stringify({ question }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ question: null, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
