  import { useMemo, useState, useEffect } from 'react';
  import { StatusBar } from 'expo-status-bar';
  import { ScrollView, StyleSheet, Text, View } from 'react-native';
  import BottomNav from '../../components/navigation/BottomNav';
  import HomeHeader from '../../components/home/HomeHeader';
  import HomePromoCard from '../../components/home/HomePromoCard';
  import HomeSectionCta from '../../components/home/HomeSectionCta';
  import PlotCard from '../../components/home/PlotCard';
  import { supabase } from '../../services/supabase';
  import BerichtenOverzichtScreen from '../berichten/BerichtenOverzichtScreen';
  import PlansScreen from '../plans/PlansScreen';
  import ParcelDetailScreen from '../parcel/ParcelDetailScreen';
  import AanvraagDoenScreen from '../aanvraag/AanvraagDoenScreen';
  import AanvraagBevestigingScreen from '../aanvraag/AanvraagBevestigingScreen';
  import { COLORS, FONTS, RADIUS, SIZES, SPACING } from '../../components/theme/tokens';

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

  export default function HomeScreen({ badgeCounts = {}, onOpenConversation }) {
    const [activeTab, setActiveTab] = useState('start');
    const [profileImageSource, setProfileImageSource] = useState(PROFILE_IMAGE);
    const [activeDot, setActiveDot] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPlot, setSelectedPlot] = useState(null);
    const [requestPlot, setRequestPlot] = useState(null);
    const [requestSuccessPerceel, setRequestSuccessPerceel] = useState(null);
    const [plots, setPlots] = useState(null); // null = loading not attempted

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

      loadPercelen();
      // load current user profile avatar for bottom nav
      async function loadProfileAvatar() {
        if (!supabase) return;
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const user = sessionData?.session?.user;
          if (!user) return;

          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('avatar_url')
            .eq('id', user.id)
            .single();

          if (profileError) {
            console.log('Failed to fetch profile avatar', profileError);
            return;
          }

          if (mounted && profile?.avatar_url) {
            setProfileImageSource(profile.avatar_url);
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
      const source = plots && plots.length > 0 ? plots : FALLBACK_PLOTS;

      if (!normalizedQuery) return source;

      return source.filter((plot) => {
        const searchableText = [plot.location, plot.title, plot.size, ...(plot.chips || [])].join(' ').toLowerCase();
        return searchableText.includes(normalizedQuery);
      });
    }, [searchQuery, plots]);

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

    if (selectedPlot) {
      return (
        <ParcelDetailScreen
          perceel={selectedPlot}
          onBack={() => setSelectedPlot(null)}
          onRequest={() => setRequestPlot(selectedPlot)}
        />
      );
    }

    if (activeTab === 'berichten') {
      return (
        <BerichtenOverzichtScreen
          onTabPress={(item) => setActiveTab(item.key)}
          profileImageSource={profileImageSource}
          badgeCounts={badgeCounts}
          onOpenConversation={onOpenConversation}
        />
      );
    }

    if (activeTab === 'pro-plan') {
      return <PlansScreen onBack={() => setActiveTab('start')} />;
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
              onPressNotifications={() => setActiveTab('berichten')}
            />

            <View style={styles.contentWrap}>
              <HomePromoCard onPressUpgrade={() => setActiveTab('pro-plan')} />

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tijd om te beginnen!</Text>
                <Text style={styles.sectionBody}>
                  Je hebt nog geen perceel gematched. Bekijk wat er beschikbaar is
                </Text>

                <HomeSectionCta />
              </View>

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
                    <PlotCard key={`${plot.id}-${index}`} plot={plot} onPress={() => setSelectedPlot(plot)} />
                  ))}
                </ScrollView>

                {filteredPlots.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>Geen percelen gevonden voor "{searchQuery}".</Text>
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
            onTabPress={(item) => setActiveTab(item.key)}
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
    emptyState: {
      paddingVertical: 6,
    },
    emptyStateText: {
      color: COLORS.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: FONTS.body,
    },
    bottomNav: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
    },
  });
