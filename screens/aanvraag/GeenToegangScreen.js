import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeftIcon, CheckCircleIcon, LockSimpleIcon } from 'phosphor-react-native';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SPACING } from '../../components/theme/tokens';

export default function GeenToegangScreen({ onBack, onUpgrade }) {
  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.backButton} hitSlop={8} accessibilityRole="button">
            <ArrowLeftIcon size={24} color={COLORS.textInverse} weight="regular" />
            <Text style={styles.backText}>Terug</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Aanvraag sturen</Text>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.lockCircle}>
          <LockSimpleIcon size={32} color={COLORS.negative} weight="regular" />
        </View>

        <Text style={styles.title}>Geen toegang</Text>
        <Text style={styles.subtitle}>
          Upgrade naar het pro plan en ontgrendel alle functies.
        </Text>

        <View style={styles.proCard}>
          <Text style={styles.proHeadline}>
            Pro – €7,01/maand{' '}
            <Text style={styles.proNote}>(inclusief €1,22 btw)</Text>
          </Text>

          <View style={styles.featureList}>
            <FeatureRow text="Percelen bekijken & zoeken" />
            <FeatureRow text="Matchen met tuin eigenaar" />
            <FeatureRow text="Logboek bijhouden" />
          </View>

          <Pressable style={styles.upgradeButton} onPress={onUpgrade} accessibilityRole="button">
            <Text style={styles.upgradeButtonText}>Upgrade naar Pro</Text>
          </Pressable>
        </View>

        <Pressable style={styles.laterButton} onPress={onBack} accessibilityRole="button">
          <Text style={styles.laterButtonText}>Misschien later</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function FeatureRow({ text }) {
  return (
    <View style={styles.featureRow}>
      <CheckCircleIcon size={16} color={COLORS.accent} weight="fill" />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  headerSafe: {
    backgroundColor: COLORS.brand,
  },
  header: {
    backgroundColor: COLORS.brand,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.screenX,
    paddingVertical: SPACING.md,
    position: 'relative',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  backText: {
    fontFamily: FONTS.displayMedium,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textInverse,
  },
  headerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.xl,
    color: COLORS.textInverse,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.screenX,
    paddingBottom: SPACING.xl,
    alignItems: 'center',
  },
  lockCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FCEBEB',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    marginBottom: 24,
  },
  title: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 25,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  proCard: {
    width: '100%',
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  proHeadline: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 20,
    color: COLORS.accent,
    marginBottom: SPACING.md,
  },
  proNote: {
    fontFamily: FONTS.body,
    fontSize: 12.8,
    color: COLORS.accent,
  },
  featureList: {
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  featureText: {
    fontFamily: FONTS.body,
    fontSize: 12.8,
    color: COLORS.textInverse,
  },
  upgradeButton: {
    height: 53,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeButtonText: {
    fontFamily: FONTS.displayMedium,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
  },
  laterButton: {
    width: '100%',
    height: 53,
    borderRadius: RADIUS.xl,
    borderWidth: 2,
    borderColor: COLORS.brand,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  laterButtonText: {
    fontFamily: FONTS.displayMedium,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
  },
});
