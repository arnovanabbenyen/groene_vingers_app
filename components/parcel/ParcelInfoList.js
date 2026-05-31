import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT_SIZES, FONTS, SPACING } from '../theme/tokens';

function InfoItem({ raw }) {
  const colonIndex = raw.indexOf(':');
  const hasLabel = colonIndex > 0 && colonIndex < raw.length - 1;

  if (hasLabel) {
    const title = raw.slice(0, colonIndex + 1);
    const value = raw.slice(colonIndex + 1).trim();

    return (
      <View style={styles.itemRow} accessibilityRole="text">
        <View style={styles.dot} />
        <Text style={styles.text}>
          <Text style={styles.title}>{title}</Text>
          {` ${value}`}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.itemRow} accessibilityRole="text">
      <View style={styles.dot} />
      <Text style={styles.text}>{raw}</Text>
    </View>
  );
}

export default function ParcelInfoList({ items = [] }) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Extra informatie</Text>
      <View style={styles.list}>
        {items.map((raw, index) => (
          <InfoItem key={`${raw}-${index}`} raw={raw} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.md,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.xl,
    lineHeight: 22,
    fontFamily: FONTS.displaySemiBold,
  },
  list: {
    gap: SPACING.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 5,
    backgroundColor: COLORS.accent,
  },
  text: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.lg,
    lineHeight: 24,
    fontFamily: FONTS.body,
  },
  title: {
    fontFamily: FONTS.bodyMedium,
  },
});
