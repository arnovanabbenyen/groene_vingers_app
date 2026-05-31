import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowRightIcon,
  GearSixIcon,
  HeartIcon,
  LeafIcon,
  MapPinIcon,
  PencilSimpleIcon,
  StarIcon,
} from 'phosphor-react-native';
import { useSavedPercelen } from '../../hooks/useSavedPercelen';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SHADOWS, SIZES, SPACING } from '../../components/theme/tokens';
import BottomNav from '../../components/navigation/BottomNav';
import PercelenCarousel from '../../components/perceel/PercelenCarousel';
import { supabase } from '../../services/supabase';
import { AANVRAAG_STATUS } from '../../services/aanvraagStatus';
import { useMyAanvragen } from '../../hooks/useMyAanvragen';
import { useActiveSamenwerking } from '../../hooks/useActiveSamenwerking';
import { getUserAverageRating } from '../../services/samenwerkingProposal';
import { mapPerceelToPlot } from '../../utils/mapPerceelToPlot';
import EmptyState from '../../components/common/EmptyState';
import PlotCard, { PLOT_CARD } from '../../components/home/PlotCard';
import { useFavorites } from '../../hooks/useFavorites';

const AVATAR_SIZE = 75;
const AVATAR_OVERHANG = 38;

const STATUS_CONFIG = {
  [AANVRAAG_STATUS.PENDING]: {
    label: 'In afwachting',
    bg: COLORS.surfaceMuted,
    color: COLORS.textSecondary,
  },
  [AANVRAAG_STATUS.ACCEPTED]: {
    label: 'In gesprek',
    bg: COLORS.surfaceBrand,
    color: COLORS.brand,
  },
  [AANVRAAG_STATUS.CONFIRMED]: {
    label: 'Samenwerking actief',
    bg: COLORS.brand,
    color: COLORS.surface,
  },
};

const PERCEEL_STATUS_DELETED = 'deleted';

