import { useEffect, useMemo, useState } from 'react';
import { Dimensions, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { HeartStraightIcon, MapPinIcon, UserCircleIcon, LeafIcon } from 'phosphor-react-native';
import { COLORS, FONTS, RADIUS, SPACING } from '../theme/tokens';

const HERO_HEIGHT = 201;
const HERO_WIDTH = Dimensions.get('window').width - (SPACING.screenX * 2);

function StatCard({ value, label, valueSuffix }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statValueRow}>
        <Text style={styles.statValue}>
          {value}
          {valueSuffix ? <Text style={styles.statValueSuffix}>{valueSuffix}</Text> : null}
        </Text>
      </View>
      <Text style={styles.statLabel}>{label}</Text>
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
  stats = [
    { value: '30', valueSuffix: 'm²', label: 'Grootte' },
    { value: 'Nu vrij', label: 'Beschikbaar' },
  ],
  onFavoritePress,
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
