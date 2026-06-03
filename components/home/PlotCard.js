import { Fragment, useState } from 'react';
import { Dimensions, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LeafIcon, MapPinIcon } from 'phosphor-react-native';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SHADOWS, SPACING } from '../theme/tokens';
import FavoriteHeartButton from '../parcel/FavoriteHeartButton';
import RequestStatusBadge from '../parcel/RequestStatusBadge';
import AmenityIcon from '../kaart/AmenityIcon';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const PLOT_CARD = {
  cardWidth: SCREEN_WIDTH - SPACING.screenX * 2,
  imageHeight: 185,
  carouselGap: SPACING.sm,
  cardPadding: 8,  // retained for HomeScreen statusChip positioning: top/left = cardPadding + badgeInset
  badgeInset: 8,   // retained for HomeScreen statusChip positioning
};

function PlotCardBadges({
  location,
  isFavorited,
  onToggleFavorite,
  showFavoriteButton,
  statusLabel,
  statusTone = 'active',
  requestStatus = null,
}) {
  const hasStatusBadge = !!statusLabel;

  return (
    <>
      {requestStatus ? (
        <View style={styles.requestStatusWrap}>
          <RequestStatusBadge status={requestStatus} />
        </View>
      ) : null}

      <View style={styles.locationBadge}>
        <MapPinIcon size={13} color={COLORS.textPrimary} weight="regular" />
        <Text style={styles.locationText} numberOfLines={1}>
          {location || 'Locatie onbekend'}
        </Text>
      </View>

      {hasStatusBadge ? (
        <View style={[styles.statusWrap, statusTone === 'hidden' && styles.statusWrapHidden]}>
          <Text style={[styles.statusText, statusTone === 'hidden' && styles.statusTextHidden]}>
            {statusLabel}
          </Text>
        </View>
      ) : showFavoriteButton ? (
        <View style={styles.heartWrap}>
          <FavoriteHeartButton
            isFavorited={isFavorited}
            onToggle={onToggleFavorite}
          />
        </View>
      ) : null}
    </>
  );
}

export default function PlotCard({
  plot,
  onPress,
  isFavorited = false,
  onToggleFavorite,
  showFavoriteButton = true,
  statusLabel,
  statusTone = 'active',
  requestStatus = null,
  cardWidth = PLOT_CARD.cardWidth,
}) {
  const [imageError, setImageError] = useState(false);
  const imageSource = typeof plot.image === 'string' ? { uri: plot.image } : plot.image;
  const hasImage = plot.image != null && plot.image !== '';
  const canShowImage = hasImage && !imageError;

  const voorzieningen = plot.voorzieningen || plot.chips || [];
  const hasOverflow = voorzieningen.length > 3;
  const visibleVoorzieningen = voorzieningen.slice(0, hasOverflow ? 2 : 3);
  const overflowCount = voorzieningen.length - visibleVoorzieningen.length;

  const cardLabel = [plot.title, plot.location, plot.size].filter(Boolean).join(', ');

  return (
    <Pressable
      style={({ pressed }) => [styles.card, { width: cardWidth }, pressed && !!onPress && styles.cardPressed]}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'none'}
      accessibilityLabel={cardLabel}
      accessibilityHint={onPress ? 'Tik om perceel details te bekijken' : undefined}
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
          statusLabel={statusLabel}
          statusTone={statusTone}
          requestStatus={requestStatus}
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
              {visibleVoorzieningen.map((v, index) => (
                <Fragment key={`${plot.id}-${v}-${index}`}>
                  {index > 0 && <View style={styles.voorzieningDivider} />}
                  <View style={styles.voorzieningItem}>
                    <AmenityIcon label={v} size={15} />
                    <Text style={styles.voorzieningLabel} numberOfLines={1}>{v}</Text>
                  </View>
                </Fragment>
              ))}

              {overflowCount > 0 && (
                <>
                  <View style={styles.voorzieningDivider} />
                  <View style={styles.voorzieningItem}>
                    <Text style={styles.voorzieningOverflow}>+{overflowCount}</Text>
                  </View>
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
    borderWidth: 1,
    borderColor: COLORS.dividerSoft,
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
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.pill,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
    maxWidth: '72%',
  },
  locationText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
  },
  requestStatusWrap: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    zIndex: 2,
  },
  heartWrap: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
  },
  statusWrap: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  statusWrapHidden: {
    backgroundColor: COLORS.accentSoft,
  },
  statusText: {
    color: COLORS.brand,
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.xs,
    textTransform: 'lowercase',
  },
  statusTextHidden: {
    color: COLORS.textPrimary,
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
  },
  voorzieningItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  voorzieningLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    flexShrink: 1,
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
