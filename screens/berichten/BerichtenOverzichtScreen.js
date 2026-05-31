import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ChatCircleIcon, MagnifyingGlassIcon } from 'phosphor-react-native';
import EmptyState from '../../components/common/EmptyState';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomNav from '../../components/navigation/BottomNav';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SHADOWS, SIZES, SPACING } from '../../components/theme/tokens';
import { useConversations } from '../../hooks/useConversations';

function formatRelativeTime(timestamp) {
  if (!timestamp) return '';

  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'nu';
  if (diffMin < 60) return `${diffMin} min`;
  if (diffHours < 24) return `${diffHours} uur`;
  if (diffDays === 1) return '1 dag';
  if (diffDays < 7) return `${diffDays} dagen`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} wkn`;
  return then.toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' });
}

function formatConversationName(conversation) {
  return [conversation.otherUser?.first_name, conversation.otherUser?.last_name].filter(Boolean).join(' ').trim() || 'Gesprek';
}

function formatConversationPreview(conversation) {
  const msg = conversation.lastMessage;
  if (!msg) return 'Nog geen berichten';
  if (msg.media_urls?.length > 1) return `📷 ${msg.media_urls.length} foto's`;
  if (msg.media_urls?.length === 1 || msg.media_url) return '📷 Foto';
  return msg.content || 'Nog geen berichten';
}

function ConversationAvatar({ conversation, size = 52 }) {
  const source = conversation.otherUser?.avatar_url
    ? { uri: conversation.otherUser.avatar_url }
    : require('../../images/tuinzoeker_pfp.png');

  return (
    <View style={[styles.avatarWrap, { width: size, height: size, borderRadius: size / 2 }]}>
      <Image source={source} style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]} />
      <View style={styles.onlineDot} />
    </View>
  );
}

function ActiveParticipant({ conversation, onPress }) {
  const name = formatConversationName(conversation);

  return (
    <TouchableOpacity
      style={styles.activeUserItem}
      onPress={() => onPress?.(conversation)}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`Open gesprek met ${name}`}
    >
      <View style={styles.activeAvatarWrap}>
        <ConversationAvatar conversation={conversation} size={64} />
      </View>
      <Text style={styles.activeUserName} numberOfLines={1}>
        {conversation.otherUser?.first_name || name}
      </Text>
    </TouchableOpacity>
  );
}

function ConversationRow({ conversation, onPress }) {
  const name = formatConversationName(conversation);
  const preview = formatConversationPreview(conversation);
  const timestamp = formatRelativeTime(conversation.lastMessage?.created_at || conversation.created_at);
  const unreadCount = Number(conversation.unreadCount || 0);

  return (
    <TouchableOpacity
      style={[styles.conversationRow, unreadCount > 0 && styles.conversationRowUnread]}
      onPress={() => onPress?.(conversation)}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Gesprek met ${name}${unreadCount > 0 ? `, ${unreadCount} ongelezen berichten` : ''}`}
    >
      <ConversationAvatar conversation={conversation} size={52} />

      <View style={styles.conversationBody}>
        <Text style={[styles.conversationName, unreadCount > 0 && styles.conversationNameUnread]} numberOfLines={1}>{name}</Text>
        <Text style={[styles.conversationPreview, unreadCount > 0 && styles.conversationPreviewUnread]} numberOfLines={1}>{preview}</Text>
      </View>

      <View style={styles.conversationMeta}>
        <Text style={styles.conversationTimestamp}>{timestamp}</Text>
        {unreadCount > 0 ? (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{unreadCount > 9 ? '9+' : String(unreadCount)}</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

export default function BerichtenOverzichtScreen({ onTabPress, profileImageSource, badgeCounts = {}, onOpenConversation, role = 'tuinzoeker', onNavigateToKaart }) {
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
            <View style={styles.activeUsersSection}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activeUsersRow}>
                {activeParticipants.map((conversation) => (
                  <ActiveParticipant
                    key={conversation.id}
                    conversation={conversation}
                    onPress={onOpenConversation}
                  />
                ))}
              </ScrollView>
            </View>
            {conversations.length > 0 && <View style={styles.divider} />}
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator
                size="small"
                color={COLORS.brand}
                accessibilityLabel="Berichten worden geladen"
              />
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
  container: { flex: 1, backgroundColor: COLORS.surface },
  headerSafeArea: { backgroundColor: COLORS.brand },
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
  content: { flex: 1, backgroundColor: COLORS.surface },
  listContent: { flexGrow: 1, backgroundColor: COLORS.surface },
  activeUsersSection: {
    backgroundColor: COLORS.surface,
    paddingVertical: 16,
  },
  activeUsersRow: {
    paddingHorizontal: SPACING.screenX,
    gap: 20,
  },
  activeUserItem: { alignItems: 'center', width: 76 },
  activeAvatarWrap: { position: 'relative' },
  activeUserName: {
    marginTop: 6,
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  avatarWrap: {
    position: 'relative',
    overflow: 'visible',
  },
  avatar: {
    borderRadius: 999,
    backgroundColor: COLORS.surfaceMuted,
  },
  onlineDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: COLORS.surface,
    right: -2,
    bottom: -2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.dividerSoft || COLORS.border,
    marginBottom: SPACING.md,
  },
  loadingWrap: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBar: {
    paddingHorizontal: SPACING.screenX,
    paddingTop: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  ctaBtn: {
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.sm,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.card,
  },
  ctaBtnPressed: { opacity: 0.85 },
  ctaLabel: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textInverse,
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
    gap: 12,
    paddingHorizontal: SPACING.screenX,
    paddingVertical: 14,
  },
  conversationRowUnread: {
    backgroundColor: 'rgba(255, 217, 94, 0.15)',
  },
  conversationBody: {
    flex: 1,
    minWidth: 0,
  },
  conversationName: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  conversationPreview: {
    marginTop: 2,
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textMuted,
  },
  conversationMeta: {
    alignItems: 'flex-end',
    gap: 6,
  },
  conversationTimestamp: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  conversationNameUnread: {
    fontFamily: FONTS.bodyMedium,
    color: COLORS.textPrimary,
  },
  conversationPreviewUnread: {
    fontFamily: FONTS.bodyMedium,
    color: COLORS.textPrimary,
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadBadgeText: {
    color: COLORS.textPrimary,
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
  },
});