import { useEffect, useMemo, useReducer, useState } from 'react';
import { useFavorites } from '../../hooks/useFavorites';
import { usePercelen } from '../../hooks/usePercelen';
import { useMyAanvragen } from '../../hooks/useMyAanvragen';
import { useUserProfile } from '../../hooks/useUserProfile';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import BottomNav from '../../components/navigation/BottomNav';
import HomeHeader from '../../components/home/HomeHeader';
import { mapPerceelToPlot } from '../../utils/mapPerceelToPlot';
import HomePromoCard from '../../components/home/HomePromoCard';
import HomeSectionCta from '../../components/home/HomeSectionCta';
import PlotCard from '../../components/home/PlotCard';
import BerichtenOverzichtScreen from '../berichten/BerichtenOverzichtScreen';
import ConversationDetailScreen from '../berichten/ConversationDetailScreen';
import ProfielScreen from '../profile/ProfielScreen';
import PlansScreen from '../plans/PlansScreen';
import ParcelDetailScreen from '../parcel/ParcelDetailScreen';
import GeenToegangScreen from '../aanvraag/GeenToegangScreen';
import AanvraagDoenScreen from '../aanvraag/AanvraagDoenScreen';
import AanvraagBevestigingScreen from '../aanvraag/AanvraagBevestigingScreen';
import LogboekScreen from '../loggen/LogboekScreen';
import KaartScreen from '../kaart/KaartScreen';
import { MagnifyingGlassIcon } from 'phosphor-react-native';
import EmptyState from '../../components/common/EmptyState';
import { showConfirm } from '../../components/common/ConfirmDialog';
import { showToast } from '../../components/common/Toast';
import { supabase } from '../../services/supabase';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SIZES, SPACING } from '../../components/theme/tokens';
import { PLOT_CARD } from '../../components/home/PlotCard';

const AANVRAAG_STATUS_CHIP = {
  pending: { label: 'In behandeling', bg: 'rgba(255,217,94,0.92)', color: COLORS.textPrimary },
  accepted: { label: 'In gesprek', bg: COLORS.surfaceBrand, color: COLORS.brand },
  confirmed: { label: 'Samenwerking actief', bg: COLORS.brand, color: COLORS.textInverse },
};

const initialNavState = { type: 'home', payload: null };

function navReducer(state, action) {
  switch (action.type) {
    case 'OPEN_PLOT':
      return { type: 'plot', payload: action.plot };
    case 'CLOSE_PLOT':
      return { type: 'home', payload: null };
    case 'OPEN_SAMENWERKING':
      return { type: 'samenwerking', payload: action.aanvraag };
    case 'CLOSE_SAMENWERKING':
      return { type: 'home', payload: null };
    case 'OPEN_REQUEST':
      return { type: 'request', payload: action.plot };
    case 'REQUEST_SUCCESS':
      return { type: 'request-success', payload: action.perceel };
    case 'CLOSE_REQUEST':
      return { type: 'home', payload: null };
    case 'CLOSE_REQUEST_SUCCESS':
      return { type: 'home', payload: null };
    case 'OPEN_GEEN_TOEGANG':
      return { type: 'geen-toegang', payload: action.plot, prevState: state };
    case 'CLOSE_GEEN_TOEGANG':
      return state.prevState ?? initialNavState;
    case 'RESET':
      return initialNavState;
    default:
      return state;
  }
}

