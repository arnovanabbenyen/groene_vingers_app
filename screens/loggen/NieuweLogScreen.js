import { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarIcon, CameraIcon, LeafIcon, XCircleIcon } from 'phosphor-react-native';
import Header from '../../components/navigation/Header';
import AuthButton from '../../components/buttons/AuthButton';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SHADOWS, SPACING } from '../../components/theme/tokens';
import { supabase } from '../../services/supabase';
import { uploadChatImage } from '../../services/messageMedia';

const MAX_DESCRIPTION = 2000;

function toLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(date) {
  return date.toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function NieuweLogScreen({ onBack, samenwerking, onSaved }) {
  const insets = useSafeAreaInsets();
  const [beschrijving, setBeschrijving] = useState('');
  const [loggedDate, setLoggedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const perceelNaam = samenwerking?.percelen?.naam ?? 'Jouw perceel';
  const canSubmit = beschrijving.trim().length > 0;

  function removePhoto(id) {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }

  async function pickFromCamera() {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Geen toegang', 'Camera-toegang is nodig om een foto te maken.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled || !result.assets?.[0]?.uri) return;

      const asset = result.assets[0];
      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        asset.width && asset.width > 1920 ? [{ resize: { width: 1920 } }] : [],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
      );

      const id = `photo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setPhotos((prev) => [...prev, { id, localUri: manipulated.uri }]);
    } catch (err) {
      Alert.alert('Fout', err.message || 'Foto nemen mislukt.');
    }
  }

  async function pickFromGallery() {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Geen toegang', 'Fotobibliotheek-toegang is nodig.');
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

      const newPhotos = [];
      for (const asset of result.assets) {
        const manipulated = await ImageManipulator.manipulateAsync(
          asset.uri,
          asset.width && asset.width > 1920 ? [{ resize: { width: 1920 } }] : [],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
        );
        const id = `photo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        newPhotos.push({ id, localUri: manipulated.uri });
      }

      setPhotos((prev) => [...prev, ...newPhotos]);
    } catch (err) {
      Alert.alert('Fout', err.message || "Foto's kiezen mislukt.");
    }
  }

  function promptAddPhoto() {
    Alert.alert("Foto toevoegen", 'Kies hoe je een foto wilt toevoegen.', [
      { text: 'Foto nemen', onPress: pickFromCamera },
      { text: 'Kies uit galerij', onPress: pickFromGallery },
      { text: 'Annuleer', style: 'cancel' },
    ]);
  }

  async function handleSubmit() {
    if (!canSubmit) return;

    if (!supabase) {
      setSubmitError('Supabase is niet geconfigureerd.');
      return;
    }

    setIsSaving(true);
    setSubmitError('');

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

      onSaved?.();
    } catch (err) {
      setSubmitError(err.message || 'Opslaan mislukt.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header title="Nieuwe log" onBack={onBack} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Context */}
        <View style={styles.card}>
          <View style={styles.contextRow}>
            <LeafIcon size={18} color={COLORS.brand} weight="regular" />
            <Text style={styles.contextLabel}>Perceel</Text>
          </View>
          <Text style={styles.perceelName}>{perceelNaam}</Text>
        </View>

        {/* Datum */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <CalendarIcon size={22} color={COLORS.brand} weight="regular" />
            <Text style={styles.sectionTitle}>Datum bezoek</Text>
          </View>
          <Pressable
            style={styles.dateButton}
            onPress={() => setShowDatePicker((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel="Kies datum"
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
        </View>

        {/* Beschrijving */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Beschrijving</Text>
            <Text style={[styles.charCounter, beschrijving.length >= MAX_DESCRIPTION && styles.charCounterLimit]}>
              {beschrijving.length}/{MAX_DESCRIPTION}
            </Text>
          </View>
          <TextInput
            style={styles.textarea}
            value={beschrijving}
            onChangeText={(t) => {
              if (t.length <= MAX_DESCRIPTION) setBeschrijving(t);
            }}
            placeholder="Wat heb je vandaag gedaan op je perceel?"
            placeholderTextColor={COLORS.textMuted}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            accessibilityLabel="Beschrijving van je bezoek"
          />
        </View>

        {/* Foto's */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <CameraIcon size={22} color={COLORS.brand} weight="regular" />
            <Text style={styles.sectionTitle}>Foto's</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.photoStrip}
          >
            {photos.map((photo) => (
              <View key={photo.id} style={styles.photoThumbWrap}>
                <Image source={{ uri: photo.localUri }} style={styles.photoThumb} />
                <Pressable
                  style={styles.photoRemove}
                  onPress={() => removePhoto(photo.id)}
                  accessibilityRole="button"
                  accessibilityLabel="Foto verwijderen"
                  hitSlop={4}
                >
                  <XCircleIcon size={22} color={COLORS.negative} weight="fill" />
                </Pressable>
              </View>
            ))}
            <Pressable
              style={styles.photoAddButton}
              onPress={promptAddPhoto}
              accessibilityRole="button"
              accessibilityLabel="Foto toevoegen"
            >
              <CameraIcon size={24} color={COLORS.textSecondary} weight="regular" />
              <Text style={styles.photoAddText}>Toevoegen</Text>
            </Pressable>
          </ScrollView>
        </View>

        {submitError ? (
          <Text style={styles.errorText}>{submitError}</Text>
        ) : null}
      </ScrollView>

      <View style={[styles.submitBar, { paddingBottom: Math.max(insets.bottom, SPACING.md) }]}>
        <AuthButton
          label="Log opslaan"
          onPress={handleSubmit}
          loading={isSaving}
          disabled={!canSubmit}
        />
      </View>
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
    paddingBottom: 24,
    gap: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    ...SHADOWS.card,
  },
  contextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: 4,
  },
  contextLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.brand,
  },
  perceelName: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
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
  charCounter: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  charCounterLimit: {
    color: COLORS.negative,
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
  photoStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: 4,
  },
  photoThumbWrap: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.sm,
    position: 'relative',
  },
  photoThumb: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.sm,
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
  photoAddButton: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.dividerSoft,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(87,98,56,0.03)',
  },
  photoAddText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  errorText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.negative,
    textAlign: 'center',
  },
  submitBar: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.screenX,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.dividerSoft,
  },
});
