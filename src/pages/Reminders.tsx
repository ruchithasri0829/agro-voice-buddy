import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Trash2, Clock, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/i18n";
import { getReminders, saveReminder, deleteReminder, formatTime } from "@/lib/storage";
import type { Reminder } from "@/lib/storage";
import BottomNav from "@/components/BottomNav";

export default function Reminders() {
  const { language } = useApp();
  const navigate = useNavigate();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [task, setTask] = useState("");
  const [time, setTime] = useState("06:00");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setReminders(getReminders());
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleAdd = () => {
    if (!task.trim()) return;
    const newReminder = saveReminder({ task: task.trim(), time });
    setReminders(getReminders());
    setTask("");
    setTime("06:00");
    setShowAdd(false);
    showToast(t("reminderAdded", language));

    // Schedule browser notification
    if ("Notification" in window && Notification.permission === "granted") {
      const [h, m] = time.split(":").map(Number);
      const now = new Date();
      const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
      if (target < now) target.setDate(target.getDate() + 1);
      const delay = target.getTime() - now.getTime();
      setTimeout(() => {
        new Notification("AgroDhwani 🌿", { body: newReminder.task });
      }, delay);
    }
  };

  const handleDelete = (id: string) => {
    deleteReminder(id);
    setReminders(getReminders());
    showToast(t("reminderDeleted", language));
  };

  const requestNotificationPermission = () => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="hero-gradient px-4 pt-10 pb-6 flex items-center justify-between">
        <button onClick={() => navigate("/home")} className="p-2 rounded-xl bg-primary-foreground/10">
          <ArrowLeft className="w-5 h-5 text-primary-foreground" />
        </button>
        <h1 className="text-primary-foreground font-bold text-lg">{t("reminders", language)}</h1>
        <button
          onClick={() => { setShowAdd(true); requestNotificationPermission(); }}
          className="p-2 rounded-xl bg-gold text-gold-foreground font-bold"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-4 pb-28 flex flex-col gap-3">
        {reminders.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-16">
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center text-4xl">
              🔔
            </div>
            <div className="text-center">
              <p className="text-foreground font-bold text-lg">{t("noReminders", language)}</p>
              <p className="text-muted-foreground text-sm mt-1">{t("noRemindersDesc", language)}</p>
            </div>
            <button
              onClick={() => setShowAdd(true)}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-semibold text-sm active:scale-95 transition-transform"
            >
              + {t("addReminder", language)}
            </button>
          </div>
        ) : (
          reminders.map((reminder) => (
            <div
              key={reminder.id}
              className="bg-card rounded-2xl shadow-sm p-4 flex items-center gap-4 slide-up"
            >
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-foreground font-semibold text-base">{reminder.task}</p>
                <p className="text-gold font-bold text-sm mt-0.5">{formatTime(reminder.time)}</p>
              </div>
              <button
                onClick={() => handleDelete(reminder.id)}
                className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center active:scale-90 transition-transform"
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add Reminder Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-foreground/50 z-50 flex items-end">
          <div className="bg-card w-full rounded-t-3xl p-6 flex flex-col gap-5 slide-up">
            <div className="flex items-center justify-between">
              <h2 className="text-foreground font-bold text-xl">{t("addReminder", language)}</h2>
              <button onClick={() => setShowAdd(false)} className="p-2 rounded-xl bg-muted">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-muted-foreground">{t("reminderTask", language)}</label>
              <input
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder={t("reminderTaskPlaceholder", language)}
                className="bg-muted rounded-xl px-4 py-3 text-foreground text-base outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-muted-foreground">{t("reminderTime", language)}</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="bg-muted rounded-xl px-4 py-3 text-foreground text-base outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAdd(false)}
                className="flex-1 py-3 rounded-xl bg-secondary text-secondary-foreground font-semibold active:scale-95 transition-transform"
              >
                {t("cancel", language)}
              </button>
              <button
                onClick={handleAdd}
                disabled={!task.trim()}
                className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold active:scale-95 transition-transform disabled:opacity-50"
              >
                {t("save", language)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed top-6 left-4 right-4 bg-success text-success-foreground rounded-2xl px-4 py-3 text-center font-semibold text-sm shadow-lg z-50 fade-in">
          ✓ {toast}
        </div>
      )}

      <BottomNav />
    </div>
  );
}
