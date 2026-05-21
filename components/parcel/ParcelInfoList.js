import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONTS, SPACING } from '../theme/tokens';

function InfoItem({ raw }) {
  const colonIndex = raw.indexOf(':');
  const hasLabel = colonIndex > 0 && colonIndex < raw.length - 1;

  if (hasLabel) {
    const title = raw.slice(0, colonIndex + 1);
    const value = raw.slice(colonIndex + 1).trim();

    return (
      <View style={styles.itemRow}>
        <View style={styles.dot} />
        <Text style={styles.text}>
          <Text style={styles.title}>{title}</Text>
          {` ${value}`}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.itemRow}>
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
    fontSize: 20,
    lineHeight: 22,
    fontFamily: FONTS.displaySemiBold,
    fontWeight: '900',
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
    fontSize: 16,
    lineHeight: 24,
    fontFamily: FONTS.body,
    fontWeight: '400',
  },
  title: {
    fontFamily: FONTS.bodyMedium,
    fontWeight: '500',
  },
});
