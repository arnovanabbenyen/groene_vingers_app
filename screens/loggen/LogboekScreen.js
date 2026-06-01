import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { NotebookIcon, MagnifyingGlassIcon } from 'phosphor-react-native';
import BottomNav from '../../components/navigation/BottomNav';
import EmptyState from '../../components/common/EmptyState';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SHADOWS, SIZES, SPACING } from '../../components/theme/tokens';

export default function LogboekScreen({
  onTabPress,
  profileImageSource,
  badgeCounts = {},
  onNavigateToKaart,
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <Text style={styles.headerTitle} accessibilityRole="header">
            Logboek
          </Text>
        </View>
      </SafeAreaView>

      <View style={styles.body}>
        <EmptyState
          icon={NotebookIcon}
          title="Hier groeit binnenkort iets moois"
          body="Zodra je een samenwerking hebt met een tuineigenaar, kun je hier je bezoeken, observaties en taken bijhouden."
        />
      </View>

      <View style={[styles.actionBar, { paddingBottom: Math.max(insets.bottom, SPACING.md) + SPACING.md }]}>
        <Pressable
          style={({ pressed }) => [styles.ctaBtn, pressed && styles.ctaBtnPressed]}
          onPress={onNavigateToKaart}
          accessibilityRole="button"
          accessibilityLabel="Open de kaart om een perceel te zoeken"
          accessibilityHint="Navigeert naar de kaartweergave"
        >
          <View style={styles.ctaInner}>
            <MagnifyingGlassIcon size={18} color={COLORS.textInverse} weight="regular" />
            <Text style={styles.ctaLabel}>Zoek een perceel op de kaart</Text>
          </View>
        </Pressable>
      </View>

      <BottomNav
        activeKey="loggen"
        onTabPress={onTabPress}
        profileImageSource={profileImageSource}
        badgeCounts={badgeCounts}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerSafe: {
    backgroundColor: COLORS.brand,
  },
  header: {
    backgroundColor: COLORS.brand,
    paddingHorizontal: SPACING.screenX,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.xl,
    color: COLORS.textInverse,
    textAlign: 'center',
  },
  body: {
    flex: 1,
  },
  actionBar: {
    paddingHorizontal: SPACING.screenX,
    paddingTop: SPACING.md,
    backgroundColor: COLORS.background,
  },
  ctaBtn: {
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.sm,
    height: SIZES.iconBtn,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.card,
  },
  ctaBtnPressed: { opacity: 0.85 },
  ctaLabel: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textInverse,
  },
  ctaInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
});
