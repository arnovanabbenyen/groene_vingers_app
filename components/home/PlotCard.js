import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { HeartIcon } from '../../node_modules/phosphor-react-native/lib/commonjs/icons/Heart.js';
import { DropIcon } from '../../node_modules/phosphor-react-native/lib/commonjs/icons/Drop.js';
import { MapPinIcon } from '../../node_modules/phosphor-react-native/lib/commonjs/icons/MapPin.js';
import { MapTrifoldIcon } from '../../node_modules/phosphor-react-native/lib/commonjs/icons/MapTrifold.js';
import { ShovelIcon } from '../../node_modules/phosphor-react-native/lib/commonjs/icons/Shovel.js';
import { StarIcon } from '../../node_modules/phosphor-react-native/lib/commonjs/icons/Star.js';
import { COLORS, FONTS, LAYOUT, RADIUS, SHADOWS, SIZES } from '../theme/tokens';

export default function PlotCard({ plot, onPress }) {
  const imageSource = typeof plot.image === 'string' ? { uri: plot.image } : plot.image;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <ImageBackground source={imageSource} style={styles.image} imageStyle={styles.imageRounded}>
        <View style={styles.badgesRow}>
          <View style={[styles.pill, styles.locationPill]}>
            <MapPinIcon size={18} color={COLORS.textPrimary} weight="regular" />
            <Text style={styles.pillText}>{plot.location}</Text>
          </View>
          <View style={[styles.pill, styles.ratingPill]}>
            <StarIcon size={16} color={COLORS.textPrimary} weight="regular" />
            <Text style={styles.pillText}>{plot.rating}</Text>
          </View>
        </View>
        <Pressable style={styles.heartButton}>
          <HeartIcon size={19} color={COLORS.textInverse} weight="regular" />
        </Pressable>
      </ImageBackground>

      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={1}>
          {plot.title}
        </Text>
        <Text style={styles.size}>{plot.size}</Text>
      </View>

      <View style={styles.metaRow}>
        {plot.chips.map((chip, index) => (
          <View
            key={`${plot.id}-${chip}`}
            style={[
              styles.metaItem,
              index === 1 && styles.metaItemCenter,
              index === 2 && styles.metaItemEnd,
            ]}
          >
            {index === 2 ? (
              <MapTrifoldIcon size={18} color={COLORS.textPrimary} weight="regular" />
            ) : index === 1 ? (
              <ShovelIcon size={18} color={COLORS.textPrimary} weight="regular" />
            ) : (
              <DropIcon size={18} color={COLORS.textPrimary} weight="regular" />
            )}
            <Text style={styles.metaText}>{chip}</Text>
            {index < plot.chips.length - 1 ? <View style={styles.metaDivider} /> : null}
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
  image: {
    height: SIZES.plotCardImageHeight,
    overflow: 'hidden',
    padding: LAYOUT.plot.badgeInset,
  },
  imageRounded: {
    borderRadius: RADIUS.sm,
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
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontFamily: FONTS.displayMedium,
    fontWeight: '500',
    flex: 1,
    marginRight: LAYOUT.plot.titleGap,
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
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LAYOUT.plot.metaGap,
    flex: 1,
  },
  metaItemCenter: {
    justifyContent: 'center',
    flex: 0,
    width: SIZES.plotCardMetaCenterWidth,
  },
  metaItemEnd: {
    justifyContent: 'flex-end',
  },
  metaText: {
    color: COLORS.textPrimary,
    fontSize: 12.8,
    lineHeight: 13,
    fontFamily: FONTS.body,
  },
  metaDivider: {
    marginLeft: LAYOUT.plot.dividerSpacing,
    width: 1,
    height: SIZES.plotMetaDividerHeight,
    backgroundColor: COLORS.border,
  },
});
