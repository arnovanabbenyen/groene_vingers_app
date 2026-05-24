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
  GearSixIcon,
  LeafIcon,
  MapPinIcon,
  PencilSimpleIcon,
} from 'phosphor-react-native';
import { COLORS, FONTS, RADIUS, SHADOWS, SIZES, SPACING } from '../../components/theme/tokens';
import BottomNav from '../../components/navigation/BottomNav';
import PercelenCarousel from '../../components/perceel/PercelenCarousel';
import { supabase } from '../../services/supabase';
import { AANVRAAG_STATUS } from '../../services/aanvraagStatus';
import { useMyAanvragen } from '../../hooks/useMyAanvragen';

const AVATAR_SIZE = 75;
const AVATAR_OVERHANG = 38;
const COVER_HEIGHT = 201;

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
  [AANVRAAG_STATUS.DECLINED]: {
    label: 'Afgewezen',
    bg: COLORS.negativeSoft,
    color: COLORS.negative,
  },
  [AANVRAAG_STATUS.CANCELLED]: {
    label: 'Ingetrokken',
    bg: COLORS.surfaceMuted,
    color: COLORS.textSecondary,
  },
};

const PERCEEL_STATUS_DELETED = 'deleted';

function AanvraagRij({ aanvraag }) {
  const [imageError, setImageError] = useState(false);
  const statusConfig = STATUS_CONFIG[aanvraag.status] ?? STATUS_CONFIG[AANVRAAG_STATUS.PENDING];
  const perceel = aanvraag.perceel;
  const ownerName = aanvraag.owner
    ? [aanvraag.owner.first_name, aanvraag.owner.last_name].filter(Boolean).join(' ').trim()
    : 'Eigenaar';
  const firstPhoto = Array.isArray(perceel?.fotos) ? perceel.fotos[0] : null;

  return (
    <View style={styles.aanvraagRij} accessible accessibilityRole="text">
      <View style={styles.aanvraagThumb}>
        {firstPhoto && !imageError ? (
          <Image
            source={{ uri: firstPhoto }}
            style={styles.aanvraagThumbImg}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={[styles.aanvraagThumbImg, styles.aanvraagThumbPlaceholder]}>
            <LeafIcon size={20} color={COLORS.brand} weight="regular" />
          </View>
        )}
      </View>

      <View style={styles.aanvraagInfo}>
        <Text style={styles.aanvraagTitle} numberOfLines={1}>
          {perceel?.naam || 'Perceel'}
        </Text>
        <Text style={styles.aanvraagOwner} numberOfLines={1}>{ownerName}</Text>
      </View>

      <View style={[styles.statusPill, { backgroundColor: statusConfig.bg }]}>
        <Text style={[styles.statusPillText, { color: statusConfig.color }]}>
          {statusConfig.label}
        </Text>
      </View>
    </View>
  );
}

export default function ProfielScreen({
  role = 'tuinzoeker',
  refreshKey = 0,
  onOpenEdit,
  onOpenSettings,
  onLogout,
  onTabPress,
  profileImageSource,
  badgeCounts = {},
}) {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState(null);
  const [percelen, setPercelen] = useState([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const { aanvragen, isLoading: isLoadingAanvragen } = useMyAanvragen(refreshKey);

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

        if (role === 'tuineigenaar') {
          const { data: percelenData, error: percelenError } = await supabase
            .from('percelen')
            .select('id, owner_id, naam, beschrijving, grootte, adres, plaats, fotos, voorzieningen, status, created_at')
            .eq('owner_id', userId)
            .neq('status', PERCEEL_STATUS_DELETED)
            .order('created_at', { ascending: false });

          if (percelenError) console.warn('Failed to load percelen', percelenError);
          if (mounted) setPercelen(percelenData || []);
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

  function handleLogoutPress() {
    Alert.alert(
      'Uitloggen',
      'Weet je zeker dat je wilt uitloggen?',
      [
        { text: 'Annuleren', style: 'cancel' },
        {
          text: 'Uitloggen',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase?.auth.signOut();
            } catch (e) {
              console.warn('signOut error', e);
            }
            onLogout?.();
          },
        },
      ],
    );
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
                  {profile?.plaats ? (
                    <View style={styles.locationPill}>
                      <MapPinIcon size={14} color={COLORS.textPrimary} weight="regular" />
                      <Text style={styles.locationText}>{profile.plaats}</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {profile?.bio ? (
                <Text style={styles.bio}>{profile.bio}</Text>
              ) : null}
            </>
          )}
        </View>

        <View style={styles.divider} />

        {/* Role-specific sections */}
        {role === 'tuinzoeker' ? (
          <>
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
                <View style={styles.aanvraagList}>
                  {aanvragen.map((aanvraag) => (
                    <AanvraagRij key={aanvraag.id} aanvraag={aanvraag} />
                  ))}
                </View>
              )}
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Jouw opgeslagen percelen</Text>
              {/* TODO: implement favorites feature — show percelen the user has hearted once the favorites table and heart button on PlotCard exist */}
              <View style={styles.emptyState} accessible accessibilityRole="text">
                <LeafIcon size={40} color={COLORS.brand} weight="regular" />
                <Text style={styles.emptyTitle}>Nog geen opgeslagen percelen</Text>
                <Text style={styles.emptySubtext}>
                  Percelen die je opslaat verschijnen hier.
                </Text>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Jouw percelen</Text>
            <PercelenCarousel
              percelen={percelen}
              onPerceelPress={null}
            />
          </View>
        )}

        <View style={styles.divider} />

        <Pressable
          style={styles.logoutButton}
          onPress={handleLogoutPress}
          accessibilityRole="button"
          accessibilityLabel="Uitloggen"
        >
          <Text style={styles.logoutText}>Uitloggen</Text>
        </Pressable>
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
    height: COVER_HEIGHT,
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
  bio: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.textPrimary,
    lineHeight: 24,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.lg,
  },
  // Sections
  section: {
    gap: SPACING.md,
  },
  sectionTitle: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 20,
    color: COLORS.textPrimary,
  },
  // Aanvraag list
  aanvraagList: {
    gap: 12,
  },
  aanvraagRij: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(54, 57, 43, 0.08)',
    padding: 12,
    ...SHADOWS.card,
  },
  aanvraagThumb: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    flexShrink: 0,
  },
  aanvraagThumbImg: {
    width: 52,
    height: 52,
  },
  aanvraagThumbPlaceholder: {
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aanvraagInfo: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  aanvraagTitle: {
    fontFamily: FONTS.displayMedium,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  aanvraagOwner: {
    fontFamily: FONTS.body,
    fontSize: 12.8,
    color: COLORS.textSecondary,
  },
  statusPill: {
    borderRadius: RADIUS.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexShrink: 0,
  },
  statusPillText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 11,
    lineHeight: 14,
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
  // Logout
  logoutButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  logoutText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.negative,
  },
});
