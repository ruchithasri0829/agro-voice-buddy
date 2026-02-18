import React, { createContext, useContext, useState, useEffect } from "react";
import type { Language } from "@/lib/i18n";
import { getSettings, saveSettings } from "@/lib/storage";
import type { AppSettings } from "@/lib/storage";

interface AppContextType {
  settings: AppSettings;
  language: Language;
  setLanguage: (lang: Language) => void;
  updateSettings: (s: Partial<AppSettings>) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(getSettings);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const setLanguage = (lang: Language) => {
    setSettings((s) => ({ ...s, language: lang }));
  };

  const updateSettings = (partial: Partial<AppSettings>) => {
    setSettings((s) => ({ ...s, ...partial }));
  };

  return (
    <AppContext.Provider value={{ settings, language: settings.language, setLanguage, updateSettings }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
