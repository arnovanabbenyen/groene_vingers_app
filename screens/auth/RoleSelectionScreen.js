import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RoleCard from '../../components/auth/RoleCard';
import { ROLES } from '../../components/auth/roles.config';
import { COLORS, FONTS, FONT_SIZES, RADIUS, SPACING } from '../../components/theme/tokens';

export default function RoleSelectionScreen({ onContinue, onLogin }) {
  const insets = useSafeAreaInsets();
  const [selectedRoleId, setSelectedRoleId] = useState(null);

  const canContinue = selectedRoleId !== null;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 24 }]}>
      <View style={styles.content}>
        <Text style={styles.title} accessibilityRole="header">Wie ben jij?</Text>
        <Text style={styles.subtitle}>Kies jouw rol. Je kunt dit later aanpassen.</Text>

        <View
          style={styles.cards}
          accessibilityRole="radiogroup"
          accessibilityLabel="Kies jouw rol"
        >
          {ROLES.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              selected={selectedRoleId === role.id}
              onPress={() => setSelectedRoleId(role.id)}
            />
          ))}
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        <Pressable
          onPress={() => canContinue && onContinue?.(selectedRoleId)}
          disabled={!canContinue}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canContinue }}
          accessibilityLabel="Volgende"
          accessibilityHint={!canContinue ? 'Kies eerst een rol om door te gaan' : undefined}
          style={[styles.button, !canContinue && styles.buttonDisabled]}
        >
          <Text style={[styles.buttonText, !canContinue && styles.buttonTextDisabled]}>Volgende</Text>
        </Pressable>

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Al een account? </Text>
          <Pressable onPress={onLogin} hitSlop={8} accessibilityRole="link">
            <Text style={styles.loginLink}>Inloggen</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.screenX,
  },
  content: {
    flex: 1,
  },
  title: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 20,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: 48,
  },
  cards: {
    gap: 24,
  },
  footer: {
    paddingTop: 12,
    gap: 12,
  },
  button: {
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: COLORS.surfaceMuted,
  },
  buttonText: {
    fontFamily: FONTS.displayMedium,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textInverse,
  },
  buttonTextDisabled: {
    color: COLORS.textSecondary,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
  },
  loginLink: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
  },
});
