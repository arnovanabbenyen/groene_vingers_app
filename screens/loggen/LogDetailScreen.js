import { useEffect, useState } from 'react';
import {
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeftIcon,
  CalendarIcon,
  CameraIcon,
  CheckIcon,
  ImagesIcon,
  PencilSimpleIcon,
  TrashIcon,
  XCircleIcon,
  XIcon,
} from 'phosphor-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../../services/supabase';
import { pickFromCamera, pickFromGallery, uploadChatImage } from '../../services/messageMedia';
import { deleteLogboekEntry, getLogboekEntry, updateLogboekEntry } from '../../services/logboek';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SHADOWS, SPACING } from '../../components/theme/tokens';

const SCREEN_WIDTH = Dimensions.get('window').width;
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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [photos, setPhotos] = useState([]);

  const [previewIndex, setPreviewIndex] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const data = await getLogboekEntry(logId);
        if (!mounted) return;
        if (!data) {
          Alert.alert('Niet gevonden', 'Deze log bestaat niet meer.');
          onBack?.();
          return;
        }
        setLog(data);
        setDescription(data.description ?? '');
        setLoggedDate(parseDateString(data.logged_at));
        setPhotos((data.fotos || []).map((url) => ({ uri: url, isExisting: true })));
      } catch (err) {
        if (mounted) {
          Alert.alert('Fout', 'Log kon niet geladen worden.');
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
    setShowDatePicker(false);
  }

  function removePhoto(index) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function handlePickCamera() {
    const assets = await pickFromCamera();
    if (assets.length) {
      setPhotos((prev) => [
        ...prev,
        ...assets.map((a) => ({ uri: a.uri, isExisting: false })),
      ]);
    }
  }

  async function handlePickGallery() {
    const assets = await pickFromGallery();
    if (assets.length) {
      setPhotos((prev) => [
        ...prev,
        ...assets.map((a) => ({ uri: a.uri, isExisting: false })),
      ]);
    }
  }

  async function handleSaveEdit() {
    if (!description.trim()) {
      Alert.alert('Beschrijving ontbreekt', 'Vul een beschrijving in.');
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
      setShowDatePicker(false);
      onUpdated?.();
    } catch (err) {
      Alert.alert('Opslaan mislukt', err.message || 'Probeer opnieuw.');
    } finally {
      setIsSaving(false);
    }
  }

  function handleDelete() {
    Alert.alert(
      'Log verwijderen?',
      'Deze log wordt definitief verwijderd. Dit kan niet ongedaan gemaakt worden.',
      [
        { text: 'Annuleren', style: 'cancel' },
        {
          text: 'Verwijderen',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteLogboekEntry(log.id);
              onDeleted?.();
            } catch (err) {
              Alert.alert('Verwijderen mislukt', err.message || 'Probeer opnieuw.');
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  }

  if (isLoading || !log) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Laden…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.headerRow}>
          <Pressable
            style={styles.headerLeft}
            onPress={isEditing ? handleCancelEdit : onBack}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={isEditing ? 'Annuleren' : 'Terug'}
          >
            {isEditing
              ? <XIcon size={20} color={COLORS.textInverse} weight="regular" />
              : <ArrowLeftIcon size={20} color={COLORS.textInverse} weight="regular" />}
            <Text style={styles.headerSideText}>
              {isEditing ? 'Annuleren' : 'Terug'}
            </Text>
          </Pressable>

          <Text style={styles.headerTitle} numberOfLines={1}>
            {isEditing ? 'Log bewerken' : 'Log'}
          </Text>

          {isEditing ? (
            <Pressable
              style={[styles.headerRight, isSaving && styles.headerActionDisabled]}
              onPress={handleSaveEdit}
              disabled={isSaving}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Opslaan"
            >
              <CheckIcon size={20} color={COLORS.textInverse} weight="bold" />
              <Text style={styles.headerSideText}>
                {isSaving ? 'Bezig…' : 'Opslaan'}
              </Text>
            </Pressable>
          ) : (
            <View style={styles.headerRight} />
          )}
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Datum */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <CalendarIcon size={20} color={COLORS.brand} weight="regular" />
            <Text style={styles.sectionTitle}>Datum</Text>
          </View>

          {isEditing ? (
            <>
              <Pressable
                style={styles.dateButton}
                onPress={() => setShowDatePicker((v) => !v)}
                accessibilityRole="button"
              >
                <Text style={styles.dateButtonText}>{formatDisplayDate(loggedDate)}</Text>
                <CalendarIcon size={16} color={COLORS.textSecondary} weight="regular" />
              </Pressable>

              {showDatePicker && (
                <>
                  <DateTimePicker
                    value={loggedDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    maximumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      if (Platform.OS === 'android') setShowDatePicker(false);
                      if (selectedDate) setLoggedDate(selectedDate);
                    }}
                  />
                  {Platform.OS === 'ios' && (
                    <Pressable
                      style={styles.dateConfirm}
                      onPress={() => setShowDatePicker(false)}
                      accessibilityRole="button"
                    >
                      <Text style={styles.dateConfirmText}>Klaar</Text>
                    </Pressable>
                  )}
                </>
              )}
            </>
          ) : (
            <Text style={styles.dateDisplay}>{formatDisplayDate(loggedDate)}</Text>
          )}
        </View>

        {/* Beschrijving */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Beschrijving</Text>
            {isEditing && (
              <Text style={[
                styles.charCounter,
                description.length >= MAX_DESCRIPTION && styles.charCounterLimit,
              ]}>
                {description.length}/{MAX_DESCRIPTION}
              </Text>
            )}
          </View>

          {isEditing ? (
            <TextInput
              style={styles.textarea}
              value={description}
              onChangeText={(t) => {
                if (t.length <= MAX_DESCRIPTION) setDescription(t);
              }}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              placeholder="Beschrijving van je bezoek…"
              placeholderTextColor={COLORS.textMuted}
              accessibilityLabel="Beschrijving"
            />
          ) : (
            <Text style={styles.descriptionText}>
              {log.description || 'Geen beschrijving'}
            </Text>
          )}
        </View>

        {/* Foto's */}
        {(photos.length > 0 || isEditing) && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <CameraIcon size={20} color={COLORS.brand} weight="regular" />
              <Text style={styles.sectionTitle}>Foto's</Text>
            </View>

            {photos.length > 0 && (
              <View style={styles.photoGrid}>
                {photos.map((photo, index) => (
                  <View key={`${photo.uri}-${index}`} style={styles.photoCell}>
                    <Pressable
                      onPress={() => {
                        if (!isEditing) setPreviewIndex(index);
                      }}
                      style={styles.photoFrame}
                    >
                      <Image source={{ uri: photo.uri }} style={styles.photoThumb} />
                    </Pressable>
                    {isEditing && (
                      <Pressable
                        style={styles.photoRemove}
                        onPress={() => removePhoto(index)}
                        hitSlop={4}
                        accessibilityRole="button"
                        accessibilityLabel="Foto verwijderen"
                      >
                        <XCircleIcon size={22} color={COLORS.negative} weight="fill" />
                      </Pressable>
                    )}
                  </View>
                ))}
              </View>
            )}

            {isEditing && (
              <View style={styles.photoActions}>
                <Pressable
                  style={styles.photoActionBtn}
                  onPress={handlePickCamera}
                  accessibilityRole="button"
                >
                  <CameraIcon size={18} color={COLORS.brand} weight="regular" />
                  <Text style={styles.photoActionText}>Camera</Text>
                </Pressable>
                <Pressable
                  style={styles.photoActionBtn}
                  onPress={handlePickGallery}
                  accessibilityRole="button"
                >
                  <ImagesIcon size={18} color={COLORS.brand} weight="regular" />
                  <Text style={styles.photoActionText}>Galerij</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}

        {/* View mode actions */}
        {!isEditing && (
          <View style={styles.actionButtons}>
            <Pressable
              style={styles.editButton}
              onPress={() => setIsEditing(true)}
              accessibilityRole="button"
            >
              <PencilSimpleIcon size={18} color={COLORS.brand} weight="regular" />
              <Text style={styles.editButtonText}>Bewerken</Text>
            </Pressable>

            <Pressable
              style={[styles.deleteButton, isDeleting && styles.buttonDisabled]}
              onPress={handleDelete}
              disabled={isDeleting}
              accessibilityRole="button"
            >
              <TrashIcon size={18} color={COLORS.negative} weight="regular" />
              <Text style={styles.deleteButtonText}>
                {isDeleting ? 'Verwijderen…' : 'Verwijderen'}
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Full-screen gallery */}
      {previewIndex !== null && (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={() => setPreviewIndex(null)}
        >
          <View style={styles.previewOverlay}>
            <View style={[styles.previewHeader, { paddingTop: Math.max(insets.top, 16) }]}>
              <Pressable
                style={styles.previewCloseBtn}
                onPress={() => setPreviewIndex(null)}
                hitSlop={8}
              >
                <XIcon size={20} color="#FFFFFF" weight="bold" />
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
                  <Image
                    source={{ uri: item.uri }}
                    style={styles.previewImage}
                    resizeMode="contain"
                  />
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
          </View>
        </Modal>
      )}
    </KeyboardAvoidingView>
  );
}

const PHOTO_CELL_SIZE = Math.floor((SCREEN_WIDTH - SPACING.screenX * 2 - SPACING.md * 2 - 16) / 3);

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
  loadingText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },

  // Header
  headerSafe: {
    backgroundColor: COLORS.brand,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.screenX,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    minHeight: 52,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 88,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    minWidth: 88,
  },
  headerSideText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.md,
    color: COLORS.textInverse,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.xl,
    color: COLORS.textInverse,
  },
  headerActionDisabled: {
    opacity: 0.5,
  },

  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.screenX,
    paddingTop: SPACING.lg,
    paddingBottom: 40,
    gap: SPACING.md,
  },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    ...SHADOWS.card,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
  },

  // Date
  dateDisplay: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(87,98,56,0.05)',
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 10,
  },
  dateButtonText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
  },
  dateConfirm: {
    alignSelf: 'flex-end',
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.sm,
  },
  dateConfirmText: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.textInverse,
  },

  // Description
  descriptionText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
    lineHeight: 24,
  },
  textarea: {
    backgroundColor: 'rgba(87,98,56,0.05)',
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
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
  },
  charCounterLimit: {
    color: COLORS.negative,
  },

  // Photos
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: SPACING.sm,
  },
  photoCell: {
    width: PHOTO_CELL_SIZE,
    height: PHOTO_CELL_SIZE,
    position: 'relative',
  },
  photoFrame: {
    width: '100%',
    height: '100%',
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  },
  photoThumb: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoRemove: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    zIndex: 2,
  },
  photoActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  photoActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.brand,
    backgroundColor: 'rgba(87,98,56,0.04)',
  },
  photoActionText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.brand,
  },

  // Action buttons (view mode)
  actionButtons: {
    gap: SPACING.sm,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: 14,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    borderColor: COLORS.brand,
    backgroundColor: COLORS.surface,
  },
  editButtonText: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.brand,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: 14,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    borderColor: COLORS.negative,
    backgroundColor: COLORS.surface,
  },
  deleteButtonText: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.negative,
  },
  buttonDisabled: {
    opacity: 0.5,
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
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
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
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.md,
    color: '#FFFFFF',
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
