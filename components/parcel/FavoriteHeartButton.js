import { Pressable, StyleSheet } from 'react-native';
import { HeartIcon } from 'phosphor-react-native';
import { COLORS, SHADOWS } from '../theme/tokens';

export default function FavoriteHeartButton({ isFavorited, onToggle, size = 'small' }) {
  const dim = size === 'large' ? 44 : 36;
  const iconSize = size === 'large' ? 22 : 18;

  return (
    <Pressable
      onPress={(e) => { e.stopPropagation(); onToggle?.(); }}
      hitSlop={8}
      style={[styles.button, { width: dim, height: dim, borderRadius: dim / 2 }]}
      accessibilityRole="button"
      accessibilityLabel={isFavorited ? 'Verwijder uit opgeslagen' : 'Sla op'}
      accessibilityState={{ selected: isFavorited }}
    >
      <HeartIcon
        size={iconSize}
        weight={isFavorited ? 'fill' : 'regular'}
        color={isFavorited ? '#E53935' : COLORS.textSecondary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.card,
  },
});
