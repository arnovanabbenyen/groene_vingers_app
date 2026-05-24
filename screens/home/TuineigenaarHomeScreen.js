import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BellIcon,
  HandshakeIcon,
  EnvelopeOpenIcon,
  CalendarIcon,
  LeafIcon,
  MapPinIcon,
  PlusCircleIcon,
} from 'phosphor-react-native';
import { COLORS, FONTS, RADIUS, SHADOWS, SIZES, SPACING } from '../../components/theme/tokens';
import BottomNav from '../../components/navigation/BottomNav';
import PercelenCarousel from '../../components/perceel/PercelenCarousel';
import { supabase } from '../../services/supabase';
import PerceelToevoegenScreen from '../parcel/PerceelToevoegenScreen';
import ParcelDetailScreen from '../parcel/ParcelDetailScreen';
import AanvraagCard from '../../components/aanvraag/AanvraagCard';
import { usePendingAanvragen } from '../../hooks/usePendingAanvragen';
import VerzoekenOverzichtScreen from '../aanvraag/VerzoekenOverzichtScreen';
import AanvraagDetailScreen from '../aanvraag/AanvraagDetailScreen';
import BerichtenOverzichtScreen from '../berichten/BerichtenOverzichtScreen';
import ConversationDetailScreen from '../berichten/ConversationDetailScreen';
import { createConversationForAanvraag } from '../../services/conversations';
import { AANVRAAG_STATUS } from '../../services/aanvraagStatus';

