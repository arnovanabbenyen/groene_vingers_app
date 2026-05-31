import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT_SIZES, FONTS, SPACING } from '../theme/tokens';

export default function SectionHeader({ icon: Icon, iconSize = 28, title, action }) {
  if (action) {
    return (
      <View style={styles.row}>
        <View style={styles.left}>
          <Icon size={iconSize} color={COLORS.accent} weight="regular" />
          <Text style={styles.title} numberOfLines={2}>{title}</Text>
        </View>
        <View style={styles.actionWrap}>{action}</View>
      </View>
    );
  }

  return (
    <View style={styles.inline}>
      <Icon size={iconSize} color={COLORS.accent} weight="regular" />
      <Text style={styles.title} numberOfLines={2}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  actionWrap: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.xl,
    color: COLORS.textPrimary,
    flexShrink: 1,
  },
});
