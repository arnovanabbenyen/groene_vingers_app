import { Pressable, StyleSheet, View } from 'react-native';
import { StarIcon } from 'phosphor-react-native';
import { COLORS } from '../theme/tokens';

export default function StarRatingInput({ value = 0, onChange, size = 38 }) {
  return (
    <View
      style={styles.row}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={`Beoordeling: ${value} van 5 sterren`}
      accessibilityValue={{ min: 1, max: 5, now: value || 1 }}
      accessibilityHint="Swipe omhoog of omlaag om de beoordeling aan te passen"
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'increment') onChange?.(Math.min(5, (value || 0) + 1));
        if (event.nativeEvent.actionName === 'decrement') onChange?.(Math.max(1, (value || 1) - 1));
      }}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable
          key={star}
          onPress={() => onChange?.(star)}
          hitSlop={8}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={({ pressed }) => pressed && styles.pressed}
        >
          <StarIcon
            size={size}
            color={star <= value ? COLORS.star : COLORS.starEmpty}
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
    gap: 10,
  },
  pressed: {
    opacity: 0.65,
  },
});
