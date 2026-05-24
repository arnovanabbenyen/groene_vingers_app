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
import { CameraIcon, FloppyDiskIcon, LeafIcon, XIcon } from 'phosphor-react-native';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SIZES, SPACING } from '../../components/theme/tokens';
import { supabase } from '../../services/supabase';

const BIO_MAX = 300;

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
  // Append cache-busting param so React Native doesn't show stale image after update
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
          <Pressable onPress={onBack} hitSlop={8} accessibilityRole="button" accessibilityLabel="Annuleren">
            <XIcon size={22} color={COLORS.textInverse} weight="regular" />
          </Pressable>
          <Text style={styles.headerTitle}>Profiel bewerken</Text>
          <View style={{ width: 22 }} />
        </View>
      </SafeAreaView>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.brand} />
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
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
              accessibilityLabel="Coverfoto wijzigen"
            >
              {coverDisplaySource ? (
                <Image source={coverDisplaySource} style={styles.coverImg} resizeMode="cover" />
              ) : (
                <View style={styles.coverPlaceholder}>
                  <LeafIcon size={40} color={COLORS.brand} weight="regular" />
                </View>
              )}
              <View style={styles.coverOverlay}>
                <CameraIcon size={24} color={COLORS.surface} weight="regular" />
                <Text style={styles.coverOverlayText}>Coverfoto wijzigen</Text>
              </View>
            </Pressable>

            {/* Avatar picker */}
            <Pressable
              style={styles.avatarPicker}
              onPress={handlePickAvatar}
              accessibilityRole="button"
              accessibilityLabel="Profielfoto wijzigen"
            >
              {avatarDisplaySource ? (
                <Image source={avatarDisplaySource} style={styles.avatarImg} />
              ) : (
                <View style={[styles.avatarImg, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarInitials}>
                    {[firstName, lastName].filter(Boolean).map((n) => n[0]).join('').toUpperCase() || '?'}
                  </Text>
                </View>
              )}
              <View style={styles.avatarCameraWrap}>
                <CameraIcon size={14} color={COLORS.surface} weight="regular" />
              </View>
            </Pressable>

            {/* Form fields */}
            <View style={styles.form}>
              <Text style={styles.formSectionTitle} accessibilityRole="header">Account</Text>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>E-mailadres</Text>
                <View style={styles.inputShell}>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="naam@voorbeeld.be"
                    placeholderTextColor={COLORS.border}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                  />
                </View>
                <Text style={styles.fieldHint}>
                  Bij een wijziging ontvang je een bevestigingsmail.
                </Text>
              </View>

              <Text style={[styles.formSectionTitle, styles.formSectionTitleSpaced]} accessibilityRole="header">Profiel</Text>

              <View style={styles.fieldRow}>
                <View style={styles.fieldHalf}>
                  <Text style={styles.fieldLabel}>Voornaam</Text>
                  <View style={styles.inputShell}>
                    <TextInput
                      style={styles.input}
                      value={firstName}
                      onChangeText={setFirstName}
                      placeholder="Voornaam"
                      placeholderTextColor={COLORS.border}
                      autoCapitalize="words"
                      returnKeyType="next"
                    />
                  </View>
                </View>

                <View style={styles.fieldHalf}>
                  <Text style={styles.fieldLabel}>Achternaam</Text>
                  <View style={styles.inputShell}>
                    <TextInput
                      style={styles.input}
                      value={lastName}
                      onChangeText={setLastName}
                      placeholder="Achternaam"
                      placeholderTextColor={COLORS.border}
                      autoCapitalize="words"
                      returnKeyType="next"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Stad</Text>
                {/* TODO: integrate LocationIQ autocomplete once the location feature ships */}
                <View style={styles.inputShell}>
                  <TextInput
                    style={styles.input}
                    value={plaats}
                    onChangeText={setPlaats}
                    placeholder="Bv. Leuven"
                    placeholderTextColor={COLORS.border}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                </View>
              </View>

              <View style={styles.field}>
                <View style={styles.bioLabelRow}>
                  <Text style={styles.fieldLabel}>Bio</Text>
                  <Text style={styles.bioCounter}>{bio.length}/{BIO_MAX}</Text>
                </View>
                <View style={[styles.inputShell, styles.bioShell]}>
                  <TextInput
                    style={[styles.input, styles.bioInput]}
                    value={bio}
                    onChangeText={(t) => setBio(t.slice(0, BIO_MAX))}
                    placeholder="Vertel iets over jezelf…"
                    placeholderTextColor={COLORS.border}
                    multiline
                    textAlignVertical="top"
                    maxLength={BIO_MAX}
                  />
                </View>
              </View>

              <Pressable
                style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={isSaving}
                accessibilityRole="button"
                accessibilityLabel="Wijzigingen bewaren"
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={COLORS.textInverse} />
                ) : (
                  <>
                    <FloppyDiskIcon size={20} color={COLORS.textInverse} weight="regular" />
                    <Text style={styles.saveButtonText}>Wijzigingen bewaren</Text>
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
    backgroundColor: COLORS.surface,
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
  headerTitle: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.xl,
    color: COLORS.textInverse,
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
    paddingBottom: 48,
  },
  // Cover picker
  coverPicker: {
    marginHorizontal: SPACING.screenX,
    marginTop: SPACING.xl,
    height: SIZES.profileCoverHeight,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  coverImg: {
    width: '100%',
    height: SIZES.profileCoverHeight,
  },
  coverPlaceholder: {
    flex: 1,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  coverOverlayText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.md,
    color: COLORS.surface,
  },
  // Avatar picker
  avatarPicker: {
    marginTop: -36,
    marginLeft: SPACING.screenX,
    marginBottom: SPACING.md,
    width: 72,
    height: 72,
    position: 'relative',
  },
  avatarImg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: COLORS.surface,
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
    borderRadius: 11,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  // Form
  form: {
    paddingHorizontal: SPACING.screenX,
    gap: 0,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: 14,
  },
  fieldHalf: {
    flex: 1,
  },
  field: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  inputShell: {
    height: 40,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  bioShell: {
    height: 120,
    paddingTop: 10,
    paddingBottom: 10,
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
  bioLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bioCounter: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  formSectionTitle: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  formSectionTitleSpaced: {
    marginTop: SPACING.xl,
  },
  fieldHint: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 6,
  },
  saveButton: {
    marginTop: SPACING.xl,
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.xl,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textInverse,
  },
});
