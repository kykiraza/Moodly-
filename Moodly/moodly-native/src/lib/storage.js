// 💾 Stockage sur le téléphone.
// - SecureStore (chiffré par le système) pour la session et son token ;
// - AsyncStorage pour le reste (journal d'humeurs, préférences).
// Sur le web (pour tester dans le navigateur), SecureStore n'existe pas → AsyncStorage.
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const secure = Platform.OS !== 'web';

export const secureStore = {
  get: (key) => (secure ? SecureStore.getItemAsync(key) : AsyncStorage.getItem(key)),
  set: (key, value) => (secure ? SecureStore.setItemAsync(key, value) : AsyncStorage.setItem(key, value)),
  remove: (key) => (secure ? SecureStore.deleteItemAsync(key) : AsyncStorage.removeItem(key)),
};

export async function readJSON(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export const writeJSON = (key, value) => AsyncStorage.setItem(key, JSON.stringify(value));
export const removeKey = (key) => AsyncStorage.removeItem(key);
