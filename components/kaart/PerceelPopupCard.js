import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LeafIcon, MapPinIcon, XIcon } from 'phosphor-react-native';
import FavoriteHeartButton from '../parcel/FavoriteHeartButton';
import AmenityIcon from './AmenityIcon';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SHADOWS, SPACING } from '../theme/tokens';

export default function PerceelPopupCard({ perceel, onClose, onOpen, isFavorited = false, onToggleFavorite }) {
  const [imageError, setImageError] = useState(false);
  const imageUrl = perceel.fotos?.[0];
  const hasImage = imageUrl && !imageError;
  const amenities = (perceel.voorzieningen || []).slice(0, 3);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`Open perceel ${perceel.naam}`}
      accessibilityHint="Tik voor alle details van dit perceel"
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

        <View style={styles.locationPill}>
          <MapPinIcon size={13} color={COLORS.textPrimary} weight="regular" accessibilityElementsHidden />
          <Text style={styles.locationText} numberOfLines={1}>{perceel.plaats}</Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
          onPress={onClose}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Sluit perceel kaartje"
        >
          <XIcon size={12} color={COLORS.textPrimary} weight="bold" />
        </Pressable>

        <View style={styles.heartBtn}>
          <FavoriteHeartButton isFavorited={isFavorited} onToggle={onToggleFavorite} size="small" />
        </View>
      </View>

      <View style={styles.content}>
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
          <View style={styles.amenityRow}>
            {amenities.map((label, i) => (
              <View key={label} style={styles.amenityCell}>
                {i > 0 && <View style={styles.amenityDivider} />}
                <View style={styles.amenityItem}>
                  <AmenityIcon label={label} />
                  <Text style={styles.amenityText}>{label}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  pressed: { opacity: 0.92 },
  imageWrap: {
    height: 180,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationPill: {
    position: 'absolute',
    bottom: SPACING.sm,
    left: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    maxWidth: '65%',
  },
  locationText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
  },
  closeBtn: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 28,
    height: 28,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnPressed: { opacity: 0.7 },
  heartBtn: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
  },
  content: {
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
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  description: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  amenityRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.dividerSoft,
    paddingTop: SPACING.sm,
  },
  amenityCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  amenityDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: COLORS.dividerSoft,
    marginRight: SPACING.xs,
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
  },
});
