import { Pressable, StyleSheet, View } from 'react-native';
import { StarIcon } from 'phosphor-react-native';

const STAR_FILLED_COLOR = '#FFB800';
const STAR_EMPTY_COLOR = '#D9D9D9';

export default function StarRatingInput({ value = 0, onChange, size = 38 }) {
  return (
    <View
      style={styles.row}
      accessibilityRole="adjustable"
      accessibilityLabel={`Beoordeling: ${value} van 5 sterren`}
      accessibilityValue={{ min: 0, max: 5, now: value }}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable
          key={star}
          onPress={() => onChange?.(star)}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={`${star} ster${star > 1 ? 'ren' : ''}`}
          accessibilityState={{ selected: star <= value }}
        >
          <StarIcon
            size={size}
            color={star <= value ? STAR_FILLED_COLOR : STAR_EMPTY_COLOR}
            weight={star <= value ? 'fill' : 'regular'}
          />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
});
