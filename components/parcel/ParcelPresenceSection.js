import { StyleSheet, Text, View } from 'react-native';
import { DropIcon, PlantIcon, ShovelIcon } from 'phosphor-react-native';
import { COLORS, FONTS, SPACING } from '../theme/tokens';

const ICONS = {
  water: DropIcon,
  material: ShovelIcon,
  seeds: PlantIcon,
};

function PresenceItem({ icon, label }) {
  const IconComponent = icon;

  return (
    <View style={styles.item}>
      <View style={styles.iconCircle}>
        <IconComponent size={22} color={COLORS.textInverse} weight="regular" />
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

export default function ParcelPresenceSection({
  items = [
    { icon: ICONS.water, label: 'Water' },
    { icon: ICONS.material, label: 'Materiaal' },
    { icon: ICONS.seeds, label: 'Zaden' },
  ],
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Aanwezig</Text>
      <View style={styles.row}>
        {items.map((item) => (
          <PresenceItem key={item.label} icon={item.icon} label={item.label} />
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
    fontSize: 20,
    lineHeight: 22,
    fontFamily: FONTS.displaySemiBold,
    fontWeight: '900',
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
    fontSize: 14,
    lineHeight: 16,
    fontFamily: FONTS.bodyMedium,
    fontWeight: '600',
    textAlign: 'center',
  },
});
