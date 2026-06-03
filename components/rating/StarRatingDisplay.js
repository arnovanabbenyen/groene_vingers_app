import { StyleSheet, Text, View } from 'react-native';
import { StarIcon } from 'phosphor-react-native';
import { COLORS, FONT_SIZES, FONTS } from '../theme/tokens';

export default function StarRatingDisplay({ average, count, size = 16, showCount = true }) {
  if (average == null) {
    return showCount ? (
      <Text style={styles.noReviews}>Nog geen reviews</Text>
    ) : null;
  }

  const rounded = Math.round(average);

  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`Beoordeling: ${average.toFixed(1)} van 5${showCount && count != null ? `, ${count} reviews` : ''}`}
    >
      <View style={styles.stars} accessibilityElementsHidden>
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon
            key={star}
            size={size}
            color={star <= rounded ? COLORS.star : COLORS.starEmpty}
            weight={star <= rounded ? 'fill' : 'regular'}
          />
        ))}
      </View>
      <Text style={styles.average} accessibilityElementsHidden>{average.toFixed(1)}</Text>
      {showCount && count != null ? (
        <Text style={styles.count} accessibilityElementsHidden>({count})</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  average: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
  },
  count: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  noReviews: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
});
