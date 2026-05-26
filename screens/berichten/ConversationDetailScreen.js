import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ArrowLeftIcon,
  CameraIcon,
  HandshakeIcon,
  ImageIcon,
  MicrophoneIcon,
  PaperPlaneRightIcon,
  XCircleIcon,
  XIcon,
} from 'phosphor-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../services/supabase';
import { AANVRAAG_STATUS } from '../../services/aanvraagStatus';
import { pickFromCamera, pickFromGallery, uploadChatImage } from '../../services/messageMedia';
import {
  proposeSamenwerking,
  confirmSamenwerking,
  cancelSamenwerkingProposal,
} from '../../services/samenwerkingProposal';
import SystemMessage from '../../components/chat/SystemMessage';
import { COLORS, FONTS, RADIUS, SPACING } from '../../components/theme/tokens';

const FIVE_MINUTES_MS = 5 * 60 * 1000;
const SCREEN_WIDTH = Dimensions.get('window').width;

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

function ImageGrid({ urls, onPress }) {
  const total = urls.length;

  if (total === 1) {
    return (
      <TouchableOpacity onPress={() => onPress(urls[0], urls)} activeOpacity={0.85}>
        <Image source={{ uri: urls[0] }} style={styles.chatImageSingle} resizeMode="cover" />
      </TouchableOpacity>
    );
  }

  const displayUrls = urls.slice(0, 4);
  const hiddenCount = total - 4;

  if (total === 2) {
    return (
      <View style={styles.imageGrid2}>
        {displayUrls.map((url, i) => (
          <TouchableOpacity key={i} onPress={() => onPress(url, urls)} activeOpacity={0.85}>
            <Image source={{ uri: url }} style={styles.chatImageHalf} resizeMode="cover" />
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.imageGrid}>
      {displayUrls.map((url, i) => (
        <TouchableOpacity key={i} style={styles.imageGridCell} onPress={() => onPress(url, urls)} activeOpacity={0.85}>
          <Image source={{ uri: url }} style={styles.chatImageTile} resizeMode="cover" />
          {i === 3 && hiddenCount > 0 && (
            <View style={styles.imageGridOverlay}>
              <Text style={styles.imageGridOverlayText}>+{hiddenCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
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
  const [pendingImages, setPendingImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [aanvraag, setAanvraag] = useState(null);
  const [isProposing, setIsProposing] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  // Derived
  const aanvraagStatus = aanvraag?.status ?? null;
  const isOwner = !!currentUserId && currentUserId === aanvraag?.percelen?.owner_id;
  const userMessageCount = messages.filter((m) => m.type === 'user' || !m.type).length;

  const baseConditions =
    isOwner &&
    aanvraagStatus === AANVRAAG_STATUS.ACCEPTED &&
    !aanvraag?.samenwerking_proposed_at;

  const shouldShowHeaderProposeButton = baseConditions && (userMessageCount < 5 || isBannerDismissed);
  const shouldShowProposeBanner = baseConditions && userMessageCount >= 5;

  function openPreview(url, allUrls) {
    const idx = allUrls.indexOf(url);
    setPreviewUrls(allUrls);
    setPreviewIndex(idx >= 0 ? idx : 0);
  }

  // ── Data loaders (also called from handlers to refresh) ───────────────────
  async function loadMessages() {
    const { data } = await supabase
      .from('messages')
      .select('id, conversation_id, sender_id, content, created_at, read_at, media_url, media_urls, media_type, type')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true });
    setMessages(data || []);
  }

  async function loadAanvraag() {
    if (!conversation.aanvraag_id) return;
    const { data } = await supabase
      .from('aanvragen')
      .select('id, status, samenwerking_proposed_at, samenwerking_proposed_by, confirmed_at, percelen(owner_id)')
      .eq('id', conversation.aanvraag_id)
      .maybeSingle();
    setAanvraag(data || null);
  }

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    async function initialize() {
      const { data: userData } = await supabase.auth.getUser();
      if (mounted) setCurrentUserId(userData?.user?.id || null);

      await Promise.all([loadMessages(), loadAanvraag()]);
      if (mounted) setIsLoadingMessages(false);
    }

    initialize();
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

  // ── Send ──────────────────────────────────────────────────────────────────
  async function handleSend() {
    const trimmed = messageInput.trim();
    if ((!trimmed && pendingImages.length === 0) || isSending || !currentUserId) return;

    setIsSending(true);
    const imagesToSend = [...pendingImages];
    const textToSend = trimmed;
    setPendingImages([]);
    setMessageInput('');

    if (imagesToSend.length > 0) {
      const tempId = `temp-img-${Date.now()}`;
      const optimistic = {
        id: tempId,
        conversation_id: conversation.id,
        sender_id: currentUserId,
        content: null,
        media_url: null,
        media_urls: imagesToSend.map((a) => a.uri),
        media_type: 'image/jpeg',
        created_at: new Date().toISOString(),
        read_at: null,
        _optimistic: true,
        type: 'user',
      };
      setMessages((current) => [...current, optimistic]);

      try {
        const uploads = await Promise.all(
          imagesToSend.map((asset) => uploadChatImage(currentUserId, asset.uri))
        );
        const publicUrls = uploads.map((u) => u.publicUrl);

        const { data, error } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversation.id,
            sender_id: currentUserId,
            content: null,
            media_urls: publicUrls,
            media_type: 'image/jpeg',
          })
          .select('id, conversation_id, sender_id, content, created_at, read_at, media_url, media_urls, media_type, type')
          .single();

        if (error) throw error;
        setMessages((current) => current.map((m) => (m.id === tempId ? data : m)));
      } catch {
        setMessages((current) => current.filter((m) => m.id !== tempId));
        Alert.alert('Fout', 'De afbeeldingen konden niet worden verzonden.');
      }
    }

    if (textToSend) {
      const tempId = `temp-${Date.now()}`;
      const optimistic = {
        id: tempId,
        conversation_id: conversation.id,
        sender_id: currentUserId,
        content: textToSend,
        created_at: new Date().toISOString(),
        read_at: null,
        _optimistic: true,
        type: 'user',
      };
      setMessages((current) => [...current, optimistic]);

      const { data, error } = await supabase
        .from('messages')
        .insert({ conversation_id: conversation.id, sender_id: currentUserId, content: textToSend })
        .select('id, conversation_id, sender_id, content, created_at, read_at, media_url, media_urls, media_type, type')
        .single();

      if (error) {
        setMessages((current) => current.filter((m) => m.id !== tempId));
        setMessageInput(textToSend);
        Alert.alert('Fout', 'Het bericht kon niet worden verzonden. Probeer opnieuw.');
      } else {
        setMessages((current) => current.map((m) => (m.id === tempId ? data : m)));
      }
    }

    setIsSending(false);
  }

  async function handlePickFromCamera() {
    const assets = await pickFromCamera();
    if (assets.length) setPendingImages((current) => [...current, ...assets]);
  }

  async function handlePickFromGallery() {
    const assets = await pickFromGallery();
    if (assets.length) setPendingImages((current) => [...current, ...assets]);
  }

  // ── Samenwerking handlers ─────────────────────────────────────────────────
  async function handleProposeSamenwerking() {
    if (!aanvraag?.id || !conversation.id || !currentUserId) return;
    setIsProposing(true);
    try {
      await proposeSamenwerking(aanvraag.id, conversation.id, currentUserId);
      await Promise.all([loadMessages(), loadAanvraag()]);
    } catch (err) {
      Alert.alert('Er ging iets mis', err.message);
    } finally {
      setIsProposing(false);
    }
  }

  async function handleConfirmSamenwerking() {
    if (!aanvraag?.id || !conversation.id || !currentUserId) return;
    try {
      await confirmSamenwerking(aanvraag.id, conversation.id, currentUserId);
      await Promise.all([loadMessages(), loadAanvraag()]);
      onConfirmSamenwerking?.();
    } catch (err) {
      Alert.alert('Er ging iets mis', err.message);
    }
  }

  async function handleCancelProposal() {
    if (!aanvraag?.id || !conversation.id || !currentUserId) return;
    try {
      await cancelSamenwerkingProposal(aanvraag.id, conversation.id, currentUserId);
      await Promise.all([loadMessages(), loadAanvraag()]);
    } catch (err) {
      Alert.alert('Er ging iets mis', err.message);
    }
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
    if (msg.type && msg.type !== 'user') {
      return (
        <SystemMessage
          message={msg}
          aanvraag={aanvraag}
          isOwner={isOwner}
          onConfirm={handleConfirmSamenwerking}
          onDecline={handleCancelProposal}
        />
      );
    }

    const isOwn = msg.sender_id === currentUserId;
    const bottomMargin = msg.isLastInGroup ? 16 : 6;
    const imageUrls = msg.media_urls?.length > 0
      ? msg.media_urls
      : (msg.media_url ? [msg.media_url] : []);
    const hasImages = imageUrls.length > 0;
    const a11yLabel = hasImages
      ? (imageUrls.length > 1 ? `${imageUrls.length} foto's` : 'Foto')
      : (msg.content || '');

    if (isOwn) {
      return (
        <View style={[styles.ownGroup, { marginBottom: bottomMargin }]}>
          {msg.isFirstInGroup && (
            <Text style={styles.ownTimestamp}>{formatMessageTime(msg.created_at)}</Text>
          )}
          <View
            style={hasImages ? styles.ownImageBubble : styles.ownBubble}
            accessibilityRole="text"
            accessibilityLabel={`Jouw bericht: ${a11yLabel}, ${formatMessageTime(msg.created_at)}`}
          >
            {hasImages
              ? <ImageGrid urls={imageUrls} onPress={openPreview} />
              : <Text style={styles.ownBubbleText}>{msg.content}</Text>
            }
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.otherRow, { marginBottom: bottomMargin }]}>
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
            style={hasImages ? styles.otherImageBubble : styles.otherBubble}
            accessibilityRole="text"
            accessibilityLabel={`Bericht van ${otherUser?.first_name || displayName}: ${a11yLabel}, ${formatMessageTime(msg.created_at)}`}
          >
            {hasImages
              ? <ImageGrid urls={imageUrls} onPress={openPreview} />
              : <Text style={styles.otherBubbleText}>{msg.content}</Text>
            }
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Terug naar berichtenoverzicht"
          >
            <ArrowLeftIcon size={20} color={COLORS.surface} weight="regular" />
            <Text style={styles.backText}>Terug</Text>
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <View style={styles.headerAvatarWrap}>
              <Image source={avatarSource} style={styles.headerAvatar} />
            </View>
            <View style={styles.headerNameCol}>
              <Text style={styles.headerName} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={styles.headerStatus}>offline</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            {shouldShowHeaderProposeButton && (
              <Pressable
                style={styles.headerProposeButton}
                onPress={() => setIsBannerDismissed(false)}
                accessibilityRole="button"
                accessibilityLabel="Toon samenwerking voorstel"
              >
                <HandshakeIcon size={16} color={COLORS.surface} weight="regular" />
                <Text style={styles.headerProposeButtonText}>Voorstel</Text>
              </Pressable>
            )}
          </View>
        </View>
      </SafeAreaView>

      {/* Propose banner — owner only, when status=accepted and no proposal pending */}
      {!isLoadingMessages && shouldShowProposeBanner && !isBannerDismissed && (
        <View style={styles.proposeBanner}>
          <View style={styles.proposeBannerContent}>
            <View style={styles.proposeBannerIcon}>
              <HandshakeIcon size={20} color={COLORS.brand} weight="regular" />
            </View>
            <View style={styles.proposeBannerTextWrap}>
              <Text style={styles.proposeBannerTitle}>Klaar om officieel te starten?</Text>
              <Text style={styles.proposeBannerSubtitle}>
                Stel de samenwerking voor en wacht op bevestiging.
              </Text>
            </View>
          </View>
          <Pressable
            style={styles.proposeBannerDismiss}
            onPress={() => setIsBannerDismissed(true)}
            accessibilityRole="button"
            accessibilityLabel="Banner sluiten"
          >
            <XIcon size={14} color={COLORS.textSecondary} weight="bold" />
          </Pressable>
          <Pressable
            style={[styles.proposeBannerButton, isProposing && { opacity: 0.6 }]}
            onPress={handleProposeSamenwerking}
            disabled={isProposing}
          >
            <Text style={styles.proposeBannerButtonText}>
              {isProposing ? 'Bezig...' : 'Stel voor'}
            </Text>
          </Pressable>
        </View>
      )}

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
          ListHeaderComponent={
            messages.filter((m) => m.type === 'user' || !m.type).length === 0
              ? <SystemMessageHeader />
              : null
          }
        />
      )}

      {/* Full-screen image gallery */}
      {previewUrls && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setPreviewUrls(null)}>
          <View style={styles.previewOverlay}>
            <View style={[styles.previewHeader, { paddingTop: Math.max(insets.top, 16) }]}>
              <TouchableOpacity
                style={styles.previewCloseBtn}
                onPress={() => setPreviewUrls(null)}
                accessibilityRole="button"
                accessibilityLabel="Sluiten"
              >
                <XIcon size={20} color="#FFFFFF" weight="bold" />
              </TouchableOpacity>
              {previewUrls.length > 1 && (
                <Text style={styles.previewCounter}>{previewIndex + 1} / {previewUrls.length}</Text>
              )}
              <View style={styles.previewHeaderSpacer} />
            </View>

            <FlatList
              horizontal
              pagingEnabled
              initialScrollIndex={previewIndex}
              data={previewUrls}
              keyExtractor={(_, i) => String(i)}
              renderItem={({ item: url }) => (
                <View style={styles.previewImageWrap}>
                  <Image source={{ uri: url }} style={styles.previewImage} resizeMode="contain" />
                </View>
              )}
              getItemLayout={(_, index) => ({
                length: SCREEN_WIDTH,
                offset: SCREEN_WIDTH * index,
                index,
              })}
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                setPreviewIndex(index);
              }}
            />

            {previewUrls.length > 1 && (
              <View style={[styles.previewDots, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                {previewUrls.map((_, i) => (
                  <View key={i} style={[styles.previewDot, i === previewIndex && styles.previewDotActive]} />
                ))}
              </View>
            )}
          </View>
        </Modal>
      )}

      {/* Sticky input bar */}
      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom - 8, 4) }]}>
        {pendingImages.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.pendingStrip}
            contentContainerStyle={styles.pendingStripContent}
          >
            {pendingImages.map((asset, index) => (
              <View key={`${asset.uri}-${index}`} style={styles.pendingThumbWrap}>
                <Image source={{ uri: asset.uri }} style={styles.pendingThumb} resizeMode="cover" />
                <TouchableOpacity
                  style={styles.pendingThumbRemove}
                  onPress={() => setPendingImages((current) => current.filter((_, i) => i !== index))}
                  accessibilityRole="button"
                  accessibilityLabel="Afbeelding verwijderen"
                >
                  <XCircleIcon size={20} color="rgba(0,0,0,0.72)" weight="fill" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        <View style={styles.inputPill}>
          <View style={styles.inputPillLeft}>
            <TouchableOpacity
              style={styles.cameraBtn}
              onPress={handlePickFromCamera}
              disabled={isSending}
              accessibilityRole="button"
              accessibilityLabel="Foto maken"
            >
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

          {(messageInput.trim().length > 0 || pendingImages.length > 0) ? (
            <TouchableOpacity
              onPress={handleSend}
              disabled={isSending}
              accessibilityRole="button"
              accessibilityLabel="Bericht verzenden"
            >
              {isSending
                ? <ActivityIndicator size="small" color={COLORS.brand} />
                : <PaperPlaneRightIcon size={22} color={COLORS.brand} weight="fill" />
              }
            </TouchableOpacity>
          ) : (
            <View style={styles.iconsRight}>
              <TouchableOpacity
                onPress={() => Alert.alert('Spraakbericht', 'Spraakberichten zijn niet beschikbaar.')}
                accessibilityRole="button"
                accessibilityLabel="Spraakbericht opnemen"
              >
                <MicrophoneIcon size={22} color={COLORS.textPrimary} weight="regular" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handlePickFromGallery}
                disabled={isSending}
                accessibilityRole="button"
                accessibilityLabel="Foto uit galerij kiezen"
              >
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },

  // ── Header ────────────────────────────────────────────────────────────────
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
  headerProposeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 32,
  },
  headerProposeButtonText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.surface,
  },

  // ── Propose banner ────────────────────────────────────────────────────────
  proposeBanner: {
    marginHorizontal: SPACING.screenX,
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: '#FFF8E1',
    borderRadius: RADIUS.sm,
    padding: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  proposeBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  proposeBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(87,98,56,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  proposeBannerTextWrap: {
    flex: 1,
    gap: 2,
  },
  proposeBannerTitle: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  proposeBannerSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  proposeBannerButton: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.sm,
    paddingVertical: 10,
    alignItems: 'center',
  },
  proposeBannerButtonText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  proposeBannerDismiss: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
  },

  // ── Messages list ─────────────────────────────────────────────────────────
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

  // Other messages (left-aligned, gray)
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

  // Image bubbles
  ownImageBubble: {
    maxWidth: '75%',
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    borderTopRightRadius: 2,
    overflow: 'hidden',
  },
  otherImageBubble: {
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    borderBottomLeftRadius: 10,
    borderTopLeftRadius: 2,
    overflow: 'hidden',
  },

  // ImageGrid
  chatImageSingle: {
    width: 200,
    height: 150,
  },
  imageGrid2: {
    flexDirection: 'row',
    gap: 2,
  },
  chatImageHalf: {
    width: 100,
    height: 130,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    width: 202,
  },
  imageGridCell: {
    position: 'relative',
  },
  chatImageTile: {
    width: 100,
    height: 100,
  },
  imageGridOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageGridOverlayText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontFamily: FONTS.displayBold,
  },

  // Pending images
  pendingStrip: {
    marginBottom: 8,
  },
  pendingStripContent: {
    gap: 8,
    paddingHorizontal: 2,
  },
  pendingThumbWrap: {
    position: 'relative',
    width: 64,
    height: 64,
  },
  pendingThumb: {
    width: 64,
    height: 64,
    borderRadius: 8,
  },
  pendingThumbRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
  },

  // Full-screen gallery
  previewOverlay: {
    flex: 1,
    backgroundColor: '#000000',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  previewCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCounter: {
    color: '#FFFFFF',
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
  },
  previewHeaderSpacer: {
    width: 36,
  },
  previewImageWrap: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'center',
  },
  previewImage: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  previewDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingTop: 12,
  },
  previewDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  previewDotActive: {
    backgroundColor: '#FFFFFF',
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // ── Input bar ─────────────────────────────────────────────────────────────
  inputBar: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.screenX,
    paddingTop: 8,
  },
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
