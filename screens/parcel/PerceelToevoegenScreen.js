import React, { useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Alert,
  Dimensions,
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
import { BinocularsIcon, InfoIcon, CalendarIcon, CameraIcon, DropIcon, FrameCornersIcon, LeafIcon, PaintBrushIcon, PlusCircleIcon, XCircleIcon, ToolboxIcon, ShovelIcon, PlantIcon, RecycleIcon, TreeIcon } from 'phosphor-react-native';

const IMG_ARROW_LEFT = 'http://localhost:3845/assets/823f067bbf1763ad90d2dac8f9d3bad9ec4cf79f.svg';
const IMG_POPUP_ICON = 'http://localhost:3845/assets/4c6187f5874a7cc596bcee028d8ed521433957b7.svg';
const IMG_POPUP_FRAME_SMALL = 'http://localhost:3845/assets/db775ac6fdc7f1baf0dcdeb5e9eba827734a3827.svg';

const PHOTO_TILE_WIDTH = Math.round(
  (Dimensions.get('window').width - (SPACING.screenX * 2) - (SPACING.md * 2) - SPACING.md) / 2,
);
const PHOTO_TILE_HEIGHT = Math.round((PHOTO_TILE_WIDTH * 121) / 141);

const AMENITY_OPTIONS = [
  { label: 'Water', icon: DropIcon },
  { label: 'Tools', icon: ShovelIcon },
  { label: 'Zaden', icon: PlantIcon },
  { label: 'Compost', icon: RecycleIcon },
  { label: 'Bomen', icon: TreeIcon },
];

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

function createEmptyPhotoSlots() {
  return Array.from({ length: 4 }, () => null);
}

export default function PerceelToevoegenScreen({ onBack, onSaved = () => {} }) {
  const [naam, setNaam] = useState('');
  const [beschrijving, setBeschrijving] = useState('');
  const [extraInfoDraft, setExtraInfoDraft] = useState('');
  const [extraInfoItems, setExtraInfoItems] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [photos, setPhotos] = useState(() => createEmptyPhotoSlots());
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

  function setPhotoAtIndex(index, newPhoto) {
    setPhotos((current) => {
      const next = current.slice(0, 4);
      next[index] = newPhoto;
      return next;
    });
  }

  function addPhotoToFirstEmptySlot(newPhoto) {
    setPhotos((current) => {
      const next = current.slice(0, 4);
      const emptyIndex = next.findIndex((item) => !item);
      if (emptyIndex === -1) {
        return next;
      }
      next[emptyIndex] = newPhoto;
      return next;
    });
  }

  function removePhotoAtIndex(index) {
    setPhotos((current) => {
      const next = current.slice(0, 4);
      next[index] = null;
      return next;
    });
  }

  async function createPhotoFromAsset(asset) {
    const manipulated = await ImageManipulator.manipulateAsync(
      asset.uri,
      asset.width && asset.width > 1920 ? [{ resize: { width: 1920 } }] : [],
      {
        compress: 0.8,
        format: ImageManipulator.SaveFormat.JPEG,
      },
    );

    return createPhoto(manipulated.uri, manipulated.uri);
  }

  async function addGalleryAssetsToSlots(assets, startIndex = 0) {
    const processedPhotos = [];

    for (const asset of assets.slice(0, 4 - startIndex)) {
      processedPhotos.push(await createPhotoFromAsset(asset));
    }

    setPhotos((current) => {
      const next = current.slice(0, 4);
      let slotIndex = startIndex;

      for (const photo of processedPhotos) {
        while (slotIndex < 4 && next[slotIndex]) {
          slotIndex += 1;
        }

        if (slotIndex >= 4) {
          break;
        }

        next[slotIndex] = photo;
        slotIndex += 1;
      }

      return next;
    });
  }

  async function requestLibraryPhoto(index) {
    try {
      const currentPhotoCount = photos.filter(Boolean).length;
      if (currentPhotoCount >= 4) {
        setSubmitError('Je kan maximaal 4 foto’s toevoegen.');
        AccessibilityInfo.announceForAccessibility('Je kan maximaal 4 foto’s toevoegen.');
        return;
      }

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        throw new Error('Geef toegang tot je fotobibliotheek om een perceelfoto te kiezen.');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
        allowsMultipleSelection: true,
        selectionLimit: Math.max(1, 4 - currentPhotoCount),
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const startIndex = typeof index === 'number' ? index : 0;
      await addGalleryAssetsToSlots(result.assets, startIndex);
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
        setPhotoAtIndex(index, nextPhoto);
      } else {
        addPhotoToFirstEmptySlot(nextPhoto);
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
            <FrameCornersIcon size={32} color={COLORS.accent} weight="regular" />
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
            <CameraIcon size={32} color={COLORS.accent} weight="regular" />
            <Text style={styles.sectionTitle}>Foto’s</Text>
          </View>

          <View style={styles.photoGrid}>
            {Array.from({ length: 4 }).map((_, index) => {
              const photo = photos[index];
              if (photo) {
                return (
                  <View key={photo.id} style={styles.photoSlot}>
                    <View style={styles.photoFrame}>
                      <Image source={{ uri: photo.previewUri }} style={styles.photoImage} />
                    </View>
                    <Pressable
                      onPress={() => removePhotoAtIndex(index)}
                      style={styles.photoRemove}
                      accessibilityRole="button"
                      accessibilityLabel="Foto verwijderen"
                      accessibilityHint="Verwijder deze foto uit het perceel"
                    >
                      <XCircleIcon size={24} color={COLORS.negative} weight="regular" />
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
                  <PlusCircleIcon size={24} color={COLORS.textPrimary} weight="regular" />
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <BinocularsIcon size={32} color={COLORS.accent} weight="regular" />
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
            shellStyle={styles.descriptionShell}
            inputStyle={styles.descriptionInput}
          />
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderLeft}>
              <ToolboxIcon size={32} color={COLORS.accent} weight="regular" />
              <Text style={styles.sectionTitle}>Voorzieningen</Text>
            </View>
            <Pressable
              onPress={() => setIsAmenityModalVisible(true)}
              style={styles.sectionAction}
              accessibilityRole="button"
              accessibilityLabel="Voorzieningen toevoegen"
              accessibilityHint="Open de lijst met voorzieningen"
            >
              <PlusCircleIcon size={32} color={COLORS.brand} weight="regular" />
            </Pressable>
          </View>

          <View style={styles.amenityRow}>
            {selectedAmenities.length === 0 ? (
              <Pressable
                onPress={() => setIsAmenityModalVisible(true)}
                style={styles.amenityEmpty}
                accessibilityRole="button"
                accessibilityLabel="Voeg voorzieningen toe"
                accessibilityHint="Open de lijst met voorzieningen"
              >
                <PlusCircleIcon size={20} color={COLORS.textMuted} weight="regular" />
                <Text style={styles.amenityEmptyText}>Geen voorzieningen toegevoegd</Text>
              </Pressable>
            ) : (
              selectedAmenities.map((amenity) => {
                const IconComponent = amenity === 'Water'
                  ? DropIcon
                  : amenity === 'Tools'
                  ? ShovelIcon
                  : amenity === 'Zaden'
                  ? PlantIcon
                  : amenity === 'Compost'
                  ? RecycleIcon
                  : amenity === 'Bomen'
                  ? TreeIcon
                  : TreeIcon;

                return (
                  <View key={amenity} style={styles.amenityItem}>
                    <View style={styles.amenityIconWrap}>
                      <View style={styles.amenityIconCircle}>
                        <IconComponent size={24} color={COLORS.surface} weight="regular" />
                      </View>
                      <Pressable
                        onPress={() => toggleAmenity(amenity)}
                        style={styles.amenityRemove}
                        accessibilityRole="button"
                        accessibilityLabel={`${amenity} verwijderen`}
                        accessibilityHint={`Verwijder ${amenity} uit de voorzieningen`}
                      >
                        <XCircleIcon size={24} color={COLORS.negative} weight="regular" />
                      </Pressable>
                    </View>
                    <Text style={styles.amenityLabel}>{amenity}</Text>
                  </View>
                );
              })
            )}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <InfoIcon size={32} color={COLORS.accent} weight="regular" />
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
            {extraInfoItems.map((item, index) => {
              const isGrootte = item.toLowerCase().startsWith('grootte:');
              const [label, ...rest] = item.split(':');
              const value = rest.join(':').trim();

              return (
                <View key={`${item}-${index}`} style={styles.extraInfoRow}>
                  <View style={styles.extraInfoBulletWrap}>
                    <View style={styles.extraInfoBulletCircle} />
                  </View>

                  {isGrootte ? (
                    <Text style={styles.extraInfoText}>
                      <Text style={styles.extraInfoLabelBold}>{`${label}: `}</Text>
                      <Text style={styles.extraInfoText}>{value}</Text>
                    </Text>
                  ) : (
                    <Text style={styles.extraInfoText}>{item}</Text>
                  )}

                  <Pressable
                    onPress={() => removeExtraInfoItem(index)}
                    style={styles.extraInfoRemoveWrap}
                    accessibilityRole="button"
                    accessibilityLabel="Extra informatie verwijderen"
                    accessibilityHint="Verwijder dit extra informatie-item"
                  >
                    <XCircleIcon size={24} color={COLORS.negative} weight="regular" />
                  </Pressable>
                </View>
              );
            })}
          </View>

          {/* Extra-info is added by pressing Enter; inline add button removed to match design */}
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
              const IconComponent = option.icon;
              return (
                <Pressable
                  key={option.label}
                  onPress={() => toggleAmenity(option.label)}
                  style={[styles.modalOption, selected && styles.modalOptionSelected]}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={option.label}
                >
                  <View style={styles.modalOptionIconWrap}>
                    <IconComponent size={24} color={selected ? COLORS.brand : COLORS.textSecondary} weight="regular" />
                  </View>
                  <Text style={styles.modalOptionLabel}>{option.label}</Text>
                  <View style={styles.modalOptionStateWrap}>
                    <Text style={styles.modalOptionState}>{selected ? 'Verwijderen' : 'Toevoegen'}</Text>
                    <Image source={{ uri: IMG_POPUP_ICON }} style={styles.modalOptionRightIcon} />
                  </View>
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
  photoSectionIcon: {
    width: 32,
    height: 32,
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
  descriptionShell: {
    borderRadius: 8,
    backgroundColor: 'rgba(87,98,56,0.05)',
    padding: 8,
  },
  descriptionInput: {
    fontSize: 16,
    fontFamily: FONTS.body,
    lineHeight: 16,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    alignItems: 'flex-start',
  },
  photoSlot: {
    width: PHOTO_TILE_WIDTH,
    height: PHOTO_TILE_HEIGHT,
    borderRadius: RADIUS.sm,
    overflow: 'visible',
    position: 'relative',
  },
  photoFrame: {
    width: '100%',
    height: '100%',
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoRemove: {
    position: 'absolute',
    top: -10,
    right: -5,
    width: 17,
    height: 17,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
    elevation: 3,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  emptyPhotoSlot: {
    width: PHOTO_TILE_WIDTH,
    height: PHOTO_TILE_HEIGHT,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.dividerSoft,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
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
    height: 50,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amenityIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 999,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amenityRemove: {
    position: 'absolute',
    right: 0,
    top: -5,
    width: 17,
    height: 17,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    elevation: 2,
  },
  amenityLabel: {
    marginTop: SPACING.xs,
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: '#000000',
    textAlign: 'center',
  },
  amenityEmpty: {
    minHeight: 64,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.dividerSoft,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    backgroundColor: COLORS.surface,
  },
  amenityEmptyText: {
    marginTop: SPACING.xs,
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  sectionAction: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -2,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  extraInfoBulletCircle: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: COLORS.accent,
  },
  extraInfoLabelBold: {
    fontFamily: FONTS.displayMedium,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  extraInfoRemoveWrap: {
    minWidth: 28,
    minHeight: 28,
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
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
  extraInfoRemoveIcon: {
    width: 21,
    height: 21,
    resizeMode: 'contain',
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
  modalOptionIconWrap: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
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
  modalOptionRightIcon: {
    width: 21,
    height: 21,
    resizeMode: 'contain',
  },
  modalOptionStateWrap: {
    flexDirection: 'row',
    alignItems: 'center',
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
