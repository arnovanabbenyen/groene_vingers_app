import { useState } from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { HeartIcon } from '../../node_modules/phosphor-react-native/lib/commonjs/icons/Heart.js';
import { DropIcon } from '../../node_modules/phosphor-react-native/lib/commonjs/icons/Drop.js';
import { LeafIcon } from '../../node_modules/phosphor-react-native/lib/commonjs/icons/Leaf.js';
import { MapPinIcon } from '../../node_modules/phosphor-react-native/lib/commonjs/icons/MapPin.js';
import { ShovelIcon } from '../../node_modules/phosphor-react-native/lib/commonjs/icons/Shovel.js';
import { StarIcon } from '../../node_modules/phosphor-react-native/lib/commonjs/icons/Star.js';
import { PlantIcon } from '../../node_modules/phosphor-react-native/lib/commonjs/icons/Plant.js';
import { TreeIcon } from '../../node_modules/phosphor-react-native/lib/commonjs/icons/Tree.js';
import { COLORS, FONTS, LAYOUT, RADIUS, SHADOWS, SIZES } from '../theme/tokens';

function AmenityIcon({ label }) {
  const normalized = (label || '').toLowerCase();

  if (normalized.includes('water') || normalized.includes('drop')) {
    return <DropIcon size={14} color={COLORS.textPrimary} weight="regular" />;
  }

  if (normalized.includes('tool') || normalized.includes('shovel') || normalized.includes('materiaal')) {
    return <ShovelIcon size={14} color={COLORS.textPrimary} weight="regular" />;
  }

  if (normalized.includes('zaden') || normalized.includes('plant')) {
    return <PlantIcon size={14} color={COLORS.textPrimary} weight="regular" />;
  }

  if (normalized.includes('boom') || normalized.includes('tree')) {
    return <TreeIcon size={14} color={COLORS.textPrimary} weight="regular" />;
  }

  return <LeafIcon size={14} color={COLORS.textPrimary} weight="regular" />;
}

export default function PlotCard({ plot, onPress }) {
  const [imageError, setImageError] = useState(false);
  const imageSource = typeof plot.image === 'string' ? { uri: plot.image } : plot.image;
  const canShowImage = Boolean(imageSource?.uri) && !imageError;
  const amenities = (plot.chips || []).slice(0, 4);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.imageWrap}>
        {canShowImage ? (
          <ImageBackground
            source={imageSource}
            style={styles.image}
            imageStyle={styles.imageRounded}
            onError={() => setImageError(true)}
          >
            <View style={styles.badgesRow}>
              <View style={[styles.pill, styles.locationPill]}>
                <MapPinIcon size={18} color={COLORS.textPrimary} weight="regular" />
                <Text style={styles.pillText} numberOfLines={1}>
                  {plot.location || 'Locatie nog niet beschikbaar'}
                </Text>
              </View>

              <View style={[styles.pill, styles.ratingPill]}>
                <StarIcon size={16} color={COLORS.textPrimary} weight="fill" />
                <Text style={styles.pillText}>4.5</Text>
              </View>
            </View>

            <Pressable style={styles.heartButton}>
              <HeartIcon size={19} color={COLORS.textPrimary} weight="regular" />
            </Pressable>
          </ImageBackground>
        ) : (
          <View style={[styles.image, styles.placeholderImage]}>
            <View style={styles.placeholderContent}>
              <LeafIcon size={34} color={COLORS.brand} weight="regular" />
              <Text style={styles.placeholderText}>Foto niet beschikbaar</Text>
            </View>

            <View style={styles.badgesRow}>
              <View style={[styles.pill, styles.locationPill]}>
                <MapPinIcon size={18} color={COLORS.textPrimary} weight="regular" />
                <Text style={styles.pillText} numberOfLines={1}>
                  {plot.location || 'Locatie nog niet beschikbaar'}
                </Text>
              </View>

              <View style={[styles.pill, styles.ratingPill]}>
                <StarIcon size={16} color={COLORS.textPrimary} weight="fill" />
                <Text style={styles.pillText}>4.5</Text>
              </View>
            </View>

            <Pressable style={styles.heartButton}>
              <HeartIcon size={19} color={COLORS.textPrimary} weight="regular" />
            </Pressable>
          </View>
        )}
      </View>

      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={1}>
          {plot.title}
        </Text>
        <Text style={styles.size}>{plot.size || '30m²'}</Text>
      </View>

      <View style={styles.metaRow}>
        {amenities.map((chip, index) => (
          <View key={`${plot.id}-${chip}`} style={styles.metaItem}>
            <AmenityIcon label={chip} />
            <Text style={styles.metaText}>{chip}</Text>
            {index < amenities.length - 1 ? <View style={styles.metaDivider} /> : null}
          </View>
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: SIZES.plotCardWidth,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.background,
    padding: LAYOUT.plot.cardPadding,
    gap: LAYOUT.plot.cardGap,
    ...SHADOWS.card,
  },
  imageWrap: {
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  },
  image: {
    height: SIZES.plotCardImageHeight,
    overflow: 'hidden',
    padding: LAYOUT.plot.badgeInset,
  },
  imageRounded: {
    borderRadius: RADIUS.sm,
  },
  placeholderImage: {
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  placeholderText: {
    color: COLORS.textSecondary,
    fontSize: 12.8,
    lineHeight: 13,
    fontFamily: FONTS.body,
  },
  badgesRow: {
    position: 'absolute',
    left: LAYOUT.plot.badgeInset,
    right: LAYOUT.plot.badgeInset,
    bottom: LAYOUT.plot.badgeInset,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pill: {
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: LAYOUT.plot.pillGap,
    paddingHorizontal: LAYOUT.plot.badgeInset,
    paddingVertical: LAYOUT.plot.metaGap,
  },
  locationPill: {
    minHeight: SIZES.plotBadgeLocationMinHeight,
    maxWidth: '68%',
  },
  ratingPill: {
    minHeight: SIZES.plotBadgeRatingMinHeight,
  },
  pillText: {
    color: COLORS.textPrimary,
    fontSize: 12.8,
    lineHeight: 13,
    fontFamily: FONTS.body,
  },
  heartButton: {
    position: 'absolute',
    right: LAYOUT.plot.badgeInset,
    top: LAYOUT.plot.badgeInset,
    width: SIZES.plotFavoriteSize,
    height: SIZES.plotFavoriteSize,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: SIZES.plotFavoriteSize / 2,
    backgroundColor: COLORS.surface,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: LAYOUT.plot.titleGap,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontFamily: FONTS.displayMedium,
    fontWeight: '500',
    flex: 1,
  },
  size: {
    color: COLORS.textPrimary,
    fontSize: 12.8,
    lineHeight: 13,
    fontFamily: FONTS.body,
  },
  metaRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: LAYOUT.plot.metaGap,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 10,
    marginBottom: 6,
  },
  metaText: {
    color: COLORS.textPrimary,
    fontSize: 12.8,
    lineHeight: 13,
    fontFamily: FONTS.body,
  },
  metaDivider: {
    width: 1,
    height: SIZES.plotMetaDividerHeight,
    backgroundColor: COLORS.border,
    marginLeft: 10,
  },
});
