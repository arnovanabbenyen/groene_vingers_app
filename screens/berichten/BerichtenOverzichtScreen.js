import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ChatCircleIcon, MagnifyingGlassIcon } from 'phosphor-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import EmptyState from '../../components/common/EmptyState';
import BottomNav from '../../components/navigation/BottomNav';
import ChatAvatar from '../../components/chat/ChatAvatar';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SHADOWS, SIZES, SPACING } from '../../components/theme/tokens';
import { useConversations } from '../../hooks/useConversations';

const UNREAD_ROW_BG = 'rgba(255, 217, 94, 0.12)';

function formatRelativeTime(timestamp) {
  if (!timestamp) return '';
  const now = new Date();
  const diffMin = Math.floor((now - new Date(timestamp)) / 60000);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 1) return 'nu';
  if (diffMin < 60) return `${diffMin} min`;
  if (diffHours < 24) return `${diffHours} uur`;
  if (diffDays === 1) return '1 dag';
  if (diffDays < 7) return `${diffDays} dagen`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} wkn`;
  return new Date(timestamp).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' });
}

function formatConversationName(conversation) {
  return [conversation.otherUser?.first_name, conversation.otherUser?.last_name]
    .filter(Boolean).join(' ').trim() || 'Gesprek';
}

function formatConversationPreview(conversation) {
  const msg = conversation.lastMessage;
  if (!msg) return 'Nog geen berichten';
  if (msg.media_urls?.length > 1) return `📷 ${msg.media_urls.length} foto's`;
  if (msg.media_urls?.length === 1 || msg.media_url) return '📷 Foto';
  return msg.content || 'Nog geen berichten';
}

function ActiveParticipant({ conversation, onPress }) {
  const name = formatConversationName(conversation);
  return (
    <Pressable
      style={({ pressed }) => [styles.activeUserItem, pressed && styles.activeUserItemPressed]}
      onPress={() => onPress?.(conversation)}
      accessibilityRole="button"
      accessibilityLabel={`Open gesprek met ${name}`}
    >
      <ChatAvatar avatarUrl={conversation.otherUser?.avatar_url} size={56} />
      <Text style={styles.activeUserName} numberOfLines={1}>
        {conversation.otherUser?.first_name || name}
      </Text>
    </Pressable>
  );
}

