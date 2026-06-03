import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONTS, FONT_SIZES, RADIUS, SPACING } from '../theme/tokens';
import { getAanvraagStatusMeta, isActiveAanvraagStatus } from '../../services/aanvraagStatus';

const TONE_STYLES = {
  pending: {
    backgroundColor: 'rgba(255,217,94,0.92)',
    textColor: COLORS.textPrimary,
    borderColor: 'rgba(255,217,94,0.92)',
  },
  accepted: {
    backgroundColor: COLORS.surfaceBrand,
    textColor: COLORS.brand,
    borderColor: COLORS.surfaceBrand,
  },
  confirmed: {
    backgroundColor: COLORS.brand,
    textColor: COLORS.surface,
    borderColor: COLORS.brand,
  },
};

export default function RequestStatusBadge({ status, style, textStyle, accessibilityLabel }) {
  if (!isActiveAanvraagStatus(status)) {
    return null;
  }

  const meta = getAanvraagStatusMeta(status);
  if (!meta) return null;

  const toneStyle = TONE_STYLES[meta.tone] || TONE_STYLES.pending;

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: toneStyle.backgroundColor, borderColor: toneStyle.borderColor },
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel || meta.accessibleLabel}
    >
      <Text style={[styles.text, { color: toneStyle.textColor }, textStyle]}>{meta.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
  },
  text: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.sm,
    lineHeight: 16,
  },
});