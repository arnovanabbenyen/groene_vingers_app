import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LeafIcon, MapPinIcon } from 'phosphor-react-native';
import { COLORS, FONTS, RADIUS, SHADOWS } from '../theme/tokens';

const FALLBACK_AVATAR = require('../../images/tuinzoeker_pfp.png');

function formatDate(isoString) {
  if (!isoString) return null;
  try {
    return new Date(isoString).toLocaleDateString('nl-BE', {
      day: 'numeric',
      month: 'long',
    });
  } catch {
    return null;
  }
}

export default function SamenwerkingCard({ samenwerking, onPress }) {
  const perceel = samenwerking.percelen;
  const sender = samenwerking.senderProfile;

  const perceelName = perceel?.naam ?? 'Perceel';
  const perceelLocation = perceel?.plaats ?? null;
  const perceelPhoto = perceel?.fotos?.[0] ?? null;

  const senderName =
    [sender?.first_name, sender?.last_name].filter(Boolean).join(' ').trim() || 'Tuinzoeker';
  const senderAvatarSource = sender?.avatar_url ? { uri: sender.avatar_url } : FALLBACK_AVATAR;

  const startDate = formatDate(samenwerking.confirmed_at);

  const accessibilityLabel = [
    `Actieve samenwerking met ${senderName}`,
    `voor ${perceelName}`,
    perceelLocation && `in ${perceelLocation}`,
    startDate && `gestart op ${startDate}`,
    'Tik om het gesprek te openen',
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Opent het gesprek met deze tuinzoeker"
    >
      {/* ── Perceel photo header ─────────────────────────────────── */}
      <View style={styles.photoWrap}>
        {perceelPhoto ? (
          <Image source={{ uri: perceelPhoto }} style={styles.photo} resizeMode="cover" />
        ) : (
          <View style={[styles.photo, styles.photoPlaceholder]}>
            <LeafIcon size={36} color={COLORS.brand} weight="regular" />
          </View>
        )}

        {/* Dark scrim + meta overlay */}
        <View style={styles.scrim}>
          <View style={styles.statusBadge}>
            <View style={styles.activeDot} />
            <Text style={styles.statusLabel}>Actieve samenwerking</Text>
          </View>

          <View style={styles.perceelMeta}>
            <Text style={styles.perceelName} numberOfLines={1}>
              {perceelName}
            </Text>
            {perceelLocation ? (
              <View style={styles.locationRow}>
                <MapPinIcon size={11} color="rgba(255,255,255,0.8)" weight="fill" />
                <Text style={styles.perceelLocation} numberOfLines={1}>
                  {perceelLocation}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      {/* ── Body ─────────────────────────────────────────────────── */}
      <View style={styles.body}>
        {/* Person row */}
        <View style={styles.personRow}>
          <View style={styles.avatarWrap}>
            <Image source={senderAvatarSource} style={styles.avatar} />
            <View style={styles.onlineDot} />
          </View>

          <View style={styles.personText}>
            <Text style={styles.personName} numberOfLines={1}>
              {senderName}
            </Text>
            <Text style={styles.personSub} numberOfLines={1}>
              {startDate ? `Gestart ${startDate}` : 'Tuinzoeker'}
            </Text>
          </View>
        </View>

      </View>
    </Pressable>
  );
}

const PHOTO_HEIGHT = 140;
const AVATAR_SIZE = 48;

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },

  // ── Photo header ────────────────────────────────────────────────
  photoWrap: {
    height: PHOTO_HEIGHT,
    position: 'relative',
    backgroundColor: COLORS.surfaceMuted,
  },
  photo: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.38)',
    justifyContent: 'space-between',
    padding: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.62)',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#4CAF50',
  },
  statusLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },
  perceelMeta: {
    gap: 3,
  },
  perceelName: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 18,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  perceelLocation: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
  },

  // ── Body ────────────────────────────────────────────────────────
  body: {
    padding: 16,
    gap: 14,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrap: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    flexShrink: 0,
    position: 'relative',
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  personText: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  personName: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  personSub: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.textSecondary,
  },

});
