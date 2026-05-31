import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LockSimpleIcon } from 'phosphor-react-native';
import Header from '../../components/navigation/Header';
import UpgradeCard from '../../components/plans/UpgradeCard';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SPACING } from '../../components/theme/tokens';

export default function GeenToegangScreen({ onBack, onUpgrade }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <Header title="Aanvraag sturen" onBack={onBack} backLabel="Terug" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(SPACING.xl, insets.bottom + SPACING.lg) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={styles.lockCircle}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <LockSimpleIcon size={32} color={COLORS.negative} weight="regular" />
        </View>

        <Text style={styles.title} accessibilityRole="header">
          Geen toegang
        </Text>

        <Text style={styles.subtitle}>
          Upgrade naar het Pro plan en ontgrendel alle functies.
        </Text>

        <UpgradeCard onPress={onUpgrade} />

        <Pressable
          style={({ pressed }) => [styles.laterButton, pressed && styles.laterButtonPressed]}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Misschien later"
          accessibilityHint="Sluit dit scherm en ga terug"
        >
          <Text style={styles.laterButtonText}>Misschien later</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.screenX,
    paddingTop: SPACING.xl + SPACING.lg,
    alignItems: 'center',
    gap: SPACING.lg,
  },
  lockCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.negativeSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.xxxl,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
  },
  laterButton: {
    width: '100%',
    height: 44,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    borderColor: COLORS.brand,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  laterButtonPressed: {
    opacity: 0.7,
  },
  laterButtonText: {
    fontFamily: FONTS.displayMedium,
    fontSize: FONT_SIZES.lg,
    color: COLORS.brand,
  },
});
