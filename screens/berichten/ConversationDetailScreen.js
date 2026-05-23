import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ArrowLeftIcon,
  CameraIcon,
  CheckCircleIcon,
  ImageIcon,
  MicrophoneIcon,
  PaperPlaneRightIcon,
  PlusIcon,
  XCircleIcon,
} from 'phosphor-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../services/supabase';
import { AANVRAAG_STATUS } from '../../services/aanvraagStatus';
import { COLORS, FONTS, RADIUS, SPACING } from '../../components/theme/tokens';

const FIVE_MINUTES_MS = 5 * 60 * 1000;

function formatMessageTime(timestamp) {
  if (!timestamp) return '';
  try {
    return new Date(timestamp).toLocaleTimeString('nl-BE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return '';
  }
}

function SystemMessageHeader() {
  return (
    <View style={styles.systemContainer}>
      <Text style={styles.systemText}>
        Jullie kunnen nu met elkaar in gesprek gaan. Neem even de tijd om kennis te maken en
        verwachtingen af te stemmen.
      </Text>
    </View>
  );
}

export default function ConversationDetailScreen({ conversation, onBack, onConfirmSamenwerking }) {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSamenwerkingPanelOpen, setIsSamenwerkingPanelOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [aanvraagStatus, setAanvraagStatus] = useState(null);

  const canStartSamenwerking = aanvraagStatus === AANVRAAG_STATUS.ACCEPTED;

  // ── Load messages + aanvraag status ──────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!mounted) return;
      setCurrentUserId(userData?.user?.id || null);

      const { data: messagesData } = await supabase
        .from('messages')
        .select('id, conversation_id, sender_id, content, created_at, read_at')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true });

      if (mounted) setMessages(messagesData || []);

      if (conversation.aanvraag_id) {
        const { data: aanvraagData } = await supabase
          .from('aanvragen')
          .select('status')
          .eq('id', conversation.aanvraag_id)
          .maybeSingle();
        if (mounted) setAanvraagStatus(aanvraagData?.status || null);
      }

      if (mounted) setIsLoadingMessages(false);
    }

    load();
    return () => { mounted = false; };
  }, [conversation.id]);

  // ── Realtime new messages ─────────────────────────────────────────────────
  useEffect(() => {
    if (!conversation?.id) return;

    const channel = supabase
      .channel(`messages:${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          setMessages((current) => {
            const exists = current.some((m) => m.id === payload.new.id);
            if (exists) return current;
            return [...current, payload.new];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation.id]);

  // ── Scroll to bottom on new message ──────────────────────────────────────
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // ── Mark incoming messages as read ───────────────────────────────────────
  useEffect(() => {
    async function markAsRead() {
      if (!currentUserId || messages.length === 0) return;

      const unreadFromOther = messages.filter(
        (m) => m.sender_id !== currentUserId && !m.read_at && !m._optimistic
      );

      if (unreadFromOther.length === 0) return;

      const unreadIds = unreadFromOther.map((m) => m.id);
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .in('id', unreadIds);
    }

    markAsRead();
  }, [messages, currentUserId]);

  // ── Grouping metadata ─────────────────────────────────────────────────────
  const messageGroups = useMemo(() => {
    return messages.map((msg, index) => {
      const prev = messages[index - 1];
      const next = messages[index + 1];

      const isFirstInGroup =
        !prev ||
        prev.sender_id !== msg.sender_id ||
        new Date(msg.created_at) - new Date(prev.created_at) > FIVE_MINUTES_MS;

      const isLastInGroup =
        !next ||
        next.sender_id !== msg.sender_id ||
        new Date(next.created_at) - new Date(msg.created_at) > FIVE_MINUTES_MS;

      return { ...msg, isFirstInGroup, isLastInGroup };
    });
  }, [messages]);

  // ── Send message ──────────────────────────────────────────────────────────
  async function handleSendMessage() {
    const trimmed = messageInput.trim();
    if (!trimmed || isSending || !currentUserId) return;

    setIsSending(true);

    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      id: tempId,
      conversation_id: conversation.id,
      sender_id: currentUserId,
      content: trimmed,
      created_at: new Date().toISOString(),
      read_at: null,
      _optimistic: true,
    };

    setMessages((current) => [...current, optimistic]);
    setMessageInput('');

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        sender_id: currentUserId,
        content: trimmed,
      })
      .select('id, conversation_id, sender_id, content, created_at, read_at')
      .single();

    setIsSending(false);

    if (error) {
      setMessages((current) => current.filter((m) => m.id !== tempId));
      setMessageInput(trimmed);
      Alert.alert('Fout', 'Het bericht kon niet worden verzonden. Probeer opnieuw.');
      return;
    }

    setMessages((current) =>
      current.map((m) => (m.id === tempId ? data : m))
    );
  }

  // ── Confirm samenwerking ──────────────────────────────────────────────────
  async function handleConfirmSamenwerking() {
    if (!conversation.aanvraag_id) return;

    Alert.alert(
      'Samenwerking starten?',
      'Weet je zeker dat je de samenwerking wilt bevestigen? Deze actie maakt jullie samenwerking officieel.',
      [
        { text: 'Annuleren', style: 'cancel' },
        {
          text: 'Bevestigen',
          onPress: async () => {
            const { error } = await supabase
              .from('aanvragen')
              .update({
                status: AANVRAAG_STATUS.CONFIRMED,
                confirmed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('id', conversation.aanvraag_id);

            if (error) {
              Alert.alert('Fout', 'De samenwerking kon niet worden bevestigd. Probeer opnieuw.');
              return;
            }

            setAanvraagStatus(AANVRAAG_STATUS.CONFIRMED);
            setIsSamenwerkingPanelOpen(false);

            // TODO: implement mutual confirmation flow — currently a single tap by either party
            // confirms. For production, both parties should agree before status becomes confirmed.

            // TODO: insert a system message into the chat indicating the samenwerking is now
            // official, e.g. "Samenwerking gestart op DD/MM/YYYY"

            Alert.alert(
              'Samenwerking bevestigd!',
              'Jullie samenwerking is nu officieel actief.',
              [{ text: 'OK', onPress: () => onConfirmSamenwerking?.() }]
            );
          },
        },
      ]
    );
  }

  function handleDeclineSamenwerking() {
    setIsSamenwerkingPanelOpen(false);
    // TODO: decide UX — should declining transition the aanvraag back to 'declined',
    // or keep it as 'accepted' so they can continue chatting?
  }

  // ── Derived display values ────────────────────────────────────────────────
  const otherUser = conversation?.otherUser;
  const displayName =
    [otherUser?.first_name, otherUser?.last_name].filter(Boolean).join(' ').trim() || 'Gesprek';
  const avatarSource = otherUser?.avatar_url
    ? { uri: otherUser.avatar_url }
    : require('../../images/tuinzoeker_pfp.png');

  // ── Message renderer ──────────────────────────────────────────────────────
  function renderItem({ item: msg }) {
    const isOwn = msg.sender_id === currentUserId;
    const bottomMargin = msg.isLastInGroup ? 16 : 6;

    if (isOwn) {
      return (
        <View style={[styles.ownGroup, { marginBottom: bottomMargin }]}>
          {msg.isFirstInGroup && (
            <Text style={styles.ownTimestamp}>{formatMessageTime(msg.created_at)}</Text>
          )}
          <View
            style={styles.ownBubble}
            accessibilityRole="text"
            accessibilityLabel={`Jouw bericht: ${msg.content}, ${formatMessageTime(msg.created_at)}`}
          >
            <Text style={styles.ownBubbleText}>{msg.content}</Text>
          </View>
        </View>
      );
    }

    // Other person's message
    return (
      <View style={[styles.otherRow, { marginBottom: bottomMargin }]}>
        {/* Avatar or spacer */}
        {msg.isFirstInGroup ? (
          <Image source={avatarSource} style={styles.messageAvatar} />
        ) : (
          <View style={styles.messageAvatarSpacer} />
        )}

        <View style={styles.otherColumn}>
          {msg.isFirstInGroup && (
            <View style={styles.otherHeader}>
              <Text style={styles.otherName} numberOfLines={1}>
                {otherUser?.first_name || displayName}
              </Text>
              <Text style={styles.otherTimestamp}>{formatMessageTime(msg.created_at)}</Text>
            </View>
          )}
          <View
            style={styles.otherBubble}
            accessibilityRole="text"
            accessibilityLabel={`Bericht van ${otherUser?.first_name || displayName}: ${msg.content}, ${formatMessageTime(msg.created_at)}`}
          >
            <Text style={styles.otherBubbleText}>{msg.content}</Text>
          </View>
        </View>
      </View>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.root}
      keyboardVerticalOffset={0}
    >
      {/* Green header band */}
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.headerRow}>
          {/* Left: back button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Terug naar berichtenoverzicht"
          >
            <ArrowLeftIcon size={20} color={COLORS.surface} weight="regular" />
            <Text style={styles.backText}>Terug</Text>
          </TouchableOpacity>

          {/* Center: avatar + name + status */}
          <View style={styles.headerCenter}>
            <View style={styles.headerAvatarWrap}>
              <Image source={avatarSource} style={styles.headerAvatar} />
            </View>
            <View style={styles.headerNameCol}>
              <Text style={styles.headerName} numberOfLines={1}>
                {displayName}
              </Text>
              {/* TODO: implement real presence via Supabase Realtime presence channels.
                  For now hardcoded to "offline". */}
              <Text style={styles.headerStatus}>offline</Text>
            </View>
          </View>

          {/* Right: plus button — only when samenwerking not yet confirmed */}
          <View style={styles.headerRight}>
            {canStartSamenwerking && (
              <TouchableOpacity
                onPress={() => setIsSamenwerkingPanelOpen((v) => !v)}
                accessibilityRole="button"
                accessibilityLabel="Samenwerking starten"
              >
                <PlusIcon size={24} color={COLORS.surface} weight="regular" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Collapsible samenwerking panel — inside the green band */}
        {isSamenwerkingPanelOpen && canStartSamenwerking && (
          <View style={styles.samenwerkingPanel}>
            <Text style={styles.samenwerkingQuestion}>
              Wil je de samenwerking accepteren?
            </Text>
            <View style={styles.samenwerkingButtons}>
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={handleConfirmSamenwerking}
                accessibilityRole="button"
                accessibilityLabel="Samenwerking accepteren"
              >
                <CheckCircleIcon size={18} color={COLORS.brand} weight="regular" />
                <Text style={styles.acceptText}>Accepteer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.weigerButton}
                onPress={handleDeclineSamenwerking}
                accessibilityRole="button"
                accessibilityLabel="Samenwerking weigeren"
              >
                <XCircleIcon size={18} color={COLORS.surface} weight="regular" />
                <Text style={styles.weigerText}>Weiger</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>

      {/* Messages list */}
      {isLoadingMessages ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={COLORS.brand} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messageGroups}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={<SystemMessageHeader />}
        />
      )}

      {/* Sticky input bar */}
      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom - 8, 4) }]}>
        <View style={styles.inputPill}>
          {/* Left: camera button + text input inline */}
          <View style={styles.inputPillLeft}>
            <TouchableOpacity
              style={styles.cameraBtn}
              onPress={() => Alert.alert('Foto bijvoegen', 'Foto bijvoegen komt binnenkort.')}
              accessibilityRole="button"
              accessibilityLabel="Foto maken"
            >
              {/* TODO: implement photo attachment via expo-image-picker */}
              <CameraIcon size={16} color={COLORS.surface} weight="regular" />
            </TouchableOpacity>

            <TextInput
              style={styles.textInput}
              value={messageInput}
              onChangeText={setMessageInput}
              placeholder="Typ een chatbericht..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              maxHeight={100}
              accessibilityLabel="Typ je bericht"
            />
          </View>

          {/* Right: send button when typing, mic + gallery when empty */}
          {messageInput.trim().length > 0 ? (
            <TouchableOpacity
              onPress={handleSendMessage}
              disabled={isSending}
              accessibilityRole="button"
              accessibilityLabel="Bericht verzenden"
            >
              <PaperPlaneRightIcon
                size={22}
                color={isSending ? COLORS.textMuted : COLORS.brand}
                weight="fill"
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.iconsRight}>
              <TouchableOpacity
                onPress={() => Alert.alert('Spraakbericht', 'Spraakberichten komen binnenkort.')}
                accessibilityRole="button"
                accessibilityLabel="Spraakbericht opnemen"
              >
                {/* TODO: implement voice messages */}
                <MicrophoneIcon size={22} color={COLORS.textPrimary} weight="regular" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => Alert.alert('Galerij', "Foto's uit galerij komen binnenkort.")}
                accessibilityRole="button"
                accessibilityLabel="Foto uit galerij kiezen"
              >
                {/* TODO: implement gallery photo picker */}
                <ImageIcon size={22} color={COLORS.textPrimary} weight="regular" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const MESSAGE_AVATAR_SIZE = 40;
const AVATAR_COL_WIDTH = MESSAGE_AVATAR_SIZE + 8; // avatar + gap

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  headerSafe: {
    backgroundColor: COLORS.brand,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.screenX,
    minHeight: 60,
    paddingVertical: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 72,
  },
  backText: {
    color: COLORS.surface,
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 8,
  },
  headerAvatarWrap: {
    width: 36,
    height: 36,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceMuted,
  },
  headerNameCol: {
    flexShrink: 1,
    gap: 1,
  },
  headerName: {
    color: COLORS.surface,
    fontFamily: FONTS.displaySemiBold,
    fontSize: 17,
    maxWidth: 160,
  },
  headerStatus: {
    color: COLORS.surface,
    fontFamily: FONTS.body,
    fontSize: 13,
    opacity: 0.85,
  },
  headerRight: {
    minWidth: 72,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },

  // ── Samenwerking panel ───────────────────────────────────────────────────────
  samenwerkingPanel: {
    paddingHorizontal: SPACING.screenX,
    paddingBottom: 16,
    gap: 12,
  },
  samenwerkingQuestion: {
    color: COLORS.surface,
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
  },
  samenwerkingButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  acceptText: {
    color: COLORS.brand,
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
  },
  weigerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#D32F2F',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  weigerText: {
    color: COLORS.surface,
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
  },

  // ── Messages list ────────────────────────────────────────────────────────────
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesList: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  messagesContent: {
    paddingHorizontal: SPACING.screenX,
    paddingVertical: 16,
  },

  // System intro pill (ListHeaderComponent)
  systemContainer: {
    alignSelf: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: 320,
    marginBottom: 16,
  },
  systemText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.textPrimary,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Own messages (right-aligned, green)
  ownGroup: {
    alignItems: 'flex-end',
  },
  ownTimestamp: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: 'rgba(0,0,0,0.5)',
    alignSelf: 'flex-end',
    marginBottom: 4,
  },
  ownBubble: {
    backgroundColor: COLORS.brand,
    paddingHorizontal: 10,
    paddingVertical: 10,
    maxWidth: '75%',
    // Tail corner: top-right is flat (matches Figma: no tr rounding)
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    borderTopRightRadius: 2,
  },
  ownBubbleText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.textInverse,
    lineHeight: 20,
  },

  // Other person's messages (left-aligned, gray)
  otherRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  messageAvatar: {
    width: MESSAGE_AVATAR_SIZE,
    height: MESSAGE_AVATAR_SIZE,
    borderRadius: MESSAGE_AVATAR_SIZE / 2,
    backgroundColor: COLORS.surfaceMuted,
    flexShrink: 0,
  },
  messageAvatarSpacer: {
    width: MESSAGE_AVATAR_SIZE,
    flexShrink: 0,
  },
  otherColumn: {
    flex: 1,
    alignItems: 'flex-start',
    gap: 8,
    maxWidth: '75%',
  },
  otherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  otherName: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.textPrimary,
    flexShrink: 1,
  },
  otherTimestamp: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: 'rgba(0,0,0,0.5)',
    marginLeft: 8,
    flexShrink: 0,
  },
  otherBubble: {
    backgroundColor: '#EFEFEF',
    paddingHorizontal: 10,
    paddingVertical: 10,
    // Tail corner: top-left is flat (matches Figma: no tl rounding)
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    borderBottomLeftRadius: 10,
    borderTopLeftRadius: 2,
  },
  otherBubbleText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },

  // ── Input bar ────────────────────────────────────────────────────────────────
  inputBar: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.screenX,
    paddingTop: 8,
  },
  // Pill container — matches Figma node 301:10328
  inputPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(87, 98, 56, 0.05)',
    borderRadius: 64,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 9,
    paddingVertical: 8,
  },
  inputPillLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  cameraBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textInput: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.textPrimary,
    maxHeight: 100,
    paddingVertical: 0,
  },
  iconsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flexShrink: 0,
    paddingLeft: 8,
  },
});
