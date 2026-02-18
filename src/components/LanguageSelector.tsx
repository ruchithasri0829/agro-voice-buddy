import { useApp } from "@/contexts/AppContext";
import type { Language } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { Globe } from "lucide-react";

const languages: { code: Language; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "hi", label: "हि" },
  { code: "te", label: "తె" },
];

interface Props {
  compact?: boolean;
}

export default function LanguageSelector({ compact }: Props) {
  const { language, setLanguage } = useApp();

  if (compact) {
    return (
      <div className="flex items-center gap-1 bg-primary-foreground/10 rounded-xl px-2 py-1">
        <Globe className="w-3.5 h-3.5 text-primary-foreground/70" />
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          className="bg-transparent text-primary-foreground text-xs font-semibold outline-none cursor-pointer"
        >
          {languages.map((l) => (
            <option key={l.code} value={l.code} className="bg-primary text-primary-foreground">
              {l.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold text-muted-foreground">{t("language", language)}</p>
      <div className="flex gap-2">
        {languages.map((l) => (
          <button
            key={l.code}
            onClick={() => setLanguage(l.code)}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 ${
              language === l.code
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            {t(l.code === "en" ? "englishName" : l.code === "hi" ? "hindiName" : "teluguName", language)}
          </button>
        ))}
      </div>
    </div>
  );
}
