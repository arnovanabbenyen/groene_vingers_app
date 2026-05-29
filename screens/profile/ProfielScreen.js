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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowRightIcon,
  GearSixIcon,
  HeartIcon,
  LeafIcon,
  MapPinIcon,
  PencilSimpleIcon,
} from 'phosphor-react-native';
import { useSavedPercelen } from '../../hooks/useSavedPercelen';
import { COLORS, FONTS, RADIUS, SHADOWS, SIZES, SPACING } from '../../components/theme/tokens';
import { PLOT_CARD } from '../../components/home/PlotCard';
import BottomNav from '../../components/navigation/BottomNav';
import PercelenCarousel from '../../components/perceel/PercelenCarousel';
import { supabase } from '../../services/supabase';
import { AANVRAAG_STATUS } from '../../services/aanvraagStatus';
import { useMyAanvragen } from '../../hooks/useMyAanvragen';
import { useActiveSamenwerking } from '../../hooks/useActiveSamenwerking';
import { getUserAverageRating } from '../../services/samenwerkingProposal';
import StarRatingDisplay from '../../components/rating/StarRatingDisplay';

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

function AanvraagPerceelCard({ aanvraag }) {
  const [imageError, setImageError] = useState(false);
  const statusConfig = STATUS_CONFIG[aanvraag.status] ?? STATUS_CONFIG[AANVRAAG_STATUS.PENDING];
  const perceel = aanvraag.perceel;
  const ownerName = aanvraag.owner
    ? [aanvraag.owner.first_name, aanvraag.owner.last_name].filter(Boolean).join(' ').trim()
    : 'Eigenaar';
  const firstPhoto = Array.isArray(perceel?.fotos) ? perceel.fotos[0] : null;
  const hasImage = firstPhoto != null && !imageError;

  return (
    <View style={styles.perceelCard} accessible accessibilityRole="text">
      <View style={styles.perceelCardImageWrap}>
        {hasImage ? (
          <Image
            source={{ uri: firstPhoto }}
            style={styles.perceelCardImageEl}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={styles.perceelCardPlaceholder}>
            <LeafIcon size={34} color={COLORS.brand} weight="regular" />
          </View>
        )}
        <View style={[styles.perceelStatusChip, { backgroundColor: statusConfig.bg }]}>
          <Text style={[styles.perceelStatusChipText, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      <View style={styles.perceelCardBody}>
        <Text style={styles.perceelCardTitle} numberOfLines={1}>
          {perceel?.naam || 'Perceel'}
        </Text>
        <Text style={styles.perceelCardOwner} numberOfLines={1}>{ownerName}</Text>
      </View>
    </View>
  );
}

function SamenwerkingCard({ samenwerking }) {
  const [imageError, setImageError] = useState(false);
  const perceel = samenwerking.perceel;
  const sender = samenwerking.sender;
  const senderName = sender
    ? [sender.first_name, sender.last_name].filter(Boolean).join(' ').trim()
    : 'Tuinzoeker';
  const firstPhoto = Array.isArray(perceel?.fotos) ? perceel.fotos[0] : null;
  const hasImage = firstPhoto != null && !imageError;

  return (
    <View style={styles.perceelCard} accessible accessibilityRole="text">
      <View style={styles.perceelCardImageWrap}>
        {hasImage ? (
          <Image
            source={{ uri: firstPhoto }}
            style={styles.perceelCardImageEl}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={styles.perceelCardPlaceholder}>
            <LeafIcon size={34} color={COLORS.brand} weight="regular" />
          </View>
        )}
        <View style={[styles.perceelStatusChip, { backgroundColor: COLORS.brand }]}>
          <Text style={[styles.perceelStatusChipText, { color: COLORS.surface }]}>
            Samenwerking actief
          </Text>
        </View>
      </View>

      <View style={styles.perceelCardBody}>
        <Text style={styles.perceelCardTitle} numberOfLines={1}>
          {perceel?.naam || 'Perceel'}
        </Text>
        <Text style={styles.perceelCardOwner} numberOfLines={1}>{senderName}</Text>
      </View>
    </View>
  );
}

function SavedPerceelMiniCard({ perceel, onPress }) {
  const [imageError, setImageError] = useState(false);
  const firstPhoto = Array.isArray(perceel?.fotos) ? perceel.fotos[0] : null;
  const hasImage = firstPhoto != null && !imageError;

  return (
    <Pressable style={styles.perceelCard} onPress={onPress} accessible accessibilityRole="button">
      <View style={styles.perceelCardImageWrap}>
        {hasImage ? (
          <Image
            source={{ uri: firstPhoto }}
            style={styles.perceelCardImageEl}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={styles.perceelCardPlaceholder}>
            <LeafIcon size={34} color={COLORS.brand} weight="regular" />
          </View>
        )}
      </View>
      <View style={styles.perceelCardBody}>
        <Text style={styles.perceelCardTitle} numberOfLines={1}>
          {perceel?.naam || 'Perceel'}
        </Text>
        <Text style={styles.perceelCardOwner} numberOfLines={1}>
          {perceel?.plaats || 'Locatie onbekend'}
        </Text>
      </View>
    </Pressable>
  );
}

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
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState(null);
  const [percelen, setPercelen] = useState([]);
  const [samenwerkingen, setSamenwerkingen] = useState([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [ratingData, setRatingData] = useState({ average: null, count: 0 });

  const { samenwerking: activeSamenwerking } = useActiveSamenwerking(
    role === 'tuinzoeker' ? refreshKey : null
  );

  const { aanvragen, isLoading: isLoadingAanvragen } = useMyAanvragen(refreshKey);
  const { percelen: savedPercelen, isLoading: isLoadingSaved } = useSavedPercelen(refreshKey);

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
    // TODO: implement SettingsScreen
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
        contentContainerStyle={[styles.scrollContent, { paddingBottom: SIZES.bottomNavClearance }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Cover + overlapping avatar */}
        <View style={styles.coverContainer}>
          {coverSource ? (
            <Image source={coverSource} style={styles.cover} resizeMode="cover" />
          ) : (
            <View style={[styles.cover, styles.coverPlaceholder]}>
              <LeafIcon size={48} color={COLORS.brand} weight="regular" />
            </View>
          )}

          <View style={styles.avatarWrap}>
            {avatarSource ? (
              <Image source={typeof avatarSource === 'string' ? { uri: avatarSource } : avatarSource} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitials}>
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
            <ActivityIndicator size="small" color={COLORS.brand} style={{ marginVertical: 12 }} />
          ) : (
            <>
              <View style={styles.identityRow}>
                <View style={styles.identityLeft}>
                  <Text style={styles.displayName}>{displayName}</Text>
                  <StarRatingDisplay
                    average={ratingData.average}
                    count={ratingData.count}
                    size={15}
                    showCount
                  />
                  <View style={styles.locationPill}>
                    <MapPinIcon
                      size={14}
                      color={profile?.plaats ? COLORS.textPrimary : COLORS.textSecondary}
                      weight="regular"
                    />
                    <Text style={[styles.locationText, !profile?.plaats && styles.locationTextMuted]}>
                      {profile?.plaats || 'Stad nog niet ingesteld'}
                    </Text>
                  </View>
                </View>
              </View>

              {profile?.bio ? (
                <Text style={styles.bio}>{profile.bio}</Text>
              ) : null}
            </>
          )}
        </View>

        {/* Role-specific sections */}
        {role === 'tuinzoeker' ? (
          <>
            {activeSamenwerking ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Actieve samenwerking</Text>
                <Pressable
                  style={styles.activeSamenwerkingCard}
                  onPress={() => onOpenSamenwerking?.(activeSamenwerking)}
                  accessibilityRole="button"
                  accessibilityLabel="Bekijk actieve samenwerking"
                >
                  {activeSamenwerking.percelen?.fotos?.[0] ? (
                    <Image
                      source={{ uri: activeSamenwerking.percelen.fotos[0] }}
                      style={styles.activeSamenwerkingImage}
                    />
                  ) : (
                    <View style={[styles.activeSamenwerkingImage, styles.activeSamenwerkingPlaceholder]}>
                      <LeafIcon size={22} color={COLORS.brand} weight="regular" />
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
                    <Text style={styles.activeSamenwerkingCta}>Bekijk samenwerking →</Text>
                  </View>
                </Pressable>
              </View>
            ) : null}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Jouw aanvragen</Text>
              {isLoadingAanvragen ? (
                <ActivityIndicator size="small" color={COLORS.brand} />
              ) : aanvragen.length === 0 ? (
                <View style={styles.emptyState} accessible accessibilityRole="text">
                  <LeafIcon size={40} color={COLORS.brand} weight="regular" />
                  <Text style={styles.emptyTitle}>Nog geen aanvragen</Text>
                  <Text style={styles.emptySubtext}>
                    Aanvragen die je hebt ingediend verschijnen hier.
                  </Text>
                </View>
              ) : (
                <ScrollView
                  horizontal
                  nestedScrollEnabled
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.perceelCardScroller}
                >
                  {aanvragen.map((aanvraag) => (
                    <AanvraagPerceelCard key={aanvraag.id} aanvraag={aanvraag} />
                  ))}
                </ScrollView>
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Jouw opgeslagen percelen</Text>
                {savedPercelen.length > 0 && (
                  <Pressable style={styles.allesBekijkenBtn} onPress={onOpenSavedScreen} hitSlop={8}>
                    <Text style={styles.allesBekijkenText}>Alles bekijken</Text>
                    <ArrowRightIcon size={14} color={COLORS.brand} weight="regular" />
                  </Pressable>
                )}
              </View>
              {isLoadingSaved ? (
                <ActivityIndicator size="small" color={COLORS.brand} />
              ) : savedPercelen.length === 0 ? (
                <View style={styles.emptyState} accessible accessibilityRole="text">
                  <HeartIcon size={40} color={COLORS.brand} weight="regular" />
                  <Text style={styles.emptyTitle}>Nog geen opgeslagen percelen</Text>
                  <Text style={styles.emptySubtext}>
                    Percelen die je opslaat verschijnen hier.
                  </Text>
                </View>
              ) : (
                <ScrollView
                  horizontal
                  nestedScrollEnabled
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.perceelCardScroller}
                >
                  {savedPercelen.slice(0, 5).map((perceel) => (
                    <SavedPerceelMiniCard
                      key={perceel.id}
                      perceel={perceel}
                      onPress={() => onPerceelPress?.({
                        id: perceel.id,
                        image: perceel.fotos?.[0] || null,
                        fotos: perceel.fotos || [],
                        location: perceel.plaats || 'Locatie niet beschikbaar',
                        title: perceel.naam,
                        naam: perceel.naam,
                        plaats: perceel.plaats,
                        adres: perceel.adres || null,
                        beschrijving: perceel.beschrijving || null,
                        size: perceel.grootte ? `${perceel.grootte}m²` : null,
                        grootte: perceel.grootte,
                        chips: perceel.voorzieningen || [],
                        voorzieningen: perceel.voorzieningen || [],
                        ownerId: perceel.owner_id,
                        owner_id: perceel.owner_id,
                      })}
                    />
                  ))}
                </ScrollView>
              )}
            </View>
          </>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Samenwerkingen</Text>
              {isLoadingProfile ? (
                <ActivityIndicator size="small" color={COLORS.brand} />
              ) : samenwerkingen.length === 0 ? (
                <View style={styles.emptyState} accessible accessibilityRole="text">
                  <LeafIcon size={40} color={COLORS.brand} weight="regular" />
                  <Text style={styles.emptyTitle}>Nog geen samenwerkingen</Text>
                  <Text style={styles.emptySubtext}>
                    Bevestigde samenwerkingen met tuinzoekers verschijnen hier.
                  </Text>
                </View>
              ) : (
                <ScrollView
                  horizontal
                  nestedScrollEnabled
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.perceelCardScroller}
                >
                  {samenwerkingen.map((s) => (
                    <SamenwerkingCard key={s.id} samenwerking={s} />
                  ))}
                </ScrollView>
              )}
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
    backgroundColor: COLORS.surface,
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
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    position: 'relative',
  },
  headerTitle: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 20,
    color: COLORS.textInverse,
  },
  headerActions: {
    position: 'absolute',
    right: SPACING.screenX,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  scroll: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  scrollContent: {
    paddingHorizontal: SPACING.screenX,
    paddingTop: SPACING.xl,
  },
  // Cover + avatar
  coverContainer: {
    position: 'relative',
    zIndex: 1,
  },
  cover: {
    width: '100%',
    height: SIZES.profileCoverHeight,
    borderRadius: RADIUS.sm,
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
    borderWidth: 3,
    borderColor: COLORS.surface,
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 24,
    color: COLORS.textPrimary,
  },
  // Identity
  identityBlock: {
    paddingTop: AVATAR_OVERHANG + 10,
    gap: 12,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  identityLeft: {
    flex: 1,
    gap: 6,
  },
  displayName: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 20,
    color: COLORS.textPrimary,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontFamily: FONTS.body,
    fontSize: 12.8,
    color: COLORS.textPrimary,
  },
  locationTextMuted: {
    color: COLORS.textSecondary,
  },
  bio: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.textPrimary,
    lineHeight: 24,
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
    fontSize: 20,
    color: COLORS.textPrimary,
  },
  allesBekijkenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  allesBekijkenText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.brand,
  },
  // Aanvraag perceel cards (horizontal scroll)
  perceelCardScroller: {
    gap: SPACING.md,
    paddingBottom: SPACING.xxs,
  },
  perceelCard: {
    width: PLOT_CARD.cardWidth,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.background,
    padding: PLOT_CARD.cardPadding,
    gap: PLOT_CARD.cardGap,
    ...SHADOWS.card,
  },
  perceelCardImageWrap: {
    width: '100%',
    height: PLOT_CARD.imageHeight,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  perceelCardImageEl: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  perceelCardPlaceholder: {
    flex: 1,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  perceelStatusChip: {
    position: 'absolute',
    top: PLOT_CARD.badgeInset,
    left: PLOT_CARD.badgeInset,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    zIndex: 10,
  },
  perceelStatusChipText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    lineHeight: 14,
  },
  perceelCardBody: {
    gap: 4,
  },
  perceelCardTitle: {
    fontFamily: FONTS.displayMedium,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  perceelCardOwner: {
    fontFamily: FONTS.body,
    fontSize: 12.8,
    color: COLORS.textSecondary,
  },
  // Active samenwerking card (tuinzoeker)
  activeSamenwerkingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    ...SHADOWS.card,
  },
  activeSamenwerkingImage: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceMuted,
  },
  activeSamenwerkingPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeSamenwerkingInfo: {
    flex: 1,
    gap: 3,
  },
  activeSamenwerkingNaam: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  activeSamenwerkingPlaats: {
    fontFamily: FONTS.body,
    fontSize: 12.8,
    color: COLORS.textSecondary,
  },
  activeSamenwerkingCta: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12.8,
    color: COLORS.brand,
    marginTop: 2,
  },
  // Empty state
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
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 260,
  },
});
