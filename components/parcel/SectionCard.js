import { StyleSheet, View } from 'react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../theme/tokens';

export default function SectionCard({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    ...SHADOWS.card,
  },
});
