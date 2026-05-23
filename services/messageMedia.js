import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { decode as decodeBase64 } from 'base64-arraybuffer';
import { supabase } from './supabase';

// Returns an array of selected assets (empty array if cancelled/denied).
export async function pickFromGallery() {
  const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!granted) return [];

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.8,
    allowsEditing: false,
    allowsMultipleSelection: true,
  });

  if (result.canceled || !result.assets?.length) return [];
  return result.assets;
}

// Returns an array with one asset (empty array if cancelled/denied).
export async function pickFromCamera() {
  const { granted } = await ImagePicker.requestCameraPermissionsAsync();
  if (!granted) return [];

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: 0.8,
    allowsEditing: false,
  });

  if (result.canceled || !result.assets?.[0]) return [];
  return result.assets;
}

// Returns the public URL of the uploaded image.
export async function uploadChatImage(userId, localUri) {
  const base64Encoding = FileSystem.EncodingType?.Base64 ?? 'base64';
  const base64 = await FileSystem.readAsStringAsync(localUri, { encoding: base64Encoding });
  const arrayBuffer = decodeBase64(base64);

  if (arrayBuffer.byteLength === 0) throw new Error('Afbeelding kon niet worden gelezen (0 bytes).');

  const ext = localUri.split('.').pop()?.toLowerCase() || 'jpg';
  const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  const filePath = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('chat-media')
    .upload(filePath, arrayBuffer, { contentType: mime, upsert: false });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage.from('chat-media').getPublicUrl(filePath);
  return { publicUrl: urlData.publicUrl, mime };
}
