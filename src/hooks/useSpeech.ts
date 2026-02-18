import { useState, useCallback, useRef } from "react";
import type { Language } from "@/lib/i18n";
import { t } from "@/lib/i18n";

type SpeechState = "idle" | "listening" | "processing" | "speaking";

interface UseSpeechOptions {
  language: Language;
  onResult: (text: string) => void;
  onError?: (error: string) => void;
  voiceEnabled: boolean;
}

const langCodes: Record<Language, string> = {
  en: "en-IN",
  hi: "hi-IN",
  te: "te-IN",
};

export function useSpeech({ language, onResult, onError, voiceEnabled }: UseSpeechOptions) {
  const [state, setState] = useState<SpeechState>("idle");
  const recognitionRef = useRef<any>(null);

  const startListening = useCallback(() => {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      onError?.(t("errorSpeech", language));
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognitionRef.current = recognition;
    recognition.lang = langCodes[language];
    recognition.continuous = false;
    recognition.interimResults = false;

    setState("listening");

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const text = event.results[0][0].transcript;
      setState("processing");
      onResult(text);
    };

    recognition.onerror = () => {
      setState("idle");
      onError?.(t("errorMic", language));
    };

    recognition.onend = () => {
      setState((prev) => (prev === "listening" ? "idle" : prev));
    };

    recognition.start();
  }, [language, onResult, onError]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setState("idle");
  }, []);

  const speak = useCallback(
    (text: string, onDone?: () => void) => {
      if (!voiceEnabled) {
        onDone?.();
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langCodes[language];
      utterance.rate = 0.9;
      utterance.pitch = 1;

      setState("speaking");

      utterance.onend = () => {
        setState("idle");
        onDone?.();
      };

      utterance.onerror = () => {
        setState("idle");
        onDone?.();
      };

      window.speechSynthesis.speak(utterance);
    },
    [language, voiceEnabled]
  );

  const cancelSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setState("idle");
  }, []);

  return { state, setState, startListening, stopListening, speak, cancelSpeaking };
}
