// 🔔 Rappel quotidien à 10 h (notification locale, sur téléphone).
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'moodly-reminder';
const ID_KEY = 'moodly-reminder-id';

// Afficher la notification même si l'app est ouverte
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export const isReminderOn = async () => (await AsyncStorage.getItem(KEY)) !== 'off';

/** Active ou coupe le rappel. Renvoie false si la permission est refusée. */
export async function setReminder(enabled) {
  await AsyncStorage.setItem(KEY, enabled ? 'on' : 'off');
  if (Platform.OS === 'web') return true;

  const oldId = await AsyncStorage.getItem(ID_KEY);
  if (oldId) await Notifications.cancelScheduledNotificationAsync(oldId).catch(() => {});
  await AsyncStorage.removeItem(ID_KEY);
  if (!enabled) return true;

  // Android 8+ : un « canal » est obligatoire (et nécessaire pour afficher la demande de permission)
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('daily', {
      name: 'Rappel quotidien',
      // eslint-disable-next-line import/namespace -- AndroidImportance est bien exporté (via export * dans expo-notifications)
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') ({ status } = await Notifications.requestPermissionsAsync());
  if (status !== 'granted') return false;

  const id = await Notifications.scheduleNotificationAsync({
    content: { title: 'Moodly', body: "Comment tu te sens aujourd'hui ? Quelques secondes pour le dire." },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 10, minute: 0, channelId: 'daily' },
  });
  await AsyncStorage.setItem(ID_KEY, id);
  return true;
}
