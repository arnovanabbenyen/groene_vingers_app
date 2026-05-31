import { useEffect } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrowLeftIcon, BellSlashIcon, SealCheckIcon } from 'phosphor-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SPACING } from '../../components/theme/tokens';
import { useNotifications } from '../../hooks/useNotifications';
import EmptyState from '../../components/common/EmptyState';

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
        accessibilityElementsHidden
      />
    );
  }

  return (
    <View style={styles.initialsCircle}>
      <Text style={styles.initialsText} accessibilityElementsHidden>
        {getInitials(notification.actor)}
      </Text>
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
        accessibilityState={{ selected: isUnread }}
      >
        <NotificationAvatar notification={notification} />

        <View style={styles.rowContent}>
          <View style={styles.titleRow}>
            <Text style={[styles.rowTitle, isUnread && styles.rowTitleUnread]} numberOfLines={2}>
              {notification.title}
            </Text>
            {isUnread && (
              <View
                style={styles.unreadDot}
                accessibilityLabel="Ongelezen"
                accessibilityRole="image"
              />
            )}
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
  onBack,
  onNavigateToAanvraag,
  onNavigateToConversation,
  onNavigateToBeeindigd,
}) {
  const insets = useSafeAreaInsets();
  const { notifications, isLoading, markAsRead, markAllAsRead } = useNotifications();

  useEffect(() => {
    markAllAsRead();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handlePress(notification) {
    if (!notification.read_at) {
      await markAsRead(notification.id);
    }

    if (AANVRAAG_TYPES.includes(notification.type) && notification.related_id) {
      onNavigateToAanvraag?.(notification.related_id);
    } else if (notification.type === 'message_received' && notification.related_id) {
      onNavigateToConversation?.(notification.related_id);
    } else if (notification.type === 'samenwerking_ended' && notification.related_id) {
      onNavigateToBeeindigd?.(notification.related_id);
    }
  }

  const isEmpty = !isLoading && notifications.length === 0;
  const groups = groupNotificationsByTime(notifications);

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
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
          <Text style={styles.headerTitle} accessibilityRole="header">Meldingen</Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator
            size="small"
            color={COLORS.brand}
            accessibilityLabel="Meldingen worden geladen"
          />
        </View>
      ) : isEmpty ? (
        <View style={styles.emptyOuter}>
          <EmptyState
            icon={BellSlashIcon}
            title="Hier is het nog stil"
            body="Nieuwe meldingen verschijnen hier zodra er iets verandert."
          />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, SPACING.md) + SPACING.xl },
          ]}
          accessibilityRole="list"
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
    paddingHorizontal: SPACING.screenX,
    paddingVertical: SPACING.md,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    zIndex: 2,
  },
  backText: {
    fontFamily: FONTS.displayMedium,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textInverse,
    includeFontPadding: false,
  },
  headerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.xl,
    color: COLORS.textInverse,
  },
  headerSpacer: {
    flex: 1,
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

  // ── Section headers ───────────────────────────────────────────
  listContent: {
    paddingTop: SPACING.sm,
  },
  sectionHeader: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.xl,
    color: COLORS.textPrimary,
    paddingHorizontal: SPACING.screenX,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },

  // ── Notification row ──────────────────────────────────────────
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: SPACING.screenX,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
  },
  rowUnread: {
    backgroundColor: 'rgba(255, 217, 94, 0.15)',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.dividerSoft,
    marginHorizontal: SPACING.screenX,
    marginVertical: SPACING.sm,
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceMuted,
    flexShrink: 0,
  },
  initialsCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  initialsText: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceBrand,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowContent: {
    flex: 1,
    gap: SPACING.xxs,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  rowTitle: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  rowTitleUnread: {
    fontFamily: FONTS.bodyMedium,
  },
  rowBody: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  rowTime: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  unreadDot: {
    width: SPACING.sm,
    height: SPACING.sm,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.accent,
    marginTop: 7,
    flexShrink: 0,
  },
});
