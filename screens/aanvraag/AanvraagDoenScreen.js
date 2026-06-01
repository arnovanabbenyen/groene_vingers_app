import React, { useRef, useState } from 'react';
import { AccessibilityInfo, Animated, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarBlankIcon, CalendarCheckIcon, PencilSimpleIcon } from 'phosphor-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Header from '../../components/navigation/Header';
import SectionCard from '../../components/parcel/SectionCard';
import SectionHeader from '../../components/parcel/SectionHeader';
import AuthTextArea from '../../components/auth/AuthTextArea';
import AuthButton from '../../components/buttons/AuthButton';
import FieldError from '../../components/notifications/FieldError';
import PerceelSummaryCard from '../../components/aanvraag/PerceelSummaryCard';
import WeekdaySelector from '../../components/aanvraag/WeekdaySelector';
import { supabase } from '../../services/supabase';
import { AANVRAAG_STATUS } from '../../services/aanvraagStatus';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SPACING } from '../../components/theme/tokens';
import MOCK_PERCEEL from '../../mocks/perceelMock';

export default function AanvraagDoenScreen({ onBack, onContinue, perceel }) {
  if (!perceel && !__DEV__) {
    console.warn('AanvraagDoenScreen is using MOCK_PERCEEL fallback in production.');
  }
  perceel = perceel || MOCK_PERCEEL;

  const today = new Date();
  const insets = useSafeAreaInsets();
  const motivationRef = useRef(null);
  const sheetAnim = useRef(new Animated.Value(300)).current;

  const [motivation, setMotivation] = useState('');
  const [availability, setAvailability] = useState([]);
  const [startDate, setStartDate] = useState(today);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function openDatePicker() {
    sheetAnim.setValue(300);
    setShowDatePicker(true);
    Animated.spring(sheetAnim, {
      toValue: 0,
      useNativeDriver: true,
      damping: 20,
      stiffness: 200,
    }).start();
  }

  function closeDatePicker() {
    Animated.timing(sheetAnim, {
      toValue: 300,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setShowDatePicker(false));
  }

  function validate() {
    const next = {};
    if (!motivation.trim()) {
      next.motivation = 'Vul je motivatie in';
    }
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const picked = new Date(startDate);
    picked.setHours(0, 0, 0, 0);
    if (picked < now) {
      next.date = 'De startdatum moet in de toekomst liggen';
    }
    setErrors(next);

    if (Object.keys(next).length > 0) {
      const firstKey = Object.keys(next)[0];
      AccessibilityInfo.announceForAccessibility(next[firstKey]);
      if (firstKey === 'motivation') motivationRef.current?.focus?.();
    }

    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    setErrors((c) => ({ ...c, submit: null }));

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const senderId = userData?.user?.id;
      if (!senderId) throw new Error('Je bent niet ingelogd. Log opnieuw in en probeer het opnieuw.');

      const { data: existing, error: checkError } = await supabase
        .from('aanvragen')
        .select('id, status')
        .eq('perceel_id', perceel?.id)
        .eq('sender_id', senderId)
        .not('status', 'in', '("declined","cancelled","ended")')
        .maybeSingle();

      if (checkError) throw checkError;

      if (existing) {
        const statusLabel = {
          pending: 'nog in behandeling',
          accepted: 'al geaccepteerd',
          confirmed: 'al bevestigd',
        }[existing.status] ?? 'al ingediend';
        throw new Error(`Je hebt al een aanvraag voor dit perceel die ${statusLabel} is.`);
      }

      const row = {
        perceel_id: perceel?.id,
        sender_id: senderId,
        motivation: motivation.trim(),
        type_samenwerking:
          Array.isArray(perceel?.voorkeur_samenwerking) && perceel.voorkeur_samenwerking.length > 0
            ? perceel.voorkeur_samenwerking.join(', ')
            : null,
        availability,
        start_date: startDate.toISOString().split('T')[0],
        status: AANVRAAG_STATUS.PENDING,
      };

      const { error: insertError } = await supabase.from('aanvragen').insert(row);
      if (insertError) throw insertError;

      onContinue?.({ success: true });
    } catch (err) {
      console.error('Aanvraag submit error:', err);
      const message = err?.message || 'Aanvraag kon niet worden verzonden. Probeer opnieuw.';
      setErrors((c) => ({ ...c, submit: message }));
      AccessibilityInfo.announceForAccessibility(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Header title="Aanvraag sturen" onBack={onBack} backLabel="Terug" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <PerceelSummaryCard perceel={perceel} />

          <SectionCard>
            <SectionHeader icon={PencilSimpleIcon} title="Motivatie" />
            <AuthTextArea
              ref={motivationRef}
              value={motivation}
              onChangeText={setMotivation}
              placeholder="Schrijf hier waarom je geïnteresseerd bent in dit perceel..."
              height={160}
              maxLength={300}
              error={!!errors.motivation}
              accessibilityLabel="Motivatie"
              accessibilityHint="Schrijf waarom je geïnteresseerd bent in dit perceel"
            />
            {errors.motivation ? <FieldError message={errors.motivation} /> : null}
          </SectionCard>

          <SectionCard>
            <SectionHeader icon={CalendarBlankIcon} title="Beschikbaarheid" />
            <WeekdaySelector value={availability} onChange={setAvailability} />
          </SectionCard>

          <SectionCard>
            <SectionHeader icon={CalendarCheckIcon} title="Gewenste startdatum" />
            <View style={styles.dateBlocks}>
              {[
                { label: 'Dag', value: String(startDate.getDate()).padStart(2, '0'), a11y: `Dag: ${startDate.getDate()}` },
                { label: 'Maand', value: startDate.toLocaleDateString('nl-BE', { month: 'long' }), a11y: `Maand: ${startDate.toLocaleDateString('nl-BE', { month: 'long' })}` },
                { label: 'Jaar', value: String(startDate.getFullYear()), a11y: `Jaar: ${startDate.getFullYear()}` },
              ].map((block) => (
                <Pressable
                  key={block.label}
                  style={[styles.dateBlock, showDatePicker && styles.dateBlockActive]}
                  onPress={openDatePicker}
                  accessibilityRole="button"
                  accessibilityLabel={`${block.a11y}. Tik om de datum te wijzigen`}
                >
                  <Text style={styles.dateBlockLabel}>{block.label}</Text>
                  <Text
                    style={[styles.dateBlockValue, showDatePicker && styles.dateBlockValueActive]}
                    adjustsFontSizeToFit
                    numberOfLines={1}
                  >
                    {block.value}
                  </Text>
                </Pressable>
              ))}
            </View>
            {errors.date ? <FieldError message={errors.date} /> : null}
          </SectionCard>

          {errors.submit ? <FieldError message={errors.submit} /> : null}

          <AuthButton label="Stuur verzoek" onPress={handleSubmit} variant="primary" loading={loading} />
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showDatePicker}
        transparent
        animationType="none"
        onRequestClose={closeDatePicker}
      >
        <Pressable style={styles.backdrop} onPress={closeDatePicker} />
        <Animated.View
          style={[styles.sheet, { paddingBottom: insets.bottom + SPACING.md, transform: [{ translateY: sheetAnim }] }]}
        >
          <View style={styles.sheetHandle} />
          <DateTimePicker
            value={startDate}
            mode="date"
            display="spinner"
            onChange={(_, selected) => { if (selected) setStartDate(selected); }}
            minimumDate={today}
            locale="nl-BE"
          />
          <View style={styles.sheetDoneWrap}>
            <Pressable
              style={styles.sheetDoneBtn}
              onPress={closeDatePicker}
              accessibilityRole="button"
              accessibilityLabel="Datum bevestigen"
            >
              <Text style={styles.sheetDoneText}>Klaar</Text>
            </Pressable>
          </View>
        </Animated.View>
      </Modal>
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
  content: {
    paddingHorizontal: SPACING.screenX,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
    gap: SPACING.lg,
  },
  dateBlocks: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  dateBlock: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    gap: SPACING.xxs,
    minHeight: 60,
    justifyContent: 'center',
  },
  dateBlockActive: {
    borderColor: COLORS.brand,
  },
  dateBlockLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xxs,
    color: COLORS.textSecondary,
  },
  dateBlockValue: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
  },
  dateBlockValueActive: {
    color: COLORS.brand,
  },
  backdrop: {
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
  sheetDoneText: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.textInverse,
  },
});
