import { StyleSheet, Text, View } from 'react-native';
import { DropIcon, PlantIcon, ShovelIcon, RecycleIcon, TreeIcon } from 'phosphor-react-native';
import { COLORS, FONT_SIZES, FONTS, SPACING } from '../theme/tokens';

const ICON_MAP = {
  Water: DropIcon,
  Tools: ShovelIcon,
  Materiaal: ShovelIcon,
  Zaden: PlantIcon,
  Compost: RecycleIcon,
  Bomen: TreeIcon,
};

function PresenceItem({ label }) {
  const IconComponent = ICON_MAP[label] || DropIcon;

  return (
    <View
      style={styles.item}
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      <View style={styles.iconCircle}>
        <IconComponent size={22} color={COLORS.textInverse} weight="regular" accessibilityElementsHidden />
      </View>
      <Text style={styles.label} accessibilityElementsHidden>{label}</Text>
    </View>
  );
}

export default function ParcelPresenceSection({ voorzieningen = [] }) {
  if (!voorzieningen || voorzieningen.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Aanwezig</Text>
      <View style={styles.row}>
        {voorzieningen.map((label, index) => (
          <PresenceItem key={`${label}-${index}`} label={label} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.md,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.xl,
    lineHeight: 22,
    fontFamily: FONTS.displaySemiBold,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
    alignItems: 'center',
  },
  item: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    lineHeight: 16,
    fontFamily: FONTS.bodyMedium,
    textAlign: 'center',
  },
});
