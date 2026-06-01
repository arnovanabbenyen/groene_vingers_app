import { useRef, useState } from 'react';
import {
  Alert,
  Animated,
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
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CalendarCheckIcon, CameraIcon, LeafIcon, BinocularsIcon, XIcon, PlusIcon, CheckSquareIcon, CalendarIcon, CaretDownIcon } from 'phosphor-react-native';
import Header from '../../components/navigation/Header';
import AuthButton from '../../components/buttons/AuthButton';
import SectionCard from '../../components/parcel/SectionCard';
import SectionHeader from '../../components/parcel/SectionHeader';
import DateBlockSelector from '../../components/aanvraag/DateBlockSelector';
import PhotoGrid from '../../components/parcel/PhotoGrid';
import { showToast } from '../../components/common/Toast';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SPACING } from '../../components/theme/tokens';
import { supabase } from '../../services/supabase';
import { uploadChatImage } from '../../services/messageMedia';
import { createOpvolging } from '../../services/opvolgingen';

const MAX_DESCRIPTION = 2000;
const MAX_OPVOLGING_TITLE = 120;
const INPUT_BG = 'rgba(87,98,56,0.06)';

function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d;
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

export default function NieuweLogScreen({ onBack, samenwerking, onSaved, hideHeader = false }) {
  const [beschrijving, setBeschrijving] = useState('');
  const [loggedDate, setLoggedDate] = useState(new Date());
  const [photos, setPhotos] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [opvolgingen, setOpvolgingen] = useState([]);
  const [openDatePickerId, setOpenDatePickerId] = useState(null);
  const insets = useSafeAreaInsets();
  const sheetAnim = useRef(new Animated.Value(300)).current;

  const activeOpvolging = opvolgingen.find((o) => o.id === openDatePickerId) ?? null;

  function openDatePicker(id) {
    sheetAnim.setValue(300);
    setOpenDatePickerId(id);
    Animated.spring(sheetAnim, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 200 }).start();
  }

  function closeDatePicker() {
    Animated.timing(sheetAnim, { toValue: 300, duration: 200, useNativeDriver: true }).start(() =>
      setOpenDatePickerId(null),
    );
  }

  const perceelNaam = samenwerking?.percelen?.naam ?? 'Jouw perceel';
  const canSubmit = beschrijving.trim().length > 0;

  function removePhoto(id) {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }

  function setPhotoAtIndex(index, newPhoto) {
    setPhotos((prev) => {
      const next = prev.slice(0, 4);
      next[index] = newPhoto;
      return next;
    });
  }

  function addPhotoToFirstEmptySlot(newPhoto) {
    setPhotos((prev) => {
      const next = prev.slice(0, 4);
      const emptyIndex = next.findIndex((item) => !item);
      if (emptyIndex === -1) return next;
      next[emptyIndex] = newPhoto;
      return next;
    });
  }

  async function addGalleryAssetsToSlots(assets, startIndex = 0) {
    const processedPhotos = [];
    for (const asset of assets.slice(0, 4 - startIndex)) {
      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        asset.width && asset.width > 1920 ? [{ resize: { width: 1920 } }] : [],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
      );
      const id = `photo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      processedPhotos.push({ id, localUri: manipulated.uri });
    }

    setPhotos((prev) => {
      const next = prev.slice(0, 4);
      let slotIndex = startIndex;

      for (const photo of processedPhotos) {
        while (slotIndex < 4 && next[slotIndex]) slotIndex += 1;
        if (slotIndex >= 4) break;
        next[slotIndex] = photo;
        slotIndex += 1;
      }

      return next;
    });
  }

  async function pickFromCamera(index) {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      showToast('Camera-toegang is nodig om een foto te maken.', 'error');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;

    try {
      const asset = result.assets[0];
      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        asset.width && asset.width > 1920 ? [{ resize: { width: 1920 } }] : [],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
      );
      const id = `photo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const nextPhoto = { id, localUri: manipulated.uri };
      if (typeof index === 'number') {
        setPhotoAtIndex(index, nextPhoto);
      } else {
        addPhotoToFirstEmptySlot(nextPhoto);
      }
    } catch (err) {
      showToast(err.message || 'Foto nemen mislukt.', 'error');
    }
  }

  async function pickFromGallery(index) {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showToast('Fotobibliotheek-toegang is nodig.', 'error');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
      allowsMultipleSelection: true,
      selectionLimit: 5,
    });

    if (result.canceled || !result.assets?.length) return;

    try {
      const startIndex = typeof index === 'number' ? index : 0;
      await addGalleryAssetsToSlots(result.assets, startIndex);
    } catch (err) {
      showToast(err.message || "Foto's kiezen mislukt.", 'error');
    }
  }

  function addOpvolging() {
    const id = `opv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setOpvolgingen((prev) => [...prev, { id, title: '', dueDate: tomorrow() }]);
  }

  function removeOpvolging(id) {
    setOpvolgingen((prev) => prev.filter((o) => o.id !== id));
    if (openDatePickerId === id) closeDatePicker();
  }

  function updateOpvolgingTitle(id, title) {
    setOpvolgingen((prev) => prev.map((o) => (o.id === id ? { ...o, title } : o)));
  }

  function updateOpvolgingDueDate(id, date) {
    setOpvolgingen((prev) => prev.map((o) => (o.id === id ? { ...o, dueDate: date } : o)));
  }

  function promptForPhoto(index) {
    Alert.alert('Foto toevoegen', 'Kies hoe je een foto wilt toevoegen.', [
      { text: 'Foto nemen', onPress: () => pickFromCamera(index) },
      { text: 'Kies uit galerij', onPress: () => pickFromGallery(index) },
      { text: 'Annuleer', style: 'cancel' },
    ]);
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    if (!supabase) {
      showToast('Supabase is niet geconfigureerd.', 'error');
      return;
    }

    setIsSaving(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) throw new Error('Je bent niet ingelogd.');

      const aanvraagId = samenwerking?.id;
      if (!aanvraagId) throw new Error('Geen actieve samenwerking gevonden.');

      const uploadedUrls = [];
      for (const photo of photos) {
        const { publicUrl } = await uploadChatImage(userId, photo.localUri);
        if (publicUrl) uploadedUrls.push(publicUrl);
      }

      const { error: insertError } = await supabase.from('logboek_entries').insert({
        aanvraag_id: aanvraagId,
        author_id: userId,
        description: beschrijving.trim(),
        fotos: uploadedUrls,
        logged_at: toLocalDateString(loggedDate),
      });

      if (insertError) throw insertError;

      const validOpvolgingen = opvolgingen.filter((o) => o.title.trim().length > 0);
      for (const opvolging of validOpvolgingen) {
        await createOpvolging(aanvraagId, userId, {
          title: opvolging.title.trim(),
          description: null,
          due_date: toLocalDateString(opvolging.dueDate),
        });
      }

      onSaved?.();
    } catch (err) {
      showToast(err.message || 'Opslaan mislukt.', 'error');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {!hideHeader && <Header title="Nieuwe log" onBack={onBack} />}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Context */}
        <SectionCard>
          <SectionHeader icon={LeafIcon} title="Perceel" />
          <Text style={styles.perceelName}>{perceelNaam}</Text>
        </SectionCard>

        {/* Datum */}
        <SectionCard>
          <SectionHeader icon={CalendarCheckIcon} title="Datum bezoek" />
          <DateBlockSelector
            value={loggedDate}
            onChange={setLoggedDate}
            maximumDate={new Date()}
            accessibilityLabel="Datum bezoek"
          />
        </SectionCard>

        {/* Beschrijving */}
        <SectionCard>
          <SectionHeader
            icon={BinocularsIcon}
            title="Beschrijving"
            action={
              <Text
                style={[styles.charCounter, beschrijving.length >= MAX_DESCRIPTION && styles.charCounterLimit]}
              >
                {beschrijving.length}/{MAX_DESCRIPTION}
              </Text>
            }
          />
          <View style={styles.descriptionShell}>
            <TextInput
              style={styles.textarea}
              value={beschrijving}
              onChangeText={(t) => { if (t.length <= MAX_DESCRIPTION) setBeschrijving(t); }}
              placeholder="Wat heb je vandaag gedaan op je perceel?"
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              accessibilityLabel="Beschrijving van je bezoek"
            />
          </View>
        </SectionCard>

        {/* Foto's */}
        <SectionCard>
          <SectionHeader icon={CameraIcon} title="Foto's" />
          <PhotoGrid
            photos={photos.map((photo) => ({
              ...photo,
              previewUri: photo.localUri,
            }))}
            onAdd={promptForPhoto}
            onRemove={(index) => removePhoto(photos[index]?.id)}
          />
        </SectionCard>

        {/* Opvolgingen */}
        <SectionCard>
          <SectionHeader
            icon={CheckSquareIcon}
            title="Opvolgingen"
            action={<Text style={styles.optionalLabel}>optioneel</Text>}
          />

          {opvolgingen.map((item) => (
            <View key={item.id} style={styles.opvolgingItem}>
              <View style={styles.opvolgingTitleRow}>
                <TextInput
                  style={styles.opvolgingInput}
                  value={item.title}
                  onChangeText={(t) => {
                    if (t.length <= MAX_OPVOLGING_TITLE) updateOpvolgingTitle(item.id, t);
                  }}
                  placeholder="Bijv. Onkruid verwijderen"
                  placeholderTextColor={COLORS.textMuted}
                  returnKeyType="done"
                />
                <Pressable onPress={() => removeOpvolging(item.id)} hitSlop={8} accessibilityRole="button">
                  <XIcon size={18} color={COLORS.negative} />
                </Pressable>
              </View>

              <Pressable
                style={styles.opvolgingDateBtn}
                onPress={() => openDatePicker(item.id)}
                accessibilityRole="button"
                accessibilityLabel="Deadline kiezen"
              >
                <CalendarIcon size={16} color={COLORS.brand} weight="bold" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.opvolgingDateLabel}>Deadline</Text>
                  <Text style={styles.opvolgingDateText}>{formatDisplayDate(item.dueDate)}</Text>
                </View>
                <CaretDownIcon size={14} color={COLORS.brand} weight="bold" />
              </Pressable>
            </View>
          ))}

          <Pressable style={styles.addOpvolgingBtn} onPress={addOpvolging} accessibilityRole="button">
            <PlusIcon size={16} color={COLORS.brand} />
            <Text style={styles.addOpvolgingText}>Opvolging toevoegen</Text>
          </Pressable>
        </SectionCard>

        <AuthButton
          label="Log opslaan"
          onPress={handleSubmit}
          loading={isSaving}
          disabled={!canSubmit}
        />
      </ScrollView>

      {/* Deadline bottom sheet */}
      <Modal visible={!!openDatePickerId} transparent animationType="none" onRequestClose={closeDatePicker}>
        <Pressable style={styles.sheetBackdrop} onPress={closeDatePicker} accessibilityLabel="Sluit datumkiezer" />
        <Animated.View
          style={[styles.sheet, { paddingBottom: insets.bottom + SPACING.md, transform: [{ translateY: sheetAnim }] }]}
        >
          <View style={styles.sheetHandle} accessibilityElementsHidden />
          {activeOpvolging && (
            <DateTimePicker
              value={activeOpvolging.dueDate}
              mode="date"
              display="spinner"
              minimumDate={new Date()}
              locale="nl-BE"
              onChange={(_, selected) => { if (selected) updateOpvolgingDueDate(activeOpvolging.id, selected); }}
            />
          )}
          <View style={styles.sheetDoneWrap}>
            <Pressable style={styles.sheetDoneBtn} onPress={closeDatePicker} accessibilityRole="button" accessibilityLabel="Datum bevestigen">
              <Text style={styles.sheetDoneBtnText}>Klaar</Text>
            </Pressable>
          </View>
        </Animated.View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.screenX,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
    gap: SPACING.lg,
  },
  perceelName: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: INPUT_BG,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm + 2,
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
  charCounter: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  charCounterLimit: {
    color: COLORS.negative,
  },
  textarea: {
    backgroundColor: COLORS.surface,
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
    minHeight: 140,
    lineHeight: 22,
  },
  descriptionShell: {
    borderRadius: RADIUS.xs,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  optionalLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  opvolgingItem: {
    gap: SPACING.xs,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.dividerSoft,
    marginTop: SPACING.xs,
  },
  opvolgingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  opvolgingInput: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    backgroundColor: INPUT_BG,
    borderRadius: RADIUS.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs + 2,
  },
  opvolgingDateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceBrand,
    borderWidth: 1,
    borderColor: COLORS.brandOverlayStroke,
  },
  opvolgingDateLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.brand,
    opacity: 0.7,
  },
  opvolgingDateText: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.brand,
    textTransform: 'capitalize',
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    paddingTop: SPACING.sm,
    paddingHorizontal: SPACING.screenX,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.indicatorMuted,
    alignSelf: 'center',
    marginBottom: SPACING.sm,
  },
  sheetDoneWrap: {
    paddingTop: SPACING.md,
  },
  sheetDoneBtn: {
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  sheetDoneBtnText: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.textInverse,
  },
  addOpvolgingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
    paddingVertical: SPACING.xs,
    alignSelf: 'flex-start',
  },
  addOpvolgingText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.brand,
  },
});
