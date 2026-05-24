// TODO: implement full logbook feature with DB schema
// (logbook_entries table referencing perceel_id + sender_id),
// CRUD operations, list view of entries, and per-entry form.
// For MVP, only the empty state exists.

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NotebookIcon } from 'phosphor-react-native';
import { COLORS, FONTS, RADIUS, SIZES, SPACING } from '../../components/theme/tokens';
import BottomNav from '../../components/navigation/BottomNav';

export default function LogboekScreen({
  onTabPress,
  profileImageSource,
  badgeCounts = {},
  onNavigateToHome,
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <Text style={styles.headerTitle} accessibilityRole="header">Logboek</Text>
        </View>
      </SafeAreaView>

      <View style={styles.body}>
        {/* Centered empty state */}
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <NotebookIcon size={32} color={COLORS.brand} weight="regular" />
          </View>
          <Text style={styles.emptyTitle}>Hier groeit binnenkort iets moois</Text>
          <Text style={styles.emptySubtext}>
            Documenteer je eerste perceelbezoek. Je kunt taken, observaties en opvolgingen bijhouden.
          </Text>
        </View>

        {/* CTA anchored above BottomNav */}
        <View style={[styles.actionContainer, { paddingBottom: Math.max(insets.bottom, 16) + 24 }]}>
          <Pressable
            style={styles.actionButton}
            onPress={onNavigateToHome}
            accessibilityRole="button"
            accessibilityLabel="Zoek een perceel"
          >
            <Text style={styles.actionText}>Zoek een perceel</Text>
          </Pressable>
        </View>
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
    backgroundColor: COLORS.surface,
  },
  headerSafe: {
    backgroundColor: COLORS.brand,
  },
  header: {
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    paddingHorizontal: SPACING.screenX,
    paddingVertical: SPACING.md,
  },
  headerTitle: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 20,
    color: COLORS.textInverse,
  },
  body: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.screenX,
    gap: 12,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surfaceBrand,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 20,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  emptySubtext: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  actionContainer: {
    paddingHorizontal: SPACING.screenX,
  },
  actionButton: {
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.sm,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontFamily: FONTS.displayMedium,
    fontSize: 16,
    color: COLORS.surface,
  },
});
