import React, { useMemo, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { HandshakeIcon, LeafIcon, MapPinIcon } from 'phosphor-react-native';
import AmenityIcon from '../kaart/AmenityIcon';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SHADOWS, SPACING } from '../theme/tokens';

function normalizeSize(raw) {
  if (!raw) return null;
  const s = String(raw);
  return s.includes('m²') ? s : `${s}m²`;
}

function getMetaItems(perceel) {
  const voorzieningen = Array.isArray(perceel?.voorzieningen) ? perceel.voorzieningen.filter(Boolean) : [];
  const chips = Array.isArray(perceel?.chips) ? perceel.chips.filter(Boolean) : [];
  return voorzieningen.length > 0 ? voorzieningen : chips;
}

export default function PerceelSummaryCard({ perceel }) {
  const [imageError, setImageError] = useState(false);

  const heroSource = useMemo(() => {
    const first = Array.isArray(perceel?.fotos) && perceel.fotos[0] ? perceel.fotos[0] : perceel?.image;
    return typeof first === 'string' ? { uri: first } : first ?? null;
  }, [perceel?.fotos, perceel?.image]);

  const allItems = useMemo(() => getMetaItems(perceel), [perceel]);

  const title = perceel?.title || perceel?.naam || 'Perceel';
  const location = perceel?.location || perceel?.plaats || null;
  const size = normalizeSize(perceel?.size || perceel?.grootte);
  const description = perceel?.description || perceel?.beschrijving || null;
  const showImage = Boolean(heroSource) && !imageError;
  const samenwerkingTypes = useMemo(() => {
    const raw = perceel?.voorkeur_samenwerking;
    return Array.isArray(raw) ? raw.filter(Boolean) : [];
  }, [perceel?.voorkeur_samenwerking]);

  return (
    <View style={styles.card} accessibilityLabel={`Perceel: ${title}`}>
      <View style={styles.imageWrap}>
        {showImage ? (
          <Image source={heroSource} style={styles.image} resizeMode="cover" onError={() => setImageError(true)} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <LeafIcon size={40} color={COLORS.brand} weight="regular" />
          </View>
        )}
        {location ? (
          <View style={styles.locationPill} accessibilityElementsHidden>
            <MapPinIcon size={13} color={COLORS.textPrimary} weight="regular" />
            <Text style={styles.locationText} numberOfLines={1}>{location}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">{title}</Text>
          {size ? <Text style={styles.size}>{size}</Text> : null}
        </View>

        {description ? (
          <Text style={styles.description} numberOfLines={3}>{description}</Text>
        ) : null}

        {samenwerkingTypes.length > 0 ? (
          <View style={styles.samenwerkingRow}>
            <HandshakeIcon size={14} color={COLORS.textMuted} weight="regular" accessibilityElementsHidden />
            <View style={styles.pillsWrap}>
              {samenwerkingTypes.map((type, i) => (
                <View key={`${type}-${i}`} style={styles.pill}>
                  <Text style={styles.pillText}>{type}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {allItems.length > 0 ? (
          <>
            <View style={styles.metaDivider} accessibilityElementsHidden />
            <View style={styles.metaRow} accessibilityElementsHidden>
              {allItems.map((item, i) => (
                <React.Fragment key={`${item}-${i}`}>
                  {i > 0 ? <View style={styles.divider} /> : null}
                  <View style={styles.metaItemWrap}>
                    <AmenityIcon label={item} size={18} color={COLORS.brand} />
                    <Text style={styles.metaText} numberOfLines={1}>{item}</Text>
                  </View>
                </React.Fragment>
              ))}
            </View>
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    ...SHADOWS.card,
  },
  imageWrap: {
    width: '100%',
    height: 180,
    borderTopLeftRadius: RADIUS.md,
    borderTopRightRadius: RADIUS.md,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationPill: {
    position: 'absolute',
    left: SPACING.md,
    bottom: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 11,
    paddingVertical: 6,
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
  body: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
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
    fontFamily: FONTS.displaySemiBold,
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
    fontSize: FONT_SIZES.md,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },
  samenwerkingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    flexWrap: 'wrap',
  },
  pillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  pill: {
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
  },
  pillText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  metaDivider: {
    height: 1,
    backgroundColor: COLORS.dividerSoft,
    marginTop: SPACING.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: SPACING.xs,
  },
  metaItemWrap: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  metaText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.dividerSoft,
  },
});
