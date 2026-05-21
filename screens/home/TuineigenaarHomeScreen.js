import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  BellIcon,
  CheckCircleIcon,
  CheckIcon,
  EnvelopeOpenIcon,
  EyeIcon,
  LeafIcon,
  MapPinIcon,
  StarIcon,
  UserCircleIcon,
} from 'phosphor-react-native';
import { COLORS, FONTS, RADIUS, SHADOWS, SIZES, SPACING } from '../../components/theme/tokens';
import BottomNav from '../../components/navigation/BottomNav';
import { supabase } from '../../services/supabase';
import PerceelToevoegenScreen from '../parcel/PerceelToevoegenScreen';

const PROFILE_IMAGE = require('../../images/tuineigenaar_pfp.png');

function normalizeSize(size) {
  if (size == null || size === '') return '—';
  const text = String(size);
  return text.includes('m²') ? text : `${text}m²`;
}

function formatRequesterName(sender) {
  return [sender?.first_name, sender?.last_name].filter(Boolean).join(' ').trim() || 'Aanvrager';
}

function RequestAvatar({ sender }) {
  if (sender?.avatar_url) {
    return <Image source={{ uri: sender.avatar_url }} style={styles.userAvatar} accessibilityLabel={`Profielfoto van ${formatRequesterName(sender)}`} />;
  }

  return (
    <View style={[styles.userAvatar, styles.userAvatarFallback]} accessibilityLabel={`Profielfoto van ${formatRequesterName(sender)}`}>
      <UserCircleIcon size={44} color={COLORS.brand} weight="regular" />
    </View>
  );
}

function PerceelImage({ perceel }) {
  const [imageError, setImageError] = useState(false);
  const firstPhoto = Array.isArray(perceel?.fotos) ? perceel.fotos[0] : null;

  if (!firstPhoto || imageError) {
    return (
      <View style={styles.gardenPlaceholder} accessibilityRole="image" accessibilityLabel={`Geen foto beschikbaar voor ${perceel?.naam || 'dit perceel'}`}>
        <LeafIcon size={40} color={COLORS.brand} weight="regular" />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: firstPhoto }}
      style={styles.gardenImage}
      resizeMode="cover"
      onError={() => setImageError(true)}
      accessibilityLabel={`Foto van ${perceel?.naam || 'het perceel'}`}
    />
  );
}

function AanvraagCard({ aanvraag, onAccept, onView }) {
  const sender = aanvraag?.sender;
  const perceel = aanvraag?.perceel;
  const fullName = formatRequesterName(sender);
  const title = perceel?.naam || 'Perceel';
  const size = normalizeSize(perceel?.grootte);

  return (
    <View style={styles.requestCard}>
      <View style={styles.userRow}>
        <View style={styles.userInfo}>
          <RequestAvatar sender={sender} />
          <View style={styles.userNameWrap}>
            <Text style={styles.userName}>{fullName}</Text>
          </View>
        </View>

        <View style={styles.scoreWrap}>
          <View style={styles.scorePill}>
            <StarIcon size={16} color={COLORS.accent} weight="fill" />
            <Text style={styles.scoreText}>4,5</Text>
          </View>
          <CheckCircleIcon size={18} color={COLORS.brand} weight="regular" />
        </View>
      </View>

      <PerceelImage perceel={perceel} />

      <View style={styles.gardenInfo}>
        <Text style={styles.gardenTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.gardenSize}>{size}</Text>
      </View>

      <View style={styles.actionRow}>
        <Pressable
          style={[styles.actionButton, styles.acceptButton]}
          onPress={() => onAccept(aanvraag.id)}
          accessibilityRole="button"
          accessibilityLabel={`Accepteer aanvraag van ${fullName}`}
          accessibilityHint="Accepteer deze aanvraag"
        >
          <CheckIcon size={18} color={COLORS.surface} weight="bold" />
          <Text style={styles.acceptButtonText}>Accepteer</Text>
        </Pressable>

        <Pressable
          style={[styles.actionButton, styles.viewButton]}
          onPress={() => onView(aanvraag)}
          accessibilityRole="button"
          accessibilityLabel={`Bekijk aanvraag van ${fullName}`}
          accessibilityHint="Bekijk deze aanvraag"
        >
          <EyeIcon size={18} color={COLORS.brand} weight="regular" />
          <Text style={styles.viewButtonText}>Bekijk</Text>
        </Pressable>
      </View>
    </View>
  );
}

function EmptyRequestsState() {
  return (
    <View style={styles.emptyState} accessible accessibilityRole="text">
      <EnvelopeOpenIcon size={40} color={COLORS.brand} weight="regular" />
      <Text style={styles.emptyTitle}>Nog geen aanvragen ontvangen</Text>
      <Text style={styles.emptySubtext}>Wanneer iemand interesse heeft in jouw perceel zie je het hier.</Text>
    </View>
  );
}

