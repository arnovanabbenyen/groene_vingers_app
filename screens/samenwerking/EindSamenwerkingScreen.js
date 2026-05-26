import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeftIcon,
  DropIcon,
  HandshakeIcon,
  LeafIcon,
  MapPinIcon,
  PlantIcon,
  ShovelIcon,
} from 'phosphor-react-native';
import { supabase } from '../../services/supabase';
import { endSamenwerking, submitRating } from '../../services/samenwerkingProposal';
import StarRatingInput from '../../components/rating/StarRatingInput';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../../components/theme/tokens';

const FALLBACK_AVATAR = require('../../images/tuinzoeker_pfp.png');
const CARD_PHOTO_HEIGHT = 130;
const PARTNER_AVATAR_SIZE = 44;

function formatStartDate(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString('nl-BE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return null;
  }
}

// ── Voorziening icon ──────────────────────────────────────────────
function VoorzieningIcon({ label }) {
  const s = (label || '').toLowerCase();
  if (s.includes('water') || s.includes('drop'))       return <DropIcon   size={13} color={COLORS.surface} weight="regular" />;
  if (s.includes('shovel') || s.includes('materiaal')) return <ShovelIcon size={13} color={COLORS.surface} weight="regular" />;
  if (s.includes('zaden') || s.includes('plant'))      return <PlantIcon  size={13} color={COLORS.surface} weight="regular" />;
  return <LeafIcon size={13} color={COLORS.surface} weight="regular" />;
}

