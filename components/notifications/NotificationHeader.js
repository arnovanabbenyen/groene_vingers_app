import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowLeftIcon } from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING } from '../theme/tokens';

export default function NotificationHeader({ title = 'Meldingen', onBack }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: Math.max(16, insets.top) }]}>
      <View style={styles.headerContent}>
        <Pressable
          style={styles.backButton}
          onPress={onBack}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Terug"
          accessibilityHint="Ga terug naar het vorige scherm"
        >
          <ArrowLeftIcon size={24} color={COLORS.textInverse} weight="regular" />
          <Text style={styles.backText} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            Terug
          </Text>
        </Pressable>

        <Text style={styles.headerTitle}>{title}</Text>

        <View style={styles.headerSpacer} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.brand,
  },
  headerContent: {
    paddingHorizontal: SPACING.screenX,
    marginTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  backText: {
    color: COLORS.textInverse,
    fontSize: 16,
    lineHeight: 16,
    fontFamily: FONTS.displayMedium,
    fontWeight: '500',
  },
  headerTitle: {
    color: COLORS.textInverse,
    fontSize: 20,
    lineHeight: 20,
    fontFamily: FONTS.displaySemiBold,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  headerSpacer: {
    width: 96,
  },
});
