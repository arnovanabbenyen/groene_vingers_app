import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

const STORAGE_KEY = 'gv:pendingPhotos';

async function copyToPermanent(uri, name) {
  if (!uri) return null;
  try {
    const ext = uri.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
    const dest = `${FileSystem.documentDirectory}gv_pending_${name}.${ext}`;
    await FileSystem.copyAsync({ from: uri, to: dest });
    return dest;
  } catch (err) {
    console.warn(`copyToPermanent(${name}) failed`, err);
    return uri; // fall back to original — may still work if file is still around
  }
}

async function deletePermanent(uri) {
  if (!uri || !uri.startsWith(FileSystem.documentDirectory)) return;
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch { /* ignore */ }
}

export async function savePendingPhotos({ profilePhotoUri, coverPhotoUri, userId }) {
  try {
    const [safeProfile, safeCover] = await Promise.all([
      copyToPermanent(profilePhotoUri, 'avatar'),
      copyToPermanent(coverPhotoUri, 'cover'),
    ]);
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ profilePhotoUri: safeProfile, coverPhotoUri: safeCover, userId }),
    );
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
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const { profilePhotoUri, coverPhotoUri } = JSON.parse(raw);
      await Promise.all([deletePermanent(profilePhotoUri), deletePermanent(coverPhotoUri)]);
    }
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('clearPendingPhotos failed', err);
  }
}
