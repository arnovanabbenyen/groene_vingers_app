import { Pressable, StyleSheet } from 'react-native';
import { HeartIcon } from 'phosphor-react-native';
import { COLORS, RADIUS } from '../theme/tokens';

export default function FavoriteHeartButton({ isFavorited, onToggle, size = 'small', noBackground = false }) {
  const dim = size === 'large' ? 44 : 34;
  const iconSize = size === 'large' ? 30 : 24;

  return (
    <Pressable
      onPress={(e) => { e.stopPropagation(); onToggle?.(); }}
      hitSlop={8}
      style={({ pressed }) => [
        styles.button,
        { width: dim, height: dim, borderRadius: RADIUS.pill },
        noBackground && styles.buttonTransparent,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={isFavorited ? 'Verwijder uit opgeslagen' : 'Sla op'}
      accessibilityState={{ selected: isFavorited }}
    >
      <HeartIcon
        size={iconSize}
        weight={isFavorited ? 'fill' : 'regular'}
        color={isFavorited ? COLORS.negative : COLORS.textSecondary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonTransparent: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  pressed: {
    opacity: 0.75,
  },
});
