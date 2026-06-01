import React, { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  CalendarBlankIcon,
  CalendarCheckIcon,
  CaretRightIcon,
  CheckCircleIcon,
  DropIcon,
  HandshakeIcon,
  LeafIcon,
  LightningIcon,
  MapPinIcon,
  PencilSimpleIcon,
  PlantIcon,
  RecycleIcon,
  ShovelIcon,
  StarIcon,
  ToiletIcon,
  TreeIcon,
  WifiHighIcon,
} from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../services/supabase';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SPACING } from '../../components/theme/tokens';
import { RequestAvatar } from '../../components/aanvraag/AanvraagCard';
import { createConversationForAanvraag } from '../../services/conversations';
import { AANVRAAG_STATUS } from '../../services/aanvraagStatus';
import { showToast } from '../../components/common/Toast';
import Header from '../../components/navigation/Header';
import SectionCard from '../../components/parcel/SectionCard';
import SectionHeader from '../../components/parcel/SectionHeader';
import AuthButton from '../../components/buttons/AuthButton';

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
  tools: ShovelIcon,
  zaden: PlantIcon,
  compost: RecycleIcon,
  bomen: TreeIcon,
  // legacy keys
  gereedschap: ShovelIcon,
  materiaal: ShovelIcon,
  elektriciteit: LightningIcon,
  wifi: WifiHighIcon,
  toilet: ToiletIcon,
};

const warnedVoorzieningen = new Set();

