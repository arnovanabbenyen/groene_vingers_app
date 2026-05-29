import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING } from '../../components/theme/tokens';
import AuthButton from '../../components/buttons/AuthButton';
import AuthProgressBar from '../../components/auth/AuthProgressBar';
import AuthStepHeader from '../../components/auth/AuthStepHeader';
import AuthTextArea from '../../components/auth/AuthTextArea';

export default function BioScreen({ onBack, onContinue, isSubmitting }) {
  const insets = useSafeAreaInsets();
  const [bio, setBio] = useState('');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AuthProgressBar step={4} totalSteps={4} />
      <View style={styles.inner}>
        <AuthStepHeader
          onBack={onBack}
          onSkip={() => onContinue?.('')}
          skipDisabled={isSubmitting}
        />
        <View style={styles.copy}>
          <Text style={styles.title}>Schrijf iets over jezelf</Text>
          <Text style={styles.subtitle}>
            Vertel iets over jezelf, je interesse in tuinieren en wat je hoopt te vinden.
          </Text>
        </View>
        <View style={styles.body}>
          <AuthTextArea
            value={bio}
            onChangeText={setBio}
            placeholder="Ik hoop iets dichtbij te vinden, want..."
          />
        </View>
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, SPACING.lg) }]}>
          <AuthButton
            label="Account aanmaken"
            onPress={() => onContinue?.(bio.trim())}
            variant="primary"
            loading={isSubmitting}
            disabled={isSubmitting}
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
  body: {
    marginTop: 24,
  },
  footer: {
    paddingTop: 8,
    marginTop: 'auto',
  },
});
