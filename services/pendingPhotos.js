import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'gv:pendingPhotos';

export async function savePendingPhotos({ profilePhotoUri, coverPhotoUri, userId }) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ profilePhotoUri, coverPhotoUri, userId }));
  } catch (err) {
    console.warn('savePendingPhotos failed', err);
  }
}

export async function readPendingPhotos() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn('readPendingPhotos failed', err);
    return null;
  }
}

export async function clearPendingPhotos() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('clearPendingPhotos failed', err);
  }
}
