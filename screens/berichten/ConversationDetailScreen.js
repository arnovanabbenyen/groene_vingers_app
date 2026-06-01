import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
  View,
} from 'react-native';
import {
  ArrowLeftIcon,
  CameraIcon,
  HandshakeIcon,
  ImageIcon,
  LockSimpleIcon,
  PaperPlaneRightIcon,
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
import ChatAvatar from '../../components/chat/ChatAvatar';
import { showToast } from '../../components/common/Toast';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SPACING } from '../../components/theme/tokens';

const FIVE_MINUTES_MS = 5 * 60 * 1000;
const SCREEN_WIDTH = Dimensions.get('window').width;
const MESSAGE_AVATAR_SIZE = 40;
const INPUT_PILL_BG = 'rgba(87, 98, 56, 0.05)';
const TIMESTAMP_COLOR = 'rgba(0,0,0,0.45)';

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
      <Pressable onPress={() => onPress(urls[0], urls)}>
        <Image source={{ uri: urls[0] }} style={styles.chatImageSingle} resizeMode="cover" />
      </Pressable>
    );
  }

  const displayUrls = urls.slice(0, 4);
  const hiddenCount = total - 4;

  if (total === 2) {
    return (
      <View style={styles.imageGrid2}>
        {displayUrls.map((url, i) => (
          <Pressable key={i} onPress={() => onPress(url, urls)}>
            <Image source={{ uri: url }} style={styles.chatImageHalf} resizeMode="cover" />
          </Pressable>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.imageGrid}>
      {displayUrls.map((url, i) => (
        <Pressable key={i} style={styles.imageGridCell} onPress={() => onPress(url, urls)}>
          <Image source={{ uri: url }} style={styles.chatImageTile} resizeMode="cover" />
          {i === 3 && hiddenCount > 0 && (
            <View style={styles.imageGridOverlay}>
              <Text style={styles.imageGridOverlayText}>+{hiddenCount}</Text>
            </View>
          )}
        </Pressable>
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

export default function ConversationDetailScreen({ conversation, onBack, onConfirmSamenwerking, onViewProfile }) {
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
  const [isBannerDismissed, setIsBannerDismissed] = useState(true);

  const aanvraagStatus = aanvraag?.status ?? null;
  const isOwner = !!currentUserId && currentUserId === aanvraag?.percelen?.owner_id;
  const isEnded = aanvraagStatus === AANVRAAG_STATUS.ENDED;

  const baseConditions =
    isOwner &&
    aanvraagStatus === AANVRAAG_STATUS.ACCEPTED &&
    !aanvraag?.samenwerking_proposed_at;

  const shouldShowHeaderProposeButton = baseConditions;
  const shouldShowProposeBanner = baseConditions && !isBannerDismissed;

  function openPreview(url, allUrls) {
    const idx = allUrls.indexOf(url);
    setPreviewUrls(allUrls);
    setPreviewIndex(idx >= 0 ? idx : 0);
  }

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

  useEffect(() => {
    if (!conversation?.id) return;

    const channel = supabase
      .channel(`messages:${conversation.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversation.id}` },
        (payload) => {
          setMessages((current) => {
            if (current.some((m) => m.id === payload.new.id)) return current;
            return [...current, payload.new];
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversation.id]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  useEffect(() => {
    async function markAsRead() {
      if (!currentUserId || messages.length === 0) return;
      const unread = messages.filter((m) => m.sender_id !== currentUserId && !m.read_at && !m._optimistic);
      if (unread.length === 0) return;
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .in('id', unread.map((m) => m.id));
    }
    markAsRead();
  }, [messages, currentUserId]);

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
      setMessages((current) => [
        ...current,
        {
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
        },
      ]);

      try {
        const uploads = await Promise.all(
          imagesToSend.map((asset) => uploadChatImage(currentUserId, asset.uri))
        );
        const { data, error } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversation.id,
            sender_id: currentUserId,
            content: null,
            media_urls: uploads.map((u) => u.publicUrl),
            media_type: 'image/jpeg',
          })
          .select('id, conversation_id, sender_id, content, created_at, read_at, media_url, media_urls, media_type, type')
          .single();
        if (error) throw error;
        setMessages((current) => current.map((m) => (m.id === tempId ? data : m)));
      } catch {
        setMessages((current) => current.filter((m) => m.id !== tempId));
        showToast("Foto's konden niet worden verzonden.", 'error');
      }
    }

    if (textToSend) {
      const tempId = `temp-${Date.now()}`;
      setMessages((current) => [
        ...current,
        {
          id: tempId,
          conversation_id: conversation.id,
          sender_id: currentUserId,
          content: textToSend,
          created_at: new Date().toISOString(),
          read_at: null,
          _optimistic: true,
          type: 'user',
        },
      ]);

      const { data, error } = await supabase
        .from('messages')
        .insert({ conversation_id: conversation.id, sender_id: currentUserId, content: textToSend })
        .select('id, conversation_id, sender_id, content, created_at, read_at, media_url, media_urls, media_type, type')
        .single();

      if (error) {
        setMessages((current) => current.filter((m) => m.id !== tempId));
        setMessageInput(textToSend);
        showToast('Bericht kon niet worden verzonden. Probeer opnieuw.', 'error');
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

  async function handleProposeSamenwerking() {
    if (!aanvraag?.id || !conversation.id || !currentUserId) return;
    setIsProposing(true);
    try {
      await proposeSamenwerking(aanvraag.id, conversation.id, currentUserId);
      await Promise.all([loadMessages(), loadAanvraag()]);
    } catch (err) {
      showToast(err.message || 'Er ging iets mis.', 'error');
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
      showToast(err.message || 'Er ging iets mis.', 'error');
    }
  }

  async function handleCancelProposal() {
    if (!aanvraag?.id || !conversation.id || !currentUserId) return;
    try {
      await cancelSamenwerkingProposal(aanvraag.id, conversation.id, currentUserId);
      await Promise.all([loadMessages(), loadAanvraag()]);
    } catch (err) {
      showToast(err.message || 'Er ging iets mis.', 'error');
    }
  }

  const otherUser = conversation?.otherUser;
  const displayName = [otherUser?.first_name, otherUser?.last_name].filter(Boolean).join(' ').trim() || 'Gesprek';

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
    const bottomMargin = msg.isLastInGroup ? SPACING.md : SPACING.xs + 2;
    const imageUrls = msg.media_urls?.length > 0
      ? msg.media_urls
      : (msg.media_url ? [msg.media_url] : []);
    const hasImages = imageUrls.length > 0;
    const displayContent = msg.content;
    const a11yLabel = hasImages
      ? (imageUrls.length > 1 ? `${imageUrls.length} foto's` : 'Foto')
      : (displayContent || '');

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
              : <Text style={styles.ownBubbleText}>{displayContent}</Text>
            }
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.otherRow, { marginBottom: bottomMargin }]}>
        {msg.isFirstInGroup ? (
          <ChatAvatar avatarUrl={otherUser?.avatar_url} size={MESSAGE_AVATAR_SIZE} />
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
              : <Text style={styles.otherBubbleText}>{displayContent}</Text>
            }
          </View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.root}
      keyboardVerticalOffset={0}
    >
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.headerRow}>
          <Pressable
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Terug naar berichtenoverzicht"
          >
            <ArrowLeftIcon size={20} color={COLORS.textInverse} weight="regular" />
            <Text style={styles.backText}>Terug</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.headerCenter, pressed && styles.headerCenterPressed]}
            onPress={() => onViewProfile?.(otherUser?.id)}
            disabled={!onViewProfile || !otherUser?.id}
            accessibilityRole="button"
            accessibilityLabel={`Bekijk profiel van ${displayName}`}
          >
            <ChatAvatar avatarUrl={otherUser?.avatar_url} size={36} />
            <Text style={styles.headerName} numberOfLines={1}>{displayName}</Text>
          </Pressable>

          <View style={styles.headerRight}>
            {shouldShowHeaderProposeButton && (
              <Pressable
                style={({ pressed }) => [styles.headerProposeButton, pressed && styles.headerProposeButtonPressed]}
                onPress={() => setIsBannerDismissed(false)}
                accessibilityRole="button"
                accessibilityLabel="Toon samenwerking voorstel"
              >
                <HandshakeIcon size={16} color={COLORS.textInverse} weight="regular" />
                <Text style={styles.headerProposeButtonText}>Voorstel</Text>
              </Pressable>
            )}
          </View>
        </View>
      </SafeAreaView>

      {!isLoadingMessages && shouldShowProposeBanner && (
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
            hitSlop={8}
          >
            <XIcon size={14} color={COLORS.textSecondary} weight="bold" />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.proposeBannerButton, (isProposing || pressed) && styles.proposeBannerButtonPressed]}
            onPress={handleProposeSamenwerking}
            disabled={isProposing}
            accessibilityRole="button"
            accessibilityLabel="Samenwerking voorstellen"
          >
            <Text style={styles.proposeBannerButtonText}>
              {isProposing ? 'Bezig...' : 'Stel voor'}
            </Text>
          </Pressable>
        </View>
      )}

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

      {previewUrls && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setPreviewUrls(null)}>
          <View style={styles.previewOverlay}>
            <View style={[styles.previewHeader, { paddingTop: Math.max(insets.top, SPACING.md) }]}>
              <Pressable
                style={styles.previewCloseBtn}
                onPress={() => setPreviewUrls(null)}
                accessibilityRole="button"
                accessibilityLabel="Sluiten"
              >
                <XIcon size={20} color={COLORS.textInverse} weight="bold" />
              </Pressable>
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
              getItemLayout={(_, index) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index })}
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                setPreviewIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH));
              }}
            />

            {previewUrls.length > 1 && (
              <View style={[styles.previewDots, { paddingBottom: Math.max(insets.bottom, SPACING.lg) }]}>
                {previewUrls.map((_, i) => (
                  <View key={i} style={[styles.previewDot, i === previewIndex && styles.previewDotActive]} />
                ))}
              </View>
            )}
          </View>
        </Modal>
      )}

      {isEnded ? (
        <View
          style={[styles.lockedBar, { paddingBottom: Math.max(insets.bottom - SPACING.sm, SPACING.sm + 2) }]}
          accessible
          accessibilityLabel="Samenwerking beëindigd. Je kunt geen berichten meer versturen."
          accessibilityRole="text"
        >
          <LockSimpleIcon size={16} color={COLORS.negative} weight="fill" />
          <Text style={styles.lockedText}>
            Samenwerking beëindigd — berichten versturen is niet meer mogelijk.
          </Text>
        </View>
      ) : (
        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom - SPACING.sm, SPACING.xs) }]}>
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
                  <Pressable
                    style={styles.pendingThumbRemove}
                    onPress={() => setPendingImages((current) => current.filter((_, i) => i !== index))}
                    accessibilityRole="button"
                    accessibilityLabel="Afbeelding verwijderen"
                  >
                    <View style={styles.removeCircle}>
                      <XIcon size={11} color={COLORS.textInverse} weight="bold" />
                    </View>
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          )}

          <View style={styles.inputPill}>
            <View style={styles.inputPillLeft}>
              <Pressable
                style={({ pressed }) => [styles.cameraBtn, pressed && styles.cameraBtnPressed]}
                onPress={handlePickFromCamera}
                disabled={isSending}
                accessibilityRole="button"
                accessibilityLabel="Foto maken"
              >
                <CameraIcon size={16} color={COLORS.textInverse} weight="regular" />
              </Pressable>

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
              <Pressable
                onPress={handleSend}
                disabled={isSending}
                accessibilityRole="button"
                accessibilityLabel="Bericht verzenden"
                hitSlop={SPACING.sm}
              >
                {isSending
                  ? <ActivityIndicator size="small" color={COLORS.brand} />
                  : <PaperPlaneRightIcon size={22} color={COLORS.brand} weight="fill" />
                }
              </Pressable>
            ) : (
              <Pressable
                onPress={handlePickFromGallery}
                disabled={isSending}
                accessibilityRole="button"
                accessibilityLabel="Foto uit galerij kiezen"
                hitSlop={SPACING.sm}
              >
                <ImageIcon size={22} color={COLORS.textSecondary} weight="regular" />
              </Pressable>
            )}
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  headerSafe: {
    backgroundColor: COLORS.brand,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.screenX,
    minHeight: 60,
    paddingVertical: SPACING.sm + 4,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    minWidth: 72,
  },
  backButtonPressed: {
    opacity: 0.7,
  },
  backText: {
    color: COLORS.textInverse,
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.md,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.sm,
  },
  headerCenterPressed: {
    opacity: 0.7,
  },
  headerName: {
    color: COLORS.textInverse,
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.lg,
    maxWidth: 160,
    flexShrink: 1,
  },
  headerRight: {
    minWidth: 72,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  headerProposeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.overlayLight,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs + 2,
    minHeight: 32,
  },
  headerProposeButtonPressed: {
    opacity: 0.75,
  },
  headerProposeButtonText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textInverse,
  },
  proposeBanner: {
    marginHorizontal: SPACING.screenX,
    marginTop: SPACING.sm + 4,
    marginBottom: SPACING.xs,
    backgroundColor: COLORS.accentSoft,
    borderRadius: RADIUS.sm,
    padding: SPACING.md - 2,
    gap: SPACING.sm + 2,
  },
  proposeBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + 2,
  },
  proposeBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.brandOverlay,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  proposeBannerTextWrap: {
    flex: 1,
    gap: SPACING.xxs,
  },
  proposeBannerTitle: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  proposeBannerSubtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  proposeBannerButton: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.sm,
    paddingVertical: SPACING.sm + 2,
    alignItems: 'center',
  },
  proposeBannerButtonPressed: {
    opacity: 0.75,
  },
  proposeBannerButtonText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  proposeBannerDismiss: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    padding: SPACING.xs,
  },
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
    paddingVertical: SPACING.md,
  },
  systemContainer: {
    alignSelf: 'center',
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    maxWidth: 320,
    marginBottom: SPACING.md,
  },
  systemText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    textAlign: 'center',
    lineHeight: 18,
  },
  ownGroup: {
    alignItems: 'flex-end',
  },
  ownTimestamp: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: TIMESTAMP_COLOR,
    alignSelf: 'flex-end',
    marginBottom: SPACING.xs,
  },
  ownBubble: {
    backgroundColor: COLORS.brand,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.sm + 2,
    maxWidth: '75%',
    borderTopLeftRadius: RADIUS.md,
    borderBottomLeftRadius: RADIUS.md,
    borderBottomRightRadius: RADIUS.md,
    borderTopRightRadius: 2,
  },
  ownBubbleText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textInverse,
    lineHeight: 22,
  },
  otherRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  messageAvatarSpacer: {
    width: MESSAGE_AVATAR_SIZE,
    flexShrink: 0,
  },
  otherColumn: {
    flex: 1,
    alignItems: 'flex-start',
    gap: SPACING.sm,
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
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    flexShrink: 1,
  },
  otherTimestamp: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: TIMESTAMP_COLOR,
    marginLeft: SPACING.sm,
    flexShrink: 0,
  },
  otherBubble: {
    backgroundColor: COLORS.surfaceMuted,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.sm + 2,
    borderTopRightRadius: RADIUS.md,
    borderBottomRightRadius: RADIUS.md,
    borderBottomLeftRadius: RADIUS.md,
    borderTopLeftRadius: 2,
  },
  otherBubbleText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  ownImageBubble: {
    maxWidth: '75%',
    borderTopLeftRadius: RADIUS.md,
    borderBottomLeftRadius: RADIUS.md,
    borderBottomRightRadius: RADIUS.md,
    borderTopRightRadius: 2,
    overflow: 'hidden',
  },
  otherImageBubble: {
    borderTopRightRadius: RADIUS.md,
    borderBottomRightRadius: RADIUS.md,
    borderBottomLeftRadius: RADIUS.md,
    borderTopLeftRadius: 2,
    overflow: 'hidden',
  },
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
    color: COLORS.textInverse,
    fontSize: 22,
    fontFamily: FONTS.displayBold,
  },
  pendingStrip: {
    marginBottom: SPACING.sm,
  },
  pendingStripContent: {
    gap: SPACING.sm,
    paddingHorizontal: SPACING.xxs,
  },
  pendingThumbWrap: {
    position: 'relative',
    width: 64,
    height: 64,
  },
  pendingThumb: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.sm,
  },
  pendingThumbRemove: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
  },
  removeCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: '#000',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm + 4,
  },
  previewCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.overlayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCounter: {
    color: COLORS.textInverse,
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.md,
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
    gap: SPACING.xs + 2,
    paddingTop: SPACING.sm + 4,
  },
  previewDot: {
    width: SPACING.xs + 2,
    height: SPACING.xs + 2,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  previewDotActive: {
    backgroundColor: COLORS.textInverse,
    width: SPACING.sm,
    height: SPACING.sm,
  },
  lockedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.screenX,
    paddingTop: SPACING.md - 2,
    backgroundColor: COLORS.negativeSoft,
    borderTopWidth: 1,
    borderTopColor: 'rgba(213,60,62,0.2)',
  },
  lockedText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.negative,
    textAlign: 'center',
    flexShrink: 1,
    lineHeight: 18,
  },
  inputBar: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.screenX,
    paddingTop: SPACING.sm,
  },
  inputPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: INPUT_PILL_BG,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.xs + 5,
    paddingVertical: SPACING.sm,
  },
  inputPillLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
    minWidth: 0,
  },
  cameraBtn: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cameraBtnPressed: {
    opacity: 0.75,
  },
  textInput: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
    maxHeight: 100,
    paddingVertical: 0,
  },
});
