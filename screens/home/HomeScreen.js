  import { useMemo, useState, useEffect } from 'react';
  import { useFavorites } from '../../hooks/useFavorites';
  import { StatusBar } from 'expo-status-bar';
  import { ScrollView, StyleSheet, Text, View } from 'react-native';
  import BottomNav from '../../components/navigation/BottomNav';
  import HomeHeader from '../../components/home/HomeHeader';
  import HomePromoCard from '../../components/home/HomePromoCard';
  import HomeSectionCta from '../../components/home/HomeSectionCta';
  import PlotCard from '../../components/home/PlotCard';
  import { supabase } from '../../services/supabase';
  import BerichtenOverzichtScreen from '../berichten/BerichtenOverzichtScreen';
  import ConversationDetailScreen from '../berichten/ConversationDetailScreen';
  import PlansScreen from '../plans/PlansScreen';
  import ParcelDetailScreen from '../parcel/ParcelDetailScreen';
  import GeenToegangScreen from '../aanvraag/GeenToegangScreen';
  import AanvraagDoenScreen from '../aanvraag/AanvraagDoenScreen';
  import AanvraagBevestigingScreen from '../aanvraag/AanvraagBevestigingScreen';
  import LogboekScreen from '../loggen/LogboekScreen';
  import KaartScreen from '../kaart/KaartScreen';
  import { MagnifyingGlassIcon } from 'phosphor-react-native';
  import { COLORS, FONTS, LAYOUT, RADIUS, SIZES, SPACING } from '../../components/theme/tokens';

  const PROFILE_IMAGE = require('../../images/tuinzoeker_pfp.png');

  const FALLBACK_PLOTS = [
    {
      id: 'plot-1',
      image: require('../../images/overdekt_perceel_met_serre.png'),
      location: 'Kessel-Lo',
      title: 'Overdekt perceel met serre',
      size: '30m²',
      chips: ['Water', 'Materiaal', '2,8km'],
    },

    {
      id: 'plot-3',
      image: require('../../images/rustig_perceel_in_het_groen.png'),
      location: 'Wilsele Dorp',
      title: 'Rustig perceel in het groen',
      size: '55m²',
      chips: ['Water', 'Materiaal', '2,5km'],
    },
  ];

  const AANVRAAG_STATUS_CHIP = {
    pending: { label: 'In behandeling', bg: 'rgba(255,217,94,0.92)', color: COLORS.textPrimary },
    accepted: { label: 'Geaccepteerd', bg: 'rgba(87,98,56,0.92)', color: COLORS.textInverse },
    confirmed: { label: 'Samenwerking bevestigd', bg: 'rgba(87,98,56,0.92)', color: COLORS.textInverse },
  };

  export default function HomeScreen({ getInitialTab, badgeCounts = {}, onOpenConversation, selectedConversation: appSelectedConversation = null, onCloseConversation, unreadNotificationsCount = 0, onOpenNotifications, onOpenProfiel, onOpenSaved }) {
    const [activeTab, setActiveTab] = useState(() => getInitialTab?.() ?? 'start');
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [profileImageSource, setProfileImageSource] = useState(PROFILE_IMAGE);
    const [activeDot, setActiveDot] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPlot, setSelectedPlot] = useState(null);
    const [requestPlot, setRequestPlot] = useState(null);
    const [requestSuccessPerceel, setRequestSuccessPerceel] = useState(null);
    const [geenToegangActive, setGeenToegangActive] = useState(false);
    const [userPlan, setUserPlan] = useState('free');
    const [plots, setPlots] = useState(null); // null = loading not attempted
    const [myAanvragen, setMyAanvragen] = useState([]);
    const { isFavorite, toggleFavorite } = useFavorites();

    function handleRequestWithGate(plot) {
      if (userPlan === 'pro') {
        setRequestPlot(plot);
      } else {
        setGeenToegangActive(true);
      }
    }

    useEffect(() => {
      let mounted = true;

      async function loadPercelen() {
        if (!supabase) return setPlots([]);
        const { data, error } = await supabase.from('percelen').select('*').eq('status', 'active');
        if (error) {
          console.warn('Failed to load percelen', error);
          if (mounted) setPlots([]);
          return;
        }

        const mapped = (data || []).map((row) => ({
          id: row.id,
          image: row.fotos && row.fotos[0] ? row.fotos[0] : null,
          fotos: row.fotos || [],
          location: row.plaats || 'Locatie nog niet beschikbaar',
          rating: null,
          title: row.naam,
          size: row.grootte ? `${row.grootte}m²` : null,
          description: row.beschrijving || null,
          voorzieningen: row.voorzieningen || [],
          extraInfo: row.extra_info || [],
          chips: row.voorzieningen || [],
          ownerId: row.owner_id,
          adres: row.adres || null,
          lat: row.lat || null,
          lng: row.lng || null,
          raw: row,
        }));

        if (mapped[0]?.image) {
          console.log('Perceel foto URL:', mapped[0].image);
        }

        if (mounted) setPlots(mapped);
      }

      async function loadMyAanvragen() {
        if (!supabase) return;
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const userId = sessionData?.session?.user?.id;
          if (!userId) return;

          const { data, error } = await supabase
            .from('aanvragen')
            .select('id, status, perceel_id, percelen(id, naam, plaats, grootte, fotos, voorzieningen, extra_info, owner_id)')
            .eq('sender_id', userId)
            .not('status', 'in', '("declined","cancelled","ended")')
            .order('created_at', { ascending: false });

          if (error) {
            console.warn('Failed to load my aanvragen', error);
            return;
          }

          if (mounted) setMyAanvragen(data || []);
        } catch (e) {
          console.warn('loadMyAanvragen error', e);
        }
      }

      loadPercelen();
      loadMyAanvragen();

      // load current user profile avatar for bottom nav
      async function loadProfileAvatar() {
        if (!supabase) return;
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const user = sessionData?.session?.user;
          if (!user) return;

          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('avatar_url, plan')
            .eq('id', user.id)
            .single();

          if (profileError) {
            console.log('Failed to fetch profile avatar', profileError);
            return;
          }

          if (mounted) {
            if (profile?.avatar_url) setProfileImageSource(profile.avatar_url);
            if (profile?.plan) setUserPlan(profile.plan);
          }
        } catch (e) {
          console.log('loadProfileAvatar error', e);
        }
      }

      loadProfileAvatar();
      return () => { mounted = false; };
    }, []);

    const filteredPlots = useMemo(() => {
      const normalizedQuery = searchQuery.trim().toLowerCase();
      const aangevraagdeIds = new Set(myAanvragen.map((a) => a.perceel_id));
      const source = (plots && plots.length > 0 ? plots : FALLBACK_PLOTS).filter(
        (p) => !aangevraagdeIds.has(p.id)
      );

      if (!normalizedQuery) return source;

      return source.filter((plot) => {
        const searchableText = [plot.location, plot.title, plot.size, ...(plot.chips || [])].join(' ').toLowerCase();
        return searchableText.includes(normalizedQuery);
      });
    }, [searchQuery, plots, myAanvragen]);

    const visibleDotIndex = Math.max(0, Math.min(filteredPlots.length - 1, activeDot));

    if (requestPlot) {
      const perceelToRequest = requestPlot;
      return (
        <AanvraagDoenScreen
          onBack={() => setRequestPlot(null)}
          onContinue={(res) => {
            setRequestPlot(null);
            if (res?.success) setRequestSuccessPerceel(perceelToRequest);
          }}
          perceel={requestPlot}
        />
      );
    }

    if (requestSuccessPerceel) {
      return (
        <AanvraagBevestigingScreen
          perceel={requestSuccessPerceel}
          onBackToListings={() => setRequestSuccessPerceel(null)}
          onBackToMessages={() => {
            setRequestSuccessPerceel(null);
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
            setUserPlan('pro');
            setGeenToegangActive(false);
            setActiveTab('start');
          }}
        />
      );
    }

    if (geenToegangActive && selectedPlot) {
      return (
        <GeenToegangScreen
          onBack={() => setGeenToegangActive(false)}
          onUpgrade={() => {
            setGeenToegangActive(false);
            setActiveTab('pro-plan');
          }}
        />
      );
    }

    if (selectedPlot) {
      return (
        <ParcelDetailScreen
          perceel={selectedPlot}
          onBack={() => setSelectedPlot(null)}
          onRequest={() => handleRequestWithGate(selectedPlot)}
          isFavorited={isFavorite(selectedPlot?.id)}
          onToggleFavorite={() => toggleFavorite(selectedPlot?.id)}
          showFavoriteButton
        />
      );
    }

    const activeConversation = selectedConversation || appSelectedConversation;
    if (activeConversation) {
      return (
        <ConversationDetailScreen
          conversation={activeConversation}
          onBack={() => {
            setSelectedConversation(null);
            onCloseConversation?.();
          }}
          onConfirmSamenwerking={() => {
            setSelectedConversation(null);
            onCloseConversation?.();
          }}
        />
      );
    }

    if (activeTab === 'kaart') {
      return (
        <KaartScreen
          onTabPress={(item) => setActiveTab(item.key)}
          profileImageSource={profileImageSource}
          badgeCounts={badgeCounts}
          onOpenPerceel={(plot) => setSelectedPlot(plot)}
        />
      );
    }

    if (activeTab === 'loggen') {
      return (
        <LogboekScreen
          onTabPress={(item) => setActiveTab(item.key)}
          profileImageSource={profileImageSource}
          badgeCounts={badgeCounts}
          onNavigateToHome={() => setActiveTab('start')}
        />
      );
    }

    if (activeTab === 'berichten') {
      return (
        <BerichtenOverzichtScreen
          onTabPress={(item) => setActiveTab(item.key)}
          profileImageSource={profileImageSource}
          badgeCounts={badgeCounts}
          onOpenConversation={(conversation) => {
            setSelectedConversation(conversation);
            onOpenConversation?.(conversation);
          }}
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
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onPressNotifications={onOpenNotifications}
              notificationCount={unreadNotificationsCount}
              onPressHeart={onOpenSaved}
            />

            <View style={styles.contentWrap}>
              {userPlan !== 'pro' && (
                <HomePromoCard onPressUpgrade={() => setActiveTab('pro-plan')} />
              )}

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tijd om te beginnen!</Text>
                <Text style={styles.sectionBody}>
                  Je hebt nog geen perceel gematched. Bekijk wat er beschikbaar is
                </Text>

                <HomeSectionCta onPress={() => setActiveTab('kaart')} />
              </View>

              {myAanvragen.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Jouw aanvragen</Text>
                  <ScrollView
                    horizontal
                    nestedScrollEnabled
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.plotsScroller}
                  >
                    {myAanvragen.map((aanvraag) => {
                      const perceel = aanvraag.percelen;
                      if (!perceel) return null;
                      const plot = {
                        id: perceel.id,
                        image: perceel.fotos?.[0] || null,
                        fotos: perceel.fotos || [],
                        location: perceel.plaats || 'Locatie niet beschikbaar',
                        title: perceel.naam,
                        size: perceel.grootte ? `${perceel.grootte}m²` : null,
                        chips: perceel.voorzieningen || [],
                        ownerId: perceel.owner_id,
                        extra_info: perceel.extra_info || [],
                        raw: perceel,
                      };
                      const chipConfig = AANVRAAG_STATUS_CHIP[aanvraag.status] ?? AANVRAAG_STATUS_CHIP.pending;
                      return (
                        <View key={aanvraag.id} style={styles.aanvraagCardWrap}>
                          <PlotCard
                            plot={plot}
                            onPress={() => setSelectedPlot(plot)}
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
                </View>
              )}

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Aanbevolen percelen</Text>

                <ScrollView
                  horizontal
                  nestedScrollEnabled
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.plotsScroller}
                  onMomentumScrollEnd={(event) => {
                    const cardWidth = SIZES.plotCardWidth;
                    const nextDot = Math.round(event.nativeEvent.contentOffset.x / cardWidth);
                    setActiveDot(Math.max(0, Math.min(filteredPlots.length - 1, nextDot)));
                  }}
                >
                  {filteredPlots.map((plot, index) => (
                    <PlotCard
                      key={`${plot.id}-${index}`}
                      plot={plot}
                      onPress={() => setSelectedPlot(plot)}
                      isFavorited={isFavorite(plot.id)}
                      onToggleFavorite={() => toggleFavorite(plot.id)}
                    />
                  ))}
                </ScrollView>

                {filteredPlots.length === 0 ? (
                  <View style={styles.emptyState} accessible accessibilityRole="text">
                    <MagnifyingGlassIcon size={40} color={COLORS.brand} weight="regular" />
                    <Text style={styles.emptyTitle}>Geen resultaten</Text>
                    <Text style={styles.emptySubtext}>Geen percelen gevonden voor je zoekopdracht.</Text>
                  </View>
                ) : null}

                <View style={styles.dotRow}>
                  {filteredPlots.map((plot, index) => (
                    <View
                      key={`dot-${plot.id}-${index}`}
                      style={[styles.dot, index === visibleDotIndex && styles.dotActive]}
                    />
                  ))}
                </View>
              </View>
            </View>
          </ScrollView>

          <BottomNav
            activeKey={activeTab}
            onTabPress={(item) => {
              if (item.key === 'profiel') { onOpenProfiel?.(); return; }
              setActiveTab(item.key);
            }}
            profileImageSource={profileImageSource}
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
      paddingBottom: SIZES.bottomNavClearance,
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
      fontSize: 20,
      lineHeight: 22,
      fontFamily: FONTS.displaySemiBold,
      fontWeight: '600',
    },
    sectionBody: {
      color: COLORS.textSecondary,
      fontSize: 16,
      lineHeight: 24,
      fontFamily: FONTS.body,
      marginTop: -6,
    },
    plotsScroller: {
      gap: SPACING.md,
      paddingBottom: SPACING.xxs,
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
      borderRadius: RADIUS.xs,
      backgroundColor: COLORS.indicatorMuted,
    },
    dotActive: {
      backgroundColor: COLORS.brand,
    },
    aanvraagCardWrap: {
      position: 'relative',
    },
    statusChip: {
      position: 'absolute',
      top: LAYOUT.plot.cardPadding + LAYOUT.plot.badgeInset,
      left: LAYOUT.plot.cardPadding + LAYOUT.plot.badgeInset,
      borderRadius: RADIUS.pill,
      paddingHorizontal: 10,
      paddingVertical: 5,
      zIndex: 10,
    },
    statusChipText: {
      fontFamily: FONTS.bodyMedium,
      fontSize: 12,
      lineHeight: 14,
    },
    emptyState: {
      paddingVertical: 28,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    emptyTitle: {
      fontFamily: FONTS.displaySemiBold,
      fontSize: 16,
      color: COLORS.textPrimary,
      textAlign: 'center',
    },
    emptySubtext: {
      fontFamily: FONTS.body,
      fontSize: 14,
      color: COLORS.textSecondary,
      lineHeight: 20,
      textAlign: 'center',
    },
    bottomNav: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
    },
  });
