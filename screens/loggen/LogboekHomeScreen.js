import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BellIcon, HeartIcon, PlusIcon, TargetIcon } from 'phosphor-react-native';
import BottomNav from '../../components/navigation/BottomNav';
import ProgressRing from '../../components/logboek/ProgressRing';
import WeekCalendar from '../../components/logboek/WeekCalendar';
import LogEntryCard from '../../components/logboek/LogEntryCard';
import KaartScreen from '../kaart/KaartScreen';
import BerichtenOverzichtScreen from '../berichten/BerichtenOverzichtScreen';
import ConversationDetailScreen from '../berichten/ConversationDetailScreen';
import ParcelDetailScreen from '../parcel/ParcelDetailScreen';
import { getLogboekEntries, getWeeklyProgress } from '../../services/logboek';
import { supabase } from '../../services/supabase';
import { COLORS, FONTS, RADIUS, SIZES, SPACING } from '../../components/theme/tokens';

export default function LogboekHomeScreen({
  samenwerking,
  onNewLog,
  onOpenWeeklyGoal,
  onOpenNotifications,
  onOpenSaved,
  onOpenProfiel,
  onOpenConversation,
  selectedConversation: appSelectedConversation = null,
  onCloseConversation,
  badgeCounts = {},
  unreadNotificationsCount = 0,
  samenwerkingRefreshKey = 0,
}) {
  const [activeTab, setActiveTab] = useState('start');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [selectedPerceel, setSelectedPerceel] = useState(null);

  const [profileImageSource, setProfileImageSource] = useState(null);
  const [entries, setEntries] = useState([]);
  const [weeklyProgress, setWeeklyProgress] = useState({ days_logged: 0, weekly_goal: 4, logged_dates: [] });
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      if (!supabase) { if (mounted) setIsLoadingData(false); return; }

      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        if (!userId) { if (mounted) setIsLoadingData(false); return; }

        const [entriesData, progressData, profileResult] = await Promise.all([
          getLogboekEntries(userId),
          getWeeklyProgress(userId),
          supabase.from('profiles').select('avatar_url').eq('id', userId).maybeSingle(),
        ]);

        if (!mounted) return;

        setEntries(entriesData);
        setWeeklyProgress(progressData);
        if (profileResult.data?.avatar_url) setProfileImageSource(profileResult.data.avatar_url);
        setIsLoadingData(false);
      } catch (err) {
        console.warn('LogboekHomeScreen load error', err);
        if (mounted) setIsLoadingData(false);
      }
    }

    loadData();
    return () => { mounted = false; };
  }, [samenwerkingRefreshKey]);

  function handleTabPress(item) {
    if (item.key === 'profiel') { onOpenProfiel?.(); return; }
    if (item.key === 'loggen') { onNewLog?.(); return; }
    setActiveTab(item.key);
  }

  const activeConversation = selectedConversation || appSelectedConversation;
  if (activeConversation) {
    return (
      <ConversationDetailScreen
        conversation={activeConversation}
        onBack={() => { setSelectedConversation(null); onCloseConversation?.(); }}
        onConfirmSamenwerking={() => { setSelectedConversation(null); onCloseConversation?.(); }}
      />
    );
  }

  if (selectedPerceel) {
    return (
      <ParcelDetailScreen
        perceel={selectedPerceel}
        onBack={() => setSelectedPerceel(null)}
        showFavoriteButton
      />
    );
  }

  if (activeTab === 'kaart') {
    return (
      <KaartScreen
        onTabPress={handleTabPress}
        profileImageSource={profileImageSource}
        badgeCounts={badgeCounts}
        onOpenPerceel={(plot) => setSelectedPerceel(plot)}
      />
    );
  }

  if (activeTab === 'berichten') {
    return (
      <BerichtenOverzichtScreen
        onTabPress={handleTabPress}
        profileImageSource={profileImageSource}
        badgeCounts={badgeCounts}
        onOpenConversation={(conv) => {
          setSelectedConversation(conv);
          onOpenConversation?.(conv);
        }}
      />
    );
  }

  const daysLogged = weeklyProgress?.days_logged ?? 0;
  const weeklyGoal = weeklyProgress?.weekly_goal ?? 4;
  const loggedDates = entries.map((e) => String(e.logged_at));
  const perceelNaam = samenwerking?.percelen?.naam ?? 'Jouw perceel';

  const remaining = weeklyGoal - daysLogged;
  const progressSubtitle = daysLogged >= weeklyGoal
    ? 'Doelstelling behaald!'
    : `Nog ${remaining} dag${remaining !== 1 ? 'en' : ''} te gaan`;

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerTitle}>Logboek</Text>
              <Text style={styles.headerSubtitle}>{perceelNaam}</Text>
            </View>
            <View style={styles.headerActions}>
              <Pressable onPress={onOpenNotifications} hitSlop={8} style={styles.bellWrap}>
                <BellIcon size={24} color={COLORS.textInverse} weight="regular" />
                {unreadNotificationsCount > 0 ? (
                  <View style={styles.bellBadge}>
                    <Text style={styles.bellBadgeText}>
                      {unreadNotificationsCount > 9 ? '9+' : String(unreadNotificationsCount)}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
              <Pressable onPress={onOpenSaved} hitSlop={8}>
                <HeartIcon size={24} color={COLORS.textInverse} weight="regular" />
              </Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoadingData ? (
          <ActivityIndicator color={COLORS.brand} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Progress card */}
            <View style={[styles.card, styles.progressCard]}>
              <View style={styles.progressLeft}>
                <Text style={styles.progressTitle}>Voortgang deze week</Text>
                <Text style={styles.progressSubtitle}>{progressSubtitle}</Text>
                <Pressable
                  style={styles.goalButton}
                  onPress={onOpenWeeklyGoal}
                  accessibilityRole="button"
                  accessibilityLabel={`Weekdoel instellen: ${weeklyGoal} keer per week`}
                >
                  <TargetIcon size={14} color={COLORS.brand} weight="regular" />
                  <Text style={styles.goalButtonText}>Doel: {weeklyGoal}×/week</Text>
                </Pressable>
              </View>
              <ProgressRing logged={daysLogged} goal={weeklyGoal} size={88} />
            </View>

            {/* Action cards */}
            <View style={styles.actionRow}>
              <Pressable
                style={styles.actionCard}
                onPress={onNewLog}
                accessibilityRole="button"
                accessibilityLabel="Nieuw log toevoegen"
              >
                <PlusIcon size={20} color={COLORS.brand} weight="bold" />
                <Text style={styles.actionCardTitle}>Nieuw log</Text>
                <Text style={styles.actionCardSub}>Voeg een bezoek toe</Text>
              </Pressable>

              <Pressable
                style={styles.actionCard}
                onPress={onOpenWeeklyGoal}
                accessibilityRole="button"
                accessibilityLabel="Wekelijks doel instellen"
              >
                <TargetIcon size={20} color={COLORS.brand} weight="regular" />
                <Text style={styles.actionCardTitle}>Wekelijks doel</Text>
                <Text style={styles.actionCardSub}>Bezoeken instellen</Text>
              </Pressable>
            </View>

            {/* Week calendar in white card */}
            <View style={[styles.card, styles.calendarCard]}>
              <Text style={styles.sectionTitle}>Deze week</Text>
              <WeekCalendar loggedDates={loggedDates} />
            </View>

            {/* Recent logs */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recente logs</Text>
              {entries.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>Nog geen logs. Voeg je eerste bezoek toe!</Text>
                </View>
              ) : (
                entries.slice(0, 5).map((entry) => (
                  <LogEntryCard key={entry.id} entry={entry} />
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>

      <BottomNav
        activeKey="start"
        onTabPress={handleTabPress}
        profileImageSource={profileImageSource}
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
    paddingHorizontal: SPACING.screenX,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.lg,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
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
  headerTitle: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 28,
    color: COLORS.textInverse,
    lineHeight: 30,
  },
  headerSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: 'rgba(250,249,245,0.75)',
    lineHeight: 18,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.screenX,
    paddingTop: SPACING.md,
    paddingBottom: SIZES.bottomNavClearance,
    gap: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  progressLeft: {
    flex: 1,
    gap: SPACING.sm,
  },
  progressTitle: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 18,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  progressSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 17,
  },
  goalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surfaceBrand,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  goalButtonText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.brand,
    lineHeight: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  actionCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    gap: SPACING.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  actionCardTitle: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 14,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  actionCardSub: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 14,
  },
  calendarCard: {
    gap: SPACING.md,
  },
  section: {
    gap: SPACING.md,
  },
  sectionTitle: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 18,
    color: COLORS.textPrimary,
  },
  emptyCard: {
    backgroundColor: '#F7F7F5',
    borderRadius: RADIUS.sm,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
