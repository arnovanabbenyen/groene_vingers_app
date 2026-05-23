import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  BellIcon,
  HandshakeIcon,
  EnvelopeOpenIcon,
  CalendarIcon,
  LeafIcon,
  MapPinIcon,
  PlusCircleIcon,
  StarIcon,
  HouseIcon,
} from 'phosphor-react-native';
import { COLORS, FONTS, RADIUS, SHADOWS, SIZES, SPACING } from '../../components/theme/tokens';
import BottomNav from '../../components/navigation/BottomNav';
import { supabase } from '../../services/supabase';
import PerceelToevoegenScreen from '../parcel/PerceelToevoegenScreen';
import AanvraagCard, { normalizeSize } from '../../components/aanvraag/AanvraagCard';
import { usePendingAanvragen } from '../../hooks/usePendingAanvragen';
import VerzoekenOverzichtScreen from '../aanvraag/VerzoekenOverzichtScreen';
import AanvraagDetailScreen from '../aanvraag/AanvraagDetailScreen';

const PROFILE_IMAGE = require('../../images/tuineigenaar_pfp.png');

function EmptyRequestsState() {
  return (
    <View style={styles.emptyState} accessible accessibilityRole="text">
      <EnvelopeOpenIcon size={40} color={COLORS.brand} weight="regular" />
      <Text style={styles.emptyTitle}>Nog geen aanvragen ontvangen</Text>
      <Text style={styles.emptySubtext}>Wanneer iemand interesse heeft in jouw perceel zie je het hier.</Text>
    </View>
  );
}

function ActiveSamenwerkingenEmpty() {
  return (
    <View style={styles.emptyFeatureCard} accessible accessibilityRole="text">
      <HandshakeIcon size={40} color={COLORS.brand} weight="regular" />
      <Text style={styles.emptyFeatureTitle}>Nog geen actieve samenwerkingen</Text>
      <Text style={styles.emptyFeatureSubtext}>
        Zodra je een aanvraag accepteert, verschijnen je actieve samenwerkingen hier.
      </Text>
      {/* TODO: render actual active samenwerkingen cards when aanvragen with status='accepted' exist. For now, show empty state only. */}
    </View>
  );
}

function PlanningEmpty() {
  return (
    <View style={styles.emptyFeatureCard} accessible accessibilityRole="text">
      <CalendarIcon size={40} color={COLORS.brand} weight="regular" />
      <Text style={styles.emptyFeatureTitle}>Nog geen planning</Text>
      <Text style={styles.emptyFeatureSubtext}>
        Hier zie je wanneer je tuinzoekers langskomen. Eerst een samenwerking accepteren.
      </Text>
      {/* TODO: implement planning section with calendar grid showing names of tuinzoekers per day (matching Figma design "Arno", "Dries" rows). Comes after the active samenwerkingen feature. */}
    </View>
  );
}

function PercelenEmpty({ onAddPress }) {
  return (
    <View style={styles.percelenEmptyCard} accessible accessibilityRole="text">
      <LeafIcon size={40} color={COLORS.brand} weight="regular" />
      <Text style={styles.emptyFeatureTitle}>Nog geen percelen</Text>
      <Text style={styles.emptyFeatureSubtext}>
        Voeg je eerste perceel toe om aanvragen te ontvangen.
      </Text>
      <Pressable
        onPress={onAddPress}
        style={styles.perceelAddButton}
        accessibilityRole="button"
        accessibilityLabel="Perceel toevoegen"
        accessibilityHint="Open het scherm om een nieuw perceel toe te voegen"
      >
        <Text style={styles.perceelAddButtonText}>Perceel toevoegen</Text>
      </Pressable>
    </View>
  );
}

