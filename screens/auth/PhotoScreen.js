import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft } from 'phosphor-react-native';
import { COLORS, FONTS, SPACING } from '../../components/theme/tokens';
import AuthButton from '../../components/buttons/AuthButton';
import PhotoPickerCircle from '../../components/auth/PhotoPickerCircle';

export default function PhotoScreen({ onBack, onContinue, onSkip }) {
  const [imageUri, setImageUri] = useState(null);

  async function pickFromLibrary() {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Toegang nodig', 'Geef toegang tot je fotobibliotheek om een afbeelding te kiezen.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setImageUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Galerij kon niet openen', 'Probeer het opnieuw.');
    }
  }

  async function takePhoto() {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Toegang nodig', 'Geef camera-toegang om een nieuwe foto te nemen.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setImageUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Camera kon niet openen', 'Probeer het opnieuw.');
    }
  }

  function handlePhotoButtonPress() {
    Alert.alert('Foto toevoegen', 'Kies hoe je een foto wilt toevoegen.', [
      { text: 'Foto nemen', onPress: takePhoto },
      { text: 'Kies uit galerij', onPress: pickFromLibrary },
      imageUri ? { text: 'Verwijder foto', style: 'destructive', onPress: () => setImageUri(null) } : null,
      { text: 'Annuleer', style: 'cancel' },
    ].filter(Boolean));
  }

  return (
    <View style={styles.container}>
      <View
        style={styles.progressTrack}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel="Stap 2 van 4"
        accessibilityValue={{ min: 0, max: 4, now: 2 }}
      >
        {[1,2,3,4].map(s => (
          <View key={s} style={[styles.progressSegment, s <= 2 && styles.progressSegmentFill]} />
        ))}
      </View>
      <View style={styles.headerRow}>
        <Pressable style={styles.backButton} onPress={onBack} accessibilityRole="button">
          <ArrowLeft size={20} color={COLORS.textPrimary} weight="regular" />
          <Text style={styles.backText}>Terug</Text>
        </Pressable>

        <Pressable onPress={onSkip} accessibilityRole="button" hitSlop={8}>
          <Text style={styles.skipText}>Overslaan</Text>
        </Pressable>
      </View>

      <View style={styles.copy}>
        <Text style={styles.title}>Voeg een foto toe</Text>
        <Text style={styles.subtitle}>
          Voeg een duidelijke foto van jezelf toe, zodat mensen jou direct kunnen herkennen.
        </Text>
      </View>

      <View style={styles.pickerWrap}>
        <PhotoPickerCircle
          imageUri={imageUri}
          onPress={handlePhotoButtonPress}
          onDelete={imageUri ? () => setImageUri(null) : undefined}
        />
      </View>

      <View style={styles.footer}>
        <AuthButton
          label="Volgende"
          onPress={() => onContinue?.(imageUri)}
          variant="primary"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.screenX,
    paddingTop: 67,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  backText: {
    fontFamily: FONTS.displayMedium,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  skipText: {
    fontFamily: FONTS.displayMedium,
    fontSize: 16,
    color: COLORS.brand,
    textDecorationLine: 'underline',
    textDecorationColor: COLORS.brand,
  },
  progressTrack:       { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', gap: 3, height: 3 },
  progressSegment:     { flex: 1, height: 3, backgroundColor: 'rgba(181,184,167,0.35)' },
  progressSegmentFill: { backgroundColor: '#576238' },
  copy: {
    marginTop: 42,
  },
  title: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 20,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 12.8,
    lineHeight: 18,
    color: COLORS.textSecondary,
  },
  pickerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingBottom: 24,
  },
  footer: {
    paddingBottom: SPACING.lg,
  },
});
