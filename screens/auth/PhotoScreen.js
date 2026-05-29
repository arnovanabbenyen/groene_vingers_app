import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING } from '../../components/theme/tokens';
import AuthButton from '../../components/buttons/AuthButton';
import AuthProgressBar from '../../components/auth/AuthProgressBar';
import AuthStepHeader from '../../components/auth/AuthStepHeader';
import PhotoPickerCircle from '../../components/auth/PhotoPickerCircle';
import { useImagePicker } from '../../hooks/useImagePicker';

export default function PhotoScreen({ onBack, onContinue, onSkip }) {
  const insets = useSafeAreaInsets();
  const { imageUri, openSheet } = useImagePicker({ aspect: [1, 1], sheetTitle: 'Foto toevoegen' });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AuthProgressBar step={2} totalSteps={4} />
      <View style={styles.inner}>
        <AuthStepHeader onBack={onBack} onSkip={onSkip} />
        <View style={styles.copy}>
          <Text style={styles.title}>Voeg een foto toe</Text>
          <Text style={styles.subtitle}>
            Voeg een duidelijke foto van jezelf toe, zodat mensen jou direct kunnen herkennen.
          </Text>
        </View>
        <View style={styles.pickerWrap}>
          <PhotoPickerCircle imageUri={imageUri} onPress={openSheet} />
        </View>
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, SPACING.lg) }]}>
          <AuthButton
            label="Volgende"
            onPress={() => onContinue?.(imageUri)}
            variant="primary"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  inner: {
    flex: 1,
    paddingHorizontal: SPACING.screenX,
  },
  copy: {
    marginTop: 32,
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
  },
  footer: {
    paddingTop: 8,
  },
});
