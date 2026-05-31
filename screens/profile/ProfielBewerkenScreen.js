import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { decode as decodeBase64 } from 'base64-arraybuffer';
import { ArrowLeftIcon, CameraIcon, CheckIcon, LeafIcon } from 'phosphor-react-native';
import LocationAutocompleteField from '../../components/location/LocationAutocompleteField';
import FormField from '../../components/common/FormField';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SIZES, SPACING } from '../../components/theme/tokens';
import { supabase } from '../../services/supabase';

const BIO_MAX = 300;
const AVATAR_SIZE = 72;
const AVATAR_OVERHANG = 36;

async function uploadProfileImage(bucket, userId, filename, localUri) {
  const base64Encoding = FileSystem.EncodingType?.Base64 ?? 'base64';
  const base64 = await FileSystem.readAsStringAsync(localUri, { encoding: base64Encoding });
  const arrayBuffer = decodeBase64(base64);

  if (arrayBuffer.byteLength === 0) {
    throw new Error('Afbeelding kon niet worden gelezen (0 bytes).');
  }

  const ext = localUri.split('.').pop()?.toLowerCase() || 'jpg';
  const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  const filePath = `${userId}/${filename}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, arrayBuffer, { contentType: mime, upsert: true });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return `${urlData.publicUrl}?t=${Date.now()}`;
}

async function pickImage(aspectRatio) {
  const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!granted) {
    Alert.alert('Geen toegang', 'Geef toegang tot je fotobibliotheek in de instellingen.');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.85,
    allowsEditing: true,
    aspect: aspectRatio,
  });

  if (result.canceled || !result.assets?.[0]) return null;
  return result.assets[0].uri;
}

export default function ProfielBewerkenScreen({ onBack, onSaved }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [plaats, setPlaats] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');

  const originalEmailRef = useRef('');
  const [avatarUri, setAvatarUri] = useState(null);
  const [coverUri, setCoverUri] = useState(null);
  const [existingAvatarUrl, setExistingAvatarUrl] = useState(null);
  const [existingCoverUrl, setExistingCoverUrl] = useState(null);
  const userIdRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      if (!supabase) { if (mounted) setIsLoading(false); return; }

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData?.session?.user?.id;
        const userEmail = sessionData?.session?.user?.email || '';
        if (!userId) { if (mounted) setIsLoading(false); return; }

        userIdRef.current = userId;
        originalEmailRef.current = userEmail;
        if (mounted) setEmail(userEmail);

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('first_name, last_name, bio, avatar_url, cover_url, plaats')
          .eq('id', userId)
          .maybeSingle();

        if (error) console.warn('Failed to load profile for editing', error);

        if (mounted && profile) {
          setFirstName(profile.first_name || '');
          setLastName(profile.last_name || '');
          setPlaats(profile.plaats || '');
          setBio(profile.bio || '');
          setExistingAvatarUrl(profile.avatar_url || null);
          setExistingCoverUrl(profile.cover_url || null);
        }
      } catch (e) {
        console.warn('loadProfile error', e);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadProfile();
    return () => { mounted = false; };
  }, []);

  async function handlePickAvatar() {
    const uri = await pickImage([1, 1]);
    if (uri) setAvatarUri(uri);
  }

  async function handlePickCover() {
    const uri = await pickImage([16, 9]);
    if (uri) setCoverUri(uri);
  }

  async function handleSave() {
    const userId = userIdRef.current;
    if (!userId || !supabase) return;

    setIsSaving(true);

    try {
      let newAvatarUrl = existingAvatarUrl;
      let newCoverUrl = existingCoverUrl;

      if (avatarUri) {
        newAvatarUrl = await uploadProfileImage('profile-pfp', userId, 'avatar', avatarUri);
      }
      if (coverUri) {
        newCoverUrl = await uploadProfileImage('profile-covers', userId, 'cover', coverUri);
      }

      const trimmedEmail = email.trim();
      let emailChanged = false;
      if (trimmedEmail && trimmedEmail !== originalEmailRef.current) {
        const { error: emailError } = await supabase.auth.updateUser({ email: trimmedEmail });
        if (emailError) throw emailError;
        emailChanged = true;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          plaats: plaats.trim() || null,
          bio: bio.trim() || null,
          avatar_url: newAvatarUrl,
          cover_url: newCoverUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      if (emailChanged) {
        Alert.alert(
          'Bevestigingsmail verstuurd',
          'Controleer je inbox om je nieuwe e-mailadres te bevestigen.',
          [{ text: 'OK', onPress: () => onSaved?.() }],
        );
      } else {
        onSaved?.();
      }
    } catch (err) {
      console.warn('Save profile error', err);
      Alert.alert('Opslaan mislukt', err?.message || 'Er liep iets mis. Probeer opnieuw.');
    } finally {
      setIsSaving(false);
    }
  }

  const avatarDisplaySource = avatarUri
    ? { uri: avatarUri }
    : existingAvatarUrl
      ? { uri: existingAvatarUrl }
      : null;

  const coverDisplaySource = coverUri
    ? { uri: coverUri }
    : existingCoverUrl
      ? { uri: existingCoverUrl }
      : null;

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <Pressable
            style={styles.headerBack}
            onPress={onBack}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Terug"
            accessibilityHint="Ga terug zonder wijzigingen op te slaan"
          >
            <ArrowLeftIcon size={20} color={COLORS.textInverse} weight="regular" accessibilityElementsHidden />
            <Text style={styles.headerBackText}>Terug</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Profiel bewerken</Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator
            size="large"
            color={COLORS.brand}
            accessibilityLabel="Profiel wordt geladen"
          />
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Cover picker */}
            <Pressable
              style={styles.coverPicker}
              onPress={handlePickCover}
              accessibilityRole="button"
              accessibilityLabel={coverDisplaySource ? 'Coverfoto wijzigen' : 'Coverfoto toevoegen'}
              accessibilityHint="Tik om een foto te kiezen uit je fotobibliotheek"
            >
              {coverDisplaySource ? (
                <>
                  <Image
                    source={coverDisplaySource}
                    style={styles.coverImg}
                    resizeMode="cover"
                    accessibilityElementsHidden
                  />
                  <View style={styles.coverBadge} pointerEvents="none">
                    <CameraIcon size={16} color={COLORS.surface} weight="regular" accessibilityElementsHidden />
                  </View>
                </>
              ) : (
                <View style={styles.coverEmpty}>
                  <View style={styles.coverEmptyIconCircle}>
                    <CameraIcon size={24} color={COLORS.brand} weight="regular" accessibilityElementsHidden />
                  </View>
                  <Text style={styles.coverEmptyText}>Coverfoto toevoegen</Text>
                </View>
              )}
            </Pressable>

            {/* Avatar picker */}
            <View style={styles.avatarRow}>
              <Pressable
                style={styles.avatarPicker}
                onPress={handlePickAvatar}
                accessibilityRole="button"
                accessibilityLabel={avatarDisplaySource ? 'Profielfoto wijzigen' : 'Profielfoto toevoegen'}
                accessibilityHint="Tik om een foto te kiezen uit je fotobibliotheek"
              >
                {avatarDisplaySource ? (
                  <Image
                    source={avatarDisplaySource}
                    style={styles.avatarImg}
                    accessibilityElementsHidden
                  />
                ) : (
                  <View style={[styles.avatarImg, styles.avatarPlaceholder]}>
                    <Text style={styles.avatarInitials} accessibilityElementsHidden>
                      {[firstName, lastName].filter(Boolean).map((n) => n[0]).join('').toUpperCase() || '?'}
                    </Text>
                  </View>
                )}
                <View style={styles.avatarCameraWrap} pointerEvents="none">
                  <CameraIcon size={12} color={COLORS.surface} weight="regular" accessibilityElementsHidden />
                </View>
              </Pressable>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <Text style={styles.sectionTitle} accessibilityRole="header">Profiel</Text>

              <View style={styles.fieldRow}>
                <FormField label="Voornaam" style={styles.fieldHalf}>
                  <View style={styles.inputShell}>
                    <TextInput
                      style={styles.input}
                      value={firstName}
                      onChangeText={setFirstName}
                      placeholder="Voornaam"
                      placeholderTextColor={COLORS.textMuted}
                      autoCapitalize="words"
                      returnKeyType="next"
                      accessibilityLabel="Voornaam"
                    />
                  </View>
                </FormField>
                <FormField label="Achternaam" style={styles.fieldHalf}>
                  <View style={styles.inputShell}>
                    <TextInput
                      style={styles.input}
                      value={lastName}
                      onChangeText={setLastName}
                      placeholder="Achternaam"
                      placeholderTextColor={COLORS.textMuted}
                      autoCapitalize="words"
                      returnKeyType="next"
                      accessibilityLabel="Achternaam"
                    />
                  </View>
                </FormField>
              </View>

              <LocationAutocompleteField
                label="Stad"
                value={plaats}
                onSelect={(suggestion) => setPlaats(suggestion.plaats)}
                onChangeText={setPlaats}
                accessibilityLabel="Stad"
              />

              <FormField label="Bio" counter={bio.length} counterMax={BIO_MAX}>
                <View style={[styles.inputShell, styles.bioShell]}>
                  <TextInput
                    style={[styles.input, styles.bioInput]}
                    value={bio}
                    onChangeText={(t) => setBio(t.slice(0, BIO_MAX))}
                    placeholder="Vertel iets over jezelf…"
                    placeholderTextColor={COLORS.textMuted}
                    multiline
                    textAlignVertical="top"
                    maxLength={BIO_MAX}
                    accessibilityLabel="Bio"
                    accessibilityHint={`Maximaal ${BIO_MAX} tekens`}
                  />
                </View>
              </FormField>

              <View style={styles.divider} />

              <Text style={styles.sectionTitle} accessibilityRole="header">Account</Text>

              <FormField
                label="E-mailadres"
                hint="Bij een wijziging ontvang je een bevestigingsmail."
              >
                <View style={styles.inputShell}>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="naam@voorbeeld.be"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    accessibilityLabel="E-mailadres"
                  />
                </View>
              </FormField>

              <Pressable
                style={({ pressed }) => [
                  styles.saveBtn,
                  isSaving && styles.saveBtnDisabled,
                  pressed && !isSaving && styles.saveBtnPressed,
                ]}
                onPress={handleSave}
                disabled={isSaving}
                accessibilityRole="button"
                accessibilityLabel="Wijzigingen opslaan"
                accessibilityState={{ disabled: isSaving, busy: isSaving }}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={COLORS.textInverse} />
                ) : (
                  <>
                    <CheckIcon size={20} color={COLORS.textInverse} weight="bold" accessibilityElementsHidden />
                    <Text style={styles.saveBtnText}>Wijzigingen opslaan</Text>
                  </>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  headerSafe: {
    backgroundColor: COLORS.brand,
  },
  header: {
    backgroundColor: COLORS.brand,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.screenX,
    paddingVertical: SPACING.md,
  },
  headerBack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  headerBackText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.md,
    color: COLORS.textInverse,
  },
  headerTitle: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.xl,
    color: COLORS.textInverse,
  },
  headerSpacer: {
    width: 60,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  // Cover
  coverPicker: {
    marginHorizontal: SPACING.screenX,
    marginTop: SPACING.xl,
    height: SIZES.profileCoverHeight,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceMuted,
  },
  coverImg: {
    width: '100%',
    height: '100%',
  },
  coverBadge: {
    position: 'absolute',
    bottom: SPACING.sm,
    right: SPACING.sm,
    width: 34,
    height: 34,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  coverEmptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surfaceBrand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverEmptyText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  // Avatar
  avatarRow: {
    marginHorizontal: SPACING.screenX,
    marginTop: -AVATAR_OVERHANG,
    marginBottom: SPACING.md,
  },
  avatarPicker: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    position: 'relative',
  },
  avatarImg: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: COLORS.surfaceMuted,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.xxl,
    color: COLORS.textPrimary,
  },
  avatarCameraWrap: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Form
  form: {
    paddingHorizontal: SPACING.screenX,
    gap: SPACING.md,
  },
  sectionTitle: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  fieldHalf: {
    flex: 1,
  },
  inputShell: {
    height: 48,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
  },
  bioShell: {
    height: 120,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
    justifyContent: 'flex-start',
  },
  input: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },
  bioInput: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.dividerSoft,
  },
  saveBtn: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.lg,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnPressed: {
    opacity: 0.85,
  },
  saveBtnText: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textInverse,
  },
});
