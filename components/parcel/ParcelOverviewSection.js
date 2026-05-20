import { useState } from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { HeartStraightIcon } from '../../node_modules/phosphor-react-native/lib/commonjs/icons/HeartStraight.js';
import { MapPinIcon } from '../../node_modules/phosphor-react-native/lib/commonjs/icons/MapPin.js';
import { StarIcon } from '../../node_modules/phosphor-react-native/lib/commonjs/icons/Star.js';
import { UserCircleIcon } from '../../node_modules/phosphor-react-native/lib/commonjs/icons/UserCircle.js';
import { LeafIcon } from '../../node_modules/phosphor-react-native/lib/commonjs/icons/Leaf.js';
import { COLORS, FONTS, RADIUS, SPACING } from '../theme/tokens';

function StatCard({ value, label, valueSuffix, showStar }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statValueRow}>
        <Text style={styles.statValue}>
          {value}
          {valueSuffix ? <Text style={styles.statValueSuffix}>{valueSuffix}</Text> : null}
        </Text>
        {showStar ? <StarIcon size={11} color={COLORS.accent} weight="fill" /> : null}
      </View>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function ParcelOverviewSection({
  heroImage,
  title,
  location,
  distance,
  ownerName,
  stats = [
    { value: '30', valueSuffix: 'm²', label: 'Grootte' },
    { value: 'Nu vrij', label: 'Beschikbaar' },
    { value: '4.5', label: 'Score' },
  ],
  onFavoritePress,
}) {
  const [imageError, setImageError] = useState(false);
  const heroImageSource = typeof heroImage === 'string' ? { uri: heroImage } : heroImage;
  const canShowHeroImage = Boolean(heroImageSource?.uri) && !imageError;

  return (
    <View style={styles.container}>
      <View style={styles.contentBlock}>
        <View style={styles.heroBlock}>
          {canShowHeroImage ? (
            <ImageBackground
              source={heroImageSource}
              style={styles.heroImage}
              imageStyle={styles.heroImageRounded}
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={[styles.heroImage, styles.heroPlaceholder]}>
              <LeafIcon size={40} color={COLORS.brand} weight="regular" />
            </View>
          )}
          <View style={styles.paginationRow}>
            <View style={[styles.paginationDot, styles.paginationDotActive]} />
            <View style={styles.paginationDot} />
            <View style={styles.paginationDot} />
          </View>
        </View>

        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>
          <Pressable style={styles.favoriteButton} onPress={onFavoritePress} hitSlop={8}>
            <HeartStraightIcon size={24} color={COLORS.textPrimary} weight="regular" />
          </Pressable>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.pill}>
            <MapPinIcon size={16} color={COLORS.brand} weight="regular" />
            <Text style={styles.pillText}>{location}</Text>
          </View>
          {distance ? (
            <>
              <View style={styles.dotSeparator} />
              <Text style={styles.metaText}>{distance}</Text>
            </>
          ) : null}
          {ownerName ? (
            <>
              <View style={styles.dotSeparator} />
              <View style={styles.pill}>
                <UserCircleIcon size={16} color={COLORS.brand} weight="regular" />
                <Text style={styles.pillText}>{ownerName}</Text>
              </View>
            </>
          ) : null}
        </View>
      </View>

      <View style={styles.statsRow}>
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            value={stat.value}
            label={stat.label}
            valueSuffix={stat.valueSuffix}
            showStar={stat.label === 'Score'}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 26,
  },
  contentBlock: {
    gap: SPACING.md,
  },
  heroBlock: {
    alignItems: 'center',
  },
  heroImage: {
    width: '100%',
    height: 201,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  },
  heroPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceMuted,
  },
  heroImageRounded: {
    borderRadius: RADIUS.sm,
  },
  paginationRow: {
    marginTop: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.surfaceMuted,
  },
  paginationDotActive: {
    width: 16,
    backgroundColor: COLORS.brand,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
    paddingRight: 12,
    color: COLORS.textPrimary,
    fontSize: 25,
    lineHeight: 25,
    fontFamily: FONTS.displaySemiBold,
    fontWeight: '600',
  },
  favoriteButton: {
    paddingTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: -SPACING.xs,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface,
  },
  pillText: {
    color: COLORS.brand,
    fontSize: 12.8,
    lineHeight: 13,
    fontFamily: FONTS.body,
    fontWeight: '400',
  },
  metaText: {
    color: COLORS.brand,
    fontSize: 12.8,
    lineHeight: 13,
    fontFamily: FONTS.body,
    fontWeight: '400',
  },
  dotSeparator: {
    width: 5,
    height: 5,
    borderRadius: 5,
    backgroundColor: COLORS.accent,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  statCard: {
    width: 120,
    height: 63,
    borderWidth: 1,
    borderColor: COLORS.textPrimary,
    borderRadius: 10,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    color: COLORS.textPrimary,
    fontSize: 14,
    lineHeight: 14,
    fontFamily: FONTS.displayBold,
    fontWeight: '700',
    textAlign: 'center',
  },
  statValueSuffix: {
    color: COLORS.textPrimary,
    fontSize: 14,
    lineHeight: 14,
    fontFamily: FONTS.displayBold,
    fontWeight: '700',
  },
  statLabel: {
    marginTop: 4,
    color: COLORS.textPrimary,
    fontSize: 12.8,
    lineHeight: 13,
    fontFamily: FONTS.body,
    fontWeight: '400',
    textAlign: 'center',
  },
});
