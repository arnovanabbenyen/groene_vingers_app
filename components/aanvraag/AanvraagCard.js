import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { BinocularsIcon, LeafIcon, StarIcon, UserCircleIcon } from 'phosphor-react-native';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SHADOWS, SPACING } from '../theme/tokens';

export function normalizeSize(size) {
  if (size == null || size === '') return '—';
  const text = String(size);
  return text.includes('m²') ? text : `${text}m²`;
}

function formatRequesterName(sender) {
  return [sender?.first_name, sender?.last_name].filter(Boolean).join(' ').trim() || 'Aanvrager';
}

export function RequestAvatar({ sender }) {
  const name = formatRequesterName(sender);
  if (sender?.avatar_url) {
    return (
      <Image
        source={{ uri: sender.avatar_url }}
        style={styles.avatar}
        accessibilityLabel={`Profielfoto van ${name}`}
      />
    );
  }
  return (
    <View style={[styles.avatar, styles.avatarFallback]} accessibilityLabel={`Profielfoto van ${name}`}>
      <UserCircleIcon size={44} color={COLORS.brand} weight="regular" />
    </View>
  );
}

function PerceelImage({ perceel }) {
  const [imageError, setImageError] = useState(false);
  const firstPhoto = Array.isArray(perceel?.fotos) ? perceel.fotos[0] : null;

  if (!firstPhoto || imageError) {
    return (
      <View
        style={styles.imagePlaceholder}
        accessibilityRole="image"
        accessibilityLabel={`Geen foto beschikbaar voor ${perceel?.naam || 'dit perceel'}`}
      >
        <LeafIcon size={40} color={COLORS.brand} weight="regular" />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: firstPhoto }}
      style={styles.image}
      resizeMode="cover"
      onError={() => setImageError(true)}
      accessibilityLabel={`Foto van ${perceel?.naam || 'het perceel'}`}
    />
  );
}

function AanvraagCard({ aanvraag, onView, style }) {
  const sender = aanvraag?.sender;
  const perceel = aanvraag?.perceel;
  const fullName = formatRequesterName(sender);

  return (
    <Pressable
      onPress={() => onView(aanvraag)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed, style]}
      accessibilityRole="button"
      accessibilityLabel={`Open aanvraag van ${fullName}`}
      accessibilityHint="Open de detailweergave van deze aanvraag"
    >
      <View style={styles.userRow}>
        <RequestAvatar sender={sender} />
        <Text style={styles.userName} numberOfLines={1}>{fullName}</Text>
        <View style={styles.ratingPill}>
          <StarIcon size={14} color={COLORS.accent} weight="fill" accessibilityElementsHidden />
          <Text style={styles.ratingText}>{sender?.rating ?? 'Nieuw'}</Text>
        </View>
      </View>

      <PerceelImage perceel={perceel} />

      <View style={styles.perceelInfo}>
        <Text style={styles.perceelNaam} numberOfLines={1}>{perceel?.naam || 'Perceel'}</Text>
        <Text style={styles.perceelGrootte}>{normalizeSize(perceel?.grootte)}</Text>
      </View>

      <Pressable
        style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
        onPress={() => onView(aanvraag)}
        accessibilityRole="button"
        accessibilityLabel={`Bekijk aanvraag van ${fullName}`}
        accessibilityHint={`Open de detailweergave van de aanvraag van ${fullName}`}
      >
        <BinocularsIcon size={18} color={COLORS.textInverse} weight="regular" accessibilityElementsHidden />
        <Text style={styles.actionButtonText}>Bekijk aanvraag</Text>
      </Pressable>
    </Pressable>
  );
}

export default AanvraagCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.dividerSoft,
    ...SHADOWS.card,
  },
  cardPressed: {
    opacity: 0.85,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.pill,
  },
  avatarFallback: {
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    flex: 1,
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  ratingText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.md,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  perceelInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  perceelNaam: {
    flex: 1,
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
  },
  perceelGrootte: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  actionButton: {
    height: 48,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.brand,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  actionButtonPressed: {
    opacity: 0.85,
  },
  actionButtonText: {
    fontFamily: FONTS.displayMedium,
    fontSize: FONT_SIZES.md,
    color: COLORS.textInverse,
  },
});
