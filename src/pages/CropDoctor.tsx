import { useState, useRef } from "react";
import { ArrowLeft, Stethoscope, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/i18n";
import { useSpeech } from "@/hooks/useSpeech";
import { generateFarmingResponse } from "@/lib/aiResponses";
import BottomNav from "@/components/BottomNav";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
}

export default function CropDoctor() {
  const { language, settings } = useApp();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    { id: "0", role: "assistant", text: t("cropDoctorGreeting", language) },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSend = async (text?: string) => {
    const query = (text || input).trim();
    if (!query) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", text: query };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const { text: responseText } = await generateFarmingResponse(query, language);
      const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", text: responseText };
      setMessages((prev) => [...prev, assistantMsg]);
      if (settings.voiceEnabled) {
        speech.speak(responseText);
      }
    } finally {
      setLoading(false);
    }

    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const speech = useSpeech({
    language,
    onResult: (text) => handleSend(text),
    onError: () => {},
    voiceEnabled: settings.voiceEnabled,
  });

  const quickSymptoms = [
    { key: "yellowLeaves", emoji: "🟡", label: language === "hi" ? "पीली पत्तियां" : language === "te" ? "పసుపు ఆకులు" : "Yellow Leaves" },
    { key: "pestAttack", emoji: "🐛", label: language === "hi" ? "कीट हमला" : language === "te" ? "పురుగుల దాడి" : "Pest Attack" },
    { key: "diseaseSpot", emoji: "🍂", label: language === "hi" ? "पत्ती धब्बे" : language === "te" ? "ఆకు మచ్చలు" : "Leaf Spots" },
    { key: "rootRot", emoji: "🌱", label: language === "hi" ? "जड़ सड़न" : language === "te" ? "వేర్ల కుళ్ళు" : "Root Rot" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="hero-gradient px-4 pt-10 pb-6 flex items-center gap-4">
        <button onClick={() => navigate("/home")} className="p-2 rounded-xl bg-primary-foreground/10">
          <ArrowLeft className="w-5 h-5 text-primary-foreground" />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <Stethoscope className="w-5 h-5 text-primary-foreground" />
          <h1 className="text-primary-foreground font-bold text-lg">{t("cropDoctor", language)}</h1>
        </div>
      </div>

      {/* Quick Symptom Chips */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto hide-scrollbar border-b border-border">
        {quickSymptoms.map((s) => (
          <button
            key={s.key}
            onClick={() => handleSend(s.label)}
            className="flex items-center gap-1.5 bg-secondary text-secondary-foreground rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap active:scale-95 transition-transform shrink-0"
          >
            <span>{s.emoji}</span>
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-44 flex flex-col gap-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"} slide-up`}
          >
            <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-sm ${
              msg.role === "user" ? "gold-gradient" : "bg-primary"
            }`}>
              {msg.role === "user" ? "👨‍🌾" : "🩺"}
            </div>
            <div className={`max-w-[78%] rounded-2xl px-4 py-3 ${
              msg.role === "user"
                ? "bg-primary text-primary-foreground rounded-tr-sm"
                : "bg-card text-foreground rounded-tl-sm shadow-sm"
            }`}>
              <p className="text-sm leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2 slide-up">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">🩺</div>
            <div className="bg-card rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="fixed bottom-16 left-0 right-0 px-4 pb-4">
        <div className="bg-card rounded-2xl shadow-lg p-3 flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={t("cropDoctorPlaceholder", language)}
            className="flex-1 bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={() => speech.state === "listening" ? speech.stopListening() : speech.startListening()}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              speech.state === "listening" ? "bg-destructive mic-pulse" : "bg-secondary"
            }`}
          >
            <span className="text-base">{speech.state === "listening" ? "🎙️" : "🎤"}</span>
          </button>
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center disabled:opacity-40 active:scale-90 transition-transform"
          >
            <Send className="w-4 h-4 text-primary-foreground" />
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
