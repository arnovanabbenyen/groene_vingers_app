import { Fragment, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LeafIcon, MapPinIcon } from 'phosphor-react-native';
import FavoriteHeartButton from '../parcel/FavoriteHeartButton';
import AmenityIcon from './AmenityIcon';
import RequestStatusBadge from '../parcel/RequestStatusBadge';
import { getAanvraagStatusMeta } from '../../services/aanvraagStatus';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SHADOWS, SPACING } from '../theme/tokens';

export default function MapPerceelCard({ perceel, onPress, isFavorited = false, onToggleFavorite, requestStatus = null }) {
  const [imageError, setImageError] = useState(false);
  const imageUrl = perceel.fotos?.[0];
  const hasImage = imageUrl && !imageError;
  const allAmenities = perceel.voorzieningen || [];
  const hasOverflow = allAmenities.length > 3;
  const amenities = allAmenities.slice(0, hasOverflow ? 2 : 3);
  const overflowCount = allAmenities.length - amenities.length;
  const requestStatusLabel = getAanvraagStatusMeta(requestStatus)?.label;

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${perceel.naam}, ${perceel.plaats || 'locatie onbekend'}${requestStatusLabel ? `, ${requestStatusLabel}` : ''}`}
      accessibilityHint="Tik voor meer details"
    >
      <View style={styles.imageWrap}>
        {hasImage ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            onError={() => setImageError(true)}
            accessibilityElementsHidden
          />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <LeafIcon size={32} color={COLORS.brand} weight="regular" accessibilityElementsHidden />
          </View>
        )}

        {requestStatus ? (
          <View style={styles.requestBadgeRow}>
            <RequestStatusBadge status={requestStatus} />
          </View>
        ) : null}

        <View style={styles.badgeRow}>
          <View style={styles.locationPill}>
            <MapPinIcon size={13} color={COLORS.textPrimary} weight="regular" accessibilityElementsHidden />
            <Text style={styles.pillText} numberOfLines={1}>
              {perceel.plaats || 'Locatie niet beschikbaar'}
            </Text>
          </View>
        </View>

        <View style={styles.heartBtn}>
          <FavoriteHeartButton isFavorited={isFavorited} onToggle={onToggleFavorite} size="small" />
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{perceel.naam}</Text>
          {perceel.grootte != null && (
            <Text style={styles.size}>{perceel.grootte}m²</Text>
          )}
        </View>

        {perceel.beschrijving ? (
          <Text style={styles.description} numberOfLines={3}>{perceel.beschrijving}</Text>
        ) : null}

        {amenities.length > 0 && (
          <>
            <View style={styles.divider} />
            <View style={styles.amenityRow}>
              {amenities.map((label, i) => (
                <Fragment key={label}>
                  {i > 0 && <View style={styles.amenityLineDivider} />}
                  <View style={styles.amenityItem}>
                    <AmenityIcon label={label} size={15} />
                    <Text style={styles.amenityText} numberOfLines={1}>{label}</Text>
                  </View>
                </Fragment>
              ))}

              {overflowCount > 0 && (
                <>
                  <View style={styles.amenityLineDivider} />
                  <View style={styles.amenityItem}>
                    <Text style={styles.amenityOverflow}>+{overflowCount}</Text>
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
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    marginHorizontal: SPACING.screenX,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.dividerSoft,
    ...SHADOWS.card,
  },
  pressed: { opacity: 0.85 },
  imageWrap: {
    width: '100%',
    height: 201,
    backgroundColor: COLORS.surfaceMuted,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    position: 'absolute',
    bottom: SPACING.sm,
    left: SPACING.sm,
    right: SPACING.sm,
    flexDirection: 'row',
  },
  requestBadgeRow: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    maxWidth: '70%',
  },
  pillText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
  },
  heartBtn: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
  },
  body: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  title: {
    flex: 1,
    fontFamily: FONTS.displayMedium,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
  },
  size: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  description: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.dividerSoft,
  },
  amenityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  amenityLineDivider: {
    width: 1,
    height: 14,
    backgroundColor: COLORS.border,
  },
  amenityItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  amenityText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    flexShrink: 1,
  },
  amenityOverflow: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
});