export default function TuineigenaarHomeScreen({ onLogout }) {
  const [activeTab, setActiveTab] = useState('start');
  const [profileImageSource, setProfileImageSource] = useState(PROFILE_IMAGE);
  const [aanvragen, setAanvragen] = useState([]);
  const [isLoadingAanvragen, setIsLoadingAanvragen] = useState(true);
  const [profile, setProfile] = useState(null);

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
          if (mounted) {
            setAanvragen([]);
            setIsLoadingAanvragen(false);
          }
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

        const { data, error } = await supabase
          .from('aanvragen')
          .select(`
            id,
            sender_id,
            motivation,
            type_samenwerking,
            availability,
            start_date,
            status,
            created_at,
            perceel:percelen!inner (
              id,
              naam,
              grootte,
              fotos,
              owner_id
            )
          `)
          .eq('perceel.owner_id', userId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('Failed to load aanvragen', error);
          if (mounted) setAanvragen([]);
          return;
        }

        const aanvragenData = data || [];
        console.log('Aanvragen query result:', aanvragenData.map((item) => ({ id: item.id, sender_id: item.sender_id })));
        const senderIds = [...new Set(aanvragenData.map((item) => item.sender_id).filter(Boolean))];
        console.log('Resolved senderIds:', senderIds);

        let senderProfilesById = {};
        if (senderIds.length > 0) {
          const { data: senderProfiles, error: senderProfilesError } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, avatar_url')
            .in('id', senderIds);

          if (senderProfilesError) {
            console.warn('Failed to load sender profiles', senderProfilesError);
          } else {
            senderProfilesById = (senderProfiles || []).reduce((accumulator, senderProfile) => {
              accumulator[senderProfile.id] = senderProfile;
              return accumulator;
            }, {});
            console.log('Loaded sender profiles:', senderProfiles);
          }
        }

        const enrichedAanvragen = aanvragenData.map((aanvraag) => ({
          ...aanvraag,
          sender: senderProfilesById[aanvraag.sender_id] || null,
        }));

        console.log('Enriched aanvragen:', enrichedAanvragen.map((item) => ({
          id: item.id,
          sender_id: item.sender_id,
          senderName: formatRequesterName(item.sender),
          hasAvatar: Boolean(item.sender?.avatar_url),
        })));

        if (mounted) setAanvragen(enrichedAanvragen);
      } catch (e) {
        console.warn('loadDashboardData error', e);
        if (mounted) setAanvragen([]);
      } finally {
        if (mounted) setIsLoadingAanvragen(false);
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
      Alert.alert('Aanvraag geaccepteerd', 'De aanvrager wordt hierover geïnformeerd.');
    } catch (error) {
      console.error('Failed to accept aanvraag', error);
      Alert.alert('Fout', 'De aanvraag kon niet worden geaccepteerd. Probeer opnieuw.');
    }
  }

  function handleViewAanvraag(aanvraag) {
    console.log('View aanvraag', aanvraag.id);
    // TODO: navigate to AanvraagDetailScreen
    Alert.alert('Binnenkort beschikbaar', 'Het detail-scherm voor aanvragen wordt later toegevoegd.');
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
          <Text style={styles.sectionTitle}>Nieuwe aanvragen</Text>

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
          <Text style={styles.sectionTitle}>Jouw planning</Text>

          {/* TODO: static mock planning section; real planning/calendar comes later. */}
          <View style={styles.calendar}>
            <View style={styles.dayLabel}>
              <Text style={styles.dayText}>Dag</Text>
            </View>
            <View style={styles.dayLabel}>
              <Text style={styles.dayText}>M</Text>
            </View>
            <View style={[styles.dayLabel, styles.dayActive]}>
              <Text style={[styles.dayText, styles.dayTextActive]}>D</Text>
            </View>
            <View style={styles.dayLabel}>
              <Text style={styles.dayText}>W</Text>
            </View>
            <View style={styles.dayLabel}>
              <Text style={styles.dayText}>D</Text>
            </View>
            <View style={styles.dayLabel}>
              <Text style={styles.dayText}>V</Text>
            </View>
            <View style={styles.dayLabel}>
              <Text style={styles.dayText}>Z</Text>
            </View>
            <View style={styles.dayLabel}>
              <Text style={styles.dayText}>Z</Text>
            </View>
          </View>
        </View>

        <View style={{ height: SIZES.bottomNavClearance }} />
      </ScrollView>

      <BottomNav activeKey={activeTab} onTabPress={handleTabPress} role="tuineigenaar" profileImageSource={profileImageSource} />
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
  requestCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(54, 57, 43, 0.08)',
    ...SHADOWS.card,
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  userAvatarFallback: {
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userNameWrap: {
    flex: 1,
  },
  userName: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  scoreWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scoreText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  gardenImage: {
    width: '100%',
    height: 200,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.md,
  },
  gardenPlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  gardenInfo: {
    marginBottom: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  gardenTitle: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 16,
    color: COLORS.textPrimary,
    flex: 1,
  },
  gardenSize: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    height: 48,
    borderRadius: RADIUS.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  acceptButton: {
    backgroundColor: COLORS.brand,
  },
  acceptButtonText: {
    fontFamily: FONTS.displayMedium,
    fontSize: 14,
    color: COLORS.surface,
  },
  viewButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.brand,
  },
  viewButtonText: {
    fontFamily: FONTS.displayMedium,
    fontSize: 14,
    color: COLORS.brand,
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
  calendar: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingBottom: SPACING.lg,
  },
  dayLabel: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(54, 57, 43, 0.08)',
  },
  dayActive: {
    borderBottomColor: COLORS.brand,
  },
  dayText: {
    fontFamily: FONTS.displayMedium,
    fontSize: 14,
    color: 'rgba(54, 57, 43, 0.4)',
  },
  dayTextActive: {
    color: COLORS.brand,
    fontWeight: '600',
  },
});