const PROFILE_IMAGE = require('../../images/tuineigenaar_pfp.png');
const PERCEEL_STATUS = {
  ACTIVE: 'active',
  HIDDEN: 'hidden',
  DELETED: 'deleted',
};

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
        Zodra een aanvraag als samenwerking is bevestigd, verschijnt die hier.
      </Text>
      {/* TODO: render actual active samenwerkingen cards when aanvragen with status=AANVRAAG_STATUS.CONFIRMED exist. For now, show empty state only. */}
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
}) {
  const [activeTab, setActiveTab] = useState('start');
  const [profileImageSource, setProfileImageSource] = useState(PROFILE_IMAGE);
  const [profile, setProfile] = useState(null);
  const [percelen, setPercelen] = useState([]);
  const [selectedPerceel, setSelectedPerceel] = useState(null);
  const [perceelMode, setPerceelMode] = useState(null);
  const [perceelRefreshKey, setPerceelRefreshKey] = useState(0);
  const { aanvragen, isLoading: isLoadingAanvragen, setAanvragen } = usePendingAanvragen(aanvragenRefreshKey);

  function handleTabPress(item) {
    if (item.key === 'perceel') { setActiveTab('perceel'); return; }
    if (item.key === 'profiel') { onOpenProfiel?.(); return; }
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
          console.warn('Failed to fetch profile avatar', profileError);
        }

        if (mounted) setProfile(profileData || null);
        if (mounted && profileData?.avatar_url) setProfileImageSource(profileData.avatar_url);

        const { data: percelenData, error: percelenError } = await supabase
          .from('percelen')
          .select('id, owner_id, naam, beschrijving, grootte, adres, plaats, lat, lng, extra_info, fotos, voorzieningen, created_at, updated_at, status')
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
  }, [perceelRefreshKey]);

  async function handleAccept(aanvraagId) {
    try {
      const aanvraag = aanvragen.find((item) => item.id === aanvraagId);
      const { error } = await supabase
        .from('aanvragen')
        .update({ status: AANVRAAG_STATUS.ACCEPTED, updated_at: new Date().toISOString() })
        .eq('id', aanvraagId);

      if (error) {
        console.error('Failed to accept aanvraag', error);
        Alert.alert('Fout', 'De aanvraag kon niet worden geaccepteerd. Probeer opnieuw.');
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

          if (conversationError) {
            console.warn('Failed to create conversation for accepted aanvraag', conversationError);
          }
        }
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
      Alert.alert('Fout', 'Het perceel kon niet worden verwijderd. Probeer opnieuw.');
      return;
    }

    setSelectedPerceel(null);
    setPerceelMode(null);
    setPerceelRefreshKey((current) => current + 1);
    setActiveTab('start');

    Alert.alert('Perceel verwijderd', 'Het perceel is uit de app gehaald.');

    // TODO: implement "Undo" functionality — for now, deletion is a soft-delete (status='deleted'), so the data can theoretically be restored via a future admin feature.
  }

  function handleDeletePerceel() {
    if (!selectedPerceel) return;

    Alert.alert(
      'Perceel verwijderen?',
      'Weet je zeker dat je dit perceel wilt verwijderen? Lopende aanvragen blijven bewaard, maar het perceel verdwijnt uit de app.',
      [
        { text: 'Annuleren', style: 'cancel' },
        { text: 'Verwijderen', style: 'destructive', onPress: confirmDeletePerceel },
      ],
    );
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
      Alert.alert('Fout', 'De zichtbaarheid kon niet worden bijgewerkt. Probeer opnieuw.');
      return;
    }

    setSelectedPerceel({ ...selectedPerceel, status: newStatus });
    setPerceelRefreshKey((current) => current + 1);

    Alert.alert(
      isHiding ? 'Perceel verborgen' : 'Perceel weer zichtbaar',
      isHiding
        ? 'Tuinzoekers kunnen dit perceel niet meer vinden. Lopende aanvragen blijven werken.'
        : 'Tuinzoekers kunnen dit perceel weer vinden in de app.',
    );
  }

  function handlePerceelSaved(savedPerceel) {
    if (savedPerceel?.id) {
      setSelectedPerceel(savedPerceel);
    }

    setPerceelRefreshKey((current) => current + 1);
    setPerceelMode('view');
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
    return (
      <AanvraagDetailScreen
        aanvraag={selectedAanvraag}
        onBack={onCloseAanvraag}
        onActionComplete={onAanvraagActionComplete}
      />
    );
  }

  if (currentScreen === 'conversation-detail' && selectedConversation) {
    return (
      <ConversationDetailScreen
        conversation={selectedConversation}
        onBack={onCloseConversation}
        onConfirmSamenwerking={onCloseConversation}
      />
    );
  }

  if (activeTab === 'berichten') {
    return (
      <BerichtenOverzichtScreen
        onTabPress={handleTabPress}
        profileImageSource={profileImageSource}
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
        badgeCounts={badgeCounts}
        onBadgeCountChange={onBadgeCountChange}
        onViewAanvraag={(aanvraag) => onViewAanvraag?.(aanvraag, 'verzoeken')}
        onAanvraagActionComplete={onAanvraagActionComplete}
      />
    );
  }

  if (activeTab === 'perceel') {
    return (
      <PerceelToevoegenScreen
        onBack={() => {
          setActiveTab('start');
        }}
        onSaved={() => {
          setPerceelRefreshKey((current) => current + 1);
          setActiveTab('start');
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.locationRow}>
            <MapPinIcon size={16} color={COLORS.surface} weight="regular" />
            {/* TODO: replace hardcoded location once the location feature ships. */}
            <Text style={styles.locationText}>Kessel-Lo</Text>
          </View>
          <Pressable
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Meldingen"
            onPress={onOpenNotifications}
            style={styles.bellWrap}
          >
            <BellIcon size={24} color={COLORS.surface} weight="regular" />
            {unreadNotificationsCount > 0 ? (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>
                  {unreadNotificationsCount > 9 ? '9+' : String(unreadNotificationsCount)}
                </Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        <Text style={styles.greeting}>Hallo, {profile?.first_name || 'Arno'}</Text>
      </View>
      </SafeAreaView>

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
            percelen={(percelen || []).filter((perceel) => perceel.status !== PERCEEL_STATUS.DELETED)}
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
  headerSafe: {
    backgroundColor: COLORS.brand,
  },
  header: {
    backgroundColor: COLORS.brand,
    paddingTop: SPACING.md,
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
  bellWrap: {
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: -5,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.negative,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: COLORS.brand,
  },
  bellBadgeText: {
    color: COLORS.surface,
    fontSize: 9,
    fontFamily: FONTS.bodyMedium,
    lineHeight: 11,
  },
});
