import { Text, View } from 'react-native';
import { StarIcon } from 'phosphor-react-native';
import { COLORS, FONTS } from '../theme/tokens';

export default function StarRatingDisplay({ average, count, size = 16, showCount = true }) {
  if (average == null) {
    return showCount ? (
      <Text style={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.textMuted }}>
        Nog geen reviews
      </Text>
    ) : null;
  }

  const rounded = Math.round(average);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ flexDirection: 'row', gap: 2 }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon
            key={star}
            size={size}
            color={star <= rounded ? '#FFB800' : '#D9D9D9'}
            weight={star <= rounded ? 'fill' : 'regular'}
          />
        ))}
      </View>
      <Text style={{ fontFamily: FONTS.bodyMedium, fontSize: 13, color: COLORS.textPrimary }}>
        {average.toFixed(1)}
      </Text>
      {showCount && (
        <Text style={{ fontFamily: FONTS.body, fontSize: 12, color: COLORS.textSecondary }}>
          ({count})
        </Text>
      )}
    </View>
  );
}
