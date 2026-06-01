import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  CheckIcon,
  MagnifyingGlassIcon,
  LeafIcon,
  StarIcon,
  UserCircleIcon,
} from 'phosphor-react-native';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../theme/tokens';

export function normalizeSize(size) {
  if (size == null || size === '') return '—';
  const text = String(size);
  return text.includes('m²') ? text : `${text}m²`;
}

function formatRequesterName(sender) {
  return [sender?.first_name, sender?.last_name].filter(Boolean).join(' ').trim() || 'Aanvrager';
}

export function RequestAvatar({ sender }) {
  if (sender?.avatar_url) {
    return <Image source={{ uri: sender.avatar_url }} style={styles.userAvatar} accessibilityLabel={`Profielfoto van ${formatRequesterName(sender)}`} />;
  }

  return (
    <View style={[styles.userAvatar, styles.userAvatarFallback]} accessibilityLabel={`Profielfoto van ${formatRequesterName(sender)}`}>
      <UserCircleIcon size={44} color={COLORS.brand} weight="regular" />
    </View>
  );
}

function PerceelImage({ perceel }) {
  const [imageError, setImageError] = useState(false);
  const firstPhoto = Array.isArray(perceel?.fotos) ? perceel.fotos[0] : null;

  if (!firstPhoto || imageError) {
    return (
      <View style={styles.gardenPlaceholder} accessibilityRole="image" accessibilityLabel={`Geen foto beschikbaar voor ${perceel?.naam || 'dit perceel'}`}>
        <LeafIcon size={40} color={COLORS.brand} weight="regular" />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: firstPhoto }}
      style={styles.gardenImage}
      resizeMode="cover"
      onError={() => setImageError(true)}
      accessibilityLabel={`Foto van ${perceel?.naam || 'het perceel'}`}
    />
  );
}

function AanvraagCard({ aanvraag, onAccept, onView }) {
  const sender = aanvraag?.sender;
  const perceel = aanvraag?.perceel;
  const fullName = formatRequesterName(sender);
  const title = perceel?.naam || 'Perceel';
  const size = normalizeSize(perceel?.grootte);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onView(aanvraag)}
      style={styles.requestCard}
      accessibilityRole="button"
      accessibilityLabel={`Open aanvraag van ${fullName}`}
      accessibilityHint="Open de detailweergave van deze aanvraag"
    >
      <View style={styles.userRow}>
        <View style={styles.userInfo}>
          <RequestAvatar sender={sender} />
          <View style={styles.userNameWrap}>
            <Text style={styles.userName}>{fullName}</Text>
          </View>
        </View>

        <View style={styles.scoreWrap}>
          <View style={styles.scorePill}>
            <StarIcon size={16} color={COLORS.accent} weight="fill" />
            <Text style={styles.scoreText}>4,5</Text>
          </View>
        </View>
      </View>

      <PerceelImage perceel={perceel} />

      <View style={styles.gardenInfo}>
        <Text style={styles.gardenTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.gardenSize}>{size}</Text>
      </View>

      <View style={styles.actionRow}>
        <Pressable
          style={[styles.actionButton, styles.acceptButton]}
          onPress={() => onView(aanvraag)}
          accessibilityRole="button"
          accessibilityLabel={`Bekijk aanvraag van ${fullName}`}
          accessibilityHint={`Open de detailweergave van de aanvraag van ${fullName}`}
        >
          <MagnifyingGlassIcon size={18} color={COLORS.surface} weight="regular" />
          <Text style={styles.acceptButtonText}>Bekijk aanvraag</Text>
        </Pressable>
      </View>
    </TouchableOpacity>
  );
}

export default AanvraagCard;

const styles = StyleSheet.create({
  requestCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(54, 57, 43, 0.08)',
    ...SHADOWS.card,
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  userAvatarFallback: {
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userNameWrap: {
    flex: 1,
  },
  userName: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  scoreWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scoreText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  gardenImage: {
    width: '100%',
    height: 200,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.md,
  },
  gardenPlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  gardenInfo: {
    marginBottom: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  gardenTitle: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 16,
    color: COLORS.textPrimary,
    flex: 1,
  },
  gardenSize: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    height: 48,
    borderRadius: RADIUS.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  acceptButton: {
    backgroundColor: COLORS.brand,
  },
  acceptButtonText: {
    fontFamily: FONTS.displayMedium,
    fontSize: 14,
    color: COLORS.surface,
  },
  viewButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.brand,
  },
  viewButtonText: {
    fontFamily: FONTS.displayMedium,
    fontSize: 14,
    color: COLORS.brand,
  },
});