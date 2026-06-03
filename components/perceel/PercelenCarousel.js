import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { HouseIcon, LeafIcon, MapPinIcon, StarIcon } from 'phosphor-react-native';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../theme/tokens';
import { normalizeSize } from '../aanvraag/AanvraagCard';
import PlotCard, { PLOT_CARD } from '../home/PlotCard';

function PerceelAmenityIcon({ label }) {
  const normalized = String(label || '').toLowerCase();
  if (normalized.includes('water')) return <MapPinIcon size={14} color={COLORS.textPrimary} weight="regular" />;
  if (normalized.includes('tool') || normalized.includes('materiaal')) return <MapPinIcon size={14} color={COLORS.textPrimary} weight="regular" />;
  if (normalized.includes('zaden') || normalized.includes('plant')) return <LeafIcon size={14} color={COLORS.textPrimary} weight="regular" />;
  if (normalized.includes('boom')) return <LeafIcon size={14} color={COLORS.textPrimary} weight="regular" />;
  return <HouseIcon size={14} color={COLORS.textPrimary} weight="regular" />;
}

function PerceelCarouselCard({ perceel, onPress, ownerRating = null }) {
  const [imageError, setImageError] = useState(false);
  const firstPhoto = Array.isArray(perceel?.fotos) ? perceel.fotos[0] : null;
  const location = perceel?.plaats || 'Locatie nog niet beschikbaar';
  const title = perceel?.naam || 'Perceel';
  const size = normalizeSize(perceel?.grootte);
  const chips = Array.isArray(perceel?.voorzieningen) ? perceel.voorzieningen.filter(Boolean) : [];
  const amenities = chips.slice(0, 3);

  return (
    <Pressable
      onPress={() => onPress?.(perceel)}
      style={styles.perceelCard}
      accessibilityRole="button"
      accessibilityLabel={`Perceel ${title}`}
    >
      <View style={styles.perceelImageWrap}>
        {firstPhoto && !imageError ? (
          <Image
            source={{ uri: firstPhoto }}
            style={styles.perceelImage}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={[styles.perceelImage, styles.perceelPlaceholder]}>
            <LeafIcon size={34} color={COLORS.brand} weight="regular" />
          </View>
        )}

        <View style={styles.perceelStatusPill}>
          <Text style={styles.perceelStatusText}>actief</Text>
        </View>

        <View style={styles.perceelMetaOverlay}>
          <View style={styles.perceelLocationPill}>
            <MapPinIcon size={14} color={COLORS.textPrimary} weight="regular" />
            <Text style={styles.perceelLocationText}>{location}</Text>
          </View>
          {ownerRating != null ? (
            <View style={styles.perceelRatingPill} accessible accessibilityLabel={`Beoordeling: ${ownerRating.toFixed(1)} van 5`}>
              <StarIcon size={14} color={COLORS.star} weight="fill" accessibilityElementsHidden />
              <Text style={styles.perceelRatingText}>{ownerRating.toFixed(1)}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.perceelHeaderRow}>
        <Text style={styles.perceelTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.perceelSize}>{size}</Text>
      </View>

      <View style={styles.perceelMetaRow}>
        {amenities.map((amenity, index) => (
          <View key={`${perceel?.id || 'perceel'}-${amenity}-${index}`} style={styles.perceelMetaItem}>
            <PerceelAmenityIcon label={amenity} />
            <Text style={styles.perceelMetaText}>{amenity}</Text>
            {index < amenities.length - 1 ? <View style={styles.perceelMetaDivider} /> : null}
          </View>
        ))}
      </View>
    </Pressable>
  );
}

export function PercelenEmpty({ onAddPress }) {
  return (
    <View style={styles.percelenEmptyCard} accessible accessibilityRole="text">
      <LeafIcon size={40} color={COLORS.brand} weight="regular" />
      <Text style={styles.emptyFeatureTitle}>Nog geen percelen</Text>
      <Text style={styles.emptyFeatureSubtext}>
        Voeg je eerste perceel toe om aanvragen te ontvangen.
      </Text>
      {onAddPress ? (
        <Pressable
          onPress={onAddPress}
          style={styles.perceelAddButton}
          accessibilityRole="button"
          accessibilityLabel="Perceel toevoegen"
        >
          <Text style={styles.perceelAddButtonText}>Perceel toevoegen</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function getStatusLabel(status) {
  if (status === 'hidden') return 'verborgen';
  if (status === 'deleted') return 'verwijderd';
  return 'actief';
}

function getStatusTone(status) {
  if (status === 'hidden') return 'hidden';
  if (status === 'deleted') return 'hidden';
  return 'active';
}

export default function PercelenCarousel({ percelen, onAddPress, onPerceelPress }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!percelen || percelen.length === 0) {
    return <PercelenEmpty onAddPress={onAddPress} />;
  }

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.percelenScrollView}
        onMomentumScrollEnd={(event) => {
          const nextDot = Math.round(
            event.nativeEvent.contentOffset.x / (PLOT_CARD.cardWidth + PLOT_CARD.carouselGap),
          );
          setActiveIndex(Math.max(0, Math.min(percelen.length - 1, nextDot)));
        }}
        contentContainerStyle={styles.percelenScroller}
      >
        {percelen.map((perceel) => (
          <PlotCard
            key={perceel.id}
            plot={{
              id: perceel.id,
              image: Array.isArray(perceel?.fotos) ? perceel.fotos[0] : null,
              title: perceel?.naam || 'Perceel',
              location: perceel?.plaats || 'Locatie nog niet beschikbaar',
              size: normalizeSize(perceel?.grootte),
              voorzieningen: Array.isArray(perceel?.voorzieningen) ? perceel.voorzieningen.filter(Boolean) : [],
            }}
            onPress={() => onPerceelPress?.(perceel)}
            showFavoriteButton={false}
            statusLabel={getStatusLabel(perceel?.status)}
            statusTone={getStatusTone(perceel?.status)}
          />
        ))}
      </ScrollView>

      {percelen.length > 1 ? (
        <View style={styles.percelenDotsRow}>
          {percelen.map((perceel, index) => (
            <View
              key={`${perceel.id}-dot`}
              style={[styles.percelenDot, index === activeIndex && styles.percelenDotActive]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  percelenScrollView: {
    marginHorizontal: -SPACING.screenX,
  },
  percelenScroller: {
    gap: SPACING.sm,
    paddingHorizontal: SPACING.screenX,
    paddingBottom: SPACING.xxs,
  },
  perceelCard: {
    width: 266,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  perceelImageWrap: {
    position: 'relative',
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  },
  perceelImage: {
    width: '100%',
    height: 167,
    borderRadius: RADIUS.sm,
  },
  perceelPlaceholder: {
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  perceelStatusPill: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  perceelStatusText: {
    color: COLORS.brand,
    fontFamily: FONTS.body,
    fontSize: 12.8,
  },
  perceelMetaOverlay: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  perceelLocationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: '68%',
  },
  perceelLocationText: {
    color: COLORS.textPrimary,
    fontFamily: FONTS.body,
    fontSize: 12.8,
    flexShrink: 1,
  },
  perceelRatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  perceelRatingText: {
    color: COLORS.textPrimary,
    fontFamily: FONTS.body,
    fontSize: 12.8,
  },
  perceelHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: 8,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  perceelTitle: {
    flex: 1,
    color: COLORS.textPrimary,
    fontFamily: FONTS.displayMedium,
    fontSize: 16,
  },
  perceelSize: {
    color: COLORS.textPrimary,
    fontFamily: FONTS.body,
    fontSize: 12.8,
  },
  perceelMetaRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 4,
    paddingHorizontal: 8,
    paddingBottom: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  perceelMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 10,
    marginBottom: 6,
  },
  perceelMetaText: {
    color: COLORS.textPrimary,
    fontFamily: FONTS.body,
    fontSize: 12.8,
  },
  perceelMetaDivider: {
    width: 1,
    height: 16,
    backgroundColor: COLORS.border,
  },
  percelenEmptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    padding: SPACING.lg,
    gap: SPACING.sm,
    alignItems: 'center',
    ...SHADOWS.card,
  },
  emptyFeatureTitle: {
    color: COLORS.textPrimary,
    fontFamily: FONTS.displayMedium,
    fontSize: 16,
    textAlign: 'center',
  },
  emptyFeatureSubtext: {
    color: COLORS.textSecondary,
    fontFamily: FONTS.body,
    fontSize: 12.8,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 280,
  },
  perceelAddButton: {
    height: 44,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xs,
  },
  perceelAddButtonText: {
    color: COLORS.surface,
    fontFamily: FONTS.displayMedium,
    fontSize: 16,
  },
  percelenDotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  percelenDot: {
    width: SPACING.sm,
    height: SPACING.sm,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.indicatorMuted,
  },
  percelenDotActive: {
    backgroundColor: COLORS.brand,
    width: 24,
  },
});
