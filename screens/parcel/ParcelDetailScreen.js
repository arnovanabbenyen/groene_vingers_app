import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ChatCircleIcon, ClockClockwiseIcon, EyeIcon, EyeSlashIcon, MapPinIcon, PencilSimpleIcon } from 'phosphor-react-native';
import Header from '../../components/navigation/Header';
import ParcelOverviewSection from '../../components/parcel/ParcelOverviewSection';
import ParcelPresenceSection from '../../components/parcel/ParcelPresenceSection';
import ParcelInfoList from '../../components/parcel/ParcelInfoList';
import ParcelOwnerCard from '../../components/parcel/ParcelOwnerCard';
import ParcelLocationMap from '../../components/parcel/ParcelLocationMap';
import ProfielScreen from '../profile/ProfielScreen';
import { supabase } from '../../services/supabase';
import { useFavorites } from '../../hooks/useFavorites';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SPACING } from '../../components/theme/tokens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HERO_IMAGE = require('../../images/overdekt_perceel_met_serre.png');

const PERCEEL_STATUS = {
  ACTIVE: 'active',
  HIDDEN: 'hidden',
  DELETED: 'deleted',
};

const AANVRAAG_STATUS_LABEL = {
  pending: 'Aanvraag in behandeling',
  accepted: 'Aanvraag geaccepteerd',
  confirmed: 'Samenwerking bevestigd',
};

const FALLBACK_AVATAR = require('../../images/tuinzoeker_pfp.png');

function formatDate(isoString) {
  if (!isoString) return null;
  try {
    return new Date(isoString).toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return null; }
}

