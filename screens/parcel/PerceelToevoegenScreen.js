import React, { useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../../components/theme/tokens';
import AuthButton from '../../components/buttons/AuthButton';
import AuthTextArea from '../../components/auth/AuthTextArea';
import AuthTextField from '../../components/auth/AuthTextField';
import FieldError from '../../components/notifications/FieldError';
import ScreenHeader from '../../components/headers/ScreenHeader';
import { supabase } from '../../services/supabase';

const IMG_NAME = 'http://localhost:3845/assets/2422f9647122cae6826d11ffbc68897a6ace853b.svg';
const IMG_PHOTOS = 'http://localhost:3845/assets/e29a99922ff13b29ecc9237b089b72cd33ec56c1.svg';
const IMG_DESCRIPTION = 'http://localhost:3845/assets/c22d2bb0423ebd02d9ca24f2984ddd36b5d104e3.svg';
const IMG_AMENITIES = 'http://localhost:3845/assets/55b0d5050ea94d4478f0d4a274cea6ce992889fe.svg';
const IMG_AMENITIES_ADD = 'http://localhost:3845/assets/768b60194f299d8a06eaad029408ee8deabd0667.svg';
const IMG_EXTRA = 'http://localhost:3845/assets/c19ef960ca56d7452eb9cb554c6e1f0878f222fc.svg';
const IMG_ARROW_LEFT = 'http://localhost:3845/assets/823f067bbf1763ad90d2dac8f9d3bad9ec4cf79f.svg';
const IMG_SAMPLE_PHOTO = 'http://localhost:3845/assets/857199f83e6ee66097c2acbb287412099fc7b745.png';
const IMG_PHOTO_REMOVE = 'http://localhost:3845/assets/08e59dfaafacb1cc679c9adbfca7fa56f6f8e5f6.svg';
const IMG_EMPTY_PLUS = 'http://localhost:3845/assets/8cf5c500f73c04c90540fb5d290d8a5ae12a9977.svg';
const IMG_EMPTY_PLUS_ALT = 'http://localhost:3845/assets/c1866c4d3876072edd205eee3481f749f25757b4.svg';
const IMG_WATER = 'http://localhost:3845/assets/063801bb394747a450dc2eb31a860de553e409c7.svg';
const IMG_MATERIAAL = 'http://localhost:3845/assets/2f5dfb33af36eac04d4c671a125c2b9a8715ed88.svg';
const IMG_ZADEN = 'http://localhost:3845/assets/4eca3e172c3c8d9b87324a1cdd847cb1b1af0ada.svg';
const IMG_EXTRA_BULLET = 'http://localhost:3845/assets/db775ac6fdc7f1baf0dcdeb5e9eba827734a3827.svg';
const IMG_ROW_REMOVE = 'http://localhost:3845/assets/4c6187f5874a7cc596bcee028d8ed521433957b7.svg';

const AMENITY_OPTIONS = [
  { label: 'Water', icon: IMG_WATER },
  { label: 'Materiaal', icon: IMG_MATERIAAL },
  { label: 'Zaden', icon: IMG_ZADEN },
  { label: 'Compost', icon: IMG_WATER },
  { label: 'Gereedschap', icon: IMG_MATERIAAL },
  { label: 'Schaduw', icon: IMG_ZADEN },
];

const PLACEHOLDER_PHOTO = {
  id: 'placeholder-photo',
  previewUri: IMG_SAMPLE_PHOTO,
  localUri: null,
  isPlaceholder: true,
};

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createPhoto(previewUri, localUri) {
  return {
    id: uid('photo'),
    previewUri,
    localUri,
    isPlaceholder: false,
  };
}

function parseGrootte(extraInfoItems) {
  const item = extraInfoItems.find((entry) => entry.toLowerCase().startsWith('grootte:'));
  return item ? item.split(':').slice(1).join(':').trim() : '';
}

function normalizeExtraInfo(input) {
  const trimmed = input.trim();
  if (!trimmed) return null;
  return trimmed;
}

export default function PerceelToevoegenScreen({ onBack, onSaved = () => {} }) {
  const [naam, setNaam] = useState('');
  const [beschrijving, setBeschrijving] = useState('');
  const [extraInfoDraft, setExtraInfoDraft] = useState('');
  const [extraInfoItems, setExtraInfoItems] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState(['Water', 'Materiaal', 'Zaden']);
  const [photos, setPhotos] = useState([PLACEHOLDER_PHOTO]);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isAmenityModalVisible, setIsAmenityModalVisible] = useState(false);

  const naamRef = useRef(null);
  const extraInfoRef = useRef(null);

  const grootte = useMemo(() => parseGrootte(extraInfoItems), [extraInfoItems]);

  function setValidationError(field, message) {
    setErrors((current) => ({ ...current, [field]: message }));
  }

  function clearValidationError(field) {
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function validate() {
    const nextErrors = {};

    if (!naam.trim()) {
      nextErrors.naam = 'Vul de naam van je perceel in.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      const firstKey = Object.keys(nextErrors)[0];
      AccessibilityInfo.announceForAccessibility(nextErrors[firstKey]);
      if (firstKey === 'naam') {
        naamRef.current?.focus?.();
      }
      return false;
    }

    return true;
  }

  function updatePhotos(updater) {
    setPhotos((current) => {
      const next = updater(current);
      const normalized = next.filter(Boolean);
      return normalized.length > 0 ? normalized.slice(0, 4) : [PLACEHOLDER_PHOTO];
    });
  }

  function replacePlaceholderOrAppend(newPhoto) {
    updatePhotos((current) => {
      const realPhotos = current.filter((item) => !item.isPlaceholder);
      return [...realPhotos, newPhoto];
    });
  }

  function replacePhotoAtIndex(index, newPhoto) {
    updatePhotos((current) => {
      const realPhotos = current.filter((item) => !item.isPlaceholder);
      if (index >= 0 && index < realPhotos.length) {
        realPhotos[index] = newPhoto;
        return realPhotos;
      }
      return [...realPhotos, newPhoto];
    });
  }

  function removePhotoAtIndex(index) {
    updatePhotos((current) => {
      const realPhotos = current.filter((item) => !item.isPlaceholder);
      realPhotos.splice(index, 1);
      return realPhotos;
    });
  }

  async function requestLibraryPhoto(index) {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        throw new Error('Geef toegang tot je fotobibliotheek om een perceelfoto te kiezen.');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
        selectionLimit: 1,
      });

      if (result.canceled || !result.assets?.[0]?.uri) {
        return;
      }

      const asset = result.assets[0];
      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        asset.width && asset.width > 1920 ? [{ resize: { width: 1920 } }] : [],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        },
      );

      const nextPhoto = createPhoto(manipulated.uri, manipulated.uri);
      if (typeof index === 'number') {
        replacePhotoAtIndex(index, nextPhoto);
      } else {
        replacePlaceholderOrAppend(nextPhoto);
      }
    } catch (error) {
      const message = error.message || 'Foto kiezen mislukt.';
      setSubmitError(message);
      AccessibilityInfo.announceForAccessibility(message);
    }
  }

  async function requestCameraPhoto(index) {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        throw new Error('Camera-toegang is nodig om een perceelfoto te maken.');
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled || !result.assets?.[0]?.uri) {
        return;
      }

      const asset = result.assets[0];
      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        asset.width && asset.width > 1920 ? [{ resize: { width: 1920 } }] : [],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        },
      );

      const nextPhoto = createPhoto(manipulated.uri, manipulated.uri);
      if (typeof index === 'number') {
        replacePhotoAtIndex(index, nextPhoto);
      } else {
        replacePlaceholderOrAppend(nextPhoto);
      }
    } catch (error) {
      const message = error.message || 'Camera openen mislukt.';
      setSubmitError(message);
      AccessibilityInfo.announceForAccessibility(message);
    }
  }

  function promptForPhoto(index) {
    Alert.alert('Foto toevoegen', 'Kies hoe je een foto wilt toevoegen.', [
      { text: 'Foto nemen', onPress: () => requestCameraPhoto(index) },
      { text: 'Kies uit galerij', onPress: () => requestLibraryPhoto(index) },
      { text: 'Annuleer', style: 'cancel' },
    ]);
  }

  function toggleAmenity(label) {
    setSelectedAmenities((current) => (
      current.includes(label)
        ? current.filter((item) => item !== label)
        : [...current, label]
    ));
  }

  function addExtraInfoItem() {
    const nextValue = normalizeExtraInfo(extraInfoDraft);
    if (!nextValue) return;

    setExtraInfoItems((current) => [...current, nextValue]);
    setExtraInfoDraft('');
    clearValidationError('extraInfoDraft');
    AccessibilityInfo.announceForAccessibility(`${nextValue} toegevoegd.`);
    extraInfoRef.current?.focus?.();
  }

  function removeExtraInfoItem(index) {
    setExtraInfoItems((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  async function handleSubmit() {
    if (!validate()) {
      return;
    }

    if (!supabase) {
      setSubmitError('Supabase is niet geconfigureerd. Vul de productie-omgeving in voordat je opslaat.');
      return;
    }

    setIsSaving(true);
    setSubmitError('');

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const ownerId = userData?.user?.id;
      if (!ownerId) {
        throw new Error('Je bent niet ingelogd. Log opnieuw in en probeer het opnieuw.');
      }

      const photosToUpload = photos.filter((photo) => !photo.isPlaceholder && photo.localUri);
      const uploadedUrls = [];

      for (let index = 0; index < photosToUpload.length; index += 1) {
        const photo = photosToUpload[index];
        const response = await fetch(photo.localUri);
        const blob = await response.blob();
        const filePath = `${ownerId}/${Date.now()}-${index}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from('perceel-fotos')
          .upload(filePath, blob, {
            contentType: 'image/jpeg',
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data: publicUrlData } = supabase.storage
          .from('perceel-fotos')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrlData.publicUrl);
      }

      const row = {
        owner_id: ownerId,
        naam: naam.trim(),
        beschrijving: beschrijving.trim() || null,
        grootte: grootte || null,
        extra_info: extraInfoItems,
        voorzieningen: selectedAmenities,
        fotos: uploadedUrls,
      };

      // TODO: keep this insert in sync if the percelen schema changes.
      const { error: insertError } = await supabase.from('percelen').insert(row);
      if (insertError) {
        throw insertError;
      }

      console.log('Perceel opgeslagen:', row);
      onSaved(row);
    } catch (error) {
      const message = error.message || 'Opslaan mislukt.';
      setSubmitError(message);
      AccessibilityInfo.announceForAccessibility(message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Perceel toevoegen" onBack={onBack} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Image source={{ uri: IMG_NAME }} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Naam van het perceel</Text>
          </View>

          <AuthTextField
            label=""
            value={naam}
            onChangeText={(value) => {
              setNaam(value);
              if (errors.naam) clearValidationError('naam');
            }}
            placeholder="Welke naam krijgt je perceel..."
            accessibilityLabel="Naam van het perceel"
            accessibilityHint="Voer een naam in voor je perceel"
            accessibilityState={{ invalid: Boolean(errors.naam) }}
            ref={naamRef}
            onBlur={() => {
              if (!naam.trim()) {
                setValidationError('naam', 'Vul de naam van je perceel in.');
              } else {
                clearValidationError('naam');
              }
            }}
            variant="soft"
            shellStyle={styles.softInputShell}
            inputStyle={styles.softInputText}
          />
          {errors.naam ? <FieldError message={errors.naam} /> : null}
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Image source={{ uri: IMG_PHOTOS }} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Foto’s</Text>
          </View>

          <View style={styles.photoGrid}>
            {Array.from({ length: 4 }).map((_, index) => {
              const photo = photos[index];
              if (photo) {
                return (
                  <View key={photo.id} style={styles.photoSlot}>
                    <Image source={{ uri: photo.previewUri }} style={styles.photoImage} />
                    <Pressable
                      onPress={() => removePhotoAtIndex(index)}
                      style={styles.photoRemove}
                      accessibilityRole="button"
                      accessibilityLabel="Foto verwijderen"
                      accessibilityHint="Verwijder deze foto uit het perceel"
                    >
                      <Image source={{ uri: IMG_PHOTO_REMOVE }} style={styles.photoRemoveIcon} />
                    </Pressable>
                  </View>
                );
              }

              return (
                <Pressable
                  key={`empty-${index}`}
                  onPress={() => promptForPhoto(index)}
                  style={styles.emptyPhotoSlot}
                  accessibilityRole="button"
                  accessibilityLabel="Foto toevoegen"
                  accessibilityHint="Voeg een foto toe aan dit perceel"
                >
                  <Image
                    source={{ uri: index === 0 ? IMG_EMPTY_PLUS : IMG_EMPTY_PLUS_ALT }}
                    style={styles.emptyPlusIcon}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Image source={{ uri: IMG_DESCRIPTION }} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Beschrijving:</Text>
          </View>

          <AuthTextArea
            label=""
            value={beschrijving}
            onChangeText={setBeschrijving}
            placeholder="Schrijf een beschrijving voor je perceel..."
            height={216}
            accessibilityLabel="Beschrijving van het perceel"
            accessibilityHint="Geef een beschrijving van je perceel"
          />
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderLeft}>
              <Image source={{ uri: IMG_AMENITIES }} style={styles.sectionIcon} />
              <Text style={styles.sectionTitle}>Voorzieningen</Text>
            </View>
            <Pressable
              onPress={() => setIsAmenityModalVisible(true)}
              style={styles.sectionAction}
              accessibilityRole="button"
              accessibilityLabel="Voorzieningen toevoegen"
              accessibilityHint="Open de lijst met voorzieningen"
            >
              <Image source={{ uri: IMG_AMENITIES_ADD }} style={styles.sectionActionIcon} />
            </Pressable>
          </View>

          <View style={styles.amenityRow}>
            {selectedAmenities.map((amenity) => {
              const iconUri = amenity === 'Water' ? IMG_WATER : amenity === 'Materiaal' ? IMG_MATERIAAL : IMG_ZADEN;

              return (
                <View key={amenity} style={styles.amenityItem}>
                  <View style={styles.amenityIconWrap}>
                    <Image source={{ uri: iconUri }} style={styles.amenityIcon} />
                    <Pressable
                      onPress={() => toggleAmenity(amenity)}
                      style={styles.amenityRemove}
                      accessibilityRole="button"
                      accessibilityLabel={`${amenity} verwijderen`}
                      accessibilityHint={`Verwijder ${amenity} uit de voorzieningen`}
                    >
                      <Image source={{ uri: IMG_ROW_REMOVE }} style={styles.rowRemoveIcon} />
                    </Pressable>
                  </View>
                  <Text style={styles.amenityLabel}>{amenity}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Image source={{ uri: IMG_EXTRA }} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Extra informatie</Text>
          </View>

          <AuthTextField
            label=""
            value={extraInfoDraft}
            onChangeText={setExtraInfoDraft}
            placeholder="Vandaag heb ik..."
            accessibilityLabel="Extra informatie"
            accessibilityHint="Voeg extra informatie toe en druk op gereed om toe te voegen"
            accessibilityState={{ invalid: Boolean(errors.extraInfoDraft) }}
            ref={extraInfoRef}
            variant="soft"
            shellStyle={styles.softInputShell}
            inputStyle={styles.softInputText}
            returnKeyType="done"
            blurOnSubmit={false}
            onSubmitEditing={addExtraInfoItem}
            onBlur={addExtraInfoItem}
          />

          <View style={styles.extraInfoList}>
            {extraInfoItems.map((item, index) => (
              <View key={`${item}-${index}`} style={styles.extraInfoRow}>
                <View style={styles.extraInfoBulletWrap}>
                  <Image source={{ uri: IMG_EXTRA_BULLET }} style={styles.extraInfoBullet} />
                </View>
                <Text style={styles.extraInfoText}>{item}</Text>
                <Pressable
                  onPress={() => removeExtraInfoItem(index)}
                  style={styles.extraInfoRemove}
                  accessibilityRole="button"
                  accessibilityLabel="Extra informatie verwijderen"
                  accessibilityHint="Verwijder dit extra informatie-item"
                >
                  <Image source={{ uri: IMG_ROW_REMOVE }} style={styles.rowRemoveIcon} />
                </Pressable>
              </View>
            ))}
          </View>

          <Pressable
            onPress={addExtraInfoItem}
            style={styles.extraInfoAddButton}
            accessibilityRole="button"
            accessibilityLabel="Extra informatie toevoegen"
            accessibilityHint="Voeg de getypte extra informatie toe aan de lijst"
          >
            <Image source={{ uri: IMG_AMENITIES_ADD }} style={styles.extraInfoAddIcon} />
          </Pressable>
        </View>

        {submitError ? <FieldError message={submitError} /> : null}

        <View style={styles.submitWrap}>
          <AuthButton label="Voeg perceel toe" onPress={handleSubmit} loading={isSaving} />
        </View>
      </ScrollView>

      <Modal
        visible={isAmenityModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsAmenityModalVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setIsAmenityModalVisible(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}} accessibilityRole="dialog">
            <Text style={styles.modalTitle}>Voorzieningen toevoegen</Text>
            <Text style={styles.modalBody}>Selecteer voorzieningen die beschikbaar zijn op dit perceel.</Text>

            {AMENITY_OPTIONS.map((option) => {
              const selected = selectedAmenities.includes(option.label);
              return (
                <Pressable
                  key={option.label}
                  onPress={() => toggleAmenity(option.label)}
                  style={[styles.modalOption, selected && styles.modalOptionSelected]}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={option.label}
                >
                  <Image source={{ uri: option.icon }} style={styles.modalOptionIcon} />
                  <Text style={styles.modalOptionLabel}>{option.label}</Text>
                  <Text style={styles.modalOptionState}>{selected ? 'Verwijderen' : 'Toevoegen'}</Text>
                </Pressable>
              );
            })}

            <Pressable
              onPress={() => setIsAmenityModalVisible(false)}
              style={styles.modalClose}
              accessibilityRole="button"
              accessibilityLabel="Sluiten"
            >
              <Text style={styles.modalCloseText}>Sluiten</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
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
    paddingBottom: 120,
    gap: SPACING.lg,
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
    marginBottom: SPACING.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  sectionIcon: {
    width: 24,
    height: 24,
  },
  sectionTitle: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 20,
    color: COLORS.textPrimary,
    flexShrink: 1,
  },
  softInputShell: {
    height: 36,
    borderRadius: RADIUS.xs,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  softInputText: {
    fontSize: 16,
    fontFamily: FONTS.body,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  photoSlot: {
    width: '48%',
    aspectRatio: 141 / 121,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: RADIUS.sm,
  },
  photoRemove: {
    position: 'absolute',
    top: 8,
    right: 8,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  photoRemoveIcon: {
    width: 16,
    height: 16,
  },
  emptyPhotoSlot: {
    width: '48%',
    aspectRatio: 141 / 121,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.dividerSoft,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  emptyPlusIcon: {
    width: 24,
    height: 24,
  },
  amenityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    flexWrap: 'wrap',
  },
  amenityItem: {
    width: 50,
    alignItems: 'center',
  },
  amenityIconWrap: {
    width: 50,
    height: 53,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amenityIcon: {
    width: 50,
    height: 53,
  },
  amenityRemove: {
    position: 'absolute',
    right: -1,
    top: -1,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  rowRemoveIcon: {
    width: 16,
    height: 16,
  },
  amenityLabel: {
    marginTop: SPACING.xs,
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: '#000000',
    textAlign: 'center',
  },
  sectionAction: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -2,
  },
  sectionActionIcon: {
    width: 24,
    height: 24,
  },
  extraInfoList: {
    marginTop: SPACING.sm,
    gap: SPACING.xs,
  },
  extraInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    minHeight: 22,
  },
  extraInfoBulletWrap: {
    width: 5,
    height: 22,
  },
  extraInfoBullet: {
    width: 5,
    height: 22,
  },
  extraInfoText: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  extraInfoRemove: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  helperText: {
    marginTop: SPACING.sm,
    fontFamily: FONTS.body,
    fontSize: 12.8,
    color: COLORS.textMuted,
  },
  extraInfoAddButton: {
    marginTop: SPACING.sm,
    minHeight: 44,
    minWidth: 44,
    alignSelf: 'flex-end',
    alignItems: 'center',
    justifyContent: 'center',
  },
  extraInfoAddIcon: {
    width: 24,
    height: 24,
  },
  submitWrap: {
    marginTop: SPACING.sm,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.md,
    borderTopRightRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  modalTitle: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 20,
    color: COLORS.textPrimary,
  },
  modalBody: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  modalOption: {
    minHeight: 44,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.dividerSoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  modalOptionSelected: {
    borderColor: COLORS.brand,
    backgroundColor: 'rgba(87,98,56,0.05)',
  },
  modalOptionIcon: {
    width: 28,
    height: 28,
  },
  modalOptionLabel: {
    flex: 1,
    fontFamily: FONTS.displayMedium,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  modalOptionState: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12.8,
    color: COLORS.brand,
  },
  modalClose: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.sm,
  },
  modalCloseText: {
    fontFamily: FONTS.displayMedium,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
});
