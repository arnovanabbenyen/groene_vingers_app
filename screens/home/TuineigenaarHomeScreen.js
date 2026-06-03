import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { HandshakeIcon, EnvelopeOpenIcon, LeafIcon, PlusCircleIcon } from 'phosphor-react-native';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SIZES, SPACING } from '../../components/theme/tokens';
import BottomNav from '../../components/navigation/BottomNav';
import PercelenCarousel from '../../components/perceel/PercelenCarousel';
import { supabase } from '../../services/supabase';
import { showToast } from '../../components/common/Toast';
import { showConfirm } from '../../components/common/ConfirmDialog';
import PerceelToevoegenScreen from '../parcel/PerceelToevoegenScreen';
import ParcelDetailScreen from '../parcel/ParcelDetailScreen';
import AanvraagCard from '../../components/aanvraag/AanvraagCard';
import AanvraagCarousel from '../../components/aanvraag/AanvraagCarousel';
import { usePendingAanvragen } from '../../hooks/usePendingAanvragen';
import VerzoekenOverzichtScreen from '../aanvraag/VerzoekenOverzichtScreen';
import AanvraagDetailScreen from '../aanvraag/AanvraagDetailScreen';
import ProfielScreen from '../profile/ProfielScreen';
import BerichtenOverzichtScreen from '../berichten/BerichtenOverzichtScreen';
import ConversationDetailScreen from '../berichten/ConversationDetailScreen';
import { createConversationForAanvraag } from '../../services/conversations';
import { AANVRAAG_STATUS } from '../../services/aanvraagStatus';
import PlotCard, { PLOT_CARD } from '../../components/home/PlotCard';
import { mapPerceelToPlot } from '../../utils/mapPerceelToPlot';
import TuineigenaarHeader from '../../components/home/TuineigenaarHeader';
import DashboardSection from '../../components/common/DashboardSection';
import DashboardEmptyState from '../../components/home/DashboardEmptyState';

