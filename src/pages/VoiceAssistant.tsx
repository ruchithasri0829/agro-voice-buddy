import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mic, MicOff, Volume2, Trash2 } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/i18n";
import { useSpeech } from "@/hooks/useSpeech";
import { getChatHistory, saveChatMessage, clearChatHistory } from "@/lib/storage";
import { generateFarmingResponse } from "@/lib/aiResponses";
import type { ChatMessage } from "@/lib/storage";
import BottomNav from "@/components/BottomNav";

export default function VoiceAssistant() {
  const { language, settings } = useApp();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleUserResult = async (text: string) => {
    const userMsg = saveChatMessage({ role: "user", text });
    setMessages((prev) => [...prev, userMsg]);

    try {
      const { text: responseText } = await generateFarmingResponse(text, language);
      const assistantMsg = saveChatMessage({ role: "assistant", text: responseText });
      setMessages((prev) => [...prev, assistantMsg]);
      speech.setState("idle");
      if (settings.voiceEnabled) {
        speech.speak(responseText);
      }
    } catch {
      speech.setState("idle");
    }
  };

  const speech = useSpeech({
    language,
    onResult: handleUserResult,
    onError: (e) => setError(e),
    voiceEnabled: settings.voiceEnabled,
  });

  useEffect(() => {
    const history = getChatHistory();
    if (history.length === 0) {
      const greeting = saveChatMessage({
        role: "assistant",
        text: t("greeting", language),
      });
      setMessages([greeting]);
      if (settings.voiceEnabled) {
        setTimeout(() => speech.speak(t("greeting", language)), 500);
      }
    } else {
      setMessages(history);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleMicPress = () => {
    setError(null);
    if (speech.state === "listening") {
      speech.stopListening();
    } else if (speech.state === "speaking") {
      speech.cancelSpeaking();
    } else if (speech.state === "idle") {
      speech.startListening();
    }
  };

  const handleClear = () => {
    clearChatHistory();
    const greeting = saveChatMessage({
      role: "assistant",
      text: t("greeting", language),
    });
    setMessages([greeting]);
  };

  const stateLabel = {
    idle: t("tapToSpeak", language),
    listening: t("listening", language),
    processing: t("processing", language),
    speaking: t("speaking", language),
  }[speech.state];

  const micColor = {
    idle: "gold-gradient",
    listening: "bg-destructive",
    processing: "bg-muted",
    speaking: "bg-success",
  }[speech.state];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="hero-gradient px-4 pt-10 pb-6 flex items-center justify-between">
        <button onClick={() => navigate("/home")} className="p-2 rounded-xl bg-primary-foreground/10">
          <ArrowLeft className="w-5 h-5 text-primary-foreground" />
        </button>
        <h1 className="text-primary-foreground font-bold text-lg">{t("assistant", language)}</h1>
        <button onClick={handleClear} className="p-2 rounded-xl bg-primary-foreground/10">
          <Trash2 className="w-5 h-5 text-primary-foreground/70" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-44 flex flex-col gap-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"} slide-up`}
          >
            <div
              className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-sm font-bold ${
                msg.role === "user"
                  ? "gold-gradient text-gold-foreground"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              {msg.role === "user" ? "👨‍🌾" : "🌿"}
            </div>
            <div
              className={`max-w-[78%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-card text-foreground rounded-tl-sm shadow-sm"
              }`}
            >
              <p className="text-sm leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}

        {/* Processing indicator */}
        {speech.state === "processing" && (
          <div className="flex gap-2 slide-up">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm">🌿</div>
            <div className="bg-card rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-primary wave-bar" style={{ height: "8px", width: "4px" }} />
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-2 bg-destructive/10 text-destructive text-sm rounded-xl px-4 py-2 text-center">
          {error}
        </div>
      )}

      {/* Voice Control Bar */}
      <div className="fixed bottom-16 left-0 right-0 px-4 pb-4">
        <div className="bg-card rounded-2xl shadow-lg p-4 flex flex-col items-center gap-3">
          {/* Wave visualization */}
          {speech.state === "listening" && (
            <div className="flex items-end gap-1 h-8">
              {[5, 8, 12, 16, 12, 8, 5, 8, 12, 16, 12, 8, 5].map((h, i) => (
                <div
                  key={i}
                  className="bg-destructive rounded-full wave-bar"
                  style={{ width: "4px", height: `${h}px`, animationDelay: `${i * 0.08}s` }}
                />
              ))}
            </div>
          )}

          <p className="text-muted-foreground text-sm font-medium">{stateLabel}</p>

          <button
            onClick={handleMicPress}
            disabled={speech.state === "processing"}
            className={`w-16 h-16 rounded-full flex items-center justify-center ${micColor} active:scale-90 transition-all disabled:opacity-50 ${speech.state === "listening" ? "mic-pulse" : ""}`}
          >
            {speech.state === "speaking" ? (
              <Volume2 className="w-7 h-7 text-primary-foreground" />
            ) : speech.state === "listening" ? (
              <MicOff className="w-7 h-7 text-primary-foreground" />
            ) : (
              <Mic className="w-7 h-7 text-gold-foreground" />
            )}
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
