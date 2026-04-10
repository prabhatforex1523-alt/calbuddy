import type { UserProfile } from "../types";

const reminderKey = (type: string, scope: string) => `calsnap_reminder_${type}_${scope}`;

export const requestNotificationPermission = async () => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied" as const;
  }

  if (Notification.permission === "default") {
    return Notification.requestPermission();
  }

  return Notification.permission;
};

export const startReminderScheduler = (input: {
  profile: UserProfile;
  userScope: string;
}) => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return () => undefined;
  }

  const permission = Notification.permission;

  if (permission !== "granted") {
    return () => undefined;
  }

  const interval = window.setInterval(() => {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);

    if (input.profile.mealRemindersEnabled) {
      [
        { hour: 8, label: "Breakfast" },
        { hour: 13, label: "Lunch" },
        { hour: 20, label: "Dinner" },
      ].forEach((slot) => {
        const key = reminderKey(`meal_${slot.label.toLowerCase()}`, input.userScope);
        if (now.getHours() === slot.hour && now.getMinutes() < 10 && window.localStorage.getItem(key) !== today) {
          new Notification(`${slot.label} reminder`, {
            body: `Time to log your ${slot.label.toLowerCase()} in CALSNAP AI.`,
          });
          window.localStorage.setItem(key, today);
        }
      });
    }

    if (input.profile.waterRemindersEnabled) {
      const currentBucket = `${today}_${Math.floor(now.getHours() / Math.max(1, input.profile.waterReminderIntervalHours || 3))}`;
      const key = reminderKey("water", input.userScope);

      if (now.getHours() >= 9 && now.getHours() <= 21 && now.getMinutes() < 10 && window.localStorage.getItem(key) !== currentBucket) {
        new Notification("Water reminder", {
          body: "Take a quick water break and log it so your hydration stays on track.",
        });
        window.localStorage.setItem(key, currentBucket);
      }
    }
  }, 60000);

  return () => window.clearInterval(interval);
};
