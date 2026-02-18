import { ArrowLeft, Bell, Mic, Wifi, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/i18n";
import LanguageSelector from "@/components/LanguageSelector";
import BottomNav from "@/components/BottomNav";
import logo from "@/assets/logo.png";

function ToggleSwitch({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? "bg-primary" : "bg-muted"}`}
    >
      <div
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-card shadow-sm transition-transform ${
          enabled ? "translate-x-6" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { language, settings, updateSettings } = useApp();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="hero-gradient px-4 pt-10 pb-8 flex items-center gap-4">
        <button onClick={() => navigate("/home")} className="p-2 rounded-xl bg-primary-foreground/10">
          <ArrowLeft className="w-5 h-5 text-primary-foreground" />
        </button>
        <h1 className="text-primary-foreground font-bold text-lg">{t("settings", language)}</h1>
      </div>

      <div className="flex-1 px-4 py-4 pb-28 flex flex-col gap-4">
        {/* App Logo Card */}
        <div className="bg-card rounded-2xl p-4 flex items-center gap-4">
          <img src={logo} alt="AgroDhwani" className="w-14 h-14 rounded-2xl" />
          <div>
            <h2 className="text-foreground font-bold text-lg">{t("appName", language)}</h2>
            <p className="text-muted-foreground text-sm">{t("tagline", language)}</p>
            <span className="text-xs text-primary font-semibold mt-1 inline-block">v1.0.0</span>
          </div>
        </div>

        {/* Language */}
        <div className="bg-card rounded-2xl p-4">
          <LanguageSelector />
        </div>

        {/* Toggle Settings */}
        <div className="bg-card rounded-2xl divide-y divide-border overflow-hidden">
          {/* Notifications */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-foreground font-semibold text-sm">{t("notifications", language)}</p>
                <p className="text-muted-foreground text-xs">
                  {settings.notificationsEnabled ? t("enabled", language) : t("disabled", language)}
                </p>
              </div>
            </div>
            <ToggleSwitch
              enabled={settings.notificationsEnabled}
              onToggle={() => updateSettings({ notificationsEnabled: !settings.notificationsEnabled })}
            />
          </div>

          {/* Voice */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
                <Mic className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-foreground font-semibold text-sm">{t("voiceAssistant", language)}</p>
                <p className="text-muted-foreground text-xs">
                  {settings.voiceEnabled ? t("enabled", language) : t("disabled", language)}
                </p>
              </div>
            </div>
            <ToggleSwitch
              enabled={settings.voiceEnabled}
              onToggle={() => updateSettings({ voiceEnabled: !settings.voiceEnabled })}
            />
          </div>

          {/* Offline */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
                <Wifi className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-foreground font-semibold text-sm">{t("offlineSwitch", language)}</p>
                <p className="text-muted-foreground text-xs">
                  {settings.offlineMode ? t("enabled", language) : t("disabled", language)}
                </p>
              </div>
            </div>
            <ToggleSwitch
              enabled={settings.offlineMode}
              onToggle={() => updateSettings({ offlineMode: !settings.offlineMode })}
            />
          </div>
        </div>

        {/* Info Cards */}
        <div className="bg-card rounded-2xl divide-y divide-border overflow-hidden">
          {[
            { icon: "🌾", label: "Supported Crops", value: "25+ crops" },
            { icon: "🌍", label: "Languages", value: "English, हिंदी, తెలుగు" },
            { icon: "📡", label: "Offline Support", value: "Full" },
            { icon: "🔒", label: "Data Privacy", value: "Local only" },
          ].map(({ icon, label, value }) => (
            <div key={label} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <span className="text-xl">{icon}</span>
                <p className="text-foreground font-medium text-sm">{label}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs">{value}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p className="text-center text-muted-foreground text-xs py-2">
          AgroDhwani · Made for Farmers 🌿
        </p>
      </div>

      <BottomNav />
    </div>
  );
}
