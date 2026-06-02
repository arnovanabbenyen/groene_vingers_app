import { useEffect, useMemo, useState } from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MapPinIcon, RulerIcon, UserCircleIcon, LeafIcon } from 'phosphor-react-native';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SPACING } from '../theme/tokens';
import FavoriteHeartButton from './FavoriteHeartButton';

const HERO_HEIGHT = 201;
const HERO_WIDTH = Dimensions.get('window').width - (SPACING.screenX * 2);

function StatCard({ value, label, valueSuffix }) {
  return (
    <View
      style={styles.statCard}
      accessibilityRole="text"
      accessibilityLabel={`${label}: ${value}${valueSuffix ?? ''}`}
    >
      <View style={styles.statValueRow}>
        <Text style={styles.statValue} accessibilityElementsHidden>
          {value}
          {valueSuffix ? <Text style={styles.statValueSuffix}>{valueSuffix}</Text> : null}
        </Text>
      </View>
      <Text style={styles.statLabel} accessibilityElementsHidden>{label}</Text>
    </View>
  );
}

export default function ParcelOverviewSection({
  fotos,
  fallbackImage,
  title,
  location,
  distance,
  ownerName,
  size,
  stats = [],
  onFavoritePress,
  isFavorited = false,
  showFavoriteButton = false,
}) {
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [failedPhotoIndexes, setFailedPhotoIndexes] = useState({});

  const photoSources = useMemo(() => {
    const basePhotos = Array.isArray(fotos) ? fotos.filter(Boolean) : [];
    if (basePhotos.length > 0) return basePhotos;
    if (fallbackImage) return [fallbackImage];
    return [];
  }, [fotos, fallbackImage]);

  useEffect(() => {
    setActivePhotoIndex(0);
    setFailedPhotoIndexes({});
  }, [photoSources.length]);

  function handleScrollEnd(event) {
    const slideWidth = event.nativeEvent.layoutMeasurement.width;
    const offset = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offset / slideWidth);
    setActivePhotoIndex(newIndex);
  }

  function handleImageError(index) {
    setFailedPhotoIndexes((current) => ({ ...current, [index]: true }));
  }

  const hasPhotos = photoSources.length > 0;
  const showDots = photoSources.length > 1;

  return (
    <View style={styles.container}>
      <View style={styles.contentBlock}>
        <View style={styles.heroBlock}>
          {hasPhotos ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleScrollEnd}
              style={styles.carousel}
              contentContainerStyle={styles.carouselContent}
              accessibilityRole="adjustable"
            >
              {photoSources.map((photo, index) => {
                const source = typeof photo === 'string' ? { uri: photo } : photo;
                const isFailed = failedPhotoIndexes[index];

                return (
                  <View key={`photo-${index}`} style={styles.slide}>
                    {isFailed ? (
                      <View style={[styles.slideImage, styles.heroPlaceholder]}>
                        <LeafIcon size={40} color={COLORS.brand} weight="regular" />
                      </View>
                    ) : (
                      <Image
                        source={source}
                        style={styles.slideImage}
                        resizeMode="cover"
                        onError={() => handleImageError(index)}
                        accessibilityLabel={`Foto ${index + 1} van ${photoSources.length} van het perceel`}
                      />
                    )}
                  </View>
                );
              })}
            </ScrollView>
          ) : (
            <View style={[styles.heroImage, styles.heroPlaceholder]}>
              <LeafIcon size={40} color={COLORS.brand} weight="regular" />
            </View>
          )}

          {showDots ? (
            <View style={styles.paginationRow} accessibilityElementsHidden>
              {photoSources.map((_, index) => (
                <View
                  key={`dot-${index}`}
                  style={[styles.paginationDot, index === activePhotoIndex && styles.paginationDotActive]}
                />
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>
          {showFavoriteButton && (
            <FavoriteHeartButton
              isFavorited={isFavorited}
              onToggle={onFavoritePress}
              size="large"
              noBackground
            />
          )}
        </View>

        <View style={styles.metaRow}>
          <View style={styles.pill}>
            <MapPinIcon size={14} color={COLORS.brand} weight="regular" />
            <Text style={styles.pillText}>{location}</Text>
          </View>
          {distance ? (
            <>
              <View style={styles.dotSeparator} />
              <Text style={styles.metaText}>{distance}</Text>
            </>
          ) : null}
          {size ? (
            <>
              <View style={styles.dotSeparator} />
              <View style={styles.pill}>
                <RulerIcon size={14} color={COLORS.brand} weight="regular" />
                <Text style={styles.pillText}>{size}</Text>
              </View>
            </>
          ) : null}
          {ownerName ? (
            <>
              <View style={styles.dotSeparator} />
              <View style={styles.pill}>
                <UserCircleIcon size={14} color={COLORS.brand} weight="regular" />
                <Text style={styles.pillText}>{ownerName}</Text>
              </View>
            </>
          ) : null}
        </View>
      </View>

      {stats.length > 0 ? (
        <View style={styles.statsRow}>
          {stats.map((stat) => (
            <StatCard
              key={stat.label}
              value={stat.value}
              label={stat.label}
              valueSuffix={stat.valueSuffix}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.lg,
  },
  contentBlock: {
    gap: SPACING.md,
  },
  heroBlock: {
    alignItems: 'center',
  },
  heroImage: {
    width: HERO_WIDTH,
    height: HERO_HEIGHT,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  },
  carousel: {
    width: HERO_WIDTH,
    height: HERO_HEIGHT,
    borderRadius: RADIUS.sm,
  },
  carouselContent: {
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  },
  slide: {
    width: HERO_WIDTH,
    height: HERO_HEIGHT,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceMuted,
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
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
    paddingRight: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.xxxl,
    lineHeight: 30,
    fontFamily: FONTS.displaySemiBold,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: -SPACING.xs,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface,
  },
  pillText: {
    color: COLORS.brand,
    fontSize: FONT_SIZES.sm,
    lineHeight: 16,
    fontFamily: FONTS.body,
  },
  metaText: {
    color: COLORS.brand,
    fontSize: FONT_SIZES.sm,
    lineHeight: 16,
    fontFamily: FONTS.body,
  },
  dotSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.accent,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.dividerSoft,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statValue: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    lineHeight: 18,
    fontFamily: FONTS.displayBold,
    textAlign: 'center',
  },
  statValueSuffix: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    lineHeight: 18,
    fontFamily: FONTS.displayBold,
  },
  statLabel: {
    marginTop: SPACING.xxs,
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    lineHeight: 16,
    fontFamily: FONTS.body,
    textAlign: 'center',
  },
});
