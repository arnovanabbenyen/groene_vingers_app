import { useEffect, useState } from 'react';
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
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CalendarIcon,
  CameraIcon,
  NoteIcon,
  PencilSimpleIcon,
  TrashIcon,
  XIcon,
} from 'phosphor-react-native';
import { supabase } from '../../services/supabase';
import { pickFromCamera, pickFromGallery, uploadChatImage } from '../../services/messageMedia';
import { deleteLogboekEntry, getLogboekEntry, updateLogboekEntry } from '../../services/logboek';
import { showToast } from '../../components/common/Toast';
import { showConfirm } from '../../components/common/ConfirmDialog';
import Header from '../../components/navigation/Header';
import SectionCard from '../../components/parcel/SectionCard';
import SectionHeader from '../../components/parcel/SectionHeader';
import AuthButton from '../../components/buttons/AuthButton';
import DateBlockSelector from '../../components/aanvraag/DateBlockSelector';
import PhotoGrid from '../../components/parcel/PhotoGrid';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SPACING } from '../../components/theme/tokens';

const SCREEN_WIDTH = Dimensions.get('window').width;
const MAX_PHOTOS = 4;
const MAX_DESCRIPTION = 2000;

function parseDateString(dateStr) {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function toLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(date) {
  return date.toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function LogDetailScreen({ logId, onBack, onDeleted, onUpdated }) {
  const insets = useSafeAreaInsets();

  const [log, setLog] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [description, setDescription] = useState('');
  const [loggedDate, setLoggedDate] = useState(new Date());
  const [photos, setPhotos] = useState([]);

  const [previewIndex, setPreviewIndex] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const data = await getLogboekEntry(logId);
        if (!mounted) return;
        if (!data) {
          showToast('Deze log bestaat niet meer.', 'info');
          onBack?.();
          return;
        }
        setLog(data);
        setDescription(data.description ?? '');
        setLoggedDate(parseDateString(data.logged_at));
        setPhotos((data.fotos || []).map((url) => ({ uri: url, isExisting: true })));
      } catch {
        if (mounted) {
          showToast('Log kon niet geladen worden.', 'error');
          onBack?.();
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, [logId]);

  function handleCancelEdit() {
    setDescription(log.description ?? '');
    setLoggedDate(parseDateString(log.logged_at));
    setPhotos((log.fotos || []).map((url) => ({ uri: url, isExisting: true })));
    setIsEditing(false);
  }

  function removePhoto(index) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  function handleAddPhoto() {
    if (photos.length >= MAX_PHOTOS) {
      showToast(`Maximum ${MAX_PHOTOS} foto's toegestaan.`, 'info');
      return;
    }
    Alert.alert('Foto toevoegen', 'Kies een bron', [
      {
        text: 'Camera',
        onPress: async () => {
          const assets = await pickFromCamera();
          if (assets.length) {
            setPhotos((prev) => {
              const remaining = MAX_PHOTOS - prev.length;
              return [...prev, ...assets.slice(0, remaining).map((a) => ({ uri: a.uri, isExisting: false }))];
            });
          }
        },
      },
      {
        text: 'Galerij',
        onPress: async () => {
          const assets = await pickFromGallery();
          if (assets.length) {
            setPhotos((prev) => {
              const remaining = MAX_PHOTOS - prev.length;
              return [...prev, ...assets.slice(0, remaining).map((a) => ({ uri: a.uri, isExisting: false }))];
            });
          }
        },
      },
      { text: 'Annuleren', style: 'cancel' },
    ]);
  }

  async function handleSaveEdit() {
    if (!description.trim()) {
      showToast('Vul een beschrijving in.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const newUrls = await Promise.all(
        photos
          .filter((p) => !p.isExisting)
          .map((p) => uploadChatImage(user.id, p.uri).then((r) => r.publicUrl)),
      );

      const finalUrls = [
        ...photos.filter((p) => p.isExisting).map((p) => p.uri),
        ...newUrls,
      ];

      await updateLogboekEntry(log.id, {
        description: description.trim(),
        fotos: finalUrls,
        logged_at: toLocalDateString(loggedDate),
      });

      const updated = await getLogboekEntry(log.id);
      setLog(updated);
      setDescription(updated.description ?? '');
      setLoggedDate(parseDateString(updated.logged_at));
      setPhotos((updated.fotos || []).map((url) => ({ uri: url, isExisting: true })));
      setIsEditing(false);
      onUpdated?.();
    } catch (err) {
      showToast(err.message || 'Opslaan mislukt. Probeer opnieuw.', 'error');
    } finally {
      setIsSaving(false);
    }
  }

  function handleDelete() {
    showConfirm({
      title: 'Log verwijderen?',
      message: 'Deze log wordt definitief verwijderd. Dit kan niet ongedaan gemaakt worden.',
      confirmLabel: 'Verwijderen',
      cancelLabel: 'Annuleren',
      onConfirm: async () => {
        setIsDeleting(true);
        try {
          await deleteLogboekEntry(log.id);
          onDeleted?.();
        } catch (err) {
          showToast(err.message || 'Verwijderen mislukt.', 'error');
          setIsDeleting(false);
        }
      },
    });
  }

  const photoGridItems = photos.map((p, i) => ({ id: p.uri || String(i), previewUri: p.uri }));

  if (isLoading || !log) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.brand} accessibilityLabel="Laden" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header
        title={isEditing ? 'Log bewerken' : 'Log'}
        onBack={isEditing ? handleCancelEdit : onBack}
        backLabel={isEditing ? 'Annuleren' : 'Terug'}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Datum */}
        <SectionCard>
          <SectionHeader icon={CalendarIcon} title="Datum" />
          {isEditing ? (
            <DateBlockSelector
              value={loggedDate}
              onChange={setLoggedDate}
              maximumDate={new Date()}
              accessibilityLabel="Datum van het log"
            />
          ) : (
            <Text style={styles.displayText}>{formatDisplayDate(loggedDate)}</Text>
          )}
        </SectionCard>

        {/* Beschrijving */}
        <SectionCard>
          <SectionHeader icon={NoteIcon} title="Beschrijving" />
          {isEditing ? (
            <>
              <View style={styles.fieldShell}>
                <TextInput
                  style={styles.textarea}
                  value={description}
                  onChangeText={(t) => { if (t.length <= MAX_DESCRIPTION) setDescription(t); }}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  placeholder="Beschrijving van je bezoek…"
                  placeholderTextColor={COLORS.textMuted}
                  accessibilityLabel="Beschrijving van het log"
                />
              </View>
              <Text style={[styles.charCounter, description.length >= MAX_DESCRIPTION && styles.charCounterLimit]}>
                {description.length}/{MAX_DESCRIPTION}
              </Text>
            </>
          ) : (
            <Text style={styles.displayText}>
              {log.description || 'Geen beschrijving'}
            </Text>
          )}
        </SectionCard>

        {/* Foto's */}
        {(photos.length > 0 || isEditing) && (
          <SectionCard>
            <SectionHeader icon={CameraIcon} title="Foto's" />
            {isEditing ? (
              <PhotoGrid
                photos={photoGridItems}
                onAdd={handleAddPhoto}
                onRemove={removePhoto}
              />
            ) : (
              <View style={styles.photoViewGrid}>
                {photos.map((photo, index) => (
                  <Pressable
                    key={`${photo.uri}-${index}`}
                    onPress={() => setPreviewIndex(index)}
                    style={({ pressed }) => [styles.photoViewCell, pressed && { opacity: 0.85 }]}
                    accessibilityRole="button"
                    accessibilityLabel={`Foto ${index + 1} bekijken`}
                  >
                    <Image source={{ uri: photo.uri }} style={styles.photoViewThumb} />
                  </Pressable>
                ))}
              </View>
            )}
          </SectionCard>
        )}

      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, SPACING.md) }]}>
        {isEditing ? (
          <AuthButton
            label="Wijzigingen opslaan"
            onPress={handleSaveEdit}
            loading={isSaving}
            disabled={isSaving}
            accessibilityLabel="Wijzigingen opslaan"
          />
        ) : (
          <View style={styles.actionButtons}>
            <AuthButton
              label="Bewerken"
              variant="primary"
              icon={PencilSimpleIcon}
              onPress={() => setIsEditing(true)}
              accessibilityLabel="Log bewerken"
            />
            <AuthButton
              label="Verwijderen"
              variant="secondaryDanger"
              icon={TrashIcon}
              onPress={handleDelete}
              loading={isDeleting}
              disabled={isDeleting}
              accessibilityLabel="Log verwijderen"
            />
          </View>
        )}
      </View>

      {/* Volledig scherm fotogalerij */}
      {previewIndex !== null && (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={() => setPreviewIndex(null)}
        >
          <View style={styles.previewOverlay}>
            <View style={[styles.previewHeader, { paddingTop: Math.max(insets.top, SPACING.md) }]}>
              <Pressable
                style={styles.previewCloseBtn}
                onPress={() => setPreviewIndex(null)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Sluiten"
              >
                <XIcon size={20} color={COLORS.textInverse} weight="bold" />
              </Pressable>
              {photos.length > 1 && (
                <Text style={styles.previewCounter}>
                  {previewIndex + 1} / {photos.length}
                </Text>
              )}
              <View style={styles.previewHeaderSpacer} />
            </View>

            <FlatList
              horizontal
              pagingEnabled
              initialScrollIndex={previewIndex}
              data={photos}
              keyExtractor={(_, i) => String(i)}
              renderItem={({ item }) => (
                <View style={styles.previewImageWrap}>
                  <Image source={{ uri: item.uri }} style={styles.previewImage} resizeMode="contain" />
                </View>
              )}
              getItemLayout={(_, index) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index })}
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                setPreviewIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH));
              }}
            />
          </View>
        </Modal>
      )}
    </KeyboardAvoidingView>
  );
}

const PHOTO_VIEW_SIZE = Math.floor(
  (SCREEN_WIDTH - SPACING.screenX * 2 - SPACING.md * 2 - SPACING.sm) / 2,
);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.screenX,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    gap: SPACING.md,
  },
  footer: {
    paddingHorizontal: SPACING.screenX,
    paddingTop: SPACING.md,
    backgroundColor: COLORS.background,
  },
  displayText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
    lineHeight: 24,
  },
  fieldShell: {
    borderRadius: RADIUS.xs,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  textarea: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
    minHeight: 140,
    lineHeight: 22,
  },
  charCounter: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    textAlign: 'right',
    marginTop: SPACING.xs,
  },
  charCounterLimit: {
    color: COLORS.negative,
  },
  photoViewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  photoViewCell: {
    width: PHOTO_VIEW_SIZE,
    height: PHOTO_VIEW_SIZE,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  },
  photoViewThumb: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  actionButtons: {
    gap: SPACING.sm,
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
    paddingBottom: SPACING.sm,
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
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.md,
    color: COLORS.textInverse,
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
});