export default function ParcelDetailScreen({
  perceel = {},
  onBack,
  onAanvraag,
  onRequest,
  isOwner = false,
  onEdit,
  onToggleVisibility,
  onDelete,
  isFavorited = false,
  onToggleFavorite,
  showFavoriteButton = false,
  samenwerking = null,
  onOpenConversation,
  onEndSamenwerking,
  onCancelAanvraag,
}) {
  const insets = useSafeAreaInsets();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [ownerProfile, setOwnerProfile] = useState(null);
  const [existingAanvraag, setExistingAanvraag] = useState(null);
  const [confirmedConversation, setConfirmedConversation] = useState(null);
  const [showOwnerProfile, setShowOwnerProfile] = useState(false);
  const [ownerPerceelDetail, setOwnerPerceelDetail] = useState(null);
  const handleAanvraag = onAanvraag || onRequest || (() => {});
  const perceelStatus = perceel.status || PERCEEL_STATUS.ACTIVE;
  const hiddenBannerVisible = isOwner && perceelStatus === PERCEEL_STATUS.HIDDEN;
  const visibilityLabel = perceelStatus === PERCEEL_STATUS.HIDDEN ? 'Weer zichtbaar maken' : 'Tijdelijk verbergen';

  const title = perceel.naam || perceel.title || 'Perceel';
  const location = perceel.plaats || perceel.location || 'Locatie nog niet beschikbaar';
  const sizeValue = perceel.grootte || perceel.size || null;
  const sizeDisplay = sizeValue ? `${String(sizeValue).replace('m²', '').trim()} m²` : null;
  const description = perceel.beschrijving || perceel.description || 'Geen beschrijving';
  const extraInfo = Array.isArray(perceel.extra_info)
    ? perceel.extra_info
    : Array.isArray(perceel.extraInfo)
      ? perceel.extraInfo
      : [];
  const ownerId = perceel.owner_id || perceel.ownerId;

  useEffect(() => {
    let mounted = true;

    async function loadOwner() {
      if (!ownerId || !supabase) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, bio, avatar_url, created_at')
        .eq('id', ownerId)
        .maybeSingle();

      if (error) {
        console.warn('Could not load owner profile', error);
        return;
      }

      if (mounted) setOwnerProfile(data || null);
    }

    setOwnerProfile(null);
    loadOwner();
    return () => {
      mounted = false;
    };
  }, [ownerId]);

  useEffect(() => {
    let mounted = true;
    async function checkExistingAanvraag() {
      if (isOwner || !perceel?.id || !supabase) return;
      const { data: userData } = await supabase.auth.getUser().catch(() => ({ data: null }));
      const userId = userData?.user?.id;
      if (!userId) return;

      const { data } = await supabase
        .from('aanvragen')
        .select('id, status')
        .eq('perceel_id', perceel.id)
        .eq('sender_id', userId)
        .not('status', 'in', '("declined","cancelled","ended")')
        .maybeSingle();

      if (mounted) setExistingAanvraag(data || null);

      if (data?.status === 'confirmed') {
        const { data: convData } = await supabase
          .from('conversations')
          .select('id, aanvraag_id')
          .eq('aanvraag_id', data.id)
          .maybeSingle();
        if (mounted) setConfirmedConversation(convData || null);
      }
    }
    checkExistingAanvraag();
    return () => { mounted = false; };
  }, [perceel?.id, isOwner]);

  const hasConfirmedSamenwerking = existingAanvraag?.status === 'confirmed';

  const ownerDisplayName = ownerProfile
    ? [ownerProfile.first_name, ownerProfile.last_name].filter(Boolean).join(' ').trim() || 'Eigenaar'
    : '';

  const ownerJoinYear = ownerProfile?.created_at
    ? new Date(ownerProfile.created_at).getFullYear()
    : null;

  if (ownerPerceelDetail) {
    return (
      <ParcelDetailScreen
        perceel={ownerPerceelDetail}
        onBack={() => { setOwnerPerceelDetail(null); setShowOwnerProfile(true); }}
        showFavoriteButton
        isFavorited={isFavorite(ownerPerceelDetail?.id)}
        onToggleFavorite={() => toggleFavorite(ownerPerceelDetail?.id)}
      />
    );
  }

  if (showOwnerProfile && ownerId) {
    return (
      <ProfielScreen
        profileUserId={ownerId}
        onBack={() => setShowOwnerProfile(false)}
        onOtherPerceelPress={(p) => { setShowOwnerProfile(false); setOwnerPerceelDetail(p); }}
      />
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <Header title="Perceel" onBack={onBack} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {hiddenBannerVisible ? (
          <View style={styles.hiddenBanner}>
            <EyeSlashIcon size={16} color={COLORS.textMuted} weight="regular" accessibilityElementsHidden />
            <Text style={styles.hiddenBannerText}>Dit perceel is verborgen voor tuinzoekers.</Text>
          </View>
        ) : null}

        {!isOwner && existingAanvraag ? (
          <View style={styles.aanvraagStatusBanner}>
            <ClockClockwiseIcon size={16} color={COLORS.textPrimary} weight="regular" accessibilityElementsHidden />
            <Text style={styles.hiddenBannerText}>
              {AANVRAAG_STATUS_LABEL[existingAanvraag.status] ?? 'Aanvraag in behandeling'}
            </Text>
          </View>
        ) : null}

        <ParcelOverviewSection
          fotos={perceel.fotos || []}
          fallbackImage={HERO_IMAGE}
          title={title}
          location={location}
          distance={perceel.distance || ''}
          ownerName={ownerDisplayName}
          size={sizeDisplay}
          stats={perceel.stats || []}
          isFavorited={isFavorited}
          onFavoritePress={onToggleFavorite}
          showFavoriteButton={showFavoriteButton && !isOwner}
        />

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Beschrijving</Text>
          <Text style={styles.description}>{description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Type samenwerking</Text>
          {Array.isArray(perceel.voorkeur_samenwerking) && perceel.voorkeur_samenwerking.length > 0 ? (
            <View style={styles.pillsRow}>
              {perceel.voorkeur_samenwerking.map((type, i) => (
                <View key={`${type}-${i}`} style={styles.pill}>
                  <Text style={styles.pillText}>{type}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.description}>Geen voorkeur opgegeven</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Locatie</Text>
          {!isOwner && (
            hasConfirmedSamenwerking && perceel.adres ? (
              <Text style={[styles.description, { marginBottom: SPACING.sm }]}>{perceel.adres}</Text>
            ) : (
              <View style={styles.locationNotice}>
                <MapPinIcon size={14} color={COLORS.textPrimary} weight="regular" accessibilityElementsHidden />
                <Text style={styles.locationNoticeText}>
                  Exacte locatie zichtbaar na bevestigde samenwerking
                </Text>
              </View>
            )
          )}
          {(() => {
            const showExact = (isOwner || hasConfirmedSamenwerking) && (perceel.lat || perceel.lng);
            return (
              <ParcelLocationMap
                latitude={showExact ? (perceel.lat || perceel.approximate_lat) : perceel.approximate_lat}
                longitude={showExact ? (perceel.lng || perceel.approximate_lng) : perceel.approximate_lng}
                showCircle={!showExact}
              />
            );
          })()}
        </View>

        <View style={styles.section}>
          <ParcelPresenceSection voorzieningen={perceel.voorzieningen || []} />
        </View>

        <View style={styles.section}>
          <ParcelInfoList items={extraInfo} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Over de eigenaar</Text>
          <ParcelOwnerCard
            ownerProfile={ownerProfile}
            joinYear={ownerJoinYear}
            rating={perceel.rating ?? perceel.score ?? null}
            onPress={ownerId ? () => setShowOwnerProfile(true) : undefined}
          />
        </View>

        <View style={styles.divider} />

        {samenwerking ? (
          <View style={[styles.samenwerkingSection, { paddingBottom: insets.bottom + SPACING.md }]}>
            <Text style={styles.sectionTitle}>Actieve samenwerking</Text>

            <View style={styles.samenwerkingCard}>
              <View style={styles.samenwerkingPersonRow}>
                <Image
                  source={
                    samenwerking.senderProfile?.avatar_url
                      ? { uri: samenwerking.senderProfile.avatar_url }
                      : FALLBACK_AVATAR
                  }
                  style={styles.samenwerkingAvatar}
                  accessibilityElementsHidden
                />
                <View style={styles.samenwerkingPersonText}>
                  <Text style={styles.samenwerkingName} numberOfLines={1}>
                    {[samenwerking.senderProfile?.first_name, samenwerking.senderProfile?.last_name]
                      .filter(Boolean).join(' ').trim() || 'Tuinzoeker'}
                  </Text>
                  {samenwerking.confirmed_at ? (
                    <Text style={styles.samenwerkingDate}>
                      Gestart op {formatDate(samenwerking.confirmed_at)}
                    </Text>
                  ) : null}
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [styles.openChatButton, pressed && styles.buttonPressed]}
                onPress={() => onOpenConversation?.(samenwerking)}
                accessibilityRole="button"
                accessibilityLabel="Open gesprek"
              >
                <ChatCircleIcon size={18} color={COLORS.surface} weight="fill" accessibilityElementsHidden />
                <Text style={styles.openChatButtonText}>Open gesprek</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.endButton, pressed && styles.buttonPressed]}
                onPress={() => onEndSamenwerking?.(samenwerking)}
                accessibilityRole="button"
                accessibilityLabel="Beëindig samenwerking"
              >
                <Text style={styles.endButtonText}>Beëindig samenwerking</Text>
              </Pressable>
            </View>
          </View>
        ) : !isOwner ? (
          existingAanvraag ? (
            existingAanvraag.status === 'confirmed' ? (
              <View style={[styles.samenwerkingSection, { paddingBottom: insets.bottom + SPACING.md }]}>
                <View style={styles.samenwerkingCard}>
                  <Pressable
                    style={({ pressed }) => [styles.openChatButton, !confirmedConversation && styles.buttonDisabled, pressed && styles.buttonPressed]}
                    onPress={() => confirmedConversation && onOpenConversation?.({ ...confirmedConversation, otherUser: ownerProfile })}
                    disabled={!confirmedConversation}
                    accessibilityRole="button"
                    accessibilityLabel="Open gesprek"
                  >
                    <ChatCircleIcon size={18} color={COLORS.surface} weight="fill" accessibilityElementsHidden />
                    <Text style={styles.openChatButtonText}>Open gesprek</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.endButton, pressed && styles.buttonPressed]}
                    onPress={() => onEndSamenwerking?.(existingAanvraag)}
                    accessibilityRole="button"
                    accessibilityLabel="Beëindig samenwerking"
                  >
                    <Text style={styles.endButtonText}>Beëindig samenwerking</Text>
                  </Pressable>
                </View>
              </View>
            ) : onCancelAanvraag &&
            (existingAanvraag.status === 'pending' || existingAanvraag.status === 'accepted') ? (
              <View style={[styles.aanvraagSection, { paddingBottom: insets.bottom + SPACING.md }]}>
                <Pressable
                  style={({ pressed }) => [styles.cancelAanvraagButton, pressed && styles.buttonPressed]}
                  onPress={() => onCancelAanvraag(existingAanvraag.id)}
                  accessibilityRole="button"
                  accessibilityLabel="Aanvraag annuleren"
                >
                  <Text style={styles.cancelAanvraagButtonText}>Annuleer aanvraag</Text>
                </Pressable>
              </View>
            ) : (
              <View style={{ paddingBottom: insets.bottom + SPACING.xl }} />
            )
          ) : (
            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
              onPress={handleAanvraag}
            >
              <Text style={styles.primaryButtonText}>Stuur verzoek</Text>
            </Pressable>
          )
        ) : (
          <View style={[styles.ownerActionStack, { paddingBottom: insets.bottom }]}>
            <Pressable
              style={({ pressed }) => [styles.ownerPrimaryButton, pressed && styles.buttonPressed]}
              onPress={() => onEdit?.()}
              accessibilityRole="button"
              accessibilityLabel="Perceel bewerken"
            >
              <PencilSimpleIcon size={18} color={COLORS.surface} weight="regular" accessibilityElementsHidden />
              <Text style={styles.ownerPrimaryButtonText}>Bewerken</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.ownerSecondaryButton, pressed && styles.buttonPressed]}
              onPress={() => onToggleVisibility?.()}
              accessibilityRole="button"
              accessibilityLabel={visibilityLabel}
            >
              {perceelStatus === PERCEEL_STATUS.HIDDEN ? (
                <EyeIcon size={18} color={COLORS.brand} weight="regular" accessibilityElementsHidden />
              ) : (
                <EyeSlashIcon size={18} color={COLORS.brand} weight="regular" accessibilityElementsHidden />
              )}
              <Text style={styles.ownerSecondaryButtonText}>{visibilityLabel}</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.ownerDeleteButton, pressed && styles.buttonPressed]}
              onPress={() => onDelete?.()}
              accessibilityRole="button"
              accessibilityLabel="Perceel verwijderen"
            >
              <Text style={styles.ownerDeleteButtonText}>Verwijderen</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.brand,
  },
  scroll: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  scrollContent: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.screenX,
    paddingTop: SPACING.screenX,
    paddingBottom: 0,
  },
  divider: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
    height: 1,
    backgroundColor: COLORS.border,
  },
  hiddenBanner: {
    backgroundColor: COLORS.accentSoft,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  hiddenBannerText: {
    flex: 1,
    color: COLORS.textPrimary,
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.md,
  },
  section: {
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.xl,
    lineHeight: 22,
    fontFamily: FONTS.displaySemiBold,
  },
  description: {
    marginTop: SPACING.sm,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.lg,
    lineHeight: 24,
    fontFamily: FONTS.body,
  },
  pillsRow: {
    marginTop: SPACING.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  pill: {
    backgroundColor: COLORS.surfaceBrand,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  pillText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  locationNotice: {
    marginTop: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.accentSoft,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  locationNoticeText: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButton: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
    height: 44,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: COLORS.textInverse,
    fontSize: FONT_SIZES.lg,
    lineHeight: 20,
    fontFamily: FONTS.displayMedium,
  },
  aanvraagStatusBanner: {
    backgroundColor: COLORS.accentSoft,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  aanvraagSection: {
    paddingTop: SPACING.md,
    gap: SPACING.xs,
  },
  cancelAanvraagButton: {
    minHeight: 44,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelAanvraagButtonText: {
    color: COLORS.negative,
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.md,
  },
  ownerActionStack: {
    paddingTop: SPACING.md,
    gap: SPACING.md,
  },
  ownerPrimaryButton: {
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.xl,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  ownerPrimaryButtonText: {
    color: COLORS.surface,
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.lg,
  },
  ownerSecondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.brand,
    borderRadius: RADIUS.xl,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  ownerSecondaryButtonText: {
    color: COLORS.brand,
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.lg,
  },
  ownerDeleteButton: {
    minHeight: 44,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerDeleteButtonText: {
    color: COLORS.negative,
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.md,
  },

  // ── Samenwerking section ─────────────────────────────────────
  samenwerkingSection: {
    paddingTop: SPACING.md,
    gap: SPACING.md,
  },
  samenwerkingCard: {
    backgroundColor: COLORS.accentSoft,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  samenwerkingPersonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  samenwerkingAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.surfaceMuted,
  },
  samenwerkingPersonText: {
    flex: 1,
    gap: SPACING.xxs,
  },
  samenwerkingName: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
  },
  samenwerkingDate: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  openChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.md,
    height: 44,
  },
  openChatButtonText: {
    fontFamily: FONTS.displayMedium,
    fontSize: FONT_SIZES.lg,
    color: COLORS.surface,
  },
  endButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.negative,
  },
  endButtonText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.md,
    color: COLORS.negative,
  },
});
