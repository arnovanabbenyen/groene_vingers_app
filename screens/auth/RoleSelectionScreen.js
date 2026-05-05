import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MagnifyingGlass, House } from 'phosphor-react-native';
import { COLORS, FONTS, SPACING } from '../../components/theme/tokens';
import AuthButton from '../../components/buttons/AuthButton';
import RoleOptionCard from '../../components/auth/RoleOptionCard';

export default function RoleSelectionScreen({ selectedRole, onSelectRole, onContinue, onLogin }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Wie ben jij?</Text>
      <Text style={styles.subtitle}>Kies jouw rol. Je kunt dit later aanpassen.</Text>

      <View style={styles.cards}>
        <RoleOptionCard
          title="Tuinzoeker"
          subtitle="Ik zoek een tuin om in te tuinieren"
          icon={<MagnifyingGlass size={22} color={COLORS.textPrimary} weight="regular" />}
          selected={selectedRole === 'tuinzoeker'}
          onPress={() => onSelectRole('tuinzoeker')}
        />

        <RoleOptionCard
          title="Tuineigenaar"
          subtitle="Ik wil mijn tuin delen met anderen"
          icon={<House size={22} color={COLORS.textPrimary} weight="regular" />}
          selected={selectedRole === 'tuineigenaar'}
          onPress={() => onSelectRole('tuineigenaar')}
        />
      </View>

      <View style={styles.footer}>
        <AuthButton label="Volgende" onPress={onContinue} variant="primary" />

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Al een account? </Text>
          <Pressable onPress={onLogin}>
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
    paddingTop: 84,
    paddingHorizontal: SPACING.screenX,
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
    color: COLORS.textSecondary,
    marginBottom: 48,
  },
  cards: {
    gap: 20,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 24,
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
