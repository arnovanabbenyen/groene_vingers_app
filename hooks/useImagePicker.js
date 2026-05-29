import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export function useImagePicker({ aspect = [1, 1], sheetTitle = 'Foto toevoegen', initialUri = null } = {}) {
  const [imageUri, setImageUri] = useState(initialUri);

  const pickFromLibrary = useCallback(async () => {
    try {
      const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!granted) {
        Alert.alert('Toegang nodig', 'Geef toegang tot je fotobibliotheek om een afbeelding te kiezen.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect,
        quality: 0.9,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        setImageUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Galerij kon niet openen', 'Probeer het opnieuw.');
    }
  }, [aspect]);

  const takePhoto = useCallback(async () => {
    try {
      const { granted } = await ImagePicker.requestCameraPermissionsAsync();
      if (!granted) {
        Alert.alert('Toegang nodig', 'Geef camera-toegang om een nieuwe foto te nemen.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect,
        quality: 0.9,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        setImageUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Camera kon niet openen', 'Probeer het opnieuw.');
    }
  }, [aspect]);

  const openSheet = useCallback(() => {
    Alert.alert(sheetTitle, 'Kies hoe je een foto wilt toevoegen.', [
      { text: 'Foto nemen', onPress: takePhoto },
      { text: 'Kies uit galerij', onPress: pickFromLibrary },
      imageUri
        ? { text: 'Verwijder foto', style: 'destructive', onPress: () => setImageUri(null) }
        : null,
      { text: 'Annuleer', style: 'cancel' },
    ].filter(Boolean));
  }, [sheetTitle, takePhoto, pickFromLibrary, imageUri]);

  return { imageUri, openSheet };
}
