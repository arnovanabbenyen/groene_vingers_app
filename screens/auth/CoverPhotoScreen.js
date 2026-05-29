import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Image as ImageIcon } from 'phosphor-react-native';
import { COLORS, FONTS, SPACING } from '../../components/theme/tokens';
import AuthButton from '../../components/buttons/AuthButton';

export default function CoverPhotoScreen({ onBack, onContinue, onSkip }) {
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
        aspect: [16, 9],
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
        aspect: [16, 9],
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
    Alert.alert('Omslagfoto toevoegen', 'Kies hoe je een foto wilt toevoegen.', [
      { text: 'Foto nemen', onPress: takePhoto },
      { text: 'Kies uit galerij', onPress: pickFromLibrary },
      imageUri ? { text: 'Verwijder foto', style: 'destructive', onPress: () => setImageUri(null) } : null,
      { text: 'Annuleer', style: 'cancel' },
    ].filter(Boolean));
  }

  return (
    <View style={styles.container}>
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
        <Text style={styles.title}>Voeg een omslagfoto toe</Text>
        <Text style={styles.subtitle}>
          Een omslagfoto maakt je profiel persoonlijker. Kies een foto van je tuin of een sfeervolle afbeelding.
        </Text>
      </View>

      <View style={styles.pickerWrap}>
        <Pressable style={styles.coverPreview} onPress={handlePhotoButtonPress} accessibilityRole="button" accessibilityLabel="Omslagfoto kiezen">
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.coverImage} resizeMode="cover" />
          ) : (
            <View style={styles.placeholder}>
              <ImageIcon size={36} color={COLORS.border} weight="regular" />
              <Text style={styles.placeholderText}>Tik om een foto te kiezen</Text>
            </View>
          )}
        </Pressable>
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
    justifyContent: 'center',
    paddingVertical: 24,
  },
  coverPreview: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  placeholderText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  footer: {
    paddingBottom: SPACING.lg,
  },
});