const PERCEEL_STATUS = {
  ACTIVE: 'active',
  HIDDEN: 'hidden',
  DELETED: 'deleted',
};

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
  onOpenConversation,
  selectedConversation = null,
  onCloseConversation,
  unreadNotificationsCount = 0,
  onOpenNotifications,
  onOpenProfiel,
  onEndSamenwerking,
  getInitialTab,
  requestedTab,
}) {
  const [activeTab, setActiveTab] = useState(() => getInitialTab?.() ?? 'start');

  useEffect(() => {
    if (requestedTab) setActiveTab(requestedTab);
  }, [requestedTab]);
  const [profileImageSource, setProfileImageSource] = useState(null);
  const [profile, setProfile] = useState(null);
  const [plaats, setPlaats] = useState('');
  const [percelen, setPercelen] = useState([]);
  const [selectedPerceel, setSelectedPerceel] = useState(null);
  const [perceelMode, setPerceelMode] = useState(null);
  const [perceelRefreshKey, setPerceelRefreshKey] = useState(0);
  const [samenwerkingen, setSamenwerkingen] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [selectedSamenwerking, setSelectedSamenwerking] = useState(null);
  const [activeDotSamenwerking, setActiveDotSamenwerking] = useState(0);
  const [senderProfileId, setSenderProfileId] = useState(null);
  const { aanvragen, isLoading: isLoadingAanvragen, setAanvragen } = usePendingAanvragen(aanvragenRefreshKey);

  function handleTabPress(item) {
    if (item.key === 'perceel') {
      setActiveTab('perceel');
      return;
    }
    if (item.key === 'profiel') {
      onOpenProfiel?.();
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
        if (userError) throw userError;

        const userId = userData?.user?.id;
        if (!userId) return;

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url, plaats')
          .eq('id', userId)
          .maybeSingle();

        if (profileError) {
          console.warn('Failed to fetch profile avatar', profileError);
        }

        if (mounted) {
          setProfile(profileData || null);
          setCurrentUserId(userId);
          if (profileData?.plaats) setPlaats(profileData.plaats);
        }
        if (mounted && profileData?.avatar_url) setProfileImageSource(profileData.avatar_url);

        const { data: percelenData, error: percelenError } = await supabase
          .from('percelen')
          .select('id, owner_id, naam, beschrijving, grootte, adres, plaats, lat, lng, approximate_lat, approximate_lng, extra_info, fotos, voorzieningen, voorkeur_samenwerking, created_at, updated_at, status')
          .eq('owner_id', userId)
          .order('created_at', { ascending: false });

        if (percelenError) {
          console.warn('Failed to load percelen', percelenError);
        }

        if (mounted) setPercelen(percelenData || []);

        const perceelIds = (percelenData || []).map((p) => p.id);
        if (perceelIds.length > 0) {
          const { data: confirmedAanvragen } = await supabase
            .from('aanvragen')
            .select('id, status, confirmed_at, perceel_id, sender_id, type_samenwerking, percelen(id, naam, beschrijving, grootte, adres, fotos, plaats, voorzieningen, voorkeur_samenwerking, approximate_lat, approximate_lng, lat, lng, extra_info, status, owner_id)')
            .in('perceel_id', perceelIds)
            .eq('status', AANVRAAG_STATUS.CONFIRMED);

          const aanvraagIds = (confirmedAanvragen || []).map((a) => a.id);
          let conversationsByAanvraag = {};
          if (aanvraagIds.length > 0) {
            const { data: conversations } = await supabase
              .from('conversations')
              .select('id, aanvraag_id')
              .in('aanvraag_id', aanvraagIds);
            for (const conv of conversations || []) {
              conversationsByAanvraag[conv.aanvraag_id] = conv;
            }
          }

          const senderIds = [...new Set((confirmedAanvragen || []).map((a) => a.sender_id))];
          let profileById = {};
          if (senderIds.length > 0) {
            const { data: senderProfiles } = await supabase
              .from('profiles')
              .select('id, first_name, last_name, avatar_url')
              .in('id', senderIds);
            for (const sp of senderProfiles || []) {
              profileById[sp.id] = sp;
            }
          }

          const enriched = (confirmedAanvragen || []).map((a) => ({
            ...a,
            conversation: conversationsByAanvraag[a.id] || null,
            senderProfile: profileById[a.sender_id] || null,
          }));

          if (mounted) setSamenwerkingen(enriched);
        }
      } catch (e) {
        console.warn('loadDashboardData error', e);
        showToast('Kan geen verbinding maken met de server. Controleer je internetverbinding en probeer het opnieuw.', 'error');
      }
    }

    loadDashboardData();
    return () => { mounted = false; };
  }, [perceelRefreshKey]);

  function handleAccept(aanvraagId) {
    const aanvraag = aanvragen.find((item) => item.id === aanvraagId);

    showConfirm({
      title: 'Accepteer aanvraag?',
      message: `Weet je zeker dat je deze aanvraag wilt accepteren? De aanvrager wordt hierover geïnformeerd.`,
      confirmLabel: 'Accepteer',
      cancelLabel: 'Annuleren',
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('aanvragen')
            .update({ status: AANVRAAG_STATUS.ACCEPTED, updated_at: new Date().toISOString() })
            .eq('id', aanvraagId);

          if (error) {
            console.error('Failed to accept aanvraag', error);
            showToast('De aanvraag kon niet worden geaccepteerd. Probeer opnieuw.', 'error');
            return;
          }

          if (aanvraag?.id && aanvraag?.sender_id) {
            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (userError) {
              console.warn('Failed to load current user for conversation creation', userError);
            } else {
              const { error: conversationError } = await createConversationForAanvraag({
                aanvraagId: aanvraag.id,
                ownerId: userData?.user?.id,
                senderId: aanvraag.sender_id,
              });

              if (conversationError) console.warn('Failed to create conversation for accepted aanvraag', conversationError);
            }
          }

          setAanvragen((current) => current.filter((aanvraag) => aanvraag.id !== aanvraagId));
          onBadgeCountChange?.((current) => Math.max(0, current - 1));
          onAanvraagActionComplete?.();
          showToast('Aanvraag geaccepteerd', 'success');
        } catch (error) {
          console.error('Failed to accept aanvraag', error);
          showToast('De aanvraag kon niet worden geaccepteerd. Probeer opnieuw.', 'error');
        }
      },
    });
  }

  function handleSamenwerkingPress(samenwerking) {
    setSelectedSamenwerking(samenwerking);
    setSelectedPerceel(samenwerking.percelen);
    setPerceelMode('samenwerking-detail');
  }

  function handleSamenwerkingOpenConversation(samenwerking) {
    if (!samenwerking.conversation?.id) return;
    setPerceelMode(null);
    setSelectedSamenwerking(null);
    setSelectedPerceel(null);
    onOpenConversation?.({
      id: samenwerking.conversation.id,
      aanvraag_id: samenwerking.id,
      owner_id: currentUserId,
      sender_id: samenwerking.sender_id,
      otherUser: samenwerking.senderProfile,
    });
  }

  function handleViewAanvraag(aanvraag) {
    onViewAanvraag?.(aanvraag, activeTab === 'verzoeken' ? 'verzoeken' : 'home');
  }

  function handlePerceelPress(perceel) {
    setSelectedPerceel(perceel);
    setPerceelMode('view');
  }

  function handleEditPerceel() {
    setPerceelMode('edit');
  }

  function handleClosePerceel() {
    setActiveTab('start');
    setSelectedPerceel(null);
    setPerceelMode(null);
  }

  async function confirmDeletePerceel() {
    if (!selectedPerceel) return;

    const { error } = await supabase
      .from('percelen')
      .update({ status: PERCEEL_STATUS.DELETED, updated_at: new Date().toISOString() })
      .eq('id', selectedPerceel.id);

    if (error) {
      showToast('Perceel kon niet worden verwijderd. Probeer opnieuw.', 'error');
      return;
    }

    setSelectedPerceel(null);
    setPerceelMode(null);
    setPerceelRefreshKey((current) => current + 1);
    setActiveTab('start');
    showToast('Perceel is verwijderd', 'info');
  }

  function handleDeletePerceel() {
    if (!selectedPerceel) return;
    showConfirm({
      title: 'Perceel verwijderen?',
      message: 'Lopende aanvragen blijven bewaard, maar het perceel verdwijnt uit de app.',
      confirmLabel: 'Verwijderen',
      onConfirm: confirmDeletePerceel,
    });
  }

  async function handleToggleVisibility() {
    if (!selectedPerceel) return;

    const newStatus = selectedPerceel.status === PERCEEL_STATUS.HIDDEN ? PERCEEL_STATUS.ACTIVE : PERCEEL_STATUS.HIDDEN;
    const isHiding = newStatus === PERCEEL_STATUS.HIDDEN;

    const { error } = await supabase
      .from('percelen')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', selectedPerceel.id);

    if (error) {
      showToast('Zichtbaarheid kon niet worden bijgewerkt. Probeer opnieuw.', 'error');
      return;
    }

    setSelectedPerceel({ ...selectedPerceel, status: newStatus });
    setPerceelRefreshKey((current) => current + 1);
    showToast(
      isHiding ? 'Perceel is nu verborgen voor tuinzoekers' : 'Perceel is weer zichtbaar voor tuinzoekers',
      isHiding ? 'warning' : 'success',
    );
  }

  function handlePerceelSaved(savedPerceel) {
    const isNew = !selectedPerceel;
    if (savedPerceel?.id) {
      setSelectedPerceel(savedPerceel);
    }

    setPerceelRefreshKey((current) => current + 1);
    setPerceelMode('view');
    showToast(isNew ? 'Perceel toegevoegd' : 'Wijzigingen opgeslagen', 'success');
  }

  if (perceelMode === 'edit' && selectedPerceel) {
    return (
      <PerceelToevoegenScreen
        initialPerceel={selectedPerceel}
        onBack={() => setPerceelMode('view')}
        onSaved={handlePerceelSaved}
      />
    );
  }

  if (perceelMode === 'samenwerking-detail' && selectedSamenwerking) {
    return (
      <ParcelDetailScreen
        perceel={selectedPerceel || selectedSamenwerking.percelen}
        onBack={() => {
          setSelectedSamenwerking(null);
          setSelectedPerceel(null);
          setPerceelMode(null);
        }}
        isOwner={true}
        samenwerking={selectedSamenwerking}
        onOpenConversation={handleSamenwerkingOpenConversation}
        onEndSamenwerking={onEndSamenwerking}
      />
    );
  }

  if (perceelMode === 'view' && selectedPerceel) {
    return (
      <ParcelDetailScreen
        perceel={selectedPerceel}
        onBack={handleClosePerceel}
        isOwner={true}
        onEdit={handleEditPerceel}
        onToggleVisibility={handleToggleVisibility}
        onDelete={handleDeletePerceel}
      />
    );
  }

  if (currentScreen === 'aanvraag-detail' && selectedAanvraag) {
    if (senderProfileId) {
      return (
        <ProfielScreen
          profileUserId={senderProfileId}
          onBack={() => setSenderProfileId(null)}
        />
      );
    }

    return (
      <AanvraagDetailScreen
        aanvraag={selectedAanvraag}
        onBack={() => { setSenderProfileId(null); onCloseAanvraag?.(); }}
        onActionComplete={onAanvraagActionComplete}
        onViewProfile={(senderId) => { if (senderId) setSenderProfileId(senderId); }}
      />
    );
  }

  if (currentScreen === 'conversation-detail' && selectedConversation) {
    if (senderProfileId) {
      const matchingSamenwerking = samenwerkingen.find(
        (s) => s.id === selectedConversation.aanvraag_id,
      );
      return (
        <ProfielScreen
          profileUserId={senderProfileId}
          onBack={() => setSenderProfileId(null)}
          onStopSamenwerking={matchingSamenwerking ? () => onEndSamenwerking?.({
            ...matchingSamenwerking,
            conversationId: matchingSamenwerking.conversation?.id ?? selectedConversation.id,
          }) : undefined}
        />
      );
    }
    return (
      <ConversationDetailScreen
        conversation={selectedConversation}
        onBack={() => { setSenderProfileId(null); onCloseConversation?.(); }}
        onConfirmSamenwerking={() => { setSenderProfileId(null); onCloseConversation?.(); }}
        onViewProfile={(userId) => { if (userId) setSenderProfileId(userId); }}
      />
    );
  }

  if (activeTab === 'berichten') {
    return (
      <BerichtenOverzichtScreen
        onTabPress={handleTabPress}
        profileImageSource={profileImageSource}
        profileInitials={[profile?.first_name, profile?.last_name].filter(Boolean).map((n) => n[0]).join('').toUpperCase() || '?'}
        badgeCounts={badgeCounts}
        onOpenConversation={onOpenConversation}
        role="tuineigenaar"
      />
    );
  }

  if (activeTab === 'verzoeken') {
    return (
      <VerzoekenOverzichtScreen
        onTabPress={handleTabPress}
        profileImageSource={profileImageSource}
        profileInitials={[profile?.first_name, profile?.last_name].filter(Boolean).map((n) => n[0]).join('').toUpperCase() || '?'}
        badgeCounts={badgeCounts}
        onBadgeCountChange={onBadgeCountChange}
        onViewAanvraag={(aanvraag) => onViewAanvraag?.(aanvraag, 'verzoeken')}
        onAanvraagActionComplete={onAanvraagActionComplete}
      />
    );
  }

  if (activeTab === 'perceel') {
    return (
      <View style={styles.container}>
        <PerceelToevoegenScreen
          onSaved={(saved) => {
            setPerceelRefreshKey((current) => current + 1);
            setActiveTab('start');
            showToast('Perceel toegevoegd', 'success');
          }}
        />
        <BottomNav
          activeKey={activeTab}
          onTabPress={handleTabPress}
          role="tuineigenaar"
          profileImageSource={profileImageSource}
          profileInitials={[profile?.first_name, profile?.last_name].filter(Boolean).map((n) => n[0]).join('').toUpperCase() || '?'}
          badgeCounts={badgeCounts}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TuineigenaarHeader
        location={plaats}
        firstName={profile?.first_name || ''}
        onOpenNotifications={onOpenNotifications}
        unreadNotificationsCount={unreadNotificationsCount}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <DashboardSection title="Actieve samenwerkingen" contentStyle={styles.samenwerkingSection}>
          {samenwerkingen.length === 0 ? (
            <DashboardEmptyState
              icon={HandshakeIcon}
              title="Nog geen actieve samenwerkingen"
              body="Zodra een aanvraag als samenwerking is bevestigd, verschijnt die hier."
            />
          ) : (
            <>
              <ScrollView
                horizontal
                nestedScrollEnabled
                showsHorizontalScrollIndicator={false}
                style={styles.samenwerkingScroll}
                contentContainerStyle={styles.samenwerkingScrollContent}
                onMomentumScrollEnd={(event) => {
                  const nextDot = Math.round(event.nativeEvent.contentOffset.x / (PLOT_CARD.cardWidth + PLOT_CARD.carouselGap));
                  setActiveDotSamenwerking(Math.max(0, Math.min(samenwerkingen.length - 1, nextDot)));
                }}
              >
                {samenwerkingen.map((samenwerking) => {
                  const perceel = samenwerking.percelen;
                  if (!perceel) return null;
                  const plot = mapPerceelToPlot(perceel);
                  return (
                    <View key={samenwerking.id} style={styles.samenwerkingCardWrap}>
                      <PlotCard
                        plot={plot}
                        onPress={() => handleSamenwerkingPress(samenwerking)}
                        showFavoriteButton={false}
                      />
                      <View style={styles.samenwerkingChip}>
                        <Text style={styles.samenwerkingChipText}>Samenwerking actief</Text>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
              {samenwerkingen.length > 1 ? (
                <View
                  style={styles.dotRow}
                  accessibilityRole="adjustable"
                  accessibilityLabel="Samenwerkingen carrousel"
                  accessibilityValue={{
                    min: 1,
                    max: samenwerkingen.length,
                    now: Math.max(0, Math.min(samenwerkingen.length - 1, activeDotSamenwerking)) + 1,
                    text: `Samenwerking ${Math.max(0, Math.min(samenwerkingen.length - 1, activeDotSamenwerking)) + 1} van ${samenwerkingen.length}`,
                  }}
                  accessibilityLiveRegion="polite"
                >
                  {samenwerkingen.map((s, index) => (
                    <View
                      key={`dot-sw-${s.id}`}
                      style={[styles.dot, index === Math.max(0, Math.min(samenwerkingen.length - 1, activeDotSamenwerking)) && styles.dotActive]}
                      accessibilityElementsHidden
                      importantForAccessibility="no"
                    />
                  ))}
                </View>
              ) : null}
            </>
          )}
        </DashboardSection>

        <DashboardSection
          title="Nieuwe aanvragen"
          action={aanvragen.length > 0 ? (
            <Pressable
              onPress={() => setActiveTab('verzoeken')}
              style={styles.bekijkAllesButton}
              accessibilityRole="button"
              accessibilityLabel={`Bekijk alle ${aanvragen.length} aanvragen`}
            >
              <Text style={styles.bekijkAllesText}>
                Bekijk alles{aanvragen.length >= 2 ? ` (${aanvragen.length})` : ''}
              </Text>
            </Pressable>
          ) : null}
        >
          {isLoadingAanvragen ? (
            <View style={styles.loadingWrap} accessibilityLabel="Aanvragen worden geladen">
              <ActivityIndicator size="small" color={COLORS.brand} />
            </View>
          ) : aanvragen.length === 0 ? (
            <DashboardEmptyState
              icon={EnvelopeOpenIcon}
              title="Nog geen aanvragen ontvangen"
              body="Wanneer iemand interesse heeft in jouw perceel zie je het hier."
            />
          ) : (
            <AanvraagCarousel
              aanvragen={aanvragen}
              onView={handleViewAanvraag}
              onAccept={handleAccept}
            />
          )}
        </DashboardSection>

        <DashboardSection
          title="Jouw percelen"
          action={(
            <Pressable
              onPress={() => setActiveTab('perceel')}
              accessibilityRole="button"
              accessibilityLabel="Nieuw perceel"
              accessibilityHint="Open het scherm om een nieuw perceel toe te voegen"
              style={styles.addPerceelButton}
            >
              <PlusCircleIcon size={18} color={COLORS.surface} weight="regular" accessibilityElementsHidden />
              <Text style={styles.addPerceelButtonText}>Nieuw perceel</Text>
            </Pressable>
          )}
        >
          {(percelen || []).filter((p) => p.status !== PERCEEL_STATUS.DELETED).length === 0 ? (
            <DashboardEmptyState
              icon={LeafIcon}
              title="Nog geen percelen"
              body="Voeg je eerste perceel toe om aanvragen te ontvangen."
            />
          ) : (
            <PercelenCarousel
              percelen={(percelen || []).filter((p) => p.status !== PERCEEL_STATUS.DELETED)}
              onPerceelPress={handlePerceelPress}
            />
          )}
        </DashboardSection>

      </ScrollView>

      <BottomNav
        activeKey={activeTab}
        onTabPress={handleTabPress}
        role="tuineigenaar"
        profileImageSource={profileImageSource}
        profileInitials={[profile?.first_name, profile?.last_name].filter(Boolean).map((n) => n[0]).join('').toUpperCase() || '?'}
        badgeCounts={badgeCounts}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: SPACING.screenX,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
    gap: SPACING.xl,
    flexGrow: 1,
  },
  samenwerkingSection: {
    gap: SPACING.sm,
  },
  samenwerkingCardWrap: {
    position: 'relative',
  },
  samenwerkingChip: {
    position: 'absolute',
    top: PLOT_CARD.cardPadding + PLOT_CARD.badgeInset,
    left: PLOT_CARD.cardPadding + PLOT_CARD.badgeInset,
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    zIndex: 10,
  },
  samenwerkingChipText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.xs,
    color: COLORS.surface,
    lineHeight: 14,
  },
  samenwerkingScroll: {
    marginHorizontal: -SPACING.screenX,
  },
  samenwerkingScrollContent: {
    gap: PLOT_CARD.carouselGap,
    paddingBottom: SPACING.xxs,
    paddingHorizontal: SPACING.screenX,
  },
  dotRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  dot: {
    width: SIZES.dot,
    height: SIZES.dot,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.indicatorMuted,
  },
  dotActive: {
    width: 24,
    backgroundColor: COLORS.brand,
  },
  addPerceelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.brand,
  },
  addPerceelButtonText: {
    color: COLORS.surface,
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.md,
  },
  loadingWrap: {
    minHeight: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bekijkAllesButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    borderColor: COLORS.brand,
  },
  bekijkAllesText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.brand,
  },
});
