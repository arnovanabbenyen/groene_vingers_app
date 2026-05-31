import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowLeftIcon } from 'phosphor-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONT_SIZES, FONTS, SPACING } from '../theme/tokens';

export default function ParcelDetailHeader({ title = 'Perceel', onBack }) {
  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.header}>
        <Pressable
          style={styles.back}
          onPress={onBack}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Terug"
        >
          <ArrowLeftIcon size={20} color={COLORS.textInverse} weight="regular" accessibilityElementsHidden />
          <Text style={styles.backText}>Terug</Text>
        </Pressable>

        <Text style={styles.title} accessibilityRole="header">{title}</Text>

        <View style={styles.spacer} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: COLORS.brand,
  },
  header: {
    backgroundColor: COLORS.brand,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.screenX,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  backText: {
    color: COLORS.textInverse,
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.md,
    lineHeight: 20,
  },
  title: {
    color: COLORS.textInverse,
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.xl,
    lineHeight: 24,
  },
  spacer: {
    width: 60,
  },
});
