import React, { useRef, useState, useEffect } from 'react';
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
  TextInput,
  ActivityIndicator,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { decode as decodeBase64 } from 'base64-arraybuffer';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../../components/theme/tokens';
import AuthButton from '../../components/buttons/AuthButton';
import AuthTextArea from '../../components/auth/AuthTextArea';
import AuthTextField from '../../components/auth/AuthTextField';
import FieldError from '../../components/notifications/FieldError';
import ScreenHeader from '../../components/headers/ScreenHeader';
import { supabase } from '../../services/supabase';
import { BinocularsIcon, InfoIcon, CalendarIcon, CameraIcon, MapPinIcon, DropIcon, FrameCornersIcon, RulerIcon, LeafIcon, PaintBrushIcon, PlusCircleIcon, XCircleIcon, ToolboxIcon, ShovelIcon, PlantIcon, RecycleIcon, TreeIcon, HandshakeIcon } from 'phosphor-react-native';
import { SAMENWERKING_TYPES } from '../../services/samenwerkingTypes';

const IMG_ARROW_LEFT = 'http://localhost:3845/assets/823f067bbf1763ad90d2dac8f9d3bad9ec4cf79f.svg';
const IMG_POPUP_ICON = 'http://localhost:3845/assets/4c6187f5874a7cc596bcee028d8ed521433957b7.svg';
const IMG_POPUP_FRAME_SMALL = 'http://localhost:3845/assets/db775ac6fdc7f1baf0dcdeb5e9eba827734a3827.svg';

const PHOTO_TILE_WIDTH = Math.round(
  (Dimensions.get('window').width - (SPACING.screenX * 2) - (SPACING.md * 2) - SPACING.md) / 2,
);
const PHOTO_TILE_HEIGHT = Math.round((PHOTO_TILE_WIDTH * 121) / 141);
const PERCEEL_STATUS = {
  ACTIVE: 'active',
  HIDDEN: 'hidden',
  DELETED: 'deleted',
};

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

function normalizeExtraInfo(input) {
  const trimmed = input.trim();
  if (!trimmed) return null;
  return trimmed;
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
  const values = Array.isArray(initialPerceel?.voorzieningen)
    ? initialPerceel.voorzieningen
    : [];

  return values.filter(Boolean).map((value) => capitalizeFirstLetter(value));
}

