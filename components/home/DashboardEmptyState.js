import { StyleSheet, View } from 'react-native';
import EmptyState from '../common/EmptyState';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../theme/tokens';

export default function DashboardEmptyState({
  icon,
  iconColor = COLORS.brand,
  iconBgColor = COLORS.surfaceBrand,
  title,
  body,
  style,
}) {
  return (
    <View style={[styles.card, style]}>
      <EmptyState
        compact
        icon={icon}
        iconSize={36}
        iconColor={iconColor}
        iconBgColor={iconBgColor}
        title={title}
        body={body}
        style={styles.inner}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(54, 57, 43, 0.08)',
    padding: SPACING.lg,
    ...SHADOWS.card,
  },
  inner: {
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
    gap: SPACING.xs,
  },
});
