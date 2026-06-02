import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT_SIZES, FONTS, SPACING } from '../theme/tokens';

export default function DashboardSection({
  title,
  action,
  children,
  style,
  contentStyle,
}) {
  return (
    <View style={[styles.section, style]}>
      <View style={styles.headerRow}>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        {action ? <View style={styles.actionWrap}>{action}</View> : null}
      </View>

      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  actionWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.xl,
    color: COLORS.textPrimary,
  },
  content: {
    gap: SPACING.xs,
  },
});
