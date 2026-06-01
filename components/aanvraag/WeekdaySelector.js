import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SPACING } from '../theme/tokens';

const WEEKDAYS = [
  { short: 'Ma', full: 'Maandag' },
  { short: 'Di', full: 'Dinsdag' },
  { short: 'Wo', full: 'Woensdag' },
  { short: 'Do', full: 'Donderdag' },
  { short: 'Vr', full: 'Vrijdag' },
  { short: 'Za', full: 'Zaterdag' },
  { short: 'Zo', full: 'Zondag' },
];

export default function WeekdaySelector({ value = [], onChange }) {
  function toggle(short) {
    onChange(value.includes(short) ? value.filter((d) => d !== short) : [...value, short]);
  }

  return (
    <View style={styles.row} accessibilityRole="group" accessibilityLabel="Selecteer beschikbare dagen">
      {WEEKDAYS.map(({ short, full }) => {
        const checked = value.includes(short);
        return (
          <Pressable
            key={short}
            onPress={() => toggle(short)}
            style={[styles.chip, checked && styles.chipSelected]}
            accessibilityRole="checkbox"
            accessibilityState={{ checked }}
            accessibilityLabel={full}
          >
            <Text style={[styles.chipText, checked && styles.chipTextSelected]}>{short}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  chip: {
    flex: 1,
    minHeight: 44,
    borderRadius: RADIUS.pill,
    borderWidth: 1.5,
    borderColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: COLORS.brand,
  },
  chipText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.brand,
  },
  chipTextSelected: {
    color: COLORS.textInverse,
  },
});
