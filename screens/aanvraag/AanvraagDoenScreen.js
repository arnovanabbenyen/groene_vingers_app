import React, { useRef, useState } from 'react';
import { AccessibilityInfo, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarBlankIcon, CalendarCheckIcon, PencilSimpleIcon } from 'phosphor-react-native';
import Header from '../../components/navigation/Header';
import SectionCard from '../../components/parcel/SectionCard';
import SectionHeader from '../../components/parcel/SectionHeader';
import AuthTextArea from '../../components/auth/AuthTextArea';
import AuthButton from '../../components/buttons/AuthButton';
import FieldError from '../../components/notifications/FieldError';
import PerceelSummaryCard from '../../components/aanvraag/PerceelSummaryCard';
import WeekdaySelector from '../../components/aanvraag/WeekdaySelector';
import DateBlockSelector from '../../components/aanvraag/DateBlockSelector';
import { supabase } from '../../services/supabase';
import { AANVRAAG_STATUS } from '../../services/aanvraagStatus';
import { COLORS, SPACING } from '../../components/theme/tokens';
import MOCK_PERCEEL from '../../mocks/perceelMock';

export default function AanvraagDoenScreen({ onBack, onContinue, perceel }) {
  if (!perceel && !__DEV__) {
    console.warn('AanvraagDoenScreen is using MOCK_PERCEEL fallback in production.');
  }
  perceel = perceel || MOCK_PERCEEL;

  const today = new Date();
  const motivationRef = useRef(null);
  const scrollRef = useRef(null);
  const motivationY = useRef(0);

  const [motivation, setMotivation] = useState('');
  const [availability, setAvailability] = useState([]);
  const [startDate, setStartDate] = useState(today);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const next = {};
    if (!motivation.trim()) {
      next.motivation = 'Vul je motivatie in';
    }
    if (availability.length === 0) {
      next.availability = 'Selecteer minstens één beschikbare dag';
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
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <PerceelSummaryCard perceel={perceel} />

          <View onLayout={(e) => { motivationY.current = e.nativeEvent.layout.y; }}>
            <SectionCard>
              <SectionHeader icon={PencilSimpleIcon} title="Motivatie" />
              <AuthTextArea
                ref={motivationRef}
                value={motivation}
                onChangeText={setMotivation}
                onFocus={() => {
                  setTimeout(() => {
                    scrollRef.current?.scrollTo({ y: motivationY.current, animated: true });
                  }, 150);
                }}
                placeholder="Schrijf hier waarom je geïnteresseerd bent in dit perceel..."
                height={160}
                maxLength={300}
                error={!!errors.motivation}
                accessibilityLabel="Motivatie"
                accessibilityHint="Schrijf waarom je geïnteresseerd bent in dit perceel"
              />
              {errors.motivation ? <FieldError message={errors.motivation} /> : null}
            </SectionCard>
          </View>

          <SectionCard>
            <SectionHeader icon={CalendarBlankIcon} title="Beschikbaarheid" />
            <WeekdaySelector value={availability} onChange={setAvailability} />
            {errors.availability ? <FieldError message={errors.availability} /> : null}
          </SectionCard>

          <SectionCard>
            <SectionHeader icon={CalendarCheckIcon} title="Gewenste startdatum" />
            <DateBlockSelector
              value={startDate}
              onChange={setStartDate}
              minimumDate={today}
            />
            {errors.date ? <FieldError message={errors.date} /> : null}
          </SectionCard>

          {errors.submit ? <FieldError message={errors.submit} /> : null}

          <AuthButton label="Stuur verzoek" onPress={handleSubmit} variant="primary" loading={loading} />
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
  content: {
    paddingHorizontal: SPACING.screenX,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
    gap: SPACING.lg,
  },
});
