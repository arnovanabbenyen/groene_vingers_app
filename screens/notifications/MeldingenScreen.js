import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowLeftIcon, BellIcon, BellSlashIcon, HandshakeIcon, SealCheckIcon } from 'phosphor-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, RADIUS, SIZES, SPACING } from '../../components/theme/tokens';

function formatRelativeTime(timestamp) {
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
  if (diffDays === 1) return 'gisteren';
  if (diffDays < 7) return `${diffDays} dagen geleden`;
  return then.toLocaleDateString('nl-BE', { day: 'numeric', month: 'long' });
}

function isToday(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

function isThisWeek(dateStr) {
  const diffDays = Math.floor((new Date() - new Date(dateStr)) / 86400000);
  return diffDays < 7 && !isToday(dateStr);
}

function groupNotifications(notifications) {
  const today = [], thisWeek = [], earlier = [];
  for (const n of notifications) {
    if (isToday(n.created_at)) today.push(n);
    else if (isThisWeek(n.created_at)) thisWeek.push(n);
    else earlier.push(n);
  }
  const sections = [];
  if (today.length > 0) sections.push({ key: 'today', label: 'Vandaag', items: today });
  if (thisWeek.length > 0) sections.push({ key: 'week', label: 'Deze week', items: thisWeek });
  if (earlier.length > 0) sections.push({ key: 'earlier', label: 'Eerder', items: earlier });
  return sections;
}

function buildFlatData(notifications) {
  const flat = [];
  for (const section of groupNotifications(notifications)) {
    flat.push({ kind: 'header', id: `header-${section.key}`, label: section.label });
    for (const n of section.items) flat.push({ kind: 'row', id: n.id, notification: n });
  }
  return flat;
}

function getInitials(name) {
  if (!name) return '';
  return name.trim().split(/\s+/).map((w) => w[0]).filter(Boolean).join('').slice(0, 2).toUpperCase();
}

function FallbackIcon({ type }) {
  const props = { size: 22, weight: 'regular', color: COLORS.brand };
  if (type === 'aanvraag_accepted' || type === 'aanvraag_confirmed') return <SealCheckIcon {...props} />;
  if (type === 'aanvraag_received') return <HandshakeIcon {...props} />;
  return <BellIcon {...props} />;
}

function ActorAvatar({ notification }) {
  const [imageError, setImageError] = useState(false);
  const avatarUrl = notification.data?.actor_avatar_url;
  const actorName = notification.data?.actor_name || '';
  const initials = getInitials(actorName);

  if (avatarUrl && !imageError) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={styles.avatarImage}
        onError={() => setImageError(true)}
      />
    );
  }

  if (initials) {
    return (
      <View style={[styles.avatarCircle, styles.avatarInitialsBg]}>
        <Text style={styles.avatarInitialsText}>{initials}</Text>
      </View>
    );
  }

  return (
    <View style={styles.avatarCircle}>
      <FallbackIcon type={notification.type} />
    </View>
  );
}

function NotificationRow({ notification, onPress }) {
  const isUnread = !notification.read_at;

  return (
    <Pressable
      style={[styles.row, isUnread && styles.rowUnread]}
      onPress={() => onPress?.(notification)}
      accessibilityRole="button"
      accessibilityLabel={notification.title}
    >
      <ActorAvatar notification={notification} />

      <View style={styles.rowContent}>
        <View style={styles.rowTitleRow}>
          <Text style={[styles.rowTitle, isUnread && styles.rowTitleBold]} numberOfLines={2}>
            {notification.title}
          </Text>
          {isUnread && <View style={styles.unreadDot} />}
        </View>
        {notification.body ? (
          <Text style={styles.rowBody} numberOfLines={2}>{notification.body}</Text>
        ) : null}
        <Text style={styles.rowTime}>{formatRelativeTime(notification.created_at)}</Text>
      </View>
    </Pressable>
  );
}

export default function MeldingenScreen({
  notifications = [],
  isLoading = false,
  onBack,
  onMarkAsRead,
  onMarkAllAsRead,
  role = 'tuinzoeker',
  onZoekPerceel,
}) {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    onMarkAllAsRead?.();
  }, []);

  const flatData = buildFlatData(notifications);
  const isEmpty = !isLoading && notifications.length === 0;

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
        <View style={styles.emptyWrap}>
          <View style={styles.emptyCenter}>
            <View style={styles.emptyIconCircle}>
              <BellSlashIcon size={40} color={COLORS.brand} weight="regular" />
            </View>
            <Text style={styles.emptyTitle}>Hier is het nog stil</Text>
            <Text style={styles.emptySubtext}>
              Nieuwe meldingen verschijnen hier zodra er iets verandert.
            </Text>
          </View>
          {role === 'tuinzoeker' ? (
            <Pressable style={styles.findBtn} onPress={onZoekPerceel} accessibilityRole="button">
              <Text style={styles.findBtnText}>Zoek een perceel</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <FlatList
          data={flatData}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => {
            if (item.kind === 'header') {
              return (
                <Text style={[styles.sectionHeader, index > 0 && styles.sectionHeaderGap]}>
                  {item.label}
                </Text>
              );
            }
            return (
              <View>
                <NotificationRow notification={item.notification} onPress={onMarkAsRead} />
                <View style={styles.divider} />
              </View>
            );
          }}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={<View style={{ height: SIZES.bottomNavClearance }} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const AVATAR_SIZE = 45;

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
  emptyWrap: {
    flex: 1,
    paddingHorizontal: SPACING.screenX,
    paddingBottom: SPACING.xl,
  },
  emptyCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.surfaceBrand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 25,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  emptySubtext: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  findBtn: {
    height: 44,
    borderRadius: RADIUS.xs,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: SPACING.xs,
  },
  findBtnText: {
    fontFamily: FONTS.displayMedium,
    fontSize: 16,
    color: COLORS.surface,
  },
  listContent: {
    flexGrow: 1,
    paddingTop: SPACING.md,
  },
  sectionHeader: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 20,
    color: COLORS.textPrimary,
    paddingHorizontal: SPACING.screenX,
    paddingBottom: SPACING.sm,
  },
  sectionHeaderGap: {
    marginTop: SPACING.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md - 1,
    paddingHorizontal: SPACING.screenX + SPACING.sm,
    paddingVertical: 10,
    backgroundColor: COLORS.surface,
  },
  rowUnread: {
    backgroundColor: COLORS.accentSoft,
    borderRadius: RADIUS.sm,
  },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: COLORS.surfaceMuted,
    flexShrink: 0,
  },
  avatarCircle: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: COLORS.surfaceBrand,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarInitialsBg: {
    backgroundColor: COLORS.brandSoft,
  },
  avatarInitialsText: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 16,
    color: COLORS.brand,
  },
  rowContent: {
    flex: 1,
    minWidth: 0,
  },
  rowTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  rowTitle: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  rowTitleBold: {
    fontFamily: FONTS.bodyMedium,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
    marginTop: 7,
    flexShrink: 0,
  },
  rowBody: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginTop: 2,
  },
  rowTime: {
    fontFamily: FONTS.body,
    fontSize: 12.8,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.dividerSoft,
    marginHorizontal: SPACING.screenX,
  },
});
