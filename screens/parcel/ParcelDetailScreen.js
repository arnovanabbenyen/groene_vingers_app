import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { EyeIcon, EyeSlashIcon, MapPinIcon, PencilSimpleIcon } from 'phosphor-react-native';
import ParcelDetailHeader from '../../components/parcel/ParcelDetailHeader';
import ParcelOverviewSection from '../../components/parcel/ParcelOverviewSection';
import ParcelPresenceSection from '../../components/parcel/ParcelPresenceSection';
import ParcelInfoList from '../../components/parcel/ParcelInfoList';
import ParcelOwnerCard from '../../components/parcel/ParcelOwnerCard';
import { supabase } from '../../services/supabase';
import { COLORS, FONTS, RADIUS, SPACING } from '../../components/theme/tokens';
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

export default function ParcelDetailScreen({
  perceel = {},
  onBack,
  onAanvraag,
  onRequest,
  isOwner = false,
  onEdit,
  onToggleVisibility,
  onDelete,
  onMorePress = () => {},
  isFavorited = false,
  onToggleFavorite,
  showFavoriteButton = false,
}) {
  const insets = useSafeAreaInsets();
  const [ownerProfile, setOwnerProfile] = useState(null);
  const [existingAanvraag, setExistingAanvraag] = useState(null);
  const handleAanvraag = onAanvraag || onRequest || (() => {});
  const perceelStatus = perceel.status || PERCEEL_STATUS.ACTIVE;
  const hiddenBannerVisible = isOwner && perceelStatus === PERCEEL_STATUS.HIDDEN;
  const visibilityLabel = perceelStatus === PERCEEL_STATUS.HIDDEN ? 'Weer zichtbaar maken' : 'Tijdelijk verbergen';

  const title = perceel.naam || perceel.title || 'Perceel';
  const location = perceel.plaats || perceel.location || 'Locatie nog niet beschikbaar';
  const sizeValue = perceel.grootte || perceel.size || '';
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
        .not('status', 'in', '("declined","cancelled")')
        .maybeSingle();

      if (mounted) setExistingAanvraag(data || null);
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

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <ParcelDetailHeader title="Perceel" onBack={onBack} onMorePress={isOwner ? undefined : onMorePress} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {hiddenBannerVisible ? (
          <View style={styles.hiddenBanner}>
            <EyeSlashIcon size={16} color={COLORS.textMuted} weight="regular" />
            <Text style={styles.hiddenBannerText}>Dit perceel is verborgen voor tuinzoekers.</Text>
          </View>
        ) : null}

        <ParcelOverviewSection
          fotos={perceel.fotos || []}
          fallbackImage={HERO_IMAGE}
          title={title}
          location={location}
          distance={perceel.distance || ''}
          ownerName={ownerDisplayName}
          stats={perceel.stats || [
            { value: sizeValue ? String(sizeValue).replace('m²', '') : '—', valueSuffix: 'm²', label: 'Grootte' },
            { value: 'Nu vrij', label: 'Beschikbaar' },
            { value: '4.5', label: 'Score' },
          ]}
          isFavorited={isFavorited}
          onFavoritePress={onToggleFavorite}
          showFavoriteButton={showFavoriteButton && !isOwner}
        />

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Beschrijving</Text>
          <Text style={styles.description}>
            {description}
          </Text>
        </View>

        {!isOwner && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Locatie</Text>
            {hasConfirmedSamenwerking && perceel.adres ? (
              <Text style={[styles.description, { marginTop: 8 }]}>{perceel.adres}</Text>
            ) : (
              <View style={styles.locationNotice}>
                <MapPinIcon size={14} color={COLORS.textSecondary} weight="regular" />
                <Text style={styles.locationNoticeText}>
                  Exacte locatie zichtbaar na bevestigde samenwerking
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.section}>
          <ParcelPresenceSection voorzieningen={perceel.voorzieningen || []} />
        </View>

        <View style={styles.section}>
          <ParcelInfoList items={extraInfo} />
        </View>

        <View style={styles.section}>
          <ParcelOwnerCard ownerProfile={ownerProfile} joinYear={ownerJoinYear} />
        </View>

        <View style={styles.divider} />

        {!isOwner ? (
          existingAanvraag ? (
            <View style={styles.aanvraagBanner}>
              <Text style={styles.aanvraagBannerText}>
                {AANVRAAG_STATUS_LABEL[existingAanvraag.status] ?? 'Aanvraag ingediend'}
              </Text>
            </View>
          ) : (
            <Pressable style={styles.primaryButton} onPress={handleAanvraag}>
              <Text style={styles.primaryButtonText}>Stuur verzoek</Text>
            </Pressable>
          )
        ) : (
          <View style={[styles.ownerActionStack, { paddingBottom: insets.bottom + 16 }]}>
            <TouchableOpacity
              style={styles.ownerPrimaryButton}
              onPress={() => onEdit?.()}
              accessibilityRole="button"
              accessibilityLabel="Perceel bewerken"
              activeOpacity={0.8}
            >
              <PencilSimpleIcon size={18} color={COLORS.surface} weight="regular" />
              <Text style={styles.ownerPrimaryButtonText}>Bewerken</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.ownerSecondaryButton}
              onPress={() => onToggleVisibility?.()}
              accessibilityRole="button"
              accessibilityLabel={visibilityLabel}
              activeOpacity={0.8}
            >
              {perceelStatus === PERCEEL_STATUS.HIDDEN ? (
                <EyeIcon size={18} color={COLORS.brand} weight="regular" />
              ) : (
                <EyeSlashIcon size={18} color={COLORS.brand} weight="regular" />
              )}
              <Text style={styles.ownerSecondaryButtonText}>{visibilityLabel}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.ownerDeleteButton}
              onPress={() => onDelete?.()}
              accessibilityRole="button"
              accessibilityLabel="Perceel verwijderen"
              activeOpacity={0.8}
            >
              <Text style={styles.ownerDeleteButtonText}>Verwijderen</Text>
            </TouchableOpacity>
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
    paddingTop: 31,
    paddingBottom: 20,
  },
  divider: {
    marginTop: 24,
    height: 1,
    backgroundColor: COLORS.border,
  },
  hiddenBanner: {
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: SPACING.screenX,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hiddenBannerText: {
    color: COLORS.textPrimary,
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    flex: 1,
  },
  section: {
    marginTop: 18,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    lineHeight: 22,
    fontFamily: FONTS.displaySemiBold,
    fontWeight: '600',
  },
  description: {
    marginTop: 12,
    color: COLORS.textPrimary,
    fontSize: 16,
    lineHeight: 24,
    fontFamily: FONTS.body,
    fontWeight: '400',
  },
  primaryButton: {
    marginTop: 18,
    height: 41,
    borderRadius: RADIUS.xs,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: COLORS.textInverse,
    fontSize: 16,
    lineHeight: 16,
    fontFamily: FONTS.displayMedium,
    fontWeight: '500',
  },
  aanvraagBanner: {
    marginTop: 18,
    height: 41,
    borderRadius: RADIUS.xs,
    backgroundColor: COLORS.surfaceBrand,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.brand,
  },
  aanvraagBannerText: {
    color: COLORS.brand,
    fontSize: 16,
    lineHeight: 16,
    fontFamily: FONTS.displayMedium,
  },
  ownerActionStack: {
    paddingTop: 18,
    gap: 12,
  },
  ownerPrimaryButton: {
    backgroundColor: COLORS.brand,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  ownerPrimaryButtonText: {
    color: COLORS.surface,
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
  },
  ownerSecondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.brand,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  ownerSecondaryButtonText: {
    color: COLORS.brand,
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
  },
  ownerDeleteButton: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  ownerDeleteButtonText: {
    color: COLORS.negative,
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
  },
  locationNotice: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surfaceBrand,
    borderRadius: RADIUS.sm,
    padding: 10,
  },
  locationNoticeText: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});
