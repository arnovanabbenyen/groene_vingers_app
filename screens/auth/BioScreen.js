import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { ArrowLeft } from 'phosphor-react-native';
import { COLORS, FONTS, SPACING } from '../../components/theme/tokens';
import AuthButton from '../../components/buttons/AuthButton';
import AuthTextArea from '../../components/auth/AuthTextArea';
import { supabase } from '../../services/supabase';

export default function BioScreen({ onBack, onContinue, userId }) {
  const [bio, setBio] = useState('');
  const [updating, setUpdating] = useState(false);

  async function handleSubmit() {
    const trimmed = bio.trim();

    if (!trimmed || !userId || !supabase) {
      // No bio entered, or no session — just move on
      onContinue?.();
      return;
    }

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ bio: trimmed })
        .eq('id', userId);

      if (error) throw error;

      onContinue?.();
    } catch (err) {
      Alert.alert('Bio opslaan mislukt', err.message || 'Probeer het opnieuw.');
    } finally {
      setUpdating(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Pressable style={styles.backButton} onPress={onBack} accessibilityRole="button">
          <ArrowLeft size={20} color={COLORS.textPrimary} weight="regular" />
          <Text style={styles.backText}>Terug</Text>
        </Pressable>

        <Pressable
          onPress={onContinue}
          accessibilityRole="button"
          hitSlop={8}
          disabled={updating}
        >
          <Text style={styles.skipText}>Overslaan</Text>
        </Pressable>
      </View>

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

      <View style={styles.footer}>
        <AuthButton
          label={updating ? 'Bezig...' : 'Volgende'}
          onPress={handleSubmit}
          variant="primary"
          loading={updating}
          disabled={updating}
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
    marginTop: 39,
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
    paddingBottom: SPACING.lg,
    marginTop: 'auto',
  },
});
