import { Pressable, Text, StyleSheet } from 'react-native';
import { ROLE_CARD, FONTS, FONT_SIZES } from '../theme/tokens';

export default function RoleCard({ role, selected, onPress }) {
  const variant = selected ? ROLE_CARD.variants.selected : ROLE_CARD.variants.unselected;
  const IconComponent = role.icon;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${role.title}: ${role.subtitle}`}
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
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 16,
    ...ROLE_CARD.cardShadow,
  },
  title: {
    fontFamily: FONTS.displayMedium,
    fontSize: FONT_SIZES.lg,
    color: '#36392B',
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: ROLE_CARD.subtitleColor,
    textAlign: 'center',
  },
});
