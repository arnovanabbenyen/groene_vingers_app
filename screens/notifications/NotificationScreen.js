import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '../../components/headers/ScreenHeader';
import NotificationEmptyState from '../../components/notifications/NotificationEmptyState';
import { COLORS, FONTS, RADIUS, SPACING } from '../../components/theme/tokens';

export default function NotificationScreen({ onBack, onPrimaryAction }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Meldingen" onBack={onBack} />

      <View style={styles.contentContainer}>
        <NotificationEmptyState />
      </View>

      <Pressable
        style={[styles.primaryButton, { bottom: Math.max(40, insets.bottom + 20) }]}
        onPress={onPrimaryAction}
      >
        <Text style={styles.primaryButtonText}>Zoek een perceel</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: SPACING.screenX,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    position: 'absolute',
    left: SPACING.screenX,
    right: SPACING.screenX,
    height: 41,
    borderRadius: RADIUS.xs,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    lineHeight: 16,
    fontFamily: FONTS.displayMedium,
    fontWeight: '500',
  },
});
