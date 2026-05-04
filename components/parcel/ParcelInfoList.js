import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONTS, SPACING } from '../theme/tokens';

function InfoItem({ title, text }) {
  return (
    <View style={styles.itemRow}>
      <View style={styles.dot} />
      <Text style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        {` ${text}`}
      </Text>
    </View>
  );
}

export default function ParcelInfoList({
  items = [
    { title: 'Opgepast:', text: 'hond aanwezig' },
    { title: 'Toegang:', text: 'Via zijpoort' },
    { title: 'Verwachting eigenaar:', text: 'Geen pesticides' },
  ],
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Extra informatie</Text>
      <View style={styles.list}>
        {items.map((item) => (
          <InfoItem key={`${item.title}-${item.text}`} title={item.title} text={item.text} />
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
