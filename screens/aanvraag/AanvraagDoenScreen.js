import React, { useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  ArrowLeftIcon,
  CaretDownIcon,
  DropIcon,
  LeafIcon,
  MapPinIcon,
  ShovelIcon,
  StarIcon,
  TreeIcon,
} from 'phosphor-react-native';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../../components/theme/tokens';
import AuthButton from '../../components/buttons/AuthButton';
import FieldError from '../../components/notifications/FieldError';
import { supabase } from '../../services/supabase';
import MOCK_PERCEEL from '../../mocks/perceelMock';

const WEEKDAYS = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];
const TYPE_OPTIONS = ['Onderhoud helpen', 'Deel van oogst afstaan', 'Andere dienst'];

function normalizeSize(rawSize) {
  if (!rawSize) return '';
  const asText = String(rawSize);
  return asText.includes('m²') ? asText : `${asText}m²`;
}

function getPerceelItems(perceel) {
  const chips = Array.isArray(perceel?.chips) ? perceel.chips.filter(Boolean) : [];
  const voorzieningen = Array.isArray(perceel?.voorzieningen) ? perceel.voorzieningen.filter(Boolean) : [];
  const distance = perceel?.distance || chips.find((item) => String(item).includes('km')) || null;
  const firstAmenity = voorzieningen[0] || chips.find((item) => !String(item).includes('km')) || 'Water';
  const secondAmenity = voorzieningen[1] || chips.find((item, index) => !String(item).includes('km') && item !== firstAmenity && index > 0) || 'Materiaal';
  return [firstAmenity, secondAmenity, distance || '2,8km'];
}

function AmenityIcon({ label }) {
  const normalized = String(label || '').toLowerCase();

  if (normalized.includes('water')) {
    return <DropIcon size={16} color={COLORS.textPrimary} weight="regular" />;
  }

  if (normalized.includes('tool') || normalized.includes('materiaal')) {
    return <ShovelIcon size={16} color={COLORS.textPrimary} weight="regular" />;
  }

  if (normalized.includes('boom')) {
    return <TreeIcon size={16} color={COLORS.textPrimary} weight="regular" />;
  }

  if (normalized.includes('km')) {
    return <MapPinIcon size={16} color={COLORS.textPrimary} weight="regular" />;
  }

  return <LeafIcon size={16} color={COLORS.textPrimary} weight="regular" />;
}

function DropdownField({
  label,
  value,
  onPress,
  expanded,
  accessibilityLabel,
  accessibilityHint,
  testRef,
  compact = false,
}) {
  return (
    <View style={compact ? styles.dateField : styles.fieldGroup}>
      {!compact ? <Text style={styles.sectionTitle}>{label}</Text> : null}
      <Pressable
        ref={testRef}
        onPress={onPress}
        style={compact ? styles.dateDropdown : styles.dropdown}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ expanded }}
      >
        <Text style={compact ? styles.dateDropdownText : styles.dropdownText}>{value}</Text>
        <CaretDownIcon size={16} color={COLORS.textPrimary} weight="regular" />
      </Pressable>
    </View>
  );
}

