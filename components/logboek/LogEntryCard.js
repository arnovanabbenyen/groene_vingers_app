import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { NotebookIcon } from 'phosphor-react-native';
import { COLORS, FONTS, RADIUS, SPACING } from '../theme/tokens';

const THUMB_SIZE = 50;
const ACCENT_WIDTH = 3;

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' });
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
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.82 }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Logboekvermelding ${dateLabel}: ${preview}`}
    >
      <View style={styles.accent} />
      <View style={styles.body}>
        <View style={styles.textCol}>
          <Text style={styles.date}>{dateLabel}</Text>
          <Text style={styles.description} numberOfLines={2}>{preview}</Text>
        </View>
        {thumb ? (
          <Image source={{ uri: thumb }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]}>
            <NotebookIcon size={20} color={COLORS.brand} weight="regular" />
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F7F7F5',
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  accent: {
    width: ACCENT_WIDTH,
    backgroundColor: COLORS.brand,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  textCol: {
    flex: 1,
    gap: 4,
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
    color: COLORS.textSecondary,
    lineHeight: 17,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: RADIUS.sm,
  },
  thumbPlaceholder: {
    backgroundColor: COLORS.surfaceBrand,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