function capitalizeFirstLetter(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
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

function parseStartDate(value) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export default function AanvraagDetailScreen({ aanvraag, onBack, onActionComplete, onViewProfile }) {
  const insets = useSafeAreaInsets();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingAction, setProcessingAction] = useState(null);

  const sender = aanvraag?.sender || null;
  const perceel = aanvraag?.perceel || null;
  const senderName = [sender?.first_name, sender?.last_name].filter(Boolean).join(' ').trim() || 'Aanvrager';
  const perceelPlace = perceel?.plaats || '';
  const selectedDays = useMemo(
    () => (aanvraag?.availability || []).map((day) => String(day).toLowerCase()),
    [aanvraag?.availability],
  );
  const startDate = parseStartDate(aanvraag?.start_date);
  const startDateParts = startDate
    ? {
        dag: String(startDate.getDate()).padStart(2, '0'),
        maand: startDate.toLocaleDateString('nl-BE', { month: 'long' }),
        jaar: String(startDate.getFullYear()),
      }
    : { dag: '--', maand: '--', jaar: '----' };
  const perceelPhoto = Array.isArray(perceel?.fotos) ? perceel.fotos[0] : null;
  const voorzieningen = perceel?.voorzieningen || [];

  async function handleAccept() {
    setIsProcessing(true);
    setProcessingAction('accept');
    try {
      const { error } = await supabase
        .from('aanvragen')
        .update({ status: AANVRAAG_STATUS.ACCEPTED, updated_at: new Date().toISOString() })
        .eq('id', aanvraag.id);
      if (error) throw error;

      if (aanvraag?.id && aanvraag?.sender_id) {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (!userError) {
          const { error: conversationError } = await createConversationForAanvraag({
            aanvraagId: aanvraag.id,
            ownerId: userData?.user?.id,
            senderId: aanvraag.sender_id,
          });
          if (conversationError) console.warn('Failed to create conversation for accepted aanvraag', conversationError);
        }
      }

      setIsProcessing(false);
      setProcessingAction(null);
      showToast('Aanvraag geaccepteerd', 'success');
      onActionComplete?.();
      onBack?.();
    } catch {
      setIsProcessing(false);
      setProcessingAction(null);
      showToast('Aanvraag kon niet worden geaccepteerd. Probeer opnieuw.', 'error');
    }
  }

  async function handleDecline() {
    setIsProcessing(true);
    setProcessingAction('decline');
    try {
      const { error } = await supabase
        .from('aanvragen')
        .update({ status: AANVRAAG_STATUS.DECLINED, updated_at: new Date().toISOString() })
        .eq('id', aanvraag.id);
      if (error) throw error;

      setIsProcessing(false);
      setProcessingAction(null);
      showToast('Aanvraag geweigerd', 'info');
      onActionComplete?.();
      onBack?.();
    } catch {
      setIsProcessing(false);
      setProcessingAction(null);
      showToast('Aanvraag kon niet worden geweigerd. Probeer opnieuw.', 'error');
    }
  }

  return (
    <View style={styles.screen}>
      <Header title="Aanvraag" onBack={onBack} backLabel="Terug" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <SectionCard>
          <Pressable
            style={({ pressed }) => [styles.senderRow, pressed && styles.senderRowPressed]}
            onPress={() => onViewProfile?.(sender?.id)}
            accessibilityRole="button"
            accessibilityLabel={`Bekijk profiel van ${senderName}`}
            accessibilityHint="Open het profiel van de aanvrager"
          >
            <RequestAvatar sender={sender} />
            <View style={styles.senderInfo}>
              <View style={styles.senderNameRow}>
                <Text style={styles.senderName}>{senderName}</Text>
              </View>
              {perceelPlace ? (
                <View style={styles.senderMeta}>
                  <MapPinIcon size={14} color={COLORS.textMuted} weight="regular" accessibilityElementsHidden />
                  <Text style={styles.senderMetaText}>{perceelPlace}</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.ratingPill}>
              <StarIcon size={16} color={COLORS.accent} weight="fill" accessibilityElementsHidden />
              <Text style={styles.ratingText}>{sender?.rating ?? 'Nieuw'}</Text>
            </View>
            <CaretRightIcon size={18} color={COLORS.textMuted} weight="regular" accessibilityElementsHidden />
          </Pressable>
        </SectionCard>

        <SectionCard>
          <SectionHeader icon={MapPinIcon} title={perceel?.naam || 'Perceel'} />
          {perceelPhoto ? (
            <Image
              source={{ uri: perceelPhoto }}
              style={styles.photo}
              resizeMode="cover"
              accessibilityLabel={`Foto van ${perceel?.naam || 'het perceel'}`}
            />
          ) : (
            <View style={styles.photoPlaceholder} accessibilityRole="image" accessibilityLabel="Geen foto beschikbaar">
              <LeafIcon size={40} color={COLORS.textMuted} weight="regular" />
            </View>
          )}
          {voorzieningen.length > 0 ? (
            <View style={styles.voorzieningenRow}>
              {voorzieningen.map((voorziening, index) => {
                const Icon = getVoorzieningIcon(voorziening);
                return (
                  <React.Fragment key={`${voorziening}-${index}`}>
                    <View style={styles.voorzieningItem}>
                      <Icon size={18} color={COLORS.brand} weight="regular" accessibilityElementsHidden />
                      <Text style={styles.voorzieningLabel}>{capitalizeFirstLetter(voorziening)}</Text>
                    </View>
                    {index < voorzieningen.length - 1 ? <View style={styles.voorzieningSeparator} /> : null}
                  </React.Fragment>
                );
              })}
            </View>
          ) : null}
        </SectionCard>

        <SectionCard>
          <SectionHeader icon={PencilSimpleIcon} title="Motivatie" />
          <Text style={styles.bodyText}>{aanvraag?.motivation}</Text>
        </SectionCard>

        {aanvraag?.type_samenwerking ? (
          <SectionCard>
            <SectionHeader icon={HandshakeIcon} title="Type samenwerking" />
            <View style={styles.typePill}>
              <Text style={styles.typePillText}>{capitalizeFirstLetter(aanvraag.type_samenwerking)}</Text>
            </View>
          </SectionCard>
        ) : null}

        <SectionCard>
          <SectionHeader icon={CalendarBlankIcon} title="Beschikbaarheid" />
          <View
            style={styles.daysRow}
            accessibilityRole="group"
            accessibilityLabel="Beschikbare dagen van de aanvrager"
          >
            {DAGEN.map((dag) => {
              const isSelected = selectedDays.includes(dag.key);
              return (
                <View
                  key={dag.key}
                  style={[styles.dayChip, isSelected && styles.dayChipSelected]}
                  accessible
                  accessibilityRole="text"
                  accessibilityLabel={`${dag.fullLabel}, ${isSelected ? 'beschikbaar' : 'niet beschikbaar'}`}
                >
                  <Text style={[styles.dayChipText, isSelected && styles.dayChipTextSelected]}>
                    {dag.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </SectionCard>

        <SectionCard>
          <SectionHeader icon={CalendarCheckIcon} title="Gewenste startdatum" />
          <View
            style={styles.dateRow}
            accessibilityRole="group"
            accessibilityLabel={`Gewenste startdatum: ${startDateParts.dag} ${startDateParts.maand} ${startDateParts.jaar}`}
          >
            {[
              { label: 'Dag', value: startDateParts.dag },
              { label: 'Maand', value: startDateParts.maand },
              { label: 'Jaar', value: startDateParts.jaar },
            ].map((block) => (
              <View key={block.label} style={styles.dateBlock}>
                <Text style={styles.dateBlockLabel}>{block.label}</Text>
                <Text style={styles.dateBlockValue} adjustsFontSizeToFit numberOfLines={1}>
                  {block.value}
                </Text>
              </View>
            ))}
          </View>
        </SectionCard>
      </ScrollView>

      <View style={[styles.actionBar, { paddingBottom: insets.bottom + SPACING.md }]}>
        <AuthButton
          label="Accepteer verzoek"
          onPress={handleAccept}
          variant="primary"
          loading={isProcessing && processingAction === 'accept'}
          disabled={isProcessing}
          accessibilityLabel="Accepteer aanvraag"
          accessibilityHint="Accepteer de aanvraag van de tuinzoeker"
        />
        <AuthButton
          label="Weiger verzoek"
          onPress={handleDecline}
          variant="secondary"
          loading={isProcessing && processingAction === 'decline'}
          disabled={isProcessing}
          accessibilityLabel="Weiger aanvraag"
          accessibilityHint="Weiger de aanvraag van de tuinzoeker"
        />
      </View>
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
    paddingBottom: SPACING.xl,
    gap: SPACING.lg,
  },
  senderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  senderRowPressed: {
    opacity: 0.7,
  },
  senderInfo: {
    flex: 1,
    gap: SPACING.xs,
  },
  senderNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  senderName: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
  },
  senderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  senderMetaText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  ratingText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
  },
  photo: {
    width: '100%',
    height: 180,
    borderRadius: RADIUS.sm,
  },
  photoPlaceholder: {
    width: '100%',
    height: 180,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voorzieningenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: SPACING.md,
    marginTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.dividerSoft,
  },
  voorzieningItem: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  voorzieningLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  voorzieningSeparator: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.dividerSoft,
  },
  bodyText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    lineHeight: 22,
    color: COLORS.textPrimary,
  },
  typePill: {
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.sm,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  typePillText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  daysRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  dayChip: {
    flex: 1,
    minHeight: 44,
    borderRadius: RADIUS.pill,
    borderWidth: 1.5,
    borderColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipSelected: {
    backgroundColor: COLORS.brand,
  },
  dayChipText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.brand,
  },
  dayChipTextSelected: {
    color: COLORS.textInverse,
  },
  dateRow: {
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
  actionBar: {
    paddingHorizontal: SPACING.screenX,
    paddingTop: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.dividerSoft,
    gap: SPACING.sm,
  },
});
