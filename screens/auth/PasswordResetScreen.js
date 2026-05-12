import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ScrollView } from 'react-native';
import { ArrowLeft, EnvelopeSimple } from 'phosphor-react-native';
import { COLORS, FONTS, SPACING } from '../../components/theme/tokens';
import AuthButton from '../../components/buttons/AuthButton';
import AuthTextField from '../../components/auth/AuthTextField';
import { supabase } from '../../services/supabase';

export default function PasswordResetScreen({ onBack }) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  async function handleSendReset() {
    if (!email) {
      Alert.alert('E-mailadres invullen', 'Voer je e-mailadres in om je wachtwoord opnieuw in te stellen.');
      return;
    }

    try {
      setIsLoading(true);

      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) {
        throw error;
      }

      setIsEmailSent(true);
      Alert.alert(
        'Reset-link verstuurd',
        'Controleer je e-mail voor instructies om je wachtwoord opnieuw in te stellen.'
      );
      setTimeout(() => onBack?.(), 2000);
    } catch (resetError) {
      Alert.alert(
        'Fout bij het versturen',
        resetError.message || 'Er liep iets mis. Probeer het later opnieuw.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Pressable style={styles.backButton} onPress={onBack}>
        <ArrowLeft size={24} color={COLORS.textPrimary} weight="regular" />
        <Text style={styles.backText}>Terug</Text>
      </Pressable>

      <Text style={styles.title}>Wachtwoord vergeten?</Text>
      <Text style={styles.subtitle}>
        Voer je e-mailadres in en we sturen je een link om je wachtwoord opnieuw in te stellen.
      </Text>

      <AuthTextField
        label="E-mailadres"
        value={email}
        onChangeText={setEmail}
        placeholder="jouw@email.be"
        keyboardType="email-address"
        autoCapitalize="none"
        icon={<EnvelopeSimple size={18} color={COLORS.border} weight="regular" />}
      />

      <View style={styles.footer}>
        <AuthButton
          label="Stuur reset-link"
          onPress={handleSendReset}
          variant="primary"
          disabled={isLoading || isEmailSent}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: SPACING.screenX,
    paddingTop: 72,
    paddingBottom: SPACING.lg,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  backText: {
    fontFamily: FONTS.displayMedium,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  title: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 20,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 12.8,
    color: COLORS.textMuted,
    marginBottom: 32,
    lineHeight: 18,
  },
  footer: {
    marginTop: 48,
  },
});
