import { Pressable, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '../theme/tokens';

const ROLE_CARD = {
  iconSize: 24,
  borderRadius: 6,
  borderWidth: 1.5,
  iconColor: '#36392B',
  subtitleColor: '#7B845F',
  variants: {
    unselected: {
      background: '#FDFBF7',
      borderColor: '#B5B8A7',
    },
    selected: {
      background: '#EAF0D8',
      borderColor: '#576238',
    },
  },
};

export default function RoleCard({ role, selected, onPress }) {
  const variant = selected ? ROLE_CARD.variants.selected : ROLE_CARD.variants.unselected;
  const IconComponent = role.icon;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={role.title}
      accessibilityHint={role.subtitle}
      style={[
        styles.card,
        {
          backgroundColor: variant.background,
          borderColor: variant.borderColor,
        },
      ]}
    >
      <IconComponent
        size={ROLE_CARD.iconSize}
        color={ROLE_CARD.iconColor}
        weight="regular"
      />
      <Text style={styles.title}>{role.title}</Text>
      <Text style={styles.subtitle}>{role.subtitle}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    minHeight: 165,
    borderRadius: ROLE_CARD.borderRadius,
    borderWidth: ROLE_CARD.borderWidth,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
    gap: SPACING.md,
  },
  title: {
    fontFamily: FONTS.displayMedium,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: ROLE_CARD.subtitleColor,
    textAlign: 'center',
  },
});
