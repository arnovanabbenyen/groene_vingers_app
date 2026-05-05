import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING } from '../theme/tokens';

export default function RoleOptionCard({ title, subtitle, icon, selected, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.card, selected && styles.cardSelected]}>
      <View style={styles.iconWrap}>{icon}</View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    minHeight: 168,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(54,57,43,0.12)',
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardSelected: {
    borderColor: COLORS.brand,
    backgroundColor: 'rgba(87,98,56,0.04)',
  },
  iconWrap: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  title: {
    fontFamily: FONTS.displaySemiBold,
    color: COLORS.textPrimary,
    fontSize: 16,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: FONTS.body,
    color: COLORS.textSecondary,
    fontSize: 12.8,
    textAlign: 'center',
  },
});
