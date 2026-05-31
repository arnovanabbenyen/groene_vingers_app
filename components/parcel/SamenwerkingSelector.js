import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SPACING } from '../theme/tokens';

export default function SamenwerkingSelector({ types = [], selected = [], onToggle }) {
  return (
    <View style={styles.list}>
      {types.map((type) => {
        const isSelected = selected.includes(type);
        return (
          <Pressable
            key={type}
            onPress={() => onToggle(type)}
            style={({ pressed }) => [
              styles.item,
              isSelected && styles.itemSelected,
              pressed && styles.itemPressed,
            ]}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isSelected }}
            accessibilityLabel={type}
          >
            <View style={[styles.circle, isSelected && styles.circleSelected]}>
              {isSelected ? <View style={styles.circleInner} /> : null}
            </View>
            <Text style={[styles.label, isSelected && styles.labelSelected]}>{type}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: SPACING.xs,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    minHeight: 44,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.brandOverlay,
  },
  itemSelected: {
    backgroundColor: COLORS.surfaceBrand,
  },
  itemPressed: {
    opacity: 0.8,
  },
  circle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  circleSelected: {
    borderColor: COLORS.brand,
  },
  circleInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.brand,
  },
  label: {
    flex: 1,
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  labelSelected: {
    fontFamily: FONTS.bodyMedium,
    color: COLORS.brand,
  },
});