export default function PerceelToevoegenScreen({ onBack, onSaved = () => {}, initialPerceel = null }) {
  const isEditMode = Boolean(initialPerceel);
  const [naam, setNaam] = useState(initialPerceel?.naam || '');
  const [beschrijving, setBeschrijving] = useState(initialPerceel?.beschrijving || '');
  const [adres, setAdres] = useState(initialPerceel?.adres || '');
  const [plaats, setPlaats] = useState(initialPerceel?.plaats || '');
  const [grootteInput, setGrootteInput] = useState(initialPerceel?.grootte ? String(initialPerceel.grootte) : '');
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
    () => Array.isArray(initialPerceel?.voorkeur_samenwerking) ? initialPerceel.voorkeur_samenwerking : [],
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
      } catch (err) {
        setAddressSuggestions([]);
      } finally {
        setIsAddressLoading(false);
      }
    }, 300);

    return () => clearTimeout(handle);
  }, [adres]);

  function selectAddressSuggestion(suggestion) {
    const formatted = suggestion.display_name || suggestion.label || '';
    const parsedPlaats = suggestion.address?.city
      || suggestion.address?.town
      || suggestion.address?.village
      || suggestion.address?.suburb
      || null;
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

      const uploadedUrls = [];

      // TODO: clean up orphaned photo files in Supabase Storage when they are removed during edit. For now, files remain in storage but are no longer referenced by any perceel.
      for (let index = 0; index < photos.length; index += 1) {
        const photo = photos[index];
        if (!photo) {
          continue;
        }

        if (photo.localUri) {
          const filePath = `${ownerId}/${Date.now()}-${index}.jpg`;

          // Read local file as base64 (reliable on RN, unlike fetch().blob())
          const base64 = await FileSystem.readAsStringAsync(photo.localUri, {
            encoding: 'base64',
          });

          // Decode to ArrayBuffer for Supabase upload
          const arrayBuffer = decodeBase64(base64);

          if (arrayBuffer.byteLength === 0) {
            throw new Error('Foto kon niet worden gelezen (0 bytes). Probeer een andere foto.');
          }

          const { error: uploadError } = await supabase.storage
            .from('perceel-fotos')
            .upload(filePath, arrayBuffer, {
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

        if (updateError) {
          throw updateError;
        }

        Alert.alert('Wijzigingen opgeslagen', 'Je perceel is bijgewerkt.', [
          {
            text: 'OK',
            onPress: () => onSaved(savedPerceel || payload),
          },
        ]);
      } else {
        const { data: savedPerceel, error: insertError } = await supabase
          .from('percelen')
          .insert(payload)
          .select('*')
          .single();

        if (insertError) {
          throw insertError;
        }

        Alert.alert('Perceel toegevoegd', 'Je perceel is opgeslagen.', [
          {
            text: 'OK',
            onPress: () => onSaved(savedPerceel || payload),
          },
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
      <ScreenHeader title={isEditMode ? 'Perceel bewerken' : 'Perceel toevoegen'} onBack={onBack} />

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
            <MapPinIcon size={32} color={COLORS.accent} weight="regular" />
            <Text style={styles.sectionTitle}>Adres</Text>
          </View>

          <View>
            <View style={styles.addressShellWrapper}>
              <AuthTextField
                label=""
                value={adres}
                onChangeText={(t) => {
                  setAdres(t);
                  setAdresCoords(null);
                }}
                placeholder="Straat, nummer, postcode en gemeente"
                placeholderTextColor={COLORS.textMuted}
                accessibilityRole="combobox"
                accessibilityLabel="Adres van het perceel"
                accessibilityHint="Begin te typen om suggesties te zien"
                ref={adresRef}
                variant="soft"
                shellStyle={styles.softInputShell}
                inputStyle={[styles.softInputText, styles.addressTextInput]}
              />

              {isAddressLoading ? (
                <ActivityIndicator style={styles.suggestionLoading} size="small" color={COLORS.accent} />
              ) : null}
            </View>

            {addressSuggestions && addressSuggestions.length > 0 ? (
              <View style={styles.suggestionsContainer}>
                {addressSuggestions.map((s, i) => (
                  <Pressable
                    key={s.place_id || `${i}`}
                    onPress={() => selectAddressSuggestion(s)}
                    style={styles.suggestionItem}
                    accessibilityRole="button"
                    accessibilityLabel={s.display_name}
                  >
                    <Text style={styles.suggestionText}>{s.display_name}</Text>
                  </Pressable>
                ))}
              </View>
            ) : adres && !isAddressLoading ? (
              <Text style={styles.suggestionHelperText}>Geen adressen gevonden</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <RulerIcon size={28} color={COLORS.accent} weight="regular" />
            <Text style={styles.sectionTitle}>Grootte perceel</Text>
          </View>

          <View style={styles.grootteWrapper}>
            <View style={[styles.softInputShell, styles.grootteShell]}>
              <TextInput
                ref={grootteRef}
                value={grootteInput}
                onChangeText={setGrootteInput}
                placeholder="Bijvoorbeeld 40..."
                placeholderTextColor={COLORS.textMuted}
                keyboardType="number-pad"
                returnKeyType="done"
                style={styles.grootteTextInput}
              />

              <Pressable style={styles.grootteUnitOverlay} onPress={() => grootteRef.current?.focus?.()} accessibilityRole="button" accessibilityLabel="Eenheid">
                <Text style={styles.grootteUnitOverlayText}>m²</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Address card moved above Grootte (see earlier) */}

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
            <HandshakeIcon size={32} color={COLORS.accent} weight="regular" />
            <Text style={styles.sectionTitle}>Type samenwerking</Text>
          </View>

          <View style={styles.samenwerkingList}>
            {SAMENWERKING_TYPES.map((type) => {
              const selected = selectedSamenwerking.includes(type);
              return (
                <Pressable
                  key={type}
                  style={[styles.samenwerkingItem, selected && styles.samenwerkingItemSelected]}
                  onPress={() => {
                    setSelectedSamenwerking((current) =>
                      current.includes(type)
                        ? current.filter((v) => v !== type)
                        : [...current, type],
                    );
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={type}
                >
                  <View style={[styles.samenwerkingCheck, selected && styles.samenwerkingCheckSelected]}>
                    {selected && <View style={styles.samenwerkingCheckInner} />}
                  </View>
                  <Text style={styles.samenwerkingLabel}>{type}</Text>
                </Pressable>
              );
            })}
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
              return (
                <View key={`${item}-${index}`} style={styles.extraInfoRow}>
                  <View style={styles.extraInfoBulletWrap}>
                    <View style={styles.extraInfoBulletCircle} />
                  </View>

                  <Text style={styles.extraInfoText}>{item}</Text>

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
          <AuthButton
            label={isEditMode ? 'Wijzigingen opslaan' : 'Perceel toevoegen'}
            onPress={handleSubmit}
            loading={isSaving}
          />
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
  addressShell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 12,
  },
  addressShellWrapper: {
    position: 'relative',
  },
  addressTextInput: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.textPrimary,
    paddingVertical: 10,
  },
  suggestionsContainer: {
    marginTop: 6,
    borderRadius: RADIUS.xs,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.dividerSoft,
    overflow: 'hidden',
  },
  suggestionItem: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  suggestionText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  suggestionHelperText: {
    marginTop: SPACING.xs,
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  suggestionLoading: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -10 }],
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
  grootteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    position: 'relative',
  },
  grootteWrapper: {
    marginTop: SPACING.xs,
  },
  grootteShell: {
    position: 'relative',
    height: 36,
    paddingRight: 56,
    justifyContent: 'center',
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
  },
  grootteTextInput: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 18,
    color: COLORS.textPrimary,
  },
  grootteUnitOverlay: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grootteUnitOverlayText: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 18,
    color: COLORS.textSecondary,
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
  samenwerkingList: {
    gap: SPACING.sm,
  },
  samenwerkingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: 10,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(87,98,56,0.05)',
  },
  samenwerkingItemSelected: {
    backgroundColor: 'rgba(87,98,56,0.12)',
  },
  samenwerkingCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  samenwerkingCheckSelected: {
    borderColor: COLORS.brand,
  },
  samenwerkingCheckInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.brand,
  },
  samenwerkingLabel: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '600',
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
