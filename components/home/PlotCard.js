import { Fragment, useState } from 'react';
import { Dimensions, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  CloudIcon,
  DropIcon,
  HeartIcon,
  LeafIcon,
  LightbulbIcon,
  LightningIcon,
  MapPinIcon,
  PlantIcon,
  SunIcon,
  WrenchIcon,
} from 'phosphor-react-native';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SHADOWS, SPACING } from '../theme/tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const PLOT_CARD = {
  cardWidth: SCREEN_WIDTH - SPACING.screenX * 2 - 28,
  imageHeight: 185,
  carouselGap: SPACING.md,
  cardPadding: 8,  // retained for HomeScreen statusChip positioning: top/left = cardPadding + badgeInset
  badgeInset: 8,   // retained for HomeScreen statusChip positioning
};

const VOORZIENING_ICONS = {
  Water: DropIcon,
  'Stromend water': DropIcon,
  Materiaal: WrenchIcon,
  Gereedschap: WrenchIcon,
  Elektriciteit: LightningIcon,
  Verlichting: LightbulbIcon,
  Schaduw: CloudIcon,
  Zonlicht: SunIcon,
  Zaden: PlantIcon,
  Planten: PlantIcon,
};

function getVoorzieningIcon(name) {
  return VOORZIENING_ICONS[name] || LeafIcon;
}

function PlotCardBadges({ location, isFavorited, onToggleFavorite, showFavoriteButton }) {
  return (
    <>
      <View style={styles.locationBadge}>
        <MapPinIcon size={11} color={COLORS.textPrimary} weight="regular" />
        <Text style={styles.locationText} numberOfLines={1}>
          {location || 'Locatie onbekend'}
        </Text>
      </View>

      {showFavoriteButton && (
        <Pressable
          onPress={(e) => { e.stopPropagation(); onToggleFavorite?.(); }}
          hitSlop={8}
          style={styles.heartWrap}
          accessibilityRole="button"
          accessibilityLabel={isFavorited ? 'Verwijder uit opgeslagen' : 'Sla op'}
          accessibilityState={{ selected: isFavorited }}
        >
          <HeartIcon
            size={22}
            color={isFavorited ? COLORS.negative : COLORS.surface}
            weight={isFavorited ? 'fill' : 'regular'}
          />
        </Pressable>
      )}
    </>
  );
}

export default function PlotCard({ plot, onPress, isFavorited = false, onToggleFavorite, showFavoriteButton = true }) {
  const [imageError, setImageError] = useState(false);
  const imageSource = typeof plot.image === 'string' ? { uri: plot.image } : plot.image;
  const hasImage = plot.image != null && plot.image !== '';
  const canShowImage = hasImage && !imageError;

  const voorzieningen = plot.voorzieningen || plot.chips || [];
  const visibleVoorzieningen = voorzieningen.slice(0, 2);
  const overflowCount = voorzieningen.length - visibleVoorzieningen.length;

  const cardLabel = [plot.title, plot.location, plot.size].filter(Boolean).join(', ');

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={cardLabel}
      accessibilityHint="Tik om perceel details te bekijken"
    >
      <View style={styles.imageWrap}>
        {canShowImage ? (
          <Image
            source={imageSource}
            style={styles.image}
            resizeMode="cover"
            accessibilityLabel={`Foto van ${plot.title}`}
            onError={(e) => {
              console.warn('Image failed to load:', imageSource, e.nativeEvent);
              setImageError(true);
            }}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <LeafIcon
              size={34}
              color={COLORS.brand}
              weight="regular"
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
            <Text style={styles.placeholderText}>Foto niet beschikbaar</Text>
          </View>
        )}

        <PlotCardBadges
          location={plot.location}
          isFavorited={isFavorited}
          onToggleFavorite={onToggleFavorite}
          showFavoriteButton={showFavoriteButton}
        />
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            {plot.title}
          </Text>
          {plot.size && <Text style={styles.size}>{plot.size}</Text>}
        </View>

        {voorzieningen.length > 0 && (
          <>
            <View style={styles.divider} />
            <View style={styles.voorzieningenRow}>
              {visibleVoorzieningen.map((v, index) => {
                const Icon = getVoorzieningIcon(v);
                return (
                  <Fragment key={`${plot.id}-${v}-${index}`}>
                    <View style={styles.voorzieningItem}>
                      <Icon size={16} color={COLORS.textSecondary} weight="regular" />
                      <Text style={styles.voorzieningLabel}>{v}</Text>
                    </View>
                    {index < visibleVoorzieningen.length - 1 && (
                      <View style={styles.voorzieningDivider} />
                    )}
                  </Fragment>
                );
              })}

              {overflowCount > 0 && (
                <>
                  <View style={styles.voorzieningDivider} />
                  <Text style={styles.voorzieningOverflow}>+ {overflowCount} meer</Text>
                </>
              )}
            </View>
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: PLOT_CARD.cardWidth,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  cardPressed: {
    opacity: 0.88,
  },
  imageWrap: {
    width: '100%',
    height: PLOT_CARD.imageHeight,
    backgroundColor: COLORS.surfaceMuted,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  placeholderText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    lineHeight: 13,
    fontFamily: FONTS.body,
  },
  locationBadge: {
    position: 'absolute',
    bottom: SPACING.md,
    left: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.pill,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    maxWidth: '70%',
  },
  locationText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
  },
  heartWrap: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    width: 32,
    height: 32,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  body: {
    backgroundColor: COLORS.surface,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  title: {
    flex: 1,
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
  },
  size: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.dividerSoft,
    marginHorizontal: SPACING.md,
  },
  voorzieningenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    gap: SPACING.sm,
  },
  voorzieningItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  voorzieningLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  voorzieningDivider: {
    width: 1,
    height: 14,
    backgroundColor: COLORS.border,
  },
  voorzieningOverflow: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
});
