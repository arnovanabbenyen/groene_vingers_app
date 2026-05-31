import React, { useRef, useState, useEffect } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { decode as decodeBase64 } from 'base64-arraybuffer';
import {
  BinocularsIcon,
  CameraIcon,
  FrameCornersIcon,
  HandshakeIcon,
  InfoIcon,
  MapPinIcon,
  PlusCircleIcon,
  RulerIcon,
  ToolboxIcon,
} from 'phosphor-react-native';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SIZES, SPACING } from '../../components/theme/tokens';
import AuthButton from '../../components/buttons/AuthButton';
import AuthTextArea from '../../components/auth/AuthTextArea';
import AuthTextField from '../../components/auth/AuthTextField';
import FieldError from '../../components/notifications/FieldError';
import Header from '../../components/navigation/Header';
import AmenitySelector from '../../components/parcel/AmenitySelector';
import ExtraInfoEditor from '../../components/parcel/ExtraInfoEditor';
import GrootteInput from '../../components/parcel/GrootteInput';
import PhotoGrid from '../../components/parcel/PhotoGrid';
import SamenwerkingSelector from '../../components/parcel/SamenwerkingSelector';
import SectionCard from '../../components/parcel/SectionCard';
import SectionHeader from '../../components/parcel/SectionHeader';
import { supabase } from '../../services/supabase';
import { SAMENWERKING_TYPES } from '../../services/samenwerkingTypes';

const PERCEEL_STATUS = {
  ACTIVE: 'active',
  HIDDEN: 'hidden',
  DELETED: 'deleted',
};

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createPhoto(previewUri, localUri) {
  return { id: uid('photo'), previewUri, localUri, isPlaceholder: false };
}

function normalizeExtraInfo(input) {
  const trimmed = input.trim();
  return trimmed || null;
}

