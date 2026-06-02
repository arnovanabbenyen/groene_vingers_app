import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RoleCard from '../../components/auth/RoleCard';
import { ROLES } from '../../components/auth/roles.config';
import AuthButton from '../../components/buttons/AuthButton';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '../../components/theme/tokens';

export default function RoleSelectionScreen({ onContinue, onLogin }) {
  const insets = useSafeAreaInsets();
  const [selectedRoleId, setSelectedRoleId] = useState(null);

  const canContinue = selectedRoleId !== null;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 24 }]}>
      <View style={styles.content}>
        <Text style={styles.title} accessibilityRole="header">Wie ben jij?</Text>
        <Text style={styles.subtitle}>Kies jouw rol. Je kunt dit later aanpassen.</Text>

        <View style={styles.cardsWrap}>
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
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        <AuthButton
          label="Volgende"
          onPress={() => onContinue?.(selectedRoleId)}
          variant="primary"
          disabled={!canContinue}
          accessibilityHint={!canContinue ? 'Kies eerst een rol om door te gaan' : undefined}
        />

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
  cardsWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  cards: {
    gap: 24,
  },
  footer: {
    paddingTop: 12,
    gap: 12,
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
