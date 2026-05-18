import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, AccessibilityInfo } from 'react-native';
import { ArrowLeft } from 'phosphor-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../components/theme/tokens';
import AuthButton from '../../components/buttons/AuthButton';
import FieldError from '../../components/notifications/FieldError';
import { supabase } from '../../services/supabase';
import AuthTextField from '../../components/auth/AuthTextField';
import MOCK_PERCEEL from '../../mocks/perceelMock';

const WEEKDAYS = ['Ma', 'DI', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];

export default function AanvraagDoenScreen({ onBack, onContinue, perceel, profile }) {
  perceel = perceel || MOCK_PERCEEL;
  const [motivation, setMotivation] = useState('');
  const [type, setType] = useState('Onderhoud helpen');
  const [availability, setAvailability] = useState([]);
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const motivationRef = useRef(null);
  const dayRef = useRef(null);

  useEffect(() => {
    if (!profile) {
      (async () => {
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          const { data: p } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
          if (p) {
            profile = p;
          }
        }
      })();
    }
  }, []);

  function toggleDay(d) {
    setAvailability((prev) => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  }

  function validate() {
    const next = {};
    if (!motivation || motivation.trim().length === 0) next.motivation = 'Vul je motivatie in';
    if (!type) next.type = 'Kies een type samenwerking';
    if (!day || !month || !year) next.date = 'Kies een startdatum';
    setErrors(next);
    if (Object.keys(next).length > 0) {
      const firstKey = Object.keys(next)[0];
      AccessibilityInfo.announceForAccessibility(next[firstKey]);
      // focus first invalid
      if (firstKey === 'motivation' && motivationRef.current) motivationRef.current.focus();
      else if (firstKey === 'date' && dayRef.current) dayRef.current.focus();
    }
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    try {
      // TODO: Replace mock submit with real Supabase insert when `requests` table exists.
      const payload = {
        perceel_id: perceel?.id || null,
        user_id: profile?.id || null,
        motivation: motivation.trim(),
        type,
        availability,
        start_date: `${year}-${month.padStart(2,'0')}-${day.padStart(2,'0')}`,
        status: 'pending',
      };
      // Log payload for now to allow testing without backend
      console.log('Submitting aanvraag (mock):', payload);
      // simulate success
      setTimeout(() => {
        setLoading(false);
        onContinue?.({ success: true });
      }, 700);
      return;
    } catch (err) {
      setErrors({ submit: err.message || 'Netwerkfout' });
      AccessibilityInfo.announceForAccessibility(err.message || 'Netwerkfout');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.back} accessibilityRole="button">
          <ArrowLeft size={20} color={COLORS.textInverse} />
          <Text style={styles.backText}>Terug</Text>
        </Pressable>
        <Text accessibilityRole="header" style={styles.title}>Aanvraag sturen</Text>
      </View>

      {perceel ? (
        <View style={styles.card} accessible accessibilityRole="summary">
          <Text style={styles.cardTitle}>{perceel.title || 'Perceel'}</Text>
          <Text style={styles.cardMeta}>{perceel.size ? `${perceel.size}m²` : ''} {perceel.location ? `• ${perceel.location}` : ''}</Text>
          <Text style={styles.cardDesc}>{perceel.description}</Text>
        </View>
      ) : null}

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Motivatie (max 300 tekens):</Text>
        <View style={styles.textareaWrap}>
          <TextInput
            ref={motivationRef}
            value={motivation}
            onChangeText={setMotivation}
            placeholder="Typ hier je motivatie..."
            multiline
            accessibilityLabel="Motivatie"
            accessibilityHint="Schrijf hier waarom je geïnteresseerd bent in dit perceel"
            maxLength={300}
            style={styles.textarea}
          />
        </View>
        {errors.motivation ? <FieldError message={errors.motivation} /> : null}
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Type samenwerking:</Text>
        <View style={styles.typeSelect}>
          {['Onderhoud helpen','Oogst delen','Andere dienst'].map((opt) => (
            <Pressable
              key={opt}
              onPress={() => setType(opt)}
              style={[styles.typeOption, type === opt && styles.typeOptionActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: type === opt }}
            >
              <Text style={[styles.typeText, type === opt && styles.typeTextActive]}>{opt}</Text>
            </Pressable>
          ))}
        </View>
        {errors.type ? <FieldError message={errors.type} /> : null}
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Beschikbaarheid:</Text>
        <View style={styles.weekdays}>
          {WEEKDAYS.map((d) => (
            <Pressable
              key={d}
              onPress={() => toggleDay(d)}
              style={[styles.dayPill, availability.includes(d) && styles.dayPillActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: availability.includes(d) }}
            >
              <Text style={[styles.dayText, availability.includes(d) && styles.dayTextActive]}>{d}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Gewenste start datum:</Text>
        <View style={styles.dateRow}>
          <AuthTextField label="Dag" value={day} onChangeText={setDay} placeholder="DD" halfWidth onBlur={() => {}} accessibilityLabel="Dag" ref={dayRef} />
          <AuthTextField label="Maand" value={month} onChangeText={setMonth} placeholder="MM" halfWidth onBlur={() => {}} accessibilityLabel="Maand" />
          <AuthTextField label="Jaar" value={year} onChangeText={setYear} placeholder="YYYY" halfWidth onBlur={() => {}} accessibilityLabel="Jaar" />
        </View>
        {errors.date ? <FieldError message={errors.date} /> : null}
      </View>

      {errors.submit ? <FieldError message={errors.submit} /> : null}

      <View style={styles.footer}>
        <AuthButton label="Stuur verzoek" onPress={handleSubmit} variant="primary" disabled={loading} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.lg },
  header: { backgroundColor: COLORS.brand, paddingTop: 40, paddingBottom: 12, paddingHorizontal: SPACING.md, marginBottom: SPACING.md },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  backText: { color: COLORS.textInverse, fontFamily: FONTS.displayMedium, fontSize: 16 },
  title: { color: COLORS.textInverse, fontFamily: FONTS.displaySemiBold, fontSize: 20, textAlign: 'center' },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md },
  cardTitle: { fontFamily: FONTS.displaySemiBold, fontSize: 16, color: COLORS.textPrimary, marginBottom: 4 },
  cardMeta: { fontFamily: FONTS.body, fontSize: 12.8, color: COLORS.textSecondary, marginBottom: 8 },
  cardDesc: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.textPrimary },
  fieldGroup: { marginBottom: SPACING.lg },
  label: { fontFamily: FONTS.displayMedium, fontSize: 16, color: COLORS.textPrimary, marginBottom: SPACING.xs },
  textareaWrap: { backgroundColor: 'rgba(87,98,56,0.05)', borderRadius: 8, padding: 8, minHeight: 120 },
  textarea: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.textPrimary, minHeight: 120, textAlignVertical: 'top' },
  typeSelect: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },
  typeOption: { backgroundColor: 'rgba(87,98,56,0.05)', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, minWidth: 100, minHeight: 44, justifyContent: 'center' },
  typeOptionActive: { borderWidth: 1, borderColor: COLORS.brand, backgroundColor: 'rgba(87,98,56,0.08)' },
  typeText: { fontFamily: FONTS.body, fontSize: 16, color: COLORS.textPrimary },
  typeTextActive: { color: COLORS.brand },
  weekdays: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },
  dayPill: { borderWidth: 1, borderColor: COLORS.border, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 83, minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  dayPillActive: { borderColor: COLORS.brand, backgroundColor: 'rgba(87,98,56,0.05)' },
  dayText: { fontFamily: FONTS.bodyMedium, fontSize: 16, color: COLORS.textPrimary },
  dayTextActive: { color: COLORS.brand },
  dateRow: { flexDirection: 'row', gap: SPACING.sm },
  footer: { marginTop: SPACING.md, marginBottom: SPACING.lg },
});
