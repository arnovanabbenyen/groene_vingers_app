import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LeafIcon } from 'phosphor-react-native';
import { COLORS, FONTS, RADIUS, SPACING } from '../theme/tokens';

const THUMB_SIZE = 50;

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(String(dateStr));
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function LogEntryCard({ entry, onPress }) {
  const thumb = entry?.fotos?.[0] ?? null;
  const dateLabel = formatDate(entry?.logged_at);
  const preview = entry?.description
    ? entry.description.length > 80
      ? entry.description.slice(0, 80) + '…'
      : entry.description
    : 'Geen beschrijving';

  return (
    <Pressable
      style={styles.card}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Logboekvermelding ${dateLabel}: ${preview}`}
    >
      {/* Left accent bar */}
      <View style={styles.accent} />

      {/* Content row */}
      <View style={styles.content}>
        {/* Thumbnail */}
        {thumb ? (
          <Image source={{ uri: thumb }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]}>
            <LeafIcon size={20} color={COLORS.brand} weight="regular" />
          </View>
        )}

        {/* Text */}
        <View style={styles.textCol}>
          <Text style={styles.date}>{dateLabel}</Text>
          <Text style={styles.description} numberOfLines={1}>{preview}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F7F7F5',
    borderRadius: RADIUS.sm,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  accent: {
    width: 3,
    backgroundColor: COLORS.brand,
    borderRadius: 16,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: RADIUS.xs,
    flexShrink: 0,
  },
  thumbPlaceholder: {
    backgroundColor: COLORS.surfaceBrand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    gap: SPACING.sm,
  },
  date: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 20,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  description: {
    fontFamily: FONTS.body,
    fontSize: 12.8,
    color: 'rgba(0,0,0,0.6)',
    lineHeight: 16,
  },
});
