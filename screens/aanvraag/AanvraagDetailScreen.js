import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ArrowLeftIcon, ArchiveIcon, CarIcon, CheckCircleIcon, DropIcon, LeafIcon, LightningIcon, MapPinIcon, StarIcon, ToiletIcon, ToolboxIcon, WifiHighIcon } from 'phosphor-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../services/supabase';
import { COLORS, FONTS, RADIUS, SPACING } from '../../components/theme/tokens';
import { RequestAvatar } from '../../components/aanvraag/AanvraagCard';

const DAGEN = [
  { key: 'ma', label: 'Ma', fullLabel: 'Maandag' },
  { key: 'di', label: 'Di', fullLabel: 'Dinsdag' },
  { key: 'wo', label: 'Wo', fullLabel: 'Woensdag' },
  { key: 'do', label: 'Do', fullLabel: 'Donderdag' },
  { key: 'vr', label: 'Vr', fullLabel: 'Vrijdag' },
  { key: 'za', label: 'Za', fullLabel: 'Zaterdag' },
  { key: 'zo', label: 'Zo', fullLabel: 'Zondag' },
];

const VOORZIENING_ICONS = {
  water: DropIcon,
  elektriciteit: LightningIcon,
  wifi: WifiHighIcon,
  gereedschap: ToolboxIcon,
  materiaal: ToolboxIcon,
  tools: ToolboxIcon,
  opslag: ArchiveIcon,
  parkeergelegenheid: CarIcon,
  toilet: ToiletIcon,
  zaden: LeafIcon,
  bomen: LeafIcon,
};

const warnedVoorzieningen = new Set();

