import { StyleSheet } from 'react-native';
import EmptyState from '../common/EmptyState';
import { COLORS, SPACING } from '../theme/tokens';

export default function DashboardEmptyState({
  icon,
  iconColor = COLORS.brand,
  iconBgColor = COLORS.surfaceBrand,
  title,
  body,
  style,
}) {
  return (
    <EmptyState
      compact
      icon={icon}
      iconSize={36}
      iconColor={iconColor}
      iconBgColor={iconBgColor}
      title={title}
      body={body}
      style={[styles.emptyState, style]}
    />
  );
}

const styles = StyleSheet.create({
  emptyState: {
    paddingHorizontal: 0,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
    alignItems: 'center',
  },
});
