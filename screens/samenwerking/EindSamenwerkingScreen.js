import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeftIcon } from 'phosphor-react-native';
import { supabase } from '../../services/supabase';
import { endSamenwerking, submitRating } from '../../services/samenwerkingProposal';
import PerceelSummaryCard from '../../components/aanvraag/PerceelSummaryCard';
import AuthTextArea from '../../components/auth/AuthTextArea';
import AuthButton from '../../components/buttons/AuthButton';
import StarRatingInput from '../../components/rating/StarRatingInput';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SPACING } from '../../components/theme/tokens';


export default function EindSamenwerkingScreen({
  samenwerking,
  onBack,
  onDone,
  mode = 'initiator',
}) {
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

  const isCurrentUserSender = currentUserId && currentUserId === samenwerking.sender_id;
  const partnerProfile = isCurrentUserSender
    ? (samenwerking.ownerProfile ?? null)
    : (samenwerking.senderProfile ?? null);
  const partnerLabel = isCurrentUserSender ? 'Eigenaar' : 'Tuinzoeker';

  const conversationId = samenwerking.conversation?.id ?? samenwerking.conversationId ?? null;
  const isValid = rating >= 1 && !!ratedId && !!currentUserId;

  const screenTitle = mode === 'recipient' ? 'Geef je review' : 'Stoppen';
  const headingText = mode === 'recipient'
    ? 'Wil je iets kwijt over de samenwerking?'
    : 'Waarom wil je de samenwerking stoppen?';
  const buttonText = isSubmitting ? 'Bezig...' : (mode === 'recipient' ? 'Verstuur review' : 'Stop samenwerking');

  async function handleStop() {
    if (!isValid || isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (mode === 'initiator') {
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
      } else {
        await submitRating({
          aanvraagId:  samenwerking.id,
          raterId:     currentUserId,
          ratedId,
          score:       rating,
          reviewText:  reason.trim() || null,
        });
      }
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

          <Text style={styles.headerTitle} accessibilityRole="header">{screenTitle}</Text>

          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Perceel card ───────────────────────────────────── */}
        {samenwerking.percelen ? (
          <PerceelSummaryCard
            perceel={samenwerking.percelen}
            partnerProfile={partnerProfile}
            partnerLabel={partnerLabel}
          />
        ) : null}

        {/* ── Reason textarea ────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.heading}>{headingText}</Text>
          <AuthTextArea
            placeholder="Omdat..."
            value={reason}
            onChangeText={setReason}
            height={160}
            maxLength={500}
            accessibilityLabel="Reden om te stoppen"
            accessibilityHint="Optioneel — beschrijf waarom je wil stoppen"
          />
        </View>

        {/* ── Star rating (required) ─────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.heading}>Hoe was de samenwerking?</Text>
          <Text style={styles.ratingSubtitle}>Geef een beoordeling om door te gaan</Text>
          <View style={styles.starsWrap}>
            <StarRatingInput value={rating} onChange={setRating} size={40} />
          </View>
        </View>

        {/* ── Stop button ────────────────────────────────────── */}
        <AuthButton
          label={buttonText}
          onPress={handleStop}
          variant={mode === 'recipient' ? 'primary' : 'secondaryDanger'}
          loading={isSubmitting}
          disabled={!isValid || isSubmitting}
          accessibilityLabel={isValid ? buttonText : 'Geef eerst een beoordeling'}
        />
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
    gap: SPACING.xs,
    minWidth: 72,
  },
  backText: {
    fontFamily: FONTS.displayMedium,
    fontSize: FONT_SIZES.lg,
    color: COLORS.surface,
  },
  headerTitle: {
    flex: 1,
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.xl,
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
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
    gap: SPACING.xl,
  },
  section: {
    gap: SPACING.sm,
  },

  // ── Heading ───────────────────────────────────────────────────
  heading: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.xl,
    color: COLORS.textPrimary,
    lineHeight: 24,
  },

  // ── Stars ─────────────────────────────────────────────────────
  ratingSubtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  starsWrap: {
    paddingVertical: SPACING.xs,
    alignItems: 'center',
  },

});