function PerceelCarouselCard({ perceel, onPress }) {
  const [imageError, setImageError] = useState(false);
  const firstPhoto = Array.isArray(perceel?.fotos) ? perceel.fotos[0] : null;
  const location = perceel?.plaats || 'Locatie nog niet beschikbaar';
  const title = perceel?.naam || 'Perceel';
  const size = normalizeSize(perceel?.grootte);
  const chips = Array.isArray(perceel?.voorzieningen) ? perceel.voorzieningen.filter(Boolean) : [];
  const amenities = chips.slice(0, 3);

  return (
    <Pressable
      onPress={() => onPress(perceel)}
      style={styles.perceelCard}
      accessibilityRole="button"
      accessibilityLabel={`Perceel ${title}`}
      accessibilityHint="Open perceelbeheer"
    >
      <View style={styles.perceelImageWrap}>
        {firstPhoto && !imageError ? (
          <Image
            source={{ uri: firstPhoto }}
            style={styles.perceelImage}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={[styles.perceelImage, styles.perceelPlaceholder]}>
            <LeafIcon size={34} color={COLORS.brand} weight="regular" />
          </View>
        )}

        <View style={styles.perceelStatusPill}>
          <Text style={styles.perceelStatusText}>actief</Text>
        </View>

        <View style={styles.perceelMetaOverlay}>
          <View style={styles.perceelLocationPill}>
            <MapPinIcon size={14} color={COLORS.textPrimary} weight="regular" />
            <Text style={styles.perceelLocationText}>{location}</Text>
          </View>

          <View style={styles.perceelRatingPill}>
            <StarIcon size={14} color={COLORS.accent} weight="fill" />
            <Text style={styles.perceelRatingText}>4,5</Text>
          </View>
        </View>
      </View>

      <View style={styles.perceelHeaderRow}>
        <Text style={styles.perceelTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.perceelSize}>{size}</Text>
      </View>

      <View style={styles.perceelMetaRow}>
        {amenities.map((amenity, index) => (
          <View key={`${perceel?.id || 'perceel'}-${amenity}-${index}`} style={styles.perceelMetaItem}>
            <PerceelAmenityIcon label={amenity} />
            <Text style={styles.perceelMetaText}>{amenity}</Text>
            {index < amenities.length - 1 ? <View style={styles.perceelMetaDivider} /> : null}
          </View>
        ))}
      </View>
    </Pressable>
  );
}

function PerceelAmenityIcon({ label }) {
  const normalized = String(label || '').toLowerCase();

  if (normalized.includes('water')) {
    return <MapPinIcon size={14} color={COLORS.textPrimary} weight="regular" />;
  }

  if (normalized.includes('tool') || normalized.includes('materiaal')) {
    return <MapPinIcon size={14} color={COLORS.textPrimary} weight="regular" />;
  }

  if (normalized.includes('zaden') || normalized.includes('plant')) {
    return <LeafIcon size={14} color={COLORS.textPrimary} weight="regular" />;
  }

  if (normalized.includes('boom')) {
    return <LeafIcon size={14} color={COLORS.textPrimary} weight="regular" />;
  }

  return <HouseIcon size={14} color={COLORS.textPrimary} weight="regular" />;
}

