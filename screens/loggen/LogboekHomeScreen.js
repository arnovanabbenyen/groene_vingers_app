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
import { BellIcon, CalendarIcon, CaretRightIcon, CheckCircleIcon, HeartIcon, NotebookIcon, PlusIcon, TargetIcon } from 'phosphor-react-native';
import { StatusBar } from 'expo-status-bar';
import BottomNav from '../../components/navigation/BottomNav';
import EmptyState from '../../components/common/EmptyState';
import ProgressRing from '../../components/logboek/ProgressRing';
import WeekCalendar from '../../components/logboek/WeekCalendar';
import LogEntryCard from '../../components/logboek/LogEntryCard';
import KaartScreen from '../kaart/KaartScreen';
import BerichtenOverzichtScreen from '../berichten/BerichtenOverzichtScreen';
import ConversationDetailScreen from '../berichten/ConversationDetailScreen';
import ParcelDetailScreen from '../parcel/ParcelDetailScreen';
import NieuweLogScreen from './NieuweLogScreen';
import { getLogboekEntries, getWeeklyProgress } from '../../services/logboek';
import { supabase } from '../../services/supabase';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SHADOWS, SPACING } from '../../components/theme/tokens';

const ICON_CIRCLE_SIZE = 40;

export default function LogboekHomeScreen({
  samenwerking,
  badgeCounts = {},
  onOpenConversation,
  selectedConversation: appSelectedConversation = null,
  onCloseConversation,
  unreadNotificationsCount = 0,
  onOpenNotifications,
  onOpenProfiel,
  onOpenSaved,
  onNieuweLogSaved,
  onOpenWeeklyGoal,
  onOpenLogDetail,
  onOpenMonth,
  onOpenOpvolgingen,
  samenwerkingRefreshKey = 0,
  getInitialTab,
  requestedTab,
}) {
  const [activeTab, setActiveTab] = useState(() => getInitialTab?.() ?? 'start');

  useEffect(() => {
    if (requestedTab) setActiveTab(requestedTab);
  }, [requestedTab]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [selectedPerceel, setSelectedPerceel] = useState(null);
  const [profileImageSource, setProfileImageSource] = useState(null);
  const [profileInitials, setProfileInitials] = useState('?');

  const [entries, setEntries] = useState([]);
  const [weeklyProgress, setWeeklyProgress] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const aanvraagId = samenwerking?.id ?? null;
  const perceelNaam = samenwerking?.percelen?.naam ?? 'Jouw perceel';
  const loggedDates = entries.map((e) => e.logged_at);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      if (!supabase || !aanvraagId) {
        if (mounted) setIsLoadingData(false);
        return;
      }

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData?.session?.user?.id;

        const [entriesResult, progressResult, profileResult] = await Promise.all([
          getLogboekEntries(aanvraagId),
          userId ? getWeeklyProgress(userId) : Promise.resolve({ data: null }),
          userId
            ? supabase.from('profiles').select('avatar_url, first_name, last_name').eq('id', userId).maybeSingle()
            : Promise.resolve({ data: null }),
        ]);

        if (mounted) {
          setEntries(entriesResult.data || []);
          setWeeklyProgress(progressResult.data || null);
          if (profileResult.data?.avatar_url) {
            setProfileImageSource(profileResult.data.avatar_url);
          }
          const p = profileResult.data;
          if (p) {
            setProfileInitials(
              [p.first_name, p.last_name].filter(Boolean).map((n) => n[0]).join('').toUpperCase() || '?'
            );
          }
          setIsLoadingData(false);
        }
      } catch (err) {
        console.warn('LogboekHomeScreen load error', err);
        if (mounted) setIsLoadingData(false);
      }
    }

    loadData();
    return () => { mounted = false; };
  }, [aanvraagId, samenwerkingRefreshKey]);

  function handleTabPress(item) {
    if (item.key === 'profiel') {
      onOpenProfiel?.();
      return;
    }
    setActiveTab(item.key);
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
        profileInitials={profileInitials}
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
        profileInitials={profileInitials}
        badgeCounts={badgeCounts}
        onOpenConversation={(conv) => {
          setSelectedConversation(conv);
          onOpenConversation?.(conv);
        }}
        onNavigateToKaart={() => handleTabPress({ key: 'kaart' })}
      />
    );
  }

  const logged = weeklyProgress?.days_logged ?? entries.filter((e) => {
    const now = new Date();
    const weekStart = new Date(now);
    const day = now.getDay();
    weekStart.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    weekStart.setHours(0, 0, 0, 0);
    return new Date(e.logged_at) >= weekStart;
  }).length;
  const goal = weeklyProgress?.weekly_goal ?? 4;

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      {activeTab !== 'loggen' && (
        <SafeAreaView edges={['top']} style={styles.headerSafe}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle} accessibilityRole="header">Logboek</Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>{perceelNaam}</Text>
            </View>
            <View style={styles.headerActions}>
              <Pressable
                onPress={onOpenNotifications}
                hitSlop={8}
                style={({ pressed }) => [styles.bellWrap, pressed && { opacity: 0.7 }]}
                accessibilityRole="button"
                accessibilityLabel={unreadNotificationsCount > 0 ? `${unreadNotificationsCount} ongelezen melding${unreadNotificationsCount !== 1 ? 'en' : ''}` : 'Meldingen'}
              >
                <BellIcon size={24} color={COLORS.textInverse} weight="regular" />
                {unreadNotificationsCount > 0 ? (
                  <View style={styles.bellBadge}>
                    <Text style={styles.bellBadgeText}>
                      {unreadNotificationsCount > 9 ? '9+' : String(unreadNotificationsCount)}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
              <Pressable
                onPress={onOpenSaved}
                hitSlop={8}
                style={({ pressed }) => pressed && { opacity: 0.7 }}
                accessibilityRole="button"
                accessibilityLabel="Opgeslagen percelen"
              >
                <HeartIcon size={24} color={COLORS.textInverse} weight="regular" />
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      )}

      {activeTab === 'loggen' ? (
        <NieuweLogScreen
          samenwerking={samenwerking}
          onSaved={() => { onNieuweLogSaved?.(); setActiveTab('start'); }}
        />
      ) : <ScrollView
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
                <Text style={styles.progressSubtitle}>
                  {logged >= goal
                    ? 'Doelstelling behaald!'
                    : `Nog ${goal - logged} dag${goal - logged !== 1 ? 'en' : ''} te gaan`}
                </Text>
                <Pressable
                  style={styles.goalButton}
                  onPress={onOpenWeeklyGoal}
                  accessibilityRole="button"
                  accessibilityLabel="Wekelijks doel aanpassen"
                >
                  <TargetIcon size={14} color={COLORS.brand} weight="regular" />
                  <Text style={styles.goalButtonText}>Doel: {goal}×/week</Text>
                </Pressable>
              </View>
              <ProgressRing logged={logged} goal={goal} size={88} />
            </View>

            {/* Action cards */}
            <View style={styles.actionRow}>
              <Pressable
                style={({ pressed }) => [styles.actionCard, pressed && styles.actionCardPressed]}
                onPress={() => setActiveTab('loggen')}
                accessibilityRole="button"
                accessibilityLabel="Nieuw log toevoegen"
              >
                <View style={styles.actionIconCircle}>
                  <PlusIcon size={20} color={COLORS.brand} weight="bold" />
                </View>
                <Text style={styles.actionCardTitle}>Nieuw log</Text>
                <Text style={styles.actionCardSub}>Voeg een bezoek toe</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.actionCard, pressed && styles.actionCardPressed]}
                onPress={onOpenOpvolgingen}
                accessibilityRole="button"
                accessibilityLabel="Opvolgingen bekijken"
              >
                <View style={styles.actionIconCircle}>
                  <CheckCircleIcon size={20} color={COLORS.brand} weight="regular" />
                </View>
                <Text style={styles.actionCardTitle}>Opvolgingen</Text>
                <Text style={styles.actionCardSub}>Taken beheren</Text>
              </Pressable>
            </View>

            {/* Week calendar */}
            <View style={[styles.card, styles.calendarCard]}>
              <View style={styles.calendarHeader}>
                <Text style={styles.sectionTitle}>Deze week</Text>
                <Pressable
                  style={({ pressed }) => [styles.calendarExpandBtn, pressed && { opacity: 0.7 }]}
                  onPress={() => onOpenMonth?.()}
                  accessibilityRole="button"
                  accessibilityLabel="Maandoverzicht bekijken"
                >
                  <CalendarIcon size={14} color={COLORS.brand} weight="regular" />
                  <Text style={styles.calendarExpandText}>Maand</Text>
                  <CaretRightIcon size={12} color={COLORS.brand} weight="bold" />
                </Pressable>
              </View>
              <WeekCalendar loggedDates={loggedDates} onExpand={() => onOpenMonth?.()} />
            </View>

            {/* Recent log entries */}
            <Text style={styles.sectionTitle}>Recente logs</Text>
            {entries.length === 0 ? (
              <EmptyState
                icon={NotebookIcon}
                title="Nog geen logs"
                body="Voeg je eerste bezoek toe via de + knop onderaan."
                compact
              />
            ) : (
              entries.slice(0, 5).map((entry) => (
                <LogEntryCard
                  key={entry.id}
                  entry={entry}
                  onPress={() => onOpenLogDetail?.(entry.id)}
                />
              ))
            )}
          </>
        )}
      </ScrollView>}

      <BottomNav
        activeKey={activeTab}
        onTabPress={handleTabPress}
        profileImageSource={profileImageSource}
        profileInitials={profileInitials}
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
    paddingHorizontal: SPACING.screenX,
    paddingVertical: SPACING.md,
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
    fontSize: FONT_SIZES.xl,
    color: COLORS.textInverse,
  },
  headerSubtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(250,249,245,0.72)',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.screenX,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
    gap: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    ...SHADOWS.card,
  },
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  progressLeft: {
    flex: 1,
    gap: SPACING.sm,
  },
  progressTitle: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
  },
  progressSubtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  goalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surfaceBrand,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  goalButtonText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.xs,
    color: COLORS.brand,
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.sm,
    alignItems: 'flex-start',
    ...SHADOWS.card,
  },
  actionCardPressed: {
    opacity: 0.8,
  },
  actionIconCircle: {
    width: ICON_CIRCLE_SIZE,
    height: ICON_CIRCLE_SIZE,
    borderRadius: ICON_CIRCLE_SIZE / 2,
    backgroundColor: COLORS.surfaceBrand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCardTitle: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  actionCardSub: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  calendarCard: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calendarExpandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.surfaceBrand,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  calendarExpandText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.xs,
    color: COLORS.brand,
  },
  sectionTitle: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
  },
});