export default function AanvraagDoenScreen({ onBack, onContinue, perceel }) {
  if (!perceel && !__DEV__) {
    console.warn('AanvraagDoenScreen is using MOCK_PERCEEL fallback in production.');
  }
  perceel = perceel || MOCK_PERCEEL;

  const today = new Date();
  const currentYear = today.getFullYear();

  const [motivation, setMotivation] = useState('');
  const [type, setType] = useState(TYPE_OPTIONS[0]);
  const [availability, setAvailability] = useState([]);
  const [day, setDay] = useState(String(today.getDate()));
  const [month, setMonth] = useState(String(today.getMonth() + 1).padStart(2, '0'));
  const [year, setYear] = useState(String(currentYear));
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerType, setPickerType] = useState('type');
  const [heroImageError, setHeroImageError] = useState(false);

  const motivationRef = useRef(null);
  const dayDropdownRef = useRef(null);

  const dayOptions = useMemo(
    () => Array.from({ length: 31 }, (_, index) => String(index + 1)),
    [],
  );
  const monthOptions = useMemo(
    () => Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0')),
    [],
  );
  const yearOptions = useMemo(
    () => [String(currentYear), String(currentYear + 1), String(currentYear + 2)],
    [currentYear],
  );

  const perceelItems = useMemo(() => getPerceelItems(perceel), [perceel]);

  const heroSource = useMemo(() => {
    const firstPhoto = Array.isArray(perceel.fotos) && perceel.fotos[0] ? perceel.fotos[0] : perceel.image;
    return typeof firstPhoto === 'string' ? { uri: firstPhoto } : firstPhoto;
  }, [perceel.fotos, perceel.image]);

  const hasHeroImage = Boolean(heroSource?.uri || heroSource);

  const pickerOptions = useMemo(() => {
    if (pickerType === 'type') return TYPE_OPTIONS;
    if (pickerType === 'day') return dayOptions;
    if (pickerType === 'month') return monthOptions;
    return yearOptions;
  }, [pickerType, dayOptions, monthOptions, yearOptions]);

  function openPicker(kind) {
    setPickerType(kind);
    setIsPickerOpen(true);
  }

  function closePicker() {
    setIsPickerOpen(false);
  }

  function selectPickerValue(value) {
    if (pickerType === 'type') setType(value);
    if (pickerType === 'day') setDay(value);
    if (pickerType === 'month') setMonth(value);
    if (pickerType === 'year') setYear(value);
    closePicker();
  }

  function toggleDay(label) {
    setAvailability((current) => (
      current.includes(label)
        ? current.filter((item) => item !== label)
        : [...current, label]
    ));
  }

  function validate() {
    const next = {};
    if (!motivation || motivation.trim().length === 0) {
      next.motivation = 'Vul je motivatie in';
    }
    if (!type) {
      next.type = 'Kies een type samenwerking';
    }
    if (!day || !month || !year) {
      next.date = 'Kies een startdatum';
    } else {
      const dayNumber = parseInt(day, 10);
      const monthNumber = parseInt(month, 10);
      const yearNumber = parseInt(year, 10);
      const chosenDate = new Date(yearNumber, monthNumber - 1, dayNumber);
      const isValidDate = chosenDate.getFullYear() === yearNumber
        && chosenDate.getMonth() === monthNumber - 1
        && chosenDate.getDate() === dayNumber;

      if (!isValidDate) {
        next.date = 'Kies een geldige startdatum';
      } else {
        const todayAtMidnight = new Date();
        todayAtMidnight.setHours(0, 0, 0, 0);
        if (chosenDate <= todayAtMidnight) {
          next.date = 'De gewenste startdatum moet in de toekomst liggen';
        }
      }
    }

    setErrors(next);

    if (Object.keys(next).length > 0) {
      const firstKey = Object.keys(next)[0];
      AccessibilityInfo.announceForAccessibility(next[firstKey]);
      if (firstKey === 'motivation') {
        motivationRef.current?.focus?.();
      } else if (firstKey === 'date') {
        dayDropdownRef.current?.focus?.();
      }
    }

    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    setErrors((current) => ({ ...current, submit: null }));

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const senderId = userData?.user?.id;
      if (!senderId) {
        throw new Error('Je bent niet ingelogd. Log opnieuw in en probeer het opnieuw.');
      }

      const startDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

      const row = {
        perceel_id: perceel?.id,
        sender_id: senderId,
        motivation: motivation.trim(),
        type_samenwerking: type,
        availability,
        start_date: startDate,
        status: 'pending',
      };

      console.log('Submitting aanvraag:', row);

      const { error: insertError } = await supabase
        .from('aanvragen')
        .insert(row);

      if (insertError) throw insertError;

      onContinue?.({ success: true });
    } catch (err) {
      console.error('Aanvraag submit error:', err);
      const message = err?.message || 'Aanvraag kon niet worden verzonden. Probeer opnieuw.';
      setErrors((current) => ({ ...current, submit: message }));
      AccessibilityInfo.announceForAccessibility(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Terug" accessibilityHint="Ga terug naar de perceeldetails">
          <ArrowLeftIcon size={24} color={COLORS.textInverse} weight="regular" />
          <Text style={styles.backText}>Terug</Text>
        </Pressable>
        <Text accessibilityRole="header" style={styles.headerTitle}>Aanvraag sturen</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryCard} accessible accessibilityRole="summary">
          <View style={styles.summaryImageWrap}>
            {hasHeroImage && !heroImageError ? (
              <Image source={heroSource} style={styles.summaryImage} resizeMode="cover" onError={() => setHeroImageError(true)} />
            ) : (
              <View style={[styles.summaryImage, styles.summaryImagePlaceholder]}>
                <LeafIcon size={36} color={COLORS.brand} weight="regular" />
              </View>
            )}

            <View style={[styles.pill, styles.locationPill]}>
              <MapPinIcon size={16} color={COLORS.textPrimary} weight="regular" />
              <Text style={styles.pillText}>{perceel.location || perceel.plaats || 'Locatie onbekend'}</Text>
            </View>

            <View style={[styles.pill, styles.scorePill]}>
              <StarIcon size={14} color={COLORS.accent} weight="fill" />
              <Text style={styles.pillText}>4,5</Text>
            </View>
          </View>

          <View style={styles.summaryTitleRow}>
            <Text style={styles.summaryTitle}>{perceel.title || 'Perceel'}</Text>
            <Text style={styles.summarySize}>{normalizeSize(perceel.size)}</Text>
          </View>

          <Text style={styles.summaryDescription}>{perceel.description || 'Geen beschrijving'}</Text>

          <View style={styles.summaryMetaRow}>
            {perceelItems.map((item, index) => (
              <View key={`${item}-${index}`} style={styles.summaryMetaItemWrap}>
                <View style={styles.summaryMetaItem}>
                  <AmenityIcon label={item} />
                  <Text style={styles.summaryMetaText}>{item}</Text>
                </View>
                {index < perceelItems.length - 1 ? <View style={styles.summaryDivider} /> : null}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Motivatie (max 300 tekens):</Text>
          <View style={styles.textAreaShell}>
            <TextInput
              ref={motivationRef}
              value={motivation}
              onChangeText={setMotivation}
              placeholder="Typ hier je motivatie..."
              placeholderTextColor={COLORS.textSecondary}
              multiline
              maxLength={300}
              style={styles.textAreaInput}
              accessibilityLabel="Motivatie"
              accessibilityHint="Schrijf waarom je geïnteresseerd bent in dit perceel"
            />
          </View>
          {errors.motivation ? <FieldError message={errors.motivation} /> : null}
        </View>

        <View style={styles.formSection}>
          <DropdownField
            label="Type samenwerking:"
            value={type}
            onPress={() => openPicker('type')}
            expanded={isPickerOpen && pickerType === 'type'}
            accessibilityLabel="Type samenwerking"
            accessibilityHint="Open de keuzelijst voor type samenwerking"
          />
          {errors.type ? <FieldError message={errors.type} /> : null}
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Beschikbaarheid:</Text>
          <View style={styles.weekdayRow}>
            {WEEKDAYS.map((weekday) => {
              const isSelected = availability.includes(weekday);
              return (
                <Pressable
                  key={weekday}
                  onPress={() => toggleDay(weekday)}
                  style={[styles.weekdayPill, isSelected && styles.weekdayPillSelected]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`Beschikbaarheid ${weekday}`}
                  accessibilityHint={`Markeer ${weekday} als beschikbaar`}
                >
                  <Text style={[styles.weekdayText, isSelected && styles.weekdayTextSelected]}>{weekday}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Gewenste start datum:</Text>
          <View style={styles.dateRow}>
            <DropdownField
              compact
              value={day}
              onPress={() => openPicker('day')}
              expanded={isPickerOpen && pickerType === 'day'}
              accessibilityLabel="Startdatum dag"
              accessibilityHint="Open de keuzelijst voor dag"
              testRef={dayDropdownRef}
            />
            <DropdownField
              compact
              value={month}
              onPress={() => openPicker('month')}
              expanded={isPickerOpen && pickerType === 'month'}
              accessibilityLabel="Startdatum maand"
              accessibilityHint="Open de keuzelijst voor maand"
            />
            <DropdownField
              compact
              value={year}
              onPress={() => openPicker('year')}
              expanded={isPickerOpen && pickerType === 'year'}
              accessibilityLabel="Startdatum jaar"
              accessibilityHint="Open de keuzelijst voor jaar"
            />
          </View>
          {errors.date ? <FieldError message={errors.date} /> : null}
        </View>

        {errors.submit ? <FieldError message={errors.submit} /> : null}

        <AuthButton
          label="Stuur verzoek"
          onPress={handleSubmit}
          variant="primary"
          loading={loading}
        />
      </ScrollView>

      <Modal
        visible={isPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={closePicker}
      >
        <Pressable style={styles.modalBackdrop} onPress={closePicker}>
          <Pressable style={styles.modalSheet} onPress={() => {}} accessibilityRole="dialog">
            <Text style={styles.modalTitle}>
              {pickerType === 'type'
                ? 'Type samenwerking'
                : pickerType === 'day'
                ? 'Kies dag'
                : pickerType === 'month'
                ? 'Kies maand'
                : 'Kies jaar'}
            </Text>

            {pickerOptions.map((option) => {
              const selected = (pickerType === 'type' && option === type)
                || (pickerType === 'day' && option === day)
                || (pickerType === 'month' && option === month)
                || (pickerType === 'year' && option === year);

              return (
                <Pressable
                  key={option}
                  onPress={() => selectPickerValue(option)}
                  style={[styles.modalOption, selected && styles.modalOptionSelected]}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={option}
                >
                  <Text style={[styles.modalOptionText, selected && styles.modalOptionTextSelected]}>{option}</Text>
                </Pressable>
              );
            })}

            <Pressable onPress={closePicker} style={styles.modalCloseButton} accessibilityRole="button" accessibilityLabel="Sluit keuzelijst">
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
  header: {
    backgroundColor: COLORS.brand,
    paddingTop: 64,
    paddingBottom: 18,
    paddingHorizontal: SPACING.screenX,
  },
  backButton: {
    position: 'absolute',
    left: SPACING.screenX,
    top: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  backText: {
    color: COLORS.textInverse,
    fontSize: 16,
    lineHeight: 16,
    fontFamily: FONTS.displayMedium,
  },
  headerTitle: {
    color: COLORS.textInverse,
    fontSize: 20,
    lineHeight: 20,
    fontFamily: FONTS.displaySemiBold,
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.screenX,
    paddingTop: SPACING.lg,
    paddingBottom: 24,
    gap: SPACING.xl,
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    gap: SPACING.md,
    ...SHADOWS.card,
  },
  summaryImageWrap: {
    width: '100%',
    height: 201,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  summaryImage: {
    width: '100%',
    height: '100%',
  },
  summaryImagePlaceholder: {
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  locationPill: {
    left: 8,
    bottom: 8,
  },
  scorePill: {
    right: 8,
    bottom: 8,
  },
  pillText: {
    color: COLORS.textPrimary,
    fontSize: 12.8,
    lineHeight: 13,
    fontFamily: FONTS.body,
  },
  summaryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  summaryTitle: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 16,
    lineHeight: 16,
    fontFamily: FONTS.displayMedium,
  },
  summarySize: {
    color: COLORS.textPrimary,
    fontSize: 12.8,
    lineHeight: 13,
    fontFamily: FONTS.body,
  },
  summaryDescription: {
    color: COLORS.textPrimary,
    fontSize: 16,
    lineHeight: 16,
    fontFamily: FONTS.body,
    textAlign: 'left',
  },
  summaryMetaRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryMetaItemWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  summaryMetaText: {
    color: COLORS.textPrimary,
    fontSize: 12.8,
    lineHeight: 13,
    fontFamily: FONTS.body,
  },
  summaryDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: COLORS.border,
    marginLeft: 8,
  },
  formSection: {
    gap: SPACING.md,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    lineHeight: 20,
    fontFamily: FONTS.displaySemiBold,
    fontWeight: '600',
  },
  textAreaShell: {
    backgroundColor: 'rgba(87,98,56,0.05)',
    borderRadius: 8,
    minHeight: 216,
    padding: 8,
  },
  textAreaInput: {
    minHeight: 200,
    color: COLORS.textPrimary,
    fontSize: 16,
    lineHeight: 24,
    fontFamily: FONTS.body,
    textAlignVertical: 'top',
  },
  dropdown: {
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(87,98,56,0.05)',
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    lineHeight: 16,
    fontFamily: FONTS.displaySemiBold,
  },
  weekdayRow: {
    flexDirection: 'row',
    gap: 8,
  },
  weekdayPill: {
    flex: 1,
    minHeight: 32,
    borderRadius: 83,
    borderWidth: 3,
    borderColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  weekdayPillSelected: {
    backgroundColor: COLORS.brand,
  },
  weekdayText: {
    color: COLORS.brand,
    fontSize: 16,
    lineHeight: 16,
    fontFamily: FONTS.bodyMedium,
  },
  weekdayTextSelected: {
    color: COLORS.textInverse,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dateField: {
    flex: 1,
  },
  dateDropdown: {
    height: 34,
    borderRadius: 4,
    backgroundColor: 'rgba(87,98,56,0.05)',
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  dateDropdownText: {
    color: '#000000',
    fontSize: 16,
    lineHeight: 16,
    fontFamily: FONTS.bodyMedium,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  modalTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    lineHeight: 22,
    fontFamily: FONTS.displaySemiBold,
    marginBottom: SPACING.xs,
  },
  modalOption: {
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
  },
  modalOptionSelected: {
    backgroundColor: 'rgba(87,98,56,0.08)',
  },
  modalOptionText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    lineHeight: 20,
    fontFamily: FONTS.body,
  },
  modalOptionTextSelected: {
    color: COLORS.brand,
    fontFamily: FONTS.bodyMedium,
  },
  modalCloseButton: {
    marginTop: SPACING.sm,
    height: 44,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.brand,
  },
  modalCloseText: {
    color: COLORS.brand,
    fontSize: 16,
    lineHeight: 16,
    fontFamily: FONTS.displayMedium,
  },
});
