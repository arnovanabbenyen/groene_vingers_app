import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { COLORS, FONTS, SPACING } from '../../components/theme/tokens';
import AuthButton from '../../components/buttons/AuthButton';

export default function PasswordResetSentScreen({ email, onBack, onResend }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>E-mail verstuurd!</Text>

      <Text style={styles.message}>
        We hebben een reset-link gestuurd naar <Text style={styles.email}>{email}</Text>. Controleer ook je spammap.
      </Text>

      <View style={styles.footer}>
        <AuthButton label="Terug naar login" variant="primary" onPress={onBack} />
        <View style={styles.resendRow}>
          <Text style={styles.resendText}>Geen e-mail ontvangen? </Text>
          <Pressable onPress={onResend}>
            <Text style={styles.resendLink}>Opnieuw versturen</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.screenX,
    paddingTop: 120,
    alignItems: 'center',
  },
  title: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 25,
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  message: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginHorizontal: 10,
    lineHeight: 22,
  },
  email: {
    fontFamily: FONTS.bodyMedium,
    color: COLORS.textPrimary,
  },
  footer: {
    marginTop: 80,
    width: '100%',
  },
  resendRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  resendLink: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 16,
    color: COLORS.textPrimary,
    textDecorationLine: 'underline',
  },
});
