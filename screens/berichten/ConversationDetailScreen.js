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
  CheckCircleIcon,
  ImageIcon,
  MicrophoneIcon,
  PaperPlaneRightIcon,
  PlusIcon,
  XCircleIcon,
  XIcon,
} from 'phosphor-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../services/supabase';
import { AANVRAAG_STATUS } from '../../services/aanvraagStatus';
import { pickFromCamera, pickFromGallery, uploadChatImage } from '../../services/messageMedia';
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

// onPress(url, allUrls) — passes the tapped URL and the full array so the
// preview gallery can start at the right index and scroll through all images.
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
  const [isSamenwerkingPanelOpen, setIsSamenwerkingPanelOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [aanvraagStatus, setAanvraagStatus] = useState(null);

  const canStartSamenwerking = aanvraagStatus === AANVRAAG_STATUS.ACCEPTED;

  function openPreview(url, allUrls) {
    const idx = allUrls.indexOf(url);
    setPreviewUrls(allUrls);
    setPreviewIndex(idx >= 0 ? idx : 0);
  }

  // ── Load messages + aanvraag status ──────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!mounted) return;
      setCurrentUserId(userData?.user?.id || null);

      const { data: messagesData } = await supabase
        .from('messages')
        .select('id, conversation_id, sender_id, content, created_at, read_at, media_url, media_urls, media_type')
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

  // ── Send (bundles all pending images into one message, then text) ─────────
  async function handleSend() {
    const trimmed = messageInput.trim();
    if ((!trimmed && pendingImages.length === 0) || isSending || !currentUserId) return;

    setIsSending(true);
    const imagesToSend = [...pendingImages];
    const textToSend = trimmed;
    setPendingImages([]);
    setMessageInput('');

    // Bundle all images into ONE message
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
      };
      setMessages((current) => [...current, optimistic]);

      try {
        // Upload all images in parallel
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
          .select('id, conversation_id, sender_id, content, created_at, read_at, media_url, media_urls, media_type')
          .single();

        if (error) throw error;
        setMessages((current) => current.map((m) => (m.id === tempId ? data : m)));
      } catch {
        setMessages((current) => current.filter((m) => m.id !== tempId));
        Alert.alert('Fout', 'De afbeeldingen konden niet worden verzonden.');
      }
    }

    // Send text as a separate message after the images
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
      };
      setMessages((current) => [...current, optimistic]);

      const { data, error } = await supabase
        .from('messages')
        .insert({ conversation_id: conversation.id, sender_id: currentUserId, content: textToSend })
        .select('id, conversation_id, sender_id, content, created_at, read_at, media_url, media_urls, media_type')
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

      {/* Full-screen image gallery */}
      {previewUrls && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setPreviewUrls(null)}>
          <View style={styles.previewOverlay}>
            {/* Header: close button + counter */}
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

            {/* Swipeable images */}
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

            {/* Dot indicators */}
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
        {/* Pending image preview strip */}
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
          {/* Left: camera button + text input inline */}
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

          {/* Right: send button when there's content, mic + gallery when empty */}
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

  // Image bubbles — no background, image/grid clips to bubble radius
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

  // ImageGrid component styles
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

  // Pending image preview strip
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

  // Full-screen image gallery
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
