import { Image, StyleSheet, Text, View } from 'react-native';
import { StarIcon, UserCircleIcon } from 'phosphor-react-native';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SHADOWS, SPACING } from '../theme/tokens';

export default function ParcelOwnerCard({ ownerProfile, joinYear, rating }) {
  if (!ownerProfile) return null;

  const fullName = [ownerProfile.first_name, ownerProfile.last_name]
    .filter(Boolean)
    .join(' ')
    .trim() || 'Eigenaar';

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        {ownerProfile.avatar_url ? (
          <Image
            source={{ uri: ownerProfile.avatar_url }}
            style={styles.avatar}
            accessibilityElementsHidden
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <UserCircleIcon size={48} color={COLORS.brand} weight="regular" accessibilityElementsHidden />
          </View>
        )}
        <View style={styles.meta}>
          <Text style={styles.name}>{fullName}</Text>
          <View
            style={styles.subRow}
            accessible
            accessibilityLabel={rating != null ? `Beoordeling: ${typeof rating === 'number' ? rating.toFixed(1) : rating} van 5` : 'Nieuw profiel, nog geen beoordelingen'}
          >
            <View style={styles.ratingPill}>
              <StarIcon size={14} color="#FFB800" weight="fill" accessibilityElementsHidden />
              <Text style={styles.ratingText}>
                {rating != null ? (typeof rating === 'number' ? rating.toFixed(1) : rating) : 'Nieuw'}
              </Text>
            </View>
            {joinYear ? <View style={styles.dot} /> : null}
            {joinYear ? (
              <Text style={styles.since}>
                {joinYear >= new Date().getFullYear() ? 'Lid sinds kort' : `Lid sinds ${joinYear}`}
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      {ownerProfile.bio ? (
        <Text style={styles.quote}>{ownerProfile.bio}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: SPACING.sm,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    gap: SPACING.md,
    ...SHADOWS.card,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    flex: 1,
    gap: SPACING.xs,
  },
  name: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.xl,
    lineHeight: 22,
    fontFamily: FONTS.displaySemiBold,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xxs,
  },
  ratingText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    lineHeight: 18,
    fontFamily: FONTS.body,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.accent,
  },
  since: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    lineHeight: 18,
    fontFamily: FONTS.body,
  },
  quote: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.lg,
    lineHeight: 24,
    fontFamily: FONTS.body,
  },
});
