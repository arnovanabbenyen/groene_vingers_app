import React, { useEffect } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, Image } from 'react-native';
import { ArrowLeftIcon, BellSlashIcon, SealCheckIcon } from 'phosphor-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, RADIUS, SIZES, SPACING } from '../../components/theme/tokens';
import { useNotifications } from '../../hooks/useNotifications';

const AANVRAAG_TYPES = [
  'aanvraag_received',
  'aanvraag_accepted',
  'aanvraag_declined',
  'aanvraag_confirmed',
  'aanvraag_cancelled',
];

function formatRelative(timestamp) {
  if (!timestamp) return '';
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'zojuist';
  if (diffMin < 60) return `${diffMin} ${diffMin === 1 ? 'minuut' : 'minuten'} geleden`;
  if (diffHours < 24) return `${diffHours} uur geleden`;
  if (diffDays === 1) return '1 dag geleden';
  if (diffDays < 7) return `${diffDays} dagen geleden`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} wkn geleden`;
  return then.toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' });
}

function groupNotificationsByTime(notifications) {
  const groups = { vandaag: [], dezeWeek: [], eerder: [] };
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 7);

  for (const notif of notifications) {
    const created = new Date(notif.created_at);
    if (created >= startOfToday) groups.vandaag.push(notif);
    else if (created >= startOfWeek) groups.dezeWeek.push(notif);
    else groups.eerder.push(notif);
  }
  return groups;
}

function getInitials(actor) {
  if (!actor) return '?';
  const first = (actor.first_name || '').charAt(0);
  const last = (actor.last_name || '').charAt(0);
  return (first + last).toUpperCase() || '?';
}

function NotificationAvatar({ notification }) {
  if (notification.type === 'system') {
    return (
      <View style={styles.iconCircle}>
        <SealCheckIcon size={24} color={COLORS.brand} weight="regular" />
      </View>
    );
  }

  if (notification.actor?.avatar_url) {
    return (
      <Image
        source={{ uri: notification.actor.avatar_url }}
        style={styles.avatarImage}
      />
    );
  }

  return (
    <View style={styles.initialsCircle}>
      <Text style={styles.initialsText}>{getInitials(notification.actor)}</Text>
    </View>
  );
}

function NotificationRow({ notification, onPress, showDivider }) {
  const isUnread = !notification.read_at;

  return (
    <>
      <Pressable
        onPress={() => onPress(notification)}
        style={[styles.row, isUnread && styles.rowUnread]}
        accessibilityRole="button"
        accessibilityLabel={`${notification.title}, ${formatRelative(notification.created_at)}${isUnread ? ', ongelezen' : ''}`}
      >
        <NotificationAvatar notification={notification} />

        <View style={styles.rowContent}>
          <View style={styles.titleRow}>
            <Text style={[styles.rowTitle, isUnread && styles.rowTitleUnread]} numberOfLines={2}>
              {notification.title}
            </Text>
            {isUnread && <View style={styles.unreadDot} />}
          </View>
          {notification.body ? (
            <Text style={styles.rowBody} numberOfLines={1}>{notification.body}</Text>
          ) : null}
          <Text style={styles.rowTime}>{formatRelative(notification.created_at)}</Text>
        </View>
      </Pressable>
      {showDivider && <View style={styles.divider} />}
    </>
  );
}

export default function MeldingenScreen({
  role = 'tuinzoeker',
  onBack,
  onNavigateToHome,
  onNavigateToAanvraag,
  onNavigateToConversation,
}) {
  const insets = useSafeAreaInsets();
  const { notifications, isLoading, markAsRead, markAllAsRead } = useNotifications();

  useEffect(() => {
    markAllAsRead();
  }, []);

  async function handlePress(notification) {
    if (!notification.read_at) {
      await markAsRead(notification.id);
    }

    if (AANVRAAG_TYPES.includes(notification.type) && notification.related_id) {
      onNavigateToAanvraag?.(notification.related_id);
    } else if (notification.type === 'message_received' && notification.related_id) {
      onNavigateToConversation?.(notification.related_id);
    }
  }

  const isEmpty = !isLoading && notifications.length === 0;
  const groups = groupNotificationsByTime(notifications);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={[styles.header, { paddingTop: insets.top > 0 ? 0 : SPACING.sm }]}>
          <Pressable
            style={styles.backBtn}
            onPress={onBack}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Terug"
          >
            <ArrowLeftIcon size={24} color={COLORS.textInverse} weight="regular" />
            <Text style={styles.backText}>Terug</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Meldingen</Text>
          <View style={styles.headerRight} />
        </View>
      </SafeAreaView>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={COLORS.brand} />
        </View>
      ) : isEmpty ? (
        <View style={styles.emptyOuter}>
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <BellSlashIcon size={32} color={COLORS.brand} weight="regular" />
            </View>
            <Text style={styles.emptyTitle}>Hier is het nog stil</Text>
            <Text style={styles.emptySubtext}>
              Nieuwe meldingen verschijnen hier zodra er iets verandert.
            </Text>
          </View>

          {role === 'tuinzoeker' ? (
            <View style={[styles.emptyActionContainer, { paddingBottom: Math.max(insets.bottom, 16) + 24 }]}>
              <Pressable
                onPress={onNavigateToHome}
                style={styles.emptyActionButton}
                accessibilityRole="button"
                accessibilityLabel="Zoek een perceel"
              >
                <Text style={styles.emptyActionText}>Zoek een perceel</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 24 }}
        >
          {groups.vandaag.length > 0 && (
            <>
              <Text style={styles.sectionHeader}>Vandaag</Text>
              {groups.vandaag.map((n, i) => (
                <NotificationRow
                  key={n.id}
                  notification={n}
                  onPress={handlePress}
                  showDivider={i < groups.vandaag.length - 1}
                />
              ))}
            </>
          )}
          {groups.dezeWeek.length > 0 && (
            <>
              <Text style={styles.sectionHeader}>Deze week</Text>
              {groups.dezeWeek.map((n, i) => (
                <NotificationRow
                  key={n.id}
                  notification={n}
                  onPress={handlePress}
                  showDivider={i < groups.dezeWeek.length - 1}
                />
              ))}
            </>
          )}
          {groups.eerder.length > 0 && (
            <>
              <Text style={styles.sectionHeader}>Eerder</Text>
              {groups.eerder.map((n, i) => (
                <NotificationRow
                  key={n.id}
                  notification={n}
                  onPress={handlePress}
                  showDivider={i < groups.eerder.length - 1}
                />
              ))}
            </>
          )}
        </ScrollView>
      )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.screenX,
    paddingBottom: SPACING.md,
    paddingTop: SPACING.md,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    minWidth: 70,
  },
  backText: {
    fontFamily: FONTS.displayMedium,
    fontSize: 16,
    color: COLORS.textInverse,
  },
  headerTitle: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 20,
    color: COLORS.textInverse,
    textAlign: 'center',
  },
  headerRight: {
    minWidth: 70,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ── Empty state ──────────────────────────────────────────────
  emptyOuter: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.screenX,
    gap: 12,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surfaceBrand,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 20,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  emptySubtext: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  emptyActionContainer: {
    paddingHorizontal: SPACING.screenX,
  },
  emptyActionButton: {
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.xl,
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyActionText: {
    fontFamily: FONTS.displayMedium,
    fontSize: 16,
    color: COLORS.surface,
  },
  // ── Section header ────────────────────────────────────────────
  sectionHeader: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 20,
    color: COLORS.textPrimary,
    paddingHorizontal: SPACING.screenX,
    paddingTop: 20,
    paddingBottom: 8,
  },
  // ── Notification row ──────────────────────────────────────────
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: SPACING.screenX,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 14,
    gap: 15,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
  },
  rowUnread: {
    backgroundColor: 'rgba(255, 217, 94, 0.15)',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.dividerSoft,
    marginHorizontal: SPACING.screenX,
    marginVertical: 12,
  },
  avatarImage: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: COLORS.surfaceMuted,
  },
  initialsCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  iconCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: COLORS.surfaceBrand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  rowTitle: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  rowTitleUnread: {
    fontFamily: FONTS.bodyMedium,
  },
  rowBody: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  rowTime: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
    marginTop: 7,
    flexShrink: 0,
  },
});
