import { useNavigate, useLocation } from "react-router-dom";
import { Home, Bell, Mic, Settings } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/i18n";

const tabs = [
  { path: "/home", icon: Home, key: "home" },
  { path: "/reminders", icon: Bell, key: "reminders" },
  { path: "/assistant", icon: Mic, key: "assistant" },
  { path: "/settings", icon: Settings, key: "settings" },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useApp();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-b">
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map(({ path, icon: Icon, key }) => {
          const active = location.pathname === path;
          const isAssistant = key === "assistant";
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all active:scale-95 ${
                isAssistant
                  ? "relative -top-4 w-14 h-14 rounded-full gold-gradient shadow-gold flex items-center justify-center"
                  : active
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <Icon
                className={`${isAssistant ? "w-7 h-7 text-gold-foreground" : "w-6 h-6"}`}
              />
              {!isAssistant && (
                <span className={`text-2xs font-semibold ${active ? "text-primary" : "text-muted-foreground"}`}>
                  {t(key, language)}
                </span>
              )}
              {!isAssistant && active && (
                <div className="w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