function PercelenCarousel({ percelen, onAddPress, onPerceelPress }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!percelen || percelen.length === 0) {
    return <PercelenEmpty onAddPress={onAddPress} />;
  }

  return (
    <View>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const slideWidth = event.nativeEvent.layoutMeasurement.width;
          const offset = event.nativeEvent.contentOffset.x;
          setActiveIndex(Math.round(offset / slideWidth));
        }}
        contentContainerStyle={styles.percelenScroller}
      >
        {percelen.map((perceel) => (
          <PerceelCarouselCard key={perceel.id} perceel={perceel} onPress={onPerceelPress} />
        ))}
      </ScrollView>

      {percelen.length > 1 ? (
        <View style={styles.percelenDotsRow}>
          {percelen.map((perceel, index) => (
            <View key={`${perceel.id}-dot`} style={[styles.percelenDot, index === activeIndex && styles.percelenDotActive]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

export default function TuineigenaarHomeScreen({
  onLogout,
  badgeCounts = {},
  onBadgeCountChange,
  currentScreen = 'home',
  selectedAanvraag = null,
  onViewAanvraag,
  onCloseAanvraag,
  onAanvraagActionComplete,
  aanvragenRefreshKey = 0,
}) {
  const [activeTab, setActiveTab] = useState('start');
  const [profileImageSource, setProfileImageSource] = useState(PROFILE_IMAGE);
  const [profile, setProfile] = useState(null);
  const [percelen, setPercelen] = useState([]);
  const { aanvragen, isLoading: isLoadingAanvragen, setAanvragen } = usePendingAanvragen(aanvragenRefreshKey);

  function handleTabPress(item) {
    if (item.key === 'perceel') {
      setActiveTab('perceel');
      return;
    }

    setActiveTab(item.key);
  }

  useEffect(() => {
    let mounted = true;

    async function loadDashboardData() {
      if (!supabase) return;

      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) {
          throw userError;
        }

        const userId = userData?.user?.id;
        if (!userId) {
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url')
          .eq('id', userId)
          .maybeSingle();

        if (profileError) {
          console.log('Failed to fetch profile avatar', profileError);
        }

        if (mounted) setProfile(profileData || null);
        if (mounted && profileData?.avatar_url) setProfileImageSource(profileData.avatar_url);

        const { data: percelenData, error: percelenError } = await supabase
          .from('percelen')
          .select('id, naam, grootte, plaats, fotos, voorzieningen')
          .eq('owner_id', userId)
          .order('created_at', { ascending: false });

        if (percelenError) {
          console.warn('Failed to load percelen', percelenError);
        }

        if (mounted) setPercelen(percelenData || []);
      } catch (e) {
        console.warn('loadDashboardData error', e);
      } finally {
        // aanvragen load through the shared hook
      }
    }

    loadDashboardData();
    return () => { mounted = false; };
  }, []);

  async function handleAccept(aanvraagId) {
    try {
      const { error } = await supabase
        .from('aanvragen')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', aanvraagId);

      if (error) {
        console.error('Failed to accept aanvraag', error);
        Alert.alert('Fout', 'De aanvraag kon niet worden geaccepteerd. Probeer opnieuw.');
        return;
      }

      setAanvragen((current) => current.filter((aanvraag) => aanvraag.id !== aanvraagId));
      onBadgeCountChange?.((current) => Math.max(0, current - 1));
      onAanvraagActionComplete?.();
      Alert.alert('Aanvraag geaccepteerd', 'De aanvrager wordt hierover geïnformeerd.');
    } catch (error) {
      console.error('Failed to accept aanvraag', error);
      Alert.alert('Fout', 'De aanvraag kon niet worden geaccepteerd. Probeer opnieuw.');
    }
  }

  function handleViewAanvraag(aanvraag) {
    onViewAanvraag?.(aanvraag, activeTab === 'verzoeken' ? 'verzoeken' : 'home');
  }

  if (currentScreen === 'aanvraag-detail' && selectedAanvraag) {
    return (
      <AanvraagDetailScreen
        aanvraag={selectedAanvraag}
        onBack={onCloseAanvraag}
        onActionComplete={onAanvraagActionComplete}
      />
    );
  }

  if (activeTab === 'verzoeken') {
    return (
      <VerzoekenOverzichtScreen
        onTabPress={handleTabPress}
        profileImageSource={profileImageSource}
        badgeCounts={badgeCounts}
        onBadgeCountChange={onBadgeCountChange}
        onViewAanvraag={(aanvraag) => onViewAanvraag?.(aanvraag, 'verzoeken')}
        onAanvraagActionComplete={onAanvraagActionComplete}
      />
    );
  }

  function handlePerceelPress(perceel) {
    console.log('Perceel selected', perceel.id);
    // TODO: open perceel edit/management screen (currently a placeholder)
    Alert.alert('Binnenkort beschikbaar', 'Het bewerken van een perceel komt binnenkort.');
  }

  if (activeTab === 'perceel') {
    return (
      <PerceelToevoegenScreen
        onBack={() => {
          setActiveTab('start');
        }}
        onSaved={() => {
          setActiveTab('start');
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.locationRow}>
            <MapPinIcon size={16} color={COLORS.surface} weight="regular" />
            {/* TODO: replace hardcoded location once the location feature ships. */}
            <Text style={styles.locationText}>Kessel-Lo</Text>
          </View>
          <Pressable hitSlop={8} accessibilityRole="button" accessibilityLabel="Meldingen">
            <BellIcon size={24} color={COLORS.surface} weight="regular" />
          </Pressable>
        </View>

        <Text style={styles.greeting}>Hallo, {profile?.first_name || 'Arno'}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">Actieve samenwerkingen</Text>
          <ActiveSamenwerkingenEmpty />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">Jouw planning</Text>
          <PlanningEmpty />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">Nieuwe aanvragen</Text>

          {isLoadingAanvragen ? (
            <View style={styles.loadingWrap} accessibilityLabel="Aanvragen worden geladen">
              <ActivityIndicator size="small" color={COLORS.brand} />
            </View>
          ) : aanvragen.length === 0 ? (
            <EmptyRequestsState />
          ) : (
            aanvragen.map((aanvraag) => (
              <AanvraagCard
                key={aanvraag.id}
                aanvraag={aanvraag}
                onAccept={handleAccept}
                onView={handleViewAanvraag}
              />
            ))
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.percelenHeaderRow}>
            <Text style={styles.sectionTitle} accessibilityRole="header">Jouw percelen</Text>
            <Pressable
              onPress={() => setActiveTab('perceel')}
              accessibilityRole="button"
              accessibilityLabel="Perceel toevoegen"
              accessibilityHint="Open het scherm om een nieuw perceel toe te voegen"
              hitSlop={8}
            >
              <PlusCircleIcon size={32} color={COLORS.brand} weight="regular" />
            </Pressable>
          </View>

          <PercelenCarousel
            percelen={percelen}
            onAddPress={() => setActiveTab('perceel')}
            onPerceelPress={handlePerceelPress}
          />
        </View>

        <View style={{ height: SIZES.bottomNavClearance }} />
      </ScrollView>

      <BottomNav
        activeKey={activeTab}
        onTabPress={handleTabPress}
        role="tuineigenaar"
        profileImageSource={profileImageSource}
        badgeCounts={badgeCounts}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  header: {
    backgroundColor: COLORS.brand,
    paddingTop: 16,
    paddingHorizontal: SPACING.screenX,
    paddingBottom: SPACING.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.surface,
  },
  greeting: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 25,
    color: COLORS.surface,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.screenX,
    backgroundColor: COLORS.surface,
  },
  section: {
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 20,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  percelenHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  loadingWrap: {
    minHeight: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontFamily: FONTS.displaySemiBold,
    fontSize: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    color: COLORS.textSecondary,
    fontFamily: FONTS.body,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  emptyFeatureCard: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(54, 57, 43, 0.08)',
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    ...SHADOWS.card,
  },
  emptyFeatureTitle: {
    color: COLORS.textPrimary,
    fontFamily: FONTS.displaySemiBold,
    fontSize: 16,
    textAlign: 'center',
  },
  emptyFeatureSubtext: {
    color: COLORS.textSecondary,
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 280,
  },
  percelenEmptyCard: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(54, 57, 43, 0.08)',
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.sm,
    ...SHADOWS.card,
  },
  perceelAddButton: {
    height: 44,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xs,
  },
  perceelAddButtonText: {
    color: COLORS.surface,
    fontFamily: FONTS.displayMedium,
    fontSize: 16,
  },
  percelenScroller: {
    gap: SPACING.md,
    paddingRight: SPACING.screenX,
    paddingBottom: SPACING.xs,
  },
  perceelCard: {
    width: 266,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm,
    padding: 8,
    gap: 10,
    ...SHADOWS.card,
  },
  perceelImageWrap: {
    position: 'relative',
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  },
  perceelImage: {
    width: '100%',
    height: 167,
    borderRadius: RADIUS.sm,
  },
  perceelPlaceholder: {
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  perceelStatusPill: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  perceelStatusText: {
    color: COLORS.brand,
    fontFamily: FONTS.body,
    fontSize: 12.8,
  },
  perceelMetaOverlay: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  perceelLocationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: '68%',
  },
  perceelLocationText: {
    color: COLORS.textPrimary,
    fontFamily: FONTS.body,
    fontSize: 12.8,
    flexShrink: 1,
  },
  perceelRatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  perceelRatingText: {
    color: COLORS.textPrimary,
    fontFamily: FONTS.body,
    fontSize: 12.8,
  },
  perceelHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  perceelTitle: {
    flex: 1,
    color: COLORS.textPrimary,
    fontFamily: FONTS.displayMedium,
    fontSize: 16,
  },
  perceelSize: {
    color: COLORS.textPrimary,
    fontFamily: FONTS.body,
    fontSize: 12.8,
  },
  perceelMetaRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  perceelMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 10,
    marginBottom: 6,
  },
  perceelMetaText: {
    color: COLORS.textPrimary,
    fontFamily: FONTS.body,
    fontSize: 12.8,
  },
  perceelMetaDivider: {
    width: 1,
    height: 18,
    backgroundColor: COLORS.border,
    marginLeft: 10,
  },
  percelenDotsRow: {
    marginTop: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  percelenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.indicatorMuted,
  },
  percelenDotActive: {
    width: 14,
    backgroundColor: COLORS.brand,
  },
});
