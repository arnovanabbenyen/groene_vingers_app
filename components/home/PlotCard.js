import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { DropIcon, LeafIcon, MapPinIcon, ShovelIcon, PlantIcon, TreeIcon } from 'phosphor-react-native';
import { COLORS, FONTS, RADIUS, SHADOWS } from '../theme/tokens';
import FavoriteHeartButton from '../parcel/FavoriteHeartButton';

export const PLOT_CARD = {
  cardWidth: 266,
  imageHeight: 167,
  metaCenterWidth: 99,
  badgeLocationMinHeight: 29,
  badgeRatingMinHeight: 27,
  favoriteSize: 19,
  metaDividerHeight: 18,
  cardPadding: 8,
  cardGap: 10,
  titleGap: 8,
  metaGap: 4,
  pillGap: 4,
  badgeInset: 8,
  dividerSpacing: 8,
};

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

function PlotCardBadges({ location, isFavorited, onToggleFavorite, showFavoriteButton }) {
  return (
    <>
      <View style={styles.badgesRow}>
        <View style={[styles.pill, styles.locationPill]}>
          <MapPinIcon size={18} color={COLORS.textPrimary} weight="regular" />
          <Text style={styles.pillText} numberOfLines={1}>
            {location || 'Locatie nog niet beschikbaar'}
          </Text>
        </View>
      </View>
      {showFavoriteButton && (
        <View style={styles.heartButton}>
          <FavoriteHeartButton
            isFavorited={isFavorited}
            onToggle={onToggleFavorite}
            size="small"
          />
        </View>
      )}
    </>
  );
}

export default function PlotCard({ plot, onPress, isFavorited = false, onToggleFavorite, showFavoriteButton = true }) {
  const [imageError, setImageError] = useState(false);
  const imageSource = typeof plot.image === 'string' ? { uri: plot.image } : plot.image;
  const hasImage = plot.image != null && plot.image !== '';
  const canShowImage = hasImage && !imageError;
  const amenities = (plot.chips || []).slice(0, 4);

  const cardLabel = [plot.title, plot.location, plot.size]
    .filter(Boolean)
    .join(', ');

  return (
    <Pressable
      style={styles.card}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={cardLabel}
      accessibilityHint="Tik om perceel details te bekijken"
    >
      <View style={styles.imageWrap}>
        {canShowImage ? (
          <View style={styles.image}>
            <Image
              source={imageSource}
              style={styles.imageEl}
              onError={(e) => {
                console.warn('Image failed to load:', imageSource, e.nativeEvent);
                setImageError(true);
              }}
            />
            <PlotCardBadges
              location={plot.location}
              isFavorited={isFavorited}
              onToggleFavorite={onToggleFavorite}
              showFavoriteButton={showFavoriteButton}
            />
          </View>
        ) : (
          <View style={[styles.image, styles.placeholderImage]}>
            <View style={styles.placeholderContent}>
              <LeafIcon
                size={34}
                color={COLORS.brand}
                weight="regular"
                accessibilityElementsHidden
                importantForAccessibility="no"
              />
              <Text style={styles.placeholderText}>Foto niet beschikbaar</Text>
            </View>
            <PlotCardBadges
              location={plot.location}
              isFavorited={isFavorited}
              onToggleFavorite={onToggleFavorite}
              showFavoriteButton={showFavoriteButton}
            />
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
    width: PLOT_CARD.cardWidth,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.background,
    padding: PLOT_CARD.cardPadding,
    gap: PLOT_CARD.cardGap,
    ...SHADOWS.card,
  },
  imageWrap: {
    width: '100%',
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: PLOT_CARD.imageHeight,
    position: 'relative',
  },
  imageEl: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
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
    left: PLOT_CARD.badgeInset,
    right: PLOT_CARD.badgeInset,
    bottom: PLOT_CARD.badgeInset,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pill: {
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: PLOT_CARD.pillGap,
    paddingHorizontal: PLOT_CARD.badgeInset,
    paddingVertical: PLOT_CARD.metaGap,
  },
  locationPill: {
    minHeight: PLOT_CARD.badgeLocationMinHeight,
    maxWidth: '68%',
  },
  pillText: {
    color: COLORS.textPrimary,
    fontSize: 12.8,
    lineHeight: 13,
    fontFamily: FONTS.body,
  },
  heartButton: {
    position: 'absolute',
    right: PLOT_CARD.badgeInset,
    top: PLOT_CARD.badgeInset,
    width: PLOT_CARD.favoriteSize,
    height: PLOT_CARD.favoriteSize,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: PLOT_CARD.favoriteSize / 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: PLOT_CARD.titleGap,
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
    paddingTop: PLOT_CARD.metaGap,
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
    height: PLOT_CARD.metaDividerHeight,
    backgroundColor: COLORS.border,
    marginLeft: 10,
  },
});
