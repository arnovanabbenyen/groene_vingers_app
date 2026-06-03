import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeftIcon } from 'phosphor-react-native';
import {
  getEndedSamenwerking,
  hasUserRatedSamenwerking,
} from '../../services/samenwerkingProposal';
import StarRatingDisplay from '../../components/rating/StarRatingDisplay';
import AuthButton from '../../components/buttons/AuthButton';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SHADOWS, SPACING } from '../../components/theme/tokens';

const FALLBACK_AVATAR = require('../../images/tuinzoeker_pfp.png');

export default function SamenwerkingBeeindigdScreen({
  aanvraagId,
  currentUserId,
  onBack,
  onGiveReview,
  onSkipReview,
}) {
  const [data, setData] = useState(null);
  const [hasRated, setHasRated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [samenwerking, rated] = await Promise.all([
          getEndedSamenwerking(aanvraagId),
          hasUserRatedSamenwerking(aanvraagId, currentUserId),
        ]);
        if (mounted) { setData(samenwerking); setHasRated(rated); }
      } catch (err) {
        console.warn('SamenwerkingBeeindigdScreen load error', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [aanvraagId, currentUserId]);

  if (isLoading) {
    return (
      <View style={[styles.root, styles.center]}>
        <ActivityIndicator color={COLORS.brand} />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={[styles.root, styles.center]}>
        <Text style={styles.emptyText}>Samenwerking niet gevonden.</Text>
        <Pressable onPress={onBack} style={{ marginTop: 16 }}>
          <Text style={styles.linkText}>Terug</Text>
        </Pressable>
      </View>
    );
  }

  const initiatorId = data.samenwerking_ended_by;
  const initiatorProfile = initiatorId === data.sender_id ? data.senderProfile : data.ownerProfile;
  const initiatorName = [initiatorProfile?.first_name, initiatorProfile?.last_name]
    .filter(Boolean).join(' ').trim() || 'Iemand';
  const initiatorAvatar = initiatorProfile?.avatar_url
    ? { uri: initiatorProfile.avatar_url }
    : FALLBACK_AVATAR;

  const perceelNaam = data.percelen?.naam || 'Perceel';
  const perceelFoto = data.percelen?.fotos?.[0];

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.headerRow}>
          <Pressable onPress={onBack} style={styles.backButton} hitSlop={8} accessibilityRole="button">
            <ArrowLeftIcon size={20} color={COLORS.textInverse} weight="regular" />
            <Text style={styles.backText}>Terug</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Samenwerking beëindigd</Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Perceel card */}
        <View style={styles.perceelCard}>
          {perceelFoto ? (
            <Image source={{ uri: perceelFoto }} style={styles.perceelImage} />
          ) : null}
          <View style={styles.perceelInfo}>
            <Text style={styles.perceelNaam}>{perceelNaam}</Text>
            {data.percelen?.plaats ? (
              <Text style={styles.perceelPlaats}>{data.percelen.plaats}</Text>
            ) : null}
          </View>
        </View>

        {/* Initiator review section */}
        <View style={styles.reviewSection}>
          <View style={styles.reviewHeader}>
            <Image source={initiatorAvatar} style={styles.reviewAvatar} />
            <View style={styles.reviewHeaderText}>
              <Text style={styles.reviewerName}>{initiatorName}</Text>
              <Text style={styles.reviewerLabel}>heeft de samenwerking beëindigd</Text>
            </View>
          </View>

          {data.initiatorRating ? (
            <>
              <View style={styles.reviewStars}>
                <StarRatingDisplay
                  average={data.initiatorRating.score}
                  count={1}
                  size={20}
                  showCount={false}
                />
              </View>
              {data.initiatorRating.review_text ? (
                <View style={styles.reviewTextCard}>
                  <Text style={styles.reviewText}>
                    "{data.initiatorRating.review_text}"
                  </Text>
                </View>
              ) : null}
            </>
          ) : (
            <Text style={styles.noReviewText}>Geen review achtergelaten.</Text>
          )}
        </View>

        {/* CTA */}
        {hasRated ? (
          <View style={styles.alreadyRatedCard}>
            <Text style={styles.alreadyRatedText}>
              Je hebt je review al achtergelaten. Bedankt!
            </Text>
            <Pressable onPress={onBack}>
              <Text style={styles.linkText}>Terug naar home</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.ctaSection}>
            <Text style={styles.ctaHeading}>Wat vond jij van de samenwerking?</Text>
            <Text style={styles.ctaSubheading}>
              Je review is privé en helpt om andere gebruikers te informeren.
            </Text>
            <AuthButton
              label="Geef je review"
              onPress={() => onGiveReview?.(data)}
              variant="primary"
            />
            <AuthButton
              label="Niet nu"
              onPress={onSkipReview}
              variant="secondary"
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  headerSafe: { backgroundColor: COLORS.brand },
  headerRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.screenX, paddingVertical: SPACING.sm, minHeight: 52,
  },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 80 },
  backText: { fontFamily: FONTS.bodyMedium, fontSize: FONT_SIZES.md, color: COLORS.textInverse },
  headerTitle: {
    flex: 1, textAlign: 'center',
    fontFamily: FONTS.displaySemiBold, fontSize: FONT_SIZES.xl, color: COLORS.textInverse,
  },
  headerSpacer: { minWidth: 80 },
  scroll: { flex: 1 },
  scrollContent: { padding: SPACING.screenX, paddingBottom: 40, gap: SPACING.lg },

  perceelCard: {
    flexDirection: 'row', gap: SPACING.sm,
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.md,
    ...SHADOWS.card,
  },
  perceelImage: {
    width: 72, height: 72, borderRadius: RADIUS.sm, backgroundColor: COLORS.surfaceMuted,
  },
  perceelInfo: { flex: 1, justifyContent: 'center', gap: 4 },
  perceelNaam: { fontFamily: FONTS.displaySemiBold, fontSize: FONT_SIZES.lg, color: COLORS.textPrimary },
  perceelPlaats: { fontFamily: FONTS.body, fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },

  reviewSection: { gap: SPACING.sm },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  reviewAvatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.surfaceMuted,
  },
  reviewHeaderText: { flex: 1, gap: 2 },
  reviewerName: { fontFamily: FONTS.displaySemiBold, fontSize: FONT_SIZES.md, color: COLORS.textPrimary },
  reviewerLabel: { fontFamily: FONTS.body, fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  reviewStars: { paddingVertical: 4 },
  reviewTextCard: {
    backgroundColor: '#F5F1E8', borderLeftWidth: 3, borderLeftColor: '#FFB800',
    padding: 14, borderRadius: RADIUS.xs,
  },
  reviewText: {
    fontFamily: FONTS.body, fontSize: FONT_SIZES.sm, color: COLORS.textPrimary,
    fontStyle: 'italic', lineHeight: 20,
  },
  noReviewText: {
    fontFamily: FONTS.body, fontSize: FONT_SIZES.sm, color: COLORS.textMuted, fontStyle: 'italic',
  },

  ctaSection: { gap: SPACING.sm },
  ctaHeading: { fontFamily: FONTS.displaySemiBold, fontSize: FONT_SIZES.xl, color: COLORS.textPrimary },
  ctaSubheading: {
    fontFamily: FONTS.body, fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, lineHeight: 18,
  },
  alreadyRatedCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.lg,
    alignItems: 'center', gap: SPACING.sm, ...SHADOWS.card,
  },
  alreadyRatedText: {
    fontFamily: FONTS.body, fontSize: FONT_SIZES.sm, color: COLORS.textPrimary, textAlign: 'center',
  },
  linkText: { fontFamily: FONTS.bodyMedium, fontSize: FONT_SIZES.sm, color: COLORS.brand },
  emptyText: { fontFamily: FONTS.body, fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
});