function capitalizeFirstLetter(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function createEmptyPhotoSlots() {
  return Array.from({ length: 4 }, () => null);
}

function createPhotoFromUrl(url) {
  return {
    id: uid('photo'),
    previewUri: url,
    remoteUrl: url,
    localUri: null,
    isPlaceholder: false,
    isExisting: true,
  };
}

function createInitialPhotoSlots(initialPerceel) {
  const photoUrls = Array.isArray(initialPerceel?.fotos) ? initialPerceel.fotos.filter(Boolean) : [];
  const slots = createEmptyPhotoSlots();
  photoUrls.slice(0, 4).forEach((url, index) => {
    slots[index] = createPhotoFromUrl(url);
  });
  return slots;
}

function createInitialExtraInfo(initialPerceel) {
  const values = Array.isArray(initialPerceel?.extra_info)
    ? initialPerceel.extra_info
    : Array.isArray(initialPerceel?.extraInfo)
      ? initialPerceel.extraInfo
      : [];
  return values.filter(Boolean);
}

function createInitialAmenities(initialPerceel) {
  const values = Array.isArray(initialPerceel?.voorzieningen) ? initialPerceel.voorzieningen : [];
  return values.filter(Boolean).map((value) => capitalizeFirstLetter(value));
}

export default function PerceelToevoegenScreen({ onBack, onSaved = () => {}, initialPerceel = null }) {
  const isEditMode = Boolean(initialPerceel);

  const [naam, setNaam] = useState(initialPerceel?.naam || '');
  const [beschrijving, setBeschrijving] = useState(initialPerceel?.beschrijving || '');
  const [adres, setAdres] = useState(initialPerceel?.adres || '');
  const [plaats, setPlaats] = useState(initialPerceel?.plaats || '');
  const [grootteInput, setGrootteInput] = useState(
    initialPerceel?.grootte ? String(initialPerceel.grootte) : '',
  );
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [adresCoords, setAdresCoords] = useState(
    initialPerceel?.lat != null && initialPerceel?.lng != null
      ? { lat: Number(initialPerceel.lat), lng: Number(initialPerceel.lng) }
      : null,
  );
  const [extraInfoDraft, setExtraInfoDraft] = useState('');
  const [extraInfoItems, setExtraInfoItems] = useState(() => createInitialExtraInfo(initialPerceel));
  const [selectedAmenities, setSelectedAmenities] = useState(() => createInitialAmenities(initialPerceel));
  const [selectedSamenwerking, setSelectedSamenwerking] = useState(
    () => (Array.isArray(initialPerceel?.voorkeur_samenwerking) ? initialPerceel.voorkeur_samenwerking : []),
  );
  const [photos, setPhotos] = useState(() => createInitialPhotoSlots(initialPerceel));
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isAmenityModalVisible, setIsAmenityModalVisible] = useState(false);

  const naamRef = useRef(null);
  const extraInfoRef = useRef(null);
  const adresRef = useRef(null);
  const grootteRef = useRef(null);

  useEffect(() => {
    setNaam(initialPerceel?.naam || '');
    setBeschrijving(initialPerceel?.beschrijving || '');
    setAdres(initialPerceel?.adres || '');
    setPlaats(initialPerceel?.plaats || '');
    setGrootteInput(initialPerceel?.grootte ? String(initialPerceel.grootte) : '');
    setAdresCoords(
      initialPerceel?.lat != null && initialPerceel?.lng != null
        ? { lat: Number(initialPerceel.lat), lng: Number(initialPerceel.lng) }
        : null,
    );
    setExtraInfoDraft('');
    setExtraInfoItems(createInitialExtraInfo(initialPerceel));
    setSelectedAmenities(createInitialAmenities(initialPerceel));
    setSelectedSamenwerking(
      Array.isArray(initialPerceel?.voorkeur_samenwerking) ? initialPerceel.voorkeur_samenwerking : [],
    );
    setPhotos(createInitialPhotoSlots(initialPerceel));
    setErrors({});
    setSubmitError('');
    setIsSaving(false);
  }, [initialPerceel]);

  useEffect(() => {
    if (!adres || adres.trim().length === 0) {
      setAddressSuggestions([]);
      setIsAddressLoading(false);
      return undefined;
    }

    const handle = setTimeout(async () => {
      setIsAddressLoading(true);
      try {
        const key = process.env.EXPO_PUBLIC_LOCATIONIQ_KEY;
        if (!key) {
          setAddressSuggestions([]);
          return;
        }

        const url = `https://us1.locationiq.com/v1/autocomplete.php?key=${key}&q=${encodeURIComponent(adres)}&format=json&limit=5&countrycodes=be,nl`;
        const res = await fetch(url);
        const json = await res.json();
        const suggestions = Array.isArray(json) ? json : [];
        setAddressSuggestions(suggestions);
        AccessibilityInfo.announceForAccessibility(`${suggestions.length} suggesties gevonden`);
      } catch {
        setAddressSuggestions([]);
      } finally {
        setIsAddressLoading(false);
      }
    }, 300);

    return () => clearTimeout(handle);
  }, [adres]);

  function selectAddressSuggestion(suggestion) {
    const formatted = suggestion.display_name || suggestion.label || '';
    const parsedPlaats =
      suggestion.address?.city ||
      suggestion.address?.town ||
      suggestion.address?.village ||
      suggestion.address?.suburb ||
      null;
    setAdres(formatted);
    setPlaats(parsedPlaats || '');
    setAdresCoords({ lat: parseFloat(suggestion.lat), lng: parseFloat(suggestion.lon) });
    setAddressSuggestions([]);
    AccessibilityInfo.announceForAccessibility('Adres geselecteerd');
  }

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
      if (firstKey === 'naam') naamRef.current?.focus?.();
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
      if (emptyIndex === -1) return next;
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
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
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
        while (slotIndex < 4 && next[slotIndex]) slotIndex += 1;
        if (slotIndex >= 4) break;
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
        const msg = 'Je kan maximaal 4 foto’s toevoegen.';
        setSubmitError(msg);
        AccessibilityInfo.announceForAccessibility(msg);
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

      if (result.canceled || !result.assets?.length) return;

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

      if (result.canceled || !result.assets?.[0]?.uri) return;

      const asset = result.assets[0];
      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        asset.width && asset.width > 1920 ? [{ resize: { width: 1920 } }] : [],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
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
    setSelectedAmenities((current) =>
      current.includes(label) ? current.filter((item) => item !== label) : [...current, label],
    );
  }

  function toggleSamenwerking(type) {
    setSelectedSamenwerking((current) =>
      current.includes(type) ? current.filter((v) => v !== type) : [...current, type],
    );
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
    setExtraInfoItems((current) => current.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    if (!validate()) return;

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

      const uploadedUrls = [];

      // TODO: clean up orphaned photo files in Supabase Storage when removed during edit
      for (let index = 0; index < photos.length; index += 1) {
        const photo = photos[index];
        if (!photo) continue;

        if (photo.localUri) {
          const filePath = `${ownerId}/${Date.now()}-${index}.jpg`;
          const base64 = await FileSystem.readAsStringAsync(photo.localUri, { encoding: 'base64' });
          const arrayBuffer = decodeBase64(base64);

          if (arrayBuffer.byteLength === 0) {
            throw new Error('Foto kon niet worden gelezen (0 bytes). Probeer een andere foto.');
          }

          const { error: uploadError } = await supabase.storage
            .from('perceel-fotos')
            .upload(filePath, arrayBuffer, { contentType: 'image/jpeg', upsert: false });

          if (uploadError) throw uploadError;

          const { data: publicUrlData } = supabase.storage
            .from('perceel-fotos')
            .getPublicUrl(filePath);

          uploadedUrls.push(publicUrlData.publicUrl);
          continue;
        }

        uploadedUrls.push(photo.remoteUrl || photo.previewUri);
      }

      const payload = {
        owner_id: ownerId,
        naam: naam.trim(),
        beschrijving: beschrijving.trim() || null,
        grootte: grootteInput.trim() ? grootteInput.replace(/m²|m2/gi, '').trim() : null,
        adres: adres && adres.trim() ? adres.trim() : null,
        plaats: plaats && plaats.trim() ? plaats.trim() : null,
        lat: adresCoords?.lat ?? null,
        lng: adresCoords?.lng ?? null,
        extra_info: extraInfoItems,
        voorzieningen: selectedAmenities,
        voorkeur_samenwerking: selectedSamenwerking,
        fotos: uploadedUrls,
        updated_at: new Date().toISOString(),
      };

      if (!isEditMode) {
        payload.status = PERCEEL_STATUS.ACTIVE;
      }

      if (isEditMode) {
        const { data: savedPerceel, error: updateError } = await supabase
          .from('percelen')
          .update(payload)
          .eq('id', initialPerceel.id)
          .select('*')
          .single();

        if (updateError) throw updateError;

        Alert.alert('Wijzigingen opgeslagen', 'Je perceel is bijgewerkt.', [
          { text: 'OK', onPress: () => onSaved(savedPerceel || payload) },
        ]);
      } else {
        const { data: savedPerceel, error: insertError } = await supabase
          .from('percelen')
          .insert(payload)
          .select('*')
          .single();

        if (insertError) throw insertError;

        Alert.alert('Perceel toegevoegd', 'Je perceel is opgeslagen.', [
          { text: 'OK', onPress: () => onSaved(savedPerceel || payload) },
        ]);
      }
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
      <Header title={isEditMode ? 'Perceel bewerken' : 'Perceel toevoegen'} onBack={onBack} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Naam */}
        <SectionCard>
          <SectionHeader icon={FrameCornersIcon} title="Naam van het perceel" />
          <AuthTextField
            ref={naamRef}
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
            onBlur={() => {
              if (!naam.trim()) {
                setValidationError('naam', 'Vul de naam van je perceel in.');
              } else {
                clearValidationError('naam');
              }
            }}
            variant="soft"
          />
          {errors.naam ? <FieldError message={errors.naam} /> : null}
        </SectionCard>

        {/* Adres */}
        <SectionCard>
          <SectionHeader icon={MapPinIcon} title="Adres" />
          <View style={styles.addressWrapper}>
            <AuthTextField
              ref={adresRef}
              label=""
              value={adres}
              onChangeText={(t) => {
                setAdres(t);
                setAdresCoords(null);
              }}
              placeholder="Straat, nummer, postcode en gemeente"
              accessibilityRole="combobox"
              accessibilityLabel="Adres van het perceel"
              accessibilityHint="Begin te typen om adressuggesties te zien"
              variant="soft"
            />
            {isAddressLoading ? (
              <ActivityIndicator
                style={styles.addressLoader}
                size="small"
                color={COLORS.accent}
                accessibilityLabel="Adressen zoeken..."
              />
            ) : null}
          </View>

          {addressSuggestions.length > 0 ? (
            <View style={styles.suggestions}>
              {addressSuggestions.map((s, i) => (
                <Pressable
                  key={s.place_id || String(i)}
                  onPress={() => selectAddressSuggestion(s)}
                  style={({ pressed }) => [styles.suggestion, pressed && styles.suggestionPressed]}
                  accessibilityRole="button"
                  accessibilityLabel={s.display_name}
                >
                  <Text style={styles.suggestionText} numberOfLines={2}>
                    {s.display_name}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : adres && !isAddressLoading ? (
            <Text style={styles.noResults}>Geen adressen gevonden</Text>
          ) : null}
        </SectionCard>

        {/* Grootte */}
        <SectionCard>
          <SectionHeader icon={RulerIcon} title="Grootte perceel" />
          <GrootteInput
            ref={grootteRef}
            value={grootteInput}
            onChangeText={setGrootteInput}
          />
        </SectionCard>

        {/* Foto's */}
        <SectionCard>
          <SectionHeader icon={CameraIcon} title="Foto's" />
          <PhotoGrid photos={photos} onAdd={promptForPhoto} onRemove={removePhotoAtIndex} />
        </SectionCard>

        {/* Beschrijving */}
        <SectionCard>
          <SectionHeader icon={BinocularsIcon} title="Beschrijving" />
          <AuthTextArea
            label=""
            value={beschrijving}
            onChangeText={setBeschrijving}
            placeholder="Schrijf een beschrijving voor je perceel..."
            height={200}
            accessibilityLabel="Beschrijving van het perceel"
            accessibilityHint="Geef een beschrijving van je perceel"
            shellStyle={styles.descriptionShell}
          />
        </SectionCard>

        {/* Voorzieningen */}
        <SectionCard>
          <SectionHeader
            icon={ToolboxIcon}
            title="Voorzieningen"
            action={
              <Pressable
                onPress={() => setIsAmenityModalVisible(true)}
                accessibilityRole="button"
                accessibilityLabel="Voorzieningen toevoegen"
                accessibilityHint="Open de lijst met voorzieningen"
                hitSlop={8}
              >
                <PlusCircleIcon size={28} color={COLORS.brand} weight="regular" />
              </Pressable>
            }
          />
          <AmenitySelector
            selected={selectedAmenities}
            onToggle={toggleAmenity}
            modalVisible={isAmenityModalVisible}
            onOpenModal={() => setIsAmenityModalVisible(true)}
            onCloseModal={() => setIsAmenityModalVisible(false)}
          />
        </SectionCard>

        {/* Type samenwerking */}
        <SectionCard>
          <SectionHeader icon={HandshakeIcon} title="Type samenwerking" />
          <SamenwerkingSelector
            types={SAMENWERKING_TYPES}
            selected={selectedSamenwerking}
            onToggle={toggleSamenwerking}
          />
        </SectionCard>

        {/* Extra informatie */}
        <SectionCard>
          <SectionHeader icon={InfoIcon} title="Extra informatie" />
          <ExtraInfoEditor
            inputRef={extraInfoRef}
            draft={extraInfoDraft}
            onDraftChange={setExtraInfoDraft}
            items={extraInfoItems}
            onAdd={addExtraInfoItem}
            onRemove={removeExtraInfoItem}
          />
        </SectionCard>

        {submitError ? <FieldError message={submitError} /> : null}

        <AuthButton
          label={isEditMode ? 'Wijzigingen opslaan' : 'Perceel toevoegen'}
          onPress={handleSubmit}
          loading={isSaving}
          accessibilityLabel={isEditMode ? 'Sla wijzigingen op' : 'Perceel toevoegen'}
          accessibilityHint={
            isEditMode ? 'Sla wijzigingen voor dit perceel op' : 'Sla dit nieuwe perceel op'
          }
        />
      </ScrollView>
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
    paddingBottom: SIZES.bottomNavClearance + SPACING.lg,
    gap: SPACING.lg,
  },

  // Address autocomplete
  addressWrapper: {
    position: 'relative',
  },
  addressLoader: {
    position: 'absolute',
    right: SPACING.md,
    top: '50%',
    transform: [{ translateY: -8 }],
  },
  suggestions: {
    marginTop: SPACING.xs,
    borderRadius: RADIUS.xs,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.dividerSoft,
    overflow: 'hidden',
  },
  suggestion: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  suggestionPressed: {
    backgroundColor: COLORS.surfaceBrand,
  },
  suggestionText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  noResults: {
    marginTop: SPACING.xs,
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },

  // Description
  descriptionShell: {
    borderRadius: RADIUS.xs,
    backgroundColor: COLORS.brandOverlay,
    borderWidth: 0,
    padding: SPACING.sm,
  },
});
