import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronRight, Mic, RefreshCw, AlertTriangle } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/i18n";
import { getNextReminder, formatTime } from "@/lib/storage";
import { getWeather, getWeatherIcon } from "@/lib/weather";
import type { WeatherData } from "@/lib/weather";
import type { Reminder } from "@/lib/storage";
import BottomNav from "@/components/BottomNav";
import LanguageSelector from "@/components/LanguageSelector";
import logo from "@/assets/logo.png";

export default function Home() {
  const { language } = useApp();
  const navigate = useNavigate();
  const [nextReminder, setNextReminder] = useState<Reminder | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    setNextReminder(getNextReminder());
    loadWeather();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const loadWeather = async () => {
    try {
      const data = await getWeather();
      setWeather(data);
    } catch {
      // offline
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="hero-gradient px-4 pt-10 pb-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-primary-light opacity-20 -translate-y-12 translate-x-12" />
        <div className="absolute bottom-0 left-8 w-24 h-24 rounded-full bg-gold opacity-15" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Logo" className="w-10 h-10 rounded-xl" />
              <div>
                <h1 className="text-primary-foreground font-bold text-xl leading-tight">
                  {t("appName", language)}
                </h1>
                <p className="text-primary-foreground/60 text-xs">{t("tagline", language)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isOnline && (
                <span className="bg-warning/20 text-warning px-2 py-1 rounded-full text-xs font-semibold">
                  Offline
                </span>
              )}
              <LanguageSelector compact />
            </div>
          </div>

          {/* Offline banner */}
          {!isOnline && (
            <div className="bg-warning/15 border border-warning/30 rounded-xl p-3 mt-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
              <p className="text-primary-foreground/80 text-sm">{t("offlineDesc", language)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 -mt-8 pb-24 flex flex-col gap-4">
        {/* Mic Button Card */}
        <div className="bg-card rounded-2xl shadow-md p-6 flex flex-col items-center gap-4 slide-up">
          <p className="text-muted-foreground text-sm font-medium">{t("tapToSpeak", language)}</p>
          <button
            onClick={() => navigate("/assistant")}
            className="relative w-24 h-24 rounded-full gold-gradient flex items-center justify-center shadow-gold active:scale-95 transition-transform"
          >
            <div className="absolute inset-0 rounded-full gold-gradient opacity-40 mic-pulse" />
            <Mic className="w-10 h-10 text-gold-foreground relative z-10" />
          </button>
          <p className="text-foreground/60 text-xs text-center max-w-[200px]">
            {t("askAnything", language)}
          </p>
        </div>

        {/* Cards Row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Next Reminder Card */}
          <button
            onClick={() => navigate("/reminders")}
            className="bg-card rounded-2xl shadow-sm p-4 text-left active:scale-98 transition-transform"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center">
                <Bell className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground">
                {t("nextReminder", language)}
              </span>
            </div>
            {nextReminder ? (
              <>
                <p className="text-foreground font-bold text-sm leading-tight line-clamp-2">
                  {nextReminder.task}
                </p>
                <p className="text-primary font-semibold text-base mt-1">
                  {formatTime(nextReminder.time)}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground text-xs">{t("noReminder", language)}</p>
            )}
            <div className="flex items-center gap-1 mt-2 text-primary">
              <span className="text-xs font-medium">{t("reminders", language)}</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </button>

          {/* Weather Card */}
          <button
            onClick={loadWeather}
            className="bg-card rounded-2xl shadow-sm p-4 text-left active:scale-98 transition-transform relative overflow-hidden"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center">
                <RefreshCw className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground">
                {t("weather", language)}
              </span>
            </div>

            {weather ? (
              <>
                <div className="text-3xl mb-1">{getWeatherIcon(weather.condition)}</div>
                <p className="text-foreground font-bold text-lg leading-none">
                  {weather.temperature}{t("temp", language)}
                </p>
                <p className="text-muted-foreground text-xs mt-1">
                  {t(weather.condition, language)} · {weather.humidity}% {t("humidity", language).slice(0, 3)}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground text-xs">{t("weatherLoading", language)}</p>
            )}
          </button>
        </div>

        {/* Weather Alert */}
        {weather?.alert && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 flex items-start gap-3 slide-up">
            <div className="w-9 h-9 rounded-xl bg-destructive/15 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-destructive font-semibold text-sm">{t("weatherAlert", language)}</p>
              <p className="text-foreground/70 text-sm mt-0.5">{weather.alert}</p>
            </div>
          </div>
        )}

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate("/reminders")}
            className="bg-primary text-primary-foreground rounded-2xl p-4 font-semibold text-sm active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <Bell className="w-5 h-5" />
            {t("reminders", language)}
          </button>
          <button
            onClick={() => navigate("/settings")}
            className="bg-secondary text-secondary-foreground rounded-2xl p-4 font-semibold text-sm active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            ⚙️ {t("settings", language)}
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