function ConversationRow({ conversation, onPress }) {
  const name = formatConversationName(conversation);
  const preview = formatConversationPreview(conversation);
  const timestamp = formatRelativeTime(conversation.lastMessage?.created_at || conversation.created_at);
  const unreadCount = Number(conversation.unreadCount || 0);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.conversationRow,
        unreadCount > 0 && styles.conversationRowUnread,
        pressed && styles.conversationRowPressed,
      ]}
      onPress={() => onPress?.(conversation)}
      accessibilityRole="button"
      accessibilityLabel={`Gesprek met ${name}${unreadCount > 0 ? `, ${unreadCount} ongelezen berichten` : ''}`}
    >
      <ChatAvatar avatarUrl={conversation.otherUser?.avatar_url} size={52} />

      <View style={styles.conversationBody}>
        <Text
          style={[styles.conversationName, unreadCount > 0 && styles.conversationNameUnread]}
          numberOfLines={1}
        >
          {name}
        </Text>
        <Text
          style={[styles.conversationPreview, unreadCount > 0 && styles.conversationPreviewUnread]}
          numberOfLines={1}
        >
          {preview}
        </Text>
      </View>

      <View style={styles.conversationMeta}>
        <Text style={styles.conversationTimestamp}>{timestamp}</Text>
        {unreadCount > 0 ? (
          <View style={styles.unreadBadge} accessibilityLabel={`${unreadCount} ongelezen`}>
            <Text style={styles.unreadBadgeText}>{unreadCount > 9 ? '9+' : String(unreadCount)}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function BerichtenOverzichtScreen({
  onTabPress,
  profileImageSource,
  badgeCounts = {},
  onOpenConversation,
  role = 'tuinzoeker',
  onNavigateToKaart,
}) {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const { conversations, isLoading } = useConversations();

  const filteredConversations = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return conversations;
    return conversations.filter((conversation) => {
      const name = formatConversationName(conversation).toLowerCase();
      const lastMsg = formatConversationPreview(conversation).toLowerCase();
      return name.includes(q) || lastMsg.includes(q);
    });
  }, [conversations, searchQuery]);

  const activeParticipants = useMemo(() => {
    const seen = new Set();
    const participants = [];
    for (const conversation of conversations) {
      const userId = conversation.otherUser?.id;
      if (!userId || seen.has(userId)) continue;
      seen.add(userId);
      participants.push(conversation);
    }
    return participants;
  }, [conversations]);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">Berichten</Text>
          <View style={styles.searchBox}>
            <MagnifyingGlassIcon size={18} color={COLORS.textSecondary} weight="regular" accessibilityElementsHidden />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Zoeken naar een gesprek"
              placeholderTextColor={COLORS.textSecondary}
              style={styles.searchInput}
              accessibilityLabel="Zoeken naar een gesprek"
              accessibilityHint="Filter op naam of berichtinhoud"
              returnKeyType="search"
            />
          </View>
        </View>
      </SafeAreaView>

      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.rowWrap}>
            <ConversationRow conversation={item} onPress={onOpenConversation} />
          </View>
        )}
        ListHeaderComponent={
          <View>
            {activeParticipants.length > 0 && (
              <View style={styles.activeUsersSection}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.activeUsersRow}
                >
                  {activeParticipants.map((conversation) => (
                    <ActiveParticipant
                      key={conversation.id}
                      conversation={conversation}
                      onPress={onOpenConversation}
                    />
                  ))}
                </ScrollView>
              </View>
            )}
            {conversations.length > 0 && <View style={styles.divider} />}
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="small" color={COLORS.brand} accessibilityLabel="Berichten worden geladen" />
            </View>
          ) : conversations.length === 0 ? (
            <EmptyState
              icon={ChatCircleIcon}
              title="Nog geen berichten"
              body="Wanneer je een aanvraag accepteert, kun je hier chatten met de aanvrager."
            />
          ) : (
            <EmptyState
              icon={MagnifyingGlassIcon}
              iconColor={COLORS.textSecondary}
              iconBgColor={COLORS.surfaceMuted}
              title="Geen resultaten"
              body={`Geen gesprekken gevonden voor "${searchQuery}".`}
            />
          )
        }
        contentContainerStyle={styles.listContent}
        ListFooterComponent={<View style={{ height: SIZES.bottomNavClearance }} />}
        showsVerticalScrollIndicator={false}
      />

      {conversations.length === 0 && !isLoading && role === 'tuinzoeker' && (
        <View style={[styles.actionBar, { paddingBottom: Math.max(insets.bottom, SPACING.md) + SPACING.md }]}>
          <Pressable
            style={({ pressed }) => [styles.ctaBtn, pressed && styles.ctaBtnPressed]}
            onPress={onNavigateToKaart}
            accessibilityRole="button"
            accessibilityLabel="Open de kaart om een perceel te zoeken"
            accessibilityHint="Navigeert naar de kaartweergave"
          >
            <MagnifyingGlassIcon size={18} color={COLORS.textInverse} weight="regular" />
            <Text style={styles.ctaLabel}>Zoek een perceel op de kaart</Text>
          </Pressable>
        </View>
      )}

      <BottomNav
        activeKey="berichten"
        onTabPress={onTabPress}
        profileImageSource={profileImageSource}
        badgeCounts={badgeCounts}
        role={role}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  headerSafeArea: {
    backgroundColor: COLORS.brand,
  },
  header: {
    backgroundColor: COLORS.brand,
    paddingHorizontal: SPACING.screenX,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    gap: SPACING.md,
  },
  title: {
    color: COLORS.textInverse,
    textAlign: 'center',
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.xl,
  },
  searchBox: {
    height: SIZES.searchBarHeight,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    ...SHADOWS.search,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },
  listContent: {
    flexGrow: 1,
    backgroundColor: COLORS.surface,
  },
  activeUsersSection: {
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.md,
  },
  activeUsersRow: {
    paddingHorizontal: SPACING.screenX,
    gap: SPACING.lg,
  },
  activeUserItem: {
    alignItems: 'center',
    width: 76,
    gap: SPACING.xs,
  },
  activeUserItemPressed: {
    opacity: 0.7,
  },
  activeUserName: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.dividerSoft,
    marginBottom: SPACING.md,
  },
  loadingWrap: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowWrap: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    marginHorizontal: SPACING.screenX,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  },
  conversationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.screenX,
    paddingVertical: SPACING.md - 2,
  },
  conversationRowUnread: {
    backgroundColor: UNREAD_ROW_BG,
  },
  conversationRowPressed: {
    opacity: 0.8,
  },
  conversationBody: {
    flex: 1,
    minWidth: 0,
    gap: SPACING.xxs,
  },
  conversationName: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
  },
  conversationPreview: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
  },
  conversationNameUnread: {
    color: COLORS.textPrimary,
  },
  conversationPreviewUnread: {
    fontFamily: FONTS.bodyMedium,
    color: COLORS.textPrimary,
  },
  conversationMeta: {
    alignItems: 'flex-end',
    gap: SPACING.xs,
  },
  conversationTimestamp: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xs + 1,
  },
  unreadBadgeText: {
    color: COLORS.textPrimary,
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.xs,
  },
  actionBar: {
    paddingHorizontal: SPACING.screenX,
    paddingTop: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  ctaBtn: {
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.sm,
    height: SIZES.iconBtn,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    ...SHADOWS.card,
  },
  ctaBtnPressed: {
    opacity: 0.85,
  },
  ctaLabel: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textInverse,
  },
});
