import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { ArrowLeft } from 'phosphor-react-native';
import { COLORS, FONTS, SPACING } from '../../components/theme/tokens';
import AuthButton from '../../components/buttons/AuthButton';
import PhotoPickerCircle from '../../components/auth/PhotoPickerCircle';

export default function PhotoScreen({ onBack, onContinue, onSkip }) {
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
        <Text style={styles.title}>Voeg een foto toe</Text>
        <Text style={styles.subtitle}>
          Voeg een duidelijke foto van jezelf toe, zodat mensen jou direct kunnen herkennen.
        </Text>
      </View>

      <View style={styles.pickerWrap}>
        <PhotoPickerCircle onPress={onContinue} />
      </View>

      <View style={styles.footer}>
        <AuthButton label="Volgende" onPress={onContinue} variant="primary" />
        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Al een account? </Text>
          <Pressable onPress={onSkip}>
            <Text style={styles.loginLink}>Inloggen</Text>
          </Pressable>
        </View>
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingBottom: 24,
  },
  footer: {
    paddingBottom: SPACING.lg,
  },
  loginRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  loginLink: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
});
