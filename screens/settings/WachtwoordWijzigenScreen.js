import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { EyeIcon, EyeSlashIcon } from 'phosphor-react-native';
import Header from '../../components/navigation/Header';
import FormField from '../../components/common/FormField';
import PasswordStrengthBar from '../../components/auth/PasswordStrengthBar';
import { useFormValidation } from '../../hooks/useFormValidation';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SPACING } from '../../components/theme/tokens';
import { supabase } from '../../services/supabase';

export default function WachtwoordWijzigenScreen({ onBack }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const { passwordStrength } = useFormValidation();
  const strength = newPassword ? passwordStrength(newPassword) : '';

  async function handleSave() {
    setError('');

    if (newPassword.length < 8) {
      setError('Wachtwoord moet minimaal 8 tekens zijn.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Wachtwoorden komen niet overeen.');
      return;
    }

    setIsSaving(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;

      Alert.alert(
        'Wachtwoord gewijzigd',
        'Je wachtwoord is succesvol bijgewerkt.',
        [{ text: 'OK', onPress: () => onBack?.() }],
      );
    } catch (err) {
      console.warn('Change password error', err);
      setError(err?.message || 'Er liep iets mis. Probeer opnieuw.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Header title="Wachtwoord wijzigen" onBack={onBack} />

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
          <View style={styles.form}>
            <FormField label="Nieuw wachtwoord">
              <View style={styles.inputShell}>
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={(t) => { setNewPassword(t); setError(''); }}
                  placeholder="Minimaal 8 tekens"
                  placeholderTextColor={COLORS.textMuted}
                  secureTextEntry={!showNew}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  accessibilityLabel="Nieuw wachtwoord"
                  accessibilityHint="Minimaal 8 tekens"
                />
                <Pressable
                  onPress={() => setShowNew((v) => !v)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={showNew ? 'Wachtwoord verbergen' : 'Wachtwoord tonen'}
                >
                  {showNew
                    ? <EyeSlashIcon size={18} color={COLORS.textMuted} weight="regular" accessibilityElementsHidden />
                    : <EyeIcon size={18} color={COLORS.textMuted} weight="regular" accessibilityElementsHidden />}
                </Pressable>
              </View>
              {strength ? <PasswordStrengthBar strength={strength} /> : null}
            </FormField>

            <FormField label="Bevestig wachtwoord">
              <View style={styles.inputShell}>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={(t) => { setConfirmPassword(t); setError(''); }}
                  placeholder="Herhaal je wachtwoord"
                  placeholderTextColor={COLORS.textMuted}
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleSave}
                  accessibilityLabel="Bevestig wachtwoord"
                />
                <Pressable
                  onPress={() => setShowConfirm((v) => !v)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={showConfirm ? 'Wachtwoord verbergen' : 'Wachtwoord tonen'}
                >
                  {showConfirm
                    ? <EyeSlashIcon size={18} color={COLORS.textMuted} weight="regular" accessibilityElementsHidden />
                    : <EyeIcon size={18} color={COLORS.textMuted} weight="regular" accessibilityElementsHidden />}
                </Pressable>
              </View>
            </FormField>

            {error ? (
              <Text style={styles.errorText} accessibilityRole="alert" accessibilityLiveRegion="polite">
                {error}
              </Text>
            ) : null}

            <Pressable
              style={({ pressed }) => [
                styles.saveBtn,
                isSaving && styles.saveBtnDisabled,
                pressed && !isSaving && styles.saveBtnPressed,
              ]}
              onPress={handleSave}
              disabled={isSaving}
              accessibilityRole="button"
              accessibilityLabel="Wachtwoord opslaan"
              accessibilityState={{ disabled: isSaving, busy: isSaving }}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={COLORS.textInverse} />
              ) : (
                <Text style={styles.saveBtnText}>Wachtwoord opslaan</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  form: {
    paddingHorizontal: SPACING.screenX,
    paddingTop: SPACING.xl,
    gap: SPACING.md,
  },
  inputShell: {
    height: 48,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },
  errorText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.negative,
    lineHeight: 18,
  },
  saveBtn: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.lg,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
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
