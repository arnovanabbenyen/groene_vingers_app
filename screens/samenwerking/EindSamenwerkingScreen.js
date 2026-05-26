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
  LeafIcon,
  PlantIcon,
  ShovelIcon,
} from 'phosphor-react-native';
import { supabase } from '../../services/supabase';
import { endSamenwerking, submitRating } from '../../services/samenwerkingProposal';
import StarRatingInput from '../../components/rating/StarRatingInput';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../../components/theme/tokens';

// ── Voorziening icon mapping (matches PlotCard) ───────────────────
function VoorzieningIcon({ label }) {
  const s = (label || '').toLowerCase();
  if (s.includes('water') || s.includes('drop'))    return <DropIcon  size={16} color={COLORS.surface} weight="regular" />;
  if (s.includes('shovel') || s.includes('materiaal')) return <ShovelIcon size={16} color={COLORS.surface} weight="regular" />;
  if (s.includes('zaden') || s.includes('plant'))   return <PlantIcon size={16} color={COLORS.surface} weight="regular" />;
  return <LeafIcon size={16} color={COLORS.surface} weight="regular" />;
}

// ── Samenwerking info card (matches Figma 411:4382) ───────────────
function SamenwerkingInfoCard({ samenwerking }) {
  const perceel = samenwerking.percelen;
  const sender  = samenwerking.senderProfile;

  const perceelName   = perceel?.naam  ?? 'Perceel';
  const perceelPhoto  = perceel?.fotos?.[0] ?? null;
  const voorzieningen = (perceel?.voorzieningen ?? []).slice(0, 3);
  const typeSamenwerking = samenwerking.type_samenwerking ?? null;

  const partnerName = sender
    ? [sender.first_name, sender.last_name].filter(Boolean).join(' ').trim()
    : null;

  return (
    <View style={styles.infoCard}>
      {/* Yellow left accent bar */}
      <View style={styles.infoAccentBar} />

      <View style={styles.infoContent}>
        {/* Top row: photo + name + partner */}
        <View style={styles.infoTopRow}>
          <View style={styles.infoPhotoWrap}>
            {perceelPhoto ? (
              <Image source={{ uri: perceelPhoto }} style={styles.infoPhoto} resizeMode="cover" />
            ) : (
              <View style={[styles.infoPhoto, styles.infoPhotoPlaceholder]}>
                <LeafIcon size={22} color={COLORS.brand} weight="regular" />
              </View>
            )}
          </View>

          <View style={styles.infoTextCol}>
            <Text style={styles.infoPerceelName} numberOfLines={1}>
              {perceelName}
            </Text>
            {partnerName ? (
              <Text style={styles.infoPartner} numberOfLines={2}>
                {'Dit is een samenwerking met '}
                <Text style={styles.infoPartnerBold}>{partnerName}</Text>
              </Text>
            ) : null}
          </View>
        </View>

        {/* Voorziening pills */}
        {voorzieningen.length > 0 && (
          <View style={styles.infoVoorzRow}>
            {voorzieningen.map((v, i) => (
              <View key={i} style={styles.infoVoorzPill}>
                <VoorzieningIcon label={v} />
              </View>
            ))}
          </View>
        )}

        {/* Type samenwerking */}
        {typeSamenwerking ? (
          <Text style={styles.infoType} numberOfLines={2}>
            <Text style={styles.infoTypeBold}>Samenwerking: </Text>
            {typeSamenwerking}
          </Text>
        ) : null}
      </View>
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
        <Text style={styles.sectionLabel}>Samenwerking:</Text>
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
  sectionLabel: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 20,
    color: COLORS.textPrimary,
  },

  // ── Samenwerking info card ─────────────────────────────────────
  infoCard: {
    backgroundColor: '#FFFBEE',
    borderRadius: RADIUS.sm,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  infoAccentBar: {
    width: 3,
    backgroundColor: COLORS.accent,
    flexShrink: 0,
  },
  infoContent: {
    flex: 1,
    padding: 16,
    gap: 10,
  },
  infoTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoPhotoWrap: {
    width: 75,
    height: 75,
    borderRadius: RADIUS.xs,
    overflow: 'hidden',
    flexShrink: 0,
  },
  infoPhoto: {
    width: '100%',
    height: '100%',
  },
  infoPhotoPlaceholder: {
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextCol: {
    flex: 1,
    gap: 6,
  },
  infoPerceelName: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 18,
    color: COLORS.textPrimary,
  },
  infoPartner: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.textPrimary,
    lineHeight: 17,
  },
  infoPartnerBold: {
    fontFamily: FONTS.bodyMedium,
    color: COLORS.brand,
    textDecorationLine: 'underline',
  },
  infoVoorzRow: {
    flexDirection: 'row',
    gap: 6,
  },
  infoVoorzPill: {
    flex: 1,
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.xs,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoType: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  infoTypeBold: {
    fontFamily: FONTS.displayMedium,
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
