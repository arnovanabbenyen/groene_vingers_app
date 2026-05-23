import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ChatCircleIcon, MagnifyingGlassIcon } from 'phosphor-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomNav from '../../components/navigation/BottomNav';
import { COLORS, FONTS, SIZES, SPACING } from '../../components/theme/tokens';
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
  if (msg.media_url) return msg.content ? `📷 ${msg.content}` : '📷 Foto';
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
      style={styles.conversationRow}
      onPress={() => onPress?.(conversation)}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Gesprek met ${name}${unreadCount > 0 ? `, ${unreadCount} ongelezen berichten` : ''}`}
    >
      <ConversationAvatar conversation={conversation} size={52} />

      <View style={styles.conversationBody}>
        <Text style={styles.conversationName} numberOfLines={1}>{name}</Text>
        <Text style={styles.conversationPreview} numberOfLines={1}>{preview}</Text>
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

export default function BerichtenOverzichtScreen({ onTabPress, profileImageSource, badgeCounts = {}, onOpenConversation }) {
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
      <SafeAreaView edges={['top']} style={[styles.headerSafeArea, { paddingTop: insets.top > 0 ? 0 : SPACING.sm }]}>
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">Berichten</Text>
          <View style={styles.searchBox}>
            <MagnifyingGlassIcon size={18} color={COLORS.textMuted} weight="regular" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Zoeken naar een gesprek"
              placeholderTextColor={COLORS.textMuted}
              style={styles.searchInput}
              accessibilityLabel="Zoeken naar een gesprek"
              accessibilityHint="Filter op naam of berichtinhoud"
            />
          </View>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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

        <View style={styles.divider} />

        {isLoading ? (
          <View style={styles.loadingWrap} accessibilityLabel="Berichten worden geladen">
            <ActivityIndicator size="small" color={COLORS.brand} />
          </View>
        ) : conversations.length === 0 ? (
          <View style={styles.emptyState} accessible accessibilityRole="text">
            <ChatCircleIcon size={40} color={COLORS.brand} weight="regular" />
            <Text style={styles.emptyTitle}>Nog geen berichten</Text>
            <Text style={styles.emptySubtext}>Wanneer je een aanvraag accepteert, kun je hier chatten met de aanvrager.</Text>
          </View>
        ) : filteredConversations.length === 0 ? (
          <View style={styles.emptyState} accessible accessibilityRole="text">
            <ChatCircleIcon size={40} color={COLORS.brand} weight="regular" />
            <Text style={styles.emptyTitle}>Geen resultaten</Text>
            <Text style={styles.emptySubtext}>Geen gesprekken gevonden voor je zoekopdracht.</Text>
          </View>
        ) : (
          filteredConversations.map((conversation) => (
            <View key={conversation.id} style={styles.rowWrap}>
              <ConversationRow conversation={conversation} onPress={onOpenConversation} />
              <View style={styles.rowDivider} />
            </View>
          ))
        )}

        <View style={{ height: SIZES.bottomNavClearance }} />
      </ScrollView>

      <BottomNav
        activeKey="berichten"
        onTabPress={onTabPress}
        profileImageSource={profileImageSource}
        badgeCounts={badgeCounts}
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
    paddingTop: 12,
    paddingBottom: 12,
  },
  title: {
    color: COLORS.surface,
    textAlign: 'center',
    fontFamily: FONTS.displaySemiBold,
    fontSize: 20,
    marginBottom: 12,
  },
  searchBox: {
    height: 44,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },
  content: { flex: 1, backgroundColor: COLORS.surface },
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
  },
  loadingWrap: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 16,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  emptySubtext: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 280,
  },
  rowWrap: {
    backgroundColor: COLORS.surface,
  },
  conversationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: SPACING.screenX,
    paddingVertical: 14,
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
  unreadBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeText: {
    color: COLORS.surface,
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
  },
  rowDivider: {
    height: 1,
    backgroundColor: COLORS.dividerSoft || COLORS.border,
    marginLeft: SPACING.screenX,
  },
});