import React, { useEffect } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, Image } from 'react-native';
import { ArrowLeftIcon, BellSlashIcon, CheckCircleIcon } from 'phosphor-react-native';
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
        <CheckCircleIcon size={24} color={COLORS.brand} weight="regular" />
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

function NotificationRow({ notification, onPress }) {
  const isUnread = !notification.read_at;

  return (
    <Pressable
      onPress={() => onPress(notification)}
      style={[styles.row, isUnread && styles.rowUnread]}
      accessibilityRole="button"
      accessibilityLabel={`${notification.title}, ${formatRelative(notification.created_at)}${isUnread ? ', ongelezen' : ''}`}
    >
      <NotificationAvatar notification={notification} />

      <View style={styles.rowContent}>
        <Text style={[styles.rowTitle, isUnread && styles.rowTitleUnread]} numberOfLines={2}>
          {notification.title}
        </Text>
        {notification.body ? (
          <Text style={styles.rowBody} numberOfLines={1}>{notification.body}</Text>
        ) : null}
        <Text style={styles.rowTime}>{formatRelative(notification.created_at)}</Text>
      </View>

      {isUnread && <View style={styles.unreadDot} />}
    </Pressable>
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
              {groups.vandaag.map((n) => (
                <NotificationRow key={n.id} notification={n} onPress={handlePress} />
              ))}
            </>
          )}
          {groups.dezeWeek.length > 0 && (
            <>
              <Text style={styles.sectionHeader}>Deze week</Text>
              {groups.dezeWeek.map((n) => (
                <NotificationRow key={n.id} notification={n} onPress={handlePress} />
              ))}
            </>
          )}
          {groups.eerder.length > 0 && (
            <>
              <Text style={styles.sectionHeader}>Eerder</Text>
              {groups.eerder.map((n) => (
                <NotificationRow key={n.id} notification={n} onPress={handlePress} />
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
    color: COLORS.textMuted,
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
    fontSize: 18,
    color: COLORS.textPrimary,
    paddingHorizontal: SPACING.screenX,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: COLORS.surface,
  },
  // ── Notification row ──────────────────────────────────────────
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.screenX,
    paddingVertical: 14,
    gap: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.dividerSoft,
  },
  rowUnread: {
    backgroundColor: COLORS.accentSoft,
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.surfaceMuted,
  },
  initialsCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.surfaceBrand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  rowTitle: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  rowTitleUnread: {
    fontFamily: FONTS.bodyMedium,
  },
  rowBody: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  rowTime: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.accent,
    flexShrink: 0,
  },
});