function capitalizeFirstLetter(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function getAvailabilityLabel(key) {
  const item = DAGEN.find((dag) => dag.key === key.toLowerCase());
  return item?.fullLabel || capitalizeFirstLetter(key);
}

function getVoorzieningIcon(label) {
  const normalized = String(label || '').trim().toLowerCase();
  const Icon = VOORZIENING_ICONS[normalized];

  if (Icon) return Icon;

  if (!warnedVoorzieningen.has(normalized)) {
    warnedVoorzieningen.add(normalized);
    console.warn(`Unknown voorziening value: ${label}`);
  }

  return CheckCircleIcon;
}

function formatTypeSamenwerking(value) {
  return capitalizeFirstLetter(value);
}

function parseStartDate(value) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export default function AanvraagDetailScreen({ aanvraag, onBack, onActionComplete }) {
  const insets = useSafeAreaInsets();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingAction, setProcessingAction] = useState(null);

  const sender = aanvraag?.sender || null;
  const perceel = aanvraag?.perceel || null;
  const senderName = [sender?.first_name, sender?.last_name].filter(Boolean).join(' ').trim() || 'Aanvrager';
  const perceelPlace = perceel?.plaats || '';
  const placeLine = perceelPlace ? `${perceelPlace} · 2,8km` : '2,8km';
  const locationLabel = perceel?.plaats || perceel?.naam || 'Perceel';
  const selectedDays = useMemo(() => (aanvraag?.availability || []).map((day) => String(day).toLowerCase()), [aanvraag?.availability]);
  const startDate = parseStartDate(aanvraag?.start_date);
  const startDateParts = startDate
    ? {
        dd: String(startDate.getDate()).padStart(2, '0'),
        mm: String(startDate.getMonth() + 1).padStart(2, '0'),
        yyyy: String(startDate.getFullYear()),
      }
    : { dd: '--', mm: '--', yyyy: '----' };
  const perceelPhoto = Array.isArray(perceel?.fotos) ? perceel.fotos[0] : null;

  async function handleAccept() {
    setIsProcessing(true);
    setProcessingAction('accept');

    const { error } = await supabase
      .from('aanvragen')
      .update({
        status: 'accepted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', aanvraag.id);

    setIsProcessing(false);
    setProcessingAction(null);

    if (error) {
      Alert.alert('Fout', 'De aanvraag kon niet worden geaccepteerd. Probeer opnieuw.');
      return;
    }

    Alert.alert('Aanvraag geaccepteerd', 'De aanvrager wordt hierover geïnformeerd.', [{ text: 'OK', onPress: () => {
      onActionComplete?.();
      onBack?.();
    }}]);
    // TODO: start a chat between sender and owner once chat feature exists
    // TODO: send push notification to sender confirming acceptance
  }

  async function handleDecline() {
    setIsProcessing(true);
    setProcessingAction('decline');

    const { error } = await supabase
      .from('aanvragen')
      .update({
        status: 'declined',
        updated_at: new Date().toISOString(),
      })
      .eq('id', aanvraag.id);

    setIsProcessing(false);
    setProcessingAction(null);

    if (error) {
      Alert.alert('Fout', 'De aanvraag kon niet worden geweigerd. Probeer opnieuw.');
      return;
    }

    Alert.alert('Aanvraag geweigerd', 'De aanvrager wordt hierover geïnformeerd.', [{ text: 'OK', onPress: () => {
      onActionComplete?.();
      onBack?.();
    }}]);
    // TODO: send push notification to sender with decline + optional reason
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Terug naar overzicht"
          >
            <ArrowLeftIcon size={20} color={COLORS.surface} weight="regular" />
            <Text style={styles.backLabel}>Terug</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle} accessibilityRole="header">Aanvraag</Text>
          <View style={styles.headerRightSpacer} />
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.senderSection}>
          <RequestAvatar sender={sender} />

          <View style={styles.senderTextWrap}>
            <View style={styles.senderNameRow}>
              <Text style={styles.senderName}>{senderName}</Text>
              <CheckCircleIcon size={16} color={COLORS.brand} weight="fill" style={styles.sealIcon} />
            </View>

            <View style={styles.senderMetaRow}>
              <MapPinIcon size={14} color={COLORS.textMuted} weight="regular" />
              <Text style={styles.senderMetaText}>{placeLine}</Text>
            </View>
          </View>

          <View style={styles.senderRatingWrap}>
            <StarIcon size={16} color="#FFB800" weight="fill" />
            <Text style={styles.senderRatingText}>4,5</Text>
          </View>
        </View>

        <View style={styles.photoSection}>
          {perceelPhoto ? (
            <Image source={{ uri: perceelPhoto }} style={styles.photo} resizeMode="cover" />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoPlaceholderText}>Geen foto beschikbaar</Text>
            </View>
          )}

          <View style={styles.photoBadgeLeft}>
            <MapPinIcon size={12} color={COLORS.brand} weight="fill" />
            <Text style={styles.photoBadgeText}>{locationLabel}</Text>
          </View>

          <View style={styles.photoBadgeRight}>
            <StarIcon size={12} color="#FFB800" weight="fill" />
            <Text style={styles.photoBadgeText}>4,5</Text>
          </View>
        </View>

        <View style={styles.voorzieningenRow}>
          {(perceel?.voorzieningen || []).map((voorziening, index) => {
            const Icon = getVoorzieningIcon(voorziening);
            const label = capitalizeFirstLetter(voorziening);

            return (
              <React.Fragment key={`${voorziening}-${index}`}>
                <View style={styles.voorzieningItem}>
                  <Icon size={18} color={COLORS.brand} weight="regular" />
                  <Text style={styles.voorzieningLabel}>{label}</Text>
                </View>
                {index < (perceel?.voorzieningen || []).length - 1 ? <View style={styles.voorzieningSeparator} /> : null}
              </React.Fragment>
            );
          })}

          <View style={styles.voorzieningSeparator} />
          <View style={styles.voorzieningItem}>
            <MapPinIcon size={18} color={COLORS.brand} weight="regular" />
            <Text style={styles.voorzieningLabel}>2,5km</Text>
          </View>
        </View>

        <View style={styles.motivationSection}>
          <Text style={styles.sectionLabel}>Motivatie:</Text>
          <Text style={styles.motivationText}>{aanvraag?.motivation}</Text>
        </View>

        <View style={styles.typeSection}>
          <Text style={styles.sectionLabel}>Type samenwerking:</Text>
          <View style={styles.chip}>
            <Text style={styles.chipText}>{formatTypeSamenwerking(aanvraag?.type_samenwerking)}</Text>
          </View>
        </View>

        <View style={styles.availabilitySection}>
          <Text style={styles.sectionLabel}>Beschikbaarheid:</Text>
          <View style={styles.daysRow}>
            {DAGEN.map((dag) => {
              const isSelected = selectedDays.includes(dag.key);
              return (
                <View
                  key={dag.key}
                  style={[styles.dayCircle, isSelected ? styles.dayCircleSelected : styles.dayCircleUnselected]}
                  accessible
                  accessibilityRole="text"
                  accessibilityLabel={`${dag.fullLabel}, ${isSelected ? 'geselecteerd' : 'niet geselecteerd'}`}
                >
                  <Text style={[styles.dayText, isSelected ? styles.dayTextSelected : styles.dayTextUnselected]}>{dag.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.startDateSection}>
          <Text style={styles.sectionLabel}>Gewenste start datum:</Text>
          <View style={styles.dateRow}>
            <View style={styles.dateBox}><Text style={styles.dateText}>{startDateParts.dd}</Text></View>
            <View style={styles.dateBox}><Text style={styles.dateText}>{startDateParts.mm}</Text></View>
            <View style={styles.dateBox}><Text style={styles.dateText}>{startDateParts.yyyy}</Text></View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.actionBar, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          style={[styles.buttonBase, styles.primaryButton, isProcessing && processingAction === 'accept' && styles.buttonDisabled]}
          onPress={handleAccept}
          disabled={isProcessing}
          accessibilityRole="button"
          accessibilityLabel="Aanvraag accepteren"
          accessibilityState={{ disabled: isProcessing }}
        >
          {isProcessing && processingAction === 'accept' ? (
            <ActivityIndicator color={COLORS.surface} />
          ) : (
            <Text style={styles.primaryButtonText}>Accepteer verzoek</Text>
          )}
        </Pressable>

        <Pressable
          style={[styles.buttonBase, styles.secondaryButton, isProcessing && processingAction === 'decline' && styles.buttonDisabled]}
          onPress={handleDecline}
          disabled={isProcessing}
          accessibilityRole="button"
          accessibilityLabel="Aanvraag weigeren"
          accessibilityState={{ disabled: isProcessing }}
        >
          {isProcessing && processingAction === 'decline' ? (
            <ActivityIndicator color={COLORS.brand} />
          ) : (
            <Text style={styles.secondaryButtonText}>Weiger verzoek</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerSafeArea: { backgroundColor: COLORS.brand },
  header: { backgroundColor: COLORS.brand, paddingHorizontal: SPACING.screenX, paddingVertical: 12, minHeight: 56, justifyContent: 'center', alignItems: 'center', flexDirection: 'row' },
  backButton: { position: 'absolute', left: SPACING.screenX, flexDirection: 'row', alignItems: 'center', gap: 6 },
  backLabel: { color: COLORS.surface, fontFamily: FONTS.bodyMedium, fontSize: 14 },
  headerTitle: { color: COLORS.surface, fontFamily: FONTS.displaySemiBold, fontSize: 20 },
  headerRightSpacer: { width: 52 },
  scrollView: { flex: 1, backgroundColor: COLORS.surface },
  scrollContent: { paddingBottom: 24 },
  senderSection: { paddingHorizontal: SPACING.screenX, paddingVertical: 16, flexDirection: 'row', alignItems: 'center' },
  senderTextWrap: { flex: 1, marginLeft: 12 },
  senderNameRow: { flexDirection: 'row', alignItems: 'center' },
  senderName: { fontFamily: FONTS.bodySemiBold, fontSize: 17, color: COLORS.textPrimary },
  sealIcon: { marginLeft: 4 },
  senderMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  senderMetaText: { color: COLORS.textMuted, fontFamily: FONTS.body, fontSize: 13 },
  senderRatingWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  senderRatingText: { fontFamily: FONTS.bodyMedium, fontSize: 13, color: COLORS.textPrimary },
  photoSection: { marginHorizontal: SPACING.screenX, marginTop: 8, position: 'relative' },
  photo: { width: '100%', height: 200, borderRadius: 16 },
  photoPlaceholder: { width: '100%', height: 200, borderRadius: 16, backgroundColor: COLORS.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  photoPlaceholderText: { color: COLORS.textMuted, fontFamily: FONTS.body, fontSize: 14 },
  photoBadgeLeft: { position: 'absolute', left: 12, bottom: 12, backgroundColor: COLORS.surface, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  photoBadgeRight: { position: 'absolute', right: 12, bottom: 12, backgroundColor: COLORS.surface, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  photoBadgeText: { fontFamily: FONTS.bodyMedium, fontSize: 13, color: COLORS.textPrimary },
  voorzieningenRow: { marginHorizontal: SPACING.screenX, marginTop: 16, paddingVertical: 14, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#E5E5E5', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  voorzieningItem: { alignItems: 'center', justifyContent: 'center', gap: 4 },
  voorzieningLabel: { fontFamily: FONTS.bodyRegular, fontSize: 13, color: COLORS.textMuted },
  voorzieningSeparator: { width: 1, height: 24, backgroundColor: COLORS.divider || '#E5E5E5' },
  motivationSection: { paddingHorizontal: SPACING.screenX, paddingTop: 12 },
  motivationText: { fontFamily: FONTS.bodyRegular, fontSize: 15, lineHeight: 22, color: COLORS.textPrimary },
  typeSection: { paddingHorizontal: SPACING.screenX, marginTop: 12 },
  availabilitySection: { paddingHorizontal: SPACING.screenX, marginTop: 20 },
  startDateSection: { paddingHorizontal: SPACING.screenX, marginTop: 20 },
  sectionLabel: { fontFamily: FONTS.bodySemiBold, fontSize: 16, color: COLORS.textPrimary, marginBottom: 12 },
  chip: { backgroundColor: COLORS.surfaceMuted, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  chipText: { fontFamily: FONTS.bodyRegular, fontSize: 15, color: COLORS.textPrimary },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  dayCircleSelected: { backgroundColor: COLORS.brand },
  dayCircleUnselected: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: COLORS.brand },
  dayText: { fontFamily: FONTS.bodySemiBold, fontSize: 13 },
  dayTextSelected: { color: COLORS.surface },
  dayTextUnselected: { color: COLORS.brand },
  dateRow: { flexDirection: 'row', gap: 8 },
  dateBox: { flex: 1, backgroundColor: COLORS.surfaceMuted, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  dateText: { fontFamily: FONTS.bodySemiBold, fontSize: 17, color: COLORS.textPrimary },
  actionBar: { paddingHorizontal: SPACING.screenX, paddingTop: 16, backgroundColor: COLORS.background, borderTopWidth: 1, borderTopColor: COLORS.divider || '#E5E5E5' },
  buttonBase: { height: 44, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  primaryButton: { backgroundColor: COLORS.brand, marginBottom: 12 },
  secondaryButton: { backgroundColor: 'transparent', borderWidth: 2, borderColor: COLORS.brand },
  primaryButtonText: { color: COLORS.surface, fontFamily: FONTS.bodySemiBold, fontSize: 16 },
  secondaryButtonText: { color: COLORS.brand, fontFamily: FONTS.bodySemiBold, fontSize: 16 },
  buttonDisabled: { opacity: 0.8 },
});