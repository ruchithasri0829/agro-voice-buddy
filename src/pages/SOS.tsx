import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, PhoneCall, X } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/i18n";
import { useSpeech } from "@/hooks/useSpeech";
import BottomNav from "@/components/BottomNav";

export default function SOSPage() {
  const { language, settings } = useApp();
  const navigate = useNavigate();
  const [alertPlayed, setAlertPlayed] = useState(false);

  const speech = useSpeech({
    language,
    onResult: () => {},
    onError: () => {},
    voiceEnabled: settings.voiceEnabled,
  });

  useEffect(() => {
    if (!alertPlayed && settings.voiceEnabled) {
      const alertText = t("emergencyKeyword", language);
      setTimeout(() => {
        speech.speak(alertText);
        setAlertPlayed(true);
      }, 400);
    }
  }, []);

  const adviceKeys = ["sosAdvice1", "sosAdvice2", "sosAdvice3", "sosAdvice4"] as const;

  return (
    <div className="flex flex-col min-h-screen bg-destructive/5">
      {/* Header */}
      <div className="bg-destructive px-4 pt-10 pb-6 flex items-center justify-between">
        <button onClick={() => navigate("/home")} className="p-2 rounded-xl bg-white/10">
          <X className="w-5 h-5 text-white" />
        </button>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-white animate-pulse" />
          <h1 className="text-white font-bold text-lg">{t("sosActive", language)}</h1>
        </div>
        <div className="w-9" />
      </div>

      <div className="flex-1 px-4 py-4 pb-28 flex flex-col gap-4">
        {/* SOS Title */}
        <div className="bg-destructive rounded-2xl p-5 flex flex-col items-center gap-3 text-center">
          <span className="text-5xl animate-pulse">🚨</span>
          <p className="text-white font-bold text-xl">{t("sosTitle", language)}</p>
          <p className="text-white/80 text-sm">{t("sosDesc", language)}</p>
        </div>

        {/* Emergency Advice Cards */}
        <div className="flex flex-col gap-3">
          {adviceKeys.map((key) => (
            <div
              key={key}
              className="bg-card border border-destructive/20 rounded-2xl p-4 flex items-start gap-3 slide-up"
            >
              <p className="text-foreground text-sm leading-relaxed">{t(key, language)}</p>
            </div>
          ))}
        </div>

        {/* Emergency Call Button */}
        <a
          href={`tel:${t("sosHelplineNumber", language)}`}
          className="bg-destructive text-white font-bold rounded-2xl p-5 flex items-center justify-center gap-3 active:scale-95 transition-transform"
        >
          <PhoneCall className="w-6 h-6" />
          <div className="text-center">
            <p className="text-sm opacity-80">{t("sosEmergencyHelp", language)}</p>
            <p className="text-xl font-bold tracking-wider">{t("sosHelplineNumber", language)}</p>
          </div>
        </a>

        {/* Speak advice */}
        <button
          onClick={() => {
            const allAdvice = adviceKeys.map((k) => t(k, language)).join(". ");
            speech.speak(allAdvice);
          }}
          className="bg-card border border-border rounded-2xl p-4 flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <span className="text-xl">🔊</span>
          <span className="text-foreground font-semibold text-sm">
            {language === "hi" ? "सलाह सुनें" : language === "te" ? "సలహా వినండి" : "Speak All Advice"}
          </span>
        </button>

        {/* Close */}
        <button
          onClick={() => navigate("/home")}
          className="text-muted-foreground underline text-sm text-center py-2"
        >
          {t("sosClose", language)}
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
