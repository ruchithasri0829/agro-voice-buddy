// Local storage utilities for AgroDhwani

export interface Reminder {
  id: string;
  task: string;
  time: string;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: number;
}

export interface AppSettings {
  language: "en" | "hi" | "te";
  notificationsEnabled: boolean;
  voiceEnabled: boolean;
  offlineMode: boolean;
}

const REMINDERS_KEY = "agrodhwani_reminders";
const CHAT_KEY = "agrodhwani_chat";
const SETTINGS_KEY = "agrodhwani_settings";

// Reminders
export function getReminders(): Reminder[] {
  try {
    const raw = localStorage.getItem(REMINDERS_KEY);
    if (!raw) return getDefaultReminders();
    return JSON.parse(raw);
  } catch {
    return getDefaultReminders();
  }
}

function getDefaultReminders(): Reminder[] {
  const defaults: Reminder[] = [
    { id: "1", task: "Irrigate Field 1", time: "06:00", createdAt: Date.now() - 86400000 },
    { id: "2", task: "Pesticide Spraying", time: "17:00", createdAt: Date.now() - 43200000 },
  ];
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(defaults));
  return defaults;
}

export function saveReminder(reminder: Omit<Reminder, "id" | "createdAt">): Reminder {
  const reminders = getReminders();
  const newReminder: Reminder = {
    ...reminder,
    id: Date.now().toString(),
    createdAt: Date.now(),
  };
  reminders.push(newReminder);
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
  return newReminder;
}

export function deleteReminder(id: string): void {
  const reminders = getReminders().filter((r) => r.id !== id);
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
}

// Chat history
export function getChatHistory(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(CHAT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveChatMessage(message: Omit<ChatMessage, "id" | "timestamp">): ChatMessage {
  const history = getChatHistory();
  const newMsg: ChatMessage = {
    ...message,
    id: Date.now().toString(),
    timestamp: Date.now(),
  };
  history.push(newMsg);
  // Keep last 50 messages
  const trimmed = history.slice(-50);
  localStorage.setItem(CHAT_KEY, JSON.stringify(trimmed));
  return newMsg;
}

export function clearChatHistory(): void {
  localStorage.removeItem(CHAT_KEY);
}

// Settings
export function getSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return getDefaultSettings();
    return { ...getDefaultSettings(), ...JSON.parse(raw) };
  } catch {
    return getDefaultSettings();
  }
}

function getDefaultSettings(): AppSettings {
  return {
    language: "en",
    notificationsEnabled: true,
    voiceEnabled: true,
    offlineMode: false,
  };
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// Next reminder helper
export function getNextReminder(): Reminder | null {
  const reminders = getReminders();
  if (reminders.length === 0) return null;
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const sorted = reminders
    .map((r) => {
      const [h, m] = r.time.split(":").map(Number);
      const reminderMinutes = h * 60 + m;
      const diff = reminderMinutes >= nowMinutes
        ? reminderMinutes - nowMinutes
        : 1440 - nowMinutes + reminderMinutes;
      return { ...r, diff };
    })
    .sort((a, b) => a.diff - b.diff);

  return sorted[0] || null;
}

export function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
}
