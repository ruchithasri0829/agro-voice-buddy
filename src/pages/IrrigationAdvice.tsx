import { useEffect, useState } from "react";
import { ArrowLeft, Droplets, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/i18n";
import { getWeather } from "@/lib/weather";
import { useSpeech } from "@/hooks/useSpeech";
import BottomNav from "@/components/BottomNav";

type IrrigationScenario = "morning" | "rain" | "hot" | "normal";

interface IrrigationCard {
  scenario: IrrigationScenario;
  emoji: string;
  adviceKey: string;
  bgClass: string;
  borderClass: string;
}

const cards: IrrigationCard[] = [
  { scenario: "morning", emoji: "🌅", adviceKey: "irrigationMorning", bgClass: "bg-primary/10", borderClass: "border-primary/30" },
  { scenario: "rain", emoji: "🌧️", adviceKey: "irrigationRain", bgClass: "bg-blue-500/10", borderClass: "border-blue-500/30" },
  { scenario: "hot", emoji: "☀️", adviceKey: "irrigationHot", bgClass: "bg-gold/10", borderClass: "border-gold/30" },
  { scenario: "normal", emoji: "🌱", adviceKey: "irrigationNormal", bgClass: "bg-secondary", borderClass: "border-border" },
];

export default function IrrigationAdvice() {
  const { language, settings } = useApp();
  const navigate = useNavigate();
  const [activeScenario, setActiveScenario] = useState<IrrigationScenario>("normal");
  const [loading, setLoading] = useState(true);

  const speech = useSpeech({
    language,
    onResult: () => {},
    onError: () => {},
    voiceEnabled: settings.voiceEnabled,
  });

  useEffect(() => {
    loadRecommendation();
  }, []);

  const loadRecommendation = async () => {
    setLoading(true);
    try {
      const weather = await getWeather();
      if (weather.condition === "rainy") setActiveScenario("rain");
      else if (weather.temperature > 32) setActiveScenario("hot");
      else setActiveScenario("morning");
    } catch {
      setActiveScenario("normal");
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = (adviceKey: string) => {
    speech.speak(t(adviceKey, language));
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="hero-gradient px-4 pt-10 pb-8 flex items-center gap-4">
        <button onClick={() => navigate("/home")} className="p-2 rounded-xl bg-primary-foreground/10">
          <ArrowLeft className="w-5 h-5 text-primary-foreground" />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <Droplets className="w-5 h-5 text-primary-foreground" />
          <h1 className="text-primary-foreground font-bold text-lg">{t("irrigationRec", language)}</h1>
        </div>
        <button onClick={loadRecommendation} className="p-2 rounded-xl bg-primary-foreground/10">
          <RefreshCw className="w-4 h-4 text-primary-foreground" />
        </button>
      </div>

      <div className="flex-1 px-4 py-4 pb-28 flex flex-col gap-4">
        {/* Title */}
        <div className="bg-card rounded-2xl p-4 flex items-center gap-3">
          <span className="text-3xl">💧</span>
          <div>
            <p className="text-foreground font-bold text-base">{t("irrigationAdviceTitle", language)}</p>
            <p className="text-muted-foreground text-xs mt-0.5">{t("irrigationRecDesc", language)}</p>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
              <Droplets className="w-8 h-8 text-primary" />
            </div>
            <p className="text-muted-foreground text-sm">{t("weatherLoading", language)}</p>
          </div>
        ) : (
          <>
            {/* Recommended (active) card — shown first */}
            {cards
              .filter((c) => c.scenario === activeScenario)
              .map((card) => (
                <div
                  key={card.scenario}
                  className={`${card.bgClass} border-2 border-primary rounded-2xl p-5 slide-up`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{card.emoji}</span>
                      <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full font-bold">
                        ✓ {language === "hi" ? "अनुशंसित" : language === "te" ? "సిఫార్సు చేయబడింది" : "Recommended"}
                      </span>
                    </div>
                    <button
                      onClick={() => handleSpeak(card.adviceKey)}
                      className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center active:scale-90 transition-transform"
                    >
                      <span className="text-base">🔊</span>
                    </button>
                  </div>
                  <p className="text-foreground text-sm leading-relaxed font-medium">
                    {t(card.adviceKey, language)}
                  </p>
                </div>
              ))}

            {/* Other scenarios */}
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider px-1">
              {language === "hi" ? "अन्य परिस्थितियां" : language === "te" ? "ఇతర పరిస్థితులు" : "Other Scenarios"}
            </p>

            {cards
              .filter((c) => c.scenario !== activeScenario)
              .map((card) => (
                <div
                  key={card.scenario}
                  className={`${card.bgClass} border ${card.borderClass} rounded-2xl p-4 slide-up`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl">{card.emoji}</span>
                    <button
                      onClick={() => handleSpeak(card.adviceKey)}
                      className="w-8 h-8 rounded-xl bg-card flex items-center justify-center active:scale-90 transition-transform"
                    >
                      <span className="text-sm">🔊</span>
                    </button>
                  </div>
                  <p className="text-foreground/80 text-sm leading-relaxed">
                    {t(card.adviceKey, language)}
                  </p>
                </div>
              ))}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
