import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeftIcon } from 'phosphor-react-native';
import { COLORS, FONT_SIZES, FONTS, SPACING } from '../theme/tokens';

export default function Header({ title, onBack, backLabel = 'Terug', rightElement, contentStyle }) {
  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={[styles.header, contentStyle]}>
        {onBack ? (
          <Pressable
            style={styles.back}
            onPress={onBack}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={backLabel}
          >
            <ArrowLeftIcon size={20} color={COLORS.textInverse} weight="regular" accessibilityElementsHidden />
            <Text style={styles.backText}>{backLabel}</Text>
          </Pressable>
        ) : (
          <View style={styles.spacer} />
        )}
        <Text style={styles.title} accessibilityRole="header">{title}</Text>
        {rightElement ?? <View style={styles.spacer} />}
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
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.md,
    color: COLORS.textInverse,
  },
  title: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.xl,
    color: COLORS.textInverse,
  },
  spacer: {
    width: 60,
  },
});