export default function HomeScreen({ getInitialTab, requestedTab, badgeCounts = {}, onOpenConversation, selectedConversation: appSelectedConversation = null, onCloseConversation, onConfirmSamenwerking, unreadNotificationsCount = 0, onOpenNotifications, onOpenProfiel, onOpenSaved, onEndSamenwerking }) {
  const [activeTab, setActiveTab] = useState(() => getInitialTab?.() ?? 'start');
  const [selectedConversation, setSelectedConversation] = useState(null);

  useEffect(() => {
    if (requestedTab) setActiveTab(requestedTab);
  }, [requestedTab]);
  const [conversationProfileId, setConversationProfileId] = useState(null);
  const [activeDot, setActiveDot] = useState(0);
  const [activeDotAanvragen, setActiveDotAanvragen] = useState(0);
  const [activeDotSamenwerking, setActiveDotSamenwerking] = useState(0);
  const [dataRefreshKey, setDataRefreshKey] = useState(0);
  const [autoFocusKaartSearch, setAutoFocusKaartSearch] = useState(false);
  const [navState, navDispatch] = useReducer(navReducer, initialNavState);

  const { isFavorite, toggleFavorite } = useFavorites();
  const { percelen, isLoading: isLoadingPercelen } = usePercelen(dataRefreshKey);
  const { aanvragen } = useMyAanvragen(dataRefreshKey);
  const { firstName, plaats, plan, avatarSource, initials } = useUserProfile(dataRefreshKey);

  const userPlan = plan || 'free';

  function handleTabPress(item) {
    if (item.key === 'profiel') { onOpenProfiel?.(); return; }
    setActiveTab(item.key);
  }

  function handleRequestWithGate(plot) {
    if (userPlan === 'pro') {
      navDispatch({ type: 'OPEN_REQUEST', plot });
    } else {
      navDispatch({ type: 'OPEN_GEEN_TOEGANG', plot });
    }
  }

  function handleCancelAanvraag(aanvraagId) {
    showConfirm({
      title: 'Aanvraag annuleren',
      message: 'Weet je zeker dat je deze aanvraag wilt annuleren?',
      confirmLabel: 'Annuleer aanvraag',
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('aanvragen')
            .update({ status: 'cancelled' })
            .eq('id', aanvraagId);
          if (error) throw error;
          setDataRefreshKey((k) => k + 1);
          navDispatch({ type: 'CLOSE_PLOT' });
          showToast('Aanvraag geannuleerd', 'success');
        } catch (e) {
          console.warn('cancel aanvraag failed', e);
          showToast('Kon de aanvraag niet annuleren. Probeer opnieuw.', 'error');
        }
      },
    });
  }

  const pendingAanvragen = useMemo(() => aanvragen.filter((a) => a.status !== 'confirmed'), [aanvragen]);
  const confirmedSamenwerkingen = useMemo(() => aanvragen.filter((a) => a.status === 'confirmed'), [aanvragen]);

  const filteredPlots = useMemo(() => {
    const aangevraagdeIds = new Set(aanvragen.map((a) => a.perceel_id));
    return (percelen || []).filter((p) => !aangevraagdeIds.has(p.id));
  }, [percelen, aanvragen]);

  const visibleDotIndex = Math.max(0, Math.min(filteredPlots.length - 1, activeDot));
  const visibleDotAanvraagIndex = Math.max(0, Math.min(pendingAanvragen.length - 1, activeDotAanvragen));
  const visibleDotSamenwerkingIndex = Math.max(0, Math.min(confirmedSamenwerkingen.length - 1, activeDotSamenwerking));

  if (navState.type === 'request') {
    const perceelToRequest = navState.payload;
    return (
      <AanvraagDoenScreen
        onBack={() => navDispatch({ type: 'CLOSE_REQUEST' })}
        onContinue={(res) => {
          if (res?.success) {
            setDataRefreshKey((k) => k + 1);
            navDispatch({ type: 'REQUEST_SUCCESS', perceel: perceelToRequest });
          } else {
            navDispatch({ type: 'CLOSE_REQUEST' });
          }
        }}
        perceel={perceelToRequest}
      />
    );
  }

  if (navState.type === 'request-success') {
    return (
      <AanvraagBevestigingScreen
        perceel={navState.payload}
        onBackToListings={() => navDispatch({ type: 'CLOSE_REQUEST_SUCCESS' })}
        onBackToMessages={() => {
          navDispatch({ type: 'CLOSE_REQUEST_SUCCESS' });
          setActiveTab('berichten');
        }}
      />
    );
  }

  if (activeTab === 'pro-plan') {
    return (
      <PlansScreen
        onBack={() => setActiveTab('start')}
        onUpgradeSuccess={() => {
          setDataRefreshKey((k) => k + 1);
          navDispatch({ type: 'CLOSE_GEEN_TOEGANG' });
          setActiveTab('start');
        }}
      />
    );
  }

  if (navState.type === 'geen-toegang' && navState.payload) {
    return (
      <GeenToegangScreen
        onBack={() => navDispatch({ type: 'CLOSE_GEEN_TOEGANG' })}
        onUpgrade={() => {
          navDispatch({ type: 'CLOSE_GEEN_TOEGANG' });
          setActiveTab('pro-plan');
        }}
      />
    );
  }

  if (navState.type === 'plot') {
    return (
      <ParcelDetailScreen
        perceel={navState.payload}
        onBack={() => navDispatch({ type: 'CLOSE_PLOT' })}
        onRequest={() => handleRequestWithGate(navState.payload)}
        isFavorited={isFavorite(navState.payload?.id)}
        onToggleFavorite={() => toggleFavorite(navState.payload?.id)}
        showFavoriteButton
        onCancelAanvraag={handleCancelAanvraag}
      />
    );
  }

  if (navState.type === 'samenwerking') {
    const aanvraag = navState.payload;
    return (
      <ParcelDetailScreen
        perceel={aanvraag.perceel}
        onBack={() => navDispatch({ type: 'CLOSE_SAMENWERKING' })}
        isFavorited={isFavorite(aanvraag.perceel?.id)}
        onToggleFavorite={() => toggleFavorite(aanvraag.perceel?.id)}
        showFavoriteButton
        onOpenConversation={(conversation) => {
          setSelectedConversation(conversation);
          onOpenConversation?.(conversation);
        }}
        onEndSamenwerking={onEndSamenwerking}
      />
    );
  }

  const activeConversation = selectedConversation || appSelectedConversation;
  if (activeConversation) {
    if (conversationProfileId) {
      const matchingSamenwerking = confirmedSamenwerkingen.find(
        (s) => s.id === activeConversation.aanvraag_id,
      );
      return (
        <ProfielScreen
          profileUserId={conversationProfileId}
          onBack={() => setConversationProfileId(null)}
          onOtherPerceelPress={(perceel) => {
            setConversationProfileId(null);
            navDispatch({ type: 'OPEN_PLOT', plot: mapPerceelToPlot(perceel) });
          }}
          onStopSamenwerking={matchingSamenwerking ? () => onEndSamenwerking?.({
            ...matchingSamenwerking,
            ownerProfile: matchingSamenwerking.owner ?? null,
            conversationId: activeConversation.id,
          }) : undefined}
        />
      );
    }
    return (
      <ConversationDetailScreen
        conversation={activeConversation}
        onBack={() => {
          setConversationProfileId(null);
          setSelectedConversation(null);
          onCloseConversation?.();
        }}
        onConfirmSamenwerking={() => {
          setConversationProfileId(null);
          setSelectedConversation(null);
          onCloseConversation?.();
          onConfirmSamenwerking?.();
        }}
        onViewProfile={(userId) => { if (userId) setConversationProfileId(userId); }}
      />
    );
  }

  if (activeTab === 'kaart') {
    return (
      <KaartScreen
        onTabPress={(item) => { setAutoFocusKaartSearch(false); handleTabPress(item); }}
        profileImageSource={avatarSource}
        profileInitials={initials}
        badgeCounts={badgeCounts}
        onOpenPerceel={(plot) => navDispatch({ type: 'OPEN_PLOT', plot })}
        autoFocusSearch={autoFocusKaartSearch}
      />
    );
  }

  if (activeTab === 'loggen') {
    return (
      <LogboekScreen
        onTabPress={handleTabPress}
        profileImageSource={avatarSource}
        profileInitials={initials}
        badgeCounts={badgeCounts}
        onNavigateToKaart={() => setActiveTab('kaart')}
      />
    );
  }

  if (activeTab === 'berichten') {
    return (
      <BerichtenOverzichtScreen
        onTabPress={handleTabPress}
        profileImageSource={avatarSource}
        profileInitials={initials}
        badgeCounts={badgeCounts}
        onOpenConversation={(conversation) => {
          setSelectedConversation(conversation);
          onOpenConversation?.(conversation);
        }}
        onNavigateToKaart={() => setActiveTab('kaart')}
      />
    );
  }

  return (
    <View style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.mobileFrame}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          nestedScrollEnabled
          scrollEnabled
          bounces
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <HomeHeader
            onPressSearchBar={() => { setAutoFocusKaartSearch(true); setActiveTab('kaart'); }}
            onPressNotifications={onOpenNotifications}
            notificationCount={unreadNotificationsCount}
            onPressHeart={onOpenSaved}
            firstName={firstName}
            plaats={plaats}
          />

          <View style={styles.contentWrap}>
            {userPlan !== 'pro' && (
              <HomePromoCard onPressUpgrade={() => setActiveTab('pro-plan')} />
            )}

            {aanvragen.length === 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tijd om te beginnen!</Text>
                <Text style={styles.sectionBody}>
                  Je hebt nog geen perceel gematched. Bekijk wat er beschikbaar is
                </Text>
                <HomeSectionCta onPress={() => setActiveTab('kaart')} />
              </View>
            )}

            {confirmedSamenwerkingen.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Actieve samenwerkingen</Text>
                <ScrollView
                  horizontal
                  nestedScrollEnabled
                  showsHorizontalScrollIndicator={false}
                  style={styles.plotsScrollView}
                  contentContainerStyle={styles.plotsScroller}
                  onMomentumScrollEnd={(event) => {
                    const nextDot = Math.round(event.nativeEvent.contentOffset.x / (PLOT_CARD.cardWidth + PLOT_CARD.carouselGap));
                    setActiveDotSamenwerking(Math.max(0, Math.min(confirmedSamenwerkingen.length - 1, nextDot)));
                  }}
                >
                  {confirmedSamenwerkingen.map((aanvraag) => {
                    const perceel = aanvraag.perceel;
                    if (!perceel) return null;
                    const plot = mapPerceelToPlot(perceel);
                    const chipConfig = AANVRAAG_STATUS_CHIP.confirmed;
                    return (
                      <View key={aanvraag.id} style={styles.aanvraagCardWrap}>
                        <PlotCard
                          plot={plot}
                          onPress={() => navDispatch({ type: 'OPEN_SAMENWERKING', aanvraag })}
                          isFavorited={isFavorite(plot.id)}
                          onToggleFavorite={() => toggleFavorite(plot.id)}
                        />
                        <View style={[styles.statusChip, { backgroundColor: chipConfig.bg }]}>
                          <Text style={[styles.statusChipText, { color: chipConfig.color }]}>{chipConfig.label}</Text>
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>

                {confirmedSamenwerkingen.length > 1 ? (
                  <View
                    style={styles.dotRow}
                    accessibilityRole="adjustable"
                    accessibilityLabel="Samenwerkingen carrousel"
                    accessibilityValue={{
                      min: 1,
                      max: confirmedSamenwerkingen.length,
                      now: visibleDotSamenwerkingIndex + 1,
                      text: `Samenwerking ${visibleDotSamenwerkingIndex + 1} van ${confirmedSamenwerkingen.length}`,
                    }}
                    accessibilityLiveRegion="polite"
                  >
                    {confirmedSamenwerkingen.map((aanvraag, index) => (
                      <View
                        key={`dot-samenwerking-${aanvraag.id}`}
                        style={[styles.dot, index === visibleDotSamenwerkingIndex && styles.dotActive]}
                        accessibilityElementsHidden
                        importantForAccessibility="no"
                      />
                    ))}
                  </View>
                ) : null}
              </View>
            )}

            {pendingAanvragen.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Jouw aanvragen</Text>
                <ScrollView
                  horizontal
                  nestedScrollEnabled
                  showsHorizontalScrollIndicator={false}
                  style={styles.plotsScrollView}
                  contentContainerStyle={styles.plotsScroller}
                  onMomentumScrollEnd={(event) => {
                    const nextDot = Math.round(event.nativeEvent.contentOffset.x / (PLOT_CARD.cardWidth + PLOT_CARD.carouselGap));
                    setActiveDotAanvragen(Math.max(0, Math.min(pendingAanvragen.length - 1, nextDot)));
                  }}
                >
                  {pendingAanvragen.map((aanvraag) => {
                    const perceel = aanvraag.perceel;
                    if (!perceel) return null;
                    const plot = mapPerceelToPlot(perceel);
                    const chipConfig = AANVRAAG_STATUS_CHIP[aanvraag.status] ?? AANVRAAG_STATUS_CHIP.pending;
                    return (
                      <View key={aanvraag.id} style={styles.aanvraagCardWrap}>
                        <PlotCard
                          plot={plot}
                          onPress={() => navDispatch({ type: 'OPEN_PLOT', plot })}
                          isFavorited={isFavorite(plot.id)}
                          onToggleFavorite={() => toggleFavorite(plot.id)}
                        />
                        <View style={[styles.statusChip, { backgroundColor: chipConfig.bg }]}>
                          <Text style={[styles.statusChipText, { color: chipConfig.color }]}>{chipConfig.label}</Text>
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>

                {pendingAanvragen.length > 1 ? (
                  <View
                    style={styles.dotRow}
                    accessibilityRole="adjustable"
                    accessibilityLabel="Aanvragen carrousel"
                    accessibilityValue={{
                      min: 1,
                      max: pendingAanvragen.length,
                      now: visibleDotAanvraagIndex + 1,
                      text: `Aanvraag ${visibleDotAanvraagIndex + 1} van ${pendingAanvragen.length}`,
                    }}
                    accessibilityLiveRegion="polite"
                  >
                    {pendingAanvragen.map((aanvraag, index) => (
                      <View
                        key={`dot-aanvraag-${aanvraag.id}`}
                        style={[styles.dot, index === visibleDotAanvraagIndex && styles.dotActive]}
                        accessibilityElementsHidden
                        importantForAccessibility="no"
                      />
                    ))}
                  </View>
                ) : null}
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Aanbevolen percelen</Text>

              {!isLoadingPercelen && (
                <ScrollView
                  horizontal
                  nestedScrollEnabled
                  showsHorizontalScrollIndicator={false}
                  style={styles.plotsScrollView}
                  contentContainerStyle={styles.plotsScroller}
                  onMomentumScrollEnd={(event) => {
                    const nextDot = Math.round(event.nativeEvent.contentOffset.x / (PLOT_CARD.cardWidth + PLOT_CARD.carouselGap));
                    setActiveDot(Math.max(0, Math.min(filteredPlots.length - 1, nextDot)));
                  }}
                >
                  {filteredPlots.map((plot, index) => (
                    <PlotCard
                      key={`${plot.id}-${index}`}
                      plot={plot}
                      onPress={() => navDispatch({ type: 'OPEN_PLOT', plot })}
                      isFavorited={isFavorite(plot.id)}
                      onToggleFavorite={() => toggleFavorite(plot.id)}
                    />
                  ))}
                </ScrollView>
              )}

              {!isLoadingPercelen && filteredPlots.length === 0 ? (
                <EmptyState
                  compact
                  icon={MagnifyingGlassIcon}
                  title="Geen percelen beschikbaar"
                  body="Er zijn momenteel geen percelen beschikbaar in jouw buurt."
                />
              ) : null}

              {!isLoadingPercelen && filteredPlots.length > 1 ? (
                <View
                  style={styles.dotRow}
                  accessibilityRole="adjustable"
                  accessibilityLabel="Percelen carrousel"
                  accessibilityValue={{
                    min: 1,
                    max: filteredPlots.length,
                    now: visibleDotIndex + 1,
                    text: `Perceel ${visibleDotIndex + 1} van ${filteredPlots.length}`,
                  }}
                  accessibilityLiveRegion="polite"
                >
                  {filteredPlots.map((plot, index) => (
                    <View
                      key={`dot-${plot.id}-${index}`}
                      style={[styles.dot, index === visibleDotIndex && styles.dotActive]}
                      accessibilityElementsHidden
                      importantForAccessibility="no"
                    />
                  ))}
                </View>
              ) : null}
            </View>
          </View>
        </ScrollView>

        <BottomNav
          activeKey={activeTab}
          onTabPress={handleTabPress}
          profileImageSource={avatarSource}
          profileInitials={initials}
          badgeCounts={badgeCounts}
          style={styles.bottomNav}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  mobileFrame: {
    flex: 1,
    width: '100%',
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    paddingBottom: SIZES.bottomNavClearance + SPACING.xl,
  },
  contentWrap: {
    paddingHorizontal: SPACING.screenX,
    paddingTop: SPACING.xl,
    gap: SPACING.xl,
  },
  section: {
    gap: SPACING.md,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.xl,
    lineHeight: 22,
    fontFamily: FONTS.displaySemiBold,
    fontWeight: '600',
  },
  sectionBody: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.lg,
    lineHeight: 24,
    fontFamily: FONTS.body,
    marginTop: -6,
  },
  plotsScrollView: {
    marginHorizontal: -SPACING.screenX,
  },
  plotsScroller: {
    gap: SPACING.sm,
    paddingBottom: SPACING.xxs,
    paddingHorizontal: SPACING.screenX,
  },
  dotRow: {
    marginTop: -4,
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
  aanvraagCardWrap: {
    position: 'relative',
  },
  statusChip: {
    position: 'absolute',
    top: PLOT_CARD.cardPadding + PLOT_CARD.badgeInset,
    left: PLOT_CARD.cardPadding + PLOT_CARD.badgeInset,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    zIndex: 10,
  },
  statusChipText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.xs,
    lineHeight: 14,
  },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});
