import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING } from '../../components/theme/tokens';
import AuthButton from '../../components/buttons/AuthButton';
import AuthProgressBar from '../../components/auth/AuthProgressBar';
import AuthStepHeader from '../../components/auth/AuthStepHeader';
import AuthTextArea from '../../components/auth/AuthTextArea';

const MAX_BIO = 300;

export default function BioScreen({ onBack, onContinue, isSubmitting, initialBio = '' }) {
  const insets = useSafeAreaInsets();
  const [bio, setBio] = useState(initialBio);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AuthProgressBar step={4} totalSteps={4} />
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AuthStepHeader
            onBack={() => onBack?.(bio)}
            onSkip={() => onContinue?.('')}
            skipDisabled={isSubmitting}
          />
          <View style={styles.copy}>
            <Text style={styles.title}>Schrijf iets over jezelf</Text>
            <Text style={styles.subtitle}>
              Vertel iets over jezelf, je interesse in tuinieren en wat je hoopt te vinden.
            </Text>
          </View>
          <AuthTextArea
            value={bio}
            onChangeText={setBio}
            placeholder="Ik hoop iets dichtbij te vinden, want..."
            maxLength={MAX_BIO}
            autoCapitalize="sentences"
            editable={!isSubmitting}
            accessibilityLabel="Biografie"
            accessibilityHint="Vertel iets over jezelf en je interesse in tuinieren"
          />
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, SPACING.lg) }]}>
          <AuthButton
            label="Account aanmaken"
            onPress={() => onContinue?.(bio.trim())}
            variant="primary"
            loading={isSubmitting}
            disabled={isSubmitting}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  kav: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.screenX,
    paddingTop: 0,
    paddingBottom: 24,
  },
  copy: {
    marginTop: 32,
    marginBottom: 24,
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
  footer: {
    paddingHorizontal: SPACING.screenX,
    paddingTop: 12,
    backgroundColor: COLORS.surface,
  },
});
