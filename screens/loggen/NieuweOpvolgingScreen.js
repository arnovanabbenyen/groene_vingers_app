import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CalendarCheckIcon, NoteIcon, PencilSimpleIcon } from 'phosphor-react-native';
import Header from '../../components/navigation/Header';
import AuthButton from '../../components/buttons/AuthButton';
import SectionCard from '../../components/parcel/SectionCard';
import SectionHeader from '../../components/parcel/SectionHeader';
import DateBlockSelector from '../../components/aanvraag/DateBlockSelector';
import { showToast } from '../../components/common/Toast';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SPACING } from '../../components/theme/tokens';
import { supabase } from '../../services/supabase';
import { createOpvolging } from '../../services/opvolgingen';

const MAX_TITLE = 120;
const MAX_DESCRIPTION = 500;

function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toLocalDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function NieuweOpvolgingScreen({ aanvraagId, onBack, onSaved }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(tomorrow);
  const [isSaving, setIsSaving] = useState(false);

  const canSave = title.trim().length > 0 && !isSaving;

  async function handleSave() {
    if (!canSave) return;
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Niet ingelogd.');

      const { error } = await createOpvolging(aanvraagId, user.id, {
        title: title.trim(),
        description: description.trim() || null,
        due_date: toLocalDateString(dueDate),
      });

      if (error) throw error;
      onSaved?.();
    } catch (err) {
      showToast(err.message || 'Kon opvolging niet opslaan.', 'error');
      setIsSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header title="Nieuwe opvolging" onBack={onBack} backLabel="Annuleren" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Titel */}
        <SectionCard>
          <SectionHeader
            icon={PencilSimpleIcon}
            title="Titel"
            action={
              <Text style={[styles.charCounter, title.length >= MAX_TITLE && styles.charCounterLimit]}>
                {title.length}/{MAX_TITLE}
              </Text>
            }
          />
          <View style={styles.fieldShell}>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={(t) => { if (t.length <= MAX_TITLE) setTitle(t); }}
              placeholder="Bijv. Onkruid verwijderen"
              placeholderTextColor={COLORS.textMuted}
              returnKeyType="done"
              autoFocus
              accessibilityLabel="Titel van de opvolging"
              accessibilityHint="Verplicht veld"
            />
          </View>
        </SectionCard>

        {/* Deadline */}
        <SectionCard>
          <SectionHeader icon={CalendarCheckIcon} title="Deadline" />
          <DateBlockSelector
            value={dueDate}
            onChange={setDueDate}
            minimumDate={tomorrow()}
            accessibilityLabel="Deadline van de opvolging"
          />
        </SectionCard>

        {/* Omschrijving */}
        <SectionCard>
          <SectionHeader
            icon={NoteIcon}
            title="Omschrijving"
            action={
              <Text style={[styles.charCounter, description.length >= MAX_DESCRIPTION && styles.charCounterLimit]}>
                {description.length}/{MAX_DESCRIPTION}
              </Text>
            }
          />
          <View style={styles.fieldShell}>
            <TextInput
              style={styles.textarea}
              value={description}
              onChangeText={(t) => { if (t.length <= MAX_DESCRIPTION) setDescription(t); }}
              placeholder="Voeg een omschrijving toe... (optioneel)"
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              accessibilityLabel="Omschrijving van de opvolging"
              accessibilityHint="Optioneel veld"
            />
          </View>
        </SectionCard>

        <AuthButton
          label="Opvolging toevoegen"
          onPress={handleSave}
          loading={isSaving}
          disabled={!canSave}
          accessibilityLabel="Opvolging opslaan"
        />
      </ScrollView>
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
  charCounter: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  charCounterLimit: {
    color: COLORS.negative,
  },
  fieldShell: {
    borderRadius: RADIUS.xs,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  input: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
  },
  textarea: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
    minHeight: 110,
    lineHeight: 22,
  },
});
