// 🔔 Rappel quotidien à 10 h (notification locale, uniquement dans l'app Android/iOS).
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const KEY = 'moodly-reminder';
const REMINDER_ID = 1;

export const isReminderOn = () => localStorage.getItem(KEY) !== 'off';

/** Active ou coupe le rappel. Dans le navigateur, on retient juste la préférence. */
export async function setReminder(enabled) {
  localStorage.setItem(KEY, enabled ? 'on' : 'off');
  if (!Capacitor.isNativePlatform()) return;

  try {
    await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] });
    if (!enabled) return;

    const { display } = await LocalNotifications.requestPermissions();
    if (display !== 'granted') return;

    await LocalNotifications.schedule({
      notifications: [
        {
          id: REMINDER_ID,
          title: 'Moodly',
          body: "Comment tu te sens aujourd'hui ? Quelques secondes pour le dire.",
          schedule: { on: { hour: 10, minute: 0 }, allowWhileIdle: true }, // tous les jours à 10:00
        },
      ],
    });
  } catch (err) {
    console.warn('Rappel quotidien indisponible :', err);
  }
}