// ── Samenwerking info card ────────────────────────────────────────
function SamenwerkingInfoCard({ samenwerking }) {
  const perceel = samenwerking.percelen;
  const sender  = samenwerking.senderProfile;

  const perceelName      = perceel?.naam       ?? 'Perceel';
  const perceelPhoto     = perceel?.fotos?.[0] ?? null;
  const perceelLocation  = perceel?.plaats     ?? null;
  const voorzieningen    = (perceel?.voorzieningen ?? []).slice(0, 3);
  const typeSamenwerking = samenwerking.type_samenwerking ?? null;

  const partnerName   = sender
    ? [sender.first_name, sender.last_name].filter(Boolean).join(' ').trim() || null
    : null;
  const partnerAvatar = sender?.avatar_url ? { uri: sender.avatar_url } : FALLBACK_AVATAR;
  const startDate     = formatStartDate(samenwerking.confirmed_at);

  const hasBody = partnerName || typeSamenwerking || voorzieningen.length > 0;

  const cardA11yLabel = [
    `Perceel: ${perceelName}`,
    perceelLocation && `in ${perceelLocation}`,
    partnerName     && `Samenwerking met ${partnerName}`,
    startDate       && `Gestart op ${startDate}`,
    typeSamenwerking && `Type: ${typeSamenwerking}`,
    voorzieningen.length > 0 && `Voorzieningen: ${voorzieningen.join(', ')}`,
  ].filter(Boolean).join('. ');

  return (
    <View
      style={styles.infoCard}
      accessible
      accessibilityLabel={cardA11yLabel}
    >
      {/* ── Photo header ────────────────────────────────────── */}
      <View style={styles.infoPhotoWrap}>
        {perceelPhoto ? (
          <Image
            source={{ uri: perceelPhoto }}
            style={styles.infoPhoto}
            resizeMode="cover"
            accessibilityElementsHidden
          />
        ) : (
          <View style={[styles.infoPhoto, styles.infoPhotoPlaceholder]} accessibilityElementsHidden>
            <LeafIcon size={40} color={COLORS.brand} weight="regular" />
          </View>
        )}

        {/* Gradient scrim — perceel name overlaid */}
        <View style={styles.infoScrim} pointerEvents="none">
          <View style={styles.infoPerceelMeta}>
            <Text style={styles.infoPerceelName} numberOfLines={1} accessibilityElementsHidden>
              {perceelName}
            </Text>
            {perceelLocation ? (
              <View style={styles.infoLocationRow}>
                <MapPinIcon size={11} color="rgba(255,255,255,0.85)" weight="fill" />
                <Text style={styles.infoLocation} numberOfLines={1} accessibilityElementsHidden>
                  {perceelLocation}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      {/* ── Body ────────────────────────────────────────────── */}
      {hasBody ? (
        <View style={styles.infoBody}>
          {/* Partner row */}
          {partnerName ? (
            <View style={styles.infoPartnerRow} accessibilityElementsHidden>
              <Image source={partnerAvatar} style={styles.infoAvatar} />
              <View style={styles.infoPartnerText}>
                <Text style={styles.infoPartnerName} numberOfLines={1}>
                  {partnerName}
                </Text>
                <Text style={styles.infoPartnerSub} numberOfLines={1}>
                  {startDate ? `Gestart ${startDate}` : 'Tuinzoeker'}
                </Text>
              </View>
            </View>
          ) : null}

          {/* Divider */}
          {partnerName && (typeSamenwerking || voorzieningen.length > 0) ? (
            <View style={styles.infoDivider} />
          ) : null}

          {/* Type samenwerking chip */}
          {typeSamenwerking ? (
            <View style={styles.infoTypeChip} accessibilityElementsHidden>
              <HandshakeIcon size={13} color={COLORS.brand} weight="regular" />
              <Text style={styles.infoTypeText} numberOfLines={1}>
                {typeSamenwerking}
              </Text>
            </View>
          ) : null}

          {/* Voorzieningen — icon + label */}
          {voorzieningen.length > 0 ? (
            <View style={styles.infoVoorzRow} accessibilityElementsHidden>
              {voorzieningen.map((v, i) => (
                <View key={i} style={styles.infoVoorzPill}>
                  <VoorzieningIcon label={v} />
                  <Text style={styles.infoVoorzLabel} numberOfLines={1}>
                    {v}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────
export default function EindSamenwerkingScreen({ samenwerking, onBack, onDone }) {
  const [currentUserId, setCurrentUserId] = useState(null);
  const [reason, setReason] = useState('');
  const [rating, setRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data?.user?.id ?? null);
    });
  }, []);

  const ratedId = currentUserId === samenwerking.sender_id
    ? samenwerking.percelen?.owner_id
    : samenwerking.sender_id;

  const conversationId = samenwerking.conversation?.id ?? null;
  const isValid = rating >= 1 && !!ratedId && !!currentUserId;

  async function handleStop() {
    if (!isValid || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await submitRating({
        aanvraagId:  samenwerking.id,
        raterId:     currentUserId,
        ratedId,
        score:       rating,
        reviewText:  reason.trim() || null,
      });
      await endSamenwerking({
        aanvraagId:     samenwerking.id,
        conversationId,
        userId:         currentUserId,
        reason:         reason.trim() || null,
      });
      onDone?.();
    } catch (err) {
      Alert.alert('Er ging iets mis', err.message || 'Probeer het opnieuw.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.headerRow}>
          <Pressable
            style={styles.backButton}
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Terug"
            hitSlop={8}
          >
            <ArrowLeftIcon size={20} color={COLORS.surface} weight="regular" />
            <Text style={styles.backText}>Terug</Text>
          </Pressable>

          <Text style={styles.headerTitle}>Stoppen</Text>

          {/* Spacer to balance the header */}
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Samenwerking info ──────────────────────────────── */}
        <SamenwerkingInfoCard samenwerking={samenwerking} />

        {/* ── Reason textarea ────────────────────────────────── */}
        <Text style={styles.heading}>
          Waarom wil je de samenwerking stoppen?
        </Text>

        <View style={styles.textareaCard}>
          <TextInput
            style={styles.textarea}
            placeholder="Omdat..."
            placeholderTextColor={COLORS.textMuted}
            value={reason}
            onChangeText={setReason}
            multiline
            textAlignVertical="top"
            accessibilityLabel="Reden om te stoppen"
            accessibilityHint="Optioneel — beschrijf waarom je wil stoppen"
          />
        </View>

        {/* ── Star rating (required) ─────────────────────────── */}
        <Text style={styles.heading}>Hoe was de samenwerking?</Text>
        <Text style={styles.ratingSubtitle}>
          Geef een beoordeling om door te gaan
        </Text>

        <View style={styles.starsWrap}>
          <StarRatingInput value={rating} onChange={setRating} size={40} />
        </View>

        {/* ── Stop button ────────────────────────────────────── */}
        <Pressable
          style={[styles.stopButton, !isValid && styles.stopButtonDisabled]}
          onPress={handleStop}
          disabled={!isValid || isSubmitting}
          accessibilityRole="button"
          accessibilityLabel={isValid ? 'Stop samenwerking' : 'Geef eerst een beoordeling'}
          accessibilityState={{ disabled: !isValid || isSubmitting }}
        >
          <Text style={styles.stopButtonText}>
            {isSubmitting ? 'Bezig...' : 'Stop samenwerking'}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },

  // ── Header ────────────────────────────────────────────────────
  headerSafe: {
    backgroundColor: COLORS.brand,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.screenX,
    paddingVertical: 14,
    minHeight: 56,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 72,
  },
  backText: {
    fontFamily: FONTS.displayMedium,
    fontSize: 16,
    color: COLORS.surface,
  },
  headerTitle: {
    flex: 1,
    fontFamily: FONTS.displaySemiBold,
    fontSize: 20,
    color: COLORS.surface,
    textAlign: 'center',
  },
  headerSpacer: {
    minWidth: 72,
  },

  // ── Scroll content ────────────────────────────────────────────
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.screenX,
    paddingTop: 28,
    paddingBottom: 40,
    gap: 16,
  },
  // ── Samenwerking info card ─────────────────────────────────────
  infoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.card,
  },

  // Photo header
  infoPhotoWrap: {
    height: CARD_PHOTO_HEIGHT,
    backgroundColor: COLORS.surfaceMuted,
    position: 'relative',
  },
  infoPhoto: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  infoPhotoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.38)',
    justifyContent: 'flex-end',
    padding: 12,
  },
  infoPerceelMeta: {
    gap: 3,
  },
  infoPerceelName: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 19,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  infoLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoLocation: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
  },

  // Body
  infoBody: {
    padding: 14,
    gap: 10,
  },
  infoPartnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoAvatar: {
    width: PARTNER_AVATAR_SIZE,
    height: PARTNER_AVATAR_SIZE,
    borderRadius: PARTNER_AVATAR_SIZE / 2,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 2,
    borderColor: COLORS.border,
    flexShrink: 0,
  },
  infoPartnerText: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  infoPartnerName: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  infoPartnerSub: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  infoDivider: {
    height: 1,
    backgroundColor: COLORS.dividerSoft,
    marginVertical: 2,
  },

  // Type chip
  infoTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surfaceBrand,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  infoTypeText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.brand,
    flexShrink: 1,
  },

  // Voorzieningen
  infoVoorzRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  infoVoorzPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.xs,
    paddingHorizontal: 8,
    paddingVertical: 5,
    flexShrink: 1,
  },
  infoVoorzLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 11,
    color: COLORS.surface,
    flexShrink: 1,
  },

  // ── Heading ───────────────────────────────────────────────────
  heading: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 20,
    color: COLORS.textPrimary,
    lineHeight: 24,
  },

  // ── Textarea ──────────────────────────────────────────────────
  textareaCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    ...SHADOWS.card,
  },
  textarea: {
    backgroundColor: 'rgba(87,98,56,0.05)',
    borderRadius: RADIUS.sm,
    margin: 16,
    padding: 10,
    height: 180,
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },

  // ── Stars ─────────────────────────────────────────────────────
  ratingSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: -10,
  },
  starsWrap: {
    paddingVertical: 6,
  },

  // ── Stop button ───────────────────────────────────────────────
  stopButton: {
    backgroundColor: COLORS.negative,
    borderRadius: RADIUS.xl,
    height: 53,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  stopButtonDisabled: {
    opacity: 0.45,
  },
  stopButtonText: {
    fontFamily: FONTS.displayMedium,
    fontSize: 16,
    color: COLORS.textInverse,
  },
});