export default function ProfielScreen({
  role = 'tuinzoeker',
  refreshKey = 0,
  onOpenEdit,
  onOpenSettings,
  onOpenSavedScreen,
  onPerceelPress,
  onTabPress,
  profileImageSource,
  badgeCounts = {},
  onOpenSamenwerking,
}) {
  const [profile, setProfile] = useState(null);
  const [percelen, setPercelen] = useState([]);
  const [samenwerkingen, setSamenwerkingen] = useState([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [ratingData, setRatingData] = useState({ average: null, count: 0 });

  const [activeSavedDot, setActiveSavedDot] = useState(0);
  const [activeAanvraagDot, setActiveAanvraagDot] = useState(0);
  const [activeSamenwerkingDot, setActiveSamenwerkingDot] = useState(0);

  const { samenwerking: activeSamenwerking } = useActiveSamenwerking(
    role === 'tuinzoeker' ? refreshKey : null
  );
  const { aanvragen, isLoading: isLoadingAanvragen } = useMyAanvragen(refreshKey);
  const { percelen: savedPercelen, isLoading: isLoadingSaved } = useSavedPercelen(refreshKey);
  const { isFavorite, toggleFavorite } = useFavorites();

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      if (!supabase) { if (mounted) setIsLoadingProfile(false); return; }

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData?.session?.user?.id;
        if (!userId) { if (mounted) setIsLoadingProfile(false); return; }

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, bio, avatar_url, cover_url, plaats, created_at')
          .eq('id', userId)
          .maybeSingle();

        if (profileError) console.warn('Failed to load profile', profileError);
        if (mounted) setProfile(profileData || null);

        if (userId) {
          getUserAverageRating(userId).then((rd) => {
            if (mounted) setRatingData(rd);
          });
        }

        if (role === 'tuineigenaar') {
          const { data: percelenData, error: percelenError } = await supabase
            .from('percelen')
            .select('id, owner_id, naam, beschrijving, grootte, adres, plaats, fotos, voorzieningen, status, created_at')
            .eq('owner_id', userId)
            .neq('status', PERCEEL_STATUS_DELETED)
            .order('created_at', { ascending: false });

          if (percelenError) console.warn('Failed to load percelen', percelenError);
          if (mounted) setPercelen(percelenData || []);

          const perceelIds = (percelenData || []).map((p) => p.id);
          if (perceelIds.length > 0) {
            const { data: samenwerkingenRaw, error: swError } = await supabase
              .from('aanvragen')
              .select('id, created_at, sender_id, perceel_id')
              .in('perceel_id', perceelIds)
              .eq('status', AANVRAAG_STATUS.CONFIRMED)
              .order('created_at', { ascending: false });

            if (swError) console.warn('Failed to load samenwerkingen', swError);

            const swData = samenwerkingenRaw || [];
            const percelenById = (percelenData || []).reduce((acc, p) => { acc[p.id] = p; return acc; }, {});

            const senderIds = [...new Set(swData.map((a) => a.sender_id).filter(Boolean))];
            let sendersById = {};
            if (senderIds.length > 0) {
              const { data: senders } = await supabase
                .from('profiles')
                .select('id, first_name, last_name')
                .in('id', senderIds);
              sendersById = (senders || []).reduce((acc, s) => { acc[s.id] = s; return acc; }, {});
            }

            const enriched = swData.map((a) => ({
              ...a,
              perceel: percelenById[a.perceel_id] || null,
              sender: sendersById[a.sender_id] || null,
            }));

            if (mounted) setSamenwerkingen(enriched);
          }
        }
      } catch (e) {
        console.warn('loadProfile error', e);
      } finally {
        if (mounted) setIsLoadingProfile(false);
      }
    }

    loadProfile();
    return () => { mounted = false; };
  }, [role, refreshKey]);

  function handleSettingsPress() {
    if (onOpenSettings) { onOpenSettings(); return; }
    Alert.alert('Binnenkort beschikbaar', 'Instellingen komen binnenkort.');
  }

  const displayName = profile
    ? [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim() || 'Profiel'
    : '';

  const avatarSource = profile?.avatar_url
    ? { uri: profile.avatar_url }
    : profileImageSource ?? null;

  const coverSource = profile?.cover_url ? { uri: profile.cover_url } : null;

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Je account</Text>
          <View style={styles.headerActions}>
            <Pressable
              onPress={onOpenEdit}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Profiel bewerken"
            >
              <PencilSimpleIcon size={22} color={COLORS.textInverse} weight="regular" />
            </Pressable>
            <Pressable
              onPress={handleSettingsPress}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Instellingen"
            >
              <GearSixIcon size={22} color={COLORS.textInverse} weight="regular" />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Cover + overlapping avatar */}
        <View style={styles.coverContainer}>
          {coverSource ? (
            <Image
              source={coverSource}
              style={styles.cover}
              resizeMode="cover"
              accessibilityElementsHidden
            />
          ) : (
            <View style={[styles.cover, styles.coverPlaceholder]}>
              <LeafIcon size={48} color={COLORS.brand} weight="regular" accessibilityElementsHidden />
            </View>
          )}

          <View style={styles.avatarWrap}>
            {avatarSource ? (
              <Image
                source={typeof avatarSource === 'string' ? { uri: avatarSource } : avatarSource}
                style={styles.avatar}
                accessibilityLabel={`Profielfoto van ${displayName}`}
              />
            ) : (
              <View
                style={[styles.avatar, styles.avatarPlaceholder]}
                accessible
                accessibilityLabel={`Profielfoto van ${displayName}`}
              >
                <Text style={styles.avatarInitials} accessibilityElementsHidden>
                  {[profile?.first_name, profile?.last_name]
                    .filter(Boolean)
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase() || '?'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Identity block */}
        <View style={styles.identityBlock}>
          {isLoadingProfile ? (
            <ActivityIndicator
              size="small"
              color={COLORS.brand}
              style={styles.profileLoader}
              accessibilityLabel="Profiel wordt geladen"
            />
          ) : (
            <>
              <View style={styles.nameRow}>
                <Text style={styles.displayName} accessibilityRole="header" numberOfLines={1}>
                  {displayName}
                </Text>
                <View
                  style={styles.ratingRow}
                  accessible
                  accessibilityLabel={ratingData.average != null
                    ? `Beoordeling: ${ratingData.average.toFixed(1)} van 5`
                    : 'Nieuw profiel, nog geen beoordelingen'}
                >
                  <StarIcon size={14} color="#FFB800" weight="fill" accessibilityElementsHidden />
                  <Text style={styles.ratingText}>
                    {ratingData.average != null ? ratingData.average.toFixed(1) : 'Nieuw'}
                  </Text>
                </View>
              </View>
              <View style={styles.locationRow}>
                <MapPinIcon
                  size={14}
                  color={profile?.plaats ? COLORS.textPrimary : COLORS.textSecondary}
                  weight="regular"
                  accessibilityElementsHidden
                />
                <Text style={[styles.locationText, !profile?.plaats && styles.locationTextMuted]}>
                  {profile?.plaats || 'Stad nog niet ingesteld'}
                </Text>
              </View>
              {profile?.bio ? (
                <Text style={styles.bio}>{profile.bio}</Text>
              ) : null}
            </>
          )}
        </View>

        {/* Tuinzoeker sections */}
        {role === 'tuinzoeker' ? (
          <>
            {activeSamenwerking ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Actieve samenwerking</Text>
                <Pressable
                  style={({ pressed }) => [
                    styles.activeSamenwerkingCard,
                    pressed && styles.activeSamenwerkingCardPressed,
                  ]}
                  onPress={() => onOpenSamenwerking?.(activeSamenwerking)}
                  accessibilityRole="button"
                  accessibilityLabel={[
                    'Actieve samenwerking',
                    activeSamenwerking.percelen?.naam,
                    activeSamenwerking.percelen?.plaats,
                  ].filter(Boolean).join(', ')}
                  accessibilityHint="Tik om de samenwerking te bekijken"
                >
                  {activeSamenwerking.percelen?.fotos?.[0] ? (
                    <Image
                      source={{ uri: activeSamenwerking.percelen.fotos[0] }}
                      style={styles.activeSamenwerkingImage}
                      resizeMode="cover"
                      accessibilityElementsHidden
                    />
                  ) : (
                    <View style={[styles.activeSamenwerkingImage, styles.activeSamenwerkingPlaceholder]}>
                      <LeafIcon size={24} color={COLORS.brand} weight="regular" accessibilityElementsHidden />
                    </View>
                  )}
                  <View style={styles.activeSamenwerkingInfo}>
                    <Text style={styles.activeSamenwerkingNaam} numberOfLines={1}>
                      {activeSamenwerking.percelen?.naam || 'Perceel'}
                    </Text>
                    {activeSamenwerking.percelen?.plaats ? (
                      <Text style={styles.activeSamenwerkingPlaats} numberOfLines={1}>
                        {activeSamenwerking.percelen.plaats}
                      </Text>
                    ) : null}
                    <View style={styles.activeSamenwerkingCtaRow}>
                      <Text style={styles.activeSamenwerkingCtaText}>Bekijk samenwerking</Text>
                      <ArrowRightIcon
                        size={13}
                        color={COLORS.brand}
                        weight="regular"
                        accessibilityElementsHidden
                      />
                    </View>
                  </View>
                </Pressable>
              </View>
            ) : null}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Jouw aanvragen</Text>
              {isLoadingAanvragen ? (
                <ActivityIndicator
                  size="small"
                  color={COLORS.brand}
                  accessibilityLabel="Aanvragen worden geladen"
                />
              ) : aanvragen.length === 0 ? (
                <EmptyState
                  compact
                  icon={LeafIcon}
                  title="Nog geen aanvragen"
                  body="Aanvragen die je indient verschijnen hier."
                />
              ) : (() => {
                const validAanvragen = aanvragen.filter((a) => a.perceel != null);
                const clampedAanvraagDot = Math.max(0, Math.min(validAanvragen.length - 1, activeAanvraagDot));
                return (
                  <>
                    <ScrollView
                      horizontal
                      nestedScrollEnabled
                      showsHorizontalScrollIndicator={false}
                      style={styles.savedScroll}
                      contentContainerStyle={styles.savedScrollContent}
                      accessibilityLabel="Jouw aanvragen"
                      onMomentumScrollEnd={(e) => {
                        const next = Math.round(e.nativeEvent.contentOffset.x / (PLOT_CARD.cardWidth + PLOT_CARD.carouselGap));
                        setActiveAanvraagDot(Math.max(0, Math.min(validAanvragen.length - 1, next)));
                      }}
                    >
                      {validAanvragen.map((aanvraag) => {
                        const statusConfig = STATUS_CONFIG[aanvraag.status] ?? STATUS_CONFIG[AANVRAAG_STATUS.PENDING];
                        const plot = mapPerceelToPlot(aanvraag.perceel);
                        return (
                          <View key={aanvraag.id} style={styles.aanvraagCardWrap}>
                            <PlotCard
                              plot={plot}
                              onPress={() => onPerceelPress?.(plot)}
                              isFavorited={isFavorite(plot.id)}
                              onToggleFavorite={() => toggleFavorite(plot.id)}
                              showFavoriteButton
                            />
                            <View style={[styles.aanvraagStatusChip, { backgroundColor: statusConfig.bg }]}>
                              <Text style={[styles.aanvraagStatusChipText, { color: statusConfig.color }]}>
                                {statusConfig.label}
                              </Text>
                            </View>
                          </View>
                        );
                      })}
                    </ScrollView>
                    {validAanvragen.length > 1 && (
                      <View style={styles.dotRow}>
                        {validAanvragen.map((a, i) => (
                          <View
                            key={`aanvraag-dot-${a.id}-${i}`}
                            style={[styles.dot, i === clampedAanvraagDot && styles.dotActive]}
                          />
                        ))}
                      </View>
                    )}
                  </>
                );
              })()}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Opgeslagen percelen</Text>
                {savedPercelen.length > 0 && (
                  <Pressable
                    style={({ pressed }) => [styles.allesBekijkenBtn, pressed && styles.allesBekijkenBtnPressed]}
                    onPress={onOpenSavedScreen}
                    accessibilityRole="button"
                    accessibilityLabel="Alle opgeslagen percelen bekijken"
                    accessibilityHint="Opent het overzicht van al je opgeslagen percelen"
                  >
                    <Text style={styles.allesBekijkenText}>Alles bekijken</Text>
                    <ArrowRightIcon
                      size={13}
                      color={COLORS.brand}
                      weight="bold"
                      accessibilityElementsHidden
                    />
                  </Pressable>
                )}
              </View>
              {isLoadingSaved ? (
                <ActivityIndicator
                  size="small"
                  color={COLORS.brand}
                  accessibilityLabel="Opgeslagen percelen worden geladen"
                />
              ) : savedPercelen.length === 0 ? (
                <EmptyState
                  compact
                  icon={HeartIcon}
                  title="Nog niets opgeslagen"
                  body="Percelen die je opslaat verschijnen hier."
                />
              ) : (() => {
                const slicedSaved = savedPercelen.slice(0, 5);
                const clampedSavedDot = Math.max(0, Math.min(slicedSaved.length - 1, activeSavedDot));
                return (
                  <>
                    <ScrollView
                      horizontal
                      nestedScrollEnabled
                      showsHorizontalScrollIndicator={false}
                      style={styles.savedScroll}
                      contentContainerStyle={styles.savedScrollContent}
                      accessibilityLabel="Opgeslagen percelen"
                      onMomentumScrollEnd={(e) => {
                        const next = Math.round(e.nativeEvent.contentOffset.x / (PLOT_CARD.cardWidth + PLOT_CARD.carouselGap));
                        setActiveSavedDot(Math.max(0, Math.min(slicedSaved.length - 1, next)));
                      }}
                    >
                      {slicedSaved.map((perceel) => {
                        const plot = mapPerceelToPlot(perceel);
                        return (
                          <PlotCard
                            key={perceel.id}
                            plot={plot}
                            onPress={() => onPerceelPress?.(plot)}
                            isFavorited={isFavorite(perceel.id)}
                            onToggleFavorite={() => toggleFavorite(perceel.id)}
                            showFavoriteButton
                          />
                        );
                      })}
                    </ScrollView>
                    {slicedSaved.length > 1 && (
                      <View style={styles.dotRow}>
                        {slicedSaved.map((p, i) => (
                          <View
                            key={`saved-dot-${p.id}-${i}`}
                            style={[styles.dot, i === clampedSavedDot && styles.dotActive]}
                          />
                        ))}
                      </View>
                    )}
                  </>
                );
              })()}
            </View>
          </>
        ) : (
          /* Tuineigenaar sections */
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Samenwerkingen</Text>
              {isLoadingProfile ? (
                <ActivityIndicator size="small" color={COLORS.brand} />
              ) : samenwerkingen.length === 0 ? (
                <EmptyState
                  compact
                  icon={LeafIcon}
                  title="Nog geen samenwerkingen"
                  body="Bevestigde samenwerkingen met tuinzoekers verschijnen hier."
                />
              ) : (() => {
                const clampedSwDot = Math.max(0, Math.min(samenwerkingen.length - 1, activeSamenwerkingDot));
                return (
                  <>
                    <ScrollView
                      horizontal
                      nestedScrollEnabled
                      showsHorizontalScrollIndicator={false}
                      style={styles.savedScroll}
                      contentContainerStyle={styles.savedScrollContent}
                      accessibilityLabel="Samenwerkingen"
                      onMomentumScrollEnd={(e) => {
                        const next = Math.round(e.nativeEvent.contentOffset.x / (PLOT_CARD.cardWidth + PLOT_CARD.carouselGap));
                        setActiveSamenwerkingDot(Math.max(0, Math.min(samenwerkingen.length - 1, next)));
                      }}
                    >
                      {samenwerkingen.map((s) => {
                        const plot = mapPerceelToPlot(s.perceel);
                        return (
                          <View key={s.id} style={styles.aanvraagCardWrap}>
                            <PlotCard
                              plot={plot}
                              onPress={() => onPerceelPress?.(plot)}
                              isFavorited={false}
                              showFavoriteButton={false}
                            />
                            <View style={[styles.aanvraagStatusChip, { backgroundColor: COLORS.brand }]}>
                              <Text style={[styles.aanvraagStatusChipText, { color: COLORS.surface }]}>
                                Samenwerking actief
                              </Text>
                            </View>
                          </View>
                        );
                      })}
                    </ScrollView>
                    {samenwerkingen.length > 1 && (
                      <View style={styles.dotRow}>
                        {samenwerkingen.map((s, i) => (
                          <View
                            key={`sw-dot-${s.id}-${i}`}
                            style={[styles.dot, i === clampedSwDot && styles.dotActive]}
                          />
                        ))}
                      </View>
                    )}
                  </>
                );
              })()}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Jouw percelen</Text>
              <PercelenCarousel percelen={percelen} onPerceelPress={null} />
            </View>
          </>
        )}
      </ScrollView>

      <BottomNav
        activeKey="profiel"
        onTabPress={onTabPress}
        role={role}
        profileImageSource={avatarSource}
        badgeCounts={badgeCounts}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerSafe: {
    backgroundColor: COLORS.brand,
  },
  header: {
    backgroundColor: COLORS.brand,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.screenX,
    paddingVertical: SPACING.md,
    position: 'relative',
  },
  headerTitle: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.xl,
    color: COLORS.textInverse,
  },
  headerActions: {
    position: 'absolute',
    right: SPACING.screenX,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.screenX,
    paddingTop: SPACING.xl,
    paddingBottom: SIZES.bottomNavClearance,
  },
  // Cover + avatar
  coverContainer: {
    position: 'relative',
  },
  cover: {
    width: '100%',
    height: SIZES.profileCoverHeight,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceMuted,
  },
  coverPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrap: {
    position: 'absolute',
    bottom: -AVATAR_OVERHANG,
    left: 0,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.xxl,
    color: COLORS.textPrimary,
  },
  // Identity
  identityBlock: {
    paddingTop: AVATAR_OVERHANG + 10,
    gap: SPACING.xs,
  },
  profileLoader: {
    marginVertical: SPACING.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  displayName: {
    flex: 1,
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.xl,
    color: COLORS.textPrimary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  locationText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
  },
  locationTextMuted: {
    color: COLORS.textSecondary,
  },
  bio: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
    lineHeight: 24,
    marginTop: SPACING.xs,
  },
  // Sections
  section: {
    gap: SPACING.md,
    marginTop: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.xl,
    color: COLORS.textPrimary,
  },
  allesBekijkenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.surfaceBrand,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
  },
  allesBekijkenBtnPressed: {
    opacity: 0.75,
  },
  allesBekijkenText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.brand,
  },
  cardScrollContent: {
    gap: SPACING.sm,
    paddingBottom: SPACING.xxs,
  },
  savedScroll: {
    marginHorizontal: -SPACING.screenX,
  },
  savedScrollContent: {
    gap: SPACING.md,
    paddingHorizontal: SPACING.screenX,
    paddingBottom: SPACING.xxs,
  },
  aanvraagCardWrap: {
    position: 'relative',
  },
  aanvraagStatusChip: {
    position: 'absolute',
    top: PLOT_CARD.cardPadding + PLOT_CARD.badgeInset,
    left: PLOT_CARD.cardPadding + PLOT_CARD.badgeInset,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    zIndex: 10,
  },
  aanvraagStatusChipText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.xs,
    lineHeight: 14,
  },
  // Active samenwerking card
  activeSamenwerkingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    ...SHADOWS.card,
  },
  activeSamenwerkingCardPressed: {
    opacity: 0.88,
  },
  activeSamenwerkingImage: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceMuted,
  },
  activeSamenwerkingPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeSamenwerkingInfo: {
    flex: 1,
    gap: SPACING.xs,
  },
  activeSamenwerkingNaam: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
  },
  activeSamenwerkingPlaats: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  activeSamenwerkingCtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xxs,
  },
  activeSamenwerkingCtaText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.brand,
  },
  dotRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
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
});
